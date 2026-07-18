---
phase: 3
title: Reduce Question Transition Latency
status: completed
priority: P1
dependencies:
  - 1
---

# Phase 3: Reduce Question Transition Latency

## Overview

Reduce perceived delay when moving from one adaptive question to the next by avoiding a full-screen loading replacement.

## Requirements

- Functional: next question still comes from `recommendAdaptiveQuestion`.
- Functional: answer submission and Elo/BKT update remain unchanged.
- Functional: while fetching next adaptive question, current review screen remains visible.
- Non-functional: prevent duplicate recommend calls from double-clicks.

## Architecture

Split initial question-set loading from adaptive next-question loading. `isLoadingQuestions` should remain for initial set fetch/startup. Add a narrower state such as `isLoadingNextQuestion` inside `useQuizSession` and expose it to `QuizQuestionView`.

## Related Code Files

- Modify: `frontend/app/hooks/useQuizSession.ts`
- Modify: `frontend/components/quiz/quiz-question-view.tsx`
- Possibly inspect: `frontend/app/components/quiz-workspace.tsx`
- Possibly inspect: `frontend/components/quiz/loading-questions-card.tsx`

## Implementation Steps

1. Add `isLoadingNextQuestion` state in `useQuizSession`.
2. In `handleNextQuestion`, replace `setIsLoadingQuestions(true/false)` for adaptive next with `setIsLoadingNextQuestion(true/false)`.
3. Keep `isLoadingQuestions` for initial manifest/question loading and restart/start flows where no current question can be shown.
4. Disable the `Tiếp tục câu N` button while `isLoadingNextQuestion`.
5. Change button copy to `Đang lấy câu tiếp...` or show a small spinner.
6. Keep error handling inline in the review screen through existing `adaptiveError`.
7. Verify static-demo next question remains instant and unchanged.

## Success Criteria

- [ ] No `LoadingQuestionsCard` flashes between adaptive answered questions.
- [ ] User cannot trigger duplicate recommendation requests by repeated clicks.
- [ ] Initial quiz load still shows the loading card when needed.
- [ ] Adaptive recommendation errors leave the learner on the current review screen with a retry path.

## Risk Assessment

Do not prefetch before the answer result is recorded unless backend confirms the recommendation is independent of the just-submitted attempt. Inline loading is the safe first fix.
