import { getEnv } from '../../../lib/bindings';
import { isSafeMediaKey } from '../../../lib/uploads';

export const prerender = false;

// GET /api/media/{year}/{comp}/{file} — streams R2 with stored content-type.
// Keys are validated; traversal rejected. Missing objects → 404 (R2 fallback art is M2).
export async function GET({
  params,
  locals,
}: {
  params: Record<string, string | undefined>;
  locals: App.Locals;
}): Promise<Response> {
  const key = params.key ?? '';
  if (!isSafeMediaKey(key)) return new Response('bad key', { status: 400 });
  const env = getEnv(locals);
  const obj = await env.MEDIA.get(key);
  if (!obj) return new Response('not found', { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.etag);
  return new Response(obj.body, { headers });
}
