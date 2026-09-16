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
  | 'readonly'
  | 'generated'
  | 'date'
  | 'month'
  | 'upload'
  | 'pairs'
  | 'wca-competition';

export interface FieldDef {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  options?: string[];
  optionsFrom?: string;
  autoFrom?: string;
  pairValueKind?: 'text' | 'number' | 'url';
  pairKeyLabel?: string;
  pairValueLabel?: string;
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
      { name: 'slug', label: 'Page link', kind: 'text', required: true, autoFrom: 'title', hint: 'Suggested from the title; you can edit it.' },
      { name: 'title', label: 'Title', kind: 'text', required: true },
      { name: 'date', label: 'Date', kind: 'date', required: true },
      { name: 'comp_wca_id', label: 'Competition (optional)' , kind: 'wca-competition' },
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
      { name: 'slug', label: 'Page link', kind: 'text', required: true, autoFrom: 'title', hint: 'Suggested from the title; you can edit it.' },
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
      { name: 'id', label: 'ID', kind: 'generated', autoFrom: 'name' },
      { name: 'name', label: 'Name', kind: 'text', required: true },
      { name: 'photo_r2', label: 'Photo', kind: 'upload', hint: 'JPG, PNG, WebP or AVIF; max 8 MB. A minor’s photo only displays when consent is recorded.' },
      { name: 'photo_consent', label: 'Photo consent on file', kind: 'checkbox' },
      { name: 'role', label: 'Role', kind: 'select', required: true, optionsFrom: 'person_role', hint: 'Manage choices in Roles.' },
      { name: 'wca_id', label: 'WCA ID', kind: 'text' },
      { name: 'focus_area', label: 'Focus area', kind: 'text' },
      { name: 'member_since', label: 'Member since', kind: 'month' },
      { name: 'links_json', label: 'Public links', kind: 'pairs', pairValueKind: 'url', pairKeyLabel: 'Link name', pairValueLabel: 'URL' },
      statusField(),
    ],
  },
  sponsor: {
    table: 'sponsor',
    label: 'Sponsors',
    pk: 'id',
    listColumns: ['id', 'name', 'tier', 'status'],
    fields: [
      { name: 'id', label: 'ID', kind: 'generated', autoFrom: 'name' },
      { name: 'name', label: 'Name', kind: 'text', required: true },
      { name: 'logo_r2', label: 'Logo', kind: 'upload', hint: 'JPG, PNG, WebP or AVIF; max 8 MB.' },
      { name: 'tier', label: 'Sponsor tier', kind: 'select', optionsFrom: 'sponsor_tier', hint: 'Manage choices in Sponsor tiers.' },
      { name: 'url', label: 'Website', kind: 'text', hint: 'Include https://.' },
      { name: 'sort_order', label: 'Display position', kind: 'number', hint: 'Lower numbers appear first. Leave blank to use the default.' },
      statusField(),
    ],
  },
  faq: {
    table: 'faq',
    label: 'FAQ',
    pk: 'id',
    listColumns: ['id', 'q', 'status'],
    fields: [
      { name: 'id', label: 'ID', kind: 'generated', autoFrom: 'q' },
      { name: 'q', label: 'Question', kind: 'text', required: true },
      { name: 'a_json', label: 'Answer', kind: 'editor', required: true },
      { name: 'sort_order', label: 'Display position', kind: 'number', hint: 'Lower numbers appear first. Leave blank to use the default.' },
      statusField(),
    ],
  },
  news: {
    table: 'news',
    label: 'News',
    pk: 'slug',
    listColumns: ['slug', 'title', 'published_at', 'status'],
    fields: [
      { name: 'slug', label: 'Page link', kind: 'text', required: true, autoFrom: 'title', hint: 'Suggested from the title; you can edit it.' },
      { name: 'title', label: 'Title', kind: 'text', required: true },
      { name: 'published_at', label: 'Publish date', kind: 'date' },
      { name: 'body_json', label: 'Body', kind: 'editor', required: true },
      { name: 'cover_r2', label: 'Cover image', kind: 'upload', hint: 'JPG, PNG, WebP or AVIF; max 8 MB. Confirm everyone pictured may be published.' },
      statusField(),
    ],
  },
  comp_override: {
    table: 'comp_override',
    label: 'Competition overrides',
    pk: 'wca_id',
    listColumns: ['wca_id', 'updated_at'],
    fields: [
      { name: 'wca_id', label: 'Competition', kind: 'wca-competition', required: true },
      { name: 'payment_steps_json', label: 'Payment steps', kind: 'editor' },
      { name: 'venue_note', label: 'Venue note', kind: 'textarea' },
      { name: 'fee_tiers_json', label: 'Registration fee options', kind: 'pairs', pairValueKind: 'number', pairKeyLabel: 'Fee option', pairValueLabel: 'Amount (BDT)', hint: 'Enter each fee as a whole-taka amount.' },
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
      { name: 'id', label: 'ID', kind: 'generated', autoFrom: 'name' },
      { name: 'name', label: 'Name', kind: 'text', hint: 'Optional when the anonymous option is selected.' },
      { name: 'is_anonymous', label: 'Show as Anonymous', kind: 'checkbox' },
      { name: 'amount_bdt', label: 'Amount (BDT, empty = hidden)', kind: 'number' },
      { name: 'consent', label: 'Public display consent', kind: 'checkbox', required: true },
      { name: 'sort_order', label: 'Display position', kind: 'number', hint: 'Lower numbers appear first. Leave blank to use the default.' },
    ],
  },
  person_role: {
    table: 'person_role', label: 'Roles', pk: 'id', listColumns: ['label'],
    fields: [
      { name: 'id', label: 'ID', kind: 'generated', autoFrom: 'label' },
      { name: 'label', label: 'Role name', kind: 'text', required: true },
    ],
  },
  sponsor_tier: {
    table: 'sponsor_tier', label: 'Sponsor tiers', pk: 'id', listColumns: ['label', 'sort_order'],
    fields: [
      { name: 'id', label: 'ID', kind: 'generated', autoFrom: 'label' },
      { name: 'label', label: 'Tier name', kind: 'text', required: true },
      { name: 'sort_order', label: 'Display position', kind: 'number', hint: 'Lower numbers appear first.' },
    ],
  },
};

export function getTable(name: string): TableDef | undefined {
  return ADMIN_TABLES[name];
}

export interface AdminActor {
  actor: string;
}

// Display-only identity for the admin shell (who-am-I badge). NOT auth:
// APIs still verify the Access JWT; pages are gated at the edge by Access.
// The edge passes the verified email in Cf-Access-Authenticated-User-Email,
// so no crypto runs here. Locally the dev bypass stands in.
export function adminDisplayActor(
  request: Request,
  env: SpeedbdEnv & { ADMIN_DEV_BYPASS?: string },
): string | null {
  if (env.ADMIN_DEV_BYPASS === '1') return 'dev-local · bypass on';
  const email = request.headers.get('Cf-Access-Authenticated-User-Email');
  return email && email.includes('@') ? email : null;
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
  if (def.kind === 'pairs') {
    if (raw === '' || raw === null || raw === undefined) return '{}';
    let parsed: unknown;
    try { parsed = typeof raw === 'string' ? JSON.parse(raw) : raw; }
    catch { throw new HttpError(400, `${def.name} contains invalid entries`); }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new HttpError(400, `${def.name} must contain key/value entries`);
    const entries = Object.entries(parsed as Record<string, unknown>);
    if (entries.length > 30) throw new HttpError(400, `${def.name} can contain at most 30 entries`);
    const normalized: Record<string, string | number> = {};
    for (const [rawKey, value] of entries) {
      const key = rawKey.trim().slice(0, 80);
      if (!key) continue;
      if (def.pairValueKind === 'number') {
        const n = Number(value);
        if (!Number.isInteger(n) || n < 0) throw new HttpError(400, `${key} must be a whole non-negative amount`);
        normalized[key] = n;
      } else {
        const text = String(value ?? '').trim().slice(0, 500);
        if (!text) continue;
        if (def.pairValueKind === 'url' && !/^https?:\/\//i.test(text)) throw new HttpError(400, `${key} must use an http:// or https:// link`);
        normalized[key] = text;
      }
    }
    return JSON.stringify(normalized);
  }
  if (raw === null || raw === undefined) return null;
  return String(raw);
}

export function pickFields(def: TableDef, input: Record<string, unknown>): Record<string, string | number | null> {
  const out: Record<string, string | number | null> = {};
  for (const f of def.fields) {
    if (f.kind === 'readonly' || f.kind === 'generated' && f.name !== def.pk) continue;
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
  const ordering = def.table === 'sponsor_tier' ? 'sort_order ASC, label COLLATE NOCASE ASC' : 'rowid DESC';
  const res = await env.DB.prepare(`SELECT * FROM ${def.table} ORDER BY ${ordering} LIMIT 200`).all();
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
  const pkField = def.fields.find((field) => field.name === def.pk);
  const rawId = String(input[def.pk] ?? '').trim();
  const autoSource = pkField?.autoFrom ? String(input[pkField.autoFrom] ?? '').trim() : '';
  const baseId = (rawId || autoSource)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  const id = def.singleton ? '1' : rawId || (baseId ? `${baseId}-${crypto.randomUUID().slice(0, 6)}` : `${def.table}-${crypto.randomUUID().slice(0, 10)}`);
  if (!id) throw new HttpError(400, `${def.pk} is required`);
  const prepared = { ...input, [def.pk]: id, _actor: actor };
  if (def.table === 'donor') {
    const anonymous = prepared.is_anonymous === true || prepared.is_anonymous === '1' || prepared.is_anonymous === 1;
    const donorName = String(prepared.name ?? '').trim();
    if (!anonymous && !donorName) throw new HttpError(400, 'Enter a donor name or select “Show as Anonymous”.');
    if (anonymous) prepared.name = 'Anonymous';
  }
  const fields = pickFields(def, prepared);
  for (const field of def.fields) {
    if (!field.optionsFrom) continue;
    const value = fields[field.name];
    if (value === null || value === '') continue;
    const option = await env.DB.prepare(`SELECT label FROM ${field.optionsFrom} WHERE label = ?`).bind(String(value)).first();
    if (!option) throw new HttpError(400, `Choose an available ${field.label.toLowerCase()}.`);
  }
  if (def.table === 'person_role' || def.table === 'sponsor_tier') {
    const duplicate = await env.DB.prepare(
      `SELECT id FROM ${def.table} WHERE lower(label)=lower(?) AND id<>? LIMIT 1`,
    ).bind(String(fields.label ?? ''), id).first();
    if (duplicate) throw new HttpError(409, 'That choice already exists. Use the existing entry or choose another name.');
  }
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

export interface AdminOverview {
  pendingTx: number;
  openLostFound: number;
  openContact: number;
  publishedCounts: { label: string; n: number }[];
  recentActivity: { actor: string; action: string; entity: string; entity_id: string; at: string }[];
}

// Ops-hub numbers for /admin (WP-16 activity feed + stat cards). Every figure
// is derived from our own D1 — no WCA-side counts, no sync fiction.
export async function getAdminOverview(env: SpeedbdEnv): Promise<AdminOverview> {
  const count = async (sql: string): Promise<number> => {
    const row = (await env.DB.prepare(sql).first()) as null | { n: number };
    return row?.n ?? 0;
  };
  const publishedCounts: AdminOverview['publishedCounts'] = [];
  for (const [table, label] of [
    ['announcement', 'Announcements'],
    ['page', 'Pages'],
    ['person', 'People'],
    ['sponsor', 'Sponsors'],
    ['faq', 'FAQ'],
    ['news', 'News'],
  ] as const) {
    publishedCounts.push({ label, n: await count(`SELECT COUNT(*) AS n FROM ${table} WHERE status='published'`) });
  }
  const recentActivity = (
    await env.DB.prepare(
      'SELECT actor, action, entity, entity_id, at FROM audit_log ORDER BY rowid DESC LIMIT 10',
    ).all<AdminOverview['recentActivity'][number]>()
  ).results;
  return {
    pendingTx: await count("SELECT COUNT(*) AS n FROM tx_submission WHERE status='pending'"),
    openLostFound: await count("SELECT COUNT(*) AS n FROM lost_found WHERE status='open'"),
    openContact: await count("SELECT COUNT(*) AS n FROM contact_message WHERE status='open'"),
    publishedCounts,
    recentActivity,
  };
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
