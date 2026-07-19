# audit/raw/ — Chỉ mục dữ liệu cứng (Phase A + F-0)

Commit neo: `d9e294ac2c747b6c2877118ecefc86e2dc43d297` (xem `COMMIT_SHA`).
Cây làm việc sạch (chỉ `audit/` + `.ai-log/.git_cache.json` untracked — xem `git-dirty.txt`).

> ⚠️ Một số công cụ bảo mật **vẫn cần CI** (gitleaks, semgrep, trivy) → các trục đó đánh dấu confidence thấp.

| File | Công cụ | Trạng thái | Số mục | Đáng chú ý |
|---|---|---|---|---|
| `COMMIT_SHA` | git | ✅ | 1 | Re-anchored tại `d9e294a` sau OPS-005 fix |
| `git-dirty.txt` | git | ✅ | 2 | Cây sạch, chỉ có thư mục audit |
| `ruff-signal.json` | ruff (E,F,B,S,ASYNC,RUF,PL,C90,ARG,SIM,TRY,LOG) | ✅ | **2927** | Tín hiệu lớn; xem S & ASYNC bên dưới |
| `ruff-all-stats.txt` | ruff --select ALL --statistics | ✅ | ~ | Top: COM812(264), D-docstring, E501(162), G004(151), B008(135), T201 print(127), BLE001 blind-except(112) |
| `secret-grep-history.txt` | git log -p + grep (thay gitleaks) | ⚠️ thủ công | 60 dòng | **Toàn bộ là tên biến / nội dung log `.ai-log`, KHÔNG có giá trị secret thật** |
| `mypy-core.txt` | mypy --strict (adaptive/auth/api) | ⚠️ MÙ | "Success: no issues in 21 files" | **Giả**: `[tool.mypy] ignore_errors=true` trong pyproject vô hiệu hoá mọi báo lỗi kể cả --strict |
| `tsc.txt` | tsc --noEmit (frontend) | ✅ | **0 lỗi** | Frontend type-clean; 0 `any`/`@ts-ignore` trong app/hooks |
| `pytest.txt` | pytest / uv run pytest | ✅ SỬA | "347 passed, 4 skipped" | OPS-005 fixed: reconfigure đưa vào `__main__` |
| `pip-audit.json` | pip-audit | ✅ MỚI | **16 vuln / 6 pkg** | langchain, langsmith, pillow, pip, pydantic-settings, starlette — tất cả có fix version |
| `coverage.json` | pytest-cov | ✅ MỚI | **66.2%** tổng | 5902/8915 lines; lowest: pipeline/* (0%), quiz_generator (9.2%), supabase_database (17.8%) |
| `radon-cc.json` | radon cc | ✅ MỚI | — | Cyclomatic complexity per function (JSON) |
| `radon-mi.json` | radon mi | ✅ MỚI | — | Maintainability index per file (JSON) |
| `vulture.txt` | vulture | ✅ MỚI | **257** | Chủ yếu false positive do FastAPI decorators; cần lọc |
| `npm-audit.json` | npm audit | ✅ MỚI | **2 moderate** | postcss XSS + next depends on vulnerable postcss |

## Công cụ KHÔNG có (trục mù → confidence thấp)
`gitleaks`, `trufflehog`, `semgrep`, `trivy` (CI chưa bật), `knip`, `madge`.

## Ruff — nhóm bảo mật (S) toàn repo
```
1151 S101  assert (chủ yếu trong tests — bình thường)
  29 S110  try-except-pass (nuốt lỗi im lặng) — src rải rác
  13 S113  requests KHÔNG timeout — material_routes, quiz_generator, rag_ingestion
  10 S106  hardcoded password (phần lớn false positive: field name)
   9 S105  hardcoded password string (false positive)
   4 S608  SQL injection string-building → 1 chỗ sync_routes.py:83 = FALSE POSITIVE (placeholders ?,?,?)
   4 S603  subprocess
   3 S311  pseudo-random (dashboard sim — OK)
   2 S324  md5 (graphusion checksum — OK)
   2 S310  url open
   1 S607  partial executable path
   1 S104  bind 0.0.0.0 (config — mong đợi trong container)
```

## Ruff — ASYNC (10 lỗi, đều THẬT, ảnh hưởng hiệu năng event loop)
```
ASYNC210 src/services/quiz_generator.py:118,151,165,270,329  — blocking HTTP (requests) trong hàm async
ASYNC230 src/api/routes.py:1466,1618                         — open() file blocking trong hàm async
ASYNC240 src/api/material_routes.py:390,425,429              — pathlib.Path trong hàm async
```

## Kết luận Phase A + F-0
- **Positive cứng**: (1) `.env` chưa từng commit, không có secret thật trong file tracked (chỉ fixture `sb_secret_test`). (2) Frontend tsc sạch. (3) CI không có `|| true`/`continue-on-error`.
- **Trục đã lấp (F-0)**: pip-audit (16 CVE), coverage (66.2%), radon (cc+mi), vulture (257), npm audit (2 moderate), OPS-005 fixed.
- **Trục vẫn mù**: type-check backend (mypy tự tắt), gitleaks/semgrep/trivy (cần CI), RLS live (cần Supabase SQL Editor), attack eval LLM.


Commit neo: `c939220c60f4f63a34b7a6cf6dc843023dc09e20` (xem `COMMIT_SHA`).
Cây làm việc sạch (chỉ `audit/` + `.ai-log/.git_cache.json` untracked — xem `git-dirty.txt`).

> ⚠️ Nhiều công cụ bảo mật/chất lượng **KHÔNG cài được** trong môi trường này → các trục đó MÙ, mọi kết luận về chúng đánh dấu confidence thấp và cần chạy lại trong CI.

| File | Công cụ | Trạng thái | Số mục | Đáng chú ý |
|---|---|---|---|---|
| `COMMIT_SHA` | git | ✅ | 1 | HEAD dịch từ `2245728`→`c939220` giữa các session (repo đang phát triển liên tục) |
| `git-dirty.txt` | git | ✅ | 2 | Cây sạch, chỉ có thư mục audit |
| `ruff-signal.json` | ruff (E,F,B,S,ASYNC,RUF,PL,C90,ARG,SIM,TRY,LOG) | ✅ | **2927** | Tín hiệu lớn; xem S & ASYNC bên dưới |
| `ruff-all-stats.txt` | ruff --select ALL --statistics | ✅ | ~ | Top: COM812(264), D-docstring, E501(162), G004(151), B008(135), T201 print(127), BLE001 blind-except(112) |
| `secret-grep-history.txt` | git log -p + grep (thay gitleaks) | ⚠️ thủ công | 60 dòng | **Toàn bộ là tên biến / nội dung log `.ai-log`, KHÔNG có giá trị secret thật** |
| `mypy-core.txt` | mypy --strict (adaptive/auth/api) | ⚠️ MÙ | "Success: no issues in 21 files" | **Giả**: `[tool.mypy] ignore_errors=true` trong pyproject vô hiệu hoá mọi báo lỗi kể cả --strict |
| `tsc.txt` | tsc --noEmit (frontend) | ✅ | **0 lỗi** | Frontend type-clean; 0 `any`/`@ts-ignore` trong app/hooks |
| `pytest.txt` | pytest / uv run pytest | ⚠️ HỎNG | "no tests ran" | Full-run **crash lúc collection**: `ValueError: I/O operation on closed file`. Subset chạy `-s` thì PASS |
| `coverage.json` | pytest-cov | ❌ THIẾU | — | pytest-cov & coverage KHÔNG cài trong cả .venv lẫn uv env → trục coverage MÙ |

## Công cụ KHÔNG có (trục mù → confidence thấp)
`gitleaks`, `trufflehog`, `semgrep`, `trivy`, `pip-audit`, `radon`, `vulture`, `tokei/cloc`, `pytest-cov`, `coverage`, `knip`, `madge`, (`pnpm` không global — dùng `node_modules/.bin`).

## Ruff — nhóm bảo mật (S) toàn repo
```
1151 S101  assert (chủ yếu trong tests — bình thường)
  29 S110  try-except-pass (nuốt lỗi im lặng) — src rải rác
  13 S113  requests KHÔNG timeout — material_routes, quiz_generator, rag_ingestion
  10 S106  hardcoded password (phần lớn false positive: field name)
   9 S105  hardcoded password string (false positive)
   4 S608  SQL injection string-building → 1 chỗ sync_routes.py:83 = FALSE POSITIVE (placeholders ?,?,?)
   4 S603  subprocess
   3 S311  pseudo-random (dashboard sim — OK)
   2 S324  md5 (graphusion checksum — OK)
   2 S310  url open
   1 S607  partial executable path
   1 S104  bind 0.0.0.0 (config — mong đợi trong container)
```

## Ruff — ASYNC (10 lỗi, đều THẬT, ảnh hưởng hiệu năng event loop)
```
ASYNC210 src/services/quiz_generator.py:118,151,165,270,329  — blocking HTTP (requests) trong hàm async
ASYNC230 src/api/routes.py:1466,1618                         — open() file blocking trong hàm async
ASYNC240 src/api/material_routes.py:390,425,429              — pathlib.Path trong hàm async
```

## Kết luận Phase A
- **Positive cứng**: (1) `.env` chưa từng commit, không có secret thật trong file tracked (chỉ fixture `sb_secret_test`). (2) Frontend tsc sạch. (3) CI không có `|| true`/`continue-on-error`.
- **Trục mù**: type-check backend (mypy tự tắt), coverage, SAST, secret-scanner chuyên dụng, dependency-CVE, complexity.
- **Cần chạy lại trong CI** với: pip-audit, gitleaks, semgrep, pnpm audit, pytest-cov để lấp các trục mù.
