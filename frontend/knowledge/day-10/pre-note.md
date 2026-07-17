# Day 10 - Data Pipeline & Data Observability: Giám sát Hệ tuần hoàn Dữ liệu AI

> *"Agent mạnh đến đâu cũng vô dụng nếu dữ liệu nạp vào bị bẩn."*
> **Garbage in, garbage out** là quy luật bất biến của mọi hệ thống AI. Để đảm bảo agent hoạt động chính xác và đáng tin cậy, chúng ta cần một hệ thống tuần hoàn dữ liệu khỏe mạnh (Data Pipeline) cùng với cơ chế giám sát chất lượng liên tục (Data Observability).

---

### 1. Tổng quan: Vai trò của Dữ liệu trong Dự án AI
- **Keywords:** Data Pipeline, Ingestion, Transform, Data Quality, Data Observability, ETL vs ELT, Data Lineage, Quality Gates, Orchestration.
- **Thực tế dự án AI:** 60-80% thời gian của dự án AI thực tế là xử lý dữ liệu (data work) chứ không phải tối ưu hóa mô hình. Một Agent RAG được thiết kế tinh vi đến đâu vẫn sẽ trả lời sai (hallucinate) nếu Vector Store được nạp dữ liệu cũ, trùng lặp hoặc chứa lỗi.
- **Observability:** Cơ chế phát hiện dữ liệu sai lệch tự động trước khi người dùng cuối nhận thấy sự cố.

### 2. Sự Khác Biệt Giữa BI Pipeline và AI Pipeline
- **BI Pipeline (Business Intelligence):** Nhằm phục vụ các báo cáo và Dashboard. Lỗi dữ liệu dẫn đến các con số trên biểu đồ bị sai lệch.
- **AI Pipeline:** Nhằm phục vụ ngữ cảnh (Context) trực tiếp cho mô hình suy luận của Agent. Lỗi dữ liệu (ví dụ: chunking xấu, thiếu metadata) dẫn đến việc Agent đưa ra quyết định hoặc hành động sai trực tiếp tới người dùng. Do đó, AI Pipeline cần tích hợp sâu các bước: *chunking, metadata enrichment, embedding, retrieval checks và trace logs*.

---

### 3. Phép Ẩn Dụ: Nhà Máy Xử Lý Nước Sạch (Water Treatment Plant)

Hãy hình dung **Data Pipeline & Observability** giống như hệ thống cung cấp nước sạch cho đô thị:

```
[ Nguồn nước ] ──> [ Nhà máy xử lý ] ──> [ Bể kiểm tra ] ──> [ Đường ống dẫn ] ──> [ Vòi nước hộ dân ]
 (Raw Sources)       (Data Pipeline)      (Quality Gates)      (Observability)      (AI Agent / RAG)
```

1. **Nguồn nước thô (Raw Sources):** Nước sông, nước ngầm (APIs, Databases, Files). Nước thô có thể lẫn rác thải, hóa chất độc hại (dữ liệu lỗi, thông tin nhạy cảm PII như mật khẩu, API keys).
2. **Nhà máy xử lý (Data Ingestion & Transform):** 
   - *Lọc thô:* Gom nước về nhà máy (Ingestion).
   - *Lọc cát, khử trùng:* Loại bỏ rác, độc tố, PII (Data Cleaning & PII Redaction) và cắt nhỏ nước thành các chai nước đóng sẵn dễ phân phối (Chunking).
3. **Bể kiểm tra chất lượng (Quality Gates):** Trước khi xả nước vào mạng lưới tiêu dùng, nhân viên phòng lab phải kiểm tra các chỉ tiêu sinh hóa (Completeness, Accuracy, Validity). Nếu nước không đạt chuẩn, khóa van ngay lập tức (Fail Fast).
4. **Mạng lưới giám sát & Đồng hồ đo (Data Observability):** Theo dõi áp lực đường ống, lưu lượng nước chảy, phát hiện rò rỉ hoặc đổi màu nước (Freshness, Volume, Distribution, Lineage).
5. **Vòi nước tại hộ dân (AI Agent):** Hộ dân mở vòi sử dụng nước ăn uống (Agent lấy context sinh câu trả lời). Nếu nhà máy lọc bị lỗi hoặc bể kiểm tra bị bỏ qua, nước bẩn sẽ xả thẳng vào nhà dân gây ngộ độc (Agent hallucinate, lộ dữ liệu nhạy cảm).

---

### 4. Năm Trụ Cột của Data Observability
1. **Freshness (Độ tươi mới):** Dữ liệu có đang được cập nhật đúng lịch không? (Ví dụ: chính sách mới đã được đồng bộ vào Vector Store chưa?).
2. **Distribution (Sự phân phối):** Các giá trị dữ liệu có nằm trong khoảng bình thường không? (Ví dụ: tỷ lệ trường dữ liệu bị trống - null rate).
3. **Volume (Thể tích/Số lượng):** Số lượng bản ghi tăng/giảm đột biến có bất thường không? (Ví dụ: lượng tài liệu nạp hôm nay bỗng dưng bằng 0).
4. **Schema (Cấu trúc):** Cột dữ liệu có bị đổi tên, thêm mới hoặc xóa bỏ ngoài ý muốn không?
5. **Lineage (Phả hệ dữ liệu):** Dữ liệu bắt nguồn từ đâu, đi qua những bước transform nào và đang phục vụ những câu trả lời nào của Agent?

---

### 5. Sự Đánh Đổi giữa ETL và ELT
- **ETL (Extract -> Transform -> Load):** Thực hiện chuyển đổi và lọc sạch dữ liệu trước khi lưu kho. Thích hợp cho dữ liệu nhạy cảm (cần che giấu thông tin cá nhân - PII Redaction trước khi nạp vào vector store công cộng).
- **ELT (Extract -> Load -> Transform):** Nạp dữ liệu thô vào trước rồi biến đổi sau. Thích hợp khi dữ liệu khổng lồ, đa cấu trúc và cần lưu lại bản thô gốc để thử nghiệm nhiều chiến lược chunking/embedding khác nhau sau này.
- **Hybrid (Lai):** Phương pháp phổ biến nhất trong hệ AI - Nạp thô dữ liệu nhưng bắt buộc phải lọc sạch PII (ETL) đối với các trường dữ liệu nhạy cảm trước khi sinh vector embeddings.
