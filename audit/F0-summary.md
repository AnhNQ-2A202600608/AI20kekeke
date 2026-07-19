# F0-summary — Lấp trục mù

**Commit:** `d9e294a` · **Ngày:** 2026-07-19

---

## 1. OPS-005 — pytest crash Windows (ĐÃ SỬA)

**Vấn đề:** `tests/eval/run_eval.py:9-12` gọi `sys.stdout.reconfigure()` ở cấp module → pytest crash khi collect trên Windows.

**Fix:** Di chuyển `reconfigure` vào `if __name__ == "__main__":` block.

**Commit:** `d9e294a` `[OPS-005] move reconfigure to __main__ to fix pytest crash on Windows`

---

## 2. pip-audit — 16 CVE trong 6 packages

| Package | Version | Vulns | Fix |
|---|---|---|---|
| langchain | 1.3.7 | 1 (PYSEC-2026-2192) | → 1.3.9 |
| langsmith | 0.8.14 | 1 (GHSA-f4xh-w4cj-qxq8) | → 0.8.18 |
| pillow | 12.2.0 | 8 (PYSEC-2026-*) | → 12.3.0 |
| pip | 26.0.1 | 4 (PYSEC-2026-*) | → 26.1.2 |
| pydantic-settings | 2.14.1 | 1 (GHSA-4xgf-cpjx-pc3j) | → 2.14.2 |
| starlette | 1.3.0 | 1 (PYSEC-2026-249) | → 1.3.1 |

**Hành động khuyến nghị:** Chạy `uv lock --upgrade-package langchain --upgrade-package langsmith --upgrade-package pillow --upgrade-package pydantic-settings --upgrade-package starlette` rồi `uv sync`.

---

## 3. pytest-cov — Coverage toàn bộ src/

**Tổng coverage: 66.2%** (5902/8915 lines)

### Files thấp nhất (0%):
- `src/agents/nodes/example_node.py` — dead code / template
- `src/agents/nodes/tutor_node.py` — chưa test
- `src/pipeline/config.py` — pipeline cấu hình
- `src/pipeline/ingest/classify_pdf_pages.py`
- `src/pipeline/ingest/init_db.py`
- `src/pipeline/ingest/lms_fetcher.py`
- `src/pipeline/lms_slide_pipeline.py`
- `src/pipeline/transform/doc_converter.py`
- `src/services/quiz_generator.py` — 9.2%
- `src/services/adaptive/supabase_database.py` — 17.8%

**Ghi chú:** `pipeline/` hầu hết là script chạy 1 lần (ingest data), coverage 0% là chấp nhận được. Hai file cần quan tâm: `quiz_generator.py` (9.2%) và `supabase_database.py` (17.8%) — đây là code runtime quan trọng.

---

## 4. npm audit — 2 moderate

| Package | Severity | Advisory |
|---|---|---|
| postcss | moderate | XSS via unescaped `</style>` (GHSA-qx2v-qp2m-jg93) |
| next | moderate | depends on vulnerable postcss |

**Fix:** Chờ Next.js release patch hoặc `npm audit fix --force` (breaking change).

---

## 5. radon — Cyclomatic Complexity

Output ghi tại `audit/raw/radon-cc.json` và `audit/raw/radon-mi.json`. Cần phân tích thêm cho high complexity functions.

---

## 6. vulture — 257 dead code findings

Output ghi tại `audit/raw/vulture.txt`. Chủ yếu là false positive do FastAPI route decorators (vulture không nhận diện `@router.get()` là usage). Cần lọc thêm.

---

## Trạng thái trục mù

| Trục | Trước F-0 | Sau F-0 |
|---|---|---|
| CVE Python | MÙ | ✅ 16 vuln / 6 pkg (có fix) |
| CVE Frontend | MÙ | ✅ 2 moderate (postcss/next) |
| Coverage | MÙ | ✅ 66.2% tổng |
| Complexity | MÙ | ✅ radon-cc.json + radon-mi.json |
| Dead code | MÙ | ✅ 257 findings (cần lọc FP) |
| OPS-005 | pytest crash | ✅ Fixed |
| RLS live | MÙ | ⚠️ Cần Supabase SQL Editor |
| Attack eval | MÙ | ⚠️ Chưa chạy |
