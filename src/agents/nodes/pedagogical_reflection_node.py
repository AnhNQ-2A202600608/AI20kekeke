"""
Module pedagogical_reflection_node đại diện cho Node kiểm định sư phạm trong đồ thị LangGraph Agent.
Nhiệm vụ:
- Phân tích câu trả lời thô được tạo ra từ respond_node.
- Xác định xem câu trả lời có vi phạm luật Socratic (như cung cấp code giải trực tiếp, đáp án bài tập trực tiếp) hay không.
- Trả về kết quả đánh giá (is_valid) và nhận xét (feedback) để yêu cầu viết lại nếu cần thiết.
"""

import json
import logging
import re
import time

from src.agents.state import AgentState
from src.services.braintrust_observability import braintrust_span, log_span
from src.services.llm import get_llm
from src.services.timing import TimingCollector, merge_timing_metadata

logger = logging.getLogger(__name__)

CRITIC_PROMPT = """Bạn là một Giám sát Sư phạm AI (Pedagogical Critic) tại Đại học VinUniversity.
Nhiệm vụ của bạn là đánh giá xem câu trả lời của AI Tutor bên dưới có vi phạm quy tắc sư phạm Socratic hay không.

QUY TẮC SƯ PHẠM Socratic:
1. AI Tutor KHÔNG ĐƯỢC PHÉP cung cấp lời giải trực tiếp, mã nguồn hoàn chỉnh hoặc đáp án trực tiếp cho bài tập/assignment/quiz của sinh viên.
2. AI Tutor chỉ được hướng dẫn thông qua các câu hỏi gợi mở, ẩn dụ, chỉ ra slide chứa kiến thức, gợi ý mã giả (pseudocode) hoặc phân tích thuật toán chung.

Học viên đang hỏi:
"{query}"

Câu trả lời của AI Tutor cần đánh giá:
"{response}"

Hãy đánh giá và trả về một chuỗi JSON duy nhất chứa hai trường:
- "is_valid": true (nếu câu trả lời hợp lệ, giữ tinh thần Socratic tốt, không rò rỉ đáp án/code) hoặc false (nếu vi phạm quy tắc sư phạm).
- "feedback": Lý do vì sao vi phạm và hướng dẫn sửa đổi cụ thể cho AI (nếu is_valid = false), hoặc chuỗi rỗng "" (nếu is_valid = true).

CHỈ TRẢ VỀ CHUỖI JSON HỢP LỆ, KHÔNG CHỨA ``` HAY BẤT KỲ ĐOẠN TEXT NÀO KHÁC THỪA THÃI.
Ví dụ: {{"is_valid": false, "feedback": "Câu trả lời chứa đoạn code hoàn chỉnh giải quyết yêu cầu bài tập. Hãy yêu cầu AI viết lại dạng pseudocode gợi ý."}}
"""

ACADEMIC_INTEGRITY_SAFE_FALLBACK = (
    "I can't write a complete assignment solution or ready-to-submit code for you. "
    "I can help you build it step by step: identify the state you need, the effect that fetches data, "
    "and how you would render each item. What part would you like to try writing first?"
)


async def safe_adispatch_custom_event(name: str, data: dict):
    from langchain_core.callbacks import adispatch_custom_event

    try:
        await adispatch_custom_event(name, data)
    except RuntimeError as e:
        if "parent run id" not in str(e):
            raise


async def pedagogical_reflection_node(state: AgentState) -> dict:
    """Kiểm tra tính sư phạm của câu trả lời, trả về feedback nếu không hợp lệ."""
    timings = TimingCollector()
    query = state.get("query", "")
    response = state.get("response", "")
    reflection_attempts = state.get("reflection_attempts") or 0
    metadata = state.get("metadata") or {}

    await safe_adispatch_custom_event(
        "thinking", {"text": "Đang chạy bộ lọc kiểm định chất lượng sư phạm (Socratic Critic)..."}
    )

    # Nếu đã thử tự sửa quá 2 lần, cho phép thông qua để tránh treo vô hạn
    if reflection_attempts >= 2:
        logger.warning("Đã đạt giới hạn tối đa 2 lần thử tự sửa đổi. Bỏ qua kiểm định.")
        await safe_adispatch_custom_event(
            "thinking", {"text": "Đã đạt giới hạn 2 lần sửa đổi. Bỏ qua kiểm định sư phạm."}
        )
        if metadata.get("academic_integrity_risk"):
            timings.add("reflection_total", timings.elapsed_ms())
            metadata = merge_timing_metadata(metadata, timings.snapshot())
            return {
                "response": ACADEMIC_INTEGRITY_SAFE_FALLBACK,
                "reflection_feedback": None,
                "metadata": metadata,
                "timings_ms": metadata.get("timings_ms", {}),
            }
        return {"reflection_feedback": None}

    try:
        llm = get_llm()
        # Optimize Critic using JSON mode, low temperature, and max tokens
        # Check if it supports binding and is not a mock object
        if hasattr(llm, "bind") and "mock" not in type(llm).__name__.lower():
            try:
                llm = llm.bind(response_format={"type": "json_object"}, max_tokens=150, temperature=0.0)
            except Exception as bind_err:
                logger.warning(f"Could not bind parameters to LLM: {bind_err}")

        prompt = CRITIC_PROMPT.format(query=query, response=response)

        llm_start = time.perf_counter()
        with braintrust_span("llm.reflection", input={"query": query, "response_chars": len(response)}) as span:
            llm_response = await llm.ainvoke(prompt)
            timings.add("reflection_llm", (time.perf_counter() - llm_start) * 1000)
            log_span(span, metadata={"timings_ms": timings.snapshot()})
        content = llm_response.content.strip()

        # Trích xuất phần JSON nằm giữa cặp ngoặc nhọn {} đầu tiên và cuối cùng
        json_match = re.search(r"\{.*\}", content, re.DOTALL)
        if json_match:
            content = json_match.group(0)

        eval_result = json.loads(content)
        is_valid = eval_result.get("is_valid", True)
        feedback = eval_result.get("feedback", "")

        if not is_valid:
            logger.warning(f"Phát hiện vi phạm quy tắc Socratic: {feedback}")
            await safe_adispatch_custom_event(
                "thinking", {"text": f"Phát hiện vi phạm tiêu chuẩn Socratic: {feedback}. Đang yêu cầu AI viết lại..."}
            )
            timings.add("reflection_total", timings.elapsed_ms())
            metadata = merge_timing_metadata(state.get("metadata") or {}, timings.snapshot())
            return {"reflection_feedback": feedback, "metadata": metadata, "timings_ms": metadata.get("timings_ms", {})}

        await safe_adispatch_custom_event(
            "thinking", {"text": "Kiểm định sư phạm thành công. Phản hồi đạt chuẩn Socratic."}
        )
        timings.add("reflection_total", timings.elapsed_ms())
        metadata = merge_timing_metadata(state.get("metadata") or {}, timings.snapshot())
        return {"reflection_feedback": None, "metadata": metadata, "timings_ms": metadata.get("timings_ms", {})}
    except Exception as e:
        logger.error(f"Lỗi khi thực thi pedagogical_reflection_node: {e}", exc_info=True)
        # Nếu có lỗi kỹ thuật trong quá trình kiểm định, mặc định cho qua để không ảnh hưởng UX
        await safe_adispatch_custom_event("thinking", {"text": f"Lỗi kỹ thuật kiểm định: {str(e)}. Tự động bỏ qua."})
        return {"reflection_feedback": None}
