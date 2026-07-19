import json
import logging
from uuid import UUID

from src.agents.learning_path.state import LearningPathState
from src.api.adaptive_routes import get_adaptive_db, normalize_answer_key
from src.services.llm import get_llm

logger = logging.getLogger(__name__)


def clean_json_response(content: str) -> str:
    """Helper to remove markdown code blocks from LLM responses if present."""
    content = content.strip()
    if content.startswith("```json"):
        content = content[7:]
    elif content.startswith("```"):
        content = content[3:]
    if content.endswith("```"):
        content = content[:-3]
    return content.strip()


async def llm_path_generator_node(state: LearningPathState) -> dict:
    """LLM Agent phân tích định tính lỗi làm bài (bất cẩn vs hổng kiến thức) của học sinh."""
    timings = state.get("timings_ms") or {}
    import time

    start_time = time.perf_counter()

    student_id = state.get("student_id")
    course_id = state.get("course_id")
    quiz_attempts = state.get("quiz_attempts") or []
    weak_concept_ids = state.get("weak_concept_ids") or []

    if not student_id or not course_id:
        return {"error": "Missing student_id or course_id", "llm_analysis": {}}

    # Lọc ra các câu làm sai (is_correct == False hoặc actual_score < 1.0)
    incorrect_attempts = [q for q in quiz_attempts if not q.get("is_correct", True) or q.get("actual_score", 1.0) < 1.0]

    if not incorrect_attempts:
        # Nếu không có câu sai nào, trả về rỗng (critic sẽ tự động gán fallback)
        elapsed_ms = (time.perf_counter() - start_time) * 1000
        timings["llm_path_generator_node"] = elapsed_ms
        return {"llm_analysis": {}, "timings_ms": timings}

    try:
        db = get_adaptive_db()
        if db._stub_mode or db.app_client is None:
            logger.info("Database is in STUB mode. Mocking LLM path generator response.")
            llm_analysis = {}
            for c_id in weak_concept_ids:
                llm_analysis[c_id] = {
                    "error_type": "conceptual",
                    "reason": "STUB: Mặc định gán lỗi hổng kiến thức cho học viên trong môi trường thử nghiệm.",
                }
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            timings["llm_path_generator_node"] = elapsed_ms
            return {"llm_analysis": llm_analysis, "timings_ms": timings}

        # 1. Fetch thông tin chi tiết câu hỏi của các câu trả lời sai
        question_ids = list({UUID(q["question_id"]) for q in incorrect_attempts})

        # Batch fetch câu hỏi để tối ưu hóa
        questions_resp = (
            db.app_client.table("questions")
            .select("id, prompt, answer_key, concept_id")
            .in_("id", [str(qid) for qid in question_ids])
            .execute()
        )

        questions_map = {}
        for q in questions_resp.data or []:
            q_id = str(q["id"])
            questions_map[q_id] = q

        # Fetch tên concept để LLM hiểu ngữ cảnh tốt hơn
        concepts_resp = db.app_client.table("concepts").select("id, name").eq("course_id", str(course_id)).execute()
        concept_names = {str(c["id"]): c["name"] for c in concepts_resp.data or []}

        # 2. Gom nhóm các câu sai theo concept_id
        concept_mistakes = {}
        for attempt in incorrect_attempts:
            c_id = str(attempt["concept_id"])
            q_id = str(attempt["question_id"])

            if c_id not in weak_concept_ids:
                # Chỉ phân tích các concepts thực sự bị hổng/yếu
                continue

            if c_id not in concept_mistakes:
                concept_mistakes[c_id] = []

            q_info = questions_map.get(q_id)
            if q_info:
                ans_key = normalize_answer_key(q_info.get("answer_key"))
                student_choice = attempt.get("student_answer", {}).get("selected_option", "N/A")
                correct_choice = ans_key.get("correct", "N/A")
                explanation = ans_key.get("explanation", "N/A")

                concept_mistakes[c_id].append(
                    {
                        "prompt": q_info.get("prompt"),
                        "options": ans_key.get("options", {}),
                        "student_answer": student_choice,
                        "correct_answer": correct_choice,
                        "explanation": explanation,
                    }
                )

        if not concept_mistakes:
            # Không có concept nào thuộc weak_concepts cần phân tích
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            timings["llm_path_generator_node"] = elapsed_ms
            return {"llm_analysis": {}, "timings_ms": timings}

        # 3. Xây dựng prompt gửi cho LLM
        concepts_data_str = ""
        for c_id, mistakes in concept_mistakes.items():
            c_name = concept_names.get(c_id, "Khái niệm chưa biết")
            concepts_data_str += f"\n--- CONCEPT ID: {c_id} ({c_name}) ---\n"
            for idx, m in enumerate(mistakes):
                concepts_data_str += f"Câu hỏi {idx + 1}: {m['prompt']}\n"
                concepts_data_str += f"Các lựa chọn: {m['options']}\n"
                concepts_data_str += f"Học sinh chọn: {m['student_answer']}\n"
                concepts_data_str += f"Đáp án đúng: {m['correct_answer']}\n"
                concepts_data_str += f"Giải thích: {m['explanation']}\n\n"

        system_prompt = (
            'Bạn là chuyên gia sư phạm Toán lớp 6. Nhiệm vụ của bạn là phân tích kết quả bài thi của học sinh để xác định xem học sinh gặp lỗi "bất cẩn" (careless) hay "hổng kiến thức" (conceptual) đối với từng chủ đề (concept).\n\n'
            "Định nghĩa lỗi:\n"
            "- 'careless': Học sinh hiểu cách giải quyết bài toán, nhưng làm sai do tính toán nhầm lẫn cơ bản (ví dụ: nhầm dấu cộng/trừ, tính nhầm phép nhân chia đơn giản ở bước cuối).\n"
            "- 'conceptual': Học sinh không hiểu khái niệm, chọn đáp án không liên quan hoặc hiểu sai hoàn toàn cách giải quyết bài toán.\n\n"
            "Hãy trả về kết quả dưới định dạng JSON duy nhất với cấu trúc sau (không kèm giải thích ngoài lề hoặc markdown ngoài khối ```json):\n"
            "{\n"
            '  "<concept_uuid>": {\n'
            '    "error_type": "careless" | "conceptual",\n'
            '    "reason": "Lý do ngắn gọn (1-2 câu) dựa trên phân tích bài làm"\n'
            "  }\n"
            "}"
        )

        user_content = f"Dưới đây là danh sách các câu hỏi bị làm sai theo từng concept:\n{concepts_data_str}"

        llm = get_llm()
        messages = [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_content}]

        llm_resp = await llm.ainvoke(messages)
        resp_content = clean_json_response(llm_resp.content)

        try:
            analysis = json.loads(resp_content)
        except Exception as json_err:
            logger.error(f"Failed to parse LLM analysis response as JSON: {resp_content}. Error: {json_err}")
            analysis = {}

        # Đảm bảo tất cả các keys phân tích đều khớp định dạng và có giá trị hợp lệ
        llm_analysis = {}
        for c_id in concept_mistakes.keys():
            item = analysis.get(c_id, {})
            error_type = item.get("error_type", "conceptual")
            if error_type not in ("careless", "conceptual"):
                error_type = "conceptual"
            llm_analysis[c_id] = {
                "error_type": error_type,
                "reason": item.get(
                    "reason", "Mặc định gán hổng kiến thức sư phạm do không phân tích được lỗi làm bài."
                ),
            }

        elapsed_ms = (time.perf_counter() - start_time) * 1000
        timings["llm_path_generator_node"] = elapsed_ms

        return {"llm_analysis": llm_analysis, "timings_ms": timings}

    except Exception as e:
        logger.error(f"Error in llm_path_generator_node: {e}", exc_info=True)
        # Fallback an toàn: Trả về dict trống, critic node sẽ tự động gán conceptual
        elapsed_ms = (time.perf_counter() - start_time) * 1000
        timings["llm_path_generator_node"] = elapsed_ms
        return {"llm_analysis": {}, "timings_ms": timings}
