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
      resolvedUserId = doc.name.split('/').pop() || cleanId;
      dbSlug = f.slug?.stringValue || slugifyStr(artistName);
      artistFound = true;
    }
  } catch (err) {
    console.warn("Direct artist fetch failed in debug-html:", err);
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
          const aSlug = f.slug?.stringValue || slugifyStr(aName);
          
          if (docId.toLowerCase() === cleanIdLower || aSlug.toLowerCase() === cleanIdLower || slugifyStr(aName) === cleanIdLower) {
            resolvedUserId = docId;
            artistName = aName || artistName;
            dbSlug = aSlug;
            artistFound = true;
            break;
          }
        }
      }
    } catch (err) {
      console.warn("Collection scan failed in debug-html:", err);
    }
  }

  const cleanSlug = dbSlug || slugifyStr(artistName);

  let ogImageUrl = "https://www.soundrive.com.br/favicon.svg";
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
        ogImageUrl = imgUrl.includes("?") ? `${imgUrl}&v=${version}` : `${imgUrl}?v=${version}`;
      }
    }
  } catch (fErr) {}

  const ogUrl = `https://www.soundrive.com.br/catalogo/${cleanSlug}`;

  const headContent = `<!-- Open Graph Tags parsed by crawler for slug '${slug}' -->
<title>Catálogo musical de ${artistName.trim()} | Soundrive</title>
<meta name="description" content="Ouça o repertório autoral e as composições disponíveis no Soundrive." />
<meta property="og:title" content="Catálogo musical de ${artistName.trim()} | Soundrive" />
<meta property="og:description" content="Ouça o repertório autoral e as composições disponíveis no Soundrive." />
<meta property="og:image" content="${ogImageUrl}" />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="${ogUrl}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Soundrive" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Catálogo musical de ${artistName.trim()} | Soundrive" />
<meta name="twitter:description" content="Ouça o repertório autoral e as composições disponíveis no Soundrive." />
<meta name="twitter:image" content="${ogImageUrl}" />`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  return res.status(200).send(headContent.trim());
}
