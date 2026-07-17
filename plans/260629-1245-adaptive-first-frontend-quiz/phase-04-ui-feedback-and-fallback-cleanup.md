---
phase: 4
title: "UI Feedback and Fallback Cleanup"
status: completed
priority: P2
dependencies: [3]
---

# Phase 4: UI Feedback and Fallback Cleanup

## Overview

Update quiz feedback components so students see backend-authored correctness and mastery deltas, while local JSON fallback is visibly non-persistent.

## Requirements

- Functional: display `old_elo -> new_elo`, `old_bkt -> new_bkt`, correctness, and mastery state from backend response.
- Functional: remove UI calculations based on `calculatePracticeEloProgression` from adaptive mode.
- Functional: keep static fallback usable without calling `/sync-mastery`, with visible copy that local demo practice does not update persisted mastery.
- Non-functional: preserve Sapia visual system and mobile compatibility.

## Architecture

UI rule:

```text
Adaptive mode: render submitResult from backend.
Static-demo mode: render local correctness only, label as demo/non-persistent.
Never mix the two in one session.
```

## Related Code Files

- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/quiz-question-view.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/quiz-results.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/adaptive/practice-scoring.ts`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/skills-practice-tab.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/LearningPath.tsx` only if it assumes local mastery immediately updates.

## Implementation Steps

1. Update `EloCounter` inputs:
   - adaptive mode: `targetElo = submitResult.old_elo`, `delta = submitResult.new_elo - submitResult.old_elo`.
   - pending state: use current concept mastery from store.
2. Add compact BKT/mastery display after submit:
   - `Math.round(old_bkt * 100)% -> Math.round(new_bkt * 100)%`
   - state chip from `mastery_state`.
3. Update result screen summary:
   - first adaptive answer old Elo.
   - latest adaptive answer new Elo.
   - total correct from backend `is_correct`.
4. Remove adaptive imports/usages of `calculatePracticeEloProgression`.
5. Keep `masteryScoreFromBkt` and `masteryStatusFromBkt` only as presentation helpers for backend-provided BKT, not scoring.
6. Add fallback label in static-demo mode:
   - "Demo nội dung local, không cập nhật mastery".
7. Remove or isolate `/sync-mastery` call from normal quiz submit. If retained, restrict to explicit teacher/manual/demo flow with a clear function name.

## Success Criteria

- [ ] Adaptive feedback displays backend `old_elo/new_elo` and `old_bkt/new_bkt`.
- [ ] No adaptive UI path recomputes mastery from answer correctness.
- [ ] Static JSON fallback cannot silently update persisted mastery.
- [ ] Existing tactile Sapia quiz styling remains intact.

## Risk Assessment

- Risk: old result UI expects `activeSet.questions`. Mitigation: derive result list from session adaptive records in adaptive mode.
- Risk: mobile UI gets denser. Mitigation: keep BKT as compact secondary telemetry and let mobile stabilization plan refine layout after this.

<!-- Updated: Validation Session 1 - demo fallback remains non-persistent -->
