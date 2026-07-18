# Giai đoạn 3: Tích hợp Widget Quiz tương tác

Giai đoạn này tập trung vào việc chuyển đổi các văn bản câu hỏi kiểm tra (Quiz) thô từ AI thành các card trắc nghiệm tương tác trực quan ngay trong bong bóng chat.

## Đề xuất Giải pháp Kỹ thuật

### 1. Nhận diện Quiz từ Luồng Chat (Regex / Parser)
- Khi AI trả về một câu hỏi kiểm tra dạng trắc nghiệm (MCQ) thông thường có định dạng:
  - Câu hỏi:...
  - A) ...
  - B) ...
  - C) ...
  - D) ...
- Bộ phân tích cú pháp (Parser) phía frontend sẽ tự động nhận diện mẫu định dạng này và chuyển đổi chuỗi văn bản thô thành một đối tượng dữ liệu cấu trúc Quiz:
  - `questionText`: Câu hỏi
  - `options`: Danh sách các đáp án lựa chọn A, B, C, D.

### 2. Render Card Quiz Tương Tác
- Thay vì hiển thị đoạn văn bản trắc nghiệm thô, chúng ta sẽ render thành một Card Quiz đẹp mắt:
  - Mỗi lựa chọn A, B, C, D là một nút bấm lớn, bo tròn, có phản hồi hover sinh động.
  - Khi học sinh click chọn một đáp án:
    - **Nếu đúng**: Đổi màu nền nút bấm sang xanh lá nhạt (`bg-emerald-50 border-emerald-500 text-emerald-700`) và hiển thị icon Checkmark.
    - **Nếu sai**: Đổi màu nền nút bấm đã chọn sang đỏ nhạt (`bg-rose-50 border-rose-500 text-rose-700`) và hiển thị icon X. Đáp án đúng thực tế sẽ được làm nổi bật viền nhẹ màu xanh để hướng dẫn học sinh.
    - **Vô hiệu hóa** các lựa chọn còn lại sau khi đã chọn để chống bấm nhiều lần.

### 3. Tương tác Thích Ứng (Adaptive Flow)
- Gửi kết quả lựa chọn của học sinh lên backend (hoặc cập nhật trực tiếp vào state quản lý ELO/Mastery trong BoundStore) để điều chỉnh mức độ khó dễ của các câu hỏi tiếp theo trên lộ trình học tập.

## Các file chỉnh sửa
- [socratic-chat-tab.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/socratic-chat-tab.tsx)

## Tiêu chí thành công
- Nhận diện chính xác cấu trúc trắc nghiệm từ nội dung phản hồi của AI.
- Người dùng chọn đáp án và thấy kết quả đúng/sai trực quan tức thì với hiệu ứng cao cấp.
