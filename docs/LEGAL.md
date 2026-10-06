# Revisión legal y de privacidad — ERconnectIA

> **Importante:** esta revisión es una guía de trabajo, no asesoría legal. Los textos publicados se redactaron según la normativa colombiana y estándares internacionales conocidos, pero **deben ser revisados por un abogado** (idealmente con experiencia en protección de datos) antes de publicarse, y las normas y fechas citadas conviene verificarlas porque cambian.

## 1. Qué hace hoy el sitio con los datos (inventario real)

| Qué | Detalle | Consecuencia |
|---|---|---|
| Cookies HTTP | **Ninguna.** El servidor no envía `Set-Cookie` | No hay cookies de seguimiento ni publicidad |
| Almacenamiento del navegador | Solo `erconnectia-theme` (tema claro/oscuro), y solo cuando el visitante pulsa el botón de tema | Funcionalidad solicitada por el usuario: no requiere consentimiento |
| Terceros que cargan al abrir el sitio | **Ninguno.** Las tipografías se alojan en el propio servidor (ver `docs/TIPOGRAFIA.md`) | Sin transferencia de IP a terceros |
| Alojamiento | Hostinger | Registra IP y datos técnicos en logs del servidor |
| Contacto | WhatsApp (Meta), correo | Datos personales: nombre, teléfono, mensajes y audios transcritos |
| IA | Proveedores como Anthropic y OpenAI | Transmisión de contenido de mensajes a terceros, posiblemente fuera de Colombia |

## 2. Documentos que debes tener

| Documento | ¿Necesario? | Base | Estado |
|---|---|---|---|
| Política de tratamiento de datos personales / privacidad | **Sí** | Ley 1581/2012 y Decreto 1377/2013 (compilado en el D. 1074/2015) | ✅ Publicada en `/privacidad/` y `/en/privacy/` |
| Autorización informada en cada canal de captura (WhatsApp, formularios) | **Sí** | Ley 1581, art. 9 | ⚠ Falta implementarla en el **primer mensaje del agente de WhatsApp** (ver 5.3) |
| Términos y condiciones de uso del sitio, con identificación del titular | Muy recomendado | Ley 527/1999 y Ley 1480/2011 (transparencia en comercio electrónico) | ✅ `/terminos/` y `/en/terms/` |
| Política de cookies | Recomendada (obligatoria para visitantes de la UE) | Ley 1581 (principios) · Directiva ePrivacy / RGPD | ✅ `/cookies/` y `/en/cookies/` |
| **Contrato de servicios con cada cliente** (alcance, SLA, uso aceptable, limitaciones de la IA, responsabilidad) | **Sí** | Código de Comercio / Código Civil | ⚠ Pendiente: preparar plantilla |
| **Contrato de transmisión de datos** con cada cliente (tú como *encargado*) | **Sí, cuando procesas datos de pacientes/clientes de otra empresa** | Decreto 1377/2013 | ⚠ Pendiente: plantilla, junto con el contrato de servicios |
| Manual interno de políticas y procedimientos de datos | Sí (deber del responsable) | Ley 1581, art. 17 | ⚠ Pendiente: documento interno corto |
| Registro Nacional de Bases de Datos (RNBD) | **Verificar si te aplica** | Decretos 886/2014 y 090/2018 (sociedades con activos totales superiores a 100.000 UVT) y Circular Única de la SIC | ⚠ Confirmar con tu contador/abogado |
| Procedimiento de incidentes de seguridad | Sí | Circular Única SIC (reporte de incidentes al RNBD, plazo de 15 días hábiles desde su detección — verificar) | ⚠ Pendiente |
| Contratos/DPA con proveedores (Meta, IA, hosting, base de datos) | Recomendado | Ley 1581 (encargados y transmisiones) | ⚠ Revisar condiciones de cada proveedor |

## 3. Datos de identificación (ya cargados)
Están en la sección `legal` de `site.config.json`. El build de producción **se niega a publicar** si algún campo queda vacío:

| Campo | Qué es | Dónde aparece |
|---|---|---|
| `titular` | Nombre completo (si eres persona natural) o razón social | Términos, privacidad, cookies, pie de página |
| `nit` | NIT (con dígito de verificación) | Mismos lugares |
| `domicilio` | Ciudad y dirección donde recibes notificaciones | Términos y privacidad |

Valores actuales: titular «ERconnectIA», NIT 81003431, domicilio «Carrera 46 # 26 - 162, Bello, Antioquia». **Revisa con tu contador/abogado** si el NIT debe llevar el dígito de verificación (p. ej. `81003431-X`) y si en «titular» debe figurar la razón social completa con su tipo societario (p. ej. «ERconnectIA S.A.S.») o tu nombre como persona natural. Además están `email` (`info@erconnectia.com`), `telefono`, `pais` y las fechas de vigencia. Si cambias el texto de alguna política, actualiza también `vigencia` y `vigenciaEn`.

## 4. Marco normativo consultado (verificar vigencia)
- **Colombia:** Constitución art. 15; Ley 1581 de 2012; Decreto 1377 de 2013 (compilado en el D. 1074 de 2015); Ley 1480 de 2011 (Estatuto del Consumidor); Ley 527 de 1999; Decretos 886/2014 y 090/2018 y Circular Única de la SIC (RNBD y transferencias internacionales).
- **Internacional:** RGPD (UE 2016/679); Directiva ePrivacy 2002/58/CE; Reglamento de IA de la UE (UE 2024/1689), cuyo art. 50 exige informar a las personas de que interactúan con un sistema de IA (**verifica la fecha de aplicación vigente**); CCPA/CPRA solo si superas sus umbrales; **HIPAA** si algún día atiendes a prestadores de salud de EE. UU. que traten información de pacientes (requiere acuerdos específicos; no uses WhatsApp para ese tipo de información sin asesoría).
- **Plataformas:** Términos y Política de Mensajería de WhatsApp Business (Meta): exigen *opt-in* previo y limitan qué datos sensibles pueden pedirse.

## 5. Sugerencias

### 5.1 Cookies y almacenamiento (lo que preguntaste)
Hoy es lo correcto: solo lo necesario y una preferencia con consentimiento. Si quieres **aprender de tus visitantes** sin romper esa postura, de menor a mayor riesgo:

1. ~~Alojar las tipografías en tu propio servidor~~ **Hecho.** Ya no hay ningún tercero al cargar el sitio (en la UE hubo sentencias contra sitios que cargaban Google Fonts sin consentimiento).
2. **Analítica sin cookies** (Plausible, Umami o Cloudflare Web Analytics): mide visitas, páginas y orígenes sin identificar personas ni guardar datos en el navegador. Suele poder usarse sin banner, pero decláralo en la política. *La mejor primera opción.*
3. **Medir de dónde viene cada contacto:** parámetros UTM en tus anuncios y un campo "¿cómo nos conociste?" que el agente de WhatsApp pregunte. Sin cookies y más fiable que una cookie.
4. **Analítica clásica (GA4), píxel de Meta o Google Ads (remarketing):** solo con **consentimiento previo por categorías** (analítica / marketing), cargadas únicamente después de aceptar y con opción real de rechazar. El aviso actual está preparado para ampliarse así. Mi sugerencia es no activarlas hasta tener tráfico y campañas que lo justifiquen.
5. **Guardar la fuente de la visita** (UTM) en el navegador para atribuir un contacto a una campaña: hacerlo solo con la categoría de analítica aceptada.
6. Renovar el consentimiento cada 12 meses (ya se guarda la fecha de la elección).

Lo que **no** conviene: cargar herramientas de seguimiento antes del consentimiento, o que "Aceptar todo" sea más visible que "Rechazar".

### 5.1b Aviso de cookies: estado y cómo encenderlo
Mientras el sitio solo guarde el tema (una preferencia que el visitante pide al pulsar el botón), el aviso **está apagado**: no aporta protección legal adicional y añade fricción. El aviso completo (aceptar preferencias / solo lo necesario, enlace «Preferencias de cookies» en el pie, registro de la elección) **ya está construido y probado**; se enciende con una línea en `assets/js/main.js`:
```js
var COOKIE_BANNER = true;   // estaba en false
```
Al conectar GA4 (o cualquier analítica/marketing) hay que: encender ese interruptor, ampliar el aviso con categorías (analítica / marketing, desactivadas por defecto), cargar GA4 **solo después** de aceptar (idealmente con Consent Mode v2) y actualizar la Política de cookies y la de privacidad. `node scripts/consent-test.mjs` prueba ambos estados.

### 5.2 Formulario de contacto
Hoy el contacto es por WhatsApp y correo. Si añades un formulario: casilla **sin marcar** para aceptar la política de privacidad (enlazada), solo los campos imprescindibles, y guardar la prueba de la autorización (fecha y texto aceptado).

### 5.3 Agente de WhatsApp (lo más importante de tu negocio)
- **Primer mensaje** de toda conversación: que es un asistente con IA, el enlace a la política de privacidad y la pregunta de aceptación. Cubre la autorización (Ley 1581) y la transparencia sobre IA.
- **Opt-in y baja:** para mensajes que inicia la empresa, consentimiento previo y una vía simple de baja ("escribe BAJA").
- **Salud y estética:** instruir al agente para **no pedir ni almacenar datos de salud** salvo lo imprescindible, y derivar a una persona. Si el cliente los comparte, tratarlos como datos sensibles (autorización expresa).
- **Retención:** definir un plazo (por ejemplo, borrar o anonimizar conversaciones sin relación comercial tras X meses) y automatizarlo.
- **Proveedores de IA:** usar condiciones que excluyan el entrenamiento con tus datos y registrar dónde se procesan.

### 5.4 Contratos con tus clientes (clínicas y centros)
Plantilla única con: roles (la clínica es *responsable*, tú *encargado*), instrucciones de tratamiento, lista de subencargados (Meta, IA, hosting), medidas de seguridad, plazo de devolución/eliminación al terminar, notificación de incidentes, uso aceptable (sin spam ni información engañosa), límites de la IA (no diagnostica) y responsabilidad del cliente por la autorización de sus pacientes.

### 5.5 Otros
- Seguro de responsabilidad civil profesional / ciberseguridad.
- Copias de seguridad, acceso con doble factor y registro de accesos a los sistemas que guardan conversaciones.
- Revisar cada año estos textos y cada vez que añadas una herramienta nueva.

## 6. Cómo se mantiene en el proyecto
- Los datos de identificación viven en `site.config.json` (`legal`) y se insertan en los textos con `{{legal.campo}}`.
- El pie de página es una pieza compartida: `partials/footer.es.html` y `partials/footer.en.html` (se editan en un solo lugar).
- El aviso de cookies está en `assets/js/main.js`; sus textos y la lógica de consentimiento se prueban con `node scripts/consent-test.mjs`.
- La auditoría SEO avisa de datos legales pendientes; el build de producción y `publicar.mjs` se detienen si faltan.
