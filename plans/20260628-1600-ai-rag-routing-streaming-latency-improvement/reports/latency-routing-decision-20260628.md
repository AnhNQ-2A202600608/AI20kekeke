# AI RAG Routing Latency Decision

- Generated: 2026-06-28
- Baseline local report: `../20260628-1021-ai-latency-timing-eval/reports/ai-latency-20260628-083947.md`
- Baseline Braintrust report: `../20260628-1021-ai-latency-timing-eval/reports/braintrust-latency-20260628-084918.md`
- After local report: `ai-latency-20260628-090618.md`
- After Braintrust report: `braintrust-latency-20260628-090800.md`

## Change

The chat analyzer now uses deterministic fast paths before the LLM intent classifier:

1. General greeting/profile/capability heuristic.
2. Selected non-general concept fast path.
3. Conservative academic term heuristic.
4. Existing LLM classifier only for ambiguous free-form queries.

Streaming also emits an immediate `thinking` SSE event when the stream starts, before session/history/memory and LangGraph work.

## Measurement Summary

| Metric | Before | After | Read |
|---|---:|---:|---|
| Academic cached client p50 | 8361.23 ms | 6094.26 ms | Improved |
| Academic cached first token p50 | 4525.18 ms | 3213.8 ms | Improved |
| Academic cold client p50 | 9172.72 ms | 7723.26 ms | Improved |
| Academic cold first token p50 | 4606.95 ms | 3173.17 ms | Improved |
| General client p50 | 2980.53 ms | 3056.7 ms | Roughly flat |
| Long history client p50 | 7556.71 ms | 10110.53 ms | Worse in this small sample |
| Braintrust `analyze` p50 | 4188.59 ms | 630.78 ms | Improved |
| Braintrust `agent.intent_classify` | 2 old traced calls | 0 in new obvious academic traces | Target met |
| Braintrust `llm.respond_stream` p50 | 3220.86 ms | 5470.14 ms | Now the main bottleneck |

The after Braintrust fetch includes older traces in the 200-event window, so its aggregate span table still lists `agent.intent_classify`. Manual filtering of recent roots created after `2026-06-28T09:06:41Z` shows the obvious academic eval traces contain `analyze`, `rag.retrieve`, and `respond_academic`, but not `agent.intent_classify`.

## Decision

Keep the routing fast path. It removes the hidden classifier latency for obvious academic questions and materially reduces `analyze` p50.

The next bottleneck is answer generation, not vector retrieval. Remaining work should target:

- shorter Socratic output budget or stricter response shape;
- prompt/input reduction for `respond_academic`;
- model routing by query complexity;
- prompt caching effectiveness and history trimming;
- optional later retrieval quality work such as rerank/contextual retrieval if answer quality needs it.

## Risk Notes

- The sample size is small. Treat the direction as valid for the classifier bottleneck, but not as a production SLO.
- `long_history` worsened because LLM output generation dominated this run. Routing cannot fix that class alone.
- Academic heuristic terms should remain conservative until course taxonomy can drive routing.
