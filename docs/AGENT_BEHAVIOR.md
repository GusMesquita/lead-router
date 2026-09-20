# Scoring agent behavior contract

`app/scoring.py` is the only place an LLM makes a decision in this system.
This document is what any caller — the dashboard, an n8n workflow, a human
reading a log — is entitled to assume about that decision.

## Contract

- **Output is always `{"score": int 0-100, "reasoning": str}` — nothing else.**
  The system prompt demands strict JSON and forbids any other shape. If the
  model returns malformed JSON, `json.loads` raises and the request fails
  loudly (500) rather than silently persisting a garbage score.
- **The agent scores buying intent, not tone.** The system prompt explicitly
  says a friendly-but-unqualified lead should score low. This is the one
  business rule embedded in the prompt; changing it changes what "qualified"
  means for every downstream consumer (dispatch threshold, dashboard).
- **The model never sees dispatch destinations, webhook URLs, or API keys.**
  Only `lead.model_dump()` and the enrichment `dict` reach the prompt —
  scoping the blast radius of a prompt-injection attempt in a lead's own
  `message` field to "a wrong score," never "a leaked secret or an SSRF."
- **Determinism is not guaranteed.** Two identical leads can get different
  scores across calls. Do not build logic downstream that assumes score is
  stable for the same input — treat it as an opinion, not a computation.

## Failure mode by design

A lead that fails scoring (malformed JSON, API error, timeout) fails the
whole `/leads/ingest` request — it is not silently scored 0 and persisted.
This keeps `leads` free of a "fake score" category that would need to be
filtered everywhere downstream. If you need graceful degradation, catch the
exception at the call site and decide explicitly what a scoring failure means
for your dispatch policy.
