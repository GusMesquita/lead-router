"""Points the app at an isolated temp SQLite file before any app module is
imported, so tests never touch a developer's real lead_router.db.

O schema é criado rodando **as migrações de verdade**, não `create_all`. É o que
faz o CI quebrar quando alguém mexe em app/db/models.py e esquece a migração —
com `create_all` os testes passariam e só produção descobriria.
"""

import os
import tempfile
from pathlib import Path

_tmp_dir = tempfile.TemporaryDirectory()
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{Path(_tmp_dir.name) / 'test.db'}"
os.environ.setdefault("API_KEYS", "")
# Sem isto os testes herdariam o default "prod" e o lifespan se recusaria a subir.
os.environ.setdefault("ENVIRONMENT", "dev")

from alembic.config import Config  # noqa: E402

from alembic import command  # noqa: E402

_alembic = Config(str(Path(__file__).resolve().parent.parent / "alembic.ini"))
command.upgrade(_alembic, "head")
