import pytest
from httpx import ASGITransport, AsyncClient

import app.main as main_module
from app.main import app


@pytest.mark.asyncio
async def test_ingest_lead_returns_score_and_dispatch_flag(monkeypatch):
    async def fake_enrich(lead):
        return {"company_data": {"razao_social": "EXEMPLO LTDA"}}

    async def fake_score(lead, enrichment):
        return 85, "Company has an active CNPJ and a clear buying intent message."

    async def fake_dispatch(result):
        return True

    async def fake_save_result(session, result):
        return None

    monkeypatch.setattr(main_module, "enrich", fake_enrich)
    monkeypatch.setattr(main_module, "score", fake_score)
    monkeypatch.setattr(main_module, "dispatch", fake_dispatch)
    monkeypatch.setattr(main_module, "save_result", fake_save_result)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/leads/ingest",
            json={"name": "Ana", "email": "ana@exemplo.com", "cnpj": "19131243000197"},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["score"] == 85
    assert body["dispatched"] is True
