from __future__ import annotations

from pydantic import BaseModel, Field


class DocumentInfo(BaseModel):
    document_id: str = Field(description="Mã định danh duy nhất của tài liệu/sách, vd: 'math-k6-sgk'")
    source_type: str = Field(description="Loại tài liệu, bắt buộc là: SGK hoặc SGV")
    subject: str = Field(description="Môn học, vd: 'math' hoặc 'history_geo'")
    grade: int = Field(description="Lớp học, vd: 6")
    chapter: str = Field(description="Tên chương, vd: 'Chương 1'")
    lesson: str = Field(description="Tên bài học, vd: 'Bài 1'")

class LearningObjective(BaseModel):
    code: str = Field(description="Mã mục tiêu học tập kebab-case, vd: 'nhan-biet-so-nguyen'")
    description: str = Field(description="Mô tả mục tiêu học tập chi tiết")
    source_chunk_id: str = Field(description="ID chunk chứa bằng chứng cho mục tiêu này")
    evidence: str = Field(description="Trích dẫn bằng chứng cụ thể làm cơ sở")

class ConceptCandidate(BaseModel):
    temporary_id: str = Field(description="ID tạm thời dùng để tham chiếu trong file bài học này, vd: 'c1'")
    suggested_code: str = Field(description="Mã concept đề xuất dạng kebab-case, vd: 'phep-cong-hai-so-nguyen'")
    name: str = Field(description="Tên concept/kỹ năng cụ thể bằng tiếng Việt, đúng thuật ngữ sách")
    description: str = Field(description="Mô tả chi tiết định nghĩa của concept/kỹ năng")
    concept_type: str = Field(description="Bắt buộc là 1 trong: 'knowledge', 'skill', 'subskill', 'misconception'")
    aliases: list[str] = Field(default_factory=list, description="Các tên gọi khác hoặc biến thể cùng nghĩa")
    grade: int = Field(default=6, description="Lớp học giới thiệu concept này")
    source_chunk_ids: list[str] = Field(default_factory=list, description="Danh sách các chunk ID chứa concept này")
    evidence: list[str] = Field(default_factory=list, description="Trích dẫn văn bản làm bằng chứng cho sự tồn tại của concept")

class RelationCandidate(BaseModel):
    source: str = Field(description="temporary_id của concept nguồn")
    relation_type: str = Field(description="Loại quan hệ, bắt buộc thuộc: 'prerequisite_of', 'causes', 'part_of', 'is_a', 'used_for', 'compared_with', 'related_to', 'has_misconception', 'addresses_misconception'")
    target: str = Field(description="temporary_id của concept đích")
    source_chunk_id: str = Field(description="ID chunk chứa bằng chứng cho quan hệ này")
    evidence: str = Field(description="Trích dẫn bằng chứng làm cơ sở chứng minh quan hệ")
    confidence: float = Field(default=1.0, description="Độ tin cậy của quan hệ (0.0 đến 1.0)")

class MisconceptionCandidate(BaseModel):
    temporary_id: str = Field(description="ID tạm thời của misconception, vd: 'm1'")
    name: str = Field(description="Tên lỗi hiểu sai/lầm tưởng thường gặp của học sinh")
    description: str = Field(description="Mô tả chi tiết biểu hiện hoặc nguyên nhân lỗi sai")
    related_skill: str = Field(description="temporary_id của skill/concept liên quan mà lỗi này thường phát sinh")
    source_chunk_id: str = Field(description="ID chunk chứa bằng chứng của lỗi này")
    evidence: str = Field(description="Đoạn trích dẫn nói về lỗi sai hoặc bài tập minh họa lỗi")

class LessonExtraction(BaseModel):
    document: DocumentInfo
    learning_objectives: list[LearningObjective] = Field(default_factory=list)
    concepts: list[ConceptCandidate] = Field(default_factory=list)
    relations: list[RelationCandidate] = Field(default_factory=list)
    misconceptions: list[MisconceptionCandidate] = Field(default_factory=list)
