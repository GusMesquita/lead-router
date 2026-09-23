<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# web/

Regras gerais do repositório em `../AGENTS.md`; aqui só o que é do `web/`.

## Produto × catálogo

- **Produto:** a rota `/` (`app/page.tsx`), `components/leads/`, `lib/` e
  `registry/gmui/`. É o que consome a API.
- **Catálogo manual, intencional:** `/design-system`, as demos `/dashboard`,
  `/dashboard01`, `/dashboard02`, `/login`, `/signup`, `/startup` e os
  componentes que só elas usam (`components/dashboard*`, `components/startup`,
  `components/beste`, `components/bjork-ui`, os `nav-*`, `app-sidebar` etc.).
- Não apagar rota, componente ou dependência do catálogo por não ser importado
  por `/`. Limpeza do catálogo é revisão manual, fora de tarefas de agente.

## Fronteira de segurança

- `lib/lead-api.ts` é o único módulo que chama a API e importa `server-only`:
  importá-lo de um arquivo `"use client"` quebra o build, e é para quebrar.
- A chave vem de `LEAD_ROUTER_API_KEY`, nunca com prefixo `NEXT_PUBLIC_`. Os
  dados chegam aos Client Components por props, já buscados no servidor.
- O CI constrói com uma chave-canário e falha se ela aparecer em
  `.next/static`.

## Registry `@gmui`

- A fonte fica em `registry/gmui/` e é declarada em `registry.json`;
  `public/r/` é gerado por `pnpm registry:build`. Mudou a fonte, rode o build
  e versione o `public/r/` junto.
- O produto importa de `@/registry/gmui/...`, não de uma cópia.
- `components/ui`, `components/bjork-ui` e `components/beste` vêm de
  registries de terceiros: ficam fora do lint e não são editados à mão.

## Validação (espelha o job `web` do CI)

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm registry:build && git diff --exit-code public/r
LEAD_ROUTER_API_KEY=canario pnpm build && ! grep -rq canario .next/static
```
