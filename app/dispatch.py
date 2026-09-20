"""Sends a qualified lead result to a configurable outbound destination — a generic
webhook (Slack, n8n, any CRM's inbound-webhook URL). Swap this for a CRM SDK call
if you need something more specific than a webhook.
"""

import httpx

from app.config import settings
from app.models import LeadResult


async def dispatch(result: LeadResult) -> bool:
    if not settings.outbound_webhook_url:
        return False
    if result.score < settings.min_score_to_dispatch:
        return False

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(settings.outbound_webhook_url, json=result.model_dump())
        return not response.is_error
