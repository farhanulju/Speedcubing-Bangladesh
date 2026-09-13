# Speedcubing Bangladesh

Single source of truth for the organization, its website, and all discussion.

- Website (English for now, Bangla later): [`web/`](web/)
- What we are building and why: [`docs/`](docs/)
- Execution plans and review checklists: [`plan/`](plan/)

## How this repo is used

1. **Discuss here, not in chat threads.** Decisions land in `docs/project-memory/DECISION_REGISTER.md`. Context that the next person needs lands in `docs/project-memory/CURRENT_STATE.md`.
2. **Plan here.** `plan/ROADMAP.md` is the phased scope. `docs/product/FEATURE_LIST.md` is the review checklist the board ticks to decide what ships immediately.
3. **Build here.** `web/` will hold the Cloudflare-only website: public site + user dashboard (WCA OAuth) + admin dashboard (Access-gated). English only for v1. Bangla is a future locale, not a v1 blocker.
4. **Announce and manage here.** Competition announcements, people, sponsors, news, and Worlds 2027 content are managed in the admin dashboard (D1) — the repo holds plans and code, never content. No Google Forms.

## Quick links

- Start: `docs/START_HERE.md`
- Current state: `docs/project-memory/CURRENT_STATE.md`
- Feature list for review: `docs/product/FEATURE_LIST.md`
- Architecture (Cloudflare-only): `docs/architecture/ARCHITECTURE.md`
- Roadmap: `plan/ROADMAP.md`
- Build order: `plan/BUILD_PLAN.md`
- Agent rules: `AGENTS.md` (mirrored in `CLAUDE.md` for Claude Code)

## Conventions

- English only in code, docs, and UI for v1. Do not add Bangla routes or fonts until a decision entry approves it (D1 `locale` column + dictionaries keep it future-ready).
- Cloudflare free tier + two narrow exceptions (Resend transactional email; Discourse only if a forum is ever approved). No Vercel, no paid DB, no external CMS, no Google Forms. See `docs/architecture/ARCHITECTURE.md`.
- WCA is source of truth for competitions, results, persons, and records. We cache, never fork.
- One definition per concept. No duplicated logic between docs and code — docs define, code implements.
