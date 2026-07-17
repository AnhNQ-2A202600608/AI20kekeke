# PDF-to-Knowledge-Graph — Thiết kế đã chốt (grounded, đã kiểm chứng thực nghiệm)

> **Trạng thái:** Bản thay thế hoàn toàn phiên bản trước. Phiên bản trước là idea ban đầu, nhiều phần không khớp với repo thật (đã xác nhận qua review) và chưa được test. Bản này chỉ giữ lại phần đã được đối chiếu với code thật hoặc kiểm chứng bằng thực nghiệm trên chính dữ liệu `data/Math`.
>
> **Domain:** Toán lớp 1–9, bộ Kết Nối Tri Thức (KNTT), dữ liệu tại `data/Math/` (27 file PDF, đã đủ cặp SGK+SGV cho tất cả các lớp).
>
> **Nguyên tắc:** Tái dùng tối đa pipeline/schema đã có trong repo (`src/pipeline/graphusion/`, `app.concepts`, `app.concept_relations`, `app.question_concepts`). Chỉ thêm cái thật sự thiếu. Không xây lại từ đầu.

---

## 1. Dữ liệu đầu vào — đã đo, không suy đoán

Dùng PyMuPDF quét lớp text từng trang của cả 27 file. Kết quả:

| Loại | Số file | File | Cách trích xuất |
|---|---|---|---|
| Có text layer thật (~98% trang) | 4 | `SGK Toán 4 KNTT tập 1&2`, `Toán 3 tập 1&2`, `Toan lop 7 SGV` | Direct extract (`fitz`/`pypdf`), rẻ, nhanh, chính xác 100% |
| Scan hoàn toàn (0% trang có text) | 23 | Toàn bộ SGK/SGV còn lại (lớp 1, 2, 5, 6, 8, 9, phần lớn SGV) | Vision-LLM (mục 2) |

Tổng ~4.630 trang, ~4.170 trang (90%) là scan. **Kết luận: bắt buộc cần một dạng "OCR"**, nhưng không phải Tesseract cổ điển — dùng vision-LLM đọc trực tiếp ảnh trang.

Phân loại file nào thuộc lane nào: script ~30 dòng, đo `% trang có >20 ký tự text` bằng `fitz`, ngưỡng 50% để quyết định lane. Không cần hệ inspection heuristic phức tạp (font/bbox/rotation) như bản cũ.

---

## 2. Trích xuất nội dung (PDF → Markdown có provenance)

### 2.1. Model đã chọn: GPT-4o (vision), qua OpenAI API

Đã test so sánh trên 3 trang mẫu thật (trang 30 — văn bản + công thức, trang 100 — bảng rowspan phức tạp, trang 180 — lời giải toán) của `SGV Toan 8 KNTT.pdf`:

| Ứng viên | Kết quả test | Quyết định |
|---|---|---|
| Groq `llama-3.3-70b-versatile` | Text-only, không nhận ảnh/PDF | Loại — không dùng được cho scan |
| Groq `llama-4-scout-17b-16e-instruct` (vision) | Nhanh (7.2s/3 trang) nhưng **làm mất nội dung thật** ở bảng rowspan (gộp sai 2 dòng, xoá nội dung cột giữa) | Không dùng cho trang có bảng phức tạp; có thể cân nhắc lại sau nếu cần tối ưu tốc độ/chi phí |
| GPT-4o (OpenAI) + prompt đã sửa | Chậm hơn (36s/3 trang) nhưng giữ đúng cấu trúc bảng rowspan, không mất nội dung | **Chọn làm model chính** |

Ghi chú quan trọng: Groq không nhận file PDF trực tiếp (khác Gemini/GPT-4o) — phải tự render từng trang thành ảnh PNG rồi gửi qua `image_url`. Nếu sau này quay lại dùng Groq (ví dụ để tiết kiệm chi phí), phải giữ pipeline render-ảnh này.

### 2.2. Giới hạn đã xác nhận — không loại bỏ được hoàn toàn bằng prompt

Test thực tế phát hiện 2 nhóm lỗi, cả hai đều **ngẫu nhiên, không dự đoán được, và không biến mất dù đã sửa prompt**:

1. **Lỗi thanh điệu tiếng Việt** (đọc nhầm ký tự có hình dạng gần giống nhau): "dễ"→"để", "dừng"→"dùng", "ban đầu"→"bán đầu". Xảy ra ở cả Groq lẫn GPT-4o, đổi vị trí lỗi giữa các lần chạy khác nhau.
2. **Lỗi transcribe công thức toán** — nghiêm trọng hơn nhiều: GPT-4o đã âm thầm sinh sai phương trình bài 7.16 (`x/25 + 2 = (x+8)/24` → transcribe thành `x/25 + (x+8)/24 = 100`), trong khi vẫn giữ đáp số đúng ở dòng sau, khiến lỗi rất khó phát hiện bằng mắt thường.

→ **Không thể publish thẳng output vision-LLM vào Knowledge Graph/Content KB.** Bắt buộc có bước xác thực tự động + review, xem mục 3 và mục 5.

### 2.3. Prompt đã kiểm chứng (bắt buộc giữ khi implement)

Yêu cầu tối thiểu, đã test có hiệu quả cải thiện bảng rowspan:

- Đánh dấu mỗi trang bằng `<!-- page: N -->` — **bắt buộc**, đây là cơ chế provenance duy nhất giữ được liên kết trang gốc, thay thế toàn bộ hệ block_id/bbox phức tạp của bản thiết kế cũ.
- "Transcribe faithfully, do not normalize/paraphrase/translate" — giảm nhưng không loại bỏ lỗi tự "diễn giải" ký hiệu (ví dụ ℕ* → ℕ⁺).
- Với bảng có ô gộp nhiều dòng (rowspan): yêu cầu xuất **một dòng markdown cho mỗi dòng gốc trong ảnh**, không gộp, không được làm mất nội dung ô giữa/phải khi tái dựng ô gộp bên trái.
- Công thức toán → LaTeX `$...$`/`$$...$$`.

### 2.4. Batch size

Giới hạn thật của Groq (không áp dụng cho GPT-4o nhưng nên giữ thống nhất): tối đa 5 ảnh/request, base64 ≤ 4MB/ảnh. Đã test ổn với batch 3 trang/request. Với GPT-4o không có giới hạn cứng 5 ảnh nhưng nên giữ batch nhỏ (3–5 trang) để dễ retry từng phần khi lỗi, tránh phải gọi lại cả trăm trang nếu 1 batch fail.

---

## 3. Xác thực tự động (mới — phát hiện từ test, không có trong bản thiết kế cũ)

### 3.1. SymPy back-substitution cho công thức có đáp số

Đã chứng minh hoạt động trên chính lỗi thật vừa phát hiện (bài 7.16):

```python
import sympy as sp
x = sp.symbols('x')

lhs = x/25 + 2                    # vế trái trích xuất được
rhs = (x + 8)/24                  # vế phải trích xuất được
answer = 1000                     # đáp số trích xuất được (cùng trang)

ok = sp.simplify(lhs.subs(x, answer) - rhs.subs(x, answer)) == 0
# ok == False  =>  tự động gắn cờ needs_manual_review, KHÔNG publish
```

Áp dụng cho mọi trang lời giải (worked example / solution) có cả công thức và đáp số hiển thị — đúng dạng phổ biến trong SGV/SGK Toán. Không cần LLM thứ hai để "chấm lại" — chỉ cần một bước trích riêng `(lhs, rhs, answer, variable)` bằng structured output (Pydantic) ngay trong lần gọi vision-LLM đầu tiên, rồi verify bằng SymPy ngay trong pipeline, không tốn thêm lệnh gọi LLM.

### 3.2. Việc cần làm để tổng quát hoá

- Yêu cầu vision-LLM trả structured JSON (không chỉ Markdown thô) cho các trang có công thức lời giải: `{lhs, rhs, variable, answer, page}`. Dùng Pydantic schema validate ngay khi nhận response.
- Trang không parse được thành `(lhs, rhs, answer)` rõ ràng (ví dụ hình học, không có phương trình) → bỏ qua bước verify này, vẫn qua review thường.
- Log kết quả verify (`pass`/`fail`/`skipped`) theo từng trang để làm audit trail.

---

## 4. Từ Markdown → Knowledge Graph (tái dùng pipeline đã có)

**Không viết `knowledge_pipeline` package mới.** Trỏ thẳng vào 4 script đã có trong `src/pipeline/graphusion/`:

```
Markdown (có page-anchor, mục 2) 
      │
      ▼
extract_seed_concepts.py      (ĐÃ CÓ — đổi input path sang Markdown Toán)
      │
      ▼
extract_candidate_triplets.py (ĐÃ CÓ — không đổi)
      │
      ▼
fuse_graphs.py                 (ĐÃ CÓ — không đổi)
      │
      ▼
ingest_graph_to_db.py          (ĐÃ CÓ, CẦN SỬA — xem mục 5.1)
      │
      ▼
app.concepts / app.concept_relations (ĐÃ CÓ SCHEMA — cần mở rộng nhỏ, mục 5.2)
```

---

## 5. Thay đổi bắt buộc trên code/schema đã có (không phải xây mới)

### 5.1. Vá lỗ hổng "AI tự publish" — đã xác nhận có thật

`src/pipeline/graphusion/ingest_graph_to_db.py` dòng ghi relation hiện đang set cứng `"status": "approved"` — mọi quan hệ do LLM sinh ra được publish thẳng, không qua review nào, dù cột `status` (draft/approved/rejected) đã tồn tại sẵn trong `app.concept_relations`. Sửa: đổi default sang `"draft"`, thêm 1 endpoint/script review đơn giản để mentor duyệt trước khi chuyển `approved`. Không cần cả "review portal" như bản thiết kế cũ — 1 endpoint PATCH là đủ cho MVP (tương tự pattern đã có ở `PATCH /adaptive/graph/relations/{id}`).

### 5.2. Provenance tối thiểu

Thêm cột `source_document` (text) và `source_page` (int, nullable) vào `app.concepts` và `app.concept_relations`. Lấy trực tiếp từ marker `<!-- page: N -->` đã nhúng ở bước 2. Không cần block_id/bbox/content-hash đầy đủ như bản thiết kế cũ.

### 5.3. Q-matrix có role

`app.question_concepts` hiện chỉ là bảng nối phẳng (question_id, concept_id). Thêm cột `role` (`target|prerequisite|supporting|confounder`, default `target` để tương thích ngược). Đủ để phục vụ root-cause diagnosis sau này, không cần tách bảng `question_skills` riêng.

### 5.4. Misconception — bảng mới, tối thiểu

```sql
create table app.misconceptions (
    id uuid primary key default gen_random_uuid(),
    course_id uuid not null references app.courses(id) on delete cascade,
    name text not null,
    description text,
    related_concept_ids uuid[] not null default '{}',
    observable_pattern text,
    source_document text,
    source_page integer,
    review_status text not null default 'draft',
    created_at timestamptz not null default now()
);
```

Không cần `question_error_patterns`/matcher-confidence phức tạp ở giai đoạn MVP — có thể thêm sau khi có dữ liệu pilot thật.

### 5.5. Course entity cho Toán

`ingest_graph_to_db.py` hiện hard-code `COURSE_ID = "00000000-...0001"` và `code: "ai-bootcamp"`. Cần tạo course mới cho từng lớp Toán (hoặc 1 course "math-k1-9" với concept phân theo `grade_introduced`), không tái dùng course AI-bootcamp.

### 5.6. Sửa `rag_ingestion.py` — bug thật sẽ nổ ra nếu chạy nguyên trạng trên `data/Math`

`rag_ingestion.py` hiện đọc text trực tiếp từ PDF gốc (`page.get_text()`), không qua Markdown. Với 90% trang của `data/Math` là scan (0% text layer), pipeline này sẽ nạp gần hết là placeholder rỗng `"Slide N của tài liệu X"` thay vì nội dung thật. Phải sửa để lấy text từ Markdown (kết quả bước 2) thay vì đọc thẳng PDF.

### 5.7. Dependency còn thiếu

`requests` được import trực tiếp trong `doc_converter.py`, `rag_ingestion.py`, `ingest_graph_to_db.py` nhưng không khai báo trong `requirements.txt`/`pyproject.toml`. Cần thêm khi chính thức hoá. Cần thêm `sympy` cho bước verify (mục 3).

---

## 6. Việc KHÔNG làm ở giai đoạn này (đã cân nhắc, loại bỏ khỏi bản thiết kế cũ)

- Bronze/Silver/Gold data lake, 17 bảng mới, OCR pipeline kiểu Tesseract, formula-parser riêng, review portal đầy đủ, diagnostic probe generator, intervention KB, offline-first PWA — vượt quá nhu cầu MVP hiện tại, không có bằng chứng nhu cầu sản phẩm xác nhận. Có thể quay lại nếu pilot chứng minh cần.
- `knowledge_pipeline` package độc lập — dùng `src/pipeline/graphusion/` đã có.
- OCR cổ điển (Tesseract) — vision-LLM đã đủ và đã test hoạt động.

---

## 7. Việc còn mở — cần quyết định trước khi code

- **Vertical slice MVP** (lớp/chủ đề bắt đầu): chưa chốt, do người quyết định phạm vi.
- Có quay lại thử Groq với prompt đã sửa hay không (tốc độ nhanh hơn ~5 lần nhưng chưa test lại sau khi sửa prompt bảng rowspan).
- Ngưỡng review thủ công: mọi concept/relation mới đều cần duyệt, hay chỉ những cái verify SymPy fail / confidence thấp?

---

## 8. Nguồn thực nghiệm

Toàn bộ số liệu trong tài liệu này (tỷ lệ scan/text-layer, kết quả so sánh Groq/GPT-4o, lỗi công thức 7.16, kết quả SymPy verify) đến từ test thật chạy trên `data/Math/SGV Toan 8 KNTT.pdf`, không phải suy đoán. Script test nằm ở thư mục scratchpad phiên làm việc, chưa commit vào repo — cần viết lại thành test chính thức (`tests/`) khi implement.
