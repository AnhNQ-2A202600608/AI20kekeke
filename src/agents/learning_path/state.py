from __future__ import annotations

from typing import TypedDict


class LearningPathState(TypedDict, total=False):
    """State schema cho LangGraph Learning Path Agent.

    Mỗi node đọc và ghi vào state này.
    total=False cho phép các fields là optional.
    """

    # Input
    student_id: str
    course_id: str
    exam_attempt_id: str

    # Fetched data (lấy từ database dựa trên exam_attempt_id)
    quiz_attempts: list[dict]
    weak_concept_ids: list[str]

    # Parallel node outputs
    llm_analysis: dict  # {concept_id: {"error_type": "careless" | "conceptual", "reason": str}}
    topo_sorted_concepts: list[str]  # list concept_id sắp xếp topo từ graph

    # Critic node output
    draft_milestones: list[dict]  # list milestones thô trước khi persist
    critic_reasoning: str  # nhận xét giải thích của Critic Agent

    # Final output
    path_instance_id: str
    path_data: dict  # JSONB hoàn chỉnh để lưu DB

    # Error handling & metadata
    error: str
    timings_ms: dict
