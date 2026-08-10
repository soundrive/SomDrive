import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const CANONICAL_DOMAIN = "https://www.somdrive.com.br";

export async function generateSitemapXml(): Promise<{ xml: string; stats: { totalUrls: number } }> {
  // SOMDRIVE OFFICIAL PRIVACY RULE:
  // Catalogs, profiles, repertoires, and tracks are shared privately via link and MUST NOT be indexed or listed in sitemap.xml.
  // The sitemap contains ONLY institutional public pages (the Home page).
  const urlEntries: string[] = [
    `${CANONICAL_DOMAIN}/`
  ];

  const urlsXml = urlEntries
    .map(url => `  <url>\n    <loc>${url}</loc>\n  </url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlsXml}\n</urlset>`;

  return {
    xml,
    stats: {
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
