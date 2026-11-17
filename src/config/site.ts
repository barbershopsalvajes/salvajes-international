/**
 * Configuración comercial centralizada.
 * Todos los datos de contacto son configurables mediante variables PUBLIC_*
 * (ver .env.example). Si un dato no está configurado, el componente que lo
 * usa se oculta: nunca se inventan teléfonos, direcciones ni perfiles.
 */
const env = import.meta.env;
const clean = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

const whatsappNumber = clean(env.PUBLIC_WHATSAPP_NUMBER).replace(/[^\d]/g, '');

export const site = {
  name: 'RESUELVE INTELLECT',
  shortName: 'Resuelve Intellect',
  url: (clean(env.PUBLIC_SITE_URL) || 'https://resuelveintellect.com').replace(/\/$/, ''),
  locations: ['Barcelona'] as const,
  contact: {
    email: clean(env.PUBLIC_CONTACT_EMAIL),
    whatsappNumber,
    whatsappUrl: whatsappNumber ? `https://wa.me/${whatsappNumber}` : '',
    instagram: clean(env.PUBLIC_INSTAGRAM_URL),
    linkedin: clean(env.PUBLIC_LINKEDIN_URL),
  },
  legal: {
    name: clean(env.PUBLIC_LEGAL_NAME),
    id: clean(env.PUBLIC_LEGAL_ID),
    address: clean(env.PUBLIC_LEGAL_ADDRESS),
    registry: clean(env.PUBLIC_LEGAL_REGISTRY),
  },
  turnstileSiteKey: clean(env.PUBLIC_TURNSTILE_SITE_KEY),
  plausibleDomain: clean(env.PUBLIC_PLAUSIBLE_DOMAIN),
} as const;

export type Site = typeof site;
