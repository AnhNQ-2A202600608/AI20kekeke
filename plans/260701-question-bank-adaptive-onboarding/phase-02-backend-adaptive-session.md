---
phase: 2
title: "Backend adaptive session"
status: completed
priority: P1
dependencies: [1]
---

# Phase 2: Backend adaptive session

## Overview

Move onboarding diagnostic orchestration to backend-owned state. The backend selects, grades, updates draft BKT/Elo, and returns the next question.

## Requirements

- Functional: start diagnostic after 2 context answers.
- Functional: answer endpoint returns graded feedback and next question.
- Functional: completion commits official profile and mastery seed.
- Non-functional: p95 diagnostic answer latency stays bounded by avoiding full bank scans.
- Security: client cannot forge correctness, question Elo, BKT, or concept weights.

## Architecture

Add endpoints:

```text
POST /api/v1/onboarding/diagnostic/start
POST /api/v1/onboarding/diagnostic/answer
POST /api/v1/onboarding/complete
GET  /api/v1/onboarding/status
```

Session state options:
- Preferred: `app.onboarding_diagnostic_sessions` table with `session_id`, `student_id`, `course_id`, `context`, `candidate_question_ids`, `answered`, `posterior`, `expires_at`, `completed_at`.
- Acceptable MVP: signed opaque session payload if DB table is too much, but DB table is better for latency, audit, and recovery.

Selection heuristic:
1. Ensure concept coverage across foundation, prompt/API, embeddings/RAG, evaluation/debug.
2. Start near default Elo 1200 or inferred weak area.
3. After each answer, update per-concept BKT posterior and student Elo draft.
4. Next item target difficulty = current draft Elo plus small challenge offset:
   - correct: +80 to +140,
   - incorrect: -80 to -120,
   - clamp to eligible pool.
5. Tie-break by unasked concepts, closest difficulty, lower exposure.

Commit rule:
- Draft posterior can be stored per answer in session.
- Official `student_concept_mastery.bkt_mastery_probability` and `elo_score` are written only on complete.
- That committed value is the learner's initial `P(L0)` seed for the course profile.

## Related Code Files

- Modify: `src/api/onboarding_routes.py`
- Modify: `src/services/adaptive/database_interface.py`
- Modify: `src/services/adaptive/supabase_database.py`
- Modify: `db/supabase/migrations/20260630185421_onboarding_diagnostic_mastery_seed.sql`
- Create: `db/supabase/migrations/*_onboarding_diagnostic_sessions.sql`
- Modify: `tests/test_api/test_onboarding.py`

## Implementation Steps

1. Add `DiagnosticQuestionPublic`, `DiagnosticStartRequest`, `DiagnosticAnswerRequest`, and `DiagnosticAnswerResponse` models.
2. Implement `load_onboarding_candidate_questions(course_id)` with:
   - `calibration_status = published`,
   - `type = mcq`,
   - diagnostic metadata enabled,
   - concept joins via `question_concepts`.
3. Implement session persistence and expiry.
4. Replace `_grade_diagnostic_answers` with DB-backed grading that reads `app.questions.answer_key`.
5. Update `_build_summary` to use real question metadata and concept codes.
6. Update completion RPC input contract:
   - accept server-graded session evidence,
   - write profile,
   - seed mastery,
   - log `audit.mastery_events`,
   - update question Elo/calibration records or emit calibration outbox.
7. Keep stub mode deterministic with in-memory fake sessions only for tests, not production fallback.

## Success Criteria

- [x] Client cannot submit arbitrary `correct`.
- [x] Duplicate answer/question replay is rejected.
- [x] Answering unknown or non-session question is rejected.
- [x] Completing before 5 answers is rejected.
- [x] Optional continue after 5 and before 8 works.
- [x] Completion writes mastery once and is idempotent per profile version.

## Risk Assessment

Risk: official mastery write after each answer pollutes profile if user abandons onboarding.
Mitigation: write draft session state per answer; commit official mastery only on completion. If the product wants abandoned diagnostic recovery later, a separate resume policy can promote sessions explicitly.
