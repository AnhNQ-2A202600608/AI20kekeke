# ADR-010: Lựa chọn Công nghệ cho Personalized Semantic Cache

**Ngày:** 2026-06-13  
**Trạng thái:** Accepted  

---

## Bối cảnh (Context)

Hệ thống Socratic AI Tutor (EduGap) cần tối ưu hóa độ trễ (latency) và chi phí sử dụng API LLM bằng cách lưu đệm câu trả lời. Tuy nhiên, do tính chất phản hồi cá nhân hóa (Personalized Socratic response), câu trả lời của AI Tutor phụ thuộc chặt chẽ vào trình độ năng lực hiện tại của sinh viên (Elo rating và trạng thái BKT). 

Chúng ta cần triển khai một **Personalized Semantic Cache** (Bộ nhớ đệm ngữ nghĩa cá nhân hóa) nhằm:
1. So khớp câu hỏi dựa trên độ tương đồng ý nghĩa (Vector Similarity Search) thay vì từ khóa chính xác.
2. Phân tách cache theo phân khúc năng lực của học viên (Elo band).

Cần lựa chọn công nghệ lưu trữ và tìm kiếm vector tối ưu giữa **Supabase (pgvector)** và **Redis (RedisVL)** cho hệ thống cache này.

---

## Các lựa chọn (Alternatives)

### Lựa chọn 1: Supabase (PostgreSQL với extension `pgvector`)
*   **Ưu điểm:**
    *   **Tập trung dữ liệu (Single DB):** Quản lý tập trung toàn bộ dữ liệu runtime và cache trên cùng một cơ sở dữ liệu Supabase Postgres.
    *   **Truy vấn kết hợp dễ dàng:** Dễ dàng thực hiện các câu lệnh SQL JOIN để kết hợp tìm kiếm độ tương đồng vector của câu hỏi với thông tin ELO của sinh viên từ bảng `users` trong cùng một lượt truy vấn.
    *   **Không phát sinh hạ tầng/chi phí:** Dự án đã cấu hình và sử dụng sẵn `pgvector` cho RAG pipeline (được ghi nhận trong ADR-004), do đó không tốn thêm chi phí thiết lập và vận hành máy chủ mới.
*   **Nhược điểm:**
    *   **Độ trễ (Latency):** Vì là disk-based database, tốc độ truy vấn vector (ngay cả khi sử dụng index HNSW) vẫn chậm hơn so với memory-based cache, trung bình khoảng 20ms - 50ms.
    *   **Không tối ưu cho chu kỳ ghi/xóa liên tục:** PostgreSQL không có cơ chế tự động hết hạn key (TTL) như các hệ thống cache chuyên dụng, đòi hỏi viết thêm script dọn dẹp (cleanup) dữ liệu cũ.

### Lựa chọn 2: Redis Vector Search (RedisVL)
*   **Ưu điểm:**
    *   **Hiệu suất cực cao:** Tốc độ truy vấn ở mức sub-millisecond (< 5ms) vì dữ liệu được lưu trữ và lập chỉ mục hoàn toàn trên bộ nhớ RAM.
    *   **Tính năng Cache chuyên dụng:** Hỗ trợ cơ chế tự động hết hạn (Time-To-Live - TTL) giúp dọn dẹp các cache cũ/ít sử dụng một cách tự động.
*   **Nhược điểm:**
    *   **Phức tạp hóa hạ tầng:** Cần duy trì, deploy và trả phí cho một máy chủ Redis (hoặc dịch vụ đám mây như Upstash Redis) trong môi trường production.
    *   **Truy vấn rời rạc (Two-step query):** Không thể thực hiện join dữ liệu trực tiếp. Hệ thống phải thực hiện 2 bước độc lập: FastAPI truy vấn Supabase lấy ELO học viên $\rightarrow$ Thực hiện tìm kiếm Vector trên Redis lọc theo Elo band.

---

## Quyết định (Decision)

Chọn **Lựa chọn 1: Supabase (PostgreSQL với extension `pgvector`)** làm giải pháp lưu trữ chính cho Personalized Semantic Cache trong giai đoạn này.

---

## Lý do (Rationale)

1.  **Tối ưu hóa tài nguyên:** Sử dụng hạ tầng pgvector sẵn có giúp đội ngũ phát triển không phải quản lý và trả phí thêm cho một cụm Redis Vector Search riêng biệt trong giai đoạn MVP.
2.  **Đơn giản trong truy vấn cá nhân hóa:** Việc tìm kiếm tương đồng vector kết hợp lọc theo phân khúc ELO học viên được thực hiện trọn vẹn và an toàn chỉ bằng một câu truy vấn SQL (sử dụng toán tử `<=>` của pgvector kết hợp điều kiện `WHERE elo_band = ...`), giảm thiểu logic phức tạp ở Backend.
3.  **Tốc độ đáp ứng đủ tốt:** Với tần suất truy cập của người dùng lớp học, tốc độ phản hồi 20ms - 50ms của HNSW Index trên Postgres hoàn toàn đáp ứng tốt trải nghiệm người dùng (so với 3s - 5s nếu phải gọi LLM).
4.  **Dễ dàng bảo trì:** Đội ngũ phát triển đã quen thuộc với Supabase và pgvector qua RAG pipeline, giúp việc viết code và bảo trì trở nên đồng nhất.

---

## Hệ quả (Consequences)

*   **Tải trọng Database:** Database Supabase sẽ chịu thêm tải trọng từ các lượt đọc/ghi cache. Cần cấu hình chỉ mục HNSW hợp lý để tránh nghẽn CPU khi lượng câu hỏi tăng cao.
*   **Quản lý dung lượng cache:** Cần viết một cron job định kỳ (ví dụ chạy PostgreSQL pg_cron hoặc Edge Function hằng tuần) để xóa các câu hỏi cache đã cũ hoặc ít được truy cập, giữ cho kích thước bảng cache luôn gọn gàng.
*   **Khả năng nâng cấp:** Trong tương lai, nếu hệ thống scale lên hàng triệu người dùng và yêu cầu độ trễ cực thấp, interface `BaseSemanticCache` đã được thiết kế sẵn sẽ giúp dễ dàng chuyển dịch driver sang RedisVL mà không ảnh hưởng tới logic ứng dụng.
