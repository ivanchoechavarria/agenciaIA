#!/usr/bin/env node
// Auditoría SEO técnica para el sitio estático (sin dependencias).
// Uso: node .claude/skills/seo-audit/scripts/audit.mjs [--base /] [--json]
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const BASE = flag("--base", "/");
const AS_JSON = args.includes("--json");
const root = resolve(process.cwd());

const findings = [];
const add = (page, level, rule, msg) => findings.push({ page, level, rule, msg });

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    if (f.startsWith(".") || f === "node_modules") continue;
    const p = join(dir, f);
    statSync(p).isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
}
const files = walk(root);
const pages = files.filter((f) => f.endsWith(".html"));
const rel = (p) => relative(root, p).replace(/\\/g, "/");

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i"));
  return m ? (m[2] ?? m[3]) : null;
};
const tags = (html, name) => html.match(new RegExp(`<${name}\\b[^>]*>`, "gi")) || [];
const strip = (s) => s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>|<[^>]+>/gi, " ").replace(/\s+/g, " ").trim();

const meta = {};
const noindexPages = new Set();
for (const file of pages) {
  const page = rel(file);
  const html = readFileSync(file, "utf8");
  const m = (meta[page] = { canonical: null, hreflang: {} });

  // <html lang>
  const lang = (html.match(/<html[^>]*\blang\s*=\s*"([^"]+)"/i) || [])[1];
  if (!lang) add(page, "error", "lang", "Falta atributo lang en <html>.");

  // title
  const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1]?.trim();
  if (!title) add(page, "error", "title", "Falta <title>.");
  else if (title.length < 30 || title.length > 65) add(page, "warn", "title", `Longitud de <title> ${title.length} (ideal 30–60): "${title}"`);

  // meta description
  const mt = tags(html, "meta");
  const getMeta = (key, val) => mt.map((t) => ({ t, k: attr(t, key) })).find((x) => x.k === val)?.t;
  const desc = attr(getMeta("name", "description") || "", "content");
  if (!desc) add(page, "error", "description", "Falta meta description.");
  else if (desc.length < 70 || desc.length > 165) add(page, "warn", "description", `Meta description de ${desc.length} caracteres (ideal 70–160).`);

  // robots / viewport
  const robots = attr(getMeta("name", "robots") || "", "content");
  if (/noindex/i.test(robots || "")) { noindexPages.add(page); add(page, "info", "robots", `Página con noindex (${robots}).`); }
  if (!getMeta("name", "viewport")) add(page, "error", "viewport", "Falta meta viewport.");

  // canonical + hreflang
  const links = tags(html, "link");
  const canon = links.find((l) => attr(l, "rel") === "canonical");
  m.canonical = canon ? attr(canon, "href") : null;
  if (!m.canonical) add(page, "error", "canonical", "Falta enlace canonical.");
  else if (!/^https?:\/\//.test(m.canonical)) add(page, "error", "canonical", "El canonical debe ser URL absoluta.");
  for (const l of links.filter((l) => attr(l, "rel") === "alternate" && attr(l, "hreflang"))) m.hreflang[attr(l, "hreflang")] = attr(l, "href");
  if (Object.keys(m.hreflang).length) {
    for (const need of ["es", "en", "x-default"]) if (!m.hreflang[need]) add(page, "warn", "hreflang", `Falta hreflang="${need}".`);
    if (m.canonical && !Object.values(m.hreflang).includes(m.canonical)) add(page, "warn", "hreflang", "El canonical no aparece entre los hreflang (debe incluirse a sí misma).");
  }

  // Favicon (el ícono junto al resultado en Google): declarado, existente y en tamaños múltiplos de 48
  const iconLinks = links.filter((l) => /(^|\s)(shortcut )?icon(\s|$)/.test(attr(l, "rel") || ""));
  if (!iconLinks.length) add(page, "warn", "favicon", "Sin favicon declarado (<link rel=\"icon\">): Google mostrará un ícono genérico.");
  for (const l of iconLinks) {
    const href = attr(l, "href") || "";
    const local = resolveLocal(href.split("?")[0], file);
    if (local && !existsSync(local)) add(page, "error", "favicon", `El favicon no existe: ${href}`);
    const sz = (attr(l, "sizes") || "").match(/^(\d+)x\1$/);
    if (sz && Number(sz[1]) % 48 !== 0 && !/apple/.test(attr(l, "rel") || "")) add(page, "info", "favicon", `Google recomienda tamaños múltiplos de 48 px; este es ${sz[0]}.`);
  }

  // Open Graph / Twitter
  for (const p of ["og:title", "og:description", "og:url", "og:image", "og:type"]) {
    if (!getMeta("property", p)) add(page, p === "og:image" ? "warn" : "info", "social", `Falta ${p}${p === "og:image" ? " (sin imagen, las vistas previas en redes salen vacías)" : ""}.`);
  }
  if (!getMeta("name", "twitter:card")) add(page, "info", "social", "Falta twitter:card.");
  if (!getMeta("name", "twitter:image") && !getMeta("property", "og:image")) add(page, "info", "social", "Sin imagen para tarjetas de Twitter/X.");
  const ogUrl = attr(getMeta("property", "og:url") || "", "content");
  if (ogUrl && m.canonical && ogUrl !== m.canonical) add(page, "warn", "social", "og:url no coincide con el canonical.");

  // JSON-LD
  const ld = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
  if (!ld.length && !/privacidad|privacy/.test(page)) add(page, "warn", "schema", "Sin datos estructurados JSON-LD.");
  for (const b of ld) {
    try { const j = JSON.parse(b[1]); if (!j["@type"]) add(page, "warn", "schema", "JSON-LD sin @type."); }
    catch { add(page, "error", "schema", "JSON-LD con JSON inválido."); }
  }

  // Encabezados
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  const hs = [...body.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((x) => ({ n: +x[1], t: strip(x[2]) }));
  const h1s = hs.filter((h) => h.n === 1);
  if (h1s.length !== 1) add(page, h1s.length ? "warn" : "error", "h1", `Debe haber 1 <h1> (hay ${h1s.length}).`);
  for (let i = 1; i < hs.length; i++) if (hs[i].n - hs[i - 1].n > 1) add(page, "warn", "headings", `Salto de nivel h${hs[i - 1].n} → h${hs[i].n} ("${hs[i].t.slice(0, 40)}").`);

  // Imágenes
  for (const t of tags(body, "img")) {
    const src = attr(t, "src") || "";
    if (src.startsWith("data:")) continue;
    const alt = attr(t, "alt");
    if (alt === null) add(page, "error", "img-alt", `<img> sin alt: ${src}`);
    if (!attr(t, "width") || !attr(t, "height")) add(page, "warn", "img-size", `<img> sin width/height (CLS): ${src}`);
    const local = resolveLocal(src, file);
    if (local && existsSync(local)) {
      const kb = statSync(local).size / 1024;
      if (kb > 200 && !local.endsWith(".svg")) add(page, "warn", "img-weight", `Imagen pesada (${kb.toFixed(0)} KB): ${src}`);
    } else if (local) add(page, "error", "img-missing", `Imagen no encontrada: ${src}`);
  }

  // Enlaces
  const ids = new Set([...html.matchAll(/\bid\s*=\s*"([^"]+)"/gi)].map((x) => x[1]));
  for (const t of tags(body, "a")) {
    const href = attr(t, "href");
    if (!href) { add(page, "warn", "link", "<a> sin href."); continue; }
    if (href === "#") continue;
    if (href.startsWith("#")) { if (!ids.has(href.slice(1))) add(page, "error", "anchor", `Ancla sin destino: ${href}`); continue; }
    if (/^(mailto:|tel:)/.test(href)) continue;
    if (/^https?:\/\//.test(href)) {
      if (attr(t, "target") === "_blank" && !/noopener/.test(attr(t, "rel") || "")) add(page, "info", "link", `target=_blank sin rel=noopener: ${href.slice(0, 50)}`);
      continue;
    }
    const local = resolveLocal(href.split("#")[0], file);
    if (local && !existsSync(local)) add(page, "error", "link-broken", `Enlace interno roto: ${href}`);
    if (/[.]html([?#]|$)/.test(href) && !/404[.]html/.test(href)) add(page, "warn", "url", `Enlace con ".html" o index: usa una dirección amigable (p. ej. / o /privacidad/): ${href}`);
    if (!strip(t.length ? body.slice(body.indexOf(t), body.indexOf(t) + 400) : "").split("</a>")[0] && !attr(t, "aria-label")) add(page, "info", "link-text", `Enlace sin texto/aria-label: ${href}`);
  }

  // Contenido
  const words = strip(body.replace(/<header[\s\S]*?<\/header>|<footer[\s\S]*?<\/footer>/gi, " ")).split(" ").length;
  if (words < 300 && !/privacidad|privacy/.test(page)) add(page, "info", "content", `Poco texto indexable (${words} palabras); considerar ampliar contenido útil.`);
}

function resolveLocal(src, fromFile) {
  if (!src || /^(https?:)?\/\//.test(src)) return null;
  let p = src.split("?")[0];
  if (p.startsWith(BASE)) p = p.slice(BASE.length);
  else if (p.startsWith("/")) p = p.slice(1);
  else return resolve(dirname(fromFile), p);
  const full = resolve(root, p);
  return existsSync(full) && statSync(full).isDirectory() ? join(full, "index.html") : full;
}

// Reciprocidad hreflang
for (const [page, m] of Object.entries(meta)) {
  for (const [lng, href] of Object.entries(m.hreflang)) {
    const target = Object.entries(meta).find(([, x]) => x.canonical === href);
    if (!target) { if (lng !== "x-default") add(page, "warn", "hreflang", `hreflang ${lng} apunta a una URL sin página local: ${href}`); continue; }
    if (!Object.values(target[1].hreflang).includes(m.canonical)) add(page, "warn", "hreflang", `Falta reciprocidad: ${target[0]} no enlaza de vuelta a ${page}.`);
  }
}

// URLs amigables y sitemap coherente con los canonical
const smFile = join(root, "sitemap.xml");
if (existsSync(smFile)) {
  const locs = [...readFileSync(smFile, "utf8").matchAll(/<loc>([^<]+)<[/]loc>/g)].map((x) => x[1]);
  const canons = Object.entries(meta).filter(([p]) => !noindexPages.has(p)).map(([p, x]) => [p, x.canonical]);
  for (const [p, c] of canons) if (c && !locs.includes(c)) add(p, "warn", "sitemap", `El canonical no está en sitemap.xml: ${c}`);
  for (const l of locs) if (!canons.some(([, c]) => c === l)) add("sitemap.xml", "warn", "sitemap", `URL del sitemap sin página canónica correspondiente: ${l}`);
  for (const l of locs) if (/[.]html([?#]|$)/.test(l)) add("sitemap.xml", "warn", "url", `URL poco amigable en el sitemap: ${l}`);
}
for (const [p, x] of Object.entries(meta)) if (x.canonical && /[.]html([?#]|$)/.test(x.canonical) && !noindexPages.has(p)) add(p, "warn", "url", `El canonical termina en .html: ${x.canonical}`);

// Archivos de sitio
const has = (n) => existsSync(join(root, n));
if (!has("sitemap.xml")) add("(sitio)", "error", "sitemap", "No existe sitemap.xml.");
if (!has("robots.txt")) add("(sitio)", "warn", "robots", "No existe robots.txt.");
if (!has("favicon.ico")) add("(sitio)", "warn", "favicon", "No existe /favicon.ico (Google y los navegadores lo piden como respaldo).");
if (!has("404.html")) add("(sitio)", "info", "404", "No existe 404.html (GitHub Pages lo sirve para rutas inexistentes).");
const cssKb = files.filter((f) => f.endsWith(".css")).reduce((s, f) => s + statSync(f).size, 0) / 1024;
const jsKb = files.filter((f) => f.endsWith(".js")).reduce((s, f) => s + statSync(f).size, 0) / 1024;
add("(sitio)", "info", "peso", `CSS ${cssKb.toFixed(0)} KB · JS ${jsKb.toFixed(0)} KB (sin minificar).`);

// Las páginas noindex (p. ej. 404) solo se revisan en lo básico
const keep = new Set(["robots", "title", "lang", "viewport", "img-alt", "img-missing", "link-broken", "anchor"]);
for (let i = findings.length - 1; i >= 0; i--) if (noindexPages.has(findings[i].page) && !keep.has(findings[i].rule)) findings.splice(i, 1);

if (AS_JSON) { console.log(JSON.stringify(findings, null, 2)); process.exit(0); }

const order = { error: 0, warn: 1, info: 2 };
const icon = { error: "ERROR", warn: "AVISO", info: "INFO " };
const count = (l) => findings.filter((f) => f.level === l).length;
console.log(`Auditoría SEO · ${pages.length} páginas · base ${BASE}`);
console.log(`Errores: ${count("error")} · Avisos: ${count("warn")} · Info: ${count("info")}\n`);
for (const lvl of ["error", "warn", "info"]) {
  const group = findings.filter((f) => f.level === lvl).sort((a, b) => a.page.localeCompare(b.page));
  if (!group.length) continue;
  console.log(`── ${icon[lvl]} ──`);
  for (const f of group) console.log(`[${f.page}] (${f.rule}) ${f.msg}`);
  console.log("");
}

if (args.includes("--fail-on-error") && count("error") > 0) process.exit(1);
