---
phase: 3
title: "Day Focus Experience"
status: completed
priority: P1
dependencies: [1, 2]
---

# Phase 3: Day Focus Experience

## Overview

Create the selected-day detail view. A day shows outcome, guidebook CTA, concept progression, and direct practice entry points. "Start here" focuses the first incomplete or recommended concept.

## Requirements

- Functional: show one selected day at a time.
- Functional: each day shows multiple concepts.
- Functional: each concept shows mapped practice sets and mastery status.
- Functional: `Start here` click scrolls/focuses the first actionable concept.
- Non-functional: hover may highlight but must not auto-scroll the page.
- Non-functional: preserve existing `GuidebookView` and `onStartPractice` contracts.

## Architecture

```text
DayFocusView
  DaySummaryCard
    Guidebook CTA
    StartHereButton
  ConceptPath
    ConceptNode[]
    PracticeSetList / Drawer
```

Use refs for focus targets:

```ts
const conceptRefs = useRef<Record<string, HTMLElement | null>>({});
startHere() -> find first not mastered concept -> scrollIntoView({ block: "center" })
```

## Related Code Files

- Create: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/learning/day-focus-view.tsx`
- Create: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/learning/day-summary-card.tsx`
- Create: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/learning/concept-path.tsx`
- Create: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/learning/practice-set-list.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/LearningPath.tsx`
- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/ui/wave-progress.tsx`

## Implementation Steps

1. Add `DayFocusView` that receives selected day, sets, completion, mastery, guidebook handler, and practice handler.
2. Add `DaySummaryCard` with:
   - day number/title/outcome.
   - concepts count.
   - guidebook button when `guidebookDayId` exists.
   - `Start here` primary CTA.
3. Add `ConceptPath` with tactile nodes similar to current skill nodes but scoped to selected day.
4. Add `PracticeSetList` or compact drawer for concept practice sets.
5. Convert `ProgramConcept` to a lightweight `Skill` adapter only at the call site where `handleStartPractice(skill, targetSetId)` requires it.
6. Implement active target logic:
   - first weak concept.
   - else first incomplete concept.
   - else first concept with available practice.
7. Add empty states for days without available practice sets.

## Success Criteria

- [x] Selecting Day 1 shows its existing concepts and practice sets.
- [x] `Start here` focuses a visible concept and does not trigger quiz immediately.
- [x] Clicking a practice set launches the existing quiz flow.
- [x] Guidebook CTA still opens `GuidebookView`.
- [x] Days without sets show "coming soon" instead of crashing.

## Risk Assessment

- Risk: concept-to-skill adapter corrupts mastery mapping.
  - Mitigation: adapter must preserve `associatedSets` and `dayId`; do not invent mastery values beyond existing helpers.
- Risk: scroll/focus conflicts with modal behavior.
  - Mitigation: `Start here` only scrolls within the day view; practice modal/drawer remains explicit.
- Risk: users expect hover to move.
  - Mitigation: hover highlight, click movement. Safer and more accessible.
