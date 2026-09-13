# CURRENT_STATE

Updated: 2026-09-14 (board review applied). Newest first. This is the file the next agent reads to avoid reconstructing context from chat.

## Implemented

- Repo scaffolded as org source of truth (`README.md`, `AGENTS.md`/`CLAUDE.md`, `docs/`, `plan/`, `web/`). No website code yet.
- Scope research done: WCC + SCA teardowns, WCA official v0 + unofficial REST API capabilities, BD payment options (manual bKash/Nagad now; SSLCommerz/ShurjoPay later).
- Board review applied 2026-09-14: MVP = A1–A8, A11–A21 (records promoted, WCA auth + user dashboard, admin dashboard, payment dashboard, news, competition history). Deferred: volunteer UI (A9), gallery UI (A10), search, school, membership, regional pages. No Google Forms. Repo holds no content — D1 + admin dashboard is the CMS. TipTap chosen for rich text. Full list in `DECISION_REGISTER.md`.

## Current focus

- Confirm remaining unknowns below, provision Cloudflare (account, D1, KV, R2, Access, Turnstile) + WCA OAuth app, then scaffold `web/` per `plan/ROADMAP.md` Phase 1.
- D1 schema first (content tables + competitor/registration/tx queue + lost-found + donors), then admin dashboard, then public pages, then user dashboard + payment queue wiring.

## Gaps / unknowns

- Bank account (org name vs individual) pending verification with WCA/banks.
- Payment number ownership + TxID verifier roster undefined.
- Photo-consent process for minors undefined.
- Newsletter provider choice undefined — must stay free-tier.
- Worlds 2027 candidate list + refund policy undefined (page shape approved, content pending).
- WCA OAuth app credentials + redirect URLs undefined.
- Cloudflare Access seats + admin list undefined.
