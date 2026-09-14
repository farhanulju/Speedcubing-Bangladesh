// Operational inbox logic (WP-15): lost-found + contact status workflows.
// Content itself is managed via the registry CRUD (WP-13); these endpoints
// move tickets through states with audit rows.
import type { SpeedbdEnv } from './bindings';
import { HttpError, writeAudit } from './admin';

export const LOST_FOUND_STATUSES = ['open', 'in_progress', 'resolved', 'returned'] as const;
export const CONTACT_STATUSES = ['open', 'in_progress', 'closed'] as const;

export async function listLostFound(env: SpeedbdEnv, status?: string): Promise<Record<string, unknown>[]> {
  const where = status && (LOST_FOUND_STATUSES as readonly string[]).includes(status) ? 'WHERE status = ?' : '';
  const binds = where ? [status as string] : [];
  const res = await env.DB.prepare(`SELECT * FROM lost_found ${where} ORDER BY created_at DESC LIMIT 200`)
    .bind(...binds)
    .all();
  return (res.results ?? []) as Record<string, unknown>[];
}

export async function setLostFoundStatus(
  env: SpeedbdEnv,
  actor: string,
  id: string,
  status: string,
): Promise<void> {
  if (!(LOST_FOUND_STATUSES as readonly string[]).includes(status)) {
    throw new HttpError(400, `status must be one of ${LOST_FOUND_STATUSES.join('|')}`);
  }
  const row = (await env.DB.prepare('SELECT id FROM lost_found WHERE id = ?').bind(id).first()) as null | {
    id: string;
  };
  if (!row) throw new HttpError(404, `lost-found ${id} not found`);
  await env.DB.batch([
    env.DB.prepare('UPDATE lost_found SET status = ? WHERE id = ?').bind(status, id),
    env.DB.prepare(
      "INSERT INTO audit_log (actor, action, entity, entity_id, at, meta_json) VALUES (?, ?, 'lost_found', ?, date('now'), ?)",
    ).bind(actor, `lostfound-${status}`, id, '{}'),
  ]);
}

export async function listContact(env: SpeedbdEnv, status?: string): Promise<Record<string, unknown>[]> {
  const where = status && (CONTACT_STATUSES as readonly string[]).includes(status) ? 'WHERE status = ?' : '';
  const binds = where ? [status as string] : [];
  const res = await env.DB.prepare(`SELECT id, name, email, wca_id, category, body, status, at FROM contact_message ${where} ORDER BY at DESC LIMIT 200`)
    .bind(...binds)
    .all();
  return (res.results ?? []) as Record<string, unknown>[];
}

export async function setContactStatus(
  env: SpeedbdEnv,
  actor: string,
  id: string,
  status: string,
): Promise<void> {
  if (!(CONTACT_STATUSES as readonly string[]).includes(status)) {
    throw new HttpError(400, `status must be one of ${CONTACT_STATUSES.join('|')}`);
  }
  const row = (await env.DB.prepare('SELECT id FROM contact_message WHERE id = ?').bind(id).first()) as null | {
    id: string;
  };
  if (!row) throw new HttpError(404, `contact ${id} not found`);
  await env.DB.prepare('UPDATE contact_message SET status = ? WHERE id = ?').bind(status, id).run();
  await writeAudit(env, actor, `contact-${status}`, 'contact_message', id);
}
