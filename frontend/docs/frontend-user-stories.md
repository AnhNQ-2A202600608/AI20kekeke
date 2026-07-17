# Frontend User Stories

## Overview

User stories cover all MVP roles: Student, Mentor/Lecturer, BTC/Admin, and Content Reviewer. Acceptance criteria focus on frontend behavior and product fit.

## Student Stories

### S1: Start adaptive practice

As a student, I want to start a recommended practice quiz so that I can focus on concepts I have not mastered.

Acceptance criteria:
- Dashboard shows a recommended next quiz or weak concept.
- Quiz starts with a clear intro or confidence check.
- Result screen shows score, weak questions, and next action.
- Completion updates visible progress.

### S2: Get Socratic help during learning

As a student, I want the tutor to guide me with questions and hints so that I understand the concept without being given answers directly.

Acceptance criteria:
- Student can choose a learning mode.
- Tutor response uses official course citations when retrieval is used.
- Tutor asks guiding questions for hint mode.
- Tutor provides a useful fallback if sources are insufficient.

### S3: Ask for quiz help without losing integrity

As a student, I want hints during a quiz so that I can learn when stuck without turning the quiz into answer copying.

Acceptance criteria:
- Hint UI does not reveal the final answer immediately.
- Hint count is visible or traceable.
- Result reflects that hints were used.
- Mastery gain can be discounted based on hint count.

### S4: Understand my progress

As a student, I want to see my concept mastery and activity history so that I know what to review next.

Acceptance criteria:
- Dashboard shows mastery labels for each concept.
- Weak concepts are visually and textually identified.
- Heatmap/activity does not replace mastery evidence.
- Each weak concept links to practice or tutor chat.

### S5: Create a profile and preserve progress

As a student, I want to create a profile so that my quiz attempts, streak, and mastery data persist across sessions.

Acceptance criteria:
- Auth modal supports signup/login path.
- Successful auth returns to the intended screen.
- Profile shows identity and saved progress.
- Logged-out users see clear sync/profile CTA.

### S6: Report poor tutor output

As a student, I want to mark an answer as unhelpful or report a citation issue so that the course team can improve the tutor.

Acceptance criteria:
- Answer cards include feedback controls.
- Feedback submission confirms success.
- Reported issue captures message/source context for mentor review.

## Mentor / Lecturer Stories

### M1: See class weak concepts

As a mentor, I want to see weak concepts across the class so that I can adjust teaching or recommend practice.

Acceptance criteria:
- Class insight page ranks weak concepts.
- Each concept shows affected student count or severity.
- Mentor can drill into students needing support.
- View is scoped to authorized courses/classes.

### M2: Review an individual student's progress

As a mentor, I want to inspect a student's mastery profile so that I can decide whether they need intervention.

Acceptance criteria:
- Student detail shows mastery by concept, attempts, and recent activity.
- Weak concepts include evidence from attempts or feedback.
- Mentor can recommend or assign practice.

### M3: Upload course materials

As a mentor, I want to upload official materials so that the tutor can answer from approved course sources.

Acceptance criteria:
- Upload form accepts supported document types.
- Mentor enters course, week/day, and concept metadata.
- Uploaded material starts in draft status.
- UI shows processing/chunking status.

### M4: Review generated quizzes before publishing

As a mentor, I want to review generated quiz questions so that students only see accurate practice content.

Acceptance criteria:
- Generated questions appear as draft.
- Mentor can inspect answer, explanation, concept tag, and hints.
- Mentor can approve/publish or send back for revision.
- Draft questions are hidden from students.

### M5: Test RAG retrieval

As a mentor, I want to run test questions against course materials so that I can verify citations and answer quality.

Acceptance criteria:
- Test panel shows retrieved chunks and generated answer preview.
- Citations include source title and page/slide/section.
- Low-confidence result is clearly labeled.
- Mentor can flag missing/wrong retrieval.

## BTC / Admin Stories

### A1: Manage role-based access

As an admin, I want to manage user roles so that students, mentors, and admins only see appropriate tools.

Acceptance criteria:
- Authenticated role controls navigation and protected pages.
- Privileged pages are hidden or blocked for students.
- Frontend does not trust client-only role claims for sensitive actions.

### A2: Publish or unpublish course sources

As an admin, I want to control publication status so that only approved materials power student tutoring.

Acceptance criteria:
- Source list shows draft/published state.
- Admin can change status through a confirmation flow.
- Student-facing retrieval only uses published sources.

### A3: Audit low-quality or unsafe interactions

As an admin, I want to review low-confidence, unhelpful, citation error, and guardrail events so that system quality is measurable.

Acceptance criteria:
- Audit dashboard supports filters by event type, course, concept, and date.
- Event detail shows safe contextual metadata.
- Admin can route issue to source, prompt, or policy follow-up.

### A4: Export demo/QA evidence

As an admin, I want to export key logs and screenshots so that the team can prove MVP behavior in reviews.

Acceptance criteria:
- Export flow includes successful RAG, guardrail, quiz, and mastery examples.
- Export excludes secrets and sensitive raw prompts.
- Export clearly labels source/course context.

## Content Reviewer Stories

### C1: Validate citation quality

As a content reviewer, I want to inspect citation cards and retrieved excerpts so that answers remain grounded in official materials.

Acceptance criteria:
- Citation cards show enough metadata to locate the original material.
- Reviewer can flag wrong, missing, or stale citations.
- Flagged issues appear in audit/review queue.

### C2: Validate academic-integrity behavior

As a content reviewer, I want to test cheating-risk prompts so that the tutor refuses direct answer requests and still teaches constructively.

Acceptance criteria:
- Guardrail response refuses answer-copying.
- Response offers method, concept explanation, or guiding question.
- Event is logged for audit.

## Prioritization

| Priority | Stories |
| --- | --- |
| P0 MVP student core | S1, S2, S3, S4, S5 |
| P0 safety/source quality | S6, M5, A3, C1, C2 |
| P1 lecturer workflows | M1, M2, M3, M4 |
| P1 admin workflows | A1, A2 |
| P2 demo/operations | A4 |
