# ADR-003: Thiết kế cấu trúc Prompting, Phương pháp Socratic, Guardrail và Kiểm định Citation của AI Tutor

**Ngày:** 2026-06-10
**Trạng thái:** Reviewed

## Bối cảnh (Context)

Hệ thống AI Tutor trong dự án AI20K-C2-HE-01 cần giải quyết ba thách thức lớn về mặt sư phạm và công nghệ:
1. **Gian lận học tập (Cheating)**: Học viên thường hỏi trực tiếp câu hỏi trắc nghiệm hoặc yêu cầu viết code hoàn chỉnh cho các bài lab/assignment/quiz, vi phạm tính trung thực học thuật và giảm hiệu quả tự học.
2. **Khả năng tiếp thu cá nhân hóa (ZPD - Zone of Proximal Development)**: Học viên có mức độ năng lực (Elo) khác nhau cần các phương pháp giải thích khác nhau (ví dụ: học viên yếu cần ví dụ trực quan/ẩn dụ đơn giản, học viên giỏi cần các câu hỏi tư duy tối ưu nâng cao).
3. **Độ tin cậy của RAG (Hallucination & Citation)**: AI có xu hướng tự bịa ra kiến thức hoặc dẫn nguồn không chính xác. Hệ thống cần cơ chế kiểm tra định dạng và tính xác thực của Citation (trích dẫn nguồn) một cách nghiêm ngặt.

Do đó, chúng ta cần đưa ra quyết định kiến trúc về cách thiết lập cấu trúc prompt, kịch bản gợi ý Socratic (Hint Ladder) và cơ chế tự động hóa kiểm định đầu ra trước khi chuyển tải kết quả tới Client.

## Các lựa chọn (Alternatives)

### Lựa chọn 1: Chỉ sử dụng Prompting tĩnh đơn giản (Single System Prompt)
- *Thiết lập một prompt dài yêu cầu AI không giải bài hộ và trích dẫn tài liệu.*
- **Ưu điểm**: Đơn giản, dễ setup, không phát sinh logic trung gian trên Backend/Worker.
- **Nhược điểm**: AI dễ bị phá vỡ guardrail (jailbreak), không linh hoạt thay đổi độ khó theo Elo của học viên, không thể kiểm tra citation tự động (dẫn đến trích dẫn sai định dạng hoặc nguồn ma).

### Lựa chọn 2: Sử dụng kiến trúc Agent động với LangGraph để duyệt từng bước
- *Dùng Agent để phân tích câu hỏi -> lấy dữ liệu -> tự kiểm định và sinh gợi ý Socratic qua nhiều vòng gọi LLM.*
- **Ưu điểm**: Linh hoạt cao, có thể tự sửa lỗi citation thông qua cơ chế phản hồi (reflection).
- **Nhược điểm**: Chi phí API cao, thời gian phản hồi (latency) rất lớn (thường mất 5-15 giây), thiết lập phức tạp cho MVP.

### Lựa chọn 3: Kết hợp Hybrid Prompting thích ứng Elo/ZPD + Socratic Hint Ladder + Rule-based Backend Citation Validator + Golden Tests tự động (Quyết định)
- *Thiết lập prompt có cấu trúc gồm các section rõ ràng; Backend chèn thông tin Elo của học viên để LLM điều chỉnh độ phức tạp giải thích; Backend cài đặt một Validator độc lập để kiểm định định dạng trích dẫn và đối chiếu với Vector DB context; Sử dụng bộ test tự động để đánh giá chất lượng prompt.*
- **Ưu điểm**: Tối ưu về latency và chi phí (chỉ cần 1-2 lần gọi LLM), đảm bảo tính chính xác của trích dẫn nhờ lớp validation bằng code cứng, dễ dàng kiểm thử chất lượng qua Golden Tests.
- **Nhược điểm**: Yêu cầu định nghĩa cấu trúc dữ liệu chặt chẽ và viết validator logic trên Backend.

## Quyết định (Decision)

Chọn **Lựa chọn 3: Kết hợp Hybrid Prompting thích ứng Elo/ZPD + Socratic Hint Ladder + Rule-based Backend Citation Validator + Golden Tests tự động**.

## Lý do (Rationale)

1. **Sư phạm hiệu quả (Socratic & ZPD)**: Thay vì đưa lời giải trực tiếp, thang gợi ý 4 bậc (Hint Ladder) và ZPD thích ứng đảm bảo học viên học theo tiến trình phù hợp nhất với trình độ thực tế của mình.
2. **An toàn và Tin cậy cao (Guardrails & Validator)**: Lớp Validator bằng Regex/Code chạy trực tiếp trên Backend giúp ngăn chặn triệt để hiện tượng AI bịa nguồn (hallucinate citations), đồng thời chặn đứng các câu trả lời chứa mã nguồn hoàn chỉnh hoặc đáp án trắc nghiệm lộ liễu.
3. **Phù hợp với MVP (KISS/YAGNI)**: Tránh được sự phức tạp của LangGraph Agent đa bước cho luồng chat cơ bản, giúp giảm latency cho người dùng và tiết kiệm tài nguyên API.
4. **Khả năng kiểm thử (Golden Tests)**: Bộ Golden Tests giúp các kỹ sư RAG có thể liên tục cải tiến prompt mà không lo ngại làm hỏng các tính năng an toàn hoặc làm mất khả năng Socratic.

## Hệ quả (Consequences)

- Payload gửi đến AI service cần đính kèm trạng thái học tập của học viên: `student_elo` và trạng thái `active_quiz_session`.
- Kết quả từ AI service cần được trả về dưới dạng có cấu trúc hoặc được phân tích qua lớp Parser/Validator trước khi lưu vào database và trả về client.
- Cần có cấu hình quy chuẩn định dạng trích dẫn cụ thể (ví dụ: `[Tên tài liệu, slide/trang X]`).
- Trường hợp AI vi phạm Validator hoặc Guardrail, Backend sẽ tự động fallback sang câu trả lời an toàn (Ví dụ: thông báo không tìm thấy trích dẫn chính thức và gợi ý học viên đọc tài liệu cụ thể).
