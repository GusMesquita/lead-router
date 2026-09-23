"""Persistence for leads — the only place SQL lives in this app."""

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import LeadRecord, LeadStatus, _now
from app.models import LeadIn


async def create_pending(
    session: AsyncSession, lead: LeadIn, *, idempotency_key: str | None
) -> tuple[LeadRecord, bool]:
    """Grava o lead como `pending` e devolve `(registro, criado_agora)`.

    A checagem prévia por `idempotency_key` cobre o caso comum (retry sequencial);
    o `IntegrityError` cobre o caso raro e perigoso (duas requisições ao mesmo
    tempo). Sem o segundo, o índice único derrubaria a requisição com 500 em vez
    de devolver o lead que a corrida já criou.
    """
    if idempotency_key:
        existing = await find_by_idempotency_key(session, idempotency_key)
        if existing is not None:
            return existing, False

    record = LeadRecord(
        idempotency_key=idempotency_key,
        name=lead.name,
        email=lead.email,
        company=lead.company,
        cnpj=lead.cnpj,
        message=lead.message,
        status=LeadStatus.PENDING,
    )
    session.add(record)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        if idempotency_key:
            existing = await find_by_idempotency_key(session, idempotency_key)
            if existing is not None:
                return existing, False
        raise
    await session.refresh(record)
    return record, True


async def find_by_idempotency_key(session: AsyncSession, key: str) -> LeadRecord | None:
    rows = await session.execute(select(LeadRecord).where(LeadRecord.idempotency_key == key))
    return rows.scalars().one_or_none()


async def get_lead(session: AsyncSession, lead_id: str) -> LeadRecord | None:
    return await session.get(LeadRecord, lead_id)


async def mark_done(
    session: AsyncSession,
    record: LeadRecord,
    *,
    score: int,
    reasoning: str,
    dispatched: bool,
    error: str | None = None,
) -> LeadRecord:
    """`error` aqui é falha de entrega: o lead foi pontuado, o webhook não recebeu."""
    record.status = LeadStatus.DONE
    record.score = score
    record.reasoning = reasoning
    record.dispatched = dispatched
    record.error = error
    return await _save(session, record)


async def mark_failed(session: AsyncSession, record: LeadRecord, *, error: str) -> LeadRecord:
    record.status = LeadStatus.FAILED
    # Só a classe do erro, nunca a mensagem crua de um serviço externo: ela pode
    # carregar trecho do payload, e este campo sai em GET /leads/{id}.
    record.error = error
    return await _save(session, record)


async def _save(session: AsyncSession, record: LeadRecord) -> LeadRecord:
    record.updated_at = _now()
    session.add(record)
    await session.commit()
    await session.refresh(record)
    return record


async def list_leads(
    session: AsyncSession, *, limit: int = 50, offset: int = 0
) -> list[LeadRecord]:
    statement = (
        select(LeadRecord).order_by(LeadRecord.created_at.desc()).limit(limit).offset(offset)
    )
    rows = await session.execute(statement)
    return list(rows.scalars().all())
