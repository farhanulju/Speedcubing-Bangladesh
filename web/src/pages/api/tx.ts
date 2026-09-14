import { getEnv } from '../../lib/bindings';
import { HttpError, toError, writeAudit } from '../../lib/admin';
import { requireUser } from '../../lib/session';

export const prerender = false;

const TXN_RE = /^[A-Z0-9]{6,20}$/;

function rid(): string {
  return `tx-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
}

// POST /api/tx { registration_id, sender_number, txn_id, amount_bdt } — session required.
// Ownership + pending-state + duplicate-TxID guards. Human verifies later.
export async function POST({ request, locals }: { request: Request; locals: App.Locals }): Promise<Response> {
  try {
    const session = await requireUser(request, locals);
    const env = getEnv(locals);
    const body = (await request.json()) as Record<string, unknown>;
    const regId = typeof body.registration_id === 'string' ? body.registration_id : '';
    const sender = String(body.sender_number ?? '').trim().slice(0, 32);
    const txn = String(body.txn_id ?? '').trim().toUpperCase().slice(0, 20);
    const amount = Number(body.amount_bdt);
    if (!regId) throw new HttpError(400, 'registration_id is required');
    if (!sender) throw new HttpError(400, 'sender number is required');
    if (!TXN_RE.test(txn)) throw new HttpError(400, 'transaction ID looks invalid (6–20 letters/digits)');
    if (!Number.isInteger(amount) || amount <= 0) throw new HttpError(400, 'amount must be whole taka');
    const reg = (await env.DB.prepare('SELECT id, status FROM registration WHERE id=? AND competitor_id=?')
      .bind(regId, session.cid)
      .first()) as null | { id: string; status: string };
    if (!reg) throw new HttpError(404, 'registration not found');
    if (reg.status === 'verified') throw new HttpError(409, 'fee already verified for this registration');
    const dup = (await env.DB.prepare('SELECT id FROM tx_submission WHERE txn_id=? AND registration_id != ?')
      .bind(txn, regId)
      .first()) as null | { id: string };
    if (dup) throw new HttpError(409, 'this transaction ID was already submitted elsewhere');
    const id = rid();
    await env.DB.prepare(
      "INSERT INTO tx_submission (id, registration_id, sender_number, txn_id, amount_bdt, status, created_at) VALUES (?, ?, ?, ?, ?, 'pending', date('now'))",
    )
      .bind(id, regId, sender, txn, amount)
      .run();
    await writeAudit(env, session.cid, 'tx-submit', 'tx_submission', id);
    return Response.json({ ok: true, id });
  } catch (err) {
    return toError(err);
  }
}
