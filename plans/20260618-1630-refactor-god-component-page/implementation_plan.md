# Implementation Plan: Refactoring QuizWorkspace & Implementing 10 UI/UX Features

Deconstruct the monolithic `QuizWorkspace` component (`quiz-workspace.tsx`, 921 lines) under `frontend/app/components/` into a highly modular component structure under `frontend/components/quiz/`. Simultaneously, implement the 10 confirmed UI/UX improvements to deliver a premium, focus-oriented, and gamified experience.

## User Review Required

> [!IMPORTANT]
> - All new components will be located in the folder `frontend/components/quiz/`.
> - The original file [quiz-workspace.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/components/quiz-workspace.tsx) will be modified to act as a clean entrypoint, importing and orchestrating the extracted sub-components.
> - We will reuse types/interfaces from the existing hooks (`useQuizSession`, `useSocraticSidebar`, `useSurveyHandlers`).
> - We will eliminate the duplicate JSX rendering for the Socratic AI Chat by creating a single unified `SocraticChatBody` sub-component and reusing it in both the desktop sidebar and mobile drawer.

## 10 Confirmed UI/UX Features to Implement

| # | Feature | Target File | Implementation Details |
|---|---|---|---|
| 1 | **Segmented progress bar** | `quiz-header.tsx` | Render a row of blocks (one per question) colored based on answer correctness: green (correct), red (incorrect), gray (unanswered), pulsing (active). |
| 2 | **MCQ 2x2 grid** | `quiz-question-view.tsx` | Auto-detect if any option text exceeds 50 chars. If so, fallback to vertical layout; otherwise, display as a responsive 2x2 grid on desktop. |
| 3 | **2-part explanation** | `quiz-question-view.tsx` | Heuristically parse explanation string at transition keywords (e.g. *tuy nhiên, trong khi đó, ngược lại*) to render two panels: "Tại sao đúng" & "Tại sao phương án khác chưa tối ưu". |
| 4 | **Nút "Chưa biết?"** | `quiz-question-view.tsx` | Render a "Chưa biết?" link below options to submit an incorrect attempt, letting students immediately view the explanations without guessing. |
| 5 | **Source reference badge** | `quiz-question-view.tsx` | Show a "📖 Từ: Day X" badge near the question index, derived from the active set's parent ID or topic title. |
| 6 | **Staggered animation** | `quiz-question-view.tsx` | Add `framer-motion` variants to fade and slide options in sequentially, plus smooth slide-ups for the explanation card. |
| 7 | **Dev Mode panel** | `quiz-question-view.tsx`, `quiz-results.tsx` | If devMode is active, display a collapsible card containing algorithm parameters (Elo, MAB, BKT, SFIA competency, difficulty). |
| 8 | **Elo compact cho student** | `quiz-question-view.tsx`, `quiz-results.tsx` | Display inline ELO changes after an answer is graded (e.g., `Elo: 1180 → 1195 (+15)` or `-10`). |
| 9 | **Random feedback copy** | `quiz-question-view.tsx` | Seed-based random generator selecting from 5-7 positive encouraging phrases for correct answers, and 5-7 constructive phrases for incorrect answers. |
| 10 | **Socratic AI** | `socratic-sidebar-view.tsx` | Preserve the behavior of the desktop drawer panel and mobile drawer exactly, while refactoring to remove duplicate JSX. |

---

## Proposed Changes

### Quiz Module Refactoring & UI/UX Features

#### [MODIFY] [quiz-header.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/quiz-header.tsx)
- Add props `questionsList` (`any[]`) and `answersHistory` (`any`) to draw the segmented progress bar.
- Replace the continuous bar with a row of question blocks colored green/red/gray based on correctness.

#### [NEW] [socratic-sidebar-view.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/socratic-sidebar-view.tsx)
- Renders the desktop Socratic AI Tutor sidebar panel (`<aside>`) and the mobile drawer panel (`AnimatePresence` + `<motion.div>`).
- Extracts the duplicate message list, typing indicators, citations block, and message form into a reusable `SocraticChatBody` component inside the same file (keeping it neat and DRY).
- Accepts `aiSidebar` hook return value and `showSidebar` boolean as props.

#### [NEW] [quiz-question-view.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/quiz-question-view.tsx)
- Renders the active question card.
- Implements: MCQ 2x2 Grid with fallback, "Chưa biết?" button, source reference badge, and staggered entrance animations.
- Renders 2-part explanations, compact student ELO updates, and the Dev Mode panel showing algorithmic formulas (Elo, BKT updates).
- Uses seed-based index selection for random feedback copies (correct vs incorrect).
- Accepts `quiz`, `aiSidebar`, and `surveys` hook return values as props.

#### [NEW] [quiz-results.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/quiz-results.tsx)
- Renders the results screen when the quiz finishes.
- Shows total score, accuracy percentage, post-quiz survey, list of incorrect questions, and restart/exit action buttons.
- Integrates compact ELO delta summaries and the Dev Mode algorithm details if enabled.
- Accepts `quiz` and `surveys` hook return values as props.

#### [MODIFY] [quiz-workspace.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/components/quiz-workspace.tsx)
- Cleans up imports, removes inline JSX blocks for active questions, results screen, and sidebars.
- Orchestrates `<QuizHeader />`, `<LoadingQuestionsCard />`, `<PreQuizSurvey />`, `<QuizQuestionView />`, `<QuizResults />`, and `<SocraticSidebarView />`.
- Shrinks the file size from 921 lines to ~100 lines.

## Verification Plan

### Automated Tests
- Run TypeScript compilation to check for zero type errors:
  ```bash
  pnpm tsc --noEmit
  ```
- Run linter to ensure code standards:
  ```bash
  pnpm run lint
  ```

### Manual Verification
- Verify that entering a quiz set loads the pre-quiz survey properly.
- Verify that selecting choices in MCQ or typing answers in essay and self-evaluating works correctly.
- Verify that requesting AI hints and sending Socratic messages works on both desktop and mobile drawer.
- Verify that the finish screen shows the correct stats, allows post-quiz survey submission, lists wrong answers, and the "Quay lại" / "Làm lại" buttons function perfectly.
