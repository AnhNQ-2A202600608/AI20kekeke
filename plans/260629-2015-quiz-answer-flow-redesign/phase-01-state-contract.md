---
phase: 1
title: "State Contract"
status: completed
priority: P1
dependencies: []
---

# Phase 1: State Contract

## Overview

Define the quiz answer state contract before changing UI. The main change is separating local option selection from backend answer submission.

## Requirements

- Functional: MCQ flow supports `answering`, `selected`, and `reviewing`.
- Functional: selecting an option is reversible before submit.
- Functional: final submit continues using the existing `handleSelectOption` adaptive/local submit logic or a renamed equivalent.
- Non-functional: no backend contract change, no scoring formula change, no local fake attempt writes during `selected`.

## Architecture

Current contract:

```text
click option -> handleSelectOption(option, hintCount) -> submit/adaptive result -> isSubmitted
```

Target contract:

```text
click option -> pendingSelectedOption
pendingSelectedOption + Check -> submit option -> currentHistory -> reviewing
Bỏ chọn -> pendingSelectedOption = null
```

`currentHistory` remains the source of truth for submitted/reviewing state. A new local UI state in `QuizQuestionView` is acceptable if it resets on question id changes. If reuse across components becomes necessary, expose it from `useQuizSession`; otherwise keep it presentation-local for KISS.

## Related Code Files

- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/quiz-question-view.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/hooks/useQuizSession.ts`
- Inspect: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/stores/createPracticeSlice.ts`
- Inspect: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/quiz/types.ts`

## Implementation Steps

1. Audit all call sites of `handleSelectOption`.
2. Decide naming:
   - Keep `handleSelectOption` for final submit and introduce local `pendingSelectedOption`, or
   - Rename submit handler to `handleCheckOption` if call sites stay narrow.
3. Add/reset pending selected option when `currentQuestion.id`, `activeSetId`, or submitted history changes.
4. Ensure keyboard shortcuts do not submit accidentally. If numeric key support exists, map it to selection only; Enter checks only when a pending option exists.
5. Keep `quizHintCount` passed to final submit at the moment of check.
6. Preserve `unknown` behavior but move it behind hint-first flow in Phase 2.
7. Confirm adaptive submit still happens exactly once per checked answer.

## Success Criteria

- [x] State names are explicit in code or derived clearly.
- [x] Clicking an option does not create `answersHistory`.
- [x] `Bỏ chọn` clears selection with no persistence writes.
- [x] `Kiểm tra đáp án` creates one submitted history entry.
- [x] Navigating to another question clears pending selection.

## Risk Assessment

- Risk: Double submit from rapid clicks. Mitigation: reuse `isSubmittingAnswer` and disable check button while submitting.
- Risk: Back navigation shows stale pending selection. Mitigation: reset by question id and submitted history.
- Risk: Essay flow regression. Mitigation: scope state contract to MCQ only; leave essay submit/review unchanged unless shared helpers require small adjustments.
