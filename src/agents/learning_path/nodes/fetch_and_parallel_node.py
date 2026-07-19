import asyncio
import logging

from src.agents.learning_path.nodes.llm_path_generator_node import llm_path_generator_node
from src.agents.learning_path.nodes.topo_sort_node import topo_sort_node
from src.agents.learning_path.state import LearningPathState
from src.api.adaptive_routes import get_adaptive_db

logger = logging.getLogger(__name__)


async def fetch_and_parallel_node(state: LearningPathState) -> dict:
    """Node đầu tiên của graph:
    1. Fetch quiz_attempts liên quan đến exam_attempt_id từ DB.
    2. Xác định các weak_concept_ids.
    3. Chạy song song topo_sort_node và llm_path_generator_node dùng asyncio.
    """
    timings = state.get("timings_ms") or {}
    import time

    start_time = time.perf_counter()

    student_id = state.get("student_id")
    course_id = state.get("course_id")
    exam_attempt_id = state.get("exam_attempt_id")

    if not student_id or not course_id or not exam_attempt_id:
        return {"error": "Missing student_id, course_id, or exam_attempt_id in input state"}

    try:
        db = get_adaptive_db()

        # 1. Fetch hoặc sinh dữ liệu mock nếu ở stub mode
        if db._stub_mode or db.app_client is None:
            logger.info("Database is in STUB mode. Generating mock quiz attempts.")
            # Tạo UUID mẫu đại diện cho concepts/questions của Toán 6
            dummy_concept_1 = "00000000-0000-0000-0000-999999999999"
            dummy_concept_2 = "00000000-0000-0000-0000-888888888888"

            quiz_attempts = [
                {
                    "question_id": "00000000-0000-0000-0000-111111111111",
                    "concept_id": dummy_concept_1,
                    "student_answer": {"selected_option": "B"},
                    "is_correct": False,
                    "actual_score": 0.0,
                },
                {
                    "question_id": "00000000-0000-0000-0000-222222222222",
                    "concept_id": dummy_concept_2,
                    "student_answer": {"selected_option": "C"},
                    "is_correct": False,
                    "actual_score": 0.0,
                },
            ]
            weak_concept_ids = [dummy_concept_1, dummy_concept_2]
        else:
            # Query thực tế từ Supabase
            attempts_resp = (
                db.app_client.table("quiz_attempts")
                .select("question_id, concept_id, student_answer, is_correct, actual_score")
                .eq("exam_attempt_id", str(exam_attempt_id))
                .eq("student_id", str(student_id))
                .execute()
            )
            quiz_attempts = attempts_resp.data or []

            # Lọc các concept_id có câu trả lời sai (is_correct == False hoặc actual_score < 1.0)
            weak_concepts_set = set()
            for att in quiz_attempts:
                if not att.get("is_correct", True) or att.get("actual_score", 1.0) < 1.0:
                    weak_concepts_set.add(str(att["concept_id"]))
            weak_concept_ids = list(weak_concepts_set)

        # 2. Cập nhật state nội bộ để truyền vào các node tiếp theo
        state["quiz_attempts"] = quiz_attempts
        state["weak_concept_ids"] = weak_concept_ids

        # 3. Kích hoạt xử lý song song
        # llm_path_generator_node là async -> chạy dưới dạng asyncio Task
        llm_task = asyncio.create_task(llm_path_generator_node(state))

        # topo_sort_node là sync -> chạy trực tiếp trên main thread (rất nhanh vì là thuần thuật toán)
        topo_result = topo_sort_node(state)

        # Chờ kết quả LLM Analysis hoàn thành
        llm_result = await llm_task

        # Hợp nhất timings
        elapsed_ms = (time.perf_counter() - start_time) * 1000
        timings["fetch_and_parallel_node"] = elapsed_ms

        # Gộp timings từ các node con
        if "timings_ms" in topo_result:
            timings.update(topo_result["timings_ms"])
        if "timings_ms" in llm_result:
            timings.update(llm_result["timings_ms"])

        return {
            "quiz_attempts": quiz_attempts,
            "weak_concept_ids": weak_concept_ids,
            "topo_sorted_concepts": topo_result.get("topo_sorted_concepts", []),
            "llm_analysis": llm_result.get("llm_analysis", {}),
            "timings_ms": timings,
        }

    except Exception as e:
        logger.error(f"Error in fetch_and_parallel_node: {e}", exc_info=True)
        return {
            "error": f"Internal error in fetch_and_parallel_node: {str(e)}",
            "quiz_attempts": [],
            "weak_concept_ids": [],
            "topo_sorted_concepts": [],
            "llm_analysis": {},
        }
