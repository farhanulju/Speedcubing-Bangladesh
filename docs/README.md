# Docs — index

Canonical documentation map. Code may drift; this index tells you which doc wins.

## Start here

- `START_HERE.md` — boundaries, source-of-truth order, how to add docs.

## Product (what and why)

- `product/FEATURE_LIST.md` — board review checklist: MVP vs Phase 2 vs Future. **This is the scope gate.**

## Architecture (how, Cloudflare-only)

- `architecture/ARCHITECTURE.md` — stack, data ownership, WCA caching, content/volunteer/announcement models, diagram.

## Memory (where we are)

- `project-memory/CURRENT_STATE.md` — implemented state, focus, gaps.
- `project-memory/DECISION_REGISTER.md` — durable decisions with dates and rationale.
- `project-memory/DEVELOPMENT_LOG.md` — dated build log, newest first.

## Placement rule

Shared meaning and coordination live here in `docs/`. Implementation details and runbooks live in `web/README.md` and `plan/`. If a doc and code disagree, code wins for behavior but the doc must be updated in the same PR.
