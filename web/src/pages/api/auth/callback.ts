import { getEnv } from '../../../lib/bindings';
import type { SpeedbdEnv } from '../../../lib/bindings';
import { clearStateCookieHeader, createSession, readCookie, sessionCookieHeader } from '../../../lib/auth';

export const prerender = false;

type Env = SpeedbdEnv & {
  WCA_CLIENT_ID?: string;
  WCA_CLIENT_SECRET?: string;
  SESSION_SECRET?: string;
};

const WCA_ID_RE = /^\d{4}[A-Z]{4}\d{2}$/;

interface WcaMe {
  me?: {
    id?: number | string;
    name?: string;
    email?: string;
    wca_id?: string | null;
  };
}

// GET /api/auth/callback — WCA redirects here. Verifies state, exchanges the
// code, links (or creates) the competitor row, sets the session, lands on /dashboard.
export async function GET({
  request,
  locals,
  url,
}: {
  request: Request;
  locals: App.Locals;
  url: URL;
}): Promise<Response> {
  const fail = (msg: string) => Response.json({ error: msg }, { status: 400 });
  try {
    const env = getEnv(locals) as Env;
    if (!env.WCA_CLIENT_ID || !env.WCA_CLIENT_SECRET || !env.SESSION_SECRET) {
      return Response.json({ error: 'WCA login not configured (WP-00)' }, { status: 500 });
    }
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const cookieState = readCookie(request.headers.get('cookie'), 'speedbd_oauth_state');
    if (!code || !state || !cookieState || state !== cookieState) {
      return fail('invalid login state — please try again');
    }
    const origin = new URL(request.url).origin;
    const userAgent = `SpeedcubingBD/${new URL(request.url).host}`;

    const tokenRes = await fetch('https://www.worldcubeassociation.org/oauth/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', 'User-Agent': userAgent },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: env.WCA_CLIENT_ID,
        client_secret: env.WCA_CLIENT_SECRET,
        redirect_uri: `${origin}/api/auth/callback`,
      }),
    });
    if (!tokenRes.ok) return fail('WCA token exchange failed — please try again');
    const token = ((await tokenRes.json()) as { access_token?: string }).access_token;
    if (!token) return fail('WCA token exchange failed — please try again');

    const meRes = await fetch('https://www.worldcubeassociation.org/api/v0/me', {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': userAgent },
    });
    if (!meRes.ok) return fail('could not read WCA profile — please try again');
    const me = ((await meRes.json()) as WcaMe).me ?? {};
    const sub = me.id !== undefined && me.id !== null ? String(me.id) : '';
    if (!sub) return fail('WCA profile has no user id');
    const name = typeof me.name === 'string' && me.name ? me.name : 'WCA user';
    const email = typeof me.email === 'string' && me.email.includes('@') ? me.email : null;
    const rawWcaId = typeof me.wca_id === 'string' ? me.wca_id.toUpperCase() : null;
    const wcaId = rawWcaId && WCA_ID_RE.test(rawWcaId) ? rawWcaId : null;
    if (rawWcaId && !wcaId) return fail('unrecognized WCA ID on your WCA account');
    if (wcaId) {
      // Existence check: KV person cache first, live unofficial lookup as fallback.
      // We never write the person cache here — the sync job owns KV writes.
      let known = false;
      try {
        const cached = await env.WCA_CACHE.get(`wca:person:${wcaId}`, 'json');
        known = cached !== null;
      } catch {
        known = false;
      }
      if (!known) {
        try {
          const live = await fetch(`https://raw.githubusercontent.com/robiningelbrecht/wca-rest-api/refs/heads/v1/persons/${wcaId}.json`, {
            signal: AbortSignal.timeout(10000),
          });
          known = live.ok;
        } catch {
          known = false;
        }
      }
      if (!known) return fail('WCA ID not found in official records — check your WCA account');
    }

    // Link or create the competitor row: oauth_sub wins, else adopt by wca_id.
    let row = (await env.DB.prepare('SELECT id FROM competitor WHERE wca_oauth_sub=?')
      .bind(sub)
      .first()) as null | { id: string };
    let cid: string;
    if (row) {
      cid = row.id;
      await env.DB.prepare('UPDATE competitor SET name=?, email=?, wca_id=COALESCE(?, wca_id) WHERE id=?')
        .bind(name, email, wcaId, cid)
        .run();
    } else if (wcaId) {
      const byWca = (await env.DB.prepare('SELECT id FROM competitor WHERE wca_id=?').bind(wcaId).first()) as null | {
        id: string;
      };
      if (byWca) {
        cid = byWca.id;
        await env.DB.prepare('UPDATE competitor SET wca_oauth_sub=?, name=?, email=? WHERE id=?')
          .bind(sub, name, email, cid)
          .run();
      } else {
        cid = `c-${sub}`;
        await env.DB.prepare('INSERT INTO competitor (id, wca_id, wca_oauth_sub, name, email, created_at) VALUES (?, ?, ?, ?, ?, date(?))')
          .bind(cid, wcaId, sub, name, email, 'now')
          .run();
      }
    } else {
      cid = `c-${sub}`;
      await env.DB.prepare('INSERT INTO competitor (id, wca_id, wca_oauth_sub, name, email, created_at) VALUES (?, NULL, ?, ?, ?, date(?))')
        .bind(cid, sub, name, email, 'now')
        .run();
    }

    const secure = new URL(request.url).protocol === 'https:';
    const cookie = await createSession(env.SESSION_SECRET, cid, wcaId);
    // Return to where login started (login sets speedbd_oauth_next, path-scoped
    // here). Anything but a same-origin path falls back to /dashboard.
    const rawNext = readCookie(request.headers.get('cookie'), 'speedbd_oauth_next');
    const next = rawNext && decodeURIComponent(rawNext).startsWith('/') && !decodeURIComponent(rawNext).startsWith('//')
      ? decodeURIComponent(rawNext)
      : '/dashboard';
    // Two Set-Cookie headers — never comma-joined (Expires values contain commas).
    const headers = new Headers({ location: next });
    headers.append('set-cookie', sessionCookieHeader(cookie, secure));
    headers.append('set-cookie', clearStateCookieHeader());
    headers.append('set-cookie', 'speedbd_oauth_next=; Path=/api/auth/callback; HttpOnly; SameSite=Lax; Max-Age=0');
    return new Response(null, { status: 302, headers });
  } catch {
    return Response.json({ error: 'login failed — please try again' }, { status: 500 });
  }
}
