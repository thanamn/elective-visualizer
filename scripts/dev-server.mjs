import { watch } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

const root = process.cwd();
const siteDirectory = path.join(root, "site");
const host = process.env.HOST || "127.0.0.1";
const requestedPort = Number(process.env.PORT || 4173);
const port = Number.isInteger(requestedPort) && requestedPort > 0 && requestedPort <= 65535
  ? requestedPort
  : 4173;

const routes = new Map([
  ["/", { file: "site/index.html", type: "text/html; charset=utf-8", html: true }],
  ["/index.html", { file: "site/index.html", type: "text/html; charset=utf-8", html: true }],
  ["/2-2568/", { file: "site/2-2568/index.html", type: "text/html; charset=utf-8", html: true }],
  ["/2-2568/index.html", { file: "site/2-2568/index.html", type: "text/html; charset=utf-8", html: true }],
  ["/elective_latest.json", { file: "elective_latest.json", type: "application/json; charset=utf-8" }],
  ["/elective_1_2569.json", { file: "elective_1_2569.json", type: "application/json; charset=utf-8" }],
]);

const siteContentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
]);

const reloadClients = new Set();
const reloadScript = `
  <script>
    new EventSource("/__dev_events").onmessage = () => window.location.reload();
  </script>
`;

function resolveSiteRoute(pathname) {
  const relativePath = pathname.slice(1);
  if (!relativePath || relativePath.includes("\\")) return null;

  const segments = relativePath.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === ".." || segment.startsWith("."))) {
    return null;
  }

  const type = siteContentTypes.get(path.extname(relativePath).toLowerCase());
  if (!type) return null;

  const file = path.resolve(siteDirectory, ...segments);
  const sitePrefix = `${path.resolve(siteDirectory)}${path.sep}`;
  if (!file.startsWith(sitePrefix)) return null;
  return { file, type, absolute: true };
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${host}:${port}`);
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Bad request");
    return;
  }

  if (pathname === "/site" || pathname === "/site/") {
    response.writeHead(302, { Location: "/" });
    response.end();
    return;
  }

  if (pathname === "/1-2569" || pathname === "/1-2569/" || pathname === "/1-2569/index.html") {
    response.writeHead(302, { Location: "/" });
    response.end();
    return;
  }

  if (pathname === "/2-2568") {
    response.writeHead(302, { Location: "/2-2568/" });
    response.end();
    return;
  }

  if (pathname === "/__dev_events") {
    response.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    response.write("retry: 500\n\n");
    reloadClients.add(response);
    request.on("close", () => reloadClients.delete(response));
    return;
  }

  const route = routes.get(pathname) || resolveSiteRoute(pathname);
  if (!route) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  try {
    let body = await readFile(route.absolute ? route.file : path.join(root, route.file));
    if (route.html) {
      body = Buffer.from(
        body.toString("utf8").replace("</body>", `${reloadScript}</body>`),
        "utf8",
      );
    }

    response.writeHead(200, {
      "Content-Type": route.type,
      "Cache-Control": "no-store",
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch (error) {
    const missing = error?.code === "ENOENT" || error?.code === "ENOTDIR";
    response.writeHead(missing ? 404 : 500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(missing ? "Not found" : "Could not read the requested file");
  }
});

let reloadTimer;
function scheduleReload() {
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => {
    reloadClients.forEach((client) => client.write("data: reload\n\n"));
  }, 80);
}

const watchers = [
  watch(siteDirectory, { recursive: true }, scheduleReload),
  watch(path.join(root, "elective_latest.json"), scheduleReload),
  watch(path.join(root, "elective_1_2569.json"), scheduleReload),
];

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Try: $env:PORT=4174; npm run dev`);
    process.exitCode = 1;
    return;
  }
  throw error;
});

server.listen(port, host, () => {
  console.log(`Elective Explorer ready at http://${host}:${port}`);
  console.log("Site and data changes reload automatically. Press Ctrl+C to stop.");
});

function shutDown() {
  watchers.forEach((watcher) => watcher.close());
  reloadClients.forEach((client) => client.end());
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutDown);
process.on("SIGTERM", shutDown);
