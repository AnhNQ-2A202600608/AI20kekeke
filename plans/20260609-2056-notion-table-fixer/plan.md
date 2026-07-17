# Kế hoạch Triển khai: Sửa Lỗi và Tối ưu hóa Tài liệu Notion bằng MCP & Python Parser

Đồng bộ hóa các file tài liệu Markdown từ cục bộ lên Notion, tự động chuyển đổi bảng (table), sơ đồ Mermaid và công thức toán học thành các block native tương ứng của Notion thông qua việc chạy script Parser cục bộ tạo Block JSON và gọi Notion MCP Server để cập nhật.

## Proposed Changes

### Scripts

#### [NEW] [parse_markdown_to_blocks.py](file:///C:/Users/LENOVO/.gemini/antigravity-ide/brain/7c122d23-86eb-484f-8d54-b12a1a1067d0/scratch/parse_markdown_to_blocks.py)
Tạo script Python trong thư mục scratch để parse Markdown thành cấu trúc block JSON tương thích Notion API.

Các bước xử lý:
1. Đọc từng file tài liệu cục bộ theo bản đồ `notion-docs-mapping.md`.
2. Phân tích cú pháp Markdown sang định dạng mảng Notion Blocks:
   - Các dòng văn bản -> `paragraph` block.
   - Code blocks (bao gồm Mermaid) -> `code` block.
   - Bảng (`|`) -> `table` và các `table_row` block.
   - Công thức Toán -> `equation` hoặc inline `equation`.
3. Xuất file kết quả JSON chứa block payload cho từng trang vào thư mục scratch.

### Notion MCP Execution
Agent sẽ đọc các file JSON block payload và gọi lần lượt các API của `notion-mcp-server` để:
1. Lấy danh sách block hiện tại trên trang (`API-get-block-children`).
2. Xóa các block cũ (`API-delete-a-block`).
3. Chèn các block mới chuẩn hóa bảng & sơ đồ (`API-patch-block-children`).

## Verification Plan

### Automated Verification
- Kiểm tra file JSON được xuất ra bởi parser đảm bảo cấu trúc block Notion hợp lệ.

### Manual Verification
- Thực hiện đồng bộ qua Notion MCP và mở link Notion Edugap để kiểm tra chất lượng hiển thị của Bảng, sơ đồ Mermaid và công thức Toán.

