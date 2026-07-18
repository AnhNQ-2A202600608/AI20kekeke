from __future__ import annotations

from dataclasses import dataclass
from types import SimpleNamespace
from uuid import UUID

import pytest
from fastapi import HTTPException

from src.api.adaptive_routes import get_adaptive_db
from src.api.routes import QuizReportRequest
from src.main import app
from src.services.quiz_error_cases import (
    QuizErrorQuestionUpdate,
    QuizErrorStatusUpdate,
    create_or_update_quiz_error_case,
    get_quiz_error_case_detail,
    list_quiz_error_cases,
    transition_quiz_error_case,
    update_quiz_error_question,
)

STUDENT_ID = "11111111-1111-1111-1111-111111111111"
MENTOR_ID = "22222222-2222-2222-2222-222222222222"
COURSE_ID = "33333333-3333-3333-3333-333333333333"
QUESTION_ID = "44444444-4444-4444-4444-444444444444"
OPEN_CASE_ID = "55555555-5555-5555-5555-555555555555"
CLOSED_CASE_ID = "66666666-6666-6666-6666-666666666666"
API_STUDENT_ID = "d3b07384-d113-4ec5-a58e-0f2d87e07661"
API_MENTOR_ID = "55555555-5555-5555-5555-555555555555"


@dataclass
class FakeResponse:
    data: list[dict] | dict | None


class FakeTableQuery:
    def __init__(self, client: FakeAppClient, table_name: str):
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
            "courses": [
                {
                    "id": COURSE_ID,
                    "title": "Adaptive course",
                }
            ],
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
            "users": [
                {
                    "id": STUDENT_ID,
                    "email": "student@example.com",
                },
                {
                    "id": API_STUDENT_ID,
                    "email": "api-student@example.com",
                },
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
                payload.setdefault(
                    "id",
                    OPEN_CASE_ID if self.case_seq == 1 else f"55555555-5555-5555-5555-55555555555{self.case_seq}",
                )
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


def make_report(detail="Wrong answer", error_type="wrong_answer"):
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

    create_or_update_quiz_error_case(db, make_report(detail="First report"), UUID(STUDENT_ID))
    create_or_update_quiz_error_case(db, make_report(detail="Second report"), UUID(STUDENT_ID))

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


def test_new_case_resolve_requires_resolution_note():
    db = FakeDb()
    db.app_client.tables["quiz_error_cases"].append(
        {
            "id": OPEN_CASE_ID,
            "course_id": COURSE_ID,
            "question_id": QUESTION_ID,
            "status": "new",
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


def test_new_case_can_resolve_directly_sets_resolution_fields():
    db = FakeDb()
    db.app_client.tables["quiz_error_cases"].append(
        {
            "id": OPEN_CASE_ID,
            "course_id": COURSE_ID,
            "question_id": QUESTION_ID,
            "status": "new",
            "report_count": 1,
        }
    )

    result = transition_quiz_error_case(
        db,
        OPEN_CASE_ID,
        QuizErrorStatusUpdate(status="resolved", resolution_note="Fixed without separate claim step"),
        SimpleNamespace(id=UUID(MENTOR_ID)),
    )

    case = result["case"]
    assert case["status"] == "resolved"
    assert case["resolution_note"] == "Fixed without separate claim step"
    assert case["resolved_by"] == MENTOR_ID
    assert case["resolved_at"]


def test_terminal_transition_sets_resolution_fields():
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

    result = transition_quiz_error_case(
        db,
        OPEN_CASE_ID,
        QuizErrorStatusUpdate(status="resolved", resolution_note="Fixed answer key"),
        SimpleNamespace(id=UUID(MENTOR_ID)),
    )

    case = result["case"]
    assert case["status"] == "resolved"
    assert case["resolution_note"] == "Fixed answer key"
    assert case["resolved_by"] == MENTOR_ID
    assert case["resolved_at"]


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
    assert result["case"]["status"] == "in_progress"


def test_question_update_does_not_auto_resolve_case_status():
    db = FakeDb()
    db.app_client.tables["quiz_error_cases"].append(
        {
            "id": OPEN_CASE_ID,
            "course_id": COURSE_ID,
            "question_id": QUESTION_ID,
            "status": "new",
            "report_count": 1,
        }
    )

    update_quiz_error_question(
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

    case = db.app_client.tables["quiz_error_cases"][0]
    assert case["status"] == "new"
    assert "resolution_note" not in case
    assert "resolved_at" not in case


def test_real_schema_question_update_preserves_answer_key_and_skips_label_difficulty_elo():
    db = FakeDb()
    db.app_client.tables["questions"] = [
        {
            "id": QUESTION_ID,
            "prompt": "Old real schema prompt?",
            "answer_key": {"correct": "A", "rubric": "Keep me"},
            "difficulty_elo": 1200.0,
        }
    ]
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
            question_text="Updated real prompt?",
            options={"A": "A2", "B": "B2", "C": "C2", "D": "D2"},
            correct_answer="C",
            explanation="Updated real explanation",
            difficulty="hard",
        ),
        SimpleNamespace(id=UUID(MENTOR_ID)),
    )

    answer_key = result["question"]["answer_key"]
    assert result["question"]["prompt"] == "Updated real prompt?"
    assert answer_key["rubric"] == "Keep me"
    assert answer_key["correct"] == "C"
    assert answer_key["correct_answer"] == "C"
    assert answer_key["options"]["D"] == "D2"
    assert answer_key["choices"]["A"] == "A2"
    assert db.app_client.tables["questions"][0]["difficulty_elo"] == 1200.0


def test_list_enriches_cases_and_searches_question_prompt_or_report_detail():
    db = FakeDb()
    db.app_client.tables["questions"] = [
        {
            "id": QUESTION_ID,
            "prompt": "Photosynthesis prompt needing review",
            "answer_key": {"correct": "A"},
            "difficulty_elo": 900.0,
        }
    ]
    db.app_client.tables["quiz_error_cases"].append(
        {
            "id": OPEN_CASE_ID,
            "course_id": COURSE_ID,
            "question_id": QUESTION_ID,
            "status": "new",
            "report_count": 2,
            "last_reported_at": "2026-07-01T00:00:00+00:00",
        }
    )
    db.app_client.tables["quiz_error_reports"].extend(
        [
            {
                "id": "77777777-7777-7777-7777-777777777771",
                "case_id": OPEN_CASE_ID,
                "error_type": "wrong_answer",
                "detail": "Student says chlorophyll detail is confusing",
                "created_at": "2026-07-01T00:00:01+00:00",
            },
            {
                "id": "77777777-7777-7777-7777-777777777772",
                "case_id": OPEN_CASE_ID,
                "error_type": "wrong_answer",
                "detail": "Second report",
                "created_at": "2026-07-01T00:00:02+00:00",
            },
        ]
    )

    prompt_result = list_quiz_error_cases(db, search="photosynthesis")
    detail_result = list_quiz_error_cases(db, search="chlorophyll", error_type="wrong_answer")

    item = prompt_result["items"][0]
    assert prompt_result["total"] == 1
    assert detail_result["total"] == 1
    assert item["question"]["prompt"] == "Photosynthesis prompt needing review"
    assert len(item["reports"]) == 2
    assert item["most_common_error_type"] == "wrong_answer"


def test_get_quiz_error_case_detail_returns_case_question_and_reports():
    db = FakeDb()
    db.app_client.tables["quiz_error_cases"].append(
        {
            "id": OPEN_CASE_ID,
            "course_id": COURSE_ID,
            "question_id": QUESTION_ID,
            "status": "new",
            "report_count": 1,
        }
    )
    db.app_client.tables["quiz_error_reports"].append(
        {
            "id": "77777777-7777-7777-7777-777777777771",
            "case_id": OPEN_CASE_ID,
            "error_type": "wrong_answer",
            "detail": "Wrong answer",
            "created_at": "2026-07-01T00:00:01+00:00",
        }
    )

    result = get_quiz_error_case_detail(db, OPEN_CASE_ID)

    assert result["case"]["id"] == OPEN_CASE_ID
    assert result["question"]["id"] == QUESTION_ID
    assert result["reports"][0]["case_id"] == OPEN_CASE_ID


def test_real_schema_report_snapshot_uses_answer_key_correct():
    db = FakeDb()
    db.app_client.tables["questions"] = [
        {
            "id": QUESTION_ID,
            "prompt": "Real schema prompt?",
            "answer_key": {"correct": "D", "options": {"A": "A1", "B": "B1", "C": "C1", "D": "D1"}},
            "difficulty_elo": 850.0,
        }
    ]

    create_or_update_quiz_error_case(db, make_report(), UUID(STUDENT_ID))

    report = db.app_client.tables["quiz_error_reports"][0]
    assert report["question_snapshot"]["question_text"] == "Real schema prompt?"
    assert report["question_snapshot"]["correct_answer"] == "D"


@pytest.mark.asyncio
async def test_student_cannot_list_mentor_quiz_error_cases(client):
    db = FakeDb()
    app.dependency_overrides[get_adaptive_db] = lambda: db
    try:
        response = await client.get(
            "/api/v1/quiz/error-cases",
            headers={"Authorization": f"Bearer {API_STUDENT_ID}"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_mentor_can_list_quiz_error_cases(client):
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
    db.app_client.tables["quiz_error_reports"].append(
        {
            "id": "77777777-7777-7777-7777-777777777771",
            "case_id": OPEN_CASE_ID,
            "error_type": "wrong_answer",
            "detail": "Wrong answer",
            "created_at": "2026-07-01T00:00:01+00:00",
        }
    )
    app.dependency_overrides[get_adaptive_db] = lambda: db
    try:
        response = await client.get(
            "/api/v1/quiz/error-cases",
            headers={"Authorization": f"Bearer {API_MENTOR_ID}"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["id"] == OPEN_CASE_ID
    assert payload["items"][0]["question"]["id"] == QUESTION_ID


@pytest.mark.asyncio
async def test_student_quiz_report_api_creates_grouped_case_and_returns_case_id(client, monkeypatch, tmp_path):
    db = FakeDb()
    app.dependency_overrides[get_adaptive_db] = lambda: db
    monkeypatch.setattr("src.api.adaptive_routes.get_adaptive_db", lambda: db)
    monkeypatch.chdir(tmp_path)
    try:
        response = await client.post(
            "/api/v1/quiz/report",
            headers={"Authorization": f"Bearer {API_STUDENT_ID}"},
            json={
                "question_id": QUESTION_ID,
                "question_text": "Question shown to student?",
                "selected_option": "B",
                "error_type": "wrong_answer",
                "detail": "Answer key looks wrong",
                "student_id": STUDENT_ID,
                "course_id": COURSE_ID,
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "success"
    assert payload["case_id"] == OPEN_CASE_ID
    assert db.app_client.tables["quiz_error_reports"][0]["student_id"] == API_STUDENT_ID
    assert db.app_client.tables["feedback_events"][0]["user_id"] == API_STUDENT_ID


@pytest.mark.asyncio
async def test_student_quiz_report_api_accepts_local_static_question_without_case(client, monkeypatch, tmp_path):
    db = FakeDb()
    app.dependency_overrides[get_adaptive_db] = lambda: db
    monkeypatch.setattr("src.api.adaptive_routes.get_adaptive_db", lambda: db)
    monkeypatch.chdir(tmp_path)
    try:
        response = await client.post(
            "/api/v1/quiz/report",
            headers={"Authorization": f"Bearer {API_STUDENT_ID}"},
            json={
                "question_id": "1",
                "question_text": "Local fallback question shown to student?",
                "selected_option": "B",
                "error_type": "wrong_answer",
                "detail": "Answer key looks wrong",
                "student_id": STUDENT_ID,
                "course_id": COURSE_ID,
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "success"
    assert payload["case_id"] is None
    assert (tmp_path / "outputs" / "quiz_reports.jsonl").exists()
    assert len(db.app_client.tables["quiz_error_cases"]) == 0
    assert len(db.app_client.tables["quiz_error_reports"]) == 0
    assert db.app_client.tables["feedback_events"][0]["target_id"] == "1"


@pytest.mark.asyncio
async def test_student_quiz_report_api_returns_success_when_case_service_cannot_create_case(
    client, monkeypatch, tmp_path
):
    db = FakeDb()

    def fail_case_service(*_args, **_kwargs):
        raise HTTPException(status_code=404, detail="Question not found.")

    app.dependency_overrides[get_adaptive_db] = lambda: db
    monkeypatch.setattr("src.api.adaptive_routes.get_adaptive_db", lambda: db)
    monkeypatch.setattr("src.api.routes.create_or_update_quiz_error_case", fail_case_service)
    monkeypatch.chdir(tmp_path)
    try:
        response = await client.post(
            "/api/v1/quiz/report",
            headers={"Authorization": f"Bearer {API_STUDENT_ID}"},
            json={
                "question_id": QUESTION_ID,
                "question_text": "Question shown to student?",
                "selected_option": "B",
                "error_type": "wrong_answer",
                "detail": "Answer key looks wrong",
                "student_id": STUDENT_ID,
                "course_id": COURSE_ID,
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "success"
    assert payload["case_id"] is None
    assert (tmp_path / "outputs" / "quiz_reports.jsonl").exists()
    assert db.app_client.tables["feedback_events"][0]["user_id"] == API_STUDENT_ID


@pytest.mark.asyncio
async def test_student_quiz_report_api_returns_success_when_student_record_is_missing(client, monkeypatch, tmp_path):
    db = FakeDb()
    db.app_client.tables["users"] = []
    app.dependency_overrides[get_adaptive_db] = lambda: db
    monkeypatch.setattr("src.api.adaptive_routes.get_adaptive_db", lambda: db)
    monkeypatch.chdir(tmp_path)
    try:
        response = await client.post(
            "/api/v1/quiz/report",
            headers={"Authorization": f"Bearer {API_STUDENT_ID}"},
            json={
                "question_id": QUESTION_ID,
                "question_text": "Question shown to student?",
                "selected_option": "B",
                "error_type": "wrong_answer",
                "detail": "Answer key looks wrong",
                "student_id": STUDENT_ID,
                "course_id": COURSE_ID,
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "success"
    assert payload["case_id"] is None
    assert (tmp_path / "outputs" / "quiz_reports.jsonl").exists()
    assert len(db.app_client.tables["quiz_error_cases"]) == 0
    assert len(db.app_client.tables["quiz_error_reports"]) == 0
