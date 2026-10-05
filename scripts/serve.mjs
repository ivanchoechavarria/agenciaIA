#!/usr/bin/env node
// Servidor local estático (sin dependencias). El sitio usa rutas desde la raíz (/assets/...),
// por eso no funciona abriendo index.html con doble clic; usa este servidor.
//
//   node scripts/serve.mjs                                  → sitio fuente en http://localhost:5500/
//   node scripts/serve.mjs --dir dist --prefix /agenciaIA   → prueba la versión "staging" tal como se verá en GitHub Pages
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, resolve, extname, normalize } from "node:path";

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const dir = resolve(flag("--dir", "."));
let prefix = flag("--prefix", "");
// Git Bash (Windows) convierte "/nombre" en "C:/Program Files/Git/nombre": nos quedamos con el último tramo.
if (/^[A-Za-z]:/.test(prefix)) prefix = "/" + prefix.split("/").pop();
if (prefix && !prefix.startsWith("/")) prefix = "/" + prefix;
prefix = prefix.replace(/\/$/, "");
const port = Number(flag("--port", 5500));

const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8", ".ico": "image/x-icon" };
const hidden = /(^|[\\/])(\.git|\.claude|\.env|docs|node_modules|scripts)([\\/]|$)/;

createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (prefix) {
    if (!p.startsWith(prefix)) { res.writeHead(302, { Location: prefix + "/" }).end(); return; }
    p = p.slice(prefix.length) || "/";
  }
  let file = normalize(join(dir, p));
  if (!file.startsWith(dir) || hidden.test(file.slice(dir.length))) { res.writeHead(403).end("403"); return; }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file)) {
    const nf = join(dir, "404.html");
    res.writeHead(404, { "Content-Type": types[".html"] }).end(existsSync(nf) ? readFileSync(nf) : "404");
    return;
  }
  res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream", "Cache-Control": "no-store" }).end(readFileSync(file));
}).listen(port, () => console.log(`Sirviendo ${dir} en http://localhost:${port}${prefix}/`));
