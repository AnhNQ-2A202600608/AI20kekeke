# Phase 1: Trích xuất Seed Concepts (Day-by-Day Concept Extraction)

## Context Links
- **Source Markdown files**: [src/pipeline/data/md/](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/pipeline/data/md)
- **Paper guidance on Seed Entity Generation**: [graphusion_paper.md#L120-L122](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/docs/research/literature/graphusion_paper.md#L120-L122)

## Overview
- **Priority**: High
- **Current Status**: Todo
- Nhiệm vụ chính của pha này là duyệt qua 24 thư mục bài học (`day-1` đến `day-24`), đọc các tài liệu bài giảng/slides định dạng Markdown, và sử dụng mô hình LLM để trích xuất ra một danh sách các khái niệm/kỹ năng trọng tâm (Seed Concepts) đại diện cho từng ngày. Điều này tương ứng với **Step 1: Seed Entity Generation** trong bài báo Graphusion, giúp định hình phạm vi các concept học thuật có độ mịn (granularity) hợp lý trước khi phân tích mối quan hệ.

## Key Insights từ Paper & Codebase
- **Độ mịn của thực thể (Entity Granularity)**: Paper chỉ ra việc trích xuất bằng LLM không có hướng dẫn dễ dẫn đến việc thực thể quá rộng (ví dụ: *Basic NLP Foundations*) hoặc quá hẹp. Mức độ chi tiết lý tưởng cho một concept/skill trong EduGap là tương đương với chủ đề của 1-2 slide, hoặc có trang Wikipedia riêng, hoặc là một kỹ năng cần thực hành (ví dụ: *Transformer Architecture*, *Self-Attention*, *Tokenization*, *LinUCB Bandit*).
- **Tránh tràn ngữ cảnh (Context Blowup)**: Không nạp tất cả các file markdown của 24 ngày vào cùng một prompt. Thay vào đó, xử lý song song hoặc tuần tự theo từng ngày (`day-1` $\rightarrow$ `day-2` $\rightarrow$ ...).
- **Mã hóa Concept (Concept Code)**: Mỗi concept cần có một mã duy nhất định dạng `kebab-case` (ví dụ: `self-attention`, `token-economy`) để dễ dàng làm việc ở bước sau.

## Requirements
- Viết script Python tự động quét tất cả thư mục ngày học.
- Thiết kế Prompt trích xuất concept có cấu trúc đầu ra là JSON (sử dụng Structured Outputs hoặc Pydantic parser).
- Đầu ra của pha này là file manifest lưu tạm: `outputs/seed_concepts.json`.

## Related Code Files
- [NEW] `src/pipeline/graphusion/extract_seed_concepts.py` (Script trích xuất concept)

## Implementation Steps
1. Khởi tạo cấu trúc file script tại `src/pipeline/graphusion/extract_seed_concepts.py`.
2. Viết hàm đọc toàn bộ nội dung markdown trong các thư mục `src/pipeline/data/md/day-{1..24}`.
3. Thiết kế Prompt gửi lên LLM (sử dụng Gemini Flash để tiết kiệm chi phí và xử lý nhanh) với các yêu cầu:
   - Trích xuất từ 3 đến 8 khái niệm/kỹ năng cốt lõi cho ngày học đó.
   - Trích xuất: `code` (kebab-case), `name` (tiếng Việt/Anh chuẩn học thuật), và `description` (tóm tắt ngắn gọn 1-2 câu).
   - Chỉ lọc các khái niệm học thuật chuyên môn (AI, LLM, RAG, DB, Frontend, Backend, Agentic...), bỏ qua các phần thủ tục, tên giảng viên, slide mở đầu chung chung.
4. Triển khai cơ chế lưu kết quả trích xuất vào `outputs/seed_concepts.json`.

## Todo List
- [ ] Thiết kế prompt trích xuất Seed Concepts với JSON Schema.
- [ ] Viết hàm quét thư mục và đọc dữ liệu markdown.
- [ ] Gọi API LLM để thực hiện trích xuất cho 24 ngày học.
- [ ] Tổng hợp kết quả và lưu vào `outputs/seed_concepts.json`.

## Success Criteria
- Trích xuất thành công danh sách concept của 24 ngày học không bị trùng lặp mã (unique code).
- File `outputs/seed_concepts.json` được tạo ra chứa đầy đủ các trường: `day`, `code`, `name`, `description`.
- Độ mịn của các concept hợp lý (ví dụ: `day1-transformer`, `day1-self-attention`, `day1-token-economy` thay vì chỉ có một concept `day1-basics`).

## Risk Assessment
- **Lỗi định dạng JSON từ LLM**: Phòng ngừa bằng cách sử dụng thư viện Pydantic/Instructor hoặc tính năng Structured Output của LLM API.
- **Concepts bị trùng lặp giữa các ngày**: Cho phép trích xuất tự nhiên, việc gộp và chuẩn hóa sẽ do Phase 3 (Graph Fusion) đảm nhận.
