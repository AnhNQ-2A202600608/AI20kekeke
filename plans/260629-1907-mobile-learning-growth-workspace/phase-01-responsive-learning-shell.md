---
phase: 1
title: "Responsive Learning Shell"
status: completed
priority: P2
dependencies: []
---

# Phase 1: Responsive Learning Shell

## Overview

Create the responsive composition that separates desktop and mobile learning experiences without changing quiz/session behavior. Desktop keeps the current focused layout; mobile gets a compact top bar and horizontal day rail adapted from the mockup.

## Requirements

- Functional: selected day and selected concept state continue to live in `LearningPath`.
- Functional: mobile can select days from a horizontal rail and update the same selected day state used by desktop.
- Non-functional: no horizontal page overflow, no duplicate navigation bars, no layout shift from optional assets.
- Non-functional: preserve accessibility of day selection buttons with `aria-label` and visible focus.

## Architecture

```text
LearningPath
  shared state: selectedTrackId, selectedDayId, selectedConceptId
  desktop branch: ProgramRoadmap + DayDetailCard
  mobile branch:
    MobileLearningTopBar
    MobileDayRail
    MobileLearningWorkspace
```

Do not fork business logic. Fork only presentation. Keep helpers such as `getDayState`, `getDayCompletionPercent`, `detailItems`, and `activeConceptId` shared.

## Related Code Files

- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/LearningPath.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/LeftBar.tsx`
- Create: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/learning/mobile-learning-top-bar.tsx`
- Create: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/learning/mobile-day-rail.tsx`
- Optional modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/components/dashboard-layout.tsx`

## Implementation Steps

1. Extract mobile-only top bar component:
   - left: EduGap mark/wordmark using existing brand component or simple wordmark.
   - right: streak/profile placeholders from existing store values when available; avoid new data dependencies.
2. Extract `MobileDayRail`:
   - props: `days`, `selectedDayId`, `onSelectDay`, `getDayState`, `getDayProgress`.
   - render horizontally scrollable chips, not a grid.
   - include selected, complete, active, weak, preview/locked states.
3. Update `LearningPath` responsive composition:
   - desktop: keep current grid behind `hidden lg:grid` or equivalent.
   - mobile: render top bar, day rail, and mobile workspace behind `lg:hidden`.
4. Reconcile navigation:
   - keep floating nav for student route.
   - ensure floating nav bottom offset does not collide with sticky CTA from later phases.
5. Add safe-area padding:
   - `padding-bottom: calc(env(safe-area-inset-bottom) + ...)` for sticky regions.
6. Verify no business contract changes:
   - `onStartPractice`, `onSelectGuidebook`, selected track/day/concept state remain unchanged.

## Success Criteria

- [x] Mobile shows a compact EduGap top bar above day rail.
- [x] Day chips scroll horizontally and select the same `ProgramDay` used by desktop.
- [x] Desktop layout still renders `ProgramRoadmap` and `DayDetailCard`.
- [x] No duplicate bottom nav appears on student mobile learn route.
- [x] Keyboard focus is visible on day chips and floating controls.

## Completion Notes

- Implemented `MobileLearningTopBar` and `MobileDayRail`.
- Integrated mobile and desktop presentation branches in `LearningPath` while keeping selection state shared.
- Reused real store status for mobile streak/profile initial.

## Risk Assessment

- Risk: duplicating state between desktop/mobile branches.
  - Mitigation: keep all state in `LearningPath`; mobile children are pure presentational components.
- Risk: top bar reintroduces navbar clutter.
  - Mitigation: brand/status only; no full navigation links.
- Risk: mobile sticky controls overlap.
  - Mitigation: reserve bottom spacing in the mobile workspace before phase 5 final validation.
