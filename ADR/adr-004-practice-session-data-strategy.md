# ADR-004: Chiến lược phát triển dữ liệu và trì hoãn schema database cho Phòng luyện kỹ năng

**Ngày:** 2026-06-15
**Trạng thái:** Reviewed

## Bối cảnh (Context)

Hệ thống đang phát triển tính năng mới "Phòng luyện kỹ năng thích ứng" (Adaptive Practice Workspace). Tính năng này đòi hỏi khả năng theo dõi độ thành thạo (Mastery Score) dựa trên điểm Elo (đã quyết định trong ADR-002) và quản lý trạng thái phiên làm bài thích ứng (ZPD Canvas với thuật toán Bandit trong ADR-003), bao gồm cả tính năng tạm dừng và làm tiếp (Pause & Resume).

Trong giai đoạn đầu phát triển giao diện người dùng (Frontend UI/UX prototyping), luồng nghiệp vụ và cấu trúc câu hỏi có thể thay đổi liên tục. Việc thiết kế và triển khai ngay các bảng cơ sở dữ liệu (Supabase/PostgreSQL schema) và các file migration backend có thể gây ra những gánh nặng bảo trì không cần thiết, làm chậm tốc độ phát triển (velocity) và vi phạm triết lý thiết kế tối giản (**KISS & YAGNI**).

## Các lựa chọn (Alternatives)

### Lựa chọn 1: Thiết kế schema database hoàn chỉnh và triển khai migration backend ngay lập tức
- **Ưu điểm:** Có cấu trúc dữ liệu bền vững ngay từ đầu, kết nối được database thật.
- **Nhược điểm:** Mất thời gian đồng bộ giữa backend và frontend, khó thay đổi cấu trúc khi luồng UI có sự điều chỉnh trong quá trình demo, dễ phát sinh migration rác.

### Lựa chọn 2: Sử dụng Mock Data thuần túy không có ràng buộc kiểu dữ liệu
- **Ưu điểm:** Cực kỳ nhanh, không tốn tài nguyên.
- **Nhược điểm:** Code frontend dễ bị rối (spaghetti) vì thiếu định nghĩa kiểu (types), khi kết nối database thật sau này sẽ phải sửa lại phần lớn code component.

### Lựa chọn 3: Sử dụng Mock Data kết hợp định nghĩa sẵn TypeScript Interfaces ở Client
*Định nghĩa trước cấu trúc dữ liệu chuẩn (TypeScript Interfaces) cho mock data và lưu trữ phiên tạm thời qua LocalStorage/Zustand.*
- **Ưu điểm:** 
  - Đảm bảo tốc độ phát triển frontend cực nhanh, không phụ thuộc vào tiến độ làm database backend.
  - Định hình trước "hợp đồng dữ liệu" (Data Contract) rõ ràng, giúp việc kết nối database thật sau này rất mượt mà (chỉ cần thay đổi data fetching logic).
  - Cho phép hiện thực hóa và kiểm thử ngay tính năng "Tạm dừng & Làm tiếp" bằng cách lưu trữ session state trong LocalStorage.
- **Nhược điểm:** Phải viết thêm mock data JSON khớp với các Interface này để test.

## Quyết định (Decision)

Chọn **Lựa chọn 3: Sử dụng Mock Data kết hợp định nghĩa sẵn TypeScript Interfaces ở Client**.

## Lý do (Rationale)

1. **Tuân thủ KISS & YAGNI:** Tránh thiết kế schema database quá sớm khi nghiệp vụ chưa hoàn toàn chốt, giúp đội ngũ tập trung tối đa vào trải nghiệm người dùng (UX/UI).
2. **Kiến trúc bền vững (Future-proof):** Việc định nghĩa trước các Interfaces chuẩn như `Skill`, `MasteryStatus`, và `ActivePracticeSession` đóng vai trò như một tài liệu đặc tả cấu trúc dữ liệu cho backend sau này.
3. **Trải nghiệm thực chiến (Real experience):** Giúp học viên hoặc testers trải nghiệm đầy đủ tính năng lưu trạng thái làm bài (Pause & Resume) ở frontend thông qua LocalStorage mà không cần chờ tích hợp backend hoàn tất.

## Hệ quả (Consequences)

- Khai báo các TypeScript interfaces liên quan vào [types.ts](file:///d:/Project/Vin_AI/000%20Group%20Project/C2-App-125/frontend/lib/quiz/types.ts).
- Cần tạo các tệp tin mock dữ liệu kỹ năng dạng JSON để frontend nạp và chạy thử.
- Khi luồng UI đã ổn định và chốt phương án vận hành, sẽ tiến hành ánh xạ các Interface này thành cấu trúc bảng Supabase thực tế ở backend (tạo bảng `skills`, `user_skills_mastery`, `active_practice_sessions`).
