# ADR-009: Ứng dụng khung Graphusion để tự động xây dựng Đồ thị tri thức khóa học

**Ngày:** 2026-06-13
**Trạng thái:** Accepted

## Bối cảnh (Context)

Hiện tại hệ thống học tập thích ứng (Adaptive Learning) của dự án **C2-App-125** đang theo dõi năng lực học sinh qua các kỹ năng độc lập (Flat Skills Model). Điều này dẫn đến 3 hạn chế lớn:
1. **Khởi đầu lạnh (Cold Start) từng ngày:** Khi học sinh chuyển sang ngày học mới (chủ đề mới), hệ thống chưa có dữ liệu làm bài để đánh giá năng lực của học sinh trên kỹ năng mới này, dẫn đến việc gợi ý câu hỏi phải làm lại từ đầu.
2. **Chatbot RAG rời rạc:** Hệ thống chatbot Socratic RAG truy vấn bằng Vector Search thông thường chỉ so khớp ngữ nghĩa trên các chunk văn bản thô, dẫn đến câu trả lời thiếu tính liên kết sư phạm chặt chẽ giữa các ngày học.
3. **Chi phí thiết kế bản đồ kỹ năng cao:** Việc xây dựng bản đồ kỹ năng (Skill Map) thủ công đòi hỏi tốn kém nhiều thời gian của chuyên gia sư phạm.

Cần lựa chọn giải pháp để tự động hóa xây dựng sơ đồ khái niệm bài học từ tài liệu slide bài giảng và tích hợp vào các thuật toán thích ứng hiện tại (Elo/BKT/LinUCB).

---

## Các lựa chọn (Alternatives)

### Lựa chọn 1: Thiết kế thủ công (Manual Skill Mapping)
- **Ưu điểm:** Đồ thị chính xác 100% theo ý muốn của giáo viên, không tốn chi phí gọi LLM API.
- **Nhược điểm:** Tốn nhiều công sức, khó mở rộng khi số lượng khóa học và tài liệu tăng lên, không có khả năng tự động hóa.

### Lựa chọn 2: Khung trích xuất cục bộ (Local LLM Triplet Extraction)
- **Ưu điểm:** Đơn giản, dùng LLM để trích xuất thực thể và quan hệ từ từng trang slide thô.
- **Nhược điểm:** Bị trùng lặp thực thể (ví dụ: "BKT" và "Bayesian Knowledge Tracing" bị coi là 2 thực thể khác nhau), mâu thuẫn quan hệ giữa các tài liệu, thiếu góc nhìn toàn cục.

### Lựa chọn 3: Áp dụng khung Graphusion (Global Graph Fusion RAG)
- **Ưu điểm:** 
  - Khắc phục lỗi trùng lặp bằng thuật toán Node Merging toàn cục.
  - Tự động hóa hoàn toàn 90% từ tài liệu slide qua Topic Modeling (BERTopic).
  - Giải quyết mâu thuẫn quan hệ và tự động suy luận ra các quan hệ gián tiếp (Novel Triplet Inference).
  - Tối ưu hóa được cho cả truy vấn RAG của Chatbot.
- **Nhược điểm:** Phức tạp hơn trong cài đặt ban đầu, tốn chi phí gọi LLM API ở giai đoạn chạy offline để xây dựng đồ thị.

---

## Quyết định (Decision)

Chọn **Lựa chọn 3: Áp dụng khung Graphusion (Global Graph Fusion RAG)** để xây dựng Đồ thị tri thức môn học (Offline) và tích hợp vào luồng đánh giá/gợi ý thích ứng trực tuyến.

---

## Lý do (Rationale)

1. **Khả năng tự động hóa cao:** Tận dụng crawler slide LMS hiện có để tự động trích xuất bản đồ khái niệm, giải phóng sức lao động của lập trình viên và giáo viên.
2. **Giải quyết triệt để bài toán Cold Start từng ngày:** Quan hệ tiên quyết (`Prerequisite_of`) được tạo ra trên đồ thị giúp lan truyền tri thức (Graph BKT) từ kết quả làm bài của ngày hôm trước để ước lượng năng lực khởi điểm cho ngày hôm sau.
3. **Tối ưu hóa Socratic Chatbot:** Tăng chất lượng câu trả lời bằng cách truy vấn kết hợp Vector Search và Graph Traversal.
4. **Triển khai ở chế độ Offline:** Xây dựng đồ thị tri thức offline một lần khi khởi tạo khóa học để tránh overengineering, tiết kiệm chi phí token và không tăng độ trễ lúc vận hành thực tế.

---

## Hệ quả (Consequences)

- Cần thiết lập thêm 2 bảng cơ sở dữ liệu `concepts` và `concept_relations` trên Supabase.
- Cải tiến thuật toán BKT hiện tại để hỗ trợ lan truyền xác suất trên đồ thị (Graph BKT).
- Cần viết thêm script chạy offline (dùng BERTopic + LLM API) để trích xuất đồ thị từ các slide PDF.
- Tải đồ thị tri thức tĩnh về Next.js Client làm cơ sở cho thuật toán fallback khuyến nghị câu hỏi cục bộ.
