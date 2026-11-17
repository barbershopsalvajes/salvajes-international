/**
 * Formulario de diagnóstico: validación (misma lógica que el servidor),
 * protección anti-spam (honeypot + tiempo mínimo + Turnstile opcional),
 * contexto del recorrido y envío a /api/lead.
 */
import { normalizeLead, validateLead, type FieldError, type LeadInput } from '../lib/lead.ts';
import { getJourney, prefillContact } from './journey.ts';

interface Strings {
  lang: 'es' | 'en';
  sending: string;
  submit: string;
  calcContext: string;
  errors: Record<'required' | 'email' | 'phone' | 'consent' | 'message' | 'generic' | 'rate' | 'spam', string>;
}

declare global {
  interface Window {
    turnstile?: { getResponse(el?: Element): string | undefined; reset(el?: Element): void };
  }
}

export function initContact(form: HTMLFormElement) {
  const s: Strings = JSON.parse(form.dataset.strings || '{}');
  const startedAt = Date.now();
  const submitBtn = form.querySelector<HTMLButtonElement>('[data-submit]')!;
  const submitLabel = form.querySelector<HTMLElement>('[data-submit-label]')!;
  const formError = form.querySelector<HTMLElement>('[data-form-error]')!;
  const success = form.parentElement!.querySelector<HTMLElement>('[data-success]')!;
  const ctx = form.querySelector<HTMLElement>('[data-calc-ctx]')!;
  const ctxText = form.querySelector<HTMLElement>('[data-calc-ctx-text]')!;
  const fmt = new Intl.NumberFormat(s.lang === 'es' ? 'es-ES' : 'en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, useGrouping: 'always' } as Intl.NumberFormatOptions);
  let touched = false;

  // Turnstile (solo si está configurado)
  if (form.dataset.turnstile && !document.querySelector('script[data-turnstile]')) {
    const sc = document.createElement('script');
    sc.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    sc.async = true;
    sc.defer = true;
    sc.dataset.turnstile = '';
    document.head.appendChild(sc);
  }

  // Prefill desde la URL (?service=… / ?sector=…) — enlaces de páginas de servicio y sector
  const params = new URLSearchParams(location.search);
  const sv = params.get('service');
  const sc = params.get('sector');
  if (sv) prefillContact('service', sv);
  if (sc) prefillContact('sector', sc);

  function showCalc() {
    const j = getJourney();
    if (j.calc && j.calc.annualSaving > 0) {
      ctxText.textContent = `${fmt.format(j.calc.annualSaving)} / ${s.lang === 'es' ? 'año' : 'year'} (${j.calc.automationPct}%) · ${j.calc.employees} × ${j.calc.weeklyHours} h × ${fmt.format(j.calc.hourlyCost)}`;
      ctx.hidden = false;
    }
  }
  showCalc();
  document.addEventListener('ri:calc', showCalc);

  const read = (): LeadInput => {
    const fd = new FormData(form);
    const raw: Record<string, unknown> = {};
    fd.forEach((v, k) => (raw[k] = v));
    raw.consent = fd.get('consent') === 'on';
    raw.marketing = fd.get('marketing') === 'on';
    return normalizeLead(raw);
  };

  function setError(name: string, err?: FieldError | '') {
    const input = form.querySelector<HTMLElement>(`[name="${name}"]`);
    const field = input?.closest<HTMLElement>('.field');
    const msg = form.querySelector<HTMLElement>(`#cf-${name}-err`);
    const text = err ? s.errors[err as keyof Strings['errors']] ?? s.errors.required : '';
    if (msg) msg.textContent = text;
    if (field) field.toggleAttribute('data-invalid', Boolean(err));
    input?.setAttribute('aria-invalid', err ? 'true' : 'false');
  }

  function validate(focus: boolean) {
    const errors = validateLead(read());
    const names = ['name', 'company', 'email', 'phone', 'country', 'sector', 'employees', 'service', 'message', 'consent'];
    names.forEach((n) => setError(n, errors[n as keyof LeadInput]));
    if (focus) {
      const first = names.find((n) => errors[n as keyof LeadInput]);
      if (first) form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    }
    return Object.keys(errors).length === 0;
  }

  form.addEventListener('input', () => touched && validate(false));
  form.addEventListener('change', () => touched && validate(false));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    touched = true;
    formError.hidden = true;
    if (!validate(true)) return;

    const lead = read();
    const j = getJourney();
    const turnstileToken = window.turnstile?.getResponse(form.querySelector('.cf-turnstile') ?? undefined) ?? '';
    const payload = {
      ...lead,
      lang: s.lang,
      page: location.pathname,
      demos: j.demos,
      calc: j.calc,
      utm: j.utm,
      website: (form.querySelector<HTMLInputElement>('[name="website"]')?.value ?? ''),
      elapsed: Date.now() - startedAt,
      turnstileToken,
    };

    submitBtn.setAttribute('aria-disabled', 'true');
    submitBtn.classList.add('is-loading');
    submitLabel.textContent = s.sending;
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        form.hidden = true;
        success.hidden = false;
        success.querySelector('[data-success-ref]')!.textContent = data.id;
        success.focus();
        success.scrollIntoView({ block: 'center', behavior: 'smooth' });
        document.dispatchEvent(new CustomEvent('ri:lead', { detail: { id: data.id } }));
        return;
      }
      if (res.status === 422 && data.fields) {
        Object.entries(data.fields as Record<string, FieldError>).forEach(([k, v]) => setError(k, v));
        return;
      }
      formError.textContent = res.status === 429 ? s.errors.rate : data.error === 'spam' ? s.errors.spam : s.errors.generic;
      formError.hidden = false;
      window.turnstile?.reset();
    } catch {
      formError.textContent = s.errors.generic;
      formError.hidden = false;
    } finally {
      submitBtn.removeAttribute('aria-disabled');
      submitBtn.classList.remove('is-loading');
      submitLabel.textContent = s.submit;
    }
  });

  success.querySelector('[data-success-again]')?.addEventListener('click', () => {
    form.reset();
    touched = false;
    form.hidden = false;
    success.hidden = true;
    form.querySelector<HTMLElement>('[name="name"]')?.focus();
  });
}
