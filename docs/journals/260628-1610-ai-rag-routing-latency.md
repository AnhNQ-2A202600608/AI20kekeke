---
date: 2026-06-28
topic: ai-rag-routing-latency
plan: 20260628-1600-ai-rag-routing-streaming-latency-improvement
---

# AI RAG Routing Latency

## Context

Braintrust traces showed high pre-answer latency in the Socratic chat path. The measured hidden cost was the LLM intent classifier inside `analyze`, not Supabase vector search.

## What Happened

- Added deterministic fast paths for general queries, selected concepts, and conservative academic course terms.
- Kept LLM classification for ambiguous free-form queries.
- Added immediate stream `thinking` status before backend session/history/memory work.
- Ran focused tests, full backend tests, local latency eval, and Braintrust fetch.

## Decisions

- Keep the routing fast path because obvious academic traces no longer include `agent.intent_classify`.
- Do not expand retrieval architecture yet; RAG quality work should wait until answer quality, not latency, justifies it.
- Treat `llm.respond_stream` as the next latency target.

## Next

- Reduce answer generation latency through prompt/input reduction, output budget control, model routing, and history trimming.
