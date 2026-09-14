// Request session gate (WP-30). Fails closed: no cookie/secret → 401.
// Dev seam: ADMIN_DEV_BYPASS=1 + `x-dev-user: <competitor_id>` header builds a
// session from the D1 row (full end-to-end local testing without a WCA app).
// Production has no bypass var, so the seam is inert there.
import { getEnv } from './bindings';
import type { SpeedbdEnv } from './bindings';
import { HttpError } from './admin';
import { SESSION_COOKIE, readCookie, verifySession, type Session } from './auth';

type Env = SpeedbdEnv & { SESSION_SECRET?: string; ADMIN_DEV_BYPASS?: string };

export async function requireUser(request: Request, locals: App.Locals): Promise<Session> {
  const env = getEnv(locals) as Env;
  if (env.ADMIN_DEV_BYPASS === '1') {
    const devUser = request.headers.get('x-dev-user');
    if (devUser) {
      const row = (await env.DB.prepare('SELECT id, wca_id FROM competitor WHERE id=?')
        .bind(devUser)
        .first()) as null | { id: string; wca_id: string | null };
      if (!row) throw new HttpError(401, 'dev user not found');
      return { cid: row.id, wca: row.wca_id, exp: Math.floor(Date.now() / 1000) + 3600 };
    }
  }
  const secret = env.SESSION_SECRET ?? '';
  if (!secret) throw new HttpError(401, 'sessions not configured');
  const session = await verifySession(secret, readCookie(request.headers.get('cookie'), SESSION_COOKIE) ?? '');
  if (!session) throw new HttpError(401, 'login required');
  return session;
}

export async function optionalUser(request: Request, locals: App.Locals): Promise<Session | null> {
  try {
    return await requireUser(request, locals);
  } catch {
    return null;
  }
}
