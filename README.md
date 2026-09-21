# lead-router

Motor genérico de ingestão, enriquecimento, pontuação e roteamento de leads. Recebe um lead via webhook, decide se vale a pena (com um LLM), persiste o resultado, e despacha pra onde você quiser — sem lógica de negócio de nenhum CRM específico embutida.

A ingestão é **assíncrona**: o POST grava e enfileira, e o trabalho caro roda num worker.

```
POST /leads/ingest (requer X-API-Key)
        │
        ├──▶ grava o lead como `pending` ──▶ 202 { id, status }
        │
        ▼
   fila (Redis / arq)
        │
        ▼
   worker: enrichment (CNPJ via BrasilAPI / brasilapi-mcp-server)
        │
        ▼
           scoring (Claude Haiku — 0 a 100)   ── ver docs/AGENT_BEHAVIOR.md
        │
        ▼
           dispatch (webhook configurável — Slack, n8n, CRM, o que for)
        │
        ▼
           lead vira `done` (ou `failed`, com a classe do erro)

GET /leads/{id} (requer X-API-Key) → status e resultado daquele lead
GET /leads      (requer X-API-Key) → histórico paginado, consumido pelo dashboard em frontend/
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

`/leads/ingest` e `/leads` exigem o header `X-API-Key`. As chaves aceitas vêm de `API_KEYS` (string separada por vírgula).

O comportamento é **fail-closed**: com `ENVIRONMENT=prod` (o default) e `API_KEYS` vazio, o app **não sobe** — levanta `RuntimeError` na inicialização. Antes ele subia com a autenticação silenciosamente desligada, que é a pior combinação possível: parece funcionando e está aberto. Para rodar local sem chave, use `ENVIRONMENT=dev` explicitamente. Ver `app/auth.py`.

É autenticação de serviço-para-serviço (API key), não login de usuário: quem chama este serviço são webhooks, n8n, ou outro backend — não um navegador com sessão. Um shared secret no header é a ferramenta certa aqui; JWT/cookies de sessão seriam a ferramenta errada para uma API máquina-a-máquina.

## Por que 202 e não 200 com o resultado

`enrich → score → dispatch` leva segundos e depende de dois serviços externos. Fazer isso dentro do POST amarrava a resposta a eles: qualquer lentidão da BrasilAPI ou da Anthropic virava timeout para quem preencheu o formulário, e um pico de leads abria uma chamada de LLM por requisição, sem controle nenhum.

Agora o POST só grava e enfileira. O resultado sai em `GET /leads/{id}`, onde `score` e `reasoning` são **nulos enquanto `status == "pending"`** — não é campo opcional, é campo que ainda não existe.

## Idempotência

Mande `Idempotency-Key` no header e o replay devolve o **mesmo** `id`, sem criar outro lead e sem enfileirar outro job. Isso importa porque cada job custa uma chamada de LLM, e retry de formulário e reentrega de webhook são a regra, não a exceção.

A garantia é um **índice único** no banco, não uma checagem em memória: duas requisições simultâneas com a mesma chave não conseguem criar dois leads — a que perde a corrida recebe o id da que ganhou.

## Persistência e migrações

Os leads vivem na tabela `leads` (SQLite por padrão via `DATABASE_URL=sqlite+aiosqlite:///./lead_router.db`; troque para Postgres apontando a mesma variável para `postgresql+asyncpg://...` sem mudar código).

O schema é do **Alembic** — não existe `create_all` em lugar nenhum. Duas fontes de verdade para o mesmo schema é como o banco de produção fica diferente do que os testes exercitam; aqui os testes rodam as migrações de verdade (`tests/conftest.py`), então esquecer a migração quebra o CI.

```bash
uv run alembic upgrade head           # aplica
uv run alembic revision --autogenerate -m "descrição"
```

A URL vem de `app/config.py`, nunca do `alembic.ini`.

## Rodando localmente

```bash
uv sync
cp .env.example .env   # preencha ANTHROPIC_API_KEY e API_KEYS
uv run alembic upgrade head
docker run -d -p 6379:6379 redis:8-alpine   # a fila do worker

uv run uvicorn app.main:app --reload        # API
uv run arq app.worker.WorkerSettings         # worker, noutro terminal
```

Sem o worker de pé o lead fica em `pending` para sempre: a API aceita e enfileira, mas ninguém consome.

```bash
export API_KEY=...   # uma das chaves de API_KEYS

curl -X POST localhost:8000/leads/ingest \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -H "Idempotency-Key: form-2026-09-21-ana" \
  -d '{"name": "Ana", "email": "ana@exemplo.com", "cnpj": "19131243000197", "message": "Quero uma demo esta semana"}'
# → 202 {"id": "...", "status": "pending"}

curl localhost:8000/leads/<id> -H "X-API-Key: $API_KEY"
curl localhost:8000/leads -H "X-API-Key: $API_KEY"
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
