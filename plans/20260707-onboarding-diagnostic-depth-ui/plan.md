---
title: "Onboarding Diagnostic Depth UI"
description: "First UI/UX slice for onboarding: selectable diagnostic depth, faster prefetch, answer review, and clearer mastery seed explanation."
status: in-progress
priority: P1
branch: "blue-uiux-onboarding-first-slice"
tags: [frontend, onboarding, adaptive, uiux]
created: "2026-07-07"
createdBy: "ck:plan --fast"
source: skill
---

# Onboarding Diagnostic Depth UI

## Scope

Implement one rollback-friendly onboarding slice before broader landing and design-token work.

## Requirements

- Add a dedicated onboarding step where learners choose 8, 15, or 20 diagnostic questions.
- Highlight 15 questions as the recommended/popular balanced option.
- Keep diagnostic prefetch fast by starting a default 15-question session once the learner has answered the first two setup questions.
- Make the backend diagnostic session respect the selected question target while preserving the old default for older clients.
- Store server feedback per diagnostic answer so the result screen can review correct/incorrect answers.
- Move the diagnostic bell control out of the heading overlay area.
- Explain the initial mastery profile with enough evidence for learners to understand why a concept is prioritized.

## Out Of Scope

- Landing page content/pricing redesign.
- Global typography token reset.
- Full onboarding visual redesign across every step.
- Build verification; use targeted tests/typecheck for this slice.

## Touchpoints

- `frontend/components/onboarding/onboarding-page.tsx`
- `frontend/lib/onboarding/onboarding-contract.ts`
- `frontend/lib/onboarding/onboarding-scoring.ts`
- `src/api/onboarding_routes.py`
- `tests/test_api/test_onboarding.py`

## Verification

- `uv run pytest tests\test_api\test_onboarding.py`
- `uv run ruff check src\api\onboarding_routes.py tests\test_api\test_onboarding.py`
- `cd frontend && pnpm exec eslint components/onboarding/onboarding-page.tsx lib/onboarding/onboarding-contract.ts lib/onboarding/onboarding-scoring.ts`
- `cd frontend && pnpm exec tsc --noEmit`
- Browser smoke on `/onboarding` with seeded client auth state for desktop/mobile render and scroll behavior.

## Follow-Up Slices

- Apply typography tokens page by page instead of globally.
- Redesign landing sections using pitch deck, usage evidence, and pricing.
- Expand onboarding result narrative and mastery visualization if user testing shows the current report is still too terse.
