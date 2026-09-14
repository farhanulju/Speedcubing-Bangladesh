import { getEnv } from '../../lib/bindings';
import { HttpError, toError, writeAudit } from '../../lib/admin';
import { requireUser } from '../../lib/session';

export const prerender = false;

// POST /api/consent { guardian_name, relation, agree } — simple v1 consent.
// No e-signatures; checkbox + name + timestamp, optionally verified by an admin.
export async function POST({ request, locals }: { request: Request; locals: App.Locals }): Promise<Response> {
  try {
    const session = await requireUser(request, locals);
    const env = getEnv(locals);
    const body = (await request.json()) as Record<string, unknown>;
    const guardian = String(body.guardian_name ?? '').trim().slice(0, 120);
    const relation = String(body.relation ?? '').trim().slice(0, 40);
    if (body.agree !== true) throw new HttpError(400, 'consent checkbox is required');
    if (!guardian) throw new HttpError(400, 'guardian name is required');
    if (!relation) throw new HttpError(400, 'relation is required');
    await env.DB.prepare(
      'INSERT INTO guardian_consent (competitor_id, guardian_name, relation, consent_at) VALUES (?, ?, ?, date(?)) ON CONFLICT(competitor_id) DO UPDATE SET guardian_name=excluded.guardian_name, relation=excluded.relation, consent_at=excluded.consent_at',
    )
      .bind(session.cid, guardian, relation, 'now')
      .run();
    await writeAudit(env, session.cid, 'consent-record', 'guardian_consent', session.cid);
    const comp = (await env.DB.prepare('SELECT email FROM competitor WHERE id=?').bind(session.cid).first()) as null | {
      email: string | null;
    };
    let emailed = false;
    if (comp?.email) {
      await env.DB.prepare("INSERT INTO email_outbox (to_addr, template, payload_json, status, attempts) VALUES (?, 'guardian-consent-recorded', ?, 'queued', 0)")
        .bind(comp.email, JSON.stringify({ competitor: session.cid }))
        .run();
      emailed = true;
    }
    return Response.json({ ok: true, emailed });
  } catch (err) {
    return toError(err);
  }
}
