import { getEnv } from '../../../lib/bindings';
import type { SpeedbdEnv } from '../../../lib/bindings';
import {
  HttpError,
  deleteRow,
  getRow,
  getTable,
  listRows,
  requireAdmin,
  toError,
  upsertRow,
} from '../../../lib/admin';

export const prerender = false;

function tableOr404(name: string) {
  const def = getTable(name);
  if (!def) throw new HttpError(404, `unknown admin table: ${name}`);
  return def;
}

// GET /api/admin/:table → list | ?id= → one
export async function GET({
  params,
  request,
  locals,
  url,
}: {
  params: Record<string, string | undefined>;
  request: Request;
  locals: App.Locals;
  url: URL;
}): Promise<Response> {
  try {
    const def = tableOr404(params.table ?? '');
    const env = getEnv(locals);
    await requireAdmin(request, env as SpeedbdEnv & { ADMIN_DEV_BYPASS?: string });
    const id = url.searchParams.get('id');
    if (id) {
      const row = await getRow(env, def, id);
      if (!row) return Response.json({ error: 'not found' }, { status: 404 });
      return Response.json({ row });
    }
    return Response.json({ rows: await listRows(env, def) });
  } catch (err) {
    return toError(err);
  }
}

// POST /api/admin/:table (JSON body incl. pk) → upsert
export async function POST({
  params,
  request,
  locals,
}: {
  params: Record<string, string | undefined>;
  request: Request;
  locals: App.Locals;
}): Promise<Response> {
  try {
    const def = tableOr404(params.table ?? '');
    const env = getEnv(locals);
    const { actor } = await requireAdmin(request, env as SpeedbdEnv & { ADMIN_DEV_BYPASS?: string });
    const input = (await request.json()) as Record<string, unknown>;
    const id = await upsertRow(env, def, actor, input);
    return Response.json({ ok: true, id });
  } catch (err) {
    return toError(err);
  }
}

// DELETE /api/admin/:table?id= → delete
export async function DELETE({
  params,
  request,
  locals,
  url,
}: {
  params: Record<string, string | undefined>;
  request: Request;
  locals: App.Locals;
  url: URL;
}): Promise<Response> {
  try {
    const def = tableOr404(params.table ?? '');
    const env = getEnv(locals);
    const { actor } = await requireAdmin(request, env as SpeedbdEnv & { ADMIN_DEV_BYPASS?: string });
    const id = url.searchParams.get('id') ?? '';
    await deleteRow(env, def, actor, id);
    return Response.json({ ok: true });
  } catch (err) {
    return toError(err);
  }
}
