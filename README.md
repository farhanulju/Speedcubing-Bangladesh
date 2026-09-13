# Speedcubing Bangladesh

Single source of truth for the organization, its website, and all discussion.

- Website (English for now, Bangla later): [`web/`](web/)
- What we are building and why: [`docs/`](docs/)
- Execution plans and review checklists: [`plan/`](plan/)

## How this repo is used

1. **Discuss here, not in chat threads.** Decisions land in `docs/project-memory/DECISION_REGISTER.md`. Context that the next person needs lands in `docs/project-memory/CURRENT_STATE.md`.
2. **Plan here.** `plan/ROADMAP.md` is the phased scope. `docs/product/FEATURE_LIST.md` is the review checklist the board ticks to decide what ships immediately.
3. **Build here.** `web/` will hold the Cloudflare-only website (Pages + Workers + D1 + R2). English only for v1. Bangla is a future locale, not a v1 blocker.
4. **Announce here.** Competition announcements, volunteer roster, and Worlds 2027 fundraising page content are managed as data/content in this repo, rendered by `web/`.

## Quick links

- Start: `docs/START_HERE.md`
- Current state: `docs/project-memory/CURRENT_STATE.md`
- Feature list for review: `docs/product/FEATURE_LIST.md`
- Architecture (Cloudflare-only): `docs/architecture/ARCHITECTURE.md`
- Roadmap: `plan/ROADMAP.md`
- Agent rules: `AGENTS.md` (mirrored in `CLAUDE.md` for Claude Code)

## Conventions

- English only in code, docs, and UI for v1. Do not add Bangla routes, fonts, or CMS fields until a decision entry approves it.
- Cloudflare free tier only. No Vercel, no paid DB, no external CMS. See `docs/architecture/ARCHITECTURE.md`.
- WCA is source of truth for competitions, results, persons, and records. We cache, never fork.
- One definition per concept. No duplicated logic between docs and code — docs define, code implements.
