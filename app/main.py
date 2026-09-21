import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_api_key, verify_auth_config
from app.config import settings
from app.db.session import get_session, init_db
from app.dispatch import dispatch, verify_webhook_config
from app.enrichment import aclose as close_enrichment_client
from app.enrichment import enrich
from app.logging_config import configure_logging, mask_email
from app.models import LeadIn, LeadRecordOut, LeadResult
from app.ratelimit import rate_limit
from app.repository import list_leads, save_result
from app.scoring import ScoringError, score

logger = logging.getLogger("lead_router.api")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    configure_logging()
    # Fail-closed: qualquer erro aqui impede o app de aceitar tráfego. É
    # deliberado — melhor não subir do que subir sem auth ou mandando PII
    # para um destino não verificado.
    verify_auth_config()
    verify_webhook_config()
    await init_db()
    yield
    await close_enrichment_client()


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


@app.exception_handler(ScoringError)
async def scoring_error_handler(request: Request, exc: ScoringError) -> JSONResponse:
    """502, não 500: quem falhou foi o serviço de cima, e o cliente pode repetir.

    O detalhe do erro fica no log; a resposta não repassa texto de um serviço
    externo para quem chamou.
    """
    logger.warning("scoring falhou", extra={"motivo": str(exc)})
    return JSONResponse(
        status_code=status.HTTP_502_BAD_GATEWAY,
        content={"detail": "não foi possível pontuar o lead agora; tente de novo"},
    )


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post(
    "/leads/ingest",
    response_model=LeadResult,
    dependencies=[Depends(require_api_key), Depends(rate_limit)],
)
async def ingest_lead(lead: LeadIn, session: AsyncSession = Depends(get_session)) -> LeadResult:
    enrichment = await enrich(lead)
    lead_score, reasoning = await score(lead, enrichment)

    result = LeadResult(
        lead=lead,
        enrichment=enrichment,
        score=lead_score,
        reasoning=reasoning,
        dispatched=False,
    )
    result.dispatched = await dispatch(result)
    await save_result(session, result)

    # E-mail mascarado e nenhum trecho de `message`: o conteúdo é entrada
    # pública e não tem por que ficar retido no agregador de logs.
    logger.info(
        "lead processado",
        extra={
            "email": mask_email(lead.email),
            "score": lead_score,
            "dispatched": result.dispatched,
        },
    )
    return result


@app.get(
    "/leads",
    response_model=list[LeadRecordOut],
    dependencies=[Depends(require_api_key), Depends(rate_limit)],
)
async def get_leads(
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
    session: AsyncSession = Depends(get_session),
) -> list[LeadRecordOut]:
    return await list_leads(session, limit=limit, offset=offset)
