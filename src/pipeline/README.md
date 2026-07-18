# LMS Slide Ingestion Pipeline

Data pipeline phục vụ tải slide PDF tự động từ LMS VinUni (giả lập Firefox bypass anti-bot) và chuyển đổi sang định dạng Markdown chất lượng cao (Gemini OCR / OpenRouter fallback / `pypdf` fallback).

---

## 🛠️ Cấu hình Môi trường (.env)

Trong thư mục `src/pipeline`, sao chép file `.env.example` thành `.env`:

```bash
cp src/pipeline/.env.example src/pipeline/.env
```

Điền các giá trị vào file `.env`:
*   `URL`: Đường dẫn Viewer của slide lấy từ LMS (dạng `viewer.html?file=...`).
*   `GEMINI_API_KEY`: API Key của Google Gemini (lấy tại [Google AI Studio](https://aistudio.google.com/)).
*   `OPENROUTER_API_KEY`: API Key của OpenRouter (lấy tại [OpenRouter](https://openrouter.ai/)). Được sử dụng làm lớp fallback thứ hai (với model `google/gemini-2.5-flash`) nếu Gemini trực tiếp thất bại hoặc không cấu hình key.

Nếu cả hai API key trên đều không cấu hình hoặc gặp sự cố, hệ thống sẽ tự động fallback sử dụng thư viện `pypdf` cục bộ để trích xuất text.

---

## 🚀 Hướng dẫn Chạy (Chạy bằng `uv`)

Sử dụng công cụ `uv` để tự động tải và nạp các thư viện cần thiết mà không cần cài đặt vào môi trường global của máy:

### Cách 1: Chạy bình thường (Đọc URL từ file `.env`)
Khi bạn đã điền sẵn `URL` trong file `.env`, bạn chỉ cần chạy lệnh sau từ thư mục gốc của dự án:
```bash
uv run --with requests --with pypdf --with google-genai --with python-dotenv python src/pipeline/lms_slide_pipeline.py
```

### Cách 2: Chạy truyền URL trực tiếp (Override `.env`)
Nếu bạn muốn truyền trực tiếp URL có chứa token JWT mới lấy từ trình duyệt mà không cần sửa file `.env`:
```bash
uv run --with requests --with pypdf --with google-genai --with python-dotenv python src/pipeline/lms_slide_pipeline.py "URL_VIEWER_CỦA_BẠN"
```

### Cách 3: Chạy truyền URL và đặt tên file đầu ra tùy chọn
Truyền thêm đối số thứ 2 sau URL để tùy chỉnh tên file đầu ra (không cần phần mở rộng `.pdf` hay `.md`):
```bash
uv run --with requests --with pypdf --with google-genai --with python-dotenv python src/pipeline/lms_slide_pipeline.py "URL_VIEWER_CỦA_BẠN" "Ten_File_Slide_Tuy_Chon"
```

## 📁 Kết quả đầu ra

Các file tải về và chuyển đổi được tổ chức ngăn nắp vào thư mục `src/pipeline/data/`:
*   File PDF slide gốc: `src/pipeline/data/pdf/day-xx/ten-file.pdf`
*   File Markdown trích xuất: `src/pipeline/data/md/day-xx/ten-file.md`

*(Trong đó `day-xx` được tự động trích xuất từ tên Slide, ví dụ slide "Day 10 Data..." sẽ được lưu vào `day-10`. Nếu không tìm thấy chữ "Day" trong tên file, hệ thống sẽ tự động lấy ngày hiện tại của tháng làm mặc định).*
