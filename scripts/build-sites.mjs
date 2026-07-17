import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outputDirectory = path.join(root, "dist", "server");
const assetDefinitions = [
  { route: "/", file: "site/index.html", type: "text/html; charset=utf-8", dynamicHtml: true },
  { route: "/style.css", file: "site/style.css", type: "text/css; charset=utf-8" },
  { route: "/js/app.js", file: "site/js/app.js", type: "text/javascript; charset=utf-8" },
  { route: "/elective_latest.json", file: "elective_latest.json", type: "application/json; charset=utf-8", noStore: true },
  { route: "/og.png", file: "site/og.png", type: "image/png" },
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
