"""Worker ARQ: tira o trabalho caro do caminho da requisição.

`enrich → score → dispatch` leva segundos e depende de dois serviços externos
(BrasilAPI e Anthropic). Fazer isso dentro do POST significava que qualquer
lentidão deles virava timeout de quem submeteu o formulário, e que um pico de
leads abria um chamado ao LLM por requisição, sem nenhum controle.

Rode com: `uv run arq app.worker.WorkerSettings`
"""

import logging

from app.db.models import LeadStatus
from app.db.session import async_session_factory
from app.dispatch import dispatch
from app.enrichment import aclose as close_enrichment_client
from app.enrichment import enrich
from app.logging_config import configure_logging, mask_email
from app.models import LeadIn, LeadResult
from app.queue import PROCESS_LEAD, redis_settings
from app.repository import get_lead, mark_done, mark_failed
from app.scoring import score

logger = logging.getLogger("lead_router.worker")


async def process_lead(ctx: dict, lead_id: str) -> None:
    async with async_session_factory() as session:
        record = await get_lead(session, lead_id)
        if record is None:
            # Nada a fazer e nada a retentar: o job perdeu o lead de vista.
            logger.warning("lead não encontrado", extra={"lead_id": lead_id})
            return
        if record.status != LeadStatus.PENDING:
            # Reentrega do arq depois de um crash, ou job duplicado. Repontuar
            # custaria outra chamada ao LLM e sobrescreveria um resultado bom.
            logger.info("lead já processado", extra={"lead_id": lead_id, "status": record.status})
            return

        lead = LeadIn(
            name=record.name,
            email=record.email,
            company=record.company,
            cnpj=record.cnpj,
            message=record.message,
        )

        try:
            enrichment = await enrich(lead)
            lead_score, reasoning = await score(lead, enrichment)
        except Exception as exc:
            # Só a classe do erro no banco: a mensagem pode trazer trecho do
            # payload de um serviço externo, e esse campo sai na API.
            await mark_failed(session, record, error=type(exc).__name__)
            logger.warning("lead falhou", extra={"lead_id": lead_id, "motivo": type(exc).__name__})
            raise

        result = LeadResult(
            lead=lead,
            enrichment=enrichment,
            score=lead_score,
            reasoning=reasoning,
            dispatched=False,
        )
        result.dispatched = await dispatch(result)
        await mark_done(
            session, record, score=lead_score, reasoning=reasoning, dispatched=result.dispatched
        )

    logger.info(
        "lead processado",
        extra={
            "lead_id": lead_id,
            "email": mask_email(record.email),
            "score": lead_score,
            "dispatched": result.dispatched,
        },
    )


async def _startup(ctx: dict) -> None:
    configure_logging()


async def _shutdown(ctx: dict) -> None:
    await close_enrichment_client()


class WorkerSettings:
    functions = [process_lead]
    redis_settings = redis_settings()
    on_startup = _startup
    on_shutdown = _shutdown
    # Falha de rede em BrasilAPI/Anthropic é transitória; o arq retenta com
    # backoff e o job só vira "falhou de vez" depois disso.
    max_tries = 3


assert process_lead.__name__ == PROCESS_LEAD, "o nome registrado na fila tem que bater"
