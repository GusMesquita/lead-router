# Contrato de processamento

O que qualquer consumidor (dashboard, workflow n8n, receptor do webhook, quem lê
um log) pode assumir sobre um lead depois do `POST /leads/ingest`. Descreve o
comportamento implementado em `app/main.py`, `app/worker.py`, `app/scoring.py`,
`app/enrichment.py` e `app/dispatch.py` — se divergir do código, o código ganha
e este arquivo está errado.

## Ciclo de vida

```
POST → pending ──worker──▶ done   (score + reasoning; dispatched true/false)
                     └───▶ failed (score nulo; error = classe do erro)
```

`score` e `reasoning` são **nulos enquanto `status == "pending"`**: não é campo
opcional, é campo que ainda não existe. `done` e `failed` são finais — o worker
ignora um job cujo lead já saiu de `pending`, então uma reentrega do arq não
repontua nem sobrescreve um resultado.

## Ingestão e fila

- `202` significa "gravado **e** na fila". O enqueue acontece depois do commit,
  para o worker nunca procurar um lead que ainda não existe.
- Redis indisponível (`RedisError`/`OSError`, depois das 5 tentativas do
  `create_pool` do arq): `503` com `Retry-After: 5`. Se o lead nasceu nesta
  requisição, ele é apagado antes da resposta — sem isso ficaria `pending` para
  sempre, e o retry de quem não manda `Idempotency-Key` criaria outro.
- O job usa `_job_id = "lead:<id>"`: enfileirar o mesmo lead de novo enquanto o
  job (ou o resultado dele, guardado por 1h) existe no Redis é descartado pelo
  arq.

## Idempotência

- `Idempotency-Key` repetida devolve o **mesmo** `id`. A garantia é um índice
  único no banco: duas requisições simultâneas não criam dois leads.
- Replay de um lead ainda `pending` **reenfileira** — é o que recupera um
  enqueue perdido; o `_job_id` impede trabalho duplicado. Replay de lead
  `done`/`failed` não enfileira nada.
- Replay nunca apaga: se o enqueue falhar num replay, a resposta é `503` e o
  lead continua como estava.

## Enriquecimento

Opcional e nunca derruba o lead. CNPJ que não tem 14 dígitos, erro de rede ou
timeout da BrasilAPI, status não-2xx ou corpo que não é JSON viram um campo
`cnpj_lookup_error` no enriquecimento, e a pontuação segue sem os dados.

## Pontuação

`app/scoring.py` é o único lugar em que um LLM decide algo.

- **A saída é sempre `score` (int 0-100) e `reasoning` (str).** Vem de uma
  tool (`submit_score`) com schema e chamada obrigatória (`tool_choice`), não
  de "responda só com JSON". O `score` ainda passa por clamp em [0, 100] — o
  schema é pedido, não garantia.
- **Pontua intenção de compra, não tom.** O system prompt diz que um lead
  simpático e não qualificado tem nota baixa. Mudar essa regra muda o que
  "qualificado" significa para o corte de dispatch e para o dashboard.
- **Os dados do lead vão delimitados em `<lead>`** e são tratados como fato
  sobre o lead, nunca como instrução.
- **O modelo nunca vê destinos, URLs de webhook nem chaves.** Só os campos do
  lead e o enriquecimento chegam ao prompt: o pior efeito de um prompt
  injection no `message` é uma nota errada, não um segredo vazado nem SSRF.
- **Não é determinística.** Dois leads idênticos podem ter notas diferentes;
  trate a nota como opinião, não como cálculo.

### Falhas e retry

O cliente do SDK tem `timeout=30s` e `max_retries=2` por chamada. Se ainda
assim a pontuação falhar:

| Falha | Tentativa (`job_try`) | Resultado |
| --- | --- | --- |
| Transitória: conexão/timeout, status 408, 409, 429 ou ≥ 500 | 1 ou 2 | `Retry` do arq com espera de 30s × `job_try`; o lead continua `pending` |
| Transitória | 3 (última) | `failed` |
| Permanente (qualquer outra, inclusive bug no enriquecimento) | qualquer | `failed` na hora |

`error` guarda só o nome da classe (`APITimeoutError`, `AuthenticationError`…),
nunca a mensagem: ela pode trazer trecho de payload externo, e o campo sai na
API. Um lead que falha **não** recebe score 0 — `score` fica nulo.

Timeout do job ou SIGTERM (`CancelledError`) não é capturado: o arq reentrega o
job, dentro do mesmo teto de 3 tentativas.

## Dispatch

- Só acontece com `OUTBOUND_WEBHOOK_URL` configurada e `score ≥
  MIN_SCORE_TO_DISPATCH`. O destino precisa ser `https` e estar em
  `WEBHOOK_ALLOWED_HOSTS`; a API e o worker validam isso na inicialização e não
  sobem com configuração inválida.
- Com `WEBHOOK_SIGNING_SECRET`, o corpo vai assinado: `X-Timestamp` e
  `X-Signature: sha256=<HMAC de "<timestamp>.<corpo>">`.
- Só 2xx conta como entrega; redirect não é seguido.
- Falha de entrega **não** falha o lead: ele vira `done` com
  `dispatched=false` e a classe do erro em `error`. **Não há retry** —
  repetir o job repontuaria o lead e gastaria outra chamada ao LLM.
- O payload traz `lead_id`: é com ele que o receptor deduplica.

## Limites aceitos

Conhecidos e não tratados de propósito — não existe DLQ, outbox nem
reprocessamento automático:

- **Entrega duplicada.** Crash do worker entre o POST do webhook e o commit de
  `done` faz o arq reentregar o job, e o lead é entregue de novo. O receptor
  deduplica por `lead_id`.
- **Entrega perdida.** Dispatch que falhou fica `dispatched=false` até alguém
  reenviar à mão.
- **Lead preso em `pending`:**
  - erro de banco ao gravar `done`/`failed` no worker;
  - job descartado pelo arq depois de esgotar as tentativas por crash;
  - falha de banco no delete compensatório depois de um enqueue que falhou;
  - requisições simultâneas com a mesma `Idempotency-Key` durante uma queda do
    Redis (a que perde a corrida recebe o id de um lead que a outra apaga).

  Um replay com a mesma `Idempotency-Key` reenfileira o lead, mas só depois que
  o resultado do job antigo expira no Redis (1h); antes disso o `_job_id`
  descarta o job novo.
- **Worker e Redis.** O processo do worker encerra quando perde o Redis; no
  Compose ele volta pelo `restart: unless-stopped`. Com o webhook mal
  configurado, o worker não sobe (fail-closed) e fica reiniciando.
