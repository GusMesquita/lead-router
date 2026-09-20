import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

import app.main as main_module
from app.db.session import get_session, init_db
from app.main import app
from app.models import LeadIn, LeadResult


@pytest_asyncio.fixture(autouse=True)
async def _init_db():
    await init_db()


@pytest.mark.asyncio
async def test_get_leads_returns_previously_saved_lead(monkeypatch):
    async for session in get_session():
        result = LeadResult(
            lead=LeadIn(name="Bia", email="bia@exemplo.com"),
            enrichment={},
            score=42,
            reasoning="test seed",
            dispatched=False,
        )
        await main_module.save_result(session, result)
        break

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/leads")

    assert response.status_code == 200
    names = [row["name"] for row in response.json()]
    assert "Bia" in names


@pytest.mark.asyncio
async def test_ingest_and_leads_require_api_key_when_configured(monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "api_keys", "secret-key")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        unauthorized = await client.get("/leads")
        authorized = await client.get("/leads", headers={"X-API-Key": "secret-key"})

    assert unauthorized.status_code == 401
    assert authorized.status_code == 200
