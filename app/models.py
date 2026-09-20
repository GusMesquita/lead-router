from datetime import datetime

from pydantic import BaseModel, ConfigDict


class LeadIn(BaseModel):
    name: str
    email: str
    company: str | None = None
    cnpj: str | None = None
    message: str | None = None


class LeadResult(BaseModel):
    lead: LeadIn
    enrichment: dict
    score: int
    reasoning: str
    dispatched: bool


class LeadRecordOut(BaseModel):
    """API-facing view of a persisted LeadRecord (app/db/models.py)."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    company: str | None
    score: int
    reasoning: str
    dispatched: bool
    created_at: datetime
