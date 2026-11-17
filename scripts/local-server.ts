/**
 * Servidor local para probar la web compilada CON las funciones de API
 * (sin necesidad de Netlify CLI). Los leads se guardan en memoria.
 *   npm run build && npm run serve   →  http://localhost:8888
 * Respeta las variables de entorno (MAKE_WEBHOOK_URL, ANTHROPIC_API_KEY…).
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { handleLead } from '../src/lib/server/leadHandler.ts';
import receptionist from '../netlify/functions/receptionist.ts';

const PORT = Number(process.env.PORT || 8888);
const DIST = path.resolve('dist');
const leads = new Map<string, unknown>();
const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
};

createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const ip = req.socket.remoteAddress || '127.0.0.1';
  if (url.pathname.startsWith('/api/')) {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const request = new Request(url, { method: req.method, headers: req.headers as Record<string, string>, body: ['GET', 'HEAD'].includes(req.method!) ? undefined : Buffer.concat(chunks) });
    let response: Response;
    if (url.pathname === '/api/lead') {
      response = await handleLead(request, ip, { store: async () => ({ setJSON: async (k: string, v: unknown) => void leads.set(k, v) }) });
      if (response.ok) console.log('[lead] stored', [...leads.keys()].at(-1));
    } else if (url.pathname === '/api/receptionist') {
      response = await receptionist(request, { ip } as never);
    } else if (url.pathname === '/api/leads') {
      response = Response.json({ count: leads.size, leads: [...leads.values()] });
    } else response = new Response('Not found', { status: 404 });
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
    return;
  }
  let file = path.join(DIST, decodeURIComponent(url.pathname));
  if (!file.startsWith(DIST)) return void res.writeHead(403).end();
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
  } catch {
    /* noop */
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    res.end(await readFile(path.join(DIST, '404.html')).catch(() => 'Not found'));
  }
}).listen(PORT, () => console.log(`RESUELVE INTELLECT · http://localhost:${PORT}`));
