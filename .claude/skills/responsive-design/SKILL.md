---
name: responsive-design
description: Reglas de diseño responsive y auditoría automática (desbordes, texto pegado a bordes, objetivos táctiles) para el sitio ERconnectIA. Úsala al crear o modificar secciones, tarjetas, encabezado, menú o cualquier maquetación, y antes de publicar para comprobar móvil y tablet.
---

# Responsive design — ERconnectIA

Diseña **mobile-first** (320–390 px) y amplía a tablet (768) y escritorio (≥981). Verifica siempre en tema oscuro y claro. Complementa a `emil-motion` (movimiento) y `seo-audit` (SEO).

## Reglas del sistema
1. **Gutter** de 20 px en móvil (`.wrap`); nada puede ser más ancho que la pantalla (`html{overflow-x:clip}` es una red de seguridad, no la solución: corrige la causa).
2. **Separación texto ↔ borde ≥ 12 px** dentro de tarjetas, paneles, botones y chips. Padding de tarjetas: 22–26 px en móvil, 30+ en escritorio. En mockups de columnas estrechas (kanban) se admite 8–9 px solo por debajo de 560 px.
3. **Ritmo vertical constante:** `padding-block: clamp(52px, 8vw, 84px)` por sección. Cada sección empieza con una barra de acento en su `h2` (`.section-head h2::before`). Alterna bandas (`--band`) con bordes finos en `.services` y `.how` para que se distingan las secciones.
4. **Tipografía móvil:** h1 32 px, h2 28 px, texto 16–17 px, interlineado ≥1.5; `text-wrap: balance` en títulos y `pretty` en párrafos. Citas largas ≤ 20 px.
5. **Objetivos táctiles ≥ 30–36 px** (ideal 44): enlaces sueltos con `padding` vertical, botones de icono 34–38 px.
6. **Encabezado:** ≤980 px usa hamburguesa; 981–1279 px el botón de WhatsApp va solo con icono; ≥1280 px completo. El logo baja a 26 px (≤400) y 22 px (≤350).
7. **Fondos decorativos** (aurora, haz, imagen del hero) siempre con degradado hacia `--bg` en el borde para que no se vea un corte.
8. **Botón flotante de WhatsApp:** 52 px en móvil y `footer` con `padding-bottom` ≥ 100 px para que no tape texto.

## Flujo
1. `node scripts/responsive-audit.mjs` (o la tarea de VS Code "5. Auditoría responsive"). Mide 320, 360, 390, 768 y 1024 px en oscuro y claro. Opciones: `--widths 360,414 --pages index.html --min 14`.
2. Corrige primero los **desbordes** (↔), luego **texto pegado** (▢) y **táctiles** (☝). Los avisos sobre `.hero-bg`, `.aurora` o contenido dentro de contenedores con `overflow:hidden` no cuentan.
3. Confirma a ojo en 360 y 390 px (el menú abierto, la sección Plataforma con las 4 pestañas, el pie de página) y en modo claro.
4. Antes de publicar: `node scripts/responsive-audit.mjs` debe terminar sin desbordes.

## Recursos con huella y pruebas de comportamiento
- El build (`scripts/build.mjs`) añade `?v=<huella>` a todo CSS, JS e imagen enlazados desde el HTML. Hostinger cachea estáticos por días: sin huella se mezclaba HTML nuevo con CSS/JS viejos. No quites esta función ni enlaces recursos con rutas que el build no reescriba (deben ir como `href="/assets/…"` o `src="/assets/…"`).
- `node scripts/chat-test.mjs` (tarea "2c") verifica el chat del hero: estilos cargados, bucle que arranca con una nota de voz en ES y EN, alternancia de idiomas, conversación sin recortes a 320–1280 px, selector ES/EN, y pausa solo con ratón (en táctil no debe congelarse). Ejecútala tras tocar el chat.
- `node scripts/consent-test.mjs` (tarea "2d") verifica el aviso de cookies (aparece, es accesible, sin consentimiento el tema no se guarda, "Solo lo necesario" y "Aceptar preferencias", reapertura desde el pie), que el aviso no tape el botón de WhatsApp, que todos los enlaces a WhatsApp abran en pestaña nueva y que el pie traiga los enlaces legales. Ejecútala tras tocar el aviso, el pie o los enlaces.
- El pie de página es una pieza compartida (`partials/footer.*.html`): 4 columnas en escritorio, 2 en tablet y 1 en móvil, con separación ≥12 px y enlaces de al menos 36 px de alto.
