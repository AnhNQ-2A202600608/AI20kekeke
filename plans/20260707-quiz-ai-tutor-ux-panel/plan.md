# Quiz AI Tutor UX Panel Plan

## Status
In progress.

## Context
- Screenshot issue: essay reference/checklist is below the fold while the footer action bar stays visible, so students must zoom or scroll awkwardly before grading.
- Sofi exists as a mascot/button, but the UI does not clearly advertise hint/help actions.
- Essay questions currently reuse a generic difficulty chip, which can read as "easy" even when the task is an open rubric review.
- Post-answer flow should surface AI tutor follow-up, not hide it behind a separate chat surface.

## Research Notes
- Duolingo's AI learning UX puts "Explain My Answer" directly after an answer, making AI help part of the exercise feedback loop.
- Khanmigo emphasizes Socratic guidance instead of direct answer delivery.
- Quizlet Q-Chat positions AI as adaptive tutor feedback and practice, not only a passive chatbot.
- Google PAIR feedback-loop guidance supports explicit user controls and feedback paths around AI behavior.

## Implementation
1. Keep the existing quiz shell and contracts.
2. Let the Sofi side panel open for essay questions as well as MCQ.
3. Rename the essay meta chip to describe challenge type/rubric instead of generic difficulty.
4. Add a visible Sofi hint CTA before submission.
5. Add a bottom review panel for essay self-check: reference answer, checklist, AI follow-up, and grade buttons.
6. Add a post-answer AI follow-up CTA for both MCQ and essay.

## Acceptance Criteria
- Essay reference/checklist and `Đạt` / `Chưa đạt` are reachable in the bottom panel without zooming the page.
- Sofi hint/help is visible before submission, including essay questions.
- Essay questions no longer show a misleading easy/difficulty chip as the primary challenge label.
- After a question is submitted, the student sees an explicit AI tutor follow-up action.
- Type/lint checks for touched frontend code pass or any unrelated failures are called out.
