/**
 * GET /api/leads — Exportación privada de leads almacenados.
 * Requiere la cabecera  Authorization: Bearer <ADMIN_TOKEN>.
 * ?format=csv devuelve CSV (compatible con Excel / Google Sheets).
 */
import type { Config } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import { json, env, safeEqual } from '../../src/lib/server/http.ts';

const CSV_COLS = ['id', 'createdAt', 'priority', 'score', 'name', 'company', 'email', 'phone', 'country', 'sector', 'employees', 'service', 'message', 'marketing', 'lang', 'demos', 'annualSaving'];

const csvCell = (v: unknown) => {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@]/.test(s)) s = `'${s}`; // evita inyección de fórmulas en hojas de cálculo
  return `"${s.replace(/"/g, '""')}"`;
};

export default async (req: Request) => {
  const token = env('ADMIN_TOKEN');
  if (!token) return json({ error: 'not_found' }, 404);
  const auth = req.headers.get('authorization') ?? '';
  if (!safeEqual(auth, `Bearer ${token}`)) return json({ error: 'unauthorized' }, 401);

  const store = getStore({ name: 'leads', consistency: 'strong' });
  const { blobs } = await store.list();
  const keys = blobs.map((b) => b.key).sort().reverse().slice(0, 1000);
  const records = (await Promise.all(keys.map((k) => store.get(k, { type: 'json' })))).filter(Boolean) as Record<string, any>[];

  if (new URL(req.url).searchParams.get('format') === 'csv') {
    const rows = records.map((r) =>
      [r.id, r.createdAt, r.qualification?.priority, r.qualification?.score, r.lead?.name, r.lead?.company, r.lead?.email, r.lead?.phone, r.lead?.country, r.lead?.sector, r.lead?.employees, r.lead?.service, r.lead?.message, r.lead?.marketing, r.lead?.lang, (r.lead?.demos ?? []).join('|'), r.lead?.calc?.annualSaving ?? '']
        .map(csvCell)
        .join(','),
    );
    return new Response([CSV_COLS.join(','), ...rows].join('\n'), {
      headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="leads.csv"', 'cache-control': 'no-store' },
    });
  }
  return json({ count: records.length, leads: records });
};

export const config: Config = { path: '/api/leads' };
