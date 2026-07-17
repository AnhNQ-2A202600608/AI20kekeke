# Phase 2: Backend Integration & Response-Time Metrics

Phase này tập trung vào việc thu thập telemetry `response_time` từ phía client, tính toán thời gian phản hồi trung bình của câu hỏi, và áp dụng điều chỉnh điểm số thực tế $S$ dựa trên tốc độ làm bài.

---

## 1. Yêu cầu thiết kế và Kiến trúc

### A. Telemetry & Giao thức truyền tin (API Schema)
*   **Client-side:** Đo lượng thời gian từ lúc câu hỏi hiển thị đến khi học sinh ấn "Nộp bài" (`response_time_ms`).
*   **API Payload (`/submit`):** Bổ sung trường `response_time_ms` vào request payload.
    ```json
    {
      "decision_id": "...",
      "student_answer": "...",
      "response_time_ms": 12450
    }
    ```

### B. Lưu trữ và Tính toán thời gian trung bình của câu hỏi
*   Bảng `app.questions` cần bổ sung trường `avg_response_time_ms` để lưu thời gian làm bài trung bình lịch sử:
    ```sql
    ALTER TABLE app.questions 
      ADD COLUMN IF NOT EXISTS avg_response_time_ms integer NOT NULL DEFAULT 30000; -- mặc định 30 giây
    ```
*   Khi có lượt làm bài mới, cập nhật trung bình lũy kế:
    $$\text{avg\_time}_{\text{new}} = \text{avg\_time}_{\text{old}} + \frac{\text{new\_time} - \text{avg\_time}_{\text{old}}}{\text{attempt\_count}}$$

### C. Tính toán Speed Factor và Điều chỉnh điểm số
Khi học sinh trả lời đúng ($S = 1.0$), ta tính tốc độ tương đối:
$$\text{speed\_ratio} = \frac{\text{response\_time}}{\text{avg\_response\_time}}$$
$$\text{speed\_factor} = \max\left(0.8, \min\left(1.2, 1.0 + 0.2 \cdot (1.0 - \text{speed\_ratio})\right)\right)$$
$$S_{\text{adjusted}} = S \cdot \text{speed\_factor}$$

*   **Làm bài đúng cực nhanh:** Nhận tới $1.2$ điểm thực tế (Elo tăng nhiều hơn).
*   **Làm bài đúng cực chậm:** Nhận tối thiểu $0.8$ điểm thực tế (Elo tăng ít hơn).
*   **Làm bài sai:** Giữ nguyên $S = 0.0$ (không thưởng/phạt thêm điểm từ thời gian để tránh ép học sinh làm bài vội).

---

## 2. Các file cần chỉnh sửa trong codebase

*   **Frontend:**
    *   [quiz-card.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/quiz-card.tsx) (hoặc file tương đương): Đo lường thời gian và đính kèm vào payload gửi đi.
*   **Backend:**
    *   [adaptive_routes.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/api/adaptive_routes.py): Tiếp nhận tham số `response_time_ms` và truyền tiếp vào RPC database.
*   **Database:**
    *   [20260621_dynamic_elo_calibration.sql](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/db/supabase/migrations/): Triển khai logic tính toán lũy kế và điều chỉnh $S_{\text{adjusted}}$ trực tiếp trong PL/pgSQL.

---

## 3. Tiêu chí Hoàn thành (Success Criteria)

*   [ ] API `/submit` chấp nhận tham số `response_time_ms` và lưu trữ thành công vào bảng `quiz_attempts`.
*   [ ] Chỉ số `avg_response_time_ms` của câu hỏi được cập nhật chính xác sau mỗi lượt làm bài.
*   [ ] Điểm Elo của học sinh tăng nhiều hơn đáng kể khi trả lời đúng nhanh dưới 20% thời gian trung bình.
