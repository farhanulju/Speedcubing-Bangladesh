// Admin CRUD framework (WP-13): table registry + D1 helpers + audit.
// Single definition per concept — UI pages and API routes both read this.
// Auth lives in requireAdmin(): dev-bypass locally, Cloudflare Access in prod (WP-16).
import type { SpeedbdEnv } from './bindings';

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'editor'
  | 'select'
  | 'number'
  | 'checkbox'
  | 'readonly';

export interface FieldDef {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  options?: string[];
  hint?: string;
}

export interface TableDef {
  table: string;
  label: string;
  pk: string;
  singleton?: boolean;
  listColumns: string[];
  fields: FieldDef[];
}

export const STATUS_OPTIONS = ['draft', 'published'];

const statusField = (required = false): FieldDef => ({
  name: 'status',
  label: 'Status',
  kind: 'select',
  options: STATUS_OPTIONS,
  required,
});

export const ADMIN_TABLES: Record<string, TableDef> = {
  announcement: {
    table: 'announcement',
    label: 'Announcements',
    pk: 'slug',
    listColumns: ['slug', 'title', 'pinned', 'status'],
    fields: [
      { name: 'slug', label: 'Slug', kind: 'text', required: true, hint: 'URL-safe, e.g. dso26-reg-open' },
      { name: 'title', label: 'Title', kind: 'text', required: true },
      { name: 'date', label: 'Date (YYYY-MM-DD)', kind: 'text', required: true },
      { name: 'comp_wca_id', label: 'Competition WCA ID (optional)' , kind: 'text' },
      { name: 'body_json', label: 'Body', kind: 'editor', required: true },
      { name: 'pinned', label: 'Pinned', kind: 'checkbox' },
      statusField(),
    ],
  },
  page: {
    table: 'page',
    label: 'Pages',
    pk: 'slug',
    listColumns: ['slug', 'title', 'status'],
    fields: [
      { name: 'slug', label: 'Slug', kind: 'text', required: true },
      { name: 'title', label: 'Title', kind: 'text', required: true },
      { name: 'body_json', label: 'Body', kind: 'editor', required: true },
      statusField(),
    ],
  },
  person: {
    table: 'person',
    label: 'People',
    pk: 'id',
    listColumns: ['id', 'name', 'role', 'status'],
    fields: [
      { name: 'id', label: 'ID', kind: 'text', required: true },
      { name: 'name', label: 'Name', kind: 'text', required: true },
      { name: 'photo_r2', label: 'Photo R2 key', kind: 'text', hint: 'Requires photo_consent=1 for minors' },
      { name: 'photo_consent', label: 'Photo consent on file', kind: 'checkbox' },
      { name: 'role', label: 'Role', kind: 'text', required: true },
      { name: 'wca_id', label: 'WCA ID', kind: 'text' },
      { name: 'focus_area', label: 'Focus area', kind: 'text' },
      { name: 'member_since', label: 'Member since (YYYY-MM)', kind: 'text' },
      { name: 'links_json', label: 'Links (JSON)', kind: 'textarea' },
      statusField(),
    ],
  },
  sponsor: {
    table: 'sponsor',
    label: 'Sponsors',
    pk: 'id',
    listColumns: ['id', 'name', 'tier', 'status'],
    fields: [
      { name: 'id', label: 'ID', kind: 'text', required: true },
      { name: 'name', label: 'Name', kind: 'text', required: true },
      { name: 'logo_r2', label: 'Logo R2 key', kind: 'text' },
      { name: 'tier', label: 'Tier', kind: 'select', options: ['gold', 'silver', 'bronze', 'community'] },
      { name: 'url', label: 'URL', kind: 'text' },
      { name: 'sort_order', label: 'Sort order', kind: 'number' },
      statusField(),
    ],
  },
  faq: {
    table: 'faq',
    label: 'FAQ',
    pk: 'id',
    listColumns: ['id', 'q', 'status'],
    fields: [
      { name: 'id', label: 'ID', kind: 'text', required: true },
      { name: 'q', label: 'Question', kind: 'text', required: true },
      { name: 'a_json', label: 'Answer', kind: 'editor', required: true },
      { name: 'sort_order', label: 'Sort order', kind: 'number' },
      statusField(),
    ],
  },
  news: {
    table: 'news',
    label: 'News',
    pk: 'slug',
    listColumns: ['slug', 'title', 'published_at', 'status'],
    fields: [
      { name: 'slug', label: 'Slug', kind: 'text', required: true },
      { name: 'title', label: 'Title', kind: 'text', required: true },
      { name: 'published_at', label: 'Published at (YYYY-MM-DD)', kind: 'text' },
      { name: 'body_json', label: 'Body', kind: 'editor', required: true },
      { name: 'cover_r2', label: 'Cover R2 key', kind: 'text' },
      statusField(),
    ],
  },
  comp_override: {
    table: 'comp_override',
    label: 'Competition overrides',
    pk: 'wca_id',
    listColumns: ['wca_id', 'updated_at'],
    fields: [
      { name: 'wca_id', label: 'WCA competition ID', kind: 'text', required: true },
      { name: 'payment_steps_json', label: 'Payment steps', kind: 'editor' },
      { name: 'venue_note', label: 'Venue note', kind: 'textarea' },
      { name: 'fee_tiers_json', label: 'Fee tiers (JSON)', kind: 'textarea', hint: '{"early":800,"regular":1000}' },
    ],
  },
  donation_page: {
    table: 'donation_page',
    label: 'Worlds donation page',
    pk: 'id',
    singleton: true,
    listColumns: ['id', 'target_bdt', 'raised_manual_bdt'],
    fields: [
      { name: 'id', label: 'ID', kind: 'readonly' },
      { name: 'target_bdt', label: 'Target (BDT, whole taka)', kind: 'number', required: true },
      { name: 'raised_manual_bdt', label: 'Raised manual total (BDT)', kind: 'number', required: true },
      { name: 'bkash_wallet', label: 'bKash receiving wallet', kind: 'text', hint: 'Public page shows masked + Reveal (payment destination)' },
      { name: 'nagad_wallet', label: 'Nagad receiving wallet', kind: 'text' },
      { name: 'policy_json', label: 'Refund policy', kind: 'editor' },
      { name: 'worlds_host_city', label: 'Host city (single value)', kind: 'text', required: true },
    ],
  },
  donor: {
    table: 'donor',
    label: 'Donors (opt-in only)',
    pk: 'id',
    listColumns: ['id', 'name', 'amount_bdt', 'consent'],
    fields: [
      { name: 'id', label: 'ID', kind: 'text', required: true },
      { name: 'name', label: 'Name (or Anonymous)', kind: 'text', required: true },
      { name: 'amount_bdt', label: 'Amount (BDT, empty = hidden)', kind: 'number' },
      { name: 'consent', label: 'Public display consent', kind: 'checkbox', required: true },
      { name: 'sort_order', label: 'Sort order', kind: 'number' },
    ],
  },
};

export function getTable(name: string): TableDef | undefined {
  return ADMIN_TABLES[name];
}

export interface AdminActor {
  actor: string;
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function toError(err: unknown): Response {
  if (err instanceof HttpError) return Response.json({ error: err.message }, { status: err.status });
  return Response.json({ error: 'internal' }, { status: 500 });
}

import { verifyAccessJwt } from './access';

// Fail-closed auth. Local dev: ADMIN_DEV_BYPASS=1 in .dev.vars (gitignored).
// Production: Cloudflare Access JWT (RS256 JWKS verify). No bypass var there,
// so the dev seam below is inert in production.
export async function requireAdmin(
  request: Request,
  env: SpeedbdEnv & { ADMIN_DEV_BYPASS?: string; ACCESS_TEAM_DOMAIN?: string; ACCESS_AUD?: string },
): Promise<AdminActor> {
  if (env.ADMIN_DEV_BYPASS === '1') return { actor: 'dev-local' };
  const asserted = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!asserted) throw new HttpError(401, 'admin login required (Cloudflare Access)');
  const teamDomain = env.ACCESS_TEAM_DOMAIN ?? '';
  const aud = env.ACCESS_AUD ?? '';
  if (!teamDomain || !aud) throw new HttpError(503, 'admin auth not configured (WP-00: Access app + AUD)');
  const identity = await verifyAccessJwt(asserted, { teamDomain, aud }, (url) => fetch(url));
  if (!identity || (!identity.email && !identity.sub)) throw new HttpError(403, 'admin token rejected');
  return { actor: identity.email ?? identity.sub ?? 'access-user' };
}

function coerce(def: FieldDef, raw: unknown): string | number | null {
  if (def.kind === 'checkbox') {
    const on = raw === true || raw === '1' || raw === 1;
    if (def.required && !on) throw new HttpError(400, `${def.name} must be checked`);
    return on ? 1 : 0;
  }
  if (def.kind === 'number') {
    if (raw === '' || raw === null || raw === undefined) return null;
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0) throw new HttpError(400, `${def.name} must be a whole non-negative integer`);
    return n;
  }
  if (def.kind === 'editor') {
    if (raw === '' || raw === null || raw === undefined) {
      if (def.required) throw new HttpError(400, `${def.name} must be an Editor.js document`);
      return '{"blocks":[]}';
    }
    const doc = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!doc || !Array.isArray((doc as { blocks?: unknown }).blocks)) {
      throw new HttpError(400, `${def.name} must be an Editor.js document`);
    }
    return JSON.stringify(doc);
  }
  if (raw === null || raw === undefined) return null;
  return String(raw);
}

export function pickFields(def: TableDef, input: Record<string, unknown>): Record<string, string | number | null> {
  const out: Record<string, string | number | null> = {};
  for (const f of def.fields) {
    if (f.kind === 'readonly') continue;
    const v = coerce(f, input[f.name]);
    if ((v === null || v === '') && f.required) throw new HttpError(400, `${f.name} is required`);
    // Empty numbers are omitted so NOT NULL DEFAULT columns (sort orders) fall
    // back to their DB defaults instead of violating constraints. Nullable
    // number columns (e.g. donor amounts) default to NULL the same way.
    if (v === null && f.kind === 'number') continue;
    out[f.name] = v;
  }
  out['updated_by'] = String(input['_actor'] ?? 'admin');
  out['updated_at'] = new Date().toISOString().slice(0, 10);
  return out;
}

export async function listRows(env: SpeedbdEnv, def: TableDef): Promise<Record<string, unknown>[]> {
  const res = await env.DB.prepare(`SELECT * FROM ${def.table} ORDER BY rowid DESC LIMIT 200`).all();
  return (res.results ?? []) as Record<string, unknown>[];
}

export async function getRow(env: SpeedbdEnv, def: TableDef, id: string): Promise<Record<string, unknown> | null> {
  const res = await env.DB.prepare(`SELECT * FROM ${def.table} WHERE ${def.pk} = ?`).bind(id).first();
  return (res ?? null) as Record<string, unknown> | null;
}

export async function upsertRow(
  env: SpeedbdEnv,
  def: TableDef,
  actor: string,
  input: Record<string, unknown>,
): Promise<string> {
  const id = def.singleton ? '1' : String(input[def.pk] ?? '');
  if (!id) throw new HttpError(400, `${def.pk} is required`);
  const fields = pickFields(def, { ...input, [def.pk]: id, _actor: actor });
  const cols = Object.keys(fields);
  const placeholders = cols.map(() => '?').join(',');
  const updates = cols
    .filter((c) => c !== def.pk)
    .map((c) => `${c} = excluded.${c}`)
    .join(',');
  await env.DB.prepare(
    `INSERT INTO ${def.table} (${cols.join(',')}) VALUES (${placeholders}) ON CONFLICT(${def.pk}) DO UPDATE SET ${updates}`,
  )
    .bind(...cols.map((c) => fields[c]))
    .run();
  await writeAudit(env, actor, 'upsert', def.table, id);
  return id;
}

export async function deleteRow(env: SpeedbdEnv, def: TableDef, actor: string, id: string): Promise<void> {
  if (def.singleton) throw new HttpError(400, `${def.table} is a singleton and cannot be deleted`);
  const existing = await getRow(env, def, id);
  if (!existing) throw new HttpError(404, `${def.table}/${id} not found`);
  await env.DB.prepare(`DELETE FROM ${def.table} WHERE ${def.pk} = ?`).bind(id).run();
  await writeAudit(env, actor, 'delete', def.table, id);
}

export async function writeAudit(
  env: SpeedbdEnv,
  actor: string,
  action: string,
  entity: string,
  entity_id: string,
): Promise<void> {
  await env.DB.prepare(
    "INSERT INTO audit_log (actor, action, entity, entity_id, at, meta_json) VALUES (?, ?, ?, ?, date('now'), '{}')",
  )
    .bind(actor, action, entity, entity_id)
    .run();
}
