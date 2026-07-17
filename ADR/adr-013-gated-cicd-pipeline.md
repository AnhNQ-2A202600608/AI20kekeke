# ADR-013: Kiến trúc kiểm duyệt chất lượng tự động (Gated CI/CD Pipeline) và Chiến lược triển khai

**Ngày:** 2026-06-19
**Trạng thái:** Reviewed

## Bối cảnh (Context)

Dự án cần triển khai Frontend (Next.js) lên Vercel và Backend (FastAPI) lên Render. 
Các ràng buộc và yêu cầu thực tế bao gồm:
- **Tài nguyên:** Sử dụng tài khoản Render Free tier.
- **Ràng buộc kết nối:** Render Free tier không hỗ trợ Private Network cho các dịch vụ kết nối từ bên ngoài (như Vercel gọi API Backend của Render) mà chỉ cho phép kết nối qua Public Network. Các kết nối cơ sở dữ liệu và cache cũng phải qua cổng Public.
- **Quy trình Chất lượng (Bài 12):** Đảm bảo mã nguồn trước khi deploy lên Production phải thỏa mãn các tiêu chuẩn khắt khe về mặt kiểm thử, chất lượng code, an toàn bảo mật, đánh giá hành vi AI, và kiểm tra tính sẵn sàng vận hành của Docker (Production-ready).
- **Custom Domain:** Tạm thời chưa quyết định tên miền chính thức, cần để trống và sẽ bổ sung cấu hình tên miền tùy chỉnh (custom domain) sau.

## Các lựa chọn (Alternatives)

### Lựa chọn 1: Deploy trực tiếp khi có commit mới (Auto-deploy mặc định của Vercel và Render)
- **Ưu điểm:** Thiết lập đơn giản, deploy nhanh chóng mỗi khi push code lên `main`/`dev`.
- **Nhược điểm:** Không kiểm soát được chất lượng. Nếu code có lỗi kiểm thử (pytest), rò rỉ API Keys hoặc không đạt các tiêu chí của Bài 12 thì vẫn sẽ được deploy trực tiếp lên Production, gây gián đoạn hệ thống.

### Lựa chọn 2: Gated CI/CD Pipeline (Deploy tự động có kiểm duyệt chất lượng)
- **Ưu điểm:** Code chỉ được deploy lên Vercel và Render sau khi đã vượt qua toàn bộ các cổng kiểm duyệt (Quality Gates) trên GitHub Actions:
  1. Linting & Formatting (Ruff cho Backend, ESLint cho Frontend).
  2. Unit & Integration Testing (Pytest).
  3. Kiểm tra tính sẵn sàng Production (Docker multi-stage, non-root user, bảo mật CORS, API keys leakage...).
  4. Đánh giá độ thông minh/hành vi của AI Tutor (Golden cases).
  5. Quét bảo mật container image (Trivy).
- **Nhược điểm:** Thời gian chạy CI lâu hơn (từ 3-5 phút), đòi hỏi cấu hình GitHub Secrets đầy đủ (`VERCEL_TOKEN`, `RENDER_DEPLOY_HOOK_URL`, `OPENAI_API_KEY`...).

## Quyết định (Decision)

Chọn **Lựa chọn 2: Gated CI/CD Pipeline**.

Cụ thể:
1. **Frontend:** Tắt tính năng tự động deploy mặc định của Vercel khi liên kết với GitHub. Chuyển sang thực hiện deploy thông qua GitHub Actions runner sử dụng `vercel-cli` (lệnh `npx vercel deploy --prod`) sau khi pass hết các bước CI.
2. **Backend:** Cấu hình `autoDeploy: false` trong file `render.yaml`. CD trên GitHub Actions sẽ kích hoạt deployment qua Render Deploy Webhook (`RENDER_DEPLOY_HOOK_URL`) ở bước cuối cùng sau khi CI pass.
3. **Mạng kết nối:** Chấp nhận kết nối qua mạng công cộng (Public Network) cho các dịch vụ do giới hạn của gói Render Free. Đảm bảo cấu hình CORS an toàn trên Backend (giới hạn origin cụ thể thay vì `*`).
4. **Tên miền:** Chưa cấu hình custom domain, sử dụng subdomain mặc định của Vercel/Render. Sẽ cập nhật sau khi quyết định.

## Lý do (Rationale)

- **Tuân thủ bài học vận hành (Bài 12):** Ngăn chặn hoàn toàn việc deploy code lỗi, code thiếu bảo mật hoặc không đạt tiêu chí Production lên môi trường chạy thật.
- **Tự động hóa hoàn toàn (Zero-friction CD):** Sau khi nhà phát triển merge code đã được kiểm duyệt vào nhánh `main` hoặc `dev`, hệ thống sẽ tự động cập nhật cả Frontend và Backend mà không cần can thiệp thủ công.
- **Tính độc lập của Frontend & Backend:** Cho phép kiểm thử độc lập nhưng đồng bộ hóa deploy cùng một thời điểm khi chất lượng đạt chuẩn.

## Hệ quả (Consequences)

- Phải thiết lập đầy đủ các GitHub Secrets tương ứng trên repository.
- Quy trình deploy sẽ chậm hơn một chút do phải chạy qua toàn bộ test suite và Docker/Trivy scan.
- Do không sử dụng private network, kết nối giữa các dịch vụ phải được bảo vệ qua HTTPS và các API Keys an toàn.
