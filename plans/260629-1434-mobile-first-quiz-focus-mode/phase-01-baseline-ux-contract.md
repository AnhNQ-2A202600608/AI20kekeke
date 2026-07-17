---
phase: 1
title: "Baseline UX Contract"
status: completed
priority: P1
dependencies: []
---

# Phase 1: Baseline UX Contract

## Overview

Create an explicit mobile state contract before changing layout. The implementation should remove ambiguity about what belongs in the primary quiz surface versus secondary disclosure.

## Requirements

- Functional: document the visible content and actions for each quiz state: not submitted, submitted correct, submitted wrong, hint open, AI Tutor open, essay submitted, finished.
- Non-functional: preserve existing quiz behavior, answer history, AI Tutor prompt generation, report issue flow, and keyboard shortcuts on desktop.

## Architecture

Treat `QuizQuestionView` as a state renderer, not a catch-all content stack. Define local render sections for:

- compact header telemetry
- question prompt
- answer interaction
- single feedback slot
- secondary actions
- sticky primary footer

The phase can be implemented as local constants/helpers inside `QuizQuestionView` first. Do not add a new state machine library.

## Related Code Files

- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/quiz-question-view.tsx`
- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/hooks/useQuizSession.ts`
- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/hooks/useSocraticSidebar.ts`
- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/docs/product/design-guidelines.md`

## Implementation Steps

1. Inventory current mobile surfaces in `QuizQuestionView`: header badges, question prompt, options, explanation panel, wrong-answer nudge, hint deck, dev mode, footer buttons, report modal.
2. Define a `quizViewState` derivation from existing values: `isSubmitted`, `currentHistory?.isCorrect`, `currentQuestion.options`, `isEssayCompleted`, `selectedHint`, `quiz.devMode`.
3. Define which items are primary vs secondary per state.
4. Remove duplicate rendering paths for `wrongAnswerTutorNudge`; it must have one owner.
5. Keep dev mode available but ensure it cannot appear in the primary mobile feedback path by default.
6. Add comments only where they explain the hierarchy invariant.

## Success Criteria

- [x] Every mobile quiz state has exactly one primary action.
- [x] `wrongAnswerTutorNudge` has one render location per active flow.
- [x] Hints, AI Tutor, report issue, and dev mode are classified as secondary surfaces.
- [x] No scoring, persistence, or API behavior changes were introduced by this UI pass.

## Risk Assessment

- Risk: refactor accidentally changes when `Tiếp tục` appears. Mitigation: derive view state from existing booleans; do not alter submit/next handlers.
- Risk: dev mode is lost. Mitigation: preserve it behind a subordinate section, not in the main mobile path.
