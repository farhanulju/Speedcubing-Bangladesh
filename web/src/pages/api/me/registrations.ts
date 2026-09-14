import { getEnv } from '../../../lib/bindings';
import { toError } from '../../../lib/admin';
import { getMyRegistrations } from '../../../lib/registrations';
import { requireUser } from '../../../lib/session';

export const prerender = false;

// GET /api/me/registrations — session's registrations with latest Tx state + comp names.
export async function GET({ request, locals }: { request: Request; locals: App.Locals }): Promise<Response> {
  try {
    const session = await requireUser(request, locals);
    const env = getEnv(locals);
    return Response.json({ rows: await getMyRegistrations(env, session.cid) });
  } catch (err) {
    return toError(err);
  }
}
