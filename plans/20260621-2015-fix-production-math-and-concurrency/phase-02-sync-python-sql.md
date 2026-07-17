# Phase 2: Algorithm Synchronization and Equivalence Testing

Phase này giải quyết sự sai lệch thuật toán giữa mã nguồn Python (được kiểm thử trong Eval Suite) và mã nguồn SQL (chạy trên Production).

---

## 1. Yêu cầu chi tiết

### A. Đồng bộ hóa Lan truyền Đồ thị (Graph Propagation)
- **Vấn đề**: Phiên bản Python sử dụng lan truyền đệ quy đa cấp (multi-step recursive) có cycle protection. Phiên bản SQL sử dụng lan truyền depth-1 trực tiếp, dẫn đến kết quả phân tích học thuật không đồng nhất với thực tế.
- **Giải pháp**:
  - Loại bỏ hoàn toàn logic lan truyền đồ thị đồng bộ bên trong RPC SQL `submit_attempt_v3`.
  - Thay vào đó, sau khi RPC cập nhật thành công concept chính, API Server (Python) sẽ gọi hàm `propagate_mastery` từ [graph_propagation.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/graph_propagation.py) một cách bất đồng bộ (chạy background task hoặc thông qua hàng đợi sự kiện).
  - Điều này giúp:
    1. Chỉ sử dụng một nguồn chân lý thuật toán duy nhất (file Python).
    2. Giảm thời gian khóa dòng DB (không cần `FOR UPDATE` trên các concept liên đới trong transaction chính).

### B. Loại bỏ Code chết Partial-Credit BKT
- **Vấn đề**: Hàm BKT trong SQL RPC có nhánh hỗ trợ điểm một phần (partial-credit: `0 < score < 1`) được tự chế và không có căn cứ khoa học, đồng thời đây là code chết vì hệ thống chấm điểm luôn trả về `0.0` hoặc `1.0`.
- **Giải pháp**: Loại bỏ nhánh partial-credit khỏi SQL RPC và Python để làm sạch thuật toán, đưa BKT về dạng chuẩn nhị phân (binary BKT) theo đúng Corbett & Anderson (1994).

### C. Đồng nhất tham số mặc định BKT
- **Vấn đề**: Production dùng fallback transition rate $T = 0.10$ còn Eval suite dùng $T = 0.06$.
- **Giải pháp**: Thống nhất sử dụng $T = 0.06$ làm giá trị mặc định cho cả hai môi trường.

### D. Xây dựng Equivalence Test trong CI
- **Vấn đề**: Không có kiểm thử tự động nào xác nhận tính đồng nhất giữa thuật toán viết bằng SQL và Python.
- **Giải pháp**:
  - Tạo mới file kiểm thử [test_adaptive_equivalence.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/tests/test_api/test_adaptive_equivalence.py).
  - Bài test sẽ sinh ra các bộ dữ liệu ngẫu nhiên (năng lực học sinh, độ khó câu hỏi, điểm thực tế, số gợi ý).
  - Chạy tính toán Elo, BKT thông qua hàm Python (`elo.py`, `bkt.py`) và gọi hàm SQL RPC `submit_attempt_v3` (trên DB test).
  - Sử dụng các lệnh `assert` để đảm bảo kết quả tính toán Elo mới, BKT mới khớp nhau đến từng chữ số thập phân.

---

## 2. Các file thay đổi

*   **[MODIFY] [graph_propagation.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/graph_propagation.py)**: Đồng bộ hóa hệ số decay.
*   **[MODIFY] [adaptive_routes.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/api/adaptive_routes.py)**: Điều chỉnh gọi lan truyền đồ thị ngoài transaction DB.
*   **[NEW] [test_adaptive_equivalence.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/tests/test_api/test_adaptive_equivalence.py)**: Kiểm thử tính đồng nhất.
*   **[MODIFY] [20260621_security_and_correctness_fixes.sql](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/db/supabase/migrations/20260621_security_and_correctness_fixes.sql)**: Loại bỏ code chết BKT và phần graph propagation đồng bộ khỏi RPC SQL.

---

## 3. Tiêu chí hoàn thành (Success Criteria)

- [ ] Lệnh chạy test `pytest tests/test_api/test_adaptive_equivalence.py` vượt qua hoàn toàn.
- [ ] Code Python và SQL cho ra kết quả cập nhật Elo và BKT giống hệt nhau trên 100 test case sinh tự động.
