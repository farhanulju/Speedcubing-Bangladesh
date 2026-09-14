// Page helpers (WP-21): edge-cache headers + fail-soft data loading.
// Cloudflare has no Next-style ISR: `public, s-maxage=3600` at the edge is the
// equivalent. Data pages are SSR (never prerendered) and degrade to honest
// empty states when KV/D1 are cold or bindings are absent (pre-WP-00).
import { getEnv } from './bindings';
import type { SpeedbdEnv } from './bindings';

export const EDGE_CACHE_VALUE = 'public, s-maxage=3600, stale-while-revalidate=86400';

export async function tryLoad<T>(locals: App.Locals, fn: (env: SpeedbdEnv) => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn(getEnv(locals));
  } catch {
    return fallback;
  }
}
