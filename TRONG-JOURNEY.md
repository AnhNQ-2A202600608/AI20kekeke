# TRONG-JOURNEY: Nhật ký hành trình nâng cấp hệ thống của Trọng

## 2026-06-25 — Khắc phục lỗi Row-Level Security (RLS) Database & Cập nhật lớp xác thực Token API

- **Why:**
  - **Lỗi RLS chặn truy cập:** Khi kích hoạt Row-Level Security (RLS) trên các bảng ở database Supabase Dev để chuẩn bị môi trường vận hành bảo mật, các yêu cầu đọc dữ liệu của khách ẩn danh (`anon`) hoặc sinh viên (`authenticated`) bị chặn hoàn toàn. Điều này dẫn đến sự cố sập luồng tải dữ liệu học tập (Courses, Concepts, Questions, v.v.) và lỗi crash frontend khi gửi đánh giá khảo sát (`public.surveys`).
  - **Lỗi Auth Custom:** Cơ chế xác thực Token tại Backend (`get_current_student_id` và `require_teacher`) trước đây được thiết kế gọi qua Supabase Auth (`auth.users`). Tuy nhiên, dự án sử dụng cơ chế đăng nhập tùy chỉnh (Custom Login) dựa trên MSSV và lưu người dùng trong bảng nghiệp vụ `app.users` (khiến bảng hệ thống `auth.users` của Supabase hoàn toàn trống). Do đó, tất cả các request gửi kèm Token UUID hợp lệ của sinh viên đều bị hệ thống trả về lỗi `401 Unauthorized` hoặc `403 Forbidden`.

- **What changed:**
  - **Database Migration:** Thiết lập và áp dụng tệp SQL migration `db/supabase/migrations/20260626_fix_and_enable_rls.sql` để:
    - Kích hoạt RLS trên toàn bộ 32 bảng của hệ thống.
    - Cấu hình chính sách bảo mật cho phép vai trò `anon` (khách ẩn danh) có quyền `SELECT` trên các bảng nội dung học liệu chung: `app.courses`, `app.concepts`, `app.questions`, `app.question_concepts`, `app.question_hints`, `app.course_materials`, `app.material_chunks`, `app.concept_relations`, và `public.slide_embeddings`.
    - Cấu hình chính sách cho phép `anon` có quyền `SELECT`, `INSERT`, `UPDATE` trên bảng `public.surveys` để giải quyết triệt để lỗi khi frontend gọi `.insert().select()` sau khi kết thúc quiz.
    - Phân quyền nghiêm ngặt các bảng dữ liệu cá nhân (chỉ cho phép `service_role` toàn quyền truy cập và đúng học sinh truy cập dựa trên `auth.uid()`).
  - **Backend (FastAPI Auth):** Thay đổi logic xác thực trong `src/api/adaptive_routes.py`:
    - Loại bỏ lệnh gọi `db.app_client.auth.get_user(token)` tới Supabase Auth.
    - Thay thế bằng việc truy vấn trực tiếp bảng `app.users` (sử dụng đặc quyền `service_role` của backend bypass RLS) để đối chiếu ID (UUID) và email của người dùng.
    - Cập nhật logic `require_teacher` để lấy thông tin vai trò từ bảng `app.user_roles` liên kết với `app.roles` bằng UUID của người dùng.
  - **Frontend (Dependency & Local Setup):**
    - Chạy `npm install` để cài đặt thư viện `@supabase/ssr` đang bị thiếu khiến compiler của Next.js bị crash.
    - Khởi chạy song song Next.js Frontend trên cổng `3000` và FastAPI Backend trên cổng `8000` cục bộ thành công.

- **Validation:**
  - **Automated Tests:** Chạy bộ kiểm thử API backend: `pytest tests/test_api/test_routes.py` vượt qua thành công **8/8 tests** chỉ trong `0.11s`.
  - **E2E Integration Script:** Viết và chạy script kiểm định đầu cuối `verify_api.py` kết nối trực tiếp với DB Dev thực tế: giả lập đăng nhập bằng `duy` (MSSV `2A202600000`) thành công và lấy dữ liệu mastery học tập trả về đúng định dạng HTTP 200, trong khi các token giả mạo bị chặn ngay lập tức (HTTP 401).
  - **Manual Web Verification:** Next.js dev server biên dịch thành công 100%, tải trang đăng nhập `/login` mượt mà và kết nối API BFF Proxy thông suốt tới cổng `8000` của FastAPI backend.

- **Follow-up:**
  - Khắc phục lỗi phân quyền API `/sync-mastery` (hiện đang dùng `require_teacher` sai mục đích, khiến sinh viên không thể tự đồng bộ điểm số Elo & BKT của mình từ bài học tĩnh lên DB, dẫn đến lỗi 403 Forbidden). Cần cập nhật sang `Depends(get_current_student_id)` kèm kiểm tra chéo ID.

---

## 2026-06-27 — Triển khai xác thực Email & Mật khẩu (Supabase Auth) & Đồng bộ tiến trình qua UUID matching

- **Why:**
  - **Bảo mật và chuẩn hóa Auth:** Hệ thống trước đây sử dụng cơ chế đăng nhập custom dựa trên Họ tên & MSSV đối chiếu trực tiếp trong CSDL nghiệp vụ. Cơ chế này không an toàn, thiếu mã hóa mật khẩu, không sinh ra JWT token thực tế và không tận dụng được cơ sở hạ tầng quản lý session an toàn của Supabase Auth.
  - **Mất đồng bộ tiến trình của học viên cũ:** Khi chuyển đổi sang Supabase Auth chuẩn (Email và Mật khẩu), việc đăng ký trực tiếp từ Frontend sẽ sinh ra UUID ngẫu nhiên mới trong bảng `auth.users`. Điều này làm đứt gãy liên kết khoá ngoại (UUID) với dữ liệu năng lực học tập cũ của học viên đã có sẵn trong bảng `app.users` (Ví dụ học viên Nguyễn Văn Thực Chiến mang UUID tĩnh `d3b07384-d113-4ec5-a58e-0f2d87e07661`).
  - **Giải pháp:** Cần phát triển một script nạp tài khoản mẫu khớp chính xác UUID cũ sang bảng hệ thống `auth.users` sử dụng Admin API của Supabase và tái cấu trúc toàn bộ luồng truyền JWT token từ Frontend Next.js lên Backend FastAPI.

- **What changed:**
  - **Database & Account Seeding (`seed_auth_users.py`):**
    - Viết script Python [seed_auth_users.py](file:///d:/Project/Vin_AI/000%20Group%20Project/C2-App-125/scripts/seed_auth_users.py) sử dụng Supabase Admin client (qua service_role key) để gọi hàm `admin_create_user`.
    - Đọc danh sách học viên hiện có từ bảng `app.users`, tạo tài khoản Auth tương ứng với Email dạng `<MSSV>@edugap.vn` và mật khẩu mặc định (ví dụ `123456`), đồng thời **truyền tham số `id` khớp chính xác với UUID tĩnh** của học viên cũ. Nhờ vậy, khi đăng nhập bằng email mới, token JWT được Supabase sinh ra sẽ chứa đúng UUID cũ, giúp học viên bảo toàn 100% lịch sử học tập.
  - **Backend API (FastAPI routes):**
    - Sửa đổi endpoint `/api/v1/auth/login` và `/api/v1/auth/register` trong [auth_routes.py](file:///d:/Project/Vin_AI/000%20Group%20Project/C2-App-125/src/api/auth_routes.py) nhận payload **Email và Mật khẩu** thay cho Họ tên & MSSV. Gọi API `auth.sign_in_with_password` của Supabase Auth và trả về JWT access token. Hỗ trợ Stub Mode sinh fake token khi không có kết nối DB.
    - Cấu hình backend parse JWT token để xác thực UUID và quyền của sinh viên qua Header `Authorization: Bearer <Token>`.
    - Khôi phục và làm sạch endpoint `/api/v1/student/mastery/history` trong [routes.py](file:///d:/Project/Vin_AI/000%20Group%20Project/C2-App-125/src/api/routes.py).
  - **Frontend & Zustand Store:**
    - Cập nhật [createUserSlice.ts](file:///d:/Project/Vin_AI/000%20Group%20Project/C2-App-125/frontend/stores/createUserSlice.ts) hỗ trợ lưu trữ trạng thái `token` (JWT).
    - Refactor [LoginScreen.tsx](file:///d:/Project/Vin_AI/000%20Group%20Project/C2-App-125/frontend/components/LoginScreen.tsx) và [login/page.tsx](file:///d:/Project/Vin_AI/000%20Group%20Project/C2-App-125/frontend/app/login/page.tsx) hỗ trợ đăng nhập/đăng ký bằng Email & Mật khẩu. Khi đăng ký mới, hỗ trợ nhập Họ tên và MSSV để đồng bộ xuống `app.users` và gán role học viên.
    - Tích hợp truyền token qua Authorization header cho toàn bộ các API call trong [createPracticeSlice.ts](file:///d:/Project/Vin_AI/000%20Group%20Project/C2-App-125/frontend/stores/createPracticeSlice.ts), [ZpdWidget.tsx](file:///d:/Project/Vin_AI/000%20Group%20Project/C2-App-125/frontend/components/dashboard/ZpdWidget.tsx), [useSocraticSidebar.ts](file:///d:/Project/Vin_AI/000%20Group%20Project/C2-App-125/frontend/app/hooks/useSocraticSidebar.ts), và [stream.ts](file:///d:/Project/Vin_AI/000%20Group%20Project/C2-App-125/frontend/lib/chat/stream.ts).

- **Validation:**
  - **Automated Tests:** Toàn bộ test suite chạy thành công qua lệnh `pytest` (25 passed, 2 skipped, 2 warnings).
  - **Manual Verification:** Học sinh Nguyễn Văn Thực Chiến đăng nhập thành công bằng email `2a202600001@edugap.vn` và mật khẩu `123456`, hệ thống nhận diện đúng UUID, khôi phục Elo và tiến trình học tập cũ hoàn hảo. Các tài khoản Mentor/Admin cũng đăng nhập và phân quyền chính xác qua Email/Password Auth.

---

## 2026-06-27 — Thiết lập ranh giới phân quyền RBAC & Triển khai Ingestion/Audit log thực tế

- **Why:**
  - **Thiếu ranh giới phân quyền (RBAC Boundary):** Hệ thống ban đầu chưa thiết lập phân định rõ quyền truy cập cho các API. Học viên (`student`) có thể đọc/ghi dữ liệu của học viên khác, hoặc tự ý gọi các API nhạy cảm của hệ thống.
  - **Ingestion & Audit endpoints chỉ là placeholder:** Các chức năng nạp slides tài liệu (`POST /api/v1/ingest/slides`) và truy xuất dữ liệu audit (`GET /api/v1/audit/decisions`, `GET /api/v1/audit/rewards`) trước đây chưa chạy thật, cần tích hợp vào ranh giới bảo vệ của RBAC để chỉ định các nhóm vai trò phù hợp truy cập.

- **Chi tiết phân quyền RBAC hiện tại (Current RBAC Specifications):**
  - **Student (Học viên):**
    - Chỉ được phép thao tác và truy xuất dữ liệu của chính mình.
    - Được phép gọi `/chat` (POST), nhưng bắt buộc `request.student_id == user.id`. Nếu không trùng khớp, hệ thống sẽ trả về lỗi `403 Forbidden` (ngăn chặn hành vi giả mạo hoặc xem trộm hội thoại của người khác).
    - Chỉ được xem lịch sử năng lực của chính mình tại `/student/mastery/history` (GET). Nếu tham số `student_id` khác với UUID trong token JWT, trả về lỗi `403 Forbidden`.
    - Khi báo cáo lỗi câu hỏi tại `/quiz/report` (POST), ID của học sinh (`student_id`) sẽ được tự động ghi đè bằng UUID từ token, ngăn chặn việc giả mạo danh tính báo cáo lỗi.
    - **Không được phép** truy cập các API nạp slide và hệ thống audit logs.
  - **Mentor (Giảng viên/Người hướng dẫn):**
    - Được quyền xem lịch sử năng lực học tập của bất kỳ học viên nào qua `/student/mastery/history` để hỗ trợ giảng dạy.
    - Được phép kích hoạt luồng nạp slides/tài liệu PDF chạy nền qua `/api/v1/ingest/slides` (POST).
    - **Không được phép** truy cập và đọc audit logs nhạy cảm của thuật toán.
  - **Admin (Ban tổ chức) & Dev (Nhà phát triển):**
    - Có toàn bộ đặc quyền của Mentor.
    - Được quyền truy cập hệ thống audit logs nhạy cảm để kiểm toán và tinh chỉnh mô hình:
      - `GET /api/v1/audit/decisions`: Lấy lịch sử quyết định gợi ý câu hỏi của thuật toán thích ứng (LinUCB) bao gồm snapshot năng lực, expected reward, expected success.
      - `GET /api/v1/audit/rewards`: Lấy danh sách log phần thưởng bandit trả về từ lượt trả lời bài của học sinh để tối ưu hóa thuật toán.

- **What changed:**
  - **Xây dựng Lớp Phân Quyền Tập Trung:**
    - Tạo model `AuthenticatedUser` và class callable `RoleChecker` trong [adaptive_routes.py](file:///d:/Project/Vin_AI/000%20Group%20Project/C2-App-125/src/api/adaptive_routes.py).
    - Viết dependency `get_current_user` parse token từ header `Authorization: Bearer <JWT>` để truy vấn đối chiếu bảng `app.user_roles` và `app.roles` nhằm xác định vai trò của user.
    - Viết hàm helper `require_role(allowed_roles: list[str])` trả về instance của `RoleChecker` để bảo vệ các route.
    - Refactor `get_current_student_id` và `require_teacher` kế thừa trực tiếp từ logic `get_current_user`.
  - **Áp dụng Route Guards:**
    - Cập nhật `/chat`, `/student/mastery/history`, và `/quiz/report` trong [routes.py](file:///d:/Project/Vin_AI/000%20Group%20Project/C2-App-125/src/api/routes.py) đính kèm dependency `Depends(get_current_user)` và áp dụng kiểm tra chéo ID.
  - **Triển khai Ingestion & Audit Endpoints:**
    - Triển khai endpoint nạp slide chạy nền `POST /api/v1/ingest/slides` bảo vệ bằng `Depends(require_role(["mentor", "admin", "dev"]))` sử dụng FastAPI `BackgroundTasks`.
    - Triển khai hai endpoints audit log `GET /api/v1/audit/decisions` và `GET /api/v1/audit/rewards` bảo vệ bằng `Depends(require_role(["admin", "dev"]))`.
    - Refactor `ingest_slides()` trong [rag_ingestion.py](file:///d:/Project/Vin_AI/000%20Group%20Project/C2-App-125/src/pipeline/ingest/rag_ingestion.py) ném ngoại lệ thay vì gọi `sys.exit(1)` làm sập server FastAPI.
  - **Unit Testing Suite (`test_rbac.py`):**
    - Tạo tệp test mới [test_rbac.py](file:///d:/Project/Vin_AI/000%20Group%20Project/C2-App-125/tests/test_api/test_rbac.py) kiểm thử tự động toàn bộ ranh giới phân quyền trên (bọc mock cho `ingest_slides` để chạy độc lập không phụ thuộc môi trường).
    - Cập nhật các test cũ trong `test_routes.py`, `test_chat_stream.py`, và `test_adaptive_bitemporal.py` đính kèm mock tokens để chạy tương thích.
  - **Sửa cảnh báo ESLint Frontend:**
    - Khắc phục 3 cảnh báo mảng phụ thuộc (`react-hooks/exhaustive-deps`) ở Frontend.
    - Trong [useSocraticSidebar.ts](file:///d:/Project/Vin_AI/000%20Group%20Project/C2-App-125/frontend/app/hooks/useSocraticSidebar.ts): Thêm `token`, `userId` vào dependency array của `useCallback` (`triggerWrongAnswerSuggestion` và `handleSendQuizSidebarMessage`) tránh lỗi đóng băng token cũ.
    - Trong [ZpdWidget.tsx](file:///d:/Project/Vin_AI/000%20Group%20Project/C2-App-125/frontend/components/dashboard/ZpdWidget.tsx): Bọc hàm `fetchRecommendation` bằng `useCallback` và bổ sung nó vào dependencies của `useEffect` để cố định tham chiếu hàm, loại bỏ warning mà không gây vòng lặp render vô hạn.

- **Validation:**
  - **Automated Tests:** Toàn bộ test suite chạy thành công qua lệnh `pytest` (76 passed, 2 skipped, 2 warnings - hoàn toàn xanh).
  - **Manual Verification:** Mô phỏng thành công các request nạp slide, đọc audit log và truy xuất lịch sử chéo; hệ thống phản hồi chính xác mã 200, 202, 401 hoặc 403 tùy theo vai trò tương ứng.
  - **Frontend Build & Linter:** Chạy `pnpm run lint` đạt kết quả xanh tuyệt đối (0 warnings, 0 errors). Chạy `pnpm run build` đóng gói dự án Next.js thành công 100% không phát sinh lỗi.

---

## 2026-06-28 — Khắc phục lỗi phân quyền API /sync-mastery & Đồng bộ tiến trình học tập thích ứng

- **Why:**
  - **Lỗi 403 Forbidden chặn lưu tiến trình:** Học sinh khi hoàn thành bài tập tự luyện gửi yêu cầu đồng bộ Elo/BKT qua `POST /api/v1/adaptive/sync-mastery` nhưng bị hệ thống trả về lỗi 403 vì endpoint này trước đây chỉ cho phép vai trò giảng viên (`require_teacher`). Do đó, điểm số năng lực thực tế chưa bao giờ được lưu xuống database.
  - **Mất tiến trình khi F5/Reset:** Khi học viên tải lại trang, frontend gọi `GET /api/v1/adaptive/mastery` để đồng bộ dữ liệu. Vì database rỗng, server trả về `[]`, frontend ghi đè giá trị rỗng này lên Zustand store cục bộ và làm mất hoàn toàn tiến trình vừa làm.
  - **Hạn chế của Giảng viên khi xem năng lực:** Endpoint `/mastery` trước đây chặn cứng nếu `student_id != auth_student_id` khiến các vai trò giảng viên/quản trị viên cũng bị lỗi 403 khi vào xem biểu đồ năng lực của học viên.

- **What changed:**
  - **Backend API (FastAPI Auth):**
    - Refactor 4 endpoints: `/sync-mastery`, `/mastery`, `/recommend`, và `/submit` trong [adaptive_routes.py](file:///d:/Project/Vin_AI/000%20Group%20Project/C2-App-125/src/api/adaptive_routes.py) sử dụng `Depends(get_current_user)` thay vì `require_teacher` hoặc `get_current_student_id`.
    - Bổ sung logic kiểm tra chéo: Nếu vai trò của người gọi là `student`, hệ thống bắt buộc kiểm tra chéo ID người dùng (`request.student_id == user.id` hoặc `student_id == user.id`) để ngăn chặn học sinh truy cập trái phép dữ liệu của người khác. Các vai trò `mentor`/`admin`/`dev` được phép bỏ qua kiểm tra chéo để mô phỏng/kiểm tra chéo cho học viên.

- **Validation:**
  - **Database Verification:** Truy vấn thông tin học viên đã ẩn danh trước khi sửa: CSDL rỗng. Sau khi sửa và làm bài tập lại trên giao diện, database đã ghi nhận thành công 2 bản ghi năng lực (`day1-basics` và `day1-tokenization` với 9 attempts, 6 corrects, BKT 0.94 - `mastered`). Khi reload trang, tiến trình hiển thị đầy đủ và ổn định.
  - **Automated Tests:** Chạy `pytest` thành công vượt qua các tests của API và RBAC.

---

## 2026-07-03 — Triển khai bộ lọc set_id giới hạn theo Day 16+ trong chế độ Luyện tập thích ứng (Adaptive)

- **Why:**
  - **Lỗi hiển thị nhầm câu hỏi ở chế độ Adaptive:** Khi học sinh làm bài ở chế độ Luyện tập thích ứng (Adaptive) của các Track từ Day 16 trở đi, do các đề Basics, Pipeline và Advanced trong cùng một Track chia sẻ chung một Concept ID duy nhất, thuật toán LinUCB sẽ đề xuất câu hỏi dựa trên Elo/BKT hiện tại của học viên. Nếu Elo chưa đủ cao, hệ thống tự động đẩy các câu Basics lên trước, khiến học viên click vào mục Advanced nhưng màn hình lại hiển thị câu Basics.
  - **Giới hạn phạm vi ảnh hưởng:** Theo yêu cầu, bộ lọc này chỉ cần giới hạn chặt chẽ cho các bài quiz từ Day 16 trở về sau. Với các ngày học cũ (Day 1 - Day 15), hệ thống vẫn giữ cơ chế thích ứng tự do chéo giữa các mức độ khó để đảm bảo tính mềm dẻo.

- **What changed:**
  - **Database Migration (`scripts/migrate_quizzes.py`):** Cập nhật cấu trúc `answer_key` cho cả MCQ và Short Answer để đính kèm trường `"set_id"` chứa mã đề thi tương ứng (ví dụ `"day22-t3-advanced"`). Chạy lại script di trú thành công, cập nhật thông tin mã đề cho toàn bộ 1210 câu hỏi trong database.
  - **Backend FastAPI API & Route (`src/models/adaptive_schemas.py` & `src/api/adaptive_routes.py`):**
    - Cập nhật Pydantic schema `RecommendRequest` nhận thêm trường `set_id` tùy chọn.
    - Viết hàm helper `is_day_16_or_later(set_id)` sử dụng Regex kiểm tra xem mã đề có thuộc từ Day 16 trở đi hay không.
    - Cập nhật route `/recommend` thực hiện lọc candidates theo `set_id` nếu nhận được tham số này và mã đề thuộc từ Day 16 trở đi.
  - **Database Adapter (`src/services/adaptive/supabase_database.py`):**
    - Cập nhật phương thức `get_candidate_questions_meta` để tải bổ sung thuộc tính `answer_key` từ cơ sở dữ liệu Supabase, phục vụ việc đối chiếu `set_id` của câu hỏi.
  - **Frontend Next.js Client & Hooks (`frontend/lib/adaptive/api-client.ts` & `frontend/app/hooks/useQuizSession.ts`):**
    - Thêm `setId` vào interface `RecommendParams` và truyền trong body của POST request gửi tới backend `/recommend` làm `set_id`.
    - Chuyển tiếp trực tiếp tham số `setId` từ React Hook `recommendWithConceptFallback` xuống API.

- **Validation:**
  - **Migration validation:** Chạy script Python `migrate_quizzes.py` hoàn thành đồng bộ thông tin `set_id` cho 1210 câu hỏi lên CSDL Dev thành công.
  - **Automated Tests:** Chạy `pytest tests/test_api/test_adaptive.py` thành công vượt qua toàn bộ 18/18 test cases.
  - **Code Quality:** Chạy `ruff format` và `ruff check --fix` để định dạng lại code đạt chuẩn, không có lỗi linting nào tồn tại.

---

## 2026-07-07 — Thiết lập phân tách môi trường deploy Staging & Production và xử lý crash server Staging

- **Why:**
  - **Trùng lặp webhook deploy:** Trước đây, mỗi lần đẩy code lên bất kỳ nhánh nào (bao gồm cả `dev`/test), GitHub Actions đều tự động kích hoạt webhook deploy của Render và đẩy trực tiếp lên Product backend service (`c2-app-backend`). Điều này dẫn đến sự mất đồng bộ và làm gián đoạn hệ thống đang chạy ổn định của người dùng thực tế.
  - **Tự động đẩy giao diện lên Production:** Workflow Frontend cũ cấu hình `vercel deploy --prod` cho tất cả các nhánh, khiến mã nguồn nhánh `dev` khi build xong lập tức được promote làm Production Domain, ghi đè lên giao diện chính.
  - **Server Staging bị crash lúc khởi động:** Khi tạo môi trường Staging riêng biệt trên Render với biến `APP_ENV=staging`, Backend FastAPI bị crash ngay lập tức do thư viện Pydantic validation trong `src/config.py` chặn cứng, chỉ cho phép `app_env` nhận một trong ba giá trị: `development`, `production`, hoặc `test`.

- **What changed:**
  - **Cấu hình thủ công trên Dashboards:**
    - **Tạo Web Service Staging trên Render:** Đăng nhập Render, tạo một Web Service mới đặt tên là `c2-app-backend-staging` liên kết với repo Git hiện tại, cấu hình chỉ định nhánh deploy tự động là `dev`.
    - **Cấu hình biến môi trường Staging:** Thiết lập các biến môi trường cho Staging tương tự Production, trong đó cấu hình biến `APP_ENV` thành `staging` và đổi chuỗi kết nối Database trỏ tới database staging tương ứng. Sao chép link Deploy Webhook của Web Service này.
    - **Cấu hình Secrets trên GitHub:** Truy cập cài đặt kho chứa (Settings -> Secrets and variables -> Actions) trên GitHub repo, thêm một repository secret mới tên là `RENDER_DEPLOY_HOOK_URL_STAGING` chứa link Deploy Webhook Staging vừa lấy từ Render.
    - **Thiết lập Domain Preview cố định trên Vercel:** Truy cập Project Settings -> Domains trên Vercel, cấu hình add thêm một domain phụ để làm Staging URL (ví dụ `edugap-staging.vercel.app`) và chọn gán cứng domain này trỏ về nhánh `dev`.
  - **Backend CI/CD Workflows ([ci-backend.yml](file:///d:/Project/Vin_AI/000%20Group%20Project/C2-App-125/.github/workflows/ci-backend.yml)):**
    - Phân tách bước `Trigger Render CD Deployment` thành hai công việc độc lập:
      - `Trigger Render Production CD`: Chỉ kích hoạt khi push vào nhánh `main` (Production).
      - `Trigger Render Staging CD`: Chỉ kích hoạt khi push vào nhánh `dev` hoặc test, sử dụng webhook staging riêng biệt (`secrets.RENDER_DEPLOY_HOOK_URL_STAGING`).
  - **Frontend CI/CD Workflows ([ci-frontend.yml](file:///d:/Project/Vin_AI/000%20Group%20Project/C2-App-125/.github/workflows/ci-frontend.yml)):**
    - Loại bỏ nhánh `dev` và các nhánh test khỏi danh sách chạy tham số `--prod` trong bước `Set Deployment Environment`. Nhờ đó, nhánh `dev` sẽ được Vercel build dưới dạng Preview Deployment với tên miền ổn định làm môi trường Staging thay vì đè lên tên miền chính.
  - **Backend Configuration ([src/config.py](file:///d:/Project/Vin_AI/000%20Group%20Project/C2-App-125/src/config.py)):**
    - Cập nhật định nghĩa thuộc tính `app_env` của lớp `Settings` (Pydantic model) từ `Literal["development", "production", "test"]` thành `Literal["development", "production", "staging", "test"]` để hỗ trợ môi trường `APP_ENV=staging`.

- **Validation:**
  - **Commit & Push Thực tế:** Commit và đẩy thành công các thay đổi lên nhánh `dev` bằng commit message: `ci(cicd): separate staging and production deployment environments` (mã commit: `f10fe2b`).
  - **CI/CD Pipeline & Deploy Success:**
    - GitHub Actions chạy thành công 100% phần test/lint và kích hoạt đúng webhook staging của Render.
    - Bản build Staging Backend trên Render khởi động thành công mượt mà, ghi nhận log kết nối Supabase chính xác và không còn bị crash bởi lỗi Pydantic validation.
    - Bản build Frontend của nhánh `dev` trên Vercel hoàn thành, tạo ra Preview URL ổn định thành công.

- **Follow-up:**
  - Thêm tên miền staging mong muốn vào mục cài đặt của Vercel (nếu được cấp quyền hoặc liên hệ Admin) và cấu hình liên kết với nhánh `dev` để đảm bảo tên miền hiển thị ngắn gọn, dễ nhớ.
  - Cập nhật biến môi trường `CORS_ORIGINS` trên Render Staging trùng khớp với Preview URL của Frontend nhánh `dev` để đảm bảo kết nối API thông suốt.

---

## 2026-07-18 — Triển khai Hệ thống Quản lý Đề thi thích ứng (Adaptive Exam Management) và Cập nhật Bối cảnh Dự án SSoT

- **Why:**
  - **Hệ thống kỳ thi chính thức (Exam Sets) chưa được thiết lập:** Hệ thống cần hỗ trợ thi giữa kỳ và cuối kỳ chính thức cho học sinh (Toán lớp 6), thay vì chỉ có các câu hỏi luyện tập nhỏ lẻ (quiz). Bộ đề thi cần có thời gian làm bài, cấu trúc câu hỏi, tính điểm tập trung và không rò rỉ đáp án/giải thích trước khi học sinh hoàn thành nộp bài.
  - **Tích hợp kiểm tra khoảng trống kiến thức (Gap Detection) & Cập nhật thích ứng (Elo/BKT):** Kết quả bài thi cần tự động tính toán lại năng lực học sinh qua Elo/BKT cho tất cả các concept liên quan đến câu hỏi trong đề, đồng thời phát hiện ra các "khoảng trống kiến thức" (weak concepts) để gợi ý lộ trình tự học và luyện tập cải thiện.
  - **Đồng bộ tài liệu bối cảnh dự án (SSoT):** File `PROJECT-CONTEXT.md` cần được cập nhật cấu trúc mới phù hợp với định hướng EduGap (Toán lớp 6), làm rõ vai trò Student/Mentor, Sapia Design System và sơ đồ luồng hoạt động (Mermaid) cập nhật.

- **What changed:**
  - **Cơ sở dữ liệu (Database Migration):**
    - Thiết lập tệp migration SQL [20260718_exam_sets_schema.sql](file:///d:/Project/Hackathon/AI%20Innovation/AI20kekeke/db/supabase/migrations/20260718_exam_sets_schema.sql) tạo các bảng:
      - `app.exam_sets`: Quản lý tiêu đề, mã đề, thời gian làm bài (`duration_minutes`), loại đề (`midterm`/`final`), trạng thái (`draft`/`published`), điểm tối đa.
      - `app.exam_questions`: Liên kết câu hỏi (`app.questions`) vào bộ đề thi với thứ tự sắp xếp (`sort_order`) và trọng số điểm (`weight`).
      - `app.exam_attempts`: Lưu lịch sử làm bài thi của học sinh, điểm số cuối cùng (`final_score`), thời gian bắt đầu, nộp bài.
    - Cập nhật hàm RPC PostgreSQL `app.submit_attempt_v3` để hỗ trợ tính điểm và cập nhật năng lực thích ứng tự động (Elo, BKT) sau khi nộp bài thi, đồng thời ghi nhận kết quả và phát hiện khoảng trống kiến thức.
  - **Backend API (FastAPI routes & schemas):**
    - Tạo [exam_schemas.py](file:///d:/Project/Hackathon/AI%20Innovation/AI20kekeke/src/models/exam_schemas.py) định nghĩa các Pydantic schema cho bộ đề thi, câu hỏi thi (ẩn đáp án đúng đối với học sinh), yêu cầu nộp bài, và cấu trúc kết quả thi.
    - Phát triển router API [exam_routes.py](file:///d:/Project/Hackathon/AI%20Innovation/AI20kekeke/src/api/exam_routes.py) (gắn vào `/api/v1/exams`) cung cấp các endpoints:
      - `GET /api/v1/exams`: Lấy danh sách đề thi đã công bố (published) cho học sinh hoặc toàn bộ cho mentor/admin.
      - `GET /api/v1/exams/{exam_set_id}`: Chi tiết đề thi và danh sách câu hỏi (ẩn đáp án/giải thích để chống gian lận).
      - `POST /api/v1/exams/{exam_set_id}/start`: Bắt đầu một lượt làm bài thi (tạo bản ghi `exam_attempts` mới).
      - `POST /api/v1/exams/attempts/{attempt_id}/submit`: Nộp bài thi, chấm điểm tự động các câu trắc nghiệm MCQ, cập nhật Elo/BKT qua thuật toán thích ứng, phát hiện các weak concepts và trả về kết quả bài thi.
      - `GET /api/v1/exams/attempts/{attempt_id}/result`: Lấy lại kết quả bài thi chi tiết (bao gồm cả đáp án đúng và giải thích sau khi đã nộp).
    - Đấu nối router thi cử vào FastAPI chính tại `src/main.py`.
  - **Dữ liệu mẫu & Seed Script (`seed_exams.py`):**
    - Viết [seed_exams.py](file:///d:/Project/Hackathon/AI%20Innovation/AI20kekeke/scripts/seed_exams.py) để tự động nạp dữ liệu đề thi tĩnh (midterm/final) mẫu vào Supabase DB với đầy đủ câu hỏi trắc nghiệm Toán lớp 6 và gán concept tương ứng.
  - **Frontend Next.js Database API Client:**
    - Cập nhật [database.ts](file:///d:/Project/Hackathon/AI%20Innovation/AI20kekeke/frontend/lib/adaptive/database.ts) thêm các phương thức client gọi API backend phục vụ việc truy vấn đề thi, bắt đầu thi, nộp bài thi và lấy kết quả thi thích ứng.
  - **Tài liệu dự án SSoT:**
    - Cập nhật [PROJECT-CONTEXT.md](file:///d:/Project/Hackathon/AI%20Innovation/AI20kekeke/PROJECT-CONTEXT.md) đồng bộ cấu trúc mới với trọng tâm Toán lớp 6, các vai trò Student/Mentor, Sapia Design System và sơ đồ luồng hoạt động (Mermaid) cập nhật.

- **Validation:**
  - **Automated Tests:** Viết và chạy bộ kiểm thử tự động [test_exams.py](file:///d:/Project/Hackathon/AI%20Innovation/AI20kekeke/tests/test_api/test_exams.py) chạy mượt mà 5/5 cases kiểm định toàn bộ luồng từ lấy danh sách đề, lấy chi tiết, bắt đầu thi, nộp bài thi đến xem kết quả.
  - **Local Validation:** Chạy toàn bộ test suite cục bộ thông qua `pytest` đều vượt qua thành công (100% Passed).

- **Follow-up:**
  - Thiết kế và triển khai giao diện làm bài thi (Exam Screen) và trang kết quả thi (Exam Result Dashboard) ở Frontend Next.js theo đúng Sapia Design System (3D click, Cozy Avocado `#f4fce8`).
  - Đấu nối Integration tests và chạy thử nghiệm luồng đề xuất lộ trình tự học từ LLM và Evaluation Agent sau khi có kết quả weak concepts từ bài thi.

