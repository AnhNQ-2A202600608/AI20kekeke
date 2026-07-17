# Day 09 - Multi-Agent & Kết Nối Hệ Thống: MCP, A2A & LangGraph

> *"Hệ thống đã có agent rất giỏi. Nhưng bài toán đã quá lớn cho một agent. Làm thế nào để hệ thống vẫn rõ vai trò, dễ kiểm soát, và dễ mở rộng?"*
> **Câu trả lời:** Chia để trị. Chuyển đổi từ tư duy "một agent gánh tất cả" sang tư duy thiết kế hệ thống nhiều tác nhân (Multi-Agent), kết hợp chuẩn kết nối năng lực bên ngoài (Model Context Protocol - MCP) và giao tiếp rõ ràng giữa các agents (Agent-to-Agent - A2A).

---

### 1. Tổng quan: Từ Single-Agent lên Multi-Agent
- **Keywords:** Single-Agent, Multi-Agent System, God Agent, Context Bottleneck, Specialization, Parallelism, Fault Isolation, Systems Thinking.
- **Day 08 (Single-Agent RAG):** Một agent duy nhất đảm nhận toàn bộ luồng: lập kế hoạch, tìm kiếm tài liệu (retrieve), gọi công cụ (tool calls), tổng hợp dữ liệu (synthesis) và tự sửa lỗi.
- **Day 09 (Multi-Agent & Connected Systems):** 
  - **Phân chia vai trò:** Tách nhỏ năng lực thành các worker chuyên biệt (Retrieval Worker, Tool Worker, Synthesis Worker).
  - **Điều phối (Orchestration):** Dùng Supervisor điều hướng, lập kế hoạch và gom kết quả.
  - **Kết nối ổ cắm chuẩn:** Dùng Model Context Protocol (MCP) để cắm và chạy các tool/tài nguyên ngoài.
  - **Giao tiếp minh bạch:** Thiết lập message contract rõ ràng giữa các agent (A2A).

### 2. Bốn giới hạn cốt lõi của Single-Agent
1. **Context Bottleneck (Nghẽn ngữ cảnh):** Khi context window bị chiếm bởi chat history, prompts dài, và outputs từ tool (ví dụ: >12,000 tokens), LLM bắt đầu gặp lỗi "Lost-in-the-Middle" (quên dữ liệu ở giữa) hoặc call tool với context trống.
2. **Specialization Trade-off (Sự đánh đổi về chuyên môn hóa):** Một agent cố gắng làm quá nhiều việc sẽ có system prompt rất dài và phức tạp, dẫn đến tính bất ổn định cao ("giỏi đều = không giỏi cái nào").
3. **Parallelism hạn chế (Khó chạy song song):** Một agent hoạt động tuần tự khiến latency của hệ thống tăng cao khi xử lý các task độc lập.
4. **Reliability yếu (Độ tin cậy kém):** Không có cơ chế cô lập lỗi (fault isolation). Nếu agent chọn sai tool hoặc hiểu sai task ngay từ đầu luồng, toàn bộ flow sẽ đi chệch hướng mà không có điểm dừng.

### 3. Tư duy hệ thống (Systems Thinking)
- **Tư duy cũ:** "Làm sao để prompt cho agent thông minh hơn?", "Thêm thật nhiều tool cho agent". Dẫn đến **God Agent** khổng lồ và mờ mịt.
- **Tư duy mới:** "Task này gồm bao nhiêu trách nhiệm?", "Agent nào cần biết thông tin gì, vào lúc nào?", "Lỗi xảy ra ở đâu là ít thiệt hại nhất?". Tạo ra hệ thống rõ vai trò, dễ cô lập lỗi và dễ kiểm thử từng phần độc lập.

### 4. Multi-Agent Patterns
- **Supervisor-Worker (Supervisor-Worker):** Một supervisor trung tâm phân tích task, route tới đúng worker chuyên biệt và tổng hợp kết quả. Dễ kiểm soát, dễ trace nhưng supervisor có thể là bottleneck.
- **Pipeline (Chuỗi tuyến tính):** Đầu ra của agent A chuyển tiếp thành đầu vào của agent B. Flow cố định, dễ test từng bước nhưng kém linh hoạt và latency cộng dồn.
- **Debate (Biện luận/Phản biện):** Nhiều agent cùng giải một bài toán, phản biện chéo rồi vote/synthesize kết quả. Giảm thiểu góc tối (blind spots) nhưng tốn chi phí và khó tổng hợp.
- **Hierarchical (Phân cấp):** Supervisor lồng supervisor tạo thành nhiều tầng điều hành. Phù hợp với quy mô doanh nghiệp lớn (Enterprise Scale) nhưng rất phức tạp để thiết kế và debug.

### 5. MCP — Model Context Protocol
- **Keywords:** Open Protocol, client-server, USB analogy, Discovery Flow, Tools, Resources, Prompts.
- **Mục tiêu:** Chuẩn hóa giao tiếp giữa AI Agent (Client) và các công cụ/nguồn dữ liệu bên ngoài (Server). Loại bỏ việc viết adapter tùy biến cho từng API/Framework.
- **Analogy:** Giống như chuẩn USB cho phép máy tính cắm và chạy chuột, bàn phím, ổ cứng mà không cần cài driver riêng cho từng hãng.
- **Discovery Flow:** Kết nối -> Client gọi `tools/list` để đọc schemas -> Chọn tool -> Gọi `tools/call` kèm tham số -> Server trả kết quả chuẩn hóa JSON.

### 6. A2A — Agent to Agent Communication
- **Keywords:** Message Contract, Need-to-know Principle, Sync vs Async, Trust Boundary.
- **Sự khác biệt:** MCP dùng để gọi tool/năng lực thụ động (không tự quyết định). A2A dùng để phân việc cho agent khác (có khả năng tự suy luận và ra quyết định).
- **Message Contract:** Hợp đồng giao tiếp tối thiểu chứa: task (việc cần làm), context (dữ liệu cần thiết), expected_output (đầu ra mong đợi).
- **Nguyên tắc "Need to know":** Chỉ truyền context tối thiểu mà worker cần để làm việc, giảm token overhead và làm tăng tốc độ xử lý.

### 7. Orchestration & Observability với LangGraph
- **Keywords:** Node, Edge, Conditional Edge, Shared State, Human-in-the-Loop, Trace Log.
- **LangGraph:** Biến hệ thống multi-agent thành đồ thị trực quan: Node = Agent/Function, Edge = Luồng điều hướng (chuyển tiếp hoặc rẽ nhánh điều kiện), State = Bộ nhớ chung của cả đồ thị.
- **Human-in-the-Loop:** Cơ chế ngắt đồ thị (interrupt) để chờ con người phê duyệt (Human Review) cho các hành động rủi ro cao hoặc khi độ tự tin (confidence score) thấp.
- **Trace Log:** Trường bắt buộc trong shared state. Ghi nhận chi tiết: timestamp, agent_id, action, input/output summaries, status, và latency_ms để theo dõi đường đi của các quyết định.
