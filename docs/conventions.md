# Convenções deste repositório

Este documento é auto-contido: não depende de nenhum outro repositório.

## Ambiente

- **Python 3.13.13** e **Node 26.9.0**, declarados em `.mise.toml` (e `.nvmrc` para quem
  usa nvm). Com [mise](https://mise.jdx.dev): `mise install` resolve as duas de uma vez.
  Com nvm: `nvm use` lê o `.nvmrc`.
- **Dependências Python**: `uv`, com `[dependency-groups] dev = [...]` — não
  `[project.optional-dependencies]`, que `uv sync --group dev` não reconhece.
- `uv.lock` e `package-lock.json` são commitados.

## Backend

- **FastAPI + uvicorn**, com `lifespan` (não `@app.on_event`, deprecado) para
  inicializar recursos.
- **Lint**: `ruff check .` e `ruff format .`, `select = ["E","F","I","UP","B"]`,
  `ignore = ["B008"]` — FastAPI usa `Depends()`/`Query()` como default de argumento por
  design; é o idiom do framework, não um bug.
- **Persistência**: SQLModel + `sqlalchemy.ext.asyncio`, com `greenlet` declarado
  explicitamente (a ponte async do SQLAlchemy exige em runtime, mas não o declara como
  dependência transitiva). **Toda query SQL vive em `app/repository.py`** — nenhuma outra
  camada monta SQL.
- **Erros de API externa**: hierarquia de exceções tipada, para `isinstance()` em vez de
  comparação de string. 404 não é re-tentado; 429/5xx usam backoff exponencial.
- **Logging**: JSON estruturado em `stderr`. Nunca logar `X-API-Key` nem o conteúdo
  integral de um lead; e-mail vai mascarado.

## Segurança

- **Autenticação**: header `X-API-Key` comparado com `secrets.compare_digest` (timing-safe).
  Não é JWT nem cookie — são chamadas serviço-a-serviço, não sessões de navegador.
- **Fail-closed**: com `ENVIRONMENT=prod`, o app **não sobe** sem `API_KEYS` configurado.
  Autenticação desligada é um modo explícito de desenvolvimento, nunca um default silencioso.
- **Nenhum segredo chega ao browser.** A chamada autenticada sai de um Server Component, e
  `web/lib/lead-api.ts` importa `server-only`: importá-lo de um Client Component quebra o
  build. Variável sem prefixo `NEXT_PUBLIC_` não existe no browser, e o CI confirma
  construindo com uma chave-canário e falhando se ela aparecer em `.next/static`.
- **O modelo nunca vê segredos nem infraestrutura.** O LLM pontua intenção de compra e não
  recebe destino de dispatch, chaves nem credenciais.
- **Entrada não confiável é tratada como dado, não instrução.** O texto submetido pelo lead
  vai delimitado no prompt, a saída é forçada por schema (tool use) e o score é limitado
  a 0–100 em código — nunca só por instrução de prompt.
- **Saída para fora**: o destino de dispatch precisa ser `https` e estar na allowlist; o
  payload vai assinado com HMAC e timestamp.

## Frontend

- **Next.js 16 (App Router)** + TypeScript. Turbopack é default no 16 — não passar
  `--turbopack` nos scripts. `params`, `searchParams`, `cookies` e `headers` são
  assíncronos e **precisam** de `await`.
- **shadcn/ui** com `cssVariables: true`, sobre **Tailwind v4**. Componentes são copiados
  para o repo e adaptados — não são importados de um pacote compartilhado.
- **Animação**: `motion`, sempre respeitando `prefers-reduced-motion`.
- **Lógica pura sai do componente** para `lib/`, o que também a deixa testável isoladamente.
- **Testes**: Vitest para regra de negócio pura; um fluxo end-to-end em Playwright.

## Testes

Toda lógica não trivial ganha um teste que **falha se a lógica for removida**, verificado
por mutação: altere o comportamento, rode o teste, confirme que quebra. Um teste que passa
com qualquer implementação não conta como cobertura.

## Docker

Multi-stage, base pinada, usuário não-root, `HEALTHCHECK`, `.dockerignore` mantido em dia.
Nenhum segredo em `ARG`/`ENV` de build.
