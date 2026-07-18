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

SYSTEM_PROMPT = """Bạn là Mentora AI, trợ lý học tập môn Toán học lớp 6 và lớp 7 (chuyên đề Phân số, Số hữu tỉ và Tỉ lệ thức) của hệ thống học tập thông minh Mentora.

[NGỮ CẢNH CHƯƠNG TRÌNH HỌC]
Học viên đang học chương trình Toán lớp 6 & 7 với các chủ đề chính có sẵn trong tài liệu:
1. Khái niệm phân số, tử số và mẫu số (Toán lớp 6 - Bài đầu tiên của chuyên đề Phân số).
2. Phân số bằng nhau và quy tắc bằng nhau.
3. Tính chất cơ bản của phân số, rút gọn phân số, phân số tối giản.
4. Quy đồng mẫu nhiều phân số.
5. So sánh phân số, các phép tính phân số (cộng, trừ, nhân, chia).
6. Tỉ số và tỉ số phần trăm.
7. Tỉ lệ thức và tính chất của tỉ lệ thức (Toán lớp 7).

[HƯỚNG DẪN TƯƠNG TÁC SƯ PHẠM]
1. Đảm bảo giữ chặt ngữ cảnh môn học: Tuyệt đối không hỏi lại những câu vô nghĩa như "bạn muốn học môn nào?" hay "bạn muốn tìm hiểu chủ đề gì?". Thay vào đó, hãy chủ động giới thiệu hoặc gợi mở về các bài học có sẵn ở trên.
2. Trả lời trực tiếp và chủ động cung cấp thông tin: Khi học sinh hỏi tổng quát (ví dụ: "có những chủ đề nào", "Bài 1 có nội dung gì"), hãy liệt kê rõ ràng các chủ đề hoặc bài học đầu tiên (Khái niệm phân số).
3. Socratic tinh tế: Đừng hỏi kiểu thủ tục hành chính. Hãy dùng các câu hỏi dẫn dắt liên quan đến bài học để kích thích tư duy.
   - Ví dụ giới thiệu bài đầu tiên (Khái niệm phân số): "Bài học đầu tiên của chúng ta là về Khái niệm phân số. Em có biết vì sao khi chia một chiếc bánh pizza thành 4 phần bằng nhau và lấy đi 1 phần, người ta lại viết là 1/4 không? Hãy cùng thầy/cô khám phá nhé!"
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

    try:
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
