# FEATURE_LIST — board review checklist

Review applied 2026-09-14. Ticked `[x]` = approved for MVP build. Unticked `[ ]` = parked. Only ticked items may be built.

Conventions: `Source` = system of record (D1 = our Cloudflare DB, managed via admin dashboard; WCA = cached, never forked). `CF` = Cloudflare free-tier piece. Effort: S < 3d, M < 2w, L > 2w. English-only v1. Mobile-first. No Google Forms anywhere.

## Build status (updated 2026-09-17 — code state, not scope)

Ticks above are the scope gate and do not move. This section records what is
already built. Legend: **Built** = code-complete, local-verified
(`check`+`build`+harnesses green). **Needs WP-00** = code done, live
credentials/deploy pending (`plan/OPS_HANDOFF.md`). **Content** = needs WP-51
entry (`plan/SEEDING_RUNBOOK.md`). **Gap** = scoped but not yet built.

| # | Status | Evidence / location |
|---|--------|---------------------|
| A1 | Built, 1 gap | `web/src/pages/index.astro` — badge hero, next-3 comps, NR spotlight, sponsors, Worlds banner, news, opt-in, N14 countdown (renders only with a future comp). Gap: tasks view |
| A2 | Built + Content | `web/src/pages/about.astro` — copy via `page/about` |
| A3 | Built + Content | `web/src/pages/people.astro` — photo renders only when `photo_consent=1` (`content.ts`) |
| A4 | Built | `web/src/pages/competitions.astro` — auto-list + city/event/year/status filters + cache stamp + Upcoming/Past archive split and cached 3×3 champion links |
| A5 | Built | `web/src/pages/competitions/[slug].astro` — fees, masked Reveal wallets, WCIF events, Live Results, dual-status notice, site roster (names + fee/WCA states + site-reg # + search), WCIF schedule + delegate cards |
| A6 | Live | `api/registrations`, `api/tx`, `/dashboard`, print slip — WCA OAuth app live, login tested 2026-09-16 |
| A7 | Built + Content | Pinned bar on Home; header-bar slot still TODO (`Base.astro`) |
| A8 | Built + Content | `web/src/pages/faq.astro` via admin FAQ |
| A11 | Built | Form + public log (contacts private, `Claimed ✓` only) + inbox |
| A12 | Built + Content | Logo wall + deck button; PDF upload pending WP-51 |
| A13 | Built + Content | Manual totals, masked Reveal wallets, opt-in donor wall; candidates/criteria/refund copy pending |
| A14 | Built | Contact + email-only opt-in; alert form and Turnstile mount only after explicit signup intent; opt-in is stored-only while bulk delivery remains on hold; WhatsApp stays link-text per copy |
| A15 | Partial | Route-specific title/description, canonical URLs, `og:image`/Twitter metadata, generated 1200×630 social card, dynamic public-only sitemap, robots policy, skip link, and Facebook footer link. Missing: analytics beacon/token and link-in-bio page (post-domain). |
| A16 | Built, 1 gap | NR table + daily stamp + event/holder filters + CSV export + inline snapshot history; `record_snapshot` collected by cron. Gap: dedicated Progression view |
| A17 | Live | Dashboard (PBs + BD ranks, tracker, D1 history table, consent card); live login tested 2026-09-16 |
| A18 | Live | Registry CRUD + guided Editor.js preview + Access-gated R2 image uploads + managed person roles/sponsor tiers + audit + quick-action/published-count ops hub + distinct shell; Access app live (8 emails), gate tested 2026-09-16 |
| A19 | Built | Queue, atomic accept/reject, 409 guard, manual WCA tick — local-verified |
| A20 | Built + Content | `web/src/pages/news.astro` + `[slug]` via admin |
| A21 | Partial | General past-competition archive includes cached 3×3 champion and WCA results/podium links; dashboard distinguishes site registrations from the official WCA profile. Per-user historical competition results are not yet cached locally. |
| A22 | Built, on hold | Outbox + 3 templates + flush worker live (skips cleanly); Resend onboarding deferred by decision, dashboard is canonical |

Open gaps feeding M5: A15 analytics/link-in-bio, A16 progression, and A21
per-user archive. Phase 2 (B-items) untouched — still parked.

## A. MVP — approved build list

| # | Tick | Feature / route | Problem it solves | Source | CF | Effort | Depends |
|---|------|-----------------|-------------------|--------|----|--------|---------|
| A1 | [x] | Home `/` — hero (next comp countdown + tasks view), trust strip (WCA Regional Org), next-3 comps, NR spotlight, sponsors strip, Worlds banner → `/worlds-2027`, latest news + announcements | "Who are you, are you legit, when is the next comp?" | WCA cache + D1 content | Pages (ISR daily) | M | A4 |
| A2 | [x] | About `/about` — story, mission/vision, legal identity placeholder, financial-report slot (like SCA), contact | Sponsor/parent trust | D1 via admin | Pages ISR | S | A18 |
| A3 | [x] | Our People `/people` — execs + delegates (photo, role, WCA ID link); volunteer names shown here when roster exists (no tiers) | Recognition; delegate lookup | D1 via admin + `wca_id` links | Pages ISR + R2 photos | M | A18 |
| A4 | [x] | Competitions `/competitions` — upcoming auto-list (BD) + past list, city filter | Scattered Facebook posts; "where do I register?" | Unofficial API `competitions` + official v0 `country_iso2=BD`, cached daily | Workers Cron → KV → Pages | M | ARCH cache |
| A5 | [x] | Competition detail `/competitions/[slug]` — dates, venue/map, fee tiers (Early/Late/Spot), schedule, events/limits, payment steps, refund + ID policy, WCA + WCA Live buttons | "How much, how do I pay, am I accepted?" | WCA WCIF-public + D1 override row per comp | Pages ISR | M | A4, A18 |
| A6 | [x] | Registration guide + manual payment v1 — WCA account → register on our site (WCA-validated) → bKash/Nagad Send-Money → TxID form → human verification in payment dashboard. Includes print-CSS registration slip | Unblocks comps without merchant account | Guide: D1; Tx: D1 queue | Pages + Worker + D1 + Turnstile | M | A5, A17, A19 |
| A7 | [x] | Announcements — pinned notices (registration open/close, venue change) managed in admin dashboard, shown on Home + comp page | Single canonical record, not chat threads | D1 via admin | Pages ISR | S | A18 |
| A8 | [x] | FAQ `/faq` — first-timer guide (bring own cube + mark it, WCA ID after first comp, no age divisions, time limits, spectators free, filming rules, results on WCA Live → WCA DB) | Re-asked questions burn delegate time | D1 via admin | Pages ISR | S | A18 |
| A9 | [ ] | Volunteers `/volunteers` — DEFERRED (low volunteer count). Data model stays ready; UI moves to Phase 2 | Recruiting | D1 (dormant) | — | M | — |
| A10 | [ ] | Gallery `/gallery` — DEFERRED (not needed now). R2 bucket + data model reserved; UI moves to Phase 2 | Photos | — | — | S | — |
| A11 | [x] | Lost & Found `/lost-found` — simple Cloudflare form (comp, item, photo) → D1 inbox → delegate resolves. No Durable Object, no Google Form | Lost cubes every comp | Form → D1 | Pages + Worker + D1 + Turnstile | S | A18 |
| A12 | [x] | Sponsors `/sponsors` — logo wall, what funds cover, media-kit PDF download | Sponsor asks "where does money go?" | D1 via admin + R2 PDF | Pages ISR | S | A18 |
| A13 | [x] | Worlds 2027 `/worlds-2027` — separate page: story, target, manual progress total, candidate criteria (TBD), donor wall (opt-in), refund-if-visa-fails policy | Crowdfunding home, separate from comps | D1 via admin | Pages ISR | M | A18 |
| A14 | [x] | Contact `/contact` + updates opt-in (newsletter + WhatsApp Channel link + voluntary broadcast signup) | "How do I reach you?" — explicit opt-in only, never scraped phones | Form → D1 | Pages + Worker + D1 | S | A18 |
| A15 | [x] | SEO + analytics + social plumbing — `og:image` (stills only), sitemap, lightweight analytics, link-in-bio landing | Discovery + sharing on mobile | Repo config | Pages headers | S | — |
| A16 | [x] | Records `/records` (promoted from B1) — BD NR table (like SCA), history, hero cards, "updated daily, source: WCA export". Progression views read nightly `record_snapshot` appends | Prestige + media proof | Unofficial `ranks`/`results` cache | Cron → KV → Pages | M | ARCH cache |
| A17 | [x] | WCA auth + user dashboard `/dashboard` — log in with WCA OAuth, validate WCA ID, register on our site, see my registrations, payment status, competition history. Includes seed-time display (ranks cache, "—" fallback) + guardian-consent card (name + relation + checkbox, no e-sign) | One login, verified identity, no duplicate profiles; long-term path to own registration UX | WCA OAuth + D1 `competitor`/`registration` | Pages + Worker + D1 | L | A4, A6 |
| A18 | [x] | Admin dashboard `/admin` (Access-gated) — manage all content: announcements, pages, people, sponsors, FAQ, news, comp overrides, Worlds page, donation totals. Editor.js blocks (allowlisted toolset), JSON → sanitized HTML | Repo holds no content; non-devs publish without deploys | D1 | Pages + Worker + D1 + Access | L | — |
| A19 | [x] | Payment dashboard (in `/admin`) — manual verification queue: TxID submissions → accept/reject + receipt note → status flows to user dashboard | Human-verified payments need a work queue, not an inbox | D1 | Worker + D1 | M | A6 |
| A20 | [x] | News `/news` + `/news/[slug]` — comp recaps, NR posts, Worlds journey, managed in admin dashboard | Media coverage home (no forum in v1) | D1 via admin (Editor.js) | Pages ISR | S | A18 |
| A21 | [x] | Competition history — general archive (past comps + podiums link-out, derived champion column) + per-user history in `/dashboard`. Replaces regional sub-pages | "What have we run, what did I attend?" without region fragmentation | WCA cache + D1 registrations | Pages ISR | M | A4, A17 |
| A22 | [x] | Transactional email (Resend free tier) — payment-verified / payment-rejected / guardian-consent-recorded notices via D1 outbox + 5-min flush. Dashboard stays canonical on send failure | Users learn decisions without polling the dashboard | D1 outbox → Resend | Worker + D1 | S | A17, A19 |

## B. Phase 2 — parked (needs a tick + owner before build)

| # | Feature | Why later | Source | CF | Effort |
|---|---------|-----------|--------|----|--------|
| B2 | Rankings `/rankings/[event]` — BD rankings per event | Records (A16) covers prestige first | Unofficial `ranks` cache | Cron → KV → Pages | M |
| B3 | Payments v2 — SSLCommerz/ShurjoPay aggregator IPN, auto-reconcile, waitlist auto-promote | Manual + dashboard works for now | Gateway IPN → D1 | Worker + D1 | L |
| B4 | Gallery UI activation — admin upload, consent flag, album per comp (model + bucket already reserved) | Explicitly not needed now | R2 + D1 meta | Worker + D1 + R2 | M |
| B5 | Volunteer UI activation — public roster + join flow + internal tiers/notes/slots/hours (model already reserved) | Volunteer count too low now | D1 (private fields never rendered) | Worker + D1 | M |
| B6 | Organizer toolkit — comp checklist, budget template, venue letter, school-outreach pack | Needs an owner + outside-Dhaka demand | D1 via admin + R2 downloads | Pages ISR | M |
| B7 | Donations v2 — receipts, expense log feeding financial report, auto totals | Manual totals suffice for MVP | D1 | Worker + D1 | M |
| B9 | Site search (comps, people, FAQ, records, news) | Necessary later once content grows | Local index | Pages client index | M |
| B10 | Psych-sheet view (seed-time grids per comp) | Nice-to-have; seed display already in A17 roster | Ranks cache | Pages ISR | S |

## C. Future — only when volume or hosting demands

- Own registration UX (extends A17): our site becomes the primary flow, WCA stays the canonical publish target via WCIF. Needs WCA delegate-tooling alignment before build.
- Live hub: WCA Live embed + CubersLive-BD (streams, interviews). WCA Live link-out is already in A5.
- Regional pages: deferred indefinitely (Dhaka not proceeding). Competition history (A21) is the substitute.
- School portal / membership: not needed.
- Forum: Discourse (open-source) **only** — recorded exception to Cloudflare-only (Discourse needs its own host). Requires a separate hosting + moderation decision first.
- Rankings-adjacent ideas, PWA push, open JSON API: only with demand + owner.

## Non-goals (do not build)

- Google Forms embeds/iframes anywhere. All forms are Cloudflare-native (Workers + D1 + Turnstile).
- Content files in the repo (`src/content/` is banned). Content lives in D1 via the admin dashboard.
- Mirroring WCA acceptance, live results entry, or scramble distribution. Link to WCA / WCA Live; own-registration is a future UX layer, not a fork.
- Bangla UI in v1. Strings externalized for future `bn/` locale but English ships.
- Pipra Pay integration. Phase 2 uses PSO-licensed aggregators only.
- Gallery / volunteer public UI in v1 (models reserved, UI deferred).
- Regional sub-pages in v1. Competition history instead.
- Public volunteer tiers, public DOB/phones/addresses, claimant IDs on the lost-found log, YouTube URLs in image fields (stills only).
- Fabricated WCA regulation/article citations anywhere in UI or copy — link real WCA pages or say nothing.
- Phone-number collection in v1 (email-only opt-ins; phones need an explicit-consent flow).
