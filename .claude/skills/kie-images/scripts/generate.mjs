#!/usr/bin/env node
// Genera una imagen con Kie.ai y la guarda en assets/img/. Requiere KIE_API_KEY (env o .env).
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";

const root = resolve(process.cwd());
const BASE = "https://api.kie.ai/api/v1/jobs";

// .env mínimo (sin dependencias)
const envFile = join(root, ".env");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith("--")) acc.push([a.slice(2), arr[i + 1]]);
    return acc;
  }, [])
);

const key = process.env.KIE_API_KEY;
if (!key) fail("Falta KIE_API_KEY (agrégala a .env o a las variables de entorno).");
if (!args.name || !args.prompt) fail('Uso: --name <archivo> --prompt "<texto>" [--ratio 16:9] [--model google/nano-banana] [--format png|jpeg]');

const name = args.name.replace(/[^a-z0-9-_]/gi, "-");
const model = args.model || "google/nano-banana";
const format = args.format || "png";
const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

function fail(msg) { console.error(msg); process.exit(1); }

const create = await fetch(`${BASE}/createTask`, {
  method: "POST",
  headers,
  body: JSON.stringify({ model, input: { prompt: args.prompt, aspect_ratio: args.ratio || "16:9", output_format: format } }),
}).then((r) => r.json());
if (create.code !== 200) fail(`Error al crear tarea: ${create.msg || JSON.stringify(create)}`);
const taskId = create.data.taskId;
console.log(`Tarea creada: ${taskId}`);

let result;
for (let i = 0; i < 60; i++) {
  await new Promise((r) => setTimeout(r, 4000));
  const res = await fetch(`${BASE}/recordInfo?taskId=${encodeURIComponent(taskId)}`, { headers }).then((r) => r.json());
  const d = res.data;
  if (!d) continue;
  if (d.state === "success") { result = d; break; }
  if (d.state === "fail") fail(`Falló la generación: ${d.failMsg || d.failCode}`);
}
if (!result) fail("Tiempo de espera agotado; consulta la tarea en el panel de Kie.ai.");

const url = JSON.parse(result.resultJson).resultUrls?.[0];
if (!url) fail("Sin URL de resultado.");

const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
const outDir = join(root, "assets", "img");
mkdirSync(outDir, { recursive: true });

let outPath, out = buf;
const raw = process.argv.includes("--raw"); // --raw: guarda la imagen original de Kie, sin convertir ni recomprimir
try {
  if (raw) throw new Error("raw");
  const sharp = (await import("sharp")).default;
  out = await sharp(buf).webp({ quality: 82 }).toBuffer();
  outPath = join(outDir, `${name}.webp`);
} catch {
  outPath = join(outDir, `${name}.${format === "jpeg" ? "jpg" : "png"}`);
  if (!raw) console.log("sharp no instalado: se guarda sin convertir a WebP.");
}
writeFileSync(outPath, out);
console.log(`Guardada: ${outPath} (${(out.length / 1024).toFixed(0)} KB, créditos: ${result.creditsConsumed ?? "n/d"})`);
