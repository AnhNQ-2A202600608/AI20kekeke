# ADR-009: Nạp Slide Học Liệu Định Dạng PDF & Lưu Trữ Hình Ảnh Trực Quan Trên Supabase Storage

**Ngày:** 2026-06-13
**Trạng thái:** Reviewed

## Bối cảnh (Context)

Hiện tại, hệ thống RAG (Retrieval-Augmented Generation) của dự án sử dụng định dạng Markdown (`.md`) làm học liệu đầu vào cho slide. Việc chuẩn bị học liệu Markdown đòi hỏi giảng viên phải soạn thảo hoặc chuyển đổi thủ công từ PowerPoint/Keynote, gây mất nhiều thời gian. 

Khi người dùng hỏi AI, hệ thống hiển thị văn bản slide thô ở khung **Trình chiếu học liệu** bên phải. Việc hiển thị văn bản thô này làm mất toàn bộ thiết kế trực quan (ảnh minh họa, sơ đồ, bảng biểu phức tạp và màu sắc định dạng gốc của slide).

Người dùng mong muốn:
1. Cho phép nạp trực tiếp tài liệu slide định dạng PDF (thuận tiện xuất từ PowerPoint).
2. Hiển thị slide trực quan, giữ nguyên 100% thiết kế gốc (Phương án B: trích xuất text phục vụ embedding RAG + chuyển đổi các trang PDF thành hình ảnh để hiển thị ở Frontend).

Do đó, chúng ta cần thay đổi kiến trúc ingestion và lưu trữ dữ liệu slide học liệu.

## Các lựa chọn (Alternatives)

### Lựa chọn 1: Chỉ trích xuất text thuần từ PDF (Giao diện hiển thị dạng văn bản)
*   **Mô tả**: Sử dụng thư viện Python (`pypdf` hoặc `pdfplumber`) đọc nội dung text của từng trang PDF, lưu text vào bảng `slide_embeddings` và giữ nguyên cách render text ở Frontend.
*   **Ưu điểm**: 
    *   Nhẹ, không cần thay đổi database schema hay sử dụng Cloud Storage.
    *   Tận dụng giao diện UI Markdown sẵn có của Frontend.
*   **Nhược điểm**: 
    *   Mất toàn bộ hình ảnh minh họa, định dạng cột và thiết kế gốc của slide. Các slide chứa sơ đồ/bảng biểu phức tạp sẽ bị xáo trộn văn bản khi đọc thô, ảnh hưởng đến chất lượng RAG.

### Lựa chọn 2: Trích xuất text làm RAG + Convert PDF thành ảnh lưu trên Supabase Storage (Selected)
*   **Mô tả**: Khi nạp PDF ở Ingestion, sử dụng thư viện Python (`pdf2image` hoặc `PyMuPDF`) để:
    *   Trích xuất văn bản thô phục vụ việc tạo vector embeddings và lưu vào DB.
    *   Đồng thời xuất mỗi trang PDF thành một file ảnh (PNG/JPEG) và tải lên **Supabase Storage** (bucket `slide-images`).
    *   Lưu liên kết ảnh này (`image_url`) vào bảng `slide_embeddings`.
    *   Frontend sẽ tải và hiển thị thẻ `<img>` của trang slide trực quan thay vì render văn bản thô.
*   **Ưu điểm**:
    *   Slide hiển thị chính xác 100% định dạng thiết kế gốc của giảng viên (giữ nguyên hình minh họa, biểu đồ, màu sắc).
    *   Giảng viên chỉ cần chuẩn bị file PDF, cực kỳ nhanh chóng.
    *   Chất lượng trích dẫn trực quan vượt trội, mang lại trải nghiệm chuyên nghiệp cao cấp.
*   **Nhược điểm**:
    *   Tăng dung lượng lưu trữ trên database (cần thêm cột lưu URL ảnh) và tiêu thụ dung lượng Cloud Storage cho hình ảnh.
    *   Cần cấu hình bổ sung Supabase Storage bucket và cài đặt thư viện chuyển đổi PDF (như Poppler / `pdf2image` hoặc `PyMuPDF` trong python).

---

## Quyết định (Decision)

Chọn **Lựa chọn 2: Trích xuất text làm RAG + Convert PDF thành ảnh lưu trên Supabase Storage**.

---

## Lý do (Rationale)

1. **Trải nghiệm người dùng vượt trội**: Hiển thị chính xác thiết kế gốc của slide giúp học sinh dễ đối chiếu bài học hơn rất nhiều so với đọc văn bản thô bị xô lệch định dạng.
2. **Quy trình soạn bài đơn giản**: Giảng viên chỉ cần xuất Slide PowerPoint thành PDF và chạy script nạp tự động, loại bỏ hoàn toàn bước biên tập Markdown thủ công.
3. **Tính khả thi về lưu trữ**:
   *   Dung lượng database hiện tại rất nhỏ (~38 MB).
   *   Dung lượng lưu trữ miễn phí của Supabase Storage là **1 GB (1024 MB)**.
   *   Với khoảng 1,000 trang slide (32 tài liệu), tổng kích thước ảnh nén (mỗi ảnh ~100 KB) ước tính chỉ chiếm khoảng **100 MB** (xấp xỉ 10% hạn ngạch miễn phí), hoàn toàn an toàn và miễn phí.

---

## Hệ quả (Consequences)

-   **Môi trường Python**: Cần cài đặt thư viện `PyMuPDF` (hoặc `pdf2image` đi kèm Poppler) trong virtual environment `.venv`.
-   **Thay đổi Database**: 
    *   Mở rộng bảng `slide_embeddings` bằng cách thêm cột `image_url TEXT NULL`.
-   **Supabase Storage**: 
    *   Cần tạo một bucket lưu trữ mới tên là `slide-images` với quyền truy cập Public (cho phép Frontend tải ảnh slide trực tiếp).
-   **Frontend**:
    *   Cập nhật các kiểu dữ liệu (TypeScript Interfaces) để hỗ trợ `image_url`.
    *   Sửa đổi UI bên phải của [socratic-chat-tab.tsx](file:///d:/AI%20Invidual%2520Tutor/Source%2520code/C2-App-125/frontend/components/dashboard/socratic-chat-tab.tsx) từ việc render Markdown thành hiển thị ảnh `<img src={currentSlide.image_url} />` đi kèm hiệu ứng làm mịn (smooth load/skeleton).
