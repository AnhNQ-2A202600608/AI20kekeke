# ruff: noqa: E402
from __future__ import annotations

import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from src.pipeline.graphusion.document_chunker import DocumentChunk
from src.pipeline.graphusion.extractor import GroqKnowledgeExtractor, OpenAIKnowledgeExtractor
from src.pipeline.graphusion.schemas import LessonExtraction


def extract_lesson_knowledge(
    chunks: list[DocumentChunk],
    source_type: str,
    model: str,
    api_key: str,
    base_url: str | None = None
) -> LessonExtraction:
    """
    Trích xuất concept/relation cho một bài học (gồm danh sách chunks) bằng OpenAI hoặc Groq extractor.
    """
    if "groq" in model.lower() or (base_url and "groq" in base_url.lower()):
        extractor = GroqKnowledgeExtractor()
    else:
        extractor = OpenAIKnowledgeExtractor()

    return extractor.extract(
        chunks=chunks,
        subject="math",
        source_type=source_type,
        model=model,
        api_key=api_key,
        base_url=base_url
    )

def validate_and_clean(knowledge: LessonExtraction) -> LessonExtraction:
    """
    Loại bỏ các quan hệ tự liên kết hoặc tham chiếu sai concept.
    """
    concept_ids = {c.temporary_id for c in knowledge.concepts}
    clean_relations = []
    for r in knowledge.relations:
        if r.source not in concept_ids or r.target not in concept_ids:
            print(f"  [!] Bỏ qua relation tham chiếu concept ID không tồn tại: {r.source} -> {r.target}")
            continue
        if r.source == r.target:
            print(f"  [!] Bỏ qua self-relation: {r.source}")
            continue
        clean_relations.append(r)
    knowledge.relations = clean_relations
    return knowledge
