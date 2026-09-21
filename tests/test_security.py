"""Garantias de segurança da Fatia 1.

Cada teste aqui existe para falhar se a proteção correspondente for removida —
não para confirmar que o código roda.
"""

import hashlib
import hmac
import json

import httpx
import pytest
from fastapi import HTTPException
from pydantic import ValidationError
from starlette.requests import Request

from app import dispatch as dispatch_module
from app import ratelimit
from app.auth import verify_auth_config
from app.config import settings
from app.logging_config import mask_email
from app.models import LeadIn, LeadResult

# --------------------------------------------------------------------------
# S2 — auth fail-closed
# --------------------------------------------------------------------------


def test_prod_sem_api_keys_impede_inicializacao(monkeypatch):
    """O bug original: API_KEYS vazio desligava a auth em silêncio."""
    monkeypatch.setattr(settings, "environment", "prod")
    monkeypatch.setattr(settings, "api_keys", "")

    with pytest.raises(RuntimeError, match="API_KEYS"):
        verify_auth_config()


def test_prod_com_api_keys_inicializa(monkeypatch):
    monkeypatch.setattr(settings, "environment", "prod")
    monkeypatch.setattr(settings, "api_keys", "chave-secreta")

    verify_auth_config()  # não deve levantar


def test_dev_sem_api_keys_inicializa(monkeypatch):
    """Rodar local sem chave continua possível — o que muda é o default."""
    monkeypatch.setattr(settings, "environment", "dev")
    monkeypatch.setattr(settings, "api_keys", "")

    verify_auth_config()  # não deve levantar


# --------------------------------------------------------------------------
# S5 — SSRF e allowlist do webhook de saída
# --------------------------------------------------------------------------


def _webhook(monkeypatch, url: str, hosts: str, secret: str = "") -> None:
    monkeypatch.setattr(settings, "outbound_webhook_url", url)
    monkeypatch.setattr(settings, "webhook_allowed_hosts", hosts)
    monkeypatch.setattr(settings, "webhook_signing_secret", secret)
    monkeypatch.setattr(settings, "min_score_to_dispatch", 0)


def test_host_fora_da_allowlist_e_rejeitado(monkeypatch):
    _webhook(monkeypatch, "https://atacante.example/coleta", "crm.exemplo.com")

    with pytest.raises(ValueError, match="allowlist|WEBHOOK_ALLOWED_HOSTS|não está"):
        dispatch_module._validate_destination(settings.outbound_webhook_url)


def test_http_puro_e_rejeitado(monkeypatch):
    """PII não sai em texto claro, nem para um host permitido."""
    _webhook(monkeypatch, "http://crm.exemplo.com/hook", "crm.exemplo.com")

    with pytest.raises(ValueError, match="https"):
        dispatch_module._validate_destination(settings.outbound_webhook_url)


def test_url_sem_allowlist_e_rejeitada(monkeypatch):
    """Esquecer WEBHOOK_ALLOWED_HOSTS não pode virar "permite tudo"."""
    _webhook(monkeypatch, "https://crm.exemplo.com/hook", "")

    with pytest.raises(ValueError, match="WEBHOOK_ALLOWED_HOSTS"):
        dispatch_module._validate_destination(settings.outbound_webhook_url)


def test_verify_webhook_config_barra_destino_invalido(monkeypatch):
    _webhook(monkeypatch, "https://atacante.example/x", "crm.exemplo.com")

    with pytest.raises(ValueError):
        dispatch_module.verify_webhook_config()


@pytest.mark.asyncio
async def test_payload_vai_assinado_com_hmac(monkeypatch):
    _webhook(monkeypatch, "https://crm.exemplo.com/hook", "crm.exemplo.com", secret="s3gr3d0")
    capturado = {}

    async def fake_post(self, url, **kwargs):
        capturado["body"] = kwargs["content"]
        capturado["headers"] = kwargs["headers"]
        return httpx.Response(200, request=httpx.Request("POST", url))

    monkeypatch.setattr(httpx.AsyncClient, "post", fake_post)

    result = LeadResult(
        lead=LeadIn(name="Bia", email="bia@exemplo.com"),
        enrichment={},
        score=90,
        reasoning="ok",
        dispatched=False,
    )
    assert await dispatch_module.dispatch(result) is True

    headers = capturado["headers"]
    esperado = hmac.new(
        b"s3gr3d0",
        f"{headers['X-Timestamp']}.".encode() + capturado["body"],
        hashlib.sha256,
    ).hexdigest()
    assert headers["X-Signature"] == f"sha256={esperado}"
    # O timestamp precisa estar dentro do material assinado, senão um payload
    # capturado pode ser reenviado indefinidamente.
    assert headers["X-Timestamp"] in json.dumps(headers)


# --------------------------------------------------------------------------
# S4 — validação na fronteira de confiança
# --------------------------------------------------------------------------


def test_email_invalido_e_rejeitado():
    with pytest.raises(ValidationError):
        LeadIn(name="Bia", email="nao-e-email")


def test_message_gigante_e_rejeitada():
    """Sem teto, isso entraria no banco e no prompt enviado ao modelo."""
    with pytest.raises(ValidationError):
        LeadIn(name="Bia", email="bia@exemplo.com", message="x" * 5_001)


def test_nome_vazio_e_rejeitado():
    with pytest.raises(ValidationError):
        LeadIn(name="", email="bia@exemplo.com")


# --------------------------------------------------------------------------
# S7 — rate limit
# --------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_rate_limit_bloqueia_acima_do_teto(monkeypatch):
    monkeypatch.setattr(settings, "rate_limit_per_minute", 3)
    ratelimit.reset()

    request = Request({"type": "http", "client": ("10.0.0.1", 1234), "headers": []})

    for _ in range(3):
        await ratelimit.rate_limit(request, x_api_key="")

    with pytest.raises(HTTPException) as exc:
        await ratelimit.rate_limit(request, x_api_key="")
    assert exc.value.status_code == 429
    assert "Retry-After" in exc.value.headers


@pytest.mark.asyncio
async def test_rate_limit_separa_identidades(monkeypatch):
    """Uma chave estourando a cota não pode derrubar as outras."""
    monkeypatch.setattr(settings, "rate_limit_per_minute", 2)
    ratelimit.reset()

    request = Request({"type": "http", "client": ("10.0.0.1", 1), "headers": []})

    for _ in range(2):
        await ratelimit.rate_limit(request, x_api_key="chave-a")
    with pytest.raises(HTTPException):
        await ratelimit.rate_limit(request, x_api_key="chave-a")

    await ratelimit.rate_limit(request, x_api_key="chave-b")  # não deve levantar


# --------------------------------------------------------------------------
# S8 — mascaramento em log
# --------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("entrada", "esperado"),
    [
        ("bia@exemplo.com", "b***@exemplo.com"),
        ("a@x.io", "a***@x.io"),
        ("sem-arroba", "***"),
        ("@dominio.com", "***"),
    ],
)
def test_mascara_email(entrada, esperado):
    assert mask_email(entrada) == esperado
