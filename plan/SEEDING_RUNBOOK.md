# SEEDING RUNBOOK — WP-51 (content entry + placeholder purge)

Goal: production D1 holds only real, consented content. Acceptance (BUILD_PLAN WP-51):
`SELECT` audit shows **zero placeholder rows** and **zero unconsented minor photos**.
Depends: WP-13 (admin CRUD). Human content entry waits on WP-00 (remote D1).

## 1. Owner per table (names TBD — fill before entry starts)

| Table(s) | Owner role | Notes |
|---|---|---|
| `announcement`, `page`, `faq`, `news` | Content lead | All body copy via `/admin` Editor.js |
| `person` | Content lead + Delegate | Photos need §4 gate before publish |
| `sponsor`, `donor`, `donation_page` | Treasurer | Wallet numbers + totals are money — double-entry |
| `comp_override` | Delegate | Fee tiers, payment steps, venue notes per comp |
| `lost_found`, `contact_message`, `opt_in` | Delegate on duty | Operational queues, start empty |
| `competitor`, `registration`, `tx_submission`, `guardian_consent` | — | User-written at runtime. Never hand-seed in prod |
| `record_snapshot`, `comp_champion` | — | Cron-derived (M4). Never hand-seed in prod |
| `audit_log`, `email_outbox` | — | System-written. Leave alone |

## 2. Placeholder inventory (everything `scripts/seed.sql` plants)

Every value below must be replaced with real content or deleted before launch.
Patterns: `Sample*` ids/slugs/names, `@example.org` emails, `+880100000000*`
numbers, `TESTTXID1`, `2026SAMP01`, `SampleComp2026`, bodies containing `Sample `.

| Table | Placeholder keys | Replace with |
|---|---|---|
| `announcement` | `sample-registration-open`, `sample-venue-map` | Real announcements, or delete |
| `page` | `about`, `contact-info`, `sponsors-pitch`, `worlds-story`, `worlds-criteria`, `privacy` | Real copy for all six slugs (`privacy` falls back to a pointer notice when absent) |
| `person` | `sample-delegate`, `sample-exec`, `sample-media`, `sample-outreach` | Real people; photos only per §4 |
| `sponsor` | `sample-sponsor`, `sample-silver`, `sample-community` | Real sponsors, or empty table |
| `faq` | `sample-faq-1` … `sample-faq-4` | Real FAQ entries |
| `news` | `sample-recap`, `sample-nr-alert`, `sample-welcome` | Real posts, or empty table |
| `comp_override` | `SampleComp2026`, `DhakaSpringOpen2026`, `ChittagongCubeOpen2026` (test wallets!) | Real per-comp overrides; test wallets must go |
| `donation_page` (id=1) | Test wallets, 185000/500000 demo totals | Real receiving wallets + verified totals; host city stays `Sweden` unless the board changes it |
| `donor` | `sample-donor`, `sample-donor-2`, `sample-donor-3` | Real opt-in donors only (§5) |
| `competitor`, `registration`, `tx_submission` | `sample-*` regs, `TESTTXID1–3` (incl. decided examples) | Delete all — runtime-written |
| `lost_found`, `opt_in`, `contact_message`, `guardian_consent` | `sample-*` (incl. decided/closed states) | Delete all — runtime-written |
| `record_snapshot`, `comp_champion` | `SampleComp2026` / 582-centis demo | Delete all — cron rebuilds from the WCA export |
| `audit_log`, `email_outbox` | One `seed` row each | Leave (system history), or purge with the rest |

## 3. Purge audit (run against local preview first, then remote post-WP-00)

```sql
-- Any surviving placeholders (expect zero rows each):
SELECT 'announcement', slug FROM announcement WHERE slug LIKE 'Sample%' OR title LIKE 'Sample%' OR body_json LIKE '%Sample %'
UNION ALL SELECT 'page', slug FROM page WHERE slug LIKE 'Sample%' OR title LIKE 'Sample%' OR body_json LIKE '%Sample %'
UNION ALL SELECT 'person', id FROM person WHERE id LIKE 'sample-%' OR name LIKE 'Sample%'
UNION ALL SELECT 'sponsor', id FROM sponsor WHERE id LIKE 'sample-%' OR name LIKE 'Sample%'
UNION ALL SELECT 'faq', id FROM faq WHERE id LIKE 'sample-%' OR a_json LIKE '%Sample %'
UNION ALL SELECT 'news', slug FROM news WHERE slug LIKE 'sample-%' OR title LIKE 'Sample%' OR body_json LIKE '%Sample %'
UNION ALL SELECT 'comp_override', wca_id FROM comp_override WHERE wca_id LIKE 'Sample%';
SELECT 'donor', id FROM donor WHERE id LIKE 'sample-%' OR name LIKE 'Sample%';
SELECT 'competitor', id FROM competitor WHERE email LIKE '%@example.org' OR id LIKE 'sample-%';
SELECT 'tx_submission', id FROM tx_submission WHERE txn_id LIKE 'TEST%' OR sender_number LIKE '+880100000000%';
SELECT 'record_snapshot', event FROM record_snapshot WHERE holder_wca_id LIKE '%SAMP%' OR comp_wca_id LIKE 'Sample%';
SELECT 'comp_champion', comp_wca_id FROM comp_champion WHERE comp_wca_id LIKE 'Sample%';
-- Test wallets anywhere (expect zero rows):
SELECT 'comp_override', wca_id FROM comp_override WHERE fee_tiers_json LIKE '%+880100000000%';
SELECT 'donation_page', id FROM donation_page WHERE bkash_wallet LIKE '+880100000000%' OR nagad_wallet LIKE '+880100000000%';
```

Remote form: `npx wrangler d1 execute speedbd --remote --command="<query>"` (from `web/`).

## 4. Photo-consent gate (ON before any minor photo publishes)

- `person.photo_r2` renders publicly **only** when `photo_consent=1`
  (enforced at the query layer in `src/lib/content.ts` — do not bypass).
- Procedure: collect consent → tick `photo_consent` in `/admin` → upload photo.
  A photo with `photo_consent=0` is stored but never rendered — that is the safe state.
- `news.cover_r2` has **no** consent column: the content lead must confirm every
  visible face in a cover image is consented (or an adult in a public comp hall)
  before setting status `published`.
- `gallery_album` / `gallery_photo` are dormant (no UI) — do not publish photos there.
- Audit: `SELECT id, name FROM person WHERE photo_r2 IS NOT NULL AND photo_consent != 1;`
  (expect zero rows).

## 5. Donor / Worlds checklist

- `donor`: opt-in names only; anyone who did not consent stays out entirely
  (no "Anonymous" backfill without asking). Amount hidden when `amount_bdt` is empty.
- `donation_page`: enter the real receiving wallets (public page masks them with
  Reveal), the verified raised total, and the refund policy in `policy_json`.
  Totals are manual — update only when money is verified, never aspirationally.
- `worlds-story` + `worlds-criteria` pages: candidate list, selection criteria,
  and refund policy must be entered (currently sample copy).

## 6. Order of operations

1. WP-00 done → remote D1 migrated.
2. Owners filled in §1; real wallets + totals verified by Treasurer.
3. Enter content via `/admin` (status `draft` until reviewed, then `published`).
4. Delete seed rows (or `db:reset` a scratch DB — never against remote).
5. Run §3 + §4 audits against remote; all zero.
6. Delegate signs here: __________ date: __________.
