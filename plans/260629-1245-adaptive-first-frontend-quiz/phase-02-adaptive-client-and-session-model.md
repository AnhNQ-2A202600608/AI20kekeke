---
phase: 2
title: "Adaptive Client and Session Model"
status: completed
priority: P1
dependencies: [1]
---

# Phase 2: Adaptive Client and Session Model

## Overview

Create a small typed frontend adaptive client and update the practice session model so the quiz can store backend recommendation/submit metadata without making UI components own API details.

## Requirements

- Functional: expose typed `recommendAdaptiveQuestion` and `submitAdaptiveAnswer` helpers.
- Functional: session stores adaptive question records, submit results, and response timing.
- Functional: keep existing XP/streak/completed-set progression separate from mastery scoring.
- Non-functional: no duplicate fetch/auth logic across `ZpdWidget` and quiz flow.

## Architecture

Recommended file boundary:

```text
frontend/lib/adaptive/api-client.ts
  - request auth token
  - POST /api/v1/adaptive/recommend
  - POST /api/v1/adaptive/submit

frontend/lib/quiz/types.ts
  - AdaptivePracticeQuestion
  - AdaptiveSubmitResult
  - ActivePracticeSession adaptive fields

frontend/stores/createPracticeSlice.ts
  - store backend results
  - refresh concept mastery after submit
  - no local Elo/BKT writes for adaptive mode
```

## Related Code Files

- Create: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/adaptive/api-client.ts`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/quiz/types.ts`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/stores/createPracticeSlice.ts`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/ZpdWidget.tsx`
- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/auth-token.ts`

## Implementation Steps

1. Add frontend types that mirror backend responses:
   - `AdaptiveRecommendation`
   - `AdaptiveSubmitResult`
   - `AdaptiveAnswerRecord`
2. Add `api-client.ts` with:
   - `recommendAdaptiveQuestion({ studentId, courseId, conceptId, token })`
   - `submitAdaptiveAnswer({ studentId, courseId, conceptId, questionId, decisionId, studentAnswer, responseTimeMs, token })`
3. Move duplicated auth/request behavior out of `ZpdWidget` into the new client.
4. Extend `ActivePracticeSession`:
   - `mode: 'adaptive' | 'static-demo'`
   - `conceptId`
   - `startedAt`
   - `adaptiveQuestions`
   - `maxQuestions: 10`
   - per-answer `submitResult`
5. Replace `submitPracticeAnswer` with either:
   - `recordAdaptiveSubmitResult(...)` for backend results.
   - `recordStaticDemoAnswer(...)` for fallback only.
6. Keep `fetchConceptMasteries` after submit to refresh dashboard/learning path state from backend.

## Success Criteria

- [ ] Adaptive API calls are centralized and typed.
- [ ] `ZpdWidget` and quiz flow can share the same client.
- [ ] Store no longer needs local Elo/BKT formulas for adaptive persisted answers.
- [ ] TypeScript models can represent both backend adaptive sessions and static demo fallback.

## Risk Assessment

- Risk: store migration breaks persisted Zustand shape. Mitigation: tolerate missing new fields and clear incompatible active session on start.
- Risk: naming confusion between `conceptCode` and `conceptId`. Mitigation: store both explicitly.
