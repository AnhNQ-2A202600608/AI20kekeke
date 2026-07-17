# VAIC Universal Starter Template

### 🌐 Production

| Component | URL |
|---|---|
| **Frontend** | [https://ai20kekeke.vercel.app](https://ai20kekeke.vercel.app) |
| **Backend** | [https://vaic-backend.onrender.com](https://vaic-backend.onrender.com) |
| **Health check** | [https://vaic-backend.onrender.com/health](https://vaic-backend.onrender.com/health) |

### 🧪 Staging

| Component | URL |
|---|---|
| **Frontend** | [https://frontend-o2vyd6xgw-edu-gap1.vercel.app](https://frontend-o2vyd6xgw-edu-gap1.vercel.app) |
| **Backend** | [https://vaic-backend-staging.onrender.com](https://vaic-backend-staging.onrender.com) |
| **Health check** | [https://vaic-backend-staging.onrender.com/health](https://vaic-backend-staging.onrender.com/health) |

## Spec Kit

Repo này đã được gắn `Spec Kit` cho `Codex` ở chế độ `skills`.

- Hướng dẫn: [docs/spec-kit-setup-vi.md](./docs/spec-kit-setup-vi.md)
- Workflow và template nằm trong `.specify/`
- Các skill `speckit-*` nằm trong `.agents/skills/`

Trong môi trường Codex hỗ trợ local skills, có thể gọi:

```text
$speckit-specify
$speckit-plan
$speckit-tasks
$speckit-implement
```

VAIC Universal Starter là bộ khung full-stack trung tính, được thiết kế chuyên biệt cho các đội thi cuộc thi VAIC.

> [!WARNING]
> **Bộ khung này không phải là lời giải sẵn cho bất kỳ đề thi nào.** Nhiệm vụ của nó là cung cấp cấu trúc thư mục chuẩn, giao diện Workspace trực quan, hệ thống quản lý dữ liệu, kiểm soát an toàn bảo mật và đánh giá hiệu năng để các đội thi có thể bắt tay vào phát triển giải pháp ngay lập tức mà không phải tốn thời gian xây dựng khung sườn.

---

## 1. Tính năng cốt lõi

- **Giao diện Workspace Động (Next.js)**: Tự động kết xuất form nhập tham số dựa trên mô tả schema của capability được chọn từ backend.
- **Hệ thống Quản lý Tiến trình (Run & Artifact)**: Lưu vết toàn bộ dữ liệu đầu vào, tham số, trạng thái chạy (queued, running, completed, failed, cancelled) và artifacts đầu ra.
- **Bảo mật mặc định**:
  - Chống Path Traversal (ngăn chặn truy cập file ngoài phạm vi lưu trữ).
  - Giới hạn định dạng tệp tải lên (File Allowlist).
  - Tự động ẩn thông tin nhạy cảm như API Keys, Bearer Tokens trong log (`SecretRedactingFilter`).
  - Toàn bộ lỗi được đóng gói trong phản hồi chuẩn (Envelope), không trả về stack trace của Python ra ngoài API.
- **Cơ chế Module linh hoạt**: Các module hỗ trợ nâng cao (`agent`, `rag`, `computer_vision`,...) được cấu hình tắt mặc định để tránh cài đặt thư viện nặng không cần thiết.

---

## 2. Quick Start

### Yêu cầu hệ thống
- Python 3.11+
- Node.js 20+

### Các bước khởi động nhanh
1. **Khởi tạo cấu hình và môi trường**:
   ```bash
   python scripts/project_tasks.py bootstrap
   ```
2. **Cài đặt thư viện**:
   ```bash
   python scripts/project_tasks.py install
   ```
3. **Chạy các máy chủ phát triển (Development)**:
   - Trong terminal thứ nhất (Backend):
     ```bash
     python scripts/project_tasks.py dev-backend
     ```
   - Trong terminal thứ hai (Frontend):
     ```bash
     python scripts/project_tasks.py dev-frontend
     ```
4. Truy cập giao diện tại: `http://localhost:3000`.

`Makefile` chỉ là wrapper tùy chọn cho máy đã cài `make`. CLI Python ở trên là cách chạy
chuẩn trên Windows, Linux và macOS.

---

## 3. Cấu trúc thư mục chính

```
vaic-universal-starter/
├── backend/                  # Mã nguồn FastAPI Backend
│   ├── src/
│   │   ├── api/              # Định nghĩa API routes (health, files, runs)
│   │   ├── core/             # Cơ chế module, data loaders, logging, security
│   │   ├── modules/          # Các modules capabilities tùy chọn (agent, rag, CV,...)
│   │   └── storage/          # Dịch vụ quản lý tệp tin và metadata local
│   └── tests/                # Unit tests & smoke tests
├── frontend/                 # Giao diện Next.js SPA
│   ├── app/                  # Các trang (workspace, files, runs, results, settings)
│   └── lib/                  # Helper gọi API
├── scripts/                  # Các kịch bản CLI (list_modules, init_challenge,...)
├── docs/                     # Tài liệu hướng dẫn kiến trúc & thiết kế
└── Makefile                  # Trình điều khiển tự động hóa các tác vụ
```

---

## 4. Quản lý Modules

### Core và Optional Modules
- **Core Module (`example_transform`)**: Luôn bật, thực hiện biến đổi văn bản để kiểm tra đường chạy dữ liệu.
- **Optional Modules**: `agent`, `rag`, `computer_vision`, `prediction`, `optimization`, `analytics` (Tất cả đều tắt mặc định).

### Cách bật/tắt module tùy chọn
1. Xem danh sách module:
   ```bash
   python scripts/list_modules.py
   ```
2. Bật một module (Ví dụ: `rag`):
   ```bash
   python scripts/enable_module.py rag
   ```
   *Lưu ý: Hệ thống sẽ kiểm tra các gói thư viện Python bắt buộc và biến môi trường trước khi cho phép bật.*
3. Tắt một module:
   ```bash
   python scripts/disable_module.py rag
   ```
4. Kiểm tra tính hợp lệ của toàn bộ module:
   ```bash
   python scripts/validate_modules.py
   ```

---

## 5. Ingest Đề thi và Khởi tạo Workspace mới

Khi nhận được đề bài chính thức, đội thi có thể nhập dữ liệu đề và tạo thư mục giải bài độc lập mà không ảnh hưởng tới code gốc.

1. **Chuẩn bị file mô tả đề bài** (`problem.json` hoặc `.yaml`):
   ```json
   {
     "title": "CV Shape Detector",
     "description": "Detect shapes inside pictures using opencv and frames representation.",
     "rubrics": {
       "accuracy": 60,
       "processing_time": 40
     },
     "data_sources": ["frames.zip"]
   }
   ```
2. **Khởi tạo không gian giải đề**:
   ```bash
   python scripts/init_challenge.py "Shape Counter" problem.json
   ```
3. Thư mục độc lập sẽ được tạo tại `challenges/shape-counter/` chứa đầy đủ cấu hình riêng biệt, mẫu tài liệu kiến trúc, MVP, và kế hoạch demo.
4. Kích hoạt workspace trong `.env` trước khi chạy backend:
   ```dotenv
   ACTIVE_CHALLENGE=shape-counter
   ```
   Có thể dùng slug trong `challenges/` hoặc đường dẫn tuyệt đối. Backend sẽ đọc
   `modules_config.json` của workspace đang kích hoạt.

---

## 6. Kiểm thử & Đánh giá

### Chạy Unit Tests
```bash
python scripts/project_tasks.py test
```
### Chạy Smoke Test (Kiểm tra đường chạy tích hợp)
```bash
python scripts/project_tasks.py smoke
```
### Chạy Đánh giá hiệu năng và xuất báo cáo
```bash
python scripts/project_tasks.py eval
```
Báo cáo đánh giá (Success rate, duration, error rate) sẽ được ghi nhận tại thư mục `data/evals/` dưới định dạng JSON và Markdown.

---

## 7. Sử dụng Docker

Bộ khung hỗ trợ chạy toàn bộ ứng dụng qua Docker Compose để giả lập môi trường bàn giao:

- Khởi động các container:
  ```bash
  python scripts/project_tasks.py docker-up
  ```
- Dừng các container:
  ```bash
  python scripts/project_tasks.py docker-down
  ```

Frontend gọi API qua proxy same-origin `/api/v1`; trong Docker, proxy chuyển tiếp tới service
`backend`, vì vậy không cần hardcode địa chỉ máy người dùng trong mã nguồn.

### Clean và đóng gói an toàn

```bash
python scripts/project_tasks.py clean
python scripts/project_tasks.py package
```

`clean` chỉ xóa dependency/cache/build/data sinh ra và luôn giữ `challenges/`. Gói
`vaic-starter-submission.tar.gz` bao gồm toàn bộ workspace challenge nhưng loại `.env`, `.git`,
dependency, cache và dữ liệu runtime.

---

## 8. Xử lý sự cố (Troubleshooting)

- **Lỗi 422 khi Upload hoặc Run**:
  - Kiểm tra định dạng tệp tin có nằm trong allowlist của `storage/local.py` hay không (mặc định chỉ cho phép các định dạng an toàn như `.txt`, `.csv`, `.json`, `.pdf`, `.png`, `.jpg`, `.md`).
  - Đảm bảo tham số đầu vào khớp với schema mô tả của capability.
- **Lỗi "ModuleNotFoundError"**:
  - Chạy lại `python scripts/project_tasks.py install` để tạo đúng môi trường cho hệ điều hành.
  - Kiểm tra module bằng `python scripts/project_tasks.py validate`.

---

## 9. Hạn chế
- Hệ thống chạy đồng bộ (synchronous execution) trên tiến trình cục bộ, thích hợp cho các bài thi có thời gian xử lý nhanh dưới 1 phút. Đối với các tác vụ huấn luyện mô hình rất nặng, đội thi nên bổ sung hàng đợi Celery/Redis.
