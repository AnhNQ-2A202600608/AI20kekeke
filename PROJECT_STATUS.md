# Trạng thái dự án - VAIC Universal Starter

> Cập nhật: 2026-07-15
> Trạng thái: Đã hoàn thành gia cố 6 hạng mục P0

## Kết quả hiện tại

- Backend FastAPI và frontend Next.js đã có luồng chạy mẫu hoàn chỉnh.
- Cấu hình challenge tại `challenges/<slug>/modules_config.json` được kích hoạt bằng `ACTIVE_CHALLENGE=<slug>`.
- Lệnh vòng đời dự án chạy đa nền tảng qua `python scripts/project_tasks.py <command>`; Makefile chỉ là lớp gọi tắt tùy chọn.
- `clean` chỉ xóa dữ liệu sinh ra và luôn giữ nguyên thư mục `challenges/`.
- `package` đưa mã nguồn challenge vào archive, đồng thời loại trừ secret, cache, dependency và dữ liệu runtime.
- Frontend gọi API qua proxy cùng origin; URL backend được cấu hình bằng `BACKEND_API_URL`.
- CI kiểm tra Ruff, pytest, ESLint, TypeScript và Next.js production build.

## Bằng chứng kiểm tra

| Hạng mục | Kết quả |
|---|---|
| Ruff check và format check | Đạt |
| Backend pytest | 44 test đạt |
| Frontend ESLint | Đạt |
| TypeScript `tsc --noEmit` | Đạt |
| Next.js production build | Đạt |
| Docker Compose config | Hợp lệ |
| Docker image build | Chưa chạy do Docker daemon chưa bật |

## Việc tiếp theo

1. Bật Docker Desktop và chạy `python scripts/project_tasks.py docker-up` để kiểm tra image thực tế.
2. Dùng `python scripts/project_tasks.py package` trước khi nộp bài.
3. Kiểm tra nội dung `vaic-starter-submission.tar.gz` theo `RELEASE_CHECKLIST.md`.
