---
phase: 3
title: Latency Eval Harness
status: completed
priority: P1
dependencies:
  - 2
effort: M
---

# Phase 3: Latency Eval Harness

## Overview

Create a repeatable Braintrust-aware latency eval runner that exercises representative chat paths and logs eval runs when Braintrust env vars are configured. It can still write local JSON/Markdown artifacts as fallback.

## Requirements

- Functional: run a fixed query set with configurable repetitions and warmups.
- Functional: collect backend timing metadata, wall-clock client time, status, token/character counts where available, and error details.
- Functional: support at least local backend URL and deployed backend URL.
- Functional: avoid committing secrets or real student personal data.
- Non-functional: one command should produce a Braintrust experiment when `BRAINTRUST_API_KEY`/project env vars exist, plus local artifacts for offline review.

## Architecture

Use a script instead of test-only code. Proposed command:

```bash
python scripts/eval_ai_latency.py --base-url http://localhost:8000/api/v1 --repetitions 5 --warmups 1 --braintrust --out plans/20260628-1021-ai-latency-timing-eval/reports
```

Query categories:

| Category | Purpose | Example |
| --- | --- | --- |
| general | bypass RAG, measure pure routing + general LLM | "chào bạn" |
| academic_cached | repeat same RAG query to measure cache hit | "RAG khác fine-tuning thế nào?" |
| academic_cold | unique RAG query to measure embedding/vector path | "giải thích vector database trong production RAG" |
| long_history | session reuse and prompt bloat | multiple turns in same session |
| reflection_trigger | worst-case critic path | query likely to produce code/exam-answer pattern |

Metrics:

| Metric | Source |
| --- | --- |
| `client_total_ms` | script wall clock |
| `server_total_ms` | `metadata.timings_ms.total` |
| `ttfb_ms` | first SSE event received |
| `first_token_ms` | first token event received |
| `timings_ms.*` | backend metadata |
| `answer_chars` | streamed answer length |
| `session_id` | final metadata |
| `error` | SSE/API error |

## Related Code Files

- Create: `D:/CODE/AITHUCCHIEN/PROJECT/worktrees/C2-App-125-blue-perf-optimize-ai-rag-latency/scripts/eval_ai_latency.py`
- Create: `D:/CODE/AITHUCCHIEN/PROJECT/worktrees/C2-App-125-blue-perf-optimize-ai-rag-latency/tests/test_eval_ai_latency.py` if script parsing logic is non-trivial.
- Create output: `D:/CODE/AITHUCCHIEN/PROJECT/worktrees/C2-App-125-blue-perf-optimize-ai-rag-latency/plans/20260628-1021-ai-latency-timing-eval/reports/`
- Optionally read: `D:/CODE/AITHUCCHIEN/PROJECT/worktrees/C2-App-125-blue-perf-optimize-ai-rag-latency/scripts/run_golden_eval.py` for report style.

## Implementation Steps

1. Define safe test identity inputs:
   - Use known dev account/student id only from local config or CLI args.
   - Do not hardcode secrets.
2. Build async SSE client with `httpx.AsyncClient.stream`.
3. Capture first event and first token timestamps separately.
4. Parse `token`, `metadata`, `done`, and `error` events robustly.
5. Run warmups and repetitions per query category.
6. Write raw JSONL or JSON results.
7. Write Markdown summary:
   - p50/p95/client/server/first-token per category
   - top timing contributors by median
   - failures/timeouts
   - recommended next bottleneck candidate
8. Add CLI options:
   - `--base-url`
   - `--student-id`
   - `--course-id`
   - `--repetitions`
   - `--warmups`
   - `--timeout`
   - `--out`
   - `--include-reflection`
9. Add lightweight unit tests for SSE parsing and percentile calculation.

## Tests Before

- Write parser tests with synthetic SSE chunks before implementing script internals.

## Tests After

- `python -m pytest tests/test_eval_ai_latency.py -q`
- Manual opt-in run against local backend after server is available.

## Success Criteria

- [ ] Script produces Braintrust eval rows when configured and JSON/Markdown artifacts with no secrets.
- [ ] Repeated runs distinguish warm/cold RAG and general chat paths.
- [ ] Report includes p50 and p95 for total, first event, first token, and major backend spans.
- [ ] Failures are visible in the report instead of crashing the whole run.
- [ ] Script can run against local or deployed backend by changing `--base-url`.

## Risk Assessment

Risk: live provider variance hides code-level bottlenecks. Mitigation: compare categories and run enough repetitions; use warmups; include raw rows for inspection.

Risk: eval script accidentally creates many chat sessions/messages. Mitigation: reuse session when testing history and document cleanup SQL or use a dedicated dev student.
