# DECISION_REGISTER

Durable decisions. Newest first. Format: `YYYY-MM-DD — Decision — rationale — owner`.

- 2026-09-15 — Admin gets exactly ONE distinct dark shell (`AdminShell`: sidebar + who-am-I badge on every `/admin` page) — mode-confusion safety (an admin must never mistake admin for public view) and identity visibility; supersedes the reviewer-written "unify to one shell" note, which was never a board vote and wrongly blocked a distinct admin chrome — user direction.
- 2026-09-15 — Admin identity is display-only (`Cf-Access-Authenticated-User-Email` from the edge, dev bypass string locally); it never authorizes — APIs still verify the Access JWT per request, so identity display adds zero attack surface — user direction.

- 2026-09-15 — Comp status pills derive from WCA end-dates and appear only under date-neutral headings; fixture dates stay stale-dated — pills must never contradict their heading, and fixtures double as test-sync inputs (past dates drive champion derivation) — reviewer check.
- 2026-09-15 — Stitch elements contradicting board rules stay out: PDF slips (print-CSS instead), psych sheets (B10), auto-match/TxID-ok language, WCA-side counts, live-stream labels, fabricated stats/citations, volunteer tiers, claimant IDs — reviewer check against Stitch export 2026-09-15.

- 2026-09-14 — English-only website v1; Bangla is a future locale, not a priority — keeps v1 shippable; content structured for later `bn/` locale — board.
- 2026-09-14 — Worlds fundraising is a separate page (`/worlds-2027`), not a homepage section — needs its own story, progress, donor wall, refund policy — board.
- 2026-09-14 — Volunteer names/data are public (name, focus area, member-since); tiers and internal notes stay private and are never rendered — recognition without hierarchy drama — board.
- 2026-09-14 — Competition announcements managed in this repo and rendered by the site — single canonical record instead of scattered Facebook posts — board.
- 2026-09-14 — Cloudflare free tier only (Pages, Workers, D1, KV, R2, Turnstile) — generous free plan, single vendor, no new bills — board.
- 2026-09-14 — One repo is the source of truth for org + discussion (`docs/`, `plan/`, `web/`) — avoids knowledge split across drives/chats — board.
- 2026-09-14 — WCA is source of truth for comps/results/persons/records; site caches daily and links back — avoids fork drift and rate limits — research.
- 2026-09-14 — No blog/forum in v1 — moderation and editorial capacity missing; announcements + gallery + records cover v1 needs — board call.
- 2026-09-14 — Payment v1 is manual bKash/Nagad Send-Money + TxID form; automated gateway is Phase 2 — merchant onboarding takes time; manual unblocks comps now — board call.
- 2026-09-14 — Money is whole taka (integers only, no paisa) — matches local payment reality — standing rule.
- 2026-09-14 — MVP review applied: A1 home, A2 about, A3 people, A4 competitions, A5 comp detail, A6 manual-payment guide, A7 announcements, A8 FAQ, A11 lost-found ship; A9 volunteers and A10 gallery UI deferred (data models stay ready) — board review; low volunteer count and no gallery need right now.
- 2026-09-14 — Records (ex-B1) promoted into MVP: BD NR table + hero cards from daily WCA export cache — cheap, high prestige — board review.
- 2026-09-14 — News posts required in MVP (comp recaps, NR posts, Worlds journey), managed via admin dashboard — media home without a forum — board review.
- 2026-09-14 — WCA authentication in MVP: users log in with WCA OAuth, validate WCA ID, register on our site; long-term direction is our own registration UX with WCA as the canonical publish target — board review.
- 2026-09-14 — Competition-history view (general archive + per-user history in dashboard) replaces regional sub-pages, which are deferred indefinitely (Dhaka not proceeding) — board review.
- 2026-09-14 — No Google Forms anywhere: no embeds, no iframes. All forms are Cloudflare-native (Workers + D1 + Turnstile) for maintainability — board review.
- 2026-09-14 — Lost-found is a simple Cloudflare form → D1 inbox. No Durable Object / workflow needed — board review.
- 2026-09-14 — Repo stores no content. All content (announcements, people, sponsors, FAQ, news, comp overrides, Worlds page, donation totals) lives in D1 and is managed via an MVP admin dashboard; phases out the earlier repo-markdown interim — board review.
- 2026-09-14 — Three surfaces in MVP: public site + logged-in user dashboard (registrations, payments, history) + admin dashboard (content, announcements, payment verification). Admin gated by Cloudflare Access; users via WCA OAuth — board review.
- 2026-09-14 — Payments stay manual + human-verified in MVP, with a dedicated payment dashboard (verification queue, accept/reject, receipt note) — board review.
- 2026-09-14 — Rich-text editor choice: TipTap over TinyMCE — headless, MIT-licensed, JSON output that sanitizes cleanly for static render, no cloud key or GPL encumbrance; fixed toolbar with restricted marks — board review.
- 2026-09-14 — Site search deferred to later; school portal and membership not needed; rankings stay Phase 2 — board review.
- 2026-09-14 — If a forum is ever added, it will be Discourse (open-source) — recorded exception to Cloudflare-only, since Discourse needs its own host; needs a separate hosting decision before build — board review.
- 2026-09-14 — Rich-text editor choice revised: Editor.js over TipTap/TinyMCE — block allowlist IS the renderer allowlist (simplest sanitization), flat JSON suits D1 storage and inspection, `editorjs-html`-style Node rendering fits ISR, image tool's custom-uploader hook maps to Worker → R2, Apache-2.0 with no cloud key; v1 toolset excludes table/embeds/raw-HTML; supersedes the earlier TipTap entry — reviewer check.
- 2026-09-14 — Web framework: Astro (TypeScript) + Tailwind — content-heavy static output, island architecture matches the <200 KB JS budgets, first-class Cloudflare Pages adapter; team JS familiarity — reviewer rec for executable plan.
- 2026-09-14 — Transactional email: Resend free tier (3k/mo, 100/day) via D1 outbox + 5-min flush cron; templates limited to payment-verified / payment-rejected / guardian-consent-recorded; dashboard stays canonical on send failure — second recorded Cloudflare-only exception (bulk newsletter still undecided) — reviewer rec for executable plan.
- 2026-09-14 — Record history: nightly append-only `record_snapshot` rows (write on change) power Progression views; past-tournament champion column derived by the sync job with nullable admin override — design review round 2.
- 2026-09-14 — Fee verification and WCA acceptance are separate states: `registration.wca_accepted` manual tick (by/at) after the delegate acts on the WCA site; approval on our side never implies WCA acceptance — design review round 2.
- 2026-09-14 — Guardian consent v1: guardian name + relation + checkbox + timestamp (+ optional admin verify); no e-signatures — reviewer rec for executable plan.
- 2026-09-14 — Registration slip: print-CSS route, no PDF library in v1; psych sheet deferred to Phase 2 (B10) — design review round 2.
- 2026-09-14 — Content accuracy is load-bearing: one "Prospective WCA Regional Organization" lockup component everywhere; no fabricated WCA regulation/article citations; every stat derives from the WCA-cache job; single admin `worlds_host_city` value; day-precision countdowns unless <48h; "LIVE" only for truly-live data; internal feature tags never render; claimant IDs never public; bKash numbers masked + Reveal — design review round 2.
- 2026-09-14 — Analytics: Cloudflare Web Analytics beacon (free, cookieless) — decides the "lightweight analytics" in A15 — reviewer rec for executable plan.
- 2026-09-14 — Design review round 2 recorded at `plan/DESIGN_REVIEW_ROUND2.md` (13 new screens verified, partials + new issues graded); full execution order at `plan/BUILD_PLAN.md` — reviewer rec for executable plan.
