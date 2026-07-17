from langchain_core.messages import HumanMessage, SystemMessage

from src.agents.state import AgentState
from src.services.citation_validator import CitationValidator
from src.services.llm import get_llm
from src.services.rag import RAGService

SYSTEM_PROMPT = """[DEPRECATED] Please refer to config/prompts.yaml for the active system prompt.
{context} {student_elo} {active_quiz_session}"""


async def analyze_node(state: AgentState) -> dict:
    """Phân tích query từ user và lấy context RAG."""
    query = state.get("query", "")

    # 1. Khởi tạo dịch vụ RAG và tìm kiếm slides tương đồng
    rag_service = RAGService()
    slides = rag_service.retrieve_relevant_slides(query, match_threshold=0.15, match_count=3)

    # 2. Format context từ slides tìm được
    formatted_context = rag_service.format_context(slides)

    # 3. Phân tích nội bộ (internal analysis logs)
    analysis = f"Tìm kiếm RAG hoàn tất. Tìm thấy {len(slides)} slide liên quan."

    # Lưu slides vào metadata để validator sử dụng sau
    metadata = state.get("metadata", {}) or {}
    metadata["retrieved_slides"] = slides

    return {"analysis": analysis, "context": formatted_context, "metadata": metadata}


async def respond_node(state: AgentState) -> dict:
    """Tạo response từ analysis, context và thực hiện validate citation."""
    query = state.get("query", "")
    context = state.get("context", "")
    metadata = state.get("metadata", {}) or {}
    retrieved_slides = metadata.get("retrieved_slides", [])
    error = state.get("error")

    if error:
        return {"response": f"Đã xảy ra lỗi hệ thống: {error}"}

    # Lấy thông tin học viên từ metadata
    student_profile = metadata.get("student_profile", {}) or {}
    student_elo = student_profile.get("elo", 1200)
    active_quiz_session = (
        "Đang trong bài kiểm tra (true)"
        if student_profile.get("active_quiz_session", False)
        else "Không trong bài kiểm tra (false)"
    )

    # Xây dựng Prompt hệ thống với context RAG và thông tin học viên
    system_prompt = SYSTEM_PROMPT.format(
        context=context, student_elo=student_elo, active_quiz_session=active_quiz_session
    )

    try:
        # Lấy thực thể LLM (gpt-4o-mini theo config)
        llm = get_llm()

        messages = [SystemMessage(content=system_prompt), HumanMessage(content=query)]

        # Gọi mô hình OpenAI thông qua ainvoke
        llm_response = await llm.ainvoke(messages)
        raw_text = llm_response.content

        # Kiểm định Citation chống hallucination
        intent = metadata.get("intent", "academic")
        validation_result = CitationValidator.validate_citations(raw_text, retrieved_slides, query, intent=intent)
        cleaned_text = validation_result["cleaned_text"]

        # Cập nhật kết quả kiểm định vào metadata để quan sát (Observability)
        new_metadata = {
            **metadata,
            "citation_validation": {
                "is_valid": validation_result["is_valid"],
                "invalid_citations": validation_result["invalid_citations"],
                "valid_citations": validation_result["valid_citations"],
            },
        }

        return {"response": cleaned_text, "metadata": new_metadata}
    except Exception as e:
        return {"response": f"Lỗi trong quá trình tạo câu trả lời: {e}", "error": str(e)}
