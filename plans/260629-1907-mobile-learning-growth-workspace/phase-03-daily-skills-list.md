---
phase: 3
title: "Daily Skills List"
status: completed
priority: P1
dependencies: [1, 2]
---

# Phase 3: Daily Skills List

## Overview

Replace the single center concept from the mockup with a day-level skills/concepts list. This is the core product correction: each day can contain multiple concepts, and the learner must be able to choose the active concept before starting practice.

## Requirements

- Functional: list every `DetailConceptItem` for selected day.
- Functional: selecting a skill updates `selectedConceptId` and active CTA target.
- Functional: cards show status, progress, available set count, and concept description.
- Non-functional: list remains scannable on mobile; avoid nested card clutter.
- Non-functional: mastery status must not be color-only.

## Architecture

```text
MobileLearningWorkspace
  MobileDailySkillList
    MobileSkillCard[]
      selected concept state
      adapterSkill + recommendedSetId
  Sticky learning action uses selectedItem
```

Keep `DetailConceptItem` as the shared view model. Do not introduce another model unless it removes real duplication.

## Related Code Files

- Create: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/learning/mobile-daily-skill-list.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/LearningPath.tsx`
- Modify or reuse types from: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/learning/day-detail-card.tsx`

## Implementation Steps

1. Create `MobileDailySkillList` props:
   - `items`, `selectedConceptId`, `onSelectConcept`.
2. Render section:
   - title: `Hôm nay học gì?`
   - helper: `Chọn một kỹ năng để bắt đầu luyện tập`.
3. Render each `MobileSkillCard`:
   - icon/status.
   - concept title.
   - description, clamped.
   - chips: state label, progress, set count.
   - selected state with clear border/background and `aria-pressed`.
4. Remove the current mobile-only concept chip strip if it becomes redundant.
5. Ensure selection rules:
   - default active concept remains first weak/not-started/learning concept.
   - when user taps another concept, CTA updates.
6. Make guidebook secondary:
   - it can stay in sticky action area or under mission, but never outrank the selected concept CTA.
7. Keep desktop `DayDetailCard` unchanged unless phase 5 validation says copy must align.

## Success Criteria

- [x] Mobile shows all concepts for selected day.
- [x] Tapping a concept visibly selects it.
- [x] CTA target changes to selected concept/recommended set.
- [x] Empty or no-set concepts render `Sắp mở` and cannot start practice.
- [x] Cards remain readable at 360px width.

## Completion Notes

- Implemented `MobileDailySkillList` using shared `DetailConceptItem`.
- Sticky CTA in `LearningPath` uses the selected item and existing `onStartPractice` adapter.

## Risk Assessment

- Risk: duplicated concept card logic between desktop and mobile.
  - Mitigation: share `DetailConceptItem`, state labels, and helper functions; duplicate only layout.
- Risk: too much text in every card.
  - Mitigation: line clamp descriptions and keep metadata chips short.
- Risk: ambiguous "skill" vs "concept" language.
  - Mitigation: use user-facing `kỹ năng` or `concept` consistently, but keep code type names unchanged.
