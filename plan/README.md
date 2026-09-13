# Plan — how execution is tracked

- `ROADMAP.md` — phased delivery plan. Mirrors `docs/product/FEATURE_LIST.md` (which gates scope) and `docs/architecture/ARCHITECTURE.md` (which gates stack).
- `BUILD_PLAN.md` — executable work packages WP-00…WP-53 (milestones M0–M5) with acceptance criteria, API/cron/secrets tables, and launch runbook. This is what gets built, in order.
- `DESIGN_REVIEW_ROUND2.md` — Stitch round-2 scorecard (fixed / partial / open / new issues) + pre-build punchlist consumed by BUILD_PLAN M5.
- `OPS_HANDOFF.md` — WP-00 human-only dashboard clicks (accounts, D1/KV/R2 IDs, Turnstile, Access, Resend, WCA OAuth, secrets, sync-worker deploy). Agents stop at this file's door and resume after "WP-00 done".
- Future per-sprint notes go here as `plan/sprint-YYYY-MM-DD.md` (create only when a sprint starts).

Rule: no code for unticked features. To change scope, tick the box in `FEATURE_LIST.md` via board review first, then update `ROADMAP.md` in the same PR.
