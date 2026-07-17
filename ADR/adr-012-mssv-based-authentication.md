# ADR-012: Authentication via Full Name and Student ID (MSSV)

**Ngày:** 2026-06-16
**Trạng thái:** Reviewed

## Bối cảnh (Context)

Hệ thống cần cung cấp giao diện đăng nhập tối giản và thân thiện cho sinh viên và các lập trình viên phát triển (dev accounts). Thay vì sử dụng email/password truyền thống (yêu cầu quản lý mật khẩu phức tạp, cơ chế khôi phục mật khẩu và tăng rủi ro bảo mật nếu mật khẩu yếu), chúng ta chọn đăng nhập thông qua:
- **Họ và tên** (Trùng khớp trong cơ sở dữ liệu).
- **Mã số sinh viên (MSSV)** (Bắt buộc theo định dạng bảo mật `2A2026` + 5 chữ số).

Đồng thời, định dạng MSSV này không được hiển thị trực tiếp ra ngoài giao diện (ví dụ: placeholder, label hướng dẫn định dạng) để giữ độ bảo mật tương đối, tránh bị quét (brute-force) hàng loạt.

## Các lựa chọn (Alternatives)

### Lựa chọn 1: Email + Password truyền thống
- Ưu điểm: Rất phổ biến, thư viện hỗ trợ sẵn.
- Nhược điểm: Phức tạp hóa luồng đăng ký học viên (cần thiết lập mật khẩu ban đầu), mất nhiều thời gian phát triển và không đồng bộ tốt với danh sách sinh viên sẵn có của các khóa học Bootcamp.

### Lựa chọn 2: Đăng nhập bằng mã MSSV + Họ tên (Hệ thống tự nhận diện định dạng)
- Ưu điểm: Sinh viên chỉ cần điền đúng Họ tên và MSSV để vào học. Việc kiểm tra định dạng MSSV (chỉ chấp nhận định dạng `2A2026xxxxx`) được thực hiện ngầm bằng RegEx ở cả Client và Server.
- Nhược điểm: Dễ bị bruteforce nếu không giới hạn rate limit.

## Quyết định (Decision)

Chọn **Lựa chọn 2**.
Đồng thời áp dụng các biện pháp bảo mật bổ sung:
1. Thêm cột `mssv` dạng `text UNIQUE` vào bảng `app.users`.
2. Tạo thêm role `dev` trong database và seed trước 3 tài khoản phát triển (`2A202600001` đến `2A202600003`) để test.
3. Không hiển thị regex/format gợi ý trên giao diện đăng nhập (tránh lộ cấu trúc mã sinh viên).
4. Phản hồi lỗi chung chung: *"Họ tên hoặc mã số sinh viên không chính xác"* cho cả hai trường hợp định dạng MSSV sai hoặc không tìm thấy tài khoản.

## Lý do (Rationale)

- **UX Tối giản:** Cực kỳ nhanh gọn cho sinh viên Bootcamp, không cần nhớ mật khẩu.
- **Dễ quản lý:** Giảng viên chỉ cần import danh sách Họ tên + MSSV là sinh viên có thể đăng nhập ngay mà không cần kích hoạt qua email.
- **Bảo mật ngầm (Invisible Validation):** Hạn chế tối đa thông tin lộ ra ngoài về cấu trúc MSSV nhưng vẫn đảm bảo tính đúng đắn của dữ liệu đầu vào.
