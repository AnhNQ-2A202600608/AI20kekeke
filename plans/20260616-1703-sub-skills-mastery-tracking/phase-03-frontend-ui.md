# Phase 3: Frontend UI Rendering

## Overview
- Priority: Medium
- Current Status: Pending
- Description: Render the sub-skills (concepts) progress, ELO, and mastery levels directly in the Learning Path circles and tooltips.

## Proposed Changes

### [MODIFY] [LearningPath.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/LearningPath.tsx)
1. Read `conceptMastery` from `useBoundStore()`.
2. Compute `isSetComplete` using `conceptMastery[set.id]?.bkt >= 0.75` (or based on ELO/completed status).
3. Display the concept's ELO and BKT Mastery percentage inside the hover tooltip for each circle.

### [MODIFY] [page.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/page.tsx)
1. Call `fetchConceptMasteries` on startup if `loggedIn` is true.

## Detailed UI/UX Adjustments

- **Mini Circle Progress**: Show a mini progress arc around each concept circle or style the background color dynamically based on its BKT mastery probability.
- **Hover Tooltip**: When hovering over `C.1`, `C.2`, show the concept description and its specific mastery stats (e.g. "Tiến độ: 80% • Elo: 1150").

## Implementation Steps

1. **Modify `LearningPath.tsx`**:
   - Access `conceptMastery` from Zustand store.
   - For each concept rendering block:
     ```typescript
     const mastery = conceptMastery[set.id];
     const isSetComplete = mastery ? mastery.bkt >= 0.75 : false;
     const setElo = mastery ? mastery.elo : 1000;
     const setBktPercent = mastery ? Math.round(mastery.bkt * 100) : 0;
     ```
   - Update hover tooltip content to display ELO and Mastery.

2. **Modify `page.tsx`**:
   - Add a `useEffect` that checks for `loggedIn` and `userId`, then invokes:
     ```typescript
     fetchConceptMasteries(userId, '00000000-0000-0000-0000-000000000001');
     ```
