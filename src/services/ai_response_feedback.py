from __future__ import annotations

import json
from collections import defaultdict
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from fastapi import HTTPException

REVIEWABLE_FEEDBACK_TYPES = {"helpful", "unhelpful", "incorrect", "bad_citation", "unsafe"}
NEGATIVE_FEEDBACK_TYPES = {"unhelpful", "incorrect", "bad_citation", "unsafe"}
REVIEWABLE_TARGET_TYPE = "message"
REVIEW_STATUS_VALUES = {"pending", "resolved", "rejected", "flagged"}


def _require_uuid(value: str, field_name: str) -> UUID:
    try:
        return UUID(str(value))
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=f"{field_name} must be a valid UUID.") from exc


def serialize_feedback_comment(comment: str | None, metadata: dict[str, Any] | None = None) -> str:
    payload = {
        "comment": (comment or "").strip(),
        "metadata": metadata or {},
    }
    return json.dumps(payload, ensure_ascii=False)


def parse_feedback_comment(raw_comment: str | None) -> dict[str, Any]:
    if not raw_comment:
        return {"comment": "", "metadata": {}}

    try:
        parsed = json.loads(raw_comment)
    except json.JSONDecodeError:
        return {"comment": raw_comment, "metadata": {}}

    if isinstance(parsed, dict):
        return {
            "comment": str(parsed.get("comment") or ""),
            "metadata": parsed.get("metadata") if isinstance(parsed.get("metadata"), dict) else {},
        }

    return {"comment": raw_comment, "metadata": {}}


def record_ai_response_feedback(
    db: Any,
    *,
    user_id: UUID,
    course_id: str,
    target_id: str,
    feedback_type: str,
    comment: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    course_uuid = _require_uuid(course_id, "course_id")
    target_uuid = _require_uuid(target_id, "target_id")

    if feedback_type not in REVIEWABLE_FEEDBACK_TYPES:
        raise HTTPException(status_code=400, detail="feedback_type is not supported.")

    if db._stub_mode or db.app_client is None:
        return {
            "target_id": str(target_uuid),
            "course_id": str(course_uuid),
            "feedback_type": feedback_type,
            "persisted": False,
        }

    comment_payload = serialize_feedback_comment(comment, metadata)
    feedback_row = {
        "user_id": str(user_id),
        "course_id": str(course_uuid),
        "target_type": REVIEWABLE_TARGET_TYPE,
        "target_id": str(target_uuid),
        "feedback_type": feedback_type,
        "comment": comment_payload,
    }

    response = db.app_client.table("feedback_events").insert(feedback_row).execute()
    feedback_event = (response.data or [{}])[0]

    signal_payload = {
        "target_type": REVIEWABLE_TARGET_TYPE,
        "target_id": str(target_uuid),
        "feedback_type": feedback_type,
        "comment": (comment or "").strip(),
        "metadata": metadata or {},
        "feedback_event_id": feedback_event.get("id"),
        "recorded_at": datetime.now(UTC).isoformat(),
    }
    db.app_client.table("learning_signals").insert(
        {
            "student_id": str(user_id),
            "course_id": str(course_uuid),
            "signal_type": "feedback",
            "signal_value": signal_payload,
        }
    ).execute()

    return {
        "feedback_event_id": feedback_event.get("id"),
        "target_id": str(target_uuid),
        "course_id": str(course_uuid),
        "feedback_type": feedback_type,
        "persisted": True,
    }


def list_ai_response_review_items(db: Any, *, course_id: str) -> dict[str, Any]:
    course_uuid = _require_uuid(course_id, "course_id")
    empty_counts = {
        "all": 0,
        "pending": 0,
        "resolved": 0,
        "rejected": 0,
        "flagged": 0,
        "like": 0,
        "dislike": 0,
        "total_feedback": 0,
        "like_rate": 0,
        "dislike_rate": 0,
    }

    if db._stub_mode or db.app_client is None:
        return {
            "items": [],
            "counts": empty_counts,
        }

    feedback_rows = (
        db.app_client.table("feedback_events")
        .select("*")
        .eq("course_id", str(course_uuid))
        .order("created_at", desc=True)
        .execute()
    ).data or []

    reviewable_rows = [
        row
        for row in feedback_rows
        if row.get("target_type") == REVIEWABLE_TARGET_TYPE and row.get("feedback_type") in REVIEWABLE_FEEDBACK_TYPES
    ]

    if not reviewable_rows:
        return {
            "items": [],
            "counts": empty_counts,
        }

    user_ids = sorted({str(row.get("user_id")) for row in reviewable_rows if row.get("user_id")})
    user_lookup: dict[str, dict[str, Any]] = {}
    if user_ids:
        users = db.app_client.table("users").select("id,full_name,email").in_("id", user_ids).execute().data or []
        user_lookup = {str(user["id"]): user for user in users}

    review_rows = (
        db.app_client.table("learning_signals")
        .select("*")
        .eq("course_id", str(course_uuid))
        .eq("signal_type", "review")
        .order("created_at", desc=True)
        .execute()
    ).data or []

    latest_reviews: dict[str, dict[str, Any]] = {}
    for row in review_rows:
        signal_value = row.get("signal_value") or {}
        if not isinstance(signal_value, dict):
            continue
        target_id = str(signal_value.get("target_id") or "")
        if not target_id or target_id in latest_reviews:
            continue
        latest_reviews[target_id] = row

    grouped_rows: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in reviewable_rows:
        grouped_rows[str(row["target_id"])].append(row)

    items: list[dict[str, Any]] = []
    for target_id, rows in grouped_rows.items():
        latest_row = rows[0]
        parsed = parse_feedback_comment(latest_row.get("comment"))
        metadata = parsed.get("metadata") or {}
        reports: list[dict[str, Any]] = []
        feedback_counts: dict[str, int] = defaultdict(int)
        negative_count = 0

        for row in rows:
            row_parsed = parse_feedback_comment(row.get("comment"))
            row_metadata = row_parsed.get("metadata") or {}
            user_key = str(row.get("user_id") or "")
            feedback_type = str(row.get("feedback_type") or "")
            feedback_counts[feedback_type] += 1
            if feedback_type in NEGATIVE_FEEDBACK_TYPES:
                negative_count += 1
            reports.append(
                {
                    "id": str(row.get("id") or ""),
                    "feedback_type": feedback_type,
                    "sentiment": "dislike" if feedback_type in NEGATIVE_FEEDBACK_TYPES else "like",
                    "issue_type": row_metadata.get("issue_type"),
                    "issue_label": row_metadata.get("issue_label"),
                    "comment": row_parsed.get("comment") or "",
                    "student_id": user_key or None,
                    "student_name": user_lookup.get(user_key, {}).get("full_name")
                    or user_lookup.get(user_key, {}).get("email")
                    or "Học viên Mentora",
                    "created_at": row.get("created_at"),
                    "session_id": row_metadata.get("session_id"),
                }
            )

        review_row = latest_reviews.get(target_id)
        review_signal = review_row.get("signal_value") if review_row else {}
        if not isinstance(review_signal, dict):
            review_signal = {}
        review_status = str(review_signal.get("review_status") or "pending")
        if review_status not in REVIEW_STATUS_VALUES:
            review_status = "pending"

        latest_user_id = str(latest_row.get("user_id") or "")
        student_info = user_lookup.get(latest_user_id, {})

        items.append(
            {
                "id": target_id,
                "target_id": target_id,
                "course_id": str(course_uuid),
                "status": review_status,
                "sentiment": "dislike" if negative_count > 0 else "like",
                "feedback_counts": dict(feedback_counts),
                "report_count": len(rows),
                "latest_feedback_type": str(latest_row.get("feedback_type") or ""),
                "latest_issue_type": metadata.get("issue_type"),
                "latest_issue_label": metadata.get("issue_label"),
                "last_reported_at": latest_row.get("created_at"),
                "student_id": latest_user_id or None,
                "student_name": student_info.get("full_name") or student_info.get("email") or "Học viên Mentora",
                "prompt_text": metadata.get("prompt_text"),
                "response_text": metadata.get("response_text"),
                "citations": metadata.get("citations") if isinstance(metadata.get("citations"), list) else [],
                "confidence_score": metadata.get("confidence_score"),
                "session_id": metadata.get("session_id"),
                "mode": metadata.get("mode"),
                "review_note": review_signal.get("note"),
                "reports": reports,
            }
        )

    items.sort(key=lambda item: str(item.get("last_reported_at") or ""), reverse=True)

    counts = {
        "all": len(items),
        "pending": sum(1 for item in items if item["status"] == "pending"),
        "resolved": sum(1 for item in items if item["status"] == "resolved"),
        "rejected": sum(1 for item in items if item["status"] == "rejected"),
        "flagged": sum(1 for item in items if item["status"] == "flagged"),
    }
    like_total = sum(1 for row in reviewable_rows if row.get("feedback_type") == "helpful")
    dislike_total = sum(1 for row in reviewable_rows if row.get("feedback_type") in NEGATIVE_FEEDBACK_TYPES)
    total_feedback = like_total + dislike_total
    counts.update(
        {
            "like": like_total,
            "dislike": dislike_total,
            "total_feedback": total_feedback,
            "like_rate": round((like_total / total_feedback) * 100) if total_feedback else 0,
            "dislike_rate": round((dislike_total / total_feedback) * 100) if total_feedback else 0,
        }
    )

    return {"items": items, "counts": counts}


def review_ai_response_feedback(
    db: Any,
    *,
    course_id: str,
    target_id: str,
    reviewer_id: UUID,
    review_status: str,
    note: str | None = None,
) -> dict[str, Any]:
    course_uuid = _require_uuid(course_id, "course_id")
    target_uuid = _require_uuid(target_id, "target_id")

    if review_status not in REVIEW_STATUS_VALUES:
        raise HTTPException(status_code=400, detail="review_status is not supported.")

    if db._stub_mode or db.app_client is None:
        return {
            "target_id": str(target_uuid),
            "status": review_status,
            "note": (note or "").strip() or None,
        }

    feedback_rows = (
        db.app_client.table("feedback_events")
        .select("id")
        .eq("course_id", str(course_uuid))
        .eq("target_id", str(target_uuid))
        .eq("target_type", REVIEWABLE_TARGET_TYPE)
        .execute()
    ).data or []

    if not feedback_rows:
        raise HTTPException(status_code=404, detail="AI response review item not found.")

    signal_value = {
        "target_type": REVIEWABLE_TARGET_TYPE,
        "target_id": str(target_uuid),
        "review_status": review_status,
        "note": (note or "").strip(),
        "reviewed_by": str(reviewer_id),
        "reviewed_at": datetime.now(UTC).isoformat(),
    }
    db.app_client.table("learning_signals").insert(
        {
            "student_id": str(reviewer_id),
            "course_id": str(course_uuid),
            "signal_type": "review",
            "signal_value": signal_value,
        }
    ).execute()

    return {
        "target_id": str(target_uuid),
        "status": review_status,
        "note": signal_value["note"] or None,
    }
