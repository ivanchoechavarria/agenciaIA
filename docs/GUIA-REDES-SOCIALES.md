# Guía: renombrar Facebook e Instagram a ERconnectIA

Los menús de Meta cambian con frecuencia; la ruta general es esta. Haz los cambios desde el celular (Instagram) y desde un computador (Facebook / Meta Business Suite).

## Materiales listos (`assets/img/social/`)
| Archivo | Para qué |
|---|---|
| `profile-1080.png` | Foto de perfil de Instagram, Facebook y WhatsApp Business (cuadrada; las plataformas la muestran en círculo y el símbolo ya queda dentro del círculo) |
| `facebook-cover.png` (1640×624) | Portada de la página de Facebook (el logo está centrado para que no lo recorte la vista móvil) |
| `og-image-es.png` / `og-image-en.png` | Imagen que aparece al compartir el enlace del sitio (ya está enlazada en el HTML) |

## Datos para usar (los mismos en todas las redes)
- **Nombre:** `ERconnectIA`
- **Usuario / @:** `erconnectia` (comprueba disponibilidad; si no está libre, `erconnectia.co` o `erconnectia_ia`, y usa el mismo en ambas redes)
- **Sitio web:** `https://erconnectia.com`
- **Categoría:** Empresa de software / Servicios de tecnología
- **Bio corta (máx. 150 caracteres):**
  - ES: `CRM conversacional con IA + WhatsApp Business API. Atiende, agenda y mide a tus clientes 24/7.`
  - EN: `Conversational CRM with AI + WhatsApp Business API. Answer, book and track customers 24/7.`
- **Correo:** el actual por ahora (`contacto@iaechavarria.com`).

## 1. Instagram (desde la app)
1. **Perfil → Editar perfil.**
2. **Nombre:** `ERconnectIA` (es el que aparece en las búsquedas; puedes añadir ` | CRM con IA`, hasta 30 caracteres).
3. **Nombre de usuario:** `erconnectia`. Instagram limita los cambios frecuentes y el usuario anterior queda libre para otras personas.
4. **Foto:** *Editar imagen o avatar → Subir* → `profile-1080.png`.
5. **Biografía:** pega la bio corta. **Enlaces → Añadir enlace externo** → `https://erconnectia.com`.
6. Si la cuenta es personal, pásala a profesional: **Configuración → Tipo de cuenta y herramientas → Cambiar a cuenta profesional → Empresa**, y elige la categoría. Así se activan estadísticas y el botón de contacto.
7. **Vincular con Facebook:** Editar perfil → *Páginas* (o Centro de cuentas) → conecta la página de Facebook para publicar en ambas.

## 2. Página de Facebook
1. Abre la página (como administrador) → **Configuración y privacidad → Configuración → Información de la página** (en Meta Business Suite: *Configuración → Información de la página*).
2. **Nombre:** editar → `ERconnectIA` → enviar. Meta lo revisa (hasta ~3 días) y después no deja cambiarlo de nuevo por un tiempo; revísalo bien antes de enviar.
3. **Nombre de usuario (@):** `erconnectia`.
4. **Foto de perfil:** `profile-1080.png`. **Foto de portada:** `facebook-cover.png`.
5. **Información / Acerca de:** sitio web `https://erconnectia.com`, categoría, descripción y correo.
6. **Botón de acción:** *Añadir botón → Enviar mensaje de WhatsApp* con el número del negocio.
7. Si la página tenía el nombre y el diseño anteriores, publica una entrada corta anunciando el cambio de marca.

## 3. WhatsApp Business
- Cambia la foto del perfil por `profile-1080.png` y el nombre del negocio por `ERconnectIA`.
- Para la **API oficial**, Meta valida el *nombre para mostrar* contra el sitio web: debe coincidir con la marca y el dominio (`erconnectia.com`). Publica el sitio antes de solicitarlo.

## 4. Después de renombrar
1. **Pásame las URL reales** de Facebook e Instagram: actualizo los íconos del pie de página (hoy son `#`) y el campo `sameAs` de los datos estructurados, que ayuda a Google a asociar el sitio con los perfiles.
2. **Cuando el sitio esté en `erconnectia.com`**, pega la dirección en el [Depurador de Compartir de Facebook](https://developers.facebook.com/tools/debug/) y pulsa *Volver a extraer* para que tome la nueva imagen. La imagen para redes no aparecerá hasta que el dominio esté publicado.
3. Publica la misma bio y enlace en cualquier otro perfil (LinkedIn, Google Business Profile si aplica).
