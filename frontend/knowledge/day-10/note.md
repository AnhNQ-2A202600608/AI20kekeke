# Day 10 - Data Pipeline & Data Observability

## 1. Data Pipeline Fundamentals

### 1.1 Khái niệm Data Pipeline cho Hệ thống AI
**Data Pipeline** là chuỗi các bước tự động hóa việc thu thập, xử lý và phân phối dữ liệu từ các nguồn (sources) khác nhau đến đích sử dụng cuối cùng. Trong kiến trúc ứng dụng AI/Agentic RAG điển hình, dữ liệu di chuyển qua các tầng sau:

```
[ Sources ] ──> [ Pipeline ] ──> [ Storage ] ──> [ Serving ] ──> [ Agent / LLM ]
```

- **Sources (Nguồn):** Cơ sở dữ liệu (SQL/NoSQL), Web APIs, File tĩnh (PDF, Docx), Event Streams (Kafka).
- **Pipeline:** Tự động hóa quá trình thu thập (Ingest) và biến đổi (Transform).
- **Storage (Lưu trữ):** Data Warehouse, Vector Database (ChromaDB, Pinecone).
- **Serving (Cung cấp):** Tầng cache, REST API phục vụ tìm kiếm.
- **Agent:** Mô hình LLM kết hợp công cụ và cơ chế RAG để phản hồi người dùng.

### 1.2 Điểm Khác Biệt Giữa BI Pipeline và AI Pipeline
Khi xây dựng hệ thống dữ liệu phục vụ AI, tư duy xử lý dữ liệu cần thay đổi so với các hệ thống Business Intelligence (BI) truyền thống:
- **Hệ thống BI:** Nếu dữ liệu bị lỗi, biểu đồ hoặc báo cáo trên dashboard sẽ hiển thị sai số. Người quản lý có thể phát hiện và sửa đổi thủ công.
- **Hệ thống AI:** Nếu dữ liệu bị lỗi (ví dụ: chunking bị lỗi khiến mất ngữ cảnh, metadata bị thiếu hoặc sai lệch), Agent sẽ nhận được context sai lệch và sinh câu trả lời bịa đặt (hallucination) trực tiếp cho người dùng cuối mà không có bộ lọc con người ở giữa.
- **Yêu cầu bổ sung cho AI Pipeline:** Cần tích hợp chặt chẽ việc cắt nhỏ văn bản hợp lý (chunking), làm sạch nhiễu OCR, làm giàu thông tin mô tả (metadata enrichment), chuyển đổi vector (embeddings) và ghi nhật ký truy vết (trace logs).

### 1.3 So sánh ETL và ELT trong Thiết kế Hệ thống AI

| Tiêu chí | ETL (Extract → Transform → Load) | ELT (Extract → Load → Transform) |
| :--- | :--- | :--- |
| **Cơ chế** | Biến đổi và làm sạch dữ liệu trước khi lưu trữ vào kho. | Nạp dữ liệu thô vào kho trước, thực hiện biến đổi sau. |
| **Ưu điểm** | - Đảm bảo dữ liệu nhạy cảm (PII) được xử lý trước khi lưu trữ.<br>- Giảm thiểu tài nguyên lưu trữ dữ liệu bẩn. | - Giữ lại dữ liệu gốc phục vụ tái thử nghiệm.<br>- Xử lý nhanh lượng dữ liệu khổng lồ, đa cấu trúc. |
| **Nhược điểm** | - Kém linh hoạt khi muốn thay đổi logic biến đổi.<br>- Khó thực hiện replay hay backfill dữ liệu thô. | - Tốn chi phí lưu trữ dữ liệu thô nhạy cảm.<br>- Yêu cầu kiểm soát quyền truy cập dữ liệu thô chặt chẽ. |
| **Khi nào chọn** | - Dữ liệu nhạy cảm cần ẩn danh (PII Redaction) trước khi nạp vector store ngoại vi.<br>- Schema ổn định, yêu cầu sạch tối đa. | - RAG cần liên tục thử nghiệm các kỹ thuật chunking khác nhau.<br>- Tải dữ liệu từ nhiều nguồn phi cấu trúc đa dạng. |

> **Thực tế doanh nghiệp:** Hầu hết các đội ngũ AI/LLM sử dụng mô hình **Hybrid (Lai)**. Toàn bộ dữ liệu thô được nạp vào hồ dữ liệu (Data Lake - ELT), tuy nhiên các thông tin nhạy cảm như thông tin cá nhân (PII), thông tin thẻ tín dụng, mật khẩu bắt buộc phải đi qua một cổng lọc sạch (ETL) trước khi được tạo embeddings và lưu trữ tại Vector Database phục vụ Agent.

### 1.4 Batch vs. Streaming Processing

- **Batch Processing (Xử lý theo lô):**
  - Thực thi theo lịch trình cố định (ví dụ: mỗi giờ hoặc mỗi ngày một lần).
  - *Đặc điểm:* Đơn giản, chi phí thấp, dễ debug và rollback dữ liệu.
  - *Ứng dụng:* Cập nhật tài liệu hướng dẫn học tập, văn bản chính sách định kỳ.
- **Streaming Processing (Xử lý thời gian thực):**
  - Xử lý dữ liệu ngay lập tức khi phát sinh sự kiện.
  - *Đặc điểm:* Độ trễ cực thấp (mili giây), tuy nhiên kiến trúc phức tạp và chi phí vận hành rất cao.
  - *Ứng dụng:* Giám sát phát hiện gian lận giao dịch, đồng bộ tức thời trạng thái đơn hàng cho Agent CSKH.

---

## 2. Ingestion – Thu Thập Dữ Liệu Từ Nhiều Nguồn

Ingestion là giai đoạn đầu tiên của pipeline, chịu trách nhiệm kết nối và thu thập dữ liệu một cách ổn định từ các nguồn dữ liệu phức tạp.

### 2.1 Các Loại Nguồn Dữ Liệu Phổ Biến
- **Dữ liệu có cấu trúc (Structured):** Cơ sở dữ liệu quan hệ (PostgreSQL, MySQL), Data Warehouses (Snowflake, BigQuery). Sử dụng **Change Data Capture (CDC)** để bắt các sự kiện INSERT/UPDATE/DELETE thay vì quét lại toàn bộ bảng.
- **Dữ liệu phi cấu trúc (Unstructured):** Các tệp văn bản (CSV, JSON, PDF, Word) trong Object Storages (S3, GCS).
- **Event Streams:** Luồng sự kiện thời gian thực từ Kafka, Kinesis hoặc Webhooks.

### 2.2 Các Yêu Cầu Thiết Kế Ingestion cho AI Agent
Để tránh việc Agent sử dụng thông tin lỗi thời hoặc bị trùng lặp dữ liệu, Ingestion Layer cần hỗ trợ:
1. **Incremental Sync (Đồng bộ gia tăng):** Chỉ tải phần dữ liệu thay đổi kể từ lần chạy cuối cùng để tối ưu tài nguyên và tránh ghi đè toàn bộ hệ thống.
2. **Idempotent Upsert (Ghi đè bất biến):** Đảm bảo việc chạy lại pipeline nhiều lần cho cùng một dữ liệu đầu vào không tạo ra các chunk trùng lặp (duplicate chunks) trong Vector Store.
3. **Source Versioning:** Theo dõi phiên bản cập nhật của tài liệu gốc để biết chính xác phần dữ liệu nào đang được hiển thị với Agent.
4. **Xử lý sự cố mạng & Giới hạn:** Thiết lập cơ chế tự động thử lại có thời gian chờ tăng dần (exponential backoff) khi gọi API ngoài bị lỗi và điều phối tốc độ tiêu thụ dữ liệu (backpressure) để tránh quá tải.

---

## 3. Transform – Làm Sạch & Chuẩn Hóa Dữ Liệu

Raw data sau khi thu thập chứa rất nhiều tạp chất gây ảnh hưởng đến chất lượng biểu diễn không gian vector (embeddings).

### 3.1 Quy trình làm sạch dữ liệu văn bản (Text Normalization)
- **Chuẩn hóa Unicode:** Áp dụng chuẩn hóa NFC hoặc NFD cho tiếng Việt để tránh tình trạng cùng một từ nhưng có mã ký tự khác nhau (ví dụ: chữ `hòa` viết bằng phím gõ khác nhau).
- **Loại bỏ khoảng trắng nhiễu:** Thu gọn nhiều khoảng trắng liên tiếp, loại bỏ khoảng trắng ở đầu/cuối và các thẻ HTML thừa.
- **Standardization (Chuẩn hóa định dạng):** Đưa toàn bộ timestamp, mã lỗi, tên sản phẩm về một định dạng thống nhất (ví dụ: ngày tháng định dạng YYYY-MM-DD).

### 3.2 Kỹ thuật Chunking & Metadata Enrichment
- **Kích thước Chunk:**
  - *Chunk quá lớn:* Chứa nhiều chủ đề khác nhau, làm loãng vector embeddings và chiếm quá nhiều không gian ngữ cảnh (token budget) của mô hình.
  - *Chunk quá nhỏ:* Mất đi ngữ cảnh của các điều kiện ràng buộc xung quanh, dẫn đến Agent trả lời thiếu chính xác.
- **Metadata làm giàu:** 
  Mỗi chunk dữ liệu lưu vào Vector DB cần được đính kèm metadata phong phú: `source_doc_id`, `version`, `effective_date` (ngày hiệu lực), `owner_department` (phòng ban chịu trách nhiệm). 
  Metadata này giúp Agent lọc chính xác tài liệu theo phân quyền và trích dẫn nguồn (citation) chính xác trong câu trả lời.

---

## 4. Data Quality – 6 Dimensions

Chất lượng dữ liệu được đo lường qua 6 khía cạnh cốt lõi (6 Dimensions of Data Quality):

```
┌───────────────────────────────────────────────────────────────────┐
│                    6 DIMENSIONS OF DATA QUALITY                   │
├─────────────────┬─────────────────────────────────────────────────┤
│ Completeness    │ Đầy đủ, không thiếu bản ghi hoặc thuộc tính     │
├─────────────────┼─────────────────────────────────────────────────┤
│ Accuracy        │ Chính xác so với thực tế và quy tắc kinh doanh  │
├─────────────────┼─────────────────────────────────────────────────┤
│ Consistency     │ Nhất quán định dạng giữa các hệ thống           │
├─────────────────┼─────────────────────────────────────────────────┤
│ Timeliness      │ Đúng thời điểm, dữ liệu đủ tươi mới (Freshness) │
├─────────────────┼─────────────────────────────────────────────────┤
│ Validity        │ Hợp lệ, tuân thủ đúng định dạng và miền giá trị │
├─────────────────┼─────────────────────────────────────────────────┤
│ Uniqueness      │ Duy nhất, không xảy ra trùng lặp dữ liệu        │
└─────────────────┴─────────────────────────────────────────────────┘
```

### 4.1 Thiết lập Quality Gates trong Ingestion-Transform Pipeline
Để bảo vệ Vector Store không bị nhiễm dữ liệu bẩn, chúng ta cần đặt các chốt chặn chất lượng (Quality Gates) tại các điểm chuyển tiếp:
- **Schema Validation Gate:** Chặn các bản ghi thiếu trường bắt buộc (như thiếu `content`, `doc_id`).
- **Freshness Gate:** Tự động loại bỏ hoặc cảnh báo đối với các tài liệu đã hết hiệu lực.
- **Content Integrity Gate:** Kiểm tra độ dài văn bản tối thiểu, loại bỏ nhiễu OCR.
- **PII/Secrets Gate:** Chét chặn và che giấu các thông tin bảo mật như mật khẩu, token hoặc số thẻ tín dụng trước khi nạp vào Vector Database.

---

## 5. Data Observability

Data Observability giúp chúng ta theo dõi sức khỏe dữ liệu xuyên suốt toàn bộ luồng xử lý và chủ động phát hiện lỗi trước khi Agent trả lời sai tới người dùng.

### 5.1 Năm Trụ Cột của Data Observability
1. **Freshness:** Dữ liệu có được cập nhật đúng hạn?
2. **Distribution:** Phân phối dữ liệu có bất thường không (ví dụ: null rate tăng vọt)?
3. **Volume:** Số lượng dòng dữ liệu nạp vào có biến động mạnh không?
4. **Schema:** Detect các thay đổi cấu trúc bảng hoặc tệp tin đầu vào.
5. **Lineage:** Bản đồ mô tả đường đi của dữ liệu từ nguồn gốc cho tới kết quả đầu ra.

### 5.2 Cơ chế Truy Vết Dữ Liệu (Data Lineage)
Khi Agent đưa ra câu trả lời sai, kỹ sư cần khả năng truy vết ngược để tìm nguyên nhân gốc rễ (Root Cause Analysis). Một bản ghi trace log chuẩn cần lưu trữ:
- `request_id`: ID phiên hỏi đáp của người dùng.
- `retrieved_chunk_ids`: Danh sách ID các đoạn dữ liệu được RAG lấy ra.
- `pipeline_run_id`: ID của phiên chạy pipeline nạp dữ liệu.
- `source_doc_version`: Phiên bản của tài liệu gốc tại nguồn.

---

## 6. ETL Automation & Orchestration

Để tự động hóa hoàn toàn và vận hành an toàn hệ thống tuần hoàn dữ liệu, ta cần sử dụng các công cụ điều phối (Orchestrator).

### 6.1 So sánh các công cụ Orchestration phổ biến

| Công cụ | Mô hình điều phối | Điểm mạnh | Phù hợp nhất khi |
| :--- | :--- | :--- | :--- |
| **Apache Airflow** | DAG-based (Lập lịch tác vụ) | - Rất trưởng thành, cộng đồng lớn.<br>- Giao diện giám sát trực quan, đa dạng Operator. | Hệ thống Data Batch quy mô lớn, nhiều bước phụ thuộc phức tạp. |
| **Prefect** | Flow-based (Python-native) | - Ít boilerplate code.<br>- Hỗ trợ luồng chạy động linh hoạt. | Các đội ngũ muốn phát triển nhanh, viết pipeline trực tiếp bằng hàm Python. |
| **Dagster** | Asset-based (Quản lý tài sản dữ liệu) | - Theo dõi chặt chẽ Data Lineage.<br>- Kiểm soát chất lượng tại cấp độ Assets (bảng, index, files). | Dự án RAG/AI chuyên sâu về quản lý chất lượng và phiên bản của embeddings. |

### 6.2 Checklist Tự động hóa Pipeline & Xử lý Lỗi
- **Idempotency:** Bắt buộc đảm bảo tính bất biến. Chạy lại pipeline nhiều lần cho cùng một dữ liệu đầu vào phải cho ra một kết quả duy nhất.
- **Retry với Exponential Backoff:** Thiết lập cơ chế thử lại tự động khi gặp sự cố tạm thời (ví dụ: API của LLM hoặc Vector Store bị quá tải).
- **Dead Letter Queue (DLQ):** Cách ly các dòng dữ liệu bị lỗi schema hoặc PII sang một hàng đợi riêng để xử lý thủ công, tránh làm nghẽn toàn bộ luồng chạy.
- **Alerting & SLA monitoring:** Gửi cảnh báo ngay lập tức qua Slack/Email nếu pipeline bị lỗi hoặc không hoàn thành trước deadline quy định.
