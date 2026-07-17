---
phase: 4
title: "Decision Report"
status: pending
priority: P1
dependencies: [3]
effort: "S"
---

# Phase 4: Decision Report

## Overview

Turn timing/eval output into an evidence-based bottleneck decision. This phase prevents “optimize whatever looks suspicious” drift.

## Requirements

- Functional: produce a short decision report from the eval artifacts.
- Functional: rank bottlenecks by measured impact and confidence.
- Functional: name the next implementation target or explicitly say measurement is inconclusive.
- Non-functional: report should be understandable without reading raw JSON.

## Architecture

Report sections:

```text
1. Run context
2. Dataset/query categories
3. Summary table p50/p95
4. Timing breakdown by path
5. Bottleneck ranking
6. Decision
7. Next experiment if confidence is low
```

Decision rules:

| Evidence | Next Target |
| --- | --- |
| `profile/session/history/memory` > 25% of p50 before first token | batch/lazy Supabase pre-stream work |
| `rag_embedding` p95 dominates cold runs | embedding provider/cache/warmup |
| `rag_vector_rpc` dominates | Supabase RPC/index/query plan |
| `llm_first_token` dominates all paths | provider/model/timeout/prompt size |
| `llm_total` grows with answer length/history | prompt budget and output caps |
| reflection-trigger runs are extreme | reflection gating/async evaluation |
| client total much larger than server total | Next BFF/proxy/frontend stream path |

## Related Code Files

- Create output: `D:/CODE/AITHUCCHIEN/PROJECT/worktrees/C2-App-125-blue-perf-optimize-ai-rag-latency/plans/20260628-1021-ai-latency-timing-eval/reports/latency-decision-report.md`
- Optionally create: `D:/CODE/AITHUCCHIEN/PROJECT/worktrees/C2-App-125-blue-perf-optimize-ai-rag-latency/scripts/summarize_ai_latency.py` if summary logic becomes reusable.
- Read artifacts from: `D:/CODE/AITHUCCHIEN/PROJECT/worktrees/C2-App-125-blue-perf-optimize-ai-rag-latency/plans/20260628-1021-ai-latency-timing-eval/reports/`

## Implementation Steps

1. Run latency eval locally with current branch.
2. If possible, run against deployed/staging backend with same query set.
3. Compare general vs academic vs cached vs cold vs long-history categories.
4. Fill bottleneck ranking:
   - impact: p50/p95 contribution
   - confidence: number of runs and variance
   - reversibility: how risky the next fix is
5. Recommend one next optimization phase only.
6. Capture deferred candidates in a backlog section.
7. If data is inconclusive, define the smallest next measurement to disambiguate.

## Success Criteria

- [ ] Report contains p50/p95 summary tables.
- [ ] Report names the top bottleneck with evidence.
- [ ] Report separates backend server time from client/proxy time.
- [ ] Report recommends exactly one next optimization target.
- [ ] If no clear winner exists, report says why and proposes the next measurement.

## Risk Assessment

Risk: report overfits to one environment. Mitigation: label environment clearly and avoid production claims from local-only data.

Risk: averages hide tail latency. Mitigation: use p50/p95 and include raw result file path.
