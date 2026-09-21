"""Service-to-service API key auth.

This is not a human login system — lead-router is called by webhooks, n8n,
and other backends, never by a browser session. A shared secret in a header
is the correct primitive here; JWT/session cookies would be the wrong tool
for a machine-to-machine API.
"""

import secrets

from fastapi import Header, HTTPException, status

from app.config import settings


def verify_auth_config() -> None:
    """Fail-closed: aborta a inicialização em vez de servir sem autenticação.

    Antes, API_KEYS vazio desligava a auth silenciosamente — um deploy que
    esquecesse a variável ficava aberto e nada indicava isso. Agora o app não
    sobe. Chamado no lifespan (app/main.py).
    """
    if settings.environment == "prod" and not settings.api_key_set:
        raise RuntimeError(
            "API_KEYS é obrigatório quando ENVIRONMENT=prod. "
            "Defina ao menos uma chave, ou use ENVIRONMENT=dev localmente."
        )


async def require_api_key(x_api_key: str = Header(default="")) -> str:
    valid_keys = settings.api_key_set
    if not valid_keys:
        # Só alcançável em dev: verify_auth_config() impede que um processo em
        # prod chegue até aqui sem chave configurada.
        return x_api_key

    # compare_digest evita vazar quanto do prefixo bateu via tempo de resposta.
    if not any(secrets.compare_digest(x_api_key, key) for key in valid_keys):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid X-API-Key header",
        )
    return x_api_key
