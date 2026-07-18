# Mentor Quiz Error Cases Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated mentor tab for grouped student quiz error reports, allowing mentors to triage reports, edit quiz questions, and close or reject cases.

**Architecture:** Keep the existing student `POST /quiz/report` entry point, but route it through a new quiz-error-case service that groups reports into open cases. Add a focused mentor API router for listing/detail/status/question update flows, then wire a new dashboard tab and React component that follows the existing `QuizEditorTab` visual language.

**Tech Stack:** FastAPI, Pydantic, Supabase PostgREST client, PostgreSQL/RLS migrations, Next.js 16, React 19, TypeScript, Tailwind CSS, lucide-react.

---

## File Structure

- Create: `db/supabase/migrations/20260701_mentor_quiz_error_cases.sql`
  - Adds enum, case/report tables, indexes, grants, and RLS policies.
- Create: `src/services/quiz_error_cases.py`
  - Owns case grouping, report insertion, case listing/detail reads, status transition validation, and question update payload handling.
- Create: `src/api/quiz_error_routes.py`
  - Adds mentor-only endpoints under `/quiz/error-cases`.
- Modify: `src/api/routes.py`
  - Includes the new mentor router and updates the existing `/quiz/report` route to call the service while preserving JSONL and `feedback_events` audit behavior.
- Create: `tests/test_api/test_quiz_error_cases.py`
  - Covers case grouping, closed-case reopen behavior, mentor route authorization, status transitions, and question updates.
- Create: `frontend/lib/mentor/quiz-error-cases.ts`
  - Defines frontend API types and fetch helpers.
- Create: `frontend/components/dashboard/mentor/quiz-error-cases-tab.tsx`
  - Implements the mentor tab UI with demo fallback and live API mode.
- Modify: `frontend/components/dashboard/mentor/index.ts`
  - Exports the new tab component.
- Modify: `frontend/lib/dashboard-tabs.ts`
  - Adds the `quiz-error-cases` tab and mentor nav item.
- Modify: `frontend/app/components/dashboard-layout.tsx`
  - Renders `QuizErrorCasesTab` for the new tab id.
- Modify: `frontend/components/quiz/quiz-question-view.tsx`
  - Keeps the same report UX, but updates success copy to mention mentor review.

---

## Task 1: Add Supabase Schema for Quiz Error Cases

**Files:**
- Create: `db/supabase/migrations/20260701_mentor_quiz_error_cases.sql`

- [ ] **Step 1: Write the migration**

Create `db/supabase/migrations/20260701_mentor_quiz_error_cases.sql`:

```sql
-- ============================================================================
-- ai20kekeke | Mentor Quiz Error Cases
-- Target: Supabase PostgreSQL
-- Re-run safe: YES
-- ============================================================================

BEGIN;

-- Mentor-facing workflow for student quiz error reports.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'app'
          AND t.typname = 'quiz_error_case_status'
    ) THEN
        CREATE TYPE app.quiz_error_case_status AS ENUM (
            'new',
            'in_progress',
            'resolved',
            'rejected'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS app.quiz_error_cases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id uuid NOT NULL REFERENCES app.courses(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES app.questions(id) ON DELETE CASCADE,
    status app.quiz_error_case_status NOT NULL DEFAULT 'new',
    report_count integer NOT NULL DEFAULT 0 CHECK (report_count >= 0),
    last_reported_at timestamptz NOT NULL DEFAULT now(),
    assigned_to uuid REFERENCES app.users(id) ON DELETE SET NULL,
    resolved_by uuid REFERENCES app.users(id) ON DELETE SET NULL,
    resolved_at timestamptz,
    resolution_note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.quiz_error_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id uuid NOT NULL REFERENCES app.quiz_error_cases(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    course_id uuid NOT NULL REFERENCES app.courses(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES app.questions(id) ON DELETE CASCADE,
    selected_option text,
    error_type text NOT NULL,
    detail text NOT NULL,
    question_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_error_cases_course_status
    ON app.quiz_error_cases (course_id, status, last_reported_at DESC);

CREATE INDEX IF NOT EXISTS idx_quiz_error_cases_question_status
    ON app.quiz_error_cases (question_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_error_cases_open_unique
    ON app.quiz_error_cases (course_id, question_id)
    WHERE status IN ('new', 'in_progress');

CREATE INDEX IF NOT EXISTS idx_quiz_error_reports_case_created
    ON app.quiz_error_reports (case_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quiz_error_reports_student_created
    ON app.quiz_error_reports (student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quiz_error_reports_course_question_created
    ON app.quiz_error_reports (course_id, question_id, created_at DESC);

ALTER TABLE app.quiz_error_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.quiz_error_reports ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON app.quiz_error_cases TO authenticated;
GRANT SELECT ON app.quiz_error_reports TO authenticated;
GRANT ALL ON app.quiz_error_cases TO service_role;
GRANT ALL ON app.quiz_error_reports TO service_role;

DROP POLICY IF EXISTS quiz_error_cases_service_role_all ON app.quiz_error_cases;
CREATE POLICY quiz_error_cases_service_role_all
    ON app.quiz_error_cases
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS quiz_error_reports_service_role_all ON app.quiz_error_reports;
CREATE POLICY quiz_error_reports_service_role_all
    ON app.quiz_error_reports
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS quiz_error_cases_mentor_select ON app.quiz_error_cases;
CREATE POLICY quiz_error_cases_mentor_select
    ON app.quiz_error_cases
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM app.user_roles ur
            JOIN app.roles r ON r.id = ur.role_id
            WHERE ur.user_id = (SELECT auth.uid())
              AND r.code IN ('mentor', 'admin', 'dev')
        )
    );

DROP POLICY IF EXISTS quiz_error_cases_mentor_update ON app.quiz_error_cases;

DROP POLICY IF EXISTS quiz_error_reports_student_insert ON app.quiz_error_reports;

DROP POLICY IF EXISTS quiz_error_reports_mentor_select ON app.quiz_error_reports;
CREATE POLICY quiz_error_reports_mentor_select
    ON app.quiz_error_reports
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM app.user_roles ur
            JOIN app.roles r ON r.id = ur.role_id
            WHERE ur.user_id = (SELECT auth.uid())
              AND r.code IN ('mentor', 'admin', 'dev')
        )
    );

COMMIT;
```

- [ ] **Step 2: Check migration syntax locally**

Run:

```powershell
Select-String -Path db\supabase\migrations\20260701_mentor_quiz_error_cases.sql -Pattern "quiz_error_cases","quiz_error_reports","quiz_error_case_status"
```

Expected: matches for the enum, both tables, indexes, grants, and policies.

- [ ] **Step 3: Commit migration**

```powershell
git add db/supabase/migrations/20260701_mentor_quiz_error_cases.sql
git commit -m "feat: add quiz error case schema"
```

---

## Task 2: Add Backend Service Tests for Grouping and Transitions

**Files:**
- Create: `tests/test_api/test_quiz_error_cases.py`
- Planned create in Task 3: `src/services/quiz_error_cases.py`

- [ ] **Step 1: Write failing service tests**

Create `tests/test_api/test_quiz_error_cases.py` with the fake Supabase client and initial service tests:

```python
from __future__ import annotations

from dataclasses import dataclass
from types import SimpleNamespace
from uuid import UUID

import pytest
from fastapi import HTTPException

from src.api.routes import QuizReportRequest
from src.services.quiz_error_cases import (
    QuizErrorQuestionUpdate,
    QuizErrorStatusUpdate,
    create_or_update_quiz_error_case,
    transition_quiz_error_case,
    update_quiz_error_question,
)


STUDENT_ID = "11111111-1111-1111-1111-111111111111"
MENTOR_ID = "22222222-2222-2222-2222-222222222222"
COURSE_ID = "33333333-3333-3333-3333-333333333333"
QUESTION_ID = "44444444-4444-4444-4444-444444444444"
OPEN_CASE_ID = "55555555-5555-5555-5555-555555555555"
CLOSED_CASE_ID = "66666666-6666-6666-6666-666666666666"


@dataclass
class FakeResponse:
    data: list[dict] | dict | None


class FakeTableQuery:
    def __init__(self, client: "FakeAppClient", table_name: str):
        self.client = client
        self.table_name = table_name
        self.operation = "select"
        self.payload = None
        self.filters: list[tuple[str, object]] = []
        self.in_filters: list[tuple[str, list[object]]] = []
        self.limit_count: int | None = None
        self.range_bounds: tuple[int, int] | None = None
        self.order_by: tuple[str, bool] | None = None

    def select(self, *_args, **_kwargs):
        self.operation = "select"
        return self

    def insert(self, payload):
        self.operation = "insert"
        self.payload = payload
        return self

    def update(self, payload):
        self.operation = "update"
        self.payload = payload
        return self

    def eq(self, key, value):
        self.filters.append((key, value))
        return self

    def in_(self, key, values):
        self.in_filters.append((key, list(values)))
        return self

    def order(self, key, desc=False):
        self.order_by = (key, desc)
        return self

    def limit(self, count):
        self.limit_count = count
        return self

    def range(self, start, end):
        self.range_bounds = (start, end)
        return self

    def execute(self):
        return self.client.execute(self)


class FakeAppClient:
    def __init__(self):
        self.tables = {
            "quiz_error_cases": [],
            "quiz_error_reports": [],
            "questions": [
                {
                    "id": QUESTION_ID,
                    "question_text": "Old question?",
                    "options": {"A": "A1", "B": "B1", "C": "C1", "D": "D1"},
                    "correct_answer": "A",
                    "explanation": "Old explanation",
                    "difficulty": "normal",
                }
            ],
            "feedback_events": [],
        }
        self.case_seq = 0
        self.report_seq = 0

    def table(self, table_name):
        return FakeTableQuery(self, table_name)

    def execute(self, query: FakeTableQuery):
        rows = self.tables[query.table_name]
        if query.operation == "insert":
            payload = dict(query.payload)
            if query.table_name == "quiz_error_cases":
                self.case_seq += 1
                payload.setdefault("id", OPEN_CASE_ID if self.case_seq == 1 else f"55555555-5555-5555-5555-55555555555{self.case_seq}")
                payload.setdefault("report_count", 0)
                payload.setdefault("status", "new")
            if query.table_name == "quiz_error_reports":
                self.report_seq += 1
                payload.setdefault("id", f"77777777-7777-7777-7777-77777777777{self.report_seq}")
            rows.append(payload)
            return FakeResponse([payload])

        matched = [
            row
            for row in rows
            if all(str(row.get(key)) == str(value) for key, value in query.filters)
            and all(row.get(key) in values for key, values in query.in_filters)
        ]

        if query.operation == "update":
            for row in matched:
                row.update(query.payload)
            return FakeResponse(matched)

        if query.order_by:
            key, desc = query.order_by
            matched = sorted(matched, key=lambda row: str(row.get(key) or ""), reverse=desc)
        if query.range_bounds:
            start, end = query.range_bounds
            matched = matched[start : end + 1]
        if query.limit_count is not None:
            matched = matched[: query.limit_count]
        return FakeResponse(matched)


class FakeDb:
    def __init__(self):
        self._stub_mode = False
        self.app_client = FakeAppClient()


def make_report(detail="Sai đáp án", error_type="wrong_answer"):
    return QuizReportRequest(
        question_id=QUESTION_ID,
        question_text="Question shown to student?",
        selected_option="B",
        error_type=error_type,
        detail=detail,
        student_id=STUDENT_ID,
        course_id=COURSE_ID,
    )


def test_student_report_creates_case_and_child_report():
    db = FakeDb()

    result = create_or_update_quiz_error_case(db, make_report(), UUID(STUDENT_ID))

    assert result["case_id"] == OPEN_CASE_ID
    assert len(db.app_client.tables["quiz_error_cases"]) == 1
    assert len(db.app_client.tables["quiz_error_reports"]) == 1
    case = db.app_client.tables["quiz_error_cases"][0]
    report = db.app_client.tables["quiz_error_reports"][0]
    assert case["course_id"] == COURSE_ID
    assert case["question_id"] == QUESTION_ID
    assert case["report_count"] == 1
    assert report["case_id"] == OPEN_CASE_ID
    assert report["question_snapshot"]["question_text"] == "Old question?"


def test_second_report_reuses_open_case_and_increments_count():
    db = FakeDb()

    create_or_update_quiz_error_case(db, make_report(detail="Lần 1"), UUID(STUDENT_ID))
    create_or_update_quiz_error_case(db, make_report(detail="Lần 2"), UUID(STUDENT_ID))

    assert len(db.app_client.tables["quiz_error_cases"]) == 1
    assert len(db.app_client.tables["quiz_error_reports"]) == 2
    assert db.app_client.tables["quiz_error_cases"][0]["report_count"] == 2


def test_closed_case_followed_by_new_report_creates_new_case():
    db = FakeDb()
    db.app_client.tables["quiz_error_cases"].append(
        {
            "id": CLOSED_CASE_ID,
            "course_id": COURSE_ID,
            "question_id": QUESTION_ID,
            "status": "resolved",
            "report_count": 3,
        }
    )

    result = create_or_update_quiz_error_case(db, make_report(), UUID(STUDENT_ID))

    assert result["case_id"] != CLOSED_CASE_ID
    assert len(db.app_client.tables["quiz_error_cases"]) == 2


def test_invalid_status_transition_is_rejected():
    db = FakeDb()
    db.app_client.tables["quiz_error_cases"].append(
        {
            "id": OPEN_CASE_ID,
            "course_id": COURSE_ID,
            "question_id": QUESTION_ID,
            "status": "resolved",
            "report_count": 1,
        }
    )

    with pytest.raises(HTTPException) as exc:
        transition_quiz_error_case(
            db,
            OPEN_CASE_ID,
            QuizErrorStatusUpdate(status="in_progress"),
            SimpleNamespace(id=UUID(MENTOR_ID)),
        )

    assert exc.value.status_code == 400


def test_resolve_requires_resolution_note():
    db = FakeDb()
    db.app_client.tables["quiz_error_cases"].append(
        {
            "id": OPEN_CASE_ID,
            "course_id": COURSE_ID,
            "question_id": QUESTION_ID,
            "status": "in_progress",
            "report_count": 1,
        }
    )

    with pytest.raises(HTTPException) as exc:
        transition_quiz_error_case(
            db,
            OPEN_CASE_ID,
            QuizErrorStatusUpdate(status="resolved"),
            SimpleNamespace(id=UUID(MENTOR_ID)),
        )

    assert exc.value.status_code == 422


def test_question_update_changes_question_fields():
    db = FakeDb()
    db.app_client.tables["quiz_error_cases"].append(
        {
            "id": OPEN_CASE_ID,
            "course_id": COURSE_ID,
            "question_id": QUESTION_ID,
            "status": "in_progress",
            "report_count": 1,
        }
    )

    result = update_quiz_error_question(
        db,
        OPEN_CASE_ID,
        QuizErrorQuestionUpdate(
            question_text="Updated question?",
            options={"A": "A2", "B": "B2", "C": "C2", "D": "D2"},
            correct_answer="B",
            explanation="Updated explanation",
            difficulty="hard",
        ),
        SimpleNamespace(id=UUID(MENTOR_ID)),
    )

    assert result["question"]["question_text"] == "Updated question?"
    assert result["question"]["correct_answer"] == "B"
    assert db.app_client.tables["questions"][0]["options"]["D"] == "D2"
```

- [ ] **Step 2: Run service tests to verify they fail**

Run:

```powershell
python -m pytest tests/test_api/test_quiz_error_cases.py -q
```

Expected: FAIL with `ModuleNotFoundError: No module named 'src.services.quiz_error_cases'`.

- [ ] **Step 3: Commit failing tests**

```powershell
git add tests/test_api/test_quiz_error_cases.py
git commit -m "test: define quiz error case service behavior"
```

---

## Task 3: Implement Backend Quiz Error Case Service

**Files:**
- Create: `src/services/quiz_error_cases.py`

- [ ] **Step 1: Add service implementation**

Create `src/services/quiz_error_cases.py`:

```python
from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal
from uuid import UUID

from fastapi import HTTPException
from pydantic import BaseModel, Field, field_validator


OPEN_CASE_STATUSES = ("new", "in_progress")
CASE_STATUSES = ("new", "in_progress", "resolved", "rejected")
VALID_TRANSITIONS = {
    "new": {"in_progress", "rejected"},
    "in_progress": {"resolved", "rejected"},
    "resolved": set(),
    "rejected": set(),
}


class QuizErrorStatusUpdate(BaseModel):
    status: Literal["new", "in_progress", "resolved", "rejected"]
    resolution_note: str | None = None

    @field_validator("resolution_note")
    @classmethod
    def normalize_note(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None


class QuizErrorQuestionUpdate(BaseModel):
    question_text: str = Field(min_length=8)
    options: dict[str, str]
    correct_answer: Literal["A", "B", "C", "D"]
    explanation: str | None = None
    difficulty: str | None = None

    @field_validator("options")
    @classmethod
    def require_four_options(cls, value: dict[str, str]) -> dict[str, str]:
        expected = {"A", "B", "C", "D"}
        if set(value) != expected:
            raise ValueError("options must contain exactly A, B, C, and D")
        cleaned = {key: text.strip() for key, text in value.items()}
        if any(not text for text in cleaned.values()):
            raise ValueError("all options must be non-empty")
        return cleaned


def _execute_data(query) -> list[dict]:
    response = query.execute()
    data = response.data or []
    if isinstance(data, dict):
        return [data]
    return data


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def _first_or_404(rows: list[dict], detail: str) -> dict:
    if not rows:
        raise HTTPException(status_code=404, detail=detail)
    return rows[0]


def _get_question(db, question_id: str) -> dict | None:
    rows = _execute_data(
        db.app_client.table("questions")
        .select("*")
        .eq("id", question_id)
        .limit(1)
    )
    return rows[0] if rows else None


def _question_snapshot(question: dict | None, fallback_question_text: str) -> dict:
    if not question:
        return {"question_text": fallback_question_text}
    return {
        "id": question.get("id"),
        "question_text": question.get("question_text") or question.get("question") or fallback_question_text,
        "options": question.get("options") or {},
        "correct_answer": question.get("correct_answer") or question.get("answer"),
        "explanation": question.get("explanation"),
        "difficulty": question.get("difficulty"),
    }


def _find_open_case(db, course_id: str, question_id: str) -> dict | None:
    rows = _execute_data(
        db.app_client.table("quiz_error_cases")
        .select("*")
        .eq("course_id", course_id)
        .eq("question_id", question_id)
        .in_("status", list(OPEN_CASE_STATUSES))
        .limit(1)
    )
    return rows[0] if rows else None


def _create_case(db, course_id: str, question_id: str) -> dict:
    rows = _execute_data(
        db.app_client.table("quiz_error_cases")
        .insert(
            {
                "course_id": course_id,
                "question_id": question_id,
                "status": "new",
                "report_count": 0,
                "last_reported_at": _now_iso(),
            }
        )
    )
    return _first_or_404(rows, "Không thể tạo hồ sơ báo lỗi quiz.")


def _increment_case(db, case: dict) -> dict:
    count = int(case.get("report_count") or 0) + 1
    rows = _execute_data(
        db.app_client.table("quiz_error_cases")
        .update({"report_count": count, "last_reported_at": _now_iso(), "updated_at": _now_iso()})
        .eq("id", case["id"])
    )
    updated = rows[0] if rows else {**case, "report_count": count}
    return updated


def create_or_update_quiz_error_case(db, request, student_id: UUID) -> dict:
    if db._stub_mode or db.app_client is None:
        return {"case_id": None, "report_id": None, "status": "stubbed"}

    if not request.course_id:
        raise HTTPException(status_code=422, detail="course_id là bắt buộc khi báo lỗi quiz.")
    if not request.question_id:
        raise HTTPException(status_code=422, detail="question_id là bắt buộc khi báo lỗi quiz.")
    if not request.error_type.strip():
        raise HTTPException(status_code=422, detail="error_type là bắt buộc khi báo lỗi quiz.")
    if not request.detail.strip():
        raise HTTPException(status_code=422, detail="detail là bắt buộc khi báo lỗi quiz.")

    question = _get_question(db, request.question_id)
    case = _find_open_case(db, request.course_id, request.question_id) or _create_case(
        db, request.course_id, request.question_id
    )
    report_rows = _execute_data(
        db.app_client.table("quiz_error_reports")
        .insert(
            {
                "case_id": case["id"],
                "student_id": str(student_id),
                "course_id": request.course_id,
                "question_id": request.question_id,
                "selected_option": request.selected_option,
                "error_type": request.error_type.strip(),
                "detail": request.detail.strip(),
                "question_snapshot": _question_snapshot(question, request.question_text),
            }
        )
    )
    updated_case = _increment_case(db, case)
    report_id = report_rows[0]["id"] if report_rows else None
    return {"case_id": updated_case.get("id"), "report_id": report_id, "status": updated_case.get("status")}


def list_quiz_error_cases(
    db,
    *,
    status: str | None = None,
    course_id: str | None = None,
    search: str | None = None,
    error_type: str | None = None,
    limit: int = 30,
    offset: int = 0,
) -> dict:
    if db._stub_mode or db.app_client is None:
        return {"items": [], "limit": limit, "offset": offset}

    query = db.app_client.table("quiz_error_cases").select("*").order("last_reported_at", desc=True)
    if status:
        query = query.eq("status", status)
    if course_id:
        query = query.eq("course_id", course_id)
    cases = _execute_data(query.range(offset, offset + limit - 1))
    question_ids = [case["question_id"] for case in cases]
    questions = {}
    if question_ids:
        for question in _execute_data(db.app_client.table("questions").select("*").in_("id", question_ids)):
            questions[str(question.get("id"))] = question

    enriched = []
    for case in cases:
        question = questions.get(str(case["question_id"])) or {}
        prompt = question.get("question_text") or question.get("question") or ""
        if search and search.lower() not in prompt.lower():
            continue
        reports = _execute_data(
            db.app_client.table("quiz_error_reports")
            .select("*")
            .eq("case_id", case["id"])
            .order("created_at", desc=True)
        )
        if error_type and all(report.get("error_type") != error_type for report in reports):
            continue
        error_counts: dict[str, int] = {}
        for report in reports:
            key = report.get("error_type") or "unknown"
            error_counts[key] = error_counts.get(key, 0) + 1
        most_common_error_type = max(error_counts, key=error_counts.get) if error_counts else None
        enriched.append({**case, "question": question, "most_common_error_type": most_common_error_type})
    return {"items": enriched, "limit": limit, "offset": offset}


def get_quiz_error_case_detail(db, case_id: str) -> dict:
    if db._stub_mode or db.app_client is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ báo lỗi quiz.")

    case = _first_or_404(
        _execute_data(db.app_client.table("quiz_error_cases").select("*").eq("id", case_id).limit(1)),
        "Không tìm thấy hồ sơ báo lỗi quiz.",
    )
    question = _get_question(db, str(case["question_id"])) or {}
    reports = _execute_data(
        db.app_client.table("quiz_error_reports")
        .select("*")
        .eq("case_id", case_id)
        .order("created_at", desc=True)
    )
    return {**case, "question": question, "reports": reports}


def transition_quiz_error_case(db, case_id: str, payload: QuizErrorStatusUpdate, user) -> dict:
    case = get_quiz_error_case_detail(db, case_id)
    current_status = case["status"]
    next_status = payload.status
    if next_status not in VALID_TRANSITIONS[current_status]:
        raise HTTPException(status_code=400, detail=f"Không thể chuyển trạng thái từ {current_status} sang {next_status}.")
    if next_status in {"resolved", "rejected"} and not payload.resolution_note:
        raise HTTPException(status_code=422, detail="Cần nhập ghi chú khi đóng hoặc từ chối báo lỗi.")

    update_data = {
        "status": next_status,
        "updated_at": _now_iso(),
        "resolution_note": payload.resolution_note,
    }
    if next_status in {"resolved", "rejected"}:
        update_data["resolved_by"] = str(user.id)
        update_data["resolved_at"] = _now_iso()

    rows = _execute_data(db.app_client.table("quiz_error_cases").update(update_data).eq("id", case_id))
    return rows[0] if rows else {**case, **update_data}


def update_quiz_error_question(db, case_id: str, payload: QuizErrorQuestionUpdate, user) -> dict:
    case = get_quiz_error_case_detail(db, case_id)
    update_data = {
        "question_text": payload.question_text.strip(),
        "options": payload.options,
        "correct_answer": payload.correct_answer,
        "explanation": payload.explanation.strip() if payload.explanation else None,
        "updated_at": _now_iso(),
    }
    if payload.difficulty:
        update_data["difficulty"] = payload.difficulty

    rows = _execute_data(
        db.app_client.table("questions")
        .update(update_data)
        .eq("id", case["question_id"])
    )
    question = _first_or_404(rows, "Không tìm thấy câu hỏi cần cập nhật.")
    db.app_client.table("quiz_error_cases").update({"updated_at": _now_iso()}).eq("id", case_id).execute()
    return {"case_id": case_id, "question": question, "updated_by": str(user.id)}
```

- [ ] **Step 2: Run service tests**

Run:

```powershell
python -m pytest tests/test_api/test_quiz_error_cases.py -q
```

Expected: PASS for all service tests.

- [ ] **Step 3: Commit service implementation**

```powershell
git add src/services/quiz_error_cases.py tests/test_api/test_quiz_error_cases.py
git commit -m "feat: group quiz error reports into cases"
```

---

## Task 4: Add Mentor Quiz Error API Routes

**Files:**
- Create: `src/api/quiz_error_routes.py`
- Modify: `src/api/routes.py`
- Modify: `tests/test_api/test_quiz_error_cases.py`

- [ ] **Step 1: Add failing API tests**

Append to `tests/test_api/test_quiz_error_cases.py`:

```python
from src.api.adaptive_routes import get_adaptive_db
from src.main import app


@pytest.mark.asyncio
async def test_student_role_cannot_list_mentor_cases(client):
    db = FakeDb()
    app.dependency_overrides[get_adaptive_db] = lambda: db
    try:
        response = await client.get(
            "/api/v1/quiz/error-cases",
            headers={"Authorization": "Bearer d3b07384-d113-4ec5-a58e-0f2d87e07661"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_mentor_role_can_list_quiz_error_cases(client):
    db = FakeDb()
    db.app_client.tables["quiz_error_cases"].append(
        {
            "id": OPEN_CASE_ID,
            "course_id": COURSE_ID,
            "question_id": QUESTION_ID,
            "status": "new",
            "report_count": 1,
            "last_reported_at": "2026-07-01T00:00:00+00:00",
        }
    )
    app.dependency_overrides[get_adaptive_db] = lambda: db
    try:
        response = await client.get(
            "/api/v1/quiz/error-cases",
            headers={"Authorization": "Bearer 55555555-5555-5555-5555-555555555555"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["items"][0]["id"] == OPEN_CASE_ID
```

- [ ] **Step 2: Create mentor API router**

Create `src/api/quiz_error_routes.py`:

```python
from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from src.api import adaptive_routes
from src.services.quiz_error_cases import (
    QuizErrorQuestionUpdate,
    QuizErrorStatusUpdate,
    get_quiz_error_case_detail,
    list_quiz_error_cases,
    transition_quiz_error_case,
    update_quiz_error_question,
)


router = APIRouter(prefix="/quiz/error-cases", tags=["Quiz Error Cases"])
MentorUser = adaptive_routes.require_role(["mentor", "admin", "dev"])


@router.get("")
def list_cases(
    status: str | None = Query(default=None),
    course_id: str | None = Query(default=None),
    search: str | None = Query(default=None),
    error_type: str | None = Query(default=None),
    limit: int = Query(default=30, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user: adaptive_routes.AuthenticatedUser = Depends(MentorUser),
    db=Depends(adaptive_routes.get_adaptive_db),
):
    return list_quiz_error_cases(
        db,
        status=status,
        course_id=course_id,
        search=search,
        error_type=error_type,
        limit=limit,
        offset=offset,
    )


@router.get("/{case_id}")
def get_case(
    case_id: str,
    user: adaptive_routes.AuthenticatedUser = Depends(MentorUser),
    db=Depends(adaptive_routes.get_adaptive_db),
):
    return get_quiz_error_case_detail(db, case_id)


@router.patch("/{case_id}/status")
def update_case_status(
    case_id: str,
    payload: QuizErrorStatusUpdate,
    user: adaptive_routes.AuthenticatedUser = Depends(MentorUser),
    db=Depends(adaptive_routes.get_adaptive_db),
):
    return transition_quiz_error_case(db, case_id, payload, user)


@router.patch("/{case_id}/question")
def update_case_question(
    case_id: str,
    payload: QuizErrorQuestionUpdate,
    user: adaptive_routes.AuthenticatedUser = Depends(MentorUser),
    db=Depends(adaptive_routes.get_adaptive_db),
):
    return update_quiz_error_question(db, case_id, payload, user)
```

- [ ] **Step 3: Include router and wire existing student report route**

Modify the import block near the top of `src/api/routes.py`:

```python
from src.api import adaptive_routes, admin_braintrust_routes, auth_routes, onboarding_routes, quiz_error_routes
from src.services.quiz_error_cases import create_or_update_quiz_error_case
```

Modify the router include section:

```python
router.include_router(adaptive_routes.router)
router.include_router(auth_routes.router)
router.include_router(admin_braintrust_routes.router)
router.include_router(onboarding_routes.router)
router.include_router(quiz_error_routes.router)
```

Inside the existing `report_quiz_error` route, after `db = get_adaptive_db()` and before writing `feedback_events`, call:

```python
    case_result = create_or_update_quiz_error_case(db, request, UUID(str(request.student_id)))
```

Then update the return payload:

```python
    return {
        "status": "success",
        "message": "Báo cáo lỗi đã được ghi nhận thành công.",
        "case_id": case_result.get("case_id"),
    }
```

Keep the existing JSONL write and `feedback_events` insert in place for backward-compatible audit.

- [ ] **Step 4: Run backend tests**

Run:

```powershell
python -m pytest tests/test_api/test_quiz_error_cases.py -q
```

Expected: PASS.

- [ ] **Step 5: Commit API routes**

```powershell
git add src/api/quiz_error_routes.py src/api/routes.py tests/test_api/test_quiz_error_cases.py
git commit -m "feat: expose mentor quiz error case APIs"
```

---

## Task 5: Add Frontend API Types and Helpers

**Files:**
- Create: `frontend/lib/mentor/quiz-error-cases.ts`

- [ ] **Step 1: Create frontend API helper**

Create `frontend/lib/mentor/quiz-error-cases.ts`:

```typescript
export type QuizErrorCaseStatus = 'new' | 'in_progress' | 'resolved' | 'rejected';

export type QuizErrorQuestion = {
  id: string;
  question_text?: string;
  question?: string;
  options?: Record<'A' | 'B' | 'C' | 'D', string>;
  correct_answer?: 'A' | 'B' | 'C' | 'D';
  answer?: 'A' | 'B' | 'C' | 'D';
  explanation?: string | null;
  difficulty?: string | null;
};

export type QuizErrorReport = {
  id: string;
  case_id: string;
  student_id: string;
  selected_option?: string | null;
  error_type: string;
  detail: string;
  question_snapshot?: Record<string, unknown>;
  created_at: string;
};

export type QuizErrorCaseListItem = {
  id: string;
  course_id: string;
  question_id: string;
  status: QuizErrorCaseStatus;
  report_count: number;
  last_reported_at: string;
  resolution_note?: string | null;
  question: QuizErrorQuestion;
  most_common_error_type?: string | null;
};

export type QuizErrorCaseDetail = QuizErrorCaseListItem & {
  reports: QuizErrorReport[];
};

export type QuizErrorQuestionPayload = {
  question_text: string;
  options: Record<'A' | 'B' | 'C' | 'D', string>;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation?: string | null;
  difficulty?: string | null;
};

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || body.message || 'Không thể tải dữ liệu báo lỗi quiz.');
  }
  return response.json() as Promise<T>;
}

export function fetchQuizErrorCases(params: {
  status?: QuizErrorCaseStatus | 'all';
  search?: string;
  errorType?: string;
}) {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.search?.trim()) query.set('search', params.search.trim());
  if (params.errorType?.trim() && params.errorType !== 'all') query.set('error_type', params.errorType.trim());
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return requestJson<{ items: QuizErrorCaseListItem[]; limit: number; offset: number }>(
    `/api/v1/quiz/error-cases${suffix}`
  );
}

export function fetchQuizErrorCaseDetail(caseId: string) {
  return requestJson<QuizErrorCaseDetail>(`/api/v1/quiz/error-cases/${caseId}`);
}

export function updateQuizErrorCaseStatus(
  caseId: string,
  payload: { status: QuizErrorCaseStatus; resolution_note?: string }
) {
  return requestJson<QuizErrorCaseListItem>(`/api/v1/quiz/error-cases/${caseId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function updateQuizErrorCaseQuestion(caseId: string, payload: QuizErrorQuestionPayload) {
  return requestJson<{ case_id: string; question: QuizErrorQuestion; updated_by: string }>(
    `/api/v1/quiz/error-cases/${caseId}/question`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );
}
```

- [ ] **Step 2: Type-check helper by importing it**

Run:

```powershell
Set-Location frontend
pnpm run lint
```

Expected: either PASS, or unrelated existing lint failures. If unrelated lint failures appear, record exact files before continuing.

- [ ] **Step 3: Commit frontend API helper**

```powershell
git add frontend/lib/mentor/quiz-error-cases.ts
git commit -m "feat: add quiz error case frontend API helper"
```

---

## Task 6: Build Mentor Quiz Error Cases Tab UI

**Files:**
- Create: `frontend/components/dashboard/mentor/quiz-error-cases-tab.tsx`

- [ ] **Step 1: Add tab component with demo data and live API fallback**

Create `frontend/components/dashboard/mentor/quiz-error-cases-tab.tsx`:

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  CircleSlash,
  Clock3,
  Flag,
  MessageSquareText,
  Save,
  Search,
  Send,
  Sparkles,
} from 'lucide-react';
import { isDemoMode } from '@/lib/demo-mode';
import {
  fetchQuizErrorCaseDetail,
  fetchQuizErrorCases,
  QuizErrorCaseDetail,
  QuizErrorCaseListItem,
  QuizErrorCaseStatus,
  updateQuizErrorCaseQuestion,
  updateQuizErrorCaseStatus,
} from '@/lib/mentor/quiz-error-cases';

const STATUS_META: Record<QuizErrorCaseStatus, { label: string; classes: string }> = {
  new: { label: 'Mới', classes: 'border-amber-200 bg-amber-50 text-amber-700' },
  in_progress: { label: 'Đang sửa', classes: 'border-blue-200 bg-blue-50 text-blue-700' },
  resolved: { label: 'Đã xử lý', classes: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  rejected: { label: 'Từ chối', classes: 'border-rose-200 bg-rose-50 text-rose-700' },
};

const DEMO_CASES: QuizErrorCaseDetail[] = [
  {
    id: 'case-demo-1',
    course_id: 'course-demo',
    question_id: 'question-demo-1',
    status: 'new',
    report_count: 4,
    last_reported_at: new Date().toISOString(),
    most_common_error_type: 'wrong_answer',
    question: {
      id: 'question-demo-1',
      question_text: 'Trong hệ RAG production, bước nào giúp giới hạn tài liệu truy hồi theo ngữ cảnh phù hợp nhất?',
      options: {
        A: 'Tăng nhiệt độ của mô hình LLM để tự động lọc.',
        B: 'Metadata filtering trước khi tiến hành retrieval.',
        C: 'Chỉ sử dụng prompt dài hơn để chứa toàn bộ ngữ cảnh.',
        D: 'Tắt chunking để giữ nguyên cấu trúc tài liệu gốc.',
      },
      correct_answer: 'A',
      explanation: 'Đáp án hiện tại đang bị học viên nghi ngờ vì slide nói metadata filtering là bước đúng.',
      difficulty: 'normal',
    },
    reports: [
      {
        id: 'report-demo-1',
        case_id: 'case-demo-1',
        student_id: 'student-a',
        selected_option: 'B',
        error_type: 'wrong_answer',
        detail: 'Slide 14 nói metadata filtering mới là đáp án đúng, nhưng hệ thống chấm A.',
        created_at: new Date().toISOString(),
      },
      {
        id: 'report-demo-2',
        case_id: 'case-demo-1',
        student_id: 'student-b',
        selected_option: 'B',
        error_type: 'wrong_answer',
        detail: 'Em chọn B theo tài liệu nhưng bị báo sai.',
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'case-demo-2',
    course_id: 'course-demo',
    question_id: 'question-demo-2',
    status: 'in_progress',
    report_count: 2,
    last_reported_at: new Date(Date.now() - 3600_000).toISOString(),
    most_common_error_type: 'unclear_question',
    question: {
      id: 'question-demo-2',
      question_text: 'Trace trong observability đại diện cho điều gì?',
      options: {
        A: 'Lịch sử thay đổi code trên Git.',
        B: 'Chuỗi các spans của một yêu cầu.',
        C: 'Bản đồ kết nối vật lý giữa máy chủ.',
        D: 'Lịch sử thanh toán phí API.',
      },
      correct_answer: 'B',
      explanation: 'Trace ghi nhận cây span và trạng thái thực thi của request.',
      difficulty: 'hard',
    },
    reports: [
      {
        id: 'report-demo-3',
        case_id: 'case-demo-2',
        student_id: 'student-c',
        selected_option: 'B',
        error_type: 'unclear_question',
        detail: 'Các đáp án nhiễu quá dễ loại, câu hỏi chưa kiểm tra đúng hiểu biết.',
        created_at: new Date(Date.now() - 3600_000).toISOString(),
      },
    ],
  },
];

const STATUS_FILTERS: Array<QuizErrorCaseStatus | 'all'> = ['all', 'new', 'in_progress', 'resolved', 'rejected'];
const OPTION_KEYS = ['A', 'B', 'C', 'D'] as const;

function getQuestionText(item: QuizErrorCaseListItem | QuizErrorCaseDetail) {
  return item.question.question_text || item.question.question || '';
}

function getCorrectAnswer(item: QuizErrorCaseDetail) {
  return item.question.correct_answer || item.question.answer || 'A';
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value));
}

export function QuizErrorCasesTab() {
  const [cases, setCases] = useState<QuizErrorCaseListItem[]>(DEMO_CASES);
  const [activeCase, setActiveCase] = useState<QuizErrorCaseDetail | null>(DEMO_CASES[0]);
  const [statusFilter, setStatusFilter] = useState<QuizErrorCaseStatus | 'all'>('new');
  const [searchQuery, setSearchQuery] = useState('');
  const [errorTypeFilter, setErrorTypeFilter] = useState('all');
  const [resolutionNote, setResolutionNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    question_text: getQuestionText(DEMO_CASES[0]),
    options: DEMO_CASES[0].question.options || { A: '', B: '', C: '', D: '' },
    correct_answer: getCorrectAnswer(DEMO_CASES[0]),
    explanation: DEMO_CASES[0].question.explanation || '',
    difficulty: DEMO_CASES[0].question.difficulty || 'normal',
  });

  useEffect(() => {
    if (isDemoMode()) return;
    let cancelled = false;
    setIsLoading(true);
    setErrorMessage(null);
    fetchQuizErrorCases({ status: statusFilter, search: searchQuery, errorType: errorTypeFilter })
      .then((response) => {
        if (cancelled) return;
        setCases(response.items);
        if (response.items[0]) {
          void selectCase(response.items[0].id);
        } else {
          setActiveCase(null);
        }
      })
      .catch((error) => {
        if (!cancelled) setErrorMessage(error.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [statusFilter, searchQuery, errorTypeFilter]);

  function syncDraft(nextCase: QuizErrorCaseDetail) {
    setDraft({
      question_text: getQuestionText(nextCase),
      options: nextCase.question.options || { A: '', B: '', C: '', D: '' },
      correct_answer: getCorrectAnswer(nextCase),
      explanation: nextCase.question.explanation || '',
      difficulty: nextCase.question.difficulty || 'normal',
    });
  }

  async function selectCase(caseId: string) {
    const demoCase = DEMO_CASES.find((item) => item.id === caseId);
    if (isDemoMode() && demoCase) {
      setActiveCase(demoCase);
      syncDraft(demoCase);
      return;
    }
    const detail = await fetchQuizErrorCaseDetail(caseId);
    setActiveCase(detail);
    syncDraft(detail);
  }

  async function saveQuestion() {
    if (!activeCase) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      if (!isDemoMode()) {
        await updateQuizErrorCaseQuestion(activeCase.id, draft);
      }
      const updated = { ...activeCase, question: { ...activeCase.question, ...draft } };
      setActiveCase(updated);
      setCases((items) => items.map((item) => (item.id === updated.id ? { ...item, question: updated.question } : item)));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể lưu câu hỏi.');
    } finally {
      setIsSaving(false);
    }
  }

  async function changeStatus(status: QuizErrorCaseStatus) {
    if (!activeCase) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      if (!isDemoMode()) {
        await updateQuizErrorCaseStatus(activeCase.id, { status, resolution_note: resolutionNote || undefined });
      }
      const updated = { ...activeCase, status, resolution_note: resolutionNote };
      setActiveCase(updated);
      setCases((items) => items.map((item) => (item.id === updated.id ? { ...item, status } : item)));
      setResolutionNote('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái.');
    } finally {
      setIsSaving(false);
    }
  }

  const visibleCases = cases.filter((item) => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesSearch = !searchQuery || getQuestionText(item).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesError = errorTypeFilter === 'all' || item.most_common_error_type === errorTypeFilter;
    return matchesStatus && matchesSearch && matchesError;
  });

  const stats = STATUS_FILTERS.filter((status) => status !== 'all').map((status) => ({
    status,
    count: cases.filter((item) => item.status === status).length,
  }));

  return (
    <div className="space-y-6 font-be-vietnam-pro">
      <div className="flex flex-col gap-4 rounded-3xl border-2 border-gray-border bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-amber-600">
            <Flag className="h-4 w-4" />
            Hộp thư báo lỗi quiz
          </p>
          <h2 className="mt-1 font-fraunces text-2xl font-black text-stone-800">
            Mentor xử lý câu hỏi bị học viên báo lỗi
          </h2>
          <p className="mt-1 text-xs font-semibold text-stone-500">
            Gom nhiều báo cáo vào một hồ sơ để sửa câu hỏi, đáp án và lời giải thích ngay tại đây.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map(({ status, count }) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-2xl border px-3 py-2 text-left transition-all ${STATUS_META[status].classes}`}
            >
              <p className="text-[9px] font-black uppercase">{STATUS_META[status].label}</p>
              <p className="text-xl font-black">{count}</p>
            </button>
          ))}
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[380px_1fr]">
        <aside className="rounded-3xl border-2 border-gray-border bg-white p-4 shadow-sm">
          <div className="space-y-3 border-b border-stone-100 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Tìm theo nội dung câu hỏi..."
                className="w-full rounded-2xl border-2 border-gray-border bg-white py-2.5 pl-9 pr-3 text-xs font-semibold text-stone-700 focus:border-primary-green focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as QuizErrorCaseStatus | 'all')}
                className="rounded-xl border-2 border-gray-border bg-white px-3 py-2 text-xs font-black text-stone-600 focus:border-primary-green focus:outline-none"
              >
                <option value="all">Tất cả</option>
                <option value="new">Mới</option>
                <option value="in_progress">Đang sửa</option>
                <option value="resolved">Đã xử lý</option>
                <option value="rejected">Từ chối</option>
              </select>
              <select
                value={errorTypeFilter}
                onChange={(event) => setErrorTypeFilter(event.target.value)}
                className="rounded-xl border-2 border-gray-border bg-white px-3 py-2 text-xs font-black text-stone-600 focus:border-primary-green focus:outline-none"
              >
                <option value="all">Mọi lỗi</option>
                <option value="wrong_answer">Sai đáp án</option>
                <option value="wrong_knowledge">Sai kiến thức</option>
                <option value="unclear_question">Câu hỏi mơ hồ</option>
              </select>
            </div>
          </div>

          <div className="mt-4 max-h-[620px] space-y-2 overflow-y-auto pr-1">
            {isLoading && (
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-xs font-bold text-stone-400">
                Đang tải hồ sơ báo lỗi...
              </div>
            )}
            {!isLoading &&
              visibleCases.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void selectCase(item.id)}
                  className={`w-full rounded-2xl border p-3 text-left transition-all ${
                    activeCase?.id === item.id
                      ? 'border-primary-green bg-primary-green/5 ring-1 ring-primary-green/10'
                      : 'border-stone-200 bg-white hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-xs font-extrabold leading-relaxed text-stone-700">
                      {getQuestionText(item)}
                    </p>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[8px] font-black uppercase ${STATUS_META[item.status].classes}`}>
                      {STATUS_META[item.status].label}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase text-stone-400">
                    <span className="inline-flex items-center gap-1">
                      <MessageSquareText className="h-3.5 w-3.5" />
                      {item.report_count} báo cáo
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatTime(item.last_reported_at)}
                    </span>
                  </div>
                </button>
              ))}
            {!isLoading && visibleCases.length === 0 && (
              <div className="rounded-3xl border-2 border-dashed border-gray-border bg-stone-50/60 px-5 py-12 text-center">
                <Sparkles className="mx-auto h-9 w-9 text-primary-green" />
                <p className="mt-3 text-xs font-black text-stone-500">
                  Không có hồ sơ báo lỗi nào khớp bộ lọc hiện tại.
                </p>
              </div>
            )}
          </div>
        </aside>

        <section className="rounded-3xl border-2 border-gray-border bg-white p-5 shadow-sm">
          {activeCase ? (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 border-b border-stone-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                    Hồ sơ #{activeCase.id.slice(0, 8)}
                  </p>
                  <h3 className="mt-1 font-fraunces text-xl font-black text-stone-800">
                    Chỉnh sửa câu hỏi được báo lỗi
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-stone-500">
                    {activeCase.report_count} học viên đã báo lỗi, lần gần nhất {formatTime(activeCase.last_reported_at)}.
                  </p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${STATUS_META[activeCase.status].classes}`}>
                  {STATUS_META[activeCase.status].label}
                </span>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  <p className="text-xs font-black uppercase">Tín hiệu từ học viên</p>
                </div>
                <div className="mt-3 grid gap-2">
                  {activeCase.reports.map((report) => (
                    <div key={report.id} className="rounded-xl border border-amber-100 bg-white/80 p-3">
                      <p className="text-[10px] font-black uppercase text-amber-700">
                        {report.error_type} · chọn {report.selected_option || 'không rõ'}
                      </p>
                      <p className="mt-1 text-xs font-semibold leading-relaxed text-stone-700">{report.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-stone-400">Nội dung câu hỏi</label>
                <textarea
                  value={draft.question_text}
                  onChange={(event) => setDraft((current) => ({ ...current, question_text: event.target.value }))}
                  className="min-h-24 w-full rounded-2xl border-2 border-gray-border bg-white px-4 py-3 text-xs font-semibold leading-relaxed text-stone-700 focus:border-primary-green focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {OPTION_KEYS.map((key) => (
                  <div key={key} className="rounded-2xl border border-gray-border bg-stone-50/30 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase text-stone-400">Đáp án {key}</label>
                      <label className="flex cursor-pointer items-center gap-1.5 text-[10px] font-black uppercase text-stone-500">
                        <input
                          type="radio"
                          name="quizErrorCorrectAnswer"
                          checked={draft.correct_answer === key}
                          onChange={() => setDraft((current) => ({ ...current, correct_answer: key }))}
                          className="h-4 w-4 accent-primary-green"
                        />
                        Đúng
                      </label>
                    </div>
                    <textarea
                      value={draft.options[key]}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          options: { ...current.options, [key]: event.target.value },
                        }))
                      }
                      className="min-h-16 w-full rounded-xl border-2 border-gray-border bg-white px-3 py-2 text-xs font-semibold leading-relaxed text-stone-700 focus:border-primary-green focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px]">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-stone-400">Lời giải thích</label>
                  <textarea
                    value={draft.explanation}
                    onChange={(event) => setDraft((current) => ({ ...current, explanation: event.target.value }))}
                    className="min-h-24 w-full rounded-2xl border-2 border-gray-border bg-white px-4 py-3 text-xs font-semibold leading-relaxed text-stone-700 focus:border-primary-green focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-stone-400">Độ khó</label>
                  <div className="relative">
                    <select
                      value={draft.difficulty}
                      onChange={(event) => setDraft((current) => ({ ...current, difficulty: event.target.value }))}
                      className="w-full appearance-none rounded-xl border-2 border-gray-border bg-white px-3 py-2.5 pr-8 text-xs font-semibold text-stone-700 focus:border-primary-green focus:outline-none"
                    >
                      <option value="easy">Dễ</option>
                      <option value="normal">Bình thường</option>
                      <option value="hard">Khó</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-stone-400" />
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-[11px] font-semibold leading-relaxed text-stone-500">
                    Gợi ý Socratic đang để đọc-only trong MVP để tránh sửa lệch cấu trúc `question_hints`.
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
                <label className="text-[10px] font-black uppercase text-stone-400">
                  Ghi chú khi đóng hoặc từ chối
                </label>
                <textarea
                  value={resolutionNote}
                  onChange={(event) => setResolutionNote(event.target.value)}
                  placeholder="Ví dụ: Đã đổi đáp án đúng từ A sang B theo slide 14."
                  className="mt-2 min-h-16 w-full rounded-xl border-2 border-gray-border bg-white px-3 py-2 text-xs font-semibold text-stone-700 focus:border-primary-green focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-2 border-t border-stone-100 pt-4">
                {activeCase.status === 'new' && (
                  <button type="button" onClick={() => void changeStatus('in_progress')} className="btn-3d btn-green flex items-center gap-1 px-4 py-2 text-[10px]">
                    <Send className="h-3.5 w-3.5" />
                    Bắt đầu sửa
                  </button>
                )}
                <button type="button" onClick={() => void saveQuestion()} disabled={isSaving} className="btn-3d btn-white flex items-center gap-1 px-4 py-2 text-[10px]">
                  <Save className="h-3.5 w-3.5" />
                  Lưu thay đổi
                </button>
                {activeCase.status === 'in_progress' && (
                  <button type="button" onClick={() => void changeStatus('resolved')} disabled={isSaving || !resolutionNote.trim()} className="btn-3d btn-green flex items-center gap-1 px-4 py-2 text-[10px] disabled:opacity-50">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Đóng là đã xử lý
                  </button>
                )}
                <button type="button" onClick={() => void changeStatus('rejected')} disabled={isSaving || !resolutionNote.trim()} className="btn-3d btn-red flex items-center gap-1 px-4 py-2 text-[10px] disabled:opacity-50">
                  <CircleSlash className="h-3.5 w-3.5" />
                  Từ chối báo lỗi
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border-2 border-dashed border-gray-border bg-stone-50/50 px-6 py-16 text-center">
              <Flag className="mx-auto h-10 w-10 text-stone-300" />
              <p className="mt-3 text-xs font-black text-stone-400">
                Chọn một hồ sơ báo lỗi để xem chi tiết và chỉnh sửa câu hỏi.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run frontend lint**

Run:

```powershell
Set-Location frontend
pnpm run lint
```

Expected: PASS, or only unrelated existing warnings. Fix any new TypeScript or ESLint errors in the new file before committing.

- [ ] **Step 3: Commit component**

```powershell
git add frontend/components/dashboard/mentor/quiz-error-cases-tab.tsx
git commit -m "feat: add mentor quiz error cases tab"
```

---

## Task 7: Wire Mentor Navigation and Dashboard Rendering

**Files:**
- Modify: `frontend/lib/dashboard-tabs.ts`
- Modify: `frontend/components/dashboard/mentor/index.ts`
- Modify: `frontend/app/components/dashboard-layout.tsx`

- [ ] **Step 1: Add tab id and navigation item**

Modify `frontend/lib/dashboard-tabs.ts`.

Add `AlertTriangle` to the lucide import:

```typescript
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Dumbbell,
  Gauge,
  FileEdit,
  MessageSquare,
  Search,
  Upload,
  User,
  Users,
} from 'lucide-react';
```

Add the tab id to `TabType`:

```typescript
  | 'quiz-editor'
  | 'quiz-error-cases'
  | 'rag-audit'
```

Add the mentor item immediately after `quiz-editor`:

```typescript
  { id: 'quiz-editor', name: 'Duyệt câu hỏi', shortName: 'Duyệt', icon: FileEdit },
  { id: 'quiz-error-cases', name: 'Báo lỗi quiz', shortName: 'Báo lỗi', icon: AlertTriangle },
  { id: 'rag-audit', name: 'Kiểm tra RAG', shortName: 'RAG', icon: Search },
```

- [ ] **Step 2: Export new mentor tab**

Modify `frontend/components/dashboard/mentor/index.ts`:

```typescript
export { QuizErrorCasesTab } from './quiz-error-cases-tab';
```

Keep all existing exports intact.

- [ ] **Step 3: Render the new tab in dashboard layout**

Modify `frontend/app/components/dashboard-layout.tsx`.

Add the import next to other mentor imports:

```typescript
import { QuizErrorCasesTab } from '@/components/dashboard/mentor';
```

Add render branch in the mentor/dashboard tab switch:

```tsx
{activeTab === 'quiz-error-cases' && <QuizErrorCasesTab />}
```

Place it next to the existing `quiz-editor` branch so mentor tools stay grouped.

- [ ] **Step 4: Run frontend lint**

Run:

```powershell
Set-Location frontend
pnpm run lint
```

Expected: PASS, or only unrelated existing warnings.

- [ ] **Step 5: Commit wiring**

```powershell
git add frontend/lib/dashboard-tabs.ts frontend/components/dashboard/mentor/index.ts frontend/app/components/dashboard-layout.tsx
git commit -m "feat: wire mentor quiz error tab"
```

---

## Task 8: Update Student Report Success Copy

**Files:**
- Modify: `frontend/components/quiz/quiz-question-view.tsx`

- [ ] **Step 1: Update success message only**

Find the success path in `handleSubmitReport` and change the toast/message text to:

```typescript
setReportSuccessMessage('Mentor đã nhận báo lỗi của bạn. Cảm ơn bạn đã giúp cải thiện chất lượng câu hỏi.');
```

If the component uses a different setter name, update only the string at the existing success call site and keep the submit payload unchanged.

- [ ] **Step 2: Verify no student UI regression**

Run:

```powershell
Set-Location frontend
pnpm run lint
```

Expected: PASS, or only unrelated existing warnings.

- [ ] **Step 3: Commit student copy**

```powershell
git add frontend/components/quiz/quiz-question-view.tsx
git commit -m "copy: mention mentor review after quiz report"
```

---

## Task 9: Full Verification

**Files:**
- Read: `docs/guide/setup/package-managers.md`
- Validate all changed backend and frontend files.

- [ ] **Step 1: Read package manager guide before final commands**

Run:

```powershell
Get-Content -LiteralPath docs\guide\setup\package-managers.md
```

Expected: confirms correct project commands and package manager expectations.

- [ ] **Step 2: Run targeted backend tests**

Run:

```powershell
python -m pytest tests/test_api/test_quiz_error_cases.py -q
```

Expected: PASS.

- [ ] **Step 3: Run backend lint/format commands from project guidance**

Run:

```powershell
uv run ruff format
uv run ruff check --fix
```

Expected: PASS. If `uv` is unavailable in the local shell, run `python -m ruff format` and `python -m ruff check --fix`, then record the substitution in the final summary.

- [ ] **Step 4: Run frontend lint and build**

Run:

```powershell
Set-Location frontend
pnpm run lint
pnpm run build
```

Expected: PASS. If existing unrelated warnings or build issues appear, capture the exact files/messages and do not change unrelated files.

- [ ] **Step 5: Inspect git diff for unrelated changes**

Run:

```powershell
git status --short
git diff --stat
```

Expected:
- Only files from this plan are staged or modified by the implementation.
- Existing unrelated `src/services/braintrust_observability.py` changes remain untouched.
- `.superpowers/` remains untracked and is not committed.

- [ ] **Step 6: Final commit if any verification-only fixes were needed**

If verification required small fixes, commit only those changed files:

```powershell
git add <changed-files-from-this-feature>
git commit -m "fix: stabilize quiz error case workflow"
```

---

## Acceptance Checklist

- [ ] Students still use the existing quiz-side `Báo lỗi` flow.
- [ ] `POST /quiz/report` writes local JSONL, `feedback_events`, a grouped case, and a child report.
- [ ] Multiple open reports for the same `(course_id, question_id)` reuse one case.
- [ ] A report after a case is `resolved` or `rejected` creates a new case.
- [ ] Mentor/admin/dev can list, inspect, edit, resolve, and reject cases.
- [ ] Student users cannot access mentor case list/detail/update endpoints.
- [ ] New mentor nav tab appears as `Báo lỗi quiz`.
- [ ] New tab follows the existing dashboard style: `font-be-vietnam-pro`, `font-fraunces`, white bordered cards, `btn-3d`, and existing status color accents.
- [ ] Inline editor updates question text, A/B/C/D options, correct answer, explanation, and difficulty.
- [ ] Closing or rejecting requires a resolution note.
- [ ] Hints are visibly read-only for MVP; editing `question_hints` is outside this implementation.
- [ ] Backend targeted tests pass.
- [ ] Frontend lint/build pass or only documented unrelated issues remain.
