# Braintrust Pivot Implementation Report

## Summary

Implemented Braintrust-first AI/RAG observability with a minimal local timing fallback.

## What Changed

- Added optional Braintrust adapter in `src/services/braintrust_observability.py`.
- Added local timing helper in `src/services/timing.py`.
- Added Braintrust spans around chat route, session/history/memory work, LangGraph request, RAG retrieval, embedding, vector RPC, LLM streaming, and reflection.
- Kept response behavior stable: Braintrust is no-op without `BRAINTRUST_API_KEY` and `BRAINTRUST_PROJECT`.
- Reduced local `metadata.timings_ms` fallback to only:
  - `total`
  - `rag_embedding`
  - `rag_vector_rpc`
  - `llm_first_token`
  - `llm_total`
- Added `scripts/eval_ai_latency.py` with local JSON/Markdown output and optional Braintrust logging via `--braintrust`.
- Added Braintrust env placeholders to `.env.example`.

## Validation

- `uv run python -m pytest tests/test_timing.py tests/test_eval_ai_latency.py tests/test_api/test_chat_stream.py -q`
  - Result: 7 passed.
- `uv run python -m pytest tests/test_rag.py tests/test_agents/test_intent_router.py tests/test_agents/test_tools.py tests/test_api/test_chat_stream.py tests/test_timing.py tests/test_eval_ai_latency.py -q`
  - Result: 28 passed.
- `uv run python -m pytest -q`
  - Result: 78 passed, 2 skipped.
- Scoped ruff check on changed Python files:
  - Result: passed.

## Benchmark Status

No live latency benchmark was run in this implementation pass because it needs a running backend URL and, for Braintrust experiment logging, Braintrust env vars.

Run locally:

```bash
uv run python scripts/eval_ai_latency.py --base-url http://localhost:8000/api/v1 --repetitions 5 --warmups 1 --braintrust
```

Required env vars for Braintrust logging:

```bash
BRAINTRUST_API_KEY=
BRAINTRUST_PROJECT=ai20k-latency
```

## Difference From Homegrown Eval Harness

- Previous direction: expand local metadata and build a larger local eval/reporting platform.
- Current direction: Braintrust is the trace/eval system of record; local JSON/Markdown artifacts are fallback only.
- Local API response metadata is intentionally smaller to avoid turning SSE metadata into an observability protocol.

## Follow-Up

- Run the eval script against local/staging backend with Braintrust env configured.
- Use Braintrust experiment traces to decide whether the next optimization target is embedding, vector RPC, LLM first token, LLM total, reflection, or client/proxy overhead.
- Review pre-existing `.env.example` secret hygiene separately.
