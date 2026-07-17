# Admin Adaptive Dashboard Plan

Status: implemented
Date: 2026-06-30

## Problem

EduGap currently has adaptive metrics in backend logs and scattered UI, but no dedicated admin-only view for inspecting why a quiz question was selected and how Elo/BKT changed during a session. Learner-facing UI also risks confusing students by exposing "Elo" as if it were a global ability score.

## Decision

Build two surfaces:

1. Admin-only adaptive diagnostics popup launched from a small quiz button.
2. Student-facing small circular info trigger explaining question difficulty in simple language.

Do not expose global Elo to learners. Treat Elo as internal concept/question calibration data.

## Research Summary

Open learner model and learning analytics research supports transparency when it helps learners act, but warns against overwhelming learners with model internals. Student-facing dashboards should provide actionable explanations, while teacher/admin dashboards can show more detailed analytics.

Sources reviewed:

- Open learner model transparency research.
- Explainable AI in education research.
- Student-facing learning analytics dashboard studies.
- Intelligent tutoring system learner-model literature.

Implication for EduGap:

- Student: explain "why this question" in normal language.
- Admin: expose raw concept Elo, question Elo, BKT, expected success, deltas, and recommendation trace.

## Scope

### In Scope

- Add admin-only dashboard visible only for role `admin`.
- Dashboard appears during adaptive quiz/session inspection.
- Display current concept Elo.
- Display current question Elo/difficulty.
- Display BKT mastery probability and state.
- Display expected success.
- Display Elo/BKT deltas after submit.
- Display session history of question attempts and Elo/BKT transitions.
- Display next recommended question when available or currently being prefetched.
- Add student-facing circular info dot near the challenge/difficulty label.
- Info dot explains in plain Vietnamese why the question was chosen.

### Out of Scope

- No new global user Elo.
- No leaderboard changes.
- No BKT parameter fitting.
- No new recommendation algorithm.
- No mentor dashboard unless later requested.
- No raw formula exposure to students.

## UX Requirements

### Admin Dashboard Popup

Location:

- Preferred: small icon button in the quiz header/action area, visible only when `role === 'admin'`.
- On click, open a floating popover or modal overlay without leaving quiz.
- Designed for live demo: readable, compact, and dismissible.

Button:

- Use an icon such as `Activity`, `Gauge`, `ChartSpline`, or `Bug`.
- Label hidden on small screens, tooltip: `Adaptive diagnostics`.
- Do not show to students/mentors.

Popup layout:

- Desktop: anchored popover from button, max width around `520-640px`, max height `70dvh`, scrollable.
- Mobile/small viewport: bottom sheet/modal.
- Must not reset quiz state, change selected answer, or trigger additional recommend calls.

Popup sections:

1. Current recommendation
   - Concept name/id.
   - Question id.
   - Decision id.
   - Question difficulty Elo.
   - Expected success.
   - Candidate count.

2. Learner model
   - Concept Elo before/after.
   - BKT before/after.
   - Mastery state.
   - Weakness flag.

3. Session timeline
   - Question number.
   - Question id.
   - Correct/incorrect.
   - Old Elo -> new Elo.
   - Old BKT -> new BKT.
   - Hints used.
   - AI help detected.

4. Next recommendation
   - Pending/loading state.
   - Next question id if prefetched.
   - Expected success if available.
- Reason unavailable if no candidate.

Demo ergonomics:

- Keep top summary visible:
  - `Concept Elo`
  - `Question Elo`
  - `BKT`
  - `Expected success`
- Use compact row/table for history.
- Show raw IDs in collapsible/details rows so demo view is not noisy.
- Include a refresh-free live update: data comes from current React state, not a new polling call.

### Student Info Dot

Small circle icon near difficulty/challenge label.

Copy style:

```text
Hệ thống chọn câu này vì nó đang vừa sức với phần bạn đang luyện.
Nếu bạn làm đúng, bài sau có thể khó hơn một chút.
Nếu bạn gặp khó, hệ thống sẽ chọn câu củng cố nền tảng hơn.
```

Avoid:

- Elo
- BKT
- probability
- bandit
- expected success
- model

## Data Requirements

Frontend already has:

- `currentQuestion.adaptive.questionId`
- `currentQuestion.adaptive.decisionId`
- `currentQuestion.adaptive.conceptId`
- `recommendation.expected_success`
- `currentHistory.submitResult.old_elo`
- `currentHistory.submitResult.new_elo`
- `currentHistory.submitResult.old_bkt`
- `currentHistory.submitResult.new_bkt`
- `activePracticeQuestions`
- `answersHistory`
- `activePracticeSession`
- `role`

Likely additions:

- Preserve question difficulty Elo in recommendation response.
- Preserve candidate count in recommendation response for admin diagnostics.
- Preserve prefetched next question metadata for "next recommendation" display.

## Backend API Plan

### Recommend Response

Add optional admin/debug fields:

```json
{
  "question_difficulty_elo": 1230,
  "candidate_count": 10,
  "concept_elo": 1037,
  "bkt_mastery_probability": 0.41
}
```

Security:

- Either return these only when authenticated role is `admin`, or include only fields already visible enough for normal quiz while hiding dashboard UI from non-admin.
- Preferred: role-gate sensitive diagnostic fields on backend too.

### Submit Response

Existing submit response is mostly sufficient:

- `old_elo`
- `new_elo`
- `old_bkt`
- `new_bkt`
- `mastery_state`
- `weakness_flag`
- `bandit_reward`
- `stability_days`

Optional additions:

- `question_difficulty_elo`
- `expected_success`
- `hint_count`
- `used_ai_help`

## Frontend Plan

### Files Likely Touched

- `frontend/components/quiz/quiz-question-view.tsx`
- `frontend/app/hooks/useQuizSession.ts`
- `frontend/lib/adaptive/api-client.ts`
- `frontend/lib/adaptive/quiz-question.ts`
- `src/models/adaptive_schemas.py`
- `src/api/adaptive_routes.py`
- tests under `tests/test_api/test_adaptive.py`

### New Components

Preferred:

- `frontend/components/quiz/adaptive-admin-dashboard.tsx`
- `frontend/components/quiz/adaptive-admin-dashboard-button.tsx`
- `frontend/components/quiz/adaptive-challenge-info.tsx`

### State Shape

Use existing `answersHistory` as the session timeline source.

For current/prefetched recommendations, store diagnostic metadata in:

- `Question.adaptive`
- or a small `adaptiveDiagnosticsByQuestionId` map inside `useQuizSession`.

Keep it simple: extend `Question.adaptive` first unless it becomes noisy.

## Access Control

Admin dashboard button and popup render only when:

```ts
role === 'admin'
```

Backend debug fields should also be protected by authenticated role where practical.

Student info dot renders for all students, but contains only simple explanation.

## Validation

Backend:

- Test recommend returns debug fields for admin.
- Test non-admin does not receive restricted diagnostics if backend gates fields.
- Test submit still returns old/new Elo and BKT.

Frontend:

- Lint.
- Verify admin sees dashboard.
- Verify admin opens/closes popup without losing quiz progress.
- Verify student does not see dashboard.
- Verify student sees info dot.
- Verify timeline updates after submit.
- Verify next recommendation loading/prefetched state does not trigger duplicate recommend calls.

Manual:

- Start adaptive quiz as admin.
- Submit one answer.
- Confirm timeline shows old/new Elo and BKT.
- Confirm next question panel updates.
- Start as student.
- Confirm no admin dashboard.
- Confirm plain-language info dot works.

## Risks

- Exposing internal numbers to students can reduce trust or confuse them. Keep raw metrics admin-only.
- Backend role-gating debug fields may require schema changes because current response model is shared.
- Current frontend concept mastery mapping has known setId/conceptId mismatch risk. Fixing the dashboard may surface that bug; do not paper over it with fake global Elo.
- Prefetch data may race with current question state. Use existing prefetch refs carefully.

## Acceptance Criteria

- [x] Admin role sees adaptive dashboard during quiz.
- [x] Student role never sees raw concept Elo/question Elo/BKT/expected success dashboard.
- [x] Student sees one small circle info affordance near challenge/difficulty.
- [x] Tooltip copy explains adaptive selection without technical terms.
- [x] Dashboard timeline shows every submitted adaptive question in the current session.
- [x] No global Elo appears in the top nav as part of this feature path.
- [x] Tests/lint pass for touched backend/frontend files.

## Implementation Notes

- Added admin/dev-only optional diagnostics to `/api/v1/adaptive/recommend`.
- Added quiz-header adaptive diagnostics popup backed by current React state, not polling.
- Added plain-language adaptive info dot next to the quiz difficulty label.
- Fixed quiz header Elo fallback to prefer adaptive concept metadata/latest submit result over `activeSetId`.
- Replaced top-nav learner-facing `Elo` display with `Độ vững`.

## Validation

- `uv run ruff check src/api/adaptive_routes.py src/models/adaptive_schemas.py tests/test_api/test_adaptive.py`
- `uv run pytest tests/test_api/test_adaptive.py`
- `pnpm lint` in `frontend/`
