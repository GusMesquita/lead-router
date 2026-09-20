import uuid
from datetime import UTC, datetime

from sqlmodel import Field, SQLModel


class LeadRecord(SQLModel, table=True):
    """Persisted result of one /leads/ingest call. Append-only — never updated."""

    __tablename__ = "leads"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    email: str
    company: str | None = None
    cnpj: str | None = None
    message: str | None = None
    score: int
    reasoning: str
    dispatched: bool
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
