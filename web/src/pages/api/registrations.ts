import { getEnv } from '../../lib/bindings';
import { HttpError, toError, writeAudit } from '../../lib/admin';
import { requireUser } from '../../lib/session';
import { getCompetition, getCompetitions } from '../../lib/wca';

export const prerender = false;

function rid(): string {
  return `reg-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
}

// POST /api/registrations { comp_wca_id, events[] } — session required.
// Creates a pending registration, or updates events while still pending.
// Verified registrations are immutable here (delegate changes them on WCA first).
export async function POST({ request, locals }: { request: Request; locals: App.Locals }): Promise<Response> {
  try {
    const session = await requireUser(request, locals);
    const env = getEnv(locals);
    const body = (await request.json()) as { comp_wca_id?: string; events?: string[] };
    const compId = typeof body.comp_wca_id === 'string' ? body.comp_wca_id : '';
    const events = Array.isArray(body.events) ? body.events.filter((e): e is string => typeof e === 'string') : [];
    if (!compId) throw new HttpError(400, 'comp_wca_id is required');
    if (events.length === 0) throw new HttpError(400, 'select at least one event');
    const comp = await getCompetition(env, compId);
    // Fall back to the list row when the detail key hasn't cached yet —
    // it carries the same event list. Unknown in both → 404.
    let eventsOffered = comp.data?.events ?? [];
    if (eventsOffered.length === 0) {
      const list = await getCompetitions(env);
      eventsOffered = list.data?.items.find((c) => c.wca_id === compId)?.events ?? [];
    }
    if (!comp.data && eventsOffered.length === 0) throw new HttpError(404, 'competition not found');
    const allowed = new Set(eventsOffered);
    for (const e of events) {
      if (!allowed.has(e)) throw new HttpError(400, `event not offered: ${e}`);
    }
    const existing = (await env.DB.prepare('SELECT id, status FROM registration WHERE competitor_id=? AND comp_wca_id=?')
      .bind(session.cid, compId)
      .first()) as null | { id: string; status: string };
    if (existing && existing.status === 'verified') {
      throw new HttpError(409, 'already verified — ask a delegate to change events');
    }
    if (existing) {
      await env.DB.prepare('UPDATE registration SET events_json=? WHERE id=?')
        .bind(JSON.stringify([...new Set(events)]), existing.id)
        .run();
      await writeAudit(env, session.cid, 'reg-update', 'registration', existing.id);
      return Response.json({ ok: true, id: existing.id, status: 'pending' });
    }
    const id = rid();
    await env.DB.prepare(
      "INSERT INTO registration (id, competitor_id, comp_wca_id, events_json, status, wca_accepted, created_at) VALUES (?, ?, ?, ?, 'pending', 0, date('now'))",
    )
      .bind(id, session.cid, compId, JSON.stringify([...new Set(events)]))
      .run();
    await writeAudit(env, session.cid, 'reg-create', 'registration', id);
    return Response.json({ ok: true, id, status: 'pending' });
  } catch (err) {
    return toError(err);
  }
}
