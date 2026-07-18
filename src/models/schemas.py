from typing import Any

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    schema_version: str | None = Field(default=None, alias="schemaVersion", description="Phiên bản contract chat")
    message: str = Field(..., min_length=1, max_length=5000, description="Tin nhắn từ user")
    student_id: str | None = Field(default=None, description="ID của học sinh")
    course_id: str | None = Field(default=None, description="ID của khóa học")
    concept_id: str | None = Field(default=None, description="ID của concept đang hỏi")
    mode: str = Field(default="Explain", description="Chế độ học tập")
    stream: bool = Field(default=False, description="Bật stream SSE cho phản hồi")
    session_id: str | None = Field(default=None, description="ID của phiên chat hiện tại")


class ChatResponse(BaseModel):
    response: str = Field(..., description="Phản hồi từ agent")
    analysis: str = Field(default="", description="Phân tích nội bộ")
    metadata: dict[str, Any] | None = Field(default=None, description="Metadata kèm theo (RAG, validation, etc.)")
    session_id: str | None = Field(default=None, description="ID của phiên chat hiện tại")
