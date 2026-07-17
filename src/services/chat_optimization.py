from __future__ import annotations

import hashlib
import re
from typing import Any

from src.config import get_settings

DEFAULT_MATCH_COUNT = 2
DEFAULT_MATCH_THRESHOLD = 0.30
DEFAULT_SNIPPET_CHARS = 220


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip().lower())


def retrieval_cache_key(
    query: str,
    *,
    course_id: str | None = None,
    concept_id: str | None = None,
    mode: str | None = None,
    match_threshold: float = DEFAULT_MATCH_THRESHOLD,
    match_count: int = DEFAULT_MATCH_COUNT,
) -> str:
    normalized = normalize_text(query)
    digest = hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:16]
    course_part = course_id or "no-course"
    concept_part = concept_id or "no-concept"
    mode_part = (mode or "na").lower()
    return f"chat:rag:{course_part}:{concept_part}:{mode_part}:{match_threshold:.2f}:{match_count}:{digest}"


def shorten_text(text: str, max_chars: int = DEFAULT_SNIPPET_CHARS) -> str:
    cleaned = re.sub(r"\s+", " ", text.strip())
    if len(cleaned) <= max_chars:
        return cleaned
    return cleaned[: max_chars - 1].rstrip() + "…"


def build_compact_context(slides: list[dict[str, Any]], max_chars: int = DEFAULT_SNIPPET_CHARS) -> str:
    if not slides:
        return "Không tìm thấy học liệu liên quan chính thức trong hệ thống."

    context_parts: list[str] = []
    for idx, slide in enumerate(slides, 1):
        doc_name = str(slide.get("document_name", "Unknown"))
        if doc_name.lower().endswith(".md"):
            display_name = doc_name[:-3]
        elif doc_name.lower().endswith(".pdf"):
            display_name = doc_name[:-4]
        else:
            display_name = doc_name

        content = shorten_text(str(slide.get("content", "")), max_chars=max_chars)
        context_parts.append(f"- Tài liệu {idx}: {display_name} | Slide {slide.get('slide_number', '?')} | {content}")

    return "\n".join(context_parts)


def build_prompt_profile(profile: dict[str, Any], mode: str) -> dict[str, Any]:
    elo = profile.get("elo_score") or profile.get("elo") or 1200.0
    bkt = profile.get("bkt_mastery_probability") or profile.get("bkt") or 0.25
    weakness = profile.get("weakness_flag") or profile.get("weakness") or False
    active_quiz = profile.get("active_quiz_session") or profile.get("active_quiz") or False

    settings = get_settings()
    algorithm = settings.algorithm

    scaffolding_rules = ""
    if algorithm and algorithm.scaffolding_rules:
        for rule in algorithm.scaffolding_rules:
            if rule.min_elo <= elo <= rule.max_elo:
                scaffolding_rules = rule.instructions.strip()
                break

    if not scaffolding_rules:
        scaffolding_rules = (
            "- Học viên có trình độ trung bình. Sử dụng ngôn từ kỹ thuật chuẩn hóa trong bài giảng.\n"
            "- Đóng vai người gợi mở. Đưa ra các câu hỏi Socratic để học viên tự điền vào chỗ trống hoặc tìm ra giải pháp."
        )

    mode_instructions = ""
    if algorithm and algorithm.mode_instructions:
        mode_instructions = algorithm.mode_instructions.get(mode, "").strip()

    if not mode_instructions:
        if algorithm and algorithm.mode_instructions:
            mode_instructions = algorithm.mode_instructions.get("Explain", "").strip()
        else:
            mode_instructions = (
                "CHẾ ĐỘ: GIẢI THÍCH (Explain Mode)\n"
                "- Nhiệm vụ: Giải thích khái niệm học thuật một cách dễ hiểu, bám sát tài liệu giáo trình."
            )

    return {
        "elo": elo,
        "bkt": bkt,
        "weakness": weakness,
        "active_quiz": active_quiz,
        "scaffolding_rules": scaffolding_rules,
        "mode_instructions": mode_instructions,
    }


def build_system_prompt(context: str, profile: dict[str, Any], mode: str) -> str:
    settings = get_settings()
    if settings.prompts and settings.prompts.system_prompt:
        prompt_template = settings.prompts.system_prompt
    else:
        prompt_template = (
            "Bạn là một Gia sư AI cá nhân hóa (AI Tutor) xuất sắc tại Đại học VinUniversity.\n"
            "Nhiệm vụ của bạn là hỗ trợ sinh viên học tập theo phương pháp Socratic (Socratic ladder).\n\n"
            "[THÔNG TIN HỌC VIÊN HIỆN TẠI]\n"
            "- Trình độ năng lực (Elo): {student_elo:.1f}\n"
            "- Khả năng làm chủ kiến thức (BKT Mastery): {student_bkt:.2f}\n"
            "- Trạng thái yếu thế (Weakness Flag): {student_weakness}\n"
            "- Trạng thái kiểm tra (Active Quiz): {active_quiz_session}\n\n"
            "[QUY TẮC CÁ NHÂN HÓA THEO NĂNG LỰC (SCAFFOLDING RULES)]\n"
            "{scaffolding_rules}\n\n"
            "[CHẾ ĐỘ TƯƠNG TÁC HIỆN TẠI]\n"
            "{mode_instructions}\n\n"
            "[LUẬT AN TOÀN HỌC THUẬT (ACADEMIC INTEGRITY GUARDRAILS)]\n"
            "1. KHÔNG BAO GIỜ cung cấp lời giải trực tiếp...\n\n"
            "HỌC LIỆU THAM KHẢO CHÍNH THỨC:\n"
            "{context}"
        )

    prompt_profile = build_prompt_profile(profile, mode)
    system_prompt = prompt_template.format(
        context=context,
        student_elo=prompt_profile["elo"],
        student_bkt=prompt_profile["bkt"],
        student_weakness="Bị đánh giá yếu (true)" if prompt_profile["weakness"] else "Bình thường (false)",
        active_quiz_session="Đang trong bài kiểm tra (true)"
        if prompt_profile["active_quiz"]
        else "Không trong bài kiểm tra (false)",
        scaffolding_rules=prompt_profile["scaffolding_rules"],
        mode_instructions=prompt_profile["mode_instructions"],
    )

    # Nếu câu hỏi xã giao hoặc ngoài lề, bổ sung hướng dẫn ghi đè quy tắc trích dẫn
    intent = profile.get("intent") or "academic"
    if intent == "general":
        system_prompt += (
            "\n\n[CHẾ ĐỘ TRÒ CHUYỆN XÃ GIAO / NGOÀI LỀ (GENERAL CHAT MODE)]\n"
            "1. Sinh viên đang hỏi các câu hỏi xã giao, chào hỏi, hỏi thăm, hỏi về bản thân học sinh hoặc hỏi chức năng của bạn.\n"
            "2. Bạn KHÔNG cần tuân theo Quy tắc Trích dẫn & RAG Grounding. Bạn KHÔNG được trích dẫn slide nào và KHÔNG được tự bịa ra slide trích dẫn.\n"
            "3. Hãy trả lời thân thiện dựa trên kiến thức chung của bạn và dựa trên thông tin cá nhân của học sinh có sẵn trong prompt (như tên, sở thích, thế mạnh/thế yếu nếu có)."
        )

    return system_prompt


def split_formatted_prompt(formatted_prompt: str) -> tuple[str, str]:
    """Phân tách prompt hệ thống đã định dạng thành phần tĩnh (static) và động (dynamic) để tối ưu Prompt Caching."""
    profile_header = "[THÔNG TIN HỌC VIÊN HIỆN TẠI]"
    rules_header = "[LUẬT AN TOÀN HỌC THUẬT (ACADEMIC INTEGRITY GUARDRAILS)]"
    context_header = "HỌC LIỆU THAM KHẢO CHÍNH THỨC:"

    idx_profile = formatted_prompt.find(profile_header)
    idx_rules = formatted_prompt.find(rules_header)
    idx_context = formatted_prompt.find(context_header)

    if idx_profile != -1 and idx_rules != -1 and idx_context != -1:
        intro = formatted_prompt[:idx_profile].strip()
        dynamic_profile = formatted_prompt[idx_profile:idx_rules].strip()
        static_rules = formatted_prompt[idx_rules:idx_context].strip()
        dynamic_context = formatted_prompt[idx_context:].strip()

        static_prompt = intro + "\n\n" + static_rules
        dynamic_prompt = dynamic_profile + "\n\n" + dynamic_context
        return static_prompt, dynamic_prompt

    return formatted_prompt, ""
