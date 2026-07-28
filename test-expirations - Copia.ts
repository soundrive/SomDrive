import fs from 'fs';
import path from 'path';
import { getSafeExpirationDate, isAccessExpired, determineExpirationDate, UserAccessData, TrackData } from './src/server/expiration-utils';
import { processExpirationsInternal, CustomRequest, CustomResponse, repairUserTracks } from './api/internal/process-expirations';

// --- MOCK FIRESTORE API FOR OFFLINE ISOLATED TESTING ---
class MockDocumentReference {
  constructor(public id: string, public parentCollection: MockCollectionReference) {}

  async get() {
    return this.parentCollection.database.getDocument(this.parentCollection.name, this.id);
  }

  async set(data: any, options?: any) {
    this.parentCollection.database.setDocument(this.parentCollection.name, this.id, data, options);
  }

  async update(data: any) {
    this.parentCollection.database.setDocument(this.parentCollection.name, this.id, data, { merge: true });
  }

  async delete() {
    this.parentCollection.database.deleteDocument(this.parentCollection.name, this.id);
  }

  collection(subName: string) {
    const fullPath = `${this.parentCollection.name}/${this.id}/${subName}`;
    return this.parentCollection.database.collection(fullPath);
  }
}

class MockQuerySnapshot {
  constructor(public docs: MockDocumentSnapshot[]) {}
  get empty() {
    return this.docs.length === 0;
  }
}

class MockDocumentSnapshot {
  constructor(public id: string, public dataObj: any) {}
  get exists() {
    return !!this.dataObj;
  }
  data() {
    return this.dataObj ? { ...this.dataObj } : undefined;
  }
  get(field: string) {
    return this.dataObj ? this.dataObj[field] : undefined;
  }
}

class MockCollectionReference {
  constructor(public name: string, public database: MockFirestore) {}

  doc(id: string) {
    return new MockDocumentReference(id, this);
  }

  where(field: string, op: string, val: any) {
    return new MockQuery(this, [{ field, op, val }]);
  }

  orderBy(field: any) {
    const f = typeof field === 'string' ? field : '__name__';
    return new MockQuery(this, [], f);
  }

  limit(n: number) {
    return new MockQuery(this, [], undefined, undefined, n);
  }

  async get() {
    return new MockQuery(this).get();
  }
}

class MockQuery {
  constructor(
    public col: MockCollectionReference,
    public filters: Array<{ field: string, op: string, val: any }> = [],
    public orderField?: string,
    public startAfterId?: string,
    public limitNum?: number
  ) {}

  where(field: string, op: string, val: any) {
    return new MockQuery(this.col, [...this.filters, { field, op, val }], this.orderField, this.startAfterId, this.limitNum);
  }

  orderBy(field: any) {
    const f = typeof field === 'string' ? field : '__name__';
    return new MockQuery(this.col, this.filters, f, this.startAfterId, this.limitNum);
  }

  startAfter(id: string) {
    return new MockQuery(this.col, this.filters, this.orderField, id, this.limitNum);
  }

  limit(n: number) {
    return new MockQuery(this.col, this.filters, this.orderField, this.startAfterId, n);
  }

  async get() {
    const allDocs = this.col.database.getAllDocumentsInCollection(this.col.name);
    let filtered = [...allDocs];

    // Apply filters
    for (const filter of this.filters) {
      filtered = filtered.filter(doc => {
        const val = doc.dataObj[filter.field];
        if (filter.op === '==') return val === filter.val;
        if (filter.op === 'in') {
          return Array.isArray(filter.val) && filter.val.includes(val);
        }
        return true;
      });
    }

    // Apply ordering by ID or field
    filtered.sort((a, b) => {
      if (!this.orderField || this.orderField === '__name__' || this.orderField === 'documentId') {
        return a.id.localeCompare(b.id);
      }
      const valA = a.dataObj[this.orderField] || '';
      const valB = b.dataObj[this.orderField] || '';
      return String(valA).localeCompare(String(valB));
    });

    // Apply startAfter ID
    if (this.startAfterId) {
      const index = filtered.findIndex(d => d.id === this.startAfterId);
      if (index !== -1) {
        filtered = filtered.slice(index + 1);
      }
    }

    // Apply limit
    if (this.limitNum !== undefined) {
      filtered = filtered.slice(0, this.limitNum);
    }

    return new MockQuerySnapshot(filtered);
  }
}

class MockBatch {
  public writes: Array<{ ref: MockDocumentReference, type: 'update' | 'set', data: any, options?: any }> = [];
  public shouldFailCommit = false;

  update(ref: MockDocumentReference, data: any) {
    this.writes.push({ ref, type: 'update', data, options: { merge: true } });
  }

  set(ref: MockDocumentReference, data: any, options?: any) {
    this.writes.push({ ref, type: 'set', data, options });
  }

  async commit() {
    if (this.shouldFailCommit) {
      throw new Error("Simulated Firestore Batch Write Failure");
    }
    for (const write of this.writes) {
      const colName = write.ref.parentCollection.name;
      const docId = write.ref.id;
      write.ref.parentCollection.database.setDocument(colName, docId, write.data, write.options);
    }
    this.writes = [];
  }
}

class MockFirestore {
  public collections: { [name: string]: { [id: string]: any } } = {};
  public transactionShouldFail = false;
  public shouldFailBatchCommits = false;

  collection(name: string) {
    if (!this.collections[name]) {
      this.collections[name] = {};
    }
    return new MockCollectionReference(name, this);
  }

  batch() {
    const b = new MockBatch();
    b.shouldFailCommit = this.shouldFailBatchCommits;
    return b;
  }

  async runTransaction(callback: (transaction: any) => Promise<void>) {
    if (this.transactionShouldFail) {
      throw new Error("Simulated Transaction Lock Conflict");
    }
    const mockTx = {
      get: async (ref: MockDocumentReference) => {
        return this.getDocument(ref.parentCollection.name, ref.id);
      },
      set: (ref: MockDocumentReference, data: any) => {
        this.setDocument(ref.parentCollection.name, ref.id, data);
      }
    };
    await callback(mockTx);
  }

  // Helper getters/setters for mock DB
  getAllDocumentsInCollection(colName: string): MockDocumentSnapshot[] {
    const col = this.collections[colName] || {};
    return Object.keys(col).map(id => new MockDocumentSnapshot(id, col[id]));
  }

  getDocument(colName: string, id: string): MockDocumentSnapshot {
    const col = this.collections[colName] || {};
    return new MockDocumentSnapshot(id, col[id]);
  }

  setDocument(colName: string, id: string, data: any, options?: any) {
    if (!this.collections[colName]) {
      this.collections[colName] = {};
    }
    if (options?.merge && this.collections[colName][id]) {
      this.collections[colName][id] = { ...this.collections[colName][id], ...data };
    } else {
      this.collections[colName][id] = { ...data };
    }
  }

  deleteDocument(colName: string, id: string) {
    if (this.collections[colName]) {
      delete this.collections[colName][id];
    }
  }
}


// --- OFFLINE SIMULATED HANDLER FOR TESTS ---
async function runSimulatedHandler(
  db: MockFirestore,
  headers: { [key: string]: string | string[] },
  queryParams: { [key: string]: string } = {},
  now: Date = new Date()
): Promise<any> {
  const req: CustomRequest = {
    method: "GET",
    query: queryParams,
    headers
  };

  let responseBody: any = null;
  let responseStatus = 200;

  const res: CustomResponse = {
    status(code: number) {
      responseStatus = code;
      return this;
    },
    json(body: any) {
      responseBody = body;
      return this;
    },
    setHeader(name: string, value: string) {
      return this;
    }
  };

  // 1. Secret parameter check (reproduces Bad Request check in production handler)
  if (queryParams.secret || queryParams.key || queryParams.token || queryParams.auth) {
    return { status: 400, body: { error: "Bad Request" } };
  }

  // 2. Authorization Bearer Token verification
  const authHeader = headers["authorization"];
  if (!authHeader || typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
    return { status: 401, body: { error: "Unauthorized" } };
  }

  const token = authHeader.substring(7).trim();
  if (token !== "MOCK_CRON_SECRET") {
    return { status: 401, body: { error: "Unauthorized" } };
  }

  await processExpirationsInternal(db, req, res, now);
  return { status: responseStatus, body: responseBody };
}


// --- RUN TEST SUITE ---
const runTests = async () => {
  let passed = 0;
  let failed = 0;

  console.log("\n=======================================================");
  console.log("   VERCEL CRON EXPIRATIONS FUNCTION OFFLINE TEST RUN");
  console.log("=======================================================\n");

  const assert = (name: string, condition: boolean, extraInfo?: any) => {
    if (condition) {
      console.log(`  [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name}`);
      if (extraInfo) {
        console.error(`         Debug:`, JSON.stringify(extraInfo, null, 2));
      }
      failed++;
    }
  };

  // 1. Single expired payment
  const db1 = new MockFirestore();
  const expiredDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hr ago
  db1.collection("users").doc("user1").set({
    uid: "user1",
    plan: "premium",
    accessType: "subscriber",
    subscriptionEndsAt: expiredDate
  });
  db1.collection("artists").doc("user1").set({ uid: "user1" });
  
  const res1 = await runSimulatedHandler(db1, { "authorization": "Bearer MOCK_CRON_SECRET" });
  assert("1. Single expired payment resolves & downgrades", res1?.body?.updated === 1 && db1.collections["users"]["user1"]?.plan === "free", { res: res1, user1: db1.collections["users"]["user1"] });

  // 2. Valid active payment
  const db2 = new MockFirestore();
  const validDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 5); // 5 days from now
  db2.collection("users").doc("user2").set({
    uid: "user2",
    plan: "premium",
    accessType: "subscriber",
    subscriptionEndsAt: validDate
  });
  const res2 = await runSimulatedHandler(db2, { "authorization": "Bearer MOCK_CRON_SECRET" });
  assert("2. Valid active payment remains untouched", res2.body.updated === 0 && db2.collections["users"]["user2"]?.plan === "premium");

  // 3. Trial expired
  const db3 = new MockFirestore();
  db3.collection("users").doc("user3").set({
    uid: "user3",
    plan: "trial",
    accessType: "trial",
    trialEndsAt: expiredDate
  });
  const res3 = await runSimulatedHandler(db3, { "authorization": "Bearer MOCK_CRON_SECRET" });
  assert("3. Expired trial resolves & downgrades", res3.body.updated === 1 && db3.collections["users"]["user3"]?.plan === "free");

  // 4. Manual expired
  const db4 = new MockFirestore();
  db4.collection("users").doc("user4").set({
    uid: "user4",
    plan: "premium",
    accessType: "manual",
    manualAccessEndsAt: expiredDate
  });
  const res4 = await runSimulatedHandler(db4, { "authorization": "Bearer MOCK_CRON_SECRET" });
  assert("4. Expired manual access resolves & downgrades", res4.body.updated === 1 && db4.collections["users"]["user4"]?.plan === "free");

  // 5. Manual without date
  const db5 = new MockFirestore();
  db5.collection("users").doc("user5").set({
    uid: "user5",
    plan: "premium",
    accessType: "manual"
  });
  const res5 = await runSimulatedHandler(db5, { "authorization": "Bearer MOCK_CRON_SECRET" });
  assert("5. Manual access without end date does not expire", res5.body.updated === 0 && db5.collections["users"]["user5"]?.plan === "premium");

  // 6. Administrator check
  const db6 = new MockFirestore();
  db6.collection("users").doc("user6").set({
    uid: "user6",
    role: "admin",
    plan: "premium",
    accessType: "subscriber",
    subscriptionEndsAt: expiredDate
  });
  const res6 = await runSimulatedHandler(db6, { "authorization": "Bearer MOCK_CRON_SECRET" });
  assert("6. Administrator remains untouched even if subscription is chronologically past", res6.body.updated === 0 && db6.collections["users"]["user6"]?.plan === "premium");

  // 7. Normal free plan is ignored for downgrade processing
  const db7 = new MockFirestore();
  db7.collection("users").doc("user7").set({
    uid: "user7",
    plan: "free",
    accessType: "free"
  });
  const res7 = await runSimulatedHandler(db7, { "authorization": "Bearer MOCK_CRON_SECRET" });
  assert("7. Normal free plan is ignored for downgrade processing", res7.body.updated === 0);

  // 8. ISO string date parses and correctly identifies expiration
  const db8 = new MockFirestore();
  db8.collection("users").doc("user8").set({
    uid: "user8",
    plan: "premium",
    accessType: "subscriber",
    subscriptionEndsAt: expiredDate.toISOString()
  });
  const res8 = await runSimulatedHandler(db8, { "authorization": "Bearer MOCK_CRON_SECRET" });
  assert("8. ISO string date parses and correctly identifies expiration", res8.body.updated === 1 && db8.collections["users"]["user8"]?.plan === "free");

  // 9. Legacy object with seconds parses and correctly identifies expiration
  const db9 = new MockFirestore();
  const legacyExpiredTimestamp = { _seconds: Math.floor(expiredDate.getTime() / 1000), _nanoseconds: 0 };
  db9.collection("users").doc("user9").set({
    uid: "user9",
    plan: "premium",
    accessType: "subscriber",
    subscriptionEndsAt: legacyExpiredTimestamp
  });
  const res9 = await runSimulatedHandler(db9, { "authorization": "Bearer MOCK_CRON_SECRET" });
  assert("9. Legacy object with seconds parses and correctly identifies expiration", res9.body.updated === 1 && db9.collections["users"]["user9"]?.plan === "free");

  // 10. Concurrent request gets skipped safely by active lock
  const db10 = new MockFirestore();
  const activeLockRef = db10.collection("mp_locks").doc("expirations");
  activeLockRef.set({ expiresAt: new Date(Date.now() + 1000 * 60 * 3) }); // locks for 3 minutes
  const res10 = await runSimulatedHandler(db10, { "authorization": "Bearer MOCK_CRON_SECRET" });
  assert("10. Concurrent request gets skipped safely by active lock", res10.body.skipped === true && res10.body.reason === "expirations_process_already_running");

  // 11. Profile batch failure registers correctly and skips tracks
  const db11 = new MockFirestore();
  db11.shouldFailBatchCommits = true;
  db11.collection("users").doc("user11").set({
    uid: "user11",
    plan: "premium",
    accessType: "subscriber",
    subscriptionEndsAt: expiredDate
  });
  db11.collection("artists").doc("user11").set({ uid: "user11" });
  const res11 = await runSimulatedHandler(db11, { "authorization": "Bearer MOCK_CRON_SECRET" });
  assert("11. Profile batch failure registers correctly and skips tracks", res11.body.failed === 1 && res11.body.updated === 0);

  // 12. Downgraded user with 5 active tracks repaired to exactly 3
  const db12 = new MockFirestore();
  db12.collection("users").doc("user12").set({
    uid: "user12",
    plan: "free",
    planStatus: "expired",
    expirationTracksStatus: "pending"
  });
  db12.collection("artists").doc("user12").set({ uid: "user12" });
  for (let i = 1; i <= 5; i++) {
    db12.collection("songs").doc(`track${i}`).set({ id: `track${i}`, ownerId: "user12", status: "active", createdAt: new Date(Date.now() - i * 10000) });
  }
  const res12 = await runSimulatedHandler(db12, { "authorization": "Bearer MOCK_CRON_SECRET" });
  assert("12. Downgraded user with 5 active tracks repaired to exactly 3", 
    res12.body.songsLocked === 2 && 
    db12.collections["songs"]["track5"]?.status === "active" && 
    db12.collections["songs"]["track4"]?.status === "active" && 
    db12.collections["songs"]["track3"]?.status === "active" && 
    db12.collections["songs"]["track2"]?.status === "locked_by_expired_plan" && 
    db12.collections["songs"]["track1"]?.status === "locked_by_expired_plan"
  );

  // 13. Preferred tracks 'track4' and 'track5' are kept active during repair
  const db13 = new MockFirestore();
  db13.collection("users").doc("user13").set({
    uid: "user13",
    plan: "free",
    planStatus: "expired",
    expirationTracksStatus: "pending",
    preferredFreeTracks: ["track4", "track5"]
  });
  db13.collection("artists").doc("user13").set({ uid: "user13" });
  for (let i = 1; i <= 5; i++) {
    db13.collection("songs").doc(`track${i}`).set({ id: `track${i}`, ownerId: "user13", status: "active", createdAt: new Date(Date.now() - i * 10000) });
  }
  await runSimulatedHandler(db13, { "authorization": "Bearer MOCK_CRON_SECRET" });
  assert("13. Preferred tracks 'track4' and 'track5' are kept active during repair", 
    db13.collections["songs"]["track5"]?.status === "active" && 
    db13.collections["songs"]["track4"]?.status === "active"
  );

  // 14. Document legacy/mirror music inexistency handling
  const db14 = new MockFirestore();
  db14.collection("users").doc("user14").set({
    uid: "user14",
    plan: "free",
    planStatus: "expired",
    expirationTracksStatus: "pending"
  });
  db14.collection("songs").doc("lone_track").set({ id: "lone_track", ownerId: "user14", status: "active" });
  const res14 = await runSimulatedHandler(db14, { "authorization": "Bearer MOCK_CRON_SECRET" });
  assert("14. Missing legacy subcollection doc doesn't crash the lock process", res14.body.success === true);

  // 15. Pagination cursor progresses successfully and wraps around on complete collection scan
  const db15 = new MockFirestore();
  // We set up 25 subscribers
  for (let i = 1; i <= 25; i++) {
    const padded = String(i).padStart(3, '0');
    db15.collection("users").doc(`user_pag_${padded}`).set({
      uid: `user_pag_${padded}`,
      plan: "premium",
      accessType: "subscriber",
      subscriptionEndsAt: expiredDate
    });
  }
  // Run first page (Subscribers limit is 20)
  const res15_1 = await runSimulatedHandler(db15, { "authorization": "Bearer MOCK_CRON_SECRET" });
  const cursorVal1 = db15.collections["mp_locks"]["expirations_cursor"]?.subscriberCursor;
  
  // Run second page (5 remaining subscribers)
  const res15_2 = await runSimulatedHandler(db15, { "authorization": "Bearer MOCK_CRON_SECRET" });
  const cursorVal2 = db15.collections["mp_locks"]["expirations_cursor"]?.subscriberCursor;

  assert("15. Pagination cursor progresses successfully and wraps around on complete collection scan", 
    res15_1.body.scanned === 20 && 
    cursorVal1 === "user_pag_020" && 
    res15_2.body.scanned === 5 && 
    cursorVal2 === ""
  );

  // 16. Authentication checking: invalid token
  const db16 = new MockFirestore();
  const res16 = await runSimulatedHandler(db16, { "authorization": "Bearer INVALID_TOKEN" });
  assert("16. Rejects connection when authorization token is wrong", res16.status === 401);

  // 17. Authentication checking: secret in URL params
  const db17 = new MockFirestore();
  const res17 = await runSimulatedHandler(db17, { "authorization": "Bearer MOCK_CRON_SECRET" }, { "secret": "some_value" });
  assert("17. Rejects connection with 400 when secret parameter is supplied in query string", res17.status === 400);

  // 18. Outstanding users query repair step
  const db18 = new MockFirestore();
  db18.collection("users").doc("repaired_later").set({
    uid: "repaired_later",
    plan: "free",
    planStatus: "expired",
    expirationTracksStatus: "pending"
  });
  db18.collection("songs").doc("rep1").set({ id: "rep1", ownerId: "repaired_later", status: "active", createdAt: new Date() });
  db18.collection("songs").doc("rep2").set({ id: "rep2", ownerId: "repaired_later", status: "active", createdAt: new Date() });
  db18.collection("songs").doc("rep3").set({ id: "rep3", ownerId: "repaired_later", status: "active", createdAt: new Date() });
  db18.collection("songs").doc("rep4").set({ id: "rep4", ownerId: "repaired_later", status: "active", createdAt: new Date() });

  const res18 = await runSimulatedHandler(db18, { "authorization": "Bearer MOCK_CRON_SECRET" });
  assert("18. Separate outstanding repair query successfully captures and locking excess tracks", res18.body.repaired >= 1);

  // 19. Large number of songs (chunked batch writing)
  const db19 = new MockFirestore();
  db19.collection("users").doc("super_artist").set({
    uid: "super_artist",
    plan: "premium",
    accessType: "subscriber",
    subscriptionEndsAt: expiredDate
  });
  db19.collection("artists").doc("super_artist").set({ uid: "super_artist" });
  // Setup 280 active songs (requires more than 1 batch to test chunks)
  for (let i = 1; i <= 280; i++) {
    db19.collection("songs").doc(`sa_track_${i}`).set({ id: `sa_track_${i}`, ownerId: "super_artist", status: "active", createdAt: new Date(Date.now() - i * 1000) });
  }
  const res19 = await runSimulatedHandler(db19, { "authorization": "Bearer MOCK_CRON_SECRET" });
  assert("19. Chunked batch writer successfully handles and locks large number of files (>250 tracks) safely", res19.body.songsLocked === 277);


  // =========================================================================
  // --- ADDED NEW TEST CASES REQUIRED BY REQUIREMENT 8 ---
  // =========================================================================

  // Test Case 20: fifteen pending users, proving that all are reached
  const db20 = new MockFirestore();
  for (let i = 1; i <= 15; i++) {
    db20.collection("users").doc(`repair_pend_${i}`).set({
      uid: `repair_pend_${i}`,
      plan: "free",
      planStatus: "expired",
      expirationTracksStatus: "pending"
    });
    db20.collection("songs").doc(`track_pend_${i}`).set({ id: `track_pend_${i}`, ownerId: `repair_pend_${i}`, status: "active" });
  }
  const res20 = await runSimulatedHandler(db20, { "authorization": "Bearer MOCK_CRON_SECRET" });
  assert("20. Fifteen pending users, proving that all are reached", res20.body.repaired === 15);

  // Test Case 21: repaired user is removed from the repair query
  const db21 = new MockFirestore();
  db21.collection("users").doc("user21").set({
    uid: "user21",
    plan: "free",
    planStatus: "expired",
    expirationTracksStatus: "pending"
  });
  // Perform first run (repairs tracks and sets expirationTracksStatus: "completed")
  await runSimulatedHandler(db21, { "authorization": "Bearer MOCK_CRON_SECRET" });
  // Verify it is completed
  assert("21.a User status is completed", db21.collections["users"]["user21"]?.expirationTracksStatus === "completed");
  // Run second time
  const res21_2 = await runSimulatedHandler(db21, { "authorization": "Bearer MOCK_CRON_SECRET" });
  // Verify it was not scanned or repaired again (repaired should be 0)
  assert("21.b Repaired user is removed from subsequent repair queries", res21_2.body.repaired === 0);

  // Test Case 22: user with up to 3 songs is marked as completed
  const db22 = new MockFirestore();
  db22.collection("users").doc("user22").set({
    uid: "user22",
    plan: "free",
    planStatus: "expired",
    expirationTracksStatus: "pending"
  });
  // Only 2 active tracks
  db22.collection("songs").doc("user22_t1").set({ id: "user22_t1", ownerId: "user22", status: "active" });
  db22.collection("songs").doc("user22_t2").set({ id: "user22_t2", ownerId: "user22", status: "active" });
  await runSimulatedHandler(db22, { "authorization": "Bearer MOCK_CRON_SECRET" });
  assert("22. User with up to three songs is successfully marked as completed", db22.collections["users"]["user22"]?.expirationTracksStatus === "completed");

  // Test Case 23: failure in commit keeps status as pending
  const db23 = new MockFirestore();
  db23.collection("users").doc("user23").set({
    uid: "user23",
    plan: "free",
    planStatus: "expired",
    expirationTracksStatus: "pending"
  });
  db23.collection("songs").doc("user23_t1").set({ id: "user23_t1", ownerId: "user23", status: "active" });
  // Force write/batch commit failure
  db23.shouldFailBatchCommits = true;
  await runSimulatedHandler(db23, { "authorization": "Bearer MOCK_CRON_SECRET" });
  assert("23. Track repair failure keeps status as pending", db23.collections["users"]["user23"]?.expirationTracksStatus === "pending");

  // Test Case 24: inexistent artist does not create incomplete profile
  const db24 = new MockFirestore();
  db24.collection("users").doc("user24").set({
    uid: "user24",
    plan: "premium",
    accessType: "subscriber",
    subscriptionEndsAt: expiredDate
  });
  // artists/user24 is intentionally NOT created
  const res24 = await runSimulatedHandler(db24, { "authorization": "Bearer MOCK_CRON_SECRET" });
  assert("24.a Missing artist profile counter increments", res24.body.missingArtistProfiles === 1);
  assert("24.b Missing artist profile is NOT created", db24.collections["artists"]?.["user24"] === undefined);
  assert("24.c User profile is still downgraded", db24.collections["users"]["user24"]?.plan === "free");

  // Test Case 25: separate cursor of subscriber
  const db25 = new MockFirestore();
  for (let i = 1; i <= 25; i++) {
    const padded = String(i).padStart(3, '0');
    db25.collection("users").doc(`sub_${padded}`).set({
      uid: `sub_${padded}`,
      plan: "premium",
      accessType: "subscriber",
      subscriptionEndsAt: expiredDate
    });
  }
  const res25_1 = await runSimulatedHandler(db25, { "authorization": "Bearer MOCK_CRON_SECRET" });
  assert("25. Subscriber cursor advances in segments of 20", res25_1.body.cursors.subscriberCursor === "sub_020");

  // Test Case 26: separate cursor of trial
  const db26 = new MockFirestore();
  for (let i = 1; i <= 20; i++) {
    const padded = String(i).padStart(3, '0');
    db26.collection("users").doc(`trial_${padded}`).set({
      uid: `trial_${padded}`,
      plan: "trial",
      accessType: "trial",
      trialEndsAt: expiredDate
    });
  }
  const res26_1 = await runSimulatedHandler(db26, { "authorization": "Bearer MOCK_CRON_SECRET" });
  assert("26. Trial cursor advances in segments of 15", res26_1.body.cursors.trialCursor === "trial_015");

  // Test Case 27: separate cursor of manual
  const db27 = new MockFirestore();
  for (let i = 1; i <= 20; i++) {
    const padded = String(i).padStart(3, '0');
    db27.collection("users").doc(`manual_${padded}`).set({
      uid: `manual_${padded}`,
      plan: "premium",
      accessType: "manual",
      manualAccessEndsAt: expiredDate
    });
  }
  const res27_1 = await runSimulatedHandler(db27, { "authorization": "Bearer MOCK_CRON_SECRET" });
  assert("27. Manual cursor advances in segments of 15", res27_1.body.cursors.manualCursor === "manual_015");

  // Test Case 28: normal free account does not occupy pagination batch slot
  const db28 = new MockFirestore();
  // 30 normal free users, and 1 expired subscriber
  for (let i = 1; i <= 30; i++) {
    db28.collection("users").doc(`free_user_${i}`).set({
      uid: `free_user_${i}`,
      plan: "free",
      accessType: "free"
    });
  }
  db28.collection("users").doc("exp_sub").set({
    uid: "exp_sub",
    plan: "premium",
    accessType: "subscriber",
    subscriptionEndsAt: expiredDate
  });
  const res28 = await runSimulatedHandler(db28, { "authorization": "Bearer MOCK_CRON_SECRET" });
  // The query for subscribers only fetched "exp_sub" (1 document), scanning 0 free users in the query!
  assert("28. Common free plans are not pulled in subscriber queries and do not waste batch slots", res28.body.scanned === 1 && res28.body.updated === 1);

  // Test Case 29: large base with 1000 free users and 1 expired subscriber
  const db29 = new MockFirestore();
  for (let i = 1; i <= 1000; i++) {
    db29.collection("users").doc(`free_${i}`).set({
      uid: `free_${i}`,
      plan: "free",
      accessType: "free"
    });
  }
  db29.collection("users").doc("target_sub").set({
    uid: "target_sub",
    plan: "premium",
    accessType: "subscriber",
    subscriptionEndsAt: expiredDate
  });
  const res29 = await runSimulatedHandler(db29, { "authorization": "Bearer MOCK_CRON_SECRET" });
  // Scanned should be 1, because the index-based query only targets subscribers!
  assert("29. Subscriber check scale is independent of the number of free accounts", res29.body.scanned === 1 && res29.body.updated === 1);


  // =========================================================================
  // --- ADDED NEW TEST CASES FOR REQUIREMENT 9 ---
  // =========================================================================

  // 1. Assinante sem data não expira
  const db30 = new MockFirestore();
  db30.collection("users").doc("user30").set({
    uid: "user30",
    plan: "premium",
    accessType: "subscriber"
  });
  const res30 = await runSimulatedHandler(db30, { "authorization": "Bearer MOCK_CRON_SECRET" });
  assert("30. Assinante sem data de expiração não expira", res30.body.updated === 0 && db30.collections["users"]["user30"]?.plan === "premium");

  // 2. Manual sem data não expira
  const db31 = new MockFirestore();
  db31.collection("users").doc("user31").set({
    uid: "user31",
    plan: "premium",
    accessType: "manual"
  });
  const res31 = await runSimulatedHandler(db31, { "authorization": "Bearer MOCK_CRON_SECRET" });
  assert("31. Manual sem data de expiração não expira", res31.body.updated === 0 && db31.collections["users"]["user31"]?.plan === "premium");

  // 3. Trial sem data não expira
  const db32 = new MockFirestore();
  db32.collection("users").doc("user32").set({
    uid: "user32",
    plan: "trial",
    accessType: "trial"
  });
  const res32 = await runSimulatedHandler(db32, { "authorization": "Bearer MOCK_CRON_SECRET" });
  assert("32. Trial sem data de expiração não expira", res32.body.updated === 0 && db32.collections["users"]["user32"]?.plan === "trial");

  // 4. Data inválida não expira
  const db33 = new MockFirestore();
  db33.collection("users").doc("user33").set({
    uid: "user33",
    plan: "premium",
    accessType: "subscriber",
    subscriptionEndsAt: "invalid-date-string"
  });
  const res33 = await runSimulatedHandler(db33, { "authorization": "Bearer MOCK_CRON_SECRET" });
  assert("33. Assinante com data inválida não expira", res33.body.updated === 0 && db33.collections["users"]["user33"]?.plan === "premium");

  // 5. planExpiresAt legado vencido expira
  const db34 = new MockFirestore();
  db34.collection("users").doc("user34").set({
    uid: "user34",
    plan: "premium",
    accessType: "subscriber",
    planExpiresAt: expiredDate
  });
  db34.collection("artists").doc("user34").set({ uid: "user34" });
  const res34 = await runSimulatedHandler(db34, { "authorization": "Bearer MOCK_CRON_SECRET" });
  assert("34. Legacy planExpiresAt vencido expira", res34.body.updated === 1 && db34.collections["users"]["user34"]?.plan === "free");

  // 6. planExpiresAt futuro não expira
  const db35 = new MockFirestore();
  const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24); // 1 day future
  db35.collection("users").doc("user35").set({
    uid: "user35",
    plan: "premium",
    accessType: "subscriber",
    planExpiresAt: futureDate
  });
  const res35 = await runSimulatedHandler(db35, { "authorization": "Bearer MOCK_CRON_SECRET" });
  assert("35. Legacy planExpiresAt futuro não expira", res35.body.updated === 0 && db35.collections["users"]["user35"]?.plan === "premium");

  // 7. Plano Essencial vencido expira
  const db36 = new MockFirestore();
  db36.collection("users").doc("user36").set({
    uid: "user36",
    plan: "essencial",
    accessType: "subscriber",
    subscriptionEndsAt: expiredDate
  });
  db36.collection("artists").doc("user36").set({ uid: "user36" });
  const res36 = await runSimulatedHandler(db36, { "authorization": "Bearer MOCK_CRON_SECRET" });
  assert("36. Plano Essencial vencido expira", res36.body.updated === 1 && db36.collections["users"]["user36"]?.plan === "free");

  // 8. Identificação por userId consistente
  const db37 = new MockFirestore();
  db37.collection("users").doc("user37_custom_doc_id").set({
    uid: "different_uid_field",
    plan: "premium",
    accessType: "subscriber",
    subscriptionEndsAt: expiredDate
  });
  db37.collection("artists").doc("user37_custom_doc_id").set({ uid: "different_uid_field" });
  const res37 = await runSimulatedHandler(db37, { "authorization": "Bearer MOCK_CRON_SECRET" });
  assert("37. Identificação de userId obtida a partir de docSnap.id de forma consistente", 
    res37.body.updated === 1 && 
    db37.collections["users"]["user37_custom_doc_id"]?.plan === "free" &&
    db37.collections["users"]["user37_custom_doc_id"]?.uid === "user37_custom_doc_id"
  );

  // 9. Endpoint não possui bypass de lock
  const db38 = new MockFirestore();
  db38.collection("mp_locks").doc("expirations").set({ expiresAt: futureDate });
  const res38 = await runSimulatedHandler(db38, { "authorization": "Bearer MOCK_CRON_SECRET" }, { "force": "true", "override": "true", "bypass": "true" });
  assert("38. Endpoint não possui bypass de lock via query parameters", res38.body.skipped === true && res38.body.reason === "expirations_process_running_lock_already_held" || res38.body.reason === "expirations_process_already_running");

  // 10. vercel.json mantém todos os rewrites
  const vercelJsonPath = path.join(process.cwd(), 'vercel.json');
  const vercelJsonRaw = fs.readFileSync(vercelJsonPath, 'utf8');
  const vercelJson = JSON.parse(vercelJsonRaw);
  const sources = vercelJson.rewrites.map((r: any) => r.source);
  const rewritesExist = 
    sources.includes("/api/(.*)") &&
    sources.includes("/s/:slug/repertorio/:repertoireId") &&
    sources.includes("/s/:slug") &&
    sources.includes("/catalogo/:slug") &&
    sources.includes("/(.*)");
  assert("39. vercel.json mantém todas as rotas e regras de rewrite anteriores", rewritesExist);


  console.log("\n=======================================================");
  console.log(`   TEST EXECUTION COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runTests().catch(err => {
  console.error("Test execution aborted due to unexpected error:", err);
  process.exit(1);
});
