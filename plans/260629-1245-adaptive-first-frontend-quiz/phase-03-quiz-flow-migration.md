---
phase: 3
title: "Quiz Flow Migration"
status: completed
priority: P1
dependencies: [2]
---

# Phase 3: Quiz Flow Migration

## Overview

Migrate the main quiz runtime from loading a fixed question list to requesting backend-selected MCQ questions sequentially until 10 answers are complete or the user exits.

## Requirements

- Functional: start practice by requesting the first adaptive recommendation for the selected concept.
- Functional: submit MCQ answers through `/adaptive/submit`.
- Functional: keep short-answer and numeric questions in static-demo fallback for this migration.
- Functional: after successful submit, request next recommendation only when user clicks continue.
- Functional: finish after 10 submitted adaptive answers.
- Non-functional: do not double-submit a consumed `decision_id`.

## Architecture

Sequence:

```text
Start practice
  -> resolve studentId/courseId/conceptId
  -> recommend
  -> render returned question
Answer
  -> submit with decisionId/questionId/responseTimeMs
  -> store backend result
Continue
  -> recommend next
  -> repeat until 10, accepting duplicates if backend repeats
Finish
  -> summarize stored backend results
```

## Related Code Files

- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/hooks/useQuizSession.ts`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/stores/createPracticeSlice.ts`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/components/quiz-workspace.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/loading-questions-card.tsx`
- Maybe modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/api/questions/[slug]/route.ts` only if fallback labeling needs clarity.

## Implementation Steps

1. Add adaptive session lifecycle state in `useQuizSession`:
   - `isLoadingAdaptiveQuestion`
   - `adaptiveError`
   - `currentAdaptiveRecommendation`
   - `questionStartedAt`
2. Update `handleStartPractice`:
   - resolve `targetSetId` -> `conceptMasteries[targetSetId].conceptId`.
   - if concept ID exists, start adaptive session.
   - if missing and local JSON exists, start `static-demo` fallback with non-persistent label.
3. Convert backend recommendation into existing `Question` shape for rendering:
   - `id = question_id`
   - `question = prompt`
   - `options = options`
   - keep `decision_id`, `concept_id`, `expected_success`, `expected_reward` in adaptive metadata.
4. Update `handleSelectOption`:
   - disable instant local correctness calculation for adaptive mode.
   - call `submitAdaptiveAnswer` with `student_answer: { selected_option: optionKey }`.
   - store backend result in answers/session.
5. Keep essay/numeric handling in `static-demo` mode for this migration. Do not route non-MCQ main quiz answers through adaptive submit until a separate payload/UI plan validates them.
6. Update `handleNextQuestion`:
   - if answered count >= 10, show finish screen.
   - otherwise call next `recommend`.
7. If backend recommends a duplicate `question_id`, accept it for MVP and render it normally.
8. On 409 replay error, show a recoverable state and request a fresh recommendation only after user action.
9. On 404 no questions, show concept-specific empty state and offer return to learning path.

## Success Criteria

- [ ] Main adaptive MCQ practice no longer depends on a preloaded fixed 10-question list.
- [ ] Each submitted adaptive question has one decision ID and one backend result.
- [ ] `response_time_ms` is measured from recommendation render to submit.
- [ ] User can exit without submitting the current question.
- [ ] User can finish exactly 10 answered adaptive questions.

## Risk Assessment

- Risk: backend may recommend the same question repeatedly. Mitigation: accepted for MVP by validation; revisit with backend `exclude_question_ids` only after user feedback proves the repeat rate is harmful.
- Risk: localStorage answer history keyed by old static set IDs conflicts with adaptive IDs. Mitigation: namespace adaptive session history separately.

<!-- Updated: Validation Session 1 - MCQ-first scope and duplicate acceptance -->
