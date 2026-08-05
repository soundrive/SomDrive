import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = "gen-lang-client-0946896754";
const databaseId = "ai-studio-656139fd-0f8f-4866-ada1-753533a8c5ff";
const CANONICAL_DOMAIN = "https://www.somdrive.com.br";

function escapeXml(unsafe: string): string {
  if (!unsafe) return "";
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function cleanSlug(raw: string): string {
  if (!raw) return "";
  return raw
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

function getAdminDb() {
  try {
    let firebaseAdminApp;
    if (!getApps().length) {
      const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
      const pIdRaw = process.env.FIREBASE_PROJECT_ID;
      const cEmailRaw = process.env.FIREBASE_CLIENT_EMAIL;
      const pKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

      function cleanEnvValue(val?: string): string {
        if (!val) return "";
        let s = val.trim();
        if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
          s = s.substring(1, s.length - 1).trim();
        }
        return s;
      }

      const projectIdClean = cleanEnvValue(pIdRaw);
      const clientEmailClean = cleanEnvValue(cEmailRaw);
      const privateKeyClean = cleanEnvValue(pKeyRaw)?.replace(/\\n/g, "\n");

      if (serviceAccountVar) {
        try {
          firebaseAdminApp = initializeApp({
            credential: cert(JSON.parse(serviceAccountVar)),
            projectId
          });
        } catch {
          firebaseAdminApp = initializeApp({ projectId });
        }
      } else if (projectIdClean && clientEmailClean && privateKeyClean) {
        try {
          firebaseAdminApp = initializeApp({
            credential: cert({
              projectId: projectIdClean,
              clientEmail: clientEmailClean,
              privateKey: privateKeyClean,
            }),
            projectId: projectIdClean
          });
        } catch {
          firebaseAdminApp = initializeApp({ projectId });
        }
      } else {
        firebaseAdminApp = initializeApp({ projectId });
      }
    } else {
      firebaseAdminApp = getApp();
    }
    return getFirestore(firebaseAdminApp, databaseId);
  } catch (err) {
    console.warn("[Sitemap] Could not initialize Firebase Admin SDK:", err);
    return null;
  }
}

async function fetchDocsRest(collectionName: string, filterPublic: boolean = false): Promise<any[]> {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents:runQuery`;
    const bodyPayload: any = {
      structuredQuery: {
        from: [{ collectionId: collectionName }]
      }
    };

    if (filterPublic) {
      bodyPayload.structuredQuery.where = {
        fieldFilter: {
          field: { fieldPath: "visibility" },
          op: "EQUAL",
          value: { stringValue: "public" }
        }
      };
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyPayload)
    });

    if (!res.ok) return [];
    const items = await res.json();
    if (!Array.isArray(items)) return [];

    return items
      .filter((item: any) => item.document)
      .map((item: any) => {
        const doc = item.document;
        const docId = doc.name ? doc.name.split('/').pop() : "";
        const fields = doc.fields || {};
        const parsed: any = { _id: docId };
        for (const key of Object.keys(fields)) {
          const fieldVal = fields[key];
          if (fieldVal.stringValue !== undefined) parsed[key] = fieldVal.stringValue;
          else if (fieldVal.booleanValue !== undefined) parsed[key] = fieldVal.booleanValue;
          else if (fieldVal.integerValue !== undefined) parsed[key] = parseInt(fieldVal.integerValue, 10);
          else if (fieldVal.timestampValue !== undefined) parsed[key] = fieldVal.timestampValue;
          else if (fieldVal.arrayValue !== undefined) {
            parsed[key] = (fieldVal.arrayValue.values || []).map((v: any) => v.stringValue || v);
          }
        }
        return parsed;
      });
  } catch (err) {
    console.warn(`[Sitemap] REST fetch failed for ${collectionName}:`, err);
    return [];
  }
}

export async function generateSitemapXml(): Promise<{ xml: string; stats: { artistsCount: number; publicRepertoiresCount: number; unlistedSkipped: number; totalUrls: number } }> {
  const urlEntries: string[] = [];
  const artistIdToSlug = new Map<string, string>();
  const artistSlugs = new Set<string>();

  let artistsCount = 0;
  let publicRepertoiresCount = 0;
  let unlistedSkipped = 0;

  // 1. Add Home page URL
  urlEntries.push(`${CANONICAL_DOMAIN}/`);

  const db = getAdminDb();
  let rawArtists: any[] = [];
  let rawUsers: any[] = [];
  let rawRepertoires: any[] = [];

  if (db) {
    try {
      const [artSnap, userSnap, repSnap] = await Promise.all([
        db.collection("artists").limit(1000).get(),
        db.collection("users").limit(1000).get(),
        db.collection("repertoires").limit(1000).get(),
      ]);
      rawArtists = artSnap.docs.map(d => ({ _id: d.id, ...d.data() }));
      rawUsers = userSnap.docs.map(d => ({ _id: d.id, ...d.data() }));
      rawRepertoires = repSnap.docs.map(d => ({ _id: d.id, ...d.data() }));
    } catch (sdkErr) {
      console.warn("[Sitemap] Firestore Admin query failed, using REST fallback:", sdkErr);
      rawArtists = [];
      rawUsers = [];
      rawRepertoires = [];
    }
  }

  // Fallback to REST if Admin SDK returned no results
  if (rawArtists.length === 0 && rawUsers.length === 0) {
    const [restArtists, restUsers, restRepertoires] = await Promise.all([
      fetchDocsRest("artists"),
      fetchDocsRest("users"),
      fetchDocsRest("repertoires", true),
    ]);
    rawArtists = restArtists;
    rawUsers = restUsers;
    rawRepertoires = restRepertoires;
  }

  // Process Artists & Users to collect active public artist profiles
  const processArtistRecord = (rec: any) => {
    const id = rec._id || rec.uid || rec.userId;
    if (!id) return;
    if (rec.isBlocked === true) return;

    const rawSlug = rec.slug || rec.artistSlug;
    const name = rec.name || rec.artistName;
    const computedSlug = cleanSlug(rawSlug || name || id);

    if (computedSlug && computedSlug !== "default" && computedSlug !== "global") {
      if (!artistIdToSlug.has(id)) {
        artistIdToSlug.set(id, computedSlug);
      }
      if (!artistSlugs.has(computedSlug)) {
        artistSlugs.add(computedSlug);
        artistsCount++;
        urlEntries.push(`${CANONICAL_DOMAIN}/s/${computedSlug}`);
      }
    }
  };

  rawArtists.forEach(processArtistRecord);
  rawUsers.forEach(processArtistRecord);

  // Process Repertoires: STRICTLY include ONLY visibility === "public"
  rawRepertoires.forEach((rep: any) => {
    const visibility = (rep.visibility || "").toLowerCase().trim();

    // STRICT CHECK: exclude unlisted, private, or non-public repertoires
    if (visibility !== "public") {
      unlistedSkipped++;
      return;
    }

    const repId = rep.id || rep._id;
    const repSlug = cleanSlug(rep.slug || rep.name || repId);
    const ownerUid = rep.ownerUid || rep.userId || rep.artistId;

    if (!repSlug || !ownerUid) return;

    const artistSlug = artistIdToSlug.get(ownerUid) || cleanSlug(ownerUid);

    if (artistSlug) {
      publicRepertoiresCount++;
      urlEntries.push(`${CANONICAL_DOMAIN}/s/${artistSlug}/repertorio/${repSlug}`);
    }
  });

  // Build clean XML string
  const urlsXml = urlEntries
    .map(url => `  <url>\n    <loc>${escapeXml(url)}</loc>\n  </url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlsXml}\n</urlset>`;

  return {
    xml,
    stats: {
      artistsCount,
      publicRepertoiresCount,
      unlistedSkipped,
      totalUrls: urlEntries.length,
    }
  };
}

export default async function handler(req: any, res: any) {
  try {
    const { xml } = await generateSitemapXml();
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=3600");
    return res.status(200).send(xml);
  } catch (err: any) {
    console.error("[Sitemap] Critical error generating sitemap:", err);
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${CANONICAL_DOMAIN}/</loc>\n  </url>\n</urlset>`;
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=3600");
    return res.status(200).send(fallbackXml);
  }
}
