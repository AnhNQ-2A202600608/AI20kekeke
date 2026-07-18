# ADR-005: Kiến trúc cá nhân hóa Chatbot và Tối ưu hóa Latency Bộ nhớ 2 tầng

**Ngày:** 2026-06-12
**Trạng thái:** Accepted

## Bối cảnh (Context)
- Chatbot trong dự án AI20K-C2-HE-01 cần cá nhân hóa câu trả lời dựa trên năng lực của từng học sinh (đo bằng chỉ số Elo và BKT của từng Concept).
- Việc truy vấn trực tiếp vào database chính (Supabase/Postgres) để lấy và cập nhật chỉ số Elo/BKT cho mỗi lượt chat (turn-by-turn) gây ra latency lớn, ảnh hưởng tiêu cực đến trải nghiệm người dùng (UX).
- Cần có cơ chế quản lý bộ nhớ (Memory) hiệu quả:
  - Vừa lưu trữ tạm thời các chỉ số cập nhật tức thời trong lượt hội thoại.
  - Vừa giảm thiểu tần suất kết nối và ghi xuống database chính.
  - Đảm bảo tính linh hoạt khi triển khai từ môi trường local phát triển lên production (chuyển đổi từ in-memory sang Redis Docker và cuối cùng là Upstash Redis cloud).

## Các lựa chọn (Alternatives)

### Lựa chọn 1: Lưu trữ và cập nhật đồng bộ trực tiếp trên Database chính (Supabase/Postgres)
- **Ưu điểm:** Đơn giản nhất, tính toàn vẹn dữ liệu cực cao, không lo mất dữ liệu.
- **Nhược điểm:** Latency rất lớn (mỗi tin nhắn đều block bởi tác vụ I/O ghi DB). DB chính dễ bị quá tải khi nhiều học sinh chat đồng thời.

### Lựa chọn 2: Ghi hoãn cuối Session (Deferred Session Write-back)
- **Ưu điểm:** Chỉ ghi DB một lần duy nhất lúc cuối session, latency cực thấp trong suốt session.
- **Nhược điểm:** Khó bắt chính xác sự kiện kết thúc session trên giao thức HTTP stateless. Rủi ro mất toàn bộ dữ liệu session (data loss) nếu người dùng tắt trình duyệt đột ngột hoặc server crash.

### Lựa chọn 3: Bộ nhớ 2 tầng (Short-term Cache + Asynchronous Background Writes)
- **Cách hoạt động:**
  - **Short-term Memory (Tầng Cache/State):** Đọc/ghi Elo/BKT tạm thời từ Redis (hoặc In-memory dict ở local). Mỗi lượt chat sẽ đọc và cập nhật chỉ số trực tiếp trên Cache này (<1ms).
  - **Asynchronous Long-term Sync (Tầng DB):** Khi có thay đổi Elo/BKT, backend cập nhật cache trước để phản hồi ngay, đồng thời kích hoạt một Task chạy ngầm bất đồng bộ (FastAPI `BackgroundTasks`) để đồng bộ dữ liệu xuống database chính (Supabase) dưới nền mà không block HTTP response của user.
- **Ưu điểm:** Latency phản hồi cực thấp. Dữ liệu được cập nhật xuống DB chính gần như thời gian thực (realtime) mà không ảnh hưởng tới UX. An toàn dữ liệu cao hơn Lựa chọn 2.
- **Nhược điểm:** Phức tạp hơn khi triển khai quản lý cache và worker ngầm.

## Quyết định (Decision)
Chọn **Lựa chọn 3: Bộ nhớ 2 tầng (Short-term Cache + Asynchronous Background Writes)**.
- Giai đoạn phát triển hiện tại (Local dev): Sử dụng **In-memory cache** (Python dict) hoặc **Redis Docker** local.
- Giai đoạn Production: Chuyển cấu hình sang sử dụng **Upstash Redis** (Serverless Redis cloud) để scale tốt hơn và không tốn công quản lý hạ tầng.

## Lý do (Rationale)
1. **Trải nghiệm người dùng:** Tối ưu hóa tối đa thời gian phản hồi (latency) của chatbot. API chat trả kết quả ngay sau khi LLM phản hồi mà không bị block bởi I/O database.
2. **Khả năng tương thích hạ tầng:** Việc sử dụng một Interface Cache đồng nhất giúp backend dễ dàng chuyển đổi cấu hình lưu trữ (`in-memory` -> `redis_docker` -> `upstash_redis`) thông qua cấu hình biến môi trường.
3. **An toàn dữ liệu:** Giải quyết vấn đề mất mát dữ liệu của phương án ghi hoãn cuối session (Lựa chọn 2) bằng cách thực hiện ghi ngầm ngay lập tức sau mỗi lượt cập nhật.
4. **Hỗ trợ Socratic Hint:** Cập nhật Elo/BKT tức thời vào cache giúp lượt chat tiếp theo của chatbot nhận diện được chính xác sự thay đổi năng lực để điều chỉnh prompt thích ứng (Elo thay đổi -> System prompt thay đổi ngay lập tức).

## Hệ quả (Consequences)
- Backend cần thiết kế một Cache Service hoặc Cache Store abstraction hỗ trợ cả `in-memory` driver và `redis` driver.
- Cần quản lý cấu hình kết nối Redis/Upstash qua biến môi trường (`REDIS_URL`, `REDIS_TOKEN`).
- Rủi ro race condition nếu học sinh gửi nhiều tin nhắn dồn dập cùng lúc. Cần quản lý lock hoặc tuần tự hóa luồng trong LangGraph state saver.
