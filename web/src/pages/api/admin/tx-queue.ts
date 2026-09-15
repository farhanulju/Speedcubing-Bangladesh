import { getEnv } from '../../../lib/bindings';
import type { SpeedbdEnv } from '../../../lib/bindings';
import { requireAdmin, toError } from '../../../lib/admin';
import { getTx, listTxQueue } from '../../../lib/payments';

export const prerender = false;

type Env = SpeedbdEnv & { ADMIN_DEV_BYPASS?: string };

// GET /api/admin/tx-queue?status=&comp= → list | ?id= → one
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
    const id = url.searchParams.get('id');
    if (id) {
      const row = await getTx(env, id);
      if (!row) return Response.json({ error: 'not found' }, { status: 404 });
      return Response.json({ row });
    }
    const rows = await listTxQueue(env, {
      status: url.searchParams.get('status') ?? undefined,
      comp: url.searchParams.get('comp') ?? undefined,
    });
    return Response.json({ rows });
  } catch (err) {
    return toError(err);
  }
}
