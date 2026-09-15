import { getEnv } from '../../../lib/bindings';
import type { SpeedbdEnv } from '../../../lib/bindings';
import { requireAdmin, toError } from '../../../lib/admin';
import { listLostFound, setLostFoundStatus } from '../../../lib/inbox';

export const prerender = false;

type Env = SpeedbdEnv & { ADMIN_DEV_BYPASS?: string };

// GET /api/admin/lost-found?status= → inbox list (reporter contacts stay admin-only)
export async function GET({
  request,
  locals,
  url,
}: {
  request: Request;
  locals: App.Locals;
  url: URL;
}): Promise<Response> {
  try {
    const env = getEnv(locals);
    await requireAdmin(request, env as Env);
    const rows = await listLostFound(env, url.searchParams.get('status') ?? undefined);
    return Response.json({ rows });
  } catch (err) {
    return toError(err);
  }
}

// POST /api/admin/lost-found { id, status: open|in_progress|resolved|returned }
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
    const body = (await request.json()) as { id?: string; status?: string };
    if (!body.id || !body.status) return Response.json({ error: 'id and status are required' }, { status: 400 });
    await setLostFoundStatus(env, actor, body.id, body.status);
    return Response.json({ ok: true });
  } catch (err) {
    return toError(err);
  }
}
