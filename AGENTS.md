# AGENTS.md

Instruções canônicas para agentes de código neste repositório, independentes de
ferramenta. O `README.md` explica o produto e o setup; este arquivo diz o que
não pode quebrar. Regras do `web/` ficam em `web/AGENTS.md`.

## Mapa

| Caminho | O que é |
| --- | --- |
| `app/` | API FastAPI e worker arq, num pacote plano — um módulo por responsabilidade |
| `app/db/` | entidades SQLModel e sessão async |
| `alembic/` | migrações; dono único do schema |
| `tests/` | pytest; o `conftest.py` roda `alembic upgrade head` num SQLite temporário |
| `docs/processing-contract.md` | contrato de ingestão, fila, retry, dispatch e idempotência |
| `web/` | dashboard Next.js + catálogo manual de componentes e demos (ver `web/AGENTS.md`) |
| `web/registry/gmui/` | fonte da registry shadcn `@gmui` publicada em `web/public/r/` |

## Fronteira backend × web

O `web/` fala com a API só por HTTP, só no servidor (`web/lib/lead-api.ts`,
`server-only`), com `LEAD_ROUTER_URL` e `LEAD_ROUTER_API_KEY`. Não há código
compartilhado entre os dois lados: mudar o shape de `LeadRecord` na API exige
mudar `web/lib/leads.ts` na mesma alteração.

## Invariantes de arquitetura

- `app/` continua plano. Não criar camadas (`services/`, `domain/`, `adapters/`)
  nem interfaces com uma implementação só.
- **SQL só em `app/repository.py`.** Rotas e worker chamam funções do
  repositório; o repositório não sabe de HTTP.
- **O schema é do Alembic.** Não existe e não deve existir `create_all`. Mudou
  `app/db/models.py` → gere a migração na mesma alteração
  (`uv run alembic revision --autogenerate`). `uv run alembic check` falha se
  os dois divergirem. A URL do banco vem de `app/config.py`, não do `alembic.ini`.
- **LLM só em `app/scoring.py`**, com saída por tool use e clamp — nunca
  `json.loads` em texto do modelo.
- O POST não faz trabalho caro: grava, enfileira e responde 202. O resto é do
  worker.

## Worker e fila

Antes de mexer em `app/main.py` (ingestão), `app/queue.py`, `app/worker.py`,
`app/scoring.py` ou `app/dispatch.py`, leia `docs/processing-contract.md`. Ele
descreve o que é transitório, quando há retry, por que o dispatch não retenta e
quais limites de entrega são aceitos. Não adicionar DLQ, outbox, status novos
nem reprocessamento sem pedido explícito — são decisões de produto, não
correções. Mudou o comportamento, atualize o contrato na mesma alteração.

## Invariantes de segurança

- **Fail-closed na subida:** `ENVIRONMENT=prod` sem `API_KEYS` não sobe;
  webhook sem `https` ou fora de `WEBHOOK_ALLOWED_HOSTS` derruba API e worker.
  Não trocar erro de configuração por aviso.
- **O modelo nunca vê** destinos, URLs, chaves nem configuração — só o lead e o
  enriquecimento, delimitados em `<lead>`.
- **Nada de PII ou mensagem de serviço externo em log, banco ou resposta:**
  e-mail passa por `mask_email`; `error` guarda só `type(exc).__name__`.
- Webhook de saída: só 2xx conta, redirect não é seguido.
- No `web/`, a chave da API nunca ganha prefixo `NEXT_PUBLIC_` nem é importada
  de Client Component.
- Segredos só em `.env` (ignorado); `.env.example` leva placeholders vazios. O
  CI roda gitleaks.

## Validação (espelha `.github/workflows/ci.yml`)

```bash
uv sync --locked
uv run ruff check .
uv run ruff format --check .
uv run pytest -q
DATABASE_URL=sqlite+aiosqlite:////tmp/check.db sh -c 'uv run alembic upgrade head && uv run alembic check'
docker build -t lead-router .
```

Para o `web/`, os comandos estão em `web/AGENTS.md`. O Node vem de `.nvmrc`
(e de `.mise.toml`, com a mesma versão); o pnpm, do `packageManager` de
`web/package.json`. Lockfiles (`uv.lock`, `web/pnpm-lock.yaml`) só mudam pelo
gerenciador, nunca à mão.

## Catálogo web e registry

- As rotas de demo (`/dashboard*`, `/login`, `/signup`, `/startup`), a página
  `/design-system` e as coleções em `web/components/` são um **catálogo manual
  intencional**. Não apagar rota, componente ou dependência por não ser
  importado pela rota de produto (`/`) — "sem import" aqui não significa
  código morto.
- `web/registry/gmui/` é a fonte da registry `@gmui`; `web/public/r/` é gerado
  por `pnpm registry:build` e o CI falha se estiver desatualizado. Não editar
  `public/r/` à mão.
- `web/components/ui`, `bjork-ui` e `beste` são código de registries de
  terceiros: não editar à mão; atualizar pelo `shadcn add`.

## Arquivos gerados — preservar

- O bloco entre `<!-- BEGIN:nextjs-agent-rules -->` e
  `<!-- END:nextjs-agent-rules -->` em `web/AGENTS.md`.
- `web/public/r/`, `uv.lock`, `web/pnpm-lock.yaml`, `alembic/versions/` já
  aplicadas (migração nova em vez de editar uma antiga).

## Navegação

Ferramentas de IA (Serena, Graphify, Claude Code, Headroom) são **opcionais**:
nada no build, nos testes ou no CI depende delas. Ordem sugerida:

1. Este arquivo, o `README.md` e `docs/processing-contract.md`.
2. Serena, se disponível, para símbolos, referências e as memórias em
   `.serena/memories/`.
3. Graphify, se disponível, só para perguntas estruturais de verdade
   (dependências entre módulos, caminhos entre componentes). A saída vai para
   `graphify-out/`, que é ignorado pelo git.
4. Abrir o mínimo de arquivos-fonte necessário.
