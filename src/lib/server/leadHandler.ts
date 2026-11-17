/**
 * Lógica del endpoint POST /api/lead, independiente de Netlify para poder
 * probarla. Recibe dependencias inyectables (almacenamiento y fetch).
 */
import { normalizeLead, validateLead, scoreLead } from '../lead.ts';
import { json, env, isAllowedOrigin, createRateLimiter, hmacSha256Hex, readJson, verifyTurnstile } from './http.ts';

export interface LeadStore {
  setJSON(key: string, value: unknown): Promise<unknown>;
}

export interface LeadDeps {
  store: () => Promise<LeadStore | null>;
  fetchImpl?: typeof fetch;
  now?: () => Date;
}

export const MIN_FILL_MS = 2500;
const limiter = createRateLimiter(5, 10 * 60 * 1000);

export function makeLeadId(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  const rand = crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase().padStart(6, '0').slice(-6);
  return `RI-${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}-${rand}`;
}

export async function handleLead(req: Request, ip: string, deps: LeadDeps): Promise<Response> {
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405, { allow: 'POST' });
  if (!isAllowedOrigin(req)) return json({ ok: false, error: 'forbidden' }, 403);

  const raw = await readJson(req, 20_000);
  if (!raw) return json({ ok: false, error: 'bad_request' }, 400);

  // Honeypot: los bots rellenan el campo oculto. Respondemos OK sin procesar.
  if (typeof raw.website === 'string' && raw.website.trim() !== '') {
    return json({ ok: true, id: 'RI-0', crm: 'skipped' });
  }
  // Trampa temporal: un humano tarda más de unos segundos en rellenar el formulario.
  const elapsed = Number(raw.elapsed);
  if (!Number.isFinite(elapsed) || elapsed < MIN_FILL_MS) return json({ ok: false, error: 'spam' }, 400);

  if (!limiter(ip || 'unknown')) return json({ ok: false, error: 'rate_limited' }, 429);

  if (!(await verifyTurnstile(typeof raw.turnstileToken === 'string' ? raw.turnstileToken : '', ip))) {
    return json({ ok: false, error: 'spam' }, 400);
  }

  const lead = normalizeLead(raw);
  const errors = validateLead(lead);
  if (Object.keys(errors).length) return json({ ok: false, error: 'validation', fields: errors }, 422);

  const now = (deps.now ?? (() => new Date()))();
  const id = makeLeadId(now);
  const qualification = scoreLead(lead);
  const record = {
    id,
    createdAt: now.toISOString(),
    source: 'web',
    status: 'new',
    lead,
    qualification,
    consent: { privacy: lead.consent, marketing: !!lead.marketing, at: now.toISOString() },
  };

  // 1) Almacenamiento propio (Netlify Blobs): el lead no se pierde aunque el CRM falle.
  let stored = false;
  try {
    const store = await deps.store();
    if (store) {
      await store.setJSON(`${now.toISOString()}_${id}`, record);
      stored = true;
    }
  } catch (err) {
    console.error('[lead] blob store error', err);
  }

  // 2) Envío al CRM vía webhook de Make (Google Sheets, CRM, Gmail, WhatsApp…).
  let crm: 'sent' | 'failed' | 'not_configured' = 'not_configured';
  const hook = env('MAKE_WEBHOOK_URL');
  if (hook) {
    const body = JSON.stringify({ event: 'lead.created', version: 1, ...record });
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    const secret = env('WEBHOOK_SECRET');
    if (secret) headers['x-ri-signature'] = `sha256=${await hmacSha256Hex(secret, body)}`;
    try {
      const res = await (deps.fetchImpl ?? fetch)(hook, { method: 'POST', headers, body, signal: AbortSignal.timeout(8000) });
      crm = res.ok ? 'sent' : 'failed';
      if (!res.ok) console.error('[lead] webhook status', res.status);
    } catch (err) {
      crm = 'failed';
      console.error('[lead] webhook error', err);
    }
  }

  if (!stored && crm !== 'sent') {
    console.error('[lead] NOT persisted anywhere', { id, crm });
    return json({ ok: false, error: 'unavailable' }, 503);
  }
  return json({ ok: true, id, crm, stored });
}
