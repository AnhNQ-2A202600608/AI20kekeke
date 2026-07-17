---
phase: 1
title: "Diagnosis Baseline"
status: completed
priority: P1
dependencies: []
---

# Phase 1: Diagnosis Baseline

## Overview

Lock the current latency evidence before changing behavior. Use Braintrust as the primary trace source and local eval JSON/Markdown as fallback.

## Requirements

- Functional: fetch recent Braintrust logs, group by trace/root span, and identify `analyze`, `agent.intent_classify`, `rag.retrieve`, `llm.respond_stream`, and `chat.stream`.
- Non-functional: do not expose API keys or raw private prompts in committed reports.

## Architecture

Current request path:

```text
/api/v1/chat
  -> load profile
  -> stream_chat_response
  -> LangGraph analyze
      -> general heuristic OR LLM intent classifier
      -> optional RAG
  -> respond_general/respond_academic
  -> optional reflection
  -> done event
```

The baseline should separate measured latency from perceived latency:

- measured server total: `metadata.timings_ms.total`
- perceived latency: client first token and first SSE event
- hidden pre-answer cost: Braintrust `analyze` and `agent.intent_classify`

## Implementation Steps

1. Run latest local eval against a dedicated local server using real configured env:
   `uv run python scripts/eval_ai_latency.py --base-url http://127.0.0.1:8012/api/v1 --repetitions 2 --warmups 1 --timeout 90 --braintrust`
2. Fetch Braintrust logs:
   `uv run python scripts/fetch_braintrust_latency.py --limit 100 --max-pages 2`
3. Compare before/after candidate targets:
   - `agent.intent_classify`
   - `analyze`
   - `rag.retrieve`
   - `llm.respond_stream`
   - `chat.stream`
4. Record a short diagnosis note in this plan's `reports/` folder.
5. Do not proceed to phase 2 if Braintrust does not show `agent.intent_classify` in traces or if a different larger bottleneck dominates.

## Success Criteria

- [x] Baseline report exists with local eval and Braintrust links.
- [x] Top 5 latency contributors are ranked by p50/p95.
- [x] Decision target is named with evidence.
- [x] Secrets are absent from committed artifacts.

## Result

- After-change local report: `reports/ai-latency-20260628-090618.md`.
- After-change Braintrust report: `reports/braintrust-latency-20260628-090800.md`.
- Decision report: `reports/latency-routing-decision-20260628.md`.
- Target confirmed: `agent.intent_classify` was the hidden pre-answer bottleneck for obvious academic queries before routing.

## Risk Assessment

- Risk: low sample size misleads optimization.
- Mitigation: run at least 2 measured repetitions per category and use Braintrust span-level evidence, not only local summary.
