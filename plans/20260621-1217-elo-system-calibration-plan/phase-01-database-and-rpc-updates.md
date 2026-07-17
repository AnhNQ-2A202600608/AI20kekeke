# Phase 1: Database & RPC Updates for Dynamic Elo

Phase này tập trung vào việc cập nhật tầng dữ liệu (Supabase PostgreSQL) để lưu trữ các siêu dữ liệu cần thiết và cập nhật thuật toán tính Elo kép (Dual Elo Update) động trong database function.

---

## 1. Yêu cầu thiết kế và Kiến trúc

### A. Thêm trường lưu trữ số lượt làm bài của câu hỏi
Để tính $K_{\text{question}}$ động mà không phải tính toán $O(N)$ (bằng cách `COUNT` trên bảng `quiz_attempts` vốn tăng rất nhanh), ta thêm trường `attempt_count` vào bảng `questions` làm cache counter:
```sql
ALTER TABLE app.questions 
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0;
```

### B. Cập nhật K-question động trong `submit_attempt_v3`
Hệ số biến động của câu hỏi $K_{\text{question}}$ sẽ được tính tự động dựa trên số lượt làm bài `attempt_count` của câu hỏi đó:
```sql
-- K_question giảm dần từ 32.0 về tối thiểu 8.0 khi câu hỏi được hiệu chuẩn qua nhiều lượt làm bài
v_k_question := greatest(8.0, 32.0 / (1.0 + v_question.attempt_count / 20.0));
```

### C. Bổ sung Time-Gap Uncertainty cho K-student
Năng lực học viên $\theta$ sẽ có biến động lớn hơn khi quay lại sau một thời gian dài (do độ bền trí nhớ giảm/quên kiến thức):
```sql
-- Nếu khoảng cách thời gian lớn hơn 7 ngày, tăng hệ số học để nhanh chóng bắt kịp trình độ mới
IF v_mastery.last_practiced_at IS NOT NULL AND 
   (EXTRACT(EPOCH FROM (now() - v_mastery.last_practiced_at)) / 86400.0) > 7.0 THEN
    v_k_student := greatest(v_k_student, 32.0); -- Tối thiểu là 32.0
END IF;
```

---

## 2. Kịch bản SQL Di cư (Migration Script)

Tạo file migration `db/supabase/migrations/20260621_dynamic_elo_calibration.sql` chứa các thay đổi:

```sql
BEGIN;

-- 1. Thêm cột attempt_count vào questions
ALTER TABLE app.questions 
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0;

-- 2. Khởi tạo giá trị ban đầu cho các câu hỏi cũ dựa trên dữ liệu lịch sử
UPDATE app.questions q
   SET attempt_count = (
       SELECT count(*) 
         FROM app.quiz_attempts qa 
        WHERE qa.question_id = q.id
   );

-- 3. Nâng cấp app.submit_attempt_v3
-- (Xem chi tiết logic tính v_k_question và v_k_student mới ở phần 1)

COMMIT;
```

---

## 3. Tiêu chí Hoàn thành (Success Criteria)

*   [ ] Thực thi file migration SQL thành công không gây lỗi khóa (lock timeout).
*   [ ] Trường `attempt_count` trong bảng `questions` tự động tăng thêm 1 sau mỗi lượt nộp bài qua RPC `submit_attempt_v3`.
*   [ ] Điểm Elo câu hỏi thay đổi chậm lại khi `attempt_count` của câu hỏi tăng lên (đã kiểm chứng qua unit tests).
