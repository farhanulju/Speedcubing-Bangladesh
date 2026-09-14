// Sync core (WP-40/WP-41/WP-42): pure shaping + injectable IO.
// Upstream contracts verified live 2026-09-14 (see plan notes in code):
// - unofficial static JSON: raw.githubusercontent.com/robiningelbrecht/wca-rest-api/refs/heads/v1
//   rank/{ISO2}/{single|average}/{event}.json, competitions/{ISO2}.json,
//   competitions/{id}.json, persons/{wca_id}.json, results/{comp}/{event}.json
// - official v0 (no auth for reads): /api/v0/competitions?country_iso2=BD (bare array,
//   paginated via ?page=), /api/v0/competitions/:id/wcif/public
// Privacy: ALL emails stripped before KV write; `information` markdown dropped.

export const UNOFFICIAL_BASE =
  'https://raw.githubusercontent.com/robiningelbrecht/wca-rest-api/refs/heads/v1';
export const WCA_V0 = 'https://www.worldcubeassociation.org/api/v0';
export const BD_ISO2 = 'BD';

// Canonical 17 WCA event IDs — fallback if events.json is unreachable.
export const CANONICAL_EVENTS = [
  '333', '222', '444', '555', '666', '777',
  '333bf', '333fm', '333oh', '333mbf', '444bf', '555bf',
  'clock', 'minx', 'pyram', 'skewb', 'sq1',
];

export const WCIF_FORMATS: Record<string, string> = {
  '1': 'Best of 1',
  '2': 'Best of 2',
  '3': 'Best of 3',
  a: 'Average of 5',
  m: 'Mean of 3',
};

export type FetchJson = (url: string) => Promise<unknown>;
export type KvPut = (key: string, value: string) => Promise<void>;

// Minimal D1 surface used here (real D1 in prod, fake in node tests).
export interface DbStmt {
  bind(...values: (string | number | null)[]): DbStmt;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}
export interface SyncDb {
  prepare(query: string): DbStmt;
  batch(statements: { run(): Promise<unknown> }[]): Promise<unknown[]>;
}

export async function fetchJson(fetchFn: typeof fetch, url: string): Promise<unknown | null> {
  try {
    const res = await fetchFn(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  }
}

// ---------- shaping (pure, node-tested) ----------

export interface UnofficialCompInput {
  id?: unknown;
  name?: unknown;
  city?: unknown;
  date?: { from?: unknown; till?: unknown };
  isCanceled?: unknown;
  events?: unknown;
  venue?: { name?: unknown; address?: unknown; details?: unknown };
  externalWebsite?: unknown;
}

export interface V0RowInput {
  id?: unknown;
  competitor_limit?: unknown;
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

export function shapeCompSummary(u: UnofficialCompInput, v0?: V0RowInput | null): CompSummary | null {
  const id = typeof u.id === 'string' ? u.id : '';
  if (!id) return null;
  return {
    wca_id: id,
    name: typeof u.name === 'string' ? u.name : id,
    city: typeof u.city === 'string' ? u.city : '',
    venue: typeof u.venue?.name === 'string' ? u.venue.name : '',
    address: typeof u.venue?.address === 'string' ? u.venue.address : '',
    start_date: typeof u.date?.from === 'string' ? u.date.from : '',
    end_date: typeof u.date?.till === 'string' ? u.date.till : '',
    events: Array.isArray(u.events) ? u.events.filter((e): e is string => typeof e === 'string') : [],
    competitor_limit: typeof v0?.competitor_limit === 'number' ? v0.competitor_limit : null,
    url: `https://www.worldcubeassociation.org/competitions/${id}`,
    live_url: `https://live.worldcubeassociation.org/competitions/${id}`,
  };
}

interface WcifRound {
  format?: string;
  timeLimit?: { centiseconds?: number } | null;
  cutoff?: { attemptResult?: number } | null;
}
interface WcifEvent {
  id?: string;
  rounds?: WcifRound[];
}

export interface CompEventDetail {
  event: string;
  rounds: number;
  format: string;
  time_limit_centis: number | null;
  cutoff_centis: number | null;
}

export interface CompDetail extends CompSummary {
  schedule_note: string | null;
  event_detail: CompEventDetail[];
}

export function shapeEventDetail(wcif: unknown): CompEventDetail[] {
  const events = (wcif as { events?: unknown })?.events;
  if (!Array.isArray(events)) return [];
  const out: CompEventDetail[] = [];
  for (const e of events as WcifEvent[]) {
    if (typeof e?.id !== 'string' || !Array.isArray(e.rounds) || e.rounds.length === 0) continue;
    const last = e.rounds[e.rounds.length - 1] as WcifRound;
    out.push({
      event: e.id,
      rounds: e.rounds.length,
      format: WCIF_FORMATS[String(last?.format ?? '')] ?? String(last?.format ?? ''),
      time_limit_centis: typeof last?.timeLimit?.centiseconds === 'number' ? last.timeLimit.centiseconds : null,
      cutoff_centis: typeof last?.cutoff?.attemptResult === 'number' ? last.cutoff.attemptResult : null,
    });
  }
  return out;
}

export interface RankItem {
  personId?: string;
  eventId?: string;
  best?: number;
  rank?: { country?: number };
}

export interface NrEntry {
  value_centis: number;
  holder: string;
  wca_id: string;
}

export interface EventRecord {
  event: string;
  single: NrEntry | null;
  average: NrEntry | null;
}

// Country rank 1 = national record holder. Rank files carry no comp/date for the
// record itself, so v1 shows holder + value + export stamp (history comes from
// snapshots, which accumulate over time).
export function nrHolder(items: RankItem[], persons: Map<string, string>): NrEntry | null {
  const top = items.find((r) => r?.rank?.country === 1 && typeof r.personId === 'string' && typeof r.best === 'number');
  if (!top?.personId || typeof top.best !== 'number') return null;
  return { value_centis: top.best, holder: persons.get(top.personId) ?? 'Unknown', wca_id: top.personId };
}

interface ResultItem {
  eventId?: string;
  round?: string;
  position?: number;
  personId?: string;
  best?: number;
  average?: number;
}

export function deriveChampion(items: ResultItem[]): { winner_wca_id: string; winning_value_centis: number } | null {
  if (!Array.isArray(items)) return null;
  const finals = items.filter(
    (r) => r?.eventId === '333' && r?.round === 'Final' && r?.position === 1 && typeof r?.personId === 'string',
  );
  const win = finals[0];
  if (!win?.personId) return null;
  const value = typeof win.average === 'number' ? win.average : typeof win.best === 'number' ? win.best : null;
  if (value === null) return null;
  return { winner_wca_id: win.personId, winning_value_centis: value };
}

// ---------- snapshots ----------

export interface SnapshotRow {
  event: string;
  kind: string;
  value_centis: number;
  holder_wca_id: string;
  holder_name: string;
}

export function snapshotDiff(
  current: SnapshotRow[],
  latest: Map<string, SnapshotRow>,
): SnapshotRow[] {
  return current.filter((c) => {
    const prev = latest.get(`${c.event}:${c.kind}`);
    return !prev || prev.value_centis !== c.value_centis || prev.holder_wca_id !== c.holder_wca_id;
  });
}

// ---------- email (WP-42) ----------

export const EMAIL_TEMPLATES = ['payment-verified', 'payment-rejected', 'guardian-consent-recorded'] as const;

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function renderEmail(template: string, payload: Record<string, string>): { subject: string; html: string } {
  const comp = esc(payload.comp ?? '');
  if (template === 'payment-verified') {
    return {
      subject: `Payment verified — ${payload.comp ?? ''}`,
      html: `<p>Your ৳${esc(payload.amount ?? '')} payment for <b>${comp}</b> was verified by a delegate.</p><p>Track status anytime in your dashboard. WCA acceptance is a separate manual step.</p>`,
    };
  }
  if (template === 'payment-rejected') {
    return {
      subject: `Payment needs attention — ${payload.comp ?? ''}`,
      html: `<p>Your payment submission for <b>${comp}</b> could not be verified.</p><p>Reason: ${esc(payload.note ?? 'no reason recorded')}</p><p>Please resubmit with the correct TxID.</p>`,
    };
  }
  return {
    subject: 'Guardian consent recorded',
    html: `<p>Guardian consent for <b>${esc(payload.competitor ?? '')}</b> is on file. Thank you.</p>`,
  };
}

export type MailSender = (to: string, subject: string, html: string) => Promise<boolean>;

export function resendSender(fetchFn: typeof fetch, apiKey: string, from: string): MailSender {
  return async (to, subject, html) => {
    try {
      const res = await fetchFn('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({ from, to: [to], subject, html }),
      });
      return res.ok;
    } catch {
      return false;
    }
  };
}

export interface OutboxRow {
  id: number;
  to_addr: string;
  template: string;
  payload_json: string;
  attempts: number;
}

export async function flushOutbox(db: SyncDb, send: MailSender, limit = 25): Promise<{ sent: number; failed: number }> {
  const queued = (await db
    .prepare("SELECT id, to_addr, template, payload_json, attempts FROM email_outbox WHERE status='queued' AND attempts < 3 ORDER BY id LIMIT ?")
    .bind(limit)
    .all<OutboxRow>()).results;
  let sent = 0;
  let failed = 0;
  for (const row of queued) {
    let payload: Record<string, string> = {};
    try {
      payload = JSON.parse(row.payload_json) as Record<string, string>;
    } catch {
      payload = {};
    }
    const { subject, html } = renderEmail(row.template, payload);
    const ok = await send(row.to_addr, subject, html);
    if (ok) {
      await db.prepare("UPDATE email_outbox SET status='sent', sent_at=date('now') WHERE id=?").bind(row.id).run();
      sent++;
    } else {
      const attempts = row.attempts + 1;
      await db.prepare("UPDATE email_outbox SET attempts=?, status=CASE WHEN ? >= 3 THEN 'failed' ELSE 'queued' END WHERE id=?")
        .bind(attempts, attempts, row.id)
        .run();
      failed++;
    }
  }
  return { sent, failed };
}
