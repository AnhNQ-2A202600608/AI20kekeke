---
phase: 2
title: "Program Navigation Shell"
status: completed
priority: P1
dependencies: [1]
---

# Phase 2: Program Navigation Shell

## Overview

Build the `/app` learning shell that lets users jump directly to a day. This replaces the current primary long-scroll week path with program-level navigation.

## Requirements

- Functional: render program summary, phase tabs, and day navigator.
- Functional: selecting a day updates focused day state.
- Functional: day state reflects completed, active, locked/preview, and weak concept indicators.
- Non-functional: no route rewrite required; keep state inside learn tab for the first version.
- Non-functional: desktop and mobile navigation must not cause horizontal overflow.

## Architecture

```text
LearningPath replacement composition
  ProgramOverviewHeader
  PhaseTabs
  DayNavigator
  DayFocusView (phase 3)
```

State lives in the learn tab component:

```ts
selectedPhaseId
selectedTrackId
selectedDayId
```

Use URL query sync only if low-risk after the component version works.

## Related Code Files

- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/LearningPath.tsx`
- Create: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/learning/program-overview-header.tsx`
- Create: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/learning/phase-tabs.tsx`
- Create: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/learning/day-navigator.tsx`
- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/components/dashboard-layout.tsx`

## Implementation Steps

1. Introduce a new `components/learning/` folder for curriculum navigation pieces.
2. Add `ProgramOverviewHeader` with total day count, current day, and overall completion.
3. Add `PhaseTabs` for Foundation, Systems, Specialization.
4. Add `DayNavigator`:
   - desktop: compact responsive grid or horizontal wrapped chips.
   - mobile: horizontal scroll chips with visible current day.
5. Compute day state from `completedSets`, `conceptMasteries`, and registry set ids.
6. Wire day click to `selectedDayId`.
7. Keep the old long path component code behind a small internal fallback only if needed during migration; delete fallback in Phase 5.

## Success Criteria

- [x] User can click Day 1-28 in the navigator.
- [x] Selected day visibly changes.
- [x] Completed/current/preview states are visually distinct.
- [x] Phase tabs filter the day list.
- [x] No direct quiz launch behavior changes yet.

## Risk Assessment

- Risk: replacing `LearningPath.tsx` in one pass creates regressions.
  - Mitigation: introduce shell components first, keep practice launch adapter unchanged.
- Risk: mobile day navigator becomes cramped.
  - Mitigation: use horizontal scroll chips with stable button dimensions.
- Risk: `LearningPath.tsx` becomes too large.
  - Mitigation: move new UI to `components/learning/` and use `LearningPath` as orchestrator only.
