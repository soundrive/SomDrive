import fs from 'fs';
import path from 'path';

// Clean sluggification identical to other parts of the system
const slugifyStr = (text: string) => {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
};

const escapeXml = (unsafe: string): string => {
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
};

export default async function handler(req: any, res: any) {
  const userId = String(req.query.userId || '').trim();
  const type = String(req.query.type || 'catalogo').trim();

  const projectId = "gen-lang-client-0946896754";
  const databaseId = "ai-studio-656139fd-0f8f-4866-ada1-753533a8c5ff";

  let artistName = "Compositor";
  let genre = "Música Sertaneja";
  let city = "Brasil";
  let resolvedUserId = userId;
  let dbSlug = "";

  const cleanId = userId;
  const cleanIdLower = cleanId.toLowerCase();

  // 1. Fetch artist details from public Firestore REST API
  let artistFound = false;
  try {
    const artistUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/artists/${cleanId}`;
    const artistRes = await fetch(artistUrl);
    if (artistRes.ok) {
      const doc = await artistRes.json();
      const f = doc.fields || {};
      artistName = f.name?.stringValue || f.artistName?.stringValue || artistName;
      genre = f.genre?.stringValue || f.mainGenre?.stringValue || genre;
      city = f.city?.stringValue || city;
      resolvedUserId = doc.name.split('/').pop() || cleanId;
      dbSlug = f.slug?.stringValue || slugifyStr(artistName);
      artistFound = true;
    }
  } catch (err) {
    console.warn("Serverless Metadata direct artist fetch failed:", err);
  }

  if (!artistFound && cleanId) {
    // Scan 'artists' collection to match sluggified name or slug field
    try {
      const artistsListUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/artists?pageSize=100`;
      const artistsRes = await fetch(artistsListUrl);
      if (artistsRes.ok) {
        const data = await artistsRes.json();
        const docs = data.documents || [];
        for (const doc of docs) {
          const f = doc.fields || {};
          const docId = doc.name.split('/').pop() || '';
          const aName = f.name?.stringValue || f.artistName?.stringValue || '';
          const aGenre = f.genre?.stringValue || f.mainGenre?.stringValue || '';
          const aCity = f.city?.stringValue || '';
          const aSlug = f.slug?.stringValue || slugifyStr(aName);
          
          if (docId.toLowerCase() === cleanIdLower || aSlug.toLowerCase() === cleanIdLower || slugifyStr(aName) === cleanIdLower) {
            resolvedUserId = docId;
            artistName = aName || artistName;
            genre = aGenre || genre;
            city = aCity || city;
            dbSlug = aSlug;
            artistFound = true;
            break;
          }
        }
      }
    } catch (err) {
      console.warn("Serverless Metadata collection scan failed:", err);
    }
  }

  if (!artistFound && cleanId) {
    // Try scanning 'users' collection too
    try {
      const usersListUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/users?pageSize=100`;
      const usersRes = await fetch(usersListUrl);
      if (usersRes.ok) {
        const data = await usersRes.json();
        const docs = data.documents || [];
        for (const doc of docs) {
          const f = doc.fields || {};
          const docId = doc.name.split('/').pop() || '';
          const uName = f.name?.stringValue || f.artistName?.stringValue || '';
          const uGenre = f.genre?.stringValue || f.mainGenre?.stringValue || '';
          const uCity = f.city?.stringValue || '';
          const uSlug = f.slug?.stringValue || slugifyStr(uName);
          
          if (docId.toLowerCase() === cleanIdLower || uSlug.toLowerCase() === cleanIdLower || slugifyStr(uName) === cleanIdLower) {
            resolvedUserId = docId;
            artistName = uName || artistName;
            genre = uGenre || genre;
            city = uCity || city;
            dbSlug = uSlug;
            artistFound = true;
            break;
          }
        }
      }
    } catch (err) {
      console.warn("Serverless Metadata user collection scan failed:", err);
    }
  }

  const cleanSlug = dbSlug || slugifyStr(artistName);

  // 2. Fetch global sharing image configured in settings/shareCard
  let ogImageToUse = "https://www.soundrive.com.br/favicon.svg"; 
  try {
    const cardUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/settings/shareCard`;
    const cardRes = await fetch(cardUrl);
    if (cardRes.ok) {
      const doc = await cardRes.json();
      const f = doc.fields || {};
      const imgUrl = f.ogImageUrl?.stringValue;
      if (imgUrl) {
        const updatedAtStr = f.updatedAt?.timestampValue || doc.updateTime || new Date().toISOString();
        const version = encodeURIComponent(String(updatedAtStr).replace(/[^a-zA-Z0-9]/g, ""));
        ogImageToUse = imgUrl.includes("?") ? `${imgUrl}&v=${version}` : `${imgUrl}?v=${version}`;
      }
    }
  } catch (fErr) {
    console.warn("Serverless Metadata could not fetch global share card:", fErr);
  }

  const ogUrlToUse = `https://www.soundrive.com.br/${type}/${cleanSlug}`;
  const formattedName = artistName.trim();

  // Try multiple fallback locations to find index.html reliably on Vercel or any serverless runtime
  const possiblePaths = [
    path.join(process.cwd(), 'dist', 'index.html'),
    path.join(process.cwd(), 'index.html'),
    path.join(__dirname, '..', 'dist', 'index.html'),
    path.join(__dirname, '..', 'index.html'),
    path.join('/var/task', 'dist', 'index.html'),
    path.join('/var/task', 'index.html')
  ];

  let htmlContents = "";
  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        htmlContents = fs.readFileSync(p, 'utf8');
        break;
      }
    } catch (e) {}
  }

  // Double fallback in case of strict read locks
  if (!htmlContents) {
    htmlContents = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Soundrive</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="shortcut icon" href="/favicon.svg" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
  }

  // Clear static/stale properties systematically
  htmlContents = htmlContents
    .replace(/<title>.*?<\/title>/gi, "")
    .replace(/<meta\s+[^>]*name=["']description["'][^>]*\/?>/gi, "")
    .replace(/<meta\s+[^>]*property=["']og:.*?["'][^>]*\/?>/gi, "")
    .replace(/<meta\s+[^>]*name=["']twitter:.*?["'][^>]*\/?>/gi, "");

  const ogPayload = `
  <!-- Dynamic Custom Soundrive OG Sharing Metadata -->
  <title>Catálogo musical de ${formattedName} | Soundrive</title>
  <meta name="description" content="Ouça o repertório autoral e as composições disponíveis no Soundrive." />
  <meta property="og:title" content="Catálogo musical de ${formattedName} | Soundrive" />
  <meta property="og:description" content="Ouça o repertório autoral e as composições disponíveis no Soundrive." />
  <meta property="og:image" content="${ogImageToUse}" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${ogUrlToUse}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Soundrive" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Catálogo musical de ${formattedName} | Soundrive" />
  <meta name="twitter:description" content="Ouça o repertório autoral e as composições disponíveis no Soundrive." />
  <meta name="twitter:image" content="${ogImageToUse}" />
`;

  if (htmlContents.includes("</head>")) {
    htmlContents = htmlContents.replace("</head>", `${ogPayload}\n</head>`);
  } else {
    htmlContents = htmlContents.replace("<head>", `<head>\n${ogPayload}`);
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.status(200).send(htmlContents);
}
