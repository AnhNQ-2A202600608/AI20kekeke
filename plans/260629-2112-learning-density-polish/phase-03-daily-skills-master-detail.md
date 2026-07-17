---
phase: 3
title: Daily Skills Master Detail
status: completed
priority: P1
dependencies:
  - 1
  - 2
---

# Phase 3: Daily Skills Master Detail

## Overview

Reduce the right/middle content density by turning daily skills into a compact scan list with detail revealed only for the selected skill. This directly addresses the current "blog-like blocks are too large" problem.

## Requirements

- Functional: show all skills/concepts for the selected day.
- Functional: skill rows should be compact by default.
- Functional: selecting a skill reveals detail, description, progress, and optional preview.
- Functional: existing selected concept state in `LearningPath.tsx` remains the source of truth.
- Non-functional: no large duplicated descriptions in every row.
- Non-functional: keyboard focus and `aria-pressed` behavior remain clear.

## Architecture

`MobileDailySkillList` is currently used for both mobile and desktop and renders large full-description cards. Refactor it into one of these conservative options:

1. Add a `density="compact" | "comfortable"` prop and use compact mode on desktop.
2. Split a shared `DailySkillList` plus `DailySkillDetail` if the component becomes too conditional.

Recommended: add density first, split only if conditional markup becomes noisy. Keep detail content near `ConceptPreviewRouter` so the user sees detail after selection rather than every skill row.

## Related Code Files

- Modify: `frontend/components/LearningPath.tsx`
- Modify: `frontend/components/learning/mobile-daily-skill-list.tsx`
- Modify: `frontend/components/learning/concept-preview-router.tsx` only if detail placement needs coordination.
- Possibly create: `frontend/components/learning/daily-skill-detail.tsx`

## Implementation Steps

1. Define compact row information: state icon, title, state chip, set count, progress bar or percent.
2. Remove long description from non-selected rows.
3. Show selected skill detail in one dedicated area below the list or directly above preview.
4. Keep `ConceptPreviewRouter` optional and tied to the selected concept.
5. Reduce `MobileTodayMissionCard` vertical weight on desktop if it still pushes skills below the fold.
6. Preserve mobile readability; mobile can stay more comfortable but should avoid giant repeated cards when there are many skills.

## Success Criteria

- [ ] Daily skills are scannable without scrolling through repeated long descriptions.
- [ ] Clicking a skill updates detail/preview without losing selected day.
- [ ] Selected state is visually obvious.
- [ ] `Bắt đầu Day N` still starts the selected/recommended set.
- [ ] One selected detail area contains the longer explanation; unselected rows stay compact.
- [ ] No regression to `onStartPractice(skill, targetSetId)`.

## Risk Assessment

If detail is hidden too aggressively, users may not understand what each skill is. Mitigate by keeping one short one-line summary or tooltip/drawer, not full paragraph cards in every row.
