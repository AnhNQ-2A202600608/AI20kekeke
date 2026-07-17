import logging
from collections import Counter, defaultdict
from copy import deepcopy
from datetime import UTC, datetime, timedelta
from time import perf_counter
from typing import Any
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from src.api.adaptive_routes import AuthenticatedUser, get_adaptive_db, get_current_user
from src.api.auth_routes import get_user_demo_profile_flags
from src.services.adaptive.database_interface import AdaptiveDatabaseInterface

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])

PROFILE_VERSION = "onboarding_v1"
DEFAULT_COURSE_ID = UUID("00000000-0000-0000-0000-000000000001")

ALLOWED_WEEKLY_MINUTES = {60, 120, 180, 300}
ALLOWED_GOALS = {"foundation", "lab", "interview", "catch_up"}
ALLOWED_DIAGNOSTIC_TARGETS = {8, 15, 20}
ALLOWED_SUPPORT_STYLES = {"explain", "step_hint", "socratic", "practice"}
ALLOWED_CADENCES = {"daily_short", "weekend_block", "deadline_based", "unsure"}

DIAGNOSTIC_REQUIRED_ANSWERS = 5
DIAGNOSTIC_DEFAULT_TARGET_ANSWERS = 8
DIAGNOSTIC_MAX_ANSWERS = 20
DIAGNOSTIC_CANDIDATE_FETCH_LIMIT = 500
DIAGNOSTIC_CANDIDATE_POOL_LIMIT = 120
DIAGNOSTIC_CANDIDATE_CACHE_TTL_SECONDS = 300
DIAGNOSTIC_SESSION_TTL_HOURS = 6
DEFAULT_BKT = 0.25
DEFAULT_ELO = 1200.0
DIAGNOSTIC_K = 24.0

_STUB_ONBOARDING_PROFILES: dict[str, dict[str, Any]] = {}
_STUB_DIAGNOSTIC_SESSIONS: dict[str, dict[str, Any]] = {}
_DIAGNOSTIC_CANDIDATE_CACHE: dict[str, tuple[float, list[dict[str, Any]]]] = {}
_DIAGNOSTIC_QUESTION_CACHE: dict[str, tuple[float, dict[str, Any]]] = {}

FULL_FLOW_DEMO_PROFILE_KEY = "full_flow_v1"
FULL_FLOW_DEMO_SEEDED_CONCEPTS = [
    {
        "concept_id": "d1-ai-llm-foundations",
        "db_concept_code": "d1-ai-llm-foundations",
        "elo_score": 1360.0,
        "bkt_mastery_probability": 0.86,
        "mastery_state": "mastered",
        "weakness_flag": False,
        "evidence_count": 6,
    },
    {
        "concept_id": "d4-prompt-engineering",
        "db_concept_code": "d4-prompt-engineering",
        "elo_score": 1275.0,
        "bkt_mastery_probability": 0.68,
        "mastery_state": "learning",
        "weakness_flag": False,
        "evidence_count": 4,
    },
    {
        "concept_id": "d4-tool-calling",
        "db_concept_code": "d4-tool-calling",
        "elo_score": 1215.0,
        "bkt_mastery_probability": 0.52,
        "mastery_state": "learning",
        "weakness_flag": False,
        "evidence_count": 3,
    },
    {
        "concept_id": "d7-embedding-vector",
        "db_concept_code": "d7-embedding-vector",
        "elo_score": 1040.0,
        "bkt_mastery_probability": 0.34,
        "mastery_state": "learning",
        "weakness_flag": True,
        "evidence_count": 3,
    },
    {
        "concept_id": "d8-rag-pipeline",
        "db_concept_code": "d8-rag-pipeline",
        "elo_score": 930.0,
        "bkt_mastery_probability": 0.22,
        "mastery_state": "weak",
        "weakness_flag": True,
        "evidence_count": 2,
    },
]


class DiagnosticSurvey(BaseModel):
    weekly_practice_minutes: int
    learning_goal: str
    target_question_count: int = DIAGNOSTIC_DEFAULT_TARGET_ANSWERS
    strength_concept_ids: list[str] = Field(default_factory=list)
    weakness_concept_ids: list[str] = Field(default_factory=list)
    support_style: str | None = None
    learning_cadence: str | None = None
    course_id: UUID = DEFAULT_COURSE_ID


class DiagnosticQuestionOption(BaseModel):
    id: str
    label: str


class DiagnosticQuestionPublic(BaseModel):
    id: str
    concept_id: str
    bloom_level: str
    difficulty_elo: float
    prompt: str
    options: list[DiagnosticQuestionOption]


class DiagnosticSessionState(BaseModel):
    session_id: str
    current_question: DiagnosticQuestionPublic | None
    answered_count: int
    required_count: int = DIAGNOSTIC_REQUIRED_ANSWERS
    max_count: int = DIAGNOSTIC_MAX_ANSWERS
    can_complete: bool
    can_continue: bool
    summary: dict[str, Any] | None = None


class DiagnosticStartRequest(DiagnosticSurvey):
    pass


class DiagnosticAnswerRequest(BaseModel):
    session_id: str
    question_id: str
    selected_option_id: str
    response_time_ms: int | None = None


class DiagnosticFeedback(BaseModel):
    correct: bool
    message: str
    explanation: str | None = None


class DiagnosticAnswerResponse(DiagnosticSessionState):
    feedback: DiagnosticFeedback


class OnboardingCompleteRequest(DiagnosticSurvey):
    session_id: str


class OnboardingStatusResponse(BaseModel):
    completed: bool
    profile_version: str = PROFILE_VERSION
    source: str
    fallback_allowed: bool = True
    sync_pending: bool = False
    summary: dict[str, Any] | None = None


class OnboardingCompleteResponse(BaseModel):
    completed: bool
    profile_id: str | None = None
    profile_version: str = PROFILE_VERSION
    recommended_concept_id: str | None = None
    summary: dict[str, Any]


def _is_stub_db(db: AdaptiveDatabaseInterface) -> bool:
    return bool(getattr(db, "_stub_mode", False) or getattr(db, "app_client", None) is None)


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def _validate_survey(payload: DiagnosticSurvey) -> None:
    if payload.weekly_practice_minutes not in ALLOWED_WEEKLY_MINUTES:
        raise HTTPException(status_code=422, detail="weekly_practice_minutes không thuộc bucket được hỗ trợ.")
    if payload.learning_goal not in ALLOWED_GOALS:
        raise HTTPException(status_code=422, detail="learning_goal không hợp lệ.")
    if payload.target_question_count not in ALLOWED_DIAGNOSTIC_TARGETS:
        raise HTTPException(status_code=422, detail="target_question_count không thuộc bucket được hỗ trợ.")
    if payload.support_style is not None and payload.support_style not in ALLOWED_SUPPORT_STYLES:
        raise HTTPException(status_code=422, detail="support_style không hợp lệ.")
    if payload.learning_cadence is not None and payload.learning_cadence not in ALLOWED_CADENCES:
        raise HTTPException(status_code=422, detail="learning_cadence không hợp lệ.")


def _metadata_error(question_id: str, message: str) -> HTTPException:
    return HTTPException(
        status_code=503,
        detail={"code": "onboarding_question_bank_invalid", "message": f"{message}: {question_id}"},
    )


def _parse_options(question_id: str, answer_key: dict[str, Any]) -> list[dict[str, str]]:
    raw_options = answer_key.get("options")
    if not isinstance(raw_options, dict) or len(raw_options) < 2:
        raise _metadata_error(question_id, "Question bank thiếu options MCQ")
    options = []
    for option_id, label in raw_options.items():
        if not isinstance(label, str) or not label.strip():
            raise _metadata_error(question_id, "Question bank có option rỗng")
        options.append({"id": str(option_id), "label": label})
    return options


def _parse_diagnostic_question(row: dict[str, Any], concept_code_by_id: dict[str, str]) -> dict[str, Any]:
    question_id = str(row.get("id") or "")
    answer_key = row.get("answer_key") or {}
    if row.get("type") != "mcq":
        raise _metadata_error(question_id, "Diagnostic chỉ hỗ trợ MCQ")
    if not isinstance(answer_key, dict):
        raise _metadata_error(question_id, "answer_key không hợp lệ")

    diagnostic = answer_key.get("diagnostic") or {}
    if not isinstance(diagnostic, dict):
        diagnostic = {}

    options = _parse_options(question_id, answer_key)
    correct = str(answer_key.get("correct") or "")
    if correct not in {option["id"] for option in options}:
        raise _metadata_error(question_id, "Đáp án đúng không khớp options")

    concept_uuid = str(row.get("concept_id") or "")
    primary_concept_code = concept_code_by_id.get(concept_uuid) or concept_uuid
    linked_concepts = [
        concept_code_by_id.get(str(concept_id), str(concept_id))
        for concept_id in row.get("linked_concept_ids", [])
        if concept_id
    ]
    coverage_concepts = list(dict.fromkeys([primary_concept_code, *linked_concepts]))
    raw_weights = diagnostic.get("concept_weights")
    if isinstance(raw_weights, dict) and raw_weights:
        q_matrix = {str(concept_id): float(weight) for concept_id, weight in raw_weights.items()}
    else:
        q_matrix = {
            concept_code: 1.0 if concept_code == primary_concept_code else 0.5 for concept_code in coverage_concepts
        }

    encouragement = diagnostic.get("encouragement") or {}
    if not isinstance(encouragement, dict):
        encouragement = {}

    return {
        "id": question_id,
        "concept_id": primary_concept_code,
        "coverage_concept_ids": coverage_concepts,
        "bloom_level": str(
            diagnostic.get("bloom_level") or _infer_bloom_level(float(row.get("difficulty_elo") or DEFAULT_ELO))
        ),
        "difficulty_elo": float(row.get("difficulty_elo") or DEFAULT_ELO),
        "prompt": str(row.get("prompt") or ""),
        "options": options,
        "correct_option_id": correct,
        "explanation": str(answer_key.get("explanation") or ""),
        "encouragement": {
            "correct": str(encouragement.get("correct") or "Tốt. Sofi sẽ cập nhật hồ sơ năng lực của bạn."),
            "incorrect": str(encouragement.get("incorrect") or "Không sao. Sofi sẽ ưu tiên vùng cần luyện thêm."),
        },
        "q_matrix": q_matrix,
        "attempt_count": int(row.get("attempt_count") or 0),
        "avg_response_time_ms": float(row.get("avg_response_time_ms") or 30000.0),
    }


def _infer_bloom_level(difficulty_elo: float) -> str:
    if difficulty_elo < 1150:
        return "understand"
    if difficulty_elo <= 1300:
        return "apply"
    return "analyze"


def _difficulty_band(difficulty_elo: float) -> str:
    if difficulty_elo < 1150:
        return "easy"
    if difficulty_elo < 1300:
        return "normal"
    return "hard"


def _round_robin_by_concept(candidates: list[dict[str, Any]], limit: int) -> list[dict[str, Any]]:
    by_concept: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for question in candidates:
        by_concept[str(question["concept_id"])].append(question)

    for concept_questions in by_concept.values():
        concept_questions.sort(
            key=lambda question: (
                int(question.get("attempt_count") or 0),
                abs(float(question["difficulty_elo"]) - DEFAULT_ELO),
                question["id"],
            )
        )

    selected: list[dict[str, Any]] = []
    concept_ids = sorted(by_concept)
    while len(selected) < limit:
        added = False
        for concept_id in concept_ids:
            if by_concept[concept_id]:
                selected.append(by_concept[concept_id].pop(0))
                added = True
                if len(selected) >= limit:
                    break
        if not added:
            break
    return selected


def _stratify_onboarding_candidates(candidates: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if len(candidates) <= DIAGNOSTIC_CANDIDATE_POOL_LIMIT:
        return candidates

    quotas = {"easy": 40, "normal": 40, "hard": 40}
    anchors = {"easy": 1000.0, "normal": DEFAULT_ELO, "hard": 1320.0}
    selected: list[dict[str, Any]] = []
    selected_ids: set[str] = set()

    for band in ("normal", "easy", "hard"):
        band_candidates = [
            question for question in candidates if _difficulty_band(float(question["difficulty_elo"])) == band
        ]
        band_candidates.sort(
            key=lambda question: (
                abs(float(question["difficulty_elo"]) - anchors[band]),
                int(question.get("attempt_count") or 0),
                question["id"],
            )
        )
        for question in _round_robin_by_concept(band_candidates, quotas[band]):
            if question["id"] not in selected_ids:
                selected.append(question)
                selected_ids.add(question["id"])

    if len(selected) < DIAGNOSTIC_CANDIDATE_POOL_LIMIT:
        remaining = [question for question in candidates if question["id"] not in selected_ids]
        for question in _round_robin_by_concept(remaining, DIAGNOSTIC_CANDIDATE_POOL_LIMIT - len(selected)):
            selected.append(question)

    return selected[:DIAGNOSTIC_CANDIDATE_POOL_LIMIT]


def _public_question(question: dict[str, Any] | None) -> DiagnosticQuestionPublic | None:
    if not question:
        return None
    return DiagnosticQuestionPublic(
        id=question["id"],
        concept_id=question["concept_id"],
        bloom_level=question["bloom_level"],
        difficulty_elo=question["difficulty_elo"],
        prompt=question["prompt"],
        options=[DiagnosticQuestionOption(**option) for option in question["options"]],
    )


def _session_candidate(question: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": question["id"],
        "concept_id": question["concept_id"],
        "bloom_level": question["bloom_level"],
        "difficulty_elo": question["difficulty_elo"],
        "q_matrix": question["q_matrix"],
        "coverage_concept_ids": question.get("coverage_concept_ids", [question["concept_id"]]),
        "attempt_count": question.get("attempt_count") or 0,
    }


def _candidate_pool_with_full_question(
    candidates: list[dict[str, Any]],
    full_question: dict[str, Any] | None,
) -> list[dict[str, Any]]:
    if not full_question:
        return candidates
    return [full_question if question["id"] == full_question["id"] else question for question in candidates]


def _is_cache_fresh(cached_at: float) -> bool:
    return perf_counter() - cached_at < DIAGNOSTIC_CANDIDATE_CACHE_TTL_SECONDS


def _load_onboarding_candidate_questions(db: AdaptiveDatabaseInterface, course_id: UUID) -> list[dict[str, Any]]:
    cache_key = f"{id(db.app_client)}:{course_id}"
    cached = _DIAGNOSTIC_CANDIDATE_CACHE.get(cache_key)
    if cached and _is_cache_fresh(cached[0]):
        return deepcopy(cached[1])

    try:
        response = (
            db.app_client.table("questions")
            .select(
                "id, course_id, concept_id, type, prompt, answer_key, difficulty_elo, calibration_status, attempt_count, avg_response_time_ms"
            )
            .eq("course_id", str(course_id))
            .eq("type", "mcq")
            .eq("calibration_status", "published")
            .limit(DIAGNOSTIC_CANDIDATE_FETCH_LIMIT)
            .execute()
        )
        rows = response.data or []
        concept_ids = sorted({str(row.get("concept_id")) for row in rows if row.get("concept_id")})
        concept_code_by_id: dict[str, str] = {}
        if concept_ids:
            concept_response = db.app_client.table("concepts").select("id, code").in_("id", concept_ids).execute()
            concept_code_by_id = {str(row["id"]): str(row["code"]) for row in concept_response.data or []}
        question_ids = [str(row["id"]) for row in rows if row.get("id")]
        linked_concept_ids_by_question: dict[str, list[str]] = defaultdict(list)
        if question_ids:
            link_response = (
                db.app_client.table("question_concepts")
                .select("question_id, concept_id")
                .in_("question_id", question_ids)
                .execute()
            )
            linked_concept_ids = sorted(
                {str(row.get("concept_id")) for row in link_response.data or [] if row.get("concept_id")}
            )
            missing_concept_ids = [
                concept_id for concept_id in linked_concept_ids if concept_id not in concept_code_by_id
            ]
            if missing_concept_ids:
                linked_concept_response = (
                    db.app_client.table("concepts").select("id, code").in_("id", missing_concept_ids).execute()
                )
                concept_code_by_id.update(
                    {str(row["id"]): str(row["code"]) for row in linked_concept_response.data or []}
                )
            for row in link_response.data or []:
                if row.get("question_id") and row.get("concept_id"):
                    linked_concept_ids_by_question[str(row["question_id"])].append(str(row["concept_id"]))
    except Exception as exc:
        logger.warning("Không đọc được question bank onboarding: %s", exc)
        raise HTTPException(
            status_code=503,
            detail={
                "code": "onboarding_question_bank_unavailable",
                "message": "Không đọc được question bank onboarding.",
            },
        )

    candidates = []
    for row in rows:
        row["linked_concept_ids"] = linked_concept_ids_by_question.get(str(row.get("id")), [])
        try:
            candidates.append(_parse_diagnostic_question(row, concept_code_by_id))
        except HTTPException as exc:
            logger.warning("Bỏ qua câu hỏi không hợp lệ cho onboarding diagnostic: %s", exc.detail)

    if len(candidates) < DIAGNOSTIC_REQUIRED_ANSWERS:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "onboarding_question_bank_too_small",
                "message": f"Question bank cần ít nhất {DIAGNOSTIC_REQUIRED_ANSWERS} MCQ published hợp lệ.",
            },
        )
    stratified = _stratify_onboarding_candidates(candidates)
    cached_at = perf_counter()
    _DIAGNOSTIC_CANDIDATE_CACHE[cache_key] = (cached_at, deepcopy(stratified))
    for question in stratified:
        _DIAGNOSTIC_QUESTION_CACHE[question["id"]] = (cached_at, deepcopy(question))
    return stratified


def _load_onboarding_questions_by_ids(
    db: AdaptiveDatabaseInterface, question_ids: list[str]
) -> dict[str, dict[str, Any]]:
    if not question_ids:
        return {}
    cached_questions: dict[str, dict[str, Any]] = {}
    missing_question_ids: list[str] = []
    for question_id in question_ids:
        cached = _DIAGNOSTIC_QUESTION_CACHE.get(question_id)
        if cached and _is_cache_fresh(cached[0]):
            cached_questions[question_id] = deepcopy(cached[1])
        else:
            missing_question_ids.append(question_id)
    if not missing_question_ids:
        return cached_questions

    try:
        response = (
            db.app_client.table("questions")
            .select(
                "id, course_id, concept_id, type, prompt, answer_key, difficulty_elo, calibration_status, attempt_count, avg_response_time_ms"
            )
            .in_("id", missing_question_ids)
            .execute()
        )
        rows = response.data or []
        concept_ids = sorted({str(row.get("concept_id")) for row in rows if row.get("concept_id")})
        concept_code_by_id: dict[str, str] = {}
        if concept_ids:
            concept_response = db.app_client.table("concepts").select("id, code").in_("id", concept_ids).execute()
            concept_code_by_id = {str(row["id"]): str(row["code"]) for row in concept_response.data or []}
    except Exception as exc:
        logger.warning("Không đọc được câu hỏi onboarding theo id: %s", exc)
        raise HTTPException(
            status_code=503,
            detail={"code": "onboarding_question_bank_unavailable", "message": "Không đọc được câu hỏi diagnostic."},
        )

    questions: dict[str, dict[str, Any]] = dict(cached_questions)
    cached_at = perf_counter()
    for row in rows:
        try:
            parsed = _parse_diagnostic_question(row, concept_code_by_id)
            questions[parsed["id"]] = parsed
            _DIAGNOSTIC_QUESTION_CACHE[parsed["id"]] = (cached_at, deepcopy(parsed))
        except HTTPException as exc:
            logger.warning("Bỏ qua câu hỏi diagnostic không hợp lệ theo id: %s", exc.detail)
    return questions


def _load_onboarding_question_by_id(db: AdaptiveDatabaseInterface, question_id: str) -> dict[str, Any]:
    questions = _load_onboarding_questions_by_ids(db, [question_id])
    question = questions.get(question_id)
    if not question:
        raise HTTPException(status_code=422, detail="Câu hỏi diagnostic không còn khả dụng.")
    return question


def _bkt_update(p_old: float, correct: bool, weight: float) -> float:
    transition = 0.02
    guess = 0.20
    slip = 0.10
    if correct:
        numerator = p_old * (1.0 - slip)
        denominator = numerator + (1.0 - p_old) * guess
    else:
        numerator = p_old * slip
        denominator = numerator + (1.0 - p_old) * (1.0 - guess)

    posterior = p_old if denominator == 0 else numerator / denominator
    p_new = posterior + (1.0 - posterior) * transition
    weighted = p_old + weight * (p_new - p_old)
    return round(min(0.9999, max(0.0001, weighted)), 4)


def _elo_update(elo_old: float, question_elo: float, correct: bool, weight: float) -> float:
    expected = 1.0 / (1.0 + 10.0 ** ((question_elo - elo_old) / 400.0))
    score = 1.0 if correct else 0.0
    delta = DIAGNOSTIC_K * (score - expected) * weight
    return round(min(DEFAULT_ELO + 120.0, max(DEFAULT_ELO - 120.0, elo_old + delta)), 2)


def _question_elo_update(question_elo: float, learner_elo: float, correct: bool) -> float:
    expected_correct = 1.0 / (1.0 + 10.0 ** ((question_elo - learner_elo) / 400.0))
    score = 1.0 if correct else 0.0
    delta = 16.0 * (expected_correct - score)
    return round(min(DEFAULT_ELO + 300.0, max(DEFAULT_ELO - 300.0, question_elo + delta)), 2)


def _commit_question_calibration(db: AdaptiveDatabaseInterface, session: dict[str, Any]) -> None:
    questions = {question["id"]: question for question in session.get("candidate_questions") or []}
    for answer in session.get("answered") or []:
        question = questions.get(answer["question_id"])
        if not question:
            continue
        old_attempts = int(question.get("attempt_count") or 0)
        old_avg_ms = float(question.get("avg_response_time_ms") or 30000.0)
        response_time_ms = answer.get("response_time_ms")
        new_attempts = old_attempts + 1
        new_avg_ms = old_avg_ms
        if response_time_ms is not None:
            new_avg_ms = round(old_avg_ms + (float(response_time_ms) - old_avg_ms) / new_attempts, 2)
        new_difficulty = _question_elo_update(
            float(question["difficulty_elo"]),
            DEFAULT_ELO,
            bool(answer["correct"]),
        )
        db.update_question_calibration(UUID(answer["question_id"]), new_difficulty, new_attempts, new_avg_ms)


def _build_summary(survey: DiagnosticSurvey, graded_answers: list[dict[str, Any]]) -> dict[str, Any]:
    concept_scores: dict[str, list[int]] = defaultdict(list)
    concept_state: dict[str, dict[str, Any]] = defaultdict(
        lambda: {"elo_score": DEFAULT_ELO, "bkt_mastery_probability": DEFAULT_BKT, "evidence_count": 0}
    )
    for answer in graded_answers:
        concept_scores[answer["concept_id"]].append(1 if answer["correct"] else 0)
        for concept_id, raw_weight in answer["q_matrix"].items():
            weight = max(0.0, min(1.0, float(raw_weight)))
            state = concept_state[concept_id]
            old_bkt = float(state["bkt_mastery_probability"])
            old_elo = float(state["elo_score"])
            state["bkt_mastery_probability"] = _bkt_update(old_bkt, bool(answer["correct"]), weight)
            state["elo_score"] = _elo_update(old_elo, float(answer["difficulty_elo"]), bool(answer["correct"]), weight)
            state["evidence_count"] += 1

    scored = {concept_id: sum(scores) / len(scores) for concept_id, scores in concept_scores.items() if scores}
    strongest = sorted(scored, key=lambda concept_id: (-scored[concept_id], concept_id))[:2]
    weakest = sorted(
        concept_state,
        key=lambda concept_id: (
            float(concept_state[concept_id]["bkt_mastery_probability"]),
            float(concept_state[concept_id]["elo_score"]),
            concept_id,
        ),
    )[:2]

    for concept_id in survey.strength_concept_ids:
        if concept_id not in strongest:
            strongest.append(concept_id)
    for concept_id in survey.weakness_concept_ids:
        if concept_id not in weakest:
            weakest.append(concept_id)

    target_count = max(DIAGNOSTIC_REQUIRED_ANSWERS, min(DIAGNOSTIC_MAX_ANSWERS, survey.target_question_count))
    confidence = "high" if len(graded_answers) >= target_count else "medium"
    recommended = weakest[0] if weakest else "d8-rag-pipeline"
    seeded_concepts = []
    for concept_id, state in sorted(concept_state.items()):
        bkt = float(state["bkt_mastery_probability"])
        seeded_concepts.append(
            {
                "concept_id": concept_id,
                "db_concept_code": concept_id,
                "elo_score": float(state["elo_score"]),
                "bkt_mastery_probability": bkt,
                "mastery_state": "weak" if bkt < 0.30 else "learning" if bkt < 0.85 else "mastered",
                "weakness_flag": bkt < 0.50,
                "evidence_count": int(state["evidence_count"]),
            }
        )
    return {
        "weekly_practice_minutes": survey.weekly_practice_minutes,
        "learning_goal": survey.learning_goal,
        "target_question_count": target_count,
        "support_style": survey.support_style,
        "learning_cadence": survey.learning_cadence,
        "strongest_concepts": strongest[:3],
        "weakest_concepts": weakest[:3],
        "recommended_concept_id": recommended,
        "confidence": confidence,
        "diagnostic_correct": sum(1 for answer in graded_answers if answer["correct"]),
        "diagnostic_total": len(graded_answers),
        "diagnostic_required_total": DIAGNOSTIC_REQUIRED_ANSWERS,
        "optional_diagnostic_available": len(graded_answers) < target_count,
        "seeded_concepts": seeded_concepts,
    }


def _apply_full_flow_demo_summary(summary: dict[str, Any]) -> dict[str, Any]:
    demo_summary = dict(summary)
    demo_summary["seeded_concepts"] = [dict(seed) for seed in FULL_FLOW_DEMO_SEEDED_CONCEPTS]
    demo_summary["strongest_concepts"] = ["d1-ai-llm-foundations", "d4-prompt-engineering", "d4-tool-calling"]
    demo_summary["weakest_concepts"] = ["d8-rag-pipeline", "d7-embedding-vector"]
    demo_summary["recommended_concept_id"] = "d8-rag-pipeline"
    demo_summary["confidence"] = "high"
    demo_summary["demo_profile_key"] = FULL_FLOW_DEMO_PROFILE_KEY
    return demo_summary


def _is_full_flow_demo_account(db: AdaptiveDatabaseInterface, student_id: str) -> bool:
    try:
        is_demo_account, demo_profile_key = get_user_demo_profile_flags(db, student_id)
        return is_demo_account and demo_profile_key == FULL_FLOW_DEMO_PROFILE_KEY
    except Exception as exc:
        logger.warning("Không đọc được demo profile flags cho onboarding: %s", exc)
        return False


def _session_target_count(session: dict[str, Any]) -> int:
    survey = session.get("survey") or {}
    raw_target = survey.get("target_question_count", DIAGNOSTIC_DEFAULT_TARGET_ANSWERS)
    try:
        target = int(raw_target)
    except (TypeError, ValueError):
        target = DIAGNOSTIC_DEFAULT_TARGET_ANSWERS
    if target not in ALLOWED_DIAGNOSTIC_TARGETS:
        target = DIAGNOSTIC_DEFAULT_TARGET_ANSWERS
    return max(DIAGNOSTIC_REQUIRED_ANSWERS, min(DIAGNOSTIC_MAX_ANSWERS, target))


def _select_next_question(
    candidates: list[dict[str, Any]],
    answered: list[dict[str, Any]],
    target_count: int = DIAGNOSTIC_DEFAULT_TARGET_ANSWERS,
) -> dict[str, Any] | None:
    if len(answered) >= target_count:
        return None

    answered_ids = {answer["question_id"] for answer in answered}
    remaining = [question for question in candidates if question["id"] not in answered_ids]
    if not remaining:
        return None

    if not answered:
        return min(
            remaining,
            key=lambda question: (
                abs(float(question["difficulty_elo"]) - DEFAULT_ELO),
                int(question.get("attempt_count") or 0),
                question["id"],
            ),
        )

    learner_elo = DEFAULT_ELO
    concept_counts: Counter[str] = Counter()
    for answer in answered:
        learner_elo = _elo_update(
            learner_elo,
            float(answer["difficulty_elo"]),
            bool(answer["correct"]),
            1.0,
        )
        for concept_id in answer.get("q_matrix", {answer["concept_id"]: 1.0}):
            concept_counts[str(concept_id)] += 1

    last = answered[-1]
    # Correct answers should raise challenge gradually; wrong answers should step down faster.
    target_elo = learner_elo + (30.0 if last["correct"] else -60.0)
    target_elo = min(DEFAULT_ELO + 220.0, max(DEFAULT_ELO - 220.0, target_elo))

    def question_rank(question: dict[str, Any]) -> tuple[float, int, int, str]:
        coverage_count = min(
            concept_counts[concept_id] for concept_id in question.get("coverage_concept_ids", [question["concept_id"]])
        )
        return (
            abs(float(question["difficulty_elo"]) - target_elo),
            coverage_count,
            int(question.get("attempt_count") or 0),
            question["id"],
        )

    return min(remaining, key=question_rank)


def _session_response(session: dict[str, Any], include_summary: bool = False) -> DiagnosticSessionState:
    answered = session.get("answered") or []
    candidates = session.get("candidate_questions") or []
    target_count = _session_target_count(session)
    current = next((question for question in candidates if question["id"] == session.get("current_question_id")), None)
    summary = None
    if include_summary or len(answered) >= DIAGNOSTIC_REQUIRED_ANSWERS:
        summary = _build_summary(DiagnosticSurvey(**session["survey"]), answered)
    return DiagnosticSessionState(
        session_id=session["id"],
        current_question=_public_question(current),
        answered_count=len(answered),
        required_count=DIAGNOSTIC_REQUIRED_ANSWERS,
        max_count=target_count,
        can_complete=len(answered) >= DIAGNOSTIC_REQUIRED_ANSWERS,
        can_continue=len(answered) < target_count and current is not None,
        summary=summary,
    )


def _load_session(db: AdaptiveDatabaseInterface, session_id: str, student_id: str) -> dict[str, Any]:
    if _is_stub_db(db):
        session = _STUB_DIAGNOSTIC_SESSIONS.get(session_id)
    else:
        try:
            response = (
                db.app_client.table("onboarding_diagnostic_sessions")
                .select("*")
                .eq("id", session_id)
                .eq("student_id", student_id)
                .limit(1)
                .execute()
            )
            session = response.data[0] if response.data else None
        except Exception as exc:
            logger.warning("Không đọc được onboarding diagnostic session: %s", exc)
            raise HTTPException(
                status_code=503,
                detail={"code": "onboarding_session_unavailable", "message": "Không đọc được phiên diagnostic."},
            )

    if not session:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiên diagnostic.")
    expires_at = session.get("expires_at")
    if expires_at:
        expiry = datetime.fromisoformat(str(expires_at).replace("Z", "+00:00"))
        if expiry < datetime.now(UTC):
            raise HTTPException(status_code=410, detail="Phiên diagnostic đã hết hạn.")
    if session.get("completed_at"):
        raise HTTPException(status_code=409, detail="Phiên diagnostic đã hoàn tất.")
    return session


def _persist_session(db: AdaptiveDatabaseInterface, session: dict[str, Any]) -> None:
    session["updated_at"] = _now_iso()
    if _is_stub_db(db):
        _STUB_DIAGNOSTIC_SESSIONS[session["id"]] = session
        return
    try:
        db.app_client.table("onboarding_diagnostic_sessions").upsert(session).execute()
    except Exception as exc:
        logger.warning("Không lưu được onboarding diagnostic session: %s", exc)
        raise HTTPException(
            status_code=503,
            detail={"code": "onboarding_session_unavailable", "message": "Không lưu được phiên diagnostic."},
        )


def _profile_from_row(row: dict[str, Any]) -> OnboardingStatusResponse:
    completed_at = row.get("completed_at")
    return OnboardingStatusResponse(
        completed=bool(completed_at),
        source="database",
        summary=row.get("summary") or None,
    )


@router.get("/status", response_model=OnboardingStatusResponse)
async def get_onboarding_status(
    user: AuthenticatedUser = Depends(get_current_user),
    db: AdaptiveDatabaseInterface = Depends(get_adaptive_db),
) -> OnboardingStatusResponse:
    if user.role != "student":
        return OnboardingStatusResponse(completed=True, source="role_bypass")

    student_id = str(user.id)
    if _is_full_flow_demo_account(db, student_id):
        return OnboardingStatusResponse(completed=False, source="demo_full_flow")

    if _is_stub_db(db):
        profile = _STUB_ONBOARDING_PROFILES.get(student_id)
        if not profile:
            return OnboardingStatusResponse(completed=False, source="stub")
        return OnboardingStatusResponse(completed=True, source="stub", summary=profile.get("summary"))

    try:
        response = (
            db.app_client.table("onboarding_profiles")
            .select("*")
            .eq("student_id", student_id)
            .eq("profile_version", PROFILE_VERSION)
            .limit(1)
            .execute()
        )
    except Exception as exc:
        logger.warning("Không đọc được onboarding_profiles: %s", exc)
        raise HTTPException(
            status_code=503,
            detail={"code": "onboarding_store_unavailable", "message": "Không đọc được trạng thái onboarding."},
        )

    if not response.data:
        return OnboardingStatusResponse(completed=False, source="database")
    return _profile_from_row(response.data[0])


@router.post("/diagnostic/start", response_model=DiagnosticSessionState)
async def start_onboarding_diagnostic(
    payload: DiagnosticStartRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AdaptiveDatabaseInterface = Depends(get_adaptive_db),
) -> DiagnosticSessionState:
    started_at = perf_counter()
    _validate_survey(payload)
    if _is_stub_db(db):
        raise HTTPException(
            status_code=503,
            detail={"code": "onboarding_question_bank_unavailable", "message": "Question bank chưa sẵn sàng."},
        )

    load_started_at = perf_counter()
    candidates = _load_onboarding_candidate_questions(db, payload.course_id)
    load_ms = (perf_counter() - load_started_at) * 1000
    target_count = max(DIAGNOSTIC_REQUIRED_ANSWERS, min(DIAGNOSTIC_MAX_ANSWERS, payload.target_question_count))
    first_question = _select_next_question(candidates, [], target_count)
    session_id = str(uuid4())
    session = {
        "id": session_id,
        "student_id": str(user.id),
        "course_id": str(payload.course_id),
        "survey": payload.model_dump(mode="json"),
        "candidate_question_ids": [question["id"] for question in candidates],
        "candidate_questions": _candidate_pool_with_full_question(
            [_session_candidate(question) for question in candidates],
            first_question,
        ),
        "answered": [],
        "current_question_id": first_question["id"] if first_question else None,
        "expires_at": (datetime.now(UTC) + timedelta(hours=DIAGNOSTIC_SESSION_TTL_HOURS)).isoformat(),
        "completed_at": None,
        "created_at": _now_iso(),
        "updated_at": _now_iso(),
    }
    persist_started_at = perf_counter()
    _persist_session(db, session)
    persist_ms = (perf_counter() - persist_started_at) * 1000
    total_ms = (perf_counter() - started_at) * 1000
    logger.info(
        "ONBOARDING_DIAGNOSTIC_START %.0fms candidates=%s target=%s db_load=%.0fms persist=%.0fms",
        total_ms,
        len(candidates),
        target_count,
        load_ms,
        persist_ms,
    )
    return _session_response(session)


@router.post("/diagnostic/answer", response_model=DiagnosticAnswerResponse)
async def answer_onboarding_diagnostic(
    payload: DiagnosticAnswerRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AdaptiveDatabaseInterface = Depends(get_adaptive_db),
) -> DiagnosticAnswerResponse:
    started_at = perf_counter()
    load_started_at = perf_counter()
    session = _load_session(db, payload.session_id, str(user.id))
    load_ms = (perf_counter() - load_started_at) * 1000
    if payload.question_id != session.get("current_question_id"):
        raise HTTPException(status_code=409, detail="Câu trả lời không khớp câu hỏi hiện tại của phiên diagnostic.")

    answered = session.get("answered") or []
    if any(answer["question_id"] == payload.question_id for answer in answered):
        raise HTTPException(status_code=409, detail="Câu hỏi diagnostic này đã được trả lời.")

    candidates = session.get("candidate_questions") or []
    question = next((item for item in candidates if item["id"] == payload.question_id), None)
    if question and "options" not in question:
        question = _load_onboarding_question_by_id(db, payload.question_id)
    if not question:
        raise HTTPException(status_code=422, detail="Câu hỏi diagnostic không thuộc phiên hiện tại.")
    if payload.selected_option_id not in {option["id"] for option in question["options"]}:
        raise HTTPException(status_code=422, detail="selected_option_id không hợp lệ.")

    correct = payload.selected_option_id == question["correct_option_id"]
    graded = {
        "question_id": question["id"],
        "concept_id": question["concept_id"],
        "selected_option_id": payload.selected_option_id,
        "correct": correct,
        "response_time_ms": payload.response_time_ms,
        "difficulty_elo": question["difficulty_elo"],
        "q_matrix": question["q_matrix"],
    }
    answered.append(graded)
    next_question = _select_next_question(candidates, answered, _session_target_count(session))
    session["answered"] = answered
    session["current_question_id"] = next_question["id"] if next_question else None
    next_question_private = None
    if next_question:
        next_question_private = (
            next_question if "options" in next_question else _load_onboarding_question_by_id(db, next_question["id"])
        )
    session["candidate_questions"] = _candidate_pool_with_full_question(candidates, next_question_private)
    persist_started_at = perf_counter()
    _persist_session(db, session)
    persist_ms = (perf_counter() - persist_started_at) * 1000

    state = _session_response(session, include_summary=len(answered) >= DIAGNOSTIC_REQUIRED_ANSWERS)
    total_ms = (perf_counter() - started_at) * 1000
    logger.info(
        "ONBOARDING_DIAGNOSTIC_ANSWER %.0fms session_load=%.0fms persist=%.0fms answered=%s has_next=%s",
        total_ms,
        load_ms,
        persist_ms,
        len(answered),
        bool(next_question_private),
    )
    return DiagnosticAnswerResponse(
        **state.model_dump(),
        feedback=DiagnosticFeedback(
            correct=correct,
            message=question["encouragement"]["correct"] if correct else question["encouragement"]["incorrect"],
            explanation=question.get("explanation") or None,
        ),
    )


@router.post("/complete", response_model=OnboardingCompleteResponse)
async def complete_onboarding(
    payload: OnboardingCompleteRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AdaptiveDatabaseInterface = Depends(get_adaptive_db),
) -> OnboardingCompleteResponse:
    _validate_survey(payload)
    session = _load_session(db, payload.session_id, str(user.id))
    answered = session.get("answered") or []
    if len(answered) < DIAGNOSTIC_REQUIRED_ANSWERS:
        raise HTTPException(status_code=422, detail="Bạn cần hoàn thành ít nhất 5 câu diagnostic trước khi lưu hồ sơ.")

    survey = DiagnosticSurvey(**session["survey"])
    summary = _build_summary(survey, answered)
    if _is_full_flow_demo_account(db, str(user.id)):
        summary = _apply_full_flow_demo_summary(summary)
    profile_id = str(uuid4())
    row = {
        "id": profile_id,
        "student_id": str(user.id),
        "profile_version": PROFILE_VERSION,
        "survey": survey.model_dump(mode="json"),
        "diagnostic_answers": answered,
        "summary": summary,
        "recommended_concept_id": summary["recommended_concept_id"],
        "completed_at": _now_iso(),
        "updated_at": _now_iso(),
    }

    if _is_stub_db(db):
        row["mastery_seeded"] = True
        _STUB_ONBOARDING_PROFILES[str(user.id)] = row
        session["completed_at"] = _now_iso()
        _persist_session(db, session)
        return OnboardingCompleteResponse(
            completed=True,
            profile_id=profile_id,
            recommended_concept_id=summary["recommended_concept_id"],
            summary=summary,
        )

    try:
        response = db.app_client.rpc("complete_onboarding_diagnostic", {"p_profile": row}).execute()
        _commit_question_calibration(db, session)
        session["completed_at"] = _now_iso()
        _persist_session(db, session)
    except Exception as exc:
        logger.warning("Không ghi được onboarding_profiles: %s", exc)
        raise HTTPException(
            status_code=503,
            detail={"code": "onboarding_store_unavailable", "message": "Không lưu được onboarding."},
        )

    persisted_id = profile_id
    if isinstance(response.data, dict):
        persisted_id = response.data.get("profile_id") or profile_id
    elif response.data and isinstance(response.data, list):
        persisted_id = response.data[0].get("profile_id") or response.data[0].get("id") or profile_id

    return OnboardingCompleteResponse(
        completed=True,
        profile_id=persisted_id,
        recommended_concept_id=summary["recommended_concept_id"],
        summary=summary,
    )
