def mastery_cache_key(student_id: str, course_id: str, concept_id: str) -> str:
    return f"student:{student_id}:course:{course_id}:concept:{concept_id}:mastery"


def retrieval_cache_key(
    query_hash: str,
    *,
    course_id: str | None = None,
    concept_id: str | None = None,
    mode: str | None = None,
    match_threshold: float = 0.15,
    match_count: int = 2,
) -> str:
    course_part = course_id or "no-course"
    concept_part = concept_id or "no-concept"
    mode_part = (mode or "na").lower()
    return f"chat:rag:v3:{course_part}:{concept_part}:{mode_part}:{match_threshold:.2f}:{match_count}:{query_hash}"
