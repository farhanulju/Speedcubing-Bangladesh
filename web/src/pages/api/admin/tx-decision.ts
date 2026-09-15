import { getEnv } from '../../../lib/bindings';
import type { SpeedbdEnv } from '../../../lib/bindings';
import { requireAdmin, toError } from '../../../lib/admin';
import { decideTx, type TxDecision } from '../../../lib/payments';

export const prerender = false;

type Env = SpeedbdEnv & { ADMIN_DEV_BYPASS?: string };

// POST /api/admin/tx-decision { id, decision: accepted|rejected, note? }
// Atomic: tx status + registration fee track + audit + email enqueue.
export async function POST({
  request,
  locals,
}: {
  request: Request;
  locals: App.Locals;
}): Promise<Response> {
  try {
    const env = getEnv(locals);
    const { actor } = await requireAdmin(request, env as Env);
    const body = (await request.json()) as { id?: string; decision?: string; note?: string };
    if (!body.id) return Response.json({ error: 'id is required' }, { status: 400 });
    const result = await decideTx(env, actor, body.id, body.decision as TxDecision, body.note ?? '');
    return Response.json({ ok: true, ...result });
  } catch (err) {
    return toError(err);
  }
}
