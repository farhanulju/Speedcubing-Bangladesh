// Upload validation (WP-11). R2 keys: {year}/{comp-slug}/{uuid}.{ext} (AGENTS.md).
// Stills only; no video, no executables. Lost-found PDFs ride a separate
// public endpoint in M2 with its own allowlist (png/jpg/pdf).
import type { SpeedbdEnv } from './bindings';

export const IMAGE_MIME_ALLOWLIST: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export function extForMime(mime: string): string | null {
  return IMAGE_MIME_ALLOWLIST[mime] ?? null;
}

export function slugifyComp(input: string): string {
  const s = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  if (!s) throw new Error('comp slug required for upload key');
  return s;
}

export function buildUploadKey(year: string, compSlug: string, ext: string): string {
  if (!/^\d{4}$/.test(year)) throw new Error('year must be YYYY');
  return `${year}/${slugifyComp(compSlug)}/${crypto.randomUUID()}.${ext}`;
}

export function isSafeMediaKey(key: string): boolean {
  return /^[a-z0-9][\w\-./]{1,180}$/.test(key) && !key.includes('..');
}

export async function putImage(env: SpeedbdEnv, file: File, year: string, folder: string): Promise<string> {
  const ext = extForMime(file.type);
  if (!ext) throw new Error(`rejected mime: ${file.type}`);
  if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) throw new Error('rejected size');
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength <= 0 || bytes.byteLength > MAX_UPLOAD_BYTES) throw new Error('rejected size');
  const key = buildUploadKey(year, folder, ext);
  await env.MEDIA.put(key, bytes, {
    httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' },
  });
  return `/api/media/${key}`;
}
