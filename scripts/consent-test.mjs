#!/usr/bin/env node
// Prueba automática del almacenamiento del navegador / aviso de cookies, el pie de página y los enlaces a WhatsApp.
// Prueba los DOS estados del interruptor COOKIE_BANNER de assets/js/main.js:
//   - APAGADO (estado actual): solo se guarda el tema, sin aviso.
//   - ENCENDIDO (para cuando se conecte GA4 u otra analítica): aviso, consentimiento y reapertura desde el pie.
// Usa Chrome/Edge instalado.
//   node scripts/consent-test.mjs                   → 375 y 1280 px, páginas ES y EN
//   node scripts/consent-test.mjs --widths 360,414
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync, statSync, mkdtempSync, rmSync, cpSync } from "node:fs";
import { join, extname } from "node:path";
import { tmpdir } from "node:os";

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const widths = flag("--widths", "375,1280").split(",").map(Number);
const pages = flag("--pages", "index.html,en/index.html").split(",");

const chrome = process.env.CHROME_PATH || [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].find((p) => existsSync(p));
if (!chrome) { console.error("No encuentro Chrome/Edge. Define CHROME_PATH."); process.exit(1); }

// Dos paquetes: el normal (interruptor apagado) y una copia con el interruptor encendido
const tmp = mkdtempSync(join(tmpdir(), "consent-"));
const distOff = join(tmp, "dist-off");
const distOn = join(tmp, "dist-on");
spawnSync(process.execPath, ["scripts/build.mjs", "--target", "production", "--lenient", "--out", distOff], { stdio: "ignore" });
cpSync(distOff, distOn, { recursive: true });
const mj = join(distOn, "assets/js/main.js");
const mainSrc = readFileSync(mj, "utf8");
if (!mainSrc.includes("var COOKIE_BANNER = false;")) { console.error("No encuentro el interruptor COOKIE_BANNER = false en main.js"); process.exit(1); }
writeFileSync(mj, mainSrc.replace("var COOKIE_BANNER = false;", "var COOKIE_BANNER = true;"));

const probeFor = (MODE) => `<!doctype html><meta charset=utf-8><body><script>
const MODE='${MODE}', WIDTHS=${JSON.stringify(widths)}, PAGES=${JSON.stringify(pages)};
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const results=[];
const CK='erconnectia-consent', TK='erconnectia-theme';
async function load(f,pg){
  await new Promise(r=>{f.onload=r;f.src='/'+pg+'?'+Math.random();});
  const d=f.contentDocument; Object.defineProperty(d,'hidden',{get:()=>false,configurable:true});
  await sleep(500); return d;
}
async function testOne(pg,W){
  const out={pg,W,checks:[]}; const ok=(n,p,i)=>out.checks.push({name:n,pass:!!p,info:i||''});
  const en=pg.startsWith('en/');
  localStorage.clear();
  const f=document.createElement('iframe');
  f.style.cssText='position:absolute;left:0;top:0;border:0;width:'+W+'px;height:900px';
  document.body.appendChild(f);
  let d=await load(f,pg), w=f.contentWindow;
  const ban=()=>d.getElementById('cookie-banner');
  const vis=()=>{const b=ban();return !!b&&!b.hidden&&b.getBoundingClientRect().height>0;};

  if (MODE==='off') {
    // ---------- interruptor APAGADO: solo el tema, sin aviso ----------
    ok('no aparece ningún aviso de cookies',!ban());
    ok('no se guarda ninguna elección de cookies (no hay clave de consentimiento)',w.localStorage.getItem(CK)===null);
    ok('el botón de tema funciona',(d.querySelector('[data-theme-toggle]').click(),true));
    await sleep(150);
    ok('al cambiar el tema se aplica y se recuerda',d.documentElement.getAttribute('data-theme')==='light'&&w.localStorage.getItem(TK)==='light');
    d=await load(f,pg); w=f.contentWindow;
    ok('al volver, el tema guardado se aplica',d.documentElement.getAttribute('data-theme')==='light');
    ok('lo único que se guarda en el navegador es el tema (1 clave)',w.localStorage.length===1,'claves: '+w.localStorage.length);
    const pb=d.querySelector('[data-cookie-prefs]'); const li=pb&&pb.closest('li');
    ok('"Preferencias de cookies" no se muestra mientras no haya aviso',!pb||(li&&li.hidden)||pb.getBoundingClientRect().height===0);
  } else {
    // ---------- interruptor ENCENDIDO: aviso y consentimiento ----------
    ok('el aviso aparece en la primera visita',vis());
    const b=ban();
    ok('el aviso es accesible (role=region con etiqueta)',b&&b.getAttribute('role')==='region'&&!!b.getAttribute('aria-label'));
    const link=b&&b.querySelector('a');
    ok('enlaza a la política de cookies de su idioma',link&&link.getAttribute('href')===(en?'/en/cookies/':'/cookies/'),link?link.getAttribute('href'):'');
    ok('tiene dos opciones (aceptar preferencias / solo lo necesario)',b&&b.querySelectorAll('button').length===2);
    d.querySelector('[data-theme-toggle]').click(); await sleep(150);
    ok('cambiar el tema funciona en esa visita',d.documentElement.getAttribute('data-theme')==='light');
    ok('SIN consentimiento el tema NO se guarda',w.localStorage.getItem(TK)===null);
    const fl=d.querySelector('.wa-float'),br=b.getBoundingClientRect();
    if(fl){const fr=fl.getBoundingClientRect();const overlap=!(fr.right<=br.left||fr.left>=br.right||fr.bottom<=br.top||fr.top>=br.bottom);ok('el aviso no tapa el botón flotante de WhatsApp',!overlap);}
    b.querySelectorAll('button')[1].click(); await sleep(150);
    const c1=JSON.parse(w.localStorage.getItem(CK)||'null');
    ok('"Solo lo necesario" guarda la elección (prefs=false) y cierra el aviso',c1&&c1.v===1&&c1.prefs===false&&!vis());
    ok('"Solo lo necesario" no deja el tema guardado',w.localStorage.getItem(TK)===null);
    d=await load(f,pg); w=f.contentWindow;
    ok('al volver, el aviso NO reaparece',!vis());
    ok('al volver, el tema no se recuerda (vuelve a oscuro)',d.documentElement.getAttribute('data-theme')==='dark');
    const prefsBtn=d.querySelector('[data-cookie-prefs]');
    ok('el pie tiene "Preferencias de cookies" visible',!!prefsBtn&&prefsBtn.getBoundingClientRect().height>0);
    prefsBtn.click(); await sleep(200);
    ok('"Preferencias de cookies" vuelve a abrir el aviso',vis());
    ban().querySelectorAll('button')[0].click(); await sleep(150);
    const c2=JSON.parse(w.localStorage.getItem(CK)||'null');
    ok('"Aceptar preferencias" guarda prefs=true',c2&&c2.prefs===true&&!vis());
    d.querySelector('[data-theme-toggle]').click(); await sleep(150);
    ok('con consentimiento el tema SÍ se guarda',w.localStorage.getItem(TK)==='light');
    d=await load(f,pg); w=f.contentWindow;
    ok('al volver, el tema guardado se aplica',d.documentElement.getAttribute('data-theme')==='light');
    d.querySelector('[data-cookie-prefs]').click(); await sleep(200);
    ban().querySelectorAll('button')[1].click(); await sleep(150);
    ok('al retirar el consentimiento se borra el tema guardado',w.localStorage.getItem(TK)===null);
  }

  // ---------- comprobaciones comunes ----------
  const wa=[...d.querySelectorAll('a[href*="wa.me"]')];
  const badWa=wa.filter(a=>a.getAttribute('target')!=='_blank'||!/noopener/.test(a.getAttribute('rel')||'')||!/noreferrer/.test(a.getAttribute('rel')||''));
  ok('todos los enlaces a WhatsApp abren en pestaña nueva con rel noopener noreferrer',wa.length>=5&&badWa.length===0,wa.length+' enlaces, '+badWa.length+' sin configurar');
  const foot=d.querySelector('footer.site-footer');
  const hrefs=foot?[...foot.querySelectorAll('a')].map(a=>a.getAttribute('href')):[];
  const need=en?['/en/terms/','/en/privacy/','/en/cookies/','mailto:info@erconnectia.com']:['/terminos/','/privacidad/','/cookies/','mailto:info@erconnectia.com'];
  ok('el pie enlaza a términos, privacidad, cookies y al correo oficial',need.every(n=>hrefs.includes(n)),need.filter(n=>!hrefs.includes(n)).join(', '));
  ok('no hay tipografías ni recursos de Google en la página',!/googleapis|gstatic/.test(d.documentElement.outerHTML));
  f.remove(); localStorage.clear();
  return out;
}
(async()=>{for(const pg of PAGES)for(const W of WIDTHS)results.push(await testOne(pg,W));document.title='RESULT'+JSON.stringify(results);})();
</script>`;

const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".woff2": "font/woff2", ".xml": "application/xml", ".txt": "text/plain" };

async function runSuite(dir, mode) {
  const probe = probeFor(mode);
  const server = createServer((req, res) => {
    const p = decodeURIComponent(req.url.split("?")[0]);
    if (p === "/_probe.html") { res.writeHead(200, { "Content-Type": types[".html"] }).end(probe); return; }
    let f = join(dir, p === "/" ? "index.html" : p);
    if (existsSync(f) && statSync(f).isDirectory()) f = join(f, "index.html");
    if (!existsSync(f)) { res.writeHead(404).end("404"); return; }
    res.writeHead(200, { "Content-Type": types[extname(f)] || "application/octet-stream" }).end(readFileSync(f));
  });
  await new Promise((r) => server.listen(0, r));
  const port = server.address().port;
  const run = await new Promise((done) => {
    const cp = spawn(chrome, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--virtual-time-budget=300000", "--window-size=1400,1000", "--dump-dom", `http://localhost:${port}/_probe.html`]);
    let stdout = "", stderr = "";
    cp.stdout.on("data", (d) => (stdout += d));
    cp.stderr.on("data", (d) => (stderr += d));
    const timer = setTimeout(() => cp.kill(), 280000);
    cp.on("close", () => { clearTimeout(timer); done({ stdout, stderr }); });
  });
  server.close();
  const m = (run.stdout || "").match(/<title>RESULT([\s\S]*?)<\/title>/);
  if (!m) { console.error("No se obtuvo resultado de Chrome.\n" + (run.stderr || "").slice(0, 400)); process.exit(1); }
  return JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"));
}

let fail = 0, total = 0;
for (const [dir, mode, label] of [[distOff, "off", "Aviso de cookies APAGADO (estado actual)"], [distOn, "on", "Aviso de cookies ENCENDIDO (para GA4)"]]) {
  console.log(`\n══════ ${label} ══════`);
  for (const r of await runSuite(dir, mode)) {
    console.log(`\n[${r.pg}] ${r.W}px`);
    for (const c of r.checks) { total++; if (!c.pass) fail++; console.log(`  ${c.pass ? "✔" : "✖"} ${c.name}${c.info ? "  (" + c.info + ")" : ""}`); }
  }
}
rmSync(tmp, { recursive: true, force: true });
console.log(`\n${total - fail}/${total} comprobaciones correctas${fail ? " · FALLAN " + fail : ""}`);
process.exit(fail ? 1 : 0);
