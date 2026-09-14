import { clearSessionCookieHeader } from '../../../lib/auth';

export const prerender = false;

// GET /api/auth/logout — clear the session, land on home.
export async function GET(): Promise<Response> {
  return new Response(null, {
    status: 302,
    headers: { location: '/', 'set-cookie': clearSessionCookieHeader() },
  });
}
