---
phase: 1
title: "Audit Mission Surface"
status: completed
priority: P2
dependencies: []
---

# Phase 1: Audit Mission Surface

## Overview

Confirm the current mission card data flow, visual constraints, and affected render surfaces before writing the capsule.

## Requirements

- Functional: identify every render path of `MobileTodayMissionCard`.
- Functional: confirm all capsule props are already available or cheaply derived.
- Non-functional: avoid changing curriculum, mastery, or practice session behavior.

## Architecture

`LearningPath` computes selected day context and passes counts into `MobileTodayMissionCard`. The audit should preserve that one-way data flow:

```text
LearningPath selectedDay/detailItems
  -> MobileTodayMissionCard props
  -> TodayMissionCapsule primitive metrics
```

## Related Code Files

- Modify later: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\learning\mobile-today-mission-card.tsx`
- Read: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\LearningPath.tsx`
- Read: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\docs\frontend-design-tokens.md`
- Optional read: `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\learning\mobile-daily-skill-list.tsx`

## Implementation Steps

1. Inspect both `MobileTodayMissionCard` call sites in `LearningPath`.
2. Record current metric source:
   - concepts = `detailItems.length`
   - practices = `selectedDayAvailableSetCount`
   - estimated minutes = `Math.max(8, practiceCount * 4)`
   - progress = `selectedDayCompletion`
3. Confirm the old KPI grid is isolated inside `MobileTodayMissionCard`.
4. Check compact and comfortable density behavior.
5. Confirm mobile and desktop both reuse the same card.

## Success Criteria

- [x] Affected files are known.
- [x] No additional data adapter is required.
- [x] No route or store changes are required.
- [x] Existing design tokens and seed-growth language are identified.

## Risk Assessment

- Risk: hidden usage of `MobileTodayMissionCard` outside `LearningPath`.
  Mitigation: run `rg "MobileTodayMissionCard"` before implementation.
- Risk: old KPI grid height changed by recent edits.
  Mitigation: compare screenshots before and after in the same viewport.
