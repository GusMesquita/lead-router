"""Service-to-service API key auth.

This is not a human login system — lead-router is called by webhooks, n8n,
and other backends, never by a browser session. A shared secret in a header
is the correct primitive here (see AGENT_BEHAVIOR.md for the reasoning);
JWT/session cookies would be the wrong tool for a machine-to-machine API.
"""

import secrets

from fastapi import Header, HTTPException, status

from app.config import settings


async def require_api_key(x_api_key: str = Header(default="")) -> str:
    valid_keys = settings.api_key_set
    if not valid_keys:
        # No keys configured: auth is disabled. Acceptable for local dev,
        # never for a deployed instance — enforced only by documentation here.
        return x_api_key

    if not any(secrets.compare_digest(x_api_key, key) for key in valid_keys):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid X-API-Key header",
        )
    return x_api_key
