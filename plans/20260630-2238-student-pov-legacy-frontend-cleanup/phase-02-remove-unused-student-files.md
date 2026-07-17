---
phase: 2
title: "Remove unused student files"
status: completed
effort: ""
priority: P1
dependencies: [1]
---

# Phase 2: Remove unused student files

## Overview

Remove student-scope legacy files that are not imported by current pages or student routes.

## Requirements

- Functional: delete only files proven unused in Phase 1.
- Non-functional: avoid touching mentor/BTC/admin-only code, even if it is stale.

## Architecture

This is a deletion-only phase. Imports should either disappear naturally because the files are unreferenced or be removed from student-facing imports such as `DashboardLayout` when the branch is unreachable from student navigation.

## Related Code Files

- Delete if verified unused:
  - `frontend/components/TileTooltip.tsx`
  - `frontend/components/quiz/difficulty-badge.tsx`
  - `frontend/components/Calendar.tsx`
  - `frontend/components/dashboard/profile/components/activity-heatmap.tsx`
  - `frontend/components/dashboard/profile/components/bandit-recommendation.tsx`
  - `frontend/components/dashboard/profile/components/mastery-map.tsx`
  - `frontend/components/dashboard/profile/components/profile-header.tsx`
  - `frontend/components/dashboard/profile/components/recent-sessions.tsx`
  - `frontend/components/dashboard/profile/components/study-path-guidelines.tsx`
- Modify if leaderboard remains disabled for student:
  - `frontend/app/components/dashboard-layout.tsx`
  - `frontend/components/dashboard/leaderboard-tab.tsx`
- Modify before removing radar path:
  - `frontend/components/dashboard/profile/components/performance-charts.tsx`
  - `frontend/components/RadarChart.tsx`

## Implementation Steps

1. Delete `TileTooltip.tsx`, `difficulty-badge.tsx`, `Calendar.tsx`, and old unimported profile child panels after final `rg` verification.
2. Decide the leaderboard branch:
   - If leaderboard should stay disabled, remove `LeaderboardTab` import/render branch and delete `leaderboard-tab.tsx`.
   - If leaderboard should return for student, move it to Phase 3 as a migration target instead of deleting.
3. Split `EloProgressChart` into its own file or keep only the `EloProgressChart` export in `performance-charts.tsx`.
4. Remove `RadarChart.tsx` only after no import remains.
5. Run `pnpm lint` after deletions.

## Success Criteria

- [x] Deleted files have zero imports/references.
- [x] `DashboardLayout` no longer imports unreachable student UI.
- [x] `pnpm lint` passes.
- [x] No mentor/BTC/admin files are edited.

## Risk Assessment

The biggest risk is deleting `RadarChart` before untangling `performance-charts.tsx`. Handle chart split first, then delete.
