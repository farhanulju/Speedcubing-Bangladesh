import { getEnv } from '../../lib/bindings';
import { HttpError, toError } from '../../lib/admin';
import { turnstileSecret, verifyTurnstile } from '../../lib/turnstile';

export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/opt-in — email-only in v1 (phones need an explicit-consent flow).
// Duplicate handles return ok:true (no existence oracle beyond the benign hint).
export async function POST({ request, locals }: { request: Request; locals: App.Locals }): Promise<Response> {
  try {
    const env = getEnv(locals);
    const body = (await request.json()) as Record<string, unknown>;
    if (body.channel !== 'email') throw new HttpError(400, 'only email opt-in is available in v1');
    const handle = String(body.handle ?? '').trim().toLowerCase().slice(0, 160);
    if (!EMAIL_RE.test(handle)) throw new HttpError(400, 'valid email is required');
    const token = String(body.turnstile_token ?? '');
    const secrets = env as unknown as Record<string, string | undefined>;
    if (!(await verifyTurnstile(token, turnstileSecret(secrets)))) {
      throw new HttpError(403, 'human verification failed');
    }
    try {
      await env.DB.prepare("INSERT INTO opt_in (id, channel, handle, consent_at) VALUES (?, 'email', ?, date('now'))")
        .bind(`opt-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`, handle)
        .run();
      return Response.json({ ok: true, duplicate: false });
    } catch {
      return Response.json({ ok: true, duplicate: true });
    }
  } catch (err) {
    return toError(err);
  }
}
