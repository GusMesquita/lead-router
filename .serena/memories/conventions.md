# Conventions

- Minimal solution, no speculative abstraction; small slices, one PR each.
- Settings only via `app.config.settings`. Private helpers prefixed `_`. B008 ignored for FastAPI `Depends()`/`Header()`/`Query()` defaults.
- External failures: enrichment never raises (returns `cnpj_lookup_error`); scoring raises SDK errors or `ScoringError` (bad tool output → permanent) and the worker classifies (see `mem:backend/core`). No broader exception hierarchy.
- Tests must fail if the logic is removed — validate by mutation. A test passing with any implementation doesn't count.
- Web: pure logic in `lib/` with a Vitest test; data fetched in Server Components, Client Components get props; Prettier without semicolons, double quotes.

## macOS shell

- BSD `sed -i ''`; no `grep -P` (use `grep -E`/`rg`); no GNU `readlink -f`/`date -d`.
