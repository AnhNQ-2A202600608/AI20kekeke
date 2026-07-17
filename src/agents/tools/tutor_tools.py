"""
Module tutor_tools định nghĩa các công cụ (tools) thực tế cho AI Tutor Agent trong hệ thống LangGraph.
"""

import ast
import logging
import operator

from langchain_core.tools import tool

from src.services.rag import RAGService

logger = logging.getLogger(__name__)

# Safe operator mapping for calculator
_SAFE_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}


def _eval_node(node: ast.AST) -> float:
    """Đánh giá đệ quy các nút AST toán học một cách an toàn."""
    if isinstance(node, ast.Constant):
        if isinstance(node.value, (int, float)):
            return node.value
        raise ValueError(f"Kiểu hằng số không được hỗ trợ: {type(node.value)}")
    elif isinstance(node, ast.UnaryOp):
        op_func = _SAFE_OPERATORS.get(type(node.op))
        if op_func is None:
            raise ValueError(f"Toán tử không được hỗ trợ: {type(node.op).__name__}")
        return op_func(_eval_node(node.operand))
    elif isinstance(node, ast.BinOp):
        op_func = _SAFE_OPERATORS.get(type(node.op))
        if op_func is None:
            raise ValueError(f"Toán tử không được hỗ trợ: {type(node.op).__name__}")
        return op_func(_eval_node(node.left), _eval_node(node.right))
    else:
        raise ValueError(f"Biểu thức không được hỗ trợ: {type(node).__name__}")


@tool
def calculate(expression: str) -> str:
    """Tính toán biểu thức toán học một cách an toàn (tránh các lỗ hổng bảo mật của hàm eval).

    Hỗ trợ các toán tử cơ bản: +, -, *, /, //, %, ** và các dấu ngoặc đóng mở.

    Args:
        expression: Biểu thức toán học dạng chuỗi cần tính (ví dụ: "2 * (3.5 + 4.5)").

    Returns:
        Kết quả tính toán dưới dạng chuỗi, hoặc thông báo lỗi nếu biểu thức không hợp lệ.
    """
    try:
        tree = ast.parse(expression, mode="eval")
        result = _eval_node(tree.body)
        return str(result)
    except Exception as e:
        return f"Lỗi tính toán biểu thức: {str(e)}"


@tool
def retrieve_course_material(query: str, concept_id: str = None, course_id: str = None) -> str:
    """Tìm kiếm nội dung tài liệu học tập chính thống (PDF/Slides) của khóa học liên quan đến từ khóa.

    Dùng khi học sinh cần giải thích khái niệm học thuật, giải thuật hoặc kiến thức có trong chương trình học.

    Args:
        query: Từ khóa hoặc câu hỏi cần tìm trong slide bài giảng.
        concept_id: ID khái niệm (optional) để khoanh vùng tài liệu chính xác hơn.
        course_id: ID khóa học (optional) để giới hạn tìm kiếm trong khóa học cụ thể.

    Returns:
        Nội dung văn bản tổng hợp từ các slide bài giảng phù hợp nhất.
    """
    try:
        rag_service = RAGService()
        import asyncio

        try:
            # Chạy logic async an toàn từ cả môi trường sync và async
            loop = asyncio.get_running_loop()
            if loop.is_running():
                # Để tránh deadlock khi loop chạy trên cùng thread hiện tại,
                # thực thi coroutine trên một thread khác với event loop độc lập.
                import concurrent.futures

                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                    slides = executor.submit(
                        asyncio.run,
                        rag_service.aretrieve_relevant_slides(query, concept_id=concept_id, course_id=course_id),
                    ).result()
            else:
                slides = rag_service.retrieve_relevant_slides(query, concept_id=concept_id, course_id=course_id)
        except RuntimeError:
            # Không có loop nào đang chạy, gọi sync fallback
            slides = rag_service.retrieve_relevant_slides(query, concept_id=concept_id, course_id=course_id)

        if not slides:
            return "Không tìm thấy nội dung tài liệu phù hợp trong giáo trình."
        return rag_service.format_context(slides)
    except Exception as e:
        logger.error(f"Lỗi RAG qua Tool retrieve_course_material: {e}", exc_info=True)
        return f"Lỗi hệ thống khi truy vấn học liệu: {str(e)}"
