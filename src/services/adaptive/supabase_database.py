from __future__ import annotations

import logging
import time
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

from src.services.adaptive.database_interface import AdaptiveDatabaseInterface
from src.services.adaptive.forgetting import apply_forgetting_decay, update_stability

logger = logging.getLogger(__name__)

READ_CACHE_TTL_SECONDS = 60.0

try:
    from supabase import Client, create_client
    from supabase.client import ClientOptions

    SUPABASE_AVAILABLE = True
except ImportError:  # optional dependency for local/test environments
    Client = Any  # type: ignore[assignment]
    ClientOptions = Any  # type: ignore[assignment]
    create_client = None  # type: ignore[assignment]
    SUPABASE_AVAILABLE = False


class SupabaseAdaptiveDatabase(AdaptiveDatabaseInterface):
    def __init__(self, url: str, key: str):
        self.in_transaction = False
        self.supabase_url = url
        self._service_key = key
        self._stub_mode = not SUPABASE_AVAILABLE or not url or not key
        self._candidate_meta_cache: dict[tuple[str, str], tuple[float, list[dict[str, Any]]]] = {}
        self._question_cache: dict[str, tuple[float, dict[str, Any] | None]] = {}
        self._question_hints_cache: dict[str, tuple[float, list[dict[str, str]]]] = {}
        self._policy_cache: dict[str, tuple[float, tuple[UUID, dict[str, Any]]]] = {}

        if self._stub_mode:
            self.app_client = None
            self.audit_client = None
            return

        self.app_client: Client = create_client(url, key, options=ClientOptions(schema="app"))
        self.audit_client: Client = create_client(url, key, options=ClientOptions(schema="audit"))

    def _cache_get(self, cache: dict, key):
        cached = cache.get(key)
        if not cached:
            return None
        cached_at, value = cached
        if time.monotonic() - cached_at > READ_CACHE_TTL_SECONDS:
            cache.pop(key, None)
            return None
        return value

    def _cache_set(self, cache: dict, key, value):
        cache[key] = (time.monotonic(), value)
        return value

    def _get_question_hints_by_ids(self, question_ids: list[str]) -> dict[str, list[dict[str, str]]]:
        if self._stub_mode or not question_ids:
            return {}

        unique_ids = list(dict.fromkeys(question_ids))
        hints_by_question_id: dict[str, list[dict[str, str]]] = {}
        missing_ids: list[str] = []
        for question_id in unique_ids:
            cached = self._cache_get(self._question_hints_cache, question_id)
            if cached is None:
                missing_ids.append(question_id)
            else:
                hints_by_question_id[question_id] = cached

        if missing_ids:
            response = (
                self.app_client.table("question_hints")
                .select("question_id, level, hint_text")
                .in_("question_id", missing_ids)
                .order("level", desc=False)
                .execute()
            )
            level_map = {1: "light", 2: "medium", 3: "deep"}
            fetched: dict[str, list[dict[str, str]]] = {question_id: [] for question_id in missing_ids}
            for row in response.data or []:
                question_id = str(row["question_id"])
                fetched.setdefault(question_id, []).append(
                    {
                        "level": level_map.get(int(row.get("level") or 1), "light"),
                        "content": row["hint_text"],
                    }
                )
            for question_id, hints in fetched.items():
                hints_by_question_id[question_id] = self._cache_set(self._question_hints_cache, question_id, hints)

        return hints_by_question_id

    def reset_service_auth(self) -> None:
        """Restore cached Supabase clients to the backend service key after Auth SDK events."""
        if self._stub_mode:
            return

        auth_header = f"Bearer {self._service_key}"
        for client in (self.app_client, self.audit_client):
            if client is None:
                continue
            client.options.headers["Authorization"] = auth_header
            if getattr(client, "auth", None) is not None and hasattr(client.auth, "_headers"):
                client.auth._headers["Authorization"] = auth_header
            client._postgrest = None
            client._storage = None
            client._functions = None

    def get_student_mastery(self, student_id: UUID, course_id: UUID, concept_id: UUID) -> dict[str, Any]:
        if self._stub_mode:
            return {
                "elo_score": 1200.0,
                "bkt_mastery_probability": 0.25,
                "mastery_state": "not_started",
                "weakness_flag": False,
                "attempt_count": 0,
                "correct_count": 0,
                "stability_days": 3.0,
                "last_practiced_at": None,
            }

        response = (
            self.app_client.table("active_student_mastery")
            .select(
                "elo_score, bkt_mastery_probability, mastery_state, weakness_flag, attempt_count, correct_count, last_practiced_at, stability_days"
            )
            .eq("student_id", str(student_id))
            .eq("course_id", str(course_id))
            .eq("concept_id", str(concept_id))
            .execute()
        )

        if response.data:
            row = response.data[0]
            raw_bkt = float(row["bkt_mastery_probability"])
            stability_days = float(row.get("stability_days") if row.get("stability_days") is not None else 3.0)
            last_practiced_at = None
            if row.get("last_practiced_at"):
                try:
                    last_practiced_at = datetime.fromisoformat(row["last_practiced_at"])
                except Exception:
                    pass
            p_effective = apply_forgetting_decay(raw_bkt, last_practiced_at, stability_days)
            return {
                "elo_score": float(row["elo_score"]),
                "bkt_mastery_probability": p_effective,
                "mastery_state": row["mastery_state"],
                "weakness_flag": row["weakness_flag"],
                "attempt_count": row["attempt_count"],
                "correct_count": row["correct_count"],
                "stability_days": stability_days,
                "last_practiced_at": last_practiced_at,
            }

        # Fallback: check legacy table directly before inserting (avoids duplicate key on bitemporal view miss)
        legacy_resp = (
            self.app_client.table("student_concept_mastery")
            .select(
                "elo_score, bkt_mastery_probability, mastery_state, weakness_flag, attempt_count, correct_count, last_practiced_at, stability_days"
            )
            .eq("student_id", str(student_id))
            .eq("course_id", str(course_id))
            .eq("concept_id", str(concept_id))
            .execute()
        )
        if legacy_resp.data:
            row = legacy_resp.data[0]
        else:
            default_data = {
                "student_id": str(student_id),
                "course_id": str(course_id),
                "concept_id": str(concept_id),
                "elo_score": 1200.0,
                "bkt_mastery_probability": 0.25,
                "mastery_state": "not_started",
                "weakness_flag": False,
                "attempt_count": 0,
                "correct_count": 0,
                "stability_days": 3.0,
            }
            upsert_resp = (
                self.app_client.table("student_concept_mastery")
                .upsert(default_data, on_conflict="student_id,course_id,concept_id")
                .execute()
            )
            row = upsert_resp.data[0]
        stability_days = float(row.get("stability_days") if row.get("stability_days") is not None else 3.0)
        last_practiced_at = None
        if row.get("last_practiced_at"):
            try:
                last_practiced_at = datetime.fromisoformat(row["last_practiced_at"])
            except Exception:
                pass
        p_effective = apply_forgetting_decay(0.25, last_practiced_at, stability_days)
        return {
            "elo_score": float(row["elo_score"]),
            "bkt_mastery_probability": p_effective,
            "mastery_state": row["mastery_state"],
            "weakness_flag": row["weakness_flag"],
            "attempt_count": row["attempt_count"],
            "correct_count": row["correct_count"],
            "stability_days": stability_days,
            "last_practiced_at": last_practiced_at,
        }

    def update_student_mastery(
        self,
        student_id: UUID,
        course_id: UUID,
        concept_id: UUID,
        elo_score: float,
        bkt_mastery_probability: float,
        mastery_state: str,
        weakness_flag: bool,
        is_correct: bool,
    ) -> None:
        if self._stub_mode:
            return

        correct_inc = 1 if is_correct else 0
        mastery = self.get_student_mastery(student_id, course_id, concept_id)
        new_attempts = mastery["attempt_count"] + 1
        new_correct = mastery["correct_count"] + correct_inc
        now_str = datetime.now(UTC).isoformat()
        old_stability = float(mastery.get("stability_days") if mastery.get("stability_days") is not None else 3.0)
        new_stability = update_stability(old_stability, 1.0 if is_correct else 0.0)

        self.save_student_mastery_bitemporal(
            student_id=student_id,
            course_id=course_id,
            concept_id=concept_id,
            elo_score=elo_score,
            bkt_mastery_probability=bkt_mastery_probability,
            mastery_state=mastery_state,
            weakness_flag=weakness_flag,
            attempt_count=new_attempts,
            correct_count=new_correct,
            last_practiced_at=now_str,
            stability_days=new_stability,
            valid_range=None,
        )

    def get_candidate_questions_meta(self, course_id: UUID, concept_id: UUID) -> list[dict[str, Any]]:
        if self._stub_mode:
            return []

        cache_key = (str(course_id), str(concept_id))
        cached = self._cache_get(self._candidate_meta_cache, cache_key)
        if cached is not None:
            return cached

        direct_response = (
            self.app_client.table("questions")
            .select("id, type, prompt, answer_key, difficulty_elo")
            .eq("course_id", str(course_id))
            .eq("concept_id", str(concept_id))
            .eq("calibration_status", "published")
            .execute()
        )

        candidates_by_id: dict[str, dict[str, Any]] = {}
        for row in direct_response.data or []:
            candidates_by_id[row["id"]] = row

        try:
            link_response = (
                self.app_client.table("question_concepts")
                .select("question_id")
                .eq("concept_id", str(concept_id))
                .execute()
            )
            linked_question_ids = [row["question_id"] for row in link_response.data or [] if row.get("question_id")]
        except Exception as e:
            logger.error(f"Error fetching linked question concepts for concept {concept_id}: {e}")
            raise RuntimeError("Unable to fetch linked question concepts.") from e

        if linked_question_ids:
            linked_response = (
                self.app_client.table("questions")
                .select("id, type, prompt, answer_key, difficulty_elo")
                .eq("course_id", str(course_id))
                .eq("calibration_status", "published")
                .in_("id", linked_question_ids)
                .execute()
            )
            for row in linked_response.data or []:
                candidates_by_id[row["id"]] = row

        candidates = [
            {
                "id": UUID(q["id"]),
                "type": q.get("type"),
                "prompt": q.get("prompt"),
                "answer_key": q.get("answer_key"),
                "difficulty_elo": float(q["difficulty_elo"]),
            }
            for q in candidates_by_id.values()
        ]
        hints_by_question_id = self._get_question_hints_by_ids([str(q["id"]) for q in candidates])
        for candidate in candidates:
            candidate["hints"] = hints_by_question_id.get(str(candidate["id"]), [])
        return self._cache_set(self._candidate_meta_cache, cache_key, candidates)

    def get_question_by_id(self, question_id: UUID) -> dict[str, Any] | None:
        if self._stub_mode:
            return None

        cache_key = str(question_id)
        cached = self._cache_get(self._question_cache, cache_key)
        if cached is not None:
            return cached

        response = (
            self.app_client.table("questions")
            .select("id, type, prompt, answer_key, difficulty_elo")
            .eq("id", str(question_id))
            .execute()
        )
        if response.data:
            row = response.data[0]
            question = {
                "id": UUID(row["id"]),
                "type": row["type"],
                "prompt": row["prompt"],
                "answer_key": row["answer_key"],
                "difficulty_elo": float(row["difficulty_elo"]),
                "hints": self._get_question_hints_by_ids([str(question_id)]).get(str(question_id), []),
            }
            return self._cache_set(self._question_cache, cache_key, question)
        return self._cache_set(self._question_cache, cache_key, None)

    def update_question_elo(self, question_id: UUID, difficulty_elo: float) -> None:
        if self._stub_mode:
            return
        self.app_client.table("questions").update(
            {"difficulty_elo": difficulty_elo, "updated_at": datetime.now(UTC).isoformat()}
        ).eq("id", str(question_id)).execute()

    def get_bandit_policy_state(self, course_id: UUID) -> tuple[UUID, dict[str, Any]]:
        if self._stub_mode:
            return UUID(int=0), {}

        cache_key = str(course_id)
        cached = self._cache_get(self._policy_cache, cache_key)
        if cached is not None:
            return cached

        response = (
            self.audit_client.table("adaptive_policies")
            .select("id, config")
            .eq("name", "zpd_selector")
            .eq("status", "active")
            .eq("course_id", str(course_id))
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )

        if response.data:
            row = response.data[0]
            return self._cache_set(self._policy_cache, cache_key, (UUID(row["id"]), row["config"]))

        default_policy = {
            "name": "zpd_selector",
            "version": "v1.0",
            "status": "active",
            "course_id": str(course_id),
            "config": {},
        }
        insert_resp = self.audit_client.table("adaptive_policies").insert(default_policy).execute()
        row = insert_resp.data[0]
        return self._cache_set(self._policy_cache, cache_key, (UUID(row["id"]), row["config"]))

    def update_bandit_policy_config(self, policy_id: UUID, config: dict[str, Any]) -> None:
        if self._stub_mode:
            return
        self.audit_client.table("adaptive_policies").update({"config": config}).eq("id", str(policy_id)).execute()

    def get_bandit_arm(self, policy_id: UUID, arm_id: str) -> dict[str, Any] | None:
        if self._stub_mode or self.audit_client is None:
            return None
        try:
            response = (
                self.audit_client.table("bandit_arms")
                .select("a, a_inv, b, update_count")
                .eq("policy_id", str(policy_id))
                .eq("arm_id", arm_id)
                .execute()
            )
            if response.data:
                row = response.data[0]
                return {
                    "a": row.get("a"),
                    "a_inv": row.get("a_inv"),
                    "b": row.get("b"),
                    "update_count": int(row["update_count"]) if row.get("update_count") is not None else 0,
                }
            return None
        except Exception as e:
            logger.error(f"Error getting bandit arm: {e}")
            raise RuntimeError("Unable to fetch bandit arm state.") from e

    def get_bandit_arms(self, policy_id: UUID, arm_ids: list[str]) -> dict[str, dict[str, Any]]:
        if self._stub_mode or self.audit_client is None or not arm_ids:
            return {}
        try:
            response = (
                self.audit_client.table("bandit_arms")
                .select("arm_id, a, a_inv, b, update_count")
                .eq("policy_id", str(policy_id))
                .in_("arm_id", arm_ids)
                .execute()
            )
            arms = {}
            for row in response.data or []:
                arm_id = row.get("arm_id")
                if not arm_id:
                    continue
                arms[arm_id] = {
                    "a": row.get("a"),
                    "a_inv": row.get("a_inv"),
                    "b": row.get("b"),
                    "update_count": int(row["update_count"]) if row.get("update_count") is not None else 0,
                }
            return arms
        except Exception as e:
            logger.error(f"Error getting bandit arms: {e}")
            raise RuntimeError("Unable to fetch bandit arm states.") from e

    def upsert_bandit_arm(self, policy_id: UUID, arm_id: str, a_inv: list, b: list) -> None:
        if self._stub_mode or self.audit_client is None:
            return
        try:
            self.audit_client.table("bandit_arms").upsert(
                {
                    "policy_id": str(policy_id),
                    "arm_id": arm_id,
                    "a_inv": a_inv,
                    "b": b,
                    "updated_at": datetime.now(UTC).isoformat(),
                }
            ).execute()
        except Exception as e:
            logger.error(f"Error upserting bandit arm: {e}")
            raise RuntimeError("Unable to save bandit arm state.") from e

    def upsert_bandit_arm_v3(
        self, policy_id: UUID, arm_id: str, a: list, a_inv: list, b: list, update_count: int
    ) -> None:
        if self._stub_mode or self.audit_client is None:
            return
        try:
            self.audit_client.table("bandit_arms").upsert(
                {
                    "policy_id": str(policy_id),
                    "arm_id": arm_id,
                    "a": a,
                    "a_inv": a_inv,
                    "b": b,
                    "update_count": update_count,
                    "updated_at": datetime.now(UTC).isoformat(),
                }
            ).execute()
        except Exception as e:
            logger.error(f"Error upserting bandit arm v3: {e}")
            raise RuntimeError("Unable to save bandit arm state.") from e

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
        if self._stub_mode:
            return UUID(int=0)

        data = {
            "policy_id": str(policy_id),
            "student_id": str(student_id),
            "course_id": str(course_id),
            "concept_id": str(concept_id),
            "selected_action_id": str(selected_action_id),
            "candidate_action_ids": candidate_action_ids,
            "context_snapshot": context_snapshot,
            "model_snapshot": model_snapshot,
            "expected_reward": expected_reward,
            "expected_success": expected_success,
        }
        response = self.audit_client.table("adaptive_decisions").insert(data).execute()
        return UUID(response.data[0]["id"])

    def get_adaptive_decision(self, decision_id: UUID) -> dict[str, Any] | None:
        if self._stub_mode:
            return None

        response = (
            self.audit_client.table("adaptive_decisions")
            .select(
                "policy_id, student_id, course_id, concept_id, selected_action_id, expected_success, context_snapshot, model_snapshot, consumed_at, created_at"
            )
            .eq("id", str(decision_id))
            .execute()
        )
        if response.data:
            row = response.data[0]
            return {
                "policy_id": UUID(row["policy_id"]),
                "student_id": UUID(row["student_id"]),
                "course_id": UUID(row["course_id"]),
                "concept_id": UUID(row["concept_id"]) if row.get("concept_id") else None,
                "selected_action_id": UUID(row["selected_action_id"]) if row.get("selected_action_id") else None,
                "expected_success": float(row["expected_success"]) if row.get("expected_success") is not None else None,
                "context_snapshot": row["context_snapshot"],
                "model_snapshot": row["model_snapshot"],
                "consumed_at": row.get("consumed_at"),
                "created_at": row.get("created_at"),
            }
        return None

    def log_quiz_attempt(
        self,
        student_id: UUID,
        course_id: UUID,
        question_id: UUID,
        concept_id: UUID,
        decision_id: UUID,
        student_answer: dict[str, Any],
        is_correct: bool,
        actual_score: float,
        expected_success: float,
        hint_count: int,
        used_ai_help: bool,
    ) -> UUID:
        if self._stub_mode:
            return UUID(int=0)

        data = {
            "student_id": str(student_id),
            "course_id": str(course_id),
            "question_id": str(question_id),
            "concept_id": str(concept_id),
            "adaptive_decision_id": str(decision_id) if decision_id else None,
            "student_answer": student_answer,
            "is_correct": is_correct,
            "actual_score": actual_score,
            "expected_success": expected_success,
            "hint_count": hint_count,
            "used_ai_help": used_ai_help,
        }
        response = self.app_client.table("quiz_attempts").insert(data).execute()
        return UUID(response.data[0]["id"])

    def log_adaptive_reward(
        self,
        decision_id: UUID,
        quiz_attempt_id: UUID,
        reward_value: float,
        observed_success: float,
    ) -> None:
        if self._stub_mode:
            return
        data = {
            "adaptive_decision_id": str(decision_id),
            "quiz_attempt_id": str(quiz_attempt_id) if quiz_attempt_id else None,
            "reward_value": reward_value,
            "reward_formula": "zpd_reward_v1",
            "observed_success": observed_success,
            "target_success": 0.75,
        }
        self.audit_client.table("adaptive_rewards").insert(data).execute()

    def log_mastery_event(
        self,
        student_id: UUID,
        course_id: UUID,
        concept_id: UUID,
        attempt_id: UUID | None,
        elo_before: float,
        elo_after: float,
        bkt_before: float,
        bkt_after: float,
        state_before: str,
        state_after: str,
    ) -> None:
        if self._stub_mode:
            return
        data = {
            "student_id": str(student_id),
            "course_id": str(course_id),
            "concept_id": str(concept_id),
            "source_type": "quiz_attempt",
            "source_id": str(attempt_id) if attempt_id else None,
            "elo_before": elo_before,
            "elo_after": elo_after,
            "elo_delta": elo_after - elo_before,
            "bkt_before": bkt_before,
            "bkt_after": bkt_after,
            "bkt_delta": bkt_after - bkt_before,
            "state_before": state_before,
            "state_after": state_after,
        }
        self.audit_client.table("mastery_events").insert(data).execute()

    def log_question_elo_event(
        self,
        question_id: UUID,
        quiz_attempt_id: UUID,
        difficulty_before: float,
        difficulty_after: float,
    ) -> None:
        if self._stub_mode:
            return
        data = {
            "question_id": str(question_id),
            "quiz_attempt_id": str(quiz_attempt_id),
            "difficulty_before": difficulty_before,
            "difficulty_after": difficulty_after,
            "difficulty_delta": difficulty_after - difficulty_before,
        }
        self.audit_client.table("question_elo_events").insert(data).execute()

    def submit_attempt_txn(self, payload: dict) -> dict:
        if self._stub_mode:
            return {}
        response = self.app_client.rpc("submit_attempt_txn", payload).execute()
        if response.data:
            return response.data
        return {}

    def submit_attempt_v2(self, payload: dict) -> dict:
        """Gọi RPC submit_attempt_v2 để xử lý giao dịch nộp bài nguyên tử ở DB."""
        if self._stub_mode:
            return {}
        response = self.app_client.rpc("submit_attempt_v2", payload).execute()
        if response.data:
            return response.data
        return {}

    def submit_attempt_v3(self, payload: dict) -> dict:
        if self._stub_mode:
            return {}
        self.reset_service_auth()
        response = self.app_client.rpc("submit_attempt_v3", payload).execute()
        data = response.data or {}
        if isinstance(data, dict) and not data.get("attempt_id"):
            decision_id = payload.get("p_decision_id")
            if decision_id:
                try:
                    attempt_response = (
                        self.app_client.table("quiz_attempts")
                        .select("id")
                        .eq("adaptive_decision_id", str(decision_id))
                        .limit(1)
                        .execute()
                    )
                    if attempt_response.data:
                        data["attempt_id"] = attempt_response.data[0]["id"]
                except Exception as e:
                    logger.warning(f"Could not resolve quiz attempt id after submit_attempt_v3: {e}")
        return data if isinstance(data, dict) else {}

    def update_student_bkt(
        self,
        student_id: UUID,
        course_id: UUID,
        concept_id: UUID,
        bkt_prob: float,
        mastery_state: str,
        weakness_flag: bool,
    ) -> None:
        """Cập nhật riêng chỉ số BKT của học sinh không làm tăng attempt_count."""
        if self._stub_mode:
            return

        mastery = self.get_student_mastery(student_id, course_id, concept_id)
        now_str = datetime.now(UTC).isoformat()
        stability_days = float(mastery.get("stability_days") if mastery.get("stability_days") is not None else 3.0)

        self.save_student_mastery_bitemporal(
            student_id=student_id,
            course_id=course_id,
            concept_id=concept_id,
            elo_score=mastery["elo_score"],
            bkt_mastery_probability=bkt_prob,
            mastery_state=mastery_state,
            weakness_flag=weakness_flag,
            attempt_count=mastery["attempt_count"],
            correct_count=mastery["correct_count"],
            last_practiced_at=now_str,
            stability_days=stability_days,
            valid_range=None,
        )

    def sync_elo_bkt_only(
        self,
        student_id: UUID,
        course_id: UUID,
        concept_id: UUID,
        elo_score: float,
        bkt_prob: float,
        mastery_state: str,
        weakness_flag: bool,
    ) -> None:
        if self._stub_mode:
            return

        mastery = self.get_student_mastery(student_id, course_id, concept_id)
        now_str = datetime.now(UTC).isoformat()
        stability_days = float(mastery.get("stability_days") if mastery.get("stability_days") is not None else 3.0)

        self.save_student_mastery_bitemporal(
            student_id=student_id,
            course_id=course_id,
            concept_id=concept_id,
            elo_score=elo_score,
            bkt_mastery_probability=bkt_prob,
            mastery_state=mastery_state,
            weakness_flag=weakness_flag,
            attempt_count=mastery["attempt_count"],
            correct_count=mastery["correct_count"],
            last_practiced_at=now_str,
            stability_days=stability_days,
            valid_range=None,
        )

    def get_all_student_concept_mastery(self, student_id: UUID, course_id: UUID) -> list[dict[str, Any]]:
        if self._stub_mode:
            return []

        response = (
            self.app_client.table("active_student_mastery")
            .select(
                "concept_id, elo_score, bkt_mastery_probability, mastery_state, weakness_flag, attempt_count, correct_count, concepts(code)"
            )
            .eq("student_id", str(student_id))
            .eq("course_id", str(course_id))
            .execute()
        )

        result = []
        for row in response.data or []:
            concept_code = ""
            if "concepts" in row and isinstance(row["concepts"], dict):
                concept_code = row["concepts"].get("code", "")

            result.append(
                {
                    "concept_id": row["concept_id"],
                    "concept_code": concept_code,
                    "elo_score": float(row["elo_score"]),
                    "bkt_mastery_probability": float(row["bkt_mastery_probability"]),
                    "mastery_state": row["mastery_state"],
                    "weakness_flag": row["weakness_flag"],
                    "attempt_count": row["attempt_count"],
                    "correct_count": row["correct_count"],
                }
            )
        return result

    def get_concept_id_by_code(self, code: str) -> UUID | None:
        if self._stub_mode:
            return None
        response = self.app_client.table("concepts").select("id").eq("code", code).execute()
        if response.data:
            return UUID(response.data[0]["id"])
        return None

    def get_concept_relations(self, course_id: UUID, status: str | None = None) -> list[dict[str, Any]]:
        if self._stub_mode:
            return []
        query = self.app_client.table("concept_relations").select("*").eq("course_id", str(course_id))
        if status:
            query = query.eq("status", status)
        response = query.execute()
        return response.data or []

    def create_concept_relation(
        self,
        course_id: UUID,
        source_concept_id: UUID,
        target_concept_id: UUID,
        relation_type: str,
        weight: float,
        status: str,
    ) -> dict[str, Any]:
        if self._stub_mode:
            return {}
        data = {
            "course_id": str(course_id),
            "source_concept_id": str(source_concept_id),
            "target_concept_id": str(target_concept_id),
            "relation_type": relation_type,
            "weight": weight,
            "status": status,
        }
        response = self.app_client.table("concept_relations").insert(data).execute()
        if response.data:
            return response.data[0]
        raise RuntimeError("Concept relation insert returned no row.")

    def update_concept_relation(
        self, relation_id: UUID, status: str | None = None, weight: float | None = None
    ) -> dict[str, Any]:
        if self._stub_mode:
            return {}
        data = {}
        if status is not None:
            data["status"] = status
        if weight is not None:
            data["weight"] = weight
        response = self.app_client.table("concept_relations").update(data).eq("id", str(relation_id)).execute()
        if response.data:
            return response.data[0]
        return {}

    def delete_concept_relation(self, relation_id: UUID) -> bool:
        if self._stub_mode:
            return True
        existing = self.app_client.table("concept_relations").select("id").eq("id", str(relation_id)).limit(1).execute()
        if not existing.data:
            return False
        self.app_client.table("concept_relations").delete().eq("id", str(relation_id)).execute()
        return True

    def begin(self):
        return None

    def commit(self):
        return None

    def rollback(self):
        return None

    def count_hints(self, decision_id: UUID) -> int:
        if self._stub_mode or self.app_client is None:
            return 0
        try:
            response = (
                self.app_client.table("hint_logs")
                .select("id", count="exact")
                .eq("decision_id", str(decision_id))
                .execute()
            )
            return response.count if response.count is not None else 0
        except Exception as e:
            logger.error(f"Error counting hints: {e}")
            raise RuntimeError("Unable to count adaptive hints.") from e

    def log_hint_usage(
        self,
        student_id: UUID,
        course_id: UUID,
        question_id: UUID,
        decision_id: UUID,
        hint_level: int,
    ) -> UUID:
        if self._stub_mode:
            import uuid

            return uuid.uuid4()

        try:
            response = (
                self.app_client.table("hint_logs")
                .insert(
                    {
                        "student_id": str(student_id),
                        "course_id": str(course_id),
                        "question_id": str(question_id),
                        "decision_id": str(decision_id),
                        "hint_level": hint_level,
                    }
                )
                .execute()
            )
            return UUID(response.data[0]["id"])
        except Exception as e:
            logger.error(f"Error logging hint usage: {e}")
            raise RuntimeError("Unable to log adaptive hint usage.") from e

    def get_chat_history(self, session_id: UUID, limit: int = 10) -> list[dict[str, Any]]:
        if self._stub_mode:
            return []
        try:
            response = (
                self.app_client.table("chat_messages")
                .select("role, content")
                .eq("session_id", str(session_id))
                .order("created_at", desc=False)
                .limit(limit)
                .execute()
            )
            return response.data or []
        except Exception as e:
            logger.error(f"Error fetching chat history: {e}")
            raise RuntimeError("Unable to fetch chat history.") from e

    def create_chat_session(self, student_id: UUID, course_id: UUID, mode: str) -> UUID:
        if self._stub_mode:
            import uuid

            return uuid.uuid4()

        # Map frontend mode to app.chat_mode database enum (must be lowercase)
        valid_modes = {"explain", "hint", "debug_code", "practice", "review_submission"}
        normalized_mode = mode.lower()
        if normalized_mode not in valid_modes:
            normalized_mode = "explain"

        data = {
            "student_id": str(student_id),
            "course_id": str(course_id),
            "mode": normalized_mode,
        }
        try:
            response = self.app_client.table("chat_sessions").insert(data).execute()
            return UUID(response.data[0]["id"])
        except Exception as e:
            logger.error(f"Error creating chat session: {e}")
            raise RuntimeError("Unable to create chat session.") from e

    def add_chat_message(
        self, session_id: UUID, role: str, content: str, concept_id: UUID | None = None
    ) -> UUID | None:
        import uuid

        if self._stub_mode:
            return uuid.uuid4()
        try:
            # Map role to app.message_role ('student', 'assistant', 'system')
            db_role = "student"
            if role == "ai" or role == "assistant":
                db_role = "assistant"
            elif role == "system":
                db_role = "system"

            data = {
                "session_id": str(session_id),
                "role": db_role,
                "content": content,
            }
            if concept_id:
                data["concept_id"] = str(concept_id)

            response = self.app_client.table("chat_messages").insert(data).execute()
            if response.data:
                return UUID(response.data[0]["id"])
            return None
        except Exception as e:
            logger.error(f"Error adding chat message: {e}")
            raise RuntimeError("Unable to save chat message.") from e

    def get_student_memory(self, student_id: UUID) -> dict[str, Any]:
        if self._stub_mode:
            return {}
        try:
            response = (
                self.app_client.table("student_memories").select("facts").eq("student_id", str(student_id)).execute()
            )
            if response.data:
                return response.data[0].get("facts", {}) or {}
            return {}
        except Exception as e:
            logger.error(f"Error fetching student memory: {e}")
            raise RuntimeError("Unable to fetch student memory.") from e

    def save_student_memory(self, student_id: UUID, facts: dict[str, Any]) -> None:
        if self._stub_mode:
            return
        try:
            data = {
                "student_id": str(student_id),
                "facts": facts,
                "updated_at": datetime.now(UTC).isoformat(),
            }
            self.app_client.table("student_memories").upsert(data).execute()
        except Exception as e:
            logger.error(f"Error saving student memory: {e}")
            raise RuntimeError("Unable to save student memory.") from e

    def get_calibration_outbox(self, limit: int = 100) -> list[dict[str, Any]]:
        if self._stub_mode or self.app_client is None:
            return []
        try:
            response = (
                self.app_client.table("calibration_outbox")
                .select(
                    "id, attempt_id, question_id, policy_id, actual_score, expected_success, reward, context_vector"
                )
                .order("created_at", desc=False)
                .limit(limit)
                .execute()
            )
            return response.data or []
        except Exception as e:
            logger.error(f"Error fetching calibration outbox: {e}")
            return []

    def delete_calibration_outbox_batch(self, ids: list[UUID]) -> None:
        if self._stub_mode or self.app_client is None or not ids:
            return
        try:
            str_ids = [str(i) for i in ids]
            self.app_client.table("calibration_outbox").delete().in_("id", str_ids).execute()
        except Exception as e:
            logger.error(f"Error deleting calibration outbox batch: {e}")

    def get_questions_by_ids(self, question_id_list: list[UUID]) -> list[dict[str, Any]]:
        if self._stub_mode or self.app_client is None or not question_id_list:
            return []
        try:
            str_ids = [str(i) for i in question_id_list]
            response = (
                self.app_client.table("questions")
                .select("id, type, prompt, answer_key, difficulty_elo, attempt_count, avg_response_time_ms")
                .in_("id", str_ids)
                .execute()
            )
            return [
                {
                    "id": UUID(row["id"]),
                    "type": row["type"],
                    "prompt": row["prompt"],
                    "answer_key": row["answer_key"],
                    "difficulty_elo": float(row["difficulty_elo"]) if row.get("difficulty_elo") is not None else 1200.0,
                    "attempt_count": int(row["attempt_count"]) if row.get("attempt_count") is not None else 0,
                    "avg_response_time_ms": float(row["avg_response_time_ms"])
                    if row.get("avg_response_time_ms") is not None
                    else 30000.0,
                }
                for row in response.data or []
            ]
        except Exception as e:
            logger.error(f"Error fetching questions by IDs: {e}")
            return []

    def update_question_calibration(
        self, question_id: UUID, difficulty_elo: float, attempt_count: int, avg_response_time_ms: float
    ) -> None:
        if self._stub_mode or self.app_client is None:
            return
        try:
            self.app_client.table("questions").update(
                {
                    "difficulty_elo": difficulty_elo,
                    "attempt_count": attempt_count,
                    "avg_response_time_ms": avg_response_time_ms,
                    "updated_at": datetime.now(UTC).isoformat(),
                }
            ).eq("id", str(question_id)).execute()
        except Exception as e:
            logger.error(f"Error updating question calibration: {e}")

    def get_student_mastery_as_of(
        self, student_id: UUID, course_id: UUID, concept_id: UUID, target_time: Any
    ) -> dict[str, Any] | None:
        if self._stub_mode:
            return {
                "elo_score": 1200.0,
                "bkt_mastery_probability": 0.25,
                "mastery_state": "not_started",
                "weakness_flag": False,
                "attempt_count": 0,
                "correct_count": 0,
                "stability_days": 3.0,
                "last_practiced_at": None,
            }

        target_time_str = target_time.isoformat() if isinstance(target_time, datetime) else str(target_time)
        tx_time_str = (datetime.now(UTC) + timedelta(seconds=10)).isoformat()

        try:
            response = (
                self.app_client.table("student_mastery_bitemporal")
                .select(
                    "elo_score, bkt_mastery_probability, mastery_state, weakness_flag, attempt_count, correct_count, last_practiced_at, stability_days"
                )
                .eq("student_id", str(student_id))
                .eq("course_id", str(course_id))
                .eq("concept_id", str(concept_id))
                .filter("valid_time", "cs", f"[{target_time_str}, {target_time_str}]")
                .filter("transaction_time", "cs", f"[{tx_time_str}, {tx_time_str}]")
                .execute()
            )

            if response.data:
                row = response.data[0]
                stability_days = float(row.get("stability_days") if row.get("stability_days") is not None else 3.0)
                last_practiced_at = None
                if row.get("last_practiced_at"):
                    try:
                        last_practiced_at = datetime.fromisoformat(row["last_practiced_at"])
                    except Exception:
                        pass
                return {
                    "elo_score": float(row["elo_score"]),
                    "bkt_mastery_probability": float(row["bkt_mastery_probability"]),
                    "mastery_state": row["mastery_state"],
                    "weakness_flag": row["weakness_flag"],
                    "attempt_count": row["attempt_count"],
                    "correct_count": row["correct_count"],
                    "stability_days": stability_days,
                    "last_practiced_at": last_practiced_at,
                }
            return None
        except Exception as e:
            logger.error(f"Error fetching student mastery as of {target_time_str}: {e}")
            return None

    def save_student_mastery_bitemporal(
        self,
        student_id: UUID,
        course_id: UUID,
        concept_id: UUID,
        elo_score: float,
        bkt_mastery_probability: float,
        mastery_state: str,
        weakness_flag: bool,
        attempt_count: int,
        correct_count: int,
        last_practiced_at: Any,
        stability_days: float,
        valid_range: str | None = None,
    ) -> None:
        if self._stub_mode:
            return

        try:
            if valid_range is not None:
                last_practiced_str = (
                    last_practiced_at.isoformat() if isinstance(last_practiced_at, datetime) else last_practiced_at
                )
                payload = {
                    "p_student_id": str(student_id),
                    "p_course_id": str(course_id),
                    "p_concept_id": str(concept_id),
                    "p_elo_score": elo_score,
                    "p_bkt_mastery_probability": bkt_mastery_probability,
                    "p_mastery_state": mastery_state,
                    "p_weakness_flag": weakness_flag,
                    "p_attempt_count": attempt_count,
                    "p_correct_count": correct_count,
                    "p_last_practiced_at": last_practiced_str,
                    "p_stability_days": stability_days,
                    "p_patch_valid_time": valid_range,
                }
                self.app_client.rpc("patch_student_mastery_retroactive", payload).execute()
            else:
                now_str = datetime.now(UTC).isoformat()
                last_practiced_str = (
                    last_practiced_at.isoformat()
                    if isinstance(last_practiced_at, datetime)
                    else (last_practiced_at or now_str)
                )

                # Standard update to legacy table (which syncs to bitemporal automatically via trigger)
                self.app_client.table("student_concept_mastery").upsert(
                    {
                        "student_id": str(student_id),
                        "course_id": str(course_id),
                        "concept_id": str(concept_id),
                        "elo_score": elo_score,
                        "bkt_mastery_probability": bkt_mastery_probability,
                        "mastery_state": mastery_state,
                        "weakness_flag": weakness_flag,
                        "attempt_count": attempt_count,
                        "correct_count": correct_count,
                        "last_practiced_at": last_practiced_str,
                        "stability_days": stability_days,
                        "updated_at": now_str,
                    }
                ).execute()
        except Exception as e:
            logger.error(f"Error saving student mastery bitemporally: {e}")
