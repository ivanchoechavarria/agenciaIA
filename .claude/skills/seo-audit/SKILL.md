---
name: seo-audit
description: Auditoría y mejora de SEO para el sitio estático bilingüe de ERconnectIA (ES/EN, GitHub Pages). Úsala antes de tocar títulos, descripciones, encabezados, imágenes, enlaces, datos estructurados, sitemap/robots, rendimiento o contenido pensado para posicionamiento, y para revisar el sitio completo antes de publicar.
---

# SEO Audit — ERconnectIA

Sitio estático (HTML/CSS/JS puro): `index.html` + `en/index.html` + páginas de privacidad. Dominio: `https://erconnectia.com/` (canónico sin `www`, rutas en la raíz). Hoy se sirve desde GitHub Pages (CNAME) y migrará a Hostinger; ver `docs/DESPLIEGUE.md`. Mercados: Colombia y clientes del exterior (turismo de salud/estético). Nicho principal: salud y estética en general. Servicios: Transformación digital (el más fuerte: automatizar procesos costosos para liberar tiempo y dedicarlo a lo que genera valor), CRM, Agente conversacional con IA, Marketing y Construcción de sitios web. Ver `keywords.md`.

## Flujo (ahorra tokens: audita primero, edita después)

1. Ejecuta `node .claude/skills/seo-audit/scripts/audit.mjs` (añade `--json` si necesitas procesarlo). Cubre: title/description, canonical, hreflang y su reciprocidad, h1 y jerarquía, alt/tamaño/peso de imágenes, enlaces y anclas rotas, Open Graph/Twitter, JSON-LD válido, sitemap/robots/404, texto indexable y peso de CSS/JS.
2. Prioriza: errores → avisos → info. Agrupa por archivo y propón los cambios ANTES de aplicarlos.
3. Aplica cambios mínimos y repetibles en ambos idiomas (ES y EN deben quedar espejo).
4. Vuelve a ejecutar el script y reporta el antes/después.
5. Lo que el script no ve (contenido, intención de búsqueda, velocidad real) se revisa a mano con las reglas de abajo.

## Reglas del sitio

**Títulos y descripciones**
- `<title>` 30–60 caracteres, con la palabra clave principal al inicio y la marca al final. Único por página e idioma.
- Meta description 70–160 caracteres, con beneficio y llamada a la acción; no repetir el título.
- Frases ancla (es): "transformación digital" combinada con el nicho, "automatización de procesos con IA", "CRM para clínicas estéticas", "agente de IA WhatsApp", "marketing digital para salud". (en): "digital transformation for clinics", "business process automation AI", "aesthetic clinic software", "WhatsApp automation for clinics". No usar "transformación digital" sola (intención informativa en Colombia).
- No rellenar con palabras clave: una intención principal por página.

**Encabezados**
- Un solo `<h1>` por página que diga qué es y para quién; `h2` por sección sin saltar niveles. Texto del h1 visible aunque la animación palabra por palabra esté activa (se conserva `aria-label`).

**Idiomas (hreflang)**
- Cada página enlaza a todas sus versiones **y a sí misma**: `es`, `en` y `x-default` (ES). Los `canonical` son URL absolutas y propios de cada idioma. Mantener `<html lang>` correcto y `og:locale` (`es_CO` / `en_US`).

**Imágenes y medios**
- `alt` descriptivo y traducido (decorativas: `alt=""`). Siempre `width`/`height`. WebP/SVG; <150 KB cuando sea posible. Hero con `fetchpriority="high"`, el resto `loading="lazy"`.
- Imagen para compartir (`og:image` 1200×630 + `twitter:image`) con el logo. Es el aviso más visible hoy.

**Datos estructurados (JSON-LD)**
- `Organization`/`ProfessionalService` con `name`, `url`, `logo`, `email`, `areaServed`, `sameAs` (cuando existan redes). Añadir `SoftwareApplication` para la plataforma y `FAQPage` si se agregan preguntas frecuentes reales. Solo datos veritables (no inventar reseñas ni calificaciones).

**Rastreo e indexación**
- `sitemap.xml` con ambas versiones y `xhtml:link` de hreflang; `robots.txt` apuntando al sitemap.
- Con dominio propio en la raíz, `robots.txt` y `sitemap.xml` viven en `https://erconnectia.com/`. Enviar el sitemap por Google Search Console y Bing Webmaster.
- `404.html` útil, con enlaces al inicio. Enlaces internos con texto descriptivo (no "clic aquí").

**Rendimiento (Core Web Vitals)**
- LCP: imagen del hero ligera y priorizada. CLS: dimensiones en imágenes, sin saltos al cargar fuentes (`font-display:swap`, preconnect ya presente). INP: JS mínimo; no añadir librerías pesadas de animación.
- Las animaciones usan solo `transform`/`opacity` (ver skill `emil-motion`) y respetan `prefers-reduced-motion`.

**Contenido**
- Páginas con ≥300 palabras útiles. Cubrir preguntas reales del cliente (precio, tiempos, integración con WhatsApp, seguridad de datos). Datos de ejemplo de la sección Plataforma van marcados como ilustrativos.
- Páginas legales: `description` propia; pueden ir con `noindex,follow` si no queremos que compitan.

## Entregables habituales
`sitemap.xml`, `robots.txt`, `404.html`, `og-image.png`, JSON-LD ampliado, ajuste de títulos/descripciones ES/EN, `alt` revisados, enlaces internos entre secciones.

## Al responder
Informa conteos antes/después y los archivos tocados. No afirmes mejoras de posicionamiento: el SEO es gradual; sí puedes confirmar qué quedó técnicamente correcto. Si falta un dato (dominio, correo, redes), pregúntalo en lugar de inventarlo.
