from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class RecommendRequest(BaseModel):
    student_id: UUID = Field(..., description="ID học viên")
    course_id: UUID = Field(..., description="ID khóa học")
    concept_id: UUID = Field(..., description="ID Concept")
    excluded_question_ids: list[UUID] = Field(
        default_factory=list,
        description="Danh sách câu hỏi đã có trong phiên hiện tại, không gợi ý lại.",
    )
    set_id: str | None = Field(default=None, description="Mã bộ đề để giới hạn kho câu hỏi gợi ý")


class RecommendResponse(BaseModel):
    decision_id: UUID = Field(..., description="ID quyết định gợi ý câu hỏi")
    question_id: UUID = Field(..., description="ID câu hỏi được đề xuất")
    type: str = Field(..., description="Kiểu câu hỏi (mcq, short_answer, v.v.)")
    prompt: str = Field(..., description="Đề bài")
    options: dict[str, Any] = Field(default={}, description="Các lựa chọn trắc nghiệm")
    answer: str | None = Field(default=None, description="Đáp án đúng cho câu trắc nghiệm, lấy từ answer_key.correct")
    explanation: str | None = Field(default=None, description="Giải thích đáp án, lấy từ answer_key.explanation")
    expected_answer: str | None = Field(default=None, description="Đáp án tham chiếu cho câu tự luận ngắn")
    evaluation_points: list[str] = Field(default_factory=list, description="Các tiêu chí tự đánh giá cho câu tự luận")
    sfia_level: str | None = Field(default=None, description="Mức năng lực SFIA nếu có")
    competency: str | None = Field(default=None, description="Năng lực chính nếu có")
    hints: list[dict[str, str]] = Field(default_factory=list, description="Danh sách gợi ý Socratic theo thứ tự cấp độ")
    expected_success: float = Field(..., description="Xác suất học viên làm đúng câu hỏi này (ZPD)")
    expected_reward: float = Field(..., description="Phần thưởng dự báo của LinUCB")
    question_difficulty_elo: float | None = Field(
        default=None, description="Độ khó Elo của câu hỏi, chỉ dành cho admin/dev"
    )
    candidate_count: int | None = Field(
        default=None, description="Số câu hỏi ứng viên sau khi lọc, chỉ dành cho admin/dev"
    )
    concept_elo: float | None = Field(
        default=None, description="Elo của học viên trong concept hiện tại, chỉ dành cho admin/dev"
    )
    bkt_mastery_probability: float | None = Field(
        default=None,
        description="Xác suất làm chủ BKT trong concept hiện tại, chỉ dành cho admin/dev",
    )
    timings_ms: dict[str, float] | None = Field(
        default=None,
        description="Breakdown thời gian xử lý recommend, chỉ dành cho admin/dev",
    )


class SubmitRequest(BaseModel):
    student_id: UUID = Field(..., description="ID học viên")
    course_id: UUID = Field(..., description="ID khóa học")
    concept_id: UUID = Field(..., description="ID Concept")
    question_id: UUID = Field(..., description="ID câu hỏi")
    decision_id: UUID = Field(..., description="ID trace quyết định gợi ý câu hỏi")
    student_answer: dict[str, Any] = Field(..., description="Câu trả lời của học viên")
    hint_count: int = Field(default=0, ge=0, description="Số lượt dùng gợi ý")
    used_ai_help: bool = Field(default=False, description="Đánh dấu nếu dùng AI để gian lận/hỗ trợ")
    response_time_ms: int | None = Field(default=None, ge=0, description="Thời gian làm bài tính bằng mili giây")


class HintLogRequest(BaseModel):
    student_id: UUID = Field(..., description="ID học viên")
    course_id: UUID = Field(..., description="ID khóa học")
    question_id: UUID = Field(..., description="ID câu hỏi")
    decision_id: UUID = Field(..., description="ID trace quyết định gợi ý câu hỏi")
    hint_level: int = Field(..., ge=1, le=3, description="Cấp độ gợi ý đã mở")


class SubmitResponse(BaseModel):
    is_correct: bool = Field(..., description="Đúng hay Sai")
    actual_score: float = Field(..., description="Điểm thực tế")
    old_elo: float = Field(..., description="Elo học viên cũ")
    new_elo: float = Field(..., description="Elo học viên mới")
    old_bkt: float = Field(..., description="Xác suất BKT cũ")
    new_bkt: float = Field(..., description="Xác suất BKT mới")
    mastery_state: str = Field(..., description="Trạng thái làm chủ mới")
    weakness_flag: bool = Field(..., description="Đánh dấu điểm yếu")
    bandit_reward: float = Field(..., description="Phần thưởng của Bandit nhận được")
    stability_days: float | None = Field(default=None, description="Độ bền trí nhớ mới")
    calculation_log: dict[str, Any] | None = Field(
        default=None,
        description="Log công thức Elo dùng để giải thích thay đổi điểm cho học viên.",
    )


class ConceptRelationCreate(BaseModel):
    course_id: UUID
    source_concept_id: UUID
    target_concept_id: UUID
    relation_type: str
    weight: float = Field(default=1.0, ge=0.0)
    status: str = Field(default="draft")


class ConceptRelationUpdate(BaseModel):
    weight: float | None = Field(default=None, ge=0.0)
    status: str | None = Field(default=None)


class ConceptRelationResponse(BaseModel):
    id: UUID
    course_id: UUID
    source_concept_id: UUID
    target_concept_id: UUID
    relation_type: str
    weight: float
    status: str
