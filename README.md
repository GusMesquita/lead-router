# lead-router

Motor genérico de ingestão, enriquecimento, pontuação e roteamento de leads. Recebe um lead via webhook, decide se vale a pena (com um LLM), persiste o resultado, e despacha pra onde você quiser — sem lógica de negócio de nenhum CRM específico embutida.

```
POST /leads/ingest (requer X-API-Key)
        │
        ▼
   enrichment (CNPJ via BrasilAPI / brasilapi-mcp-server)
        │
        ▼
   scoring (Claude Haiku — 0 a 100)   ── ver docs/AGENT_BEHAVIOR.md
        │
        ▼
   persistência (SQLite/Postgres via SQLModel)
        │
        ▼
   dispatch (webhook configurável — Slack, n8n, CRM, o que for)

GET /leads (requer X-API-Key) → histórico paginado, consumido pelo dashboard em frontend/
```

## Por que existe

Toda automação de "lead chegou, qualifica e manda pra algum lugar" repete essa mesma forma. Este projeto isola essa forma como um serviço reutilizável, plugável em qualquer stack via webhook — não é um CRM, é a peça que decide **o que fazer** com um lead antes dele chegar num CRM.

## Arquitetura

```
app/
├── main.py         # rotas HTTP — sem lógica de negócio
├── auth.py         # dependência de autenticação (X-API-Key)
├── config.py       # settings via env (pydantic-settings)
├── models.py       # schemas Pydantic de entrada/saída da API
├── enrichment.py   # busca dados externos (BrasilAPI)
├── scoring.py       # chamada ao LLM — único lugar com decisão de IA
├── dispatch.py      # envia resultado pro destino configurado
├── repository.py    # única camada que fala SQL
└── db/
    ├── models.py     # entidades SQLModel (schema do banco)
    └── session.py    # engine/sessão async
```

Cada camada tem uma responsabilidade e não pula a próxima: rotas não montam SQL, o repositório não sabe nada sobre HTTP, o scoring não sabe nada sobre persistência.

## Autenticação

`/leads/ingest` e `/leads` exigem o header `X-API-Key`. As chaves aceitas vêm de `API_KEYS` (uma string separada por vírgula) — se `API_KEYS` estiver vazio, a autenticação fica **desabilitada** (conveniente para rodar local, nunca aceitável em produção). Ver `app/auth.py`.

É autenticação de serviço-para-serviço (API key), não login de usuário: quem chama este serviço são webhooks, n8n, ou outro backend — não um navegador com sessão. Um shared secret no header é a ferramenta certa aqui; JWT/cookies de sessão seriam a ferramenta errada para uma API máquina-a-máquina.

## Persistência

Cada resultado de `/leads/ingest` é salvo em `leads` (SQLite por padrão via `DATABASE_URL=sqlite+aiosqlite:///./lead_router.db`; troque para Postgres apontando a mesma variável para `postgresql+asyncpg://...` sem mudar código). `GET /leads` lista os últimos leads processados, paginado (`limit`/`offset`), para alimentar o [dashboard](./frontend).

## Rodando localmente

```bash
uv sync
cp .env.example .env   # preencha ANTHROPIC_API_KEY e API_KEYS
uv run uvicorn app.main:app --reload
```

```bash
curl -X POST localhost:8000/leads/ingest \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sua-chave" \
  -d '{"name": "Ana", "email": "ana@exemplo.com", "cnpj": "19131243000197", "message": "Quero uma demo esta semana"}'

curl localhost:8000/leads -H "X-API-Key: sua-chave"
```

Ou via Docker:

```bash
docker build -t lead-router .
docker run -p 8000:8000 --env-file .env lead-router
```

## Dashboard (frontend)

Veja [frontend/](./frontend) — SPA React que lista os leads processados e seus scores, consumindo `GET /leads`.

## Integrações

- **Enriquecimento**: usa a [BrasilAPI](https://brasilapi.com.br) diretamente por padrão; aponte `BRASILAPI_URL` para uma instância do `brasilapi-mcp-server` rodando em modo HTTP se preferir centralizar.
- **Orquestração externa**: um workflow n8n pode chamar `/leads/ingest` como um HTTP Request node — veja `n8n-ai-cookbook`.
- **Base de conhecimento**: para responder perguntas do lead automaticamente antes do roteamento, chame o `rag-starter-kit` como um passo extra.

## Testes

```bash
uv sync --group dev
uv run pytest
uv run ruff check .
```

## Roadmap

- [ ] Fila (ex: Redis) para lidar com picos de webhooks sem bloquear a resposta HTTP
- [ ] Suporte a múltiplos destinos de dispatch simultâneos
- [ ] Migrations com Alembic (hoje o schema é criado via `create_all` — ok para um starter kit, não para evolução de schema em produção)
