"""Points the app at an isolated temp SQLite file before any app module is
imported, so tests never touch a developer's real lead_router.db.
"""

import os
import tempfile
from pathlib import Path

_tmp_dir = tempfile.TemporaryDirectory()
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{Path(_tmp_dir.name) / 'test.db'}"
os.environ.setdefault("API_KEYS", "")
# Sem isto os testes herdariam o default "prod" e o lifespan se recusaria a subir.
os.environ.setdefault("ENVIRONMENT", "dev")
