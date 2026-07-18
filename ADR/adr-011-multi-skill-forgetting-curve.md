# ADR-011: Lựa chọn mô hình lãng quên Spaced Repetition và lan truyền năng lực đa kỹ năng trên Đồ thị kiến thức

**Ngày:** 2026-06-16
**Trạng thái:** Accepted

## Bối cảnh (Context)

Hệ thống cần tích hợp mô hình ôn tập ngắt quãng (Spaced Repetition / Forgetting Curve) và lan truyền năng lực học viên trên đồ thị kiến thức (Multi-skill Knowledge Graph với ~25 kỹ năng tiên quyết).
Chúng ta đối mặt với hai bài toán thiết kế quan trọng:
1. **Mô hình lãng quên (Forgetting Curve):** Làm sao để trừ điểm mastery của học sinh theo thời gian thực mà không gây quá tải hoặc lag cơ sở dữ liệu khi hệ thống scale lên hàng ngàn học sinh làm bài đồng thời.
2. **Phân bổ đa kỹ năng (Multi-skill Blame/Credit):** Khi một câu hỏi thuộc về nhiều concept/kỹ năng đồng thời (Q-matrix), làm sao để phân bổ điểm phạt (blame) khi học sinh làm sai hoặc cộng điểm (credit) khi làm đúng một cách hợp lý và tránh các lỗi toán học (như chia cho 0).

## Các lựa chọn (Alternatives)

### 1. Đối với cơ chế lãng quên (Forgetting Curve)

#### Lựa chọn 1.1: Eager Decay (Chạy Cronjob hàng đêm)
- **Ưu điểm:** Dữ liệu trong bảng `app.student_concept_mastery` luôn được cập nhật thực tế xuống ổ đĩa cứng.
- **Nhược điểm:** Tốn tài nguyên CPU/IO của database cực lớn khi chạy quét hàng loạt cho $N$ học viên $\times$ $M$ concepts; tạo ra luồng ghi khổng lồ làm chậm các truy vấn trực tuyến khác.

#### Lựa chọn 1.2: Lazy Decay On-Read (Tính toán tức thời khi đọc)
- **Ưu điểm:** Tải ghi của Database bằng 0. Điểm mastery thực tế được tính toán động thông qua công thức lãng quên FSRS ($p_{recall} = bkt \times 2^{-\Delta t / stability}$) ngay khi API đọc dữ liệu học viên lên.
- **Nhược điểm:** Phải thực hiện tính toán số mũ trong code ứng dụng ở mỗi lượt truy vấn đọc (nhưng chi phí CPU này cực kỳ nhỏ và có thể cache).

---

### 2. Đối với phân bổ đa kỹ năng (Multi-skill Blame/Credit)

#### Lựa chọn 2.1: Heuristic Blame chia tỷ lệ nghịch
- **Ưu điểm:** Dễ cài đặt bằng một vài dòng code.
- **Nhược điểm:** Gặp lỗi chia cho 0 hoặc lỗi toán học bất định khi học viên đã master tất cả các kỹ năng trong câu hỏi nhưng vẫn làm sai (do sơ suất - slip). Chỉ hỗ trợ blame (sai) mà thiếu credit (đúng).

#### Lựa chọn 2.2: Bayesian Responsibility (DINA & Bayes Blame/Credit)
- **Ưu điểm:** Rất khoa học và chính xác. Phân bổ lỗi dựa trên trọng số trách nhiệm: Kỹ năng nào yếu hơn thì gánh trách nhiệm lớn hơn cho lỗi sai của câu hỏi đó. Có cơ chế guard mẫu số chống lỗi chia cho 0 và tách biệt rõ ràng luồng blame (phạt) và credit (thưởng).
- **Nhược điểm:** Đòi hỏi toán phức tạp hơn và cần hiệu chuẩn các tham số BKT.

## Quyết định (Decision)

1. Chọn **Lựa chọn 1.2: Lazy Decay On-Read** cho mô hình lãng quên.
2. Chọn **Lựa chọn 2.2: Bayesian Responsibility** cho cơ chế phân bổ điểm đa kỹ năng.

## Lý do (Rationale)

1. **Lazy Decay On-Read** loại bỏ hoàn toàn gánh nặng ghi của Database. DB chỉ lưu trữ mốc sự kiện cuối cùng học viên ôn tập (`last_practiced_at`) và độ bền trí nhớ (`stability_days`). Việc tính toán độ suy giảm thực thi trên RAM của application server giúp hệ thống đạt hiệu năng cực cao và khả năng scale vô hạn.
2. **Bayesian Responsibility** giải quyết triệt để các trường hợp biên toán học của mô hình đa kỹ năng (như slip/guess) và cung cấp cơ chế phân bổ điểm phạt/thưởng đối xứng, giúp BKT cập nhật mượt mà không bị kéo về 0 vô hạn.

## Hệ quả (Consequences)

- Phía Backend Python cần cài đặt helper tính toán `effective_mastery` khi trả về thông tin năng lực học sinh qua API hoặc khi nạp vào vector ngữ cảnh của Bandit.
- Bảng `app.student_concept_mastery` cần bổ sung trường `stability_days` để theo dõi tốc độ lãng quên cá nhân hóa.
- Quản lý cấu hình Q-matrix (`question_skills`) và đồ thị tiên quyết (`concept_edges`) để phục vụ thuật toán phân bổ.
