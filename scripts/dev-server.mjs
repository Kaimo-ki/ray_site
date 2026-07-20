import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const port = Number(process.env.PORT || 8765);
const root = path.resolve(process.cwd());
const basePath = "/ray_site/";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".cmd": "text/plain; charset=utf-8",
  ".ps1": "text/plain; charset=utf-8",
  ".zip": "application/zip"
};

const send = (response, status, body, headers = {}) => {
  response.writeHead(status, headers);
  response.end(body);
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://127.0.0.1:${port}`);
    let pathname = decodeURIComponent(url.pathname);

    if (pathname === "/") {
      response.writeHead(302, { Location: basePath });
      response.end();
      return;
    }

    if (!pathname.startsWith(basePath)) {
      send(response, 404, "Not found");
      return;
    }

    let relativePath = pathname.slice(basePath.length) || "index.html";
    if (relativePath.endsWith("/")) relativePath += "index.html";

    let target = path.resolve(root, relativePath);
    if (!target.startsWith(root)) {
      send(response, 403, "Forbidden");
      return;
    }

    const fileStat = await stat(target);
    if (fileStat.isDirectory()) {
      target = path.join(target, "index.html");
    }

    const body = await readFile(target);
    const type = contentTypes[path.extname(target).toLowerCase()] || "application/octet-stream";
    send(response, 200, body, {
      "Content-Type": type,
      "Cache-Control": "no-store"
    });
  } catch {
    send(response, 404, "Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Ray Web local server: http://127.0.0.1:${port}${basePath}`);
});
