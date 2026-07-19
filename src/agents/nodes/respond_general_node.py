"""
Module respond_general_node đại diện cho Node tạo phản hồi xã giao/thông thường.
Nhiệm vụ:
- Gửi yêu cầu đến LLM với prompt cực ngắn để trả lời xã giao nhanh chóng (giao tiếp thông thường).
- Không truy vấn RAG, không kiểm định sư phạm phức tạp.
"""

import logging
import time

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from src.agents.state import AgentState
from src.services.braintrust_observability import braintrust_span, log_span
from src.services.chat_fast_path import static_general_response
from src.services.llm import get_llm
from src.services.timing import TimingCollector, merge_timing_metadata

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """Bạn là Lucy, trợ lý giải đáp học tập AI của hệ thống Mentora.

[NGỮ CẢNH CHƯƠNG TRÌNH HỌC]
Bạn hỗ trợ giải đáp học tập cho bất kỳ môn học nào có tài liệu trong hệ thống (như Toán học, Địa lý, Lịch sử, Ngữ văn, Vật lý, v.v.).

[HƯỚNG DẪN TƯƠNG TÁC SƯ PHẠM]
1. Đảm bảo giữ thái độ cởi mở, sẵn sàng hỗ trợ giải đáp nhiều môn học khác nhau. Tuyệt đối không giới hạn bản thân chỉ hỗ trợ riêng môn Toán hay bất kỳ môn học đơn lẻ nào.
2. Trả lời trực tiếp và chủ động cung cấp thông tin hoặc hướng dẫn giúp học sinh học tập.
3. Socratic tinh tế: Dùng các câu hỏi dẫn dắt liên quan đến bài học để kích thích tư duy.
4. Giọng điệu: Ngắn gọn (dưới 3-4 câu), ấm áp, thân thiện, xưng hô phù hợp với học sinh phổ thông (ví dụ: "thầy/cô" và "em", hoặc "mình" và "bạn").
"""


async def safe_adispatch_custom_event(name: str, data: dict):
    from langchain_core.callbacks import adispatch_custom_event

    try:
        await adispatch_custom_event(name, data)
    except RuntimeError as e:
        if "parent run id" not in str(e):
            raise


async def respond_general_node(state: AgentState) -> dict:
    """Tạo phản hồi xã giao nhanh chóng."""
    timings = TimingCollector()
    query = state.get("query", "")
    chat_history = state.get("chat_history") or []
    long_term_facts = state.get("long_term_facts") or {}

    student_profile = state.get("student_profile") or {}
    concept_id = state.get("concept_id")

    try:
        # Quyết định dùng Fast Path tĩnh hay LLM (Hybrid approach):
        # Chỉ dùng Fast Path tĩnh khi mới bắt đầu phiên (chưa có lịch sử, chưa chọn concept học thuật, và elo ở mức mặc định 1200.0).
        has_history = len(chat_history) > 0
        has_active_concept = concept_id and str(concept_id).lower() != "general"
        has_custom_elo = student_profile.get("elo_score", 1200.0) != 1200.0 or student_profile.get("elo", 1200.0) != 1200.0
        has_custom_mastery = student_profile.get("mastery_state", "not_started") != "not_started"
        
        is_new_session_greeting = not has_history and not has_active_concept and not has_custom_elo and not has_custom_mastery

        if is_new_session_greeting:
            static_response = static_general_response(query)
            if static_response:
                timings.add("llm_first_token", 0.0)
                timings.add("llm_total", 0.0)
                await safe_adispatch_custom_event("token", {"delta": static_response})
                metadata = merge_timing_metadata(state.get("metadata") or {}, timings.snapshot())
                metadata["intent"] = "general"
                return {"response": static_response, "metadata": metadata, "timings_ms": metadata.get("timings_ms", {})}

        llm = get_llm()
        messages = [SystemMessage(content=SYSTEM_PROMPT)]

        if long_term_facts:
            facts_text = "[KÝ ỨC DÀI HẠN VỀ HỌC SINH (LONG-TERM FACTS)]\n"
            facts_text += f"- Tên: {long_term_facts.get('name', 'Chưa rõ')}\n"
            facts_text += f"- Ngôn ngữ lập trình yêu thích: {long_term_facts.get('prefer_language', 'Chưa rõ')}\n"
            if long_term_facts.get("struggles_with"):
                facts_text += f"- Chủ đề đang gặp khó khăn: {', '.join(long_term_facts['struggles_with'])}\n"
            if long_term_facts.get("strengths"):
                facts_text += f"- Điểm mạnh: {', '.join(long_term_facts['strengths'])}\n"
            if long_term_facts.get("other_facts"):
                facts_text += f"- Thông tin thêm khác: {', '.join(long_term_facts['other_facts'])}\n"
            messages.append(SystemMessage(content=facts_text))

        # Chỉ lấy tối đa 10 tin nhắn lịch sử để đảm bảo tính liên tục (short-term memory)
        for msg in chat_history[-10:]:
            role = msg.get("role")
            content = msg.get("content", "")
            if role in ["student", "user"]:
                messages.append(HumanMessage(content=content))
            elif role in ["assistant", "ai"]:
                messages.append(AIMessage(content=content))

        messages.append(HumanMessage(content=query))

        chunks = []
        llm_start = time.perf_counter()
        first_token_seen = False
        with braintrust_span(
            "llm.respond_general_stream", input={"query": query}, metadata={"intent": "general"}
        ) as span:
            async for chunk in llm.astream(messages):
                content = chunk.content
                if content:
                    if not first_token_seen:
                        timings.add("llm_first_token", (time.perf_counter() - llm_start) * 1000)
                        first_token_seen = True
                    chunks.append(content)
                    await safe_adispatch_custom_event("token", {"delta": content})
            timings.add("llm_total", (time.perf_counter() - llm_start) * 1000)
            log_span(span, output={"answer_chars": len("".join(chunks))}, metadata={"timings_ms": timings.snapshot()})

        raw_text = "".join(chunks)
        metadata = merge_timing_metadata(state.get("metadata") or {}, timings.snapshot())
        metadata["intent"] = "general"

        return {"response": raw_text, "metadata": metadata, "timings_ms": metadata.get("timings_ms", {})}
    except Exception as e:
        logger.error(f"Lỗi khi xử lý respond_general_node: {e}", exc_info=True)
        return {"response": "Xin chào! Tôi có thể giúp gì cho bạn trong việc học tập hôm nay?", "error": str(e)}
