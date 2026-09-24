# web — dashboard do lead-router

Next.js 16 (App Router), React 19, Tailwind 4 e shadcn/ui.

```bash
pnpm install
cp .env.example .env.local   # LEAD_ROUTER_URL=http://localhost:8000
pnpm dev
```

Pela pilha inteira (`docker compose up --build` na raiz), o dashboard roda da
imagem de `web/Dockerfile` em http://localhost:3000 e fala com a API por
`http://api:8000` — o nome do serviço na rede do compose, porque `localhost`
dentro do container é o próprio container. A chave vem de
`LEAD_ROUTER_API_KEY` no `.env` da raiz, lida só no runtime do servidor; a
imagem não carrega segredo nenhum.

## Rotas

| Rota                | O que é                                                                  |
| ------------------- | ------------------------------------------------------------------------ |
| `/`                 | Produto: métricas e leads recentes, com dados reais da API               |
| `/design-system`    | Catálogo: fundamentos, componentes por família, produto, `@gmui`, blocos |
| `/dashboard`        | Demo de dashboard (sidebar, gráfico, tabela arrastável; `data.json`)     |
| `/dashboard01`      | Demo de dashboard (`components/dashboard-01`)                            |
| `/dashboard02`      | Demo de dashboard (`components/dashboard`)                               |
| `/startup`          | Landing de exemplo                                                       |
| `/login`, `/signup` | Formulários de exemplo                                                   |

## Dashboard de produto

`/` busca os 200 leads mais recentes (o máximo por página de `GET /leads`) e
calcula tudo sobre essa janela em `summarize()` (`lib/leads.ts`): total por
status, faixas quente/morno/frio e média só dos pontuados, e o resultado da
entrega dos `done` (despachado, não despachado, entrega falhou). A API não
expõe total nem agregados; com mais de 200 leads, a página avisa que os números
são da janela. Estados: carregando (`Suspense` + esqueleto), erro
(`ApiErrorCard`, com a saída para 401 e para API fora do ar), vazio (com o
`curl` de ingestão) e populado.

A sidebar do produto (`components/leads/product-shell.tsx`) só lista o que
existe: "Visão geral" e, no rodapé, o link para o catálogo. Leads, Roteamento,
Integrações etc. esperam endpoints que a API ainda não tem.

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
