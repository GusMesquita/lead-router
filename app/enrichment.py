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
    async with httpx.AsyncClient(base_url=settings.brasilapi_url, timeout=10.0) as client:
        response = await client.get(f"/cnpj/v1/{digits}")
        if response.is_error:
            return {"cnpj_lookup_error": response.text}
        return {"company_data": response.json()}
