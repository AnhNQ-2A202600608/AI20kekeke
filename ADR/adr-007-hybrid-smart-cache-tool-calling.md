# ADR-007: Hybrid Smart Cache và Agent Tool-Calling trong quản lý chỉ số cá nhân hóa

**Ngày:** 2026-06-12  
**Trạng thái:** Accepted  

## Bối cảnh (Context)

Hệ thống AI Tutor sử dụng mô hình học tập thích ứng (Adaptive Learning Engine) để điều chỉnh hệ thống prompt sư phạm (Scaffolding Rules) và chế độ hoạt động (Explain, Practice, Hint, Debug) cho từng học sinh dựa trên hai chỉ số chính:
1. **Elo score** (độ khó kiến thức phù hợp).
2. **BKT mastery probability** (xác suất thành thạo các khái niệm bài học).

Vấn đề nảy sinh trong việc quản lý và cập nhật các chỉ số này khi học sinh tương tác với Chatbot:
- **Nếu luôn luôn truy vấn trực tiếp từ database (Supabase/Postgres) trước mỗi lượt chat:** Độ trễ (latency) của hệ thống sẽ tăng cao do các truy vấn đồng thời và kết nối mạng đến DB từ API.
- **Nếu chỉ đọc từ Cache (Redis/InMemory) với TTL dài (ví dụ: 5-10 phút):** Dữ liệu có nguy cơ bị cũ (stale) khi học sinh thực hiện các bài Quiz hoặc thực hành Lab ở một tab trình duyệt khác, làm giảm tính cá nhân hóa của AI Tutor khi trò chuyện.

Do đó, cần có cơ chế quản lý dữ liệu linh hoạt, vừa đảm bảo hiệu năng tối đa (độ trễ thấp), vừa đảm bảo dữ liệu luôn được cập nhật chính xác khi cần thiết.

## Các lựa chọn (Alternatives)

### Lựa chọn 1: Chỉ Pre-fetching qua Cache (Pure Cache Read)
*   **Mô tả:** Đọc từ Cache ở API router trước khi gọi Agent. Nếu Cache miss thì đọc từ DB và lưu lại vào Cache với TTL cố định.
*   **Ưu điểm:** Tối ưu hóa latency cực tốt (phần lớn lượt chat chỉ mất <10ms đọc cache).
*   **Nhược điểm:** Hoàn toàn mất khả năng đồng bộ tức thời nếu học sinh vừa làm xong bài tập bên ngoài hệ thống chat. Agent không có cách nào cập nhật thông tin mới nhất.

### Lựa chọn 2: Luôn luôn gọi Tool truy vấn DB (Always Tool-Calling)
*   **Mô tả:** API không tải trước chỉ số. Khi bắt đầu chạy LangGraph, Agent sẽ luôn kích hoạt một tool (`get_student_metrics`) để truy cập DB lấy dữ liệu mới nhất.
*   **Ưu điểm:** Dữ liệu luôn mới 100%.
*   **Nhược điểm:** LLM luôn phải thực hiện một lượt suy nghĩ (thought loop) bổ sung cho tool-calling ở mỗi câu chat. Điều này làm tăng gấp đôi chi phí token và tăng thêm 1.5 - 3 giây độ trễ cho người dùng.

### Lựa chọn 3: Hybrid Smart Cache (API Pre-fetching kết hợp Agent Tool-Calling tự quyết định)
*   **Mô tả:** 
    1. API Router thực hiện đọc từ Cache (mặc định) và đưa thông tin này vào `AgentState` cùng với nhãn thời gian `last_updated_at`.
    2. Cung cấp cho Agent một tool có tên `refresh_student_profile`.
    3. Thiết lập System Prompt chỉ dẫn Agent: Nếu câu hỏi của người dùng có chứa từ khóa thể hiện việc họ vừa hoàn thành bài tập (ví dụ: "mình vừa làm xong quiz", "mình vừa hoàn thành bài lab"), hoặc nếu người dùng hỏi trực tiếp về điểm số/tiến độ mới nhất, Agent sẽ tự động quyết định gọi tool `refresh_student_profile` để kéo thông tin mới nhất từ DB và cập nhật lại state.
*   **Ưu điểm:** 
    - Giữ được độ trễ thấp (latency < 10ms ở API level) đối với 95% lượt trò chuyện thông thường.
    - Linh hoạt tự sửa lỗi (self-correcting) khi thông tin thực tế thay đổi.
*   **Nhược điểm:** Tăng nhẹ độ phức tạp trong việc xây dựng LangGraph (cần định nghĩa ToolNode và điều kiện chuyển hướng `tools_condition`) cùng prompt chỉ dẫn cho Agent.

## Quyết định (Decision)

Chọn **Lựa chọn 3: Hybrid Smart Cache (Pre-fetching mặc định kết hợp Agent Tool-Calling)**.

## Lý do (Rationale)

1. **Hiệu năng & Trải nghiệm:** Chatbot cần phản hồi nhanh chóng nhất có thể. Phương án Hybrid bảo toàn hiệu năng của Cache cho các lượt trò chuyện thông thường.
2. **Khả năng tự thích ứng (Adaptive Capability):** Agent có khả năng tự nhận diện bối cảnh để quyết định việc truy vấn sâu. Điều này giúp hệ thống thông minh hơn, tránh lãng phí tài nguyên truy vấn DB không cần thiết.
3. **Tương thích tốt với LangGraph:** Việc tích hợp một ToolNode trong LangGraph là mô hình tiêu chuẩn, dễ bảo trì và mở rộng thêm các tool khác sau này (ví dụ: RAG search, calculator).

## Hệ quả (Consequences)

- **Cấu trúc LangGraph:** Cần cập nhật `src/agents/graph.py` để bổ sung node Tools và cạnh điều kiện đi kèm.
- **System Prompt:** Cần tinh chỉnh trong `src/agents/nodes/example_node.py` để hướng dẫn LLM cách đánh giá tính hợp lệ của cache.
- **Đồng bộ ngược:** Khi Agent thực hiện cập nhật profile học sinh thông qua tool, hệ thống phải cập nhật lại Cache và lên lịch ghi nền (FastAPI BackgroundTasks) xuống database để đảm bảo tính nhất quán dữ liệu.
