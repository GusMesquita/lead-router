"""Enriches a lead with public data before scoring. Currently: CNPJ lookup via BrasilAPI.

Swappable — point at the brasilapi-mcp-server HTTP endpoint instead of calling
BrasilAPI directly if you're already running that service:
    BRASILAPI_URL=http://localhost:8001/api
"""

import httpx

from app.config import settings
from app.models import LeadIn

# Um cliente por processo, fechado no shutdown: `async with` por request
# descartava o pool de conexões a cada lead.
_http: httpx.AsyncClient | None = None


def _http_client() -> httpx.AsyncClient:
    global _http
    if _http is None:
        _http = httpx.AsyncClient(base_url=settings.brasilapi_url, timeout=10.0)
    return _http


async def aclose() -> None:
    global _http
    if _http is not None:
        await _http.aclose()
        _http = None


async def enrich(lead: LeadIn) -> dict:
    if not lead.cnpj:
        return {}

    digits = "".join(filter(str.isdigit, lead.cnpj))
    # Sem o check de tamanho, um CNPJ vazio vira `/cnpj/v1/` (outro endpoint) e
    # qualquer lixo vira uma chamada garantidamente perdida para fora.
    if len(digits) != 14:
        return {"cnpj_lookup_error": "CNPJ deve ter 14 dígitos"}

    try:
        response = await _http_client().get(f"/cnpj/v1/{digits}")
    except httpx.RequestError as exc:
        # Timeout/DNS não tem status: sem isto, uma BrasilAPI fora do ar
        # derrubava a ingestão inteira do lead, que não depende dela.
        return {"cnpj_lookup_error": f"consulta de CNPJ indisponível ({type(exc).__name__})"}

    if response.is_error:
        # Só o status: o corpo do erro é de um serviço externo e devolvê-lo
        # ao cliente expõe detalhe de infraestrutura que não é nosso.
        return {"cnpj_lookup_error": f"consulta de CNPJ falhou ({response.status_code})"}
    return {"company_data": response.json()}
