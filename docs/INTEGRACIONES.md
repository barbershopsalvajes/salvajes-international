# Integraciones y sistema comercial — RESUELVE INTELLECT

Este documento describe cómo la web capta oportunidades y cómo conectarla con
Make, Google Sheets, el CRM, Gmail y WhatsApp Business.

> **Estado actual:** la web está preparada y probada, pero **ninguna
> integración externa está conectada todavía**. Faltan las credenciales y los
> escenarios que se indican en la sección 7. Mientras tanto, cada solicitud se
> guarda de forma segura en Netlify Blobs y puede exportarse (sección 5).

---

## 1. Flujo comercial

```
1. Visita            → la persona llega a la web (se guardan los parámetros UTM, si los hay)
2. Descubrimiento    → servicios, sectores, método
3. Demostración      → recepcionista / automatización comercial / administrativa
                       (se anota qué demos ha probado, solo en la sesión del navegador)
4. Diagnóstico       → calculadora de ahorro (opcional) + formulario de contacto
5. Registro          → POST /api/lead
                         ├─ validación + anti-spam (honeypot, tiempo mínimo, límite por IP, Turnstile opcional)
                         ├─ puntuación y prioridad (hot / warm / cold)
                         ├─ guardado en Netlify Blobs  (almacén "leads")
                         └─ envío firmado al webhook de Make
6. Clasificación     → Make: prioridad y enrutado (ya viene calculada; puede refinarse con IA)
7. Notificación      → Make: aviso al equipo (Gmail / WhatsApp / Slack…)
8. Seguimiento       → Make: alta en CRM + correo de bienvenida + tarea al comercial
```

La puntuación (`src/lib/lead.ts → scoreLead`) es la **misma** que muestra la
demo de automatización comercial. Criterios: tamaño de empresa, servicio
identificado, necesidad detallada, urgencia, teléfono, demos probadas,
resultado de la calculadora y gran empresa. `≥ 60` → `hot`, `≥ 35` → `warm`,
resto → `cold`.

---

## 2. Contrato del webhook (`lead.created`)

`POST` a `MAKE_WEBHOOK_URL` con `Content-Type: application/json`.
Si se define `WEBHOOK_SECRET`, se añade la cabecera
`X-RI-Signature: sha256=<HMAC-SHA256 hex del cuerpo>`.

```json
{
  "event": "lead.created",
  "version": 1,
  "id": "RI-20261117-4K9Q2Z",
  "createdAt": "2026-11-17T10:21:03.512Z",
  "source": "web",
  "status": "new",
  "lead": {
    "name": "Ana Pérez",
    "company": "Clínica Sonrisa",
    "email": "ana@example.com",
    "phone": "+34 600 000 000",
    "country": "España",
    "sector": "Clínica dental",
    "employees": "10–49",
    "service": "Atención al cliente inteligente",
    "message": "Queremos responder WhatsApp fuera de horario…",
    "consent": true,
    "marketing": false,
    "lang": "es",
    "page": "/",
    "demos": ["receptionist", "sales"],
    "calc": { "employees": 5, "weeklyHours": 10, "hourlyCost": 22, "automationPct": 40, "annualSaving": 22862 },
    "utm": { "utm_source": "linkedin", "utm_campaign": "clinicas" }
  },
  "qualification": { "score": 63, "priority": "hot", "reasons": ["size:10–49", "service_defined", "detailed_need", "phone_provided", "demos:2", "calc_high"] },
  "consent": { "privacy": true, "marketing": false, "at": "2026-11-17T10:21:03.512Z" }
}
```

Respuestas de `/api/lead` a la web:

| Código | Significado |
|---|---|
| `200 { ok: true, id, crm, stored }` | Registrado. `crm` = `sent` · `failed` · `not_configured` |
| `400` | JSON inválido o detectado como spam |
| `403` | Origen no permitido |
| `422 { fields }` | Errores de validación por campo |
| `429` | Demasiados envíos desde la misma IP (5 cada 10 min) |
| `503` | No se pudo guardar ni enviar al CRM → la web muestra un error y no da la solicitud por recibida |

---

## 3. Escenario de Make recomendado («Leads web»)

1. **Webhooks → Custom webhook.** Crear el webhook, copiar su URL a
   `MAKE_WEBHOOK_URL` en Netlify y enviar un formulario de prueba para que Make
   aprenda la estructura.
2. *(Recomendado)* **Verificar la firma**: comparar `X-RI-Signature` con
   `sha256=` + HMAC-SHA256(cuerpo, `WEBHOOK_SECRET`). Si no coincide, detener.
3. **Google Sheets → Add a row** en la hoja `Leads` (columnas en la sección 4).
4. **CRM → Create/Update contact + deal** (HubSpot, Pipedrive, Zoho, Holded…):
   - Contacto: nombre, correo, teléfono, empresa, país.
   - Oportunidad: `id`, servicio, sector, empleados, mensaje, `qualification.score`,
     `qualification.priority`, demos y ahorro estimado.
   - Etapa inicial: «Nuevo lead». Propietario según prioridad.
5. **Router por prioridad:**
   - `hot` → **Gmail / WhatsApp Business**: aviso inmediato al comercial con el
     resumen y enlace al CRM.
   - `warm` → tarea en el CRM para el mismo día.
   - `cold` → secuencia de nutrición (solo si `consent.marketing = true`).
6. **Gmail → Send an email** al cliente: acuse de recibo en su idioma
   (`lead.lang`), con la referencia `id`.
7. *(Opcional)* **WhatsApp Business Cloud → Send a template message** al
   cliente si ha dejado teléfono. Requiere una plantilla aprobada por Meta.
8. *(Opcional)* **IA**: un módulo de OpenAI/Anthropic en Make puede resumir la
   necesidad y sugerir el servicio, sin cambiar el contrato del webhook.
9. **Manejo de errores**: añadir *error handler* con reintento y aviso por correo.

---

## 4. Google Sheets — columnas sugeridas

`id · createdAt · priority · score · name · company · email · phone · country ·
sector · employees · service · message · marketing · lang · demos · annualSaving ·
utm_source · utm_campaign · status · owner · notes`

La misma estructura sale de la exportación CSV (sección 5), así que se pueden
importar los leads guardados antes de conectar Make.

---

## 5. Almacenamiento propio y exportación

Cada solicitud válida se guarda en **Netlify Blobs** (almacén `leads`),
independientemente de que Make esté conectado. Así no se pierde ninguna
oportunidad aunque el CRM falle.

```bash
# JSON
curl -H "Authorization: Bearer $ADMIN_TOKEN" https://<dominio>/api/leads
# CSV (Excel / Google Sheets)
curl -H "Authorization: Bearer $ADMIN_TOKEN" "https://<dominio>/api/leads?format=csv" -o leads.csv
```

Sin `ADMIN_TOKEN` definido, el endpoint responde `404`.

---

## 6. Demo «Recepcionista inteligente» con IA en vivo

- Sin configuración, la demo funciona en **modo simulación** (motor de reglas
  en el navegador, `src/lib/receptionist.ts`) y lo indica con la etiqueta
  «Simulación».
- Con `ANTHROPIC_API_KEY` en Netlify, la demo pasa a **«IA en vivo»**: la web
  llama a `/api/receptionist` y la función usa Claude en el servidor. La clave
  nunca llega al navegador. Límite: 40 mensajes por IP cada 10 minutos, 20
  turnos por conversación y 600 caracteres por mensaje.
- Si la IA falla, la demo vuelve a simulación automáticamente.

---

## 7. Credenciales y conexiones pendientes

| Elemento | Variable / lugar | Estado |
|---|---|---|
| URL pública definitiva | `PUBLIC_SITE_URL` | Pendiente (por defecto `https://resuelveintellect.com`) |
| WhatsApp comercial | `PUBLIC_WHATSAPP_NUMBER` | Pendiente — el botón se oculta mientras esté vacío |
| Correo de contacto | `PUBLIC_CONTACT_EMAIL` | Pendiente |
| Instagram | `PUBLIC_INSTAGRAM_URL` | Pendiente |
| LinkedIn | `PUBLIC_LINKEDIN_URL` | Pendiente |
| Datos legales (LSSI-CE) | `PUBLIC_LEGAL_NAME`, `PUBLIC_LEGAL_ID`, `PUBLIC_LEGAL_ADDRESS`, `PUBLIC_LEGAL_REGISTRY` | **Pendiente — obligatorio antes de publicar.** Mientras falten, el aviso legal y la política de privacidad muestran «[Pendiente de configurar]» |
| Webhook de Make | `MAKE_WEBHOOK_URL` | Pendiente |
| Firma del webhook | `WEBHOOK_SECRET` | Pendiente (recomendado) |
| Exportación de leads | `ADMIN_TOKEN` | Pendiente |
| Google Sheets | Conexión Google en Make | Pendiente |
| CRM comercial | Conexión del CRM elegido en Make | Pendiente (CRM por decidir) |
| Gmail | Conexión Google en Make | Pendiente |
| WhatsApp Business | Cuenta de Meta Business + número verificado + plantillas aprobadas, conectado en Make | Pendiente |
| Anti-spam Turnstile | `PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` | Opcional |
| Analítica sin cookies | `PUBLIC_PLAUSIBLE_DOMAIN` | Opcional (solo se carga tras consentimiento) |
| IA en vivo en la demo | `ANTHROPIC_API_KEY` | Opcional |

Las variables `PUBLIC_*` se incrustan en el HTML al compilar: tras cambiarlas
hay que volver a desplegar.
