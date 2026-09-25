import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Header, HTTPException, Path, Query, status
from fastapi.middleware.cors import CORSMiddleware
from redis.exceptions import RedisError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_api_key, verify_auth_config
from app.config import settings
from app.db.models import LeadStatus
from app.db.session import get_session
from app.dispatch import verify_webhook_config
from app.logging_config import configure_logging, mask_email
from app.models import LeadAccepted, LeadIn, LeadRecordOut
from app.queue import aclose as close_queue
from app.queue import enqueue_lead
from app.ratelimit import rate_limit
from app.repository import create_pending, delete_lead, get_lead, list_leads

logger = logging.getLogger("lead_router.api")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    configure_logging()
    # Fail-closed: qualquer erro aqui impede o app de aceitar tráfego. É
    # deliberado — melhor não subir do que subir sem auth ou mandando PII
    # para um destino não verificado.
    verify_auth_config()
    verify_webhook_config()
    yield
    await close_queue()


app = FastAPI(title="lead-router", lifespan=lifespan)

# Allowlist explícita, nunca "*". allow_credentials com "*" é rejeitado pelos
# browsers e, pior, convida a relaxar a origem em vez da credencial.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-API-Key"],
)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post(
    "/leads/ingest",
    response_model=LeadAccepted,
    status_code=status.HTTP_202_ACCEPTED,
    dependencies=[Depends(require_api_key), Depends(rate_limit)],
)
async def ingest_lead(
    lead: LeadIn,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key", max_length=200),
    session: AsyncSession = Depends(get_session),
) -> LeadAccepted:
    """Aceita o lead e devolve 202 — enriquecer e pontuar acontece no worker.

    Fazer isso aqui dentro amarrava a resposta a dois serviços externos
    (BrasilAPI e Anthropic): quem preencheu o formulário esperava segundos, e
    uma indisponibilidade deles virava erro para o lead. Agora o POST só grava e
    enfileira; o resultado sai por GET /leads/{id}.
    """
    record, created = await create_pending(session, lead, idempotency_key=idempotency_key)

    # Enfileira também no replay de um lead ainda `pending`: é o que recupera um
    # enqueue perdido. Não duplica trabalho — o _job_id descarta o job repetido.
    # Depois do commit, nunca antes: senão o worker poderia procurar um lead
    # que ainda não existe no banco.
    if record.status == LeadStatus.PENDING:
        try:
            await enqueue_lead(record.id)
        except (RedisError, OSError):
            logger.exception("fila indisponível", extra={"lead_id": record.id, "novo": created})
            # 202 tem que significar "está na fila". Sem desfazer, o lead ficava
            # `pending` para sempre, e o retry de quem não manda Idempotency-Key
            # criava outro. Replay não apaga: o lead não nasceu nesta requisição.
            if created:
                await delete_lead(session, record)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="fila indisponível; tente de novo",
                headers={"Retry-After": "5"},
            ) from None

    logger.info(
        "lead aceito",
        extra={"lead_id": record.id, "email": mask_email(lead.email), "novo": created},
    )
    return LeadAccepted(id=record.id, status=record.status)


@app.get(
    "/leads/{lead_id}",
    response_model=LeadRecordOut,
    dependencies=[Depends(require_api_key), Depends(rate_limit)],
)
async def read_lead(
    lead_id: str = Path(max_length=64),
    session: AsyncSession = Depends(get_session),
) -> LeadRecordOut:
    record = await get_lead(session, lead_id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="lead não encontrado")
    return LeadRecordOut.model_validate(record)


@app.get(
    "/leads",
    response_model=list[LeadRecordOut],
    dependencies=[Depends(require_api_key), Depends(rate_limit)],
)
async def get_leads(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    session: AsyncSession = Depends(get_session),
) -> list[LeadRecordOut]:
    return await list_leads(session, limit=limit, offset=offset)
