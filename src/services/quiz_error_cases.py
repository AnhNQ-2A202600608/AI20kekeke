from __future__ import annotations

from collections import Counter
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from fastapi import HTTPException
from pydantic import BaseModel, Field, field_validator

VALID_STATUSES = {"new", "in_progress", "resolved", "rejected"}
OPEN_STATUSES = ["new", "in_progress"]
TERMINAL_STATUSES = {"resolved", "rejected"}
VALID_TRANSITIONS = {
    "new": {"in_progress", "resolved", "rejected"},
    "in_progress": {"resolved", "rejected"},
}
OPTION_KEYS = {"A", "B", "C", "D"}


class QuizErrorStatusUpdate(BaseModel):
    status: str = Field(..., min_length=1)
    resolution_note: str | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        normalized = value.strip()
        if normalized not in VALID_STATUSES:
            raise ValueError("Invalid quiz error case status.")
        return normalized

    @field_validator("resolution_note")
    @classmethod
    def normalize_resolution_note(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


class QuizErrorQuestionUpdate(BaseModel):
    question_text: str = Field(..., min_length=8)
    options: dict[str, str]
    correct_answer: str = Field(..., min_length=1, max_length=1)
    explanation: str | None = None
    difficulty: str | int | float | None = None

    @field_validator("question_text")
    @classmethod
    def normalize_question_text(cls, value: str) -> str:
        normalized = value.strip()
        if len(normalized) < 8:
            raise ValueError("Question text must be at least 8 characters.")
        return normalized

    @field_validator("options")
    @classmethod
    def validate_options(cls, value: dict[str, str]) -> dict[str, str]:
        if set(value) != OPTION_KEYS:
            raise ValueError("Options must contain exactly A, B, C, and D.")
        normalized: dict[str, str] = {}
        for key in ("A", "B", "C", "D"):
            option = value.get(key)
            if not isinstance(option, str) or not option.strip():
                raise ValueError("Options must be non-empty strings.")
            normalized[key] = option.strip()
        return normalized

    @field_validator("correct_answer")
    @classmethod
    def validate_correct_answer(cls, value: str) -> str:
        normalized = value.strip().upper()
        if normalized not in OPTION_KEYS:
            raise ValueError("Correct answer must be A, B, C, or D.")
        return normalized

    @field_validator("explanation")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    @field_validator("difficulty")
    @classmethod
    def normalize_difficulty(cls, value: str | int | float | None) -> str | int | float | None:
        if value is None or isinstance(value, (int, float)):
            return value
        normalized = value.strip()
        return normalized or None


def create_or_update_quiz_error_case(db, request, student_id: UUID) -> dict:
    client = _app_client(db)
    if client is None:
        return {
            "case_id": "stub-quiz-error-case",
            "report_id": "stub-quiz-error-report",
            "status": "new",
        }

    course_id = _required_text(getattr(request, "course_id", None), "course_id")
    question_id = _required_text(getattr(request, "question_id", None), "question_id")
    error_type = _required_text(getattr(request, "error_type", None), "error_type")
    detail = _required_text(getattr(request, "detail", None), "detail")
    _validate_uuid_text(course_id, "course_id")
    _validate_uuid_text(question_id, "question_id")
    now = _now()

    course = _fetch_one(client, "courses", "id", course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found.")

    student = _fetch_one(client, "users", "id", str(student_id))
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found.")

    question = _fetch_one(client, "questions", "id", question_id)
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found.")

    open_case = _find_open_case(client, course_id, question_id)
    if open_case is None:
        case_payload = {
            "course_id": course_id,
            "question_id": question_id,
            "status": "new",
            "report_count": 0,
            "last_reported_at": now,
            "created_at": now,
            "updated_at": now,
        }
        case_response = client.table("quiz_error_cases").insert(case_payload).execute()
        open_case = _first(case_response.data)
        if open_case is None:
            raise HTTPException(status_code=400, detail="Unable to create quiz error case.")

    case_id = _required_text(open_case.get("id"), "case_id")
    report_payload = {
        "case_id": case_id,
        "student_id": str(student_id),
        "course_id": course_id,
        "question_id": question_id,
        "error_type": error_type,
        "detail": detail,
        "selected_option": getattr(request, "selected_option", None),
        "question_snapshot": _question_snapshot(question),
        "created_at": now,
    }
    report_response = client.table("quiz_error_reports").insert(report_payload).execute()
    report = _first(report_response.data)
    if report is None:
        raise HTTPException(status_code=400, detail="Unable to create quiz error report.")

    report_count = int(open_case.get("report_count") or 0) + 1
    case_update = {
        "report_count": report_count,
        "last_reported_at": now,
        "updated_at": now,
    }
    client.table("quiz_error_cases").update(case_update).eq("id", case_id).execute()

    return {
        "case_id": case_id,
        "report_id": report.get("id"),
        "status": open_case.get("status", "new"),
    }


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
    client = _require_client(db)
    normalized_limit = max(1, min(int(limit), 100))
    normalized_offset = max(0, int(offset))

    query = client.table("quiz_error_cases").select("*")
    if status:
        if status not in VALID_STATUSES:
            raise HTTPException(status_code=422, detail="Invalid quiz error case status.")
        query = query.eq("status", status)
    if course_id:
        query = query.eq("course_id", course_id)

    response = query.order("last_reported_at", desc=True).execute()
    cases = [_enrich_case(client, case) for case in _as_list(response.data)]
    if error_type:
        cases = _filter_cases_by_report_error_type(client, cases, error_type)
    cases = _filter_search(cases, search)
    total = len(cases)
    page = cases[normalized_offset : normalized_offset + normalized_limit]

    return {
        "items": page,
        "total": total,
        "limit": normalized_limit,
        "offset": normalized_offset,
    }


def get_quiz_error_case_detail(db, case_id: str) -> dict:
    client = _require_client(db)
    case = _fetch_one(client, "quiz_error_cases", "id", case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Quiz error case not found.")

    reports_response = (
        client.table("quiz_error_reports").select("*").eq("case_id", case_id).order("created_at", desc=True).execute()
    )
    question = None
    question_id = case.get("question_id")
    if question_id:
        question = _fetch_one(client, "questions", "id", question_id)

    return {
        "case": case,
        "reports": _as_list(reports_response.data),
        "question": question,
    }


def transition_quiz_error_case(db, case_id: str, payload: QuizErrorStatusUpdate, user) -> dict:
    client = _require_client(db)
    case = _fetch_one(client, "quiz_error_cases", "id", case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Quiz error case not found.")

    current_status = case.get("status", "new")
    next_status = payload.status
    if current_status in TERMINAL_STATUSES or next_status not in VALID_TRANSITIONS.get(current_status, set()):
        raise HTTPException(status_code=400, detail="Invalid quiz error case status transition.")
    if next_status in TERMINAL_STATUSES and not payload.resolution_note:
        raise HTTPException(status_code=422, detail="Resolution note is required.")

    now = _now()
    update_payload: dict[str, Any] = {
        "status": next_status,
        "updated_at": now,
    }
    if payload.resolution_note is not None:
        update_payload["resolution_note"] = payload.resolution_note
    if next_status in TERMINAL_STATUSES:
        update_payload["resolved_by"] = str(getattr(user, "id", ""))
        update_payload["resolved_at"] = now

    response = client.table("quiz_error_cases").update(update_payload).eq("id", case_id).execute()
    updated = _first(response.data)
    if updated is None:
        raise HTTPException(status_code=400, detail="Unable to update quiz error case.")
    return {"case": updated}


def update_quiz_error_question(db, case_id: str, payload: QuizErrorQuestionUpdate, user) -> dict:
    client = _require_client(db)
    case = _fetch_one(client, "quiz_error_cases", "id", case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Quiz error case not found.")

    question_id = case.get("question_id")
    if not question_id:
        raise HTTPException(status_code=400, detail="Quiz error case has no question.")
    question = _fetch_one(client, "questions", "id", question_id)
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found.")

    now = _now()
    question_update = _build_question_update_payload(question, payload, now)
    question_update["updated_at"] = now
    question_response = client.table("questions").update(question_update).eq("id", question_id).execute()
    updated_question = _first(question_response.data)
    if updated_question is None:
        raise HTTPException(status_code=400, detail="Unable to update question.")

    case_update = {"updated_at": now}
    case_response = client.table("quiz_error_cases").update(case_update).eq("id", case_id).execute()
    updated_case = _first(case_response.data) or case

    return {
        "case": updated_case,
        "question": updated_question,
    }


def _app_client(db):
    if getattr(db, "_stub_mode", False):
        return None
    return getattr(db, "app_client", None)


def _require_client(db):
    client = _app_client(db)
    if client is None:
        raise HTTPException(status_code=503, detail="Quiz error case storage is not configured.")
    return client


def _required_text(value: Any, field_name: str) -> str:
    if value is None:
        raise HTTPException(status_code=422, detail=f"{field_name} is required.")
    normalized = str(value).strip()
    if not normalized:
        raise HTTPException(status_code=422, detail=f"{field_name} is required.")
    return normalized


def _validate_uuid_text(value: str, field_name: str) -> None:
    try:
        UUID(value)
    except (TypeError, ValueError):
        raise HTTPException(status_code=422, detail=f"{field_name} must be a valid UUID.")


def _now() -> str:
    return datetime.now(UTC).isoformat()


def _fetch_one(client, table_name: str, key: str, value: Any) -> dict | None:
    response = client.table(table_name).select("*").eq(key, value).limit(1).execute()
    return _first(response.data)


def _find_open_case(client, course_id: str, question_id: str) -> dict | None:
    response = (
        client.table("quiz_error_cases")
        .select("*")
        .eq("course_id", course_id)
        .eq("question_id", question_id)
        .in_("status", OPEN_STATUSES)
        .limit(1)
        .execute()
    )
    return _first(response.data)


def _first(data: Any) -> dict | None:
    if isinstance(data, list):
        return data[0] if data else None
    if isinstance(data, dict):
        return data
    return None


def _as_list(data: Any) -> list[dict]:
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        return [data]
    return []


def _question_snapshot(question: dict) -> dict:
    answer_key = question.get("answer_key")
    options = question.get("options")
    correct_answer = question.get("correct_answer")
    explanation = question.get("explanation")
    if isinstance(answer_key, dict):
        options = options or answer_key.get("options") or answer_key.get("choices")
        correct_answer = (
            correct_answer or answer_key.get("correct_answer") or answer_key.get("correct") or answer_key.get("answer")
        )
        explanation = explanation or answer_key.get("explanation")

    return {
        "id": question.get("id"),
        "question_text": question.get("question_text") or question.get("prompt"),
        "prompt": question.get("prompt"),
        "options": options,
        "answer_key": answer_key,
        "correct_answer": correct_answer,
        "explanation": explanation,
        "difficulty": question.get("difficulty") or question.get("difficulty_elo"),
        "difficulty_elo": question.get("difficulty_elo"),
    }


def _build_question_update_payload(question: dict, payload: QuizErrorQuestionUpdate, now: str) -> dict:
    if any(key in question for key in ("prompt", "answer_key", "difficulty_elo")):
        existing_answer_key = question.get("answer_key")
        answer_key = dict(existing_answer_key) if isinstance(existing_answer_key, dict) else {}
        answer_key.update(
            {
                "options": payload.options,
                "choices": payload.options,
                "correct": payload.correct_answer,
                "correct_answer": payload.correct_answer,
            }
        )
        if payload.explanation is not None:
            answer_key["explanation"] = payload.explanation

        update_payload: dict[str, Any] = {
            "prompt": payload.question_text,
            "answer_key": answer_key,
            "updated_at": now,
        }
        difficulty_elo = _numeric_difficulty(payload.difficulty)
        if difficulty_elo is not None:
            update_payload["difficulty_elo"] = difficulty_elo
        return update_payload

    return {
        "question_text": payload.question_text,
        "options": payload.options,
        "correct_answer": payload.correct_answer,
        "explanation": payload.explanation,
        "difficulty": payload.difficulty,
        "updated_at": now,
    }


def _filter_cases_by_report_error_type(client, cases: list[dict], error_type: str) -> list[dict]:
    return [case for case in cases if any(report.get("error_type") == error_type for report in case.get("reports", []))]


def _enrich_case(client, case: dict) -> dict:
    enriched = dict(case)
    question_id = case.get("question_id")
    enriched["question"] = _fetch_one(client, "questions", "id", question_id) if question_id else None
    enriched["reports"] = _fetch_reports_for_case(client, case.get("id"))
    enriched["most_common_error_type"] = _most_common_error_type(enriched["reports"])
    return enriched


def _fetch_reports_for_case(client, case_id: Any) -> list[dict]:
    if not case_id:
        return []
    response = (
        client.table("quiz_error_reports").select("*").eq("case_id", case_id).order("created_at", desc=True).execute()
    )
    return _as_list(response.data)


def _most_common_error_type(reports: list[dict]) -> str | None:
    counts = Counter(report.get("error_type") for report in reports if report.get("error_type"))
    if not counts:
        return None
    return counts.most_common(1)[0][0]


def _numeric_difficulty(value: str | int | float | None) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _filter_search(cases: list[dict], search: str | None) -> list[dict]:
    if not search or not search.strip():
        return cases
    needle = search.strip().lower()
    case_fields = ("resolution_note",)
    question_fields = ("question_text", "prompt")
    report_fields = ("detail", "error_type")
    return [
        case
        for case in cases
        if any(needle in str(case.get(field) or "").lower() for field in case_fields)
        or any(needle in str((case.get("question") or {}).get(field) or "").lower() for field in question_fields)
        or any(
            needle in str(report.get(field) or "").lower()
            for report in case.get("reports", [])
            for field in report_fields
        )
    ]
