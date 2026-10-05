---
name: kie-images
description: Genera imágenes para el sitio de IAechavarría con la API de Kie.ai (barato, sin gastar tokens de Claude en la imagen) manteniendo la línea de marca teal/dorado. Úsala cuando haya que crear fondos, ilustraciones, hero, tarjetas de servicio u otros assets visuales, o redactar prompts de imagen.
---

# Kie.ai Images

Genera la imagen con un script local (`scripts/generate.mjs`); Claude solo redacta el prompt y lo integra en el HTML. Así el costo en tokens es mínimo y el costo por imagen lo marca Kie.ai.

## Requisitos (una vez)
1. Crear API key en https://kie.ai/api-key.
2. Guardarla en `.env` en la raíz del proyecto (ya ignorado por git):
   `KIE_API_KEY=tu_clave`
   Nunca la imprimas, commitees ni la pegues en el chat.
3. Node 18+ (ya instalado). Opcional para WebP: `npm i -D sharp` (si no está, se guarda el formato original).

## Uso
```
node .claude/skills/kie-images/scripts/generate.mjs --name hero-bg --prompt "<prompt>" --ratio 16:9 [--model google/nano-banana] [--format png|jpeg]
```
Salida: `assets/img/<name>.(webp|png|jpg)`. Una imagen por llamada. **Genera 1 y revísala antes de pedir más** (cada intento cuesta créditos).

## Flujo
1. Decide qué imagen aporta valor (hero, 3 servicios, nicho, nosotros). No generes decorativas sin propósito.
2. Redacta el prompt con `brand-prompts.md` (prefijo de marca + sujeto). En inglés rinde mejor.
3. Ejecuta el script, mira la imagen con Read para validar paleta y composición.
4. Intégrala:
   ```html
   <picture class="media"><img src="assets/img/x.webp" width="1600" height="900" loading="lazy" decoding="async" alt="…descriptivo ES/EN…" onload="this.classList.add('is-loaded')"></picture>
   ```
   Hero: sin `loading="lazy"`, con `fetchpriority="high"`. Siempre `width/height` (evita saltos de layout) y `alt` traducido en `en/index.html`.
5. Animación de entrada: usa la skill `emil-motion` (patrón `.media img`).

## Reglas de costo
- Modelo por defecto `google/nano-banana` (rápido y económico). Cambia de modelo solo si el resultado es insuficiente.
- Una variante primero; itera el prompt, no regeneres a ciegas.
- Reutiliza imágenes entre ES/EN (misma ruta).
- Consulta precios vigentes en https://kie.ai/market antes de lotes grandes.

## Notas de API (verificadas en docs.kie.ai)
- Crear: `POST https://api.kie.ai/api/v1/jobs/createTask` con `{model, input:{prompt, aspect_ratio, output_format}}` → `data.taskId`.
- Consultar: `GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId=…` → `data.state` (`waiting|queuing|generating|success|fail`) y `data.resultJson` (string JSON con `resultUrls`).
- Auth: `Authorization: Bearer $KIE_API_KEY`.
