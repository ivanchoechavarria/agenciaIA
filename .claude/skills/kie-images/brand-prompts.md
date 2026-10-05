# Línea visual IAechavarría (para prompts)

Paleta: fondo azul noche `#0A0E17`, teal `#1FD1B8`, dorado `#E8AE4D`, texto claro `#EEF0F4`. Modo claro: crema `#F5F4EF`, verde profundo `#0F3D3E`.
Tono: profesional, sobrio, tecnológico pero cálido; sin estética "robot azul genérico".

## Prefijo de marca (pegar al inicio de todo prompt)
```
Premium editorial tech aesthetic, deep midnight navy background (#0A0E17), luminous teal (#1FD1B8) and warm gold (#E8AE4D) accents, soft volumetric glow, subtle film grain, generous negative space, cinematic soft lighting, ultra clean, no text, no logos, no watermark
```

## Sufijos por uso
- **Hero / fondo (16:9 o 21:9):** `abstract flowing light ribbons and soft aurora gradients, depth of field, composition weighted to the right leaving left third empty for headline`
- **Tarjeta de servicio (4:3 o 1:1):** `single conceptual 3D object symbolizing {automation | chatbot | integration}, matte glass and brushed metal, centered, isolated on dark gradient`
- **Nicho / sección (3:2):** `minimal isometric scene of {restaurante | clínica | tienda} workflow, small glowing nodes connecting objects, teal line accents`
- **Nosotros (4:5):** `warm editorial portrait lighting, shallow depth of field, dark neutral background, gold rim light` (solo si se usa una foto real de referencia; no inventar personas del equipo).
- **Textura (1:1):** `seamless dark noise texture with faint teal grid lines, very low contrast`

## Negativos útiles (añadir al final)
`no text, no letters, no people faces distorted, no neon purple, no stock-photo look, no clutter`

## Modo claro
Las imágenes oscuras funcionan en ambos temas si van enmarcadas en una tarjeta con `--radius-lg`. Para fondos a pantalla completa en modo claro, genera una variante con prefijo: `cream background (#F5F4EF), deep forest teal (#0F3D3E) and amber (#B87B22) accents` y alterna con `<picture>` + `html[data-theme]` en CSS.
