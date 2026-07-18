---
phase: 4
title: "Validation and Rollback"
status: completed
priority: P1
dependencies: [3]
---

# Phase 4: Validation and Rollback

## Overview

Prove the routing/streaming changes improve the measured target and do not degrade answer routing quality. Keep rollback simple.

## Requirements

- Functional: produce before/after local eval and Braintrust reports.
- Functional: validate route decisions on representative query categories.
- Non-functional: avoid committing secrets or noisy generated logs.

## Validation Matrix

| Query type | Expected route | RAG? | Classifier? |
|---|---|---:|---:|
| `chào bạn` | general | no | no |
| `bạn biết gì về tôi` | general/profile | no | no |
| `RAG khác fine-tuning thế nào?` | academic | yes | no |
| `giải thích vector database trong production RAG` | academic | yes | no |
| ambiguous off-topic technical query | classifier result | maybe | yes |
| selected concept query | academic | yes | no |

## Related Code Files

- Read: `plans/20260628-1021-ai-latency-timing-eval/reports/*.md`
- Create: `plans/20260628-1600-ai-rag-routing-streaming-latency-improvement/reports/*.md`
- Modify if needed: `scripts/eval_ai_latency.py`
- Modify if needed: `scripts/fetch_braintrust_latency.py`

## Implementation Steps

1. Run full tests:
   `uv run python -m pytest -q`
2. Run local latency eval with Braintrust logging.
3. Fetch Braintrust logs after eval.
4. Compare:
   - `agent.intent_classify` count and duration
   - `analyze` p50/p95
   - `chat.stream` p50/p95
   - client first token
   - `llm.respond_stream`
5. Write a decision report:
   - measured win/loss
   - observed risks
   - next target if remaining latency is LLM output length
6. Rollback rule:
   - if false routing or answer grounding regressions appear, revert only phase 2 routing change and keep observability/reporting.

## Success Criteria

- [x] `agent.intent_classify` is absent for obvious academic eval traces.
- [x] `analyze` p50 improves materially for academic eval queries.
- [x] General route behavior remains intact.
- [x] No new test failures.
- [x] Decision report names next bottleneck.

## Result

- Full backend suite: `uv run python -m pytest -q` passed with 82 tests, 2 skipped.
- Local eval: `reports/ai-latency-20260628-090618.md`.
- Braintrust fetch: `reports/braintrust-latency-20260628-090800.md`.
- Decision: keep routing fast path; next bottleneck is `llm.respond_stream` / answer generation.

## Risk Assessment

- Risk: benchmark noise hides improvement.
- Mitigation: use Braintrust span count/duration as primary evidence, not only total wall time.
- Risk: OpenAI/provider latency dominates after routing fix.
- Mitigation: record that as next target: shorter output, model routing, prompt/input reduction, or prompt caching.
