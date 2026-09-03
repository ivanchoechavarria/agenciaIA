# CLAUDE.md — Contexto del proyecto IAechavarría

> Este archivo lo lee Claude Code automáticamente al abrir el proyecto en VS Code.
> Contiene las decisiones ya tomadas y el porqué — no las cambies sin preguntar primero,
> se decidieron después de analizar alternativas reales, no son arbitrarias.

## Qué es esto

IAechavarría es una agencia (un solo operador: Iván Andrés Echavarría, ingeniero
informático) que automatiza con IA las operaciones de clínicas odontológicas enfocadas
en turismo dental — pacientes que viajan desde Estados Unidos (~70%) y Colombia (~30%)
a Colombia para tratamientos. Tres servicios: sitio web bilingüe, WhatsApp automatizado,
marketing de atracción.

**El primer caso de uso real no es un cliente — es la propia agencia.** El bot de
WhatsApp de IAechavarría (el que responde a prospectos que escriben desde la landing)
es el piloto antes de ofrecérselo a una clínica. El código está escrito para ser
multi-cliente desde el día 1, así que este mismo bot es la plantilla que se reutiliza
por cada clínica después.

## Decisiones de arquitectura (y el porqué)

1. **WhatsApp Cloud API oficial de Meta, nunca librerías no oficiales** (Baileys,
   Evolution API, WAHA en modo no oficial, whatsapp-web.js). Las no oficiales tienen
   riesgo real y documentado de bloqueo del número, especialmente con mensajes
   automáticos proactivos como los recordatorios de citas que este sistema necesita.

2. **El bot es estructurado, nunca un asistente de IA de propósito abierto.** Meta
   prohibió los bots abiertos en WhatsApp Business Platform en enero de 2026 — solo
   permite FAQ, calificación de leads, y agendamiento/estado. El bot solo responde
   dentro de ese alcance y escala a un humano fuera de él (ver
   `docs/system_prompt_bot_agencia.md` para el detalle exacto de los límites).

3. **Cada clínica es dueña de su propio WhatsApp Business Account (WABA) y su propio
   Business Manager de Meta — nunca la agencia.** Desde 2025 Meta eliminó el modelo
   "On-Behalf-Of" que permitía lo contrario; hoy es obligatorio. IAechavarría se conecta
   como Tech Provider vía Embedded Signup, con un token de acceso por clínica, pero la
   cuenta y el historial son de cada clínica. El bot de la propia agencia usa el WABA
   propio de IAechavarría (esa parte sí es 100% suya).

4. **Multi-tenant desde el día 1** — la tabla `clinics` existe aunque hoy solo haya una
   fila (IAechavarría). Cada clínica nueva es una fila más, no un fork del código.

5. **Sin CRM de terceros (se evaluó `wacrm`, se descartó).** El panel de gestión
   (bandeja de conversaciones, difusiones) se construye a la medida en el mismo
   proyecto Next.js — mismo código que sirve para el MVP interno y para el futuro
   portal de cada clínica, sin dependencia de un proyecto externo de terceros.

6. **Stack:** Next.js (App Router, TypeScript) + Supabase (Postgres, Auth, Realtime) +
   Vercel (hosting, incluye las funciones serverless del webhook) + Claude Haiku
   (motor de FAQ, vía `@anthropic-ai/sdk`) + Whisper de OpenAI (transcripción de audio)
   + Google Calendar API (agendamiento, pendiente de implementar).

## Estado actual

- [x] Cuenta y proyecto de Supabase creados, tablas creadas — ver
      `db/schema_supabase_iaechavarria.sql`
- [x] Landing page de IAechavarría — `site/index.html` (HTML estático, va a GitHub
      Pages, no a este proyecto de Next.js)
- [x] System prompt y base de conocimiento del bot de la agencia — `docs/` y también
      exportados como constantes en `lib/prompts/` para usar directamente en el código
- [x] Webhook y middleware de WhatsApp escritos — `app/api/whatsapp/webhook/route.ts`
      y `lib/` (recibe mensaje → transcribe si es audio → llama a Claude Haiku con
      contexto → guarda en Supabase → responde por WhatsApp)
- [x] Fila real de "IAechavarría" en la tabla `clinics` de Supabase — `AGENCY_CLINIC_ID`
      configurado
- [x] Proyecto desplegado en Vercel con las variables de entorno reales — **excepto
      `WHATSAPP_ACCESS_TOKEN`, que sigue con un valor provisional** hasta retomar Meta
- [ ] Cuenta Meta Business Manager de la agencia — en proceso, hubo problemas de
      acceso a developers.facebook.com, pendiente de reintentar
- [ ] Registrar la URL del webhook en Meta for Developers (depende de lo anterior)
- [ ] Panel de bandeja de conversaciones (lista en tiempo real, tomar conversación,
      responder manualmente) — no empezado
- [ ] Integración con Google Calendar (consultar disponibilidad, crear/editar/cancelar
      citas) — no empezado
- [ ] Lógica de recordatorios automáticos 3 días antes + liberación de cupo si no hay
      respuesta — no empezado
- [ ] UI de difusiones (plantilla + segmento) — no empezado

## Convenciones del proyecto

- Comentarios de código en español; nombres de variables, funciones y tipos en inglés.
- Las respuestas que genera el bot para el usuario final nunca llevan markdown ni
  formato — es texto plano de WhatsApp, mensajes cortos.
- Ningún token o clave de acceso se guarda en una columna normal de una tabla de
  Supabase — van en variables de entorno, o en Supabase Vault cuando haya varias
  clínicas con sus propios tokens.
- El bot nunca da precios cerrados ni explica el detalle técnico de la arquitectura al
  prospecto — ver `docs/system_prompt_bot_agencia.md`.
- Las llamadas a la API de Claude devuelven JSON estructurado (`{"reply": ..., "escalate": ...}`),
  no texto libre — sigue ese mismo patrón (`lib/ai.ts`) si agregas nuevas llamadas al
  modelo, para que el resto del sistema pueda tomar decisiones sobre la respuesta.

## Instrucciones para ti (Claude Code)

- No cambies ninguna de las 6 decisiones de arquitectura de arriba sin preguntarle a
  Iván primero y explicarle el trade-off — no son elecciones arbitrarias.
- Antes de escribir una función nueva, revisa si ya existe algo parecido en `lib/`.
- Cuando termines un pendiente de la lista de "Estado actual", actualiza este archivo
  marcando el checkbox — así la próxima sesión (contigo o en este chat) parte del
  estado real, no de uno desactualizado.
- El modelo de Claude a usar en el código es `claude-haiku-4-5-20251001` (ya está así
  en `lib/ai.ts`) — es el que se eligió por costo, dado el bajo volumen esperado por
  clínica.
