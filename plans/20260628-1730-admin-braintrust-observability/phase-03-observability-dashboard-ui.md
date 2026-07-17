---
phase: 3
title: Observability Dashboard UI
status: completed
priority: P2
dependencies:
  - 1
  - 2
---

# Phase 3: Observability Dashboard UI

## Overview

Build a concise admin dashboard that turns Braintrust aggregates into operational charts and trace drilldown links. The UI should be useful even before Braintrust evaluators are configured.

## Requirements

- Functional: show aggregate health, latency, failures, quality-score availability, and problem traces.
- Functional: each trace row includes a detail link to Braintrust when a link can be built.
- Functional: quality score panel clearly states no evaluator is configured when scores are absent.
- Non-functional: no raw API keys, env values, or large prompt/output bodies in client payloads.
- Non-functional: follow existing EduGap visual style and avoid a generic SaaS dashboard.

## Architecture

Add a self-contained dashboard component under existing dashboard components:

```text
BraintrustObservabilityTab
  -> useBraintrustSummary hook
  -> summary cards
  -> latency chart
  -> score status panel
  -> errors/problem traces table
```

Use existing chart library already installed in frontend (`recharts` or `react-chartjs-2`). Prefer `recharts` because current dashboard components already use it.

## Related Code Files

- Create: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/admin/braintrust-observability-tab.tsx`
- Create: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/admin/index.ts`
- Potentially create: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/admin/use-braintrust-summary.ts`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/components/dashboard-layout.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/dashboard-tabs.ts`

## Implementation Steps

1. Define TypeScript DTOs matching backend response models.
2. Add a small fetch hook:
   - loading state
   - error state
   - manual refresh
   - no auto-polling for MVP
3. Build top stat band:
   - events fetched
   - traces observed
   - error rate
   - score events
4. Build latency chart:
   - rows by span
   - p50 and p95 bars/lines
   - sort by p95 descending
5. Build quality panel:
   - if score data exists: list score names and averages
   - if no scores: show "No Braintrust evaluator scores configured"
6. Build failures/problem traces table:
   - created time
   - root span id
   - span name
   - reason: error/slow/missing score
   - Braintrust detail link
7. Add empty states:
   - no env configured
   - Braintrust unavailable
   - no events found
   - no evaluator scores found
8. Keep UI dense and operational. Do not add marketing hero copy.

## Panel Contract

MVP panels:
- AI Health Overview
- Latency by Span
- Failure Monitor
- Quality Score Status
- Problem Traces

Out of scope for MVP:
- Creating Braintrust evaluators.
- Editing Braintrust experiments.
- Displaying raw prompts or full outputs.
- Auto-refresh dashboards.

## Success Criteria

- [ ] Admin panel renders real aggregate data from backend.
- [ ] Score panel handles absent evaluator data without looking broken.
- [ ] Braintrust detail links are visible for trace rows.
- [ ] UI remains usable on desktop and mobile widths.
- [ ] No secret-like value appears in rendered HTML or network response.

## Risk Assessment

- Risk: aggregate response shape changes during backend implementation. Mitigation: centralize DTOs and keep UI tolerant of missing optional fields.
- Risk: dashboard becomes noisy. Mitigation: cap rows, sort by severity, keep drilldown links for detail.
