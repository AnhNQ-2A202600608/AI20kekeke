# Release Checklist — VAIC Universal Starter

Thực hiện checklist này trước khi đóng gói bản nộp hoặc bàn giao cho thành viên khác.

## 1. Bảo vệ workspace

- [ ] Commit hoặc sao lưu thay đổi quan trọng theo quy trình Git của team.
- [ ] Xác nhận lời giải nằm trong `challenges/<slug>/`.
- [ ] Xác nhận `.env` và `frontend/.env.local` không chứa trong vùng staged.
- [ ] Dừng Docker nếu đang chạy:
  ```bash
  python scripts/project_tasks.py docker-down
  ```
- [ ] Xóa cache/build/runtime nhưng giữ nguyên `challenges/`:
  ```bash
  python scripts/project_tasks.py clean
  ```

## 2. Kiểm tra chất lượng

- [ ] Chạy lint backend và frontend:
  ```bash
  python scripts/project_tasks.py lint
  ```
- [ ] Chạy typecheck frontend:
  ```bash
  python scripts/project_tasks.py typecheck
  ```
- [ ] Kiểm tra module đang bật:
  ```bash
  python scripts/project_tasks.py validate
  ```
- [ ] Chạy test và smoke test:
  ```bash
  python scripts/project_tasks.py test
  python scripts/project_tasks.py smoke
  ```

## 3. Đóng gói và kiểm tra lại

- [ ] Tạo archive:
  ```bash
  python scripts/project_tasks.py package
  ```
- [ ] Mở `vaic-starter-submission.tar.gz` và xác nhận có `challenges/<slug>/`.
- [ ] Xác nhận archive không có `.env`, `.git`, `node_modules`, `.venv`, cache hoặc dữ liệu runtime.
- [ ] Giải nén vào thư mục sạch và chạy lại bootstrap, test và build trước khi nộp.
