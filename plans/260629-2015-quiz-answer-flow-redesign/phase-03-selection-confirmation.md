---
phase: 3
title: "Selection Confirmation"
status: completed
priority: P1
dependencies: [1, 2]
---

# Phase 3: Selection Confirmation

## Overview

Implement the `selected` state: option highlight first, then explicit check. This is the core behavior change.

## Requirements

- Functional: clicking an MCQ option highlights it only.
- Functional: footer CTA appears after selection.
- Functional: user can clear selection before checking.
- Functional: checking submits through existing answer path with current hint count.
- Non-functional: no correctness color, correct answer, explanation, Elo delta, or attempt history before check.

## Architecture

State mapping:

| Condition | View |
| --- | --- |
| no `currentHistory`, no `pendingSelectedOption` | `answering` |
| no `currentHistory`, has `pendingSelectedOption` | `selected` |
| has `currentHistory` | `reviewing` |

Button behavior:

```text
Option click -> setPendingSelectedOption(key)
Bỏ chọn -> setPendingSelectedOption(null)
Kiểm tra đáp án -> submit pendingSelectedOption with quizHintCount
```

## Related Code Files

- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/quiz-question-view.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/hooks/useQuizSession.ts`

## Implementation Steps

1. Add pending MCQ selected state in `QuizQuestionView` unless Phase 1 proves hook ownership is cleaner.
2. Update option card styles:
   - answering: neutral hover/tactile.
   - selected: active blue/green light state.
   - reviewing correct: green.
   - reviewing selected wrong: red/caution.
3. Add confirmation footer/banner:
   - primary: `Kiểm tra đáp án`
   - secondary: `Bỏ chọn`
4. Disable `Kiểm tra đáp án` while `isSubmittingAnswer`.
5. Ensure `pendingSelectedOption` is included in the wrong-answer prompt only after submit, not before.
6. Preserve existing answer submit path for adaptive and fallback modes.
7. If `unknown` submit remains, route it through an explicit secondary `Bỏ qua & xem giải thích` after hint use.

## Success Criteria

- [x] Selected option highlight appears immediately.
- [x] Correct/wrong state is not visible before `Kiểm tra đáp án`.
- [x] `Bỏ chọn` works and returns to neutral options.
- [x] `Kiểm tra đáp án` records one attempt and transitions to `reviewing`.
- [x] Existing adaptive submit errors still show recoverable UI state.

## Risk Assessment

- Risk: Extra click slows fast practice. Mitigation: this is intentional for learning mode; keyboard Enter can make check fast.
- Risk: Instant submit assumptions in tests or analytics. Mitigation: update event naming only where necessary; preserve `question_answered` event on final check.
- Risk: `unknown` state bypasses hint-first design. Mitigation: hide it until hint ladder is used or make it a secondary explicit skip.
