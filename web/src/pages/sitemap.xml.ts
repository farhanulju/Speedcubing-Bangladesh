import type { APIRoute } from 'astro';
import { getNews } from '../lib/content';
import { EDGE_CACHE_VALUE, tryLoad } from '../lib/page';
import { getCompetitions } from '../lib/wca';

export const prerender = false;

const STATIC_PATHS = [
  '/',
  '/about',
  '/people',
  '/competitions',
  '/records',
  '/faq',
  '/news',
  '/sponsors',
  '/worlds-2027',
  '/contact',
  '/lost-found',
  '/privacy',
];

function escapeXml(value: string): string {
  return value.replace(/[<>&'\"]/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  })[character] ?? character);
}

export const GET: APIRoute = async ({ locals, url }) => {
  const [competitions, news] = await Promise.all([
    tryLoad(locals, (env) => getCompetitions(env), { data: null, asOfExportDate: null, stale: true }),
    tryLoad(locals, (env) => getNews(env, 200), []),
  ]);
  const paths = new Set(STATIC_PATHS);
  for (const competition of competitions.data?.items ?? []) paths.add(`/competitions/${encodeURIComponent(competition.wca_id)}`);
  for (const item of news) paths.add(`/news/${encodeURIComponent(item.slug)}`);

  const entries = [...paths]
    .map((path) => `  <url><loc>${escapeXml(new URL(path, url.origin).toString())}</loc></url>`)
    .join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': EDGE_CACHE_VALUE,
    },
  });
};
