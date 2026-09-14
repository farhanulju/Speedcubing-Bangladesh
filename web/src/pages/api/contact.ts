import { getEnv } from '../../lib/bindings';
import { HttpError, toError } from '../../lib/admin';
import { turnstileSecret, verifyTurnstile } from '../../lib/turnstile';

export const prerender = false;

const CATEGORIES = ['general', 'competition', 'sponsorship', 'volunteer', 'press', 'other'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function rid(): string {
  return `cm-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
}

// POST /api/contact — public, Turnstile-gated. Bodies stay admin-only.
export async function POST({ request, locals }: { request: Request; locals: App.Locals }): Promise<Response> {
  try {
    const env = getEnv(locals);
    const body = (await request.json()) as Record<string, unknown>;
    const name = String(body.name ?? '').trim().slice(0, 120);
    const email = String(body.email ?? '').trim().slice(0, 160);
    const category = String(body.category ?? 'general');
    const message = String(body.message ?? '').trim();
    const wcaId = String(body.wca_id ?? '').trim().slice(0, 20) || null;
    if (!name) throw new HttpError(400, 'name is required');
    if (!EMAIL_RE.test(email)) throw new HttpError(400, 'valid email is required');
    if (!CATEGORIES.includes(category)) throw new HttpError(400, 'unknown category');
    if (message.length < 10 || message.length > 5000) throw new HttpError(400, 'message must be 10–5000 chars');
    const token = String(body.turnstile_token ?? '');
    const secrets = env as unknown as Record<string, string | undefined>;
    if (!(await verifyTurnstile(token, turnstileSecret(secrets)))) {
      throw new HttpError(403, 'human verification failed');
    }
    await env.DB.prepare(
      "INSERT INTO contact_message (id, name, email, wca_id, category, body, status, at) VALUES (?, ?, ?, ?, ?, ?, 'open', date('now'))",
    )
      .bind(rid(), name, email, wcaId, category, message)
      .run();
    return Response.json({ ok: true });
  } catch (err) {
    return toError(err);
  }
}
