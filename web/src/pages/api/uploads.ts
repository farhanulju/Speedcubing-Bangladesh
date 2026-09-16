import { getEnv } from '../../lib/bindings';
import { HttpError, requireAdmin, toError } from '../../lib/admin';
import { putImage } from '../../lib/uploads';

export const prerender = false;

// Editor.js byFile contract plus a key for regular admin image fields. Every
// upload is Access-gated and restricted to validated still-image types/sizes.
export async function POST({ request, locals }: { request: Request; locals: App.Locals }): Promise<Response> {
  try {
    const env = getEnv(locals);
    await requireAdmin(request, env as Parameters<typeof requireAdmin>[1]);
    const form = await request.formData();
    const file = form.get('file') ?? form.get('image');
    if (!(file instanceof File) || file.size === 0) throw new HttpError(400, 'Choose an image to upload.');
    const table = String(form.get('table') ?? 'content').toLowerCase();
    if (!['person', 'sponsor', 'news', 'page', 'announcement', 'content'].includes(table)) {
      throw new HttpError(400, 'Unknown image destination.');
    }
    const context = String(form.get('context') ?? '').trim().slice(0, 80) || table;
    const year = new Date().getFullYear().toString();
    const url = await putImage(env, file, year, `${table}-${context}`);
    const key = url.replace(/^\/api\/media\//, '');
    return Response.json({ success: 1, key, file: { url }, url });
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('rejected')) return Response.json({ success: 0, message: err.message }, { status: 400 });
    const response = toError(err);
    return Response.json({ success: 0, message: (await response.json().catch(() => ({})) as { error?: string }).error ?? 'Upload failed.' }, { status: response.status });
  }
}

export { getEnv };
