from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException
from pydantic import BaseModel, Field


class HintPayload(BaseModel):
    level: str  # "light", "medium", "deep"
    content: str


class QuizReviewContentUpdate(BaseModel):
    question_text: str = Field(..., min_length=8)
    options: dict[str, str]
    correct_answer: str
    explanation: str | None = None
    difficulty: str | None = None  # "dễ", "bình thường", "khó"
    hints: list[HintPayload]
    concept_codes: list[str]


class QuizReviewStatusUpdate(BaseModel):
    status: str  # "draft", "published", "rejected"
    rejection_reason: str | None = None


def list_review_questions(
    db,
    *,
    status: str | None = None,
    source_document: str | None = None,
    concept_code: str | None = None,
    search: str | None = None,
    limit: int = 30,
    offset: int = 0,
) -> dict:
    client = _require_client(db)
    normalized_limit = max(1, min(int(limit), 100))
    normalized_offset = max(0, int(offset))

    # 1. Fetch concept_id if concept_code is provided
    concept_id = None
    if concept_code and concept_code != "all":
        concept_resp = client.table("concepts").select("id").eq("code", concept_code).limit(1).execute()
        if concept_resp.data:
            concept_id = concept_resp.data[0]["id"]
        else:
            # Concept code not found, return empty results
            return {
                "items": [],
                "total": 0,
                "limit": normalized_limit,
                "offset": normalized_offset,
            }

    # 2. Build questions query
    query = client.table("questions").select("*")
    if status and status != "all":
        query = query.eq("calibration_status", status)
    if source_document and source_document != "all":
        query = query.eq("source_document_name", source_document)
    if concept_id:
        query = query.eq("concept_id", concept_id)
    if search:
        query = query.ilike("prompt", f"%{search}%")

    response = query.order("created_at", desc=True).execute()
    raw_questions = _as_list(response.data)
    total = len(raw_questions)

    # Apply pagination in Python to keep it simple & matching search count
    paginated_questions = raw_questions[normalized_offset : normalized_offset + normalized_limit]

    if not paginated_questions:
        return {
            "items": [],
            "total": total,
            "limit": normalized_limit,
            "offset": normalized_offset,
        }

    q_ids = [q["id"] for q in paginated_questions]

    # 3. Fetch hints for these questions
    hints_resp = client.table("question_hints").select("*").in_("question_id", q_ids).execute()
    hints_by_q = {}
    for h in _as_list(hints_resp.data):
        hints_by_q.setdefault(h["question_id"], []).append(h)

    # 4. Fetch concepts junction
    j_resp = client.table("question_concepts").select("question_id, concept_id").in_("question_id", q_ids).execute()
    all_c_ids = list({j["concept_id"] for j in _as_list(j_resp.data)})

    concepts_map = {}
    if all_c_ids:
        c_resp = client.table("concepts").select("id, code").in_("id", all_c_ids).execute()
        concepts_map = {c["id"]: c["code"] for c in _as_list(c_resp.data)}

    concepts_by_q = {}
    for j in _as_list(j_resp.data):
        q_id = j["question_id"]
        c_id = j["concept_id"]
        code = concepts_map.get(c_id)
        if code:
            concepts_by_q.setdefault(q_id, []).append(code)

    # Add fallback concept code from questions table directly
    for q in paginated_questions:
        q_id = q["id"]
        if q_id not in concepts_by_q:
            c_id = q.get("concept_id")
            if c_id:
                fallback_code_resp = client.table("concepts").select("code").eq("id", c_id).limit(1).execute()
                if fallback_code_resp.data:
                    concepts_by_q[q_id] = [fallback_code_resp.data[0]["code"]]

    # 5. Normalize questions
    items = []
    for q in paginated_questions:
        q_id = q["id"]
        q_hints = hints_by_q.get(q_id, [])
        q_concepts = concepts_by_q.get(q_id, [])
        items.append(_normalize_question(q, q_hints, q_concepts))

    return {
        "items": items,
        "total": total,
        "limit": normalized_limit,
        "offset": normalized_offset,
    }


def get_review_question(db, question_id: str) -> dict:
    client = _require_client(db)
    q_resp = client.table("questions").select("*").eq("id", question_id).limit(1).execute()
    question = _first(q_resp.data)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found.")

    hints_resp = client.table("question_hints").select("*").eq("question_id", question_id).execute()

    j_resp = client.table("question_concepts").select("concept_id").eq("question_id", question_id).execute()
    c_ids = [j["concept_id"] for j in _as_list(j_resp.data)]
    concept_codes = []
    if c_ids:
        c_resp = client.table("concepts").select("code").in_("id", c_ids).execute()
        concept_codes = [c["code"] for c in _as_list(c_resp.data)]
    else:
        c_id = question.get("concept_id")
        if c_id:
            c_resp = client.table("concepts").select("code").eq("id", c_id).limit(1).execute()
            if c_resp.data:
                concept_codes = [c_resp.data[0]["code"]]

    return _normalize_question(question, hints_resp.data or [], concept_codes)


def update_review_question_content(db, question_id: str, payload: QuizReviewContentUpdate, user) -> dict:
    client = _require_client(db)

    # 1. Verify question exists
    q_resp = client.table("questions").select("*").eq("id", question_id).limit(1).execute()
    question = _first(q_resp.data)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found.")

    # Validate options key set
    option_keys = {"A", "B", "C", "D"}
    if set(payload.options.keys()) != option_keys:
        raise HTTPException(status_code=422, detail="Options must contain exactly keys A, B, C, and D.")

    if payload.correct_answer not in option_keys:
        raise HTTPException(status_code=422, detail="Correct answer must be A, B, C, or D.")

    now = _now()

    # 2. Map difficulty to Elo
    difficulty_map = {"dễ": 1050.0, "bình thường": 1200.0, "khó": 1350.0}
    difficulty_elo = difficulty_map.get((payload.difficulty or "").lower(), 1200.0)

    # 3. Handle concept_id in app.questions
    concept_id = question.get("concept_id")
    if payload.concept_codes:
        c_resp = client.table("concepts").select("id").eq("code", payload.concept_codes[0]).limit(1).execute()
        if c_resp.data:
            concept_id = c_resp.data[0]["id"]

    # 4. Update questions table
    answer_key = {
        "options": payload.options,
        "correct": payload.correct_answer,
        "explanation": payload.explanation,
    }

    question_update = {
        "prompt": payload.question_text,
        "answer_key": answer_key,
        "difficulty_elo": difficulty_elo,
        "concept_id": concept_id,
        "updated_at": now,
    }

    update_resp = client.table("questions").update(question_update).eq("id", question_id).execute()
    updated_q = _first(update_resp.data)
    if not updated_q:
        raise HTTPException(status_code=400, detail="Failed to update question in database.")

    # 5. Update junction table
    if payload.concept_codes:
        all_c_resp = client.table("concepts").select("id").in_("code", payload.concept_codes).execute()
        valid_c_ids = [c["id"] for c in _as_list(all_c_resp.data)]

        # Delete old relations
        client.table("question_concepts").delete().eq("question_id", question_id).execute()

        # Insert new relations
        if valid_c_ids:
            j_payload = [{"question_id": question_id, "concept_id": cid} for cid in valid_c_ids]
            client.table("question_concepts").insert(j_payload).execute()

    # 6. Update hints ladder
    hint_level_map = {"light": 1, "medium": 2, "deep": 3}
    hints_payload = []
    for h in payload.hints:
        lvl_num = hint_level_map.get(h.level)
        if lvl_num:
            hints_payload.append(
                {
                    "question_id": question_id,
                    "level": lvl_num,
                    "hint_text": h.content,
                }
            )

    if hints_payload:
        client.table("question_hints").upsert(hints_payload).execute()

    # Get updated details
    latest_hints_resp = client.table("question_hints").select("*").eq("question_id", question_id).execute()
    return _normalize_question(updated_q, latest_hints_resp.data or [], payload.concept_codes)


def update_review_question_status(db, question_id: str, status: str, rejection_reason: str | None, user) -> dict:
    client = _require_client(db)

    # Verify question exists
    q_resp = client.table("questions").select("*").eq("id", question_id).limit(1).execute()
    question = _first(q_resp.data)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found.")

    valid_statuses = {"draft", "published", "rejected"}
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid calibration status.")

    now = _now()
    update_payload = {
        "calibration_status": status,
        "updated_at": now,
    }

    if status == "rejected":
        if not rejection_reason or not rejection_reason.strip():
            raise HTTPException(status_code=422, detail="Rejection reason is required when status is rejected.")
        update_payload["rejection_reason"] = rejection_reason.strip()
    else:
        # Clear rejection reason if approved or set to draft
        update_payload["rejection_reason"] = None

    update_resp = client.table("questions").update(update_payload).eq("id", question_id).execute()
    updated_q = _first(update_resp.data)
    if not updated_q:
        raise HTTPException(status_code=400, detail="Failed to update question status.")

    # Get hints
    hints_resp = client.table("question_hints").select("*").eq("question_id", question_id).execute()

    # Get concepts
    j_resp = client.table("question_concepts").select("concept_id").eq("question_id", question_id).execute()
    c_ids = [j["concept_id"] for j in _as_list(j_resp.data)]
    concept_codes = []
    if c_ids:
        c_resp = client.table("concepts").select("code").in_("id", c_ids).execute()
        concept_codes = [c["code"] for c in _as_list(c_resp.data)]
    else:
        c_id = updated_q.get("concept_id")
        if c_id:
            c_resp = client.table("concepts").select("code").eq("id", c_id).limit(1).execute()
            if c_resp.data:
                concept_codes = [c_resp.data[0]["code"]]

    return _normalize_question(updated_q, hints_resp.data or [], concept_codes)


# ============================================================================
# Helpers
# ============================================================================


def _app_client(db):
    if getattr(db, "_stub_mode", False):
        return None
    return getattr(db, "app_client", None)


def _require_client(db):
    client = _app_client(db)
    if client is None:
        raise HTTPException(status_code=503, detail="Supabase connection is not configured.")
    return client


def _now() -> str:
    return datetime.now(UTC).isoformat()


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


def _normalize_question(q: dict, hints: list[dict], concept_codes: list[str]) -> dict:
    answer_key = q.get("answer_key") or {}
    options = answer_key.get("options") or answer_key.get("choices") or {}
    correct = answer_key.get("correct") or answer_key.get("correct_answer") or answer_key.get("answer") or "A"
    explanation = answer_key.get("explanation") or ""

    elo = q.get("difficulty_elo")
    difficulty = "bình thường"
    if elo is not None:
        try:
            elo_val = float(elo)
            if elo_val <= 1100:
                difficulty = "dễ"
            elif elo_val > 1300:
                difficulty = "khó"
            else:
                difficulty = "bình thường"
        except (ValueError, TypeError):
            pass

    hint_level_map = {1: "light", 2: "medium", 3: "deep"}
    formatted_hints = []
    for h in hints:
        level_num = h.get("level")
        level_str = hint_level_map.get(level_num)
        if level_str:
            formatted_hints.append(
                {
                    "level": level_str,
                    "content": h.get("hint_text") or "",
                }
            )

    # Fill default hints structure if not present
    existing_levels = {h["level"] for h in formatted_hints}
    for level_str in ("light", "medium", "deep"):
        if level_str not in existing_levels:
            formatted_hints.append({"level": level_str, "content": ""})

    # Sort hints by key
    level_order = {"light": 1, "medium": 2, "deep": 3}
    formatted_hints.sort(key=lambda x: level_order.get(x["level"], 0))

    return {
        "id": q.get("id"),
        "setId": concept_codes[0] if concept_codes else "unknown",
        "sourceTitle": q.get("source_document_name") or "Unknown Document",
        "sourcePage": "",
        "sourceExcerpt": "",
        "question": q.get("prompt") or "",
        "options": {
            "A": options.get("A") or "",
            "B": options.get("B") or "",
            "C": options.get("C") or "",
            "D": options.get("D") or "",
        },
        "answer": correct,
        "explanation": explanation,
        "difficulty": difficulty,
        "published_status": q.get("calibration_status") or "draft",
        "rejection_reason": q.get("rejection_reason"),
        "hints": formatted_hints,
        "concepts": concept_codes,
    }
