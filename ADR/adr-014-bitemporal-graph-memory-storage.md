# ADR-014: Thiết kế Bộ nhớ Đồ thị Hai thời gian (Bitemporal Graph Memory) trong Supabase PostgreSQL

**Ngày:** 2026-06-24
**Trạng thái:** Accepted (Đã triển khai)

## Bối cảnh (Context)

Hệ thống AI Tutor thích ứng (Mentora) yêu cầu lưu trữ và truy vấn thông minh tiến trình học tập của sinh viên:
1. **Cá nhân hóa Socratic theo phong cách học (Learning Style):** AI cần theo dõi tốc độ thay đổi năng lực (Elo derivative $\frac{d\text{Elo}}{dt}$) tương ứng với từng cấp độ gợi ý (Level 1 Hint, Level 2 Analogy, Level 3 Code Skeleton) qua thời gian để tự động tối ưu hóa chính sách hướng dẫn.
2. **Hiệu chỉnh hồi tố (Retroactive Calibration):** Trong mô hình Graph-BKT, khi phát hiện lỗi sai ở chương nâng cao (Ví dụ: Ngày 7), hệ thống cần cập nhật giảm điểm Mastery của chương cơ bản (Ví dụ: Ngày 6) về mặt *thời gian hiệu lực* (Valid Time) trong quá khứ, nhưng thực hiện tại *thời điểm giao dịch* hiện tại (Transaction Time).
3. **Giải thích quyết định (Explainable AI):** Cung cấp khả năng "Time-travel" (du hành thời gian) để truy vấn xem tại một thời điểm chính xác trong quá khứ, AI đã đưa ra quyết định gợi ý câu hỏi dựa trên trạng thái năng lực nào của học sinh.

Hiện tại, cơ sở dữ liệu đang ghi đè (overwrite) trực tiếp điểm Elo và BKT lên bảng `student_mastery`, làm mất hoàn toàn lịch sử tiến hóa năng lực và không thể thực hiện các phân tích/hồi tố trên.

## Các lựa chọn (Alternatives)

### Lựa chọn 1: Sử dụng Cơ sở dữ liệu Đồ thị độc lập (Neo4j / Graphiti Zep)
- **Ưu điểm:** Hỗ trợ mô hình đồ thị và các quan hệ phức tạp một cách tự nhiên. Graphiti cung cấp sẵn mô hình bitemporal cho các Agent hội thoại.
- **Nhược điểm:** Phức tạp hóa hạ tầng (tăng chi phí vận hành, cài đặt thêm container, quản lý đồng bộ dữ liệu giữa PostgreSQL và Graph DB). Tăng độ trễ mạng khi gọi chéo giữa các service.

### Lựa chọn 2: Ghi log lịch sử đơn giản dạng Append-only (Bảng log phẳng)
- **Ưu điểm:** Thiết lập dễ dàng, ghi log tuần tự mỗi khi có cập nhật.
- **Nhược điểm:** Cực kỳ khó khăn khi truy vấn bitemporal (đối chiếu giao chéo thời gian hiệu lực và thời gian ghi nhận). Không hỗ trợ các ràng buộc không trùng lặp (non-overlapping constraint) ở mức cơ sở dữ liệu, dẫn đến rủi ro sai lệch dữ liệu tiến trình.

### Lựa chọn 3: Triển khai Bitemporal Graph Memory trực tiếp trên Supabase PostgreSQL (Sử dụng `tstzrange`)
- **Ưu điểm:** 
  - Tận dụng kiểu dữ liệu dải thời gian `tstzrange` của PostgreSQL để lưu trữ hai trục thời gian (Valid Time & Transaction Time).
  - Sử dụng GiST index và Constraint Exclusion để đảm bảo tính toàn vẹn dữ liệu (không bao giờ có 2 khoảng thời gian năng lực trùng lặp của cùng một học sinh trên cùng một concept).
  - Chi phí hạ tầng bằng 0 (chạy trực tiếp trên Supabase hiện có).
  - Truy vấn cực nhanh với các toán tử dải thời gian (`@>`, `&&`).
- **Nhược điểm:** Đòi hỏi lập trình viên phải có kiến thức sâu về PostgreSQL temporal modeling, câu lệnh truy vấn viết lại phức tạp hơn.

## Quyết định (Decision)

Chọn **Lựa chọn 3: Triển khai Bitemporal Graph Memory trực tiếp trên Supabase PostgreSQL**.

Các bước thực hiện cụ thể:
1. **Thiết lập Schema:** Tạo bảng `app.student_mastery_bitemporal` sử dụng cấu trúc `valid_time TSTZRANGE` và `transaction_time TSTZRANGE`.
2. **Khóa Concurrency:** Sử dụng chỉ mục loại trừ `EXCLUDE USING gist` để bảo vệ tính nhất quán khoảng thời gian.
3. **Đóng gói logic:** Tạo PostgreSQL Views để hỗ trợ backend truy vấn dữ liệu hiện tại (Active State) một cách đơn giản mà không cần viết các mệnh đề `@>` phức tạp.

## Lý do (Rationale)

- **KISS & YAGNI:** Tránh việc đưa thêm hạ tầng Neo4j/Graphiti vào dự án khi PostgreSQL hoàn toàn có khả năng xử lý bài toán bitemporal với hiệu năng vượt trội.
- **Engineering Depth:** Thể hiện trình độ thiết kế hệ thống dữ liệu cao cấp, cung cấp đầy đủ khả năng kiểm toán dữ liệu lịch sử và phục vụ tối ưu cho nghiên cứu khoa học thích ứng của dự án.
- **Tính Nhất Quán:** Giữ toàn bộ dữ liệu quan hệ, dữ liệu vector và dữ liệu temporal trên một Supabase instance duy nhất, giảm thiểu tối đa rủi ro lệch đồng bộ dữ liệu.

## Hệ quả (Consequences)

- **Tăng không gian lưu trữ (Storage):** Dung lượng bảng sẽ tăng theo tuyến tính do cơ chế ghi mới (Insert-only). Tuy nhiên, dung lượng này là chấp nhận được vì tần suất cập nhật chỉ xảy ra khi kết thúc quiz hoặc kết thúc chat session.
- **Truy vấn phức tạp:** Cần viết sẵn các views hoặc hàm helper ở backend để che giấu độ phức tạp của câu lệnh SQL range.
