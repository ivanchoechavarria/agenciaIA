---
name: emil-motion
description: Diseño de interfaz y animación con criterio de Emil Kowalski (animaciones rápidas, con propósito, detalles invisibles que se sienten). Úsala al añadir o revisar transiciones, hover, reveal on scroll, micro-interacciones, menús, botones o cualquier movimiento en el sitio de IAechavarría.
---

# Emil Motion — animación con criterio para este sitio

Stack: HTML/CSS/JS puro (`index.html`, `en/index.html`, `assets/css/style.css`, `assets/js/main.js`). Sin librerías de animación: CSS primero, JS mínimo. Usa SIEMPRE los tokens existentes (`--teal`, `--gold`, `--panel`, `--radius-*`, `--shadow-lift`); nunca hex nuevos. Debe funcionar en modo oscuro y claro (`html[data-theme="light"]`) y en ES y EN.

## Principios (en orden de prioridad)

1. **¿Debe animarse?** Si el usuario lo ve muchas veces al día (nav, hover de links, abrir menú) → casi nada o muy rápido. Animación decorativa solo en momentos únicos (hero, primera vista de una sección).
2. **Rápido.** UI: 120–220 ms. Entradas de sección: 400–600 ms máx. Nunca >300 ms en interacciones directas (hover/press/toggle).
3. **Easing, no `ease`/`linear`.** Define y reutiliza:
   ```css
   --ease-out: cubic-bezier(.23,1,.32,1);      /* entradas, respuestas a input */
   --ease-in-out: cubic-bezier(.77,0,.175,1);  /* movimiento en pantalla */
   --ease-drawer: cubic-bezier(.32,.72,0,1);   /* menú móvil / paneles */
   ```
   Nunca `ease-in` en UI (se siente lento al arrancar).
4. **Solo `transform` y `opacity`** (y `filter` puntual). No animar `width/height/top/left/margin`. Evita `transition: all`; lista las propiedades.
5. **Nada nace de `scale(0)`.** Empieza en `scale(.95)` + `opacity:0`. Popovers/menús: `transform-origin` en el punto de disparo.
6. **Feedback táctil.** Botones: `:active{transform:scale(.97)}` con 100–160 ms. Hover solo bajo `@media (hover:hover) and (pointer:fine)` para no disparar en táctil.
7. **Stagger corto.** 40–80 ms entre elementos hermanos, máx. ~5 elementos; no encadenar más de ~400 ms total.
8. **Interrumpible.** Preferir `transition` sobre `@keyframes` para estados (se revierten con fluidez). Keyframes solo para secuencias de una vez o loops ambientales.
9. **Detalle sobre espectáculo.** Sombras que cambian con el hover, `text-wrap:balance` en títulos, `-webkit-font-smoothing:antialiased`, números con `font-variant-numeric:tabular-nums`, radios concéntricos (radio exterior = interior + padding).
10. **Accesibilidad.** Ya existe el bloque `prefers-reduced-motion` global en `style.css`; no lo dupliques. Para parallax/loops largos pausa con esa media query. Mantén `:focus-visible` visible.

## Receta de revisión (haz esto antes de editar)

1. Lee solo la sección implicada de `style.css` (usa `grep -n` por clase; no leas el archivo completo).
2. Lista problemas: `ease` genérico, `transition: all`, duraciones >300 ms en interacción, hover sin media query, animación de layout.
3. Aplica el cambio mínimo. Reutiliza `.reveal` / `.is-visible` (ya manejado por IntersectionObserver en `main.js`) en lugar de crear observers nuevos; añade retrasos con `style="--d:60ms"` y `transition-delay:var(--d,0ms)`.
4. Verifica contraste y apariencia en ambos temas y a 375 px de ancho.

## Patrones listos

```css
/* Tarjeta con elevación */
.card{transition:transform .2s var(--ease-out), box-shadow .2s var(--ease-out), border-color .2s var(--ease-out);}
@media (hover:hover) and (pointer:fine){
  .card:hover{transform:translateY(-3px);box-shadow:var(--shadow-lift);border-color:var(--teal);}
}
.btn:active{transform:scale(.97);}

/* Reveal con stagger */
.reveal{opacity:0;transform:translateY(14px);transition:opacity .5s var(--ease-out),transform .5s var(--ease-out);transition-delay:var(--d,0ms);}
.reveal.is-visible{opacity:1;transform:none;}

/* Imagen que "aterriza" (pareja de la skill kie-images) */
.media img{transform:scale(1.04);opacity:0;transition:opacity .6s var(--ease-out),transform .9s var(--ease-out);}
.media img.is-loaded{transform:none;opacity:1;}
```

## Ahorro de tokens
- No releas archivos completos; `grep` + lectura por rango.
- Un solo cambio coherente por turno; no propongas rediseños no pedidos.
- Responde con el diff resumido, no con el archivo entero.
