# Hướng dẫn chi tiết Quy trình Deploy & Cấu hình Gated CI/CD (Lesson 12)

Tài liệu này lưu trữ chi tiết các thay đổi mã nguồn, cấu hình hạ tầng, lý do kỹ thuật đằng sau mỗi quyết định và quy trình vận hành để triển khai hệ thống **Frontend (Vercel) + Backend (Render)** với cổng kiểm duyệt chất lượng tự động **Gated CI/CD**.

---

## 1. Kiến trúc Triển khai & Kiểm duyệt Gated CI/CD

```
                       [ Git Push / Merge vào main hoặc dev ]
                                         │
                                         ▼
                                  GitHub Actions CI
       ┌─────────────────────────────────┴─────────────────────────────────┐
       ▼                                 ▼                                 ▼
   Quality Gate 1                  Quality Gate 2                  Quality Gate 3
 [Lint & Formatting]             [Tests & Logic]                [Production Ready]
 ├── Ruff (Backend)              └── Pytest (Backend)            ├── check_production_ready.py
 └── ESLint (Frontend)                                           └── Golden Evals (AI Tutor)
                                                                        │
                                                                        ▼
                                                                 Quality Gate 4
                                                                [Container Scan]
                                                                 └── Trivy Security Scan
                                                                        │
                                       ┌────────────────────────────────┴────────────────────────────────┐
                                       ▼ (Nếu TẤT CẢ bước PASS)                                          ▼ (Nếu CÓ bước FAIL)
                             [Kích hoạt Deploy CD]                                                  [Dừng Quy Trình]
                             ├── Frontend: npx vercel deploy --prod                                 └── Báo lỗi & Giữ nguyên bản cũ
                             └── Backend: Render Deploy Webhook
```

---

## 2. Chi tiết Thay đổi & Lý do Kỹ thuật (Technical Rationale)

### A. Tầng Backend (FastAPI - Python)

#### 1. Bổ sung Endpoint `/ready` (Readiness check)
*   **File sửa đổi:** [src/main.py](file:///d:/Project/Vin_AI/000%20Group%20Project/C2-App-125/src/main.py)
*   **Chi tiết thay đổi:** Khai báo route `GET /ready` thực hiện kiểm tra ngầm kết nối tới cơ sở dữ liệu Supabase (qua truy vấn thử `select 1` trên bảng `concepts`) và Redis Cache (qua phương thức `ping()`). Trả về HTTP 200 nếu kết nối bình thường, ngược lại trả về HTTP 503.
*   **Lý do kỹ thuật:** 
    *   Làm **Readiness Probe** cho môi trường Production (như Render Web Service). 
    *   Giúp bộ cân bằng tải (Load Balancer) và cổng định tuyến giao thông (API Gateway) xác định chính xác thời điểm instance backend đã thực sự sẵn sàng tiếp nhận request sau khi khởi động. Tránh trường hợp gửi request sớm khi kết nối DB/Cache chưa khởi tạo xong gây ra lỗi HTTP 502/504 cho người dùng cuối.

#### 2. Tinh chỉnh xử lý CORS origins động
*   **File sửa đổi:** [src/main.py](file:///d:/Project/Vin_AI/000%20Group%20Project/C2-App-125/src/main.py)
*   **Chi tiết thay đổi:** Thay thế `settings.cors_origins.split(",")` bằng cú pháp loại bỏ khoảng trắng: `[origin.strip() for origin in settings.cors_origins.split(",")]`.
*   **Lý do kỹ thuật:** 
    *   Khi cấu hình biến môi trường `CORS_ORIGINS` cho nhiều domain (ví dụ: `http://localhost:3000, https://c2-app-frontend.vercel.app`), các ký tự khoảng trắng thừa (nếu có) sau dấu phẩy sẽ được strip sạch sẽ.
    *   Tránh các lỗi CORS block không mong muốn trên trình duyệt do chuỗi origin không khớp tuyệt đối.

#### 3. Bổ sung unit test cho Readiness Probe
*   **File sửa đổi:** [tests/test_api/test_routes.py](file:///d:/Project/Vin_AI/000%20Group%20Project/C2-App-125/tests/test_api/test_routes.py)
*   **Chi tiết thay đổi:** Viết test case `test_ready` gửi request thử nghiệm tới `/ready` và xác thực cấu trúc JSON trả về.
*   **Lý do kỹ thuật:** Đảm bảo endpoint `/ready` không bị lỗi logic nội bộ (regression) khi chạy test suite cục bộ cũng như khi chạy CI kiểm thử trước khi merge.

#### 4. Cấu hình Render Blueprint và Loại bỏ Frontend khỏi Render
*   **File sửa đổi:** [render.yaml](file:///d:/Project/Vin_AI/000%20Group%20Project/C2-App-125/render.yaml)
*   **Chi tiết thay đổi:**
    *   Loại bỏ hoàn toàn định nghĩa dịch vụ `c2-app-frontend` ra khỏi blueprint.
    *   Thêm biến cấu hình `CORS_ORIGINS` dạng placeholder.
    *   Đảm bảo `autoDeploy: false` được gán trên Web Service Backend.
*   **Lý do kỹ thuật:**
    *   **Tách biệt hạ tầng:** Next.js hoạt động tối ưu nhất trên Vercel (Edge network, CDN cache, build serverless tối ưu) thay vì build dạng Node standalone chậm chạp trên gói Render Free.
    *   **Gated Deploy (Cản lỗi):** Tắt tính năng tự động deploy của Render để tránh việc Render tự động deploy code lỗi lên production ngay khi push. Chỉ kích hoạt deploy bằng Webhook của Render sau khi toàn bộ bước kiểm định trên GitHub Actions đã thành công 100%.

---

### B. Tầng Frontend (Next.js - TypeScript)

#### 1. Đóng gói assets động cho Serverless Functions
*   **File sửa đổi:** [frontend/next.config.ts](file:///d:/Project/Vin_AI/000%20Group%20Project/C2-App-125/frontend/next.config.ts)
*   **Chi tiết thay đổi:** Thêm tùy chọn `outputFileTracingIncludes` ở cấp cao nhất (top-level config) trỏ tới các thư mục `./knowledge/**/*` và `./public/quizzes/**/*`.
*   **Lý do kỹ thuật:**
    *   Vercel deploy các Next.js API route thành các hàm Serverless Functions (AWS Lambda) stateless và độc lập. Theo mặc định, Next.js standalone build chỉ đóng gói các tệp được import tĩnh (static imports).
    *   Đối với các API route truy xuất tệp cục bộ động bằng mô-đun Node.js `fs` (như đọc tài liệu tri thức trong `/api/guidebook/[slug]` hoặc đề thi JSON trong `/api/questions`), các tệp này sẽ bị bỏ qua và dẫn đến lỗi `ENOENT` (không tìm thấy file) trên production.
    *   Việc cấu hình `outputFileTracingIncludes` bắt buộc Next.js standalone compiler đóng gói thủ công các thư mục tĩnh này vào tệp ZIP của các API tương ứng, giúp API hoạt động mượt mà.

---

### C. Tầng CI/CD Quality Gates & Security (GitHub Actions)

#### 1. Xây dựng Script tự động chấm điểm 20 tiêu chuẩn vận hành sản xuất
*   **File sửa đổi:** [scripts/check_production_ready.py](file:///d:/Project/Vin_AI/000%20Group%20Project/C2-App-125/scripts/check_production_ready.py)
*   **Chi tiết thay đổi:** Viết mã nguồn Python quét toàn bộ workspace để kiểm thử các tiêu chí: Dockerfile multi-stage, non-root user, ghim phiên bản base, loại trừ file nhạy cảm trong `.dockerignore` / `.gitignore`, ngăn chặn rò rỉ API Keys cứng, an toàn CORS, và sự hiện diện của các endpoint sức khỏe.
*   **Lý do kỹ thuật:** Tự động hóa hoàn toàn quy trình chấm điểm và đánh giá tiêu chuẩn sản xuất của Bài 12. Tránh sai sót chủ quan của nhà phát triển và ngăn chặn các lỗ hổng vận hành cơ bản bị đẩy lên môi trường Production.

#### 2. Tái cấu trúc Workflow CI/CD Backend (Gated Pipeline)
*   **File sửa đổi:** [.github/workflows/ci-backend.yml](file:///d:/Project/Vin_AI/000%20Group%20Project/C2-App-125/.github/workflows/ci-backend.yml)
*   **Chi tiết thay đổi:** Tích hợp chuỗi Quality Gates tuần tự: `Ruff Lint` -> `Pytest` -> `check_production_ready.py` -> `run_golden_eval.py` -> `Docker Build` -> `Trivy Scanner` -> `CD Webhook Trigger`.
*   **Lý do kỹ thuật:**
    *   **Bảo vệ ứng dụng AI:** Kiểm tra cả tính đúng đắn logic của code (Pytest) và tính đúng đắn về hành vi của AI Tutor (Golden cases) để tránh tình trạng AI Tutor trả lời vi phạm quy tắc Socratic hay trả lời sai ngôn ngữ.
    *   **An toàn bảo mật:** Quét bảo mật container image bằng **Trivy** trước khi CD để phát hiện các thư viện hệ thống lỗi thời hoặc có lỗ hổng CVE nghiêm trọng.
    *   **CD Webhook:** Chỉ gọi Render Webhook để deploy khi tất cả các cổng kiểm định trên đều trả về kết quả đạt điểm tuyệt đối.

#### 3. Tích hợp kiểm thử build Frontend trên CI
*   **File sửa đổi:** [.github/workflows/ci-frontend.yml](file:///d:/Project/Vin_AI/000%20Group%20Project/C2-App-125/.github/workflows/ci-frontend.yml)
*   **Chi tiết thay đổi:** Bổ sung bước `pnpm build` (Local verification) chạy trên CI trước khi deploy.
*   **Lý do kỹ thuật:** Đảm bảo không có lỗi TypeScript hay lỗi cú pháp cấu hình trước khi đẩy lên Vercel. Tránh tình trạng build thất bại trên cloud làm treo hoặc gián đoạn phiên bản web đang chạy của học viên.

---

### D. Tài liệu kiến trúc ADR-013
*   **File sửa đổi:** [ADR/adr-013-gated-cicd-pipeline.md](file:///d:/Project/Vin_AI/000%20Group%20Project/C2-App-125/ADR/adr-013-gated-cicd-pipeline.md)
*   **Chi tiết thay đổi:** Tạo bản ghi ADR-013 ghi nhận chính thức quyết định triển khai Gated CI/CD và chiến lược deploy.
*   **Lý do kỹ thuật:** Lưu trữ tài liệu mang tính cấu trúc lâu dài để đồng bộ kiến thức và lý do lựa chọn công nghệ cho toàn bộ thành viên trong nhóm phát triển.

---

## 3. Cấu hình biến môi trường và GitHub Secrets cần thiết

Để kích hoạt hệ thống chạy thực tế, cần cấu hình đầy đủ các biến môi trường sau:

### GitHub Secrets (Settings -> Secrets -> Actions)
*   `VERCEL_TOKEN`: Token xác thực tài khoản để chạy lệnh deploy frontend thông qua CLI.
*   `RENDER_DEPLOY_HOOK_URL`: Webhook URL của Render dùng để trigger CD.
*   `OPENAI_API_KEY`: Key dùng để chạy `run_golden_eval.py`.
*   `SUPABASE_URL` / `SUPABASE_KEY`: Kết nối DB để chạy các bài test tích hợp backend.

### Render Web Service Environment Variables
*   `DATABASE_URL`: Connection string của Supabase.
*   `SUPABASE_URL` / `SUPABASE_KEY`: API keys của Supabase.
*   `OPENAI_API_KEY`: API key của OpenAI.
*   `CORS_ORIGINS`: Địa chỉ frontend Vercel (ví dụ: `https://c2-app-frontend.vercel.app`).
*   `CACHE_TYPE`: `redis`.
*   `REDIS_URL`: Lấy tự động thông qua `fromService` trỏ tới `c2-app-redis`.

### Vercel Environment Variables
*   `BACKEND_API_URL`: Trỏ tới Render backend URL (ví dụ: `https://c2-app-backend.onrender.com`).

---

## 4. Quy trình thiết lập nhanh (Rapid Setup Guide)

Để thiết lập nhanh chóng mà không cần thao tác thủ công phức tạp trên các giao diện Web, bạn có thể thực hiện theo quy trình sau:

### A. Khởi tạo Render bằng Blueprint (Dưới 1 phút)
1. Đăng nhập vào [Render Dashboard](https://dashboard.render.com/).
2. Click **New** (nút màu tím) -> Chọn **Blueprint**.
3. Kết nối với GitHub Repository của dự án. Render sẽ tự động phát hiện file `render.yaml` trong thư mục gốc.
4. Nhập các giá trị bí mật của bạn (như `DATABASE_URL` và `OPENAI_API_KEY`) khi giao diện yêu cầu và chọn **Apply**. Render sẽ tự động tạo Web Service Backend, Redis và cấu hình `autoDeploy: false`.
5. Vào phần **Settings** của Web Service Backend vừa tạo để sao chép **Deploy Webhook** (sử dụng ở bước cài đặt GitHub Secrets).

### B. Liên kết Vercel qua CLI (Dưới 1 phút)
1. Mở Terminal tại máy local, di chuyển vào thư mục `/frontend` và chạy:
   ```bash
   cd frontend
   npx vercel link
   ```
2. Đồng ý thiết lập dự án mới bằng cách đăng nhập tài khoản Vercel. Chấp nhận các giá trị mặc định bằng cách bấm Enter, và chọn **No** khi CLI hỏi có muốn tùy biến settings mặc định hay không.
3. Dự án sẽ tự động được tạo trên Vercel. Bạn vào **Project Settings -> Git** trên Vercel Dashboard, chọn **Pause** (tắt Auto-deploy) để ngăn Vercel tự deploy khi push code.
4. Điền biến môi trường `BACKEND_API_URL` trỏ tới URL của Render Backend trong Project Settings.

### C. Khởi tạo Secrets nhanh bằng GitHub CLI (`gh`)
Nếu máy bạn có cài đặt GitHub CLI, hãy mở Terminal local và chạy các dòng lệnh sau để cấu hình nhanh các GitHub Secrets:
```bash
gh secret set VERCEL_TOKEN --body "token-cua-ban"
gh secret set RENDER_DEPLOY_HOOK_URL --body "webhook-cua-ban"
gh secret set OPENAI_API_KEY --body "openai-api-key"
gh secret set SUPABASE_URL --body "supabase-url"
gh secret set SUPABASE_KEY --body "supabase-key"
```

---

## 5. Hướng dẫn kiểm tra và sửa lỗi nhanh (Troubleshooting)

### Lỗi 1: BFF Proxy bị timeout 504 khi AI Tutor phản hồi
*   **Nguyên nhân:** Vercel Hobby tier giới hạn thời gian chạy Serverless function tối đa **60 giây**. Nếu Socratic AI reasoning loop chạy quá lâu để tìm kiếm tài liệu và sinh kết quả, Vercel sẽ tự động ngắt kết nối.
*   **Giải pháp:**
    1. Kiểm tra log của Backend Render để xem AI đã hoàn thành phản hồi chưa.
    2. Tối ưu hóa số lượng slide tìm kiếm RAG hoặc giảm bớt độ trễ (temperature, prompt complexity) trên Backend.

### Lỗi 2: Endpoint `/ready` báo lỗi HTTP 503
*   **Nguyên nhân:** Không thể kết nối tới cơ sở dữ liệu Supabase hoặc Redis Cache.
*   **Giải pháp:**
    1. Kiểm tra trạng thái hoạt động của Supabase (RLS, quota, IP allowlist).
    2. Kiểm tra log của Render Redis service xem có bị quá tải bộ nhớ (>25MB trên gói free) hay không.

### Lỗi 3: Chạy test cục bộ báo lỗi DriveNotFound trong PowerShell
*   **Nguyên nhân:** Môi trường PowerShell cục bộ thiếu FileSystem drive provider khi chạy các tệp thực thi bên ngoài.
*   **Giải pháp:** Sử dụng Git Bash, CMD, hoặc Command Prompt thông thường thay cho PowerShell để chạy các lệnh `uv run` hoặc `pnpm build`.

