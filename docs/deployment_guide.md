# Hướng dẫn Cấu hình Tự động Deploy lên Render và Vercel qua GitHub Actions

Tài liệu này hướng dẫn chi tiết cách tự động hóa quá trình kiểm thử và deploy Backend (FastAPI - Python) lên **Render** và Frontend (Next.js) lên **Vercel** mỗi khi có code mới được đẩy lên GitHub (nhánh `main`, `master`, hoặc `universal-starter`).

---

## Mục lục
1. [Cách 1: Kết nối trực tiếp GitHub (Khuyên dùng - Đơn giản nhất)](#1-cach-1-ket-noi-truc-tiep-github-khuyen-dung---don-gian-nhat)
2. [Cách 2: Deploy tự động bằng GitHub Actions Runner](#2-cach-2-deploy-tu-dong-bang-github-actions-runner)
3. [Hướng dẫn cấu hình Render (Backend)](#3-huong-dan-cau-hinh-render-backend)
4. [Hướng dẫn cấu hình Vercel (Frontend)](#4-huong-dan-cau-hinh-vercel-frontend)
5. [Thiết lập GitHub Secrets](#5-thiet-lap-github-secrets)

---

## 1. Cách 1: Kết nối trực tiếp GitHub (Khuyên dùng - Đơn giản nhất)

Cả Vercel và Render đều hỗ trợ tính năng tự động deploy trực tiếp từ kho lưu trữ GitHub của bạn mà không cần viết file YAML.

* **Với Vercel:** Bạn chỉ cần đăng nhập bằng GitHub, chọn **Import Project**, trỏ tới repo này và thiết lập `Root Directory` là `frontend`. Vercel sẽ tự động build và deploy lại mỗi khi có push mới.
* **Với Render:** Tạo một **Web Service**, liên kết tài khoản GitHub của bạn, chọn repo này và chỉ định đường dẫn build là `backend`. Render sẽ tự động trigger deploy mỗi khi có push mới.

*Tuy nhiên, nếu bạn muốn chỉ deploy khi toàn bộ các bài test (CI Lint, Typecheck, Pytest) chạy thành công trên GitHub Runner, hãy sử dụng **Cách 2** dưới đây.*

---

## 2. Cách 2: Deploy tự động bằng GitHub Actions Runner

Trong phương pháp này, chúng ta sẽ tạo các workflow tự động chạy sau khi các bước kiểm tra mã nguồn (CI) hoàn thành xuất sắc.

### Quy trình tự động hóa
1. **Developer** `git push` code lên GitHub.
2. GitHub Runner chạy các bước kiểm tra (Linting, Tests) trong file CI tương ứng.
3. Nếu thành công, runner sẽ kích hoạt lệnh Deploy:
   * **Backend:** Kích hoạt webhook (Deploy Hook) của Render để Render tự động tải mã nguồn mới nhất và xây dựng lại Docker Image.
   * **Frontend:** Sử dụng **Vercel CLI** thông qua GitHub Action để build trực tiếp mã nguồn trên runner và đẩy lên Vercel.

---

## 3. Hướng dẫn cấu hình Render (Backend)

Render hỗ trợ deploy thông qua Dockerfile có sẵn trong thư mục `backend/Dockerfile`. Bạn có thể cấu hình bằng 1 trong 2 cách dưới đây:

### Bước 3.1: Cách A - Sử dụng Blueprint (Tự động & Khuyên dùng)
Dự án đã được cấu hình sẵn file `render.yaml` (Blueprint) ở thư mục gốc để tự động hóa toàn bộ việc cấu hình hạ tầng:
1. Truy cập [dashboard.render.com](https://dashboard.render.com/) và đăng nhập.
2. Nhấn **New +** và chọn **Blueprint**.
3. Chọn repo chứa dự án của bạn (nếu chưa liên kết GitHub, hãy liên kết tài khoản).
4. Nhập tên nhóm dịch vụ (Service Group Name) (ví dụ: `vaic-app-group`).
5. Render sẽ tự động đọc file `render.yaml` để cấu hình Web Service với các thông số:
   * **Name**: `vaic-backend`
   * **Docker Context**: `backend`
   * **Dockerfile**: `backend/Dockerfile`
   * **Port**: `8000`
   * Các biến môi trường: `APP_NAME`, `DEBUG`, `STORAGE_PATH`, `LOG_LEVEL`...
6. Nhấn **Apply** để Render tự động tạo và build Web Service.

### Bước 3.2: Cách B - Cấu hình thủ công trên Render
Nếu bạn không muốn sử dụng Blueprint, bạn có thể tạo dịch vụ thủ công theo các bước sau:
1. Tại Dashboard Render, nhấn **New +** và chọn **Web Service**.
2. Chọn **Build and deploy from a Git repository**, chọn repo chứa dự án của bạn.
3. Cấu hình các thông số cơ bản:
   * **Name:** `vaic-backend` (hoặc tên tùy chọn)
   * **Region:** Chọn khu vực gần bạn nhất (ví dụ: Singapore)
   * **Branch:** `master` hoặc `main` (hoặc nhánh bạn đang deploy)
   * **Root Directory:** `backend` (Rất quan trọng!)
   * **Runtime:** `Docker` (Render sẽ tự nhận diện và build từ `backend/Dockerfile`)
4. Nhấn **Create Web Service**.

### Bước 3.3: Lấy Deploy Hook URL
Sau khi dịch vụ `vaic-backend` được khởi tạo thành công (từ Blueprint hoặc thủ công):
1. Tại Dashboard Render, chọn dịch vụ **vaic-backend** vừa tạo.
2. Nhấp vào mục **Settings** ở thanh menu bên trái dịch vụ.
3. Cuộn xuống phần **Deploy Hook**.
4. Sao chép webhook URL (ví dụ: `https://api.render.com/deploy/srv-xxxxxxxxxxxxx?key=yyyyyyyyyyyy`).
5. Dán URL này vào **GitHub Secrets** dưới tên `RENDER_DEPLOY_HOOK_URL`.



---

## 4. Hướng dẫn cấu hình Vercel (Frontend)

Vercel hỗ trợ tối ưu rất tốt cho các ứng dụng Next.js.

### Bước 4.1: Cấu hình Vercel CLI cục bộ để lấy IDs (hoặc qua Dashboard)
Để Deploy từ GitHub Actions lên Vercel, chúng ta cần 3 tham số quan trọng: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, và `VERCEL_PROJECT_ID`.

**Cách lấy thông tin nhanh nhất:**
1. Cài đặt Vercel CLI cục bộ bằng lệnh:
   ```bash
   npm install -g vercel
   ```
2. Đăng nhập vào tài khoản Vercel của bạn:
   ```bash
   vercel login
   ```
3. Di chuyển vào thư mục `frontend` và liên kết dự án:
   ```bash
   cd frontend
   ```
   Chạy lệnh link dự án:
   ```bash
   vercel link
   ```
   *Lệnh này sẽ tạo ra một thư mục ẩn `.vercel` chứa file `project.json` có định dạng:*
   ```json
   {
     "orgId": "team_xxxxxxxxxxxxxxxxxxxxx",
     "projectId": "prj_yyyyyyyyyyyyyyyyyyyyy"
   }
   ```
   * `orgId` chính là **VERCEL_ORG_ID**
   * `projectId` chính là **VERCEL_PROJECT_ID**

### Bước 4.2: Tạo Vercel Personal Access Token
1. Truy cập [vercel.com/account/tokens](https://vercel.com/account/tokens).
2. Nhấp vào **Create**.
3. Điền tên token (ví dụ: `github-actions-deploy`) và phạm vi quyền lực, sau đó nhấp vào **Create**.
4. Sao chép Token này và lưu trữ làm **VERCEL_TOKEN**.

---

## 5. Thiết lập GitHub Secrets

Để GitHub Runner có quyền ra lệnh cho Render và Vercel, bạn phải cấu hình Repository Secrets bảo mật trên GitHub:

1. Truy cập kho lưu trữ GitHub của bạn.
2. Chọn tab **Settings** -> **Secrets and variables** (ở thanh menu bên trái) -> Chọn **Actions**.
3. Nhấp vào nút **New repository secret**.
4. Lần lượt thêm các Secret sau:

| Secret Name | Giá trị |
| :--- | :--- |
| `RENDER_DEPLOY_HOOK_URL` | Dán liên kết Deploy Hook lấy được ở **Bước 3.2** |
| `VERCEL_TOKEN` | Dán Personal Access Token lấy được ở **Bước 4.2** |
| `VERCEL_ORG_ID` | Dán `orgId` từ file `.vercel/project.json` ở **Bước 4.1** |
| `VERCEL_PROJECT_ID` | Dán `projectId` từ file `.vercel/project.json` ở **Bước 4.1** |

---

## 6. Cấu hình môi trường (Environment Variables)

### Môi trường Backend (Render)
Khi chạy trên Render, hãy thiết lập các biến môi trường trong phần **Environment** trên Dashboard Render:
* `PORT` = `8000`
* `PYTHONUNBUFFERED` = `1`
* Các biến API Key hoặc Database URL cần thiết của backend.

### Môi trường Frontend (Vercel)
Khi chạy trên Vercel, hãy thiết lập các biến môi trường trong phần **Project Settings** > **Environment Variables** trên Dashboard Vercel:
* `NEXT_PUBLIC_API_URL` = `https://<ten-backend-cua-ban>.onrender.com/api/v1` (Trỏ API URL của Frontend tới địa chỉ Backend trên Render).
