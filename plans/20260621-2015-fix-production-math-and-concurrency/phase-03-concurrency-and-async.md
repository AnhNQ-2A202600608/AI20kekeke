# Phase 3: Concurrency Optimization and Asynchronous Batching

Phase này loại bỏ điểm nghẽn khóa hàng (hot-row serialization locks) trên bảng `questions` và `bandit_arms` bằng cách chuyển các tác vụ tính toán học tập/hiệu chuẩn sang bất đồng bộ (Asynchronous Batching).

---

## 1. Yêu cầu chi tiết

### A. Loại bỏ `FOR UPDATE` khóa dòng trên Questions và Bandit Arms
- **Vấn đề**: Việc khóa hàng đồng thời (`FOR UPDATE`) trên câu hỏi hot và ma trận bandit arms tạo ra điểm nghẽn đồng bộ toàn cục. Khi 1000 sinh viên cùng nộp bài cho một câu hỏi hot, connection pool sẽ cạn kiệt vì chờ đợi lock giải phóng.
- **Giải pháp**:
  - Loại bỏ các câu lệnh `FOR UPDATE` trên bảng `app.questions` và `audit.bandit_arms` trong RPC SQL `submit_attempt_v3`.
  - RPC SQL chỉ ghi nhận thông tin nộp bài của học sinh đồng bộ.

### B. Thiết kế bảng Outbox (`app.calibration_outbox`)
- **Giải pháp**: Tạo bảng trung chuyển outbox:
  ```sql
  CREATE TABLE app.calibration_outbox (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      attempt_id uuid NOT NULL,
      question_id uuid NOT NULL,
      policy_id uuid,
      actual_score numeric NOT NULL,
      expected_success numeric NOT NULL,
      reward numeric NOT NULL,
      context_vector numeric[] NOT NULL,
      created_at timestamp with time zone DEFAULT now()
  );
  ```
  - Trong RPC `submit_attempt_v3`, sau khi log attempt, thực hiện insert thông tin vào `app.calibration_outbox`. Phép ghi này là append-only, cực kỳ nhanh và không có tranh chấp khóa.

### C. Xây dựng Background Calibration Worker (Python)
- **Giải pháp**: Tạo mới một service chạy nền [calibration_worker.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/calibration_worker.py) thực thi định kỳ (ví dụ: mỗi 5-10 giây) để:
  1. Quét và khóa các dòng mới trong `app.calibration_outbox`.
  2. **Hiệu chuẩn Elo câu hỏi theo lô (Batch Question Calibration)**: Gom nhóm các submits theo `question_id`, tính toán tổng delta Elo và cập nhật trường `difficulty_elo` cũng như `attempt_count` của câu hỏi bằng 1 câu lệnh update duy nhất.
  3. **Học ma trận Bandit theo lô (Batch Bandit Learning)**: Gom nhóm theo arm (`question_id`), chạy phép tính Sherman-Morrison trên Python sử dụng `numpy`.
     - *Tính ổn định số học*: Thực hiện symmetrization ma trận $A^{-1}$ sau mỗi batch để tránh mất đối xứng do sai số dấu phẩy động: $A^{-1} \leftarrow 0.5 \times (A^{-1} + (A^{-1})^T)$.
     - *Re-inversion định kỳ*: Mỗi 100 lượt update, thực hiện đảo ngược ma trận trực tiếp từ $A$ thay vì chỉ dùng Sherman-Morrison để khử sai số lũy kế.
  4. Cập nhật các giá trị ma trận mới vào bảng `audit.bandit_arms`.
  5. Xóa các dòng đã xử lý khỏi `app.calibration_outbox`.

### D. Tối ưu hóa kiểu dữ liệu
- **Giải pháp**: Chuyển đổi cột ma trận `a_inv` (đang là `jsonb`) và các phép tính toán ma trận trên DB sang định dạng mảng số thực `double precision[]` thay vì kiểu `numeric` để tăng tốc độ tính toán gấp hàng chục lần.

---

## 2. Các file thay đổi

*   **[NEW] [calibration_worker.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/calibration_worker.py)**: Service xử lý outbox bất đồng bộ.
*   **[NEW] [20260621_concurrency_and_async_outbox.sql](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/db/supabase/migrations/20260621_concurrency_and_async_outbox.sql)**: Tạo bảng outbox và cập nhật RPC loại bỏ lock.
*   **[MODIFY] [supabase_database.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/supabase_database.py)**: Thêm API hỗ trợ worker đọc/ghi outbox.

---

## 3. Tiêu chí hoàn thành (Success Criteria)

- [ ] Lệnh chạy worker hoạt động bình thường, không rò rỉ bộ nhớ.
- [ ] Stress test mô phỏng 1000 submits đồng thời trên cùng một câu hỏi chạy thành công với latency nộp bài < 100ms (thay vì bị connection timeout như trước).
- [ ] Ma trận LinUCB trong cơ sở dữ liệu được cập nhật chính xác (sau độ trễ vài giây của worker) và luôn duy trì tính đối xứng.
- [ ] Elo câu hỏi và số lượt attempt của câu hỏi được cập nhật chính xác theo lô.
