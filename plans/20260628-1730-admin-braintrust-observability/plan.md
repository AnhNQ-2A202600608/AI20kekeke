---
title: Admin Braintrust Observability Panel
description: >-
  Add an admin-only BTC observability panel that summarizes Braintrust traces
  without exposing Braintrust secrets to the frontend.
status: completed
priority: P2
branch: codex/fix-chat-rag-streaming
tags:
  - feature
  - frontend
  - backend
  - api
  - auth
blockedBy:
  - 20260628-1021-ai-latency-timing-eval
blocks: []
created: '2026-06-28T10:30:21.701Z'
createdBy: 'ck:plan'
source: skill
---

# Admin Braintrust Observability Panel

## Overview

Build an admin-only Braintrust observability surface for the ban to chuc/BTC panel. The frontend must never receive `BRAINTRUST_API_KEY`; it calls internal FastAPI endpoints that fetch and aggregate Braintrust project logs server-side.

Current Braintrust check on 2026-06-28:
- Env has `BRAINTRUST_API_URL`, `BRAINTRUST_API_KEY`, and `BRAINTRUST_PROJECT_ID`.
- Recent logs are fetchable.
- Recent events include `scores` fields, but all checked values are empty.
- `project_score` returned no configured score evaluators for the current project.
- `_async_scoring_state` is `null` for checked events.

Therefore the MVP should ship trace, latency, and error aggregates now, while showing a clear "No evaluator configured" state for quality charts until Braintrust scores exist.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Backend Braintrust Proxy](./phase-01-backend-braintrust-proxy.md) | Completed |
| 2 | [Admin Access and Navigation](./phase-02-admin-access-and-navigation.md) | Completed |
| 3 | [Observability Dashboard UI](./phase-03-observability-dashboard-ui.md) | Completed |
| 4 | [Verification and Documentation](./phase-04-verification-and-documentation.md) | Completed |

## Dependencies

- Depends on [AI Latency Timing and Eval Diagnostics](../20260628-1021-ai-latency-timing-eval/plan.md) for the existing Braintrust tracing adapter and fetch script patterns.
- Related implementation points:
  - `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/braintrust_observability.py`
  - `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/scripts/fetch_braintrust_latency.py`
  - `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/btc-heatmap.tsx`
  - `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/dashboard-tabs.ts`
  - `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/api/auth_routes.py`

## Acceptance Criteria

- Admin users can open the BTC/admin observability tab and see aggregate Braintrust health metrics.
- Non-admin users cannot access the backend Braintrust endpoints even if they call them directly.
- Braintrust API key and raw env values never appear in browser bundles, API responses, logs, or docs.
- Dashboard includes Braintrust detail links for trace drilldown.
- Quality score panel degrades gracefully when no Braintrust evaluator scores are configured.
