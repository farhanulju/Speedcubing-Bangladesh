import { defineMiddleware } from 'astro:middleware';

const PRIVATE_PREFIXES = ['/admin', '/dashboard', '/api'];

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  const headers = response.headers;
  headers.set('Content-Security-Policy', "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests");
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  if (context.url.protocol === 'https:') headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  if (PRIVATE_PREFIXES.some((prefix) => context.url.pathname === prefix || context.url.pathname.startsWith(`${prefix}/`))) {
    headers.set('Cache-Control', 'no-store');
    headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return response;
});
