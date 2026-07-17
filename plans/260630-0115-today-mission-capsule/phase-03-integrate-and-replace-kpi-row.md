---
phase: 3
title: "Integrate And Replace KPI Row"
status: completed
priority: P2
dependencies: [2]
---

# Phase 3: Integrate And Replace KPI Row

## Overview

Replace the 4-column KPI row inside `MobileTodayMissionCard` with `TodayMissionCapsule`, preserving the existing title/outcome/card structure.

## Requirements

- Functional: remove old KPI grid visually and structurally.
- Functional: pass the same mission metrics into the capsule.
- Functional: keep `density="compact"` behavior for desktop and mobile call sites.
- Non-functional: reduce mission card vertical height and avoid competing with Daily Skills.
- Non-functional: preserve Sofi mascot art without overlap.

## Architecture

`MobileTodayMissionCard` remains the owner of `estimatedMinutes`, because it already derives that value from `practiceCount`.

```text
MobileTodayMissionCard
  title / outcome / phase label
  TodayMissionCapsule
```

Do not move mission calculation into `LearningPath` unless a future card needs the same minutes independently.

## Related Code Files

- Modify: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\learning\mobile-today-mission-card.tsx`
- Use: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\learning\today-mission-capsule.tsx`
- Read: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\LearningPath.tsx`

## Implementation Steps

1. Import `TodayMissionCapsule`.
2. Remove KPI icons no longer used from `mobile-today-mission-card.tsx`.
3. Keep `Target` icon for the section label.
4. Replace the KPI grid with:
   ```tsx
   <TodayMissionCapsule
     concepts={conceptCount}
     practices={practiceCount}
     estimatedMinutes={estimatedMinutes}
     progress={completionPercent}
     className={compact ? 'mt-2' : 'mt-4'}
   />
   ```
5. Check mascot z-index and `pr-*` spacing so the capsule does not hide under mascot art.
6. Keep card title/outcome spacing compact.
7. Do not alter `LearningPath` unless prop naming changes are required.

## Success Criteria

- [x] Old KPI grid is fully removed.
- [x] Mission card still shows title, outcome, phase, and progress metrics.
- [x] Metric values match previous rendering.
- [x] No unused icon imports remain.
- [x] Daily Skills appears closer to mission card due to reduced height.

## Risk Assessment

- Risk: capsule inside mission card feels like nested card.
  Mitigation: keep capsule border/shadow subtle and avoid an extra wrapper.
- Risk: mascot overlaps progress badge.
  Mitigation: reduce mascot art size or increase right padding only in comfortable layout.
- Risk: desktop compact version becomes too thin to read.
  Mitigation: keep min-height no lower than 56px for compact desktop.
