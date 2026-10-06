// Utilidades compartidas por build, servidor local y auditorías.
//
// 1) Piezas reutilizables: en cualquier HTML, la marca
//        <!--@include partials/footer.es.html-->
//    se sustituye por el contenido de ese archivo (el pie de página es el mismo en todas las páginas).
// 2) Datos legales: en los textos se escribe {{legal.titular}}, {{legal.nit}}… y se resuelven con la sección
//    "legal" de site.config.json. Si falta un dato:
//      - en pruebas / servidor local se ve un recuadro "[PENDIENTE: …]" para que no se pase por alto;
//      - en el build de producción (modo estricto) el build FALLA: nunca se publican textos legales incompletos.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export function expandIncludes(html, root) {
  return html.replace(/<!--@include\s+([^\s>]+)\s*-->/g, (m, rel) => {
    const f = join(root, rel);
    if (!existsSync(f)) throw new Error(`Include no encontrado: ${rel}`);
    return expandIncludes(readFileSync(f, "utf8").trim(), root);
  });
}

export const LEGAL_LABELS = {
  titular: "razón social o nombre completo del titular",
  nit: "NIT",
  domicilio: "domicilio (ciudad y dirección)",
  pais: "país",
  email: "correo electrónico",
  telefono: "teléfono",
  vigencia: "fecha de vigencia",
  vigenciaEn: "fecha de vigencia (inglés)",
};

export function applyLegal(html, legal, { strict = false } = {}) {
  const missing = new Set();
  const out = html.replace(/\{\{legal\.([a-zA-Z]+)\}\}/g, (m, key) => {
    const v = legal && legal[key] != null ? String(legal[key]).trim() : "";
    if (v) return v;
    missing.add(key);
    return strict ? m : `<mark class="legal-todo">[PENDIENTE: ${LEGAL_LABELS[key] || key}]</mark>`;
  });
  return { html: out, missing: [...missing] };
}

export function readConfig(root) {
  return JSON.parse(readFileSync(join(root, "site.config.json"), "utf8"));
}
