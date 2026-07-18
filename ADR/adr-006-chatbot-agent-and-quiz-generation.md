# ADR-006: Kiến trúc Agent Chatbot, Chốt chặn Học thuật (Guardrails) và Cơ chế Sinh câu hỏi Thích ứng

**Ngày:** 2026-06-12
**Trạng thái:** Accepted

## Bối cảnh (Context)

Dự án AI20K-C2-HE-01 cần giải quyết ba bài toán kiến trúc chính liên quan đến tương tác AI và học tập thích ứng:
1. **Kiến trúc Agent Chatbot:** Lựa chọn giữa mô hình Single Agent đơn giản và Multi-Agent phức tạp để cá nhân hóa cuộc hội thoại dựa trên Elo/BKT của học viên.
2. **Chốt chặn Học thuật (Academic Integrity Guardrails):** Ngăn chặn học sinh lách luật nhờ AI giải hộ bài tập Lab/về nhà mà vẫn giữ latency tối ưu cho mỗi lượt chat.
3. **Cơ chế Sinh câu hỏi Thích ứng (Quiz Generation):** Xác định thời điểm và cơ chế sinh câu hỏi thích ứng (trắc nghiệm, câu hỏi ngắn) từ tài liệu slide/PDF.

## Các lựa chọn (Alternatives)

### Quyết định 1: Kiến trúc Agent Chatbot
*   **Lựa chọn 1.1: Multi-Agent (chạy qua nhiều node chuyên biệt)**
    *   *Ưu điểm:* Phân tách rõ ràng hành vi, mỗi agent phụ trách một tác vụ (Router, Feynman Explainer, Socratic Tutor, Code Debugger).
    *   *Nhược điểm:* Latency rất lớn (mất 5-15s do phải qua nhiều bước LLM trung gian). Phức tạp trong việc quản lý state.
*   **Lựa chọn 1.2: Single Agent (Dynamic System Prompt)**
    *   *Ưu điểm:* Latency cực thấp (chỉ mất 1-2s cho 1 cuộc gọi LLM duy nhất). Hệ thống prompt linh hoạt, tự động chèn thông tin Elo/BKT của học viên trực tiếp vào System Prompt của mỗi lượt chat. Dễ triển khai và bảo trì (KISS).
    *   *Nhược điểm:* Cần thiết kế System Prompt cực kỳ chặt chẽ để đảm bảo AI tuân thủ đúng luật của từng chế độ học tập.

### Quyết định 2: Chốt chặn Học thuật (Guardrails)
*   **Lựa chọn 2.1: Sử dụng Guardrail Agent chuyên biệt (LLM Classifier)**
    *   *Ưu điểm:* Phân tích ngữ nghĩa thông minh, phát hiện hành vi giải hộ gián tiếp hoặc lách luật phức tạp.
    *   *Nhược điểm:* Tốn thêm 1 cuộc gọi LLM trước khi xử lý tin nhắn, làm tăng gấp đôi latency của mỗi lượt chat.
*   **Lựa chọn 2.2: Bộ lọc Regex kết hợp System Prompt Guardrail**
    *   *Ưu điểm:* Latency ở khâu check bằng 0. Tiết kiệm chi phí gọi LLM. Tích hợp trực tiếp các chỉ dẫn an toàn học thuật vào System Prompt của Agent chính để LLM tự chối giải hộ.
    *   *Nhược điểm:* Phụ thuộc vào chất lượng chỉ dẫn Prompt và bộ lọc từ khóa Regex.

### Quyết định 3: Cơ chế Sinh câu hỏi Thích ứng (Quiz Generation)
*   **Lựa chọn 3.1: Sinh câu hỏi động tại thời điểm chạy (On-the-fly at runtime)**
    *   *Ưu điểm:* Số lượng câu hỏi vô hạn, cá nhân hóa tuyệt đối theo ngữ cảnh tin nhắn học sinh vừa chat.
    *   *Nhược điểm:* 
        *   Latency cực kỳ lớn (mất 10-15s để LLM sinh câu hỏi và các mức gợi ý lúc làm bài).
        *   **Phá vỡ thuật toán hiệu chuẩn Elo câu hỏi:** Thuật toán Elo yêu cầu một câu hỏi phải được làm bởi nhiều học sinh khác nhau để ước lượng và hiệu chuẩn độ khó ($difficulty\_elo$). Nếu mỗi lần làm bài là một câu hỏi sinh mới duy nhất và không lặp lại, chúng ta không thể hiệu chuẩn được độ khó câu hỏi, dẫn đến không thể ước lượng chính xác Elo năng lực của học viên.
        *   Rủi ro sinh câu hỏi sai đáp án, trùng lặp hoặc hallucination không thể kiểm soát.
*   **Lựa chọn 3.2: Sinh trước tại thời điểm tải tài liệu (Pre-generated at ingestion time)**
    *   *Ưu điểm:* 
        *   Latency lúc làm bài bằng 0 (<100ms truy vấn từ DB).
        *   **Bảo toàn cơ sở toán học của Elo:** Cho phép nhiều học sinh cùng làm chung một câu hỏi để hiệu chuẩn chính xác độ khó.
        *   **Human-in-the-loop:** Giảng viên có thể xem trước, biên tập, chỉnh sửa câu hỏi ở trạng thái `draft` trước khi chuyển sang `published` để học sinh làm bài.
    *   *Nhược điểm:* Cần xây dựng pipeline xử lý tài liệu bất đồng bộ lúc ingest file.

## Quyết định (Decision)

1.  **Quyết định 1:** Chọn **Lựa chọn 1.2: Single Agent (Dynamic System Prompt)**.
2.  **Quyết định 2:** Chọn **Lựa chọn 2.2: Bộ lọc Regex + System Prompt Guardrail**.
3.  **Quyết định 3:** Chọn **Lựa chọn 3.2: Sinh trước tại thời điểm tải tài liệu (Pre-generated)**.

## Lý do (Rationale)

1.  **Trải nghiệm người dùng (Latency-first):** Trải nghiệm chat và làm bài tập cần phản hồi tức thời (<2 giây). Việc chọn Single Agent và Regex Guardrail giúp giảm thiểu tối đa các cuộc gọi LLM dư thừa.
2.  **Tính chính xác của mô hình toán học:** Việc sinh câu hỏi trước (Pre-generated) là điều kiện bắt buộc để chạy thuật toán hiệu chuẩn Elo độ khó của câu hỏi, từ đó giúp thuật toán gợi ý LinUCB hoạt động chính xác trong vùng ZPD.
3.  **Đảm bảo chất lượng giáo án:** Giảng viên cần có quyền kiểm soát nội dung thi/kiểm tra của học sinh. Cơ chế sinh trước cho phép giảng viên kiểm duyệt đề bài để tránh lỗi hallucination của AI.

## Hệ quả (Consequences)

*   Cần thiết kế System Prompt toàn diện cho Agent Chatbot hỗ trợ cả 5 chế độ hội thoại (Explain, Step-by-step hint, Debug code, Practice, Review submission).
*   Tầng ingestion cần cài đặt API và worker chạy nền (ví dụ: FastAPI Background Tasks) để tự động sinh 5-10 câu hỏi kèm 3 cấp độ gợi ý khi giảng viên tải lên một slide/PDF mới.
*   Bảng `app.questions` cần cột trạng thái `calibration_status` (`draft` / `published`) để quản lý luồng kiểm duyệt câu hỏi của giảng viên.
