# ADR-001: Tổ chức tài liệu và Quy trình Quyết định Kiến trúc (ADR)

**Ngày:** 2026-07-17
**Trạng thái:** Accepted

## Bối cảnh (Context)

Hiện tại, tài liệu dự án chưa được tổ chức một cách khoa học, các tài liệu hướng dẫn kỹ thuật quan trọng nằm rải rác trực tiếp ở thư mục `docs/`. Đồng thời, dự án chưa có cơ chế chuẩn để ghi lại các quyết định kỹ thuật lớn (như thay đổi database, cấu trúc thư mục, kiến trúc module, v.v.). Điều này làm giảm khả năng bảo trì và gây khó khăn cho các thành viên mới cũng như các AI coding agent trong việc nắm bắt bối cảnh dự án.

## Các lựa chọn thay thế (Alternatives)

### Lựa chọn 1: Giữ nguyên cấu trúc docs hiện tại
- **Ưu điểm:** Không cần thay đổi link dẫn, không tốn công dọn dẹp.
- **Nhược điểm:** Khó tra cứu, cấu trúc lộn xộn và không thể hiện được lịch sử phát triển của hệ thống.

### Lựa chọn 2: Tổ chức docs theo chuẩn C2 125 và thiết lập quy trình ADR
- **Ưu điểm:**
  - Cấu trúc thư mục con rõ ràng (`domain-knowledge/`, `engineering/`, `product/`).
  - Ghi nhận lịch sử quyết định thông qua các tài liệu ADR dạng Markdown độc lập, tăng tính minh bạch và khả năng bàn giao/duy trì dự án.
- **Nhược điểm:** Phải cập nhật lại các liên kết cũ trong các file `README.md`.

## Quyết định (Decision)

Chọn **Lựa chọn 2: Tổ chức docs theo chuẩn C2 125 và thiết lập quy trình ADR**. 

Thực hiện tạo thư mục `ADR/` ở thư mục gốc chứa các bản ghi quyết định kiến trúc và phân loại lại thư mục `docs/` thành các nhóm nhỏ phục vụ các mục đích riêng biệt.

## Lý do chọn lựa (Rationale)

1. Cấu trúc của dự án C2 125 đã chứng minh tính hiệu quả cao trong việc phân phối thông tin cho cả con người và AI agent.
2. Quy trình ADR giúp lưu lại bối cảnh lịch sử tại sao một quyết định kỹ thuật được đưa ra, tránh việc người sau lặp lại các lỗi hoặc thắc mắc không đáng có về kiến trúc code.
3. Chi phí thực hiện thấp và đem lại lợi ích lâu dài cho bảo trì dự án.

## Hệ quả (Consequences)

- Cần cập nhật lại tất cả liên kết (relative links) trong `docs/README.md` và `README.md` ở thư mục gốc.
- Các thành viên dự án và AI agent từ nay khi có các thay đổi kiến trúc lớn đều cần tạo một ADR mới tương ứng để ghi lại quyết định.
