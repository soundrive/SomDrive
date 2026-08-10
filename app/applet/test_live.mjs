async function testLiveDomain() {
  console.log("=== 1. TESTANDO IMAGENS PÚBLICAS NO DOMÍNIO REAL ===");
  const images = [
    "somdrive-player-96.png",
    "somdrive-player-192.png",
    "somdrive-player-512.png",
    "favicon.ico",
    "favicon-32x32.png",
    "apple-touch-icon.png",
    "android-chrome-192x192.png"
  ];

  for (const img of images) {
    const url = "https://www.somdrive.com.br/" + img;
    try {
      const res = await fetch(url, { redirect: "manual" });
      const status = res.status;
      const contentType = res.headers.get("content-type");
      const cacheControl = res.headers.get("cache-control");
      const etag = res.headers.get("etag");
      const xVercelCache = res.headers.get("x-vercel-cache");
      const buf = Buffer.from(await res.arrayBuffer());
      const hexHeader = buf.subarray(0, 8).toString("hex").toUpperCase();
      const isPng = hexHeader === "89504E470D0A1A0A";
      const str = buf.toString("utf8");
      const isHtml = str.includes("<!DOCTYPE html") || str.includes("<html");

      console.log("\nURL: " + url);
      console.log("- Status: " + status);
      console.log("- Content-Type: " + contentType);
      console.log("- Cache-Control: " + cacheControl);
      console.log("- x-vercel-cache: " + xVercelCache);
      console.log("- Size: " + buf.length + " bytes");
      console.log("- Hex Header: " + hexHeader);
      console.log("- Valid PNG? " + isPng);
      console.log("- Is HTML? " + isHtml);
      if (isHtml) {
        console.log("- HTML Snippet:", str.substring(0, 200).replace(/\n/g, " "));
      }
    } catch (e) {
      console.log("Error fetching " + url + ": " + e.message);
    }
  }

  console.log("\n=== 2. TESTANDO SITEMAP REAL ===");
  try {
    const res = await fetch("https://www.somdrive.com.br/sitemap.xml");
    console.log("Sitemap Status: " + res.status);
    console.log("Content-Type: " + res.headers.get("content-type"));
    const text = await res.text();
    console.log("Sitemap Body:\n" + text);
  } catch (e) {
    console.log("Error sitemap: " + e.message);
  }

  console.log("\n=== 3. TESTANDO SEO DA HOME REAL ===");
  try {
    const res = await fetch("https://www.somdrive.com.br/");
    const html = await res.text();
    console.log("Home Status: " + res.status);
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
    const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["'](.*?)["']/i);
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i);
    const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i);
    const robotsMatch = html.match(/<meta\s+name=["']robots["']\s+content=["'](.*?)["']/i);

    console.log("- Title: " + (titleMatch ? titleMatch[1] : "N/A"));
    console.log("- Meta Description: " + (descMatch ? descMatch[1] : "N/A"));
    console.log("- Canonical: " + (canonicalMatch ? canonicalMatch[1] : "N/A"));
    console.log("- OG Title: " + (ogTitleMatch ? ogTitleMatch[1] : "N/A"));
    console.log("- OG Description: " + (ogDescMatch ? ogDescMatch[1] : "N/A"));
    console.log("- Robots: " + (robotsMatch ? robotsMatch[1] : "N/A"));
  } catch (e) {
    console.log("Error home: " + e.message);
  }

  console.log("\n=== 4. TESTANDO NOINDEX EM CATÁLOGO REAL E REPERTÓRIO REAL ===");
  const catalogUrls = [
    "https://www.somdrive.com.br/s/somdrive",
    "https://www.somdrive.com.br/catalogo/somdrive"
  ];
  for (const cUrl of catalogUrls) {
    try {
      const res = await fetch(cUrl);
      const html = await res.text();
      console.log("\nCatalog URL: " + cUrl);
      console.log("Status: " + res.status);
      const robotsMatch = html.match(/<meta\s+name=["']robots["']\s+content=["'](.*?)["']/i);
      const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["'](.*?)["']/i);
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      console.log("- Robots: " + (robotsMatch ? robotsMatch[1] : "N/A"));
      console.log("- Canonical: " + (canonicalMatch ? canonicalMatch[1] : "N/A"));
      console.log("- Title: " + (titleMatch ? titleMatch[1] : "N/A"));
    } catch (e) {
      console.log("Error " + cUrl + ": " + e.message);
    }
  }

  console.log("\n=== 5. TESTANDO REDIRECIONAMENTO DO CONVERSOR ===");
  try {
    const res = await fetch("https://www.somdrive.com.br/conversor", { redirect: "manual" });
    console.log("Conversor Status: " + res.status);
    console.log("Location Header: " + res.headers.get("location"));
  } catch (e) {
    console.log("Error conversor: " + e.message);
  }
}

testLiveDomain();
