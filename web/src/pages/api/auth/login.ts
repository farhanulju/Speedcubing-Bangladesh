import { stateCookieHeader } from '../../../lib/auth';

export const prerender = false;

type Env = { WCA_CLIENT_ID?: string; WCA_OAUTH_SCOPE?: string };

const NEXT_COOKIE = 'speedbd_oauth_next';

// GET /api/auth/login[?next=/competitions/<slug>] — start WCA OAuth
// (authorization code + state). `next` must be a same-origin path so login
// can return the user to the competition they came from.
export async function GET({ request, locals, url }: { request: Request; locals: App.Locals; url: URL }): Promise<Response> {
  const env = (locals as unknown as { runtime?: { env?: Env } }).runtime?.env ?? {};
  if (!env.WCA_CLIENT_ID) {
    return Response.json({ error: 'WCA login not configured (WP-00: register OAuth app)' }, { status: 500 });
  }
  const origin = new URL(request.url).origin;
  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: env.WCA_CLIENT_ID,
    redirect_uri: `${origin}/api/auth/callback`,
    response_type: 'code',
    scope: env.WCA_OAUTH_SCOPE ?? 'public email',
    state,
  });
  const headers = new Headers({
    location: `https://www.worldcubeassociation.org/oauth/authorize?${params.toString()}`,
  });
  headers.append('set-cookie', stateCookieHeader(state));
  const next = url.searchParams.get('next') ?? '';
  if (next.startsWith('/') && !next.startsWith('//')) {
    headers.append(
      'set-cookie',
      `${NEXT_COOKIE}=${encodeURIComponent(next.slice(0, 120))}; Path=/api/auth/callback; HttpOnly; SameSite=Lax; Max-Age=600`,
    );
  }
  return new Response(null, { status: 302, headers });
}
