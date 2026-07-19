"""
Module analyze_node đại diện cho Node phân tích trong đồ thị LangGraph Agent.
Nhiệm vụ:
- Tìm kiếm slides học liệu có độ tương đồng cao qua RAGService.
- Đọc thông tin học viên (Elo, BKT, weakness, active_quiz_session).
- Tính toán scaffolding rules (luật cá nhân hóa) theo mức Elo.
- Thiết lập luật tương tác thích ứng theo từng chế độ học tập (mode_instructions).
"""

import logging
import re
import unicodedata

from src.agents.state import AgentState
from src.services.braintrust_observability import braintrust_span, log_span
from src.services.chat_optimization import DEFAULT_MATCH_COUNT, DEFAULT_MATCH_THRESHOLD, build_prompt_profile
from src.services.rag import RAGDependencyError, RAGService
from src.services.timing import TimingCollector, merge_timing_metadata

logger = logging.getLogger(__name__)


def _strip_vietnamese_accents(text: str) -> str:
    text = text.replace("đ", "d").replace("Đ", "D")
    return "".join(char for char in unicodedata.normalize("NFD", text) if unicodedata.category(char) != "Mn")


def is_general_query_heuristic(query: str) -> bool:
    """Kiểm tra nhanh bằng Regex xem câu hỏi có thuộc nhóm chào hỏi/xã giao/thông tin cá nhân không."""
    normalized = query.strip().lower()

    # Các từ khóa chào hỏi/chit-chat/cảm ơn đơn giản
    # Sử dụng r"\b...\b" để tránh khớp nhầm từ trong câu chuyên môn
    simple_greetings = {
        "chào",
        "chào bạn",
        "hello",
        "hi",
        "xin chào",
        "cảm ơn",
        "cảm ơn bạn",
        "cám ơn",
        "thank",
        "thanks",
        "ok",
        "oke",
        "dạ",
        "bye",
        "tạm biệt",
    }
    if normalized in simple_greetings:
        return True
    normalized_no_nbsp = normalized.replace("\xa0", "")
    if re.match(r"^ch\S*\s+(ban|b\S*n|sofi|lucy)$", normalized_no_nbsp):
        return True

    normalized_candidates = {normalized, normalized_no_nbsp}
    for encoding in ("latin1", "cp1252"):
        try:
            normalized_candidates.add(normalized.encode(encoding).decode("utf-8").lower())
        except UnicodeError:
            pass

    ascii_candidates = {_strip_vietnamese_accents(candidate) for candidate in normalized_candidates}
    ascii_greetings = {"chao", "chao ban", "xin chao", "cam on", "cam on ban", "tam biet"}
    if ascii_candidates & ascii_greetings:
        return True
    ascii_patterns = [
        r"ban biet gi ve (toi|to)",
        r"ban (lam|co the lam) duoc gi",
        r"ban co the lam gi",
        r"ban co the giup gi",
        r"toi la ai",
        r"to la ai",
        r"ten toi la gi",
        r"minh ten la gi",
        r"ban ten (la )?gi",
    ]
    for candidate in ascii_candidates:
        if any(re.search(pattern, candidate) for pattern in ascii_patterns):
            return True
    # Các mẫu câu hỏi về danh tính của bot hoặc thông tin cá nhân của học sinh
    patterns = [
        r"bạn là ai",
        r"bạn tên gì",
        r"bạn tên là gì",
        r"sofi là ai",
        r"sofi là gì",
        r"trợ lý là gì",
        r"bạn (làm|có thể làm) được gì",
        r"bạn có thể làm gì",
        r"bạn có thể giúp gì",
        r"chức năng của bạn",
        r"tôi là ai",
        r"tớ là ai",
        r"tên tôi là gì",
        r"bạn biết gì về tôi",
        r"bạn biết gì về tớ",
        r"ngôn ngữ lập trình yêu thích của tôi",
        r"tôi thích học",
        r"tôi đang gặp khó khăn",
        r"mình tên là gì",
        r"mình thích ngôn ngữ",
    ]
    for pattern in patterns:
        if re.search(pattern, normalized):
            return True

    return False


def is_academic_query_heuristic(query: str) -> bool:
    """Detect obvious in-syllabus technical or math queries without paying an LLM routing call."""
    normalized = query.strip().lower()
    academic_terms = {
        "rag",
        "retrieval",
        "embedding",
        "fine-tuning",
        "fine tuning",
        "vector database",
        "vector db",
        "prompt engineering",
        "prompt",
        "tool calling",
        "langchain",
        "langgraph",
        "docker",
        "container",
        "etl",
        "elt",
        "data pipeline",
        "react",
        "next.js",
        "nextjs",
        "elo",
        "bkt",
        "supabase",
        "postgres",
        # Math 6 & 7 terms
        "phân số",
        "phan so",
        "tỉ số",
        "ti so",
        "tỉ lệ thức",
        "ti le thuc",
        "số hữu tỉ",
        "so huu ti",
        "quy đồng",
        "quy dong",
        "tử số",
        "tu so",
        "mẫu số",
        "mau so",
        "phép tính",
        "phep tinh",
        "toán",
        "toan",
        "đại số",
        "dai so",
        "hình học",
        "hinh hoc",
        "số tự nhiên",
        "so tu nhien",
        "ước chung",
        "uoc chung",
        "bội chung",
        "boi chung",
        "số nguyên",
        "so nguyen",
        # Geography & History terms
        "lịch sử",
        "lich su",
        "địa lý",
        "dia ly",
        "địa lí",
        "dia li",
        "đất nước",
        "quốc gia",
        "bản đồ",
        "ban do",
        "khí hậu",
        "khi hau",
        "thời tiết",
        "thoi tiet",
        "mưa đá",
        "mua da",
    }
    return any(term in normalized for term in academic_terms)


def is_academic_integrity_risk(query: str) -> bool:
    """Detect requests that look like homework/assignment solution outsourcing."""
    normalized = " ".join(query.strip().lower().split())

    assignment_markers = {
        "assignment",
        "homework",
        "quiz",
        "exam",
        "lab",
        "coursework",
        "project submission",
        "submit",
        "for my class",
        "for class",
        "bai tap",
        "nop bai",
        "kiem tra",
    }
    has_assignment_context = any(marker in normalized for marker in assignment_markers)

    direct_solution_patterns = [
        r"\b(write|create|build|implement|generate|provide|give me)\b.*\b(full|complete|entire|ready|code|component|solution|answer)\b",
        r"\b(solve|do)\b.*\b(for me|assignment|homework|quiz|exam|lab)\b",
        r"\bcopy[- ]?paste\b",
    ]
    asks_for_direct_solution = any(re.search(pattern, normalized) for pattern in direct_solution_patterns)

    code_request_terms = {
        "react component",
        "code",
        "function",
        "class",
        "api",
        "sql",
        "implementation",
    }
    asks_for_code_artifact = any(term in normalized for term in code_request_terms)

    return has_assignment_context and (asks_for_direct_solution or asks_for_code_artifact)


async def classify_query_intent(query: str, chat_history: list[dict] = None) -> str:
    """Sử dụng LLM (gpt-4o-mini) phân loại ý định thành 'academic' hoặc 'general'."""
    from src.services.llm import get_llm

    # Chuẩn bị lịch sử hội thoại gần nhất để hỗ trợ phát hiện chuyển đổi chủ đề (Topic Switching)
    history_context = ""
    if chat_history:
        history_context = "[LỊCH SỬ HỘI THOẠI GẦN NHẤT]\n"
        for msg in chat_history[-5:]:  # Chỉ cần lấy 5 lượt gần nhất để tránh tốn context
            role = "Học sinh" if msg.get("role") in ["student", "user"] else "Trợ lý AI"
            content = msg.get("content", "")
            history_context += f"{role}: {content}\n"
        history_context += "\n"

    prompt = f"""Bạn là bộ phân tích ý định câu hỏi cho một Trợ lý Học tập Socratic AI.
Nhiệm vụ của bạn là phân loại câu hỏi hiện tại của sinh viên thành 2 loại:
- "academic": Nếu sinh viên hỏi về kiến thức chuyên môn, học thuật, lý thuyết, bài tập hoặc các khái niệm thuộc chương trình học tập của các môn học trong hệ thống (như Toán học, Địa lý, Lịch sử, Ngữ văn, Vật lý, v.v., bao gồm các chuyên đề phân số, số hữu tỉ, tỉ lệ thức, hoặc các kiến thức hệ thống như RAG, Elo, BKT). Hãy ưu tiên "academic" nếu câu hỏi liên quan mật thiết hoặc tiếp nối ngữ cảnh chuyên môn từ lịch sử hội thoại phía trên.
- "general": Nếu sinh viên chào hỏi, tạm biệt, cảm ơn, xã giao, hỏi thông tin cá nhân, hoặc hỏi các câu chuyện phiếm không liên quan đến việc học tập của các môn học.

{history_context}Câu hỏi hiện tại cần phân loại: "{query}"

Chỉ trả về duy nhất một từ: "academic" hoặc "general". Tuyệt đối không giải thích hay thêm bớt từ ngữ nào khác."""

    try:
        llm = get_llm()
        llm_response = await llm.ainvoke(prompt)
        content = llm_response.content.strip().lower()
        if "general" in content:
            return "general"
        return "academic"
    except Exception as e:
        logger.error(f"Lỗi khi phân loại ý định bằng LLM: {e}")
        # Mặc định an toàn là academic để không bỏ lỡ RAG
        return "academic"


async def safe_adispatch_custom_event(name: str, data: dict):
    from langchain_core.callbacks import adispatch_custom_event

    try:
        await adispatch_custom_event(name, data)
    except RuntimeError as e:
        if "parent run id" not in str(e):
            raise


async def analyze_node(state: AgentState) -> dict:
    """Phân tích hồ sơ năng lực học sinh và lấy context RAG để chuẩn bị prompt."""
    timings = TimingCollector()
    query = state.get("query", "")
    profile = state.get("student_profile") or {}
    mode = state.get("mode") or "Explain"
    chat_history = state.get("chat_history") or []
    concept_id = state.get("concept_id")

    # Xác định ý định câu hỏi: general hay academic
    intent = "academic"
    academic_integrity_risk = is_academic_integrity_risk(query)

    await safe_adispatch_custom_event("thinking", {"text": "Đang xác định phạm vi câu hỏi..."})

    # 1. Kiểm tra heuristics nhanh
    if academic_integrity_risk:
        intent = "academic"
        logger.info(f"Phat hien nguy co academic integrity cho query: '{query}'")
    elif is_academic_query_heuristic(query):
        intent = "academic"
        logger.info(f"Phát hiện ý định 'academic' qua heuristics cho query: '{query}'")
    elif is_general_query_heuristic(query):
        intent = "general"
        logger.info(f"Phát hiện ý định 'general' qua heuristics cho query: '{query}'")
    elif concept_id and str(concept_id).lower() != "general":
        intent = "academic"
        logger.info(f"Phát hiện ý định 'academic' qua concept đang chọn: '{concept_id}'")
    # 2. Nếu ở chế độ Hỏi đáp tự do (không chọn concept cụ thể) và không khớp heuristics, chạy LLM classifier
    elif not concept_id or str(concept_id).lower() == "general":
        await safe_adispatch_custom_event("thinking", {"text": "Đang phân loại câu hỏi..."})
        with braintrust_span(
            "agent.intent_classify", input={"query": query}, metadata={"history_count": len(chat_history)}
        ) as span:
            with timings.span("intent_classify"):
                intent = await classify_query_intent(query, chat_history)
            log_span(span, output={"intent": intent})
        logger.info(f"LLM phân loại ý định là '{intent}' cho query: '{query}'")

    slides = []
    formatted_context = ""
    # Chỉ truy vấn RAG khi ý định là học thuật (academic)
    if intent == "academic":
        try:
            await safe_adispatch_custom_event("thinking", {"text": "Đang tìm học liệu liên quan..."})
            await safe_adispatch_custom_event(
                "tool_call",
                {
                    "tool_name": "RAG match_slides",
                    "arguments": {
                        "query": query,
                        "concept_id": str(concept_id) if concept_id else "general",
                        "mode": mode,
                    },
                },
            )

            rag_service = RAGService()
            with braintrust_span(
                "rag.retrieve",
                input={"query": query},
                metadata={"course_id": state.get("course_id"), "concept_id": str(concept_id) if concept_id else None},
            ) as span:
                with timings.span("rag_total"):
                    slides = await rag_service.aretrieve_relevant_slides(
                        query,
                        match_threshold=DEFAULT_MATCH_THRESHOLD,
                        match_count=DEFAULT_MATCH_COUNT,
                        course_id=state.get("course_id"),
                        concept_id=concept_id,
                        mode=mode,
                    )
                log_span(
                    span,
                    output={
                        "count": len(slides),
                        "top_similarity": slides[0].get("similarity") if slides else None,
                    },
                    metadata={"timings_ms": rag_service.last_timings_ms},
                )
            timings.update(rag_service.last_timings_ms)

            await safe_adispatch_custom_event(
                "tool_result",
                {
                    "tool_name": "RAG match_slides",
                    "output": {
                        "count": len(slides),
                        "slides": [
                            {
                                "document_name": s.get("document_name"),
                                "slide_number": s.get("slide_number"),
                                "similarity": s.get("similarity"),
                            }
                            for s in slides
                        ],
                    },
                },
            )

            # Kiểm tra trường hợp RAG trống hoặc độ tương đồng quá thấp (similarity < 0.42)
            if not slides or slides[0].get("similarity", 0.0) < 0.42:
                intent = "general"
                if academic_integrity_risk:
                    intent = "academic"
                slides = []
                formatted_context = ""
                if academic_integrity_risk:
                    formatted_context = (
                        "No official course slide was retrieved for this academic-integrity-risk request."
                    )
                logger.info(
                    "Không tìm thấy slides liên quan hoặc độ tương đồng quá thấp. Chuyển ý định sang 'general'."
                )
            else:
                formatted_context = rag_service.format_context(slides)
        except Exception as e:
            if isinstance(e, RAGDependencyError):
                raise
            logger.error(f"Lỗi khi truy vấn RAG: {e}", exc_info=True)
            slides = []
            formatted_context = "Không thể tải học liệu tham khảo do lỗi hệ thống RAG."
            await safe_adispatch_custom_event(
                "tool_result", {"tool_name": "RAG match_slides", "output": {"error": str(e)}}
            )
    else:
        # Đối với general query, không cần RAG context
        formatted_context = ""
        logger.info("Bỏ qua truy vấn RAG cho câu hỏi xã giao/ngoài lề (intent: general)")

    prompt_profile = build_prompt_profile(profile, mode)

    # --- Wire Diagnostic Engine (P0-2) ---
    # Engine là thuần Python + SQLite, chạy offline, không gọi LLM.
    diagnostic_result = None
    if concept_id:
        try:
            from src.services.diagnostic_engine import DiagnosticEngine

            student_id = profile.get("student_id") or profile.get("id")
            logger.info(f"[DIAGNOSTIC TRACE] student_id={student_id}, concept_id={concept_id}, profile={profile}")
            if student_id:
                engine = DiagnosticEngine()
                diagnostic_result = engine.diagnose(str(student_id), str(concept_id))
                logger.info(f"[DIAGNOSTIC TRACE] result={diagnostic_result}")
        except Exception as e:
            logger.warning(f"Diagnostic engine skipped: {e}", exc_info=True)

    metadata = state.get("metadata") or {}
    timings.add("analyze_total", timings.elapsed_ms())
    metadata = merge_timing_metadata(metadata, {**(state.get("timings_ms") or {}), **timings.snapshot()})
    metadata.update(
        {
            "retrieved_slides": slides,
            "scaffolding_rules": prompt_profile["scaffolding_rules"],
            "mode_instructions": prompt_profile["mode_instructions"],
            "elo": prompt_profile["elo"],
            "bkt": prompt_profile["bkt"],
            "weakness": True
            if (diagnostic_result and diagnostic_result.get("weakness_flag"))
            else prompt_profile["weakness"],
            "active_quiz": prompt_profile["active_quiz"],
            "mode": mode,
            "academic_integrity_risk": academic_integrity_risk,
            "intent": intent,
            "diagnostic": diagnostic_result,
        }
    )

    return {
        "analysis": f"Tìm kiếm RAG hoàn tất. Tìm thấy {len(slides)} slide liên quan.",
        "context": formatted_context,
        "metadata": metadata,
        "timings_ms": metadata.get("timings_ms", {}),
    }
