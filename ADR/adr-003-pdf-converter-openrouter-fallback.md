# ADR-003: Bổ sung lớp fallback OpenRouter trong chuyển đổi tài liệu PDF sang Markdown

**Ngày:** 2026-06-11
**Trạng thái:** Reviewed

## Bối cảnh (Context)

Hệ thống tải slide PDF tự động từ LMS cần chuyển đổi các tài liệu này sang định dạng Markdown chất lượng cao để phục vụ cho các tính năng tiếp theo của Adaptive Quiz và AI Tutor. 
Hiện tại, pipeline đang sử dụng trực tiếp Gemini API (model `gemini-2.5-flash`) thông qua SDK `google-genai` để thực hiện OCR và giữ nguyên cấu trúc slide. Tuy nhiên, nếu API này gặp lỗi (rate limit, hết hạn mức, lỗi mạng, v.v.), hệ thống chỉ có cơ chế fallback duy nhất là chuyển sang thư viện `pypdf` cục bộ. 
Việc fallback trực tiếp sang `pypdf` dẫn đến giảm sút nghiêm trọng chất lượng dữ liệu đầu ra vì `pypdf` chỉ trích xuất text thô sơ, không nhận diện được chữ trong hình ảnh, bảng biểu hoặc các sơ đồ cấu trúc. Do đó, cần có một lớp API vision OCR fallback có chất lượng tương đương nằm giữa Gemini API trực tiếp và `pypdf`.

## Các lựa chọn (Alternatives)

### Lựa chọn 1: Chỉ fallback trực tiếp sang pypdf (Hiện trạng)
- **Ưu điểm:** Đơn giản, không phát sinh chi phí API phụ, chạy offline hoàn toàn.
- **Nhược điểm:** Mất toàn bộ cấu trúc hình ảnh, bảng biểu và OCR chất lượng cao khi Gemini API gặp sự cố.

### Lựa chọn 2: Tích hợp OpenRouter API (model `google/gemini-2.5-flash`) làm lớp fallback trung gian
- **Ưu điểm:** 
  - Đảm bảo chất lượng chuyển đổi cao nhờ năng lực xử lý multimodal/OCR của Gemini 2.5 Flash.
  - Chi phí cực kỳ rẻ và độ trễ thấp (latency tối ưu).
  - Tách biệt hạ tầng API (kênh gọi qua OpenRouter khác với kênh gọi trực tiếp qua Google AI Studio), giúp tăng độ tin cậy của pipeline.
- **Nhược điểm:** Cần quản lý thêm cấu hình khóa API (`OPENROUTER_API_KEY`) và thực hiện mã hóa tài liệu PDF sang định dạng base64 trước khi gửi.

### Lựa chọn 3: Tích hợp các LLM Vision khác (như GPT-4o-mini qua OpenAI API)
- **Ưu điểm:** Độ ổn định và chất lượng tốt.
- **Nhược điểm:** Phức tạp hóa pipeline khi cần cài đặt thêm SDK của các nhà cung cấp khác, chi phí có thể cao hơn so với dòng model Gemini Flash.

## Quyết định (Decision)

Chọn **Lựa chọn 2: Tích hợp OpenRouter API (model `google/gemini-2.5-flash`) làm lớp fallback trung gian**.

Pipeline mới sẽ hoạt động theo trình tự 3 lớp:
1. **Lớp 1 (Google Gemini API):** Thử chuyển đổi bằng API trực tiếp thông qua `GEMINI_API_KEY`.
2. **Lớp 2 (OpenRouter API):** Nếu lớp 1 thất bại hoặc không cấu hình key, thử chuyển đổi qua OpenRouter với model `google/gemini-2.5-flash` sử dụng `OPENROUTER_API_KEY`.
3. **Lớp 3 (pypdf):** Nếu cả hai lớp trên đều thất bại, thực hiện trích xuất văn bản thô cục bộ bằng `pypdf`.

## Lý do (Rationale)

1. **Độ ổn định cao:** Đảm bảo hệ thống vẫn thu được dữ liệu slide dạng Markdown chất lượng cao (giữ nguyên bảng biểu, cấu trúc) ngay cả khi tài khoản Google AI Studio bị cấm hoặc quá hạn mức.
2. **Tối ưu chi phí & Hiệu năng:** Gemini 2.5 Flash là dòng model có hiệu năng xuất sắc và chi phí tối ưu trên OpenRouter, phù hợp cho bài toán fallback trung gian.
3. **Dễ dàng triển khai:** Tích hợp trực tiếp qua HTTP request (`requests` library trong Python) thông qua cơ chế base64 gửi file PDF của OpenRouter mà không cần cài đặt thêm SDK cồng kềnh.

## Hệ quả (Consequences)

- Cần cập nhật file cấu hình `.env` để hỗ trợ thêm biến môi trường `OPENROUTER_API_KEY`.
- Các file PDF kích thước lớn khi mã hóa base64 sẽ tiêu tốn thêm một lượng tài nguyên RAM nhỏ và băng thông mạng khi gửi request đến OpenRouter.
