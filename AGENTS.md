# AGENTS.md — Speedcubing Bangladesh

This repo (`github.com/farhanulju/Speedcubing-Bangladesh`) is the source of truth for the entire organization and its website. Plans, web code, docs, and discussion live here. Read this file before any task.

## 0. Required reading (in order)

1. `README.md` — what this repo is.
2. `docs/START_HERE.md` — boundaries and source-of-truth order.
3. `docs/project-memory/CURRENT_STATE.md` — what exists, what is next.
4. `docs/product/FEATURE_LIST.md` — board-reviewed scope. Do not build unchecked items.
5. `docs/architecture/ARCHITECTURE.md` — Cloudflare-only stack + WCA caching rules.
6. Closest nested `AGENTS.md` (`web/AGENTS.md` for website work).
7. `docs/project-memory/DECISION_REGISTER.md` before changing a durable decision.

`CLAUDE.md` is a mirror of this file. Change both when you change a rule.

## 1. What lives where

| Path | Role |
|------|------|
| `docs/` | Durable meaning: vision, features, architecture, memory. No website content. |
| `plan/` | Execution: roadmap, MVP scope, review checklists. |
| `web/` | Website code: public site + `/dashboard` (WCA OAuth) + `/admin` (Access-gated). English v1. |
| `docs/project-memory/` | `CURRENT_STATE.md`, `DECISION_REGISTER.md`, `DEVELOPMENT_LOG.md` |

Do not create top-level folders without a decision entry. Do not store secrets (`.env`, API tokens, bKash numbers for production) in git. Use Cloudflare dashboard secrets + `.dev.vars` locally (gitignored). Do not store website content in git — content lives in D1 via the admin dashboard.

## 2. Hard rules

- **English only for v1.** No `bn/` routes, no Bangla CMS fields, no Bangla fonts. Structure content so a `bn` locale can be added later (D1 `locale` column + UI dictionaries, no hardcoded copy in components), but do not ship it.
- **Cloudflare free tier + two exceptions.** Pages, Workers, D1, KV, R2, Turnstile, Access. No Vercel, Supabase, Firebase, paid CMS, or Google Forms (no embeds/iframes). Exceptions (both recorded, neither may widen without a register entry): Resend free tier for transactional email only; Discourse only if a forum is ever approved. If free-tier limits block something else, log it in `DECISION_REGISTER.md` and degrade gracefully.
- **WCA is source of truth.** Competitions, results, persons, ranks, records come from WCA official API v0 (OAuth/WCIF) and the WST-endorsed unofficial REST API (daily static JSON) via a scheduled Worker cache. Users log in with WCA OAuth and validate their WCA ID; local rows mirror WCA and never replace its acceptance. Never scrape WCA HTML. Never invent results. Always link back to `worldcubeassociation.org` and `live.worldcubeassociation.org`.
- **One definition per concept.** Volunteer roster shape, competition announcement shape, and donation total logic are defined once (see `docs/architecture/ARCHITECTURE.md`) and reused by `web/`. D1 is the store; the admin dashboard is the editor.
- **Worlds fundraising is a separate page** (`/worlds-2027`), not a homepage section. Donation totals are edited in the admin dashboard in v1; automated reconciliation is Phase 2.
- **Repo holds no content.** `web/src/content/` is banned. Announcements, pages, people, sponsors, FAQ, news, comp overrides, and Worlds copy are D1 rows managed at `/admin` with Editor.js (allowlisted blocks, JSON → sanitized HTML).
- **Three surfaces.** Public site (ISR) + `/dashboard` (logged-in cuber: registrations, payment status, history) + `/admin` (content, announcements, payment verification queue, lost-found inbox). Admin routes + `admin:*` APIs require Cloudflare Access; user APIs require WCA OAuth session.
- **Payments are manual + human-verified in v1** via the payment dashboard (accept/reject + note + audit). TxID flow fails closed and BCCs the organizer inbox so nothing is silently lost.
- **Volunteer data is public by design** (name, focus area, member-since) but tiers/notes are internal-only. Never render internal fields (enforce at the query layer). Volunteer and gallery public UI are deferred in v1, but their tables/buckets stay reserved. Many members are minors — no public DOB, phone, or address. Photo only with consent.
- **No registration-phone scraping.** Broadcast/WhatsApp opt-ins must be explicit. Never reuse WCA registration contact data for marketing. v1 opt-ins are email-only.
- **Content accuracy is load-bearing.** One "Prospective WCA Regional Organization" lockup component, used everywhere. No fabricated WCA regulation/article citations — link real WCA pages or say nothing. Every displayed stat derives from the WCA-cache job. Host city is one admin value. Countdowns are day-precision unless <48h out. "LIVE" only for truly-live data. Internal feature tags and claimant IDs never render. bKash numbers masked + Reveal.
- **Mobile-first.** Mid-range Android on Bangladeshi networks is the baseline. Budget: <200 KB JS per route, images via R2 + resizing, no heavy client frameworks for content pages.
- **Money is whole taka.** All BDT amounts are integers. No paisa in UI, forms, or DB.

## 3. Working conventions

- Branch per change; never commit directly to `main` unless the repo owner asks. Open PRs with `gh`.
- Match surrounding code. Plain JavaScript/TypeScript, no new framework without a decision entry.
- Update docs as part of done: behavior change → `docs/product/FEATURE_LIST.md`; architecture/ownership change → `docs/architecture/ARCHITECTURE.md`; durable trade-off → `DECISION_REGISTER.md`; next-agent context → `CURRENT_STATE.md` + `DEVELOPMENT_LOG.md`.
- Before `checkout/commit/push`: run `git branch --show-current` and `git status --porcelain`. Do not move another agent's branch.
- Do not commit or push without explicit user confirmation, except a follow-up fix to an already-open PR.
- Verify with `npm run build` (web) or the command listed in `web/README.md` before asking for review.

## 4. Where deeper docs are

- Docs index: `docs/README.md`
- Feature review checklist: `docs/product/FEATURE_LIST.md`
- Architecture + diagram: `docs/architecture/ARCHITECTURE.md`
- Roadmap: `plan/ROADMAP.md`
- Executable build order: `plan/BUILD_PLAN.md` (work in WP order; do not skip Depends)
- Design scorecard + punchlist: `plan/DESIGN_REVIEW_ROUND2.md`
- Web runbook: `web/README.md` + `web/AGENTS.md`
