# Plan: Trích xuất Skills và Xây dựng Đồ thị Phụ thuộc bằng Graphusion

Kế hoạch này phác thảo các bước để triển khai hệ thống tự động đọc tài liệu học tập (các file markdown từ ngày 1 đến ngày 24 ở `src/pipeline/data/md`), trích xuất các kỹ năng/khái niệm (concepts/skills) theo từng ngày học, và xây dựng đồ thị phụ thuộc (concept dependency graph) dựa trên thuật toán và hướng dẫn từ paper **Graphusion** (`docs/research/literature/graphusion_paper.md`). Kết quả cuối cùng sẽ được đồng bộ trực tiếp vào cơ sở dữ liệu Supabase (`app.concepts` và `app.concept_relations`).

Kế hoạch này được thiết kế để các tác tử AI coding/IDE tự động thực thi các bước lập trình, cấu hình và chạy thử nghiệm.

---

## Các Phase Triển Khai (Phases)

### [Phase 1: Trích xuất Seed Concepts (Day-by-Day Concept Extraction)](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260622-2336-skills-dependency-graph/phase-01-seed-concepts.md)
- **Status**: [ ] Todo
- **Target**: Đọc các file markdown của từng ngày (`day-1` đến `day-24`), sử dụng LLM để trích xuất danh sách các khái niệm/kỹ năng chính (Seed Concepts - $Q$) xuất hiện trong ngày học đó với độ mịn (granularity) phù hợp.

### [Phase 2: Trích xuất Cạnh Quan hệ Ứng viên (Candidate Triplet Extraction)](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260622-2336-skills-dependency-graph/phase-02-candidate-triplets.md)
- **Status**: [ ] Todo
- **Target**: Sử dụng Chain-of-Thought (CoT) Prompt để tìm kiếm các mối quan hệ (ví dụ: `Prerequisite_of`, `Used_for`, v.v.) giữa các concept ứng viên từ nội dung slide và các ngày liền kề, tạo thành đồ thị ban đầu ($ZS-KG$).

### [Phase 3: Dung hợp Đồ thị và Giải quyết Xung đột (Graph Fusion & Conflict Resolution)](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260622-2336-skills-dependency-graph/phase-03-graph-fusion.md)
- **Status**: [ ] Todo
- **Target**: Triển khai Module Fusion của Graphusion: gộp các thực thể đồng nghĩa (Entity Merging), giải quyết các xung đột quan hệ (Conflict Resolution - ví dụ: loại bỏ vòng phụ thuộc hoặc quan hệ mâu thuẫn) và suy luận ra các mối quan hệ mới dựa trên ngữ cảnh nền (Background text).

### [Phase 4: Tích hợp Database và Đồng bộ Hóa (Database Ingestion)](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260622-2336-skills-dependency-graph/phase-04-database-ingestion.md)
- **Status**: [ ] Todo
- **Target**: Lưu danh sách Concept mới vào `app.concepts` và nạp toàn bộ cạnh quan hệ đã được phê duyệt vào bảng `app.concept_relations` của Supabase. Đồng bộ hóa với schema PostgreSQL 17 hiện tại.

### [Phase 5: Kiểm thử và Đánh giá (Verification & Evaluation)](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260622-2336-skills-dependency-graph/phase-05-evaluation.md)
- **Status**: [ ] Todo
- **Target**: Xây dựng kịch bản kiểm thử (Verification suite) để kiểm tra tính toàn vẹn của đồ thị (không có chu trình phụ thuộc, đúng schema), chạy test logic và đảm bảo hệ thống API adaptive hoạt động trơn tru.

---

## Các Liên kết Ngữ cảnh chính (Key Dependencies & Context)
- **Paper Graphusion**: [graphusion_paper.md](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/docs/research/literature/graphusion_paper.md)
- **Thư mục chứa dữ liệu MD**: [src/pipeline/data/md/](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/pipeline/data/md)
- **Database Client Interface**: [supabase_database.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/supabase_database.py)
- **API Routes**: [adaptive_routes.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/api/adaptive_routes.py)
