import { getEnv } from '../../../lib/bindings';
import type { SpeedbdEnv } from '../../../lib/bindings';
import { requireAdmin, toError } from '../../../lib/admin';
import { setWcaAccepted } from '../../../lib/payments';

export const prerender = false;

type Env = SpeedbdEnv & { ADMIN_DEV_BYPASS?: string };

// POST /api/admin/wca-accepted { registration_id, accepted: bool }
// Manual tick ONLY after acting on the WCA site. Never implied by fee checks.
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
    const body = (await request.json()) as { registration_id?: string; accepted?: boolean };
    if (!body.registration_id) return Response.json({ error: 'registration_id is required' }, { status: 400 });
    await setWcaAccepted(env, actor, body.registration_id, body.accepted === true);
    return Response.json({ ok: true });
  } catch (err) {
    return toError(err);
  }
}
