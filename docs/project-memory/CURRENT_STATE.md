# CURRENT_STATE

Updated: 2026-09-14. Newest first. This is the file the next agent reads to avoid reconstructing context from chat.

## Implemented

- Repo scaffolded as org source of truth (`README.md`, `AGENTS.md`/`CLAUDE.md`, `docs/`, `plan/`, `web/`). No website code yet.
- Scope research done: WCC + SCA teardowns, WCA official v0 + unofficial REST API capabilities, BD payment options (manual bKash/Nagad now; SSLCommerz/ShurjoPay later).
- Board agreements captured: English-only v1, Worlds fundraising = separate page, volunteer roster public (tiers internal), Cloudflare-only, competition announcements managed in-repo.

## Current focus

- Board review of `docs/product/FEATURE_LIST.md` + `docs/architecture/ARCHITECTURE.md` to tick what ships immediately (MVP).
- Then scaffold `web/` (static site on Cloudflare Pages + Workers cron for WCA cache + D1 for volunteers/announcements/forms + R2 for gallery).

## Gaps / unknowns

- Bank account (org name vs individual) pending verification with WCA/banks.
- Payment number ownership + TxID verification owner undefined.
- Photo-consent process for minors undefined.
- Newsletter provider choice (Brevo vs Cloudflare-only alternative) undefined — must stay free-tier.
- Volunteer application fields + approver undefined.
- Worlds 2027 candidate list + refund policy undefined.
