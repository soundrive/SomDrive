import dotenv from 'dotenv';
dotenv.config();

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, FieldValue, FieldPath, Firestore, DocumentReference, Transaction, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getSafeExpirationDate, isAccessExpired, UserAccessData, TrackData } from '../../src/server/expiration-utils';

// Interfaces for Vercel req/res typing
export interface CustomRequest {
  method: string;
  query?: { [key: string]: string };
  headers: { [key: string]: string | string[] | undefined };
}

export interface CustomResponse {
  status: (code: number) => CustomResponse;
  json: (body: any) => CustomResponse;
  setHeader: (name: string, value: string) => CustomResponse;
}

export interface ProcessExpirationsResult {
  success: boolean;
  scanned: number;
  expired: number;
  updated: number;
  failed: number;
  songsLocked: number;
  repaired: number;
  missingArtistProfiles: number;
  hasMore: boolean;
  cursors: {
    subscriberCursor: string;
    trialCursor: string;
    manualCursor: string;
    repairCursor: string;
  };
  skipped?: boolean;
  reason?: string;
  message?: string;
}

interface QueuedWrite {
  ref: DocumentReference;
  type: 'update' | 'set';
  data: Record<string, any>;
  options?: { merge?: boolean };
}

export interface RepairResult {
  success: boolean;
  lockedCount: number;
}

// Lazy and secure Firebase Admin initialization
let dbInstance: Firestore | null = null;

function cleanEnvValue(val: string | undefined): string {
  if (!val) return "";
  let s = val.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.substring(1, s.length - 1);
  }
  s = s.trim();
  if (s.endsWith(",")) {
    s = s.substring(0, s.length - 1);
  }
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.substring(1, s.length - 1);
  }
  return s.trim();
}

function getDb(): Firestore {
  if (!dbInstance) {
    const rawProjectId = process.env.FIREBASE_PROJECT_ID;
    const rawClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

    const projectId = cleanEnvValue(rawProjectId);
    const clientEmail = cleanEnvValue(rawClientEmail);
    const privateKey = cleanEnvValue(rawPrivateKey)?.replace(/\\n/g, "\n").replace(/\\\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("Missing Firebase credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)");
    }

    let app: App;
    const appName = "mp_admin_app";
    const existingApps = getApps();
    const existingApp = existingApps.find(a => a.name === appName);

    if (!existingApp) {
      try {
        app = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
          projectId: projectId,
        }, appName);
      } catch (e: unknown) {
        console.error("Error initializing Firebase Admin in process-expirations:", e);
        throw e;
      }
    } else {
      app = existingApp;
    }
    // Using the precise verified database id
    dbInstance = getFirestore(app, "ai-studio-656139fd-0f8f-4866-ada1-753533a8c5ff");
  }
  return dbInstance;
}

// Constant-time comparison to prevent timing attacks on credentials
function safeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Safely commits list of writes in batches of 200 to prevent hitting Firestore's 500-write limit.
 */
async function commitChunkedWrites(db: any, writes: QueuedWrite[]): Promise<number> {
  const CHUNK_SIZE = 200;
  let executed = 0;
  for (let i = 0; i < writes.length; i += CHUNK_SIZE) {
    const chunk = writes.slice(i, i + CHUNK_SIZE);
    const batch = db.batch();
    for (const op of chunk) {
      if (op.type === 'update') {
        batch.update(op.ref, op.data);
      } else if (op.type === 'set') {
        batch.set(op.ref, op.data, op.options || {});
      }
    }
    await batch.commit();
    executed += chunk.length;
  }
  return executed;
}

/**
 * Reusable helper to repair song status limits for a downgraded user.
 */
export async function repairUserTracks(
  db: any,
  userId: string,
  preferredFreeTracks: string[]
): Promise<RepairResult> {
  try {
    let pendingLocks = 0;

    // 1. Fetch tracks belonging to the user from 'songs'
    const songsSnap = await db.collection("songs")
      .where("ownerId", "==", userId)
      .get();

    const allSongs: TrackData[] = songsSnap.docs.map((doc: QueryDocumentSnapshot): TrackData => ({
      trackId: doc.id,
      status: doc.get("status") || "active",
      ownerId: doc.get("ownerId"),
      createdAt: doc.get("createdAt"),
      updatedAt: doc.get("updatedAt")
    }));

    // Filter songs that are active or already locked by expired plan
    const candidateTracks = allSongs.filter(track => 
      track.status === "active" || track.status === "locked_by_expired_plan"
    );

    if (candidateTracks.length === 0) {
      return { success: true, lockedCount: 0 };
    }

    // 2. Fetch existing legacy tracks to avoid writing skeleton documents
    const legacySnap = await db.collection("artists").doc(userId).collection("musics").get();
    const legacyTrackIds = new Set(legacySnap.docs.map((doc: QueryDocumentSnapshot) => doc.id));

    // Sort: preferred tracks first, then older active tracks (createdAt / updatedAt)
    const sortedTracks = [...candidateTracks].sort((a, b) => {
      const aPref = preferredFreeTracks.includes(a.trackId);
      const bPref = preferredFreeTracks.includes(b.trackId);

      if (aPref && !bPref) return -1;
      if (!aPref && bPref) return 1;

      const aTime = getSafeExpirationDate(a.createdAt || a.updatedAt)?.getTime() || 0;
      const bTime = getSafeExpirationDate(b.createdAt || b.updatedAt)?.getTime() || 0;

      if (aTime !== bTime) {
        return aTime - bTime; // Older tracks first
      }

      return a.trackId.localeCompare(b.trackId); // Consistent fallback
    });

    // Prepare chunked writes
    const writes: QueuedWrite[] = [];

    for (let i = 0; i < sortedTracks.length; i++) {
      const track = sortedTracks[i];
      const shouldBeActive = i < 3;
      const targetStatus = shouldBeActive ? "active" : "locked_by_expired_plan";

      if (track.status !== targetStatus) {
        // Main songs collection write
        const songDocRef = db.collection("songs").doc(track.trackId);
        writes.push({
          ref: songDocRef,
          type: 'update',
          data: {
            status: targetStatus,
            updatedAt: FieldValue.serverTimestamp()
          }
        });

        // Legacy subcollection write (ONLY if it exists)
        if (legacyTrackIds.has(track.trackId)) {
          const musicDocRef = db.collection("artists").doc(userId).collection("musics").doc(track.trackId);
          writes.push({
            ref: musicDocRef,
            type: 'update',
            data: {
              status: targetStatus,
              updatedAt: FieldValue.serverTimestamp()
            }
          });
        }

        if (!shouldBeActive && track.status === "active") {
          pendingLocks++;
        }
      }
    }

    if (writes.length > 0) {
      await commitChunkedWrites(db, writes);
      console.log(`[Process Expirations] Successfully repaired tracks for user: ${userId}. Locked ${pendingLocks} track(s).`);
    }

    return { success: true, lockedCount: pendingLocks };
  } catch (err: unknown) {
    console.error(`[Process Expirations] Failed to repair tracks for user: ${userId}`, err);
    return { success: false, lockedCount: 0 };
  }
}

/**
 * Refactored core business logic function, decouple from HTTP handler for reliable unit testing.
 */
export async function processExpirationsInternal(
  db: any,
  req: CustomRequest,
  res: CustomResponse,
  now: Date
): Promise<void> {
  const lockRef = db.collection("mp_locks").doc("expirations");
  let lockAcquired = false;

  try {
    await db.runTransaction(async (transaction: any) => {
      const lockDoc = await transaction.get(lockRef);
      if (lockDoc.exists) {
        const data = lockDoc.data();
        const expiresAt = data?.expiresAt ? (data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt)) : null;

        if (expiresAt && expiresAt > now) {
          throw new Error("Lock is already held and has not expired yet.");
        }
      }

      // Set lock for 5 minutes maximum
      const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);
      transaction.set(lockRef, {
        acquiredAt: FieldValue.serverTimestamp(),
        expiresAt,
        holder: "process-expirations-run-" + now.getTime()
      });

      lockAcquired = true;
    });
  } catch (lockError: unknown) {
    const msg = lockError instanceof Error ? lockError.message : String(lockError);
    console.warn("[Process Expirations Lock] Skipped execution as another process holds the active lock:", msg);
    res.status(200).json({
      success: true,
      skipped: true,
      reason: "expirations_process_already_running",
      message: msg
    });
    return;
  }

  // Counters
  let scanned = 0;
  let expired = 0;
  let updated = 0;
  let failed = 0;
  let songsLocked = 0;
  let repaired = 0;
  let missingArtistProfiles = 0;

  try {
    // 1. Fetch current cursors from database to prevent starvation
    const cursorRef = db.collection("mp_locks").doc("expirations_cursor");
    const cursorDoc = await cursorRef.get();
    let subscriberCursor = "";
    let trialCursor = "";
    let manualCursor = "";
    let repairCursor = "";

    if (cursorDoc.exists) {
      const cData = cursorDoc.data();
      subscriberCursor = cData?.subscriberCursor || "";
      trialCursor = cData?.trialCursor || "";
      manualCursor = cData?.manualCursor || "";
      repairCursor = cData?.repairCursor || "";
    }

    // 2. Query batch candidates using progressive cursors
    // --- QUERY 1: Subscribers (Limit 20) ---
    let subscribersQuery = db.collection("users")
      .where("accessType", "in", ["subscriber", "mercadopago"])
      .orderBy(FieldPath.documentId());
    if (subscriberCursor) {
      subscribersQuery = subscribersQuery.startAfter(subscriberCursor);
    }
    const subscribersSnap = await subscribersQuery.limit(20).get();

    // --- QUERY 2: Trial (Limit 15) ---
    let trialQuery = db.collection("users")
      .where("accessType", "==", "trial")
      .orderBy(FieldPath.documentId());
    if (trialCursor) {
      trialQuery = trialQuery.startAfter(trialCursor);
    }
    const trialSnap = await trialQuery.limit(15).get();

    // --- QUERY 3: Manual (Limit 15) ---
    let manualQuery = db.collection("users")
      .where("accessType", "==", "manual")
      .orderBy(FieldPath.documentId());
    if (manualCursor) {
      manualQuery = manualQuery.startAfter(manualCursor);
    }
    const manualSnap = await manualQuery.limit(15).get();

    // --- QUERY 4: Reparo (Limit 15) ---
    let repairQuery = db.collection("users")
      .where("planStatus", "==", "expired")
      .where("expirationTracksStatus", "==", "pending")
      .orderBy(FieldPath.documentId());
    if (repairCursor) {
      repairQuery = repairQuery.startAfter(repairCursor);
    }
    const repairSnap = await repairQuery.limit(15).get();

    scanned = subscribersSnap.docs.length + trialSnap.docs.length + manualSnap.docs.length + repairSnap.docs.length;

    // --- PROCESS EXPIRED USERS FROM SUBSCRIBERS/TRIAL/MANUAL ---
    const activeSegments = [
      { docs: subscribersSnap.docs, type: 'subscriber' },
      { docs: trialSnap.docs, type: 'trial' },
      { docs: manualSnap.docs, type: 'manual' }
    ];

    for (const segment of activeSegments) {
      for (const docSnap of segment.docs) {
        const userData = { userId: docSnap.id, ...docSnap.data() } as UserAccessData;

        // Skip admin and safety checks
        if (userData.role === "admin" || !userData.userId) {
          continue;
        }

        const isCurrentlyPaid = userData.plan !== "free" && userData.accessType !== "free";

        if (isCurrentlyPaid && isAccessExpired(userData, now)) {
          expired++;

          // Check if artist document exists
          const artistRef = db.collection("artists").doc(userData.userId);
          const artistSnap = await artistRef.get();
          const artistExists = artistSnap.exists;

          const downgradePayload = {
            uid: userData.userId,
            plan: "free",
            musicLimit: 3,
            accessType: "free",
            planStatus: "expired",
            subscriptionStatus: "expired",
            paymentStatus: "inactive",
            expirationTracksStatus: "pending",
            updatedAt: FieldValue.serverTimestamp()
          };

          const userRef = db.collection("users").doc(userData.userId);
          const profileBatch = db.batch();
          profileBatch.set(userRef, downgradePayload, { merge: true });
          if (artistExists) {
            profileBatch.set(artistRef, downgradePayload, { merge: true });
          }

          try {
            await profileBatch.commit();
            updated++;
            console.log(`[Process Expirations] Profile downgraded for user: ${userData.userId}`);

            if (!artistExists) {
              missingArtistProfiles++;
              console.warn(`[Process Expirations] Missing artist profile for user: ${userData.userId}`);
            }

            // Perform song limit verification and locking
            const preferredTracks = userData.preferredFreeTracks || [];
            const repairRes = await repairUserTracks(db, userData.userId, preferredTracks);
            if (repairRes.success) {
              songsLocked += repairRes.lockedCount;

              // Since track repair succeeded, set status to completed!
              const completionBatch = db.batch();
              completionBatch.update(userRef, {
                expirationTracksStatus: "completed",
                expirationTracksSyncedAt: FieldValue.serverTimestamp()
              });
              if (artistExists) {
                completionBatch.update(artistRef, {
                  expirationTracksStatus: "completed",
                  expirationTracksSyncedAt: FieldValue.serverTimestamp()
                });
              }
              await completionBatch.commit();
            }

          } catch (profileError: unknown) {
            failed++;
            console.error(`[Process Expirations] Profile downgrade batch failed for user ${userData.userId}:`, profileError);
          }
        }
      }
    }

    // --- PROCESS REPAIR GROUP (PENDING TRACKS) ---
    for (const docSnap of repairSnap.docs) {
      const userData = { userId: docSnap.id, ...docSnap.data() } as UserAccessData;
      if (userData.userId && userData.plan === "free") {
        const artistRef = db.collection("artists").doc(userData.userId);
        const artistSnap = await artistRef.get();
        const artistExists = artistSnap.exists;

        const preferredTracks = userData.preferredFreeTracks || [];
        const repairRes = await repairUserTracks(db, userData.userId, preferredTracks);
        if (repairRes.success) {
          repaired++;
          songsLocked += repairRes.lockedCount;

          // Sync tracks repaired successfully to completed status
          const completionBatch = db.batch();
          completionBatch.update(db.collection("users").doc(userData.userId), {
            expirationTracksStatus: "completed",
            expirationTracksSyncedAt: FieldValue.serverTimestamp()
          });
          if (artistExists) {
            completionBatch.update(artistRef, {
              expirationTracksStatus: "completed",
              expirationTracksSyncedAt: FieldValue.serverTimestamp()
            });
          }
          await completionBatch.commit();
        }
      }
    }

    // Calculate cursors progressive states
    let nextSubscriberCursor = subscriberCursor;
    let hasMoreSubscribers = false;
    if (subscribersSnap.docs.length > 0) {
      nextSubscriberCursor = subscribersSnap.docs[subscribersSnap.docs.length - 1].id;
      hasMoreSubscribers = subscribersSnap.docs.length === 20;
    }
    if (subscribersSnap.docs.length < 20) {
      nextSubscriberCursor = "";
    }

    let nextTrialCursor = trialCursor;
    let hasMoreTrials = false;
    if (trialSnap.docs.length > 0) {
      nextTrialCursor = trialSnap.docs[trialSnap.docs.length - 1].id;
      hasMoreTrials = trialSnap.docs.length === 15;
    }
    if (trialSnap.docs.length < 15) {
      nextTrialCursor = "";
    }

    let nextManualCursor = manualCursor;
    let hasMoreManuals = false;
    if (manualSnap.docs.length > 0) {
      nextManualCursor = manualSnap.docs[manualSnap.docs.length - 1].id;
      hasMoreManuals = manualSnap.docs.length === 15;
    }
    if (manualSnap.docs.length < 15) {
      nextManualCursor = "";
    }

    let nextRepairCursor = repairCursor;
    let hasMoreRepairs = false;
    if (repairSnap.docs.length > 0) {
      nextRepairCursor = repairSnap.docs[repairSnap.docs.length - 1].id;
      hasMoreRepairs = repairSnap.docs.length === 15;
    }
    if (repairSnap.docs.length < 15) {
      nextRepairCursor = "";
    }

    await cursorRef.set({
      subscriberCursor: nextSubscriberCursor,
      trialCursor: nextTrialCursor,
      manualCursor: nextManualCursor,
      repairCursor: nextRepairCursor,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    const hasMore = hasMoreSubscribers || hasMoreTrials || hasMoreManuals || hasMoreRepairs;

    res.status(200).json({
      success: true,
      scanned,
      expired,
      updated,
      failed,
      songsLocked,
      repaired,
      missingArtistProfiles,
      hasMore,
      cursors: {
        subscriberCursor: nextSubscriberCursor,
        trialCursor: nextTrialCursor,
        manualCursor: nextManualCursor,
        repairCursor: nextRepairCursor
      }
    });

  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[Process Expirations Fatal Error]:", err);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: errMsg
    });
  } finally {
    if (lockAcquired) {
      try {
        await lockRef.delete();
        console.log("[Process Expirations Lock] Lock released successfully.");
      } catch (lockReleaseError: unknown) {
        console.error("[Process Expirations Lock] Failed to release lock:", lockReleaseError);
      }
    }
  }
}

export default async function handler(req: CustomRequest, res: CustomResponse) {
  const method = req.method;

  // Accept ONLY GET method
  if (method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({
      error: "Method Not Allowed",
      message: "This endpoint only accepts GET requests scheduled via Vercel Cron."
    });
  }

  // Reject if any secret is exposed in the query parameters
  if (req.query?.secret || req.query?.key || req.query?.token || req.query?.auth) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Query parameters containing secrets or keys are strictly forbidden."
    });
  }

  // Authorization validation using Bearer Token
  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret) {
    console.error("[Process Expirations Error] CRON_SECRET environment variable is not configured.");
    return res.status(500).json({
      error: "Configuration Error",
      message: "Server is missing necessary security configurations to authorize the execution."
    });
  }

  const authHeader = req.headers["authorization"];
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith("Bearer ")) {
    console.warn("[Process Expirations] Authorization header is missing or does not use Bearer schema.");
    return res.status(401).json({
      error: "Unauthorized",
      message: "Missing or invalid Bearer Authorization credentials."
    });
  }

  const token = authHeader.substring(7).trim();
  if (!safeCompare(token, configuredSecret)) {
    console.warn("[Process Expirations] Rejected unauthorized connection attempt (invalid Bearer token).");
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid Authorization credentials."
    });
  }

  let db: Firestore;
  try {
    db = getDb();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({
      error: "Initialization Error",
      message: msg
    });
  }

  await processExpirationsInternal(db, req, res, new Date());
}
