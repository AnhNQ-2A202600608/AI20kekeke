# Frontend User Flows

## Overview

Flows are written for the MVP vision and note where current frontend behavior already exists. The product must stay Adaptive-first: each learning action should produce or use mastery signals.

## Flow 1: Student Starts Recommended Practice

```text
Open dashboard
  -> See learning path and weak/recommended concept
  -> Select recommended quiz
  -> Complete pre-quiz confidence check
  -> Answer adaptive questions
  -> Use Socratic hints if stuck
  -> Submit answers
  -> See score, mastery delta, weak questions
  -> Continue with suggested next action
```

### Current support

- Dashboard, learning path, quiz selection, pre-survey, answer flow, result screen, incorrect questions, XP and streak are implemented in current app state.

### MVP gaps

- Recommendation should be concept/mastery driven.
- Questions should be selected by ZPD target success 70%-75%.
- Hint use should reduce Elo gain.
- Results should show mastery delta and next weak concept.

## Flow 2: Student Uses Socratic RAG Tutor

```text
Open Tutor Chat
  -> Choose mode: Explain / Hint / Debug / Practice / Review
  -> Ask course-related question
  -> System retrieves published source chunks
  -> Tutor responds with Socratic guidance and citation cards
  -> Student follows hint or asks follow-up
  -> Student marks helpful/unhelpful or reports citation issue
  -> System logs learning signal
```

### Required states

- Empty prompt suggestions from current weak concepts.
- Loading retrieval state.
- Cited answer state.
- Low-confidence fallback state.
- Academic-integrity guardrail state.
- Feedback submitted state.

## Flow 3: Academic Integrity Guardrail

```text
Student asks for direct homework/lab/test answer
  -> Intent classifier detects cheating risk
  -> UI shows firm refusal reason
  -> Tutor offers concept explanation, method outline, or first guiding question
  -> Student can continue with Socratic hints
  -> Guardrail event logged for audit
```

### UX rules

- Do not shame the student.
- Do not provide final answer or copy-ready code.
- Always redirect to learning method or related concept.
- Make the allowed next action obvious.

## Flow 4: Student Reviews Progress

```text
Open Profile / Progress
  -> See identity, streak, XP, attempts
  -> Inspect radar chart by concept
  -> Inspect heatmap/activity history
  -> Review weak concepts ranked by urgency
  -> Click concept to open tutor or practice quiz
```

### Current support

- Profile, heatmap-like activity, radar chart, skill bars, completion counts exist.

### MVP gaps

- Radar and skill bars should bind to real concept mastery.
- Weak concepts need labels and direct actions.
- Progress should separate activity from mastery.

## Flow 5: Student Creates Profile / Logs In

```text
Open landing page
  -> Choose login, demo access, or start learning
  -> Student enters auth info or uses demo bypass
  -> System creates or authenticates account
  -> If onboarding is incomplete, route to setup and diagnostic
  -> Save onboarding profile and recommended start concept
  -> Route to student dashboard
  -> Progress sync becomes available
```

### Current support

- Landing page, `/login`, `/onboarding`, and `/app` routes are implemented.
- Onboarding captures survey answers, diagnostic answers, summary, and recommended concept through the backend onboarding API.

### MVP gaps

- Replace local simulation with backend RBAC auth.
- Preserve return destination after login.
- Support Student, Mentor, BTC/Admin routing.

## Flow 6: Mentor Reviews Class Weak Concepts

```text
Open Lecturer Insights
  -> Select course/class
  -> View class mastery distribution
  -> Review weak concepts ranked by count/severity
  -> Open student list for a concept
  -> Assign or recommend learning plan/practice
  -> Monitor follow-up attempts
```

### MVP requirements

- Prioritize weak concepts, not generic analytics.
- Link each weak concept to source coverage and quiz availability.
- Show student-level details only to authorized mentor/admin roles.

## Flow 7: Mentor Uploads and Publishes Course Material

```text
Open Material Ingestion
  -> Upload PDF/PPTX
  -> Add course, week/day, concept tags, visibility metadata
  -> System chunks, embeds, and generates draft quizzes
  -> Mentor reviews chunks, citations, and generated questions
  -> Mentor runs RAG test queries
  -> Mentor publishes approved material and quizzes
```

### MVP requirements

- Draft content must be hidden from student retrieval.
- Publication status must be explicit.
- Generated quizzes require human review before student use.

## Flow 8: Mentor Tests RAG Quality

```text
Open RAG Test Panel
  -> Enter representative student question
  -> Review retrieved chunks and citation metadata
  -> Preview tutor response
  -> Confirm good result or flag missing/wrong source
  -> Save feedback to audit backlog
```

### MVP requirements

- Show source title, page/slide/section, excerpt.
- Show confidence and low-confidence fallback behavior.
- Allow test against draft and published sources with clear labels.

## Flow 9: Admin Audits Safety and Quality

```text
Open Audit Dashboard
  -> Filter low-confidence, unhelpful, citation error, guardrail events
  -> Inspect event details and source context
  -> Route issue to material fix, prompt fix, or policy review
  -> Export evidence for demo/QA if needed
```

### MVP requirements

- Never expose secrets or raw internal prompts.
- Keep audit actions role-protected.
- Link each event to course, concept, source, and user/session metadata where allowed.
