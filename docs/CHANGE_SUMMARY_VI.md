# Tóm Tắt Các Thay Đổi Đã Thực Hiện

Những file `change` trong repo này chủ yếu được mình sửa theo 2 lớp:

- `hardening` bộ khung dự án để chạy ổn định hơn
- thêm comment tiếng Việt để teammate mới vào dễ đọc và onboarding nhanh hơn

## Phần thay đổi chính

- `scripts/project_tasks.py` mới:
  - Gom toàn bộ lệnh chạy dự án như `bootstrap`, `install`, `dev`, `docker-up`, `lint`, `typecheck`, `clean`, `package`.
- `Makefile`:
  - Đổi thành wrapper mỏng gọi sang `python scripts/project_tasks.py`, để Windows/Linux/macOS dùng chung một flow.
- `.env.example`:
  - Thêm `ACTIVE_CHALLENGE`.
- `backend/src/core/config.py`:
  - Hỗ trợ đọc `ACTIVE_CHALLENGE` và tự tìm `modules_config.json` của challenge đang active.
- `backend/src/core/module.py`:
  - Nối registry module với config của challenge, để module bật/tắt bám theo workspace thật.
- `backend/src/api/main.py`:
  - Log rõ đang dùng file config module nào khi app boot.
- `scripts/init_challenge.py`, `enable_module.py`, `disable_module.py`, `list_modules.py`, `validate_modules.py`:
  - Chỉnh lại để flow tạo challenge và bật/tắt module chạy đúng với cấu trúc mới.
- `docker-compose.yml`, `frontend/next.config.ts`, `frontend/.env.example`, `frontend/Dockerfile`:
  - Sửa lại cơ chế frontend proxy API cho đúng 2 ngữ cảnh:
  - local dev dùng `localhost`
  - Docker dùng service name `backend`
- `frontend/lib/api.ts`:
  - Gom fetch helper typed, chuẩn hóa response/error.
- `frontend/app/workspace/page.tsx`:
  - Bỏ hardcode gọi API trực tiếp, dùng helper chung; sửa typing và luồng upload/run/artifact.
- `frontend/app/files/page.tsx`, `runs/page.tsx`, `results/page.tsx`:
  - Dọn typing để lint/typecheck pass.
- `backend/pyproject.toml`, `.github/workflows/ci.yml`:
  - Chỉnh lint/test/typecheck để CI xanh.
- `backend/tests/test_project_tasks.py` mới:
  - Test `clean`, `package`, và command runner đa nền tảng.
- `backend/tests/test_frontend_configuration.py` mới:
  - Test frontend không còn hardcode API URL sai và Docker/proxy đúng.
- `backend/tests/test_modules.py`, `test_challenge_init.py`, `conftest.py`:
  - Cập nhật test theo flow challenge/module mới.
- `README.md`, `PROJECT_STATUS.md`, `RELEASE_CHECKLIST.md`, `FINAL_AUDIT_REPORT.md`:
  - Cập nhật tài liệu cho khớp với trạng thái thật của repo.
- `vaic-starter-submission.tar.gz`:
  - Build lại gói nộp bài sạch hơn.

## 6 mục P0 đã xử lý

- `clean` không còn xóa nhầm `challenges/`.
- `package` có chứa workspace challenge nhưng loại `.env`, `.git`, `node_modules`, `.venv`, `.next`, cache, runtime data.
- `ACTIVE_CHALLENGE` thực sự điều khiển module config runtime.
- Có CLI đa nền tảng thay vì phụ thuộc `make`.
- Frontend không còn hardcode URL backend sai.
- Lint, typecheck, test và CI được chỉnh để pass.

## Phần comment tiếng Việt đã thêm

- `scripts/project_tasks.py`
- `backend/src/core/config.py`
- `backend/src/core/module.py`
- `backend/src/api/main.py`
- `frontend/next.config.ts`
- `frontend/lib/api.ts`
- `frontend/app/workspace/page.tsx`

Các comment này tập trung giải thích:

- local dev khác Docker ở đâu
- `ACTIVE_CHALLENGE` hoạt động như thế nào
- cơ chế dynamic module loading
- flow `bootstrap/install/clean/package`
- luồng dynamic form, upload file, run capability và preview artifact
