# Quiz First-Run Onboarding Plan

## Status
Completed

## Research Notes
- Keep the walkthrough focused on one high-value outcome: learner can answer a quiz question, understand Elo impact, and ask Sofi for cited help.
- Prefer contextual tooltips and real UI actions over a long modal-only tour.
- Keep the flow skippable and persist completion per user.

## Flow
1. Question area: explain that EduGap generates/adapts questions from the active skill and learner mastery.
2. Difficulty chip: explain adaptive difficulty and where to inspect challenge level.
3. Hint button: explain Sofi hints, three-step ladder, and Elo reduction when hints are used.
4. Answer/check action: explain select answer, check result, and Elo change in the top bar.
5. Sofi Q&A: open the AI tutor panel and ask the learner to try chat.
6. Citation: point to Sofi citations/slide preview after the AI response path is visible.

## Implementation
- Add a quiz-specific first-run storage key under `frontend/lib/onboarding`.
- Add `QuizFirstRunWalkthrough` component under `frontend/components/quiz`.
- Add stable `data-quiz-tour-id` anchors to quiz UI and Sofi sidebar.
- Mount walkthrough in `QuizWorkspace` only after a question is loaded.

## Acceptance
- Starts when a user first enters quiz mode with a loaded question.
- Does not repeat after completion/dismissal for the same user.
- Has skip and next/back controls.
- Does not change layout when visible.
- Can open Sofi tutor during the AI walkthrough step.
- Highlights degrade gracefully on mobile when the target is hidden or not yet mounted.
