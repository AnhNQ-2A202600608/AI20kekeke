import json
import logging
import os
import re
import time
from datetime import UTC, datetime
from functools import lru_cache
from typing import Any
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException
from pydantic import BaseModel

from src.models.adaptive_schemas import (
    ConceptRelationCreate,
    ConceptRelationResponse,
    ConceptRelationUpdate,
    HintLogRequest,
    RecommendRequest,
    RecommendResponse,
    SubmitRequest,
    SubmitResponse,
)
from src.services.adaptive.bandit import LinUCB, build_student_context, calculate_bandit_reward
from src.services.adaptive.database_interface import AdaptiveDatabaseInterface
from src.services.adaptive.elo import calculate_expected_success
from src.services.adaptive.graph_propagation import propagate_mastery
from src.services.adaptive.supabase_database import SupabaseAdaptiveDatabase
from src.services.auth.supabase_jwt import verify_supabase_jwt_locally
from src.services.cache import get_cache_store
from src.services.cache_keys import mastery_cache_key
from src.services.supabase_config import get_backend_supabase_config

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/adaptive", tags=["Adaptive Engine"])


def get_adaptive_db() -> AdaptiveDatabaseInterface:
    """
    Dependency injection helper to initialize the database adapter.
    Backend database access requires a server-only Supabase key. Public/publishable
    keys are intentionally not accepted for app/audit schema adapters.
    """
    config = get_backend_supabase_config(allow_stub=True)
    if config.is_stub:
        return SupabaseAdaptiveDatabase("", "")
    return _get_adaptive_db_cached(config.url, config.secret_key)


@lru_cache(maxsize=4)
def _get_adaptive_db_cached(url: str, key: str) -> AdaptiveDatabaseInterface:
    return SupabaseAdaptiveDatabase(url, key)


def reset_adaptive_db_cache() -> None:
    _get_adaptive_db_cached.cache_clear()


class AuthenticatedUser(BaseModel):
    id: UUID
    email: str | None = None
    role: str


AUTH_USER_CACHE_TTL_SECONDS = 30.0
_AUTH_USER_CACHE: dict[str, tuple[float, AuthenticatedUser]] = {}


def _get_cached_auth_user(token: str) -> AuthenticatedUser | None:
    cached = _AUTH_USER_CACHE.get(token)
    if not cached:
        return None
    cached_at, user = cached
    if time.monotonic() - cached_at > AUTH_USER_CACHE_TTL_SECONDS:
        _AUTH_USER_CACHE.pop(token, None)
        return None
    return user


def _cache_auth_user(token: str, user: AuthenticatedUser) -> AuthenticatedUser:
    _AUTH_USER_CACHE[token] = (time.monotonic(), user)
    return user


def allow_dev_tokens() -> bool:
    try:
        from src.config import get_settings

        if get_settings().app_env.lower() == "production":
            return False
    except Exception:
        pass
    return os.environ.get("AUTH_ALLOW_DEV_TOKENS", "").strip().lower() in {"1", "true", "yes", "on"}


def allow_service_role_bypass() -> bool:
    try:
        from src.config import get_settings

        if get_settings().app_env.lower() == "production":
            return False
    except Exception:
        pass
    return os.environ.get("AUTH_ALLOW_SERVICE_ROLE_BYPASS", "").strip().lower() in {"1", "true", "yes", "on"}


def is_adaptive_dependency_error(exc: Exception) -> bool:
    return str(exc).startswith("Unable to ") and (
        "bandit arm" in str(exc)
        or "adaptive hints" in str(exc)
        or "adaptive AI usage" in str(exc)
        or "question concepts" in str(exc)
    )


def get_current_user(
    authorization: str = Header(None), db: AdaptiveDatabaseInterface = Depends(get_adaptive_db)
) -> AuthenticatedUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Yêu cầu Header Authorization: Bearer <token> để xác thực.")
    token = authorization.split(" ")[1]

    is_stub_db = bool(getattr(db, "_stub_mode", False) or getattr(db, "app_client", None) is None)
    dev_tokens_allowed = allow_dev_tokens()

    # Handle service_role bypass for explicit tests/internal execution only.
    if token == "service_role" and allow_service_role_bypass():
        return AuthenticatedUser(
            id=UUID("00000000-0000-0000-0000-000000000000"),
            email="service_role@system",
            role="dev",
        )

    auth_cache_key = f"{id(db)}:{int(is_stub_db)}:{int(dev_tokens_allowed)}:{token}"
    cached_user = _get_cached_auth_user(auth_cache_key)
    if cached_user:
        return cached_user

    # 1. Parse token (handle fake-jwt-token prefix or raw UUID)
    user_id_str = token
    if token.startswith("fake-jwt-token-"):
        user_id_str = token.replace("fake-jwt-token-", "")

    # 2. Check if it's a JWT (contains dots)
    is_jwt = "." in token

    user_id = None
    email = None
    role_code = "student"

    if is_stub_db or dev_tokens_allowed:
        # Stub/dev mode keeps seeded local identities but must be explicit outside stub DB.
        if is_jwt:
            try:
                import base64

                payload_b64 = token.split(".")[1]
                payload_b64 += "=" * ((4 - len(payload_b64) % 4) % 4)
                payload_json = json.loads(base64.b64decode(payload_b64).decode("utf-8"))
                uid_str = payload_json.get("sub") or payload_json.get("id") or user_id_str
                user_id = UUID(uid_str)
                email = payload_json.get("email")
                role_code = payload_json.get("role", "student")
            except Exception:
                try:
                    user_id = UUID(user_id_str)
                except ValueError:
                    raise HTTPException(status_code=401, detail="Mã xác thực JWT không hợp lệ trong stub mode.")
        else:
            try:
                user_id = UUID(user_id_str)
            except ValueError:
                raise HTTPException(status_code=401, detail="Mã xác thực không hợp lệ (Không đúng định dạng UUID/JWT).")

        # Map mock users specifically
        mock_user_roles = {
            "d3b07384-d113-4ec5-a58e-0f2d87e07661": "student",
            "55555555-5555-5555-5555-555555555555": "mentor",
            "77777777-7777-7777-7777-777777777777": "admin",
            "36bc990a-5bb6-48a6-a488-b97118497d3f": "admin",
            "88888888-8888-8888-8888-888888888888": "btc",
            "11111111-1111-1111-1111-111111111111": "dev",
            "22222222-2222-2222-2222-222222222222": "dev",
            "33333333-3333-3333-3333-333333333333": "dev",
        }
        uid_key = str(user_id)
        if uid_key in mock_user_roles:
            role_code = mock_user_roles[uid_key]
        return _cache_auth_user(auth_cache_key, AuthenticatedUser(id=user_id, email=email, role=role_code))

    # Live mode is fail-closed: only Supabase JWTs are accepted.
    if not is_jwt or token.startswith("fake-jwt-token-"):
        raise HTTPException(status_code=401, detail="Mã xác thực không hợp lệ hoặc đã hết hạn.")

    try:
        supabase_url = getattr(db, "supabase_url", "") or os.getenv("SUPABASE_URL", "")
        claims = verify_supabase_jwt_locally(token, supabase_url)
        if claims:
            user_id = UUID(claims["sub"])
            email = claims.get("email")
        else:
            auth_start = time.perf_counter()
            user_resp = db.app_client.auth.get_user(token)
            elapsed_ms = round((time.perf_counter() - auth_start) * 1000, 2)
            if elapsed_ms > 150:
                logger.info("Supabase auth.get_user verification took %.2fms", elapsed_ms)
            user_id = UUID(user_resp.user.id)
            email = user_resp.user.email
    except Exception as e:
        logger.warning(f"Lỗi xác thực JWT với Supabase: {e}")
        raise HTTPException(status_code=401, detail="Mã xác thực không hợp lệ hoặc đã hết hạn.")

    # Fetch role from user_roles table. If the role store is unavailable in
    # live mode, fail closed instead of silently downgrading to student.
    try:
        role_response = (
            db.app_client.table("user_roles").select("role_id, roles(code)").eq("user_id", str(user_id)).execute()
        )
        if role_response.data:
            roles_data = role_response.data[0]
            if "roles" in roles_data and roles_data["roles"]:
                role_code = roles_data["roles"].get("code", "student")
    except Exception as e:
        logger.error("Lỗi truy vấn vai trò trong database: %s", e, exc_info=True)
        raise HTTPException(
            status_code=503,
            detail={"code": "role_store_unavailable", "message": "Không thể xác minh vai trò người dùng."},
        )

    return _cache_auth_user(auth_cache_key, AuthenticatedUser(id=user_id, email=email, role=role_code))


class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Quyền truy cập bị từ chối. Cần một trong các vai trò: {', '.join(self.allowed_roles)}",
            )
        return user


def require_role(allowed_roles: list[str]):
    return RoleChecker(allowed_roles)


def get_current_student_id(user: AuthenticatedUser = Depends(get_current_user)) -> UUID:
    return user.id


def normalize_answer_key(answer_key: Any) -> dict[str, Any]:
    if isinstance(answer_key, dict):
        return answer_key
    if isinstance(answer_key, str):
        try:
            parsed = json.loads(answer_key)
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            logger.warning("Invalid answer_key JSON string returned from database.")
    if answer_key is not None:
        logger.warning("Unexpected answer_key shape returned from database: %s", type(answer_key).__name__)
    return {}


def build_recommend_answer_payload(answer_key: dict[str, Any]) -> dict[str, Any]:
    options = answer_key.get("options")
    answer = answer_key.get("correct")
    explanation = answer_key.get("explanation")
    expected_answer = answer_key.get("expected_answer")
    evaluation_points = answer_key.get("evaluation_points")
    sfia_level = answer_key.get("sfia_level")
    competency = answer_key.get("competency")

    return {
        "options": options if isinstance(options, dict) else {},
        "answer": answer if isinstance(answer, str) else None,
        "explanation": explanation if isinstance(explanation, str) else None,
        "expected_answer": expected_answer if isinstance(expected_answer, str) else None,
        "evaluation_points": evaluation_points if isinstance(evaluation_points, list) else [],
        "sfia_level": sfia_level if isinstance(sfia_level, str) else None,
        "competency": competency if isinstance(competency, str) else None,
    }


def require_teacher(user: AuthenticatedUser = Depends(get_current_user)) -> UUID:
    if user.role not in ("mentor", "admin", "dev"):
        raise HTTPException(status_code=403, detail="Chỉ giáo viên hoặc quản trị viên được thực hiện thao tác này.")
    return user.id


def is_day_16_or_later(set_id: str | None) -> bool:
    if not set_id:
        return False
    match = re.match(r"^day(\d+)", set_id)
    if match:
        return int(match.group(1)) >= 16
    return False


@router.post("/recommend", response_model=RecommendResponse)
def recommend_question(
    request: RecommendRequest,
    auth_user: AuthenticatedUser = Depends(get_current_user),
    db: AdaptiveDatabaseInterface = Depends(get_adaptive_db),
):
    """
    Gợi ý câu hỏi tối ưu tiếp theo cho học viên trong một Concept sử dụng LinUCB.
    """
    if auth_user.role == "student" and request.student_id != auth_user.id:
        raise HTTPException(status_code=403, detail="Sinh viên chỉ có quyền yêu cầu gợi ý cho chính mình.")
    route_start = time.perf_counter()
    try:
        db.begin()

        # 1. Truy vấn thông tin năng lực học sinh
        mastery_start = time.perf_counter()
        mastery = db.get_student_mastery(request.student_id, request.course_id, request.concept_id)
        mastery_ms = (time.perf_counter() - mastery_start) * 1000
        p_mastery = mastery["bkt_mastery_probability"]
        elo_score = mastery["elo_score"]

        # 2. Truy vấn danh sách rút gọn (metadata) các câu hỏi ứng viên
        candidates_start = time.perf_counter()
        candidates = db.get_candidate_questions_meta(request.course_id, request.concept_id)
        excluded_question_ids = {str(question_id) for question_id in request.excluded_question_ids}
        if excluded_question_ids:
            candidates = [q for q in candidates if str(q["id"]) not in excluded_question_ids]

        # Lọc tiếp danh sách ứng viên theo set_id nếu Frontend truyền lên và đề từ ngày 16 trở đi
        if request.set_id and is_day_16_or_later(request.set_id):
            candidates = [
                q
                for q in candidates
                if q.get("answer_key")
                and isinstance(q["answer_key"], dict)
                and q["answer_key"].get("set_id") == request.set_id
            ]

        candidates_ms = (time.perf_counter() - candidates_start) * 1000
        if not candidates:
            raise HTTPException(
                status_code=404,
                detail="Không còn câu hỏi adaptive chưa làm cho Concept này.",
            )

        # 3. Đọc trạng thái chính sách Bandit
        policy_start = time.perf_counter()
        policy_id, policy_config = db.get_bandit_policy_state(request.course_id)
        alpha = policy_config.get("alpha", 1.0)
        policy_ms = (time.perf_counter() - policy_start) * 1000

        # 4. Chạy LinUCB
        bandit_start = time.perf_counter()
        bandit = LinUCB(context_dim=3, alpha=alpha)
        X = build_student_context(p_mastery, elo_score)

        # When arms are still cold-started, LinUCB scores can tie exactly.
        # Put the closest ZPD question first so tie-breaks do not always pick
        # the lowest-Elo row returned by the database.
        candidates_for_selection = sorted(
            candidates,
            key=lambda q: abs(calculate_expected_success(elo_score, q["difficulty_elo"]) - 0.75),
        )
        candidate_ids = [str(q["id"]) for q in candidates_for_selection]
        arms_start = time.perf_counter()
        saved_arms = db.get_bandit_arms(policy_id, candidate_ids)
        arms_ms = (time.perf_counter() - arms_start) * 1000
        arms_states = {}
        for qid_str in candidate_ids:
            arm_data = saved_arms.get(qid_str)
            if arm_data and isinstance(arm_data, dict) and "a_inv" in arm_data and "b" in arm_data:
                arms_states[qid_str] = {"A_inv": arm_data["a_inv"], "b": arm_data["b"]}
            else:
                arms_states[qid_str] = bandit.get_default_arm_state()
                db.upsert_bandit_arm(
                    policy_id=policy_id,
                    arm_id=qid_str,
                    a_inv=arms_states[qid_str]["A_inv"],
                    b=arms_states[qid_str]["b"],
                )

        # Chọn arm (câu hỏi)
        selected_qid_str, expected_reward = bandit.select_arm(
            context_vector=X, arms_states=arms_states, candidate_arm_ids=candidate_ids
        )
        bandit_ms = (time.perf_counter() - bandit_start) * 1000

        # 5. Lấy chi tiết đề bài của câu hỏi được chọn
        selected_qid = UUID(selected_qid_str)
        question_start = time.perf_counter()
        selected_candidate = next((q for q in candidates if str(q["id"]) == selected_qid_str), None)
        selected_question = (
            selected_candidate
            if selected_candidate and selected_candidate.get("type") and selected_candidate.get("prompt")
            else db.get_question_by_id(selected_qid)
        )
        question_ms = (time.perf_counter() - question_start) * 1000
        if not selected_question:
            raise HTTPException(status_code=503, detail="Kho dữ liệu adaptive hiện không sẵn sàng.")

        # 6. Tính toán xác suất thành công thực tế dựa trên Elo (Khắc phục lỗi circular feedback của LinUCB)
        expected_success = calculate_expected_success(elo_score, selected_question["difficulty_elo"])

        # 7. Lưu vết quyết định gợi ý câu hỏi
        decision_start = time.perf_counter()
        decision_id = db.log_adaptive_decision(
            policy_id=policy_id,
            student_id=request.student_id,
            course_id=request.course_id,
            concept_id=request.concept_id,
            selected_action_id=selected_qid,
            candidate_action_ids=candidate_ids,
            context_snapshot=X,
            model_snapshot=arms_states[selected_qid_str],
            expected_reward=expected_reward,
            expected_success=expected_success,
        )
        decision_ms = (time.perf_counter() - decision_start) * 1000

        db.commit()
        total_ms = (time.perf_counter() - route_start) * 1000
        logger.info(
            "ADAPTIVE_RECOMMEND %.0fms concept=%s q=%s candidates=%s excluded=%s success=%.2f "
            "db=[mastery %.0f,cand %.0f,policy %.0f,arms %.0f,question %.0f,decision %.0f]ms bandit=%.0fms",
            total_ms,
            request.concept_id,
            selected_qid,
            len(candidate_ids),
            len(excluded_question_ids),
            expected_success,
            mastery_ms,
            candidates_ms,
            policy_ms,
            arms_ms,
            question_ms,
            decision_ms,
            bandit_ms,
        )

        answer_key = normalize_answer_key(selected_question.get("answer_key"))
        answer_payload = build_recommend_answer_payload(answer_key)

        can_view_diagnostics = auth_user.role in {"admin", "dev"}
        timings_ms = {
            "total": round(total_ms, 2),
            "mastery": round(mastery_ms, 2),
            "candidates": round(candidates_ms, 2),
            "policy": round(policy_ms, 2),
            "arms": round(arms_ms, 2),
            "question": round(question_ms, 2),
            "decision": round(decision_ms, 2),
            "bandit": round(bandit_ms, 2),
        }
        diagnostics_payload = {"question_difficulty_elo": selected_question["difficulty_elo"]}
        if can_view_diagnostics:
            diagnostics_payload.update(
                {
                    "candidate_count": len(candidate_ids),
                    "concept_elo": elo_score,
                    "bkt_mastery_probability": p_mastery,
                    "timings_ms": timings_ms,
                }
            )

        return RecommendResponse(
            decision_id=decision_id,
            question_id=selected_qid,
            type=selected_question["type"],
            prompt=selected_question["prompt"],
            options=answer_payload["options"],
            answer=answer_payload["answer"],
            explanation=answer_payload["explanation"],
            expected_answer=answer_payload["expected_answer"],
            evaluation_points=answer_payload["evaluation_points"],
            sfia_level=answer_payload["sfia_level"],
            competency=answer_payload["competency"],
            hints=selected_question.get("hints") or [],
            expected_success=expected_success,
            expected_reward=expected_reward,
            **diagnostics_payload,
        )

    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        logger.error(f"Lỗi gợi ý câu hỏi: {str(e)}", exc_info=True)
        if is_adaptive_dependency_error(e):
            raise HTTPException(status_code=503, detail="Kho dữ liệu adaptive hiện không sẵn sàng.")

        # Attempt local offline JSON fallback using local questions
        try:
            from uuid import uuid4

            from src.services.diagnostic_engine import DiagnosticEngine

            engine = DiagnosticEngine()
            concept_id_str = str(request.concept_id)

            # Find candidate questions matching this concept YCCD
            candidates = [
                q
                for q in engine.questions_data
                if concept_id_str in q.get("yccd", []) and q.get("question_id") not in request.excluded_question_ids
            ]
            if not candidates:
                candidates = [q for q in engine.questions_data if concept_id_str in q.get("yccd", [])]
            if not candidates:
                candidates = engine.questions_data

            if candidates:
                selected_q = candidates[0]
                options_dict = selected_q.get("options", {})

                # Format hints
                levels = ["light", "medium", "deep"]
                formatted_hints = [
                    {"level": levels[i], "content": text}
                    for i, text in enumerate(selected_q.get("socratic_hints", []))
                    if i < 3
                ]

                return RecommendResponse(
                    decision_id=uuid4(),
                    question_id=uuid4(),
                    type="mcq" if options_dict else "short_answer",
                    prompt=selected_q.get("text", "Câu hỏi luyện tập"),
                    options=options_dict,
                    answer=selected_q.get("dap_an"),
                    explanation="Chọn ở chế độ offline.",
                    expected_answer=selected_q.get("dap_an") if not options_dict else None,
                    evaluation_points=[],
                    sfia_level="3",
                    competency="Kiến thức nền",
                    hints=formatted_hints,
                    expected_success=0.75,
                    expected_reward=0.75,
                    question_difficulty_elo=1200.0,
                )
        except Exception as fallback_err:
            logger.error(f"Offline recommendation fallback failed: {fallback_err}", exc_info=True)

        raise HTTPException(status_code=503, detail="Kho dữ liệu adaptive hiện không sẵn sàng.")


def grade_answer(question: dict, student_answer: dict) -> float:
    qtype = question.get("type")
    key = normalize_answer_key(question.get("answer_key"))
    if qtype == "mcq":
        correct = key.get("correct")
        selected = student_answer.get("selected_option")
        return 1.0 if selected == correct else 0.0
    elif qtype == "numeric":
        try:
            student_val = float(student_answer.get("value"))
            correct_val = float(key.get("value"))
            tolerance = float(key.get("tol", 0.0))
            return 1.0 if abs(student_val - correct_val) <= tolerance else 0.0
        except (TypeError, ValueError):
            return 0.0
    elif qtype == "short_answer":
        try:
            student_text = str(student_answer.get("text", "")).strip().lower()
            student_text = " ".join(student_text.split())
            accepted_answers = key.get("accept", [])
            normalized_accepted = [" ".join(str(ans).strip().lower().split()) for ans in accepted_answers]
            return 1.0 if student_text in normalized_accepted else 0.0
        except Exception:
            return 0.0
    return 0.0


def run_async_propagation(
    db: AdaptiveDatabaseInterface,
    student_id: UUID,
    course_id: UUID,
    concept_id: UUID,
    old_bkt: float,
    new_bkt: float,
    source_attempt_id: UUID | None = None,
):
    try:
        propagate_mastery(db, student_id, course_id, concept_id, old_bkt, new_bkt, source_attempt_id=source_attempt_id)
    except Exception as e:
        logger.error(f"Lỗi lan truyền đồ thị bất đồng bộ: {e}")


@router.post("/hints/log")
def log_hint_usage(
    request: HintLogRequest,
    auth_user: AuthenticatedUser = Depends(get_current_user),
    db: AdaptiveDatabaseInterface = Depends(get_adaptive_db),
):
    if auth_user.role == "student" and request.student_id != auth_user.id:
        raise HTTPException(status_code=403, detail="Sinh viên chỉ có quyền ghi gợi ý của chính mình.")

    try:
        decision = db.get_adaptive_decision(request.decision_id)
        if not decision:
            raise HTTPException(status_code=404, detail="Không tìm thấy thông tin quyết định gợi ý tương ứng.")
        if str(decision["student_id"]) != str(request.student_id):
            raise HTTPException(status_code=403, detail="Vết quyết định không thuộc về học sinh mở gợi ý.")
        if str(decision["selected_action_id"]) != str(request.question_id):
            raise HTTPException(status_code=400, detail="Mã câu hỏi mở gợi ý không trùng khớp với câu hỏi được gợi ý.")
        if decision.get("consumed_at") is not None:
            raise HTTPException(status_code=409, detail="Lượt làm bài đã được nộp trước đó.")

        hint_id = db.log_hint_usage(
            request.student_id,
            request.course_id,
            request.question_id,
            request.decision_id,
            request.hint_level,
        )
        return {"id": str(hint_id)}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Adaptive hint log failed: %s", exc)
        raise HTTPException(status_code=503, detail="Kho dữ liệu adaptive hiện không sẵn sàng.")


@router.post("/submit", response_model=SubmitResponse)
def submit_attempt(
    request: SubmitRequest,
    background_tasks: BackgroundTasks,
    auth_user: AuthenticatedUser = Depends(get_current_user),
    db: AdaptiveDatabaseInterface = Depends(get_adaptive_db),
):
    """
    Nộp bài, tự động cập nhật Elo học sinh & câu hỏi, cập nhật BKT và tối ưu hóa ma trận Bandit.
    """
    if auth_user.role == "student" and request.student_id != auth_user.id:
        raise HTTPException(status_code=403, detail="Sinh viên chỉ có quyền nộp bài làm của chính mình.")
    route_start = time.perf_counter()
    try:
        db.begin()

        # 1. Đọc vết quyết định để kiểm tra chéo (Cross-validation chặn Replay Attack)
        decision_start = time.perf_counter()
        decision = db.get_adaptive_decision(request.decision_id)
        decision_ms = (time.perf_counter() - decision_start) * 1000
        if not decision:
            raise HTTPException(status_code=404, detail="Không tìm thấy thông tin quyết định gợi ý tương ứng.")

        if str(decision["student_id"]) != str(request.student_id):
            raise HTTPException(status_code=403, detail="Vết quyết định không thuộc về học sinh nộp bài.")
        if str(decision["selected_action_id"]) != str(request.question_id):
            raise HTTPException(status_code=400, detail="Mã câu hỏi nộp bài không trùng khớp với câu hỏi được gợi ý.")

        # Chống replay attack ở API layer
        if decision.get("consumed_at") is not None:
            raise HTTPException(status_code=409, detail="Lượt làm bài đã được nộp trước đó.")

        expected_success = decision["expected_success"]
        X_snapshot = decision["context_snapshot"]

        # 2. Lấy trạng thái năng lực hiện tại
        mastery_start = time.perf_counter()
        mastery = db.get_student_mastery(request.student_id, request.course_id, request.concept_id)
        mastery_ms = (time.perf_counter() - mastery_start) * 1000
        old_elo = mastery["elo_score"]
        old_bkt = mastery["bkt_mastery_probability"]

        # 3. Lấy câu hỏi để tự động chấm điểm phía máy chủ (Server-side grading - B4)
        question_start = time.perf_counter()
        question = db.get_question_by_id(request.question_id)
        question_ms = (time.perf_counter() - question_start) * 1000
        if not question:
            raise HTTPException(status_code=404, detail="Không tìm thấy câu hỏi.")

        # Tự động chấm điểm
        grade_start = time.perf_counter()
        actual_score = grade_answer(question, request.student_answer)
        is_correct = actual_score >= 0.75
        grade_ms = (time.perf_counter() - grade_start) * 1000

        # 4. Thực thi transaction RPC v3 ở DB (Atomic, Race condition protection, BKT & Bandit in DB)
        bandit_reward = calculate_bandit_reward(expected_success, actual_score)

        # Đếm hint & cờ AI từ server log (không tin client)
        signal_start = time.perf_counter()
        if not db._stub_mode:
            hint_count = db.count_hints(request.decision_id)
            used_ai_help = False
        else:
            hint_count = request.hint_count
            used_ai_help = False
        signal_ms = (time.perf_counter() - signal_start) * 1000

        # Clamp response_time_ms: min 300ms, max 3600000ms (1 hour)
        clamped_response_time = max(300, min(3600000, request.response_time_ms or 30000))

        payload = {
            "p_decision_id": str(request.decision_id),
            "p_student_id": str(request.student_id),
            "p_course_id": str(request.course_id),
            "p_concept_id": str(request.concept_id),
            "p_question_id": str(request.question_id),
            "p_student_answer": request.student_answer,
            "p_actual_score": actual_score,
            "p_hint_count": hint_count,
            "p_used_ai_help": used_ai_help,
            "p_context": X_snapshot,
            "p_reward": bandit_reward,
            "p_k_question": 32.0,
            "p_response_time_ms": clamped_response_time,
        }

        txn_start = time.perf_counter()
        txn_result = None

        # Nếu database ở stub mode hoặc ngoại tuyến, ghi offline
        is_mock = "mock" in type(db).__name__.lower()
        is_stub = False if is_mock else bool(getattr(db, "_stub_mode", False))
        is_offline = False if is_mock else (getattr(db, "app_client", None) is None)

        if is_stub or is_offline:
            try:
                from src.services.diagnostic_engine import DiagnosticEngine

                engine = DiagnosticEngine()
                engine.queue_offline_attempt(payload)
                import uuid

                txn_result = {
                    "attempt_id": str(uuid.uuid4()),
                    "new_student_elo": old_elo,
                    "expected_success": expected_success,
                    "new_bkt": old_bkt,
                    "new_state": mastery.get("mastery_state", "not_started"),
                    "weakness_flag": mastery.get("weakness_flag", False),
                    "is_correct": is_correct,
                    "offline_saved": True,
                }
            except Exception as offline_err:
                logger.error(f"Lỗi khi ghi attempt offline trong stub mode: {offline_err}", exc_info=True)
        else:
            try:
                txn_result = db.submit_attempt_v3(payload)
            except Exception as api_err:
                logger.warning(f"Supabase submit_attempt_v3 failed: {api_err}. Fallback to offline SQLite queue.")
                try:
                    from src.services.diagnostic_engine import DiagnosticEngine

                    engine = DiagnosticEngine()
                    engine.queue_offline_attempt(payload)
                    import uuid

                    txn_result = {
                        "attempt_id": str(uuid.uuid4()),
                        "new_student_elo": old_elo,
                        "expected_success": expected_success,
                        "new_bkt": old_bkt,
                        "new_state": mastery.get("mastery_state", "not_started"),
                        "weakness_flag": mastery.get("weakness_flag", False),
                        "is_correct": is_correct,
                        "offline_saved": True,
                    }
                except Exception as offline_err:
                    logger.error(f"Lỗi khi ghi attempt offline trong fallback: {offline_err}", exc_info=True)
                    raise api_err

        txn_ms = (time.perf_counter() - txn_start) * 1000
        if not txn_result:
            raise HTTPException(status_code=503, detail="Kho dữ liệu adaptive hiện không sẵn sàng.")

        # Phòng vệ nếu txn_result là MagicMock trong test
        if isinstance(txn_result, dict):
            attempt_id_raw = txn_result.get("attempt_id") or txn_result.get("quiz_attempt_id")
            source_attempt_id = UUID(str(attempt_id_raw)) if attempt_id_raw else None
            new_student_elo = txn_result.get("new_student_elo", old_elo)
            submit_expected_success = txn_result.get("expected_success", expected_success)
            new_bkt = txn_result.get("new_bkt", old_bkt)
            new_state = txn_result.get("new_state", mastery.get("mastery_state", "not_started"))
            weakness_flag = txn_result.get("weakness_flag", mastery.get("weakness_flag", False))
            is_correct = txn_result.get("is_correct", is_correct)
            stability_days = txn_result.get("stability_days", mastery.get("stability_days", 3.0))
        else:
            source_attempt_id = None
            try:
                new_student_elo = txn_result["new_student_elo"]
                submit_expected_success = txn_result.get("expected_success", expected_success)
                new_bkt = txn_result["new_bkt"]
                new_state = txn_result["new_state"]
                weakness_flag = txn_result["weakness_flag"]
                is_correct = txn_result["is_correct"]
                stability_days = txn_result.get("stability_days", 3.0)
            except Exception:
                new_student_elo = old_elo
                submit_expected_success = expected_success
                new_bkt = old_bkt
                new_state = mastery.get("mastery_state", "not_started")
                weakness_flag = mastery.get("weakness_flag", False)
                stability_days = mastery.get("stability_days", 3.0)

        db.commit()

        # 5. Chạy lan truyền đồ thị bất đồng bộ ngoài transaction chính
        background_tasks.add_task(
            run_async_propagation,
            db,
            request.student_id,
            request.course_id,
            request.concept_id,
            old_bkt,
            new_bkt,
            source_attempt_id,
        )

        # 8. Ghi lại vào Cache (Write-through cache - H5)
        cache_ms = 0.0
        try:
            cache_start = time.perf_counter()
            cache = get_cache_store()
            cache_key = mastery_cache_key(str(request.student_id), str(request.course_id), str(request.concept_id))
            updated_profile = {
                "elo_score": new_student_elo,
                "bkt_mastery_probability": new_bkt,
                "weakness_flag": weakness_flag,
                "mastery_state": new_state,
                "stability_days": stability_days,
                "last_practiced_at": datetime.now(UTC).isoformat(),
            }
            cache.set(cache_key, json.dumps(updated_profile), ttl=300)
            cache_ms = (time.perf_counter() - cache_start) * 1000
        except Exception as ce:
            cache_ms = (time.perf_counter() - cache_start) * 1000 if "cache_start" in locals() else 0.0
            logger.warning(f"Lỗi cập nhật write-through cache: {ce}")

        elo_delta = round(float(new_student_elo) - float(old_elo), 2)
        raw_score_delta_value = float(actual_score) - float(submit_expected_success)
        hint_discount = 1.0
        if raw_score_delta_value > 0 and hint_count > 0:
            hint_discount = max(0.1, 1.0 - 0.3 * hint_count)
        effective_score_delta = (
            raw_score_delta_value * hint_discount if raw_score_delta_value > 0 else raw_score_delta_value
        )
        inferred_k_student = round(elo_delta / effective_score_delta, 2) if abs(effective_score_delta) > 1e-9 else 0.0
        calculation_log = {
            "formula": "new_elo = old_elo + k_student * (actual_score - expected_success) * hint_discount",
            "old_elo": round(float(old_elo), 2),
            "new_elo": round(float(new_student_elo), 2),
            "elo_delta": elo_delta,
            "question_difficulty_elo": round(float(question["difficulty_elo"]), 2),
            "expected_success": round(float(submit_expected_success), 4),
            "actual_score": round(float(actual_score), 4),
            "raw_score_delta": round(raw_score_delta_value, 4),
            "hint_count": hint_count,
            "hint_discount": round(float(hint_discount), 4),
            "k_student": inferred_k_student,
            "used_ai_help": used_ai_help,
        }

        total_ms = (time.perf_counter() - route_start) * 1000
        logger.info(
            "ADAPTIVE_SUBMIT %.0fms concept=%s q=%s correct=%s score=%.2f response=%sms hints=%s ai=%s "
            "db=[decision %.0f,mastery %.0f,question %.0f,signal %.0f,txn %.0f,cache %.0f]ms grade=%.0fms",
            total_ms,
            request.concept_id,
            request.question_id,
            is_correct,
            actual_score,
            clamped_response_time,
            hint_count,
            used_ai_help,
            decision_ms,
            mastery_ms,
            question_ms,
            signal_ms,
            txn_ms,
            cache_ms,
            grade_ms,
        )

        return SubmitResponse(
            is_correct=is_correct,
            actual_score=actual_score,
            old_elo=old_elo,
            new_elo=new_student_elo,
            old_bkt=old_bkt,
            new_bkt=new_bkt,
            mastery_state=new_state,
            weakness_flag=weakness_flag,
            bandit_reward=bandit_reward,
            stability_days=stability_days,
            calculation_log=calculation_log,
        )

    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        logger.error(f"Lỗi xử lý nộp bài: {str(e)}", exc_info=True)
        # Bắt lỗi replay attack từ DB
        err_str = str(e)
        if "42501" in err_str or "permission denied for function" in err_str:
            raise HTTPException(
                status_code=503,
                detail="Backend Supabase RPC permission is misconfigured. Check SUPABASE_SECRET_KEY and function grants.",
            )
        if "DECISION_INVALID_OR_CONSUMED" in err_str or "P0409" in err_str:
            raise HTTPException(status_code=409, detail="Lượt làm bài đã được nộp trước đó.")
        if is_adaptive_dependency_error(e):
            raise HTTPException(status_code=503, detail="Kho dữ liệu adaptive hiện không sẵn sàng.")
        raise HTTPException(status_code=503, detail="Kho dữ liệu adaptive hiện không sẵn sàng.")


class SyncMasteryRequest(BaseModel):
    student_id: UUID
    course_id: UUID
    concept_code: str
    elo_score: float
    bkt_mastery_probability: float
    mastery_state: str
    weakness_flag: bool
    is_correct: bool


@router.get("/mastery")
def get_all_mastery(
    student_id: UUID,
    course_id: UUID,
    auth_user: AuthenticatedUser = Depends(get_current_user),
    db: AdaptiveDatabaseInterface = Depends(get_adaptive_db),
):
    """
    Lấy toàn bộ thông tin tiến độ/độ thành thạo (Elo & BKT) của học viên đối với tất cả các Concept của khóa học.
    """
    if auth_user.role == "student" and student_id != auth_user.id:
        raise HTTPException(status_code=403, detail="Sinh viên chỉ có quyền truy cập dữ liệu năng lực của chính mình.")
    try:
        masteries = db.get_all_student_concept_mastery(student_id, course_id)
        return masteries
    except Exception as e:
        logger.error(f"Lỗi lấy thông tin độ thành thạo: {str(e)}", exc_info=True)
        raise HTTPException(status_code=503, detail="Không thể tải dữ liệu tiến trình.")


@router.post("/sync-mastery")
def sync_mastery(
    request: SyncMasteryRequest,
    auth_user: AuthenticatedUser = Depends(get_current_user),
    db: AdaptiveDatabaseInterface = Depends(get_adaptive_db),
):
    """
    Cập nhật trực tiếp tiến trình Elo & BKT của học sinh cho một Concept cụ thể (sau khi làm bài tập tự luyện).
    """
    if auth_user.role == "student" and request.student_id != auth_user.id:
        raise HTTPException(status_code=403, detail="Sinh viên chỉ có quyền đồng bộ tiến trình học tập của chính mình.")
    try:
        concept_id = db.get_concept_id_by_code(request.concept_code)
        if not concept_id:
            raise HTTPException(status_code=404, detail=f"Không tìm thấy Concept với mã code: {request.concept_code}")

        db.begin()
        db.update_student_mastery(
            student_id=request.student_id,
            course_id=request.course_id,
            concept_id=concept_id,
            elo_score=request.elo_score,
            bkt_mastery_probability=request.bkt_mastery_probability,
            mastery_state=request.mastery_state,
            weakness_flag=request.weakness_flag,
            is_correct=request.is_correct,
        )
        db.commit()
        return {"status": "success"}
    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        logger.error(f"Lỗi đồng bộ tiến trình học tập: {str(e)}", exc_info=True)
        raise HTTPException(status_code=503, detail="Không thể đồng bộ tiến trình học tập.")


@router.get("/graph/relations", response_model=list[ConceptRelationResponse])
def get_graph_relations(
    course_id: UUID,
    status: str | None = None,
    auth_student_id: UUID = Depends(get_current_student_id),
    db: AdaptiveDatabaseInterface = Depends(get_adaptive_db),
):
    """
    Lấy danh sách các quan hệ giữa các concept của khóa học.
    Có thể lọc theo status ('draft', 'approved', 'rejected').
    """
    try:
        relations = db.get_concept_relations(course_id, status)
        return relations
    except Exception as e:
        logger.error(f"Lỗi lấy danh sách quan hệ concept: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail="Không thể tải quan hệ concept.")


@router.post("/graph/relations", response_model=ConceptRelationResponse)
def create_graph_relation(
    request: ConceptRelationCreate,
    auth_user_id: UUID = Depends(require_teacher),
    db: AdaptiveDatabaseInterface = Depends(get_adaptive_db),
):
    """
    Tạo một quan hệ mới giữa các concept.
    """
    if request.weight < 0.0 or request.weight > 1.0:
        raise HTTPException(status_code=422, detail="Trọng số phải nằm trong khoảng [0.0, 1.0].")
    if request.status not in ("draft", "approved", "rejected"):
        raise HTTPException(status_code=422, detail="Trạng thái quan hệ không hợp lệ.")
    try:
        db.begin()
        relation = db.create_concept_relation(
            course_id=request.course_id,
            source_concept_id=request.source_concept_id,
            target_concept_id=request.target_concept_id,
            relation_type=request.relation_type,
            weight=request.weight,
            status=request.status,
        )
        if not relation:
            raise HTTPException(status_code=503, detail="Không thể tạo quan hệ concept.")
        db.commit()
        return relation
    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        logger.error(f"Lỗi tạo quan hệ concept: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail="Không thể tạo quan hệ concept.")


@router.patch("/graph/relations/{relation_id}", response_model=ConceptRelationResponse)
def update_graph_relation(
    relation_id: UUID,
    request: ConceptRelationUpdate,
    auth_user_id: UUID = Depends(require_teacher),
    db: AdaptiveDatabaseInterface = Depends(get_adaptive_db),
):
    """
    Cập nhật trạng thái phê duyệt (approved/rejected) hoặc trọng số (weight) của một quan hệ.
    """
    if request.weight is not None and (request.weight < 0.0 or request.weight > 1.0):
        raise HTTPException(status_code=422, detail="Trọng số phải nằm trong khoảng [0.0, 1.0].")
    if request.status is not None and request.status not in ("draft", "approved", "rejected"):
        raise HTTPException(status_code=422, detail="Trạng thái quan hệ không hợp lệ.")
    try:
        db.begin()
        relation = db.update_concept_relation(
            relation_id=relation_id,
            status=request.status,
            weight=request.weight,
        )
        if not relation:
            raise HTTPException(status_code=404, detail="Không tìm thấy quan hệ concept tương ứng.")
        db.commit()
        return relation
    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        logger.error(f"Lỗi cập nhật quan hệ concept: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail="Không thể cập nhật quan hệ concept.")


@router.delete("/graph/relations/{relation_id}")
def delete_graph_relation(
    relation_id: UUID,
    auth_user_id: UUID = Depends(require_teacher),
    db: AdaptiveDatabaseInterface = Depends(get_adaptive_db),
):
    """
    Xóa một quan hệ concept.
    """
    try:
        db.begin()
        deleted = db.delete_concept_relation(relation_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Không tìm thấy quan hệ concept tương ứng.")
        db.commit()
        return {"status": "success", "message": "Quan hệ đã được xóa thành công."}
    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        logger.error(f"Lỗi xóa quan hệ concept: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail="Không thể xóa quan hệ concept.")


class WeakestSkillResponse(BaseModel):
    id: str | None = None
    name: str | None = None
    avg_elo: float | None = None


class ClassStatsResponse(BaseModel):
    total_students: int
    class_average_elo: float
    weakest_skill: WeakestSkillResponse | None = None
    completion_rate: float


@router.get("/class-stats", response_model=ClassStatsResponse)
def get_class_stats_endpoint(
    course_id: UUID,
    auth_user: AuthenticatedUser = Depends(get_current_user),
    db: AdaptiveDatabaseInterface = Depends(get_adaptive_db),
):
    """
    Lấy thông tin thống kê chung của lớp học: Sĩ số, ELO TB, kỹ năng yếu nhất, tỉ lệ hoàn thành TB.
    Yêu cầu quyền giảng viên (mentor), admin, hoặc dev.
    """
    if auth_user.role not in ("mentor", "admin", "dev"):
        raise HTTPException(
            status_code=403, detail="Chỉ giảng viên hoặc quản trị viên mới được phép xem thống kê lớp học."
        )

    try:
        # 1. Chế độ Stub / Mock Fallback
        if db._stub_mode or db.app_client is None:
            return ClassStatsResponse(
                total_students=5,
                class_average_elo=1127.0,
                weakest_skill=WeakestSkillResponse(
                    id="M7.SDS.05", name="Vận dụng tính chất tỉ lệ thức, đại lượng tỉ lệ", avg_elo=1028.0
                ),
                completion_rate=40.0,
            )

        # 2. Đọc dữ liệu từ cache để phản hồi tức thì
        cache_key = f"class_stats:{str(course_id)}"
        try:
            cache = get_cache_store()
            cached_data = cache.get(cache_key)
            if cached_data:
                import json

                stats_dict = json.loads(cached_data)
                return ClassStatsResponse(**stats_dict)
        except Exception as ce:
            logger.warning(f"Lỗi đọc class stats cache: {ce}")

        # 3. Sử dụng ThreadPoolExecutor để chạy các truy vấn cơ sở dữ liệu song song
        import concurrent.futures

        with concurrent.futures.ThreadPoolExecutor() as executor:
            # Truy vấn học sinh thực tế (bỏ qua benchmark/test users có email chứa example.com)
            future_users = executor.submit(
                lambda: db.app_client.table("users").select("id, email").not_.like("email", "%example.com%").execute()
            )
            # Lấy danh sách ID là giáo viên/admin/dev/btc để loại trừ
            future_roles = executor.submit(
                lambda: db.app_client.table("user_roles").select("user_id, roles(code)").execute()
            )
            # Truy vấn các concepts trong khóa
            future_concepts = executor.submit(
                lambda: (
                    db.app_client.table("concepts")
                    .select("id, name, code")
                    .eq("course_id", str(course_id))
                    .eq("status", "active")
                    .execute()
                )
            )

            # Chờ kết quả
            users_resp = future_users.result()
            roles_resp = future_roles.result()
            concepts_resp = future_concepts.result()

        all_users = users_resp.data or []

        staff_ids = set()
        for r in roles_resp.data or []:
            if r.get("roles") and r["roles"].get("code") in ("mentor", "admin", "dev", "btc"):
                staff_ids.add(r["user_id"])

        student_ids = [u["id"] for u in all_users if u["id"] not in staff_ids]
        if not student_ids:
            return ClassStatsResponse(
                total_students=0, class_average_elo=1200.0, weakest_skill=None, completion_rate=0.0
            )

        concepts = concepts_resp.data or []
        if not concepts:
            return ClassStatsResponse(
                total_students=len(student_ids), class_average_elo=1200.0, weakest_skill=None, completion_rate=0.0
            )

        concept_id_to_name = {c["id"]: c["name"] for c in concepts}
        total_concepts = len(concepts)

        # 4. Truy vấn kết quả năng lực (student_concept_mastery) của các học viên này (Sử dụng batching để tránh giới hạn 1000 dòng của Supabase)
        masteries = []
        batch_size = 15
        for i in range(0, len(student_ids), batch_size):
            batch_ids = student_ids[i : i + batch_size]
            batch_resp = (
                db.app_client.table("student_concept_mastery")
                .select(
                    "student_id, concept_id, elo_score, bkt_mastery_probability, mastery_state, weakness_flag, attempt_count"
                )
                .eq("course_id", str(course_id))
                .in_("student_id", batch_ids)
                .execute()
            )
            masteries.extend(batch_resp.data or [])

        # 5. Khởi dựng ma trận dữ liệu đầy đủ (bao gồm giá trị mặc định cho concepts chưa bắt đầu)
        student_mastery_map = {
            sid: {
                cid: {
                    "elo_score": 1200.0,
                    "bkt_mastery_probability": 0.25,
                    "mastery_state": "not_started",
                    "weakness_flag": False,
                    "attempt_count": 0,
                }
                for cid in concept_id_to_name.keys()
            }
            for sid in student_ids
        }

        for record in masteries:
            sid = record["student_id"]
            cid = record["concept_id"]
            if sid in student_mastery_map and cid in student_mastery_map[sid]:
                student_mastery_map[sid][cid] = {
                    "elo_score": float(record["elo_score"]),
                    "bkt_mastery_probability": float(record["bkt_mastery_probability"]),
                    "mastery_state": record["mastery_state"],
                    "weakness_flag": bool(record["weakness_flag"]),
                    "attempt_count": int(record.get("attempt_count") or 0),
                }

        # 6. Tính toán các chỉ số
        student_avg_elos = []
        student_completion_rates = []
        concept_elos = {cid: [] for cid in concept_id_to_name.keys()}

        for sid, concepts_map in student_mastery_map.items():
            # Elo trung bình học sinh (Chỉ tính các concept đã thực hành giống Frontend)
            practiced_elos = [
                cinfo["elo_score"] for cinfo in concepts_map.values() if cinfo.get("attempt_count", 0) > 0
            ]
            if practiced_elos:
                avg_elo = sum(practiced_elos) / len(practiced_elos)
            else:
                all_elos = [cinfo["elo_score"] for cinfo in concepts_map.values()]
                avg_elo = sum(all_elos) / len(all_elos) if all_elos else 1200.0
            student_avg_elos.append(avg_elo)

            # Completion rate của học sinh (mastery_state là 'mastered')
            mastered_count = sum(
                1 for cinfo in concepts_map.values() if str(cinfo["mastery_state"]).lower() == "mastered"
            )
            comp_rate = (mastered_count / total_concepts * 100) if total_concepts > 0 else 0.0
            student_completion_rates.append(comp_rate)

            # Phân bổ Elo theo concept
            for cid, cinfo in concepts_map.items():
                concept_elos[cid].append(cinfo["elo_score"])

        class_average_elo = sum(student_avg_elos) / len(student_avg_elos) if student_avg_elos else 1200.0
        class_completion_rate = (
            sum(student_completion_rates) / len(student_completion_rates) if student_completion_rates else 0.0
        )

        # Tìm concept có ELO trung bình thấp nhất (Weakest Skill)
        weakest_concept_id = None
        weakest_avg_elo = None

        for cid, elos in concept_elos.items():
            avg_elo = sum(elos) / len(elos) if elos else 1200.0
            if weakest_avg_elo is None or avg_elo < weakest_avg_elo:
                weakest_avg_elo = avg_elo
                weakest_concept_id = cid

        weakest_skill = None
        if weakest_concept_id:
            weakest_skill = WeakestSkillResponse(
                id=str(weakest_concept_id), name=concept_id_to_name[weakest_concept_id], avg_elo=weakest_avg_elo
            )

        response_data = ClassStatsResponse(
            total_students=len(student_ids),
            class_average_elo=class_average_elo,
            weakest_skill=weakest_skill,
            completion_rate=class_completion_rate,
        )

        # Ghi kết quả vào cache trong 60 giây
        try:
            cache = get_cache_store()
            import json

            cache.set(cache_key, json.dumps(response_data.model_dump()), ttl=60)
        except Exception as ce:
            logger.warning(f"Lỗi ghi class stats cache: {ce}")

        return response_data

    except Exception as e:
        logger.error(f"Lỗi khi tính toán thống kê lớp: {str(e)}", exc_info=True)
        raise HTTPException(status_code=503, detail="Lỗi hệ thống khi tính toán thống kê lớp học.")


# --- CLASS INSIGHTS SCHEMAS & ENDPOINT ---


class InsightSkill(BaseModel):
    concept_id: UUID
    code: str
    name: str
    elo: float
    bkt_mastery_probability: float
    bkt_mastery_probability_stored: float | None = None
    mastery_state: str
    weakness_flag: bool
    attempt_count: int
    correct_count: int
    last_practiced_at: str | None = None
    stability_days: float | None = None


class InsightAttempt(BaseModel):
    id: UUID
    question_prompt: str
    concept_name: str
    is_correct: bool
    actual_score: float
    hint_count: int
    submitted_at: str
    response_time_ms: int | None = None


class InsightStudent(BaseModel):
    id: UUID
    full_name: str
    email: str
    mssv: str | None = None
    accuracy_rate: float
    total_attempts: int
    total_correct: int
    active_days_count: int
    ai_chat_count: int
    last_active_at: str | None = None
    streak: int = 0
    skills: list[InsightSkill]
    recent_attempts: list[InsightAttempt]


class ClassInsightsResponse(BaseModel):
    total_count: int
    page: int
    limit: int
    students: list[InsightStudent]


def get_mock_backend_students() -> list[dict]:
    return [
        {
            "id": "8c4bc657-3f30-4e89-8d4e-b5c6d3df594d",
            "full_name": "Nguyễn Văn Anh",
            "email": "vananh.nguyen@example.com",
            "mssv": "2A202611111",
            "accuracy_rate": 92.0,
            "total_attempts": 25,
            "total_correct": 23,
            "active_days_count": 25,
            "ai_chat_count": 21,
            "last_active_at": "2026-06-23T09:10:00Z",
            "streak": 12,
            "skills": [
                {
                    "concept_id": "00000000-0000-0000-0000-000000000010",
                    "code": "M7.SDS.05",
                    "name": "Vận dụng tính chất tỉ lệ thức, đại lượng tỉ lệ",
                    "elo": 1420.0,
                    "bkt_mastery_probability": 0.95,
                    "bkt_mastery_probability_stored": 0.95,
                    "mastery_state": "mastered",
                    "weakness_flag": False,
                    "attempt_count": 12,
                    "correct_count": 11,
                    "last_practiced_at": "2026-06-23T09:10:00Z",
                    "stability_days": 15.0,
                },
                {
                    "concept_id": "00000000-0000-0000-0000-000000000011",
                    "code": "M6.SDS.03",
                    "name": "Hiểu tỉ số của hai đại lượng",
                    "elo": 1480.0,
                    "bkt_mastery_probability": 0.98,
                    "bkt_mastery_probability_stored": 0.98,
                    "mastery_state": "mastered",
                    "weakness_flag": False,
                    "attempt_count": 8,
                    "correct_count": 8,
                    "last_practiced_at": "2026-06-23T09:10:00Z",
                    "stability_days": 15.0,
                },
                {
                    "concept_id": "00000000-0000-0000-0000-000000000012",
                    "code": "M5.SDS.02",
                    "name": "Nhận biết hai phân số bằng nhau",
                    "elo": 1510.0,
                    "bkt_mastery_probability": 0.99,
                    "bkt_mastery_probability_stored": 0.99,
                    "mastery_state": "mastered",
                    "weakness_flag": False,
                    "attempt_count": 5,
                    "correct_count": 4,
                    "last_practiced_at": "2026-06-23T09:10:00Z",
                    "stability_days": 15.0,
                },
            ],
            "recent_attempts": [
                {
                    "id": "11111111-1111-1111-1111-111111111110",
                    "question_prompt": "Tìm x trong tỉ lệ thức x/4 = 9/12",
                    "concept_name": "Vận dụng tính chất tỉ lệ thức, đại lượng tỉ lệ",
                    "is_correct": True,
                    "actual_score": 1.0,
                    "hint_count": 0,
                    "submitted_at": "2026-06-23T09:10:00Z",
                    "response_time_ms": 16000,
                }
            ],
        },
        {
            "id": "8c4bc657-3f30-4e89-8d4e-b5c6d3df594e",
            "full_name": "Trần Thị Bình",
            "email": "binh.tran@example.com",
            "mssv": "2A202611112",
            "accuracy_rate": 81.0,
            "total_attempts": 18,
            "total_correct": 15,
            "active_days_count": 25,
            "ai_chat_count": 21,
            "last_active_at": "2026-06-23T08:25:00Z",
            "streak": 5,
            "skills": [
                {
                    "concept_id": "00000000-0000-0000-0000-000000000010",
                    "code": "M7.SDS.05",
                    "name": "Vận dụng tính chất tỉ lệ thức, đại lượng tỉ lệ",
                    "elo": 1120.0,
                    "bkt_mastery_probability": 0.72,
                    "bkt_mastery_probability_stored": 0.72,
                    "mastery_state": "learning",
                    "weakness_flag": False,
                    "attempt_count": 10,
                    "correct_count": 8,
                    "last_practiced_at": "2026-06-23T08:25:00Z",
                    "stability_days": 4.5,
                },
                {
                    "concept_id": "00000000-0000-0000-0000-000000000011",
                    "code": "M6.SDS.03",
                    "name": "Hiểu tỉ số của hai đại lượng",
                    "elo": 1250.0,
                    "bkt_mastery_probability": 0.89,
                    "bkt_mastery_probability_stored": 0.89,
                    "mastery_state": "mastered",
                    "weakness_flag": False,
                    "attempt_count": 5,
                    "correct_count": 5,
                    "last_practiced_at": "2026-06-23T08:25:00Z",
                    "stability_days": 15.0,
                },
                {
                    "concept_id": "00000000-0000-0000-0000-000000000012",
                    "code": "M5.SDS.02",
                    "name": "Nhận biết hai phân số bằng nhau",
                    "elo": 1300.0,
                    "bkt_mastery_probability": 0.92,
                    "bkt_mastery_probability_stored": 0.92,
                    "mastery_state": "mastered",
                    "weakness_flag": False,
                    "attempt_count": 3,
                    "correct_count": 2,
                    "last_practiced_at": "2026-06-23T08:25:00Z",
                    "stability_days": 15.0,
                },
            ],
            "recent_attempts": [
                {
                    "id": "11111111-1111-1111-1111-111111111111",
                    "question_prompt": "Tìm x trong tỉ lệ thức x/4 = 9/12",
                    "concept_name": "Vận dụng tính chất tỉ lệ thức, đại lượng tỉ lệ",
                    "is_correct": True,
                    "actual_score": 1.0,
                    "hint_count": 0,
                    "submitted_at": "2026-06-23T08:25:00Z",
                    "response_time_ms": 12000,
                }
            ],
        },
        {
            "id": "8c4bc657-3f30-4e89-8d4e-b5c6d3df594f",
            "full_name": "Lê Hoàng Minh",
            "email": "hoangminh.le@example.com",
            "mssv": "2A202611113",
            "accuracy_rate": 49.0,
            "total_attempts": 39,
            "total_correct": 19,
            "active_days_count": 11,
            "ai_chat_count": 27,
            "last_active_at": "2026-06-23T07:54:00Z",
            "streak": 2,
            "skills": [
                {
                    "concept_id": "00000000-0000-0000-0000-000000000010",
                    "code": "M7.SDS.05",
                    "name": "Vận dụng tính chất tỉ lệ thức, đại lượng tỉ lệ",
                    "elo": 720.0,
                    "bkt_mastery_probability": 0.02,
                    "bkt_mastery_probability_stored": 0.02,
                    "mastery_state": "weak",
                    "weakness_flag": True,
                    "attempt_count": 15,
                    "correct_count": 6,
                    "last_practiced_at": "2026-06-23T07:54:00Z",
                    "stability_days": 3.0,
                },
                {
                    "concept_id": "00000000-0000-0000-0000-000000000011",
                    "code": "M6.SDS.03",
                    "name": "Hiểu tỉ số của hai đại lượng",
                    "elo": 780.0,
                    "bkt_mastery_probability": 0.05,
                    "bkt_mastery_probability_stored": 0.05,
                    "mastery_state": "weak",
                    "weakness_flag": True,
                    "attempt_count": 14,
                    "correct_count": 8,
                    "last_practiced_at": "2026-06-23T07:54:00Z",
                    "stability_days": 3.0,
                },
                {
                    "concept_id": "00000000-0000-0000-0000-000000000012",
                    "code": "M5.SDS.02",
                    "name": "Nhận biết hai phân số bằng nhau",
                    "elo": 810.0,
                    "bkt_mastery_probability": 0.12,
                    "bkt_mastery_probability_stored": 0.12,
                    "mastery_state": "weak",
                    "weakness_flag": True,
                    "attempt_count": 10,
                    "correct_count": 5,
                    "last_practiced_at": "2026-06-23T07:54:00Z",
                    "stability_days": 3.0,
                },
            ],
            "recent_attempts": [
                {
                    "id": "11111111-1111-1111-1111-111111111112",
                    "question_prompt": "Tỉ lệ thức là đẳng thức của hai tỉ số. Đúng hay sai?",
                    "concept_name": "Vận dụng tính chất tỉ lệ thức, đại lượng tỉ lệ",
                    "is_correct": False,
                    "actual_score": 0.0,
                    "hint_count": 2,
                    "submitted_at": "2026-06-23T07:54:00Z",
                    "response_time_ms": 21000,
                }
            ],
        },
        {
            "id": "8c4bc657-3f30-4e89-8d4e-b5c6d3df5940",
            "full_name": "Phạm Thanh Thảo",
            "email": "thao.pham@example.com",
            "mssv": "2A202611114",
            "accuracy_rate": 68.0,
            "total_attempts": 22,
            "total_correct": 15,
            "active_days_count": 20,
            "ai_chat_count": 18,
            "last_active_at": "2026-06-22T15:42:00Z",
            "streak": 0,
            "skills": [
                {
                    "concept_id": "00000000-0000-0000-0000-000000000010",
                    "code": "M7.SDS.05",
                    "name": "Vận dụng tính chất tỉ lệ thức, đại lượng tỉ lệ",
                    "elo": 830.0,
                    "bkt_mastery_probability": 0.04,
                    "bkt_mastery_probability_stored": 0.04,
                    "mastery_state": "weak",
                    "weakness_flag": True,
                    "attempt_count": 12,
                    "correct_count": 5,
                    "last_practiced_at": "2026-06-22T15:42:00Z",
                    "stability_days": 3.0,
                },
                {
                    "concept_id": "00000000-0000-0000-0000-000000000011",
                    "code": "M6.SDS.03",
                    "name": "Hiểu tỉ số của hai đại lượng",
                    "elo": 1140.0,
                    "bkt_mastery_probability": 0.82,
                    "bkt_mastery_probability_stored": 0.82,
                    "mastery_state": "learning",
                    "weakness_flag": False,
                    "attempt_count": 7,
                    "correct_count": 7,
                    "last_practiced_at": "2026-06-22T15:42:00Z",
                    "stability_days": 3.0,
                },
                {
                    "concept_id": "00000000-0000-0000-0000-000000000012",
                    "code": "M5.SDS.02",
                    "name": "Nhận biết hai phân số bằng nhau",
                    "elo": 1210.0,
                    "bkt_mastery_probability": 0.90,
                    "bkt_mastery_probability_stored": 0.90,
                    "mastery_state": "mastered",
                    "weakness_flag": False,
                    "attempt_count": 3,
                    "correct_count": 3,
                    "last_practiced_at": "2026-06-22T15:42:00Z",
                    "stability_days": 3.0,
                },
            ],
            "recent_attempts": [
                {
                    "id": "11111111-1111-1111-1111-111111111113",
                    "question_prompt": "Biết x và y tỉ lệ thuận với nhau và khi x = 2 thì y = 6. Tìm hệ số tỉ lệ k",
                    "concept_name": "Vận dụng tính chất tỉ lệ thức, đại lượng tỉ lệ",
                    "is_correct": False,
                    "actual_score": 0.0,
                    "hint_count": 0,
                    "submitted_at": "2026-06-22T15:42:00Z",
                    "response_time_ms": 14000,
                }
            ],
        },
        {
            "id": "8c4bc657-3f30-4e89-8d4e-b5c6d3df5941",
            "full_name": "Vũ Quốc Khánh",
            "email": "khanh.vu@example.com",
            "mssv": "2A202611115",
            "accuracy_rate": 74.0,
            "total_attempts": 12,
            "total_correct": 9,
            "active_days_count": 17,
            "ai_chat_count": 29,
            "last_active_at": "2026-06-22T11:31:00Z",
            "streak": 4,
            "skills": [
                {
                    "concept_id": "00000000-0000-0000-0000-000000000010",
                    "code": "M7.SDS.05",
                    "name": "Vận dụng tính chất tỉ lệ thức, đại lượng tỉ lệ",
                    "elo": 1050.0,
                    "bkt_mastery_probability": 0.52,
                    "bkt_mastery_probability_stored": 0.52,
                    "mastery_state": "learning",
                    "weakness_flag": False,
                    "attempt_count": 6,
                    "correct_count": 4,
                    "last_practiced_at": "2026-06-22T11:31:00Z",
                    "stability_days": 3.0,
                },
                {
                    "concept_id": "00000000-0000-0000-0000-000000000011",
                    "code": "M6.SDS.03",
                    "name": "Hiểu tỉ số của hai đại lượng",
                    "elo": 1110.0,
                    "bkt_mastery_probability": 0.74,
                    "bkt_mastery_probability_stored": 0.74,
                    "mastery_state": "learning",
                    "weakness_flag": False,
                    "attempt_count": 4,
                    "correct_count": 3,
                    "last_practiced_at": "2026-06-22T11:31:00Z",
                    "stability_days": 3.0,
                },
                {
                    "concept_id": "00000000-0000-0000-0000-000000000012",
                    "code": "M5.SDS.02",
                    "name": "Nhận biết hai phân số bằng nhau",
                    "elo": 1180.0,
                    "bkt_mastery_probability": 0.81,
                    "bkt_mastery_probability_stored": 0.81,
                    "mastery_state": "learning",
                    "weakness_flag": False,
                    "attempt_count": 2,
                    "correct_count": 2,
                    "last_practiced_at": "2026-06-22T11:31:00Z",
                    "stability_days": 3.0,
                },
            ],
            "recent_attempts": [
                {
                    "id": "11111111-1111-1111-1111-111111111114",
                    "question_prompt": "Tìm x trong tỉ lệ thức x/4 = 9/12",
                    "concept_name": "Vận dụng tính chất tỉ lệ thức, đại lượng tỉ lệ",
                    "is_correct": True,
                    "actual_score": 1.0,
                    "hint_count": 1,
                    "submitted_at": "2026-06-22T11:31:00Z",
                    "response_time_ms": 17000,
                }
            ],
        },
    ]


@router.get("/class-insights", response_model=ClassInsightsResponse)
def get_class_insights_endpoint(
    course_id: UUID,
    search: str | None = None,
    status: str | None = "all",
    sort_by: str | None = "elo",
    page: int = 1,
    limit: int = 20,
    auth_user: AuthenticatedUser = Depends(get_current_user),
    db: AdaptiveDatabaseInterface = Depends(get_adaptive_db),
):
    """
    Truy vấn tổng hợp thông tin chi tiết của tất cả học sinh trong lớp cho giảng viên (Mentor).
    """
    if auth_user.role not in ("mentor", "admin", "dev"):
        raise HTTPException(status_code=403, detail="Chỉ giảng viên hoặc quản trị viên được phép truy cập dữ liệu này.")

    try:
        # Xử lý stub/mock mode của database
        if db._stub_mode or db.app_client is None:
            mock_students = get_mock_backend_students()
            if search:
                s_lower = search.lower()
                mock_students = [
                    s for s in mock_students if s_lower in s["full_name"].lower() or s_lower in s["email"].lower()
                ]

            if status == "needs-support":
                mock_students = [s for s in mock_students if any(sk["mastery_state"] == "weak" for sk in s["skills"])]
            elif status == "stable":
                mock_students = [
                    s for s in mock_students if not any(sk["mastery_state"] == "weak" for sk in s["skills"])
                ]

            if sort_by == "name":
                mock_students.sort(key=lambda s: s["full_name"].lower())
            elif sort_by == "elo":
                mock_students.sort(
                    key=lambda s: sum(sk["elo"] for sk in s["skills"]) / max(1, len(s["skills"])), reverse=True
                )
            elif sort_by == "weak_skills":
                mock_students.sort(
                    key=lambda s: sum(1 for sk in s["skills"] if sk["mastery_state"] == "weak"), reverse=True
                )
            elif sort_by == "completion_rate":
                mock_students.sort(
                    key=lambda s: (
                        sum(1 for sk in s["skills"] if sk["mastery_state"] == "mastered") / max(1, len(s["skills"]))
                    ),
                    reverse=True,
                )

            total_count = len(mock_students)
            start = (page - 1) * limit
            paginated = mock_students[start : start + limit]

            return ClassInsightsResponse(
                total_count=total_count, page=page, limit=limit, students=[InsightStudent(**s) for s in paginated]
            )

        # 1. Lấy danh sách học viên thực tế (bỏ qua email chứa example.com và các tài khoản staff)
        all_users_resp = db.app_client.table("users").select("id, email").not_.like("email", "%example.com%").execute()
        all_users = all_users_resp.data or []

        roles_resp = db.app_client.table("user_roles").select("user_id, roles(code)").execute()
        roles_data = roles_resp.data or []

        staff_ids = set()
        for r in roles_data:
            if r.get("roles") and r["roles"].get("code") in ("mentor", "admin", "dev", "btc"):
                staff_ids.add(r["user_id"])

        student_ids = [u["id"] for u in all_users if u["id"] not in staff_ids]

        if not student_ids:
            return ClassInsightsResponse(total_count=0, page=page, limit=limit, students=[])

        # 2. Truy vấn thông tin tài khoản người dùng
        users_query = db.app_client.table("users").select("id, email, full_name, mssv")
        if search:
            users_query = users_query.or_(f"full_name.ilike.%{search}%,email.ilike.%{search}%")

        users_resp = users_query.in_("id", student_ids).execute()
        users_data = users_resp.data or []
        filtered_student_ids = [u["id"] for u in users_data]

        if not filtered_student_ids:
            return ClassInsightsResponse(total_count=0, page=page, limit=limit, students=[])

        # 3. Lấy thông tin Concept Mastery của các học sinh (Sử dụng batching để tránh giới hạn 1000 dòng của Supabase)
        mastery_data = []
        batch_size = 15
        for i in range(0, len(filtered_student_ids), batch_size):
            batch_ids = filtered_student_ids[i : i + batch_size]
            batch_resp = (
                db.app_client.table("student_concept_mastery")
                .select(
                    "student_id, concept_id, elo_score, bkt_mastery_probability, mastery_state, weakness_flag, attempt_count, correct_count, last_practiced_at, stability_days, concepts(code, name)"
                )
                .eq("course_id", str(course_id))
                .in_("student_id", batch_ids)
                .execute()
            )
            mastery_data.extend(batch_resp.data or [])

        # 4. Lấy các bài làm gần nhất của các học sinh này (Sử dụng batching)
        attempts_data = []
        for i in range(0, len(filtered_student_ids), batch_size):
            batch_ids = filtered_student_ids[i : i + batch_size]
            batch_resp = (
                db.app_client.table("quiz_attempts")
                .select(
                    "id, student_id, question_id, concept_id, is_correct, actual_score, hint_count, submitted_at, response_time_ms, questions(prompt), concepts(name)"
                )
                .eq("course_id", str(course_id))
                .in_("student_id", batch_ids)
                .order("submitted_at", desc=True)
                .limit(200)  # Giới hạn mỗi batch cho 15 học viên là cực kỳ an toàn
                .execute()
            )
            attempts_data.extend(batch_resp.data or [])

        # 5. Đếm số lượng chat sessions (Sử dụng batching)
        chat_data = []
        for i in range(0, len(filtered_student_ids), batch_size):
            batch_ids = filtered_student_ids[i : i + batch_size]
            batch_resp = (
                db.app_client.table("chat_sessions")
                .select("student_id, id")
                .eq("course_id", str(course_id))
                .in_("student_id", batch_ids)
                .execute()
            )
            chat_data.extend(batch_resp.data or [])

        # 6. Đếm tổng số concept đang active của khóa học để tính Completion Rate
        concepts_resp = (
            db.app_client.table("concepts")
            .select("id")
            .eq("course_id", str(course_id))
            .eq("status", "active")
            .execute()
        )
        total_concepts = len(concepts_resp.data or [])

        # Phân nhóm và gộp dữ liệu
        from collections import Counter, defaultdict
        from datetime import UTC, datetime, timedelta

        from src.services.adaptive.forgetting import apply_forgetting_decay

        def _calc_streak(attempts: list[dict]) -> int:
            """Tính chuỗi ngày hoạt động liên tục tính đến hôm nay."""
            if not attempts:
                return 0

            active_dates = set()
            for a in attempts:
                sub_str = a.get("submitted_at")
                if sub_str:
                    try:
                        dt = datetime.fromisoformat(sub_str.replace("Z", "+00:00"))
                        active_dates.add(dt.date())
                    except Exception:
                        pass

            if not active_dates:
                return 0

            sorted_dates = sorted(active_dates, reverse=True)
            today = datetime.now(UTC).date()
            streak = 0
            expected = today

            for d in sorted_dates:
                if d == expected:
                    streak += 1
                    expected -= timedelta(days=1)
                elif d == expected - timedelta(days=1):
                    streak += 1
                    expected = d - timedelta(days=1)
                else:
                    break

            return streak

        mastery_by_student = defaultdict(list)
        for m in mastery_data:
            mastery_by_student[m["student_id"]].append(m)

        attempts_by_student = defaultdict(list)
        all_attempts_by_student = defaultdict(list)
        for a in attempts_data:
            sid = a["student_id"]
            all_attempts_by_student[sid].append(a)
            if len(attempts_by_student[sid]) < 5:
                attempts_by_student[sid].append(a)

        chat_counts = Counter(c["student_id"] for c in chat_data)

        # Đếm ngày học tập chủ động
        active_days_by_student = defaultdict(set)
        for a in attempts_data:
            if a.get("submitted_at"):
                day_str = a["submitted_at"][:10]  # format YYYY-MM-DD
                active_days_by_student[a["student_id"]].add(day_str)

        students_list = []
        for user in users_data:
            sid = user["id"]
            s_masteries = mastery_by_student[sid]
            s_attempts = attempts_by_student[sid]

            # Tính toán các chỉ số gộp
            total_attempts = sum(m.get("attempt_count") or 0 for m in s_masteries)
            total_correct = sum(m.get("correct_count") or 0 for m in s_masteries)
            accuracy_rate = (total_correct / total_attempts * 100.0) if total_attempts > 0 else 0.0

            active_days_count = len(active_days_by_student[sid])
            ai_chat_count = chat_counts[sid]

            # Elo trung bình học sinh (Chỉ tính các concept đã thực hành giống Frontend)
            practiced_elos = [
                float(m["elo_score"])
                for m in s_masteries
                if m.get("elo_score") is not None and (m.get("attempt_count") or 0) > 0
            ]
            if practiced_elos:
                avg_elo = sum(practiced_elos) / len(practiced_elos)
            else:
                all_elos = [float(m["elo_score"]) for m in s_masteries if m.get("elo_score") is not None]
                avg_elo = sum(all_elos) / len(all_elos) if all_elos else 1200.0

            last_active_at = s_attempts[0]["submitted_at"] if s_attempts else None

            # Map skills list và áp dụng decay
            skills = []
            for m in s_masteries:
                concept_info = m.get("concepts") or {}
                raw_bkt = float(m["bkt_mastery_probability"])
                stability = float(m.get("stability_days") if m.get("stability_days") is not None else 3.0)
                last_practiced_str = m.get("last_practiced_at")

                # Parse last_practiced_at
                last_practiced_dt = None
                if last_practiced_str:
                    try:
                        last_practiced_dt = datetime.fromisoformat(last_practiced_str.replace("Z", "+00:00"))
                    except (ValueError, TypeError):
                        last_practiced_dt = None

                # Tính p_effective qua FSRS decay
                p_effective = apply_forgetting_decay(raw_bkt, last_practiced_dt, stability)

                # Cập nhật weakness_flag dựa trên decay
                weakness = bool(m.get("weakness_flag")) or (p_effective < 0.60)

                # Cập nhật mastery_state nếu decay đủ mạnh
                mastery_state = m.get("mastery_state") or "not_started"
                if mastery_state == "mastered" and p_effective < 0.60:
                    mastery_state = "weak"
                elif mastery_state == "mastered" and p_effective < 0.80:
                    mastery_state = "learning"

                skills.append(
                    InsightSkill(
                        concept_id=m["concept_id"],
                        code=concept_info.get("code") or "",
                        name=concept_info.get("name") or "",
                        elo=float(m["elo_score"]),
                        bkt_mastery_probability=p_effective,
                        bkt_mastery_probability_stored=raw_bkt,
                        mastery_state=mastery_state,
                        weakness_flag=weakness,
                        attempt_count=int(m["attempt_count"] or 0),
                        correct_count=int(m["correct_count"] or 0),
                        last_practiced_at=last_practiced_str,
                        stability_days=stability,
                    )
                )

            weak_skills_count = sum(1 for s in skills if s.weakness_flag or s.mastery_state == "weak")

            mastered_count = sum(1 for s in skills if s.mastery_state == "mastered")
            completion_rate = (mastered_count / total_concepts * 100.0) if total_concepts > 0 else 0.0

            # Tính streak động
            streak = _calc_streak(all_attempts_by_student[sid])

            # Map attempts list
            recent_attempts = []
            for a in s_attempts:
                question_info = a.get("questions") or {}
                concept_info = a.get("concepts") or {}
                recent_attempts.append(
                    InsightAttempt(
                        id=a["id"],
                        question_prompt=question_info.get("prompt") or "",
                        concept_name=concept_info.get("name") or "",
                        is_correct=bool(a["is_correct"]),
                        actual_score=float(a["actual_score"]),
                        hint_count=int(a["hint_count"] or 0),
                        submitted_at=a["submitted_at"],
                        response_time_ms=a.get("response_time_ms"),
                    )
                )

            students_list.append(
                {
                    "id": sid,
                    "full_name": user["full_name"],
                    "email": user["email"],
                    "mssv": user["mssv"],
                    "accuracy_rate": accuracy_rate,
                    "total_attempts": total_attempts,
                    "total_correct": total_correct,
                    "active_days_count": active_days_count,
                    "ai_chat_count": ai_chat_count,
                    "last_active_at": last_active_at,
                    "streak": streak,
                    "skills": skills,
                    "recent_attempts": recent_attempts,
                    "weak_skills_count": weak_skills_count,
                    "avg_elo": avg_elo,
                    "completion_rate": completion_rate,
                }
            )

        # Áp dụng bộ lọc trạng thái (Needs Support / Stable)
        if status == "needs-support":
            students_list = [s for s in students_list if s["weak_skills_count"] > 0]
        elif status == "stable":
            students_list = [s for s in students_list if s["weak_skills_count"] == 0]

        # Áp dụng sắp xếp
        if sort_by == "name":
            students_list.sort(key=lambda s: s["full_name"].lower())
        elif sort_by == "elo":
            students_list.sort(key=lambda s: s["avg_elo"], reverse=True)
        elif sort_by == "weak_skills":
            students_list.sort(key=lambda s: s["weak_skills_count"], reverse=True)
        elif sort_by == "completion_rate":
            students_list.sort(key=lambda s: s["completion_rate"], reverse=True)

        # Phân trang
        total_count = len(students_list)
        start = (page - 1) * limit
        paginated_students = students_list[start : start + limit]

        return ClassInsightsResponse(
            total_count=total_count, page=page, limit=limit, students=[InsightStudent(**s) for s in paginated_students]
        )

    except Exception as e:
        logger.error(f"Lỗi khi lấy class insights: {str(e)}", exc_info=True)
        raise HTTPException(status_code=503, detail="Lỗi hệ thống khi lấy thông tin chi tiết lớp học.")
