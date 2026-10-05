#!/usr/bin/env node
// Auditoría responsive automática (sin dependencias; usa Chrome/Edge instalado).
// Abre las páginas en varios anchos y tema oscuro/claro, y detecta:
//   - desbordes horizontales (la página se ensancha o un elemento sale de la pantalla)
//   - texto demasiado pegado al borde de su contenedor (tarjetas, paneles, botones…)
//   - objetivos táctiles pequeños en móvil
//
//   node scripts/responsive-audit.mjs                      → 320, 360, 390, 768, 1024
//   node scripts/responsive-audit.mjs --widths 360,414 --min 14
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve, extname } from "node:path";
import { tmpdir } from "node:os";

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const widths = flag("--widths", "320,360,390,768,1024").split(",").map(Number);
const MIN = Number(flag("--min", 12)); // separación mínima texto ↔ borde del contenedor (px)
const pages = flag("--pages", "index.html,en/index.html,privacidad.html").split(",");

const chrome = process.env.CHROME_PATH || [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].find((p) => existsSync(p));
if (!chrome) { console.error("No encuentro Chrome/Edge. Define CHROME_PATH."); process.exit(1); }

// 1) build de producción a una carpeta temporal y servidor en memoria
const tmp = mkdtempSync(join(tmpdir(), "resp-"));
const dist = join(tmp, "dist");
spawnSync(process.execPath, ["scripts/build.mjs", "--target", "production", "--out", dist], { stdio: "ignore" });

const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".xml": "application/xml", ".txt": "text/plain" };
const probe = `<!doctype html><meta charset=utf-8><body><script>
const WIDTHS=${JSON.stringify(widths)}, PAGES=${JSON.stringify(pages)}, MIN=${MIN}, THEMES=['dark','light'];
const out=[];
const sel=(el)=>{let s=el.tagName.toLowerCase();if(el.id)s+='#'+el.id;if(el.className&&typeof el.className==='string')s+='.'+el.className.trim().split(/\\s+/).slice(0,2).join('.');return s;};
const alpha=(c)=>{const m=c.match(/rgba?\\(([^)]+)\\)/);if(!m)return 0;const p=m[1].split(',').map(Number);return p.length>3?p[3]:1;};
function analyse(w,d){
  const r={overflow:null,offscreen:[],tight:[],small:[]};
  const vw=w.innerWidth;
  if(d.documentElement.scrollWidth>vw+1) r.overflow=d.documentElement.scrollWidth;
  const scroller=(el)=>{for(let e=el;e&&e!==d.body;e=e.parentElement){const o=w.getComputedStyle(e).overflowX;if(o==='auto'||o==='scroll')return true;if(e!==el&&(o==='hidden'||o==='clip')){const q=e.getBoundingClientRect();if(q.left>=-1&&q.right<=vw+1)return true;}}return false;};
  d.body.querySelectorAll('*').forEach(el=>{
    const cs=w.getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden')return;
    const b=el.getBoundingClientRect();if(!b.width||!b.height)return;
    if((b.right>vw+1||b.left<-1)&&!scroller(el)&&!el.closest('.hero-bg,.aurora,.hero-beam,.wa-float,svg')) r.offscreen.push(sel(el)+' ['+Math.round(b.left)+'..'+Math.round(b.right)+']');
    if(vw<=480&&(el.tagName==='A'||el.tagName==='BUTTON')&&(b.height<30||b.width<30)&&!el.closest('p,li')&&cs.display!=='inline') r.small.push(sel(el)+' '+Math.round(b.width)+'x'+Math.round(b.height));
  });
  const isBox=(el)=>{const cs=w.getComputedStyle(el);const bw=parseFloat(cs.borderLeftWidth)>0&&alpha(cs.borderLeftColor)>0.02;return (bw||alpha(cs.backgroundColor)>0.04)&&parseFloat(cs.borderTopLeftRadius)>0&&el.getBoundingClientRect().width>110;};
  const tw=d.createTreeWalker(d.body,NodeFilter.SHOW_TEXT);const seen=new Set();
  while(tw.nextNode()){
    const n=tw.currentNode;if(!n.textContent.trim())continue;const p=n.parentElement;if(!p||p.closest('script,style,svg'))continue;
    const ps=w.getComputedStyle(p);if(ps.display==='none'||ps.visibility==='hidden')continue;
    let box=null;for(let e=p;e&&e!==d.body;e=e.parentElement){if(isBox(e)){box=e;break;}}
    if(!box)continue;
    const rg=d.createRange();rg.selectNodeContents(n);const t=rg.getBoundingClientRect();if(!t.width)continue;
    const c=box.getBoundingClientRect();
    const side=Math.min(t.left-c.left,c.right-t.right);
    // los botones y chips centran su texto: solo preocupa el lado más corto
    if(side<MIN){const k=sel(box)+'|'+Math.round(side);if(seen.has(k))continue;seen.add(k);r.tight.push(Math.round(side)+'px  '+sel(box)+'  «'+n.textContent.trim().slice(0,38)+'»');}
  }
  return r;
}
async function run(){
  for(const pg of PAGES) for(const th of THEMES) for(const W of WIDTHS){
    const f=document.createElement('iframe');f.style.cssText='position:absolute;left:0;top:0;border:0;width:'+W+'px;height:900px';
    document.body.appendChild(f);
    await new Promise(res=>{f.onload=res;f.src='/'+pg;});
    const w=f.contentWindow,d=f.contentDocument;
    d.documentElement.setAttribute('data-theme',th);
    d.querySelectorAll('.reveal').forEach(e=>e.classList.add('is-visible','reveal-done'));
    d.querySelectorAll('.pstage').forEach(e=>e.classList.add('in-view'));
    await new Promise(r=>setTimeout(r,350));
    out.push({pg,th,W,r:analyse(w,d)});
    f.remove();
  }
  document.title='RESULT'+JSON.stringify(out);
}
run();
</script>`;

const server = createServer((req, res) => {
  const p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/_probe.html") { res.writeHead(200, { "Content-Type": types[".html"] }).end(probe); return; }
  let f = join(dist, p === "/" ? "index.html" : p);
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, "index.html");
  if (!existsSync(f)) { res.writeHead(404).end("404"); return; }
  res.writeHead(200, { "Content-Type": types[extname(f)] || "application/octet-stream" }).end(readFileSync(f));
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const run = await new Promise((resolveRun) => {
  const cp = spawn(chrome, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--virtual-time-budget=60000", "--window-size=1280,900", "--dump-dom", `http://localhost:${port}/_probe.html`]);
  let stdout = "", stderr = "";
  cp.stdout.on("data", (d) => (stdout += d));
  cp.stderr.on("data", (d) => (stderr += d));
  const timer = setTimeout(() => cp.kill(), 240000);
  cp.on("close", () => { clearTimeout(timer); resolveRun({ stdout, stderr }); });
});
server.close();
const m = (run.stdout || "").match(/<title>RESULT([\s\S]*?)<\/title>/);
rmSync(tmp, { recursive: true, force: true });
if (!m) { console.error("No se obtuvo resultado de Chrome.\n" + (run.stderr || "").slice(0, 400)); process.exit(1); }

const data = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"));
let issues = 0;
for (const { pg, th, W, r } of data) {
  const lines = [];
  if (r.overflow) lines.push(`  ↔ DESBORDE: la página mide ${r.overflow}px en una pantalla de ${W}px`);
  [...new Set(r.offscreen)].slice(0, 6).forEach((x) => lines.push("  ↔ fuera de pantalla: " + x));
  r.tight.slice(0, 12).forEach((x) => lines.push("  ▢ texto pegado: " + x));
  [...new Set(r.small)].slice(0, 4).forEach((x) => lines.push("  ☝ objetivo táctil pequeño: " + x));
  if (lines.length) { console.log(`\n[${pg}] ${th} · ${W}px`); console.log(lines.join("\n")); issues += lines.length; }
}
console.log(`\nAnchos: ${widths.join(", ")} · umbral de separación: ${MIN}px · hallazgos: ${issues}`);
process.exit(0);
