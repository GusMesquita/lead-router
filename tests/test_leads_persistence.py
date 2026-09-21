import pytest
from httpx import ASGITransport, AsyncClient

from app.db.session import get_session
from app.main import app
from app.models import LeadIn
from app.repository import create_pending, mark_done


@pytest.mark.asyncio
async def test_get_leads_returns_previously_saved_lead():
    async for session in get_session():
        record, _ = await create_pending(
            session, LeadIn(name="Bia", email="bia@exemplo.com"), idempotency_key=None
        )
        await mark_done(session, record, score=42, reasoning="test seed", dispatched=False)
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
