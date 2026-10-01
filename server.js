import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

// The server can access the example and framework folders.
const projectRoot = process.cwd();
const root = join(projectRoot, "example");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };

// A different port can be given with the PORT environment variable.
const port = Number(process.env.PORT) || 4173;

createServer(async (request, response) => {
  try {
    // Turn the requested URL into a safe local file path.
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const base = pathname.startsWith("/framework/") ? projectRoot : root;
    let file = normalize(join(base, pathname));

    // Do not allow a URL to reach files outside the project.
    if (!file.startsWith(base)) throw new Error("Invalid path");
    if ((await stat(file).catch(() => null))?.isDirectory()) file = join(file, "index.html");

    // Unknown paths use index.html so browser routes still work after refresh.
    const data = await readFile(file).catch(() => readFile(join(root, "index.html")));
    response.writeHead(200, { "Content-Type": types[extname(file)] || "text/html; charset=utf-8" });
    response.end(data);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}).listen(port, () => console.log(`Dot demo: http://localhost:${port}`));
