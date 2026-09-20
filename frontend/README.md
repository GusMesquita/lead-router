# lead-router dashboard

SPA React + TypeScript que lista os leads processados pelo backend (`GET /leads`), com score, motivo e status de despacho.

## Rodando localmente

```bash
npm install
cp .env.example .env   # VITE_API_URL e VITE_API_KEY, se a auth estiver ativa no backend
npm run dev
```

## Estrutura

```
src/
├── lib/api.ts             # cliente HTTP tipado para o backend
├── lib/scoreTier.ts        # regra pura de classificação de score (testada)
├── lib/leadStats.ts         # agregação por tier + filtro (testada)
├── components/               # LeadTable, ScoreBadge, StatFilterBar, SkeletonRows
└── index.css                  # entry point do Tailwind + tema (../../design-system)
```

Estilização é 100% Tailwind (utilities inline nos componentes) — não há CSS
próprio além do `@theme` compartilhado em `index.css`. O tema (cores,
gradiente de marca, animações) é copiado de
[`design-system/tailwind-theme.css`](../../design-system/tailwind-theme.css).

## Scripts

```bash
npm run dev       # dev server
npm run build     # tsc -b && vite build
npm run test      # vitest
npm run lint      # oxlint
```
