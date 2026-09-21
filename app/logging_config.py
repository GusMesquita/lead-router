"""Structured (JSON-lines) logging setup — stdlib only.

Mesmo formato do brasilapi-mcp-server: uma linha por evento, parseável por
máquina. O que muda aqui é a regra de conteúdo — este serviço processa PII.
"""

import json
import logging
import sys
from datetime import UTC, datetime

_RESERVED = set(logging.LogRecord("", 0, "", 0, "", None, None).__dict__) | {"message", "asctime"}


def mask_email(email: str) -> str:
    """a***@dominio.com — o suficiente para correlacionar, insuficiente para vazar.

    Logs vão para agregadores, ficam retidos por meses e são lidos por gente
    que não precisa do endereço completo.
    """
    local, sep, domain = email.partition("@")
    if not sep or not local:
        return "***"
    return f"{local[0]}***@{domain}"


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": datetime.now(UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        # Campos passados via extra=, para o log ser estruturado e não só texto.
        payload.update({k: v for k, v in record.__dict__.items() if k not in _RESERVED})
        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)
        return json.dumps(payload, default=str)


def configure_logging(level: int = logging.INFO) -> None:
    handler = logging.StreamHandler(stream=sys.stderr)
    handler.setFormatter(JsonFormatter())
    root = logging.getLogger("lead_router")
    root.setLevel(level)
    root.handlers = [handler]
    root.propagate = False
