# Despliegue: VS Code → GitHub → Hostinger

## Cómo funciona

```
VS Code ── commit + push ──► GitHub (rama main)
                               │
                               ├─► Actions "Pruebas"  ──► GitHub Pages
                               │      https://ivanchoechavarria.github.io/agenciaIA/   (noindex + aviso "Entorno de pruebas")
                               │
                               └─► Tú decides publicar (tarea de VS Code)
                                     etiqueta v20261005-1530
                                       └─► Actions "Producción" ──► rama production
                                              └─► Hostinger (Git, auto-deploy) ──► https://erconnectia.com
```

- **Cada push a `main`** actualiza la URL de pruebas de GitHub. No toca producción y los buscadores no la indexan.
- **Producción solo cambia cuando tú publicas** (etiqueta `v*`). Así revisas primero en pruebas.
- A producción **solo sube lo listado en `site.config.json`** (`include`). `docs/`, `.claude/`, `.env`, `scripts/` y el resto del repositorio nunca llegan al servidor.
- La rama `production` la escribe GitHub Actions; no se edita a mano.

## Configuración única

### 1. GitHub
1. Repositorio → **Settings → Pages → Build and deployment → Source: GitHub Actions**. Si en *Custom domain* aparece `erconnectia.com`, bórralo (el dominio propio va a Hostinger, no a GitHub).
2. **Settings → Actions → General → Workflow permissions → Read and write permissions** (necesario para crear la rama `production`).
3. Haz commit y push de estos cambios. En **Actions** verás "Pruebas (GitHub Pages)"; al terminar, la URL de pruebas queda activa.
4. **Crear la rama `production`:** Actions → **Producción (Hostinger)** → *Run workflow* (rama `main`). Cuando termine, existirá la rama `production` en el repositorio.

### 2. Hostinger
1. **hPanel → Websites → Add website** y asocia el dominio `erconnectia.com` (Hostinger te indicará los nameservers; ver sección 3).
2. **File Manager → `public_html`:** borra los archivos por defecto (p. ej. `default.php`). La carpeta debe estar **vacía** para el primer despliegue.
3. **Websites → Manage → Advanced → Git → Connect with GitHub.** Instala la *Hostinger GitHub App* sobre el repositorio `agenciaIA`, elige la rama **`production`**, directorio **`public_html`** y deja activado el despliegue automático.
4. **SSL:** hPanel → Security → SSL → activa el certificado gratuito y *Force HTTPS*.
5. Si no ves **Advanced → Git**, tu plan no incluye despliegue por Git: avísame y cambio el flujo a SFTP (puerto 65002).

### 3. Pasar el dominio de GoDaddy a Hostinger
**Opción A — cambiar los nameservers (rápida, recomendada).** El dominio sigue registrado en GoDaddy pero el DNS pasa a Hostinger:
1. Antes, anota los registros que tengas en GoDaddy (sobre todo `MX` y `TXT` si usas correo): Hostinger no los copia solos. Hoy no hay registros `MX`.
2. GoDaddy → Dominios → `erconnectia.com` → **DNS → Nameservers → Cambiar → "Usar mis propios nameservers"** y escribe los que muestre hPanel (normalmente `ns1.dns-parking.com` y `ns2.dns-parking.com`; confírmalos en hPanel).
3. La propagación suele tardar menos de una hora y puede llegar a 24–48 h. Hostinger crea los registros del sitio al asociar el dominio.

**Opción B — transferir el registro a Hostinger.** Desbloquea el dominio y pide el código de autorización en GoDaddy, y luego inicia la transferencia en Hostinger (5–7 días, suma un año de renovación). No es necesaria para alojar el sitio; puedes hacerla más adelante.

## Día a día en VS Code
Terminal → **Run Task…** (o `Ctrl+Shift+P` → *Tasks: Run Task*):

| Tarea | Para qué |
|---|---|
| **1. Ver sitio en local** | `http://localhost:5500/`. Úsala en lugar de abrir `index.html` con doble clic: el sitio usa rutas desde la raíz |
| **2. Auditoría SEO** | Revisa títulos, descripciones, enlaces, imágenes, hreflang… |
| **2b. Auditoría responsive** | Desbordes, texto pegado y objetivos táctiles en 320–1440 px, oscuro y claro |
| **2c. Prueba del chat del hero** | Bucle, audio inicial, ES/EN, que no se recorte y que no se congele en táctil |
| **3. Probar versión de pruebas en local** | Simula GitHub Pages en `http://localhost:5501/agenciaIA/` |
| **4. PUBLICAR EN PRODUCCIÓN** | Comprueba, pide confirmación y crea la versión que se despliega en Hostinger |

**Flujo normal**
1. Edita el sitio y revísalo con la tarea 1.
2. **Commit y Push** (Control de código fuente de VS Code). En 1–2 minutos queda en la URL de pruebas.
3. Revisa la URL de pruebas (escritorio y móvil).
4. Ejecuta la tarea **4. PUBLICAR EN PRODUCCIÓN**. Crea la etiqueta `vAAAAMMDD-HHmm`; GitHub Actions valida, construye y actualiza `production`; Hostinger lo despliega solo (1–2 minutos).

La publicación se detiene si hay cambios sin guardar, si no estás en `main`, si tienes commits sin subir o si la auditoría SEO tiene errores.

## Volver a una versión anterior
GitHub → Actions → **Producción (Hostinger)** → *Run workflow* → en *Use workflow from* elige la **etiqueta** de la versión que quieres recuperar.

## Nuevos sitios (misma plantilla)
1. Marca este repositorio como plantilla: **Settings → General → Template repository**.
2. Para cada sitio nuevo: *Use this template* → nuevo repositorio.
3. Edita `site.config.json` (`name`, `domain`, `productionUrl`, `include`) y reemplaza el dominio y las rutas propias del sitio.
4. En Hostinger agrega el nuevo sitio (según tu plan) y conéctalo a su repositorio, rama `production`, como en la sección 2.
5. En GitHub, Source de Pages = GitHub Actions y permisos de lectura y escritura, como en la sección 1.

## Problemas frecuentes
| Síntoma | Causa y solución |
|---|---|
| Hostinger dice que el directorio no está vacío | Vacía `public_html` antes del primer despliegue |
| No existe la rama `production` | Ejecuta a mano el flujo "Producción (Hostinger)" |
| El flujo de Producción falla al subir | Revisa *Workflow permissions* (lectura y escritura) |
| La URL de pruebas se ve sin estilos | Abriste el HTML sin servidor o las rutas no se reescribieron: usa las tareas 1 o 3 |
| Producción muestra el HTML nuevo pero CSS/JS viejos (el chat sale sin estilos) | La caché de Hostinger guarda los estáticos días o semanas. Desde ahora el build añade una huella a cada recurso (`style.css?v=ab12cd34`), así que cada cambio es una URL nueva. Si ves un caso raro: hPanel → Rendimiento / Caché → *Purgar todo* y recarga con `Ctrl+F5` |
| Cambios que no aparecen en producción | Purga la caché en hPanel y recarga sin caché (`Ctrl+F5`) |
| `docs/` o `.claude/` accesibles en producción | No pueden estarlo: solo se sube lo de `include`. Revisa `site.config.json` |

## Comprobación tras publicar
Sustituye el dominio si cambia. Todo debe responder como se indica:

| Dirección | Debe responder |
|---|---|
| `https://erconnectia.com/`, `/en/`, `/privacidad/`, `/en/privacy/` | 200 |
| `/sitemap.xml`, `/robots.txt`, `/favicon.ico` | 200 |
| `http://erconnectia.com/` y `https://www.erconnectia.com/` | 301 → `https://erconnectia.com/` |
| `/index.html` y `/en/index.html` | 301 → `/` y `/en/` |
| `/privacidad.html` | 301 → `/privacidad/` |
| `/en/privacidad.html` | 301 → `/en/privacy/` |
| Una ruta inexistente | página 404 propia |
| `/docs/`, `/.claude/`, `/scripts/` | 404 (no se publican) |

Prueba rápida de una redirección: `curl -sI https://erconnectia.com/index.html` debe mostrar `301` y `location: https://erconnectia.com/`.

Si añades páginas nuevas, crea una carpeta con su `index.html` (`/crm-whatsapp/`), agrégala a `sitemap.xml` y ejecuta la auditoría SEO: avisa de enlaces con `.html` y de un sitemap incoherente.

## Seguridad
- `.env` (clave de Kie.ai) está en `.gitignore` y no se versiona.
- No guardes contraseñas de Hostinger en el repositorio: la conexión usa la *GitHub App*, sin credenciales en GitHub.
- El repositorio es público: lo que subas a `main` (incluidas `docs/` y `.claude/`) lo puede ver cualquiera aunque no se publique en el sitio.
