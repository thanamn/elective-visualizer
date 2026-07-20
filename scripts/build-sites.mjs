import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outputDirectory = path.join(root, "dist", "server");
const assetDefinitions = [
  { route: "/", file: "site/index.html", type: "text/html; charset=utf-8", dynamicHtml: true },
  { route: "/2-2568/", file: "site/2-2568/index.html", type: "text/html; charset=utf-8", dynamicHtml: true },
  { route: "/style.css", file: "site/style.css", type: "text/css; charset=utf-8" },
  { route: "/js/app.js", file: "site/js/app.js", type: "text/javascript; charset=utf-8" },
  { route: "/js/semester-2-2568.js", file: "site/js/semester-2-2568.js", type: "text/javascript; charset=utf-8" },
  { route: "/js/semester-1-2569.js", file: "site/js/semester-1-2569.js", type: "text/javascript; charset=utf-8" },
  { route: "/elective_latest.json", file: "elective_latest.json", type: "application/json; charset=utf-8", noStore: true },
  { route: "/elective_1_2569.json", file: "elective_1_2569.json", type: "application/json; charset=utf-8", noStore: true },
  { route: "/favicon.png", file: "site/favicon.png", type: "image/png" },
  { route: "/og.png", file: "site/og.png", type: "image/png" },
  { route: "/assets/company-logos/chulalongkorn-university.png", file: "site/assets/company-logos/chulalongkorn-university.png", type: "image/png" },
  { route: "/assets/company-logos/accenture.svg", file: "site/assets/company-logos/accenture.svg", type: "image/svg+xml" },
  { route: "/assets/company-logos/the-monk-studios.png", file: "site/assets/company-logos/the-monk-studios.png", type: "image/png" },
  { route: "/assets/company-logos/bgrimm-power.svg", file: "site/assets/company-logos/bgrimm-power.svg", type: "image/svg+xml" },
  { route: "/assets/company-logos/playtorium.png", file: "site/assets/company-logos/playtorium.png", type: "image/png" },
  { route: "/assets/company-logos/relearn-solution.jpg", file: "site/assets/company-logos/relearn-solution.jpg", type: "image/jpeg" },
  { route: "/assets/company-logos/huawei.png", file: "site/assets/company-logos/huawei.png", type: "image/png" },
  { route: "/assets/company-logos/acis.png", file: "site/assets/company-logos/acis.png", type: "image/png" },
  { route: "/assets/company-logos/attra-inter-group.png", file: "site/assets/company-logos/attra-inter-group.png", type: "image/png" },
  { route: "/assets/company-logos/pttgc.svg", file: "site/assets/company-logos/pttgc.svg", type: "image/svg+xml" },
  { route: "/assets/company-logos/sea-bridge.png", file: "site/assets/company-logos/sea-bridge.png", type: "image/png" },
  { route: "/assets/company-logos/look-alive-studio.jpg", file: "site/assets/company-logos/look-alive-studio.jpg", type: "image/jpeg" },
  { route: "/assets/company-logos/kmutt.png", file: "site/assets/company-logos/kmutt.png", type: "image/png" },
  { route: "/assets/company-logos/stelligence.png", file: "site/assets/company-logos/stelligence.png", type: "image/png" },
  { route: "/assets/company-logos/fintech-thailand.png", file: "site/assets/company-logos/fintech-thailand.png", type: "image/png" },
  { route: "/assets/company-logos/sense-info-tech.png", file: "site/assets/company-logos/sense-info-tech.png", type: "image/png" },
  { route: "/assets/company-logos/greenmoons.png", file: "site/assets/company-logos/greenmoons.png", type: "image/png" },
  { route: "/assets/company-logos/nipa-cloud.svg", file: "site/assets/company-logos/nipa-cloud.svg", type: "image/svg+xml" },
  { route: "/assets/company-logos/demeter-ict.png", file: "site/assets/company-logos/demeter-ict.png", type: "image/png" },
  { route: "/assets/company-logos/nida.svg", file: "site/assets/company-logos/nida.svg", type: "image/svg+xml" },
];

await rm(path.join(root, "dist"), { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

const assets = {};
for (const definition of assetDefinitions) {
  const bytes = await readFile(path.join(root, definition.file));
  assets[definition.route] = {
    data: bytes.toString("base64"),
    type: definition.type,
    dynamicHtml: Boolean(definition.dynamicHtml),
    noStore: Boolean(definition.noStore),
  };
}

assets["/index.html"] = assets["/"];
assets["/2-2568/index.html"] = assets["/2-2568/"];

const workerSource = `const ASSETS = ${JSON.stringify(assets)};

const SECURITY_HEADERS = {
  "Content-Security-Policy": "default-src 'self'; connect-src 'self' https://raw.githubusercontent.com; img-src 'self' data:; style-src 'self'; script-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY"
};

function decodeBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function responseHeaders(asset) {
  return {
    ...SECURITY_HEADERS,
    "Content-Type": asset.type,
    "Cache-Control": asset.noStore
      ? "no-store"
      : asset.dynamicHtml
        ? "no-cache"
        : "public, max-age=3600"
  };
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    let pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      return new Response("Bad request", { status: 400, headers: SECURITY_HEADERS });
    }

    if (pathname === "/site" || pathname === "/site/") {
      return Response.redirect(new URL("/", url), 301);
    }

    if (pathname === "/1-2569" || pathname === "/1-2569/" || pathname === "/1-2569/index.html") {
      return Response.redirect(new URL("/", url), 301);
    }

    if (pathname === "/2-2568") {
      return Response.redirect(new URL("/2-2568/", url), 301);
    }

    const asset = ASSETS[pathname];
    if (!asset) {
      return new Response("Not found", { status: 404, headers: SECURITY_HEADERS });
    }

    let body = decodeBase64(asset.data);
    if (asset.dynamicHtml) {
      const origin = url.origin;
      const html = new TextDecoder().decode(body)
        .replaceAll("https://thanamn.github.io/elective-visualizer/og.png", \`\${origin}/og.png\`)
        .replaceAll("https://thanamn.github.io/elective-visualizer/", \`\${origin}/\`);
      body = new TextEncoder().encode(html);
    }

    return new Response(request.method === "HEAD" ? null : body, {
      status: 200,
      headers: responseHeaders(asset)
    });
  }
};
`;

await writeFile(path.join(outputDirectory, "index.js"), workerSource);
console.log(`Built ${Object.keys(assets).length} routes in dist/server/index.js`);
