---
phase: 3
title: "Streaming UX"
status: completed
priority: P2
dependencies: [2]
---

# Phase 3: Streaming UX

## Overview

Improve perceived latency without weakening answer grounding. The app already uses SSE, but answer tokens start only after analyze/RAG completes. This phase ensures immediate progress events and clearer retrieval state before answer streaming.

## Requirements

- Functional: emit an immediate SSE `thinking` event at stream start.
- Functional: emit explicit routing/retrieval progress events:
  - checking route
  - retrieving course material when retrieval is selected
  - composing answer
- Non-functional: do not stream factual/cited answer text before retrieval is complete.
- Non-functional: keep existing SSE event names compatible unless frontend changes are explicitly needed.

## Architecture

Use existing event channels:

```text
event: thinking
data: {"text": "..."}

event: tool_call
data: {"tool_name": "RAG match_slides", ...}

event: tool_result
data: {"tool_name": "RAG match_slides", ...}

event: token
data: {"delta": "..."}
```

The backend should surface useful status immediately. This reduces blank-screen time but does not change total model time.

## Related Code Files

- Modify: `src/api/routes.py`
- Possibly modify: `src/agents/nodes/analyze_node.py`
- Modify/add tests: `tests/test_api/test_chat_stream.py`

## Implementation Steps

1. Add immediate `thinking` event before LangGraph starts.
2. Ensure `analyze_node` dispatches clear status before expensive classifier/RAG work.
3. Verify frontend already renders `thinking`, `tool_call`, and `tool_result`; avoid frontend changes if existing rendering is sufficient.
4. Add/adjust stream test to assert first event arrives before answer token.
5. Run focused stream tests and full backend tests.

## Success Criteria

- [x] First SSE event is emitted immediately for stream requests.
- [x] Academic RAG requests show retrieval status before answer tokens.
- [x] No answer token is emitted before routing/retrieval completes.
- [x] Existing frontend event contract remains compatible.

## Result

- `stream_chat_response` now emits an immediate `thinking` event before session/history/memory and LangGraph work.
- `analyze_node` emits coarse `thinking` events before route classification and retrieval.
- Focused test: `uv run python -m pytest tests/test_api/test_chat_stream.py -q` passed.

## Risk Assessment

- Risk: too many progress events feel noisy.
- Mitigation: keep events coarse and stable.
- Risk: frontend does not render existing status events well.
- Mitigation: treat frontend polish as a separate follow-up unless contract is broken.
