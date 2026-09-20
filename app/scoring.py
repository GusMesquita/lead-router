"""Scores a lead 0-100 using Claude, given the lead's own message plus any enrichment data."""

import json

from anthropic import AsyncAnthropic

from app.config import settings
from app.models import LeadIn

_SYSTEM_PROMPT = """You are a sales lead qualification assistant. Given a lead's \
submitted info and any enrichment data about their company, respond with ONLY a JSON \
object: {"score": <0-100 integer>, "reasoning": "<one sentence>"}. Score reflects \
likelihood the lead is a qualified buyer, not their friendliness."""


async def score(lead: LeadIn, enrichment: dict) -> tuple[int, str]:
    client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    response = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=200,
        system=_SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": json.dumps({"lead": lead.model_dump(), "enrichment": enrichment}),
            }
        ],
    )
    payload = json.loads(response.content[0].text)
    return payload["score"], payload["reasoning"]
