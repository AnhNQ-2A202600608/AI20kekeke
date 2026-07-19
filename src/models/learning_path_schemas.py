from uuid import UUID

from pydantic import BaseModel, Field


class GeneratePathRequest(BaseModel):
    student_id: UUID = Field(..., description="ID học viên")
    course_id: UUID = Field(..., description="ID khóa học")
    exam_attempt_id: UUID = Field(..., description="ID lượt thi đã nộp")


class MilestoneTask(BaseModel):
    type: str = Field(..., description="Loại nhiệm vụ: theory | video | slide | practice")
    content_id: UUID | None = Field(default=None, description="ID nội dung (nếu có)")
    difficulty: str | None = Field(default=None, description="Độ khó: quick | deep (nếu có)")


class Milestone(BaseModel):
    id: str = Field(..., description="Mã định danh milestone (concept_id)")
    concept_id: UUID = Field(..., description="ID Concept")
    concept_name: str = Field(..., description="Tên Concept")
    status: str = Field(..., description="Trạng thái: locked | unlocked | completed")
    error_type: str | None = Field(default=None, description="Loại lỗi sai: careless | conceptual | None")
    prerequisites: list[str] = Field(default_factory=list, description="Danh sách milestone_id tiên quyết")
    tasks: list[MilestoneTask] = Field(default_factory=list, description="Danh sách các tasks cần hoàn thành")


class PathData(BaseModel):
    milestones: list[Milestone] = Field(default_factory=list, description="Danh sách các milestone trong đồ thị")


class GeneratePathResponse(BaseModel):
    instance_id: UUID = Field(..., description="ID của phiên bản lộ trình vừa tạo")
    path_data: PathData = Field(..., description="DAG lộ trình học tập")
    processing_time_ms: float = Field(..., description="Thời gian xử lý tính bằng mili giây")


class MentorAssignRequest(BaseModel):
    student_id: UUID = Field(..., description="ID học viên")
    course_id: UUID = Field(..., description="ID khóa học")
    path_data: PathData = Field(..., description="DAG lộ trình tùy chỉnh do Mentor giao")


class UpdateMilestoneStatusRequest(BaseModel):
    status: str = Field(..., description="Trạng thái mới của milestone: locked | unlocked | completed")
