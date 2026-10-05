#!/usr/bin/env node
// Prueba automática del chat del hero (comportamiento, no solo aspecto). Usa Chrome/Edge instalado.
//   node scripts/chat-test.mjs                  → 320, 375 y 1280 px, páginas ES y EN
//   node scripts/chat-test.mjs --widths 360,414
//
// Comprueba, para cada ancho:
//   1. los estilos del chat están cargados (íconos pequeños, no gigantes)
//   2. el bucle arranca y la PRIMERA burbuja es una nota de voz, en español y en inglés
//   3. se alternan los dos idiomas solos
//   4. la conversación completa cabe siempre (nada recortado)
//   5. el selector ES/EN cambia de escenario al instante
//   6. en táctil NO se congela; con ratón se pausa al pasar el puntero y se reanuda al salir
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync, mkdtempSync, rmSync } from "node:fs";
import { join, extname } from "node:path";
import { tmpdir } from "node:os";

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const widths = flag("--widths", "320,375,1280").split(",").map(Number);
const pages = flag("--pages", "index.html,en/index.html").split(",");

const chrome = process.env.CHROME_PATH || [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].find((p) => existsSync(p));
if (!chrome) { console.error("No encuentro Chrome/Edge. Define CHROME_PATH."); process.exit(1); }

const tmp = mkdtempSync(join(tmpdir(), "chat-"));
const dist = join(tmp, "dist");
spawnSync(process.execPath, ["scripts/build.mjs", "--target", "production", "--out", dist], { stdio: "ignore" });

const probe = `<!doctype html><meta charset=utf-8><body><script>
const WIDTHS=${JSON.stringify(widths)}, PAGES=${JSON.stringify(pages)};
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const results=[];
async function testOne(pg,W){
  const out={pg,W,checks:[]};
  const ok=(name,pass,info)=>out.checks.push({name,pass:!!pass,info:info||''});
  const f=document.createElement('iframe');
  f.style.cssText='position:absolute;left:0;top:0;border:0;width:'+W+'px;height:1500px';
  document.body.appendChild(f);
  await new Promise(r=>{f.onload=r;f.src='/'+pg;});
  const d=f.contentDocument,w=f.contentWindow;
  Object.defineProperty(d,'hidden',{get:()=>false,configurable:true});
  await sleep(900);
  const sim=d.getElementById('chat-sim'),body=d.querySelector('#chat-sim .cs-body');
  if(sim){d.documentElement.style.scrollBehavior='auto';sim.scrollIntoView({block:'center'});await sleep(600);} // el usuario baja hasta el chat
  if(!sim||!body){ok('el chat existe',false);f.remove();return out;}
  // 1) estilos cargados
  const svg=d.querySelector('#chat-sim .cs-feats svg');
  const sw=svg?w.getComputedStyle(svg).width:'';
  ok('estilos del chat cargados (íconos pequeños)',svg&&parseFloat(sw)<=24,'ancho del ícono: '+sw);
  const lang=()=>{const b=body.firstElementChild;return b?{l:b.getAttribute('lang'),voice:b.classList.contains('voice'),n:body.children.length}:{l:null,voice:false,n:0}};
  // 2-4) muestreo del bucle durante ~45 s
  const seen={es:false,en:false},firstNotVoice=[];let maxOver=-9999,startedAt=null;
  for(let t=0;t<=45000;t+=400){
    await sleep(400);
    const s=lang();
    if(s.voice&&startedAt===null)startedAt=t; // arrancó de verdad = aparece la nota de voz (el respaldo estático no cuenta)
    if(s.l&&!s.voice&&s.n<=1)firstNotVoice.push(s.l);
    if(s.l&&s.voice)seen[s.l]=true;
    const first=body.firstElementChild;if(first)maxOver=Math.max(maxOver,-first.offsetTop); // recorte real: la primera burbuja queda por encima del borde (offsetTop ignora la animación)
  }
  ok('el bucle arranca solo',startedAt!==null&&startedAt<4000,'arrancó a los '+startedAt+' ms');
  ok('la conversación en ESPAÑOL empieza con una nota de voz',seen.es);
  ok('la conversación en INGLÉS empieza con una nota de voz',seen.en);
  ok('se alternan los dos idiomas solos',seen.es&&seen.en);
  ok('nada recortado: la conversación completa cabe',maxOver<=1,'recorte máx: '+Math.max(0,maxOver)+' px, alto del chat: '+body.clientHeight+' px');
  // 5) selector ES/EN
  const btn=(l)=>d.querySelector('#chat-sim [data-lang="'+l+'"]');
  btn('en').click();await sleep(700);
  let s=lang();
  ok('al pulsar EN arranca la conversación en inglés con audio',s.l==='en'&&s.voice&&btn('en').getAttribute('aria-pressed')==='true');
  btn('es').click();await sleep(700);
  s=lang();
  ok('al pulsar ES arranca la conversación en español con audio',s.l==='es'&&s.voice&&btn('es').getAttribute('aria-pressed')==='true');
  // 6) táctil no congela; ratón pausa y reanuda
  const ev=(type,pt)=>sim.dispatchEvent(new w.PointerEvent(type,{pointerType:pt,bubbles:false}));
  ev('pointerenter','touch');
  const n0=body.children.length,txt0=body.textContent.length;await sleep(4500);
  ok('con el dedo (táctil) el chat sigue avanzando',body.children.length!==n0||body.textContent.length!==txt0);
  ev('pointerleave','touch');
  ev('pointerenter','mouse');await sleep(300);
  const n1=body.children.length,t1=body.textContent.length;await sleep(4000);
  ok('con el ratón encima, el chat se pausa',body.children.length===n1&&body.textContent.length===t1);
  ev('pointerleave','mouse');
  const n2=body.children.length,t2=body.textContent.length;await sleep(4500);
  ok('al quitar el ratón, se reanuda',body.children.length!==n2||body.textContent.length!==t2);
  f.remove();
  return out;
}
(async()=>{for(const pg of PAGES)for(const W of WIDTHS)results.push(await testOne(pg,W));document.title='RESULT'+JSON.stringify(results);})();
</script>`;

const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".xml": "application/xml", ".txt": "text/plain" };
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

const run = await new Promise((done) => {
  const cp = spawn(chrome, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--virtual-time-budget=900000", "--window-size=1400,1500", "--dump-dom", `http://localhost:${port}/_probe.html`]);
  let stdout = "", stderr = "";
  cp.stdout.on("data", (d) => (stdout += d));
  cp.stderr.on("data", (d) => (stderr += d));
  const timer = setTimeout(() => cp.kill(), 540000);
  cp.on("close", () => { clearTimeout(timer); done({ stdout, stderr }); });
});
server.close();
rmSync(tmp, { recursive: true, force: true });
const m = (run.stdout || "").match(/<title>RESULT([\s\S]*?)<\/title>/);
if (!m) { console.error("No se obtuvo resultado de Chrome.\n" + (run.stderr || "").slice(0, 400)); process.exit(1); }
const data = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"));
let fail = 0, total = 0;
for (const r of data) {
  console.log(`\n[${r.pg}] ${r.W}px`);
  for (const c of r.checks) { total++; if (!c.pass) fail++; console.log(`  ${c.pass ? "✔" : "✖"} ${c.name}${c.info ? "  (" + c.info + ")" : ""}`); }
}
console.log(`\n${total - fail}/${total} comprobaciones correctas${fail ? " · FALLAN " + fail : ""}`);
process.exit(fail ? 1 : 0);
