// Shared registration reads (WP-32): user endpoint + dashboard page.
// One definition — both surfaces render the same states.
import type { SpeedbdEnv } from './bindings';
import { getCompetition, getCompetitions } from './wca';

export interface RegWithTx {
  id: string;
  comp_wca_id: string;
  comp_name: string;
  events_json: string;
  status: string;
  wca_accepted: number;
  created_at: string;
  latest_tx: { status: string; amount_bdt: number; txn_id: string; decided_at: string | null } | null;
}

export async function getMyRegistrations(env: SpeedbdEnv, cid: string): Promise<RegWithTx[]> {
  const regs = (
    await env.DB.prepare(
      'SELECT id, comp_wca_id, events_json, status, wca_accepted, created_at FROM registration WHERE competitor_id=? ORDER BY created_at DESC LIMIT 50',
    )
      .bind(cid)
      .all<Omit<RegWithTx, 'comp_name' | 'latest_tx'>>()
  ).results;
  const txs = (
    await env.DB.prepare(
      `SELECT registration_id, status, amount_bdt, txn_id, decided_at FROM tx_submission
       WHERE registration_id IN (SELECT id FROM registration WHERE competitor_id=?) ORDER BY created_at DESC`,
    )
      .bind(cid)
      .all<{ registration_id: string; status: string; amount_bdt: number; txn_id: string; decided_at: string | null }>()
  ).results;
  const latest = new Map<string, (typeof txs)[number]>();
  for (const t of txs) {
    if (!latest.has(t.registration_id)) latest.set(t.registration_id, t);
  }
  const names = new Map<string, string>();
  // Detail keys may lag new comps — fall back to the list row (same pattern
  // as POST /api/registrations). Unknown in both → raw WCA ID.
  let listCache: { wca_id: string; name: string }[] | null = null;
  for (const r of regs) {
    if (names.has(r.comp_wca_id)) continue;
    const detail = await getCompetition(env, r.comp_wca_id);
    if (detail.data) {
      names.set(r.comp_wca_id, detail.data.name);
      continue;
    }
    if (!listCache) {
      const list = await getCompetitions(env);
      listCache = list.data?.items ?? [];
    }
    names.set(r.comp_wca_id, listCache.find((c) => c.wca_id === r.comp_wca_id)?.name ?? r.comp_wca_id);
  }
  return regs.map((r) => ({ ...r, comp_name: names.get(r.comp_wca_id) ?? r.comp_wca_id, latest_tx: latest.get(r.id) ?? null }));
}

export async function getCompetitor(env: SpeedbdEnv, cid: string) {
  return (await env.DB.prepare('SELECT id, wca_id, name, email FROM competitor WHERE id=?').bind(cid).first()) as null | {
    id: string;
    wca_id: string | null;
    name: string;
    email: string | null;
  };
}

export async function getConsent(env: SpeedbdEnv, cid: string) {
  return (await env.DB.prepare('SELECT guardian_name, relation, consent_at, verified_by FROM guardian_consent WHERE competitor_id=?')
    .bind(cid)
    .first()) as null | { guardian_name: string; relation: string; consent_at: string; verified_by: string | null };
}
