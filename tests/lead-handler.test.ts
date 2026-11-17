import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleLead } from '../src/lib/server/leadHandler.ts';

const base = {
  name: 'Ana Pérez', company: 'Clínica Test', email: 'ana@example.com', phone: '+34 600 000 000',
  country: 'España', sector: 'Clínica dental', employees: '10–49', service: 'Automatización de procesos',
  message: 'Queremos automatizar las confirmaciones de citas por WhatsApp.', consent: true, elapsed: 9000,
};

const req = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('https://site.test/api/lead', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://site.test', ...headers }, body: JSON.stringify(body) });

function memStore() {
  const data = new Map<string, unknown>();
  return { data, store: async () => ({ setJSON: async (k: string, v: unknown) => void data.set(k, v) }) };
}

test('stores a valid lead and reports CRM not configured', async () => {
  delete process.env.MAKE_WEBHOOK_URL;
  const m = memStore();
  const res = await handleLead(req(base), '1.1.1.1', { store: m.store });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.crm, 'not_configured');
  assert.match(body.id, /^RI-\d{8}-[A-Z0-9]{6}$/);
  const rec = [...m.data.values()][0] as any;
  assert.equal(rec.lead.email, 'ana@example.com');
  assert.ok(['hot', 'warm', 'cold'].includes(rec.qualification.priority));
});

test('forwards to Make webhook with HMAC signature', async () => {
  process.env.MAKE_WEBHOOK_URL = 'https://hook.example/abc';
  process.env.WEBHOOK_SECRET = 's3cret';
  let captured: { url: string; init: RequestInit } | null = null;
  const fetchImpl = (async (url: string, init: RequestInit) => {
    captured = { url, init };
    return new Response('Accepted', { status: 200 });
  }) as unknown as typeof fetch;
  const res = await handleLead(req(base), '2.2.2.2', { store: async () => null, fetchImpl });
  const body = await res.json();
  assert.equal(body.crm, 'sent');
  assert.equal(captured!.url, 'https://hook.example/abc');
  const h = captured!.init.headers as Record<string, string>;
  assert.match(h['x-ri-signature'], /^sha256=[a-f0-9]{64}$/);
  assert.equal(JSON.parse(captured!.init.body as string).event, 'lead.created');
  delete process.env.MAKE_WEBHOOK_URL;
  delete process.env.WEBHOOK_SECRET;
});

test('503 when lead cannot be persisted anywhere', async () => {
  const res = await handleLead(req(base), '3.3.3.3', { store: async () => { throw new Error('down'); } });
  assert.equal(res.status, 503);
});

test('honeypot is silently accepted, not stored', async () => {
  const m = memStore();
  const res = await handleLead(req({ ...base, website: 'http://spam' }), '4.4.4.4', { store: m.store });
  assert.equal(res.status, 200);
  assert.equal(m.data.size, 0);
});

test('rejects too-fast submissions, foreign origins and invalid data', async () => {
  const m = memStore();
  assert.equal((await handleLead(req({ ...base, elapsed: 500 }), '5.5.5.5', { store: m.store })).status, 400);
  assert.equal((await handleLead(req(base, { origin: 'https://evil.test' }), '5.5.5.5', { store: m.store })).status, 403);
  const bad = await handleLead(req({ ...base, email: 'x' }), '5.5.5.5', { store: m.store });
  assert.equal(bad.status, 422);
  assert.equal((await bad.json()).fields.email, 'email');
});

test('rate limits repeated submissions from one IP', async () => {
  const m = memStore();
  const codes: number[] = [];
  for (let i = 0; i < 7; i++) codes.push((await handleLead(req(base), '9.9.9.9', { store: m.store })).status);
  assert.deepEqual(codes.slice(0, 5), [200, 200, 200, 200, 200]);
  assert.equal(codes[6], 429);
});
