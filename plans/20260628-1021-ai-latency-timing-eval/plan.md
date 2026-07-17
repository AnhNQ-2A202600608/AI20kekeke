---
title: AI Latency Timing and Eval Diagnostics
description: >-
  Integrate Braintrust-first tracing/evals for AI/RAG latency while keeping
  minimal local timing metadata for fallback debugging.
status: pending
priority: P1
branch: blue/perf/optimize-ai-rag-latency
tags:
  - backend
  - ai
  - rag
  - performance
  - eval
blockedBy: []
blocks: []
created: '2026-06-28T03:21:14.743Z'
createdBy: 'ck:plan'
source: skill
---

# AI Latency Timing and Eval Diagnostics

## Overview

Instrument the Socratic AI chat path with Braintrust spans and eval runs, then keep a minimal local timing fallback for tests/debugging. The goal is not to optimize blindly; it is to produce enough evidence to decide whether the next bottleneck is RAG embedding, Supabase vector RPC, LLM first token, LLM total streaming, prompt size, reflection loops, or frontend/proxy behavior.

Scope is intentionally narrow. Do not build a homegrown logging/eval platform. Braintrust is the source of truth for traces, prompts, retrieval metadata, errors, and eval runs. Local `metadata.timings_ms` remains a thin fallback with only core fields.

## Scout Context

- Existing `/chat` already returns `metadata.timings_ms.graph` and `metadata.timings_ms.total`. This plan replaces broad local timing expansion with Braintrust spans while keeping local fallback keys: `total`, `rag_embedding`, `rag_vector_rpc`, `llm_first_token`, `llm_total`.
- Existing [RAG eval plan](../20260613-2055-rag-evaluation-ragas-trulens/plan.md) is quality-focused and tool-heavy. This plan is latency-focused and should stay lighter.
- Existing [telemetry plan](../20260613-2107-standardized-logging-telemetry/plan.md) is broad schema/logging infrastructure. This plan should produce a minimal timing contract first.
- Current branch already contains RAG latency optimizations; this plan measures whether those changes moved the bottleneck elsewhere.

## Non-Goals

- No Langfuse/TruLens/Ragas integration in this pass.
- No new database tables.
- No custom logging/eval platform beyond a small Braintrust adapter and one eval runner.
- No behavior-changing latency optimization until measurement identifies the dominant contributor.
- No fake eval data. Use deterministic local mocks for unit tests and real configured services only for opt-in integration runs.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Instrumentation Contract](./phase-01-instrumentation-contract.md) | Completed |
| 2 | [Timing Implementation](./phase-02-timing-implementation.md) | Completed |
| 3 | [Latency Eval Harness](./phase-03-latency-eval-harness.md) | Completed |
| 4 | [Decision Report](./phase-04-decision-report.md) | Pending |

## Dependencies

- Related context: `plans/20260613-2107-standardized-logging-telemetry/plan.md`
- Related context: `plans/20260613-2055-rag-evaluation-ragas-trulens/plan.md`
- Current worktree changes in `src/services/rag.py`, `src/agents/nodes/analyze_node.py`, and `db/supabase/migrations/20260628_optimize_match_slides_latency.sql` should be included when benchmarking.

## Acceptance Criteria

- Braintrust spans capture chat route, stream response, analyze/intent, RAG retrieval, embedding, vector RPC, LLM stream first token, LLM total, reflection, errors, prompt/retrieval metadata, and eval runs when `BRAINTRUST_API_KEY` is configured.
- Local metadata timings include only: `total`, `rag_embedding`, `rag_vector_rpc`, `llm_first_token`, `llm_total`.
- Eval harness can run a fixed query set multiple times, optionally log Braintrust experiment rows, and write machine-readable JSON plus human-readable Markdown fallback artifacts.
- Output report ranks bottlenecks by p50/p95 and contribution to total latency.
- Tests verify timing fields exist without requiring real OpenAI/Supabase calls.
- Final recommendation names the next optimization target with evidence.
