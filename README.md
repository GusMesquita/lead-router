# lead-router

Motor genérico de ingestão, enriquecimento, pontuação e roteamento de leads. Recebe um lead via webhook, decide com um LLM se ele vale a pena, persiste o resultado e despacha para um webhook configurável (Slack, n8n, CRM) — sem lógica de nenhum CRM específico embutida.

Não é um CRM: é a peça que decide **o que fazer** com um lead antes de ele chegar a um.

## Fluxo

```
POST /leads/ingest ──▶ grava `pending` ──▶ enfileira (Redis/arq) ──▶ 202 { id, status }
                                                  │
                                                  ▼
                 worker: enriquecimento (CNPJ via BrasilAPI, opcional)
                         → pontuação (Claude, 0-100, via tool use)
                         → dispatch (webhook com allowlist e assinatura HMAC)
                         → `done` ou `failed`

GET /leads/{id} → status e resultado     GET /leads → histórico paginado (usado por web/)
```

O POST não espera o LLM: `score` e `reasoning` ficam nulos enquanto o lead está `pending`. Retry, idempotência, falhas de entrega e limites aceitos estão em **[docs/processing-contract.md](docs/processing-contract.md)**.

```
app/
├── main.py            # rotas HTTP e ingestão (grava + enfileira)
├── worker.py          # job do arq: enrich → score → dispatch
├── queue.py           # pool Redis e enqueue
├── enrichment.py      # BrasilAPI
├── scoring.py         # único lugar com decisão de IA
├── dispatch.py        # webhook de saída
├── repository.py      # único lugar com SQL
├── auth.py, ratelimit.py, config.py, logging_config.py, models.py
└── db/                # entidades SQLModel e sessão async
alembic/               # dono do schema
web/                   # dashboard Next.js e catálogo de componentes
```

## Rodando localmente

```bash
uv sync
cp .env.example .env              # ANTHROPIC_API_KEY; API_KEYS ou ENVIRONMENT=dev
uv run alembic upgrade head
docker run -d -p 6379:6379 redis:8-alpine

uv run uvicorn app.main:app --reload     # API
uv run arq app.worker.WorkerSettings     # worker, noutro terminal
```

Sem o worker o lead fica `pending` para sempre; sem o Redis o POST responde `503`.

```bash
curl -X POST localhost:8000/leads/ingest \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -H "Idempotency-Key: form-2026-09-21-ana" \
  -d '{"name": "Ana", "email": "ana@exemplo.com", "cnpj": "19131243000197", "message": "Quero uma demo esta semana"}'
# → 202 {"id": "...", "status": "pending"}

curl localhost:8000/leads/<id> -H "X-API-Key: $API_KEY"
```

### Docker Compose

```bash
docker compose up --build
```

Sobe a pilha inteira: Redis, a API em http://localhost:8000 (rodando `alembic upgrade head` antes de servir), o worker e o dashboard em http://localhost:3000, com o SQLite num volume compartilhado. API e worker usam a imagem da raiz; o dashboard, a de `web/Dockerfile` (build de produção, standalone, sem segredo embutido). O dashboard só sobe depois do healthcheck da API e fala com ela por `http://api:8000`, na rede do compose; defina `LEAD_ROUTER_API_KEY` no `.env` com uma das `API_KEYS`. As variáveis vêm do ambiente ou de `.env`. O container roda como usuário sem privilégio; um volume `lead_data` criado por uma versão antiga da imagem (como root) precisa de `docker compose down -v`.

## Migrações

O schema é do **Alembic**; não existe `create_all`. Os testes rodam as migrações de verdade, e o CI falha se os modelos divergirem delas. A URL vem de `app/config.py`, não do `alembic.ini`.

```bash
uv run alembic upgrade head
uv run alembic revision --autogenerate -m "descrição"
uv run alembic check                  # modelos × migrações
```

## Dashboard (web/)

Next.js com a chave da API só no servidor. Detalhes, rotas e a registry `@gmui` em [web/README.md](web/README.md).

```bash
nvm use                               # Node de .nvmrc (na primeira vez: nvm install)
corepack enable                       # pnpm na versão do packageManager de web/package.json
cd web
pnpm install
cp .env.example .env.local            # LEAD_ROUTER_URL, LEAD_ROUTER_API_KEY
pnpm dev
```

## Validação (o mesmo que o CI roda)

```bash
uv sync --locked
uv run ruff check .
uv run ruff format --check .
uv run pytest -q
DATABASE_URL=sqlite+aiosqlite:////tmp/check.db sh -c 'uv run alembic upgrade head && uv run alembic check'

cd web
pnpm install --frozen-lockfile
pnpm lint && pnpm typecheck && pnpm test
pnpm registry:build && git diff --exit-code public/r
pnpm build

docker build -t lead-router-api .
docker build -f web/Dockerfile -t lead-router-web .
```

O Node vem de `.nvmrc` (mise lê `.mise.toml`, com a mesma versão); o pnpm, do `packageManager` de `web/package.json`, que o Corepack local e o `pnpm/action-setup` do CI leem.

## Segurança e operação

- **Autenticação fail-closed.** `/leads*` exigem `X-API-Key` (chaves em `API_KEYS`). Com `ENVIRONMENT=prod` (o default) e `API_KEYS` vazio, o app não sobe; para rodar sem chave, use `ENVIRONMENT=dev` explicitamente.
- **Rate limit** por chave (ou IP) em memória, por réplica: `RATE_LIMIT_PER_MINUTE`.
- **Webhook de saída** só em `https` e em host de `WEBHOOK_ALLOWED_HOSTS`, validado na subida da API e do worker; assinado com `WEBHOOK_SIGNING_SECRET` quando definido.
- **Sem PII nem mensagem de erro externa em log ou no banco:** e-mail mascarado, `error` guarda só a classe da exceção.
- **CORS** vazio por padrão: o dashboard chama a API pelo servidor. O CI constrói o `web/` com uma chave-canário e falha se ela aparecer no bundle do browser.
- **CI** também roda gitleaks, `pip-audit` e `pnpm audit`.
