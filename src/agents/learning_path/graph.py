from langgraph.graph import END, StateGraph

from src.agents.learning_path.nodes.evaluation_critic_node import evaluation_critic_node
from src.agents.learning_path.nodes.fetch_and_parallel_node import fetch_and_parallel_node
from src.agents.learning_path.nodes.persist_node import persist_node
from src.agents.learning_path.state import LearningPathState


def build_learning_path_graph():
    """Xây dựng và biên dịch đồ thị LangGraph sinh lộ trình học tập thích ứng."""
    graph = StateGraph(LearningPathState)

    # 1. Thêm các Nodes xử lý
    graph.add_node("fetch_and_parallel", fetch_and_parallel_node)
    graph.add_node("evaluation_critic", evaluation_critic_node)
    graph.add_node("persist", persist_node)

    # 2. Thiết lập Entry Point
    graph.set_entry_point("fetch_and_parallel")

    # 3. Kết nối các Edges tuần tự (xử lý song song đã được đóng gói bên trong fetch_and_parallel)
    graph.add_edge("fetch_and_parallel", "evaluation_critic")
    graph.add_edge("evaluation_critic", "persist")
    graph.add_edge("persist", END)

    return graph.compile()


learning_path_agent = build_learning_path_graph()
