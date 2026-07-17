from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime

import pytest

from src.api.adaptive_routes import AuthenticatedUser, get_adaptive_db, get_current_user
from src.main import app

STUDENT_ID = "d3b07384-d113-4ec5-a58e-0f2d87e07661"
MENTOR_ID = "55555555-5555-5555-5555-555555555555"
COURSE_ID = "00000000-0000-0000-0000-000000000001"
MESSAGE_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
LIKED_MESSAGE_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"


@dataclass
class FakeResponse:
    data: list[dict] | None


class FakeTableQuery:
    def __init__(self, client: FakeAppClient, table_name: str):
        self.client = client
        self.table_name = table_name
        self.operation = "select"
        self.payload = None
        self.filters: list[tuple[str, object]] = []
        self.in_filters: list[tuple[str, list[object]]] = []
        self.order_by: tuple[str, bool] | None = None

    def select(self, *_args, **_kwargs):
        self.operation = "select"
        return self

    def insert(self, payload):
        self.operation = "insert"
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

    def execute(self):
        return self.client.execute(self)


class FakeAppClient:
    def __init__(self):
        self.tables = {
            "users": [
                {"id": STUDENT_ID, "full_name": "Nguyen Van Student", "email": "student@example.com"},
                {"id": MENTOR_ID, "full_name": "Giang Vien Mentor", "email": "mentor@example.com"},
            ],
            "courses": [{"id": COURSE_ID, "title": "Adaptive course"}],
            "feedback_events": [],
            "learning_signals": [],
        }
        self.feedback_seq = 0
        self.signal_seq = 0

    def table(self, table_name):
        return FakeTableQuery(self, table_name)

    def execute(self, query: FakeTableQuery):
        rows = self.tables[query.table_name]
        if query.operation == "insert":
            payload = dict(query.payload)
            timestamp = datetime.now(UTC).isoformat()
            if query.table_name == "feedback_events":
                self.feedback_seq += 1
                payload.setdefault("id", f"feed-{self.feedback_seq}")
                payload.setdefault("created_at", timestamp)
            if query.table_name == "learning_signals":
                self.signal_seq += 1
                payload.setdefault("id", f"signal-{self.signal_seq}")
                payload.setdefault("created_at", timestamp)
            rows.append(payload)
            return FakeResponse([payload])

        matched = [
            row
            for row in rows
            if all(str(row.get(key)) == str(value) for key, value in query.filters)
            and all(row.get(key) in values for key, values in query.in_filters)
        ]
        if query.order_by:
            key, desc = query.order_by
            matched = sorted(matched, key=lambda row: str(row.get(key) or ""), reverse=desc)
        return FakeResponse(matched)


class FakeDb:
    def __init__(self):
        self._stub_mode = False
        self.app_client = FakeAppClient()


@pytest.mark.asyncio
async def test_post_feedback_records_ai_response_feedback(client, monkeypatch, tmp_path):
    db = FakeDb()
    app.dependency_overrides[get_adaptive_db] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id=STUDENT_ID,
        email="student@example.com",
        role="student",
    )
    monkeypatch.setattr("src.api.adaptive_routes.get_adaptive_db", lambda: db)
    monkeypatch.chdir(tmp_path)
    try:
        response = await client.post(
            "/api/v1/feedback",
            json={
                "target_type": "message",
                "target_id": MESSAGE_ID,
                "feedback_type": "bad_citation",
                "course_id": COURSE_ID,
                "comment": "Citation seems off",
                "metadata": {
                    "prompt_text": "Metadata filtering la gi?",
                    "response_text": "AI answer",
                    "citations": [{"source": "Day 08", "page": 14}],
                },
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "success"
    assert db.app_client.tables["feedback_events"][0]["target_id"] == MESSAGE_ID
    assert db.app_client.tables["learning_signals"][0]["signal_type"] == "feedback"
    assert (tmp_path / "outputs" / "ai_response_feedback.jsonl").exists()


@pytest.mark.asyncio
async def test_post_feedback_accepts_incorrect_ai_response_feedback(client, monkeypatch, tmp_path):
    db = FakeDb()
    app.dependency_overrides[get_adaptive_db] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id=STUDENT_ID,
        email="student@example.com",
        role="student",
    )
    monkeypatch.setattr("src.api.adaptive_routes.get_adaptive_db", lambda: db)
    monkeypatch.chdir(tmp_path)
    try:
        response = await client.post(
            "/api/v1/feedback",
            json={
                "target_type": "message",
                "target_id": MESSAGE_ID,
                "feedback_type": "incorrect",
                "course_id": COURSE_ID,
                "comment": "Câu trả lời sai kiến thức.",
                "metadata": {
                    "issue_type": "incorrect",
                    "issue_label": "Sai kiến thức",
                    "prompt_text": "Temperature cao ảnh hưởng gì?",
                    "response_text": "AI answer",
                },
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["feedback_type"] == "incorrect"
    assert db.app_client.tables["feedback_events"][0]["feedback_type"] == "incorrect"
    assert db.app_client.tables["learning_signals"][0]["signal_value"]["feedback_type"] == "incorrect"


@pytest.mark.asyncio
async def test_mentor_can_list_grouped_feedback_review_items(client, monkeypatch):
    db = FakeDb()
    db.app_client.tables["feedback_events"].extend(
        [
            {
                "id": "feed-1",
                "user_id": STUDENT_ID,
                "course_id": COURSE_ID,
                "target_type": "message",
                "target_id": MESSAGE_ID,
                "feedback_type": "unhelpful",
                "comment": '{"comment":"Chua ro","metadata":{"prompt_text":"Prompt 1","response_text":"Answer 1"}}',
                "created_at": "2026-07-03T10:00:00+07:00",
            },
            {
                "id": "feed-2",
                "user_id": STUDENT_ID,
                "course_id": COURSE_ID,
                "target_type": "message",
                "target_id": MESSAGE_ID,
                "feedback_type": "bad_citation",
                "comment": '{"comment":"Sai citation","metadata":{"prompt_text":"Prompt 1","response_text":"Answer 1","citations":[{"source":"Day 08","page":14}]}}',
                "created_at": "2026-07-03T10:05:00+07:00",
            },
            {
                "id": "feed-3",
                "user_id": STUDENT_ID,
                "course_id": COURSE_ID,
                "target_type": "message",
                "target_id": LIKED_MESSAGE_ID,
                "feedback_type": "helpful",
                "comment": '{"comment":"","metadata":{"prompt_text":"Prompt 2","response_text":"Answer 2"}}',
                "created_at": "2026-07-03T10:07:00+07:00",
            },
        ]
    )
    db.app_client.tables["learning_signals"].append(
        {
            "id": "signal-1",
            "student_id": MENTOR_ID,
            "course_id": COURSE_ID,
            "signal_type": "review",
            "signal_value": {
                "target_id": MESSAGE_ID,
                "review_status": "resolved",
                "note": "Da xu ly prompt",
            },
            "created_at": "2026-07-03T10:10:00+07:00",
        }
    )

    app.dependency_overrides[get_adaptive_db] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id=MENTOR_ID,
        email="mentor@example.com",
        role="mentor",
    )
    monkeypatch.setattr("src.api.adaptive_routes.get_adaptive_db", lambda: db)
    try:
        response = await client.get(f"/api/v1/feedback/review-items?course_id={COURSE_ID}")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["counts"]["resolved"] == 1
    assert payload["counts"]["like"] == 1
    assert payload["counts"]["dislike"] == 2
    assert payload["counts"]["like_rate"] == 33
    disliked_item = next(item for item in payload["items"] if item["target_id"] == MESSAGE_ID)
    liked_item = next(item for item in payload["items"] if item["target_id"] == LIKED_MESSAGE_ID)
    assert disliked_item["report_count"] == 2
    assert disliked_item["status"] == "resolved"
    assert disliked_item["sentiment"] == "dislike"
    assert liked_item["sentiment"] == "like"


@pytest.mark.asyncio
async def test_mentor_can_update_feedback_review_status(client, monkeypatch):
    db = FakeDb()
    db.app_client.tables["feedback_events"].append(
        {
            "id": "feed-1",
            "user_id": STUDENT_ID,
            "course_id": COURSE_ID,
            "target_type": "message",
            "target_id": MESSAGE_ID,
            "feedback_type": "unhelpful",
            "comment": '{"comment":"Chua ro","metadata":{"prompt_text":"Prompt 1","response_text":"Answer 1"}}',
            "created_at": "2026-07-03T10:00:00+07:00",
        }
    )

    app.dependency_overrides[get_adaptive_db] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id=MENTOR_ID,
        email="mentor@example.com",
        role="mentor",
    )
    monkeypatch.setattr("src.api.adaptive_routes.get_adaptive_db", lambda: db)
    try:
        response = await client.patch(
            f"/api/v1/feedback/review-items/{MESSAGE_ID}",
            json={
                "course_id": COURSE_ID,
                "review_status": "rejected",
                "note": "Khong phai loi can xu ly",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["item"]["status"] == "rejected"
    assert db.app_client.tables["learning_signals"][0]["signal_value"]["review_status"] == "rejected"
