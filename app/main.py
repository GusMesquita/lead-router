from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_api_key
from app.db.session import get_session, init_db
from app.dispatch import dispatch
from app.enrichment import enrich
from app.models import LeadIn, LeadRecordOut, LeadResult
from app.repository import list_leads, save_result
from app.scoring import score


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    await init_db()
    yield


app = FastAPI(title="lead-router", lifespan=lifespan)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post(
    "/leads/ingest",
    response_model=LeadResult,
    dependencies=[Depends(require_api_key)],
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
    return result


@app.get(
    "/leads",
    response_model=list[LeadRecordOut],
    dependencies=[Depends(require_api_key)],
)
async def get_leads(
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
    session: AsyncSession = Depends(get_session),
) -> list[LeadRecordOut]:
    return await list_leads(session, limit=limit, offset=offset)
