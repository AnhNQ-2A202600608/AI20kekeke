---
title: "Adaptive-first Frontend Quiz Migration"
description: "Migrate the main frontend quiz from static local scoring to a 10-question backend-selected adaptive sequence using /adaptive/recommend and /adaptive/submit as the source of truth."
status: completed
priority: P1
branch: "dev"
tags: [feature, frontend, adaptive, quiz, api]
blockedBy: [260629-1434-mobile-first-quiz-focus-mode]
blocks: []
created: "2026-06-29"
createdBy: "ck:plan"
source: skill
---

# Adaptive-first Frontend Quiz Migration

## Overview

Migrate the primary practice quiz to **adaptive-first** behavior: each practice session is a sequence of backend recommendations, each answer is submitted through the backend, and the frontend renders Elo/BKT deltas from the submit response instead of calculating mastery locally.

Decision already made: choose **Adaptive-first** over fixed quiz-first. Fixed JSON quiz files remain fallback/demo content only.

## Scope Challenge

- Existing code: backend `/api/v1/adaptive/recommend` and `/api/v1/adaptive/submit` already implement `decision_id`, server-side grading, replay protection, and `old_elo/new_elo/old_bkt/new_bkt` response data. `ZpdWidget` already calls both endpoints from frontend.
- Minimum changes: extract an adaptive API client, extend practice session state with per-question adaptive metadata, migrate `useQuizSession` answer flow, remove local mastery writes from quiz path, then update UI displays.
- Complexity: expected 6-8 frontend files plus focused tests/typecheck. No new backend feature unless Phase 1 confirms repeated recommendations cannot be avoided without an API exclude list.
- Selected mode: HOLD SCOPE. Do frontend migration first. Treat backend gaps as explicit follow-up, not hidden scope creep.

## Research Summary

Detailed research: [Research Summary](./reports/research-summary.md).

Recommended approach: **Hybrid adapter migration**.

| Approach | Summary | Pros | Cons | Decision |
| --- | --- | --- | --- | --- |
| A. Direct rewrite inside `useQuizSession` | Put recommend/submit fetches directly in the hook. | Fastest first patch. | Keeps hook too large, duplicates `ZpdWidget` auth/request shape, harder to test. | Reject. |
| B. Shared adaptive client + session model | Add a small frontend adaptive API client and store adaptive metadata in practice session. | Reuses backend contract, keeps UI dumb, testable, minimal new abstraction. | Requires careful migration of existing local session shape. | Choose. |
| C. Backend-driven quiz session endpoint | Add backend endpoint that owns the whole 10-question session. | Strongest long-term consistency. | Backend scope expansion; not needed because recommend/submit already exist. | Defer. |

## Product Contract

- Starting practice for a concept calls `/api/v1/adaptive/recommend`.
- Active session stores `decision_id`, `question_id`, `concept_id`, `started_at`, response time start, and backend submit result for each answered item.
- Answer submit calls `/api/v1/adaptive/submit`.
- Frontend reads `old_elo`, `new_elo`, `old_bkt`, `new_bkt`, `mastery_state`, and `weakness_flag` from backend response.
- After submit, frontend requests the next recommendation until 10 answered questions or user exits.
- `frontend/public/quizzes/**/*.json` remains fallback/demo/study content. Main logged-in practice must not call `/adaptive/sync-mastery`.

## Non-Goals

- Do not change Elo/BKT/Bandit formulas in frontend.
- Do not update database migrations.
- Do not redesign the quiz UI beyond states needed to show backend-powered feedback.
- Do not remove local JSON content; keep it useful for offline/demo/read-only fallback.
- Do not make fixed quiz-first decision trace endpoints.

## Cross-Plan Dependencies

| Relationship | Plan | Status | Note |
| --- | --- | --- | --- |
| Blocked by | `plans/260629-1434-mobile-first-quiz-focus-mode/` | pending | Both touch `useQuizSession`, `QuizQuestionView`, and feedback displays. Mobile hierarchy should be stabilized before backend-powered feedback migration. |
| Builds on | `plans/260629-1232-mobile-quiz-ui-stabilization/` | completed | Viewport/clipping fixes are already complete and provide the baseline for the mobile-first focus-mode plan. |
| Related | `plans/260620-1700-socratic-adaptive-fallback/` | planned | Fallback/skip UI must not silently update mastery; this plan preserves backend as source of truth. |
| Related | `plans/20260624-0115-socratic-interactive-agent-implementation/` | in-progress | AI hint/help state must remain compatible with quiz submissions and `used_ai_help` semantics. |
| Related | `plans/20260621-1217-elo-system-calibration-plan/` | pending review | UI should display backend Elo only; calibration remains backend concern. |

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Research and Contract Audit](./phase-01-research-and-contract-audit.md) | Completed |
| 2 | [Adaptive Client and Session Model](./phase-02-adaptive-client-and-session-model.md) | Completed |
| 3 | [Quiz Flow Migration](./phase-03-quiz-flow-migration.md) | Completed |
| 4 | [UI Feedback and Fallback Cleanup](./phase-04-ui-feedback-and-fallback-cleanup.md) | Completed |
| 5 | [Verification and Handoff](./phase-05-verification-and-handoff.md) | Completed |

## Dependencies

- Validated decisions:
  - Duplicate backend recommendations are accepted in this MVP; no retry or backend `exclude_question_ids` work in this plan.
  - Adaptive main quiz migrates MCQ first. Numeric and short-answer stay in static-demo until their payload/UI path is separately verified.
  - Missing `conceptId` or offline backend falls back to local JSON demo with a visible non-persistent mastery label.
- Backend contract:
  - `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/api/adaptive_routes.py`
  - `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/models/adaptive_schemas.py`
  - `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/tests/test_api/test_adaptive.py`
- Frontend integration points:
  - `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/hooks/useQuizSession.ts`
  - `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/stores/createPracticeSlice.ts`
  - `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/lib/quiz/types.ts`
  - `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/quiz-question-view.tsx`
  - `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/quiz-results.tsx`
  - `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/ZpdWidget.tsx`

## Acceptance Criteria

- [x] Main logged-in practice starts with backend `/api/v1/adaptive/recommend`.
- [x] Each answered question submits through `/api/v1/adaptive/submit` exactly once per `decision_id`.
- [x] Quiz UI displays backend Elo/BKT deltas; no quiz-main path calls `calculatePracticeEloProgression` or local BKT update for mastery.
- [x] `/adaptive/sync-mastery` is not called by normal quiz submit.
- [x] Quiz stops after 10 backend-selected MCQ recommendations or user exit.
- [x] Offline/demo fallback is clearly separated and cannot masquerade as persisted mastery.
- [x] Replay/wrong-question submit errors produce recoverable UI states.
- [x] Frontend lint/type/build pass.

## Implementation Log

### Session 2 - 2026-06-29

- Added shared frontend adaptive API client at `frontend/lib/adaptive/api-client.ts`.
- Extended practice session/question types with adaptive decision metadata and backend submit result snapshots.
- Migrated main quiz start/answer/next flow to recommend -> submit -> recommend until 10 MCQ attempts.
- Removed normal quiz submit `/adaptive/sync-mastery` write path and local Elo/BKT mastery mutation.
- Updated question/results UI to display backend Elo/BKT deltas and demo fallback errors.
- Updated `ZpdWidget` to use the shared adaptive client.
- Verification passed:
  - `pnpm --dir .\frontend exec tsc --noEmit`
  - `pnpm --dir .\frontend lint`
  - `pnpm --dir .\frontend build`
- Build warnings observed but not introduced by this scope:
  - Next.js `middleware` convention deprecation.
  - Turbopack NFT trace warning from `next.config.ts` via `app/api/guidebook/[slug]/route.ts`.

## Cook Handoff

```bash
/ck:cook D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\plans\260629-1245-adaptive-first-frontend-quiz\plan.md --tdd
```

## Validation Log

### Session 1 - 2026-06-29

**Trigger:** User requested `/ck:plan validate D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\plans\260629-1245-adaptive-first-frontend-quiz\plan.md`.
**Questions asked:** 3

#### Verification Results

- **Tier:** Full
- **Claims checked:** 31
- **Verified:** 30 | **Failed:** 0 | **Unverified:** 1

Evidence checked:

- Backend endpoints exist: `src/api/adaptive_routes.py` has `@router.post("/recommend")`, `@router.post("/submit")`, and `@router.post("/sync-mastery")`.
- Backend schemas exist: `src/models/adaptive_schemas.py` defines `RecommendRequest`, `RecommendResponse`, `SubmitRequest`, and `SubmitResponse` with `decision_id`, `question_id`, `old_elo`, `new_elo`, `old_bkt`, and `new_bkt`.
- Current frontend API pattern exists: `frontend/components/dashboard/ZpdWidget.tsx` calls `/api/v1/adaptive/recommend` and `/api/v1/adaptive/submit` with `Authorization: Bearer`.
- Current local-scoring risk exists: `frontend/stores/createPracticeSlice.ts` imports local scoring helpers and calls `/api/v1/adaptive/sync-mastery`.
- Current quiz UI imports local progression: `frontend/components/quiz/quiz-question-view.tsx` and `frontend/components/quiz/quiz-results.tsx` import `calculatePracticeEloProgression`.
- BFF proxy exists: `frontend/app/api/v1/[...path]/route.ts` forwards `/api/v1/*` to backend.

Unverified:

- Backend duplicate avoidance is not present in the current recommend request. No `exclude_question_ids` contract exists. User chose to accept duplicates in MVP.

#### Questions & Answers

1. **[Scope/Risk]** If backend recommend returns a duplicate question in the 10-question sequence, how should implementation handle it?
   - Options: Frontend retry (Recommended) | Backend exclude now | Accept duplicates
   - **Answer:** Accept duplicates
   - **Rationale:** Keeps this plan frontend-only and avoids expanding backend contract. UX may repeat questions when candidate pools are small.

2. **[Scope/Contract]** Which question types should adaptive main quiz support in the first migration?
   - Options: MCQ first (Recommended) | All supported types | MCQ only permanently
   - **Answer:** MCQ first
   - **Rationale:** Backend supports multiple types, but current frontend non-MCQ UI and payload mapping carry extra risk. MCQ-first delivers adaptive source-of-truth faster.

3. **[Fallback/Product]** What should frontend do when `conceptId` is missing or backend is offline?
   - Options: Demo fallback (Recommended) | Block practice | Silent local mode
   - **Answer:** Demo fallback
   - **Rationale:** Preserves local learning/demo content while preventing false persisted mastery claims.

#### Confirmed Decisions

- Duplicate question handling: accept duplicates for MVP; do not add retry or backend exclude support in this plan.
- Question type scope: adaptive main quiz is MCQ-first.
- Fallback behavior: local JSON fallback remains available but must be clearly non-persistent.

#### Action Items

- [ ] Remove duplicate retry/backend exclude requirements from phase files.
- [ ] Make MCQ-first scope explicit in product contract and Phase 3.
- [ ] Keep fallback label and no-mastery-update rule in Phase 4.

#### Impact on Phases

- Phase 1: backend gap becomes documented accepted MVP limitation, not a blocker.
- Phase 3: remove duplicate retry step and restrict adaptive submit migration to MCQ first.
- Phase 4: preserve demo fallback label and static-mode non-persistence.

### Whole-Plan Consistency Sweep

- Files reread: `plan.md`, `phase-01-research-and-contract-audit.md`, `phase-02-adaptive-client-and-session-model.md`, `phase-03-quiz-flow-migration.md`, `phase-04-ui-feedback-and-fallback-cleanup.md`, `phase-05-verification-and-handoff.md`.
- Decision deltas checked: 3.
- Reconciled stale references: 4.
- Unresolved contradictions: 0.
