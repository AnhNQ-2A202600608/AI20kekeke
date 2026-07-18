import json
import os
import statistics
import time
from collections import defaultdict
from pathlib import Path
from typing import Any
from uuid import UUID

import pytest

try:
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parents[2] / ".env")
except Exception:
    pass

from src.api.adaptive_routes import AuthenticatedUser, get_adaptive_db, get_current_user
from src.main import app
from src.services.adaptive.supabase_database import SupabaseAdaptiveDatabase
from src.services.supabase_config import classify_supabase_key, get_backend_supabase_config

DEFAULT_STUDENT_ID = "bf14b028-660c-4ee3-92b9-96aad5453803"
DEFAULT_COURSE_ID = "00000000-0000-0000-0000-000000000001"
DEFAULT_CONCEPT_ID = "597ff89c-f60d-5521-b5e2-6baf78a59252"


def _supabase_url() -> str:
    return (
        os.getenv("SUPABASE_URL")
        or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        or os.getenv("NEXT_PUBLIC_SUPABASE_URL_DEV")
        or os.getenv("NEXT_PUBLIC_SUPABASE_URL_PROD")
        or ""
    )


def _supabase_key() -> str:
    config = get_backend_supabase_config(allow_stub=True)
    return config.secret_key


def _is_service_role_key(key: str) -> bool:
    return classify_supabase_key(key) in {"secret", "legacy_service_role"}


class CountingSupabaseAdaptiveDatabase(SupabaseAdaptiveDatabase):
    def __init__(self, url: str, key: str):
        super().__init__(url, key)
        self.calls = defaultdict(int)
        self.timings_ms = defaultdict(list)
        self.created_decision_ids: list[str] = []
        self.last_candidate_count = 0
        self.last_bulk_arm_count = 0

    def _timed(self, name: str, callback):
        self.calls[name] += 1
        start = time.perf_counter()
        try:
            return callback()
        finally:
            self.timings_ms[name].append((time.perf_counter() - start) * 1000)

    def get_candidate_questions_meta(self, course_id: UUID, concept_id: UUID) -> list[dict[str, Any]]:
        result = self._timed(
            "get_candidate_questions_meta",
            lambda: SupabaseAdaptiveDatabase.get_candidate_questions_meta(self, course_id, concept_id),
        )
        self.last_candidate_count = len(result)
        return result

    def get_bandit_arms(self, policy_id: UUID, arm_ids: list[str]) -> dict[str, dict[str, Any]]:
        result = self._timed(
            "get_bandit_arms", lambda: SupabaseAdaptiveDatabase.get_bandit_arms(self, policy_id, arm_ids)
        )
        self.last_bulk_arm_count = len(arm_ids)
        return result

    def get_bandit_arm(self, policy_id: UUID, arm_id: str) -> dict[str, Any] | None:
        return self._timed("get_bandit_arm", lambda: SupabaseAdaptiveDatabase.get_bandit_arm(self, policy_id, arm_id))

    def get_question_by_id(self, question_id: UUID) -> dict[str, Any] | None:
        return self._timed("get_question_by_id", lambda: SupabaseAdaptiveDatabase.get_question_by_id(self, question_id))

    def log_adaptive_decision(
        self,
        policy_id: UUID,
        student_id: UUID,
        course_id: UUID,
        concept_id: UUID,
        selected_action_id: UUID,
        candidate_action_ids: list[str],
        context_snapshot: list[float],
        model_snapshot: dict[str, Any],
        expected_reward: float,
        expected_success: float,
    ) -> UUID:
        decision_id = self._timed(
            "log_adaptive_decision",
            lambda: SupabaseAdaptiveDatabase.log_adaptive_decision(
                self,
                policy_id=policy_id,
                student_id=student_id,
                course_id=course_id,
                concept_id=concept_id,
                selected_action_id=selected_action_id,
                candidate_action_ids=candidate_action_ids,
                context_snapshot=context_snapshot,
                model_snapshot=model_snapshot,
                expected_reward=expected_reward,
                expected_success=expected_success,
            ),
        )
        self.created_decision_ids.append(str(decision_id))
        return decision_id

    def cleanup_created_decisions(self) -> None:
        if self._stub_mode or self.audit_client is None:
            return
        for decision_id in self.created_decision_ids:
            try:
                self.audit_client.table("adaptive_decisions").delete().eq("id", decision_id).execute()
            except Exception:
                pass


@pytest.mark.asyncio
async def test_live_adaptive_recommend_uses_real_supabase_question_and_measures_latency(client):
    if os.getenv("RUN_REAL_SUPABASE_VALIDATION") != "1":
        pytest.skip("Set RUN_REAL_SUPABASE_VALIDATION=1 to run live Supabase latency validation.")

    url = _supabase_url()
    key = _supabase_key()
    if not url or not key:
        pytest.skip("Supabase env vars are missing.")

    student_id = os.getenv("REAL_ADAPTIVE_STUDENT_ID", DEFAULT_STUDENT_ID)
    course_id = os.getenv("REAL_ADAPTIVE_COURSE_ID", DEFAULT_COURSE_ID)
    concept_id = os.getenv("REAL_ADAPTIVE_CONCEPT_ID", DEFAULT_CONCEPT_ID)
    repetitions = int(os.getenv("REAL_ADAPTIVE_REPETITIONS", "5"))

    db = CountingSupabaseAdaptiveDatabase(url, key)
    if db._stub_mode or db.app_client is None:
        pytest.skip("Supabase adapter is in stub mode.")

    direct_questions = (
        db.app_client.table("questions")
        .select("id, type, prompt, answer_key, difficulty_elo")
        .eq("course_id", course_id)
        .eq("concept_id", concept_id)
        .eq("calibration_status", "published")
        .execute()
        .data
        or []
    )
    direct_by_id = {row["id"]: row for row in direct_questions}
    assert len(direct_by_id) > 1, "Live validation needs a DB concept with multiple published questions."

    app.dependency_overrides[get_adaptive_db] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id=UUID(student_id),
        email="real-adaptive-validation@local.test",
        role="dev",
    )
    latencies_ms: list[float] = []
    selected_question_ids: list[str] = []

    try:
        for _ in range(repetitions):
            start = time.perf_counter()
            response = await client.post(
                "/api/v1/adaptive/recommend",
                json={"student_id": student_id, "course_id": course_id, "concept_id": concept_id},
                headers={"Authorization": "Bearer real-adaptive-validation"},
            )
            elapsed_ms = (time.perf_counter() - start) * 1000
            latencies_ms.append(elapsed_ms)

            assert response.status_code == 200, response.text
            payload = response.json()
            question_id = payload["question_id"]
            selected_question_ids.append(question_id)

            db_row = direct_by_id.get(question_id)
            assert db_row is not None, f"Recommended question_id {question_id} is not in app.questions."
            assert payload["prompt"] == db_row["prompt"]
            assert payload["type"] == db_row["type"]
            assert payload["options"] == db_row["answer_key"].get("options", {})
            assert payload["answer"] == db_row["answer_key"].get("correct")
            assert payload["explanation"] == db_row["answer_key"].get("explanation")

        assert db.last_candidate_count == len(direct_by_id)
        assert db.last_bulk_arm_count == len(direct_by_id)
        assert db.calls["get_candidate_questions_meta"] == repetitions
        assert db.calls["get_bandit_arms"] == repetitions
        assert db.calls["get_question_by_id"] in (0, repetitions)
        assert db.calls["get_bandit_arm"] == 0

        summary = {
            "source": "supabase",
            "key_decodes_as_service_role": _is_service_role_key(key),
            "course_id": course_id,
            "concept_id": concept_id,
            "student_id": student_id,
            "published_question_count": len(direct_by_id),
            "selected_question_ids": selected_question_ids,
            "latency_ms": {
                "min": round(min(latencies_ms), 1),
                "median": round(statistics.median(latencies_ms), 1),
                "mean": round(statistics.mean(latencies_ms), 1),
                "max": round(max(latencies_ms), 1),
                "runs": [round(value, 1) for value in latencies_ms],
            },
            "db_calls": dict(db.calls),
            "db_timings_ms": {
                name: {
                    "median": round(statistics.median(values), 1),
                    "max": round(max(values), 1),
                }
                for name, values in db.timings_ms.items()
                if values
            },
        }
        print("REAL_ADAPTIVE_RECOMMEND_VALIDATION=" + json.dumps(summary, ensure_ascii=False, sort_keys=True))
    finally:
        db.cleanup_created_decisions()
        app.dependency_overrides.clear()
