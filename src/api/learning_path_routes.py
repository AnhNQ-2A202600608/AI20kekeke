import logging
import time
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from src.agents.learning_path.graph import learning_path_agent
from src.api.adaptive_routes import (
    AuthenticatedUser,
    get_adaptive_db,
    get_current_user,
    require_teacher,
)
from src.models.learning_path_schemas import (
    GeneratePathRequest,
    GeneratePathResponse,
    MentorAssignRequest,
    UpdateMilestoneStatusRequest,
)
from src.services.adaptive.database_interface import AdaptiveDatabaseInterface
from src.services.learning_path.learning_path_repository import LearningPathRepository

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/learning-path", tags=["Learning Path Generator"])


@router.post("/generate", response_model=GeneratePathResponse)
async def generate_learning_path(
    request: GeneratePathRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AdaptiveDatabaseInterface = Depends(get_adaptive_db),
):
    """Trigger sinh lộ trình học tập thích ứng cá nhân hóa cho học viên sau khi nộp bài thi."""
    # Quyền: Chỉ sinh cho chính mình (nếu là student), hoặc mentor/admin được sinh cho học viên
    if current_user.role == "student" and current_user.id != request.student_id:
        raise HTTPException(
            status_code=403,
            detail="Bạn không có quyền yêu cầu sinh lộ trình cho tài khoản học viên khác.",
        )

    start_time = time.perf_counter()

    try:
        # 1. Khởi tạo state ban đầu cho LangGraph
        initial_state = {
            "student_id": str(request.student_id),
            "course_id": str(request.course_id),
            "exam_attempt_id": str(request.exam_attempt_id),
            "timings_ms": {},
        }

        # 2. Thực thi multi-agent LangGraph pipeline
        result = await learning_path_agent.ainvoke(initial_state)

        if "error" in result and result["error"]:
            raise HTTPException(status_code=500, detail=result["error"])

        path_instance_id = result.get("path_instance_id")
        path_data = result.get("path_data")

        if not path_instance_id or not path_data:
            raise HTTPException(
                status_code=500,
                detail="Không thể tạo lộ trình học tập thích ứng. Hãy kiểm tra lại lượt thi.",
            )

        processing_time_ms = (time.perf_counter() - start_time) * 1000

        return GeneratePathResponse(
            instance_id=UUID(path_instance_id),
            path_data=path_data,
            processing_time_ms=round(processing_time_ms, 2),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Lỗi trong quá trình sinh lộ trình học tập: %s", e)
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@router.get("/{student_id}")
async def list_learning_paths(
    student_id: UUID,
    course_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AdaptiveDatabaseInterface = Depends(get_adaptive_db),
):
    """Lấy danh sách các lộ trình học tập của một học viên."""
    # Quyền: Chỉ học viên đó hoặc Giáo viên của khóa học mới được xem
    if current_user.role == "student" and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Bạn không thể xem lộ trình của học viên khác.")

    if current_user.role not in ("mentor", "admin", "dev", "student"):
        raise HTTPException(status_code=403, detail="Không có quyền truy cập.")

    # Nếu là mentor, xác nhận mentor thuộc khóa học này
    if current_user.role == "mentor" and not db._stub_mode and db.app_client is not None:
        member_resp = (
            db.app_client.table("course_members")
            .select("role_code")
            .eq("course_id", str(course_id))
            .eq("user_id", str(current_user.id))
            .execute()
        )
        if not member_resp.data:
            raise HTTPException(status_code=403, detail="Bạn không phải mentor của khóa học này.")

    return LearningPathRepository.get_instances_by_student(student_id, course_id)


@router.get("/instance/{id}")
async def get_learning_path_details(
    id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AdaptiveDatabaseInterface = Depends(get_adaptive_db),
):
    """Lấy chi tiết một phiên bản lộ trình học tập."""
    instance = LearningPathRepository.get_instance_by_id(id)
    if not instance:
        raise HTTPException(status_code=404, detail="Không tìm thấy lộ trình học tập yêu cầu.")

    # Quyền: Học viên sở hữu lộ trình, hoặc mentor của khóa học
    student_id = UUID(instance["student_id"])
    course_id = UUID(instance["course_id"])

    if current_user.role == "student" and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Bạn không thể xem lộ trình của học viên khác.")

    # Nếu là mentor, xác nhận mentor thuộc khóa học này
    if current_user.role == "mentor" and not db._stub_mode and db.app_client is not None:
        member_resp = (
            db.app_client.table("course_members")
            .select("role_code")
            .eq("course_id", str(course_id))
            .eq("user_id", str(current_user.id))
            .execute()
        )
        if not member_resp.data:
            raise HTTPException(status_code=403, detail="Bạn không phải mentor của khóa học này.")

    return instance


@router.patch("/instance/{id}/milestone/{mid}")
async def update_milestone_status(
    id: UUID,
    mid: str,
    request: UpdateMilestoneStatusRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AdaptiveDatabaseInterface = Depends(get_adaptive_db),
):
    """Cập nhật trạng thái của một Milestone trong lộ trình học tập."""
    instance = LearningPathRepository.get_instance_by_id(id)
    if not instance:
        raise HTTPException(status_code=404, detail="Không tìm thấy lộ trình học tập.")

    student_id = UUID(instance["student_id"])
    course_id = UUID(instance["course_id"])

    # Quyền: Chỉ học viên sở hữu hoặc Giáo viên có quyền cập nhật trạng thái milestone
    if current_user.role == "student" and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Bạn không thể cập nhật lộ trình của học viên khác.")

    if current_user.role == "mentor" and not db._stub_mode and db.app_client is not None:
        member_resp = (
            db.app_client.table("course_members")
            .select("role_code")
            .eq("course_id", str(course_id))
            .eq("user_id", str(current_user.id))
            .execute()
        )
        if not member_resp.data:
            raise HTTPException(status_code=403, detail="Bạn không phải mentor của khóa học này.")

    updated = LearningPathRepository.update_milestone_status(id, mid, request.status)
    if not updated:
        raise HTTPException(
            status_code=400,
            detail="Cập nhật trạng thái milestone thất bại. Vui lòng kiểm tra lại milestone_id.",
        )

    return updated


@router.post("/mentor/assign")
async def mentor_assign_learning_path(
    request: MentorAssignRequest,
    mentor_id: UUID = Depends(require_teacher),
    db: AdaptiveDatabaseInterface = Depends(get_adaptive_db),
):
    """Giáo viên (Mentor) tạo và giao lộ trình học tập tùy chỉnh trực tiếp đến học viên."""
    # Xác nhận mentor thuộc khóa học này
    if not db._stub_mode and db.app_client is not None:
        member_resp = (
            db.app_client.table("course_members")
            .select("role_code")
            .eq("course_id", str(request.course_id))
            .eq("user_id", str(mentor_id))
            .execute()
        )
        if not member_resp.data:
            raise HTTPException(
                status_code=403,
                detail="Bạn không phải mentor của khóa học này để giao lộ trình.",
            )

    created = LearningPathRepository.create_instance(
        student_id=request.student_id,
        course_id=request.course_id,
        source="mentor",
        trigger_type="mentor_manual",
        path_data=request.path_data.model_dump(),
        mentor_id=mentor_id,
    )

    if not created:
        raise HTTPException(status_code=500, detail="Không thể tạo lộ trình học tập tùy chỉnh.")

    return created
