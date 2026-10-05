#!/usr/bin/env node
// Genera la carpeta dist/ lista para publicar. Solo copia lo listado en site.config.json ("include"),
// así docs/, .claude/, .env y el resto del repositorio nunca llegan al servidor.
//
//   node scripts/build.mjs --target production
//   node scripts/build.mjs --target staging --base /agenciaIA/
//
// staging  → GitHub Pages (URL de pruebas): reescribe rutas a la subcarpeta del repo, bloquea buscadores
//            (noindex + robots.txt) y añade un aviso "Entorno de pruebas".
// production → copia tal cual (Hostinger, dominio propio en la raíz).
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, cpSync, readdirSync, statSync } from "node:fs";
import { join, resolve, extname } from "node:path";

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const target = flag("--target", "production");
const out = resolve(flag("--out", "dist"));
let base = flag("--base", "/");
// Git Bash (Windows) convierte "/nombre/" en "C:/Program Files/Git/nombre/": nos quedamos con el último tramo.
if (/^[A-Za-z]:/.test(base)) base = "/" + base.replace(/\/+$/, "").split("/").pop() + "/";
if (!base.startsWith("/")) base = "/" + base;
if (!base.endsWith("/")) base += "/";
if (!["staging", "production"].includes(target)) { console.error("--target debe ser staging o production"); process.exit(1); }

const root = process.cwd();
const config = JSON.parse(readFileSync(join(root, "site.config.json"), "utf8"));

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const missing = [];
for (const item of config.include) {
  const src = join(root, item);
  if (!existsSync(src)) { missing.push(item); continue; }
  cpSync(src, join(out, item), { recursive: true });
}
for (const ex of config.exclude || []) rmSync(join(out, ex), { recursive: true, force: true });
if (missing.length) console.warn("Aviso: no existen y se omiten →", missing.join(", "));
for (const must of ["index.html", "404.html"]) {
  if (!existsSync(join(out, must))) { console.error(`Falta ${must}; el sitio no está completo.`); process.exit(1); }
}

function walk(dir, acc = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    statSync(p).isDirectory() ? walk(p, acc) : acc.push(p);
  }
  return acc;
}

if (target === "staging") {
  const banner = '<div aria-hidden="true" style="position:fixed;left:12px;bottom:12px;z-index:9999;pointer-events:none;background:#E8AE4D;color:#1a1204;font:600 12px/1 Inter,Arial,sans-serif;padding:8px 11px;border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,.35)">Entorno de pruebas · no es el sitio público</div>';
  for (const f of walk(out).filter((p) => extname(p) === ".html")) {
    let h = readFileSync(f, "utf8");
    // 1) rutas desde la raíz → subcarpeta del repositorio (GitHub Pages de proyecto)
    h = h.replace(/\b(href|src|poster)="\/(?!\/)/g, `$1="${base}`);
    // 2) bloquear indexación del entorno de pruebas
    h = h.replace(/<meta name="robots"[^>]*>\s*/i, "");
    h = h.replace(/<link rel="canonical"[^>]*>\s*/gi, "").replace(/<link rel="alternate" hreflang[^>]*>\s*/gi, "");
    h = h.replace(/<head>/i, '<head>\n<meta name="robots" content="noindex, nofollow">');
    // 3) aviso visible
    h = h.replace(/<\/body>/i, banner + "\n</body>");
    writeFileSync(f, h);
  }
  writeFileSync(join(out, "robots.txt"), "User-agent: *\nDisallow: /\n");
  for (const f of ["sitemap.xml", ".htaccess"]) rmSync(join(out, f), { force: true });
  writeFileSync(join(out, ".nojekyll"), "");
} else {
  // Comprobación de seguridad: producción no debe llevar rastros del entorno de pruebas
  const bad = walk(out).filter((p) => /\.(html|css|js|xml|txt)$/.test(p)).filter((p) => /github\.io|Entorno de pruebas/.test(readFileSync(p, "utf8")));
  if (bad.length) { console.error("Producción contiene referencias de pruebas en:\n" + bad.join("\n")); process.exit(1); }
}

const files = walk(out);
const kb = files.reduce((s, f) => s + statSync(f).size, 0) / 1024;
console.log(`Build ${target} → ${out}\n  archivos: ${files.length} · ${kb.toFixed(0)} KB${target === "staging" ? ` · base ${base}` : ""}`);
