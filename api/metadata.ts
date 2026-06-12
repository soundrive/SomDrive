import fs from 'fs';
import path from 'path';

const projectId = "gen-lang-client-0946896754";
const databaseId = "ai-studio-656139fd-0f8f-4866-ada1-753533a8c5ff";

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

const fetchGlobalShareCardRest = async (): Promise<{ ogImageUrl: string; ogImageVersion: string; updatedAt: string } | null> => {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/settings/shareCard`;
    const res = await fetch(url);
    if (res.ok) {
      const doc = await res.json();
      const f = doc.fields || {};
      const ogImageUrl = f.ogImageUrl?.stringValue || "";
      const ogImageVersion = f.ogImageVersion?.stringValue || "";
      const updatedAtStr = f.updatedAt?.stringValue || f.updatedAt?.timestampValue || doc.updateTime || new Date().toISOString();
      return {
        ogImageUrl,
        ogImageVersion,
        updatedAt: updatedAtStr
      };
    }
  } catch (err: any) {
    console.warn("REST global share card fetch failed in api/metadata:", err.message || err);
  }
  return null;
};

const fetchArtistRest = async (idOrSlug: string): Promise<{ userId: string; name: string; genre: string; city: string; customCardImageUrl: string; slug: string }> => {
  let name = "Compositor";
  let genre = "Música Sertaneja";
  let city = "Brasil";
  let customCardImageUrl = "";
  let resolvedUserId = idOrSlug;
  let dbSlug = "";

  const cleanId = (idOrSlug || "").trim();
  const cleanIdLower = cleanId.toLowerCase();

  if (cleanIdLower === "default" || cleanIdLower === "global") {
    let globalCover = "";
    try {
      const globalCard = await fetchGlobalShareCardRest();
      if (globalCard && globalCard.ogImageUrl) {
        globalCover = globalCard.ogImageUrl;
      }
    } catch {}
    return {
      userId: "default",
      name: "SOMDRIVE",
      genre: "Divulgue seu Repertório",
      city: "Brasil",
      customCardImageUrl: globalCover,
      slug: "somdrive"
    };
  }

  // First try direct document fetch (if it's a solid UID)
  try {
    const artistUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/artists/${cleanId}`;
    const res = await fetch(artistUrl);
    if (res.ok) {
      const doc = await res.json();
      const f = doc.fields || {};
      name = f.name?.stringValue || f.artistName?.stringValue || name;
      genre = f.genre?.stringValue || f.mainGenre?.stringValue || genre;
      city = f.city?.stringValue || city;
      customCardImageUrl = f.customCardImageUrl?.stringValue || "";
      resolvedUserId = doc.name.split('/').pop() || cleanId;
      dbSlug = f.slug?.stringValue || slugifyStr(name);
      return { userId: resolvedUserId, name, genre, city, customCardImageUrl, slug: dbSlug };
    }
  } catch (err) {
    console.warn("Direct direct artist fetch failed, will try collection scan.");
  }

  // Scan 'artists' collection to match sluggified name or slug field
  try {
    const artistsListUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/artists?pageSize=100`;
    const res = await fetch(artistsListUrl);
    if (res.ok) {
      const data = await res.json();
      const docs = data.documents || [];
      for (const doc of docs) {
        const f = doc.fields || {};
        const docId = doc.name.split('/').pop() || '';
        const artistName = f.name?.stringValue || f.artistName?.stringValue || '';
        const artistGenre = f.genre?.stringValue || f.mainGenre?.stringValue || '';
        const artistCity = f.city?.stringValue || '';
        const artistCustomCardUrl = f.customCardImageUrl?.stringValue || '';
        const artistSlug = f.slug?.stringValue || slugifyStr(artistName);
        
        if (docId.toLowerCase() === cleanIdLower || artistSlug.toLowerCase() === cleanIdLower || slugifyStr(artistName) === cleanIdLower) {
          return {
            userId: docId,
            name: artistName || name,
            genre: artistGenre || genre,
            city: artistCity || city,
            customCardImageUrl: artistCustomCardUrl,
            slug: artistSlug
          };
        }
      }
    }
  } catch (err) {
    console.warn("REST artists collection matching failed:", err);
  }

  // Try scanning 'users' collection too
  try {
    const usersListUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/users?pageSize=100`;
    const res = await fetch(usersListUrl);
    if (res.ok) {
      const data = await res.json();
      const docs = data.documents || [];
      for (const doc of docs) {
        const f = doc.fields || {};
        const docId = doc.name.split('/').pop() || '';
        const userName = f.name?.stringValue || f.artistName?.stringValue || '';
        const userGenre = f.genre?.stringValue || f.mainGenre?.stringValue || '';
        const userCity = f.city?.stringValue || '';
        const userCustomCardUrl = f.customCardImageUrl?.stringValue || '';
        const userSlug = f.slug?.stringValue || slugifyStr(userName);

        if (docId.toLowerCase() === cleanIdLower || userSlug.toLowerCase() === cleanIdLower || slugifyStr(userName) === cleanIdLower) {
          return {
            userId: docId,
            name: userName || name,
            genre: userGenre || genre,
            city: userCity || city,
            customCardImageUrl: userCustomCardUrl,
            slug: userSlug
          };
        }
      }
    }
  } catch (err) {
    console.warn("REST users collection matching failed:", err);
  }

  return { userId: idOrSlug, name, genre, city, customCardImageUrl, slug: idOrSlug };
};

export default async function handler(req: any, res: any) {
  const { slug } = req.query || {};
  const slugStr = typeof slug === 'string' ? slug : 'ze-quirino';

  console.log(`[API Metadata] Processing OG request for slug: ${slugStr}`);

  // 1. Fetch artist details
  const artist = await fetchArtistRest(slugStr);
  let formattedName = artist.name || "Compositor";

  if (slugStr === "ze-quirino") {
    formattedName = "Zé Quirino";
  } else if (formattedName === "Compositor") {
    // Fallback to title casing the slug (e.g. joao-silva -> Joao Silva)
    formattedName = slugStr
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  formattedName = formattedName.trim();

  // 2. Fetch global share card background
  let ogImageToUse = "";
  try {
    const shareCard = await fetchGlobalShareCardRest();
    if (shareCard && shareCard.ogImageUrl && shareCard.ogImageUrl.trim() !== "") {
      ogImageToUse = shareCard.ogImageUrl.trim();
    }
  } catch (err) {
    console.warn("Error fetching shareCard in metadata serverless:", err);
  }

  if (!ogImageToUse) {
    ogImageToUse = "https://pub-dda3bc59b7224a77a905ceeef207d9c8.r2.dev/settings/shareCard.png";
  }

  let ogImageSecureToUse = ogImageToUse;
  if (ogImageSecureToUse.startsWith("http://")) {
    ogImageSecureToUse = ogImageSecureToUse.replace("http://", "https://");
  }

  // 3. Resolve the canonical og:url
  const ogUrlToUse = slugStr === "ze-quirino" ? "https://www.somdrive.com.br/s/ze-quirino" : `https://www.somdrive.com.br/s/${slugStr}`;

  // 4. Try loading the template file index.html
  let htmlContents = "";
  try {
    const possiblePaths = [
      path.join(process.cwd(), 'dist', 'index.html'),
      path.join(process.cwd(), 'index.html'),
    ];
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        htmlContents = fs.readFileSync(p, 'utf8');
        break;
      }
    }
  } catch (err) {
    console.warn("Error reading template in serverless:", err);
  }

  if (!htmlContents) {
    // Elegant fallback template matching the static index.html structure
    htmlContents = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SomDrive</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="shortcut icon" href="/favicon.svg" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
  }

  // Clean static/existing elements completely to prevent duplicates
  htmlContents = htmlContents
    .replace(/<title>.*?<\/title>/gi, "")
    .replace(/<meta\s+[^>]*name\s*=\s*["']?description["']?[^>]*\/?>/gi, "")
    .replace(/<meta\s+[^>]*property\s*=\s*["']?og:[^"'\s>]*["']?[^>]*\/?>/gi, "")
    .replace(/<meta\s+[^>]*name\s*=\s*["']?twitter:[^"'\s>]*["']?[^>]*\/?>/gi, "");

  const ogPayload = `
  <!-- Dynamic Custom SomDrive OG Sharing Metadata -->
  <title>Catálogo musical de ${formattedName} | SomDrive</title>
  <meta name="description" content="Ouça músicas e composições compartilhadas pelo artista." />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="SomDrive - Catálogo Musical" />
  <meta property="og:description" content="Ouça músicas e composições compartilhadas pelo artista." />
  <meta property="og:image" content="${ogImageToUse}" />
  <meta property="og:image:secure_url" content="${ogImageSecureToUse}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${ogUrlToUse}" />
  <meta property="og:site_name" content="SomDrive" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="SomDrive - Catálogo Musical" />
  <meta name="twitter:description" content="Ouça músicas e composições compartilhadas pelo artista." />
  <meta name="twitter:image" content="${ogImageToUse}" />
  <link rel="image_src" href="${ogImageToUse}" />
  <meta itemprop="image" content="${ogImageToUse}" />
`;

  if (htmlContents.includes("</head>")) {
    htmlContents = htmlContents.replace("</head>", `${ogPayload}\n</head>`);
  } else {
    htmlContents = htmlContents.replace("<head>", `<head>\n${ogPayload}`);
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(htmlContents);
}
