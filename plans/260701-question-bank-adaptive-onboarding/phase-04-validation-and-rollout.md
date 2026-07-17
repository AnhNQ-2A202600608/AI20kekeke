---
phase: 4
title: "Validation and rollout"
status: in_progress
priority: P1
dependencies: [1, 2, 3]
---

# Phase 4: Validation and rollout

## Overview

Verify data integrity, adaptive behavior, UI behavior, and migration safety before turning this into the default onboarding path.

## Requirements

- Functional: tests cover question-bank-backed diagnostic from start to completion.
- Non-functional: latency target and no full-bank scan per answer.
- Rollout: production deploy must fail safely when migrations or seed data are missing.

## Architecture

Validation layers:
- DB migration validation for question metadata and session persistence.
- Backend API tests for session, grading, replay protection, and completion.
- Frontend lint and browser smoke for onboarding.
- Manual Supabase RPC check only after migration is applied.

## Related Code Files

- Modify: `tests/test_api/test_onboarding.py`
- Create or modify: `tests/test_api/test_onboarding_question_bank.py`
- Modify: `tests/test_api/test_adaptive_real_data_latency.py` if latency guard is reused.
- Reference: `frontend/components/onboarding/onboarding-page.tsx`
- Reference: `db/supabase/migrations/*`

## Implementation Steps

1. Add backend tests:
   - starts diagnostic with eligible bank,
   - rejects no-bank case,
   - grades server-side,
   - rejects forged correctness,
   - rejects replay,
   - commits 5-answer summary,
   - optional 6-8 answers increases confidence.
2. Add DB assertions:
   - profile row exists,
   - mastery rows exist,
   - audit rows exist,
   - question Elo update/calibration event exists.
3. Add frontend validation:
   - `pnpm exec eslint ...`,
   - browser smoke on `/onboarding`,
   - mobile viewport check for no text overlap.
4. Run focused commands:
   - `uv run pytest tests/test_api/test_onboarding.py tests/test_api/test_onboarding_question_bank.py`
   - `uv run ruff format src/api/onboarding_routes.py tests/test_api/test_onboarding.py`
   - `uv run ruff check --fix src/api/onboarding_routes.py tests/test_api/test_onboarding.py`
   - `pnpm exec eslint components/onboarding/onboarding-page.tsx lib/onboarding/onboarding-contract.ts lib/onboarding/onboarding-api.ts`
5. Rollout gate:
   - migration applied,
   - seed validator passes,
   - status endpoint still bypasses non-students,
   - fallback local storage only marks `sync_pending`, never pretends DB mastery was seeded.

## Success Criteria

- [x] All focused backend tests pass.
- [x] Frontend lint passes.
- [ ] Browser smoke verifies new UI renders backend question payload.
- [x] No production path uses hardcoded onboarding diagnostic questions.
- [x] Missing DB function or missing question bank returns clear service error.

## Risk Assessment

Risk: test stubs hide real Supabase contract failures.
Mitigation: keep unit tests fast, but add one explicit integration checklist against Supabase migration/RPC before deploy.
