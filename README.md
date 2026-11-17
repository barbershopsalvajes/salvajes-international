# RESUELVE INTELLECT — Web oficial

> «Los problemas cambian. Nosotros encontramos la solución.»

Web bilingüe (ES/EN) de la agencia de inteligencia artificial, agentes y
automatización **RESUELVE INTELLECT** (Barcelona, España).

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | [Astro 7](https://astro.build) — HTML estático, CSS propio, TypeScript sin frameworks |
| Backend | Netlify Functions (`netlify/functions/`) |
| Almacenamiento de leads | Netlify Blobs |
| Integraciones | Webhook firmado → Make → Google Sheets · CRM · Gmail · WhatsApp Business |
| Demo IA en vivo (opcional) | Claude API desde una función de servidor |

## Estructura

```
src/
  components/        Secciones de la web (Hero, Demos, Calculator, Contact…)
    demos/           Las tres demostraciones interactivas
    legal/           Plantilla de páginas legales
  config/site.ts     Datos comerciales configurables (variables PUBLIC_*)
  data/              Contenido bilingüe de servicios y sectores
  i18n/ui.ts         Textos de interfaz ES/EN y rutas localizadas
  lib/               Lógica pura y testeada (calculadora, leads, demos)
    server/          Lógica de servidor (validación, anti-spam, webhook)
  pages/             Rutas: /, /servicios/*, /sectores/*, /en/…, legales, 404
  scripts/           Interacción en el navegador
  styles/            Sistema de diseño
netlify/functions/   /api/lead · /api/leads · /api/receptionist
docs/INTEGRACIONES.md  Flujo comercial, webhook, Make y credenciales pendientes
tests/               Pruebas unitarias (node:test) y E2E (Playwright)
```

## Páginas

- `/` y `/en/` — página principal con las 10 secciones.
- 6 páginas de servicio: `/servicios/<slug>/` · `/en/services/<slug>/`.
- 10 páginas de sector: `/sectores/<slug>/` · `/en/industries/<slug>/`.
- Legales: `/aviso-legal/`, `/privacidad/`, `/cookies/` (+ versiones `/en/`).
- `sitemap-index.xml`, `robots.txt`, 404.

## Desarrollo

```bash
npm install
npm run dev              # servidor de desarrollo de Astro (sin funciones de API)
npm run build            # compila a dist/
npm run serve            # sirve dist/ + funciones de API en http://localhost:8888
npm test                 # pruebas unitarias (lógica, validación, webhook, anti-spam)
npm run test:e2e         # pruebas funcionales en navegador (requiere `npm run serve`)
npm run images           # regenera og-image.png e iconos
```

`npm run serve` guarda los leads en memoria y expone `/api/leads` **sin
protección**: es solo para desarrollo local.

## Despliegue en Netlify

1. Conectar el repositorio en Netlify (la configuración está en `netlify.toml`).
2. Definir las variables de `.env.example` en *Site configuration → Environment variables*.
3. Desplegar. Netlify Blobs no requiere configuración adicional.
4. Seguir `docs/INTEGRACIONES.md` para conectar Make y el resto de servicios.

## Principios

- **Nada inventado:** sin clientes, testimonios, cifras de resultados,
  direcciones ni teléfonos ficticios. Los datos de contacto y legales son
  configurables y se ocultan (o se marcan como pendientes en las páginas legales)
  mientras no existan.
- **Demos honestas:** cada demo indica si es «Simulación» o «IA en vivo».
- **Sin claves en el frontend:** los secretos solo existen en las funciones.
- **Privacidad:** sin cookies publicitarias; analítica solo con consentimiento.
- **Accesible:** HTML semántico, navegación por teclado en pestañas, textos
  alternativos, tabla accesible para el gráfico y respeto de `prefers-reduced-motion`.

> Los textos legales son una base razonable para España/UE, pero deben ser
> revisados por un profesional antes de la publicación.
