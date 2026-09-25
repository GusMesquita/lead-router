# backend (app/) — core

Flow and semantics live in `docs/processing-contract.md`; this is what that doc doesn't make obvious.

## Worker retry (`app/worker.py`)

- Retry only via `raise arq.Retry(defer=...)` while the lead stays `pending`. Plain exceptions end the arq job (no retry); `max_tries=3` caps Retry and crash redelivery.
- Never `mark_failed` before a Retry: the status guard at the top of `process_lead` would skip the next try.
- No re-raise after `mark_failed`: final state is already in the DB, re-raising only makes arq log the raw message.
- `scoring.is_transient` classifies by status code, not class: in the anthropic SDK 503/504/529 are siblings of `InternalServerError`, so `isinstance` misses them.
- Dispatch failure is never retried (would re-score = another LLM call).
- Tests fake `job_try` via `ctx`; anthropic exceptions are built from real `httpx.Request`/`Response` objects (their constructors require one).

## Queue / Redis (`app/queue.py`, ingest in `app/main.py`)

- `_job_id="lead:<id>"` dedups while the job **or its result** exists (`keep_result` 1h): re-enqueue inside that window is a silent no-op.
- `create_pool` retries 5× (1s) before raising; ingest catches `(RedisError, OSError)` — `TimeoutError` is an `OSError` subclass. `redis` is a direct dependency because of this import.
- Enqueue failure deletes only a lead created by this request (`created`), never a replay.
- The arq worker process exits when Redis goes away; Compose `restart: unless-stopped` brings it back.

## External clients (lifecycle is not uniform)

- arq pool: singleton, closed in API lifespan.
- enrichment httpx: singleton, closed in worker `on_shutdown`.
- `AsyncAnthropic`: singleton, never closed; `timeout=30` because the SDK default (600s) exceeds arq's job timeout.
- dispatch: new `httpx.AsyncClient` per call.

## Docker / Compose

- Same image runs API and worker; healthcheck is in `compose.yaml` (python urllib — slim image has no curl), not in the Dockerfile.
- Runs as uid 10001; `/data` is chowned in the image. A `lead_data` volume created by an older root image keeps root ownership → `docker compose down -v`.
- Migrations run in the API `command` before uvicorn; the worker waits for API healthy.
- The `web` service uses its own image (`web/Dockerfile`, build context = repo root so it can check `.nvmrc`; ignore rules in `web/Dockerfile.dockerignore`). It reaches the API at `http://api:8000` and waits for API healthy.

## Tests / schema

- `tests/conftest.py` sets `DATABASE_URL` to a temp SQLite and `ENVIRONMENT=dev` **before** importing `app`, then runs `alembic upgrade head`. Import order matters.
- `alembic check` catches model changes without migration; pytest alone doesn't.
