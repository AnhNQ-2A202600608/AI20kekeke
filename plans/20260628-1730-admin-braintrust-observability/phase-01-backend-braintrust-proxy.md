---
phase: 1
title: Backend Braintrust Proxy
status: completed
priority: P1
dependencies: []
---

# Phase 1: Backend Braintrust Proxy

## Overview

Create server-side Braintrust read endpoints under FastAPI. These endpoints fetch project logs using env credentials, aggregate them into dashboard DTOs, and return only sanitized summaries plus Braintrust detail URLs.

## Requirements

- Functional: expose admin-only endpoints for overview, latency by span, recent errors, problem traces, and score availability.
- Functional: compute aggregates from `project_logs/{project_id}/fetch` responses without leaking raw prompts unless explicitly safe and truncated.
- Non-functional: fail closed when env is missing, Braintrust is unavailable, or caller is not admin.
- Non-functional: keep implementation small and aligned with `scripts/fetch_braintrust_latency.py`.

## Architecture

Add a thin service around Braintrust fetch:

```text
FastAPI route
  -> require admin dependency
  -> Braintrust client reads env
  -> fetch recent project logs
  -> summarize spans/errors/scores
  -> return typed DTOs for UI
```

Do not use the tracing logger object for dashboard reads. Reads should be explicit HTTP calls so failures are visible and testable.

## Related Code Files

- Create: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/braintrust_dashboard.py`
- Create: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/api/admin_braintrust_routes.py`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/api/routes.py`
- Potentially modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/config.py` if typed Braintrust settings are useful.
- Test: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/tests/test_admin_braintrust_routes.py`

## Implementation Steps

1. Define Pydantic response models:
   - `BraintrustOverview`
   - `BraintrustSpanLatency`
   - `BraintrustErrorTrace`
   - `BraintrustProblemTrace`
   - `BraintrustScoreStatus`
2. Extract reusable helpers from the existing script pattern:
   - span name resolution
   - duration calculation from `metrics.start/end`
   - percentile calculation
   - safe preview truncation
3. Implement fetch client using `httpx`:
   - env: `BRAINTRUST_API_URL`, `BRAINTRUST_API_KEY`, `BRAINTRUST_PROJECT_ID`
   - endpoint: `/v1/project_logs/{project_id}/fetch`
   - query params: `limit`, optional cursor/pages
4. Build aggregate functions:
   - event count, trace count, error count/rate
   - p50/p95/max duration by span
   - recent errors grouped by root span
   - slow traces by max observed span duration
   - score status from non-empty `scores`
5. Add `GET /api/v1/admin/braintrust/summary`.
6. Add optional narrow endpoints only if the summary payload becomes too large:
   - `/latency`
   - `/errors`
   - `/problem-traces`
7. Add admin auth dependency.
   - In stub/dev mode, accept fake `admin` token pattern from current login flow.
   - In Supabase mode, verify token and query role server-side.
8. Ensure returned trace links are generated from non-secret identifiers only.

## API Shape Draft

```json
{
  "window": {"limit": 200, "generated_at": "2026-06-28T...Z"},
  "overview": {"events": 200, "traces": 34, "errors": 6, "score_events": 0},
  "score_status": {"configured": false, "message": "No evaluator scores found"},
  "latency_by_span": [{"name": "analyze", "count": 8, "p50_ms": 1234, "p95_ms": 2500}],
  "errors": [{"root_span_id": "...", "span": "rag.retrieve", "detail_link": "https://..."}],
  "problem_traces": [{"root_span_id": "...", "reason": "slow", "detail_link": "https://..."}]
}
```

## Success Criteria

- [ ] Backend endpoint returns sanitized aggregate data from Braintrust.
- [ ] Missing env returns a controlled 503-style response, not a stack trace.
- [ ] Non-admin calls return 401/403.
- [ ] Unit tests cover success, missing env, Braintrust fetch error, empty scores, and admin denial.

## Risk Assessment

- Risk: Braintrust detail URL format may differ by org/project UI. Mitigation: make link builder configurable or return a best-effort link plus root span id.
- Risk: token verification is incomplete. Mitigation: use server-side role lookup; do not rely on frontend persona.
- Risk: large logs payload slows UI. Mitigation: default `limit=200`, cap query limits, add simple timeout.
