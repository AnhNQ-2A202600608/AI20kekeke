from __future__ import annotations

from dataclasses import dataclass
from types import SimpleNamespace
from uuid import UUID

import pytest
from fastapi import HTTPException

from src.api.adaptive_routes import get_adaptive_db
from src.main import app
from src.services.quiz_review import (
    HintPayload,
    QuizReviewContentUpdate,
    get_review_question,
    list_review_questions,
    update_review_question_content,
    update_review_question_status,
)

MENTOR_ID = "22222222-2222-2222-2222-222222222222"
COURSE_ID = "33333333-3333-3333-3333-333333333333"
QUESTION_ID = "44444444-4444-4444-4444-444444444444"
CONCEPT_ID = "c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1"
API_MENTOR_ID = "55555555-5555-5555-5555-555555555555"
API_STUDENT_ID = "d3b07384-d113-4ec5-a58e-0f2d87e07661"


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
        self.ilike_filters: list[tuple[str, str]] = []
        self.limit_count: int | None = None
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

    def upsert(self, payload):
        self.operation = "upsert"
        self.payload = payload
        return self

    def delete(self):
        self.operation = "delete"
        return self

    def eq(self, key, value):
        self.filters.append((key, value))
        return self

    def in_(self, key, values):
        self.in_filters.append((key, list(values)))
        return self

    def ilike(self, key, pattern):
        self.ilike_filters.append((key, pattern))
        return self

    def order(self, key, desc=False):
        self.order_by = (key, desc)
        return self

    def limit(self, count):
        self.limit_count = count
        return self

    def execute(self):
        return self.client.execute(self)


class FakeAppClient:
    def __init__(self):
        self.tables = {
            "questions": [
                {
                    "id": QUESTION_ID,
                    "course_id": COURSE_ID,
                    "concept_id": CONCEPT_ID,
                    "prompt": "Trong hệ RAG production, bước nào giúp giới hạn tài liệu truy hồi?",
                    "answer_key": {
                        "options": {
                            "A": "Tăng nhiệt độ của LLM",
                            "B": "Metadata filtering trước khi retrieval",
                            "C": "Sử dụng prompt dài hơn",
                            "D": "Tắt chunking",
                        },
                        "correct": "B",
                        "explanation": "Metadata filtering giúp co hẹp không gian tìm kiếm",
                    },
                    "difficulty_elo": 1200.0,
                    "calibration_status": "draft",
                    "source_document_name": "Day 08 - Production RAG.pdf",
                    "rejection_reason": None,
                    "created_at": "2026-07-08T00:00:00Z",
                }
            ],
            "question_hints": [
                {
                    "question_id": QUESTION_ID,
                    "level": 1,
                    "hint_text": "Gợi ý tiền xử lý",
                },
                {
                    "question_id": QUESTION_ID,
                    "level": 2,
                    "hint_text": "Gợi ý metadata",
                },
            ],
            "question_concepts": [
                {
                    "question_id": QUESTION_ID,
                    "concept_id": CONCEPT_ID,
                }
            ],
            "concepts": [
                {
                    "id": CONCEPT_ID,
                    "code": "d8-rag-pipeline",
                    "name": "RAG Pipeline",
                    "course_id": COURSE_ID,
                }
            ],
            "users": [
                {
                    "id": API_MENTOR_ID,
                    "email": "mentor@example.com",
                }
            ],
        }

    def table(self, table_name):
        return FakeTableQuery(self, table_name)

    def execute(self, query: FakeTableQuery):
        rows = self.tables.get(query.table_name, [])

        if query.operation == "insert":
            payloads = query.payload if isinstance(query.payload, list) else [query.payload]
            inserted = []
            for p in payloads:
                row = dict(p)
                rows.append(row)
                inserted.append(row)
            return FakeResponse(inserted)

        if query.operation == "upsert":
            payloads = query.payload if isinstance(query.payload, list) else [query.payload]
            upserted = []
            for p in payloads:
                row = dict(p)
                # Find if conflict exists (by primary key or unique)
                conflict = False
                if query.table_name == "question_hints":
                    for existing in rows:
                        if (
                            existing.get("question_id") == row.get("question_id")
                            and existing.get("level") == row.get("level")
                        ):
                            existing.update(row)
                            upserted.append(existing)
                            conflict = True
                            break
                if not conflict:
                    rows.append(row)
                    upserted.append(row)
            return FakeResponse(upserted)

        if query.operation == "delete":
            # Filter rows that match deletion criteria
            matched_indices = []
            for idx, row in enumerate(rows):
                match = True
                for k, v in query.filters:
                    if str(row.get(k)) != str(v):
                        match = False
                        break
                if match:
                    matched_indices.append(idx)

            deleted_rows = []
            for idx in reversed(matched_indices):
                deleted_rows.append(rows.pop(idx))
            return FakeResponse(deleted_rows)

        # Filters
        matched = []
        for row in rows:
            match = True
            # eq filters
            for k, v in query.filters:
                if str(row.get(k)) != str(v):
                    match = False
                    break
            # in_ filters
            for k, values in query.in_filters:
                if row.get(k) not in values:
                    match = False
                    break
            # ilike filters
            for k, pattern in query.ilike_filters:
                val = str(row.get(k) or "").lower()
                pat = pattern.replace("%", "").lower()
                if pat not in val:
                    match = False
                    break
            if match:
                matched.append(row)

        if query.operation == "update":
            for row in matched:
                row.update(query.payload)
            return FakeResponse(matched)

        if query.order_by:
            key, desc = query.order_by
            matched = sorted(matched, key=lambda r: str(r.get(key) or ""), reverse=desc)

        if query.limit_count is not None:
            matched = matched[: query.limit_count]

        return FakeResponse(matched)


class FakeDb:
    def __init__(self):
        self._stub_mode = False
        self.app_client = FakeAppClient()


# ============================================================================
# Unit Tests for Service Layer
# ============================================================================


def test_list_review_questions_returns_paginated_normalized_items():
    db = FakeDb()
    result = list_review_questions(db, status="draft", limit=10)

    assert result["total"] == 1
    assert len(result["items"]) == 1
    q = result["items"][0]
    assert q["id"] == QUESTION_ID
    assert q["question"] == "Trong hệ RAG production, bước nào giúp giới hạn tài liệu truy hồi?"
    assert q["answer"] == "B"
    assert q["options"]["B"] == "Metadata filtering trước khi retrieval"
    assert q["difficulty"] == "bình thường"
    assert q["published_status"] == "draft"
    assert len(q["hints"]) == 3  # Fill empty for level 3 (deep)
    assert q["hints"][0]["content"] == "Gợi ý tiền xử lý"
    assert q["hints"][2]["content"] == ""  # Deep is empty
    assert q["concepts"] == ["d8-rag-pipeline"]


def test_list_review_questions_with_concept_filter():
    db = FakeDb()

    # Success code filter
    res_success = list_review_questions(db, concept_code="d8-rag-pipeline")
    assert res_success["total"] == 1

    # Non-exist code filter
    res_empty = list_review_questions(db, concept_code="non-existent")
    assert res_empty["total"] == 0
    assert len(res_empty["items"]) == 0


def test_list_review_questions_with_search_filter():
    db = FakeDb()

    # Match search
    res = list_review_questions(db, search="RAG production")
    assert res["total"] == 1

    # Unmatched search
    res_empty = list_review_questions(db, search="Photosynthesis")
    assert res_empty["total"] == 0


def test_get_review_question_detail():
    db = FakeDb()
    q = get_review_question(db, QUESTION_ID)

    assert q["id"] == QUESTION_ID
    assert q["setId"] == "d8-rag-pipeline"


def test_get_review_question_not_found():
    db = FakeDb()
    with pytest.raises(HTTPException) as exc:
        get_review_question(db, "non-existent-uuid")
    assert exc.value.status_code == 404


def test_update_review_question_content():
    db = FakeDb()
    payload = QuizReviewContentUpdate(
        question_text="New updated prompt text?",
        options={"A": "Opt A", "B": "Opt B", "C": "Opt C", "D": "Opt D"},
        correct_answer="C",
        explanation="New explanation detail",
        difficulty="dễ",
        hints=[
            HintPayload(level="light", content="New light hint"),
            HintPayload(level="medium", content="New medium hint"),
            HintPayload(level="deep", content="New deep hint"),
        ],
        concept_codes=["d8-rag-pipeline"],
    )

    mentor = SimpleNamespace(id=UUID(MENTOR_ID))
    result = update_review_question_content(db, QUESTION_ID, payload, mentor)

    assert result["question"] == "New updated prompt text?"
    assert result["answer"] == "C"
    assert result["difficulty"] == "dễ"
    assert db.app_client.tables["questions"][0]["difficulty_elo"] == 1050.0

    # Verify hints update
    hints = db.app_client.tables["question_hints"]
    assert len(hints) == 3
    light_hint = next(h for h in hints if h["level"] == 1)
    assert light_hint["hint_text"] == "New light hint"


def test_update_review_question_status_to_published():
    db = FakeDb()
    mentor = SimpleNamespace(id=UUID(MENTOR_ID))

    result = update_review_question_status(db, QUESTION_ID, "published", None, mentor)
    assert result["published_status"] == "published"
    assert db.app_client.tables["questions"][0]["calibration_status"] == "published"
    assert db.app_client.tables["questions"][0]["rejection_reason"] is None


def test_update_review_question_status_to_rejected_requires_reason():
    db = FakeDb()
    mentor = SimpleNamespace(id=UUID(MENTOR_ID))

    # Reject without reason should throw 422
    with pytest.raises(HTTPException) as exc:
        update_review_question_status(db, QUESTION_ID, "rejected", "", mentor)
    assert exc.value.status_code == 422

    # Reject with reason
    result = update_review_question_status(db, QUESTION_ID, "rejected", "Too easy or wrong slide context", mentor)
    assert result["published_status"] == "rejected"
    assert db.app_client.tables["questions"][0]["rejection_reason"] == "Too easy or wrong slide context"


# ============================================================================
# API Endpoints Integration Tests (Simulating Router calls)
# ============================================================================


@pytest.mark.asyncio
async def test_student_cannot_list_mentor_quiz_review_queue(client):
    db = FakeDb()
    app.dependency_overrides[get_adaptive_db] = lambda: db
    try:
        response = await client.get(
            "/api/v1/quiz/review",
            headers={"Authorization": f"Bearer {API_STUDENT_ID}"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_mentor_can_list_mentor_quiz_review_queue(client):
    db = FakeDb()
    app.dependency_overrides[get_adaptive_db] = lambda: db
    try:
        response = await client.get(
            "/api/v1/quiz/review",
            headers={"Authorization": f"Bearer {API_MENTOR_ID}"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["id"] == QUESTION_ID
