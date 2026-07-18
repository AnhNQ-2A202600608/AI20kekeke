# Giai đoạn 2: Hiển thị Logic suy nghĩ (Thinking) & Tools

Giai đoạn này tập trung vào việc phát triển trải nghiệm thị giác khi AI đang "suy nghĩ" hoặc "gọi công cụ", tương tự như cách Gemini và ChatGPT (o1/o3-mini) hiển thị.

## Đề xuất giao diện

### 1. Khối logic suy nghĩ (Thinking Block)
- **Cơ chế**: Khi AI nhận phản hồi và đang stream kết quả có phần suy nghĩ ẩn (thinking process), thay vì hiển thị text thô, chúng ta sẽ bọc phần này trong một khối Accordion.
- **Thiết kế**:
  - Tiêu đề: `Đang suy nghĩ...` hoặc `Suy nghĩ trong X giây` kèm icon loading quay nhẹ.
  - Khi click vào tiêu đề, khối sẽ mở ra hiển thị chi tiết các bước lập luận logic (chain of thought) với định dạng chữ nghiêng nhẹ, màu xám nhạt, có đường viền đứng bên trái (`border-l-2 border-primary-green/30 pl-3 text-stone-500 italic`).
  - Khi AI hoàn thành, khối này tự động thu gọn lại làm mặc định, chỉ để lại một tiêu đề nhỏ "Đã suy nghĩ xong" để giữ không gian chat gọn gàng.

### 2. Trạng thái thực thi công cụ (Tools Execution Logs)
- Khi chatbot kích hoạt RAG database lookup hoặc các tool khác (ví dụ: chạy code thử nghiệm):
  - Hiển thị một badge nhỏ hoạt họa: `🔧 Đang tìm kiếm học liệu...` hoặc `🖥️ Đang chạy thử code...`.
  - Bấm vào badge này sẽ mở ra một hộp thoại phụ hoặc khối text nhỏ hiển thị tham số truyền vào (input parameters) và kết quả trả về của tool (tool output) dạng block code.
  - Việc này giúp tăng tính minh bạch của AI (Explainable AI) và giúp học sinh hiểu được AI lấy dữ liệu từ slide nào, bài giảng nào để trả lời.

## Các file chỉnh sửa
- [socratic-chat-tab.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/socratic-chat-tab.tsx)

## Tiêu chí thành công
- Khối thinking có thể đóng/mở mượt mà.
- Hiển thị rõ các bước gọi tool và trích xuất dữ liệu của RAG trong quá trình AI sinh câu trả lời.
