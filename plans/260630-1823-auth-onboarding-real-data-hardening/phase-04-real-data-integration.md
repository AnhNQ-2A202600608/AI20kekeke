---
phase: 4
title: "Real Data Integration"
status: completed
priority: P1
dependencies: [1, 2, 3]
---

# Phase 4: Real Data Integration

## Context Links

- Student quiz: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/hooks/useQuizSession.ts`
- Adaptive client: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/adaptive/api-client.ts`
- Profile data: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/profile/hooks/useProfileData.ts`
- Profile utilities: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/profile/utils/profile-utils.ts`
- BTC heatmap: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/btc-heatmap.tsx`
- Mentor class insights: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/mentor/class-insights-tab.tsx`
- Mentor quiz editor: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/mentor/quiz-editor-tab.tsx`
- Mentor ingestion: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/mentor/ingestion-tab.tsx`
- Backend routes: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/api/routes.py`, `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/api/adaptive_routes.py`

## Overview

Make data semantics honest. Keep fallback only where it is explicit, read-only, and not used as persisted progress. Wire real MVP data for student profile/adaptive surfaces first, then mentor/BTC surfaces.

## Requirements

- Functional:
  - Student adaptive quiz must clearly distinguish `adaptive` from `static-demo`.
  - Static demo answers must not claim backend mastery sync.
  - Profile charts use backend data when available; generated data is demo-labeled or removed.
  - Mentor/BTC screens use real endpoints or show explicit empty/demo states.
  - Mock operational data must not display as live class analytics.
- Non-functional:
  - No broad rewrite of dashboard architecture.
  - Add small data adapters per surface rather than a generic mega service.
  - Preserve existing UI layout while fixing data truthfulness.

## Architecture

Prioritize surfaces by user impact:

1. Student adaptive quiz and profile: direct learning state.
2. Chat artifacts: user-facing AI/RAG evidence.
3. Mentor/BTC operational analytics: class/admin decisions.

Data state model per surface:

```ts
type DataSource = 'backend' | 'demo' | 'local' | 'empty' | 'error';
```

Each surface should render source-aware UI. Only `backend` can be treated as persisted evidence.

## Related Code Files

- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/hooks/useQuizSession.ts`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/stores/createPracticeSlice.ts`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/profile/hooks/useProfileData.ts`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/profile/utils/profile-utils.ts`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/btc-heatmap.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/mentor/class-insights-tab.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/mentor/quiz-editor-tab.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/mentor/ingestion-tab.tsx`
- Modify/Create: backend endpoints only where existing endpoints cannot supply required data.

## Implementation Steps

1. Add a lightweight data source marker.
   - Prefer local component-level types if only 1-2 surfaces need them.
   - Use shared type only if repeated in 3+ places.
2. Student adaptive quiz.
   - Keep `/adaptive/recommend` and `/adaptive/submit` as real path.
   - If fallback to `static-demo`, show visible badge and disable "mastery synced" messaging.
   - Essay grading remains local unless backend short-answer grading exists; label accordingly.
3. Student profile.
   - Replace fixed `dayjs('2026-06-16')` and generated line chart data with backend-derived activity/mastery history when available.
   - If backend data missing, show empty state or demo badge based on demo mode.
   - Do not use generated Elo curves as real progress.
4. Chat.
   - Ensure chat artifacts from backend are used for normal flow.
   - Any demo/sandbox artifact source is labeled and gated by phase 3.
5. Mentor/BTC MVP endpoints decision.
   - First try existing backend data: `student/activity`, `student/recent_sessions`, mastery, questions, audit endpoints.
   - If class aggregate endpoints are missing, create minimal read-only protected endpoints with `require_role(["mentor","admin","btc","dev"])`.
   - Keep endpoint shape narrow: class mastery heatmap, weak concept summary, quiz draft list, ingestion document summary.
6. Mentor/BTC UI.
   - `MOCK_HEATMAP`, `rawStudents`, `MOCK_QUESTIONS`, `MOCK_DOCUMENT_CHUNKS` may remain only under explicit demo mode.
   - Production without backend data shows empty/loading/error states.
7. Tests.
   - Backend endpoint auth/RBAC tests for any new mentor/BTC endpoints.
   - Frontend lint/build plus manual screenshot checks for source badges and empty states.

## Todo List

- [x] Static-demo quiz path visibly labeled and does not imply persisted mastery.
- [x] Profile generated dates/charts removed from production path.
- [x] Mentor/BTC mocks gated by demo mode or replaced by real endpoints.
- [x] Any new backend aggregate endpoint is RBAC-protected.
- [x] Empty/error states exist for missing backend data.
- [x] Data source is visible enough for user trust.

## Success Criteria

- [x] In production mode, `rg "MOCK_|mockSlides|rawStudents|generateLineChartData|2026-06-16" frontend/components frontend/lib` returns only test/demo-gated usages or intentionally named demo modules.
- [x] Student profile never displays generated fake Elo history as real.
- [x] BTC heatmap does not display `MOCK_HEATMAP` unless demo mode is enabled.
- [x] Mentor class insights do not display `rawStudents` unless demo mode is enabled.
- [x] Quiz editor does not display `MOCK_QUESTIONS` as production data.
- [x] Production empty states tell the user what data is missing and how to resolve it.

## Risk Assessment

- Risk: full real-data rewrite is too large.
  - Mitigation: honesty first, endpoint wiring second. Fake data hidden/gated is acceptable interim.
- Risk: creating class aggregate endpoints duplicates future analytics work.
  - Mitigation: only create minimal read-only endpoints for currently displayed metrics.
- Risk: UX loses richness when mocks hidden.
  - Mitigation: use designed empty states and demo badges instead of blank screens.

## Security Considerations

- Mentor/BTC aggregate endpoints must enforce role checks server-side.
- Class-level data should not leak individual student PII unless role allows it.
- Never expose service keys or raw Supabase admin capabilities to frontend.
