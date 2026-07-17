---
title: "AI RAG Routing and Streaming Latency Improvement"
description: "Reduce AI chat perceived and measured latency by routing retrieval only when needed and improving streaming status before answer tokens."
status: completed
priority: P1
branch: "dev"
tags: [backend, ai, rag, performance, streaming]
blockedBy: [20260628-1021-ai-latency-timing-eval]
blocks: []
created: "2026-06-28T08:59:00.412Z"
createdBy: "ck:plan"
source: skill
---

# AI RAG Routing and Streaming Latency Improvement

## Overview

Braintrust traces show the current Socratic chat path spends significant time before answer streaming starts. The strongest measured hidden bottleneck is not Supabase vector search; it is `analyze` work, especially `agent.intent_classify` at roughly 2.3s p50 in recent traces. This plan validates the brainstorm conclusion, then implements a narrow routing and UX latency improvement:

- Do not run RAG for every request.
- Do not run an LLM intent classifier for obvious cases.
- Preserve course-grounded answers when retrieval is actually needed.
- Stream useful progress events immediately, but do not stream factual answer text before retrieval is ready.

The goal is a safer, smaller change than a full RAG architecture rewrite. Hybrid retrieval, contextual embeddings, reranking, and GraphRAG remain quality improvements for later, not the first latency target.

## Research Validation

- OpenAI latency guidance says token generation is usually the highest latency step and recommends reducing output tokens, reducing input tokens, making fewer requests, and streaming for perceived latency. Source: https://developers.openai.com/api/docs/guides/latency-optimization
- OpenAI streaming docs confirm typed semantic streaming events are the supported way to surface partial progress/output. Source: https://developers.openai.com/api/docs/guides/streaming-responses
- LangGraph's agentic RAG guidance explicitly frames retrieval agents as useful when an LLM decides whether to retrieve from a vector store or respond directly. Source: https://docs.langchain.com/oss/python/langgraph/agentic-rag
- Anthropic Contextual Retrieval improves retrieval quality via contextual embeddings/BM25/reranking, but it targets failed retrieval accuracy, not the measured routing latency bottleneck. Source: https://www.anthropic.com/news/contextual-retrieval
- Azure OpenAI latency guidance states streaming improves perceived latency by returning chunks as soon as available, even if total completion time is unchanged. Source: https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/latency

## Validated Brainstorm Decision

Recommended path: smart retrieval routing first, streaming UX second.

Rejected for this phase:

- Full agentic RAG rewrite: too much blast radius.
- Always-RAG: contradicts both product need and measured traces.
- Reranking/contextual embeddings first: likely improves quality, but does not address the observed `agent.intent_classify` and pre-token latency.
- Streaming answer before retrieval: risks hallucinated citations and wrong course grounding.

## Scope

In scope:

- Braintrust-backed diagnosis baseline before changes.
- Rule-based fast paths for obvious `general`, obvious `academic`, and selected concept cases.
- LLM classifier only for ambiguous free-form queries.
- SSE progress/status events that start immediately and reflect routing/retrieval state.
- Focused tests and benchmark comparison.

Out of scope:

- New vector database schema.
- Reranker integration.
- Contextual chunk re-indexing.
- OpenAI Responses API migration.
- Frontend redesign beyond consuming existing SSE events if needed.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Diagnosis Baseline](./phase-01-diagnosis-baseline.md) | Completed |
| 2 | [Smart Retrieval Routing](./phase-02-smart-retrieval-routing.md) | Completed |
| 3 | [Streaming UX](./phase-03-streaming-ux.md) | Completed |
| 4 | [Validation and Rollback](./phase-04-validation-and-rollback.md) | Completed |

## Dependencies

- Blocks on evidence produced by [AI Latency Timing and Eval Diagnostics](../20260628-1021-ai-latency-timing-eval/plan.md).
- Uses reports:
  - [local eval report](../20260628-1021-ai-latency-timing-eval/reports/ai-latency-20260628-083947.md)
  - [Braintrust latency report](../20260628-1021-ai-latency-timing-eval/reports/braintrust-latency-20260628-084918.md)
- Affected code paths:
  - `src/agents/nodes/analyze_node.py`
  - `src/agents/graph.py`
  - `src/api/routes.py`
  - `scripts/eval_ai_latency.py`
  - `scripts/fetch_braintrust_latency.py`
  - `tests/test_agents/test_intent_router.py`
  - `tests/test_api/test_chat_stream.py`

## Acceptance Criteria

- Obvious academic queries such as RAG/vector database/embedding do not call `agent.intent_classify`.
- General queries still bypass RAG and academic citation validation.
- Ambiguous free-form queries can still use LLM classification.
- Braintrust post-change traces show `agent.intent_classify` absent from obvious academic traces.
- Local eval and Braintrust reports compare before/after p50 for `analyze`, `chat.stream`, `llm.respond_stream`, and `agent.intent_classify`.
- Streaming UX sends immediate progress events before long retrieval/LLM work, without sending unsupported factual answer text before retrieval finishes.
- Full backend test suite passes.
