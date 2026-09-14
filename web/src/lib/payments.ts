// Payment verification logic (WP-14). Human decides; code enforces the workflow:
// pending-only decisions, fee-vs-WCA-acceptance split, audit + email enqueue.
// All writes for a decision go in ONE D1 batch (atomic).
import type { SpeedbdEnv } from './bindings';
import { HttpError } from './admin';

export type TxDecision = 'accepted' | 'rejected';

export interface TxQueueRow {
  id: string;
  comp_wca_id: string;
  competitor_name: string;
  wca_id: string | null;
  competitor_email: string | null;
  events_json: string;
  amount_bdt: number;
  sender_number: string;
  txn_id: string;
  tx_status: string;
  registration_id: string;
  reg_status: string;
  wca_accepted: number;
  decided_by: string | null;
  decided_at: string | null;
  note: string | null;
  created_at: string;
}

export async function listTxQueue(
  env: SpeedbdEnv,
  filter: { status?: string; comp?: string },
): Promise<TxQueueRow[]> {
  const where: string[] = [];
  const binds: (string | number)[] = [];
  if (filter.status && ['pending', 'accepted', 'rejected'].includes(filter.status)) {
    where.push('t.status = ?');
    binds.push(filter.status);
  }
  if (filter.comp) {
    where.push('r.comp_wca_id = ?');
    binds.push(filter.comp);
  }
  const sql = `SELECT t.id, r.comp_wca_id, c.name AS competitor_name, c.wca_id,
      c.email AS competitor_email, r.events_json, t.amount_bdt, t.sender_number,
      t.txn_id, t.status AS tx_status, r.id AS registration_id, r.status AS reg_status,
      r.wca_accepted, t.decided_by, t.decided_at, t.note, t.created_at
    FROM tx_submission t
    JOIN registration r ON r.id = t.registration_id
    JOIN competitor c ON c.id = r.competitor_id
    ${where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY t.created_at DESC LIMIT 200`;
  const res = await env.DB.prepare(sql)
    .bind(...binds)
    .all();
  return (res.results ?? []) as unknown as TxQueueRow[];
}

export async function getTx(env: SpeedbdEnv, id: string): Promise<TxQueueRow | null> {
  const res = await env.DB.prepare(
    `SELECT t.id, r.comp_wca_id, c.name AS competitor_name, c.wca_id,
      c.email AS competitor_email, r.events_json, t.amount_bdt, t.sender_number,
      t.txn_id, t.status AS tx_status, r.id AS registration_id, r.status AS reg_status,
      r.wca_accepted, t.decided_by, t.decided_at, t.note, t.created_at
    FROM tx_submission t
    JOIN registration r ON r.id = t.registration_id
    JOIN competitor c ON c.id = r.competitor_id
    WHERE t.id = ?`,
  )
    .bind(id)
    .first();
  return (res ?? null) as unknown as TxQueueRow | null;
}

export async function decideTx(
  env: SpeedbdEnv,
  actor: string,
  id: string,
  decision: TxDecision,
  note: string,
): Promise<{ registration_id: string; emailed: boolean }> {
  if (decision !== 'accepted' && decision !== 'rejected') {
    throw new HttpError(400, 'decision must be accepted|rejected');
  }
  const tx = (await env.DB.prepare(
    `SELECT t.*, r.status AS reg_status, r.id AS rid, r.comp_wca_id, c.email AS competitor_email
     FROM tx_submission t JOIN registration r ON r.id = t.registration_id
     JOIN competitor c ON c.id = r.competitor_id WHERE t.id = ?`,
  )
    .bind(id)
    .first()) as null | {
    status: string;
    rid: string;
    comp_wca_id: string;
    competitor_email: string | null;
  };
  if (!tx) throw new HttpError(404, `tx ${id} not found`);
  if (tx.status !== 'pending') throw new HttpError(409, `tx ${id} already decided (${tx.status})`);

  const regStatus = decision === 'accepted' ? 'verified' : 'pending';
  const stmts = [
    env.DB.prepare(
      "UPDATE tx_submission SET status = ?, decided_by = ?, decided_at = date('now'), note = ? WHERE id = ?",
    ).bind(decision, actor, note.slice(0, 500), id),
    env.DB.prepare('UPDATE registration SET status = ? WHERE id = ?').bind(regStatus, tx.rid),
    env.DB.prepare(
      "INSERT INTO audit_log (actor, action, entity, entity_id, at, meta_json) VALUES (?, ?, 'tx_submission', ?, date('now'), ?)",
    ).bind(actor, `tx-${decision}`, id, JSON.stringify({ registration_id: tx.rid, comp: tx.comp_wca_id })),
  ];
  let emailed = false;
  if (tx.competitor_email) {
    stmts.push(
      env.DB.prepare(
        "INSERT INTO email_outbox (to_addr, template, payload_json, status, attempts) VALUES (?, ?, ?, 'queued', 0)",
      ).bind(
        tx.competitor_email,
        decision === 'accepted' ? 'payment-verified' : 'payment-rejected',
        JSON.stringify({ tx_id: id, registration_id: tx.rid, comp: tx.comp_wca_id, note: note.slice(0, 500) }),
      ),
    );
    emailed = true;
  }
  await env.DB.batch(stmts);
  return { registration_id: tx.rid, emailed };
}

// Manual WCA-acceptance tick — set ONLY after acting on the WCA site.
// Never implied by fee verification (standing rule).
export async function setWcaAccepted(
  env: SpeedbdEnv,
  actor: string,
  registrationId: string,
  accepted: boolean,
): Promise<void> {
  const reg = (await env.DB.prepare('SELECT id FROM registration WHERE id = ?')
    .bind(registrationId)
    .first()) as null | { id: string };
  if (!reg) throw new HttpError(404, `registration ${registrationId} not found`);
  await env.DB.batch([
    env.DB.prepare("UPDATE registration SET wca_accepted = ?, wca_accepted_by = ?, wca_accepted_at = date('now') WHERE id = ?").bind(
      accepted ? 1 : 0,
      actor,
      registrationId,
    ),
    env.DB.prepare(
      "INSERT INTO audit_log (actor, action, entity, entity_id, at, meta_json) VALUES (?, ?, 'registration', ?, date('now'), ?)",
    ).bind(actor, accepted ? 'wca-accepted' : 'wca-unaccepted', registrationId, '{}'),
  ]);
}
