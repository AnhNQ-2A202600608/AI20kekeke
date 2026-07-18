# Mentor Quiz Error Cases Design

Date: 2026-07-01
Status: Approved for implementation planning

## Summary

Build a dedicated mentor tab named `Bao loi quiz` for reviewing quiz questions that students report as incorrect, unclear, or mismatched with the expected knowledge. Student reporting keeps the existing quiz-side `Bao loi` entry point, but backend storage changes from a flat audit log into a case workflow that mentors can triage and resolve.

The first version uses a separate case model:

- One case per reported question per course while the case is open.
- Multiple student reports are grouped inside that case.
- Mentor edits the question directly inside the new tab.
- Case workflow is `Moi` -> `Dang sua` -> `Da xu ly` or `Tu choi`.

## Goals

- Give mentors a focused inbox for quiz content errors.
- Avoid duplicate work when multiple students report the same question.
- Let mentors inspect reports, edit the question, and close the case in one place.
- Preserve existing student quiz UI behavior as much as possible.
- Keep visual style consistent with the current mentor dashboard and `QuizEditorTab`.

## Non-Goals

- No multi-mentor assignment workflow beyond a nullable `assigned_to` field.
- No notification delivery system in the first version.
- No AI auto-correction of quiz content.
- No full audit diff viewer in the first version, though timestamps and resolution notes are stored.
- No replacement of the existing `feedback_events` audit table.

## Current Context

Student quiz reporting already exists in the frontend at `QuizQuestionView`. It calls `POST /api/v1/quiz/report` with question id, question text, selected option, error type, detail, student id, and course id.

The backend route currently writes a local JSONL file and inserts an `app.feedback_events` row with `target_type = question` and `feedback_type = incorrect`.

Mentor tooling already includes `QuizEditorTab`, which provides a dashboard-styled question editor using project UI conventions: `font-be-vietnam-pro`, `font-fraunces`, white bordered panels, `btn-3d` buttons, and green/amber/rose status accents.

## Data Model

### `app.quiz_error_case_status`

Add an enum:

- `new`
- `in_progress`
- `resolved`
- `rejected`

### `app.quiz_error_cases`

Represents the mentor-facing case for one reported question.

Fields:

- `id uuid primary key default gen_random_uuid()`
- `course_id uuid not null references app.courses(id) on delete cascade`
- `question_id uuid not null references app.questions(id) on delete cascade`
- `status app.quiz_error_case_status not null default 'new'`
- `report_count integer not null default 0`
- `last_reported_at timestamptz not null default now()`
- `assigned_to uuid references app.users(id) on delete set null`
- `resolved_by uuid references app.users(id) on delete set null`
- `resolved_at timestamptz`
- `resolution_note text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:

- `(course_id, status, last_reported_at desc)`
- `(question_id, status)`
- Unique partial index for open cases: one open case per `(course_id, question_id)` where status is `new` or `in_progress`.

### `app.quiz_error_reports`

Represents each individual student report.

Fields:

- `id uuid primary key default gen_random_uuid()`
- `case_id uuid not null references app.quiz_error_cases(id) on delete cascade`
- `student_id uuid not null references app.users(id) on delete cascade`
- `course_id uuid not null references app.courses(id) on delete cascade`
- `question_id uuid not null references app.questions(id) on delete cascade`
- `selected_option text`
- `error_type text not null`
- `detail text not null`
- `question_snapshot jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`

Indexes:

- `(case_id, created_at desc)`
- `(student_id, created_at desc)`
- `(course_id, question_id, created_at desc)`

## Backend Flow

### Student Report Submission

Endpoint: `POST /quiz/report`

Behavior:

1. Authenticate the current user when possible.
2. Overwrite `student_id` from the token for student users to prevent spoofing.
3. Validate `question_id`, `course_id`, `error_type`, and `detail`.
4. Find an existing open case for `(course_id, question_id)`.
5. If no open case exists, create `quiz_error_cases` with status `new`.
6. Insert one `quiz_error_reports` row with the student report and a snapshot of the question text/options/answer/explanation at report time.
7. Increment `report_count`, update `last_reported_at`, and update `updated_at`.
8. Keep writing `feedback_events` for backward-compatible audit.
9. Return a success message compatible with the current frontend.

### Mentor Case List

Endpoint: `GET /quiz/error-cases`

Allowed roles: `mentor`, `admin`, `dev`.

Query params:

- `status`
- `course_id`
- `search`
- `error_type`
- `limit`
- `offset`

Response includes:

- Case fields.
- Question summary: prompt, options, answer, explanation, difficulty, source metadata when available.
- Aggregates: report count, latest report time, most common error type.

### Mentor Case Detail

Endpoint: `GET /quiz/error-cases/{case_id}`

Allowed roles: `mentor`, `admin`, `dev`.

Response includes:

- Case.
- Current question data.
- All child reports, newest first.
- Student display names if available.

### Mentor Status Update

Endpoint: `PATCH /quiz/error-cases/{case_id}/status`

Allowed roles: `mentor`, `admin`, `dev`.

Valid transitions:

- `new` -> `in_progress`
- `in_progress` -> `resolved`
- `in_progress` -> `rejected`
- `new` -> `rejected`

`resolved` and `rejected` require `resolution_note`.

### Mentor Question Update

Endpoint: `PATCH /quiz/error-cases/{case_id}/question`

Allowed roles: `mentor`, `admin`, `dev`.

Updates:

- Question text.
- Options A/B/C/D.
- Correct answer.
- Explanation.
- Difficulty if supported by the existing question model.
- Socratic hints only if an existing backend write path for `question_hints` is available during implementation.

This endpoint does not automatically close the case. Mentor should explicitly click `Dong la da xu ly`.

## Frontend Design

### Navigation

Add a new mentor tab:

- Tab id: `quiz-error-cases`
- Name: `Bao loi quiz`
- Short name: `Bao loi`
- Icon: `AlertTriangle` or `Flag`

The tab appears for mentor, teacher, admin, and dev personas through the same role-based navigation mechanism used by existing mentor tabs.

### Layout

Use a two-column operational layout, matching `QuizEditorTab` density and style.

Left column:

- Header: `Hop thu bao loi quiz`
- Compact stats: `Moi`, `Dang sua`, `Da xu ly`, `Tu choi`
- Filters:
  - Status tabs.
  - Search by question text.
  - Error type dropdown.
- Grouped case list:
  - Question preview.
  - Report count badge.
  - Latest report time.
  - Status chip.
  - Most common error type.

Right column:

- Case header:
  - Status chip.
  - Report count.
  - Last reported time.
  - Current workflow action.
- Report insight panel:
  - Error type summary.
  - Student comments.
  - Selected options from reports when available.
- Inline question editor:
  - Question text.
  - Options A/B/C/D.
  - Correct answer radio.
  - Explanation.
  - Hints section is shown read-only or disabled unless a backend write path already exists.
- Action bar:
  - `Bat dau sua`
  - `Luu thay doi`
  - `Dong la da xu ly`
  - `Tu choi bao loi`
  - `Bo qua`

### Empty and Loading States

- Loading: skeleton cards in left list and editor panel.
- Empty `Moi`: calm success message that no new reported quiz cases are waiting.
- Empty search: show a focused no-results state.
- Error: show a recoverable message and retry button.

### Visual Style

Follow current project style:

- `font-be-vietnam-pro` for operational UI.
- `font-fraunces` for major headings.
- White panels with `border-2 border-gray-border`.
- Existing `btn-3d` button classes.
- Status colors:
  - `new`: amber.
  - `in_progress`: blue or primary green.
  - `resolved`: emerald.
  - `rejected`: rose.
- No new palette, no new decorative theme.

## Security and RLS

Student behavior:

- Students can create reports.
- Students should not list all reports or see mentor notes through the public API.

Mentor behavior:

- Mentor/admin/dev can list, inspect, update, resolve, and reject cases.
- Backend endpoints must enforce roles using existing `require_role`.

Database:

- Enable RLS on new tables.
- Grant required Data API permissions to `authenticated` and `service_role` if using Supabase REST.
- Prefer backend service-role access for mentor APIs, with app-level role checks.
- Avoid authorization decisions based on user-editable metadata.

## Testing Plan

Backend tests:

- Student report creates a new case.
- Second report for the same open question increments the same case and inserts a second child report.
- Closed case followed by a new report creates a new case.
- Student id is derived from auth token for student users.
- Mentor-only endpoints reject student users.
- Status transition validation works.
- Question update changes `app.questions`.

Frontend tests:

- Mentor nav includes `Bao loi quiz`.
- Case list filters by status.
- Selecting a case renders details and reports.
- `Bat dau sua` changes local status to `Dang sua`.
- Editing and saving shows success state.
- Resolving requires a note.
- Empty and loading states render cleanly.

## Rollout

1. Add DB migration with enum, tables, indexes, grants, and RLS.
2. Update `POST /quiz/report` to create grouped cases and child reports.
3. Add mentor case APIs.
4. Add frontend tab registration.
5. Build `QuizErrorCasesTab` with demo data fallback matching existing mentor demo patterns.
6. Wire live APIs when not in demo mode.
7. Run backend tests and frontend build/lint checks.

## MVP Constraint

The first implementation updates question text, options, correct answer, explanation, and supported difficulty fields. Updating Socratic hints is included only if the existing backend already exposes a safe write path for `question_hints`; otherwise the hints fields remain read-only in the new tab and hint editing becomes a follow-up task.
