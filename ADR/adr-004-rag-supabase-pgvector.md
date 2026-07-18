# ADR-004: Xây dựng RAG Pipeline tích hợp Supabase pgvector và GPT-4o-mini

**Ngày:** 2026-06-10
**Trạng thái:** Reviewed

## Bối cảnh (Context)

Hệ thống AI Tutor cần tích hợp cơ chế Retrieval-Augmented Generation (RAG) để trả lời các câu hỏi của sinh viên dựa trên học liệu chính thức (các slide học tập đã được chuyển đổi sang Markdown tại `src/pipeline/data/md/`).
Để tiến hành triển khai, chúng ta cần thống nhất các quyết định kỹ thuật về:
1. Mô hình ngôn ngữ (LLM): Lựa chọn `gpt-4o-mini`.
2. Phương án phân đoạn văn bản (Chunking Strategy): Chunking theo từng slide.
3. Vector Database: Sử dụng Supabase pgvector (người dùng đã có sẵn tài nguyên Supabase).
4. Embedding Model: Lựa chọn mô hình để chuyển đổi text slide sang vector biểu diễn.

## Các lựa chọn (Alternatives)

### Lựa chọn 1: ChromaDB (Local File-based Vector Store)
- **Ưu điểm**: Setup cực kỳ nhanh gọn, chạy trực tiếp trong local memory/disk của Backend, không phụ thuộc service ngoài.
- **Nhược điểm**: Khó chia sẻ dữ liệu giữa các instance khi deploy multi-node (ví dụ: trên cloud/container), hiệu năng giảm khi lượng tài liệu tăng, không tận dụng được cơ sở dữ liệu quan hệ sẵn có.

### Lựa chọn 2: Supabase pgvector (Quyết định)
- **Ưu điểm**: Tận dụng trực tiếp database PostgreSQL của dự án, hỗ trợ đầy đủ truy vấn SQL kết hợp với tìm kiếm vector (hybrid search), dễ dàng deploy và đồng bộ, độ ổn định doanh nghiệp (production-ready).
- **Nhược điểm**: Cần cài đặt extension `vector` trên PostgreSQL, tạo bảng và viết hàm tìm kiếm similarity bằng SQL hoặc RPC.

### Lựa chọn 3: Qdrant / Pinecone (Dedicated Vector Database)
- **Ưu điểm**: Tối ưu hóa cực mạnh cho tìm kiếm vector ở quy mô hàng triệu vector, tính năng tìm kiếm nâng cao đa dạng.
- **Nhược điểm**: Phát sinh thêm chi phí vận hành dịch vụ độc lập, tăng độ phức tạp trong kiến trúc hệ thống đối với quy mô MVP.

## Quyết định (Decision)

Chọn **Lựa chọn 2: Supabase pgvector** làm Vector Database, kết hợp với:
- **LLM**: `gpt-4o-mini` (OpenAI).
- **Embedding Model**: `text-embedding-3-small` (OpenAI, kích thước vector 1536).
- **Chunking**: Phân đoạn theo từng slide dựa trên các thẻ phân tách `---` và tiêu đề `## Page X` trong file Markdown.

## Lý do (Rationale)

1. **Hiệu năng & Chi phí tối ưu**: `gpt-4o-mini` và `text-embedding-3-small` của OpenAI cung cấp tỷ lệ hiệu năng/giá thành tốt nhất hiện tại cho các ứng dụng giáo dục.
2. **Chunking Slide Chính Xác**: Học liệu dạng slide chứa lượng thông tin cô đọng theo từng trang. Chunking theo slide giúp giữ nguyên ngữ cảnh của từng trang, đồng thời hỗ trợ trích dẫn nguồn cực kỳ chính xác.
3. **Quản lý Dữ liệu Tập trung**: Tận dụng Supabase pgvector giúp hợp nhất toàn bộ dữ liệu quan hệ (Mastery Elo, sinh viên, log chat) và dữ liệu vector vào cùng một hệ thống cơ sở dữ liệu.
4. **Hỗ trợ Citation chính xác**: Mỗi vector lưu trữ sẽ có metadata chứa `document_name` và `slide_number`. Khi retrieve, Backend dễ dàng trích xuất thông tin này để làm nguồn đối chiếu và sinh Citation.

## Hệ quả (Consequences)

- Cần kích hoạt extension `vector` trong Supabase: `CREATE EXTENSION IF NOT EXISTS vector;`.
- Cần tạo bảng `slide_embeddings` lưu trữ nội dung slide, embedding vector (1536 chiều), tên tài liệu và số thứ tự slide.
- Cần viết hàm SQL (RPC) trong Postgres để tính toán khoảng cách cosine distance và trả về kết quả tương đồng nhất.
- Cần bổ sung các biến môi trường cấu hình Supabase vào file `.env` (ví dụ: `SUPABASE_DATABASE_URL`).
- Cần viết script Ingestion để chạy offline/command-line nạp dữ liệu slide vào Supabase.
