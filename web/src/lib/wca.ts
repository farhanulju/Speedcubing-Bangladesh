// WCA cache readers (WP-22/WP-23/M4). KV-first, stale-allowed, never fetch WCA live.
// The sync worker (WP-40) is the ONLY writer. Key scheme + value shapes below
// are the contract — dev fixtures in scripts/fixtures/ must match them.
//
// Keys:
//   wca:competitions:BD        { asOfExportDate, items: CompSummary[] }
//   wca:competition:{WCA_ID}   CompDetail (WCIF-derived subset)
//   wca:records:BD             { asOfExportDate, records: EventRecord[] }
//   wca:ranks:BD:{event}       { asOfExportDate, rows: [{ wca_id, name, best_centis }] }
// Times are whole centiseconds (integers, like money).

export const WCA_CACHE_TTL_SECONDS = 24 * 60 * 60;

export interface CompSummary {
  wca_id: string;
  name: string;
  city: string;
  venue: string;
  address: string;
  start_date: string;
  end_date: string;
  events: string[];
  competitor_limit: number | null;
  url: string;
  live_url: string | null;
}

export interface CompDetail extends CompSummary {
  schedule_note: string | null;
  event_detail: { event: string; rounds: number; format: string; time_limit_centis: number | null; cutoff_centis: number | null }[];
}

export interface EventRecord {
  event: string;
  event_name: string;
  single: { value_centis: number; holder: string; wca_id: string; comp: string; date: string } | null;
  average: { value_centis: number; holder: string; wca_id: string; comp: string; date: string } | null;
}

export interface CacheEnvelope<T> {
  data: T | null;
  asOfExportDate: string | null;
  stale: boolean;
}

async function readKey<T>(env: { WCA_CACHE: KVNamespace }, key: string): Promise<CacheEnvelope<T>> {
  try {
    const raw = await env.WCA_CACHE.get(key, 'json');
    if (!raw) return { data: null, asOfExportDate: null, stale: true };
    const obj = raw as { asOfExportDate?: string } & Record<string, unknown>;
    return { data: raw as T, asOfExportDate: obj.asOfExportDate ?? null, stale: false };
  } catch {
    return { data: null, asOfExportDate: null, stale: true };
  }
}

export function getCompetitions(env: { WCA_CACHE: KVNamespace }) {
  return readKey<{ asOfExportDate: string; items: CompSummary[] }>(env, 'wca:competitions:BD');
}

export function getCompetition(env: { WCA_CACHE: KVNamespace }, wcaId: string) {
  return readKey<CompDetail>(env, `wca:competition:${wcaId}`);
}

export function getRecords(env: { WCA_CACHE: KVNamespace }) {
  return readKey<{ asOfExportDate: string; records: EventRecord[] }>(env, 'wca:records:BD');
}

export function getRanks(env: { WCA_CACHE: KVNamespace }, event: string) {
  return readKey<{ asOfExportDate: string; rows: { wca_id: string; name: string; best_centis: number }[] }>(
    env,
    `wca:ranks:BD:${event}`,
  );
}

// Whole-centisecond formatting: 582 → "5.82", 742 → "7.42", 366100 → "1:01:10.00"? No —
// WCA display: minutes only when >= 60s. 6100 → "1:01.00".
export function formatCenti(centis: number): string {
  const totalSec = Math.floor(centis / 100);
  const cs = centis % 100;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return min > 0 ? `${min}:${pad(sec)}.${pad(cs)}` : `${sec}.${pad(cs)}`;
}

export function cacheKey(kind: string, id = ''): string {
  return id ? `wca:${kind}:${id}` : `wca:${kind}`;
}
