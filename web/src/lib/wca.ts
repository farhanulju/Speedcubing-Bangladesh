// WCA cache client (KV-backed, daily revalidate).
// Rule: pages/components never fetch worldcubeassociation.org directly.
// Full implementation in WP-40. Stubs below keep the M0 build honest.

export interface WcaCacheMeta {
  asOfExportDate: string;
  stale: boolean;
}

export const WCA_CACHE_TTL_SECONDS = 24 * 60 * 60;

export function cacheKey(kind: string, id = ''): string {
  return id ? `wca:${kind}:${id}` : `wca:${kind}`;
}

export async function readThroughNotImplemented(): Promise<never> {
  throw new Error('not implemented — WP-40 (sync-wca cron + KV read-through)');
}
