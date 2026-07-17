from fastapi import APIRouter, Depends, Query

from src.api import adaptive_routes
from src.services.quiz_review import (
    QuizReviewContentUpdate,
    QuizReviewStatusUpdate,
    get_review_question,
    list_review_questions,
    update_review_question_content,
    update_review_question_status,
)

router = APIRouter(prefix="/quiz/review", tags=["Quiz Review & HITL"])


@router.get("")
def list_questions(
    status: str | None = None,
    source_document: str | None = None,
    concept_code: str | None = None,
    search: str | None = None,
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
    _user: adaptive_routes.AuthenticatedUser = Depends(adaptive_routes.require_role(["mentor", "admin", "dev"])),
    db=Depends(adaptive_routes.get_adaptive_db),
):
    return list_review_questions(
        db,
        status=status,
        source_document=source_document,
        concept_code=concept_code,
        search=search,
        limit=limit,
        offset=offset,
    )


@router.get("/{question_id}")
def get_question_detail(
    question_id: str,
    _user: adaptive_routes.AuthenticatedUser = Depends(adaptive_routes.require_role(["mentor", "admin", "dev"])),
    db=Depends(adaptive_routes.get_adaptive_db),
):
    return get_review_question(db, question_id)


@router.patch("/{question_id}")
def update_question(
    question_id: str,
    payload: QuizReviewContentUpdate,
    user: adaptive_routes.AuthenticatedUser = Depends(adaptive_routes.require_role(["mentor", "admin", "dev"])),
    db=Depends(adaptive_routes.get_adaptive_db),
):
    return update_review_question_content(db, question_id, payload, user)


@router.patch("/{question_id}/status")
def update_status(
    question_id: str,
    payload: QuizReviewStatusUpdate,
    user: adaptive_routes.AuthenticatedUser = Depends(adaptive_routes.require_role(["mentor", "admin", "dev"])),
    db=Depends(adaptive_routes.get_adaptive_db),
):
    return update_review_question_status(db, question_id, payload.status, payload.rejection_reason, user)
