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

// WCA venue strings arrive as Markdown (`[Name](url)`), bare URLs, or plain
// text. Never render the source verbatim — split into a display name plus an
// optional safe (http/https) link. Unknown shapes render as plain text.
export function venueDisplay(raw: string): { name: string; url: string | null } {
  const s = (raw ?? '').trim();
  const md = /^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/.exec(s);
  if (md) return { name: md[1]!.trim() || s, url: md[2]! };
  if (/^https?:\/\/[^ \s]+$/.test(s)) {
    try {
      const u = new URL(s);
      return { name: u.hostname.replace(/^www\./, ''), url: s };
    } catch {
      return { name: s, url: null };
    }
  }
  return { name: s, url: null };
}

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

export interface ScheduleItem {
  start: string;
  end: string;
  title: string;
  room: string;
}

export interface ScheduleDay {
  date: string;
  label: string;
  items: ScheduleItem[];
}

export interface DelegateEntry {
  name: string;
  wca_id: string | null;
  role: 'delegate' | 'organizer';
}

export interface CompDetail extends CompSummary {
  schedule_note: string | null;
  event_detail: { event: string; rounds: number; format: string; time_limit_centis: number | null; cutoff_centis: number | null }[];
  // Present once the sync worker has run past this deploy; older KV rows omit them.
  schedule?: ScheduleDay[];
  delegates?: DelegateEntry[];
}

export interface EventRecord {
  event: string;
  event_name: string;
  // Rank files carry no comp/date per record — v1 shows holder + value + stamp.
  single: { value_centis: number; holder: string; wca_id: string } | null;
  average: { value_centis: number; holder: string; wca_id: string } | null;
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

// Raw upstream rank rows are stored verbatim under `items` (personId, best,
// rank tiers). Dashboard joins display names from the wca:person cache (M3),
// fetching missing persons on demand. Never store names here — persons change.
export function getRanks(env: { WCA_CACHE: KVNamespace }, event: string, type: 'single' | 'average') {
  return readKey<{
    asOfExportDate: string;
    items: { personId: string; eventId: string; best: number; rank: { world: number; continent: number; country: number } }[];
  }>(env, `wca:ranks:BD:${event}:${type}`);
}

// Whole-centisecond formatting: 582 → "5.82". Minutes only when >= 60s: 6100 → "1:01.00".
export function formatCenti(centis: number): string {
  const totalSec = Math.floor(centis / 100);
  const cs = centis % 100;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return min > 0 ? `${min}:${pad(sec)}.${pad(cs)}` : `${sec}.${pad(cs)}`;
}

// Record display values. Two events are NOT centiseconds:
// - 333fm: single = whole moves, average = moves × 100.
// - 333mbf: packed encoding (not decoded in v1) → null, link WCA instead.
export function formatRecordValue(event: string, kind: 'single' | 'average', value: number): string | null {
  if (event === '333mbf') return null;
  if (event === '333fm') {
    return kind === 'single' ? `${value} moves` : `${(value / 100).toFixed(2)} moves`;
  }
  return formatCenti(value);
}

export function cacheKey(kind: string, id = ''): string {
  return id ? `wca:${kind}:${id}` : `wca:${kind}`;
}
