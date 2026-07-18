# Adaptive Onboarding Diagnostic Profile Seeding Plan

---
status: proposed
created: 2026-07-01
owner: product-engineering
scope: onboarding, adaptive diagnostics, BKT/Elo profile seeding
---

## Overview

Redesign onboarding from a fixed survey into a short adaptive diagnostic flow:

- 2 non-ability questions for learning context.
- 5 required adaptive diagnostic questions.
- Optional "continue diagnostic" path after the first 5 questions.
- Completion writes both onboarding profile and initial mastery state: per-concept Elo + BKT `P(L)` / `bkt_mastery_probability`.

This is an adaptive feature test, so prioritize measurable behavior over broad redesign.

## Phases

| Phase | Status | Goal |
| --- | --- | --- |
| 01 Research and contracts | proposed | Finalize question metadata, scoring model, and API contract. |
| 02 Backend seeding RPC | proposed | Add atomic onboarding diagnostic completion that updates `onboarding_profiles`, `student_concept_mastery`, and `audit.mastery_events`. |
| 03 Adaptive diagnostic selection | proposed | Serve next onboarding question from current posterior, Q-Matrix coverage, and difficulty target. |
| 04 UI/UX refresh | proposed | Replace fixed 6+8 flow with compact 2+5 adaptive diagnostic and tactile app UI. |
| 05 Verification | proposed | Add backend tests, frontend interaction tests, and browser visual checks. |

## Dependencies

- Superseded for question source by [Question Bank Adaptive Onboarding](../260701-question-bank-adaptive-onboarding/plan.md). Keep this plan's UI and profile-seeding work, but replace hardcoded diagnostic question banks with `app.questions`.
- Existing `app.student_concept_mastery` stores `elo_score` and `bkt_mastery_probability`.
- Existing `audit.mastery_events.source_type` already supports `diagnostic`.
- Existing `app.questions.difficulty_elo` can be reused for diagnostic Elo if onboarding uses real question IDs.
- If diagnostic items need Bloom/Q-Matrix metadata, add metadata either to `answer_key`/question JSON for MVP or a normalized mapping table later.

## Acceptance Criteria

- Student answers exactly 2 context questions before diagnostic.
- Student answers 5 diagnostic questions before profile creation is allowed.
- After 5 diagnostic answers, UI shows encouraging summary and offers:
  - start learning
  - continue diagnostic
- Completing onboarding persists:
  - `onboarding_profiles.survey`
  - `onboarding_profiles.diagnostic_answers`
  - `onboarding_profiles.summary`
  - per-concept `student_concept_mastery.elo_score`
  - per-concept `student_concept_mastery.bkt_mastery_probability`
  - `audit.mastery_events` rows with `source_type = 'diagnostic'`
- No client-supplied mastery values are trusted. Backend derives Elo/BKT from server-known item metadata and correctness.
- Tests cover valid completion, duplicate question rejection, non-student bypass, invalid concept/question, and mastery seed write.

## Reports

- [Research report](reports/adaptive-onboarding-diagnostic-profile-seeding-research.md)
