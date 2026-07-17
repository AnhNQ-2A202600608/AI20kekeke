"""
Module respond_node đại diện cho Node tạo phản hồi trong đồ thị LangGraph Agent.
Nhiệm vụ:
- Định dạng và kết hợp Prompt hệ thống (SYSTEM_PROMPT) cùng thông tin học viên và context học liệu.
- Gửi yêu cầu đến LLM (OpenAI model) để tạo câu trả lời súc tích, mang tính gợi mở Socratic.
- Xác thực và kiểm soát chất lượng trích dẫn (citations) thông qua CitationValidator.
"""

import logging
import time

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from src.agents.state import AgentState
from src.services.academic_fast_path import (
    extractive_definition_response,
    is_brief_definition_query,
    response_max_tokens,
)
from src.services.braintrust_observability import braintrust_span, log_span
from src.services.chat_optimization import build_system_prompt, split_formatted_prompt
from src.services.citation_validator import CitationValidator
from src.services.llm import get_llm
from src.services.timing import TimingCollector, merge_timing_metadata

logger = logging.getLogger(__name__)

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


def build_offline_response(student_id: str, diagnostic: dict) -> str:
    """Tạo phản hồi Socratic offline dựa trên dữ liệu chẩn đoán của engine."""
    from src.config import get_settings
    import json
    import sqlite3
    from pathlib import Path

    settings = get_settings()
    questions_path = Path(settings.sgk_data_dir) / "questions.json"
    graph_path = Path(settings.sgk_data_dir) / "knowledge_graph.json"

    # Load questions
    questions_data = []
    if questions_path.exists():
        try:
            with open(questions_path, "r", encoding="utf-8") as f:
                questions_data = json.load(f)
        except Exception:
            pass

    # Load graph
    graph_data = {}
    if graph_path.exists():
        try:
            with open(graph_path, "r", encoding="utf-8") as f:
                graph_data = json.load(f)
        except Exception:
            pass
    nodes = {node["id"]: node for node in graph_data.get("nodes", [])}

    status = diagnostic.get("status")

    if status == "PROBE":
        probe_questions = diagnostic.get("questions", [])
        if probe_questions:
            target_q_id = probe_questions[0]
            target_q = next((q for q in questions_data if q.get("question_id") == target_q_id), None)
            if target_q:
                # Query attempts
                db_path = settings.database_url
                if db_path.startswith("sqlite:///"):
                    db_path = db_path[10:]

                attempts = 0
                try:
                    conn = sqlite3.connect(str(db_path))
                    cursor = conn.cursor()
                    cursor.execute("""
                        SELECT is_correct FROM learning_events
                        WHERE student_id = ? AND question_id = ?
                    """, (str(student_id), str(target_q_id)))
                    attempts = len(cursor.fetchall())
                    conn.close()
                except Exception:
                    pass

                hints = target_q.get("socratic_hints", [])
                hint_index = min(attempts, len(hints) - 1) if hints else -1
                hint_text = hints[hint_index] if hint_index >= 0 else "Hãy suy nghĩ kỹ nhé."

                options_text = ""
                options = target_q.get("options", {})
                for key, val in options.items():
                    options_text += f"{key}) {val}\n"

                node_desc = nodes.get(diagnostic.get("probe_node"), {}).get("mo_ta", diagnostic.get("probe_node"))

                response_parts = [
                    "Chào em! Hiện tại hệ thống đang chạy ở chế độ offline.",
                    f"Thầy/cô cần kiểm tra thêm kiến thức của em về phần: **{node_desc}**.",
                    "Hãy thử sức với câu hỏi sau nhé:\n",
                    f"**Câu hỏi:** {target_q.get('text')}",
                    options_text.strip(),
                    f"\n*Gợi ý:* {hint_text}"
                ]
                return "\n\n".join([p for p in response_parts if p])

    elif status == "DIAGNOSIS_COMPLETE":
        root_cause = diagnostic.get("root_cause", {})
        root_cause_id = root_cause.get("id")
        if root_cause_id:
            root_cause_desc = root_cause.get("mo_ta", root_cause_id)
            root_cause_lop = root_cause.get("lop", "?")
            suggested_path = diagnostic.get("suggested_path", [])

            practice_q = next((q for q in questions_data if root_cause_id in q.get("yccd", [])), None)
            if practice_q:
                target_q_id = practice_q.get("question_id")
                db_path = settings.database_url
                if db_path.startswith("sqlite:///"):
                    db_path = db_path[10:]

                attempts = 0
                try:
                    conn = sqlite3.connect(str(db_path))
                    cursor = conn.cursor()
                    cursor.execute("""
                        SELECT is_correct FROM learning_events
                        WHERE student_id = ? AND question_id = ?
                    """, (str(student_id), str(target_q_id)))
                    attempts = len(cursor.fetchall())
                    conn.close()
                except Exception:
                    pass

                hints = practice_q.get("socratic_hints", [])
                hint_index = min(attempts, len(hints) - 1) if hints else -1
                hint_text = hints[hint_index] if hint_index >= 0 else "Hãy suy nghĩ kỹ nhé."

                options_text = ""
                options = practice_q.get("options", {})
                for key, val in options.items():
                    options_text += f"{key}) {val}\n"

                path_str = " → ".join(suggested_path) if suggested_path else ""

                response_parts = [
                    "Chào em! Hiện tại hệ thống đang chạy ở chế độ offline.",
                    f"Thầy/cô nhận định em có thể chưa nắm chắc phần kiến thức nền: **{root_cause_desc}** (Lớp {root_cause_lop}).",
                    f"Độ tin cậy của chẩn đoán: {diagnostic.get('confidence', 0.0):.0%}.",
                    f"Đường ôn tập gợi ý: {path_str}" if path_str else "",
                    "\nChúng ta cùng luyện tập lại phần này qua câu hỏi sau nhé:\n",
                    f"**Câu hỏi:** {practice_q.get('text')}",
                    options_text.strip(),
                    f"\n*Gợi ý:* {hint_text}"
                ]
                return "\n\n".join([p for p in response_parts if p])

    return "Thầy/cô đang ở chế độ offline và chưa có thông tin chẩn đoán lỗi hổng của em. Em hãy xem lại học liệu và đặt câu hỏi cụ thể nhé!"


from typing import Any

async def respond_node(state: AgentState) -> dict:
    """Tạo response từ analysis, context và thực hiện validate citation."""
    timings = TimingCollector()
    query = state.get("query", "")
    context = state.get("context", "")
    metadata = state.get("metadata", {}) or {}
    error = state.get("error")
    chat_history = state.get("chat_history") or []
    long_term_facts = state.get("long_term_facts") or {}
    reflection_attempts = state.get("reflection_attempts") or 0
    reflection_feedback = state.get("reflection_feedback")

    if error:
        return {"response": f"Đã xảy ra lỗi hệ thống: {error}"}

    retrieved_slides = metadata.get("retrieved_slides", [])
    if metadata.get("academic_integrity_risk") and not retrieved_slides:
        timings.add("llm_first_token", 0.0)
        timings.add("llm_total", 0.0)
        await safe_adispatch_custom_event("token", {"delta": ACADEMIC_INTEGRITY_SAFE_FALLBACK})
        new_metadata = merge_timing_metadata(metadata, timings.snapshot())
        new_metadata["citation_validation"] = {
            "is_valid": True,
            "invalid_citations": [],
            "valid_citations": [],
        }
        return {
            "response": ACADEMIC_INTEGRITY_SAFE_FALLBACK,
            "metadata": new_metadata,
            "timings_ms": new_metadata.get("timings_ms", {}),
            "reflection_attempts": reflection_attempts,
        }

    fast_response = extractive_definition_response(query, retrieved_slides)
    if fast_response:
        timings.add("llm_first_token", 0.0)
        timings.add("llm_total", 0.0)
        await safe_adispatch_custom_event("token", {"delta": fast_response})
        validation_result = CitationValidator.validate_citations(
            fast_response,
            retrieved_slides,
            query,
            intent=metadata.get("intent", "academic"),
        )
        new_metadata = merge_timing_metadata(metadata, timings.snapshot())
        new_metadata["citation_validation"] = {
            "is_valid": validation_result["is_valid"],
            "invalid_citations": validation_result["invalid_citations"],
            "valid_citations": validation_result["valid_citations"],
        }
        return {
            "response": validation_result["cleaned_text"],
            "metadata": new_metadata,
            "timings_ms": new_metadata.get("timings_ms", {}),
            "reflection_attempts": reflection_attempts,
        }

    profile = {
        "elo_score": metadata.get("elo", 1200.0),
        "bkt_mastery_probability": metadata.get("bkt", 0.25),
        "weakness_flag": metadata.get("weakness", False),
        "active_quiz_session": metadata.get("active_quiz", False),
        "scaffolding_rules": metadata.get("scaffolding_rules", ""),
        "mode_instructions": metadata.get("mode_instructions", ""),
        "intent": metadata.get("intent", "academic"),
        "diagnostic": metadata.get("diagnostic"),
    }

    mode = metadata.get("mode") or state.get("mode") or "Explain"
    system_prompt = build_system_prompt(context, profile, mode)
    if metadata.get("academic_integrity_risk"):
        system_prompt += (
            "\n\n[ACADEMIC INTEGRITY RISK - STRICT]\n"
            "- The student appears to be asking for a complete assignment, homework, lab, quiz, or ready-to-submit solution.\n"
            "- Politely refuse to provide complete code, final answers, or a runnable solution.\n"
            "- Offer a brief conceptual plan, pseudocode-level hints, or one guiding question instead.\n"
            "- Do not include runnable code blocks or complete component/function/class implementations."
        )
    if is_brief_definition_query(query):
        system_prompt += (
            "\n\n[GIỚI HẠN PHẢN HỒI NGẮN]\n"
            "- Đây là câu hỏi định nghĩa/khái niệm. Trả lời trực tiếp trong 2-4 câu ngắn.\n"
            "- Chỉ đặt tối đa 1 câu hỏi gợi mở ở cuối nếu thật sự cần.\n"
            "- Không liệt kê dài, không mở rộng sang các chủ đề khác."
        )

    # Nếu có phản hồi kiểm định sư phạm, yêu cầu LLM viết lại
    if reflection_feedback:
        system_prompt += (
            "\n\n[LƯU Ý QUAN TRỌNG TỪ HỆ THỐNG GIÁM SÁT SƯ PHẠM]\n"
            f"Câu trả lời trước đó của bạn bị từ chối do vi phạm quy tắc: {reflection_feedback}\n"
            "Hãy viết lại câu trả lời gợi ý theo phương pháp Socratic, TUYỆT ĐỐI không chứa code giải trực tiếp và không cho biết đáp án trắc nghiệm."
        )

    # Phân tách prompt thành phần tĩnh và động
    static_prompt, dynamic_prompt = split_formatted_prompt(system_prompt)

    try:
        llm = get_llm()
        if hasattr(llm, "bind"):
            llm = llm.bind(max_tokens=response_max_tokens(query))
        messages = [SystemMessage(content=static_prompt)]

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

        for msg in chat_history:
            role = msg.get("role")
            content = msg.get("content", "")
            if role == "student" or role == "user":
                messages.append(HumanMessage(content=content))
            elif role == "assistant" or role == "ai":
                messages.append(AIMessage(content=content))
            elif role == "system":
                messages.append(SystemMessage(content=content))

        # Đưa dynamic_prompt xuống dưới chat history
        if dynamic_prompt:
            messages.append(SystemMessage(content=dynamic_prompt))

        messages.append(HumanMessage(content=f"<student_query>\n{query}\n</student_query>"))

        chunks = []
        llm_start = time.perf_counter()
        first_token_seen = False
        with braintrust_span(
            "llm.respond_stream",
            input={"query": query, "message_count": len(messages)},
            metadata={"mode": mode, "intent": metadata.get("intent", "academic")},
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

        intent = metadata.get("intent", "academic")
        with timings.span("citation_validation"):
            validation_result = CitationValidator.validate_citations(raw_text, retrieved_slides, query, intent=intent)
        cleaned_text = validation_result["cleaned_text"]

        new_metadata = merge_timing_metadata(metadata, timings.snapshot())
        new_metadata["citation_validation"] = {
            "is_valid": validation_result["is_valid"],
            "invalid_citations": validation_result["invalid_citations"],
            "valid_citations": validation_result["valid_citations"],
        }

        # Nếu phát hiện trích dẫn ảo, tự động kích hoạt feedback để quay lại vòng lặp reflection
        feedback = None
        if validation_result.get("invalid_citations"):
            feedback = f"Câu trả lời chứa trích dẫn ảo (invalid citations) không tồn tại trong học liệu: {validation_result['invalid_citations']}. Hãy viết lại câu trả lời và chỉ sử dụng trích dẫn thực tế từ học liệu."

        current_feedback = reflection_feedback or feedback
        new_attempts = reflection_attempts + 1 if current_feedback else reflection_attempts

        return {
            "response": cleaned_text,
            "metadata": new_metadata,
            "timings_ms": new_metadata.get("timings_ms", {}),
            "reflection_attempts": new_attempts,
            "reflection_feedback": current_feedback,
        }
    except Exception as e:
        logger.error(f"Lỗi khi xử lý respond_node: {e}", exc_info=True)
        diagnostic = metadata.get("diagnostic")
        if diagnostic:
            student_profile = state.get("student_profile") or {}
            student_id = student_profile.get("student_id") or student_profile.get("id") or "guest"
            try:
                offline_res = build_offline_response(student_id, diagnostic)
                new_metadata = metadata.copy()
                new_metadata["offline_fallback"] = True
                return {
                    "response": offline_res,
                    "metadata": new_metadata,
                    "timings_ms": new_metadata.get("timings_ms", {}),
                    "reflection_attempts": reflection_attempts,
                }
            except Exception as fallback_err:
                logger.error(f"Error in offline fallback handler: {fallback_err}", exc_info=True)

        return {
            "response": f"Lỗi trong quá trình tạo câu trả lời: {e}",
            "error": str(e),
        }
