"""Sends a qualified lead result to a configurable outbound destination — a generic
webhook (Slack, n8n, any CRM's inbound-webhook URL). Swap this for a CRM SDK call
if you need something more specific than a webhook.

O payload carrega PII do lead (nome, e-mail, empresa). Por isso o destino não é
uma URL livre: precisa ser https e estar numa allowlist de hosts. Sem isso,
quem conseguisse escrever em OUTBOUND_WEBHOOK_URL redirecionaria os leads para
onde quisesse — ou para dentro da rede interna (SSRF).
"""

import hashlib
import hmac
import json
import logging
import time
from urllib.parse import urlparse

import httpx

from app.config import settings
from app.models import LeadResult

logger = logging.getLogger("lead_router.dispatch")


def verify_webhook_config() -> None:
    """Valida o destino na inicialização, para o erro aparecer no deploy e não
    no meio de um lead real. Chamado no lifespan (app/main.py)."""
    if settings.outbound_webhook_url:
        _validate_destination(settings.outbound_webhook_url)


def _validate_destination(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme != "https":
        raise ValueError(
            f"OUTBOUND_WEBHOOK_URL precisa usar https (recebido: {parsed.scheme or 'sem esquema'})"
        )

    host = (parsed.hostname or "").lower()
    allowed = settings.webhook_allowed_host_set
    if not allowed:
        raise ValueError("WEBHOOK_ALLOWED_HOSTS é obrigatório quando há OUTBOUND_WEBHOOK_URL")
    if host not in allowed:
        raise ValueError(f"host {host!r} não está em WEBHOOK_ALLOWED_HOSTS")
    return host


def _signature_headers(body: bytes) -> dict[str, str]:
    """Assina no esquema de Stripe/GitHub: HMAC sobre "<timestamp>.<body>".

    O timestamp entra no material assinado para que um payload capturado não
    possa ser reenviado depois — o receptor rejeita timestamps antigos.
    """
    secret = settings.webhook_signing_secret
    if not secret:
        return {}
    timestamp = str(int(time.time()))
    signed = f"{timestamp}.".encode() + body
    digest = hmac.new(secret.encode(), signed, hashlib.sha256).hexdigest()
    return {"X-Timestamp": timestamp, "X-Signature": f"sha256={digest}"}


async def dispatch(result: LeadResult) -> bool:
    if not settings.outbound_webhook_url:
        return False
    if result.score < settings.min_score_to_dispatch:
        return False

    host = _validate_destination(settings.outbound_webhook_url)
    body = json.dumps(result.model_dump(), separators=(",", ":")).encode()
    headers = {"Content-Type": "application/json", **_signature_headers(body)}

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(settings.outbound_webhook_url, content=body, headers=headers)

    # Sem corpo nem e-mail no log: o destino e o status bastam para diagnosticar.
    logger.info("dispatch enviado", extra={"host": host, "status": response.status_code})
    return not response.is_error
