---
phase: 1
title: "Research and Contract Audit"
status: completed
priority: P1
dependencies: []
---

# Phase 1: Research and Contract Audit

## Overview

Confirm the exact frontend/backend contract before changing quiz behavior. This phase protects against building a frontend adapter around assumptions that backend does not actually support.

## Requirements

- Functional: document request/response shapes for `recommend`, `submit`, and current `sync-mastery` usage.
- Functional: identify how quiz set IDs map to backend `concept_id`.
- Non-functional: no production code behavior changes in this phase except optional type-only contracts if needed.

## Architecture

Current split:

```text
Quiz UI -> useQuizSession -> createPracticeSlice -> local scoring -> /sync-mastery
ZpdWidget -> /recommend -> /submit -> backend authoritative scoring
```

Target split:

```text
Quiz UI -> useQuizSession -> adaptive client -> /recommend -> /submit
                         -> store receives backend submit result
```

## Research Findings To Verify

- `ZpdWidget` already contains the right endpoint pattern, including `Authorization: Bearer ${authToken}`.
- `SubmitResponse` already returns `old_elo`, `new_elo`, `old_bkt`, `new_bkt`, `mastery_state`, `weakness_flag`, and `bandit_reward`.
- `createPracticeSlice.submitPracticeAnswer` currently computes Elo/BKT locally and calls `/api/v1/adaptive/sync-mastery`; this must be removed from main quiz submit path.
- Backend `RecommendRequest` currently has no `exclude_question_ids` field. Validation accepted duplicate recommendations for MVP instead of adding retry/backend exclude behavior.

## Related Code Files

- Modify/read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/ZpdWidget.tsx`
- Modify/read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/hooks/useQuizSession.ts`
- Modify/read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/stores/createPracticeSlice.ts`
- Modify/read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/quiz/types.ts`
- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/models/adaptive_schemas.py`
- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/api/adaptive_routes.py`

## Implementation Steps

1. Re-read backend `RecommendRequest`, `RecommendResponse`, `SubmitRequest`, and `SubmitResponse`.
2. Compare `ZpdWidget` request bodies with backend schemas; mark reusable logic.
3. Inventory all imports/usages of `calculatePracticeEloProgression`, `calculateNextStudentElo`, and `/sync-mastery`.
4. Trace concept mapping:
   - `conceptMasteries[conceptCode].conceptId`
   - `skill.associatedSets`
   - `targetSetId`
5. Decide fallback rule:
   - logged-in + conceptId present: adaptive backend required.
   - missing conceptId or backend offline: demo/local fallback allowed, clearly non-persistent.
6. Document duplicate recommendation as an accepted MVP limitation; do not add frontend retry or backend exclude behavior in this plan.

## Success Criteria

- [ ] Research report states final recommended approach and rejected alternatives.
- [ ] Every touched frontend file is listed with expected change type.
- [ ] Concept ID source is known before Phase 2 starts.
- [ ] Backend duplicate-avoidance gap is explicit and marked accepted for MVP.

<!-- Updated: Validation Session 1 - duplicate recommendations accepted for MVP -->
