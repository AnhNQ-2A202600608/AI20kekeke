from datetime import datetime
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
    critic_reasoning: str | None = Field(default=None, description="Giải thích/Nhận xét của Critic Agent")


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


class LearningPathHistoryItem(BaseModel):
    instance_id: UUID = Field(..., description="ID của phiên bản lộ trình")
    exam_attempt_id: UUID | None = Field(default=None, description="ID lượt thi gốc")
    trigger_type: str = Field(..., description="Loại trigger: midterm | final | mentor_manual")
    source: str = Field(..., description="Nguồn tạo: auto | mentor")
    status: str = Field(..., description="Trạng thái: active | archived | completed")
    milestone_count: int = Field(..., description="Số lượng milestone trong lộ trình")
    created_at: datetime = Field(..., description="Thời gian tạo")
