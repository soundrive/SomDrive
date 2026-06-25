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
          profileImageUrl: f.avatarUrl?.stringValue || f.photoURL?.stringValue || f.profileImageUrl?.stringValue || f.photoUrl?.stringValue || "",
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
          profileImageUrl: f.avatarUrl?.stringValue || f.photoURL?.stringValue || f.profileImageUrl?.stringValue || f.photoUrl?.stringValue || "",
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

  if (cleanIdLower === "default" || cleanIdLower === "global" || cleanIdLower === "somdrive") {
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

  // 1. Direct document fetch by ID from artists collection
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
      profileImageUrl = f.avatarUrl?.stringValue || f.photoURL?.stringValue || f.profileImageUrl?.stringValue || f.photoUrl?.stringValue || "";
      resolvedUserId = doc.name.split('/').pop() || cleanId;
      dbSlug = f.slug?.stringValue || slugifyStr(name);
      return { userId: resolvedUserId, name, genre, city, customCardImageUrl, profileImageUrl, slug: dbSlug };
    }
  } catch {}

  // 2. Direct document fetch by ID from users collection
  try {
    const userUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/users/${cleanId}`;
    const res = await fetch(userUrl);
    if (res.ok) {
      const doc = await res.json();
      const f = doc.fields || {};
      name = f.name?.stringValue || f.artistName?.stringValue || name;
      genre = f.genre?.stringValue || f.mainGenre?.stringValue || genre;
      city = f.city?.stringValue || city;
      customCardImageUrl = f.customCardImageUrl?.stringValue || f.coverUrl?.stringValue || "";
      profileImageUrl = f.avatarUrl?.stringValue || f.photoURL?.stringValue || f.profileImageUrl?.stringValue || f.photoUrl?.stringValue || "";
      resolvedUserId = doc.name.split('/').pop() || cleanId;
      dbSlug = f.slug?.stringValue || slugifyStr(name);

      // Attempt auxiliary fetch to artists sub-doc to see if there are overrides
      try {
        const artUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/artists/${resolvedUserId}`;
        const artRes = await fetch(artUrl);
        if (artRes.ok) {
          const ad = await artRes.json();
          const af = ad.fields || {};
          name = af.name?.stringValue || af.artistName?.stringValue || name;
          genre = af.genre?.stringValue || af.mainGenre?.stringValue || genre;
          city = af.city?.stringValue || city;
          customCardImageUrl = af.customCardImageUrl?.stringValue || af.coverUrl?.stringValue || customCardImageUrl;
          profileImageUrl = af.avatarUrl?.stringValue || af.photoURL?.stringValue || af.profileImageUrl?.stringValue || af.photoUrl?.stringValue || profileImageUrl;
          dbSlug = af.slug?.stringValue || dbSlug;
        }
      } catch {}

      return { userId: resolvedUserId, name, genre, city, customCardImageUrl, profileImageUrl, slug: dbSlug };
    }
  } catch {}

  // 3. Query artists collection by slug
  const artResult = await queryArtistBySlug(cleanIdLower);
  if (artResult) {
    return artResult;
  }

  // 4. Query users collection by slug
  const userResult = await queryUserBySlug(cleanIdLower);
  if (userResult) {
    // Attempt auxiliary fetch to artists sub-doc to see if there are overrides
    try {
      const artUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/artists/${userResult.userId}`;
      const artRes = await fetch(artUrl);
      if (artRes.ok) {
        const ad = await artRes.json();
        const af = ad.fields || {};
        userResult.name = af.name?.stringValue || af.artistName?.stringValue || userResult.name;
        userResult.genre = af.genre?.stringValue || af.mainGenre?.stringValue || userResult.genre;
        userResult.city = af.city?.stringValue || city;
        userResult.customCardImageUrl = af.customCardImageUrl?.stringValue || af.coverUrl?.stringValue || userResult.customCardImageUrl;
        userResult.profileImageUrl = af.avatarUrl?.stringValue || af.photoURL?.stringValue || af.profileImageUrl?.stringValue || af.photoUrl?.stringValue || userResult.profileImageUrl;
        userResult.slug = af.slug?.stringValue || userResult.slug;
      }
    } catch {}
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
              },
              {
                fieldFilter: {
                  field: { fieldPath: "visibility" },
                  op: "IN",
                  value: {
                    arrayValue: {
                      values: [
                        { stringValue: "public" },
                        { stringValue: "active" },
                        { stringValue: "unlisted" }
                      ]
                    }
                  }
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

function getCategoryIconSvg(index: number, color: string): string {
  const idx = index >= 0 ? index % 8 : 0;
  switch (idx) {
    case 0:
      // Sertanejo: Music Note
      return `<g transform="scale(2.2) translate(-12, -12)">
        <path d="M9 18V5l12-2v13" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <circle cx="6" cy="18" r="3" stroke="${color}" stroke-width="2.5" fill="none"/>
        <circle cx="18" cy="16" r="3" stroke="${color}" stroke-width="2.5" fill="none"/>
      </g>`;
    case 1:
      // Românticas: Star
      return `<g transform="scale(2.2) translate(-12, -12)">
        <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </g>`;
    case 2:
      // Inéditas: Heart
      return `<g transform="scale(2.2) translate(-12, -12)">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </g>`;
    case 3:
      // Participações: Mic
      return `<g transform="scale(2.2) translate(-12, -12)">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 19v4M8 23h8" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </g>`;
    case 4:
      // Modão: Guitar
      return `<g transform="scale(2.2) translate(-12, -12)">
        <path d="m16 9.5 3-3M17.5 11l3-3M12.5 13H15M8.5 16.5C7.5 16.5 6 15 6 13.5c0-1.5 2-3 4-3s4.5.5 4.5 2.5-2 3.5-6 3.5Z" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M14.5 10.5 21 4" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </g>`;
    case 5:
      // Trabalhos: Playlist Lines
      return `<g transform="scale(2.2) translate(-12, -12)">
        <path d="M3 10h11M3 6h18M3 14h11" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M17 14v6" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <circle cx="15" cy="20" r="2" stroke="${color}" stroke-width="2.5" fill="none"/>
      </g>`;
    case 6:
      // Ao Vivo: Flame
      return `<g transform="scale(2.2) translate(-12, -12)">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </g>`;
    default:
      // Outros: Ellipsis (three dots)
      return `<g transform="scale(2.2) translate(-12, -12)">
        <circle cx="12" cy="12" r="1.5" stroke="${color}" stroke-width="2.5" fill="${color}"/>
        <circle cx="19" cy="12" r="1.5" stroke="${color}" stroke-width="2.5" fill="${color}"/>
        <circle cx="5" cy="12" r="1.5" stroke="${color}" stroke-width="2.5" fill="${color}"/>
      </g>`;
  }
}

const queryAllRepertoiresByArtist = async (ownerUid: string) => {
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
                  field: { fieldPath: "visibility" },
                  op: "IN",
                  value: {
                    arrayValue: {
                      values: [
                        { stringValue: "public" },
                        { stringValue: "active" },
                        { stringValue: "unlisted" }
                      ]
                    }
                  }
                }
              }
            ]
          }
        }
      }
    };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      const qResult = await res.json();
      const list: any[] = [];
      if (Array.isArray(qResult)) {
        for (const item of qResult) {
          if (item.document) {
            const doc = item.document;
            const f = doc.fields || {};
            const docId = doc.name.split('/').pop() || '';
            const trackIdsArray = f.trackIds?.arrayValue?.values || f.orderedTrackIds?.arrayValue?.values || [];
            list.push({
              id: docId,
              name: f.name?.stringValue || "Pasta Compartilhada",
              slug: f.slug?.stringValue || "",
              visibility: f.visibility?.stringValue || "",
              trackCount: trackIdsArray.length
            });
          }
        }
      }
      return list;
    }
  } catch (err) {
    console.warn("REST queryAllRepertoiresByArtist failed:", err);
  }
  return [];
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
    let repertoire: { id: string; name: string; slug: string; trackCount: number; visibility: string } | null = null;
    let repIndex = 0;

    if (repertoireIdStr) {
      const reps = await queryAllRepertoiresByArtist(artist.userId);
      repertoire = reps.find(r => r.id === repertoireIdStr || (r.slug && r.slug === repertoireIdStr)) || null;

      if (repertoire) {
        const publicList = reps
          .filter(r => r.visibility === "public")
          .sort((a, b) => a.id.localeCompare(b.id));

        const activeList = reps
          .filter(r => r.visibility === "active")
          .sort((a, b) => a.id.localeCompare(b.id));

        const combinedList = [...publicList];

        for (const item of activeList) {
          if (!combinedList.some(r => r.id === item.id)) {
            combinedList.push(item);
          }
        }

        const foundIndex = combinedList.findIndex(
          r =>
            r.id === repertoire!.id ||
            Boolean(r.slug && r.slug === repertoire!.slug)
        );

        repIndex = foundIndex >= 0 ? foundIndex : 0;
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

      const folderColors = ["#1ed760", "#f59e0b", "#3b82f6", "#a855f7", "#06b6d4", "#f97316", "#cbd5e1"];
      const folderColor = folderColors[repIndex % folderColors.length] || "#1ed760";

      let pillText = "CATÁLOGO OFICIAL";
      let mainTitle = "Ouça minhas composições";
      let composerText = cleanName;
      let descText = subtitle;
      const isRepertoire = !!repertoire;

      if (repertoire) {
        pillText = "REPERTÓRIO MUSICAL";
        mainTitle = escapeXml((repertoire.name || "Pasta Compartilhada").trim().toUpperCase());
        if (mainTitle.length > 24) {
          mainTitle = mainTitle.substring(0, 23) + "...";
        }
        composerText = `por ${cleanName}`;
        descText = `${repertoire.trackCount} ${repertoire.trackCount === 1 ? 'MÚSICA' : 'MÚSICAS'}`;
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

    <linearGradient id="button-grad-rep" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${folderColor}" />
      <stop offset="100%" stop-color="${folderColor}" stop-opacity="0.8" />
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
  
  <circle cx="200" cy="150" r="450" fill="${isRepertoire ? folderColor : '#1ed760'}" opacity="0.06" filter="blur(70px)" />
  <circle cx="1000" cy="315" r="500" fill="${isRepertoire ? folderColor : '#00e676'}" opacity="0.08" filter="blur(90px)" />
  <circle cx="600" cy="500" r="300" fill="${isRepertoire ? folderColor : '#79D32E'}" opacity="0.03" filter="blur(60px)" />

  ${isRepertoire ? `
  <!-- REPERTOIRE VIEW: Folder Drawing with dynamic color and icon -->
  <g filter="url(#shadow)">
    <!-- Back flap / Folder Tab -->
    <path d="M 570 145 L 680 145 C 690 145, 695 115, 705 115 L 810 115 C 820 115, 825 145, 835 145 L 970 145 C 985 145, 990 155, 990 170 L 990 440 C 990 455, 985 465, 970 465 L 570 465 C 555 465, 550 455, 550 440 L 550 170 C 550 155, 555 145, 570 145 Z" fill="${folderColor}" opacity="0.15" stroke="${folderColor}" stroke-width="2.5" />
    
    <!-- Back body -->
    <rect x="550" y="150" width="440" height="315" rx="16" fill="${folderColor}" opacity="0.25" stroke="${folderColor}" stroke-width="1.5" />
    
    <!-- Inside papers sticking out -->
    <g opacity="0.8">
      <!-- Paper 1 -->
      <rect x="585" y="125" width="370" height="310" rx="8" fill="#FFFFFF" opacity="0.12" transform="rotate(-1.5, 770, 280)" />
      <!-- Paper 2 -->
      <rect x="590" y="120" width="360" height="310" rx="8" fill="#FFFFFF" opacity="0.18" transform="rotate(1.5, 770, 280)" />
    </g>
    
    <!-- Front flap of the folder -->
    <path d="M 550 195 L 990 195 L 990 455 C 990 465, 980 475, 970 475 L 570 475 C 560 475, 550 465, 550 455 Z" fill="${folderColor}" opacity="0.88" />
    
    <!-- Inner shadow of front flap -->
    <path d="M 550 195 L 990 195 L 990 215 L 550 215 Z" fill="#000000" opacity="0.15" />
    
    <!-- Highlights on folder front flap -->
    <rect x="550" y="195" width="440" height="260" rx="16" fill="none" stroke="#FFFFFF" stroke-width="1.5" opacity="0.12" />
    
    <!-- Main dynamic category icon in the center of the folder's front flap -->
    <g transform="translate(770, 335)">
      ${getCategoryIconSvg(repIndex, "#FFFFFF")}
    </g>
  </g>
  ` : `
  <!-- PROFILE VIEW: Classic sleeve card + vinyl record -->
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
  `}

  <g transform="translate(100, 85)">
    <rect x="0" y="5" width="4" height="22" rx="2" fill="url(#gold-gradient)" />
    <rect x="8" y="0" width="4" height="32" rx="2" fill="url(#gold-gradient)" />
    <rect x="16" y="8" width="4" height="16" rx="2" fill="url(#gold-gradient)" />
    <text x="32" y="22" class="logo-text" font-size="20">SOMDRIVE</text>
  </g>

  <g transform="translate(100, 150)">
    ${isRepertoire ? `
    <!-- REPERTOIRE PILL: Selo neutro -->
    <g transform="translate(0, 0)">
      <rect width="210" height="30" rx="15" fill="${folderColor}" fill-opacity="0.12" stroke="${folderColor}" stroke-width="1.2" />
      <circle cx="18" cy="15" r="4.5" fill="${folderColor}" />
      <text x="32" y="19" font-family="-apple-system, sans-serif" font-size="10" font-weight="800" fill="${folderColor}" letter-spacing="1">REPERTÓRIO MUSICAL</text>
    </g>
    ` : `
    <!-- PROFILE PILLS: Dois selos -->
    <g transform="translate(0, 0)">
      <rect width="180" height="30" rx="15" fill="#1ed760" fill-opacity="0.12" stroke="#1ed760" stroke-width="1" />
      <circle cx="18" cy="15" r="4.5" fill="#1ed760" />
      <text x="30" y="19" font-family="-apple-system, sans-serif" font-size="10" font-weight="800" fill="#1ed760" letter-spacing="1">CATÁLOGO OFICIAL</text>
    </g>

    <g transform="translate(195, 0)">
      <rect width="125" height="30" rx="15" fill="#79D32E" fill-opacity="0.12" stroke="#79D32E" stroke-width="1.2" />
      <path d="M 12 14 L 15 17 L 21 11" stroke="#79D32E" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(4, 0)" />
      <text x="32" y="19" font-family="-apple-system, sans-serif" font-size="10" font-weight="800" fill="#79D32E" letter-spacing="1">VERIFICADO</text>
    </g>
    `}

    <text x="0" y="90" font-family="'Space Grotesk', -apple-system, sans-serif" font-weight="850" font-size="${isRepertoire ? 38 : 44}" fill="#ffffff" letter-spacing="-1px">${mainTitle}</text>

    <text x="0" y="165" class="title-text" font-size="${isRepertoire ? 46 : 52}" font-weight="850" filter="url(#shadow)" letter-spacing="-1">${composerText}</text>

    <text x="0" y="215" class="sub-text" font-size="20" fill="${isRepertoire ? folderColor : '#9AA6B2'}">${descText}</text>

    <g transform="translate(0, 270)" filter="url(#shadow)">
      ${isRepertoire ? `
      <rect width="250" height="52" rx="26" fill="url(#button-grad-rep)" />
      <polygon points="36,19 36,33 48,26" fill="#031108" />
      <text x="60" y="31" font-family="-apple-system, sans-serif" font-weight="800" fill="#031108" font-size="13" letter-spacing="1">OUÇA AGORA</text>
      ` : `
      <rect width="250" height="52" rx="26" fill="url(#button-grad)" />
      <polygon points="36,19 36,33 48,26" fill="#031108" />
      <text x="60" y="31" font-family="-apple-system, sans-serif" font-weight="800" fill="#031108" font-size="13" letter-spacing="1">ACESSE E ESCUTE</text>
      `}
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

    const getObjHash = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash).toString(36);
    };

    const selectedProfileImage = artist.profileImageUrl || "";
    const repertoireState = repertoire
      ? `${repertoire.id}_${repertoire.name}_${repertoire.trackCount}_${repIndex}`
      : "";
    const stateToHash = `${artist.name}_${selectedProfileImage}_${artist.customCardImageUrl || ""}_${repertoireState}`;
    const hashVersion = getObjHash(stateToHash);

    // Point exactly to the api/og source according to guidelines!
    const ogImageToUse = repertoire
      ? `${appBaseUrl}/api/og?type=repertoire&artistSlug=${artistSlug}&repertoireSlug=${repertoire.slug || repertoire.id}&repIndex=${repIndex}&v=${hashVersion}`
      : `${appBaseUrl}/api/og?type=profile&artistSlug=${artistSlug}&v=${hashVersion}`;

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
