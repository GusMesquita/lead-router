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
    """Payload do webhook de saída (app/dispatch.py)."""

    # A entrega pode se repetir (crash entre o POST e o commit); é por este id
    # que o receptor reconhece o mesmo lead.
    lead_id: str
    lead: LeadIn
    enrichment: dict
    score: int
    reasoning: str
    dispatched: bool


class LeadAccepted(BaseModel):
    """Resposta do 202: o lead entrou na fila, o resultado vem por GET /leads/{id}."""

    id: str
    status: str


class LeadRecordOut(BaseModel):
    """API-facing view of a persisted LeadRecord (app/db/models.py).

    `score` e `reasoning` são nulos enquanto `status == "pending"` — o worker
    ainda não rodou. Não é campo opcional, é campo que ainda não existe.
    """

    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    company: str | None
    status: str
    score: int | None
    reasoning: str | None
    dispatched: bool
    error: str | None
    created_at: datetime
    updated_at: datetime
