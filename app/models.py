from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class LeadIn(BaseModel):
    """Fronteira de confiança: tudo aqui vem de um formulário público.

    Os limites de tamanho não são estética — sem eles um POST pode carregar
    megabytes para dentro do banco e, pior, para dentro do prompt enviado ao
    modelo em app/scoring.py.
    """

    name: Annotated[str, Field(min_length=1, max_length=200)]
    email: EmailStr
    company: Annotated[str | None, Field(default=None, max_length=200)]
    cnpj: Annotated[str | None, Field(default=None, max_length=32)]
    message: Annotated[str | None, Field(default=None, max_length=5_000)]


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
