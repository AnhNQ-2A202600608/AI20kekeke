# Kế hoạch Triển khai: Crawl Slides từ LMS VinUni & Lưu PDF theo ngày

Tự động hóa việc cào dữ liệu slide từ LMS VinUni dưới dạng PDF và phân loại lưu trữ theo các thư mục tương ứng với ngày tải về, đảm bảo vượt qua cơ chế chặn anti-bot bằng cách giả lập trình duyệt (khuyến nghị Firefox).

## User Review Required

> [!IMPORTANT]
> **Phương pháp vượt Anti-bot**: Sử dụng thư viện `requests` cấu hình Header giả lập Firefox (`User-Agent`, `Referer`, `Accept`, v.v.). Nếu LMS VinUni yêu cầu đăng nhập bằng Cookie hoặc Session, người dùng cần cung cấp cookie hợp lệ trong file cấu hình `.env` hoặc truyền trực tiếp vào tham số.

## Proposed Changes

### Script & Automation Component

#### [NEW] [lms_slide_pipeline.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/pipeline/lms_slide_pipeline.py)
Viết script tự động thực hiện các bước:
1. Nhận URL Viewer từ LMS hoặc tham số.
2. Trích xuất tự động link PDF gốc bằng cách parse tham số `file` trong URL.
3. Tạo thư mục dạng `downloads/YYYY-MM-DD/` dựa trên ngày hiện tại.
4. Gửi request tải file PDF với Header giả lập Firefox.
5. Giải nén/Convert nội dung PDF sang file Markdown (`.md`) sử dụng thư viện `pypdf`.
6. Lưu cả file `.pdf` và `.md` vào đúng thư mục ngày.

### Notion Backlog Component

#### [NEW] Đăng ký Backlog Task trên Notion
Tạo task với các thông tin:
* **Mã việc**: `DATA-CRAWL-SLIDES-TO-PDF-DAILY`
* **Tên việc**: `Tự động hóa cào slides LMS sang PDF và lưu theo thư mục ngày`
* **Area**: `Data`
* **Type**: `Feature`
* **Trạng thái**: `Chưa làm`
* **Assignee**: `Nguyễn Vũ Trọng`
* **Mô tả chi tiết**: Tự động hóa tải slide PDF từ VinUni LMS, giải mã JWT token url, lưu vào folder `downloads/YYYY-MM-DD/` và vượt qua anti-bot của LMS.

---

## Các Bước Thủ Công Kiểm Tra & Lấy URL trên LMS
1. Truy cập vào LMS VinUni, mở Slides cần tải.
2. Nhấp chuột phải -> Chọn **Inspect** (Kiểm tra) -> Chọn tab **Network** (Mạng).
3. **F5 / Reload** lại trang.
4. Tìm request đầu tiên (URL dạng `viewer.html?file=...`).
5. Chuột phải vào request đó -> Chọn **Open link in new tab** (Mở trong tab mới).
6. Copy URL này để đưa vào script crawl.

---

## Verification Plan

### Automated Tests
* Viết test script kiểm tra việc trích xuất và tải file PDF với một link viewer giả lập hoặc link thật còn hiệu lực.
* Kiểm tra việc tự động sinh thư mục lưu trữ `downloads/YYYY-MM-DD/`.

### Manual Verification
* Chạy trực tiếp script với URL Viewer LMS thật để xác nhận tải thành công file PDF về thư mục trong ngày.
