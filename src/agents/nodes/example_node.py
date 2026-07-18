"""
TÀI LIỆU THAM KHẢO ONLY (REFERENCE ONLY)
File này chứa ví dụ tham khảo cấu trúc cơ bản của một Node trong đồ thị LangGraph Agent.
Không sử dụng trực tiếp trong luồng chạy chính của ứng dụng.
"""

import logging

from langchain_core.messages import HumanMessage, SystemMessage

from src.agents.state import AgentState
from src.services.llm import get_llm

logger = logging.getLogger(__name__)


async def analyze_node(state: AgentState) -> dict:
    """Ví dụ về node phân tích trong đồ thị đại lý AI."""
    logger.info("Chạy analyze_node (Example)")
    query = state.get("query", "")
    return {"analysis": f"Phân tích truy vấn ví dụ: {query}"}


async def respond_node(state: AgentState) -> dict:
    """Ví dụ về node phản hồi trong đồ thị đại lý AI."""
    logger.info("Chạy respond_node (Example)")
    query = state.get("query", "")
    analysis = state.get("analysis", "")

    llm = get_llm()
    messages = [
        SystemMessage(content=f"System Context: {analysis}"),
        HumanMessage(content=query),
    ]
    response = await llm.ainvoke(messages)
    return {"response": response.content}
