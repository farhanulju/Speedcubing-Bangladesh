# BUILD PLAN — Speedcubing Bangladesh platform (executable)

Status: draft for execution. Scope gate: `docs/product/FEATURE_LIST.md` (A1–A8, A11–A22). Stack gate: `docs/architecture/ARCHITECTURE.md`. Design reference: Stitch project `1262927000140828637` + punchlist in `plan/DESIGN_REVIEW_ROUND2.md` §E. Sizes are relative (S < 3d, M < 2w, L > 2w); work in milestone order; do not start a package whose `Depends` is unmet.

## M0 — Foundations (accounts, scaffold, tokens)

| WP | Work | Acceptance | Size | Depends |
|----|------|------------|------|---------|
| WP-00 | Provision: Cloudflare account, Pages project, D1 (`speedbd`), KV (`wca-cache`), R2 (`speedbd-media`), Turnstile site, Access app for `/admin/*`, WCA OAuth app (redirects: `/api/auth/callback`), Resend domain + key | All IDs/keys in dashboard secrets + `.dev.vars` template (values never in git); checklist in M5 runbook ticks each | S | — |
| WP-01 | Scaffold `web/`: Astro + TypeScript + Tailwind, Cloudflare adapter, `src/lib/{wca,editor,email,auth}.ts`, `workers/{api,sync-wca}.ts`, `migrations/`, dict-based EN strings, fontsource (Plus Jakarta Sans + Space Grotesk, self-hosted) | `npm run build` green; Pages preview deploys; no Google-Fonts requests in network log | M | WP-00 |
| WP-02 | Port Stitch tokens to CSS vars: emerald `#006a4e`, orange `#F4511E`, violet `#5A28CE`, ink `#121417`, 2px borders, offset shadows, pill buttons, Space Grotesk data styles; one `StatusLockup` component ("Prospective WCA Regional Organization") | Storybook-less demo page renders tokens; lockup used by every surface (closes P1) | S | WP-01 |
| WP-03 | CI: build + typecheck + lint + public-route JS budget check (<200 KB) + `editorjs-*` version pin check | Failing budget/pin blocks merge | S | WP-01 |

## M1 — Data + Admin (D1 first, UI second)

Migrations (apply in order; every table gets `updated_by/at` where human-edited):

| Mig | Tables |
|-----|--------|
| 0001 | `announcement`, `page`, `person`, `volunteer_internal`, `sponsor`, `faq`, `news` (+ `locale` default `'en'`) |
| 0002 | `comp_override`, `donation_page`, `donor` |
| 0003 | `competitor`, `registration` (incl. `wca_accepted` + by/at), `tx_submission` |
| 0004 | `lost_found`, `opt_in`, `contact_message { id, name, email, wca_id?, category, body, status, at }` |
| 0005 | `guardian_consent`, `audit_log`, `email_outbox` |
| 0006 | `record_snapshot`, `comp_champion` |
| 0007 | `gallery_album`, `gallery_photo` (dormant — no UI) |

| WP | Work | Acceptance | Size | Depends |
|----|------|------------|------|---------|
| WP-10 | Migrations 0001–0007 + seed script (1 sample row per content table, fake PII-free) | `wrangler d1 migrate` clean locally + preview; seed reversible | S | WP-01 |
| WP-11 | R2 uploader endpoint (`POST /api/uploads`, Access or session authed, type/size allowlist, AVIF/WebP variants) wired to Editor.js image tool | Uploaded image renders via R2 URL; rejects >8 MB / non-image | S | WP-10 |
| WP-12 | Editor.js admin field (pinned tool allowlist per ARCHITECTURE §5, thin manual wrapper, live preview pane rendering via allowlisted parsers) | Only allowlisted blocks save; unknown blocks stripped with warning; preview matches public render | M | WP-11 |
| WP-13 | Admin CRUD: announcements (pin/scope), pages, people (private columns hidden at query layer), sponsors, FAQ order, news, comp overrides, Worlds page + totals, donors (opt-in only) | Each table creatable/editable/publishable without deploy; audit rows written | L | WP-10, WP-12 |
| WP-14 | Payment queue UI: filterable TxID list, inspection modal (statement-line ref field, NO auto-match language), accept/reject + note → status flows to user dashboard + outbox email enqueued + audit row | Accept/reject round-trips end-to-end on preview with dump-restore | M | WP-10 |
| WP-15 | Lost-found inbox + donor manager + contact inbox (status workflows) | Ticket/donor/message state changes persist + audit rows | S | WP-10 |
| WP-16 | Access gating on `/admin/*` + `admin:*` APIs; admin audit-trail view | Logged-out access redirects to Access login; activity feed reads `audit_log` | S | WP-13–WP-15 |

## M2 — Public site (ISR, mobile-first)

| WP | Work | Acceptance | Size | Depends |
|----|------|------------|------|---------|
| WP-20 | Shell: header (hamburger <768px) + unified footer (adds People/News/Sponsors/Lost & Found links — closes N4), announcement bar, SEO/og/sitemap, CF Web Analytics beacon, 404/500 | 360px + 1280px screenshots per route; budgets green | M | WP-02, WP-13 |
| WP-21 | Home, About, People, FAQ, Contact (+opt-in forms), Lost & Found (form + public log minus claimant IDs) | All forms Turnstile-gated, fail closed; log shows "Claimed ✓" only | L | WP-20 |
| WP-22 | Competitions list + detail (WCA cache + overrides, labeled on-site counts, "Official WCA Page" + "Live Results" links, fee tiers, refund policy, roster with dual statuses) | No page claims WCA-side counts; no "Stream" label | M | WP-20, WP-40 |
| WP-23 | Records (+Progression from snapshots), News (+article), Sponsors (+deck download), Worlds 2027 (manual totals, masked Reveal numbers, single host-city field) | Scramble box absent; "updated daily" stamps; no fabricated citations | M | WP-20, WP-40 |

## M3 — Registration, payments, user dashboard

| WP | Work | Acceptance | Size | Depends |
|----|------|------------|------|---------|
| WP-30 | WCA OAuth: login, callback, session (httpOnly + SameSite=Lax, `state`+PKCE), WCA-ID validation vs cache, edge states (no-ID first-timer, mismatch) | First-timer and returner flows tested with stubbed profiles | M | WP-01 |
| WP-31 | Registration flow on comp detail: event select (from WCIF), fee calc (whole taka), TxID submit (Turnstile), status tracker | Unauthenticated users forced through login; double-submit safe | M | WP-22, WP-30 |
| WP-32 | `/dashboard`: profile + PBs (ranks cache, "—" fallback), registrations + 4-step tracker (step 4 = "Accepted on WCA (delegate confirmed)", never a roster number), history table, seed display, guardian-consent card, notif prefs | History matches WCA profile; consent writes `guardian_consent` | L | WP-30, WP-31 |
| WP-33 | Email: `email_outbox` + 5-min flush via Resend; templates `payment-verified`, `payment-rejected`, `guardian-consent-recorded`; fail-open (dashboard canonical) | Rejected/verified decisions produce exactly one queued mail; kill Resend key → verifications still work | S | WP-14 |
| WP-34 | Print-CSS slip route `/dashboard/registrations/[id]/slip` | Prints cleanly to A4 PDF from mobile Chrome; no PDF lib in bundle | S | WP-32 |

## M4 — Sync jobs (WCA cache, snapshots, champions)

| WP | Work | Acceptance | Size | Depends |
|----|------|------------|------|---------|
| WP-40 | `sync-wca` daily cron: KV `competitions-BD`, `competition/:id`, `person/:wca_id`, `ranks-BD/*`, `records-BD` (+ `asOfExportDate`); stale-on-failure banner data; rate-limited manual "Refresh cache" admin action (1/10 min, read-only) | Kill upstream in staging → stale banner + old data served; no writes to WCA anywhere | M | WP-01 |
| WP-41 | Snapshot + champion derivation in same cron: append `record_snapshot` on change; derive `comp_champion` (3x3x3 finals winner) with nullable admin override | Progression view shows ≥2 points after 2 runs; champion column matches WCA podiums | S | WP-40 |
| WP-42 | Outbox flush cron (5 min) + backoff + dead-letter after 3 tries | Same as WP-33 acceptance, plus retry storm test | S | WP-33 |

## M5 — Content, QA, launch

| WP | Work | Acceptance | Size | Depends |
|----|------|------------|------|---------|
| WP-50 | Design punchlist sweep (round-2 §E verbatim): lockup component rollout, citation strip, tag strip, host-city field, number derivations, button renames, Reveal rollout, countdown rule, claimant-ID drop, email/phone form fixes, "Site reg #" labels, footer/nav links, blank-CTA re-render check | Every §E line ticked with screenshot proof (360px + 1280px) | M | WP-21–WP-23 |
| WP-51 | Content seeding runbook: owner per table, placeholder purge (Sweden city, 5.82s-style demo values replaced or removed), photo-consent gating ON before any minor photo publishes, Worlds candidate/criteria + refund policy entered, wallet numbers entered masked | `SELECT` audit: zero placeholder rows, zero unconsented minor photos | M | WP-13 |
| WP-52 | QA matrix: all routes × 360px/768px/1280px; Turnstile forced-fail; D1-write-fail; WCA-down; Resend-down; Access-off; budget check; R2 missing-asset fallback | Matrix sheet all-green; failure drills recorded | M | WP-32, WP-42 |
| WP-53 | Launch: DNS cutover, Access policies, secrets rotation check, cron enable, KV warm, rollback drill (Pages rollback + D1 restore rehearsal), link-in-bio swap, announce post | Rollback completes <15 min in rehearsal; launch checklist signed | S | WP-52 |

## Appendices

### API table (all JSON; auth: `—` public-read, `U` WCA session, `A` Access)

`GET /api/competitions` (—), `GET /api/competitions/:wca` (—), `GET /api/records` (—), `GET /api/records/progression?event=&kind=` (—), `POST /api/registrations` (U), `GET /api/me/registrations` (U), `POST /api/tx` (U), `POST /api/lost-found` (— +Turnstile), `POST /api/contact` (— +Turnstile), `POST /api/opt-in` (— +Turnstile), `POST /api/consent` (U), `GET /api/admin/tx-queue` (A), `POST /api/admin/tx/:id/decision` (A), `POST /api/admin/wca-accepted` (A), `POST /api/admin/*` CRUD per content table (A), `POST /api/uploads` (A or U for lost-found photos), `POST /api/admin/cache-refresh` (A, rate-limited), `GET /api/auth/login|callback|logout`.

### Cron table

`sync-wca` daily 02:00 Asia/Dhaka (KV + snapshots + champions); `outbox-flush` every 5 min.

### Secrets inventory

`WCA_CLIENT_ID/SECRET`, `SESSION_SECRET`, `RESEND_API_KEY`, `TURNSTILE_SITE/SECRET`, `ORGANIZER_INBOX`, `WORLDS_WALLET_*` (masked display; values server-side only). Bindings (not secrets): D1, KV, R2.

### Staffing

Owner TBD per milestone (M0 platform, M1 admin/data, M2 public, M3 accounts/payments, M4 sync, M5 content/QA/launch). One delegate must own payment-number custody + verifier roster before M3.

### Risks

WCA export schema drift (pin parser version, alert on unknown columns); Resend limits (100/day cap → queue + dashboard fallback); Access seat sprawl (named admins only); photo-consent bottleneck (gate publishing, not building); scope creep via Stitch (any new screen needs a FEATURE_LIST tick first).
