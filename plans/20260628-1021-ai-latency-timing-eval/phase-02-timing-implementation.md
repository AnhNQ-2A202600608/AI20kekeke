---
phase: 2
title: Timing Implementation
status: completed
priority: P1
dependencies:
  - 1
effort: M
---

# Phase 2: Timing Implementation

## Overview

Add low-overhead Braintrust instrumentation to the backend AI path without changing user-visible answer behavior. Local `metadata.timings_ms` stays minimal.

## Requirements

- Functional: include Braintrust spans for pre-stream DB work and graph/node work.
- Functional: include only core fallback timings in the final SSE `done` metadata.
- Functional: preserve current API contract for existing clients.
- Functional: tests should work without network calls by patching RAG/LLM/DB.
- Non-functional: Braintrust SDK is optional at runtime; app works when env vars are absent.
- Non-functional: instrumentation must not swallow exceptions or alter fallback behavior.

## Architecture

Backend timing points:

| Area | File | Spans |
| --- | --- | --- |
| API setup | `src/api/routes.py` | Braintrust spans: `chat.request`, `chat.session`, `chat.history`, `chat.memory`, `chat.message_save`; local: `total` |
| LangGraph | `src/agents/graph.py` or node state | `graph` |
| Intent/RAG | `src/agents/nodes/analyze_node.py` | Braintrust spans: `agent.analyze`, `agent.intent`, `rag.retrieve` |
| Retrieval | `src/services/rag.py` | Braintrust spans and local fallback: `rag_embedding`, `rag_vector_rpc` |
| Response | `src/agents/nodes/respond_node.py` | `llm_first_token`, `llm_total`, `citation_validation` |
| General response | `src/agents/nodes/respond_general_node.py` | `llm_first_token`, `llm_total` |
| Reflection | `src/agents/nodes/pedagogical_reflection_node.py` | `reflection_total`, `reflection_llm` |

Frontend timing points are optional in this phase but should be planned:

| Area | File | Spans |
| --- | --- | --- |
| Browser stream | `frontend/lib/chat/stream.ts` | `client_request_start`, `client_first_event`, `client_first_token`, `client_done` |
| BFF proxy | `frontend/app/api/v1/[...path]/route.ts` | proxy start/end logs only if backend timings are insufficient |

## Related Code Files

- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/worktrees/C2-App-125-blue-perf-optimize-ai-rag-latency/src/api/routes.py`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/worktrees/C2-App-125-blue-perf-optimize-ai-rag-latency/src/agents/nodes/analyze_node.py`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/worktrees/C2-App-125-blue-perf-optimize-ai-rag-latency/src/agents/nodes/respond_node.py`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/worktrees/C2-App-125-blue-perf-optimize-ai-rag-latency/src/agents/nodes/respond_general_node.py`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/worktrees/C2-App-125-blue-perf-optimize-ai-rag-latency/src/agents/nodes/pedagogical_reflection_node.py`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/worktrees/C2-App-125-blue-perf-optimize-ai-rag-latency/src/services/rag.py`
- Create or modify: `D:/CODE/AITHUCCHIEN/PROJECT/worktrees/C2-App-125-blue-perf-optimize-ai-rag-latency/src/services/timing.py`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/worktrees/C2-App-125-blue-perf-optimize-ai-rag-latency/tests/test_api/test_chat_stream.py`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/worktrees/C2-App-125-blue-perf-optimize-ai-rag-latency/tests/test_rag.py`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/worktrees/C2-App-125-blue-perf-optimize-ai-rag-latency/tests/test_agents/test_intent_router.py`

## Implementation Steps

1. Write or extend tests that assert `metadata.timings_ms` contains core fallback keys for streaming and non-streaming chat.
2. Add `TimingCollector` helper only if it keeps route/node code simpler.
3. Instrument API pre-stream work with Braintrust spans:
   - profile load outside generator
   - session validation/create
   - history load
   - student memory load
4. Pass timing collector through graph input state or merge node-returned timings into state.
5. Instrument analyze node around intent classification and RAG retrieval.
6. Instrument RAG internals around cache lookup, embedding, vector RPC, optional keyword/neighbor/fallback paths.
7. Instrument response nodes around LLM stream start, first token, total stream time, and citation validation.
8. Instrument reflection node only when it runs.
9. Include fallback timings in final SSE `done` event and non-streaming metadata.
10. Log a single structured summary per request at info level.
11. Run focused tests, then the existing AI/RAG test subset.

## Tests Before

- Add failing assertions to `tests/test_api/test_chat_stream.py` for final `done.metadata.timings_ms`.
- Add focused unit tests for `TimingCollector` if a helper is created.

## Tests After

- `python -m pytest tests/test_api/test_chat_stream.py -q`
- `python -m pytest tests/test_rag.py tests/test_agents/test_intent_router.py tests/test_agents/test_tools.py tests/test_api/test_chat_stream.py -q`

## Success Criteria

- [ ] Final SSE metadata contains core fallback timing keys only.
- [ ] Non-streaming chat metadata keeps parity for available spans.
- [ ] RAG cache-hit and cache-miss paths both report useful spans.
- [ ] Reflection spans appear only when reflection runs.
- [ ] Existing tests still pass without real provider calls.

## Risk Assessment

Risk: LangGraph streaming makes first-token timing awkward. Mitigation: measure first token in response node, where `llm.astream()` emits chunks.

Risk: timings become inaccurate if nested async tasks overlap. Mitigation: record elapsed wall time per awaited segment; do not claim additive totals when work is concurrent.
