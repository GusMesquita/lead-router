# lead-router dashboard

SPA React + TypeScript que lista os leads processados pelo backend (`GET /leads`), com score, motivo e status de despacho.

## Rodando localmente

```bash
npm install
cp .env.example .env   # VITE_API_URL
npm run dev
```

## Estrutura

```
src/
├── lib/api.ts             # cliente HTTP tipado para o backend
├── lib/scoreTier.ts        # regra pura de classificação de score (testada)
├── lib/leadStats.ts         # agregação por tier + filtro (testada)
├── components/               # LeadTable, ScoreBadge, StatFilterBar, SkeletonRows
└── index.css                  # entry point do Tailwind + tema (fonte de verdade)
```

Estilização é 100% Tailwind (utilities inline nos componentes) — não há CSS
próprio além do bloco `@theme` em `src/index.css`, que é a única fonte de
verdade de cores, tipografia e animações deste app. O tema é mantido **dentro
deste repositório**: nada aqui depende de um pacote ou diretório externo.

## Scripts

```bash
npm run dev       # dev server
npm run build     # tsc -b && vite build
npm run test      # vitest
npm run lint      # oxlint
```
