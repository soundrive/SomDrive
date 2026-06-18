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

const queryArtistBySlug = async (slug: string) => {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents:runQuery`;
    const body = {
      structuredQuery: {
        from: [{ collectionId: "artists" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "slug" },
            op: "EQUAL",
            value: { stringValue: slug }
          }
        },
        limit: 1
      }
    };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      const qResult = await res.json();
      if (Array.isArray(qResult) && qResult.length > 0 && qResult[0].document) {
        const doc = qResult[0].document;
        const f = doc.fields || {};
        const docId = doc.name.split('/').pop() || '';
        return {
          userId: docId,
          name: f.name?.stringValue || f.artistName?.stringValue || "",
          genre: f.genre?.stringValue || f.mainGenre?.stringValue || "",
          city: f.city?.stringValue || "",
          customCardImageUrl: f.customCardImageUrl?.stringValue || f.coverUrl?.stringValue || "",
          slug: f.slug?.stringValue || slug
        };
      }
    }
  } catch (err) {
    console.warn("REST queryArtistBySlug failed:", err);
  }
  return null;
};

const queryUserBySlug = async (slug: string) => {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents:runQuery`;
    const body = {
      structuredQuery: {
        from: [{ collectionId: "users" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "slug" },
            op: "EQUAL",
            value: { stringValue: slug }
          }
        },
        limit: 1
      }
    };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      const qResult = await res.json();
      if (Array.isArray(qResult) && qResult.length > 0 && qResult[0].document) {
        const doc = qResult[0].document;
        const f = doc.fields || {};
        const docId = doc.name.split('/').pop() || '';
        return {
          userId: docId,
          name: f.name?.stringValue || f.artistName?.stringValue || "",
          genre: f.genre?.stringValue || f.mainGenre?.stringValue || "",
          city: f.city?.stringValue || "",
          customCardImageUrl: f.customCardImageUrl?.stringValue || f.coverUrl?.stringValue || "",
          slug: f.slug?.stringValue || slug
        };
      }
    }
  } catch (err) {
    console.warn("REST queryUserBySlug failed:", err);
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

  // 1. Direct document fetch by ID (if it's a UID)
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
    console.warn("Direct artist fetch failed, will try structured query.");
  }

  // 3. Query 'artists' collection by slug (structured runQuery - NO scanning!)
  const artResult = await queryArtistBySlug(cleanIdLower);
  if (artResult) {
    return artResult;
  }

  // 4. Query 'users' collection by slug (structured runQuery - NO scanning!)
  const userResult = await queryUserBySlug(cleanIdLower);
  if (userResult) {
    return userResult;
  }

  return { userId: idOrSlug, name, genre, city, customCardImageUrl, slug: idOrSlug };
};

export default async function handler(req: any, res: any) {
  const { slug } = req.query || {};
  const slugStr = typeof slug === 'string' ? slug.trim() : 'somdrive';

  console.log(`[API Metadata] Processing OG request for slug: ${slugStr}`);

  const userAgent = (req.headers['user-agent'] || '').toLowerCase();
  const isCrawler = /bot|crawl|spider|facebookexternalhit|whatsapp|telegram|slack|twitter|linkedin|embed/i.test(userAgent);

  // 5. Depois de localizar o artista (ou para visitantes de navegador real), direcionar para o catálogo público
  if (!isCrawler) {
    res.writeHead(302, { Location: `/catalogo/${slugStr}` });
    return res.end();
  }

  try {
    // 1. Fetch artist details
    const artist = await fetchArtistRest(slugStr);
    let formattedName = artist.name || "Compositor";

    if (formattedName === "Compositor") {
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
      ogImageToUse = "https://www.somdrive.com.br/somdrive-player-artwork-512.png";
    }

    let ogImageSecureToUse = ogImageToUse;
    if (ogImageSecureToUse.startsWith("http://")) {
      ogImageSecureToUse = ogImageSecureToUse.replace("http://", "https://");
    }

    // 3. Resolve the canonical og:url
    const ogUrlToUse = `https://www.somdrive.com.br/s/${slugStr}`;

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
  } catch (err) {
    console.warn("Metadata handler failed, serving fallback redirect:", err);
    const fallbackHTML = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="0; url=/catalogo/${slugStr}" />
    <script>
      window.location.href = "/catalogo/${slugStr}";
    </script>
    <title>SomDrive - Redirecionando...</title>
  </head>
  <body>
    Redirecionando para o catálogo de ${slugStr}...
  </body>
</html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(fallbackHTML);
  }
}
