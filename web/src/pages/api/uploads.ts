import { getEnv } from '../../lib/bindings';
import { buildUploadKey, extForMime, MAX_UPLOAD_BYTES } from '../../lib/uploads';

export const prerender = false;

// Editor.js byFile contract: multipart field `image` → { success: 1, file: { url } }.
// Auth: FAILS CLOSED until WP-16 wires Access (admin) — never an open uploader.
export async function POST(): Promise<Response> {
  return failClosed();
}

function failClosed(): Response {
  // WP-16 replaces this with: Access JWT (admin) or WCA session (lost-found flow).
  return Response.json({ success: 0, message: 'uploader disabled until WP-16 auth lands' }, { status: 503 });
}

export async function putImage(
  env: ReturnType<typeof getEnv>,
  file: File,
  year: string,
  compSlug: string,
): Promise<string> {
  const ext = extForMime(file.type);
  if (!ext) throw new Error(`rejected mime: ${file.type}`);
  // Buffered (not streamed): identical bytes on Node, workerd, and miniflare R2.
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength <= 0 || bytes.byteLength > MAX_UPLOAD_BYTES) throw new Error('rejected size');
  const key = buildUploadKey(year, compSlug, ext);
  await env.MEDIA.put(key, bytes, {
    httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' },
  });
  return `/api/media/${key}`;
}

export { getEnv };
