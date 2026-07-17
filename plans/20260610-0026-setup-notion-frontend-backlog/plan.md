# Kế hoạch Triển khai: Thiết lập Hệ thống Quản lý Notion OS cho Frontend (Vibecoding Style)

Tối ưu hóa quy trình theo dõi tiến độ và quản lý linh hoạt các tác vụ Frontend (FE) trực tiếp trên Notion. Tập trung vào việc giữ các Task ở cấp độ **Tính năng / Trang màn hình lớn** (High-level Features/Screens) để phù hợp với tốc độ phát triển nhanh (Vibecoding), tránh phân rã vụn vặt làm chậm tiến trình phát triển.

## Proposed Changes

### Notion OS Configuration & Properties Update

#### [MODIFY] Backlog & Quản lý công việc (ID: `37afecf3-5a15-8168-a575-fbcf208fdbe2`)
Cập nhật và thêm các trường thông tin phục vụ phân loại lớn:
- **Area**: Kiểu `select` (`Frontend`, `Backend`, `AI-RAG`, `Data`, `Docs`, `UX`)
- **Component**: Kiểu `select` (`Chat Tutor`, `Quiz`, `Dashboard`, `Auth`, `Design System`)
- **Type**: Kiểu `select` (`Feature`, `UI Polish`, `Bug`, `Research`)
- **Screen/Page**: Kiểu `select` (`Student Dashboard`, `Adaptive Quiz`, `Socratic Chat RAG`, `Teacher Ingestion & Audit`, `Login/Auth`)

#### [NEW] Design Tokens & Components Inventory (Tạo dưới page `4. Frontend Workspace` ID: `37afecf3-5a15-8186-8e61-c48281b578d0`)
Tạo Database để quản lý các mẫu thiết kế và token UI dùng chung:
- **Mã Token/Component**: Kiểu `title` (Primary key)
- **Tên**: Kiểu `rich_text`
- **Type**: Kiểu `select` (`Token`, `Component`, `Pattern`)
- **Status**: Kiểu `select` (`Proposed`, `Approved`, `Implemented`, `Deprecated`)
- **Used In**: Kiểu `multi_select` (`Student Dashboard`, `Adaptive Quiz`, `Socratic Chat RAG`, `Teacher Ingestion & Audit`, `Login/Auth`)
- **Code Path**: Kiểu `rich_text`
- **Design Note**: Kiểu `rich_text`
- **Related Backlog Task**: Kiểu `relation` (Liên kết với Backlog Database)

#### [NEW] Screen/Page Status (Tạo dưới page `4. Frontend Workspace` ID: `37afecf3-5a15-8186-8e61-c48281b578d0`)
Tạo Database giám sát trạng thái hoàn thiện của các trang màn hình chính:
- **Page**: Kiểu `title` (Primary key)
- **Status**: Kiểu `select` (`Not Started`, `Wireframe`, `In Progress`, `QA`, `Done`)
- **Route**: Kiểu `rich_text`
- **Owner**: Kiểu `rich_text`
- **Related User Story**: Kiểu `relation` (Liên kết với User Story Database)
- **Related Backlog Tasks**: Kiểu `relation` (Liên kết với Backlog Database)

### Registry & Local Docs Updates

#### [MODIFY] [notion-address-registry.md](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/docs/notion-address-registry.md)
Đăng ký ID của hai cơ sở dữ liệu mới tạo (`Design Tokens & Components Inventory` và `Screen/Page Status`) vào danh sách các Databases.

---

## Quy tắc Phân rã & Báo cáo Backlog (Vibecoding Style)

> [!WARNING]
> **KHÔNG** chia nhỏ các công việc như: "Tạo file A", "Viết API endpoint X", "Style CSS cho button Y".
> **CHỈ** tạo các Task ở cấp độ đầu việc lớn hoặc màn hình hoàn chỉnh.

### 📝 Luồng Tự Động Viết Báo Cáo Vào Trang Backlog (Automated Report)
Vì mỗi dòng trong Database Notion là một trang tài liệu (page), khi AI hoàn thành một Task bất kỳ:
1. **Cập nhật trạng thái**: Chuyển trạng thái task thành `Hoàn thành` trên Notion.
2. **Tự động viết báo cáo vào body trang**: AI sẽ gọi Notion API (`API-patch-block-children`) chèn nội dung chi tiết công việc đã thực hiện ngay bên trong trang Task đó bao gồm:
   - **Tóm tắt thay đổi**: Danh sách các file được chỉnh sửa/tạo mới.
   - **Mô tả kỹ thuật**: Các cấu trúc dữ liệu, component hoặc API chính đã triển khai.
   - **Evidence & Verification**: Kết quả chạy test cục bộ hoặc các lưu ý đặc biệt khi sử dụng.

---

## Verification Plan

### Automated Verification
- Truy vấn cấu trúc schema của các Database sau khi tạo/cập nhật bằng `API-retrieve-a-database` để kiểm tra các thuộc tính đã được tạo chính xác.

### Manual Verification
- Truy cập Notion Link của dự án để cấu hình trực quan các View (Frontend Board, Page Completion, Design System Research) và kiểm tra liên kết giữa các bảng.
