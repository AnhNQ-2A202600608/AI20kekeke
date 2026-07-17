from langchain_core.messages import HumanMessage, SystemMessage

from src.agents.state import AgentState
from src.services.citation_validator import CitationValidator
from src.services.llm import get_llm
from src.services.rag import RAGService

SYSTEM_PROMPT = """Bạn là một Gia sư AI cá nhân hóa (AI Tutor) xuất sắc tại Đại học VinUniversity.
Nhiệm vụ của bạn là hỗ trợ sinh viên học tập theo phương pháp Socratic (Socratic ladder).

QUY TẮC SƯ PHẠM QUAN TRỌNG:
1. KHÔNG BAO GIỜ cung cấp lời giải trực tiếp, mã nguồn code hoàn chỉnh, hoặc đáp án trực tiếp cho bài tập/assignment/quiz.
2. Sử dụng thang gợi ý Socratic (Hint Ladder) gồm 4 bậc tùy theo câu hỏi và mức độ hiểu bài của sinh viên:
   - Bậc 1: Gợi ý khái niệm tổng quan hoặc sử dụng ẩn dụ/ví dụ thực tế trực quan để sinh viên nắm bắt bản chất.
   - Bậc 2: Định hướng sinh viên đọc phần cụ thể của slide bài học trong context (ví dụ: chỉ ra slide chứa công thức hoặc hình vẽ cần xem).
   - Bậc 3: Đưa ra câu hỏi gợi mở tư duy hoặc gợi ý mã giả (pseudocode), hướng dẫn thuật toán cơ bản.
   - Bậc 4: Hướng dẫn phân tích logic từng bước để sinh viên tự suy luận ra đáp án.
3. Luôn luôn trích dẫn nguồn (citation) từ học liệu tham khảo được cung cấp bên dưới.
4. Định dạng trích dẫn BẮT BUỘC: Bạn chỉ được trích dẫn bằng cách chèn tag dạng `[Tên tài liệu, Slide X]` (ví dụ: `[Day10 data pipeline observability E402, Slide 3]`) tại vị trí thông tin được sử dụng. Không tự bịa ra tài liệu hoặc slide không có trong phần học liệu tham khảo.

[THÔNG TIN HỌC VIÊN HIỆN TẠI]
- Trình độ năng lực (Elo): {student_elo}
- Trạng thái kiểm tra (Active Quiz): {active_quiz_session}

HỌC LIỆU THAM KHẢO CHÍNH THỨC:
{context}
"""


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
