import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculate, WEEKS_PER_MONTH } from '../src/lib/calculator.ts';
import { normalizeLead, validateLead, scoreLead } from '../src/lib/lead.ts';
import { initialReply, reply, type RState } from '../src/lib/receptionist.ts';
import { processRequest, classify } from '../src/lib/adminDemo.ts';

test('calculator: monthly/annual cost and savings', () => {
  const r = calculate({ employees: 5, weeklyHours: 10, hourlyCost: 20, automationPct: 40 });
  assert.equal(r.monthlyHours, 5 * 10 * WEEKS_PER_MONTH);
  assert.equal(Math.round(r.monthlyCost), Math.round(50 * WEEKS_PER_MONTH * 20));
  assert.equal(Math.round(r.annualCost), Math.round(r.monthlyCost * 12));
  assert.equal(Math.round(r.annualSaving), Math.round(r.annualCost * 0.4));
});

test('calculator: clamps invalid input', () => {
  const r = calculate({ employees: -3, weeklyHours: NaN, hourlyCost: 99999, automationPct: 250 });
  assert.equal(r.monthlyHours, 0);
  assert.ok(Number.isFinite(r.annualSaving));
});

const valid = {
  name: 'Ana Pérez', company: 'Clínica Test', email: 'ana@example.com', phone: '+34 600 000 000',
  country: 'España', sector: 'Clínica dental', employees: '10–49', service: 'Automatización de procesos',
  message: 'Queremos automatizar las confirmaciones de citas por WhatsApp.', consent: true,
};

test('lead: valid input passes', () => {
  assert.deepEqual(validateLead(normalizeLead(valid)), {});
});

test('lead: detects invalid fields', () => {
  const e = validateLead(normalizeLead({ ...valid, email: 'nope', phone: 'abc', consent: false, message: 'corto' }));
  assert.equal(e.email, 'email');
  assert.equal(e.phone, 'phone');
  assert.equal(e.consent, 'consent');
  assert.equal(e.message, 'message');
});

test('lead: strips control chars and truncates', () => {
  const l = normalizeLead({ ...valid, name: 'A\u0000na' + 'x'.repeat(500) });
  assert.ok(!l.name.includes('\u0000'));
  assert.ok(l.name.length <= 100);
});

test('lead: scoring priorities', () => {
  const hot = scoreLead({ employees: '50–249', service: 'Automatización comercial', message: 'Urgente: '.padEnd(120, 'x'), phone: '600', demos: ['a', 'b'], calc: { employees: 1, weeklyHours: 1, hourlyCost: 1, automationPct: 1, annualSaving: 30000 } });
  assert.equal(hot.priority, 'hot');
  const cold = scoreLead({ employees: '1–9', service: 'Aún no lo sé', message: 'hola qué tal', phone: '', demos: [], calc: null });
  assert.equal(cold.priority, 'cold');
});

test('receptionist: full booking flow (es)', () => {
  const now = new Date('2026-11-17T10:00:00');
  let st: RState = initialReply('es').state;
  let r = reply(st, 'Quiero pedir cita', 'es', now);
  assert.equal(r.state.step, 'treatment');
  r = reply(r.state, 'Limpieza dental', 'es', now);
  assert.equal(r.state.step, 'slot');
  assert.equal(r.state.slots?.length, 3);
  r = reply(r.state, '2', 'es', now);
  assert.equal(r.state.step, 'name');
  r = reply(r.state, 'me llamo laura martín', 'es', now);
  assert.equal(r.state.step, 'confirm');
  assert.match(r.messages[0], /Laura Martín/);
  r = reply(r.state, 'Sí, confirmar', 'es', now);
  assert.equal(r.state.step, 'done');
  st = r.state;
  assert.ok(st);
});

test('receptionist: urgent flow and intents (en)', () => {
  let r = reply({ step: 'idle' }, 'I have a terrible toothache', 'en');
  assert.equal(r.state.step, 'pain');
  r = reply(r.state, 'Yes, emergency appointment', 'en');
  assert.equal(r.state.step, 'slot');
  assert.match(reply({ step: 'idle' }, 'What are your opening hours?', 'en').messages[0], /Monday/);
  assert.match(reply({ step: 'idle' }, '¿Cuánto cuesta un blanqueamiento?', 'es').messages[0], /Blanqueamiento/);
});

test('admin demo: classification and extraction', () => {
  assert.equal(classify('Adjunto la factura F-2024-118 de 1.250 € del proveedor Limpiezas Norte. Vence el 30/11.').type, 'invoice');
  assert.equal(classify('Urgente: el datáfono no funciona y estamos perdiendo ventas').type, 'incident');
  assert.equal(classify('¿Nos podéis preparar un presupuesto para 3 habitaciones dobles?').type, 'quote');
  assert.equal(classify('Necesito solicitar vacaciones del 2 al 9 de agosto').type, 'hr');
  const r = processRequest('Hola, adjunto la factura F-2024-118 de 1.250 € del proveedor Limpiezas Norte. Vence el 30/11. Por favor, tramitad el pago.', 'es');
  const vals = r.entities.map((e) => e.value);
  assert.ok(vals.includes('F-2024-118'), vals.join('|'));
  assert.ok(vals.some((v) => v.includes('1.250')), vals.join('|'));
  assert.ok(vals.includes('30/11'), vals.join('|'));
  assert.match(r.report, /INFORME AUTOMÁTICO/);
  const urgent = processRequest('Urgent: the card terminal at the downtown store has not worked since this morning and we are losing sales.', 'en');
  assert.equal(urgent.type, 'incident');
  assert.equal(urgent.priority, 'high');
});
