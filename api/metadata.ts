import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

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

const getBase64Image = async (url: string): Promise<string> => {
  if (!url) return "";
  try {
    const res = await fetch(url);
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const contentType = res.headers.get('content-type') || 'image/jpeg';
      return `data:${contentType};base64,${base64}`;
    }
  } catch (err) {
    console.warn("Base64 image fetch failed for URL:", url, err);
  }
  return "";
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
          profileImageUrl: f.profileImageUrl?.stringValue || f.avatarUrl?.stringValue || f.photoURL?.stringValue || "",
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
          customCardImageUrl: f.customCardImageUrl?.stringValue || f.coverUrl?.stringValue || f.avatarUrl?.stringValue || "",
          profileImageUrl: f.profileImageUrl?.stringValue || f.avatarUrl?.stringValue || f.photoURL?.stringValue || "",
          slug: f.slug?.stringValue || slug
        };
      }
    }
  } catch (err) {
    console.warn("REST queryUserBySlug failed:", err);
  }
  return null;
};

const fetchArtistRest = async (idOrSlug: string): Promise<{ userId: string; name: string; genre: string; city: string; customCardImageUrl: string; profileImageUrl: string; slug: string }> => {
  let name = "Compositor";
  let genre = "Música Sertaneja";
  let city = "Brasil";
  let customCardImageUrl = "";
  let profileImageUrl = "";
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
      profileImageUrl: globalCover,
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
      customCardImageUrl = f.customCardImageUrl?.stringValue || f.coverUrl?.stringValue || "";
      profileImageUrl = f.profileImageUrl?.stringValue || f.avatarUrl?.stringValue || f.photoURL?.stringValue || "";
      resolvedUserId = doc.name.split('/').pop() || cleanId;
      dbSlug = f.slug?.stringValue || slugifyStr(name);
      return { userId: resolvedUserId, name, genre, city, customCardImageUrl, profileImageUrl, slug: dbSlug };
    }
  } catch (err) {
    console.warn("Direct artist fetch failed, trying query.");
  }

  // 2. Query artists collection by slug
  const artResult = await queryArtistBySlug(cleanIdLower);
  if (artResult) {
    return artResult;
  }

  // 3. Query users collection by slug
  const userResult = await queryUserBySlug(cleanIdLower);
  if (userResult) {
    return userResult;
  }

  return { userId: idOrSlug, name, genre, city, customCardImageUrl, profileImageUrl, slug: idOrSlug };
};

const queryRepertoireBySlug = async (ownerUid: string, slug: string) => {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents:runQuery`;
    const body = {
      structuredQuery: {
        from: [{ collectionId: "repertoires" }],
        where: {
          compositeFilter: {
            op: "AND",
            filters: [
              {
                fieldFilter: {
                  field: { fieldPath: "ownerUid" },
                  op: "EQUAL",
                  value: { stringValue: ownerUid }
                }
              },
              {
                fieldFilter: {
                  field: { fieldPath: "slug" },
                  op: "EQUAL",
                  value: { stringValue: slug }
                }
              }
            ]
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
        const trackIdsArray = f.trackIds?.arrayValue?.values || f.orderedTrackIds?.arrayValue?.values || [];
        return {
          id: docId,
          name: f.name?.stringValue || "Pasta Compartilhada",
          slug: f.slug?.stringValue || slug,
          trackCount: trackIdsArray.length
        };
      }
    }
  } catch (err) {
    console.warn("REST queryRepertoireBySlug failed:", err);
  }
  return null;
};

const fetchRepertoireById = async (repertoireId: string) => {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/repertoires/${repertoireId}`;
    const res = await fetch(url);
    if (res.ok) {
      const doc = await res.json();
      const f = doc.fields || {};
      const docId = doc.name.split('/').pop() || '';
      const trackIdsArray = f.trackIds?.arrayValue?.values || f.orderedTrackIds?.arrayValue?.values || [];
      return {
        id: docId,
        name: f.name?.stringValue || "Pasta Compartilhada",
        slug: f.slug?.stringValue || "",
        trackCount: trackIdsArray.length
      };
    }
  } catch (err) {
    console.warn("Direct repertoire fetch failed:", err);
  }
  return null;
};

export default async function handler(req: any, res: any) {
  const { slug, repertoireId, image } = req.query || {};
  const slugStr = typeof slug === 'string' ? slug.trim() : 'somdrive';
  const repertoireIdStr = typeof repertoireId === 'string' ? repertoireId.trim() : '';
  const isImageRequest = typeof image === 'string' && (image === 'true' || image === '1');

  console.log(`[API Metadata] Processing request. Slug: ${slugStr}, Repertoire: ${repertoireIdStr}, Image: ${isImageRequest}`);

  const userAgent = (req.headers['user-agent'] || '').toLowerCase();
  const isCrawler = /bot|crawl|spider|facebookexternalhit|whatsapp|telegram|slack|twitter|linkedin|embed/i.test(userAgent);

  try {
    // 1. Fetch artist details
    const artist = await fetchArtistRest(slugStr);
    let repertoire: { id: string; name: string; slug: string; trackCount: number } | null = null;

    if (repertoireIdStr) {
      // Try to fetch repertoire by ID directly
      repertoire = await fetchRepertoireById(repertoireIdStr);
      // If direct fetch fails and it's a slug, query by ownerUid and slug
      if (!repertoire) {
        repertoire = await queryRepertoireBySlug(artist.userId, repertoireIdStr);
      }
    }

    // 2. Non-crawler & Non-image request -> Redirect visitors to the SPA public paths
    if (!isCrawler && !isImageRequest) {
      const redirectLocation = repertoireIdStr 
        ? `/catalogo/${slugStr}/repertorio/${repertoireIdStr}`
        : `/catalogo/${slugStr}`;
      res.writeHead(302, {
        Location: redirectLocation
      });
      return res.end();
    }

    // 3. Image Request -> Generate and render the physical CD/Vinyl card
    if (isImageRequest) {
      const cleanName = escapeXml((artist.name || "Compositor").trim().toUpperCase());
      const cleanGenre = escapeXml((artist.genre || "Música Sertaneja").trim());
      const cleanCity = escapeXml((artist.city || "Brasil").trim());

      let resolvedCoverUrl = artist.customCardImageUrl || artist.profileImageUrl || "";
      if (!resolvedCoverUrl) {
        // Only use the global share card for the root/general index; never fall back to another artist's cover for custom profiles
        if (slugStr === "somdrive" || slugStr === "default" || slugStr === "global") {
          try {
            const globalCard = await fetchGlobalShareCardRest();
            if (globalCard && globalCard.ogImageUrl) {
              resolvedCoverUrl = globalCard.ogImageUrl;
            }
          } catch {}
        }
        if (!resolvedCoverUrl) {
          resolvedCoverUrl = "https://www.somdrive.com.br/somdrive-player-artwork-512.png";
        }
      }

      // Convert images to Base64 to ensure sharp handles them flawlessly
      const cleanCardImageUrl = resolvedCoverUrl ? await getBase64Image(resolvedCoverUrl) : "";
      const cleanProfileImageUrl = artist.profileImageUrl 
        ? await getBase64Image(artist.profileImageUrl) 
        : await getBase64Image("https://www.somdrive.com.br/somdrive-player-artwork-512.png");

      let subtitle = "";
      if (cleanGenre && cleanCity) {
        subtitle = `${cleanGenre} &#8226; ${cleanCity}`;
      } else if (cleanGenre) {
        subtitle = cleanGenre;
      } else if (cleanCity) {
        subtitle = cleanCity;
      } else {
        subtitle = "Catálogo de Músicas";
      }

      let pillText = "CATÁLOGO OFICIAL";
      let mainTitle = "Ouça minhas composições";
      let composerText = cleanName;
      let descText = subtitle;
      const isRepertoire = !!repertoire;

      if (repertoire) {
        pillText = "PASTA DE MÚSICAS";
        mainTitle = escapeXml((repertoire.name || "Pasta Compartilhada").trim().toUpperCase());
        if (mainTitle.length > 24) {
          mainTitle = mainTitle.substring(0, 23) + "...";
        }
        composerText = `por ${cleanName}`;
        descText = `${repertoire.trackCount} ${repertoire.trackCount === 1 ? 'MÚSICA AUTORAL' : 'MÚSICAS AUTORAIS'} \u2022 ${cleanGenre}`;
      }

      const initialLetter = escapeXml((repertoire ? (repertoire.name || "P") : (artist.name || "S")).trim().substring(0, 1).toUpperCase());

      // Premium visual layout SVG matching exact guidelines
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <style type="text/css"><![CDATA[
      .title-text {
        font-family: 'Space Grotesk', -apple-system, sans-serif;
        font-weight: 850;
        fill: #F5F7FA;
      }
      .sub-text {
        font-family: -apple-system, sans-serif;
        font-weight: 600;
        fill: #9AA6B2;
      }
      .logo-text {
        font-family: 'Space Grotesk', -apple-system, sans-serif;
        font-weight: 800;
        fill: #F5F7FA;
        letter-spacing: 3px;
      }
      .footer-text {
        font-family: -apple-system, sans-serif;
        font-weight: 600;
        fill: #1ED760;
        letter-spacing: 1.5px;
      }
    ]]></style>
    
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#07111F" />
      <stop offset="60%" stop-color="#0B1628" />
      <stop offset="100%" stop-color="#101C2F" />
    </linearGradient>
    
    <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#79D32E" />
      <stop offset="45%" stop-color="#1DB954" />
      <stop offset="100%" stop-color="#118F35" />
    </linearGradient>

    <linearGradient id="button-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1ed760" />
      <stop offset="100%" stop-color="#00e676" />
    </linearGradient>

    <clipPath id="card-rounded">
      <rect x="510" y="115" width="340" height="400" rx="16" ry="16" />
    </clipPath>

    <clipPath id="vinyl-center-clip">
      <circle cx="930" cy="315" r="45" />
    </clipPath>

    <linearGradient id="sleeve-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#101C2F" />
      <stop offset="50%" stop-color="#0B1628" />
      <stop offset="100%" stop-color="#07111F" />
    </linearGradient>

    <linearGradient id="vinyl-label-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0fa958" />
      <stop offset="100%" stop-color="#07111F" />
    </linearGradient>
    
    <linearGradient id="vinyl-gold-shine" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08" />
      <stop offset="35%" stop-color="#1ed760" stop-opacity="0.03" />
      <stop offset="65%" stop-color="#ffffff" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#1ed760" stop-opacity="0.12" />
    </linearGradient>

    <linearGradient id="glow-border" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1ed760" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#0fa958" stop-opacity="0.2" />
    </linearGradient>
    
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#000000" flood-opacity="0.75"/>
    </filter>
  </defs>

  <rect width="1200" height="630" fill="url(#bg-gradient)" />
  
  <circle cx="200" cy="150" r="450" fill="#1ed760" opacity="0.06" filter="blur(70px)" />
  <circle cx="1000" cy="315" r="500" fill="#00e676" opacity="0.08" filter="blur(90px)" />
  <circle cx="600" cy="500" r="300" fill="#79D32E" opacity="0.03" filter="blur(60px)" />

  <g filter="url(#shadow)">
    <circle cx="930" cy="315" r="192" fill="#07111F" stroke="#22344A" stroke-width="2.5" />
    
    <circle cx="930" cy="315" r="182" stroke="#22344A" stroke-width="0.75" fill="none" opacity="0.75" />
    <circle cx="930" cy="315" r="172" stroke="#07111F" stroke-width="1.25" fill="none" opacity="0.5" />
    <circle cx="930" cy="315" r="162" stroke="#22344A" stroke-width="0.5" fill="none" opacity="0.7" />
    <circle cx="930" cy="315" r="152" stroke="#22344A" stroke-width="1" fill="none" opacity="0.45" />
    <circle cx="930" cy="315" r="142" stroke="#22344A" stroke-width="0.5" fill="none" opacity="0.6" />
    <circle cx="930" cy="315" r="132" stroke="#07111F" stroke-width="1.25" fill="none" opacity="0.4" />
    <circle cx="930" cy="315" r="122" stroke="#22344A" stroke-width="0.8" fill="none" opacity="0.6" />
    <circle cx="930" cy="315" r="112" stroke="#22344A" stroke-width="1.5" fill="none" opacity="0.4" />
    <circle cx="930" cy="315" r="102" stroke="#07111F" stroke-width="0.5" fill="none" opacity="0.5" />
    <circle cx="930" cy="315" r="92" stroke="#07111F" stroke-width="0.75" fill="none" opacity="0.5" />
    <circle cx="930" cy="315" r="82" stroke="#22344A" stroke-width="1" fill="none" opacity="0.4" />

    <path d="M 930 315 L 1115 440 A 192 192 0 0 0 1122 315 Z" fill="url(#vinyl-gold-shine)" opacity="0.35" />
    <path d="M 930 315 L 745 190 A 192 192 0 0 0 738 315 Z" fill="url(#vinyl-gold-shine)" opacity="0.35" />

    <circle cx="930" cy="315" r="66" fill="url(#vinyl-label-grad)" stroke="url(#gold-gradient)" stroke-width="2" />
    <circle cx="930" cy="315" r="58" stroke="#1D2A35" stroke-width="0.8" fill="none" />
    <circle cx="930" cy="315" r="52" stroke="url(#gold-gradient)" stroke-width="1" fill="none" opacity="0.35" stroke-dasharray="3,3" />
    
    ${cleanProfileImageUrl ? `
    <g clip-path="url(#vinyl-center-clip)">
      <image href="${cleanProfileImageUrl}" x="885" y="270" width="90" height="90" preserveAspectRatio="xMidYMid slice" />
    </g>
    <circle cx="930" cy="315" r="45" fill="none" stroke="url(#gold-gradient)" stroke-width="1.5" />
    ` : `
    <circle cx="930" cy="315" r="28" fill="#04020a" stroke="url(#gold-gradient)" stroke-width="1" />
    <text x="930" y="324" text-anchor="middle" font-family="'Space Grotesk', -apple-system, sans-serif" font-weight="700" fill="url(#gold-gradient)" font-size="24" letter-spacing="0.5">${initialLetter}</text>
    `}
    
    <circle cx="930" cy="315" r="8" fill="#020104" stroke="#475569" stroke-width="1.2" />
  </g>

  <g filter="url(#shadow)">
    <rect x="510" y="115" width="340" height="400" rx="16" fill="url(#sleeve-grad)" stroke="url(#glow-border)" stroke-width="1.8" />
    
    ${cleanCardImageUrl ? `
    <image href="${cleanCardImageUrl}" x="510" y="115" width="340" height="400" preserveAspectRatio="xMidYMid slice" clip-path="url(#card-rounded)" />
    <rect x="510" y="115" width="340" height="400" rx="16" fill="none" stroke="url(#glow-border)" stroke-width="1.8" />
    ` : `
    <rect x="532" y="137" width="296" height="356" rx="10" stroke="#1ed760" stroke-width="1" fill="none" opacity="0.15" />
    <rect x="544" y="149" width="272" height="332" rx="6" stroke="#1ed760" stroke-width="1.2" fill="none" opacity="0.1" stroke-dasharray="8,4" />
    
    <g transform="translate(620, 240)" opacity="0.2">
      <line x1="0" y1="60" x2="120" y2="60" stroke="#ffffff" stroke-width="2" />
      <line x1="10" y1="10" x2="10" y2="110" stroke="#ffffff" stroke-width="1" />
      <line x1="40" y1="20" x2="40" y2="100" stroke="#ffffff" stroke-width="3" />
      <line x1="70" y1="30" x2="70" y2="90" stroke="#ffffff" stroke-width="1.5" />
      <line x1="100" y1="0" x2="100" y2="120" stroke="#ffffff" stroke-width="2" />
    </g>

    <text x="680" y="340" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="120" stroke="url(#gold-gradient)" stroke-width="1.5" fill="none" opacity="0.12">${initialLetter}</text>
    `}

    <text x="680" y="455" text-anchor="middle" font-family="-apple-system, sans-serif" font-weight="800" font-size="9" fill="#9AA6B2" letter-spacing="3px" opacity="0.5">EXCLUSIVE DIGITAL AUDIO</text>
    <text x="680" y="468" text-anchor="middle" font-family="-apple-system, sans-serif" font-weight="600" font-size="8" fill="#1ed760" letter-spacing="1.5px" opacity="0.6">SOMDRIVE COLLECTOR SERIES</text>
  </g>

  <g transform="translate(100, 85)">
    <rect x="0" y="5" width="4" height="22" rx="2" fill="url(#gold-gradient)" />
    <rect x="8" y="0" width="4" height="32" rx="2" fill="url(#gold-gradient)" />
    <rect x="16" y="8" width="4" height="16" rx="2" fill="url(#gold-gradient)" />
    <text x="32" y="22" class="logo-text" font-size="20">SOMDRIVE</text>
  </g>

  <g transform="translate(100, 150)">
    <g transform="translate(0, 0)">
      <rect width="${isRepertoire ? 210 : 180}" height="30" rx="15" fill="#1ed760" fill-opacity="0.12" stroke="#1ed760" stroke-width="1" />
      <circle cx="18" cy="15" r="4.5" fill="#1ed760" />
      <text x="30" y="19" font-family="-apple-system, sans-serif" font-size="10" font-weight="800" fill="#1ed760" letter-spacing="1">${pillText}</text>
    </g>

    <g transform="translate(${isRepertoire ? 225 : 195}, 0)">
      <rect width="125" height="30" rx="15" fill="#79D32E" fill-opacity="0.12" stroke="#79D32E" stroke-width="1.2" />
      <path d="M 12 14 L 15 17 L 21 11" stroke="#79D32E" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(4, 0)" />
      <text x="32" y="19" font-family="-apple-system, sans-serif" font-size="10" font-weight="800" fill="#79D32E" letter-spacing="1">${isRepertoire ? 'PLAYLIST' : 'VERIFICADO'}</text>
    </g>

    <text x="0" y="90" font-family="'Space Grotesk', -apple-system, sans-serif" font-weight="850" font-size="${isRepertoire ? 38 : 44}" fill="#ffffff" letter-spacing="-1px">${mainTitle}</text>

    <text x="0" y="165" class="title-text" font-size="${isRepertoire ? 46 : 52}" font-weight="850" filter="url(#shadow)" letter-spacing="-1">${composerText}</text>

    <text x="0" y="215" class="sub-text" font-size="20" fill="${isRepertoire ? '#1ed760' : '#9AA6B2'}">${descText}</text>

    <g transform="translate(0, 270)" filter="url(#shadow)">
      <rect width="250" height="52" rx="26" fill="url(#button-grad)" />
      <polygon points="36,19 36,33 48,26" fill="#031108" />
      <text x="60" y="31" font-family="-apple-system, sans-serif" font-weight="800" fill="#031108" font-size="13" letter-spacing="1">ACESSE E ESCUTE</text>
    </g>
  </g>

  <g transform="translate(100, 545)">
    <line x1="0" y1="0" x2="350" y2="0" stroke="#1D2A35" stroke-width="1.5" />
    <text x="0" y="26" class="footer-text" font-size="13">somdrive.com.br</text>
  </g>
</svg>`;

      try {
        const buffer = await sharp(Buffer.from(svgContent)).png().toBuffer();
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
        return res.status(200).send(buffer);
      } catch (sharpErr) {
        console.error("Sharp PNG generation fell back to SVG:", sharpErr);
        res.setHeader("Content-Type", "image/svg+xml");
        res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
        return res.status(200).send(svgContent);
      }
    }

    // 4. Crawler HTML head payload metatags generation
    const host = req.headers.host || "www.somdrive.com.br";
    const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
    const appBaseUrl = `${protocol}://${host}`;

    let titleText = "";
    let descText = "";
    let canonicalUrl = "";
    const artistSlug = artist.slug || artist.userId;

    if (repertoire) {
      titleText = `${repertoire.name} — ${artist.name} | SomDrive`;
      descText = `Ouça este repertório com ${repertoire.trackCount} faixas no SomDrive.`;
      canonicalUrl = `${appBaseUrl}/s/${artistSlug}/repertorio/${repertoire.slug || repertoire.id}`;
    } else {
      titleText = `Catálogo musical de ${artist.name} | SomDrive`;
      descText = `Ouça as músicas e repertórios de ${artist.name}.`;
      canonicalUrl = `${appBaseUrl}/s/${artistSlug}`;
    }

    // Direct dynamic image url on our api
    const ogImageToUse = `${appBaseUrl}/api/metadata?slug=${artistSlug}${repertoire ? `&repertoireId=${repertoire.slug || repertoire.id}` : ''}&image=true`;

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

    // Pristine metadata purging to avoid any double tags
    htmlContents = htmlContents
      .replace(/<title>.*?<\/title>/gi, "")
      .replace(/<meta\s+[^>]*name\s*=\s*["']?description["']?[^>]*\/?>/gi, "")
      .replace(/<meta\s+[^>]*property\s*=\s*["']?og:[^"'\s>]*["']?[^>]*\/?>/gi, "")
      .replace(/<meta\s+[^>]*name\s*=\s*["']?twitter:[^"'\s>]*["']?[^>]*\/?>/gi, "");

    const ogPayload = `
    <!-- Dynamic Custom SomDrive OG Sharing Metadata -->
    <title>${escapeXml(titleText)}</title>
    <meta name="description" content="${escapeXml(descText)}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeXml(titleText)}" />
    <meta property="og:description" content="${escapeXml(descText)}" />
    <meta property="og:image" content="${escapeXml(ogImageToUse)}" />
    <meta property="og:image:secure_url" content="${escapeXml(ogImageToUse)}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="${escapeXml(canonicalUrl)}" />
    <meta property="og:site_name" content="SomDrive" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeXml(titleText)}" />
    <meta name="twitter:description" content="${escapeXml(descText)}" />
    <meta name="twitter:image" content="${escapeXml(ogImageToUse)}" />
    <link rel="image_src" href="${escapeXml(ogImageToUse)}" />
    <meta itemprop="image" content="${escapeXml(ogImageToUse)}" />
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
