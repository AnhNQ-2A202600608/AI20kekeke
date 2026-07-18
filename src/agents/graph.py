import re

from langgraph.graph import END, StateGraph

from src.agents.nodes.analyze_node import analyze_node
from src.agents.nodes.pedagogical_reflection_node import pedagogical_reflection_node
from src.agents.nodes.respond_general_node import respond_general_node
from src.agents.nodes.respond_node import respond_node
from src.agents.state import AgentState


def should_continue(state: AgentState) -> str:
    """Route based on intent and whether an error occurred during analysis."""
    if state.get("error"):
        return END

    metadata = state.get("metadata") or {}
    if metadata.get("intent") == "general" and not metadata.get("academic_integrity_risk"):
        return "respond_general"
    return "respond_academic"


def check_reflection(state: AgentState) -> str:
    """Quyết định đi tiếp tới kiểm định (pedagogical_reflection) hay kết thúc đồ thị (END)."""
    if state.get("error"):
        return END

    if state.get("reflection_feedback"):
        return "pedagogical_reflection"

    # Tối ưu hóa Option A: Bypass kiểm định nếu là câu hỏi xã giao/ngoài giáo trình (intent: general)
    metadata = state.get("metadata") or {}
    if metadata.get("academic_integrity_risk"):
        return "pedagogical_reflection"
    if metadata.get("intent") == "general":
        return END

    response = state.get("response", "")

    # Bộ lọc nhanh (Option A): Kiểm tra nếu không chứa code block hoặc chỉ dấu đáp án trắc nghiệm
    has_code = "```" in response
    has_mcq_answer = bool(
        re.search(
            r"(đáp án|dáp án|câu trả lời đúng|chọn đáp án|lựa chọn)\s*[:=]?\s*[A-D]",
            response,
            re.IGNORECASE,
        )
    )

    if not has_code and not has_mcq_answer:
        # Không nghi ngờ, kết thúc đồ thị ngay để tối ưu hóa độ trễ
        return END

    # Nghi ngờ vi phạm quy tắc sư phạm, chuyển sang kiểm định
    return "pedagogical_reflection"


def check_feedback(state: AgentState) -> str:
    """Quyết định viết lại câu trả lời hay kết thúc đồ thị dựa trên kết quả kiểm định."""
    if state.get("reflection_feedback") and state.get("reflection_attempts", 0) < 2:
        return "respond_academic"
    return END


def build_graph() -> StateGraph:
    graph = StateGraph(AgentState)

    # Thêm các Nodes
    graph.add_node("analyze", analyze_node)
    graph.add_node("respond_general", respond_general_node)
    graph.add_node("respond_academic", respond_node)
    graph.add_node("pedagogical_reflection", pedagogical_reflection_node)

    # Thiết lập Entry Point
    graph.set_entry_point("analyze")

    # Thiết lập các Edges liên kết
    graph.add_conditional_edges(
        "analyze",
        should_continue,
        {"respond_general": "respond_general", "respond_academic": "respond_academic", END: END},
    )

    # Nút respond_general kết thúc trực tiếp
    graph.add_edge("respond_general", END)

    graph.add_conditional_edges(
        "respond_academic", check_reflection, {"pedagogical_reflection": "pedagogical_reflection", END: END}
    )
    graph.add_conditional_edges(
        "pedagogical_reflection", check_feedback, {"respond_academic": "respond_academic", END: END}
    )

    return graph.compile()


agent = build_graph()
