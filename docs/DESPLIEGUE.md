# Despliegue de erconnectia.com

Dominio canónico: `https://erconnectia.com/` (sin `www`). Todas las rutas del sitio son absolutas desde la raíz (`/assets/...`, `/en/`).

## Fase 1 — GitHub Pages (actual)

1. **DNS del dominio** (en el proveedor donde está registrado):
   - 4 registros `A` para `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - (opcional, IPv6) 4 registros `AAAA` para `@` → `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - 1 registro `CNAME` para `www` → `ivanchoechavarria.github.io`
2. **GitHub**: repositorio → *Settings → Pages → Custom domain* → `erconnectia.com` → Save. Esperar la verificación de DNS y activar **Enforce HTTPS**. El archivo `CNAME` ya está en el repositorio.
3. **Publicar los cambios solo después del paso 2.** Con las rutas en la raíz, la dirección antigua `ivanchoechavarria.github.io/agenciaIA/` dejará de mostrar los estilos hasta que el dominio propio esté activo.
4. **Search Console**: añadir la propiedad `https://erconnectia.com/` (verificación por DNS) y enviar `https://erconnectia.com/sitemap.xml`. Hacer lo mismo en Bing Webmaster Tools.

## Fase 2 — Hostinger (producción)

1. Subir a `public_html` (Administrador de archivos, FTP o Git de hPanel) solo lo público: `index.html`, `404.html`, `privacidad.html`, `en/`, `assets/`, `sitemap.xml`, `robots.txt` y `.htaccess`. **No subir** `docs/`, `.git`, `.claude`, `.env`, `CNAME` ni `node_modules`.
2. Incluir `.htaccess` (fuerza HTTPS, quita `www`, 404 personalizado, compresión y caché). `CNAME` ya no hace falta en Hostinger.
3. Activar el **SSL gratuito** del dominio en hPanel.
4. Cambiar el DNS: los registros `A`/`CNAME` del paso 1 pasan a apuntar a Hostinger (hPanel muestra la IP) o, si el dominio está registrado en Hostinger, basta con asociarlo al hosting. Quitar los registros de GitHub.
5. Mantener la propiedad de Search Console: no cambia, la URL sigue siendo la misma.

## Lista de comprobación tras publicar
- `https://erconnectia.com/`, `/en/`, `/privacidad.html`, `/sitemap.xml`, `/robots.txt` responden 200.
- `http://` y `www` redirigen a `https://erconnectia.com/`.
- Una ruta inexistente muestra `404.html`.
- Ejecutar `node .claude/skills/seo-audit/scripts/audit.mjs` antes de cada publicación.
