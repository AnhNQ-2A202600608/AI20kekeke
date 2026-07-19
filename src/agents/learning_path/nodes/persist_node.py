import logging
from uuid import UUID

from src.agents.learning_path.state import LearningPathState
from src.api.adaptive_routes import get_adaptive_db
from src.services.learning_path.learning_path_repository import LearningPathRepository

logger = logging.getLogger(__name__)


async def persist_node(state: LearningPathState) -> dict:
    """Node thực hiện ghi lộ trình học tập hoàn chỉnh vào Database."""
    timings = state.get("timings_ms") or {}
    import time

    start_time = time.perf_counter()

    student_id = state.get("student_id")
    course_id = state.get("course_id")
    exam_attempt_id = state.get("exam_attempt_id")
    draft_milestones = state.get("draft_milestones") or []

    if not student_id or not course_id:
        return {"error": "Missing student_id or course_id during persistence"}

    try:
        db = get_adaptive_db()

        # 1. Xác định trigger_type (midterm vs final) từ exam_set
        trigger_type = "midterm"
        if not db._stub_mode and db.app_client is not None and exam_attempt_id:
            try:
                # Query lấy exam_set_id từ attempt
                attempt_resp = (
                    db.app_client.table("exam_attempts")
                    .select("exam_set_id")
                    .eq("id", str(exam_attempt_id))
                    .maybe_single()
                    .execute()
                )
                if attempt_resp.data:
                    exam_set_id = attempt_resp.data.get("exam_set_id")
                    # Query lấy exam_type từ exam_set
                    set_resp = (
                        db.app_client.table("exam_sets")
                        .select("exam_type")
                        .eq("id", str(exam_set_id))
                        .maybe_single()
                        .execute()
                    )
                    if set_resp.data:
                        exam_type = set_resp.data.get("exam_type", "midterm")
                        if exam_type in ("midterm", "final"):
                            trigger_type = exam_type
            except Exception as ex_err:
                logger.warning(f"Failed to detect exam type for attempt {exam_attempt_id}: {ex_err}")

        # 2. Đóng gói path_data
        path_data = {"milestones": draft_milestones}

        # 3. Tạo instance mới trong database
        created = LearningPathRepository.create_instance(
            student_id=UUID(student_id),
            course_id=UUID(course_id),
            source="auto",
            trigger_type=trigger_type,
            path_data=path_data,
            exam_attempt_id=UUID(exam_attempt_id) if exam_attempt_id else None,
        )

        if not created:
            return {"error": "Failed to create learning path instance in database"}

        elapsed_ms = (time.perf_counter() - start_time) * 1000
        timings["persist_node"] = elapsed_ms

        return {"path_instance_id": str(created["id"]), "path_data": path_data, "timings_ms": timings}

    except Exception as e:
        logger.error(f"Error in persist_node: {e}", exc_info=True)
        return {"error": f"Internal error in persist_node: {str(e)}"}
