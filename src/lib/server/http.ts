/** Utilidades compartidas por las Netlify Functions (solo servidor). */

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });

export const env = (key: string): string => {
  const g = globalThis as { Netlify?: { env?: { get(k: string): string | undefined } } };
  return (g.Netlify?.env?.get(key) ?? process.env[key] ?? '').trim();
};

/**
 * Comprueba que la petición procede de la propia web.
 * Acepta el mismo host que la petición, PUBLIC_SITE_URL y ALLOWED_ORIGINS.
 */
export function isAllowedOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true; // algunos navegadores no la envían en same-origin
  let o: URL;
  try {
    o = new URL(origin);
  } catch {
    return false;
  }
  const reqHost = new URL(req.url).host;
  if (o.host === reqHost) return true;
  const allowed = [env('PUBLIC_SITE_URL'), ...env('ALLOWED_ORIGINS').split(',')]
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      try {
        return new URL(s).host;
      } catch {
        return '';
      }
    });
  return allowed.includes(o.host);
}

/** Limitador de frecuencia en memoria (por instancia). Primera línea de defensa. */
export function createRateLimiter(max: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return (key: string, now = Date.now()): boolean => {
    const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (arr.length >= max) {
      hits.set(key, arr);
      return false;
    }
    arr.push(now);
    hits.set(key, arr);
    if (hits.size > 5000) hits.clear();
    return true;
  };
}

export async function hmacSha256Hex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function safeEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function readJson(req: Request, maxBytes: number): Promise<Record<string, unknown> | null> {
  const len = Number(req.headers.get('content-length') || 0);
  if (len > maxBytes) return null;
  const text = await req.text();
  if (text.length > maxBytes) return null;
  try {
    const data = JSON.parse(text);
    return data && typeof data === 'object' && !Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = env('TURNSTILE_SECRET_KEY');
  if (!secret) return true; // no configurado → se omite
  if (!token) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(5000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
