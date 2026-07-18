from __future__ import annotations

from typing import TypedDict


class AgentState(TypedDict, total=False):
    """State schema cho LangGraph agent.

    Mỗi node đọc và ghi vào state này.
    total=False cho phép tất cả fields là optional.
    """

    query: str
    context: str
    analysis: str
    response: str
    error: str
    metadata: dict
    timings_ms: dict
    student_profile: dict  # Chứa elo_score, bkt_mastery_probability, weakness_flag
    mode: str  # Chế độ tương tác (Explain, Step-by-step hint, v.v.)
    chat_history: list[dict]
    long_term_facts: dict
    session_id: str
    reflection_attempts: int
    reflection_feedback: str
    interactive_widget: dict  # Chứa cấu trúc JSON của widget tương tác (MCQ, Blank, Code)
    student_submission: dict  # Câu trả lời của học viên nộp lên cho widget
    concept_id: str
    course_id: str
