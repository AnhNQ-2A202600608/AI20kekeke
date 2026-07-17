---
title: "Student POV legacy frontend cleanup"
description: "Verify current student-facing frontend usage, remove unused legacy student files, and migrate active student POV surfaces to the current green tactile design system."
status: in_progress
priority: P1
branch: "blue"
tags: [frontend, student-pov, design-system, cleanup]
blockedBy: []
blocks: []
created: "2026-06-30T15:38:35.419Z"
createdBy: "ck:plan"
source: skill
---

# Student POV legacy frontend cleanup

## Overview

This plan covers only the student POV. Mentor, teacher, BTC, and admin surfaces remain out of scope even when they are still imported by the shared app shell.

Current student route flow:

```text
frontend/app/app/page.tsx
  -> frontend/app/components/quiz-app-shell.tsx
    -> OnboardingGate
    -> DashboardLayout when not in quiz mode
    -> QuizWorkspace when in quiz mode
```

Student-accessible tabs from `getNavigationItems('student')` are `learn`, `skills`, `chat`, and `profile`. The `leaderboard` branch still exists in `DashboardLayout`, but it is not reachable from current student navigation.

## Live Usage Matrix

| File | Student route usage | Decision |
| --- | --- | --- |
| `frontend/components/quiz/quiz-question-view.tsx` | Used by `QuizWorkspace` in quiz mode | Migrate. Highest-priority active legacy UI. |
| `frontend/components/quiz/quiz-results.tsx` | Used by `QuizWorkspace` finish screen | Migrate. Active legacy result screen. |
| `frontend/components/quiz/socratic-sidebar-view.tsx` | Used by `QuizWorkspace` and quiz view | Migrate or consolidate with shared chat primitives. |
| `frontend/components/quiz/loading-questions-card.tsx` | Used by `QuizWorkspace` loading state | Migrate small loader. |
| `frontend/app/hooks/useQuizSession.ts` | Core student flow state | Keep; audit fallback/static-demo naming and URL tab filtering. |
| `frontend/components/LearningPath.tsx` | Used by `learn` tab | Mostly keep; tighten oversized radii. |
| `frontend/components/dashboard/guidebook-view.tsx` | Used by `learn` tab guidebook mode | Migrate amber styling to green tactile tokens. |
| `frontend/components/dashboard/skills-practice-tab.tsx` | Used by `skills` tab | Keep; move hardcoded `courseDays` later if desired. |
| `frontend/components/dashboard/socratic-chat/**` | Used by `chat` tab | Mostly keep; audit demo mocks and legacy message compatibility. |
| `frontend/components/dashboard/profile/index.tsx` | Used by `profile` tab | Keep; migrate detailed analytics subcomponents only if exposed to student. |
| `frontend/components/dashboard/profile/components/skill-tree-graph.tsx` | Dynamic import under profile detailed analytics | Migrate/consolidate later; live but lower priority. |
| `frontend/components/dashboard/profile/components/memory-decay-chart.tsx` | Dynamic import under profile detailed analytics | Keep; minor token cleanup only. |
| `frontend/components/dashboard/profile/components/performance-charts.tsx` | Indirectly used for `EloProgressChart` | Split `EloProgressChart` and remove unused radar path. |
| `frontend/components/RadarChart.tsx` | Only used by unused `PerformanceCharts` export path | Remove after splitting chart file. |
| `frontend/components/dashboard/leaderboard-tab.tsx` | Imported in `DashboardLayout`; not reachable from student nav | Remove branch/import or migrate only if leaderboard is re-enabled. |
| `frontend/components/quiz/difficulty-badge.tsx` | No usage found | Delete. |
| `frontend/components/TileTooltip.tsx` | No usage found | Delete. |
| `frontend/components/Calendar.tsx` | No student usage found; mentor ingestion imports `Calendar` icon from lucide, not this file | Delete if full repo search confirms no dynamic import. |
| Old profile children: `activity-heatmap.tsx`, `bandit-recommendation.tsx`, `mastery-map.tsx`, `profile-header.tsx`, `recent-sessions.tsx`, `study-path-guidelines.tsx` | No active imports from current student profile | Delete after final search. |
| `frontend/components/LoginScreen.tsx` | Used by `QuizAppShell` modal | Migrate or consolidate with `/login`; active student auth surface. |
| `frontend/components/onboarding/onboarding-page.tsx`, `onboarding-gate.tsx` | Used before `/app` access | Migrate amber/neutral remnants. |

## Out Of Scope

- `frontend/components/dashboard/mentor/**`
- `frontend/components/dashboard/admin/**`
- `frontend/components/dashboard/btc-heatmap.tsx`
- `frontend/components/dashboard/mentor-dashboard.tsx`
- Mentor/BTC branches inside `RightBar` and `DashboardLayout`

These stay as-is until the teacher/BTC POV cleanup pass.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Verify live usage](./phase-01-verify-live-usage.md) | Completed |
| 2 | [Remove unused student files](./phase-02-remove-unused-student-files.md) | Completed |
| 3 | [Migrate active student surfaces](./phase-03-migrate-active-student-surfaces.md) | In Progress |
| 4 | [Validation](./phase-04-validation.md) | Completed for current slice |

## Current Progress

- Verified student reachability from `/app` through `QuizAppShell`, `DashboardLayout`, `QuizWorkspace`, and `getNavigationItems('student')`.
- Removed unused student legacy files and the unreachable student leaderboard branch.
- Split the live profile `EloProgressChart` into its own component and removed the unused radar wrapper path.
- Migrated the highest-signal student surfaces in this slice: guidebook, learning guide modal shell, login modal, onboarding notices/actions, quiz results, quiz hint panels, and quiz report course id source.
- Validation passed with `pnpm lint` and `pnpm build` in `frontend/`.

Deferred from this slice:

- Deep Socratic chat mock/demo cleanup in `frontend/components/dashboard/socratic-chat/**`.
- Broader quiz adaptive behavior refactor beyond style tokens and course id source.

## Dependencies

- Existing context: `plans/reports/260630-2233-frontend-legacy-ui-scout.md`
- Relevant historical plans:
  - `plans/260629-2015-quiz-answer-flow-redesign/`
  - `plans/260629-2210-sync-student-ui-style/`
  - `plans/260630-0112-practice-skill-garden/`
  - `plans/260630-0210-rpg-farmer-scholar-profile/`

## Acceptance Criteria

- Student POV routes `/`, `/login`, `/onboarding`, `/app?tab=learn`, `/app?tab=skills`, `/app?tab=chat`, `/app?tab=profile`, and quiz mode still work.
- No unused student legacy files remain in `frontend/components` after deletion phase.
- Active student surfaces use current `docs/product/design-guidelines.md` tokens: primary green, tactile 3D borders, compact app density, Fraunces headings, Be Vietnam Pro body.
- Mentor/BTC/admin behavior is unchanged.
- `pnpm lint` and `pnpm build` pass in `frontend/`.
