// Standalone scheduled worker: WCA sync (daily) + outbox flush (5 min).
// Deploy: `npx wrangler deploy -c workers/sync/wrangler.jsonc` (after WP-00).
// Pure logic lives in sync.ts (node-tested); this file only wires IO.
import {
  BD_ISO2,
  CANONICAL_EVENTS,
  UNOFFICIAL_BASE,
  WCA_V0,
  deriveChampion,
  fetchJson,
  flushOutbox,
  nrHolder,
  resendSender,
  shapeCompSummary,
  shapeEventDetail,
  snapshotDiff,
  type CompDetail,
  type CompSummary,
  type DbStmt,
  type EventRecord,
  type RankItem,
  type SyncDb,
  type UnofficialCompInput,
  type V0RowInput,
} from './sync.js';

export interface SyncEnv {
  DB: D1Database;
  WCA_CACHE: KVNamespace;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
}

const SYNC_CRON = '0 20 * * *'; // 02:00 Asia/Dhaka
const CHAMPION_FETCH_CAP = 10;

const asDb = (db: D1Database): SyncDb => ({
  prepare: (q: string): DbStmt => {
    const stmt = db.prepare(q);
    const wrap: DbStmt = {
      bind: (...v: (string | number | null)[]) => {
        const bound = stmt.bind(...v);
        return {
          bind: () => {
            throw new Error('already bound');
          },
          first: <T>() => bound.first<T>(),
          all: <T>() => bound.all<T>() as Promise<{ results: T[] }>,
          run: () => bound.run(),
        };
      },
      first: () => stmt.first(),
      all: <T>() => stmt.all<T>() as Promise<{ results: T[] }>,
      run: () => stmt.run(),
    };
    return wrap;
  },
  // Sequential, not D1-native batch: keeps SyncDb portable (node:sqlite has no
  // batch of prepared statements). All call sites are idempotent re-runs.
  batch: async (stmts: { run(): Promise<unknown> }[]) => {
    const out: unknown[] = [];
    for (const s of stmts) out.push(await s.run());
    return out;
  },
});

async function kvPut(env: SyncEnv, key: string, value: unknown): Promise<void> {
  try {
    await env.WCA_CACHE.put(key, JSON.stringify(value));
  } catch (err) {
    console.log(`KV put failed for ${key}: ${err instanceof Error ? err.message : err}`);
  }
}

interface UnofficialCompList {
  items?: Record<string, unknown>[];
}

async function runSync(env: SyncEnv): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const fetchFn: typeof fetch = fetch;

  // --- events enumeration (allowlisted: upstream still ships removed events
  // like 333mbo/333ft/fto/magic/mmagic, which must never reach KV or snapshots) ---
  let events = CANONICAL_EVENTS;
  const eventsDoc = (await fetchJson(fetchFn, `${UNOFFICIAL_BASE}/events.json`)) as null | {
    items?: { id?: string }[];
  };
  if (eventsDoc && Array.isArray(eventsDoc.items) && eventsDoc.items.length > 0) {
    const ids = eventsDoc.items
      .map((e) => e?.id)
      .filter((id): id is string => typeof id === 'string' && CANONICAL_EVENTS.includes(id));
    if (ids.length > 0) events = ids;
  }

  // --- ranks + records (per event × single/average) ---
  const rankFiles = new Map<string, RankItem[]>();
  await Promise.all(
    events.flatMap((event) =>
      (['single', 'average'] as const).map(async (kind) => {
        const doc = (await fetchJson(fetchFn, `${UNOFFICIAL_BASE}/rank/${BD_ISO2}/${kind}/${event}.json`)) as null | {
          items?: RankItem[];
        };
        if (doc && Array.isArray(doc.items)) {
          rankFiles.set(`${kind}:${event}`, doc.items);
          await kvPut(env, `wca:ranks:BD:${event}:${kind}`, { asOfExportDate: today, items: doc.items });
        }
      }),
    ),
  );

  // --- persons needed: NR holders ---
  const holderIds = new Set<string>();
  for (const [, items] of rankFiles) {
    const top = items.find((r) => r?.rank?.country === 1 && typeof r.personId === 'string');
    if (top?.personId) holderIds.add(top.personId);
  }
  const persons = new Map<string, string>();
  await Promise.all(
    [...holderIds].map(async (id) => {
      const cached = (await env.WCA_CACHE.get(`wca:person:${id}`, 'json')) as null | { name?: string };
      if (cached && typeof cached.name === 'string') {
        persons.set(id, cached.name);
        return;
      }
      const doc = (await fetchJson(fetchFn, `${UNOFFICIAL_BASE}/persons/${id}.json`)) as null | {
        name?: string;
        id?: string;
      };
      const name = typeof doc?.name === 'string' ? doc.name : 'Unknown';
      persons.set(id, name);
      await kvPut(env, `wca:person:${id}`, { name, wca_id: id });
    }),
  );

  const records: EventRecord[] = events.map((event) => ({
    event,
    single: nrHolder(rankFiles.get(`single:${event}`) ?? [], persons),
    average: nrHolder(rankFiles.get(`average:${event}`) ?? [], persons),
  }));
  await kvPut(env, 'wca:records:BD', { asOfExportDate: today, records });

  // --- competitions: unofficial list + official v0 registration meta ---
  const compList = (await fetchJson(fetchFn, `${UNOFFICIAL_BASE}/competitions/${BD_ISO2}.json`)) as UnofficialCompList | null;
  const rawComps = compList && Array.isArray(compList.items) ? compList.items : [];
  const v0ById = new Map<string, Record<string, unknown>>();
  for (let page = 1; page <= 5; page++) {
    const rows = (await fetchJson(fetchFn, `${WCA_V0}/competitions?country_iso2=${BD_ISO2}&page=${page}`)) as
      | Record<string, unknown>[]
      | null;
    if (!Array.isArray(rows) || rows.length === 0) break;
    for (const r of rows) {
      if (typeof r?.id === 'string') v0ById.set(r.id, r);
    }
  }
  const summaries: CompSummary[] = [];
  for (const u of rawComps as UnofficialCompInput[]) {
    const id = typeof u.id === 'string' ? u.id : '';
    const v0 = (id ? v0ById.get(id) : undefined) as V0RowInput | undefined;
    const s = shapeCompSummary(u, v0 ?? null);
    if (s && u.isCanceled !== true) summaries.push(s);
  }
  summaries.sort((a, b) => (a.start_date < b.start_date ? 1 : -1));
  await kvPut(env, 'wca:competitions:BD', { asOfExportDate: today, items: summaries });

  // --- per-comp detail (unofficial + WCIF schedule shapes), champions ---
  const db = asDb(env.DB);
  const existingChamps = new Set(
    (
      (await db.prepare('SELECT comp_wca_id FROM comp_champion').all<{ comp_wca_id: string }>()).results ?? []
    ).map((r) => r.comp_wca_id),
  );
  let championFetches = 0;
  await Promise.all(
    summaries.map(async (s) => {
      // Unofficial detail is fetched to confirm the comp still exists upstream;
      // venue richness already lives in the list row. WCIF gives rounds/limits.
      await fetchJson(fetchFn, `${UNOFFICIAL_BASE}/competitions/${s.wca_id}.json`);
      const wcif = await fetchJson(fetchFn, `${WCA_V0}/competitions/${s.wca_id}/wcif/public`);
      const full: CompDetail = {
        ...s,
        schedule_note: null, // v1: schedule links out to WCA (WP-22 detail page)
        event_detail: shapeEventDetail(wcif),
      };
      await kvPut(env, `wca:competition:${s.wca_id}`, { ...full, asOfExportDate: today });

      // Champion derivation: ended comps, not yet recorded, capped per run.
      if (s.end_date && s.end_date < today && !existingChamps.has(s.wca_id) && championFetches < CHAMPION_FETCH_CAP) {
        championFetches++;
        const results = (await fetchJson(fetchFn, `${UNOFFICIAL_BASE}/results/${s.wca_id}/333.json`)) as null | {
          items?: Parameters<typeof deriveChampion>[0];
        };
        if (results && Array.isArray(results.items)) {
          const champ = deriveChampion(results.items);
          if (champ) {
            await db
              .prepare('INSERT INTO comp_champion (comp_wca_id, winner_wca_id, winning_value_centis, derived_at) VALUES (?, ?, ?, ?)')
              .bind(s.wca_id, champ.winner_wca_id, champ.winning_value_centis, today)
              .run();
            existingChamps.add(s.wca_id);
          }
        }
      }
    }),
  );

  // --- snapshots: append on change ---
  const latest = (await db
    .prepare(
      `SELECT event, kind, value_centis, holder_wca_id, holder_name FROM record_snapshot WHERE export_date = (SELECT MAX(export_date) FROM record_snapshot)`,
    )
    .all<{ event: string; kind: string; value_centis: number; holder_wca_id: string; holder_name: string }>()).results ?? [];
  const latestMap = new Map(latest.map((r) => [`${r.event}:${r.kind}`, r]));
  const current = records.flatMap((r) => [
    r.single ? { event: r.event, kind: 'single', value_centis: r.single.value_centis, holder_wca_id: r.single.wca_id, holder_name: r.single.holder } : null,
    r.average ? { event: r.event, kind: 'average', value_centis: r.average.value_centis, holder_wca_id: r.average.wca_id, holder_name: r.average.holder } : null,
  ].filter((x): x is NonNullable<typeof x> => x !== null));
  const toAppend = snapshotDiff(
    current,
    new Map([...latestMap].map(([k, v]) => [k, { event: v.event, kind: v.kind, value_centis: v.value_centis, holder_wca_id: v.holder_wca_id, holder_name: v.holder_name }])),
  );
  if (toAppend.length > 0) {
    await db.batch(
      toAppend.map((r) =>
        db
          .prepare('INSERT INTO record_snapshot (event, kind, value_centis, holder_wca_id, holder_name, comp_wca_id, export_date) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .bind(r.event, r.kind, r.value_centis, r.holder_wca_id, r.holder_name, '', today),
      ),
    );
  }
  console.log(`sync done: ${summaries.length} comps, ${records.length} record lines, ${toAppend.length} snapshots appended`);
}

async function runOutbox(env: SyncEnv): Promise<void> {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    console.log('outbox flush skipped: RESEND_API_KEY/EMAIL_FROM not set (WP-00)');
    return;
  }
  const db = asDb(env.DB);
  const send = resendSender(fetch, env.RESEND_API_KEY, env.EMAIL_FROM);
  const result = await flushOutbox(db, send);
  console.log(`outbox flush: ${result.sent} sent, ${result.failed} failed`);
}

export default {
  async scheduled(event: ScheduledEvent, env: SyncEnv, _ctx: ExecutionContext): Promise<void> {
    if (event.cron === SYNC_CRON) {
      await runSync(env);
    } else {
      await runOutbox(env);
    }
  },
};
