# ADR-015: Question Bank Adaptive Onboarding Prior

**Ngày:** 2026-07-01
**Trạng thái:** Accepted

## Bối cảnh (Context)

Luồng onboarding cần tạo hồ sơ năng lực ban đầu cho học viên trước khi vào app.
Trước đó implementation MVP dùng câu hỏi diagnostic hardcoded và có xu hướng seed thêm câu hỏi riêng cho onboarding.

Vấn đề:
- Dự án đã có `app.questions` và `app.question_concepts` làm question bank chính.
- Nếu tạo bank/mapping riêng cho onboarding, dữ liệu bị trùng, khó maintain, và lệch khỏi source of truth.
- `P(L0)` của BKT là prior ban đầu, không phải mastery tuyệt đối; cần evidence + confidence.
- Cần bao phủ nhiều kỹ năng, nhưng không nên hỏi quá nhiều câu ở onboarding.

## Các lựa chọn (Alternatives)

### Lựa chọn 1: Hardcoded onboarding questions
- Ưu điểm: Nhanh, dễ kiểm soát nội dung.
- Nhược điểm: Không dùng question bank thật, khó audit, không cập nhật theo dữ liệu mentor tạo.

### Lựa chọn 2: Tạo question bank riêng cho onboarding
- Ưu điểm: Dễ curate placement test riêng.
- Nhược điểm: Duplicate dữ liệu, thêm mapping riêng, cần đồng bộ với `app.questions`.

### Lựa chọn 3: Dùng `app.questions` hiện có với metadata optional
- Ưu điểm: Một source of truth, tận dụng câu hỏi mentor/database đã có, ít vận hành hơn.
- Nhược điểm: Cần lọc chất lượng câu hỏi và có fallback khi thiếu metadata.

### Lựa chọn 4: IRT/CAT đầy đủ
- Ưu điểm: Phù hợp nhất cho placement nếu có item parameters đủ tốt.
- Nhược điểm: Chưa phù hợp MVP nếu dữ liệu calibration chưa đủ lớn.

## Quyết định (Decision)

Chọn **Lựa chọn 3: Dùng `app.questions` hiện có với metadata optional**.

Onboarding diagnostic:
- Lấy MCQ từ `app.questions` với `course_id`, `type = mcq`, `calibration_status = published`.
- Bắt buộc có `answer_key.options`, `answer_key.correct`, `difficulty_elo`, concept mapping.
- Dùng `question_concepts` để bao phủ nhiều kỹ năng; nếu không có thì dùng `questions.concept_id`.
- `answer_key.diagnostic` chỉ là metadata phụ: `bloom_level`, `encouragement`, `concept_weights`.
- Nếu thiếu metadata, backend infer:
  - `bloom_level` từ `difficulty_elo`,
  - `concept_weights` từ `question_concepts` / primary concept.

## Lý do (Rationale)

1. `app.questions` là source of truth của hệ thống.
2. Onboarding không cần bank riêng; chỉ cần selection policy riêng.
3. Elo phù hợp để chọn câu theo độ khó ban đầu.
4. BKT posterior sau 5-8 câu là seed `P(L0)`, nhưng phải hiểu là prior có confidence, không phải mastery tuyệt đối.
5. 5 câu giữ UX ngắn; optional tới 8 câu tăng confidence.

## Hệ quả (Consequences)

- Mentor/data team phải đảm bảo question bank có đủ MCQ published theo concept và difficulty band.
- Nếu question bank thiếu câu hợp lệ, API fail rõ ràng thay vì fake fallback.
- Onboarding completion cập nhật direct mastery cho concepts có evidence.
- Không lan truyền prerequisite graph/PKT từ onboarding ở giai đoạn này để tránh inflate mastery cho concept chưa được hỏi trực tiếp.
- Graph UI sẽ thấy mastery tăng ở node được seed trực tiếp sau khi `student_concept_mastery` cập nhật thành công.
- PKT/graph propagation vẫn dành cho practice/quiz attempts có evidence mạnh hơn.
