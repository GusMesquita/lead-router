"""Persistence for scored leads — the only place SQL lives in this app."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import LeadRecord
from app.models import LeadResult


async def save_result(session: AsyncSession, result: LeadResult) -> LeadRecord:
    record = LeadRecord(
        name=result.lead.name,
        email=result.lead.email,
        company=result.lead.company,
        cnpj=result.lead.cnpj,
        message=result.lead.message,
        score=result.score,
        reasoning=result.reasoning,
        dispatched=result.dispatched,
    )
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
