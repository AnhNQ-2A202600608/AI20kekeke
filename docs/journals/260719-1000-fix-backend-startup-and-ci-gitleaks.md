# 2026-07-19 — Sửa lỗi khởi động Backend & Gitleaks CI

- **Why:** Backend crash khi khởi chạy trên Render do thiếu thư viện `slowapi`, và Gitleaks CI bị lỗi do checkout shallow (depth=1).
- **What changed:**
  - Thêm `slowapi>=0.1.10` vào `requirements.txt`.
  - Cấu hình `fetch-depth: 0` cho step checkout trong `.github/workflows/ci-backend.yml`.
- **Validation:**
  - Chạy thành công toàn bộ 353 bài test backend cục bộ (`uv run pytest tests/`).
  - Các bước quét Security Scan, Lint Check và Schema Validation trong checklist của dự án đều báo PASSED.
- **Follow-up:** Người dùng thiết lập biến `ENABLE_EXPERIMENTAL_COREPACK=1` trên Vercel dashboard.
