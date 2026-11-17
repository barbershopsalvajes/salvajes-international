import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const base = (site?.href ?? 'https://resuelveintellect.com/').replace(/\/$/, '');
  return new Response(
    ['User-agent: *', 'Allow: /', 'Disallow: /api/', '', `Sitemap: ${base}/sitemap-index.xml`, ''].join('\n'),
    { headers: { 'content-type': 'text/plain; charset=utf-8' } },
  );
};
