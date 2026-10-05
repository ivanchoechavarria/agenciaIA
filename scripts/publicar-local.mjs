#!/usr/bin/env node
// Publicación de EMERGENCIA desde tu equipo, sin GitHub Actions.
// Hace lo mismo que el flujo "Producción (Hostinger)": construye el sitio y actualiza la rama "production",
// de la que Hostinger toma los archivos. Úsalo solo si GitHub Actions está caído o en cola (githubstatus.com).
//
//   node scripts/publicar-local.mjs --dry-run   → construye y muestra qué cambiaría, sin subir nada
//   node scripts/publicar-local.mjs             → pide confirmación y publica
import { execSync, spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { mkdtempSync, rmSync, cpSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const dry = process.argv.includes("--dry-run");
const sh = (c, o = {}) => execSync(c, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...o }).trim();
const fail = (m) => { console.error("✖ " + m); process.exit(1); };

try { sh("git rev-parse --is-inside-work-tree"); } catch { fail("Esto no es un repositorio Git."); }
if (sh("git rev-parse --abbrev-ref HEAD") !== "main") fail("Publica siempre desde la rama main.");
if (sh("git status --porcelain")) { if (dry) console.log("⚠ Hay cambios sin guardar (en dry-run solo se avisa; para publicar de verdad deben estar en un commit)."); else fail("Hay cambios sin guardar. Haz commit y push antes de publicar."); }

console.log("→ Sincronizando con GitHub…");
sh("git fetch origin");
const [behind, ahead] = sh("git rev-list --left-right --count origin/main...HEAD").split(/\s+/).map(Number);
if (ahead > 0) { if (dry) console.log(`⚠ Tienes ${ahead} commit(s) sin subir (en dry-run solo se avisa).`); else fail(`Tienes ${ahead} commit(s) sin subir. Haz push primero.`); }
if (behind > 0) fail(`Tu rama está ${behind} commit(s) detrás de GitHub. Haz pull.`);

console.log("→ Auditoría SEO…");
const audit = spawnSync(process.execPath, [".claude/skills/seo-audit/scripts/audit.mjs", "--fail-on-error"], { encoding: "utf8" });
if (audit.status !== 0) { console.error(audit.stdout); fail("La auditoría SEO tiene errores."); }

const tmp = mkdtempSync(join(tmpdir(), "pub-"));
const dist = join(tmp, "dist");
const wt = join(tmp, "production");
const cleanup = () => { try { sh(`git worktree remove --force "${wt}"`); } catch {} try { rmSync(tmp, { recursive: true, force: true }); } catch {} try { sh("git worktree prune"); } catch {} };
process.on("exit", cleanup); // también se limpia cuando el script termina con process.exit()

try {
  console.log("→ Construyendo el sitio de producción…");
  const b = spawnSync(process.execPath, ["scripts/build.mjs", "--target", "production", "--out", dist], { encoding: "utf8" });
  if (b.status !== 0) fail("Falló la construcción:\n" + b.stderr);
  console.log(b.stdout.trim().split("\n").slice(1).join("\n"));

  console.log("→ Preparando la rama production…");
  const hasProd = (() => { try { sh("git rev-parse --verify origin/production"); return true; } catch { return false; } })();
  if (hasProd) sh(`git worktree add --detach "${wt}" origin/production`);
  else { sh(`git worktree add --detach "${wt}" HEAD`); sh("git checkout --orphan production", { cwd: wt }); }
  sh("git rm -r -q -f --ignore-unmatch .", { cwd: wt });
  for (const f of readdirSync(dist)) cpSync(join(dist, f), join(wt, f), { recursive: true });
  sh("git add -A", { cwd: wt });

  const stat = sh("git status --short", { cwd: wt });
  if (!stat) { console.log("\n✔ La rama production ya contiene exactamente esta versión. No hay nada que publicar."); process.exit(0); }
  const lines = stat.split("\n");
  console.log(`\nCambios que se enviarían a la rama production (${lines.length} archivos):`);
  console.log(lines.slice(0, 14).map((l) => "  " + l).join("\n") + (lines.length > 14 ? `\n  … y ${lines.length - 14} más` : ""));

  if (dry) { console.log("\n(dry-run) No se subió nada."); process.exit(0); }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ans = (await rl.question("\n¿Publicar en PRODUCCIÓN (erconnectia.com) desde este equipo? (s/N) ")).trim().toLowerCase();
  rl.close();
  if (ans !== "s") { console.log("Cancelado."); process.exit(0); }

  const sha = sh("git rev-parse --short HEAD");
  sh("git config user.name", { cwd: wt }) || 0;
  sh(`git commit -q -m "Producción local de emergencia (${sha})"`, { cwd: wt });
  sh("git push origin HEAD:production", { cwd: wt });
  console.log(`\n✔ Rama production actualizada. Hostinger desplegará en 1–2 minutos (hPanel → Avanzado → Git).`);
} finally {
  cleanup();
}
