# Quiz Generation Handoff – Toán lớp 6

> **Dành cho agent thực thi hoặc kỹ thuật viên tiếp tục.**
> File này mô tả toàn bộ context, trạng thái hiện tại, và cách chạy pipeline sinh quiz còn lại.

---

## 1. Trạng thái hiện tại (snapshot lúc 2026-07-19)

| Hạng mục | Giá trị |
|---|---|
| **Tổng concept Toán 6 cần xử lý** | 113 nodes (`curriculum_chapter IS NOT NULL`) |
| **Đã sinh xong** | 1 concept (`tap-hop` – Tập hợp) |
| **Còn lại** | 112 concepts |
| **Câu hỏi đã có trong DB** | 9 (test run: 3 dễ, 3 tb, 3 khó) |
| **Câu hỏi cần sinh thêm** | ~1,120 (112 concepts × 10 câu/độ khó × ... *xem note) |

> **Note**: Script hiện sinh 3 câu/độ khó ở test mode, 10 câu/độ khó ở full run.
> Full run: 112 concepts × 3 độ khó × 10 câu = **3,360 câu + 10,080 Socratic hints**.

---

## 2. Thông tin kỹ thuật – Database

| Thành phần | Giá trị |
|---|---|
| **Supabase project ID** | `qopzqdaxurvpxlpnsjgx` |
| **Course ID (Toán 6)** | `cf76850d-0738-50c3-bf34-1c464fa3b4d3` |
| **RAG scope ID (Toán 6)** | `4802fcfb-2e37-401c-9de0-0360bf2fa535` |
| **Table câu hỏi** | `app.questions` |
| **Table gợi ý** | `app.question_hints` |
| **Nguồn RAG** | `app.material_chunks` via RPC `app.match_material_chunks` |
| **`source_document_name`** | `sgk-toan-6` |
| **`calibration_status`** | `published` (dùng ngay, không cần review) |

---

## 3. Script chính

**File**: `scripts/generate_math_quizzes.py`

### Cách dùng

```bash
# Chạy toàn bộ (sinh 10 câu/độ khó cho 112 concepts còn lại)
.venv\Scripts\python.exe scripts/generate_math_quizzes.py

# Chạy 1 concept cụ thể (theo code)
.venv\Scripts\python.exe scripts/generate_math_quizzes.py --concept phan-tu-cua-tap-hop

# Chạy nền (PowerShell)
Start-Job -ScriptBlock {
    Set-Location "d:\Project\Hackathon\AI Innovation\AI20kekeke"
    .\.venv\Scripts\python.exe scripts\generate_math_quizzes.py
}
```

### Tính năng idempotent
Script tự động **skip** concept nào đã có câu hỏi `sgk-toan-6` trong DB.
→ Có thể chạy lại nhiều lần mà không bị tạo trùng.

---

## 4. Concept còn lại cần xử lý (theo chương)

> Lấy từ DB: `SELECT code, name, curriculum_chapter FROM app.concepts WHERE curriculum_chapter IS NOT NULL AND status='active' AND code != 'tap-hop' ORDER BY curriculum_chapter, curriculum_order`

| Chương | Tên chương | Số concept |
|---|---|---|
| 1 | Tập hợp các số tự nhiên | 14 (trừ `tap-hop` đã xong) |
| 2 | Tính chia hết | 10 |
| 3 | Số nguyên | 12 |
| 4 | Hình phẳng thực tiễn | 11 |
| 5 | Tính đối xứng | 2 |
| 6 | Phân số | 19 |
| 7 | Số thập phân | 10 |
| 8 | Hình học cơ bản | 23 |
| 9 | Dữ liệu và xác suất | 11 |
| **Tổng** | | **112** |

---

## 5. Kiểm tra kết quả sau khi chạy

```sql
-- Số câu theo chương
SELECT
    c.curriculum_chapter,
    COUNT(DISTINCT c.id) AS num_concepts,
    COUNT(q.id) AS total_questions,
    COUNT(q.id) FILTER (WHERE q.difficulty_elo = 1050) AS easy,
    COUNT(q.id) FILTER (WHERE q.difficulty_elo = 1200) AS medium,
    COUNT(q.id) FILTER (WHERE q.difficulty_elo = 1350) AS hard
FROM app.concepts c
LEFT JOIN app.questions q
    ON q.concept_id = c.id
    AND q.source_document_name = 'sgk-toan-6'
WHERE c.curriculum_chapter IS NOT NULL
  AND c.status = 'active'
GROUP BY c.curriculum_chapter
ORDER BY c.curriculum_chapter;

-- Kỳ vọng khi hoàn thành:
-- Mỗi chapter: num_concepts × 10 = easy, medium, hard
-- Tổng: 113 concepts × 30 câu = 3,390 câu
```

---

## 6. Ước tính thời gian

| Loại | Thời gian |
|---|---|
| Mỗi câu hỏi (LLM + INSERT) | ~3 giây |
| Mỗi gợi ý Socratic (LLM + INSERT) | ~2 giây |
| Mỗi concept đầy đủ (10 câu × 3 độ khó) | ~3 phút |
| **Tổng 112 concepts còn lại** | **~336 phút (~5.6 giờ)** |

> 💡 Khuyến nghị: Chạy trong PowerShell background job hoặc qua Windows Task Scheduler.

---

## 7. Lưu ý quan trọng

- **Prompt sinh câu hỏi** tải từ `config/prompts.yaml` key: `generate_quizzes_from_slides`
- **Prompt gợi ý** tải từ `config/prompts.yaml` key: `generate_socratic_hints`
- **Yêu cầu tiếng Việt** được inject vào cuối prompt (không sửa prompt yaml)
- **OpenAI API key** trong `.env` file tại gốc project
- **Rate limit**: Không có giới hạn concurrent, nhưng nếu muốn tăng tốc có thể refactor để dùng `asyncio.gather` cho nhiều concepts song song

---

## 8. Môi trường

```
OS: Windows 11
Python: .venv/Scripts/python.exe
Framework: FastAPI + LangChain + Supabase REST API
LLM: gpt-4o-mini (OpenAI)
Embeddings: text-embedding-3-small (OpenAI)
```
