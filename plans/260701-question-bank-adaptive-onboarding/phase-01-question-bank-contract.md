---
phase: 1
title: "Question bank contract"
status: completed
priority: P1
dependencies: []
---

# Phase 1: Question bank contract

## Overview

Make `app.questions` capable of serving onboarding diagnostic questions without frontend/backend hardcoded banks.

The minimum viable contract should live in DB data and typed backend parsing, not in duplicated TypeScript/Python arrays.

## Requirements

- Functional: identify diagnostic-eligible questions from `app.questions`.
- Functional: expose public question payload without correct answer.
- Functional: retain deterministic grading from `answer_key`.
- Non-functional: no fake fallback data; low latency selection; migration is re-run safe.

## Architecture

Recommended MVP metadata shape:

```json
{
  "options": {
    "A": "Choice text",
    "B": "Choice text"
  },
  "correct": "A",
  "explanation": "Short feedback",
  "diagnostic": {
    "enabled": true,
    "bloom_level": "understand|apply|analyze",
    "encouragement": {
      "correct": "Short positive feedback",
      "incorrect": "Short recovery feedback"
    },
    "concept_weights": {
      "d1-ai-llm-foundations": 1.0,
      "d4-prompt-engineering": 0.25
    }
  }
}
```

Use `app.question_concepts` for canonical many-to-many coverage. Use `answer_key.diagnostic.concept_weights` only for weighting and onboarding-specific labels until a normalized Q-matrix table exists.

## Related Code Files

- Modify: `db/supabase/migrations/*_onboarding_diagnostic_question_bank.sql`
- Modify: `src/api/onboarding_routes.py`
- Modify: `tests/test_api/test_onboarding.py`
- Reference: `db/seed/seed-day1.sql`
- Reference: `db/supabase/migrations/20260611_initial_schema.sql`
- Reference: `db/supabase/migrations/20260623_question_multiple_concepts.sql`

## Implementation Steps

1. Add a migration that adds helper indexes if missing:
   - `idx_questions_course_status_difficulty`
   - `idx_questions_answer_key_diagnostic` as GIN or expression index if Postgres supports the target filter.
2. Seed or update 8-12 diagnostic-eligible MCQ rows in `app.questions`.
3. Add a backend parser for diagnostic question metadata:
   - validates `type = mcq`,
   - validates `answer_key.options`,
   - validates `answer_key.correct`,
   - validates `diagnostic.enabled`,
   - validates concept weights resolve to real `app.concepts.code`.
4. Add a question-bank health check helper used by tests and startup/admin path.
5. Remove onboarding question text from frontend runtime data after Phase 3 consumes backend payloads.

## Success Criteria

- [x] At least 8 published diagnostic MCQs exist for the default course.
- [x] Each diagnostic item has `difficulty_elo`, one primary concept, and public options.
- [x] Backend parser rejects malformed `answer_key` before serving a question.
- [x] Existing seed data can be re-run without duplicating questions.

## Risk Assessment

Risk: putting metadata in JSON can drift.
Mitigation: add strict Pydantic parsing and tests now; defer normalized Q-matrix until authoring scale requires it.
