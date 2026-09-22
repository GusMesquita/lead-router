# web — dashboard do lead-router

Next.js 16 (App Router), React 19, Tailwind 4 e shadcn/ui.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

## Rotas

| Rota             | O que é                                                        |
| ---------------- | -------------------------------------------------------------- |
| `/`              | Dashboard de leads — faixas, pendentes e motivo da pontuação    |
| `/design-system` | Os componentes numa página só                                   |
| `/startup`       | Landing de exemplo                                              |
| `/dashboard*`    | Templates de dashboard que vieram dos registries                |

## Onde a chave fica

`lib/lead-api.ts` é o único módulo que fala com a API, e ele importa
`server-only`: importá-lo de um Client Component é **erro de build**, não um
segredo publicado. A chave vem de `LEAD_ROUTER_API_KEY` — sem prefixo
`NEXT_PUBLIC_`, que é o que inlina valores no bundle.

O dashboard é um Server Component; a tabela recebe os leads já prontos por props.
Quando há lead `pending`, ela chama `router.refresh()` a cada 5s — a pontuação
acontece num worker, fora desta aba.

## Componentes

Os componentes de registry (`components/ui`, `components/bjork-ui`,
`components/beste`) são código de terceiro versionado aqui e ficam fora do lint:
lintá-los só produz ruído que some no próximo `shadcn add`.

```bash
pnpm dlx shadcn@latest add <componente>
```

## A registry `@gmui`

Este app **hospeda** a registry do portfólio: a fonte fica em `registry/gmui/`,
`pnpm registry:build` gera `public/r/*.json` e o Next serve os arquivos.

```jsonc
// components.json do consumidor
"registries": {
  "@gmui": "https://raw.githubusercontent.com/GusMesquita/lead-router/main/web/public/r/{name}.json"
}
```

```bash
pnpm dlx shadcn@latest add @gmui/api-error-card
```

O critério para um componente entrar é estreito: **dois apps já o duplicam**.
Hoje isso vale para um item só. Um tema `@gmui` não entrou porque republicaria
os tokens neutros que o shadcn já entrega.

Este app importa o item de `@/registry/gmui/...`, não de uma cópia — assim um
componente quebrado derruba o build daqui antes de chegar a quem instala. O CI
roda `registry:build` e falha se `public/r/` estiver desatualizado.

## Verificação

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
