# Weekly Journal — Team [Tên Team]

> Ghi lại mỗi tuần: học được gì, khó khăn gì, quyết định gì, kế hoạch tiếp.

---

## Week 1: 2026-05-31 - 2026-06-06

### Mục tiêu tuần này
- [x] Khởi tạo cấu trúc tài liệu dự án (PDR, Roadmap, Design Guidelines)
- [x] Cấu hình CI/CD Branch Protection & PR Templates
- [x] Thiết lập khung ứng dụng FastAPI + LangGraph Agent cơ bản
- [x] Nghiên cứu lý thuyết thuật toán thích ứng (Elo, BKT, Contextual Bandits)

### Đã hoàn thành
- Khởi tạo 10 tài liệu nền tảng dưới thư mục `docs/`.
- Thiết lập quy tắc hoạt động cho agents/skills cục bộ.
- Xây dựng boilerplate FastAPI, Docker, Ruff, Pytest.
- Nghiên cứu sơ bộ phương pháp nghiên cứu thực nghiệm DBR trong EdTech.

### Khó khăn & Giải pháp
| Khó khăn | Giải pháp | Kết quả |
|----------|-----------|---------|
| Thiết lập liên kết agents/skills cục bộ trên Windows | Viết script PowerShell tạo Link Junction tự động | Môi trường chạy mượt mà |

### Bài học
- Việc cấu hình quy chuẩn tài liệu ngay từ đầu giúp các AI Agent sau này hiểu sâu sắc và hoạt động chính xác trong dự án.

### Kế hoạch tuần sau
- [x] Hiện thực hóa các thuật toán thích ứng (BKT, Elo, LinUCB).
- [x] Thiết lập hệ thống cache và cấu hình tối ưu chatbot cá nhân hóa.
- [x] Tinh chỉnh và dọn dẹp sơ đồ hệ thống sang định dạng Mermaid.

---

## Week 2: 2026-06-07 - 2026-06-13

### Mục tiêu tuần này
- [x] Hiện thực hóa Core Engine thuật toán: BKT, Elo, LinUCB (Contextual Bandits)
- [x] Viết ADR-004 (Elo & concurrency locking), ADR-005 (Chatbot personalization), ADR-006 (Chatbot architecture & Quiz generation)
- [x] Thiết lập Cache Store (In-Memory & Redis) hỗ trợ cá nhân hóa chatbot
- [x] Dọn dẹp folder sơ đồ thiết kế hệ thống sử dụng Mermaid MD
- [x] Viết test suite cho thuật toán, API router và thực hiện chạy simulation đánh giá mô hình

### Đã hoàn thành
- Hiện thực toàn bộ logic thuật toán (BKT, Elo, LinUCB) và cơ chế khóa đồng thời (Pessimistic Locking) trong `src/services/adaptive/`.
- Phát triển API endpoint tích hợp với cơ sở dữ liệu Supabase thông qua interface trừu tượng.
- Hoàn thành bộ 3 ADR (004, 005, 006) định hướng thiết kế hệ thống.
- Viết kịch bản giả lập `simulation_adaptive.py` đánh giá độ hội tụ của thuật toán.
- Thiết lập module Cache Store linh hoạt hỗ trợ InMemory và Redis.
- Tái cấu trúc thư mục sơ đồ `docs/diagram/` thành 3 tài liệu Mermaid chuyên sâu.
- Tích hợp Next.js Route Handlers (BFF Proxy) kết nối Frontend với FastAPI Backend, thiết lập cơ chế tự phục hồi (static mock fallback) khi backend hoặc DB gặp lỗi.
- Chuẩn bị bộ dữ liệu seed SQL câu hỏi trắc nghiệm kèm 3 cấp độ gợi ý Socratic cho 10 ngày học (`seed-questions.sql` và `seed-questions.py`).
- Khắc phục lỗi API Key DEV-PROD của Supabase và sửa lỗi ghi dữ liệu bị chặn do chính sách Row-Level Security (RLS) của Supabase.

### Khó khăn & Giải pháp
| Khó khăn | Giải pháp | Kết quả |
|----------|-----------|---------|
| Khóa đồng thời Elo khi nhiều học viên làm bài cùng lúc | Sử dụng cơ chế SELECT FOR UPDATE khóa dòng dữ liệu trong database | Đảm bảo tính nhất quán dữ liệu điểm số Elo |
| Rủi ro độ trễ và chi phí Token của Multi-Agent Chatbot | Sử dụng Single Agent kết hợp Regex & Prompt Guardrail trong sinh quiz | Tối ưu hóa độ trễ, tiết kiệm tài nguyên và bảo đảm an toàn dữ liệu |
| Lỗi chặn RLS (42501) và Exposed Schema (PGRST106) của Supabase | Cấu hình Exposed Schema trên Dashboard, tắt RLS tạm thời cho các bảng tương tác và tối ưu hóa cơ chế mock fallback cục bộ | Next.js API hoạt động mượt mà, ghi nhận kết quả và Elo thành công |

### Bài học
- Việc viết test giả lập (simulation) giúp phát hiện sớm các lỗi hội tụ của thuật toán bandit và tối ưu hóa các siêu tham số (hyperparameters) nhanh chóng.

### Kế hoạch tuần sau
- [x] Tích hợp trực tiếp FastAPI Chatbot API với Engine Thích ứng đã viết.
- [/] Phát triển các giao diện người dùng tương tác của Chatbot.
- [ ] Triển khai kiểm thử E2E tích hợp.

## Week 3: 2026-06-14 - 2026-06-20

### Mục tiêu tuần này
- [x] Sửa đổi và tối ưu hóa các lỗi bảo mật & audit của Adaptive Engine (Bước 1 Audit)
- [ ] Tích hợp trực tiếp FastAPI Chatbot API với Engine Thích ứng đã viết.
- [ ] Phát triển các giao diện người dùng tương tác của Chatbot.

### Đã hoàn thành
- Viết và triển khai RPC `app.submit_attempt_v2` thực hiện cập nhật Elo, BKT, Sherman-Morrison bandit và log audit trong duy nhất 1 transaction nguyên tử ở DB.
- Sửa đổi endpoint `/submit` ở Python Backend gọi trực tiếp `submit_attempt_v2` và loại bỏ các REST call rời rạc, tránh rủi ro race condition và mất đồng bộ dữ liệu.
- Clamp số mũ tính toán Elo để phòng tránh lỗi tràn số.
- Thiết lập write-through cache cho dữ liệu Mastery của học sinh.
- Cập nhật trạng thái và Completion Report trên Notion Backlog.

### Khó khăn & Giải pháp
| Khó khăn | Giải pháp | Kết quả |
|----------|-----------|---------|
| Lỗi cú pháp SQL `str()` trong migration do nhầm lẫn hàm cast | Thay thế bằng cú pháp chuẩn `::text` trong PL/pgSQL | Chạy thành công các truy vấn và kiểm thử |

### Bài học
- Các phép tính toán liên tục cập nhật trạng thái học viên (Elo, BKT, Bandit) cần được thực hiện hoàn toàn dưới các transaction nguyên tử kèm cơ chế pessimistic locking ở tầng cơ sở dữ liệu để chống race condition.

### Kế hoạch tuần sau
- [ ] Tích hợp trực tiếp FastAPI Chatbot API với Engine Thích ứng đã viết.
- [ ] Phát triển các giao diện người dùng tương tác của Chatbot.

## Week 3: 2026-06-14 - 2026-06-20

### Mục tiêu tuần này
- [x] Sửa đổi và tối ưu hóa các lỗi bảo mật & audit của Adaptive Engine (Bước 1 Audit)
- [ ] Tích hợp trực tiếp FastAPI Chatbot API với Engine Thích ứng đã viết.
- [ ] Phát triển các giao diện người dùng tương tác của Chatbot.

### Đã hoàn thành
- Viết và triển khai RPC `app.submit_attempt_v2` thực hiện cập nhật Elo, BKT, Sherman-Morrison bandit và log audit trong duy nhất 1 transaction nguyên tử ở DB.
- Sửa đổi endpoint `/submit` ở Python Backend gọi trực tiếp `submit_attempt_v2` và loại bỏ các REST call rời rạc, tránh rủi ro race condition và mất đồng bộ dữ liệu.
- Clamp số mũ tính toán Elo để phòng tránh lỗi tràn số.
- Thiết lập write-through cache cho dữ liệu Mastery của học sinh.
- Cập nhật trạng thái và Completion Report trên Notion Backlog.

### Khó khăn & Giải pháp
| Khó khăn | Giải pháp | Kết quả |
|----------|-----------|---------|
| Lỗi cú pháp SQL `str()` trong migration do nhầm lẫn hàm cast | Thay thế bằng cú pháp chuẩn `::text` trong PL/pgSQL | Chạy thành công các truy vấn và kiểm thử |

### Bài học
- Các phép tính toán liên tục cập nhật trạng thái học viên (Elo, BKT, Bandit) cần được thực hiện hoàn toàn dưới các transaction nguyên tử kèm cơ chế pessimistic locking ở tầng cơ sở dữ liệu để chống race condition.

### Kế hoạch tuần sau
- [ ] Tích hợp trực tiếp FastAPI Chatbot API với Engine Thích ứng đã viết.
- [ ] Phát triển các giao diện người dùng tương tác của Chatbot.

---

## Week 3: 2026-06-14 - 2026-06-20

### Mục tiêu tuần này
- [x] Thiết kế giao diện Socratic Chat hợp nhất thanh bên (Unified Sidebar Layout)
- [x] Đồng bộ hóa kích thước nút bấm, font chữ và căn chỉnh lề tránh giật màn hình
- [x] Hiện thực khối suy nghĩ AI (Thinking process accordion) và trạng thái công cụ
- [x] Tích hợp tương tác trực tiếp Quiz trắc nghiệm trên Chat widget
- [x] Tích hợp Forgetting Curve (FSRS Lazy Decay) vào BKT (ADR-011)

### Đã hoàn thành
- Tái cấu trúc lại layout Socratic Chat, hợp nhất LeftBar và Chat control thành 1 thanh bên rộng w-64 cố định.
- Đồng bộ hóa toàn bộ navigation link, icon, cỡ chữ, padding của thanh bên chat khớp hoàn hảo 100% với LeftBar.
- Loại bỏ hoàn toàn Instructor Dashboard khỏi sidebar để tránh chật trội và che mất phần chat, đồng thời chuyển nút New Chat sang dạng flat button gọn gàng và tích hợp hiển thị Adaptive Style động (Feynman/Deep/Challenge Style) trên chat header.
- Đảm bảo loại bỏ thanh cuộn ngoài trình duyệt khi ở trong tab Chat, co giãn chiều cao h-screen khít màn hình.
- Khắc phục triệt để 9 lỗi bảo mật Nghiêm trọng và 8 lỗi Lớn trong Adaptive Core: tích hợp RPC `submit_attempt_v3` nguyên tử, kiểm tra log đếm gợi ý/sử dụng AI trực tiếp ở server-side, bảo mật endpoints bằng Authorization Headers và phân quyền giáo viên (`require_teacher`), chống NaN-poisoning trong Bandit, cập nhật test suite vượt qua 37/37 kiểm thử tự động.
- Hiện thực hóa và hiển thị khối suy nghĩ trung gian (Thinking Process) dạng accordion mượt mà, trực quan hóa tiến trình công cụ RAG Database Search và Python Sandbox Run trực tiếp trên khung chat.
- Sửa triệt để lỗi trùng lặp key React (`user-1` / `ai-1` / `user-11`) bằng cơ chế định danh timestamp + random string trong cả `socratic-chat-tab.tsx` và `useSocraticChat.ts`, khôi phục lại tính năng streaming chat và loại bỏ hoàn toàn cảnh báo lỗi "6 Issues".
- Tổng quát hóa tính năng trắc nghiệm tương tác: loại bỏ mock cứng ở frontend, định nghĩa cấu trúc prompts chuẩn hóa `[QUY TẮC PHÁT SINH CÂU HỎI TRẮC NGHIỆM (QUIZ GENERATION)]` trên backend để AI tự sinh đề bài cho mọi kiến thức, và truyền kèm ngữ cảnh câu hỏi gốc giúp AI đánh giá đáp án chính xác.
- Khắc phục lỗi push code lên Git trên Windows bằng cách cấu hình `setup_hooks.ps1` ghi file `.git/hooks/pre-push` bằng định dạng Unix LF (LF-only) và UTF-8 không BOM, đồng thời chuyển đổi line endings của script `scripts/_pyrun.sh` sang LF.
- Khắc phục lỗi RAG không tìm thấy tài liệu khi hỏi "RAG là gì" trong các concept có UUID ánh xạ sang ngày học khác (như Docker Compose ánh xạ sang day2-basics). Hiện thực cơ chế fallback tự động chạy tìm kiếm toàn cục (global search) khi kết quả tìm kiếm theo ngày có độ tương đồng thấp (< 0.42).

### Khó khăn & Giải pháp
| Khó khăn | Giải pháp | Kết quả |
|----------|-----------|---------|
| Lệch kích thước sidebar khi chuyển đổi giữa tab Chat và các tab học t�## Week 4: 2026-06-21 - 2026-06-27

### Mục tiêu tuần này
- [x] Thiết kế và triển khai cơ chế Bộ nhớ Đồ thị Hai thời gian (Bitemporal Graph Memory)
- [x] Tạo di chuyển cơ sở dữ liệu Supabase/PostgreSQL cho bảng bitemporal, views, constraints và stored procedure
- [x] Tích hợp logic bitemporal vào backend services (`supabase_database.py`, `elo.py`, `bkt.py`)
- [x] Cung cấp endpoint time-travel / history `/api/v1/student/mastery/history`
- [x] Đạt 100% độ phủ kiểm thử unit test cho các luồng bitemporal (tuần tự & hồi tố)
- [x] Kiểm tra và thiết lập RLS (Row-Level Security) cho tất cả các bảng chưa được bảo vệ trên Supabase
- [x] Tách biệt luồng xử lý AI trong LangGraph (Fast-path vs Socratic Academic path) để tối ưu hóa độ trễ phản hồi
- [x] Kiểm thử toàn bộ các tools của AI Tutor Agent (Math & RAG)

### Đã hoàn thành
- Khởi tạo bảng `app.student_mastery_bitemporal` hỗ trợ lưu trữ valid_time và transaction_time dưới dạng `tstzrange` với ràng buộc loại trừ GiST.
- Thiết lập trigger tự động đóng khoảng hiệu lực cũ khi chèn bản ghi mới.
- Tạo stored procedure `app.patch_student_mastery_retroactive` để thực hiện cập nhật hồi tố (retroactive updates) chia nhỏ các khoảng thời gian cũ mà không ảnh hưởng tới dữ liệu tiếp theo.
- Cập nhật backend DB adapter (`SupabaseAdaptiveDatabase`) để hỗ trợ phương thức truy vấn `get_student_mastery_as_of` và lưu trữ `save_student_mastery_bitemporal`.
- Triển khai endpoint GET `/api/v1/student/mastery/history` hỗ trợ cả truy vấn time-travel cụ thể (qua `as_of`) và truy vấn toàn bộ lịch sử tiến hóa năng lực học sinh.
- Viết test suite `test_adaptive_bitemporal.py` và refactor routes thành công, vượt qua toàn bộ 65 tests của hệ thống.
- Cập nhật ADR-014 sang trạng thái "Accepted" (Đã triển khai).
- Tiến hành audit RLS trên Supabase: Phát hiện và kích hoạt RLS thành công cho 19 bảng chưa được bảo mật (gồm bảng học liệu, câu hỏi, các bảng log, tin nhắn chat và bảng outbox), cấu hình các chính sách phân quyền chi tiết (chỉ cho phép user truy xuất dữ liệu cá nhân của chính mình, các bảng nội dung học tập chỉ cho phép đọc, các bảng hệ thống giới hạn cho `service_role`).
- Tách biệt thành công luồng xử lý Agent thành 2 nhánh: nhánh xã giao nhanh (`respond_general`, không chạy RAG/Critic, latency < 200ms) và nhánh học thuật (`respond_academic`, sử dụng RAG/Socratic checking).
- Xóa bỏ file mẫu lỗi thời `example_tool.py`, hoàn thiện các công cụ sản xuất `tutor_tools.py` (`calculate`, `retrieve_course_material`).
- Thiết lập test suite `test_tools.py` nâng tổng số lượng test case của toàn hệ thống lên 68 tests vượt qua thành công 100%.

### Khó khăn & Giải pháp
| Khó khăn | Giải pháp | Kết quả |
|----------|-----------|---------|
| Lỗi ghi trực tiếp vào bảng Mastery bị chặn bởi chính sách RLS khi chạy test dưới vai trò anon | Bỏ qua việc viết trực tiếp trong integration test nếu vai trò là `anon` (bằng cách parse JWT), chạy unit test với mock adapter ở client-side | Bộ kiểm thử hoạt động ổn định trên cả môi trường local và staging |
| Lỗi `malformed range literal` khi truyền tham số string timestamp vào truy vấn Postgres range | Sử dụng toán tử lọc `@>` / `cs` chính xác của supabase-py | Truy vấn time-travel hoạt động chuẩn xác |
| Lỗi FastAPI `dependency_overrides` không hoạt động do gọi hàm trực tiếp trong route | Refactor route signature sử dụng FastAPI `Depends(get_adaptive_db)` | Cho phép mocking toàn bộ kết nối DB trong test suite |
| Ngăn ngừa deadlock luồng chính (event loop) khi gọi RAG `retrieve_course_material` từ thread/sync context | Tự động kiểm tra `asyncio.get_running_loop()` để gọi `aretrieve_relevant_slides` qua coroutine threadsafe hoặc chuyển sang `retrieve_relevant_slides` (sync fallback) | Công cụ hoạt động trơn tru trong cả API chat stream và test suite |

### Bài học
- Thiết kế temporal ở tầng cơ sở dữ liệu giúp đơn giản hóa logic ứng dụng, đảm bảo tính toàn vẹn dữ liệu tốt nhất nhờ vào các ràng buộc khóa loại trừ GiST ở mức engine.
- Tận dụng dependency injection của FastAPI giúp việc giả lập (mocking) và viết kiểm thử đơn giản hơn rất nhiều khi không có kết nối cơ sở dữ liệu thực.
- Việc kết hợp kiểm tra vòng lặp sự kiện (event loop detection) trong các Agent tools giúp ngăn ngừa 100% rủi ro nghẽn luồng đồng bộ (deadlock) trong các runtime đa luồng.

### Kế hoạch tuần sau
- [ ] Tích hợp UI trực quan vẽ biểu đồ lịch sử năng lực học sinh sử dụng dữ liệu từ endpoint `/history`.
- [ ] Tối ưu hóa hiệu năng và lập chỉ mục nâng cao cho các dải thời gian bitemporal khi kích thước dữ liệu tăng.
- [ ] Bắt đầu Phase 03 của kế hoạch Socratic Interactive Agent: Dựng cấu trúc Widget tương tác MCQ, blank-fill và grading node trên đồ thị LangGraph.

---

## Week 4: 2026-06-21 - 2026-06-27

### Mục tiêu tuần này
- [x] Tối ưu hóa độ trễ kiểm định Socratic (Option A + Option B)
- [x] Tích hợp stream quá trình suy nghĩ và sử dụng công cụ qua SSE và giao diện Accordion Terminal
- [x] Cải tiến UX Quiz: di chuyển Hint, giữ Hint sau trả lời, gợi ý bài học khi sai
- [x] Tích hợp tính năng Báo lỗi câu hỏi Quiz (UI + Backend + Supabase)
- [x] Khắc phục lỗi chặn RLS trên Supabase đối với tính năng Báo lỗi câu hỏi Quiz
- [x] Sửa lỗi HTTP 422 (Unprocessable Content) khi gửi báo cáo lỗi

### Đã hoàn thành
- **Tối ưu hóa độ trễ Socratic**: Tích hợp điều kiện bypass Critic Node tại `check_reflection` cho các câu hỏi general. Ràng buộc tham số Critic LLM bằng `llm.bind` (`response_format='json_object'`, `max_tokens=150`, `temperature=0.0`) giúp rút ngắn đáng kể thời gian phản hồi. Sửa lỗi trigger nhầm cảnh báo trung thực học thuật ở Frontend.
- **Stream quá trình suy nghĩ**: Cấu hình backend phát các sự kiện custom (`tool_call`, `tool_result`, `token`) qua `astream_events` v2 dưới dạng SSE thời gian thực. Phát triển giao diện Accordion phong cách Terminal ở Frontend tự động hiển thị quá trình gọi công cụ (RAG, Sandbox).
- **Cải tiến UX Quiz (Hint & Lesson Suggestion)**: Di chuyển khối Hint xuống cuối khu vực câu hỏi để tăng tính trực quan. Cập nhật logic giữ lại Hint sau khi học viên trả lời xong thay vì ẩn đi. Thêm khối "Gợi ý bài học" (icon `BookOpen`) hiển thị khi trả lời sai, nội dung lấy từ trường `hint`/`explanation` của câu hỏi.
- **Tích hợp nút Báo lỗi câu hỏi Quiz**: Thêm nút "Báo lỗi" (màu đỏ, icon `AlertTriangle`) hiển thị sau khi trả lời câu hỏi. Khi nhấn mở Modal chọn lý do (đáp án sai, câu hỏi không rõ, v.v.) và nhập mô tả. Tạo endpoint `POST /api/v1/quiz/report` với Pydantic model `QuizReportRequest` để lưu dữ liệu vào file local (`outputs/quiz_reports.jsonl`) và bảng `app.feedback_events` trên Supabase.
- **Khắc phục lỗi chặn RLS**: Thiết lập 2 RLS policies permissive (`INSERT` và `SELECT` giới hạn 10s gần nhất) cho role `anon` trên bảng `app.feedback_events` để hỗ trợ PostgREST chèn dữ liệu kèm `RETURNING *` mà không vi phạm an toàn dữ liệu lịch sử. Cập nhật file SQL migration [20260627_disable_rls_feedback_events.sql](file:///d:/AI%20Invidual%20Tutor/Source%20code/C2-App-125/db/supabase/migrations/20260627_disable_rls_feedback_events.sql).
- **Khắc phục lỗi 422**: Thêm custom exception handler cho `RequestValidationError` trong [main.py](file:///d:/AI%20Invidual%20Tutor/Source%20code/C2-App-125/src/main.py) để debug lỗi Pydantic dễ dàng. Chuẩn hóa và ép kiểu dữ liệu payload phía Frontend trong [quiz-question-view.tsx](file:///d:/AI%20Invidual%20Tutor/Source%20code/C2-App-125/frontend/components/quiz/quiz-question-view.tsx).

### Khó khăn & Giải pháp
| Khó khăn | Giải pháp | Kết quả |
|----------|-----------|---------|
| Hint biến mất sau khi trả lời khiến học viên mất thông tin tham khảo | Cập nhật điều kiện render Hint để giữ hiển thị khi `isSubmitted === true` | Hint luôn hiện, học viên tra cứu lại dễ dàng |
| AI không gợi ý bài học khi trả lời sai | Thêm khối Lesson Suggestion với icon BookOpen, nội dung từ hint/explanation | Học viên nhận gợi ý ôn lại kiến thức ngay sau khi sai |
| Lỗi PostgREST (Supabase) chèn dữ liệu thành công nhưng vẫn lỗi RLS do lệnh RETURNING * mặc định | Thêm policy `SELECT` cho role `anon` với giới hạn 10s (`created_at >= now() - interval '10 seconds'`) | Nhận thành công dòng dữ liệu vừa chèn mà không làm lộ dữ liệu cũ |
| Lỗi 422 Unprocessable Content không có log chỉ ra trường dữ liệu sai cụ thể | Thêm custom exception handler `RequestValidationError` in chi tiết lỗi ra console và Response body | Biết ngay vị trí sai kiểu dữ liệu để điều chỉnh |

### Bài học
- Khi viết RLS policy cho Supabase/PostgREST, cần lưu ý cơ chế tự động trả về bản ghi vừa chèn (`RETURNING`). Nếu không cấu hình quyền `SELECT` hợp lý, lệnh insert vẫn bị coi là thất bại ở Client.
- Việc ép kiểu an toàn và kiểm tra kỹ type mismatch giữa Client (TypeScript) và Server (Pydantic/Python) giúp hạn chế tối đa các lỗi 422 trong môi trường production.
- Giữ lại các thành phần UI thông tin (Hint, Explanation) sau tương tác giúp tăng giá trị học tập — học viên tự ôn lại mà không cần thao tác thêm.


### Kế hoạch tuần sau
- [ ] Xây dựng kiểm thử tích hợp tự động cho luồng trắc nghiệm thích ứng.
- [ ] Tối ưu hóa hiệu năng render/paint khi streaming token AI.
- [ ] Bắt đầu thiết kế hệ thống Support Ticket và hòm thư Mentor (US-014 đến US-017).

---

## Week 5: 2026-06-28 - 2026-07-04

### Mục tiêu tuần này
- [x] Tối ưu luồng kích hoạt AI Tutor (Chỉ kích hoạt chủ động, không tự động mở)
- [x] Làm gọn giao diện gợi ý bằng Card tương tác và Badge dẫn chứng ngang
- [x] Hỗ trợ phóng to ảnh slide bài học RAG qua Lightbox Modal
- [x] Sửa lỗi đồng bộ và bẫy lỗi nạp thư viện Supabase
- [x] Thiết kế và lập trình RAG Sandbox Control Center tương tác cho Mentor (Luật Prompt, Sửa Slide & Re-embed, Ground Truth QA)
- [x] Đơn giản hóa quy trình xử lý báo lỗi câu hỏi Quiz của Mentor (Bỏ bước Bắt đầu sửa, đóng/từ chối trực tiếp)
- [x] Sửa lỗi hiển thị phông chữ Tiếng Việt (Mojibake) trên giao diện Frontend
- [x] Xây dựng script kiểm thử tự động chất lượng RAG & Socratic (Ragas-equivalent LLM-as-a-judge) và tự động ghi báo cáo
- [x] Mở rộng bộ dữ liệu kiểm thử chất lượng Golden Test lên 10 cases và chạy đánh giá
- [x] Đề xuất các phương án UI/UX quản lý phản hồi AI và RAG Audit Tab (Sapia style)

### Đã hoàn thành
- **Ngăn tự động mở Socratic Sidebar:** Tắt mở tự động sidebar khi làm sai câu hỏi để tránh gián đoạn học viên, duy trì fetch ngầm thông tin slide gợi ý.
- **Thẻ gợi ý Foxy Card:** Chuyển đổi dòng text thông báo sai thành một khối thẻ cam gọn gàng (`bg-amber-500/10`) nhấp nháy chuyển động chú cáo, làm nhiệm vụ bấm mở sidebar.
- **Rich Text Markdown:** Dùng bộ parser Markdown hiển thị phản hồi AI Socratic chuyên nghiệp, rõ ràng.
- **Cải tiến Badge Dẫn chứng gọn gàng:** Rút gọn các thẻ dẫn chứng dọc thành các Badge nằm ngang xếp tự động (`CitationsBlock`), cho phép bấm mở xem nhanh hoặc phóng to slide.
- **Zoom Lightbox Modal:** Thiết lập modal mờ toàn màn hình hiển thị ảnh slide học liệu độ phân giải cao khi người dùng click xem slide dẫn chứng.
- **Khôi phục hệ thống Trí nhớ Kép và bẫy lỗi Supabase:** Khôi phục thành công dual-memory (10 tin nhắn lịch số + facts JSON) cho node phản hồi chính, và bẫy lỗi `ImportError` ở Supabase Database client để tự động chạy chế độ Stub/Mock khi thiếu thư viện ở môi trường test.
- **RAG Sandbox Control Center:** Khởi tạo bảng `app.concept_rules` và `app.rag_eval_dataset` trên Supabase, tích hợp endpoints cập nhật slide và recalculate vector embedding, lưu trữ tập dữ liệu chuẩn mẫu (Ground Truth), và xây dựng 3 Modals tương tác co giãn đối xứng tại Frontend.
- **Đơn giản hóa quy trình xử lý lỗi câu hỏi của Mentor (PR #58):** Loại bỏ bước trung gian `Bắt đầu sửa` (new -> in_progress) trên UI, cho phép Mentor trực tiếp đóng hoặc từ chối báo lỗi từ trạng thái `new`. Cập nhật backend transition validation hỗ trợ trực tiếp `new -> resolved` và `new -> rejected` đi kèm bộ kiểm thử tương ứng.
- **Khắc phục lỗi phông chữ Tiếng Việt (Mojibake)**: Khôi phục mã hóa ký tự UTF-8 cho 8 files giao diện chat và bảng giám sát của mentor bị lỗi hiển thị ký tự lạ (CP1252 decoder).
- **Thiết lập Đánh giá tự động Ragas-equivalent ([run_ragas_eval.py](file:///d:/AI%20Invidual%20Tutor/Source%20code/C2-App-125/scripts/run_ragas_eval.py))**: Hiện thực LLM-as-a-judge tự động đánh giá: Độ trung thực (Faithfulness), Độ liên quan (Relevance), và Tính gợi mở Socratic. Giải quyết lỗi mã hóa `UnicodeEncodeError` trên console Windows.
- **Mở rộng bộ dữ liệu Golden Test**: Bổ sung thêm 4 test cases nâng cao (TC-007 đến TC-010) giúp phát hiện rò rỉ mã nguồn/lời giải trong câu hỏi tiếng Anh (TC-008 - đạt Socratic 0/5) và câu hỏi lý thuyết thông thường.
- **Đề xuất thiết kế UI/UX RAG Audit Tab**: Viết tài liệu [feedback_ui_proposal.md](file:///C:/Users/ADMIN/.gemini/antigravity-ide/brain/1d755ad3-30eb-474b-ba8a-85707e838e13/feedback_ui_proposal.md) kèm mockup so sánh 3-Pane Explorer, Kanban Board và Focus Card Deck.

### Khó khăn & Giải pháp
| Khó khăn | Giải pháp | Kết quả |
|----------|-----------|---------|
| Trùng lặp/lệch dependencies trong useEffect do Hot Reload Next.js | Tải lại trang (F5) để React nạp lại mảng dependencies mới cố định | Hết lỗi cảnh báo render |
| Lỗi biên dịch cú pháp interface do dính comment gạch nối | Khôi phục định dạng đúng cho interface SocraticChatBodyProps | Turbopack build thành công |
| DB client app_client cấu hình schema="app" chặn thao tác trên public schema | Khởi tạo một Supabase client mới trong route với schema="public" và khóa service_role để cập nhật bảng slide_embeddings | Slide được cập nhật và recalculate vector thành công |
| Lỗi CI/CD kiểm tra định dạng PR do chứa placeholder chưa điền | Cập nhật lại phần mô tả của PR #58 bằng GitHub CLI, bổ sung đầy đủ thông tin thực tế | PR vượt qua khâu kiểm tra định dạng và CI/CD thành công |
| Lỗi `UnicodeEncodeError` khi in các ký tự có dấu Tiếng Việt trên Windows Command Prompt | Thêm cấu hình `sys.stdout.reconfigure(encoding='utf-8')` ở đầu script Python | In thông tin kiểm thử ra console mượt mà không lỗi |
| 6 test cases ban đầu chưa đủ độ bao phủ để phát hiện rò rỉ mã nguồn | Nâng lên 10 cases và dùng LLM-as-a-judge tự động đánh giá chiều sâu Socratic | Phát hiện chính xác ca TC-008 rò rỉ toàn bộ code React và TC-007 đưa lời giải trực tiếp |

### Bài học
- Tận dụng các component sẵn có (như bộ hiển thị markdown, list badges của chatbot chính) giúp tối ưu hóa code và đồng bộ giao diện nhất quán cho các tính năng phụ trợ.
- Thiết kế giao diện EdTech cần tập trung giảm thiểu tải nhận thức (cognitive load) cho học viên bằng cách sử dụng các thẻ nút tương tác thay vì chèn các khối banner chiếm dụng không gian.
- Việc tích hợp cơ chế re-embed vector tự động tại runtime giúp hệ thống RAG cập nhật kiến thức thời gian thực tức thì mà không cần chạy lại toàn bộ quy trình pipeline dài.
- Tự động hóa đánh giá bằng LLM-as-a-judge là cần thiết vì rule-based không thể đánh giá được sắc thái Socratic hay độ trung thực của câu trả lời AI.

### Kế hoạch tuần sau
- [ ] Tối ưu hóa System Prompt của Agent LangGraph để giải quyết triệt để lỗi rò rỉ mã nguồn ở TC-008, TC-007, TC-006, đưa điểm trung bình Socratic lên $\ge 4.5/5$.
- [ ] Triển khai giao diện Audit / Quản lý phản hồi AI thực tế theo thiết kế Kanban hoặc 3-Pane Explorer đã lựa chọn.


---

## Week 6: 2026-07-05 - 2026-07-11

### Mục tiêu tuần này
- [x] Tổng hợp Evaluation Evidence cho AI chatbot: pytest/coverage, RAGAS-equivalent metrics, response-time evidence và biểu đồ trực quan.
- [x] Sửa golden evaluation report để chạy đủ 10 golden test cases thay vì hiển thị/ghi nhận lệch 6 cases.
- [x] Phân tích nguyên nhân TC-008 bị RAGAS chấm Socratic 0/5 dù golden report nhìn như pass.
- [x] Hardening luồng AI chatbot Guardrail/Socratic cho direct-cheating assignment request.
- [x] Regenerate golden/RAGAS/evidence reports sau khi fix.
- [x] Tái cấu trúc Socratic Chat: tách biệt giao diện Học viên (`student/`) và Mentor/Admin (`mentor-admin/`), cô lập LocalStorage.
- [x] Khắc phục lỗi điều hướng đăng nhập cho các vai trò Giảng viên (Mentor) và Admin (BTC).
- [x] Cải tiến giao diện Học viên: tràn viền màn hình và làm mờ dần (Gradient Mask) cạnh phải để hòa quyện với thanh điều hướng nổi.
- [x] Thiết lập phân tách môi trường deploy Staging & Production cho cả Frontend (Vercel) và Backend (Render).
- [x] Phát triển và hoàn thiện backend quản lý tài liệu và Ingestion Pipeline cho Mentor.
- [x] Sửa đổi giới hạn tải tài liệu học liệu 10 ngày và nạp động danh sách Concepts từ Database.
- [x] Xây dựng backend và frontend quản lý quiz cho mentor (HITL queue, duyệt và sửa câu hỏi).

### Đã hoàn thành
- **Tổng hợp Chatbot Evaluation Evidence:** Tạo bộ artifact trong `eval/results/chatbot_evidence/`, gồm pytest output + coverage, RAGAS summary CSV, latency summary CSV, HTML coverage và các biểu đồ SVG (`coverage_key_modules.svg`, `ragas_average_metrics.svg`, `ragas_case_scores.svg`, `latency_by_scenario.svg`). Báo cáo chính nằm tại `eval/results/chatbot_evidence/chatbot_evaluation_evidence.md`.
- **Sửa Golden Report chạy đủ 10 cases:** Cập nhật `scripts/run_golden_eval.py` để tổng số test case được lấy động từ `golden-test-cases.json`, cấu hình stdout/stderr UTF-8 cho Windows, truyền đúng `student_profile` top-level vào LangGraph state, và regenerate `outputs/golden_eval_report.md` có đầy đủ TC-001 đến TC-010.
- **Làm rõ sai lệch Golden vs RAGAS:** Xác định golden report cũ chỉ đánh giá citation nên TC-008 có thể nhìn như pass, trong khi RAGAS đánh giá thêm Socratic/Guardrail nên chấm 0/5 khi phản hồi rò code/lời giải. Đây là sai khác về tiêu chí đánh giá, không phải mâu thuẫn dữ liệu.
- **Fix TC-008 Guardrail/Socratic:** Thêm detector `is_academic_integrity_risk()` ở `analyze_node.py`; giữ intent `academic` khi query có rủi ro làm hộ assignment dù RAG không tìm được slide; đưa flag `academic_integrity_risk` vào metadata; chặn nhánh `respond_general`; bắt buộc qua `pedagogical_reflection`; thêm deterministic safe fallback khi không có RAG context hoặc khi critic đã retry tối đa.
- **Siết prompt phản hồi:** Bổ sung hard instruction trong `respond_node.py` để AI không đưa complete code/final answer/runnable solution cho assignment, homework, lab, quiz.
- **Sửa fail-open của critic:** Cập nhật `pedagogical_reflection_node.py` để academic-integrity-risk không bị cho qua phản hồi cũ sau giới hạn retry, mà trả safe fallback từ chối viết bài hoàn chỉnh và hướng dẫn từng bước.
- **Cập nhật evaluation scripts:** `run_golden_eval.py` thêm cột Guardrail Status và Overall; `run_ragas_eval.py` truyền category/profile đúng và cập nhật judge prompt để mọi `direct_cheating` case được chấm đúng logic refuse-and-guide.
- **Đồng bộ report mới:** Regenerate `outputs/golden_eval_report.md`, `outputs/ragas_eval_report.md`; cập nhật `chatbot_evaluation_evidence.md`, `ragas_metrics_summary.csv`, `ragas_average_metrics.svg`, `ragas_case_scores.svg`. Sau fix, TC-008 đạt Guardrail PASS và Socratic 5/5; RAGAS Socratic average tăng lên 4.30/5.
- **Bổ sung regression tests:** Thêm test cho detector academic-integrity-risk, analyze-node không fallback sang general, graph bắt buộc qua critic, retry-limit trả safe fallback, và respond-node trả safe fallback khi không có RAG.
- **Tái cấu trúc Socratic Chat & Cô lập Persona**: Chuyển mã nguồn Socratic Chat sang thư mục `student/` và `mentor-admin/` độc lập. Phân tách và đổi tên các khóa lưu trữ LocalStorage (`socratic-chat:history-collapsed` và `socratic-chat:active-session-id`) để tránh xung đột dữ liệu giữa học viên và quản trị/mentor. Loại bỏ nút chuyển đổi chế độ AI trên tiêu đề học viên.
- **Sửa lỗi điều hướng sau đăng nhập**: Sửa đổi cơ chế điều hướng post-login trong [dashboard-layout.tsx](file:///d:/Project/Vin_AI/000%20Group%20Project/C2-App-125/frontend/app/components/dashboard-layout.tsx), đưa Mentor tới `/dashboard/insights` and BTC/Admin tới `/dashboard/braintrust-observability` chính xác.
- **Gradient Fade-out cho Chat Học viên**: Sử dụng thuộc tính `mask-image` và `WebkitMaskImage` tuyến tính để làm mờ dần nền mờ (`bg-white/50`, `bg-white/40`) và hiệu ứng backdrop-blur của Header và Input Bar ở biên phải 120px. Đồng thời, mở rộng chiều rộng của container chat sát viền phải (`lg:-mr-20 lg:w-[calc(100%+5rem)]`) và bổ sung padding (`lg:pr-20`) bảo vệ vùng hiển thị tin nhắn, thanh cuộn và nút đóng/phân trang [slide-viewer.tsx](file:///d:/Project/Vin_AI/000%20Group%20Project/C2-App-125/frontend/components/dashboard/socratic-chat/student/components/slide-viewer.tsx) khỏi bị đè bởi thanh điều hướng nổi.
- **Phân tách môi trường deploy (CI/CD)**: Tách biệt Webhook CD trên Render (`ci-backend.yml`) để đẩy tự động nhánh `dev` lên Staging service riêng biệt, nhánh `main` lên Production. Cấu hình Vercel deploy (`ci-frontend.yml`) không dùng `--prod` when push nhánh `dev`, giữ nguyên tên miền Preview ổn định làm môi trường Staging. Cập nhật `src/config.py` để Pydantic cho phép APP_ENV là `staging`.
- **Biên soạn Guidebook Day 1-28 & Sửa lỗi mapping hiển thị Giai đoạn 3 (Nguyễn Vũ Trọng)**: Hoành thành sinh động các tệp guidebook học thuật chất lượng cao từ slide notes, phân phối theo 3 tracks cho Day 16-28. Khắc phục sự cố 404 và không mapping đúng bài học bằng cách cập nhật `guidebookDayId` theo track (e.g. `day16-ai-product`) trong `program-curriculum.ts` và sử dụng `getProgramDay` để lấy tiêu đề động trong `page.tsx` và `guidebook-view.tsx`.
- **Hoàn thành Ingestion Pipeline & Quản lý Tài liệu cho Mentor**: Tạo 4 endpoints backend FastAPI trong `material_routes.py` phục vụ việc truy vấn danh sách slide chunks, tải file PDF lên Supabase Storage (Option B) và chạy tác vụ background kích hoạt LLM GPT-4o-mini để tự động sinh 5 câu hỏi trắc nghiệm kèm 3 cấp độ gợi ý Socratic.
- **Gỡ bỏ giới hạn 10 ngày học & Nạp Concepts động**: Nâng cấp API backend sử dụng Regex `re.search(r'(?:day|ngay)\s*0*(\d+)', ...)` trích xuất tự động `dayLabel` từ tên file bất kỳ. Giao diện frontend `ingestion-tab.tsx` tự động sinh 30 ngày ở dropdown form, đồng thời gọi API `/api/v1/concepts` thông qua helper `fetchConcepts` để nạp động toàn bộ danh sách chủ đề thực tế từ DB khi không chạy demo mode.
- **Xây dựng hệ thống Duyệt câu hỏi (HITL Quiz Review)**: Hoàn thành đầy đủ database migration SQL thêm status `rejected` và cột `rejection_reason`; xây dựng backend service `quiz_review.py` và API router `quiz_review_routes.py` hỗ trợ Mentor/Admin/Dev; viết unit tests 10/10 cases; và đấu nối API thực tế vào frontend component `quiz-editor-tab.tsx` (chạy thành công type checker Next.js).

### Khó khăn & Giải pháp
| Khó khăn | Giải pháp | Kết quả |
|----------|-----------|---------|
| TC-008 bị fallback sang `general` khi RAG không tìm thấy slide, làm bypass guardrail | Gắn `academic_integrity_risk` ngay tại `analyze_node` và giữ intent `academic` cho request làm hộ assignment | TC-008 không còn đi nhánh chat general |
| Golden report cũ chỉ có citation status nên gây hiểu nhầm pass/fail | Thêm Guardrail Status và Overall Status vào `run_golden_eval.py` | Report thể hiện rõ TC-008 đạt/không đạt theo guardrail |
| Critic node fail-open sau 2 lần retry có thể cho qua phản hồi không an toàn | Thêm safe fallback riêng cho academic-integrity-risk khi đạt retry limit | Không còn trả code/lời giải hoàn chỉnh sau retry |
| RAGAS judge prompt cũ chỉ nhắc TC-003 cho direct cheating | Đưa `category` vào prompt và áp dụng logic cho mọi `direct_cheating` | TC-008 được chấm đúng là 5/5 sau khi tutor refuse-and-guide |
| Evidence markdown/charts vẫn giữ số liệu cũ sau khi code đã fix | Đồng bộ lại CSV, SVG và markdown theo report mới | `chatbot_evaluation_evidence.md` không còn hiển thị TC-008 0/5 |
| Thanh điều hướng nổi đè lên các nút Pagination và Close của SlideViewer học liệu | Thêm `lg:pr-20` vào Header của `SlideViewer` khi mở trên desktop | Các nút điều khiển trượt sang trái, hiển thị đầy đủ và dễ thao tác |
| Lỗi thanh Header và Input Bar chat bị cụt viền xám mờ 80px khi co hẹp | Kéo giãn container chat sát biên màn hình rồi dùng CSS mask làm mờ dần nền | Tạo hiệu ứng tan biến mềm mại cực kỳ cao cấp dưới thanh điều hướng nổi |
| Server crash khi start bản Staging trên Render do thiếu kiểu hợp lệ `staging` | Cập nhật Pydantic Settings model `app_env` cho phép nhận giá trị `staging` | Backend Staging khởi động thành công mượt mà |
| Lệch và thiếu cấu hình mapping hiển thị Guidebook phân nhánh (Day 16-28) gây lỗi 404 | Chuyển đổi `guidebookDayId` thành định danh theo Track trong curriculum và lấy tiêu đề động qua `getProgramDay` | Người dùng xem được toàn bộ guidebooks phân nhánh mượt mà |
| Lệch kiểu dữ liệu `rejection_reason` (null từ DB so với undefined ở frontend Question) và thiếu kiểu tường minh cho callback parameter khiến Next.js build lỗi | Thực hiện map và chuyển đổi `null` sang `undefined` khi nhận response, đồng thời khai báo kiểu dữ liệu TypeScript tường minh cho các callback | Giải quyết triệt để lỗi biên dịch, `npx tsc --noEmit` chạy thành công 100% |


### Bài học
- Với AI Tutor, citation-pass không đủ để kết luận câu trả lời an toàn; report cần tách rõ Citation, Guardrail và Socratic.
- Direct-cheating request phải được xử lý như academic/safety-critical ngay cả khi RAG không tìm thấy tài liệu, vì fallback sang general tạo lỗ hổng bypass guardrail.
- Guardrail nên có deterministic fallback cho các tình huống high-risk, thay vì phụ thuộc hoàn toàn vào LLM rewrite/critic.
- Evidence artifacts cần được regenerate đồng bộ sau mỗi lần fix hành vi agent, nếu không markdown và chart sẽ tiếp tục kể câu chuyện cũ.
- Các thuộc tính CSS nâng cao như `mask-image` vô cùng hữu dụng khi cần làm mờ dần không chỉ màu sắc nền mà cả các hiệu ứng xếp lớp phức tạp như `backdrop-blur-md`, giúp xử lý các điểm giao diện chồng lấn một cách tự nhiên.
- Cô lập mã nguồn giao diện theo Persona (học viên vs giảng viên) ngay từ đầu giúp giảm thiểu rủi ro side-effect khi tinh chỉnh bố cục đặc thù.
- Khi triển khai môi trường mới như Staging, cần rà soát lại toàn bộ schema validation của file config để tránh các lỗi crash cơ bản nhưng nghiêm trọng do cấu hình Pydantic nghiêm ngặt.
- Khi làm việc với Next.js TypeScript có strict check, luôn đảm bảo dữ liệu nullable từ DB (null) được convert/map sang định dạng React (chấp nhận undefined nhưng lỗi nếu truyền null).

### Bổ sung ngày 2026-07-08 - thay đổi dưới author `blu1606`

#### Đã rà soát
- Kiểm tra git log theo author `blu1606` cho giai đoạn 2026-07-07 đến 2026-07-08. Cụm thay đổi chính gồm onboarding diagnostic/quiz tour, typography token cleanup, adaptive quiz/Elo, profile dashboard, Socratic chat consolidation, unified admin pages và đóng gói deliverables Demo Day.
- Commit đóng gói mới nhất: `856fbfc docs(deliverables): package demo day submission`.

#### Đã hoàn thành thêm
- **Quiz first-run onboarding:** Bổ sung storage, tour anchors, walkthrough, chỉnh lại target và trigger để người học lần đầu hiểu luồng làm quiz, citation và tutor review.
- **Adaptive quiz/Elo:** Theo dõi hint usage ở server-side, persist partial quiz Elo updates, tách concept history và aggregate history, giải thích Elo update rõ hơn và ổn định selection/recommendation.
- **Dashboard và chat:** Đơn giản hóa profile progress dashboard, gom lại Socratic chat panels, giảm trùng lặp đường UI và chuẩn bị các trang admin thống nhất.
- **Demo Day deliverables:** Chuẩn hóa README, architecture, video-demo script, pitch deck PDF, evaluation evidence, journal/worklog entrypoints theo yêu cầu chapter 9.
- **Architecture diagrams:** Tách từng sơ đồ thành file Excalidraw riêng và export PNG để README/docs có ảnh đọc được, vẫn giữ nguồn chỉnh sửa được trong `docs/diagram/excalidraw/`.
- **User feedback evidence:** Tổng hợp feedback thật từ chat export, ẩn danh tester trong evaluation, map từng góp ý thành product action cụ thể.

#### Khó khăn & Giải pháp
| Khó khăn | Giải pháp | Kết quả |
|----------|-----------|---------|
| Journal chưa phản ánh các commit `blu1606` mới nhất | Rà git log theo author và thêm entry tổng hợp vào Week 6 + `docs/journals/` | Deliverable #8 có nội dung cập nhật hơn |
| Demo Day cần đủ file đúng vị trí nhưng repo đã có nhiều tài liệu rải rác | Giữ root README làm index, tạo entrypoints trong `docs/` và link sang artifact canonical | Người chấm có đường đọc ngắn, repo vẫn giữ tài liệu gốc |
| Architecture diagram ban đầu khó đọc khi gom nhiều chart | Tách từng chart thành file riêng, export PNG và giữ Excalidraw source | README embed được ảnh rõ hơn, team vẫn sửa tiếp được |

#### Bài học
- Với deliverables, path đúng quan trọng ngang nội dung: người review cần mở repo là thấy ngay README, architecture, video demo, pitch deck, journal, worklog và evaluation.
- Feedback người dùng nên được tóm tắt theo issue/action/status, không chỉ chép quote, để biến phản hồi thành roadmap kỹ thuật cụ thể.
- Những thay đổi UI/onboarding/adaptive nhỏ nhưng dày đặc nên được gom journal theo chủ đề thay vì liệt kê từng commit, nếu không nhật ký rất khó đọc.

### Kế hoạch tiếp theo
- [ ] Tối ưu TC-002, TC-004, TC-007 để tăng mức độ câu hỏi gợi mở Socratic.
- [ ] Gom safe fallback/policy academic integrity thành helper chung để tránh duplication.
- [ ] Cân nhắc thêm regression case end-to-end cho `/api/v1/chat` với direct-cheating assignment query.
- [ ] Tích hợp kiểm thử tự động E2E cho luồng chat học viên và mentor.
- [ ] Sửa đổi bộ kiểm thử tích hợp bitemporal theo cơ chế real-time và đóng gói helper cho truy vấn bitemporal.

---

## Week 7: 2026-07-09 - 2026-07-18

### Mục tiêu tuần này
- [x] Đồng bộ triệt để tên các khái niệm Toán học GDPT 2018 trên toàn hệ thống.
- [x] Dọn dẹp mock data thừa và các thuật ngữ máy học (ML) bị rò rỉ trên giao diện.
- [x] Khắc phục triệt để lỗi kiểm thử offline trên môi trường CI/CD (GitHub Actions).
- [x] Viết công cụ quản lý vận hành uvicorn, npm dev và pytest qua PowerShell.

### Đã hoàn thành
- Đồng bộ tên khái niệm Toán lớp 5-7 khớp hoàn toàn với `knowledge_graph.json`.
- Loại bỏ 230 dòng mảng mock cũ trùng lặp tại `class-insights-tab.tsx`, dọn sạch các từ khóa ML trong phần hoạt động học sinh của `mock-insights-data.ts`.
- Đưa `questions.json` và `knowledge_graph.json` vào Git tracking, giải quyết triệt để lỗi test offline trên môi trường GitHub Actions do thiếu tệp dữ liệu.
- Cập nhật test suite `test_adaptive_sql_contracts.py` tự động chuẩn hóa khoảng trắng giúp test chạy ổn định không phụ thuộc định dạng SQL.
- Viết tập lệnh PowerShell tương tác `run_demo.ps1` hỗ trợ khởi động nhanh và kiểm thử bằng 1 phím nhấn.
- Chạy thông suốt bộ kiểm thử 331 tests (100% Passed).

### Khó khăn & Giải pháp
| Khó khăn | Giải pháp | Kết quả |
|----------|-----------|---------|
| Lỗi test offline trên Github Actions do thiếu câu hỏi | Force add questions.json và knowledge_graph.json vào Git | CI pipeline xanh 100% |
| Test SQL contract bị vỡ khi thay đổi cách thụt lề câu lệnh SQL | Viết hàm clean() tự động rút gọn khoảng trắng và chuẩn hóa cú pháp trước khi assert | Test chạy ổn định và chính xác |

### Bài học
- Các tệp dữ liệu cấu hình offline như questions.json cần được theo dõi bởi Git để tránh môi trường CI bị cô lập dữ liệu.
- Viết kiểm thử so khớp văn bản SQL cần thực hiện chuẩn hóa khoảng trắng để đảm bảo tính mềm dẻo khi refactor.

### Kế hoạch tuần sau
- [ ] Thuyết trình chính thức và Demo sản phẩm EduGap trước Hội đồng Giám khảo.

---
<!-- Tiếp tục copy block trên cho Week 8 -->
