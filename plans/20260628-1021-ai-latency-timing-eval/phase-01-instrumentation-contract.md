---
phase: 1
title: Instrumentation Contract
status: completed
priority: P1
dependencies: []
effort: S
---

# Phase 1: Instrumentation Contract

## Overview

Define the Braintrust-first tracing contract and the minimal local timing fallback. This keeps measurement stable without creating a parallel observability platform.

## Requirements

- Functional: Braintrust records spans for route, stream response, analyze, RAG, embedding, vector RPC, LLM stream, reflection, and eval runs.
- Functional: every chat response exposes only fallback `metadata.timings_ms` keys for `total`, `rag_embedding`, `rag_vector_rpc`, `llm_first_token`, and `llm_total`.
- Functional: every timing span uses monotonic time and records milliseconds rounded to 2 decimals.
- Functional: timing keys are additive where possible and never require secrets, raw prompts, tokens, or PII.
- Non-functional: instrumentation overhead must be negligible versus network/LLM latency.
- Non-functional: missing optional spans should be absent or `null`, not guessed.

## Architecture

Use a small optional Braintrust adapter plus a request-local timing collector. Keep local metadata intentionally small:

```text
FastAPI /chat
  request_total
  stream_chat_response
    graph_total
      analyze_intent
      rag_total
        rag_embedding
        rag_vector_rpc
      llm_first_token
      llm_total
      reflection_total
```

The contract should support both streaming and non-streaming route behavior.

## Related Code Files

- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/worktrees/C2-App-125-blue-perf-optimize-ai-rag-latency/src/models/schemas.py` if metadata typing needs clarification.
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/worktrees/C2-App-125-blue-perf-optimize-ai-rag-latency/src/agents/state.py` if timing collector must travel through LangGraph state.
- Create: `D:/CODE/AITHUCCHIEN/PROJECT/worktrees/C2-App-125-blue-perf-optimize-ai-rag-latency/src/services/timing.py` only if a shared helper reduces duplication.
- Modify tests under `D:/CODE/AITHUCCHIEN/PROJECT/worktrees/C2-App-125-blue-perf-optimize-ai-rag-latency/tests/`.

## Implementation Steps

1. Inventory existing response metadata shapes in API tests and frontend stream parsing.
2. Decide exact span names and document them in this phase before implementation.
3. Choose collector design:
   - Preferred: tiny `TimingCollector` context/helper with `span(name)` context manager.
   - Fallback: local helper functions in `routes.py` if shared helper is overkill.
4. Define how nested spans roll up:
   - `total` = request end-to-end backend time.
   - `graph` = LangGraph execution time.
   - `rag_total` = retrieval-only time inside analyze node.
   - `llm_first_token` = time from LLM stream start until first emitted token.
5. Define correlation fields allowed in logs: request id/session id only; no raw message body.
6. Add expected metadata examples to the plan or test fixtures.

## Success Criteria

- [ ] Braintrust span list is finalized before implementation.
- [ ] Local timing key list is limited to the five fallback fields.
- [ ] Streaming and non-streaming routes have the same top-level timing contract where applicable.
- [ ] The plan identifies which spans are backend-only and which require frontend measurement.
- [ ] No schema requires secrets, raw prompt text, or student personal data.

## Risk Assessment

Risk: too many spans create noisy, brittle tests. Mitigation: test required core keys and allow optional keys only when code path runs.

Risk: timing collector leaks mutable state across requests. Mitigation: instantiate per request and avoid global mutable timing data.
