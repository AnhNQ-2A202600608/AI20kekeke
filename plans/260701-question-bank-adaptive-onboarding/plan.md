---
title: "Question Bank Adaptive Onboarding"
description: "Move onboarding diagnostic from hardcoded questions to the real question bank, with low-latency adaptive selection and atomic BKT/Elo profile seeding."
status: in_progress
priority: P1
branch: "blue"
tags: [feature, frontend, backend, database, adaptive]
blockedBy: [260701-adaptive-onboarding-diagnostic-profile-seeding]
blocks: []
created: "2026-07-01"
createdBy: "ck:plan"
source: skill
---

# Question Bank Adaptive Onboarding

## Overview

Replace the current MVP onboarding diagnostic bank with `app.questions` as the source of truth.

Current state:
- Frontend imports hardcoded `ONBOARDING_QUESTIONS` from `frontend/lib/onboarding/onboarding-questions.ts`.
- Backend grades against hardcoded `DIAGNOSTIC_QUESTION_BANK` in `src/api/onboarding_routes.py`.
- Existing DB already has `app.questions`, `app.question_concepts`, `difficulty_elo`, `answer_key`, and `app.complete_onboarding_diagnostic`.
- Existing adaptive service already has patterns for fetching published questions and updating question Elo.

Target:
- Ask 2 non-ability onboarding questions.
- Ask 5 required ability diagnostic questions from question bank.
- Offer optional continue up to 8 diagnostic questions.
- Commit initial profile only after completion: `onboarding_profiles`, BKT mastery, student Elo, and question Elo calibration/audit.
- Treat diagnostic BKT posterior as the learner's initial `P(L0)` seed for later adaptive learning, not as ordinary practice progress.

## Architecture Decision

Use a backend-owned diagnostic session. Do not let the client choose question order or send correctness.

```text
UI context answers
  -> POST /api/v1/onboarding/diagnostic/start
  -> backend loads eligible app.questions pool, returns first public question
  -> POST /api/v1/onboarding/diagnostic/answer
  -> backend grades via app.questions.answer_key, updates draft posterior, returns feedback + next item
  -> POST /api/v1/onboarding/complete
  -> backend atomically writes profile, mastery seed, audit events, and question Elo updates
```

Latency rule:
- Query/candidate selection runs server-side.
- Per session, cache candidate IDs and public question payloads in `app.onboarding_diagnostic_sessions` or signed server state.
- Each answer roundtrip should require one grade/update query plus one next-question lookup, not a full bank scan.

## Cross-Plan Dependencies

| Relationship | Plan | Reason |
| --- | --- | --- |
| Blocked by / supersedes part | `260701-adaptive-onboarding-diagnostic-profile-seeding` | That MVP created the current hardcoded-bank implementation and completion RPC. This plan replaces only the diagnostic source/flow, reusing profile seeding work. |

## Research Summary

- BKT estimates probability that a learner knows a skill and updates that probability from performance evidence. For onboarding, the diagnostic posterior is the best available initial prior for future work.
- CAT/IRT practice chooses items from a running ability estimate, with content balancing and exposure controls; we can approximate this with Elo difficulty bands plus concept coverage.
- Educational Elo models are practical for online systems because students and questions can be updated continuously; multi-concept questions need explicit concept weights or a Q-matrix.

Sources:
- Corbett & Anderson, "Knowledge tracing: Modeling the acquisition of procedural knowledge" - https://act-r.psy.cmu.edu/wordpress/wp-content/uploads/2012/12/893CorbettAnderson1995.pdf
- CAT item selection review - https://pmc.ncbi.nlm.nih.gov/articles/PMC5968224/
- Multivariate Elo learner model - https://files.eric.ed.gov/fulltext/ED599177.pdf
- Multi-concept Elo discussion - https://arxiv.org/html/2403.07908v1

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Question bank contract](./phase-01-question-bank-contract.md) | Completed |
| 2 | [Backend adaptive session](./phase-02-backend-adaptive-session.md) | Completed |
| 3 | [Frontend question-bank onboarding](./phase-03-frontend-question-bank-onboarding.md) | Completed |
| 4 | [Validation and rollout](./phase-04-validation-and-rollout.md) | In Progress |

## Dependencies

- `app.questions.answer_key` must contain deterministic MCQ answer data.
- Diagnostic-eligible items must have a course, concept mapping, difficulty Elo, and published/calibration status.
- Existing `app.complete_onboarding_diagnostic` must be updated so it can trust only server-graded diagnostic state.
- Existing frontend onboarding UI stays visually aligned with the current app shell; no landing-page flow.

## Acceptance Criteria

- No hardcoded diagnostic question text remains in frontend or backend runtime code.
- Onboarding uses real `app.questions` IDs and stores them in profile diagnostic answers.
- Client never sends `correct`; backend derives correctness from `answer_key`.
- Required diagnostic stops at 5 answers; optional continue allows up to 8.
- Completion writes:
  - onboarding survey/profile,
  - diagnostic answer evidence,
  - `student_concept_mastery.elo_score`,
  - `student_concept_mastery.bkt_mastery_probability`,
  - `audit.mastery_events` with `source_type = diagnostic`,
  - question Elo update or calibration event for answered questions.
- If the question bank has too few eligible items, API returns an actionable 503/422 with a clear operator message, not fake fallback questions.
- Focused backend tests, frontend lint, and browser onboarding check pass.

## Not In Scope

- AI grading for short-answer onboarding questions.
- Full IRT parameter estimation.
- A mentor authoring UI for diagnostic metadata.
- Long personality survey beyond the 2 context questions.

## Red Team Review

- Risk: question bank lacks enough items per concept/difficulty. Mitigation: add a migration/seed validator and fail loudly before rollout.
- Risk: latency spikes if every answer scans all questions. Mitigation: session candidate cache and indexed filters on `course_id`, `calibration_status`, `difficulty_elo`, and concept mapping.
- Risk: diagnostic attempts inflate normal practice `attempt_count`. Mitigation: store diagnostic evidence separately and seed mastery as `P(L0)` baseline; do not count as regular learning attempts unless product intentionally wants that.
- Risk: frontend can tamper with selected question IDs. Mitigation: session nonce/ID plus server-side allowed question set and answered-ID tracking.

## Validation Log

- Verified existing question schema: `db/supabase/migrations/20260611_initial_schema.sql` defines `app.questions`.
- Verified multi-concept mapping exists: `db/supabase/migrations/20260623_question_multiple_concepts.sql`.
- Verified current hardcoded backend bank: `src/api/onboarding_routes.py`.
- Verified current hardcoded frontend bank: `frontend/lib/onboarding/onboarding-questions.ts`.
- Verified existing completion RPC: `db/supabase/migrations/20260630185421_onboarding_diagnostic_mastery_seed.sql`.
- Implemented DB-backed diagnostic session endpoints in `src/api/onboarding_routes.py`.
- Added migration `db/supabase/migrations/20260630194726_onboarding_diagnostic_question_bank_sessions.sql`.
- Removed frontend hardcoded question bank file `frontend/lib/onboarding/onboarding-questions.ts`.
- Validation on 2026-07-01:
  - `uv run ruff format src\api\onboarding_routes.py tests\test_api\test_onboarding.py`
  - `uv run ruff check --fix src\api\onboarding_routes.py tests\test_api\test_onboarding.py`
  - `uv run pytest tests\test_api\test_onboarding.py` passed 6 tests.
  - `pnpm exec eslint components/onboarding/onboarding-page.tsx lib/onboarding/onboarding-contract.ts lib/onboarding/onboarding-api.ts lib/onboarding/onboarding-scoring.ts`
