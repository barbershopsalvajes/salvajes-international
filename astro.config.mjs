// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// La URL pública se configura con PUBLIC_SITE_URL (ver .env.example).
const site = process.env.PUBLIC_SITE_URL || 'https://resuelveintellect.com';

export default defineConfig({
  site,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'es', locales: { es: 'es-ES', en: 'en' } },
      filter: (page) => !page.includes('/404'),
    }),
  ],
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
