# Day 09 - Multi-Agent & MCP: Lab Integration Guide

## 1. Mục tiêu bài thực hành (Lab Objective)
Mục tiêu của Lab 09 là nâng cấp hệ thống RAG tĩnh từ Day 08 thành một hệ thống **Multi-Agent** động sử dụng **LangGraph** và **Model Context Protocol (MCP)**:
- **Supervisor Node:** Tiếp nhận câu hỏi, quyết định gọi worker phù hợp và tổng hợp kết quả cuối cùng.
- **Retrieval Worker Node:** Chuyên trách tìm kiếm dữ liệu (dense/hybrid search) từ Vector Database.
- **MCP Tool Worker Node:** Gọi công cụ ngoài qua cổng kết nối chuẩn MCP (ví dụ: tra cứu thời tiết hoặc tìm kiếm web).
- **Synthesis Worker Node:** Tiếp nhận dữ liệu thu thập được và soạn thảo câu trả lời hoàn chỉnh.
- **Trace Logs:** Ghi lại chi tiết đường đi của quyết định trong Shared State của đồ thị.

```
                  [ USER REQUEST ]
                         │
                         v
                ┌────────────────┐
                │   Supervisor   │ <────────────────┐
                └───────┬────────┘                  │
                        │ (Conditional Edge)        │
                        ├───────────────────────────┤
                        v                           v
              ┌──────────────────┐        ┌──────────────────┐
              │ Retrieval Worker │        │  MCP Tool Worker │
              └────────┬─────────┘        └────────┬─────────┘
                       │                           │
                       └─────────────┬─────────────┘
                                     │ (Unconditional Edge)
                                     v
                            ┌──────────────────┐
                            │ Synthesis Worker │
                            └────────┬─────────┘
                                     v
                              [FINAL ANSWER]
```

---

## 2. Bước 1: Khởi tạo Shared State Schema

Shared State đóng vai trò là bộ nhớ chung của toàn bộ đồ thị. Chúng ta cần định nghĩa một cấu trúc `TypedDict` rõ ràng:

```python
from typing import TypedDict, List, Dict, Any, Optional
from datetime import datetime

class AgentState(TypedDict):
    task: str                       # Yêu cầu gốc của User
    plan: List[str]                 # Các worker cần thực thi tiếp theo
    need_retrieval: bool            # Flag chỉ ra cần chạy Retrieval Worker
    need_tool: bool                 # Flag chỉ ra cần chạy MCP Tool Worker
    worker_results: Dict[str, Any]  # Chứa output của các worker
    final_answer: str               # Câu trả lời tổng hợp cuối cùng
    trace: List[Dict[str, Any]]     # Nhật ký chạy của các agent
    error: Optional[str]            # Lỗi cục bộ nếu có
```

---

## 3. Bước 2: Thiết kế các Worker Nodes

Mỗi Worker là một hàm Python nhận vào `AgentState`, xử lý độc lập và cập nhật kết quả của mình vào `State`.

### 2.1 Retrieval Worker
Nhiệm vụ: Tìm kiếm thông tin liên quan từ cơ sở dữ liệu.

```python
def retrieval_worker(state: AgentState) -> AgentState:
    print("\n--- [Running Retrieval Worker] ---")
    query = state["task"]
    
    # Thực hiện search (giả lập hoặc gọi ChromaDB thực tế từ Day 08)
    search_results = [
        {"content": "Học viên AI20K cần nộp đủ 10 deliverables cho Demo Day để đạt điểm tối đa.", "source": "guide_chapter_9.md"}
    ]
    
    # Ghi nhận kết quả vào state
    worker_results = dict(state.get("worker_results", {}))
    worker_results["retrieval"] = search_results
    
    # Tạo trace log entry
    trace_entry = {
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "agent": "retrieval_worker",
        "action": "search",
        "input": query,
        "output": f"Found {len(search_results)} chunks",
        "status": "ok"
    }
    
    return {
        **state,
        "worker_results": worker_results,
        "need_retrieval": False, # Đã chạy xong, gỡ flag
        "trace": state.get("trace", []) + [trace_entry]
    }
```

### 2.2 MCP Tool Worker (Kết nối capability ngoài)
Nhiệm vụ: Gọi một công cụ ngoài (giả lập kết nối qua giao thức MCP).

```python
def mcp_tool_worker(state: AgentState) -> AgentState:
    print("\n--- [Running MCP Tool Worker] ---")
    
    # Giả lập việc gọi một MCP Server để tra cứu thời tiết hoặc thông tin động
    # Cấu trúc arguments tương thích với schema công bố bởi MCP Server
    mcp_tool_result = {
        "location": "Hà Nội",
        "temperature": "32°C",
        "condition": "Nắng nóng gay gắt"
    }
    
    worker_results = dict(state.get("worker_results", {}))
    worker_results["mcp_tool"] = mcp_tool_result
    
    trace_entry = {
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "agent": "mcp_tool_worker",
        "action": "call_mcp_api",
        "input": "get_weather(location='Hà Nội')",
        "output": str(mcp_tool_result),
        "status": "ok"
    }
    
    return {
        **state,
        "worker_results": worker_results,
        "need_tool": False, # Đã chạy xong, gỡ flag
        "trace": state.get("trace", []) + [trace_entry]
    }
```

### 2.3 Synthesis Worker
Nhiệm vụ: Tổng hợp thông tin từ tất cả các worker trước đó để trả lời người dùng.

```python
def synthesis_worker(state: AgentState) -> AgentState:
    print("\n--- [Running Synthesis Worker] ---")
    
    retrieval_data = state["worker_results"].get("retrieval", [])
    mcp_data = state["worker_results"].get("mcp_tool", {})
    
    # Soạn thảo prompt cho LLM tổng hợp dữ liệu
    context = ""
    if retrieval_data:
        context += "Tài liệu nội bộ:\n" + "\n".join([r["content"] for r in retrieval_data]) + "\n"
    if mcp_data:
        context += f"Dữ liệu thời tiết hiện tại: {mcp_data['location']} - {mcp_data['temperature']} ({mcp_data['condition']})\n"
        
    # Giả lập gọi LLM để sinh câu trả lời grounded
    final_answer = f"Dựa trên tài liệu: {context}\nHy vọng thông tin này giúp ích cho bạn!"
    
    trace_entry = {
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "agent": "synthesis_worker",
        "action": "synthesize",
        "input": f"Context length: {len(context)} chars",
        "output": "Final answer generated",
        "status": "ok"
    }
    
    return {
        **state,
        "final_answer": final_answer,
        "status": "done",
        "trace": state.get("trace", []) + [trace_entry]
    }
```

---

## 4. Bước 3: Xây dựng Supervisor Node và Router

Supervisor đóng vai trò bộ não lập kế hoạch điều hướng luồng chạy.

```python
import json
from openai import OpenAI

client = OpenAI()

def supervisor_node(state: AgentState) -> AgentState:
    print("\n--- [Running Supervisor Node] ---")
    task = state["task"]
    
    # Hệ thống prompt chỉ dẫn Supervisor phân tích yêu cầu
    system_prompt = """Bạn là Supervisor điều phối hệ thống trợ lý AI.
Nhiệm vụ của bạn là đọc yêu cầu người dùng và quyết định:
1. Có cần tra cứu tài liệu hướng dẫn học tập / chính sách không? (need_retrieval)
2. Có cần gọi công cụ lấy thông tin thời tiết bên ngoài không? (need_tool)

Trả về kết quả dưới dạng JSON duy nhất:
{
  "need_retrieval": true/false,
  "need_tool": true/false,
  "reason": "Giải thích lý do lựa chọn"
}"""

    # Gọi LLM với cấu trúc JSON Output
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": task}
        ],
        response_format={"type": "json_object"}
    )
    
    decision = json.loads(response.choices[0].message.content)
    print(f"Supervisor Decision: {decision}")
    
    trace_entry = {
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "agent": "supervisor",
        "action": "route_planning",
        "input": task,
        "output": f"Route to: retrieval={decision['need_retrieval']}, tool={decision['need_tool']}",
        "status": "ok"
    }
    
    return {
        **state,
        "need_retrieval": decision["need_retrieval"],
        "need_tool": decision["need_tool"],
        "trace": state.get("trace", []) + [trace_entry]
    }

# Hàm điều hướng điều kiện (Conditional Routing)
def route_decision(state: AgentState) -> str:
    if state["need_retrieval"]:
        return "retrieval_worker"
    if state["need_tool"]:
        return "mcp_tool_worker"
    return "synthesis_worker"
```

---

## 5. Bước 4: Lắp ghép đồ thị LangGraph (Orchestration)

Sau khi định nghĩa đầy đủ các nodes và edges, tiến hành khởi tạo và biên dịch đồ thị:

```python
from langgraph.graph import StateGraph, END

# 1. Khởi tạo đồ thị với State Schema
workflow = StateGraph(AgentState)

# 2. Thêm các Node vào đồ thị
workflow.add_node("supervisor", supervisor_node)
workflow.add_node("retrieval_worker", retrieval_worker)
workflow.add_node("mcp_tool_worker", mcp_tool_worker)
workflow.add_node("synthesis_worker", synthesis_worker)

# 3. Thiết lập điểm bắt đầu chạy
workflow.set_entry_point("supervisor")

# 4. Thêm Conditional Edges rẽ nhánh động từ Supervisor
workflow.add_conditional_edges(
    "supervisor",
    route_decision,
    {
        "retrieval_worker": "retrieval_worker",
        "mcp_tool_worker": "mcp_tool_worker",
        "synthesis_worker": "synthesis_worker"
    }
)

# 5. Các Worker chạy xong sẽ tự động quay lại Supervisor để check hoặc đi tiếp
# Trong graph đơn giản này, các worker sau khi cập nhật dữ liệu sẽ đi thẳng tới Synthesis
workflow.add_edge("retrieval_worker", "synthesis_worker")
workflow.add_edge("mcp_tool_worker", "synthesis_worker")
workflow.add_edge("synthesis_worker", END)

# 6. Biên dịch đồ thị
app_graph = workflow.compile()
```

---

## 6. Bước 5: Chạy thử và Đọc nhật ký quyết định (Trace Verification)

Chạy thử đồ thị với yêu cầu cần tra cứu chính sách:

```python
# Chạy thử luồng
inputs = {"task": "Tôi cần biết tài liệu nộp cho Demo Day gồm những gì?", "trace": []}
result = app_graph.invoke(inputs)

print("\n" + "="*50)
print("KẾT QUẢ CUỐI CÙNG:")
print(result["final_answer"])
print("="*50)

print("\nNHẬT KÝ THỰC THI (TRACE LOGS):")
for entry in result["trace"]:
    print(f"[{entry['timestamp']}] {entry['agent']} ── {entry['action']} ──> {entry['output']}")
```

### Kết quả mong đợi trong Console (Trace Output)
```text
[20:15:30] supervisor ── route_planning ──> Route to: retrieval=True, tool=False
[20:15:31] retrieval_worker ── search ──> Found 1 chunks
[20:15:32] synthesis_worker ── synthesize ──> Final answer generated
```

---

## 7. Checklist nộp bài Lab 9 (Deliverables Rubric)

Để đạt điểm tối đa (100% xuất sắc), bài nộp của học viên cần đáp ứng:

- [ ] **Phân vai rõ ràng:** Có ít nhất 1 Supervisor và 2 Workers hoạt động độc lập, không bị chồng chéo nhiệm vụ (tránh lỗi God Supervisor).
- [ ] **State Schema hoàn chỉnh:** Định nghĩa đầy đủ trường dữ liệu dùng chung, đặc biệt là trường `trace: list` để ghi nhận nhật ký chạy.
- [ ] **Kết nối MCP:** Có ít nhất 1 Worker gọi năng lực bên ngoài theo giao tiếp chuẩn hóa JSON (chấp nhận mock interface hoặc gọi API thật).
- **Quality Trace:** Trace logs hiển thị rõ ràng thứ tự chạy của các tác nhân, thời gian thực thi, và tóm tắt đầu vào/đầu ra của từng agent.
- **Graceful Failures:** Đồ thị xử lý lỗi an toàn (ví dụ: khi tool lỗi, node trả về fallback thay vì crash ứng dụng).
- **Conditional Routing:** Logic điều hướng được triển khai tường minh bằng code Python (`add_conditional_edges`) thay vì viết prompt điều hướng dài trong LLM.
