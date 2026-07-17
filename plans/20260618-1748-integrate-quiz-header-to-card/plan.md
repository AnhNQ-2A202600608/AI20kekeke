# Integrate Quiz Header to Card

## Overview
- **Status:** Planning
- **Description:** Remove the standalone `QuizHeader` component to eliminate vertical spacing overhead and integrate progress tracking and exit mechanisms directly into the quiz cards (`PreQuizSurvey`, `QuizQuestionView`, `QuizResults`).

## Proposed Files
- [DELETE] `frontend/components/quiz/quiz-header.tsx`
- [MODIFY] `frontend/app/components/quiz-workspace.tsx`
- [MODIFY] `frontend/components/quiz/pre-quiz-survey.tsx`
- [MODIFY] `frontend/components/quiz/quiz-question-view.tsx`
- [MODIFY] `frontend/components/quiz/quiz-results.tsx`

See details in [implementation_plan.md](./implementation_plan.md).
