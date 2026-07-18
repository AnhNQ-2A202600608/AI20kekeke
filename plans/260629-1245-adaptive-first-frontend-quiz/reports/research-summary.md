---
title: "Adaptive-first Frontend Quiz Research Summary"
status: complete
created: "2026-06-29"
tags: [frontend, adaptive, quiz, research]
---

# Adaptive-first Frontend Quiz Research Summary

## Summary

Recommendation: use a **shared adaptive API client plus explicit adaptive session model**. Do not directly rewrite everything inside `useQuizSession`, and do not expand backend into a full quiz-session endpoint for this round.

## Codebase Evidence

| Area | Evidence | Implication |
| --- | --- | --- |
| Backend contract | `src/api/adaptive_routes.py` has `/recommend` and `/submit`; submit validates `decision_id`, student, selected question, replay, then returns backend mastery deltas. | Frontend should trust backend result, not calculate mastery. |
| Backend schemas | `src/models/adaptive_schemas.py` returns `old_elo`, `new_elo`, `old_bkt`, `new_bkt`, `mastery_state`, `weakness_flag`. | UI already has all data needed for feedback. |
| Existing frontend API pattern | `frontend/components/dashboard/ZpdWidget.tsx` calls `/api/v1/adaptive/recommend` and `/api/v1/adaptive/submit` with auth token fallback. | Reuse/extract this instead of duplicating fetch logic. |
| Current quiz flow | `frontend/app/hooks/useQuizSession.ts` loads static quiz JSON/questions and computes correctness locally. | Main flow must change from fixed list to sequential backend recommendations. |
| Current store risk | `frontend/stores/createPracticeSlice.ts` computes Elo/BKT locally and calls `/api/v1/adaptive/sync-mastery`. | This violates adaptive-first source-of-truth decision. |
| UI dependency | `QuizQuestionView` and `QuizResults` import `calculatePracticeEloProgression`. | Replace with backend submit result in adaptive mode. |
| Existing fallback content | `frontend/public/quizzes/**` and `/api/questions/[slug]` support local demo/study content. | Keep as fallback, but label non-persistent. |

## Approach Options

### Option A: Direct Hook Rewrite

Put `fetch('/api/v1/adaptive/...')` directly inside `useQuizSession`.

Pros:
- Fastest patch.
- Fewer files initially.

Cons:
- Makes `useQuizSession` larger and harder to test.
- Duplicates `ZpdWidget` request/auth behavior.
- Encourages more local state hacks.

Verdict: reject.

### Option B: Shared Adaptive Client + Session Model

Add `frontend/lib/adaptive/api-client.ts`, mirror backend types in frontend, and make `useQuizSession` orchestrate session lifecycle.

Pros:
- Minimal but real boundary.
- Reuses backend source-of-truth contract.
- Lets `ZpdWidget` and main quiz share request code.
- Keeps UI components focused on rendering.

Cons:
- Requires careful migration of persisted Zustand session shape.
- More files touched than direct rewrite.

Verdict: choose.

### Option C: Backend Quiz Session Endpoint

Create backend endpoint that owns the full 10-question session.

Pros:
- Best long-term data integrity.
- Easier repeat prevention and session audit.

Cons:
- Backend scope expansion.
- Existing `recommend`/`submit` already support the product decision.
- Slower delivery and more tests/migrations.

Verdict: defer.

## Key Open Technical Points

- Backend `RecommendRequest` has no `exclude_question_ids`; validation accepted duplicate recommendations for MVP instead of adding frontend retry or backend exclude work.
- Concept mapping must use `conceptMasteries[conceptCode].conceptId`; if absent, use static fallback and do not persist mastery.
- Adaptive main quiz is MCQ-first. Short-answer/numeric remain static fallback until a separate payload/UI plan verifies them.

## Recommended Implementation Shape

```text
frontend/lib/adaptive/api-client.ts
  recommendAdaptiveQuestion(...)
  submitAdaptiveAnswer(...)

frontend/lib/quiz/types.ts
  AdaptiveRecommendation
  AdaptiveSubmitResult
  ActivePracticeSession.mode

frontend/app/hooks/useQuizSession.ts
  start adaptive session
  render current recommendation as Question
  submit answer
  fetch next recommendation

frontend/stores/createPracticeSlice.ts
  record backend result
  refresh concept masteries
  no sync-mastery in adaptive mode
```

## Validation

- Static: `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`.
- Backend contract: `uv run pytest tests/test_api/test_adaptive.py`.
- Manual: start practice, answer, see backend Elo/BKT delta, continue, finish at 10, exit mid-session, verify fallback label.
