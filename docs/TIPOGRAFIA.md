# Tipografías del sitio

Las tipografías se sirven **desde este mismo servidor**: el navegador del visitante no se conecta a Google ni a ningún tercero para mostrarlas (mejor privacidad, sin transferencia de IP y una conexión menos).

| Uso | Tipografía | Archivo | Licencia |
|---|---|---|---|
| Títulos y logotipo de texto | **Fraunces** (variable: grosor y tamaño óptico) | `assets/fonts/fraunces-latin-opsz-normal.woff2` | SIL OFL 1.1 |
| Texto, botones, menús | **Inter** (variable: grosor) | `assets/fonts/inter-latin-wght-normal.woff2` | SIL OFL 1.1 |

Peso total: unos 115 KB (subconjunto latino, que cubre español e inglés). Las licencias están en `assets/fonts/LICENSE-*.txt`; la licencia OFL permite alojarlas y redistribuirlas.

## Dónde está definido (solo 3 lugares)
1. **`assets/css/style.css`**, al principio: los bloques `@font-face` (qué archivo es cada tipografía) y las variables:
   ```css
   --font-display: 'Fraunces', Georgia, serif;   /* títulos */
   --font-body:    'Inter', system-ui, sans-serif; /* texto  */
   ```
   Todo el CSS usa esas dos variables; ningún otro sitio escribe el nombre de una tipografía.
2. **`partials/head-fonts.html`**: las líneas `preload` que adelantan la descarga. Es una pieza compartida: se edita una vez y se aplica a todas las páginas.
3. **`assets/fonts/`**: los archivos `.woff2`.

## Cómo cambiar de tipografía (cambio masivo = 4 pasos)
Ejemplo: cambiar el texto a *Source Sans 3* y los títulos a *Playfair Display*.

1. **Consigue los archivos `.woff2`** (preferiblemente variables y solo el subconjunto *latin*): en [fontsource.org](https://fontsource.org) (paquetes `@fontsource-variable/...`) o [gwfh.mranftl.com](https://gwfh.mranftl.com/fonts). Comprueba que la licencia permite alojarla y guarda su licencia en `assets/fonts/`.
2. **Copia los archivos** a `assets/fonts/`.
3. **Edita `style.css`**: en cada `@font-face` cambia `font-family`, el archivo de `src: url(../fonts/…)` y, si no es variable, un bloque por cada grosor (`font-weight:400`, `700`…). Luego cambia las dos variables `--font-display` y `--font-body`.
4. **Edita `partials/head-fonts.html`** con los nombres de los archivos nuevos.

Después: `node scripts/responsive-audit.mjs` (el tamaño de la letra puede mover líneas) y revisa el sitio en oscuro y claro.

## Reglas
- `font-display: swap`: el texto se ve de inmediato con una tipografía de respaldo y cambia cuando carga la propia.
- Las fuentes **no llevan huella** (`?v=`): el build las excluye porque el CSS las pide por su nombre. Si cambias el contenido de un archivo sin cambiar su nombre, renómbralo (p. ej. `…-v2.woff2`) para que no se quede una copia vieja en la caché (el servidor las guarda un año).
- Si algún día se necesitan más caracteres (otros idiomas), añade el subconjunto `latin-ext` con su propio `@font-face` y `unicode-range`.
- La auditoría SEO avisa si algo vuelve a cargar tipografías de Google.
