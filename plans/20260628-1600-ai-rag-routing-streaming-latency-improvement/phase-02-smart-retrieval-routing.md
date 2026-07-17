---
phase: 2
title: "Smart Retrieval Routing"
status: completed
priority: P1
dependencies: [1]
---

# Phase 2: Smart Retrieval Routing

## Overview

Reduce pre-answer latency by avoiding the LLM intent classifier when the query route is obvious. This does not remove RAG; it makes retrieval conditional and cheaper to decide.

## Requirements

- Functional: classify obvious routes without LLM:
  - `general`: greeting/profile/bot capability/simple social query
  - `academic`: known course/domain terms or selected non-general `concept_id`
  - `ambiguous`: use current LLM classifier
- Functional: preserve low-similarity fallback from academic to general.
- Non-functional: keep behavior backward compatible for ambiguous queries.

## Architecture

Routing policy:

```text
if general heuristic:
    intent = general
elif concept_id exists and concept_id != general:
    intent = academic
elif academic heuristic:
    intent = academic
else:
    intent = await classify_query_intent(...)
```

Academic heuristic must be conservative. It should only cover obvious in-syllabus terms already present in current prompts/docs, such as RAG, retrieval, embedding, vector database, prompt engineering, tool calling, LangChain, LangGraph, Docker, ETL/ELT, React, Next.js, Elo/BKT, Supabase/Postgres.

## Related Code Files

- Modify: `src/agents/nodes/analyze_node.py`
- Modify: `tests/test_agents/test_intent_router.py`
- Possibly modify: `tests/test_api/test_chat_stream.py`

## Implementation Steps

1. Add `is_academic_query_heuristic(query: str) -> bool`.
2. Update `analyze_node` route order:
   - general heuristic first
   - selected concept fast path
   - academic heuristic
   - LLM classifier fallback
3. Add unit tests:
   - academic heuristic positive examples
   - general heuristic remains unchanged
   - obvious academic query bypasses `classify_query_intent`
   - ambiguous query still calls classifier
   - low-similarity RAG fallback still downgrades to general
4. Run focused tests:
   `uv run python -m pytest tests/test_agents/test_intent_router.py -q`
5. Run full backend tests:
   `uv run python -m pytest -q`

## Success Criteria

- [x] Obvious academic eval queries bypass `agent.intent_classify`.
- [x] No behavior regression for general greetings/profile questions.
- [x] Ambiguous out-of-syllabus query can still route through classifier.
- [x] Focused and full tests pass.

## Result

- Added conservative academic fast path and selected concept fast path in `src/agents/nodes/analyze_node.py`.
- Preserved LLM classifier fallback for ambiguous free-form queries.
- Focused test: `uv run python -m pytest tests/test_agents/test_intent_router.py -q` passed with 11 tests.

## Risk Assessment

- Risk: false academic route for terms like "prompt" in a general context.
- Mitigation: keep list narrow; preserve RAG low-similarity fallback; measure false positives in Braintrust.
- Risk: hardcoded domain terms age over time.
- Mitigation: keep function small and test-covered; later replace with configurable course taxonomy if needed.
