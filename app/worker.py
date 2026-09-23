"""Worker ARQ: tira o trabalho caro do caminho da requisição.

`enrich → score → dispatch` leva segundos e depende de dois serviços externos
(BrasilAPI e Anthropic). Fazer isso dentro do POST significava que qualquer
lentidão deles virava timeout de quem submeteu o formulário, e que um pico de
leads abria um chamado ao LLM por requisição, sem nenhum controle.

Rode com: `uv run arq app.worker.WorkerSettings`
"""

import logging

from arq import Retry

from app.db.models import LeadStatus
from app.db.session import async_session_factory
from app.dispatch import dispatch, verify_webhook_config
from app.enrichment import aclose as close_enrichment_client
from app.enrichment import enrich
from app.logging_config import configure_logging, mask_email
from app.models import LeadIn, LeadResult
from app.queue import PROCESS_LEAD, redis_settings
from app.repository import get_lead, mark_done, mark_failed
from app.scoring import is_transient, score

logger = logging.getLogger("lead_router.worker")

_MAX_TRIES = 3
_RETRY_DEFER_SECONDS = 30


async def process_lead(ctx: dict, lead_id: str) -> None:
    """pending → done | failed. Nunca deixa um lead pontuado em `pending`.

    - Falha transitória de pontuação: `arq.Retry` com o lead ainda `pending`,
      até a última tentativa; só então `failed`. Gravar `failed` antes do retry
      faria a guarda de status abaixo descartar a tentativa seguinte.
    - Falha permanente: `failed` na hora.
    - Falha de entrega: `done` com `dispatched=False` e a classe em `error`. Sem
      retry — repetir o job repontuaria o lead e gastaria outro LLM.
    - CancelledError (timeout/SIGTERM) não é capturado: o arq reentrega o job.
    """
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
            # enrich não levanta por falha da BrasilAPI; fica aqui dentro só
            # para que um bug inesperado vire `failed`, não um lead preso.
            enrichment = await enrich(lead)
            lead_score, reasoning = await score(lead, enrichment)
        except Exception as exc:
            motivo = type(exc).__name__
            job_try = ctx["job_try"]
            if is_transient(exc) and job_try < _MAX_TRIES:
                logger.warning(
                    "pontuação falhou, vai retentar",
                    extra={"lead_id": lead_id, "motivo": motivo, "tentativa": job_try},
                )
                raise Retry(defer=_RETRY_DEFER_SECONDS * job_try) from exc
            # Só a classe do erro no banco: a mensagem pode trazer trecho do
            # payload de um serviço externo, e esse campo sai na API. Sem
            # re-raise: o estado final já está no banco, e o arq só logaria a
            # mensagem crua.
            await mark_failed(session, record, error=motivo)
            logger.warning(
                "lead falhou", extra={"lead_id": lead_id, "motivo": motivo, "tentativa": job_try}
            )
            return

        result = LeadResult(
            lead_id=lead_id,
            lead=lead,
            enrichment=enrichment,
            score=lead_score,
            reasoning=reasoning,
            dispatched=False,
        )
        dispatch_error = None
        try:
            result.dispatched = await dispatch(result)
        except Exception as exc:
            dispatch_error = type(exc).__name__
            logger.warning("dispatch falhou", extra={"lead_id": lead_id, "motivo": dispatch_error})
        await mark_done(
            session,
            record,
            score=lead_score,
            reasoning=reasoning,
            dispatched=result.dispatched,
            error=dispatch_error,
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
    # Mesmo fail-closed da API: destino inválido derruba o worker no deploy, e
    # não falha a entrega de cada lead depois.
    verify_webhook_config()


async def _shutdown(ctx: dict) -> None:
    await close_enrichment_client()


class WorkerSettings:
    functions = [process_lead]
    redis_settings = redis_settings()
    on_startup = _startup
    on_shutdown = _shutdown
    # O arq só reexecuta em Retry/cancelamento — exceção comum encerra o job.
    # Este teto vale para o Retry acima e para a reentrega após crash.
    max_tries = _MAX_TRIES


assert process_lead.__name__ == PROCESS_LEAD, "o nome registrado na fila tem que bater"
