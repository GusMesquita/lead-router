"""Enriches a lead with public data before scoring. Currently: CNPJ lookup via BrasilAPI.

Swappable — point at the brasilapi-mcp-server HTTP endpoint instead of calling
BrasilAPI directly if you're already running that service:
    BRASILAPI_URL=http://localhost:8001/api
"""

import httpx

from app.config import settings
from app.models import LeadIn


async def enrich(lead: LeadIn) -> dict:
    if not lead.cnpj:
        return {}

    digits = "".join(filter(str.isdigit, lead.cnpj))
    # Sem o check de tamanho, um CNPJ vazio vira `/cnpj/v1/` (outro endpoint) e
    # qualquer lixo vira uma chamada garantidamente perdida para fora.
    if len(digits) != 14:
        return {"cnpj_lookup_error": "CNPJ deve ter 14 dígitos"}

    async with httpx.AsyncClient(base_url=settings.brasilapi_url, timeout=10.0) as client:
        response = await client.get(f"/cnpj/v1/{digits}")
        if response.is_error:
            # Só o status: o corpo do erro é de um serviço externo e devolvê-lo
            # ao cliente expõe detalhe de infraestrutura que não é nosso.
            return {"cnpj_lookup_error": f"consulta de CNPJ falhou ({response.status_code})"}
        return {"company_data": response.json()}
