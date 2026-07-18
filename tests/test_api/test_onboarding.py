from __future__ import annotations

from copy import deepcopy
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from src.api.adaptive_routes import get_adaptive_db
from src.api.onboarding_routes import _STUB_ONBOARDING_PROFILES
from src.main import app

STUDENT_ID = "d3b07384-d113-4ec5-a58e-0f2d87e07661"
AUTH_HEADERS = {"Authorization": f"Bearer fake-jwt-token-{STUDENT_ID}"}
COURSE_ID = "00000000-0000-0000-0000-000000000001"


def context_payload() -> dict:
    return {
        "weekly_practice_minutes": 180,
        "learning_goal": "lab",
        "strength_concept_ids": [],
        "weakness_concept_ids": [],
    }


def question_row(index: int, concept_code: str, correct: str = "A", diagnostic_metadata: bool = True) -> dict:
    question_id = f"10000000-0000-0000-0000-{200 + index:012d}"
    concept_id = f"20000000-0000-0000-0000-{200 + index:012d}"
    answer_key = {
        "options": {"A": "Correct option", "B": "Distractor option", "C": "Another distractor"},
        "correct": correct,
        "explanation": "Server-side explanation",
    }
    if diagnostic_metadata:
        answer_key["diagnostic"] = {
            "enabled": True,
            "bloom_level": "apply",
            "encouragement": {
                "correct": "Good signal.",
                "incorrect": "Useful placement signal.",
            },
            "concept_weights": {concept_code: 1.0},
        }
    return {
        "id": question_id,
        "course_id": COURSE_ID,
        "concept_id": concept_id,
        "type": "mcq",
        "prompt": f"Diagnostic question {index}",
        "answer_key": answer_key,
        "difficulty_elo": 1100 + index * 40,
        "calibration_status": "published",
        "attempt_count": 0,
        "avg_response_time_ms": 30000,
        "_concept_code": concept_code,
    }


def question_bank() -> list[dict]:
    codes = [
        "d1-ai-llm-foundations",
        "d4-prompt-engineering",
        "d4-tool-calling",
        "d7-embedding-vector",
        "d8-rag-pipeline",
        "d7-embedding-vector",
        "d14-ai-evaluation",
        "d10-data-pipeline-observability",
    ]
    return [question_row(index + 1, code, diagnostic_metadata=index % 2 == 0) for index, code in enumerate(codes)]


def larger_question_bank(size: int = 20) -> list[dict]:
    codes = [
        "d1-ai-llm-foundations",
        "d4-prompt-engineering",
        "d4-tool-calling",
        "d7-embedding-vector",
        "d8-rag-pipeline",
        "d14-ai-evaluation",
        "d10-data-pipeline-observability",
    ]
    return [question_row(index + 1, codes[index % len(codes)]) for index in range(size)]


def branching_question_bank() -> list[dict]:
    rows = [
        question_row(1, "d1-ai-llm-foundations"),
        question_row(2, "d1-ai-llm-foundations"),
        question_row(3, "d1-ai-llm-foundations"),
        question_row(4, "d1-ai-llm-foundations"),
        question_row(5, "d1-ai-llm-foundations"),
    ]
    difficulties = [1200, 1080, 1320, 1140, 1260]
    for row, difficulty in zip(rows, difficulties, strict=True):
        row["difficulty_elo"] = difficulty
    return rows


class FakeQuery:
    def __init__(self, db: FakeAppClient, table_name: str, operation: str = "select", payload=None):
        self.db = db
        self.table_name = table_name
        self.operation = operation
        self.payload = payload
        self.filters: dict[str, object] = {}
        self.in_filters: dict[str, list[object]] = {}

    def select(self, *_args, **_kwargs):
        self.operation = "select"
        return self

    def eq(self, column: str, value):
        self.filters[column] = value
        return self

    def in_(self, column: str, values):
        self.in_filters[column] = list(values)
        return self

    def order(self, *_args, **_kwargs):
        return self

    def limit(self, *_args, **_kwargs):
        return self

    def upsert(self, payload, **_kwargs):
        self.operation = "upsert"
        self.payload = payload
        return self

    def execute(self):
        if self.operation == "upsert" and self.table_name == "onboarding_diagnostic_sessions":
            self.db.sessions[self.payload["id"]] = deepcopy(self.payload)
            return SimpleNamespace(data=[self.payload])

        if self.table_name == "questions":
            rows = deepcopy(self.db.questions)
        elif self.table_name == "concepts":
            rows = [{"id": row["concept_id"], "code": row["_concept_code"]} for row in self.db.questions]
        elif self.table_name == "question_concepts":
            rows = [{"question_id": row["id"], "concept_id": row["concept_id"]} for row in self.db.questions]
        elif self.table_name == "onboarding_profiles":
            rows = list(self.db.profiles.values())
        elif self.table_name == "onboarding_diagnostic_sessions":
            rows = list(self.db.sessions.values())
        else:
            rows = []

        for column, value in self.filters.items():
            rows = [row for row in rows if str(row.get(column)) == str(value)]
        for column, values in self.in_filters.items():
            allowed = {str(value) for value in values}
            rows = [row for row in rows if str(row.get(column)) in allowed]

        return SimpleNamespace(data=rows)


class FakeRpc:
    def __init__(self, db: FakeAppClient, name: str, payload: dict):
        self.db = db
        self.name = name
        self.payload = payload

    def execute(self):
        if self.name == "complete_onboarding_diagnostic":
            profile = deepcopy(self.payload["p_profile"])
            self.db.profiles[profile["student_id"]] = profile
            return SimpleNamespace(data={"profile_id": profile["id"]})
        return SimpleNamespace(data={})


class FakeAppClient:
    def __init__(self, questions: list[dict] | None = None):
        self.questions = questions if questions is not None else question_bank()
        self.sessions: dict[str, dict] = {}
        self.profiles: dict[str, dict] = {}

    def table(self, table_name: str):
        return FakeQuery(self, table_name)

    def rpc(self, name: str, payload: dict):
        return FakeRpc(self, name, payload)


@pytest.fixture
def fake_db():
    db = MagicMock()
    db._stub_mode = False
    db.app_client = FakeAppClient()
    return db


@pytest.mark.asyncio
async def test_onboarding_status_incomplete(client, fake_db):
    _STUB_ONBOARDING_PROFILES.clear()
    app.dependency_overrides[get_adaptive_db] = lambda: fake_db
    try:
        response = await client.get("/api/v1/onboarding/status", headers=AUTH_HEADERS)
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["completed"] is False
    assert response.json()["source"] == "database"


@pytest.mark.asyncio
async def test_onboarding_status_bypasses_non_student_roles(client, fake_db):
    app.dependency_overrides[get_adaptive_db] = lambda: fake_db
    try:
        response = await client.get(
            "/api/v1/onboarding/status",
            headers={"Authorization": "Bearer fake-jwt-token-77777777-7777-7777-7777-777777777777"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["completed"] is True
    assert response.json()["source"] == "role_bypass"


@pytest.mark.asyncio
async def test_onboarding_question_bank_session_complete_then_status(client, fake_db):
    app.dependency_overrides[get_adaptive_db] = lambda: fake_db
    try:
        start_response = await client.post(
            "/api/v1/onboarding/diagnostic/start",
            json=context_payload(),
            headers=AUTH_HEADERS,
        )
        assert start_response.status_code == 200
        session = start_response.json()
        assert session["current_question"]["id"]
        assert "correct" not in session["current_question"]["options"][0]

        answer_response = None
        for _ in range(5):
            current_question = session["current_question"]
            answer_response = await client.post(
                "/api/v1/onboarding/diagnostic/answer",
                json={
                    "session_id": session["session_id"],
                    "question_id": current_question["id"],
                    "selected_option_id": "A",
                },
                headers=AUTH_HEADERS,
            )
            assert answer_response.status_code == 200
            session = answer_response.json()

        assert answer_response is not None
        data = answer_response.json()
        assert data["can_complete"] is True
        assert data["summary"]["diagnostic_total"] == 5
        assert data["summary"]["seeded_concepts"]

        complete_response = await client.post(
            "/api/v1/onboarding/complete",
            json={**context_payload(), "session_id": session["session_id"]},
            headers=AUTH_HEADERS,
        )
        status_response = await client.get("/api/v1/onboarding/status", headers=AUTH_HEADERS)
    finally:
        app.dependency_overrides.clear()

    assert complete_response.status_code == 200
    complete_data = complete_response.json()
    assert complete_data["completed"] is True
    assert complete_data["summary"]["diagnostic_total"] == 5
    assert all("bkt_mastery_probability" in concept for concept in complete_data["summary"]["seeded_concepts"])
    assert fake_db.update_question_calibration.call_count == 5

    assert status_response.status_code == 200
    assert status_response.json()["completed"] is True
    assert status_response.json()["summary"]["weekly_practice_minutes"] == 180


@pytest.mark.asyncio
async def test_onboarding_rejects_no_question_bank(client):
    db = MagicMock()
    db._stub_mode = False
    db.app_client = FakeAppClient(questions=question_bank()[:4])
    app.dependency_overrides[get_adaptive_db] = lambda: db
    try:
        response = await client.post(
            "/api/v1/onboarding/diagnostic/start", json=context_payload(), headers=AUTH_HEADERS
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "onboarding_question_bank_too_small"


@pytest.mark.asyncio
async def test_onboarding_respects_selected_diagnostic_target_count(client):
    db = MagicMock()
    db._stub_mode = False
    db.app_client = FakeAppClient(questions=larger_question_bank(20))
    app.dependency_overrides[get_adaptive_db] = lambda: db
    try:
        start_response = await client.post(
            "/api/v1/onboarding/diagnostic/start",
            json={**context_payload(), "target_question_count": 15},
            headers=AUTH_HEADERS,
        )
        assert start_response.status_code == 200
        session = start_response.json()
        assert session["max_count"] == 15

        for answer_index in range(14):
            current_question = session["current_question"]
            answer_response = await client.post(
                "/api/v1/onboarding/diagnostic/answer",
                json={
                    "session_id": session["session_id"],
                    "question_id": current_question["id"],
                    "selected_option_id": "A" if answer_index % 2 == 0 else "B",
                },
                headers=AUTH_HEADERS,
            )
            assert answer_response.status_code == 200
            session = answer_response.json()
            if answer_index < 13:
                assert session["can_continue"] is True

        final_question = session["current_question"]
        final_response = await client.post(
            "/api/v1/onboarding/diagnostic/answer",
            json={
                "session_id": session["session_id"],
                "question_id": final_question["id"],
                "selected_option_id": "A",
            },
            headers=AUTH_HEADERS,
        )
    finally:
        app.dependency_overrides.clear()

    assert final_response.status_code == 200
    final_data = final_response.json()
    assert final_data["answered_count"] == 15
    assert final_data["max_count"] == 15
    assert final_data["can_complete"] is True
    assert final_data["can_continue"] is False
    assert final_data["summary"]["target_question_count"] == 15
    assert final_data["summary"]["diagnostic_total"] == 15


@pytest.mark.asyncio
async def test_onboarding_rejects_replay_and_forged_correct_flag(client, fake_db):
    app.dependency_overrides[get_adaptive_db] = lambda: fake_db
    try:
        start_response = await client.post(
            "/api/v1/onboarding/diagnostic/start",
            json=context_payload(),
            headers=AUTH_HEADERS,
        )
        session = start_response.json()
        question = session["current_question"]
        first = await client.post(
            "/api/v1/onboarding/diagnostic/answer",
            json={
                "session_id": session["session_id"],
                "question_id": question["id"],
                "selected_option_id": "B",
                "correct": True,
            },
            headers=AUTH_HEADERS,
        )
        replay = await client.post(
            "/api/v1/onboarding/diagnostic/answer",
            json={
                "session_id": session["session_id"],
                "question_id": question["id"],
                "selected_option_id": "A",
            },
            headers=AUTH_HEADERS,
        )
    finally:
        app.dependency_overrides.clear()

    assert first.status_code == 200
    assert first.json()["feedback"]["correct"] is False
    assert replay.status_code == 409


@pytest.mark.asyncio
async def test_onboarding_next_question_branches_by_answer_correctness(client):
    db = MagicMock()
    db._stub_mode = False
    db.app_client = FakeAppClient(questions=branching_question_bank())
    app.dependency_overrides[get_adaptive_db] = lambda: db
    try:
        correct_start = await client.post(
            "/api/v1/onboarding/diagnostic/start",
            json=context_payload(),
            headers=AUTH_HEADERS,
        )
        correct_session = correct_start.json()
        first_difficulty = correct_session["current_question"]["difficulty_elo"]
        correct_answer = await client.post(
            "/api/v1/onboarding/diagnostic/answer",
            json={
                "session_id": correct_session["session_id"],
                "question_id": correct_session["current_question"]["id"],
                "selected_option_id": "A",
            },
            headers=AUTH_HEADERS,
        )

        wrong_start = await client.post(
            "/api/v1/onboarding/diagnostic/start",
            json=context_payload(),
            headers=AUTH_HEADERS,
        )
        wrong_session = wrong_start.json()
        wrong_answer = await client.post(
            "/api/v1/onboarding/diagnostic/answer",
            json={
                "session_id": wrong_session["session_id"],
                "question_id": wrong_session["current_question"]["id"],
                "selected_option_id": "B",
            },
            headers=AUTH_HEADERS,
        )
    finally:
        app.dependency_overrides.clear()

    assert correct_start.status_code == 200
    assert wrong_start.status_code == 200
    assert correct_answer.status_code == 200
    assert wrong_answer.status_code == 200
    assert correct_answer.json()["current_question"]["difficulty_elo"] > first_difficulty
    assert wrong_answer.json()["current_question"]["difficulty_elo"] < first_difficulty
    assert correct_answer.json()["current_question"]["id"] != wrong_answer.json()["current_question"]["id"]


@pytest.mark.asyncio
async def test_onboarding_database_failure_is_recoverable_503(client, monkeypatch):
    monkeypatch.delenv("AUTH_ALLOW_DEV_TOKENS", raising=False)
    db = MagicMock()
    db._stub_mode = False
    db.app_client.auth.get_user.return_value.user.id = STUDENT_ID
    db.app_client.auth.get_user.return_value.user.email = "student@edugap.vn"

    role_table = MagicMock()
    role_table.select.return_value.eq.return_value.execute.return_value.data = []
    onboarding_table = MagicMock()
    onboarding_table.select.return_value.eq.return_value.eq.return_value.limit.return_value.execute.side_effect = (
        RuntimeError("missing table")
    )

    def table(name: str):
        if name == "user_roles":
            return role_table
        if name == "onboarding_profiles":
            return onboarding_table
        return MagicMock()

    db.app_client.table.side_effect = table

    app.dependency_overrides[get_adaptive_db] = lambda: db
    try:
        response = await client.get(
            "/api/v1/onboarding/status", headers={"Authorization": "Bearer header.payload.signature"}
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "onboarding_store_unavailable"
