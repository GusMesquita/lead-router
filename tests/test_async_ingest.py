"""O contrato assíncrono de /leads/ingest.

O critério desta fatia é o primeiro teste: o POST responde sem que uma única
chamada de LLM aconteça. Se alguém reintroduzir o enriquecimento ou a pontuação
no caminho da requisição, este arquivo quebra.
"""

import pytest
from httpx import ASGITransport, AsyncClient

import app.main as main_module
import app.worker as worker_module
from app.db.models import LeadStatus
from app.db.session import get_session
from app.main import app
from app.models import LeadIn
from app.repository import create_pending, get_lead

LEAD = {"name": "Ana", "email": "ana@exemplo.com", "cnpj": "19131243000197"}


@pytest.fixture
def fila(monkeypatch) -> list[str]:
    """Captura o que foi enfileirado; sem isto o teste exigiria um Redis de pé."""
    enfileirados: list[str] = []

    async def fake_enqueue(lead_id: str) -> None:
        enfileirados.append(lead_id)

    monkeypatch.setattr(main_module, "enqueue_lead", fake_enqueue)
    return enfileirados


async def _post(client: AsyncClient, **kwargs):
    return await client.post("/leads/ingest", json=LEAD, **kwargs)


@pytest.mark.asyncio
async def test_post_responde_202_sem_chamar_o_llm(fila, monkeypatch):
    def explode(*args, **kwargs):
        raise AssertionError("o caminho da requisição não pode chamar enrich/score")

    # Vigia os dois módulos: mesmo que alguém volte a importar no main.
    monkeypatch.setattr("app.enrichment.enrich", explode)
    monkeypatch.setattr("app.scoring.score", explode)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await _post(client)

    assert response.status_code == 202
    body = response.json()
    assert body["status"] == LeadStatus.PENDING
    assert body["id"]
    assert fila == [body["id"]]
    # 202 não devolve resultado: quem quiser o score consulta GET /leads/{id}.
    assert "score" not in body


@pytest.mark.asyncio
async def test_get_lead_devolve_pending_e_depois_o_resultado(fila, monkeypatch):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        lead_id = (await _post(client)).json()["id"]

        pendente = (await client.get(f"/leads/{lead_id}")).json()
        assert pendente["status"] == LeadStatus.PENDING
        assert pendente["score"] is None
        assert pendente["reasoning"] is None

        async def fake_enrich(lead):
            return {"company_data": {"razao_social": "EXEMPLO LTDA"}}

        async def fake_score(lead, enrichment):
            return 85, "CNPJ ativo e mensagem com intenção clara."

        async def fake_dispatch(result):
            return True

        monkeypatch.setattr(worker_module, "enrich", fake_enrich)
        monkeypatch.setattr(worker_module, "score", fake_score)
        monkeypatch.setattr(worker_module, "dispatch", fake_dispatch)
        await worker_module.process_lead({}, lead_id)

        pronto = (await client.get(f"/leads/{lead_id}")).json()

    assert pronto["status"] == LeadStatus.DONE
    assert pronto["score"] == 85
    assert pronto["dispatched"] is True
    assert pronto["error"] is None


@pytest.mark.asyncio
async def test_get_lead_inexistente_e_404(fila):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/leads/nao-existe")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_idempotency_key_nao_cria_lead_duplicado(fila):
    headers = {"Idempotency-Key": "form-submit-42"}
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        primeira = await _post(client, headers=headers)
        segunda = await _post(client, headers=headers)

    assert primeira.status_code == segunda.status_code == 202
    assert primeira.json()["id"] == segunda.json()["id"]
    # E, mais importante que o id: o replay não gerou outro job — cada job
    # custa uma chamada ao LLM.
    assert fila == [primeira.json()["id"]]


@pytest.mark.asyncio
async def test_sem_idempotency_key_cada_post_e_um_lead_novo(fila):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        primeira = await _post(client)
        segunda = await _post(client)

    assert primeira.json()["id"] != segunda.json()["id"]
    assert len(fila) == 2


@pytest.mark.asyncio
async def test_corrida_na_mesma_chave_devolve_o_lead_que_ganhou(monkeypatch):
    """Simula o índice único disparando: duas requisições ao mesmo tempo.

    Sem o tratamento de IntegrityError em create_pending, este caminho viraria
    500 em vez de devolver o lead que a corrida já criou.
    """
    lead = LeadIn(**LEAD)
    chave = "corrida-1"

    async for session in get_session():
        vencedor, criado = await create_pending(session, lead, idempotency_key=chave)
        assert criado
        break

    # A segunda requisição não enxerga o vencedor na checagem prévia, como
    # aconteceria se as duas transações fossem simultâneas.
    import app.repository as repo

    original = repo.find_by_idempotency_key
    primeira_chamada = {"feita": False}

    async def find_cego(session, key):
        if not primeira_chamada["feita"]:
            primeira_chamada["feita"] = True
            return None
        return await original(session, key)

    monkeypatch.setattr(repo, "find_by_idempotency_key", find_cego)

    async for session in get_session():
        perdedor, criado = await repo.create_pending(session, lead, idempotency_key=chave)
        break

    assert not criado
    assert perdedor.id == vencedor.id


@pytest.mark.asyncio
async def test_falha_no_worker_marca_o_lead_como_failed(fila, monkeypatch):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        lead_id = (await _post(client)).json()["id"]

        async def enrich_quebrado(lead):
            raise RuntimeError("BrasilAPI fora do ar em https://interno/segredo")

        monkeypatch.setattr(worker_module, "enrich", enrich_quebrado)
        with pytest.raises(RuntimeError):
            # Propaga de propósito: é o que faz o arq retentar o job.
            await worker_module.process_lead({}, lead_id)

        falhou = (await client.get(f"/leads/{lead_id}")).json()

    assert falhou["status"] == LeadStatus.FAILED
    # Só a classe do erro: a mensagem crua carregava uma URL interna, e este
    # campo é devolvido pela API.
    assert falhou["error"] == "RuntimeError"
    assert "interno" not in (falhou["error"] or "")


@pytest.mark.asyncio
async def test_worker_nao_repontua_lead_ja_processado(fila, monkeypatch):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        lead_id = (await _post(client)).json()["id"]

    chamadas = {"score": 0}

    async def fake_enrich(lead):
        return {}

    async def fake_score(lead, enrichment):
        chamadas["score"] += 1
        return 70, "ok"

    async def fake_dispatch(result):
        return False

    monkeypatch.setattr(worker_module, "enrich", fake_enrich)
    monkeypatch.setattr(worker_module, "score", fake_score)
    monkeypatch.setattr(worker_module, "dispatch", fake_dispatch)

    await worker_module.process_lead({}, lead_id)
    # Reentrega do arq depois de um crash, ou job duplicado.
    await worker_module.process_lead({}, lead_id)

    assert chamadas["score"] == 1

    async for session in get_session():
        record = await get_lead(session, lead_id)
        break
    assert record.status == LeadStatus.DONE


@pytest.mark.asyncio
async def test_worker_ignora_lead_inexistente(monkeypatch):
    def explode(*args, **kwargs):
        raise AssertionError("não deveria enriquecer um lead que não existe")

    monkeypatch.setattr(worker_module, "enrich", explode)
    await worker_module.process_lead({}, "id-que-nunca-existiu")
