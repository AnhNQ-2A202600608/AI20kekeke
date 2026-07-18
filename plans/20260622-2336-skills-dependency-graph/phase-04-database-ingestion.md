# Phase 4: Tích hợp Database và Đồng bộ Hóa (Database Ingestion)

## Context Links
- **Database Client Service**: [supabase_database.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/supabase_database.py)
- **Concept Relation Migrations**: [20260618_concept_relations.sql](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/db/supabase/migrations/20260618_concept_relations.sql)
- **Fused Graph Output**: `outputs/fused_graph.json` (Đầu ra từ Phase 3)

## Overview
- **Priority**: High
- **Current Status**: Todo
- Pha này chịu trách nhiệm đọc kết quả đồ thị sạch từ `outputs/fused_graph.json` và đồng bộ hóa trực tiếp vào cơ sở dữ liệu Supabase PostgreSQL. Script cần đảm bảo tính an toàn dữ liệu, tránh trùng lặp bằng cách sử dụng các câu lệnh `ON CONFLICT` và kiểm tra tính toàn vẹn khóa ngoại (foreign key integrity).

## Key Insights từ Paper & Codebase
- **Idempotency (Đồng bộ an toàn nhiều lần)**:
  - Bảng `app.concepts` có khóa unique `UNIQUE (course_id, code)`. Khi thêm concept mới, nếu trùng mã `code`, cần cập nhật lại `name` và `description` bằng cú pháp `ON CONFLICT (course_id, code) DO UPDATE`.
  - Bảng `app.concept_relations` có khóa unique `UNIQUE (source_concept_id, target_concept_id, relation_type)`. Khi thêm quan hệ, nếu trùng cạnh, cần cập nhật lại `weight` và `status` bằng cú pháp `ON CONFLICT (source_concept_id, target_concept_id, relation_type) DO UPDATE`.
- **Status và Weight**:
  - Trạng thái quan hệ (`status`) sẽ được đặt mặc định là `'approved'` để đồ thị có hiệu lực ngay lập tức cho các thuật toán lan truyền năng lực học viên, hoặc đặt thành `'draft'` để chờ Mentor phê duyệt qua màn hình Admin.
  - Trọng số quan hệ (`weight`) cần tuân thủ ràng buộc `CHECK (weight >= 0.0 AND weight <= 1.0)`.

## Requirements
- Viết script Python `ingest_graph_to_db.py` kết nối cơ sở dữ liệu qua thư viện `psycopg2` hoặc `supabase-py` sử dụng URL cấu hình trong file `.env`.
- Tự động tra cứu UUID của các concept tương ứng để làm khóa ngoại khi chèn vào bảng quan hệ.
- Sử dụng Database Transaction (Begin / Commit / Rollback) để đảm bảo nếu xảy ra lỗi trong quá trình nạp, toàn bộ dữ liệu sẽ được phục hồi trạng thái cũ (rollback) để tránh tình trạng đồ thị bị lỗi một nửa.

## Related Code Files
- [NEW] `src/pipeline/graphusion/ingest_graph_to_db.py` (Script nạp đồ thị vào DB)

## Implementation Steps
1. Khởi tạo cấu trúc file script tại `src/pipeline/graphusion/ingest_graph_to_db.py`.
2. Tải cấu hình biến môi trường kết nối DB từ file `.env` (DATABASE_URL hoặc SUPABASE_DATABASE_URL).
3. Đọc dữ liệu từ file `outputs/fused_graph.json`.
4. Bắt đầu một Database Transaction:
   - Bước 4.1: Kiểm tra khóa ngoại Course ID mặc định của Bootcamp (`00000000-0000-0000-0000-000000000001`).
   - Bước 4.2: Thực hiện insert các Node Concept mới vào bảng `app.concepts`. Tạo UUID ngẫu nhiên nếu concept mới chưa có UUID trong DB.
   - Bước 4.3: Thực hiện truy vấn lại toàn bộ danh sách concept của khóa học để xây dựng bản đồ mapping từ `concept_code` sang `concept_id` (UUID).
   - Bước 4.4: Thực hiện insert các cạnh quan hệ vào bảng `app.concept_relations`. Ánh xạ `source_concept_code` và `target_concept_code` thành UUID tương ứng.
5. Thực hiện `COMMIT` transaction nếu tất cả các bước thành công.
6. In ra báo cáo tóm tắt số lượng concept và quan hệ đã được thêm/cập nhật mới vào cơ sở dữ liệu.

## Todo List
- [ ] Thiết kế logic ánh xạ code concept sang UUID.
- [ ] Viết các câu lệnh SQL insert an toàn sử dụng `ON CONFLICT`.
- [ ] Triển khai transaction handling (rollback khi lỗi).
- [ ] Chạy thử nghiệm nạp đồ thị lên database dev.

## Success Criteria
- Dữ liệu concept và quan hệ được nạp đầy đủ vào database Supabase mà không gây ra lỗi vi phạm ràng buộc (constraint violation).
- Các câu lệnh SQL chạy an toàn khi chạy lại nhiều lần (idempotent).
- Kiểm tra bảng `app.concepts` và `app.concept_relations` trong DB chứa dữ liệu đồng bộ chính xác với file JSON.

## Risk Assessment
- **Lỗi kết nối cơ sở dữ liệu**: Đảm bảo file `.env` đã được load chính xác và các cổng kết nối Postgres không bị chặn.
- **Ràng buộc khóa ngoại bị lỗi**: Cần đảm bảo tất cả concept nguồn và đích đều tồn tại trong bảng `app.concepts` trước khi tạo liên kết trong `app.concept_relations`.
