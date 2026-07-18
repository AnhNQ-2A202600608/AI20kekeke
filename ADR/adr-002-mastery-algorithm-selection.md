# ADR-002: Lựa chọn thuật toán đánh giá năng lực học tập thích ứng

**Ngày:** 2026-05-31
**Trạng thái:** Accepted

## Bối cảnh (Context)

Dự án AI20K-C2-HE-01 là hệ thống gia sư AI thích ứng (Adaptive-first AI Tutor). Một trong những tính năng cốt lõi là theo dõi độ thành thạo (Mastery) của sinh viên đối với từng khái niệm môn học (Course Concepts) theo thời gian để phục vụ hiển thị Concept Mind Map, sinh câu hỏi trắc nghiệm thích ứng (Adaptive Quizzes) và lập lịch ôn tập Spaced Repetition (SM-2). 

Thuật toán này phải hoạt động trực tuyến thời gian thực (Real-time online updates) trên Core Backend ngay sau mỗi lượt trả lời của sinh viên mà không gây trễ hiệu năng (latency), đồng thời giải quyết tốt bài toán khởi đầu lạnh (Cold Start) khi hệ thống chưa có dữ liệu lịch sử câu hỏi lớn.

## Các lựa chọn (Alternatives)

### Lựa chọn 1: Thuyết Ứng Đáp Câu Hỏi (IRT - Item Response Theory / Mô hình Rasch 1PL)
*Mô hình lý thuyết đo lường tâm lý học giáo dục cổ điển.*
- Ưu điểm: Độ chính xác lý thuyết và tính khoa học cực cao, phân tách độc lập hoàn hảo giữa năng lực học sinh và độ khó câu hỏi.
- Nhược điểm: Tính toán ước lượng tham số (MLE/Bayesian) cực kỳ nặng, không hỗ trợ cập nhật thời gian thực (real-time) tốt. Bị lỗi khởi đầu lạnh (Cold Start) nghiêm trọng khi chưa có đủ dữ liệu câu hỏi.

### Lựa chọn 2: Thuật toán tính điểm Elo-style (Elo Giáo Dục)
*Mô hình coi mỗi lượt làm bài của học sinh là một "trận đấu" giữa Năng lực Sinh viên và Độ khó Câu hỏi.*
- Ưu điểm: Tính toán thời gian thực (real-time) tức thì (< 1ms) nhờ công thức dạng đóng đơn giản. Giải quyết Cold Start cực tốt bằng cách gán điểm mặc định ban đầu. Tiết kiệm tối đa tài nguyên máy chủ.
- Nhược điểm: Độ chính xác lý thuyết thấp hơn IRT nếu xét trên tập dữ liệu tĩnh cực lớn. Điểm số có thể bị dao động mạnh nếu K-factor chọn không tối ưu.

## Quyết định (Decision)

Chọn **Lựa chọn 2: Thuật toán tính điểm Elo-style**.

## Lý do (Rationale)

1. Phù hợp hoàn hảo với kiến trúc MVP gọn nhẹ (**KISS & YAGNI**), giúp đẩy nhanh tiến độ sản phẩm và tối ưu chi phí vận hành máy chủ.
2. Đảm bảo vòng phản hồi (Feedback loop) cho sinh viên diễn ra ngay lập tức, cập nhật năng lực thời gian thực trên Concept Mind Map cục bộ.
3. Giải quyết bài toán Cold Start tối ưu mà không cần trải qua giai đoạn thi thử để hiệu chuẩn câu hỏi trước khi sử dụng.

## Hệ quả (Consequences)

- Cần tự động cập nhật độ khó câu hỏi (Dual-update) song song khi sinh viên trả lời để đảm bảo độ khó tiệm cận thực tế.
- Cần cấu hình hệ số $K$ (K-factor) phù hợp để tránh biến động điểm số quá mạnh chỉ vì một lần sinh viên bấm nhầm.
- Lộ trình dài hạn (Post-MVP): Khi dữ liệu đạt quy mô lớn, có thể chạy nền offline để hiệu chuẩn tham số câu hỏi theo mô hình IRT và đồng bộ lại vào hệ thống Elo trực tuyến.
