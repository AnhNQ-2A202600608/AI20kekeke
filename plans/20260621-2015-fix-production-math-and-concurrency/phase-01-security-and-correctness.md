# Phase 1: Security and Correctness Fixes

Phase này tập trung vào việc khắc phục các lỗ hổng bảo mật trực tiếp, các lỗi logic ẩn và toán học sai lệch.

---

## 1. Yêu cầu chi tiết

### A. Bảo mật RPC `submit_attempt_v3`
- **Vấn đề**: Hiện tại, quyền `authenticated` (học sinh) được phép gọi trực tiếp RPC này, dẫn đến nguy cơ học sinh tự gửi điểm `p_actual_score` giả lập để vượt qua kiểm tra phía máy chủ.
- **Giải pháp**: 
  - Thu hồi quyền thực thi từ role `authenticated`.
  - Chỉ cho phép `service_role` gọi RPC này. API Server (Python) chạy dưới quyền admin/service_role sẽ thực hiện gọi RPC sau khi đã chấm điểm phía server.
  - SQL: `REVOKE EXECUTE ON FUNCTION app.submit_attempt_v3 FROM authenticated;`

### B. Sửa lỗi logic `was_ai_used`
- **Vấn đề**: Hàm `was_ai_used` trong `supabase_database.py` kiểm tra xem học sinh có sử dụng chatbot trong lúc làm bài không bằng cách so sánh thời gian tạo tin nhắn chat với thời điểm gợi ý câu hỏi (`created_at` của decision). Tuy nhiên, hàm `get_adaptive_decision` không select cột `created_at`, dẫn đến so sánh luôn là `None` và kết quả luôn trả về `False`.
- **Giải pháp**: Cập nhật hàm `get_adaptive_decision` trong [supabase_database.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/supabase_database.py) để select thêm trường `created_at`.

### C. Sửa lỗi ép kiểu idempotency trong SQL
- **Vấn đề**: Trong RPC `submit_attempt_v3`, nhánh xử lý idempotency (khi nộp lại cùng 1 decision) thực hiện `SELECT to_jsonb(qa) INTO attempt_id` nhưng biến `attempt_id` lại là kiểu `uuid`, gây lỗi run-time.
- **Giải pháp**: Sửa thành `SELECT qa.id INTO attempt_id`.

### D. Giới hạn trần (cap) cho Memory Stability
- **Vấn đề**: `stability_days` nhân đôi sau mỗi lần đúng mà không có giới hạn, dẫn đến việc độ ổn định đạt tới hàng triệu ngày (vô hiệu hóa tính năng quên).
- **Giải pháp**: Thêm giới hạn trần cho `stability_days` ở mức 36500 ngày (tương đương 100 năm, giống cấu hình của FSRS thực tế).
- **SQL**: `stability_days = least(36500.0, ...)`

### E. Giới hạn `response_time_ms` và Speed Factor
- **Vấn đề**: Bot hoặc client gửi `response_time_ms = 0` được nhận tối đa speed factor reward.
- **Giải pháp**: Ở cả API Python và SQL RPC, thực hiện ép giá trị `response_time_ms` tối thiểu là 300ms và tối đa là thời gian phiên làm việc hợp lệ.

---

## 2. Các file thay đổi

*   **[MODIFY] [supabase_database.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/supabase_database.py)**: Select thêm `created_at` trong `get_adaptive_decision`.
*   **[MODIFY] [adaptive_routes.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/api/adaptive_routes.py)**: Thêm validation cho `response_time_ms`.
*   **[NEW] [20260621_security_and_correctness_fixes.sql](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/db/supabase/migrations/20260621_security_and_correctness_fixes.sql)**: File migration sửa lỗi RPC.

---

## 3. Tiêu chí hoàn thành (Success Criteria)

- [ ] Thực thi file SQL migration thành công.
- [ ] Học sinh gửi request trực tiếp đến RPC `submit_attempt_v3` qua PostgREST nhận về lỗi 403 / Permission Denied.
- [ ] `was_ai_used` trả về chính xác `True` khi học sinh có sử dụng AI trong phiên làm việc.
- [ ] Idempotency return hoạt động bình thường mà không gây ra lỗi 500.
- [ ] `stability_days` không vượt quá 36500 trong cơ sở dữ liệu sau chuỗi trả lời đúng liên tục.
