#!/usr/bin/env node
// Publica en producción (Hostinger): crea una etiqueta de versión y la sube a GitHub.
// GitHub Actions detecta la etiqueta, valida el sitio, genera el build y actualiza la rama "production",
// de la que Hostinger toma los archivos.
//
//   node scripts/publicar.mjs            → pide confirmación y publica
//   node scripts/publicar.mjs --dry-run  → solo hace las comprobaciones
import { execSync, spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const dry = process.argv.includes("--dry-run");
const sh = (c) => execSync(c, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const fail = (m) => { console.error("✖ " + m); process.exit(1); };

try { sh("git rev-parse --is-inside-work-tree"); } catch { fail("Esto no es un repositorio Git."); }

const branch = sh("git rev-parse --abbrev-ref HEAD");
if (branch !== "main") fail(`Estás en la rama "${branch}". Publica siempre desde main.`);
if (sh("git status --porcelain")) fail("Hay cambios sin guardar. Haz commit antes de publicar.");

console.log("→ Sincronizando con GitHub…");
sh("git fetch origin");
const [behind, ahead] = sh("git rev-list --left-right --count origin/main...HEAD").split(/\s+/).map(Number);
if (ahead > 0) fail(`Tienes ${ahead} commit(s) sin subir (push). Súbelos y revisa la URL de pruebas primero.`);
if (behind > 0) fail(`Tu rama está ${behind} commit(s) detrás de GitHub. Haz pull.`);

console.log("→ Auditoría SEO…");
try {
  console.log(sh("node .claude/skills/seo-audit/scripts/audit.mjs --fail-on-error").split("\n").slice(0, 3).join("\n"));
} catch (e) {
  console.error(String(e.stdout || e.message).split("\n").slice(0, 25).join("\n"));
  fail("La auditoría SEO tiene errores. Corrígelos antes de publicar.");
}

console.log("→ Comprobando que el sitio de producción se puede construir (datos legales completos)…");
const tmpBuild = mkdtempSync(join(tmpdir(), "chk-"));
const chk = spawnSync(process.execPath, ["scripts/build.mjs", "--target", "production", "--out", join(tmpBuild, "dist")], { encoding: "utf8" });
rmSync(tmpBuild, { recursive: true, force: true });
if (chk.status !== 0) { console.error((chk.stderr || chk.stdout || "").trim()); fail("El build de producción falla. Corrígelo antes de publicar (no se creó ninguna etiqueta)."); }

const d = new Date();
const p = (n) => String(n).padStart(2, "0");
const tag = `v${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
const last = sh('git log -1 --pretty=format:"%h %s"');
console.log(`\nVersión a publicar: ${tag}\nÚltimo commit: ${last}`);

if (dry) { console.log("\n(dry-run) Todo en orden; no se creó ninguna etiqueta."); process.exit(0); }

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ans = (await rl.question("\n¿Publicar en PRODUCCIÓN (erconnectia.com)? (s/N) ")).trim().toLowerCase();
rl.close();
if (ans !== "s") { console.log("Cancelado."); process.exit(0); }

sh(`git tag -a ${tag} -m "Publicación en producción ${tag}"`);
sh(`git push origin ${tag}`);
const repo = sh("git remote get-url origin").replace(/\.git$/, "").replace(/^git@github\.com:/, "https://github.com/");
console.log(`\n✔ Etiqueta ${tag} enviada. Sigue el despliegue en:\n  ${repo}/actions`);
