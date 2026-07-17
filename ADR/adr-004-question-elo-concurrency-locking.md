# ADR-004: Giải pháp xử lý tranh chấp đồng thời (Concurrency) khi hiệu chuẩn Elo câu hỏi

**Ngày:** 2026-06-12
**Trạng thái:** Accepted

## Bối cảnh (Context)

Hệ thống học tập thích ứng tự động hiệu chuẩn độ khó của câu hỏi ($Question\_Elo$) ngay khi học sinh nộp bài làm thông qua API `/submit`. Điểm khó Elo mới được tính toán dựa trên Elo cũ và kết quả làm bài thực tế của học sinh. 

Trong môi trường thực tế, một câu hỏi có thể được làm bởi nhiều học sinh cùng một lúc (Concurrency). Nếu hai học sinh nộp bài cùng một thời điểm:
1. Tiến trình của Học sinh A đọc Elo của câu hỏi (ví dụ: 1200).
2. Tiến trình của Học sinh B đọc Elo của câu hỏi (cũng là 1200).
3. Học sinh A làm đúng $\rightarrow$ tính ra Elo mới là 1184 và ghi đè vào DB.
4. Học sinh B làm sai $\rightarrow$ tính ra Elo mới là 1216 và ghi đè vào DB.

Hệ quả là kết quả cập nhật của Học sinh A bị ghi đè chéo và mất hoàn toàn (**Lost Update / Race Condition**). Do đó, chúng ta cần chọn giải pháp xử lý tranh chấp đồng thời để bảo toàn tính nhất quán dữ liệu của ngân hàng câu hỏi.

## Các lựa chọn (Alternatives)

### Lựa chọn 1: Khóa bi quan (Pessimistic Locking - SELECT ... FOR UPDATE)
Thực hiện khóa dòng dữ liệu của câu hỏi khi đọc thông tin hiệu chuẩn trong transaction nộp bài:
* **Ưu điểm:** 
  * Ngăn chặn hoàn toàn việc đọc dữ liệu lỗi thời. Các request ghi đè chéo sẽ phải xếp hàng chờ một cách an toàn.
  * Đảm bảo tính nhất quán dữ liệu tuyệt đối (Strong Consistency).
  * Đơn giản, dễ cài đặt trực tiếp ở mức cơ sở dữ liệu quan hệ (PostgreSQL).
* **Nhược điểm:** 
  * Gây thắt nút cổ chai (lock contention) nếu có quá nhiều học sinh làm cùng một câu hỏi một lúc.
  * Phức tạp khi sử dụng với client HTTP REST mặc định của Supabase (PostgREST không hỗ trợ trực tiếp cú pháp khóa dòng `FOR UPDATE` trong SELECT, bắt buộc phải viết hàm thủ tục RPC trên Postgres).

### Lựa chọn 2: Cập nhật tăng/giảm động ở tầng DB (Atomic Delta Update)
Cập nhật Elo bằng câu lệnh cộng/trừ delta trực tiếp vào cột thay vì ghi đè số cứng:
* **Ưu điểm:** Khả năng chịu tải tốt hơn Khóa bi quan vì DB xử lý phép cộng/trừ tuần tự cực nhanh mà không cần giữ khóa đọc lâu.
* **Nhược điểm:** Phép tính delta $\Delta$ của Elo phụ thuộc vào xác suất thành công kỳ vọng $Expected$, mà $Expected$ lại phụ thuộc vào chính trị số Elo hiện tại của câu hỏi. Do đó, việc tính toán delta trên API server vẫn có thể bị lệch nếu giá trị Elo của câu hỏi thay đổi liên tục ở DB.

### Lựa chọn 3: Hiệu chuẩn bất đồng bộ qua hàng đợi (Event-Driven / Queue Processing)
Tách biệt hoàn toàn luồng nộp bài và hiệu chuẩn câu hỏi. API `/submit` chỉ cập nhật Elo của riêng học sinh và đẩy một Event chứa thông tin lượt làm bài vào Message Queue (ví dụ: RabbitMQ, Redis Streams). Một Background Worker sẽ subscribe, gom nhóm (Batch) và cập nhật tuần tự độ khó câu hỏi.
* **Ưu điểm:** 
  * Tối ưu hóa hiệu năng, giảm thiểu tối đa latency của API nộp bài (vì không cần động vào bảng `questions` lúc runtime).
  * Triệt tiêu hoàn toàn vấn đề khóa và tranh chấp đồng thời trên bảng `questions`.
* **Nhược điểm:** 
  * Tăng độ phức tạp của hạ tầng (cần cấu hình thêm Redis/RabbitMQ, viết Worker chạy nền).
  * Độ khó câu hỏi được cập nhật có độ trễ (Eventual Consistency) thay vì thời gian thực.

## Quyết định (Decision)

Chọn **Lựa chọn 1: Khóa bi quan (Pessimistic Locking)** cho giai đoạn hiện tại (MVP/Short-term).

Đồng thời, ghi nhận **Lựa chọn 3: Hiệu chuẩn bất đồng bộ qua hàng đợi (Event-Driven)** làm lộ trình nâng cấp kiến trúc khi lượng người dùng đồng thời tăng cao trong tương lai (Scale-path).

## Lý do (Rationale)

1. **Đảm bảo tính chính xác tuyệt đối:** Elo câu hỏi cần được hiệu chuẩn chính xác theo trình tự thời gian thực để thuật toán LinUCB gợi ý đúng câu hỏi tiếp theo trong vùng ZPD. Khóa bi quan đảm bảo tính toàn vẹn này mà không bị sai lệch thuật toán.
2. **KISS & YAGNI:** Ở giai đoạn hiện tại, lượng học sinh đồng thời làm cùng một câu hỏi chưa đủ lớn để gây nghẽn hàng đợi (lock contention). Việc triển khai Khóa bi quan giúp tiết kiệm thời gian phát triển và giảm chi phí hạ tầng so với việc cài đặt Message Queue / Worker ngầm.
3. **Giải pháp tích hợp với Supabase:** Để giải quyết hạn chế của PostgREST (không hỗ trợ `FOR UPDATE`), chúng ta sẽ viết một database function (RPC) trên Postgres của Supabase để bọc transaction hoặc thực hiện qua kết nối TCP SQLAlchemy trực tiếp.

## Hệ quả (Consequences)

* Tầng database cần viết một hàm thủ tục (RPC) hoặc sử dụng pool connection TCP của SQLAlchemy để thực hiện khóa hàng `FOR UPDATE` khi đọc dữ liệu câu hỏi trong transaction nộp bài.
* API `/submit` có thể tăng nhẹ latency nếu có nhiều người cùng nộp bài trên một câu hỏi, nhưng điều này chấp nhận được ở quy mô hiện tại.
* Cần giám sát hiệu năng khóa (lock metrics) của database. Khi phát hiện chỉ số lock wait time tăng cao, hệ thống sẽ kích hoạt lộ trình chuyển đổi sang kiến trúc **Event-Driven (Lựa chọn 3)**.

---

## Phụ lục: Thiết kế Chi tiết Luồng Bất đồng bộ qua RabbitMQ (Lộ trình Lựa chọn 3)

Khi hệ thống chuyển đổi sang kiến trúc hướng sự kiện ở giai đoạn mở rộng (Scale-path), thiết kế chi tiết cho luồng RabbitMQ sẽ như sau:

### 1. Topology & Định tuyến (Routing)
* **Exchange:** `adaptive.events` (định dạng `Topic Exchange`).
* **Routing Key:** `attempt.submitted`.
* **Queue:** `adaptive.question-calibration` (Durable queue để chống mất mát dữ liệu).
* **Cơ chế phân tải nâng cao (Consistent Hash Exchange):** Để triệt tiêu hoàn toàn race-condition mà không cần dùng đến khóa bi quan ở DB, ta cấu hình RabbitMQ định tuyến tin nhắn dựa trên mã băm (`hash`) của `question_id`. Nhờ đó, tất cả các lượt làm bài của cùng một câu hỏi sẽ luôn luôn được đẩy về cùng một Worker (hoặc Thread) duy nhất để xử lý tuần tự, loại bỏ hoàn toàn khả năng ghi đè chéo.

### 2. Định dạng Tin nhắn (Message Payload Schema)
```json
{
  "event_id": "uuid",
  "event_type": "quiz_attempt_submitted",
  "timestamp": "iso-datetime",
  "data": {
    "student_id": "uuid",
    "question_id": "uuid",
    "actual_score": 1.0,
    "hint_count": 0,
    "used_ai_help": false
  }
}
```

### 3. Logic xử lý của Worker (Consumer)
* **Gom nhóm theo lô (Batch Processing):** Worker không cập nhật DB ngay cho mỗi tin nhắn đơn lẻ. Thay vào đó, nó sẽ gom góp (Buffer) tin nhắn trong một cửa sổ thời gian (ví dụ: 10 giây hoặc khi đạt 100 tin nhắn).
* **Tính toán gộp:** Worker tính toán Elo trung bình hoặc chạy cập nhật tuần tự trên RAM rồi ghi đè một lần duy nhất xuống bảng `app.questions` ở DB, giảm tải tối đa số lượt ghi (IOPS) vào database.

