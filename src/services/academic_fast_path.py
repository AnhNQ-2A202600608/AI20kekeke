from __future__ import annotations

import os
import re
from typing import Any


def is_brief_definition_query(query: str) -> bool:
    normalized = query.strip().lower()
    return bool(
        re.search(
            r"\b(là gì|la gi|what is|what are|define|định nghĩa|dinh nghia|khái niệm|khai niem)\b",
            normalized,
        )
    )


def response_max_tokens(query: str) -> int:
    if is_brief_definition_query(query):
        return int(os.getenv("LLM_BRIEF_RESPONSE_MAX_TOKENS", "220"))
    return int(os.getenv("LLM_RESPONSE_MAX_TOKENS", "500"))


def _display_document_name(document_name: str) -> str:
    return re.sub(r"\.(pdf|md)$", "", document_name, flags=re.IGNORECASE)


def _clean_slide_text(content: str) -> str:
    cleaned = re.sub(r"\s+", " ", content).strip()
    cleaned = re.sub(r"([a-z])([A-Z])", r"\1 \2", cleaned)
    cleaned = re.sub(r"(?<=[.!?])(?=\S)", " ", cleaned)
    replacements = {
        "Kỹthuật": "Kỹ thuật",
        "thôngtin": "thông tin",
        "sinhngônngữ": "sinh ngôn ngữ",
        "ngữ(generation)": "ngữ (generation)",
        "đểLLM": "để LLM",
        "trảlời": "trả lời",
        "dựatrên": "dựa trên",
        "dữliệu": "dữ liệu",
        "dữliệu thực": "dữ liệu thực",
        "chỉdựa": "chỉ dựa",
        "bộnhớ": "bộ nhớ",
        "bộ nhớhuấn": "bộ nhớ huấn",
        "huấnluyện": "huấn luyện",
        "Truyxuất": "Truy xuất",
        "từkho": "từ kho",
        "ngoài": "ngoài",
        "Tìmtừ": "Tìm từ",
        "bằngchứng": "bằng chứng",
        "lọcnhiễu": "lọc nhiễu",
        "xếphạng": "xếp hạng",
        "Tăngcường": "Tăng cường",
    }
    for source, target in replacements.items():
        cleaned = cleaned.replace(source, target)
    return cleaned


def _definition_excerpt(content: str) -> str | None:
    cleaned = _clean_slide_text(content)
    cleaned = re.sub(r"^\d+(\.\d+)*\s+[^?]{0,80}\?\s*", "", cleaned)
    match = re.search(r"([A-Z][A-Z0-9-]{1,12})\s+[—-]\s+(.+?)(?:\.\s|$)", cleaned)
    if match:
        subject = match.group(1)
        definition = match.group(2).strip(" —-")
        return f"{subject} là {definition}."
    return None


def extractive_definition_response(
    query: str,
    slides: list[dict[str, Any]],
    *,
    min_similarity: float = 0.42,
) -> str | None:
    if not is_brief_definition_query(query) or not slides:
        return None

    top_slide = slides[0]
    if float(top_slide.get("similarity") or 0.0) < min_similarity:
        return None

    excerpt = _definition_excerpt(str(top_slide.get("content") or ""))
    if not excerpt or len(excerpt) < 40:
        return None

    document_name = _display_document_name(str(top_slide.get("document_name") or "Học liệu"))
    slide_number = top_slide.get("slide_number", "?")
    return (
        f"{excerpt} [{document_name}, Slide {slide_number}]\n\n"
        "Bạn muốn mình giải thích tiếp phần truy xuất, bổ sung ngữ cảnh, hay bước sinh câu trả lời?"
    )
