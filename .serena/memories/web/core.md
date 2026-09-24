# web/ — core

Rules and validation: `web/AGENTS.md`. Traps:

- Catalog is intentional: demo routes, `/design-system` and their components are kept on purpose even when `/` doesn't import them. Unimported ≠ dead code here; catalog cleanup is a manual review.
- shadcn style `base-rhea` sits on `@base-ui/react`: use the `render` prop (`<Button render={<Link/>}/>`), not `asChild`. Icons are phosphor.
- Next 16: `params`/`searchParams`/`cookies`/`headers` are async. Don't pass `--turbopack` (default). Read `web/node_modules/next/dist/docs/` before Next code (exists only after `pnpm install`).
- `lib/lead-api.ts` (`server-only`) is the only API caller; `app/page.tsx` turns an API error into `ApiErrorCard` instead of crashing. `components/leads/leads-panel.tsx` polls with `router.refresh()` every 5s while leads are `pending`. `/` metrics come from `summarize()` over the latest 200 leads (API max page, no totals endpoint), not the whole DB.
- `@gmui` entry criterion: a component already duplicated in two apps. Product imports `@/registry/gmui/...` so a broken item fails this build first.
- `@types/node` is still `^20` while runtime is Node 24 — intentional until a dependency bump is done deliberately.
