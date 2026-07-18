# Implementation Plan: Card-Integrated Progress & Standalone Header Elimination

Optimize the quiz workspace layout by eliminating the standalone top header bar (`QuizHeader`) to maximize vertical spacing, and integrating the progress tracking and exit mechanisms directly into the main interactive card views (`PreQuizSurvey`, `QuizQuestionView`, and `QuizResults`).

## User Review Required

> [!IMPORTANT]
> - The standalone `<QuizHeader />` component will be completely removed from `QuizWorkspace`.
> - A slim segmented progress bar (3px-4px height) will be integrated at the very top edge of the `<QuizQuestionView />` card, matching the rounded border of the card deck.
> - Exit buttons (`X` button to return to the roadmap) will be added to the top-left of each view card:
>   - **PreQuizSurvey**: Absolute positioned `absolute top-4 left-4` next to the title.
>   - **QuizQuestionView**: Placed inside the Header Info Row on the far-left, right next to the question counter.
>   - **QuizResults**: Absolute positioned `absolute top-4 left-4` next to the results.
> - We will delete `frontend/components/quiz/quiz-header.tsx` to maintain codebase hygiene.

---

## Proposed Changes

### Quiz Module Layout & Progress Optimization

#### [DELETE] [quiz-header.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/quiz-header.tsx)
- Delete the file entirely as all of its elements are migrated into the card components.

#### [MODIFY] [quiz-workspace.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/components/quiz-workspace.tsx)
- Remove imports and usage of `<QuizHeader />`.
- Clean up the layout container so it spans the vertical height properly without top header padding.

#### [MODIFY] [pre-quiz-survey.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/pre-quiz-survey.tsx)
- Accept `onClose: () => void` in `PreQuizSurveyProps`.
- Add a close button `absolute top-4 left-4` styled with `lucide-react`'s `X` icon to let the user return to the roadmap.

#### [MODIFY] [quiz-question-view.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/quiz-question-view.tsx)
- Add a card-integrated segmented progress bar at the very top edge inside the rounded container.
- Use `quiz.questionsList` and `quiz.answersHistory` to draw the segmented block color codes (correct = green, incorrect = red, active = pulsing orange, pending = gray).
- Add a close button at the start of the Header Info Row (`quiz.handleExitQuiz`).
- Ensure layout stays centered and fits beautifully on compact screens.

#### [MODIFY] [quiz-results.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/quiz-results.tsx)
- Add an absolute positioned close/exit button at `absolute top-4 left-4` pointing to `quiz.handleExitQuiz`.

---

## Verification Plan

### Automated Tests
- Run TypeScript compiler checks to ensure zero type errors:
  ```bash
  pnpm tsc --noEmit
  ```
- Run linter checks:
  ```bash
  pnpm run lint
  ```

### Manual Verification
- **PreQuizSurvey**: Verify the top-left Close (`X`) button exits the quiz successfully.
- **Active Question**:
  - Verify the progress segments show up correctly on the top edge of the card (e.g., rounded top corners).
  - Verify that answering correctly changes the corresponding segment to green, and answering incorrectly changes it to red.
  - Verify the Close (`X`) button next to the question counter exits back to the roadmap.
- **QuizResults**: Verify the top-left Close (`X`) button exits back to the roadmap.
