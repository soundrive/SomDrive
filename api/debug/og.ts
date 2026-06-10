import fs from 'fs';
import path from 'path';

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

export default async function handler(req: any, res: any) {
  const slug = String(req.query.slug || 'ze-quirino').trim();
  const projectId = "gen-lang-client-0946896754";
  const databaseId = "ai-studio-656139fd-0f8f-4866-ada1-753533a8c5ff";

  let artistName = "Compositor";
  let genre = "Música Sertaneja";
  let city = "Brasil";
  let resolvedUserId = "";
  let dbSlug = "";

  const cleanId = slug;
  const cleanIdLower = cleanId.toLowerCase();

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
    console.warn("Direct artist fetch failed in debug:", err);
  }

  if (!artistFound && cleanId) {
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
      console.warn("Collection scan failed in debug:", err);
    }
  }

  if (!artistFound && cleanId) {
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
      console.warn("User collection scan failed in debug:", err);
    }
  }

  const cleanSlug = dbSlug || slugifyStr(artistName);

  let ogImageUrl = "";
  let finalOgImageUrl = "";
  try {
    const cardUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/settings/shareCard`;
    const cardRes = await fetch(cardUrl);
    if (cardRes.ok) {
      const doc = await cardRes.json();
      const f = doc.fields || {};
      const imgUrl = f.ogImageUrl?.stringValue;
      if (imgUrl) {
        ogImageUrl = imgUrl;
        const updatedAtStr = f.updatedAt?.timestampValue || doc.updateTime || new Date().toISOString();
        const version = encodeURIComponent(String(updatedAtStr).replace(/[^a-zA-Z0-9]/g, ""));
        finalOgImageUrl = imgUrl.includes("?") ? `${imgUrl}&v=${version}` : `${imgUrl}?v=${version}`;
      }
    }
  } catch (fErr) {
    console.warn("Could not fetch shareCard in debug:", fErr);
  }

  const ogUrl = `https://www.soundrive.com.br/catalogo/${cleanSlug}`;

  // Analyze HTML tags from simulated resolution
  const possiblePaths = [
    path.join(process.cwd(), 'dist', 'index.html'),
    path.join(process.cwd(), 'index.html'),
    path.join(__dirname, '..', '..', 'dist', 'index.html'),
    path.join(__dirname, '..', '..', 'index.html'),
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

  if (!htmlContents) {
    htmlContents = `<html><head></head><body></body></html>`;
  }

  // Clear and inject payload like production does
  htmlContents = htmlContents
    .replace(/<title>.*?<\/title>/gi, "")
    .replace(/<meta\s+[^>]*name=["']description["'][^>]*\/?>/gi, "")
    .replace(/<meta\s+[^>]*property=["']og:.*?["'][^>]*\/?>/gi, "")
    .replace(/<meta\s+[^>]*name=["']twitter:.*?["'][^>]*\/?>/gi, "");

  const ogPayload = `
  <title>Catálogo musical de ${artistName.trim()} | Soundrive</title>
  <meta name="description" content="Ouça o repertório autoral e as composições disponíveis no Soundrive." />
  <meta property="og:title" content="Catálogo musical de ${artistName.trim()} | Soundrive" />
  <meta property="og:description" content="Ouça o repertório autoral e as composições disponíveis no Soundrive." />
  <meta property="og:image" content="${finalOgImageUrl || ogImageUrl}" />
  <meta property="og:url" content="${ogUrl}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Catálogo musical de ${artistName.trim()} | Soundrive" />
  <meta name="twitter:description" content="Ouça o repertório autoral e as composições disponíveis no Soundrive." />
  <meta name="twitter:image" content="${finalOgImageUrl || ogImageUrl}" />
`;

  if (htmlContents.includes("</head>")) {
    htmlContents = htmlContents.replace("</head>", `${ogPayload}\n</head>`);
  } else {
    htmlContents = htmlContents.replace("<head>", `<head>\n${ogPayload}`);
  }

  const htmlHasOldImage = /unsplash|show|concert|crowd|plateia/i.test(htmlContents);
  const htmlOgImageCount = (htmlContents.match(/<meta[^>]*property=["']og:image["']/gi) || []).length;
  const htmlTwitterImageCount = (htmlContents.match(/<meta[^>]*name=["']twitter:image["']/gi) || []).length;

  return res.status(200).json({
    slug,
    artistFound,
    artistName,
    ogImageUrl,
    finalOgImageUrl,
    ogUrl,
    htmlHasOldImage,
    htmlOgImageCount,
    htmlTwitterImageCount
  });
}
