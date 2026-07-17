---
phase: 4
title: "Track Branching"
status: completed
priority: P2
dependencies: [1, 2, 3]
---

# Phase 4: Track Branching

## Overview

Represent the three specialization tracks after Day 16. Users should understand that Day 17-28 branch by track and should not see all branches flattened into one path.

## Requirements

- Functional: show a track selector when the user reaches or opens the specialization phase.
- Functional: filter Day 17-28 by selected track.
- Functional: preserve visibility of other tracks as switchable branches.
- Non-functional: no account-level persistence required in the first pass unless existing store already has a suitable field.
- Non-functional: final display labels must be easy to replace after user confirms exact track names.

## Architecture

```text
Specialization phase
  TrackSelector
  TrackBranchSummary
  DayNavigator(filtered by selectedTrackId)
  DayFocusView(selected track day)
```

Use local state first:

```ts
selectedTrackId ?? defaultTrackId
```

Optionally persist to Zustand only if a lightweight profile/preference store already has a safe slot.

## Related Code Files

- Create: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/learning/track-selector.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/learning/day-navigator.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/LearningPath.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/quiz/program-curriculum.ts`
- Optional read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/hooks/useBoundStore.ts`

## Implementation Steps

1. Add `TrackSelector` with three tactile cards.
2. Filter specialization days by `selectedTrackId`.
3. For Day 1-16, ignore track filtering.
4. For Day 17-28, show branch context:
   - selected track label.
   - day count in branch.
   - progress in branch.
5. Add copy that explains switching track changes available day content.
6. Keep exact track labels config-driven.
7. Do not persist selected track until validation confirms product behavior.

## Success Criteria

- [x] Specialization phase does not render all track days at once.
- [x] User can switch track and see a different Day 17-28 list.
- [x] Day focus updates when selected track changes.
- [x] Track labels can be changed in one registry file.
- [x] No backend/profile migration needed.

## Risk Assessment

- Risk: users accidentally switch track and lose context.
  - Mitigation: track selector copy and visible selected track label.
- Risk: product later needs persistent track enrollment.
  - Mitigation: local state first; add persistence later after product decision.
- Risk: placeholder tracks differ from official curriculum.
  - Mitigation: config ids stable; display names validated before implementation.
