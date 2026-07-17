# Hướng Dẫn Cấu Hình Triển Khai (Setup Render & Vercel)

Tài liệu này hướng dẫn chi tiết cách cấu hình hạ tầng triển khai song song hai môi trường **Staging** (nhánh `dev`) và **Production** (nhánh `main`, `master`, hoặc `universal-starter`) cho Backend (FastAPI - Render) và Frontend (Next.js - Vercel) sử dụng pipeline GitHub Actions.

---

## 1. Quy Trình Phân Chia Môi Trường

Hệ thống được thiết kế để tự động hóa hoàn chỉnh dựa trên nhánh Git:

```
                  ┌──────────────┐
                  │   Developer  │
                  └──────┬───────┘
                         │ git push
                         ▼
               ┌───────────────────┐
               │  GitHub Actions   │ (Chạy Lint, Test & Readiness Check)
               └─────────┬─────────┘
                         │
        ┌────────────────┴────────────────┐
        ▼ Nhánh dev                       ▼ Nhánh main/master
 ┌──────────────┐                  ┌──────────────┐
 │ Deploy STG   │                  │ Deploy PROD  │
 └──────┬───────┘                  └──────┬───────┘
        ├─► Render Staging Backend        ├─► Render Production Backend
        └─► Vercel Preview Frontend       └─► Vercel Production Frontend
```

---

## 2. Hướng Dẫn Cấu Hình Render (Backend)

Vì dự án đã cấu hình `autoDeploy: false` trong [render.yaml](file:///d:/Project/Hackathon/AI%20Innovation/AI20kekeke/render.yaml), Render sẽ **không** tự động deploy khi bạn push code. Việc deploy sẽ do GitHub Actions ra lệnh thông qua Deploy Webhooks sau khi code pass CI.

Để phục vụ Staging và Production chạy song song, bạn cần khởi tạo **2 Web Services riêng biệt** trên Render:

### Bước 2.1: Tạo Web Service cho Production
1. Truy cập [dashboard.render.com](https://dashboard.render.com/) và nhấn **New +** > Chọn **Web Service**.
2. Liên kết với kho lưu trữ GitHub của bạn.
3. Cấu hình dịch vụ Production:
   * **Name:** `vaic-backend-prod` (hoặc tên tùy chọn của bạn)
   * **Region:** `Singapore` (để tối ưu tốc độ)
   * **Branch:** `main` (hoặc `master`)
   * **Root Directory:** `backend` (Rất quan trọng!)
   * **Runtime:** `Docker` (Render sẽ tự động dùng `backend/Dockerfile` đa tầng)
4. Nhấn **Advanced** và thiết lập biến môi trường (Environment Variables):
   * `APP_ENV` = `production`
   * `DEBUG` = `false`
   * `FRONTEND_ORIGIN` = URL production thật của Vercel (ví dụ: `https://your-app.vercel.app`)
5. Nhấn **Create Web Service**.

### Bước 2.2: Tạo Web Service cho Staging (Môi trường Dev)
1. Thực hiện các bước tạo Web Service tương tự trên.
2. Cấu hình dịch vụ Staging:
   * **Name:** `vaic-backend-staging`
   * **Region:** `Singapore`
   * **Branch:** `dev` (Để tự động hóa khi đẩy code vào nhánh phát triển)
   * **Root Directory:** `backend`
   * **Runtime:** `Docker`
3. Thiết lập biến môi trường (Environment Variables):
   * `APP_ENV` = `staging`
   * `DEBUG` = `true`
   * `FRONTEND_ORIGIN` = URL preview/staging của Vercel (ví dụ: `https://your-app-git-dev.vercel.app`)
4. Nhấn **Create Web Service**.

### Bước 2.3: Lấy các Deploy Hooks
Sau khi cả 2 Web Service khởi tạo thành công:
1. Truy cập vào phần cài đặt của dịch vụ **vaic-backend-prod** > Chọn mục **Settings** ở menu trái > Cuộn xuống phần **Deploy Hook** > Copy đường dẫn Webhook.
   * Đây sẽ là secret `RENDER_DEPLOY_HOOK_URL` của bạn.
2. Thực hiện tương tự với dịch vụ **vaic-backend-staging** để lấy Webhook Staging.
   * Đây sẽ là secret `RENDER_DEPLOY_HOOK_URL_STAGING` của bạn.

---

## 3. Hướng Dẫn Cấu Hình Vercel (Frontend)

Chúng ta sử dụng cơ chế **Vercel Remote Cloud Build** (không tự build trên runner của GitHub Actions), giúp tiết kiệm tài nguyên và tối ưu hóa hạ tầng build của Vercel.

### Bước 3.1: Lấy các mã nhận diện dự án
Để GitHub Actions ra lệnh build và deploy từ xa lên đúng dự án trên Vercel, bạn cần lấy 3 thông số: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, và `VERCEL_PROJECT_ID`.

1. Cài đặt Vercel CLI trên máy cá nhân để lấy ID nhanh nhất:
   ```bash
   npm install -g vercel
   # Hoặc dùng pnpm:
   pnpm add -g vercel
   ```
2. Đăng nhập vào tài khoản Vercel:
   ```bash
   vercel login
   ```
3. Di chuyển vào thư mục dự án `frontend/` và liên kết với dự án trên Vercel:
   ```bash
   cd frontend
   vercel link
   ```
   * CLI sẽ hỏi bạn thiết lập project mới hoặc liên kết project cũ.
   * Sau khi liên kết thành công, một thư mục ẩn `.vercel/` sẽ được tạo ra chứa file `project.json` có dạng:
     ```json
     {
       "orgId": "team_xxxxxxxxxxxx",
       "projectId": "prj_yyyyyyyyyyyy"
     }
     ```
   * Lưu lại **`orgId`** (dùng cho secret `VERCEL_ORG_ID`) và **`projectId`** (dùng cho secret `VERCEL_PROJECT_ID`).

### Bước 3.2: Tạo Vercel Access Token
1. Truy cập [vercel.com/account/tokens](https://vercel.com/account/tokens).
2. Tạo một Personal Access Token mới (ví dụ tên: `github-actions-deploy-token`).
3. Sao chép token này (dùng cho secret `VERCEL_TOKEN`).

---

## 4. Thiết Lập GitHub Secrets

Để GitHub runner có quyền kích hoạt deploy lên Render và Vercel, bạn phải cấu hình Repository Secrets bảo mật trên GitHub:

1. Truy cập kho lưu trữ GitHub của bạn.
2. Chọn tab **Settings** > **Secrets and variables** > Chọn **Actions**.
3. Chọn **New repository secret** và thêm lần lượt các biến sau:

| Tên Secret trên GitHub | Giá trị |
| :--- | :--- |
| `RENDER_DEPLOY_HOOK_URL` | Webhook URL lấy từ dịch vụ Render **Production** (Bước 2.3) |
| `RENDER_DEPLOY_HOOK_URL_STAGING` | Webhook URL lấy từ dịch vụ Render **Staging** (Bước 2.3) |
| `VERCEL_TOKEN` | Personal Access Token lấy từ Vercel (Bước 3.2) |
| `VERCEL_ORG_ID` | `orgId` lấy từ file `.vercel/project.json` (Bước 3.1) |
| `VERCEL_PROJECT_ID` | `projectId` lấy từ file `.vercel/project.json` (Bước 3.1) |

---

## 5. Cấu Hình Biến Môi Trường (Environment Variables)

### Môi trường Backend (Render Dashboard)
* `PORT` = `8000`
* `PYTHONUNBUFFERED` = `1`
* Các biến API Key của LLM (ví dụ: `OPENAI_API_KEY`, `GEMINI_API_KEY`) cần điền trực tiếp trên Render Dashboard của cả 2 dịch vụ (Prod và Staging).

### Môi trường Frontend (Vercel Dashboard)
Trên Vercel Project Settings > **Environment Variables**, bạn cấu hình biến môi trường kết nối API:
* **Production Environment:**
  * `BACKEND_API_URL` = `https://vaic-backend-prod.onrender.com/api/v1` (Trỏ về URL backend Production)
* **Preview Environment (Staging):**
  * `BACKEND_API_URL` = `https://vaic-backend-staging.onrender.com/api/v1` (Trỏ về URL backend Staging)
