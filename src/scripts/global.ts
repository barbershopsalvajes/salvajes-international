/**
 * Comportamiento global: navegación, revelado al hacer scroll, foco de luz en
 * tarjetas, consentimiento de cookies y captura de UTM.
 */
import { captureUtm } from './journey.ts';

// ── Navegación ───────────────────────────────────────────────
const nav = document.querySelector<HTMLElement>('[data-nav]');
const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
const menu = document.querySelector<HTMLElement>('[data-mobile-menu]');

const onScroll = () => nav?.classList.toggle('is-scrolled', window.scrollY > 12);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

function setMenu(open: boolean) {
  if (!nav || !toggle || !menu) return;
  nav.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  menu.hidden = !open;
  toggle.querySelector('[data-label-open]')?.toggleAttribute('hidden', open);
  toggle.querySelector('[data-label-close]')?.toggleAttribute('hidden', !open);
  document.body.style.overflow = open ? 'hidden' : '';
}
toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
menu?.querySelectorAll('[data-close-menu]').forEach((a) => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && nav?.classList.contains('is-open')) {
    setMenu(false);
    toggle?.focus();
  }
});
window.matchMedia('(min-width: 1081px)').addEventListener('change', (e) => e.matches && setMenu(false));

// ── Revelado ─────────────────────────────────────────────────
const reduced = document.documentElement.classList.contains('reduced');
const reveals = document.querySelectorAll<HTMLElement>('.reveal');
if (reduced || !('IntersectionObserver' in window)) {
  reveals.forEach((el) => el.classList.add('is-in'));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  reveals.forEach((el) => io.observe(el));
}

// ── Foco de luz en tarjetas ──────────────────────────────────
if (window.matchMedia('(hover: hover)').matches) {
  document.addEventListener(
    'pointermove',
    (e) => {
      const card = (e.target as Element | null)?.closest?.<HTMLElement>('.card--spot');
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    },
    { passive: true },
  );
}

// ── Cookies / consentimiento ─────────────────────────────────
const CONSENT_KEY = 'ri-consent-v1';
type Consent = { analytics: boolean; at: string };
const banner = document.querySelector<HTMLElement>('[data-cookie]');

function readConsent(): Consent | null {
  try {
    return JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null');
  } catch {
    return null;
  }
}
function applyConsent(c: Consent | null) {
  const domain = banner?.dataset.analyticsDomain;
  if (!c?.analytics || !domain || document.querySelector('script[data-analytics]')) return;
  const s = document.createElement('script');
  s.defer = true;
  s.src = 'https://plausible.io/js/script.js';
  s.dataset.domain = domain;
  s.dataset.analytics = '';
  document.head.appendChild(s);
}
function saveConsent(analytics: boolean) {
  const c = { analytics, at: new Date().toISOString() };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(c));
  } catch {
    /* almacenamiento bloqueado */
  }
  if (banner) banner.hidden = true;
  applyConsent(c);
}
if (banner) {
  const existing = readConsent();
  if (existing) applyConsent(existing);
  else banner.hidden = false;
  banner.querySelector('[data-cookie-accept]')?.addEventListener('click', () => saveConsent(true));
  banner.querySelector('[data-cookie-reject]')?.addEventListener('click', () => saveConsent(false));
  banner.querySelector('[data-cookie-settings]')?.addEventListener('click', () => {
    const prefs = banner.querySelector<HTMLElement>('[data-cookie-prefs]');
    if (prefs) prefs.hidden = false;
  });
  banner.querySelector('[data-cookie-save]')?.addEventListener('click', () => {
    const cb = banner.querySelector<HTMLInputElement>('[data-cookie-analytics]');
    saveConsent(Boolean(cb?.checked));
  });
  document.querySelectorAll('[data-cookie-open]').forEach((b) =>
    b.addEventListener('click', () => {
      const c = readConsent();
      const cb = banner.querySelector<HTMLInputElement>('[data-cookie-analytics]');
      if (cb) cb.checked = Boolean(c?.analytics);
      const prefs = banner.querySelector<HTMLElement>('[data-cookie-prefs]');
      if (prefs) prefs.hidden = false;
      banner.hidden = false;
    }),
  );
}

captureUtm();
