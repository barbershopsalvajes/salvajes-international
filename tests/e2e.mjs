/**
 * Pruebas funcionales de extremo a extremo (Playwright).
 *   npm run build && npm run serve   (en otra terminal)
 *   npm run test:e2e
 */
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const { chromium, devices } = createRequire(import.meta.url)('playwright');

const BASE = process.env.BASE_URL || 'http://localhost:8888';
const browser = await chromium.launch();
const errors = [];
let passed = 0;
async function step(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`✓ ${name}`);
  } catch (e) {
    console.error(`✗ ${name}\n  ${e.message}`);
    process.exitCode = 1;
  }
}

const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });

await step('cookie banner: rechazar oculta el banner', async () => {
  await page.click('[data-cookie-reject]');
  assert.equal(await page.isVisible('[data-cookie]'), false);
});

await step('SEO: título, descripción, canonical, hreflang y JSON-LD', async () => {
  assert.match(await page.title(), /RESUELVE INTELLECT/);
  assert.ok((await page.getAttribute('meta[name=description]', 'content')).length > 80);
  assert.equal(await page.locator('link[rel=alternate][hreflang=en]').count(), 1);
  const ld = await page.$$eval('script[type="application/ld+json"]', (s) => s.map((x) => JSON.parse(x.textContent)['@type']));
  assert.ok(ld.includes('ProfessionalService'));
  assert.equal(await page.locator('h1').count(), 1);
});

await step('Demo A: reserva completa en la recepcionista (simulación)', async () => {
  await page.locator('#demos').scrollIntoViewIfNeeded();
  await page.waitForSelector('[data-rx-badge-text]:has-text("Simulación")');
  const quick = (t) => page.locator('[data-rx-quick] button', { hasText: t }).first().click();
  await quick('Quiero pedir cita');
  await page.waitForSelector('[data-rx-quick] button:has-text("Limpieza dental")');
  await quick('Limpieza dental');
  await page.waitForSelector('[data-rx-quick] button:has-text("1")');
  await quick('1');
  await page.waitForFunction(() => document.querySelector('[data-rx-step]')?.textContent?.includes('Recogiendo'));
  await page.fill('[data-rx-input]', 'Laura Martín');
  await page.press('[data-rx-input]', 'Enter');
  await page.waitForSelector('[data-rx-quick] button:has-text("Sí, confirmar")');
  await quick('Sí, confirmar');
  await page.waitForSelector('.msg--bot:has-text("Cita confirmada")');
  assert.equal(await page.locator('[data-rx-int].is-done').count(), 4);
});

await step('Demo B: flujo comercial completo', async () => {
  await page.click('#demo-tab-1');
  await page.click('[data-sales-run]');
  await page.waitForSelector('.flow-step[data-step="4"].is-done', { timeout: 10000 });
  assert.match(await page.textContent('[data-out="1"]'), /\/100/);
  assert.match(await page.textContent('[data-out="4"]'), /Laura/);
});

await step('Demo C: clasificación, bandeja e informe descargable', async () => {
  await page.click('#demo-tab-2');
  await page.click('[data-sample="1"]');
  await page.click('[data-admin-run]');
  await page.waitForSelector('[data-admin-report]:not([hidden])', { timeout: 10000 });
  assert.match(await page.textContent('[data-r-type]'), /Incidencia/);
  assert.equal(await page.locator('[data-col="incident"] .ticket--new').count(), 1);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-admin-dl]')]);
  assert.match(dl.suggestedFilename(), /^REQ-\d{8}-\d{4}\.txt$/);
});

await step('Sectores: cambiar de sector y preseleccionar en el formulario', async () => {
  await page.click('#sx-tab-hotel');
  assert.equal(await page.isVisible('#sx-panel-hotel'), true);
  await page.click('#sx-panel-hotel [data-prefill-sector]');
  assert.equal(await page.inputValue('#cf-sector'), 'Hotel');
});

await step('Calculadora: recalcula, escenarios y gráfico', async () => {
  await page.locator('#calculadora').scrollIntoViewIfNeeded();
  await page.fill('#calc-employees-n', '10');
  await page.click('[data-scen="60"]');
  const annual = await page.textContent('[data-out="annualSaving"]');
  // 10 × 10 h × 4,33 × 22 € × 12 × 60 %
  const expected = Math.round(10 * 10 * 4.33 * 22 * 12 * 0.6);
  assert.equal(annual.replace(/\D/g, ''), String(expected));
  assert.equal(await page.locator('[data-chart] svg g.hit').count(), 4);
  assert.equal(await page.locator('[data-table] tbody tr').count(), 4);
  await page.click('[data-calc-cta]');
  await page.waitForSelector('[data-calc-ctx]:not([hidden])');
});

await step('Formulario: validación de campos obligatorios', async () => {
  await page.click('[data-submit]');
  assert.ok((await page.locator('.field[data-invalid]').count()) >= 6);
  assert.match(await page.textContent('#cf-email-err'), /obligatorio/);
});

await step('Formulario: envío correcto y confirmación con referencia', async () => {
  await page.fill('#cf-name', 'Prueba Automática');
  await page.fill('#cf-company', 'Empresa Test');
  await page.fill('#cf-email', 'test@example.com');
  await page.fill('#cf-phone', '+34 600 000 000');
  await page.selectOption('#cf-country', 'España');
  await page.selectOption('#cf-employees', '10–49');
  await page.selectOption('#cf-service', 'Automatización comercial');
  await page.fill('#cf-message', 'Queremos automatizar el seguimiento de presupuestos y las respuestas por WhatsApp.');
  await page.check('input[name=consent]');
  await page.waitForTimeout(2600); // tiempo mínimo anti-spam
  await page.click('[data-submit]');
  await page.waitForSelector('[data-success]:not([hidden])', { timeout: 10000 });
  assert.match(await page.textContent('[data-success-ref]'), /^RI-\d{8}-[A-Z0-9]{6}$/);
  const leads = await (await fetch(`${BASE}/api/leads`)).json().catch(() => null);
  if (leads?.leads) {
    const last = leads.leads.at(-1);
    assert.equal(last.lead.email, 'test@example.com');
    assert.deepEqual(last.lead.demos.sort(), ['admin', 'receptionist', 'sales']);
    assert.ok(last.lead.calc.annualSaving > 0);
  }
});

await step('Idioma: selector ES → EN mantiene la página equivalente', async () => {
  await page.click('[data-lang-link="en"]');
  await page.waitForURL(`${BASE}/en/`);
  assert.match(await page.textContent('h1'), /You don't need more tools/);
  await page.goto(`${BASE}/servicios/automatizacion-comercial/`);
  assert.equal(await page.getAttribute('[data-lang-link="en"]', 'href'), '/en/services/sales-automation/');
});

await step('Servicio → CTA preselecciona el servicio en el formulario', async () => {
  await page.click('.sp-ctas .btn--accent');
  await page.waitForURL(/service=/);
  assert.equal(await page.inputValue('#cf-service'), 'Automatización comercial');
});

// Móvil
const m = await browser.newContext({ ...devices['iPhone 13'], reducedMotion: 'reduce' });
const mp = await m.newPage();
mp.on('pageerror', (e) => errors.push(`mobile: ${e.message}`));
await mp.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await step('Móvil: sin desbordamiento horizontal y menú funcional', async () => {
  assert.equal(await mp.evaluate(() => document.documentElement.scrollWidth), 390);
  await mp.click('[data-cookie-accept]');
  await mp.click('[data-nav-toggle]');
  assert.equal(await mp.isVisible('[data-mobile-menu]'), true);
  await mp.click('[data-mobile-menu] a[href="/#demos"]');
  assert.equal(await mp.isVisible('[data-mobile-menu]'), false);
});

await step('Sin errores de JavaScript en consola', async () => {
  assert.deepEqual(errors.filter((e) => !/favicon/.test(e)), []);
});

await browser.close();
console.log(`\n${passed} pruebas superadas`);
