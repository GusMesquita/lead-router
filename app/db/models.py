import uuid
from datetime import UTC, datetime

from sqlmodel import Field, SQLModel


def _now() -> datetime:
    return datetime.now(UTC)


class LeadStatus:
    """Estados de um lead. String simples em vez de Enum do banco: SQLite não tem
    ENUM nativo e um CHECK só serviria para transformar um bug em 500 opaco."""

    PENDING = "pending"
    DONE = "done"
    FAILED = "failed"


class LeadRecord(SQLModel, table=True):
    """Um lead recebido por /leads/ingest.

    Criado como `pending` pela API e atualizado pelo worker (app/worker.py).
    `score`, `reasoning` e `enrichment` só existem depois que o worker roda —
    por isso são nuláveis, e não porque sejam opcionais no domínio.
    """

    __tablename__ = "leads"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)

    # Índice único: é ele que faz a idempotência valer sob concorrência. Duas
    # requisições simultâneas com a mesma chave não conseguem criar dois leads —
    # a segunda leva IntegrityError e a API devolve o id da primeira.
    idempotency_key: str | None = Field(default=None, unique=True, index=True)

    name: str
    email: str
    company: str | None = None
    cnpj: str | None = None
    message: str | None = None

    status: str = Field(default=LeadStatus.PENDING, index=True)
    score: int | None = None
    reasoning: str | None = None
    dispatched: bool = False
    # Motivo da falha, para quem consulta GET /leads/{id} saber se vale reenviar.
    error: str | None = None

    created_at: datetime = Field(default_factory=_now)
    updated_at: datetime = Field(default_factory=_now)
