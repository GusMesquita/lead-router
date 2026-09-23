# lead-router — core

Canonical sources (memories only add what they don't say):
- `AGENTS.md` — map, architecture/security invariants, validation commands (mirror CI), web catalog intent.
- `docs/processing-contract.md` — ingest/queue/retry/dispatch/idempotency semantics and accepted delivery limits.
- `web/AGENTS.md` — web-only rules; `README.md` — setup, Compose, migrations.

## Memories

- Backend traps not obvious from reading one module (arq/Redis behavior, retry classification, client lifecycles, Docker/Compose quirks): `mem:backend/core`.
- Web traps (base-ui API, Next 16 async APIs, catalog vs product, registry): `mem:web/core`.
- Style/test habits and macOS shell differences: `mem:conventions`.

## Global

- Docs and comments pt-BR, explaining the why; identifiers in English.
- Code/config/CI are the implemented state. If a doc disagrees, fix the doc in the same change.
- Toolchain: Node pinned in both `.nvmrc` (nvm, CI) and `.mise.toml` (mise's idiomatic `.nvmrc` reading is off by default) — bump both together. No `web/.nvmrc`.
- pnpm version has one owner: `packageManager` in `web/package.json` (Corepack locally, `pnpm/action-setup` in CI). Don't add pnpm to mise. Outside `web/` Corepack falls back to its latest pnpm — run pnpm only inside `web/`. Node 25+ no longer bundles Corepack: a Node bump past 24 needs a new pnpm setup story.
