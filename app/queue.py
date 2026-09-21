"""Enfileiramento dos leads. O worker que consome a fila está em app/worker.py.

Um pool de Redis por processo, criado sob demanda e fechado no lifespan — o
mesmo padrão dos clientes HTTP deste repo. Abrir um pool por requisição joga
fora a conexão justamente no caminho que precisa ser barato.
"""

import logging

from arq import create_pool
from arq.connections import ArqRedis, RedisSettings

from app.config import settings

logger = logging.getLogger("lead_router.queue")

PROCESS_LEAD = "process_lead"

_pool: ArqRedis | None = None


def redis_settings() -> RedisSettings:
    return RedisSettings.from_dsn(settings.redis_url)


async def get_pool() -> ArqRedis:
    global _pool
    if _pool is None:
        _pool = await create_pool(redis_settings())
    return _pool


async def enqueue_lead(lead_id: str) -> None:
    pool = await get_pool()
    # _job_id = id do lead: se a mesma requisição for reenfileirada (retry da
    # API, replay de Idempotency-Key), o arq descarta o job duplicado em vez de
    # pontuar o mesmo lead duas vezes — cada chamada dessas custa um LLM.
    await pool.enqueue_job(PROCESS_LEAD, lead_id, _job_id=f"lead:{lead_id}")


async def aclose() -> None:
    global _pool
    if _pool is not None:
        await _pool.aclose()
        _pool = None
