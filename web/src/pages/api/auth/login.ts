import { stateCookieHeader } from '../../../lib/auth';

export const prerender = false;

type Env = { WCA_CLIENT_ID?: string; WCA_OAUTH_SCOPE?: string };

// GET /api/auth/login — start WCA OAuth (authorization code + state).
export async function GET({ request, locals }: { request: Request; locals: App.Locals }): Promise<Response> {
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
  return new Response(null, {
    status: 302,
    headers: {
      location: `https://www.worldcubeassociation.org/oauth/authorize?${params.toString()}`,
      'set-cookie': stateCookieHeader(state),
    },
  });
}
