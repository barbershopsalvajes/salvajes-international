// Genera og-image.png e iconos PNG a partir de HTML/SVG con Playwright.
// Uso: node scripts/generate-images.mjs
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const favicon = readFileSync(path.join(root, 'public/favicon.svg'), 'utf8');
const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch();

const og = `<!doctype html><html><body style="margin:0;width:1200px;height:630px;background:#060607;font-family:Inter,system-ui,sans-serif;color:#f4f4f2;position:relative;overflow:hidden">
<div style="position:absolute;right:-220px;top:-260px;width:900px;height:900px;background:radial-gradient(circle,rgba(255,90,31,.38),transparent 60%)"></div>
<div style="position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px);background-size:60px 60px;-webkit-mask-image:radial-gradient(ellipse at 70% 40%,#000,transparent 70%)"></div>
<div style="position:absolute;left:80px;top:80px;display:flex;align-items:center;gap:18px">
<div style="width:64px;height:64px">${favicon.replace('<svg ', '<svg width="64" height="64" ')}</div>
<div style="font-size:26px;letter-spacing:.3em"><b>RESUELVE</b> <span style="font-weight:300;color:#ff8a3d">INTELLECT</span></div></div>
<div style="position:absolute;left:80px;top:220px;font-size:66px;font-weight:650;letter-spacing:-.04em;line-height:1.02;max-width:900px">No necesitas más herramientas.<br><span style="background:linear-gradient(100deg,#fff,#ff8a3d 60%,#ff5a1f);-webkit-background-clip:text;color:transparent">Necesitas soluciones inteligentes.</span></div>
<div style="position:absolute;left:80px;bottom:72px;font-size:22px;color:#a3a3a8;letter-spacing:.12em;text-transform:uppercase;font-family:ui-monospace,monospace">IA · Agentes · Automatización — Barcelona · Dubái</div>
</body></html>`;

const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(og);
await page.screenshot({ path: path.join(root, 'public/og-image.png') });

for (const size of [180, 192, 512]) {
  const p = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await p.setContent(`<body style="margin:0;background:#0b0c0e">${favicon.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body>`);
  const name = size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`;
  await p.screenshot({ path: path.join(root, 'public', name), omitBackground: false });
}
await browser.close();
console.log('ok');
