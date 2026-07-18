from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class ExamSetSummary(BaseModel):
    id: UUID = Field(..., description="ID bộ đề thi")
    code: str = Field(..., description="Mã bộ đề thi (e.g. midterm-common)")
    title: str = Field(..., description="Tiêu đề bộ đề thi")
    description: str | None = Field(default=None, description="Mô tả bộ đề thi")
    exam_type: str = Field(..., description="Loại đề (midterm, final, diagnostic, mock)")
    difficulty: str = Field(..., description="Độ khó (dễ, bình thường, khó)")
    duration_minutes: int = Field(..., description="Thời gian làm bài (phút)")
    max_score: float = Field(..., description="Điểm tối đa của đề thi")
    question_count: int = Field(..., description="Số lượng câu hỏi trong đề thi")


class ExamQuestionItem(BaseModel):
    id: UUID = Field(..., description="ID câu hỏi")
    sort_order: int = Field(..., description="Thứ tự câu hỏi trong đề")
    weight: float = Field(..., description="Trọng số điểm của câu hỏi")
    prompt: str = Field(..., description="Đề bài câu hỏi")
    options: dict[str, Any] = Field(default={}, description="Các lựa chọn trắc nghiệm")


class ExamDetailsResponse(BaseModel):
    exam: ExamSetSummary = Field(..., description="Thông tin tổng quan bộ đề")
    questions: list[ExamQuestionItem] = Field(..., description="Danh sách câu hỏi MCQ (không có đáp án)")


class ExamStartResponse(BaseModel):
    attempt_id: UUID = Field(..., description="ID lượt thi")
    exam_set_id: UUID = Field(..., description="ID bộ đề")
    started_at: datetime = Field(..., description="Thời điểm bắt đầu làm bài")
    expires_at: datetime | None = Field(default=None, description="Thời điểm hết hạn làm bài")


class QuestionAnswer(BaseModel):
    question_id: UUID = Field(..., description="ID câu hỏi")
    selected_option: str = Field(..., description="Lựa chọn đã chọn (A, B, C, D)")


class ExamSubmitRequest(BaseModel):
    answers: list[QuestionAnswer] = Field(..., description="Danh sách câu trả lời của học sinh")


class ConceptGapItem(BaseModel):
    concept_id: UUID = Field(..., description="ID Concept")
    concept_name: str = Field(..., description="Tên Concept")
    bkt_before: float = Field(..., description="Xác suất BKT trước khi cập nhật")
    bkt_after: float = Field(..., description="Xác suất BKT sau khi cập nhật")
    mastery_state: str = Field(..., description="Trạng thái làm chủ mới")


class ExamResultResponse(BaseModel):
    attempt_id: UUID = Field(..., description="ID lượt thi")
    final_score: float = Field(..., description="Điểm số đạt được sau quy đổi")
    max_score: float = Field(..., description="Điểm số tối đa")
    correct_count: int = Field(..., description="Số câu làm đúng")
    total_count: int = Field(..., description="Tổng số câu")
    accuracy_pct: float = Field(..., description="Tỷ lệ chính xác (%)")
    weak_concepts: list[ConceptGapItem] = Field(default_factory=list, description="Các khái niệm học sinh bị yếu/hổng")
    submitted_at: datetime = Field(..., description="Thời điểm nộp bài")
