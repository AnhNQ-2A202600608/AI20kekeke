from fastapi import APIRouter, Depends, Query

from src.api import adaptive_routes
from src.services.quiz_error_cases import (
    QuizErrorQuestionUpdate,
    QuizErrorStatusUpdate,
    get_quiz_error_case_detail,
    list_quiz_error_cases,
    transition_quiz_error_case,
    update_quiz_error_question,
)

router = APIRouter(prefix="/quiz/error-cases", tags=["Quiz Error Cases"])


@router.get("")
def list_cases(
    status: str | None = None,
    course_id: str | None = None,
    search: str | None = None,
    error_type: str | None = None,
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
    _user: adaptive_routes.AuthenticatedUser = Depends(adaptive_routes.require_role(["mentor", "admin", "dev"])),
    db=Depends(adaptive_routes.get_adaptive_db),
):
    return list_quiz_error_cases(
        db,
        status=status,
        course_id=course_id,
        search=search,
        error_type=error_type,
        limit=limit,
        offset=offset,
    )


@router.get("/{case_id}")
def get_case_detail(
    case_id: str,
    _user: adaptive_routes.AuthenticatedUser = Depends(adaptive_routes.require_role(["mentor", "admin", "dev"])),
    db=Depends(adaptive_routes.get_adaptive_db),
):
    return get_quiz_error_case_detail(db, case_id)


@router.patch("/{case_id}/status")
def update_case_status(
    case_id: str,
    payload: QuizErrorStatusUpdate,
    user: adaptive_routes.AuthenticatedUser = Depends(adaptive_routes.require_role(["mentor", "admin", "dev"])),
    db=Depends(adaptive_routes.get_adaptive_db),
):
    return transition_quiz_error_case(db, case_id, payload, user)


@router.patch("/{case_id}/question")
def update_case_question(
    case_id: str,
    payload: QuizErrorQuestionUpdate,
    user: adaptive_routes.AuthenticatedUser = Depends(adaptive_routes.require_role(["mentor", "admin", "dev"])),
    db=Depends(adaptive_routes.get_adaptive_db),
):
    return update_quiz_error_question(db, case_id, payload, user)
