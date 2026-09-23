FROM python:3.13-slim

# uv fixado: com `pip install uv` a ferramenta que lê o lockfile mudava a cada build.
COPY --from=ghcr.io/astral-sh/uv:0.11.9 /uv /bin/uv

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PATH="/app/.venv/bin:$PATH"

WORKDIR /app

# Dependências do uv.lock, não resolvidas de novo: a imagem roda exatamente o
# que o CI testou. --locked falha se o lock estiver dessincronizado.
# Separado do código para a camada sobreviver a mudanças em app/.
COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-dev --no-install-project

COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./alembic.ini
RUN uv sync --locked --no-dev

# Sem root. /data nasce deste usuário para o volume nomeado do compose herdar
# o dono na primeira montagem — é lá que fica o SQLite.
RUN useradd --system --uid 10001 --no-create-home app \
    && mkdir /data && chown app /data
USER app

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
