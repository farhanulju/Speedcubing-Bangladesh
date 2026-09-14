// Cloudflare bindings shared by endpoints and workers (single definition).
export interface SpeedbdEnv {
  DB: D1Database;
  WCA_CACHE: KVNamespace;
  MEDIA: R2Bucket;
}

export function getEnv(locals: App.Locals): SpeedbdEnv {
  const runtime = (locals as unknown as { runtime?: { env?: SpeedbdEnv } }).runtime;
  if (!runtime?.env?.DB || !runtime?.env?.MEDIA) {
    throw new Error('missing Cloudflare bindings (see plan/OPS_HANDOFF.md WP-00)');
  }
  return runtime.env;
}
