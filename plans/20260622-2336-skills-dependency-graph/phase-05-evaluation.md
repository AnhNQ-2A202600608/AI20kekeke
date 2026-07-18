# Phase 5: Kiểm thử và Đánh giá (Verification & Evaluation)

## Context Links
- **API Router**: [adaptive_routes.py#L483-L501](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/api/adaptive_routes.py#L483-L501)
- **Lan truyền Đồ thị (Graph Propagation)**: [graph_propagation.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/graph_propagation.py)
- **Tập kiểm thử mẫu**: [tests/](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/tests/)

## Overview
- **Priority**: Medium
- **Current Status**: Todo
- Pha này tập trung vào kiểm tra, xác thực và đánh giá đồ thị kỹ năng sau khi đã nạp vào DB. Việc kiểm định nhằm đảm bảo các API adaptive truy xuất đồ thị chính xác, thuật toán lan truyền năng lực hoạt động đúng đắn mà không gặp lỗi lặp vô hạn hay tính toán sai, và giao diện frontend nhận diện đúng cấu trúc đồ thị mới.

## Key Insights từ Paper & Codebase
- **Cycle-Free (Cấm chu trình)**: Thuật toán lan truyền trong `graph_propagation.py` sử dụng tập `visited` để chống đệ quy vô hạn:
  ```python
  if concept_id in visited:
      return modified_concepts
  ```
  Tuy nhiên, việc đồ thị có chu trình vẫn gây ra các hành vi lan truyền năng lực sai lệch về mặt logic sư phạm. Do đó, cần có script kiểm tra tính DAG tĩnh trước khi đưa vào vận hành thực tế.
- **Tích hợp API**: API `GET /graph/relations` trả về danh sách quan hệ giữa các concept. API này sẽ cung cấp dữ liệu trực tiếp cho module hiển thị trực quan hóa đồ thị ở frontend (ví dụ: màn hình Student Profile hoặc Concept Map).

## Requirements
- Viết test script tự động kiểm tra tích hợp (Integration Test) cho luồng API `/graph/relations`.
- Thực hiện kiểm thử thủ công và tự động đối với logic lan truyền năng lực học viên (`propagate_mastery`).
- Xác nhận các concept mới nạp vào hiển thị đúng trên trang Student Profile hoặc giao diện đồ thị của EduGap.

## Related Code Files
- [NEW] `tests/test_adaptive_graph.py` (Script kiểm thử tích hợp đồ thị)

## Implementation Steps
1. Khởi tạo file test `tests/test_adaptive_graph.py` sử dụng framework `pytest` và client test của FastAPI (`TestClient`).
2. Viết test case `test_api_get_relations`:
   - Gửi yêu cầu `GET` tới `/api/v1/adaptive/graph/relations`.
   - Kiểm tra mã phản hồi HTTP `200 OK`.
   - Xác thực cấu trúc dữ liệu trả về gồm danh sách các đối tượng quan hệ, có đầy đủ `source_concept_id`, `target_concept_id`, `relation_type`, `weight`, `status`.
3. Viết test case `test_dag_integrity`:
   - Lấy toàn bộ quan hệ `Prerequisite_of` của khóa học.
   - Xây dựng đồ thị hướng và chạy thuật toán phát hiện chu trình (Topological Sort / Tarjan / DFS) để khẳng định 100% đồ thị không có chu trình.
4. Viết test case `test_mastery_propagation`:
   - Giả lập việc một học sinh làm đúng một câu hỏi thuộc concept nguồn.
   - Cập nhật điểm Elo/BKT và gọi hàm lan truyền `propagate_mastery`.
   - Kiểm tra xem điểm số của concept đích có được tăng lên tương ứng theo hệ số lan truyền (`BETA = 0.25`) hay không.
5. Chạy toàn bộ test suite sử dụng lệnh `pytest tests/test_adaptive_graph.py`.

## Todo List
- [ ] Viết file test tích hợp `tests/test_adaptive_graph.py`.
- [ ] Chạy kiểm thử API `/graph/relations` (cả GET/POST).
- [ ] Thực hiện kiểm thử tính DAG tĩnh của đồ thị đã nạp.
- [ ] Kiểm thử luồng lan truyền năng lực thực tế.

## Success Criteria
- Tất cả các test cases trong `tests/test_adaptive_graph.py` đều vượt qua (`pytest` trả về PASS).
- Đồ thị phụ thuộc của `Prerequisite_of` được chứng minh là không có chu trình (DAG).
- API trả về đúng các quan hệ đã được Graphusion trích xuất và nạp vào DB.

## Risk Assessment
- **Lỗi RLS (Row Level Security)**: Ràng buộc RLS trên bảng `app.concept_relations` có thể chặn quyền đọc/ghi nếu token xác thực không hợp lệ. Cần bảo đảm API call sử dụng đúng service role key hoặc pass qua chính sách RLS trên môi trường dev.
