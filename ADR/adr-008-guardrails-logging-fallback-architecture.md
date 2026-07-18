# ADR-008: Thiết kế Xử lý Guardrails, Low-confidence Fallback và Feedback/Logging

**Ngày:** 2026-06-12
**Trạng thái:** Accepted

## Bối cảnh (Context)

Hệ thống Adaptive AI Tutor cần giải quyết 4 yêu cầu quan trọng trong tương tác của học sinh để đảm bảo an toàn học thuật và trải nghiệm cá nhân hóa:
1. **Intent Classification**: Phát hiện câu hỏi ngoài lề (off-scope) và tự động từ chối lịch sự.
2. **Cheating Guardrails**: Phát hiện học sinh gửi code bài tập/Lab để hỏi trực tiếp đáp án nguồn/giải mã hoàn chỉnh, tự động chuyển sang chế độ gợi ý Socratic Hint.
3. **Low-confidence Fallback**: Khi hệ thống RAG không tìm được nguồn tài liệu uy tín trong học liệu chính thức, hệ thống cần báo thiếu tài liệu và đề xuất các khái niệm liên quan thay vì tự bịa câu trả lời.
4. **Feedback & Audit Logging**: Tạo API thu nhận feedback (helpful/unhelpful) và ghi nhận tín hiệu học tập (learning signals) để giảng viên theo dõi.

Cần đưa ra quyết định kiến trúc về cách thiết kế luồng kiểm soát (control flow) trong LangGraph và cách lưu trữ dữ liệu hiệu quả nhằm giảm tối đa độ trễ (latency) và chi phí tính toán (compute cost).

## Các lựa chọn (Alternatives)

### Lựa chọn 1: LLM-only Classification & RAG
- Sử dụng LLM để phân loại toàn bộ mọi yêu cầu (intent, off-scope, cheating) và thực hiện RAG.
- **Ưu điểm**: Đơn giản trong cấu hình, xử lý được các ngữ cảnh linh hoạt và sắc thái tinh vi của câu hỏi học sinh.
- **Nhược điểm**: Độ trễ (latency) tăng cao do tốn thêm 1 lượt gọi LLM trước khi trả lời, Compute cost lớn (tiêu tốn OpenAI token), có xác suất phân loại sai.

### Lựa chọn 2: Hybrid Filter & Local Cache/DB (Đề xuất)
- Sử dụng cơ chế kết hợp:
  - **Fast Path (Rule-based)**: Chạy kiểm tra tĩnh trên CPU backend (regex, string matching) để phát hiện các mẫu gian lận hiển nhiên (chứa code block ` ``` ` kèm từ khóa nhạy cảm tiếng Việt như *"giải bài này"*, *"đáp án"*, *"cho xin code"*, v.v.). Nếu khớp, chuyển thẳng sang chế độ Socratic Hint mà không cần gọi LLM phân loại.
  - **Slow Path (LLM Intent Classifier)**: Chỉ kích hoạt nếu câu hỏi không vi phạm bộ lọc tĩnh, dùng LLM siêu nhẹ để gán nhãn câu hỏi (Explain, Hint, Debug_code, Practice, Review_submission, Off-scope).
  - **Low-confidence Fallback**: Đặt ngưỡng tương đồng cosine similarity là `0.70`. Nếu RAG vector search trả về kết quả dưới ngưỡng hoặc không có tài liệu, hệ thống tự động từ chối và truy vấn các khái niệm liên quan trong cùng khóa học làm gợi ý.
  - **Asynchronous Telemetry Logging**: Ghi log feedback và learning signals bất đồng bộ qua FastAPI `BackgroundTasks`.
- **Ưu điểm**:
  - Độ trễ của Fast Path gần như bằng 0ms.
  - Tiết kiệm token LLM đầu vào.
  - Không gây nghẽn luồng chatbot chính nhờ logging chạy nền.
  - Tránh triệt để việc LLM tự bịa câu trả lời khi thiếu tài liệu gốc.
- **Nhược điểm**: Phải xây dựng và cập nhật bộ Regex/từ khóa cục bộ trên backend.

## Quyết định (Decision)

Chọn **Lựa chọn 2: Hybrid Filter & Local Cache/DB**.

## Lý do (Rationale)

1. **Tối ưu hóa Latency & Compute**: Giúp chatbot phản hồi học sinh cực nhanh đối với các trường hợp gian lận rõ ràng mà không phải tiêu tốn tài nguyên gọi API LLM.
2. **Đảm bảo tính chính xác học thuật**: Việc chặn câu hỏi dưới ngưỡng similarity `0.70` và định hướng học sinh ôn tập khái niệm liên quan ngăn chặn tình trạng bịa kiến thức (hallucination), đảm bảo học sinh luôn học từ giáo trình chính thức của giảng viên.
3. **Hiệu năng hệ thống**: Tách biệt hoạt động ghi log/telemetry và lưu feedback sang chạy nền (`BackgroundTasks`), giữ cho phản hồi chat chính có thời gian phản hồi tối ưu nhất.

## Hệ quả (Consequences)

- Cần cập nhật cấu trúc LangGraph [graph.py](file:///d:/code/AI20kekeke/src/agents/graph.py) để chèn thêm các node `guardrail` (đứng đầu luồng) và `retrieve_context`.
- Cần mở rộng interfaces và database adapter trong [supabase_database.py](file:///d:/code/AI20kekeke/src/services/adaptive/supabase_database.py) để thực thi ghi dữ liệu feedback & learning signals chạy ngầm.
- Cần duy trì và cập nhật danh sách các từ khóa tiếng Việt phục vụ cho bộ lọc tĩnh dựa trên dữ liệu sử dụng thực tế.
