// Published-content readers (WP-21). Public pages may ONLY use these:
// status='published' enforced here, private columns never selected.
// Editor.js bodies are rendered via renderDocument() from lib/editor.
import type { SpeedbdEnv } from './bindings';

export interface Announcement {
  slug: string;
  title: string;
  date: string;
  comp_wca_id: string | null;
  body_json: string;
  pinned: number;
}

export async function getPinnedAnnouncements(env: SpeedbdEnv): Promise<Announcement[]> {
  const res = await env.DB.prepare(
    "SELECT slug, title, date, comp_wca_id, body_json, pinned FROM announcement WHERE status='published' AND pinned=1 ORDER BY date DESC LIMIT 5",
  ).all();
  return (res.results ?? []) as unknown as Announcement[];
}

export async function getPage(env: SpeedbdEnv, slug: string): Promise<{ title: string; body_json: string } | null> {
  const row = (await env.DB.prepare("SELECT title, body_json FROM page WHERE slug=? AND status='published'")
    .bind(slug)
    .first()) as null | { title: string; body_json: string };
  return row;
}

export interface Person {
  id: string;
  name: string;
  photo_r2: string | null;
  role: string;
  wca_id: string | null;
  focus_area: string | null;
  member_since: string | null;
}

export async function getPeople(env: SpeedbdEnv): Promise<Person[]> {
  // Consent-gated at the query layer: unconsented photos never leave D1.
  const res = await env.DB.prepare(
    `SELECT id, name, CASE WHEN photo_consent=1 THEN photo_r2 ELSE NULL END AS photo_r2,
      role, wca_id, focus_area, member_since
     FROM person WHERE status='published' ORDER BY rowid LIMIT 100`,
  ).all();
  return (res.results ?? []) as unknown as Person[];
}

export interface Faq {
  id: string;
  q: string;
  a_json: string;
}

export async function getFaqs(env: SpeedbdEnv): Promise<Faq[]> {
  const res = await env.DB.prepare("SELECT id, q, a_json FROM faq WHERE status='published' ORDER BY sort_order, rowid LIMIT 100").all();
  return (res.results ?? []) as unknown as Faq[];
}

export interface NewsItem {
  slug: string;
  title: string;
  published_at: string | null;
  body_json: string;
  cover_r2: string | null;
}

export async function getNews(env: SpeedbdEnv, limit = 20): Promise<NewsItem[]> {
  const res = await env.DB.prepare(
    "SELECT slug, title, published_at, body_json, cover_r2 FROM news WHERE status='published' ORDER BY published_at DESC LIMIT ?",
  )
    .bind(limit)
    .all();
  return (res.results ?? []) as unknown as NewsItem[];
}

export async function getNewsItem(env: SpeedbdEnv, slug: string): Promise<NewsItem | null> {
  const row = (await env.DB.prepare("SELECT slug, title, published_at, body_json, cover_r2 FROM news WHERE slug=? AND status='published'")
    .bind(slug)
    .first()) as null | NewsItem;
  return row;
}

export interface Sponsor {
  id: string;
  name: string;
  logo_r2: string | null;
  tier: string | null;
  url: string | null;
}

export async function getSponsors(env: SpeedbdEnv): Promise<Sponsor[]> {
  const res = await env.DB.prepare(
    "SELECT id, name, logo_r2, tier, url FROM sponsor WHERE status='published' ORDER BY sort_order, rowid LIMIT 100",
  ).all();
  return (res.results ?? []) as unknown as Sponsor[];
}

export interface DonationPage {
  target_bdt: number;
  raised_manual_bdt: number;
  policy_json: string;
  worlds_host_city: string;
  bkash_wallet: string | null;
  nagad_wallet: string | null;
}

export async function getDonationPage(env: SpeedbdEnv): Promise<DonationPage | null> {
  const row = (await env.DB.prepare('SELECT target_bdt, raised_manual_bdt, policy_json, worlds_host_city, bkash_wallet, nagad_wallet FROM donation_page WHERE id=1').first()) as null | DonationPage;
  return row;
}

export interface Donor {
  name: string;
  amount_bdt: number | null;
}

export async function getDonors(env: SpeedbdEnv): Promise<Donor[]> {
  // Consent-gated: only opt-in donors render. Amounts may be hidden per-row.
  const res = await env.DB.prepare(
    'SELECT name, amount_bdt FROM donor WHERE consent=1 ORDER BY sort_order, rowid LIMIT 200',
  ).all();
  return (res.results ?? []) as unknown as Donor[];
}

export async function getCompOverride(
  env: SpeedbdEnv,
  wcaId: string,
): Promise<{ payment_steps_json: string; venue_note: string | null; fee_tiers_json: string } | null> {
  const row = (await env.DB.prepare(
    'SELECT payment_steps_json, venue_note, fee_tiers_json FROM comp_override WHERE wca_id=?',
  )
    .bind(wcaId)
    .first()) as null | { payment_steps_json: string; venue_note: string | null; fee_tiers_json: string };
  return row;
}

export interface LostFoundPublic {
  id: string;
  comp_wca_id: string | null;
  item: string;
  status: string;
}

export async function getLostFoundLog(env: SpeedbdEnv): Promise<LostFoundPublic[]> {
  // Public log: item + location + status ONLY. Reporter contacts never selected.
  // Claimant IDs never stored on resolved rows (standing rule).
  const res = await env.DB.prepare(
    "SELECT id, comp_wca_id, item, status FROM lost_found WHERE status != 'returned' ORDER BY created_at DESC LIMIT 100",
  ).all();
  return (res.results ?? []) as unknown as LostFoundPublic[];
}

export async function countRegistrations(env: SpeedbdEnv, compWcaId: string): Promise<number> {
  const row = (await env.DB.prepare('SELECT COUNT(*) AS n FROM registration WHERE comp_wca_id=?')
    .bind(compWcaId)
    .first()) as null | { n: number };
  return row?.n ?? 0;
}

export interface RecordSnapshot {
  event: string;
  kind: string;
  value_centis: number;
  holder_name: string | null;
  export_date: string;
}

export async function getRecordSnapshots(env: SpeedbdEnv): Promise<RecordSnapshot[]> {
  const res = await env.DB.prepare(
    'SELECT event, kind, value_centis, holder_name, export_date FROM record_snapshot ORDER BY export_date DESC LIMIT 2000',
  ).all();
  return (res.results ?? []) as unknown as RecordSnapshot[];
}

export interface CompetitionChampion {
  comp_wca_id: string;
  winner_wca_id: string | null;
  winning_value_centis: number | null;
  derived_at: string;
}

export async function getCompetitionChampions(env: SpeedbdEnv): Promise<CompetitionChampion[]> {
  const res = await env.DB.prepare(
    `SELECT comp_wca_id, COALESCE(override_winner_wca_id, winner_wca_id) AS winner_wca_id,
      CASE WHEN override_winner_wca_id IS NOT NULL THEN NULL ELSE winning_value_centis END AS winning_value_centis,
      derived_at FROM comp_champion`,
  ).all();
  return (res.results ?? []) as unknown as CompetitionChampion[];
}
