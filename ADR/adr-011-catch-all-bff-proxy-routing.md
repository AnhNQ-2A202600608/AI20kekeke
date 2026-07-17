# ADR-011: Catch-All BFF Proxy Routing

**Ngày:** 2026-06-16
**Trạng thái:** Reviewed

## Bối cảnh (Context)

Hệ thống của chúng ta sử dụng kiến trúc phân tách giữa Next.js (Frontend) và FastAPI (Backend). Trong các phiên bản trước:
1. Ban đầu chúng ta sử dụng BFF Proxy thủ công ở mỗi Route Handler (`chat/route.ts`, `recommend/route.ts`, v.v.), việc này dẫn tới trùng lặp code (~600 dòng proxy code) vi phạm nghiêm trọng nguyên lý DRY và khó bảo trì.
2. Tiếp đó, phương án Split Domains (trình duyệt gọi thẳng FastAPI) bị loại bỏ do phức tạp hóa CORS, tăng nguy cơ lộ thông tin bảo mật/API Key và đòi hỏi sửa đổi diện rộng trong mã nguồn component.
3. Sau cùng, phương án tĩnh Next.js Config Rewrites (`next.config.ts`) được đề xuất nhưng bộc lộ hạn chế do tính tĩnh của nó (cấu hình tại build-time), khó bắt lỗi kết nối trực quan khi FastAPI backend offline, và có thể gặp vấn đề về buffering của luồng Event Stream (SSE) khi deploy trên các môi trường serverless (như Vercel).

Cần một cơ chế định tuyến linh hoạt, tinh gọn, bảo mật và hỗ trợ fallback tốt.

## Các lựa chọn (Alternatives)

### Lựa chọn 1: Next.js Static Rewrites (`next.config.ts`)
- Ưu điểm: Không cần viết code, Next.js tự proxy dưới nền.
- Nhược điểm: Cấu hình tĩnh tại build-time. Không thể can thiệp động để thêm/sửa headers (ví dụ đính kèm Auth token từ Cookie/Session phía máy chủ). Khó xử lý lỗi kết nối tập trung (trình duyệt sẽ nhận trực tiếp lỗi Network Error từ proxy thay vì mã phản hồi chuẩn hóa). Gặp vấn đề buffering/timeout khi dùng SSE trên các serverless host.

### Lựa chọn 2: Next.js Middleware (`middleware.ts` trên Edge runtime)
- Ưu điểm: Xử lý định tuyến trước khi request chạm vào Router. Rất nhanh.
- Nhược điểm: Bị giới hạn tập API của Edge runtime, khó can thiệp vào request body hoặc xử lý luồng Event Stream phức tạp.

### Lựa chọn 3: Catch-All BFF Proxy Route Handler (`app/api/v1/[...path]/route.ts`)
- Ưu điểm:
  - Gom toàn bộ logic proxy về duy nhất 1 file (DRY).
  - Không cần sửa đổi bất kỳ component frontend nào (đường dẫn vẫn là `/api/v1/*`).
  - Hỗ trợ đầy đủ việc can thiệp động (ví dụ: log telemetry, đính kèm JWT token từ Cookies trước khi chuyển tiếp xuống FastAPI).
  - Hỗ trợ tốt streaming (SSE) cho chat và xử lý ngoại lệ tập trung (trả về lỗi 503 và thông điệp tiếng Việt thân thiện khi FastAPI offline).
- Nhược điểm: Mất thêm một chút CPU overhead để xử lý request chuyển tiếp trên Next.js Server side so với rewrite cấp độ máy chủ.

## Quyết định (Decision)

Chọn **Lựa chọn 3: Catch-All BFF Proxy Route Handler** tại `frontend/app/api/v1/[...path]/route.ts`.

## Lý do (Rationale)

1. **Tinh gọn & Dễ bảo trì:** Thay thế toàn bộ các file proxy routes rời rạc trước đây bằng một handler duy nhất dài chưa đầy 100 dòng code.
2. **Khả năng Fallback & Trực quan hóa lỗi:** Khi backend FastAPI bị offline, proxy này bắt lỗi `fetch` và phản hồi về mã `503 Service Unavailable` kèm JSON hướng dẫn bật backend. Frontend có thể hiển thị thông báo toast/alert rõ ràng cho người dùng thay vì crash âm thầm.
3. **Bảo mật & Linh hoạt tương lai:** Đóng vai trò là một BFF (Backend-For-Frontend) thực thụ. Sau này, ta có thể triển khai lấy Session Token từ Cookies của trình duyệt và chèn vào header `Authorization: Bearer <JWT>` để gửi sang FastAPI mà không sợ bị lộ token ở phía client.
4. **Hỗ trợ Streaming:** Tách biệt luồng text/event-stream và xử lý không buffering qua tiêu đề `X-Accel-Buffering: no`, đáp ứng hoàn hảo tính năng chat Socratic.

## Hệ quả (Consequences)

- Toàn bộ lưu lượng API đến FastAPI sẽ đi qua server Next.js, tạo ra tải phụ thuộc trên máy chủ frontend.
- Cần loại bỏ cấu hình rewrite tĩnh `/api/v1/:path*` trong `next.config.ts` để tránh trùng lặp/ghi đè định tuyến.
