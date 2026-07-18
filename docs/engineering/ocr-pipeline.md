# OCR Pipeline: PDF SGK → Markdown → RAG

Chuyển các PDF SGK (scan ảnh, tiếng Việt) trong `data/` thành Markdown có thể tra cứu
qua module `rag`, mà không cần upload từng file qua UI và không chạy OCR trong request
đồng bộ `/runs`.

## 1. Kiến trúc

```
data/                                  (repo root, git-ignored, KHÔNG phải backend/data/)
├── *.pdf                              # PDF SGK gốc, đọc trực tiếp
└── processed/<book_slug>/
    ├── book.md                        # toàn bộ sách, ghép từ các trang
    ├── manifest.json                  # checksum, số trang, trạng thái OCR từng trang
    └── pages/
        ├── page_001.md
        └── ...
```

Pipeline tách làm 2 bước độc lập:

1. **OCR (chậm, offline)** — `scripts/ingest_pdfs.py`, dùng
   `backend/src/modules/rag/pdf_ingest.py` + `ocr.py`. Không bao giờ chạy qua HTTP
   request vì một cuốn SGK 800+ trang có thể mất hàng chục phút.
2. **Index + Query (nhanh, đồng bộ)** — module `rag`
   (`backend/src/modules/rag/capability.py`), chunk Markdown đã OCR thành đoạn nhỏ,
   build chỉ mục TF-IDF cục bộ (stdlib-only, không gọi dịch vụ ngoài, không tải model),
   và trả lời câu hỏi bằng cosine similarity. Chạy được qua `POST /runs` bình thường.

Vì sao tách riêng: OCR 816 trang của 4 cuốn SGK là tác vụ dài, không phù hợp với
luồng `/runs` đồng bộ hiện tại của starter kit. Index/query trên Markdown đã có sẵn
thì rất nhanh (mili-giây tới vài giây) nên an toàn để chạy đồng bộ và test trong CI.

## 2. Cài đặt Tesseract (bắt buộc để OCR thật)

Cài thư viện Python:

```bash
cd backend
pip install -e ".[dev,rag-ocr]"
```

`rag-ocr` cài PyMuPDF (render trang PDF → ảnh, không cần binary ngoài), pytesseract
(wrapper Python gọi Tesseract) và Pillow. **pytesseract KHÔNG tự cài Tesseract** —
cần cài binary riêng kèm gói ngôn ngữ tiếng Việt (`vie`):

- **Windows**: cài [Tesseract-OCR installer](https://github.com/UB-Mannheim/tesseract/wiki),
  chọn thêm "Vietnamese" trong danh sách ngôn ngữ khi cài. Nếu binary không tự vào PATH,
  set `TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe` trong `.env`.
- **macOS**: `brew install tesseract tesseract-lang` (gói `tesseract-lang` có `vie`).
- **Ubuntu/Debian**: `sudo apt install tesseract-ocr tesseract-ocr-vie`.

Kiểm tra: `tesseract --list-langs` phải liệt kê `vie`.

Nếu Tesseract chưa cài, `scripts/ingest_pdfs.py` vẫn chạy được — các trang không có
text layer sẽ được ghi nhận `status: "empty"` kèm `ocr_error` trong `manifest.json`
thay vì crash, để có thể chạy lại sau khi cài xong (xem mục Resumable bên dưới).

## 3. Chạy OCR

```bash
# Toàn bộ PDF trong data/
python scripts/ingest_pdfs.py

# Một cuốn cụ thể
python scripts/ingest_pdfs.py --book "SGK Lịch sử và địa lí 6 KNTT.pdf"

# Chạy theo lô trang để tránh timeout/OOM trên PDF lớn (vd lớp 8, 9)
python scripts/ingest_pdfs.py --book "..." --start-page 1 --end-page 200
python scripts/ingest_pdfs.py --book "..." --start-page 201 --end-page 400

# OCR lại toàn bộ dù đã có manifest
python scripts/ingest_pdfs.py --force
```

Cũng có thể gọi qua `python scripts/project_tasks.py ingest`.

**Resumable**: mỗi lần chạy đọc `manifest.json` cũ (khớp theo checksum SHA-256 của PDF)
và bỏ qua các trang đã có `status: "ok"`, nên có thể dừng giữa chừng (Ctrl+C, mất điện,
đổi máy) rồi chạy lại mà không OCR lại từ đầu. Dùng `--start-page`/`--end-page` để chủ
động chia nhỏ một cuốn 800 trang thành nhiều lần chạy ngắn.

## 4. Xử lý mỗi trang

Với mỗi trang PDF (`process_page` trong `pdf_ingest.py`):

1. Thử lấy text layer nhúng sẵn trong PDF (`extract_text_layer`, dùng PyMuPDF, không OCR).
2. Nếu text quá ngắn hoặc chỉ còn watermark sau khi lọc (`is_text_sufficient`,
   ngưỡng `OCR_MIN_CHARS_PER_PAGE`, mặc định 40 ký tự "sạch") → render trang thành ảnh
   (DPI cấu hình qua `OCR_DPI`, mặc định 300) và OCR bằng Tesseract tiếng Việt.
3. Dù lấy từ text layer hay OCR, đều chạy qua `clean_page_text`
   (`backend/src/modules/rag/text_clean.py`):
   - loại watermark theo pattern (blogtailieu.com, sach-giao-khoa*, "tải tài liệu...",
     footer kiểu "--- Trang N ---") — mở rộng danh sách này khi gặp nguồn watermark khác.
   - chuẩn hoá Unicode NFC, gộp khoảng trắng, nối từ bị ngắt dòng do dàn trang
     (`lịch-\nsử` → `lịch sử`), gộp dòng trống thừa.
4. Ghi `pages/page_NNN.md` với front-matter (`book`, `grade`, `page`, `source`), và
   cộng dồn vào `manifest.json` (page_count, ocr_pages, text_layer_pages, empty_pages,
   trạng thái + lỗi từng trang).

`grade` (lớp 6-9) và tên sách được suy ra từ tên file PDF (`parse_book_metadata`).

## 5. Build chỉ mục & truy vấn (module `rag`)

Sau khi có `data/processed/`, bật module và build chỉ mục:

```bash
python scripts/enable_module.py rag
python scripts/project_tasks.py ingest-index
```

Hoặc gọi qua API/UI (Workspace) với capability `rag`, `parameters.action = "ingest_index"`.

Truy vấn: capability `rag`, `parameters = {"action": "query", "question": "...", "top_k": 5}`.
Kết quả là Markdown liệt kê các đoạn liên quan nhất kèm tên sách/trang/điểm số, để dùng
làm ngữ cảnh cho câu trả lời (chưa sinh câu trả lời bằng LLM — đó là bước tiếp theo
nếu cần, tái sử dụng module `agent`).

**Vì sao TF-IDF thay vì `chromadb`/embedding model**: chỉ mục hoàn toàn stdlib
(`backend/src/modules/rag/index.py`), không tải model, không gọi dịch vụ ngoài, chạy
được offline và trong CI mà không phụ thuộc mạng. Có thể nâng cấp sang embedding vector
thật (sentence-transformers, chromadb) sau này mà không đổi API của capability.

## 6. Biến môi trường liên quan

Xem `.env.example`. Tóm tắt:

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `SGK_DATA_DIR` | `<repo root>/data` | Nơi đọc PDF gốc + ghi `processed/` (khác `STORAGE_PATH`/`backend/data`) |
| `OCR_LANG` | `vie` | Ngôn ngữ Tesseract |
| `OCR_DPI` | `300` | Độ phân giải render trang trước khi OCR |
| `OCR_MIN_CHARS_PER_PAGE` | `40` | Ngưỡng quyết định fallback OCR |
| `TESSERACT_CMD` | (rỗng) | Đường dẫn binary tesseract nếu không có trên PATH |
| `RAG_CHUNK_CHARS` / `RAG_CHUNK_OVERLAP_CHARS` | `1200` / `200` | Kích thước chunk khi build index |
| `RAG_TOP_K` | `5` | Số đoạn trả về mặc định khi query |

## 7. Test

`backend/tests/test_rag_*.py` cover watermark removal, chuẩn hoá Unicode, markdown
formatting, manifest generation, và quyết định fallback OCR — tất cả dùng PDF nhỏ dựng
bằng PyMuPDF trong lúc test và **mock lời gọi OCR** (`monkeypatch` trên `ocr_pdf_page`),
nên CI không bao giờ chạy Tesseract thật hay OCR toàn bộ 816 trang.
