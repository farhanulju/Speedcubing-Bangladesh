import { getEnv } from '../../lib/bindings';
import { HttpError, toError } from '../../lib/admin';
import { turnstileSecret, verifyTurnstile } from '../../lib/turnstile';
import { IMAGE_MIME_ALLOWLIST, MAX_UPLOAD_BYTES } from '../../lib/uploads';

export const prerender = false;

const FILE_ALLOWLIST: Record<string, string> = { ...IMAGE_MIME_ALLOWLIST, 'application/pdf': 'pdf' };

function rid(): string {
  return `lf-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
}

// POST /api/lost-found (multipart) — public, Turnstile-gated.
// Photo/receipt (png/jpg/webp/avif/pdf ≤8MB) → R2 `lostfound/{YYYY}/{uuid}.{ext}`.
// Reporter contacts stay admin-only; the public log shows item + status only.
export async function POST({ request, locals }: { request: Request; locals: App.Locals }): Promise<Response> {
  try {
    const env = getEnv(locals);
    const form = await request.formData();
    const str = (k: string, max: number): string => String(form.get(k) ?? '').trim().slice(0, max);
    const item = str('item', 200);
    const reporterContact = str('reporter_contact', 160);
    if (!item) throw new HttpError(400, 'item description is required');
    if (!reporterContact) throw new HttpError(400, 'a contact (phone or email) is required');
    const token = str('turnstile_token', 2048);
    const secrets = env as unknown as Record<string, string | undefined>;
    if (!(await verifyTurnstile(token, turnstileSecret(secrets)))) {
      throw new HttpError(403, 'human verification failed');
    }
    const compWcaId = str('comp_wca_id', 40) || null;
    let photoR2: string | null = null;
    const file = form.get('photo');
    if (file instanceof File && file.size > 0) {
      const ext = FILE_ALLOWLIST[file.type];
      if (!ext) throw new HttpError(400, `rejected file type: ${file.type}`);
      // Buffered (not streamed): identical bytes on Node, workerd, and miniflare R2.
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (bytes.byteLength > MAX_UPLOAD_BYTES) throw new HttpError(400, 'file over 8 MB');
      const year = new Date().getFullYear().toString();
      photoR2 = `lostfound/${year}/${crypto.randomUUID()}.${ext}`;
      await env.MEDIA.put(photoR2, bytes, {
        httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' },
      });
    }
    const id = rid();
    await env.DB.prepare(
      "INSERT INTO lost_found (id, comp_wca_id, item, photo_r2, status, reporter_contact, created_at) VALUES (?, ?, ?, ?, 'open', ?, date('now'))",
    )
      .bind(id, compWcaId, item, photoR2, reporterContact)
      .run();
    return Response.json({ ok: true, id });
  } catch (err) {
    return toError(err);
  }
}
