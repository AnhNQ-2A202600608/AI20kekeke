# Worklog - AI Tutor Project

> Ghi lại tất cả công việc đã làm theo ngày. Ai làm gì, kết quả gì.

---

## 2026-05-31

| Member | Task | Status | Output | Time |
|--------|------|--------|--------|------|
| Hồ Tất Bảo Hoàng | Initialize Codebase Docs, CI Branch Protection, and AI Assistant | ✅ Done | Khởi tạo 10 file tài liệu (PDR, roadmap, design guidelines, system architecture, v.v.), cấu hình CI Workflow xác thực nhánh, tạo PR template, thiết lập `CLAUDE.md`, `AGENT.md` và `.claude/settings.json`. | 5h |
| Hồ Tất Bảo Hoàng | Setup ADR guidelines, Mastery Selection, and Dev Sync Setup | ✅ Done | Tạo template ADR và viết ADR-002 (chọn Elo-style), cấu hình rules tự động cho ADR/Journal dưới `.claude/rules/` và `.agents/rules/`, viết script `scripts/setup_dev_links.ps1` tạo Junction cục bộ. | 4h |

**Tổng kết ngày:** Khởi tạo thành công nền tảng cấu hình, tài liệu cốt lõi, cơ chế bảo vệ nhánh CI, quy chuẩn ADR và môi trường đồng bộ hóa các local agents/skills cho dự án.

---

## 2026-06-05

| Member | Task | Status | Output | Time |
|--------|------|--------|--------|------|
| Hồ Tất Bảo Hoàng | Setup complete codebase boilerplate (FastAPI, LangGraph agent, Docker, tests, Makefile, docs) | ✅ Done | Khởi tạo khung FastAPI API, tích hợp luồng đại lý LangGraph (state, graph, nodes, tools), cấu hình Docker (Dockerfile/Compose), thiết lập ruff/pytest và tích hợp tài liệu hướng dẫn chuyên sâu dưới `docs/`. | 6h |
| Hồ Tất Bảo Hoàng | Algorithm research, DBR methodology, and ADR-003 creation | ✅ Done | Đang nghiên cứu về các thuật toán thích ứng (Contextual Bandit, BKT, IRT, Cold Start) và phương pháp nghiên cứu dựa trên thiết kế (Design-Based Research - DBR) trong EdTech; xây dựng các tài liệu nghiên cứu ban đầu cùng thiết kế ADR-003. | 5h |

**Tổng kết ngày:** Hoàn tất cấu trúc khung ứng dụng backend, luồng đại lý AI Agent (LangGraph), cấu hình Docker hóa ứng dụng, bộ kiểm thử tự động; đang tiếp tục nghiên cứu sâu thêm các thuật toán thích ứng và phương pháp nghiên cứu thực nghiệm DBR cho dự án.

---

## 2026-06-09

| Member | Task | Status | Output | Time |
|--------|------|--------|--------|------|
| Nguyễn Vũ Trọng | Ingest Day 09 Slides (Multi-Agent, MCP, A2A, LangGraph) into Knowledge Base | ✅ Done | Khởi tạo 4 tài liệu tri thức chi tiết cho Day 09 dưới `frontend/knowledge/day-09/` (`pre-note.md`, `note.md`, `model-context-protocol.md`, `multi-agent-mcp-lab.md`) phục vụ đào tạo và phát triển hệ thống nhiều tác nhân. | 3h |
| Nguyễn Vũ Trọng | Generate Day 09 Quizzes (Basics, Pipeline, Advanced, Short-Answer) and update manifest | ✅ Done | Khởi tạo 4 tệp JSON trắc nghiệm và tự luận cho Day 09 tại `frontend/public/quizzes/day9/`, tích hợp vào `quiz-manifest.json` và chạy bộ validate schema/option balance/distribution thành công. | 2h |

**Tổng kết ngày:** Hoàn thành tài liệu tri thức chuyên sâu Day 09, đồng thời xây dựng và chuẩn hóa thành công bộ 4 tệp câu hỏi trắc nghiệm/tự luận tương ứng tích hợp vào Manifest hệ thống.

---

## 2026-06-10

| Member | Task | Status | Output | Time |
|--------|------|--------|--------|------|
| Nguyễn Phương Nam | Design AI Tutor Brain & Prompting Architecture | ✅ Done | Thiết kế Socratic prompting 4 mức độ, cơ chế thích ứng Elo/ZPD, Guardrails chống gian lận, và viết validation trích dẫn `validate-ai-tutor.py` vượt qua 13/13 test cases. Ghi nhận trong [ADR-003](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/ADR/adr-003-tutor-brain-spec.md). | 5h |
| Nguyễn Phương Nam | Notion Backlog Cleanup & US Mapping | ✅ Done | Truy vấn 42 tasks Notion; lưu trữ 8 task trống, 6 task trùng; chuẩn hóa mã 10 task dạng `T-0XX` và liên kết 12 tasks với User Stories (US-001 đến US-018). | 3h |
| Hồ Tất Bảo Hoàng | Integrate Socratic AI Quiz Sidebar and RAG Chat Portal | ✅ Done | Tích hợp thành công giao diện Adaptive Quiz (chia đôi màn hình 70/30 với Socratic Sidebar gợi ý) và Cổng Hỏi đáp AI RAG (SocraticChatTab) vào Next.js frontend; kết nối API `/api/v1/chat` và hoàn tất biên dịch type-safe không lỗi. | 2h |

**Tổng kết ngày:** Thiết kế thành công kiến trúc phản hồi Socratic thích ứng Elo cho AI Tutor, hoàn thiện tài liệu đặc tả [ADR-003](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/ADR/adr-003-tutor-brain-spec.md), tối ưu hóa cấu trúc cơ sở dữ liệu Notion Backlog và tích hợp thành công giao diện Next.js frontend Duolingo-style.

---

## 2026-06-11

| Member | Task | Status | Output | Time |
|--------|------|--------|--------|------|
| Nguyễn Phương Nam | RAG HTTP Ingestion & Retrieval Pipeline | ✅ Done | Chuyển đổi RAG sang Supabase REST API, ingest thành công 39 slides Day10, tinh chỉnh logic citation validator, tích hợp ZPD/Elo vào LangGraph agent, vượt qua 6/6 kịch bản Golden Test. | 6h |
| Nguyễn Phương Nam | Notion Backlog Integration & Git Conflict Resolution | ✅ Done | Tự động cập nhật Notion Backlog (đóng task RAG pipeline), cấu hình `.gitignore` và giải quyết xung đột local (9/9 tests pass). | 2h |
| Nguyễn Vũ Trọng | Implement OpenRouter PDF API fallback & write ADR-003 | ✅ Done | Thiết kế cơ chế fallback 3 lớp, tạo [adr-003-pdf-converter-openrouter-fallback.md](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/ADR/adr-003-pdf-converter-openrouter-fallback.md) và tích hợp hàm OpenRouter API vào [doc_converter.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/pipeline/transform/doc_converter.py) & [lms_slide_pipeline.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/pipeline/lms_slide_pipeline.py). | 4h |

**Tổng kết ngày:** Hoàn tất chuyển đổi RAG sang API REST của Supabase, hoàn thành cơ chế fallback OpenRouter cho pipeline chuyển đổi PDF sang Markdown cùng tài liệu [ADR-003 (fallback)](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/ADR/adr-003-pdf-converter-openrouter-fallback.md), giải quyết xung đột Git và cập nhật tiến độ Notion Backlog.

---

## 2026-06-12

| Member | Task | Status | Output | Time |
|--------|------|--------|--------|------|
| Hồ Tất Bảo Hoàng | Core Adaptive Algorithms Implementation (BKT, Elo, LinUCB) | ✅ Done | Hiện thực các lớp thuật toán thích ứng `BKT`, `EloRating`, `LinUCB` và Database Interface kết nối Supabase, xử lý khóa đồng thời (Pessimistic Locking). | 8h |
| Hồ Tất Bảo Hoàng | Chatbot Cache Store & Personalization System | ✅ Done | Thiết lập abstract Cache Store và hai implementation cụ thể `InMemoryCache` và `RedisCacheStore` để lưu trữ và quản lý context cá nhân hóa của sinh viên. | 4h |
| Hồ Tất Bảo Hoàng | Architectural Decision Records (ADR-004, ADR-005, ADR-006) | ✅ Done | Viết 3 tài liệu ADR mô tả kiến trúc khóa đồng thời cho Elo, hệ thống cache cá nhân hóa chatbot, và thiết kế Single Agent phục vụ sinh Quiz. | 3h |
| Hồ Tất Bảo Hoàng | Diagram Restructuring & Validation Prompt Setup | ✅ Done | Tái cấu trúc thư mục sơ đồ thành 3 file markdown chứa biểu đồ Mermaid chi tiết. Tạo prompt kiểm định thuật toán tự động dưới dạng brutal validation. | 3h |
| Hồ Tất Bảo Hoàng | Unit Tests & Simulation | ✅ Done | Thiết lập bộ test suite chạy thành công cho thuật toán, API router và viết file mô phỏng đánh giá hiệu suất mô hình thích ứng. | 4h |
| Hồ Tất Bảo Hoàng | Brainstorm & Design Hybrid Caching Tool-Calling Flow | ✅ Done | Thiết kế kiến trúc Hybrid Smart Cache kết hợp Tool-Calling của AI Agent; khởi tạo ADR-007, cập nhật tài liệu kiến trúc hệ thống và lập kế hoạch chi tiết. | 1h |
| Hồ Tất Bảo Hoàng | Design and Plan Guardrails, Fallback, and Logging | ✅ Done | Phân tích RAG trade-offs, lập kế hoạch chi tiết trong thư mục plans, viết ADR-008 và tạo template kế hoạch triển khai. | 1.5h |
| Hồ Tất Bảo Hoàng | Fix PR 11 Review Feedback & Audit Blockers | ✅ Done | Khắc phục lỗi mất đối xứng (numerical instability) ở thuật toán Sherman-Morrison trong bandit.py; loại bỏ biến thừa block_profile ở api/routes.py; xác thực thành công bộ 18 test. | 1h |
| Hồ Tất Bảo Hoàng | Integrate Socratic AI Quiz Sidebar and RAG Chat Portal | ✅ Done | Tích hợp thành công giao diện Adaptive Quiz (chia đôi màn hình 70/30 với Socratic Sidebar gợi ý) và Cổng Hỏi đáp AI RAG (SocraticChatTab) vào Next.js frontend; kết nối API `/api/v1/chat` và hoàn tất biên dịch type-safe không lỗi. | 2h |

**Tổng kết ngày:** Hoàn thành core engine thuật toán thích ứng, hệ thống cache context, tài liệu kiến trúc (ADR-007 & ADR-008), các biểu đồ, bộ kiểm thử (18 tests passed), thiết kế kế hoạch triển khai chi tiết cho các bộ lọc an toàn, khắc phục phản hồi PR 11, và tích hợp thành công toàn bộ giao diện học tập thích ứng (Quiz + Chat RAG) Duolingo-style vào Next.js frontend.

---

## 2026-06-13

| Member | Task | Status | Output | Time |
|--------|------|--------|--------|------|
| Nguyễn Phương Nam | Ingestion PDF Slides & Tải ảnh slide lên Supabase Storage | ✅ Done | Cấu hình public bucket `slide-images` trên Supabase, tích hợp PyMuPDF render trang PDF thành ảnh PNG bytes để tải lên Storage và cập nhật cột `image_url` DB schema/RPC `match_slides`. | 4h |
| Nguyễn Phương Nam | Thay đổi cổng backend FastAPI & Sửa lỗi layout cuộn trang | ✅ Done | Chuyển cổng uvicorn từ 8000 sang 8001, thay thế icon Send bằng ArrowRight, sửa lỗi cuộn trang bằng cách cuộn cục bộ trong `chatScrollRef` thay vì scrollIntoView toàn viewport. | 2h |

**Tổng kết ngày:** Hoàn thiện pipeline nạp PDF slides gốc, trực quan hóa ảnh slide lấy từ Supabase Storage và sửa các lỗi layout/cuộn trang trên cổng backend mới 8001.

---

## 2026-06-14

| Member | Task | Status | Output | Time |
|--------|------|--------|--------|------|
| Nguyễn Phương Nam | Xóa mock data & Tự động lưu phiên chat Socratic AI | ✅ Done | Loại bỏ mock data chào mừng/slide mock khởi tạo, tích hợp lưu phiên tự động bằng `localStorage` kết hợp `sessionStorage` (giữ phiên khi F5/chuyển tab, reset khi đóng trình duyệt), thêm nút "Cuộc hội thoại mới" 3D và tối ưu linter. | 4h |

**Tổng kết ngày:** Loại bỏ toàn bộ mock data trên tab Trợ lý AI và triển khai thành công tính năng tự động lưu/khôi phục phiên chat Socratic AI đạt chuẩn linter và type-safe.

---

## 2026-06-15

| Member | Task | Status | Output | Time |
|--------|------|--------|--------|------|
| Nguyễn Phương Nam | Cập nhật nhật ký tương tác AI & Đồng bộ mốc thời gian | ✅ Done | Điều chỉnh lại mốc thời gian của log ngày 13/06/2026 và bổ sung đầy đủ 5 dòng nhật ký tương tác thực tế của ngày 14/06/2026 (xóa mock data, giải đáp localStorage/sessionStorage, chốt plan auto-save, triển khai UI/UX SocraticChatTab mới và tắt test browser) vào session.jsonl. | 1h |
| Nguyễn Phương Nam | Stream Chat — Tách nhánh & dọn working tree | ✅ Done | Revert toàn bộ thay đổi không liên quan stream chat trên nhánh `namnp/ai-assistant-chat-feature` (AnimatePresence fix, postcss/autoprefixer fix, `.agents`, `.claude` config); giữ lại đúng 13 files modified + 3 files mới gồm backend SSE (`routes.py`, `analyze_node`, `respond_node`, `rag.py`, `chat_optimization.py`, `cache_keys.py`, `cache/`, `llm.py`, `supabase_database.py`) và frontend (`route.ts`, `globals.css`, `socratic-chat-tab.tsx`, `lib/chat/stream.ts`, `test_chat_stream.py`). | 1h |
| Nguyễn Phương Nam | Fetch & merge từ remote dev | 🔄 In Progress | Fetch thành công `origin/dev` (9 commits mới: ruff config, uv setup, algorithm fallback frontend, CI self-hosted runner); merge bị chặn do permission settings — cần chạy thủ công `git merge origin/dev` trong terminal. | 0.5h |

**Tổng kết ngày:** Chuẩn hóa nhật ký AI, tách sạch working tree trên nhánh stream chat (chỉ giữ lại đúng 16 files liên quan SSE streaming), và fetch 9 commits mới từ `origin/dev` sẵn sàng merge.

---

## 2026-06-12

| Member | Task | Status | Output | Time |
|--------|------|--------|--------|------|
| Nguyễn Vũ Trọng | Update guardrails and fallback style in Socratic chat; add ui-ux-pro-max design guidelines | ✅ Done | Cập nhật giao diện bong bóng chat Socratic Chat với cảnh báo vi phạm tính trung thực học thuật (guardrails) và thông báo độ tin cậy thấp (fallback). Bổ sung quick demo chips. Thêm thư mục skill `ui-ux-pro-max` hỗ trợ thiết kế chuyên nghiệp. | 3h |

**Tổng kết ngày:** Cải tiến tính năng Socratic Chat bằng cách hiển thị trực quan các cảnh báo học thuật và độ tin cậy thấp cùng các demo chip nhanh; bổ sung skill hỗ trợ thiết kế chuẩn UI/UX.

---

## 2026-06-14

| Member | Task | Status | Output | Time |
|--------|------|--------|--------|------|
| Nguyễn Vũ Trọng | Refactor symmetric edge-to-edge layout, fix RightBar popover clipping and implement hover-to-reveal scrollbar | ✅ Done | Tái cấu trúc bố cục trang chủ sang chế độ tràn viền đối xứng (bù trừ margin `lg:mr-80`), cố định `RightBar` bám sát biên. Khắc phục lỗi cắt lề popover Streak bằng cách chuyển `aside` thành `overflow-visible` và tách biệt Scroll Container cho các widget dưới. Định nghĩa và áp dụng lớp `.hover-scrollbar` toàn cục để ẩn thanh cuộn và tự động hiện khi di chuột. Kiểm thử responsive thành công trên Desktop, Tablet và Mobile. | 2h |
| Nguyễn Vũ Trọng | Restructure learning path topics, change "Unit" headings to sequential day numbers, and fix tooltip clipping | ✅ Done | Cấu trúc lại Tuần 1 (Day 1-7 + Ôn tập) và Tuần 2 (Day 8-12). Thay đổi hiển thị nhãn "Unit" thành "Ngày [Số]" hoặc "Ôn tập" tương ứng. Khắc phục lỗi clipping tooltip bài học cuối bằng cách bỏ `overflow-hidden` và tinh chỉnh `z-index`. Ẩn nút Guidebook cho bài ôn tập tổng hợp. | 1.5h |
| Nguyễn Vũ Trọng | Redesign adaptive Profile tab with Elo, BKT, ZPD, Bandit and resolve hydration & build bugs | ✅ Done | Thiết kế và lập trình lại trang Cá nhân (Profile Tab) với 6 sections chỉ số thích ứng: Snapshot, Bản đồ Elo + khoảng bất định BKT + ngưỡng ZPD, biểu đồ Radar ma trận năng lực, đồ thị Recharts Elo 30 ngày, Heatmap Elo Gain, danh sách phiên học (Hint Penalty) và đề xuất Bandit. Sử dụng `isMounted` để sửa triệt để lỗi render SVG/Canvas khi SSR. Đồng thời sửa lỗi TypeScript citations trong `socratic-chat-tab.tsx` giúp toàn bộ dự án compile sạch 100%. | 3h |

**Tổng kết ngày:** Hoàn thành tối ưu hóa căn lề, sửa triệt để lỗi hiển thị của popover Streak, ẩn/hiện thanh cuộn thông minh trên thanh RightBar; hoàn thiện lộ trình học tập 12 ngày và tooltip bài ôn tập cuối Tuần 1. Đồng thời hoàn tất nâng cấp trang cá nhân từ đếm % hoàn thành sang đo lường năng lực thực tế thích ứng, sửa lỗi hydration biểu đồ Next.js và lỗi biên dịch TypeScript của dự án.

## 2026-06-15

| Member | Task | Status | Output | Time |
|--------|------|--------|--------|------|
| Nguyễn Vũ Trọng | Hoàn thiện giao diện Quiz Mode tràn viền, Socratic Chat song hành và sửa lỗi responsive | ✅ Done | Cấu trúc lại giao diện làm bài thi và Socratic Chat thành các Thẻ bo góc song song có chiều cao bằng khít tuyệt đối. Loại bỏ các giới hạn chiều rộng (max-w-7xl, max-w-5xl) trong Quiz Mode để mở rộng tràn viền (Edge-to-Edge) loại bỏ khoảng trống hai bên trên Desktop lớn. Hoàn tác độ rộng các Tab Dashboard phụ (Cá nhân, Bảng xếp hạng) ngoài phòng thi về lại kích thước hẹp ban đầu. Sửa lỗi responsive di động bằng cách xóa nút cáo nổi và thêm nút inline "Hỏi AI Tutor 🦊". Đồng bộ hóa câu trả lời tự luận khi chuyển câu hỏi và reset tiến trình khi chọn đề thi đã hoàn thành. | 4.0h |
| Nguyễn Vũ Trọng | Thiết kế và lập trình Phòng luyện kỹ năng thích ứng (AI Mentor) | ✅ Done | Tạo quyết định thiết kế ADR-004; định nghĩa types.ts & skills-manifest.json; lập trình createPracticeSlice.ts tích hợp useBoundStore.ts lưu trữ Elo/Mastery score; xây dựng skills-practice-tab.tsx, focus workspace (practice-workspace.tsx) tích hợp Socratic Chat AI Drawer; xây dựng MentorDashboard & BtcHeatmap; tích hợp page.tsx và biên dịch build thành công. | 3.5h |

**Tổng kết ngày:** Hoàn thiện tối ưu hóa giao diện Quiz Mode và Socratic Chat thích ứng: mở rộng giao diện tràn viền loại bỏ khoảng trống thừa trên Desktop lớn, cân chỉnh chiều cao các thẻ bên trái bằng khít tuyệt đối với cột AI Chat Sidebar bên phải, sửa hoàn toàn các lỗi responsive trên Mobile (xóa nút cáo nổi, thêm nút inline), đồng bộ hóa câu trả lời tự luận và reset tiến trình thi hoàn hảo. Đồng thời thiết kế và hiện thực hóa trọn vẹn **Phòng luyện kỹ năng thích ứng (AI Mentor)** bao gồm quản lý trạng thái Elo/Mastery score LocalStorage, không gian học tập Focus Workspace tích hợp Socratic AI Chat Drawer, giao diện phân quyền cho 3 Persona (Học viên, Mentor, BTC) và biên dịch dự án Next.js thành công 100%.

---

## 2026-06-16

| Member | Task | Status | Output | Time |
|--------|------|--------|--------|------|
| Hồ Tất Bảo Hoàng | Tinh chỉnh độ rộng sidebar Socratic Chat và kích thước nút bấm đồng bộ LeftBar | ✅ Done | Hợp nhất thanh điều hướng và thanh điều khiển Socratic Chat thành một sidebar rộng 64 (w-64), tinh chỉnh cỡ chữ, padding, kích thước icon đồng bộ với LeftBar. | 2.0h |
| Hồ Tất Bảo Hoàng | Loại bỏ Instructor Dashboard, thu gọn nút New Chat và hiển thị Adaptive Style động | ✅ Done | Loại bỏ hoàn toàn component Instructor Dashboard khỏi sidebar để giải phóng không gian hiển thị danh sách lịch sử chat, làm gọn nút New Chat thành dạng flat button, tích hợp logic hiển thị tên style thích ứng (Feynman/Deep/Challenge Style) động trên chat header dựa trên điểm Elo thực tế của concept đang chọn. | 1.0h |
| Hồ Tất Bảo Hoàng | Sửa lỗi deploy đăng ký tài khoản (thiếu thư viện supabase & gán role động) | ✅ Done | Bổ sung `supabase` vào `requirements.txt` để cài đặt trong Docker container trên Render, khắc phục lỗi hệ thống tự động rơi vào chế độ stub làm giả lập đăng ký không lưu DB. Đồng thời nâng cấp logic gán `role_id` động dựa trên bảng `roles` thay vì hardcode giá trị `1`. | 1.0h |
| Hồ Tất Bảo Hoàng | Sửa lỗi phân quyền schema PostgreSQL (error 42501 permission denied for schema app) | ✅ Done | Bổ sung các lệnh `GRANT USAGE` và `GRANT SELECT, INSERT, UPDATE, DELETE` cho hai schema `app` và `audit` cho các role `anon` và `authenticated` trong file migration SQL. | 0.5h |
| Hồ Tất Bảo Hoàng | Bổ sung khai báo cấu hình Supabase env vars vào render.yaml | ✅ Done | Thêm khai báo `SUPABASE_URL` và `SUPABASE_KEY` dạng placeholder vào `render.yaml` để nhắc nhở cấu hình trên Render. | 0.5h |
| Hồ Tất Bảo Hoàng | Thiết lập GitHub Actions scheduled cron job để ping giữ Render thức | ✅ Done | Tạo file `.github/workflows/keep-awake.yml` chạy định kỳ 10 phút/lần nhằm ping API/Web frontend để tránh chế độ sleep 15 phút của Render Free tier. | 0.5h |
| Hồ Tất Bảo Hoàng | Cải tiến logic đăng nhập không phân biệt hoa thường và khoảng trắng | ✅ Done | Cập nhật hàm login trong `auth_routes.py` thực hiện tìm kiếm user theo MSSV trước, sau đó so sánh `full_name` dạng strip/lowercase để tránh lỗi đăng nhập 401 khi người dùng nhập lệch hoa thường. | 0.5h |
| Hồ Tất Bảo Hoàng | Sửa lỗi giải nén nhị phân gzip của BFF Proxy trong Next.js | ✅ Done | Bổ sung cơ chế lọc loại bỏ header `Accept-Encoding` trong [route.ts](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/api/v1/%5B...path%5D/route.ts) khi BFF Proxy gửi request lên backend, ngăn chặn backend trả về dữ liệu nén gzip gây lỗi giải mã trên frontend. | 0.5h |
| Nguyễn Vũ Trọng | Cấu hình CI/CD tự động deploy API Backend lên Render | ✅ Done | Thiết lập cấu hình file `render.yaml` và GitHub Action `.github/workflows/deploy-render.yml` hỗ trợ build Docker image tự động và tự động deploy Backend lên môi trường Render. | 3.5h |

**Tổng kết ngày:** Hoàn thiện tinh chỉnh đồng bộ kích thước thanh điều hướng hợp nhất Socratic Chat, đảm bảo giao diện không bị giật lag hay nhảy kích thước khi chuyển tab. Đồng thời dọn dẹp các thành phần không cần thiết (Instructor Dashboard), làm phẳng các nút bấm cồng kềnh, đồng bộ hiển thị style dạy thích ứng động theo mức Elo RAG của concept, giải quyết triệt để lỗi không thể đăng ký tài khoản do thiếu thư viện supabase trên Render, bổ sung phân quyền sử dụng schema cho các role của Supabase để tránh lỗi 42501, cấu hình các biến môi trường Supabase trong file blueprint deploy, thiết lập thành công quy trình GitHub Actions tự động ping giữ Render thức 24/7, cải tiến logic đăng nhập không phân biệt hoa thường/khoảng trắng tránh lỗi 401, khắc phục lỗi giải mã gzip của BFF Proxy trong Next.js, và cấu hình thành công pipeline deploy Backend API tự động lên Render.

---

## 2026-06-17

| Member | Task | Status | Output | Time |
|--------|------|--------|--------|------|
| Nguyễn Phương Nam | Sửa lỗi trùng lặp key React khiến giao diện chat bị đơ | ✅ Done | Cập nhật hàm `generateMsgId` và `getInitialMessage` sử dụng cơ chế tạo ID ngẫu nhiên và duy nhất theo timestamp + random string, khắc phục triệt để lỗi Next.js Dev Overlay "6 issues" và khôi phục hoạt động cho luồng streaming. | 1.5h |
| Nguyễn Phương Nam | Tổng quát hóa tính năng trắc nghiệm tương tác cho mọi kiến thức | ✅ Done | Khử bỏ logic mock Next.js RSC ở frontend, tích hợp quy tắc `[QUY TẮC PHÁT SINH CÂU HỎI TRẮC NGHIỆM (QUIZ GENERATION)]` vào [prompts.yaml](file:///d:/AI%20Invidual%20Tutor/Source%20code/C2-App-125/config/prompts.yaml) để AI ở backend tự động trả về đúng cấu trúc chuẩn. Tinh chỉnh hàm `handleSendMessage` truyền song song câu hỏi gốc (`displayText` vs `customText`) để đánh giá đáp án chính xác trên môi trường stateless. | 2.5h |
| Nguyễn Phương Nam | Sửa lỗi không spawn được Git pre-push hook trên Windows | ✅ Done | Tinh chỉnh `setup_hooks.ps1` chuyển đổi ký tự xuống dòng của file hook `.git/hooks/pre-push` thành LF và ghi bằng định dạng UTF-8 không BOM. Đồng thời chuẩn hóa line endings của file `scripts/_pyrun.sh` sang LF để tránh lỗi spawn interpreter của Git Bash. | 0.5h |
| Nguyễn Vũ Trọng | Sửa lỗi backend PR validation, linting & tests | ✅ Done | Dọn dẹp 5 lỗi linting (unused imports và unused variables) trong `src/api/adaptive_routes.py` và `src/api/auth_routes.py`. Khắc phục lỗi `TypeError` không thể khởi tạo `SupabaseAdaptiveDatabase` bằng cách bổ sung hàm `submit_attempt_v2` kế thừa từ `AdaptiveDatabaseInterface` giúp vượt qua toàn bộ 33 test cases. | 2.0h |

**Tổng kết ngày:** Khắc phục thành công lỗi đơ màn hình chat do trùng lặp key React, hoàn thành tổng quát hóa tính năng tạo câu hỏi trắc nghiệm tương tác từ AI, sửa lỗi không thể spawn Git pre-push hook trên môi trường Windows, đồng thời dọn dẹp triệt để các lỗi linting backend và khắc phục lỗi kế thừa thiếu phương thức trừu tượng trong `SupabaseAdaptiveDatabase` giúp toàn bộ 33/33 test cases hoạt động trơn tru.

---

## 2026-06-18

| Member | Task | Status | Output | Time |
|--------|------|--------|--------|------|
| Nguyễn Phương Nam | Triển khai bộ lọc Metadata Pre-filtering cho RAG | ✅ Done | Thêm logic lấy `concept_code` và trích xuất ngày học (`day_num`) từ database trong [rag.py](file:///d:/AI%20Invidual%20Tutor/Source%20code/C2-App-125/src/services/rag.py). Tạo regex tương ứng truyền vào hàm `match_slides` để lọc tên tài liệu học liệu theo ngày, triệt tiêu slide nhiễu. | 4.0h |
| Nguyễn Phương Nam | Tạo cơ sở dữ liệu migration cho Metadata Pre-filtering | ✅ Done | Viết migration `20260617_add_metadata_filter_to_match_slides.sql` cập nhật hàm RPC `match_slides` nhận và áp dụng tham số lọc regex `filter_document_regex`. | 1.0h |

**Tổng kết ngày:** Triển khai thành công tính năng lọc trước học liệu RAG theo ngày học để cải thiện độ chính xác câu trả lời và trích dẫn của Chatbot, bao gồm viết migration SQL và cập nhật service xử lý RAG.

---

## 2026-06-19

| Member | Task | Status | Output | Time |
|--------|------|--------|--------|------|
| Nguyễn Phương Nam | Sửa lỗi RAG không tìm thấy tài liệu & bổ sung global fallback | ✅ Done | Triển khai cơ chế tự động tìm kiếm toàn cục (global fallback search) trong [rag.py](file:///d:/AI%20Invidual%20Tutor/Source%20code/C2-App-125/src/services/rag.py) nếu tìm kiếm có bộ lọc trả về similarity < 0.42 nhưng tìm kiếm toàn cục có kết quả cao, đảm bảo AI luôn trả lời được câu hỏi chung. | 2.5h |
| Nguyễn Phương Nam | Chuyển chủ đề khởi tạo mặc định sang Hỏi đáp tự do | ✅ Done | Cập nhật [socratic-chat-tab.tsx](file:///d:/AI%20Invidual%20Tutor/Source%20code/C2-App-125/frontend/components/dashboard/socratic-chat-tab.tsx) đặt chủ đề mặc định ban đầu là `'general'` ("Hỏi đáp tự do") và đưa lên vị trí đầu tiên của danh sách để học viên hỏi đáp tự do kiến thức AI. | 1.5h |
| Nguyễn Phương Nam | Giải quyết xung đột Git merge nhánh dev | ✅ Done | Xác minh trạng thái xung đột nhánh `dev` vào `namnp/test-deploy`, kiểm tra và làm sạch các tập tin để hoàn tất merge không lỗi. | 1.0h |
| Nguyễn Vũ Trọng | Cấu hình gated CI/CD và cập nhật hạ tầng deploy | ✅ Done | Loại bỏ Frontend khỏi render.yaml (Render Blueprint), cấu hình top-level `outputFileTracingIncludes` trong next.config.ts để đóng gói assets tĩnh trên Vercel Serverless Functions, tạo quyết định kiến trúc ADR-013 và viết script check_production_ready.py kiểm định tự động 20 tiêu chí vận hành sản xuất của Bài 12. | 4.5h |
| Nguyễn Vũ Trọng | Hiện thực hóa Readiness checks và tích hợp Quality Gates | ✅ Done | Viết endpoint `/ready` kết nối DB/Cache, thêm unit tests trong test_routes.py, cập nhật ci-backend.yml chạy ruff lint, pytest, check_production_ready, run_golden_eval, docker build, Trivy scan và Render Webhook, cập nhật ci-frontend.yml chạy pnpm build trước khi deploy CLI, và viết cẩm nang vận hành chi tiết trong thư mục plans/. | 4.5h |

**Tổng kết ngày:** Hoàn thiện cơ chế fallback của RAG tăng tính linh hoạt, đặt chủ đề mặc định của trợ lý AI về Hỏi đáp tự do theo đúng yêu cầu học viên, và giải quyết thành công xung đột Git merge. Thiết kế và triển khai thành công quy trình Gated CI/CD Pipeline có kiểm duyệt chất lượng nghiêm ngặt trước khi deploy. Đã tách biệt hạ tầng Next.js Frontend (Vercel) và FastAPI Backend (Render), cấu hình endpoint `/ready` tự động ping DB/Cache, sửa lỗi gộp key `outputFileTracingIncludes` về cấp cao nhất của Next.config để tránh lỗi biên dịch TypeScript, xây dựng script kiểm định 20 tiêu chuẩn vận hành sản xuất của Bài 12 (check_production_ready.py), hoàn tất tích hợp bảo mật Trivy/độ thông minh AI (Golden cases) vào GitHub Actions để kích hoạt tự động CD qua Webhook, và hoàn thiện cẩm nang hướng dẫn triển khai nhanh/gỡ lỗi chi tiết tại plans/20260619-1722-gated-cicd-deployment/README.md.

---

## 2026-06-20

| Member | Task | Status | Output | Time |
|--------|------|--------|--------|------|
| Nguyễn Phương Nam | Tích hợp Prompt Caching (Split Prompts), Intent Router, Socratic Reflection, Trí nhớ Kép, hiện thực hóa Option E (Hybrid LangGraph Stream), sửa lỗi bộ lọc mock Next.js RSC và sửa lỗi trùng lặp key React ('user-11') ở Frontend | ✅ Done | Tách system prompt thành tĩnh/động để tối ưu Prompt Caching của OpenAI, đạt cache hit ~77% ở các lượt sau, giúp TTFT giảm 4-6 lần (~1.4s xuống ~250ms) và tiết kiệm 30% chi phí. Triển khai Intent Router phân loại ý định, tự động bypass RAG/citation. Tích hợp Socratic Reflection Agent và Trí nhớ Kép vào đồ thị LangGraph và hiện thực hóa thành công Option E (Hybrid LangGraph Stream) gọi agent.ainvoke trong stream_chat_response để chạy kiểm duyệt ngầm ở backend, sau đó cắt nhỏ chuỗi kết quả để mô phỏng stream token qua SSE về Client. Sửa lỗi hiển thị Quiz và Citation Validator. Thêm endpoint benchmark chẩn đoán, cập nhật GEMINI.md cấm tự động dùng trình duyệt, sửa lỗi bộ lọc mock 'tạo câu hỏi' quá rộng trong useSocraticChat.ts và chuyển đổi hàm generateMsgId trong useSocraticChat.ts sang dạng sinh ID ngẫu nhiên kèm timestamp để tránh trùng lặp key. | 9.5h |

**Tổng kết ngày:** Hoàn thành tối ưu hóa Prompt Caching tự động của OpenAI bằng kiến trúc Split Prompts, tích hợp Intent Router loại bỏ RAG/citations thừa cho chit-chat, xây dựng Socratic Reflection Agent và Trí nhớ Kép (short-term & long-term), triển khai thành công Option E (Hybrid LangGraph Stream) thống nhất đồ thị StateGraph với luồng phản hồi stream SSE của Chatbot, sửa lỗi hiển thị quiz trắc nghiệm, lỗi bắt nhầm từ khóa 'tạo câu hỏi' của mock checker và lỗi trùng lặp key React 'user-11' do cơ chế đếm ID tĩnh trong useSocraticChat.ts ở Frontend, bổ sung API benchmark chẩn đoán 7 lượt hội thoại và cập nhật quy định cấm sử dụng trình duyệt để bảo toàn quota.

---

## 2026-06-22

| Member | Task | Status | Output | Time |
|--------|------|--------|--------|------|
| Nguyễn Phương Nam | Tối ưu hóa độ trễ kiểm định Socratic (Option A + B) | ✅ Done | Tích hợp điều kiện bypass Critic Node trực tiếp tại check_reflection cho các câu hỏi general. Tối ưu hóa llm.bind (response_format='json_object', max_tokens=150, temperature=0.0) tại pedagogical_reflection_node.py cùng với cơ chế lọc tránh lỗi mock object trong tests. Khắc phục lỗi kiểm thử is_general_query_heuristic do thiếu từ khóa "chào bạn". Loại trừ "chọn đáp án" để sửa lỗi trigger nhầm cảnh báo trung thực học thuật ở Frontend. Loại bỏ hoàn toàn logic mock quiz Next.js RSC ở Frontend để chuyển giao toàn bộ luồng tạo và chấm đáp án trắc nghiệm về cho Backend API xử lý thật. | 3.5h |
| Nguyễn Phương Nam | Triển khai stream quá trình suy nghĩ và sử dụng công cụ qua SSE và giao diện Accordion phong cách Terminal | ✅ Done | Tích hợp phát sự kiện custom event (tool_call, tool_result, token) từ LangGraph nodes. Cấu hình stream_chat_response sử dụng astream_events v2 để phát sự kiện SSE theo thời gian thực. Cập nhật useSocraticChat và ai-message-item ở Frontend hiển thị Accordion suy nghĩ tự động co giãn cùng nhật ký console/terminal gọi công cụ (RAG, Sandbox). | 4.0h |
| Nguyễn Vũ Trọng | Khởi tạo cấu trúc giao diện mock cho vai trò Mentor & Admin trên Frontend | ✅ Done | Khởi tạo cấu trúc giao diện mockup hoàn chỉnh cho vai trò Mentor và Admin (layout, sidebar, hook) cùng màn hình đăng nhập nhanh theo vai trò (role-based quick login). | 3.5h |

**Tổng kết ngày:** Triển khai kết hợp Option A và Option B để tối ưu hóa độ trễ phản hồi Socratic ngầm. Đồng thời sửa lỗi kiểm thử heuristic chào hỏi, sửa lỗi hiển thị cảnh báo trung thực học thuật và loại bỏ hoàn tất mock quiz ở Frontend thành công. Thêm vào đó, hoàn thành xuất sắc tính năng truyền phát (streaming) quá trình suy nghĩ và sử dụng công cụ thời gian thực từ LangGraph qua SSE, hiển thị trực quan và sống động dưới dạng Accordion Terminal trên Frontend. Khởi tạo thành công cấu trúc giao diện mock hoàn chỉnh cho Mentor & Admin Portal (layout, sidebar, hook) và màn hình đăng nhập nhanh theo vai trò ở Frontend.

---

## 2026-06-23

| Member | Task | Status | Output | Time |
|--------|------|--------|--------|------|
| Nguyễn Vũ Trọng | Thiết kế và hoàn thiện các phân vùng Workspace giả lập trên Frontend cho Mentor Portal | ✅ Done | Tái cấu trúc giao diện `ClassInsightsTab` thành hai tiểu tab Overview và Student Directory, hỗ trợ hiển thị hồ sơ học sinh giả định, lịch sử làm bài mock (attempt logs) và lưu trữ ghi chú Mentor (`mentor notes`) qua localStorage. Thiết kế giao diện `IngestionTab` (gồm danh sách tài liệu và đồ thị kiến thức mock). Tích hợp giao diện panel tham chiếu slide nguồn RAG mock vào `QuizEditorTab`. | 4.0h |

**Tổng kết ngày:** Tái thiết kế các Workspace quản lý lớp học, nạp tài liệu và chỉnh sửa câu đố tương tác RAG bằng dữ liệu mô phỏng ở Frontend.

---

## 2026-06-24

| Member | Task | Status | Output | Time |
|--------|------|--------|--------|------|
| Nguyễn Vũ Trọng | Tích hợp sơ đồ Skill DAG Graph mock, các biểu đồ trực quan mock và tối ưu hóa luồng điều hướng mock ở Frontend | ✅ Done | Tích hợp component `MentorSkillTreeGraph` sử dụng `@xyflow/react` vẽ sơ đồ phụ thuộc kỹ năng và mức độ thông thạo giả định của học sinh. Vẽ các biểu đồ học tập trực quan (Elo trend, XP activity, Memory Decay) bằng `recharts` với dữ liệu mock. Cấu hình luồng chuyển tab thông minh từ Dashboard sang Quiz Editor kèm tự động lọc theo tài liệu mock. Hỗ trợ hiển thị giao diện xem slide RAG gốc mô phỏng và đồng bộ màu sắc trạng thái Mastered/Learning giả định trên giao diện. | 8.0h |

**Tổng kết ngày:** Hoàn thiện sơ đồ phụ thuộc kỹ năng DAG tương tác mock, tích hợp biểu đồ thống kê học tập và đường cong quên lãng mock ở Frontend, đồng thời nâng cấp trải nghiệm biên tập câu hỏi với tính năng điều hướng lọc thông minh giả định.

---

## 2026-06-27

| Member | Task | Status | Output | Time |
|--------|------|--------|--------|------|
| Nguyễn Phương Nam | Cải tiến UX Quiz: Di chuyển Hint, giữ Hint sau trả lời, gợi ý bài học khi sai | ✅ Done | Di chuyển khối Hint xuống cuối khu vực câu hỏi trong [quiz-question-view.tsx](file:///d:/AI%20Invidual%20Tutor/Source%20code/C2-App-125/frontend/components/quiz/quiz-question-view.tsx). Cập nhật logic giữ Hint hiển thị sau khi trả lời (`isSubmitted === true`). Thêm khối "Gợi ý bài học" (icon `BookOpen`) hiển thị khi trả lời sai, nội dung từ trường `hint`/`explanation`. | 1.5h |
| Nguyễn Phương Nam | Tích hợp tính năng Báo lỗi câu hỏi Quiz (UI + Backend API) | ✅ Done | Thêm nút "Báo lỗi" (icon `AlertTriangle`) hiển thị sau khi trả lời. Modal chọn lý do + mô tả chi tiết. Toast thông báo kết quả. Tạo endpoint `POST /api/v1/quiz/report` với Pydantic model `QuizReportRequest` trong [routes.py](file:///d:/AI%20Invidual%20Tutor/Source%20code/C2-App-125/src/api/routes.py), lưu file local `outputs/quiz_reports.jsonl` + insert bảng `app.feedback_events`. | 2.0h |
| Nguyễn Phương Nam | Khắc phục lỗi chặn RLS trên Supabase đối với bảng feedback_events | ✅ Done | Thiết lập 2 RLS policies permissive (`INSERT` và `SELECT` giới hạn 10s gần nhất) cho role `anon` trên bảng `app.feedback_events` để đảm bảo thực thi lệnh ghi nhận báo cáo lỗi thành công khi sử dụng REST API (PostgREST) kèm cơ chế `RETURNING *`. Cập nhật file SQL migration [20260627_disable_rls_feedback_events.sql](file:///d:/AI%20Invidual%20Tutor/Source%20code/C2-App-125/db/supabase/migrations/20260627_disable_rls_feedback_events.sql). | 2.5h |
| Nguyễn Phương Nam | Khắc phục lỗi HTTP 422 (Unprocessable Content) và bổ sung logs validation | ✅ Done | Bổ sung custom exception handler cho `RequestValidationError` trong [main.py](file:///d:/AI%20Invidual%20Tutor/Source%20code/C2-App-125/src/main.py) giúp tự động in chi tiết lỗi Pydantic ra terminal. Thực hiện ép kiểu chuỗi bằng `String(...)` và chuẩn hóa giá trị `undefined`/rỗng về `null` cho các trường payload gửi đi trong [quiz-question-view.tsx](file:///d:/AI%20Invidual%20Tutor/Source%20code/C2-App-125/frontend/components/quiz/quiz-question-view.tsx) ở Frontend. | 2.0h |
| Nguyễn Vũ Trọng | Triển khai Đăng ký & Đăng nhập (Email/Password Auth) | ✅ Done | Chuyển đổi cơ chế xác thực từ Họ tên & MSSV sang Email & Mật khẩu kết nối Supabase Auth API, viết script seed tài khoản mẫu đồng bộ UUID và gán roles, cập nhật FastAPI backend endpoints truyền/nhận và xác thực JWT token qua Authorization Header. | 6.0h |
| Nguyễn Vũ Trọng | Thiết lập ranh giới phân quyền RBAC & Triển khai Ingestion/Audit log | ✅ Done | Phát triển dependency xác thực tập trung `get_current_user` và `require_role`, áp dụng guards cho `/chat`, `/student/mastery/history`, `/quiz/report`, tích hợp chạy thật BackgroundTasks nạp slide và APIs audit decisions/rewards, bổ sung test suite test_rbac.py xanh 100%. | 4.0h |
| Nguyễn Vũ Trọng | Khắc phục các cảnh báo dependency React Hooks trong Frontend | ✅ Done | Bọc `fetchRecommendation` bằng `useCallback`, bổ sung mảng phụ thuộc cho `useEffect` trong `ZpdWidget.tsx` và `useSocraticSidebar.ts` giúp dọn sạch cảnh báo ESLint, biên dịch build frontend thành công 100%. | 1.0h |

**Tổng kết ngày:** Hoàn thành cải tiến UX Quiz bao gồm di chuyển Hint xuống cuối, giữ Hint sau khi trả lời, hiển thị gợi ý bài học khi sai. Tích hợp trọn vẹn tính năng Báo lỗi câu hỏi Quiz (nút Báo lỗi + Modal + Toast + Backend API + lưu Supabase). Khắc phục triệt để lỗi ghi dữ liệu báo lỗi lên Supabase do chính sách Row-Level Security (RLS) và sửa lỗi HTTP 422 do không khớp kiểu dữ liệu giữa Frontend và Backend. Hoàn thành tích hợp và chuyển đổi toàn diện hệ thống xác thực sang Email/Password Auth kết nối Supabase Auth, bảo toàn dữ liệu qua script seed Admin API. Đồng thời thiết lập ranh giới phân quyền RBAC chặt chẽ cho toàn bộ API endpoints (/chat, /student/mastery/history, /quiz/report), tích hợp chạy nền nạp slide an toàn cùng hệ thống audit logs chuyên dụng chỉ dành riêng cho giảng viên và ban tổ chức. Dọn sạch 100% cảnh báo linter tĩnh ở Frontend (`react-hooks/exhaustive-deps` trong `ZpdWidget.tsx` và `useSocraticSidebar.ts`) đảm bảo build sản xuất thành công.---

## 2026-06-25

| Member | Task | Status | Output | Time |
|--------|------|--------|--------|------|
| Nguyễn Vũ Trọng | Phân tích và khắc phục lỗi fetching data khi kích hoạt Row Level Security (RLS) | ✅ Done | Tạo migration SQL `db/supabase/migrations/20260626_fix_and_enable_rls.sql` thiết lập RLS trên toàn bộ 32 bảng của hệ thống, cấp quyền SELECT cho anon trên các bảng nội dung học tập và INSERT/UPDATE trên bảng khảo sát. | 4h |
| Nguyễn Vũ Trọng | Cải tiến cơ chế xác thực Token tại Backend và khắc phục lỗi dependency Frontend | ✅ Done | Cập nhật logic `get_current_student_id` và `require_teacher` tại `src/api/adaptive_routes.py` để xác thực token UUID trực tiếp qua `app.users` thay vì `auth.users`. Chạy `npm install` khắc phục lỗi thiếu package `@supabase/ssr` trên frontend. | 4h |

**Tổng kết ngày:** Khắc phục triệt để sự cố chặn truy cập dữ liệu khi bật RLS trên Supabase Dev, cho phép Frontend tải thông tin học tập và khảo sát thành công. Cập nhật cơ chế xác thực token ở Backend FastAPI phù hợp với luồng login tùy chỉnh của hệ thống, đồng thời sửa lỗi thiếu thư viện `@supabase/ssr` trên Frontend giúp dự án chạy cục bộ ổn định.

---

## 2026-06-28

| Member | Task | Status | Output | Time |
|--------|------|--------|--------|------|
| Nguyễn Vũ Trọng | Khắc phục lỗi phân quyền `/sync-mastery` và `/mastery` bảo toàn tiến trình học viên | ✅ Done | Refactor 4 endpoints `/sync-mastery`, `/mastery`, `/recommend`, và `/submit` ở Backend sang `get_current_user` kết hợp so sánh chéo ID token; xác thực lưu tiến trình học viên đã ẩn danh thành công trong database. | 2.0h |

**Tổng kết ngày:** Giải quyết triệt để lỗi phân quyền 403 Forbidden gây mất tiến trình học tập của sinh viên khi làm bài tập tự luyện và reset trang.

---

## 2026-06-29

| Member | Task | Status | Output | Time |
|--------|------|--------|--------|------|
| Nguyễn Phương Nam | Tối ưu luồng mở AI Tutor & Thẻ Foxy Card gợi ý bài học | ✅ Done | Tắt luồng tự động mở sidebar Socratic khi học viên trả lời sai để giảm phiền nhiễu. Bọc thông báo sai thành thẻ tương tác cam, có hiệu ứng chuyển động cáo và hover sliding arrow. | 2.5h |
| Nguyễn Phương Nam | Tích hợp Markdown Parser cho AI Socratic Chat | ✅ Done | Đưa component SocraticMarkdown vào hiển thị tin nhắn AI trong sidebar giúp parse chữ đậm, danh sách và code block sang Rich Text. | 1.0h |
| Nguyễn Phương Nam | Bỏ tin nhắn chào mừng chuyển câu hỏi tự động của AI Tutor | ✅ Done | Loại bỏ việc tự động gửi thêm tin nhắn chào mừng chuyển câu hỏi của AI trong sidebar để giữ lịch sử sạch sẽ. | 0.5h |
| Nguyễn Phương Nam | Tối ưu hóa Citation Badge & Tích hợp Slide Zoom Lightbox Modal | ✅ Done | Sử dụng CitationsBlock để thu gọn thẻ tài liệu dọc thành các badge nằm ngang xếp gọn. Thiết lập viewport-wide Lightbox Modal hiển thị ảnh slide chất lượng cao khi nhấn nút xem slide dẫn chứng. | 3.5h |
| Nguyễn Phương Nam | Sửa lỗi Hot Reload React dependencies & lỗi cú pháp build | ✅ Done | Cố định mảng dependency trong useEffect tránh lỗi Fast Refresh, và sửa lỗi cú pháp comment làm hỏng khai báo SocraticChatBodyProps giúp Turbopack build mượt mà. | 1.0h |

**Tổng kết ngày:** Hoàn tất tối ưu hóa toàn bộ luồng tương tác và giao diện hiển thị của AI Tutor trong phòng thi: chuyển đổi sang chế độ chủ động gọi mở qua Foxy Card gọn gàng, làm sạch lịch sử chat, đồng bộ định dạng Rich Text Markdown, thu gọn Badge tài liệu trích dẫn và triển khai hoàn chỉnh cửa sổ phóng to slide bài học bổ trợ độ phân giải cao phục vụ học tập thích ứng.


---

## 2026-06-30

| Member | Task | Status | Output | Time |
|--------|------|--------|--------|------|
| Nguyễn Phương Nam | Thiết kế và tích hợp RAG Sandbox Control Center tương tác cho Mentor (Concept Rules, Slide Edit & Re-embed, Ground Truth Eval Dataset) | ✅ Done | Khởi tạo 2 bảng DB `app.concept_rules` và `app.rag_eval_dataset` trên Supabase; triển khai endpoints backend PATCH `/api/v1/audit/slide-embeddings`, GET/POST `/api/v1/audit/concept-rules`, và POST `/api/v1/audit/eval-dataset`; tích hợp luật prompt tùy biến vào System Prompt RAG test; xây dựng UI/UX tương tác gồm 3 Modals (Luật Prompt, Sửa Slide, Lưu Ground Truth) co giãn đối xứng tại Frontend; vượt qua 5/5 bài kiểm tra checklist chất lượng. | 6h |

**Tổng kết ngày:** Hoàn thiện và nâng cấp màn hình Kiểm tra RAG từ Sandbox tĩnh thành RAG Control Center tương tác hoàn chỉnh cho Mentor role, hỗ trợ sửa slide cập nhật vector embedding tức thì, đè luật prompt theo chủ đề và xuất tập dữ liệu Ground Truth phục vụ đánh giá tự động.

---

## 2026-06-30

| Member | Task | Status | Output | Time |
|--------|------|--------|--------|------|
| Codex | Hardening auth, onboarding, demo fallback, and mock data contracts | ✅ Done | Closed raw UUID/fake-token live auth bypass, removed frontend `userId` bearer fallback, gated demo login/chat/mock dashboards behind explicit demo mode, fixed onboarding hydration/pending sync behavior, and updated architecture/env docs. Verified `npm run lint`, `npm run build`, and backend API suites (`51 passed, 4 skipped`). | 5h |
| Codex | Supabase key contract and auth verification hardening | ✅ Done | Standardized backend Supabase access around `SUPABASE_SECRET_KEY`, removed public-key fallbacks from privileged adapters, added optional JWKS local JWT verification with measured `auth.get_user` fallback, and documented the publishable/secret key boundary. | 2h |

**Tổng kết ngày:** Hoàn tất hardening luồng từ landing/login/onboarding vào app: production auth fail-closed qua Supabase JWT, demo mode tách bằng env flag, onboarding không kẹt hydration và không âm thầm coi local pending là persisted, các bề mặt Mentor/BTC/Profile không còn hiển thị dữ liệu mô phỏng như dữ liệu vận hành thật.

---

## 2026-07-02

| Member | Task | Status | Output | Time |
|--------|------|--------|--------|------|
| Nguyễn Vũ Trọng | Sinh bộ câu hỏi Quiz trắc nghiệm, cấu hình Adaptive và di trú dữ liệu Ngày 11 đến 15 | ✅ Done | Hoàn thành sinh 15 tệp JSON câu hỏi cho các ngày 11-15 (basics, pipeline, advanced) đạt chuẩn Quality Gates. Cấu hình định danh concept adaptive, sửa lỗi lệch tên ngày học Day 13 trên UI, cập nhật skills manifest và map concept trong `concept-map.ts`/`concept-code-aliases.ts`. Đồng bộ hóa thành công dữ liệu lên Supabase qua `migrate_quizzes.py`. | 7.0h |
| Nguyễn Vũ Trọng | Sinh bộ câu hỏi Quiz trắc nghiệm và di trú dữ liệu Ngày 16 (3 tracks) | ✅ Done | Hoàn thành sinh 9 tệp JSON câu hỏi Ngày 16 (3 tracks: AI Product, RAG Data, Agent Builder) đạt chuẩn Quality Gates. Đăng ký các track/concept mới trong `seed_concepts_dag.sql` và cấu hình adaptive frontend. Đồng bộ hóa dữ liệu thành công qua `migrate_quizzes.py`. | 5.5h |

**Tổng kết ngày:** Sinh thành công và đồng bộ hóa các bộ câu hỏi trắc nghiệm từ Day 11 đến Day 16 (bao gồm các track đặc thù của Day 16) lên CSDL Supabase. Đồng thời cấu hình thành công cơ chế Adaptive tương ứng trên frontend.

---

## 2026-07-03

| Member | Task | Status | Output | Time |
|--------|------|--------|--------|------|
| Nguyễn Vũ Trọng | Sinh bộ câu hỏi Quiz trắc nghiệm và di trú dữ liệu Ngày 17 đến 25 (3 tracks) | ✅ Done | Hoàn thành sinh và kiểm định 81 tệp JSON câu hỏi cho 3 tracks của các ngày từ 17 đến 25 (tổng cộng 810 câu hỏi) đạt chuẩn Quality Gates. Cập nhật các cấu hình adaptive frontend (skills-manifest, concept-map, aliases, curriculum) và sửa lỗi trùng lặp key trong đề Day 22. Đồng bộ hóa thành công dữ liệu lên CSDL qua `migrate_quizzes.py`. | 4.5h |
| Nguyễn Vũ Trọng | Sinh bộ câu hỏi Quiz trắc nghiệm và di trú dữ liệu Ngày 26 (3 tracks) | ✅ Done | Hoàn thành sinh và kiểm định 9 tệp JSON câu hỏi cho 3 tracks của Day 26 (tổng cộng 90 câu hỏi) đạt chuẩn các chỉ số chất lượng. Cấu hình adaptive frontend, skills manifest, cập nhật program curriculum và di trú thành công lên Supabase. | 1.0h |
| Nguyễn Vũ Trọng | Triển khai bộ lọc set_id giới hạn theo Day 16+ trong chế độ Luyện tập thích ứng | ✅ Done | Cập nhật script migration đính kèm `set_id` vào `answer_key` cho toàn bộ câu hỏi (1210 câu). Tinh chỉnh `get_candidate_questions_meta` trong database adapter `supabase_database.py` để chọn và trả về `answer_key`. Tích hợp trường `set_id` vào backend `RecommendRequest` schema và route `/recommend` (chỉ lọc theo `set_id` cho Day 16+). Cập nhật API client và custom hook `useQuizSession` ở frontend truyền `setId`. Kiểm thử 18/18 test cases của adaptive API thành công. | 1.0h |

**Tổng kết ngày:** Hoàn thành xuất sắc việc sinh, kiểm định và đồng bộ toàn bộ bộ câu hỏi trắc nghiệm cho các Ngày 17 đến 26 (tổng cộng 90 tệp JSON, 900 câu hỏi) qua 3 tracks chuyên môn. Triển khai và kiểm thử thành công bộ lọc `set_id` cho chế độ Luyện tập thích ứng để giải quyết triệt để lỗi hiển thị nhầm lẫn giữa Basics/Pipeline/Advanced từ Day 16 trở đi. Cập nhật thành công cấu hình frontend và di trú đồng bộ lên database.

---

## 2026-07-04

| Member | Task | Status | Output | Time |
|--------|------|--------|--------|------|
| Nguyễn Phương Nam | Sửa lỗi phông chữ Tiếng Việt (Mojibake) trên Frontend Next.js | ✅ Done | Khôi phục mã hóa ký tự UTF-8 cho 8 files giao diện chat và bảng giám sát của mentor bị lỗi hiển thị ký tự lạ (CP1252 decoder). | 2h |
| Nguyễn Phương Nam | Phát triển hệ thống kiểm thử tự động Ragas-equivalent và ghi báo cáo chất lượng RAG/Socratic | ✅ Done | Thiết lập script [run_ragas_eval.py](file:///d:/AI%20Invidual%20Tutor/Source%20code/C2-App-125/scripts/run_ragas_eval.py) gọi LLM-as-a-judge tự động đánh giá 3 chỉ số Faithfulness, Relevance, và Socratic; ghi báo cáo ra [ragas_eval_report.md](file:///d:/AI%20Invidual%20Tutor/Source%20code/C2-App-125/outputs/ragas_eval_report.md); cấu hình tránh lỗi `UnicodeEncodeError` trên console Windows. | 3.5h |
| Nguyễn Phương Nam | Mở rộng bộ dữ liệu kiểm thử chất lượng Golden Test lên 10 cases | ✅ Done | Thêm 4 test cases nâng cao (TC-007 đến TC-010) vào [golden-test-cases.json](file:///d:/AI%20Invidual%20Tutor/Source%20code/C2-App-125/docs/domain-knowledge/golden-test-cases.json) (lỗi Git conflict, React component assignment, giải thích API, phân biệt GET/POST HTTP trong Quiz) để tăng độ phủ kiểm thử. | 1.5h |
| Nguyễn Phương Nam | Đề xuất các phương án UI/UX quản lý phản hồi AI và RAG Audit Tab | ✅ Done | Viết đề xuất [feedback_ui_proposal.md](file:///C:/Users/ADMIN/.gemini/antigravity-ide/brain/1d755ad3-30eb-474b-ba8a-85707e838e13/feedback_ui_proposal.md) kèm hình ảnh mockup so sánh 3-Pane Explorer, Kanban Board và Focus Card Deck theo phong cách Sapia. | 1.5h |

**Tổng kết ngày:** Phục hồi thành công phông chữ Tiếng Việt (Mojibake) bị lỗi trên Frontend. Phát triển và chạy kiểm thử tự động LLM-as-a-judge (Ragas-equivalent) trên bộ Golden Test mở rộng lên 10 cases, phát hiện chính xác lỗ hổng bảo mật học thuật rò rỉ mã nguồn của AI để chuẩn bị cho việc tối ưu Prompt. Soạn thảo đề xuất và mockup UI RAG Audit Tab theo phong cách Sapia.

---

## 2026-07-06

| Member | Task | Status | Output | Time |
|--------|------|--------|--------|------|
| Nguyễn Phương Nam | Tổng hợp Evaluation Evidence cho AI chatbot | Done | Tạo và đồng bộ bộ artifact `eval/results/chatbot_evidence/` gồm pytest output + coverage, RAGAS metrics, latency summary, HTML coverage và các biểu đồ SVG. Cập nhật `chatbot_evaluation_evidence.md` để trình bày bảng test results, RAGAS-equivalent metrics và performance metrics trực quan. | 2.0h |
| Nguyễn Phương Nam | Sửa Golden Evaluation Report chạy đủ 10 cases | Done | Cập nhật `scripts/run_golden_eval.py` để lấy tổng số test case động từ `golden-test-cases.json`, cấu hình UTF-8 trên Windows, truyền đúng `student_profile` vào LangGraph state, thêm cột Guardrail/Overall và regenerate `outputs/golden_eval_report.md` với đủ TC-001 đến TC-010. | 1.5h |
| Nguyễn Phương Nam | Phân tích và sửa lỗi TC-008 vi phạm Guardrail/Socratic | Done | Xác định nguyên nhân TC-008 bị fallback sang intent `general` khi RAG không tìm thấy slide, khiến bypass `respond_academic` và `pedagogical_reflection`. Thêm `is_academic_integrity_risk()` trong `analyze_node.py`, gắn metadata `academic_integrity_risk`, giữ intent `academic`, chặn route general, buộc qua critic và thêm safe fallback không sinh code/lời giải hoàn chỉnh. | 3.0h |
| Nguyễn Phương Nam | Hardening response/reflection cho direct-cheating assignment request | Done | Cập nhật `respond_node.py` với hard instruction và deterministic fallback khi không có RAG context; cập nhật `pedagogical_reflection_node.py` để không fail-open sau retry limit với academic-integrity-risk; cập nhật `graph.py` để rủi ro academic integrity luôn đi qua critic. | 2.0h |
| Nguyễn Phương Nam | Cập nhật RAGAS judge và regenerate report/evidence | Done | Cập nhật `scripts/run_ragas_eval.py` để truyền đúng profile/category và judge mọi `direct_cheating` theo logic refuse-and-guide. Regenerate `outputs/ragas_eval_report.md`; TC-008 đạt Faithfulness 5/5, Relevance 5/5, Socratic 5/5; average Socratic tăng lên 4.30/5. Đồng bộ `ragas_metrics_summary.csv`, `ragas_average_metrics.svg`, `ragas_case_scores.svg`. | 1.5h |
| Nguyễn Phương Nam | Bổ sung regression tests cho guardrail TC-008 | Done | Thêm test cho detector academic-integrity-risk, analyze-node không fallback sang general, graph buộc qua critic, retry-limit trả safe fallback và respond-node trả safe fallback khi no-RAG. Xác minh `uv run python -m pytest tests\test_agents\test_intent_router.py tests\test_agents\test_memory_reflection.py tests\test_api\test_chat_stream.py -q` → 26 passed; `git diff --check` sạch; `py_compile` các script/node chính pass. | 1.5h |
| Nguyễn Vũ Trọng | Sinh bộ câu hỏi Quiz trắc nghiệm và di trú dữ liệu Ngày 27 (3 tracks) | Done | Hoàn thành sinh và kiểm định 9 tệp JSON câu hỏi cho 3 tracks của Day 27 (tổng cộng 90 câu hỏi) đạt chuẩn các chỉ số chất lượng (schema, option balance, answer distribution). Cấu hình adaptive frontend, skills manifest, cập nhật program curriculum và di trú thành công lên Supabase. | 1.5h |
| Nguyễn Vũ Trọng | Sinh bộ câu hỏi Quiz trắc nghiệm và di trú dữ liệu Ngày 28 (3 tracks) | ✅ Done | Hoàn thành sinh và kiểm định 9 tệp JSON câu hỏi cho 3 tracks của Day 28 (tổng cộng 90 câu hỏi) đạt chuẩn các chỉ số chất lượng (schema, option balance, answer distribution). Cập nhật cấu hình adaptive frontend (curriculum, manifests, maps, aliases) và di trú thành công lên Supabase qua `migrate_quizzes.py`. | 1.5h |
| Nguyễn Vũ Trọng | Tách biệt giao diện Socratic Chat & Cô lập LocalStorage theo Persona | ✅ Done | Di chuyển Socratic Chat sang thư mục `student/` và `mentor-admin/`, tách biệt và cô lập các khóa LocalStorage cho trạng thái collapsed và active session id của học viên, xóa nút AI switcher trên header. | 3.5h |
| Nguyễn Vũ Trọng | Sửa lỗi điều hướng sau đăng nhập cho vai trò Mentor và BTC | ✅ Done | Cập nhật logic điều hướng post-login trong `dashboard-layout.tsx` đưa Mentor về `/dashboard/insights` và BTC (Admin) về `/dashboard/braintrust-observability`. | 1.5h |
| Nguyễn Vũ Trọng | Thiết kế hiệu ứng Gradient Mask mờ dần cạnh phải cho Chat Học viên | ✅ Done | Cấu hình tràn viền và sử dụng CSS `mask-image` / `WebkitMaskImage` tuyến tính làm mờ dần 120px cuối bên phải của Header và Input Bar. Thêm padding-right bảo vệ thanh cuộn tin nhắn và các nút điều khiển SlideViewer. | 3.0h |

**Tổng kết ngày:** Hoàn tất sửa lỗi guardrail trọng yếu của AI chatbot ở TC-008 (chatbot nhận diện đúng academic-integrity-risk, đi qua Socratic, không rò code, average Socratic đạt 4.30/5). Đồng thời, hoàn thành sinh, kiểm định và đồng bộ toàn bộ 18 bộ câu hỏi trắc nghiệm (180 câu) cho Ngày 27 và Ngày 28 trên cả 3 tracks chuyên môn (AI Product, RAG/Data, Agent Builder), cập nhật cấu hình frontend và di trú thành công dữ liệu lên Supabase. Phân tách hoàn chỉnh phân hệ Socratic Chat Học viên và Mentor/Admin, sửa lỗi điều hướng login của người quản trị, và thiết kế thành công hiệu ứng mờ dần (Gradient Mask) sang trọng ở mép phải của Header và Input Bar chat học viên để hòa quyện tự nhiên với thanh điều hướng nổi.

---

## 2026-07-07

| Member | Task | Status | Output | Time |
|--------|------|--------|--------|------|
| Nguyễn Vũ Trọng | Thiết lập môi trường deploy Staging & Production riêng biệt cho Backend và Frontend | ✅ Done | Cập nhật `.github/workflows/ci-backend.yml` chia tách Webhook Render (nhánh `dev`/test -> Staging, `main` -> Production). Cập nhật `.github/workflows/ci-frontend.yml` chạy `vercel deploy` không có `--prod` cho nhánh `dev` để tạo Preview URL ổn định làm môi trường Staging. Cập nhật `src/config.py` hỗ trợ Pydantic cấu hình `staging` cho `app_env`. | 3.0h |

**Tổng kết ngày:** Hoàn thành thiết lập phân tách môi trường deploy Staging & Production cho cả Backend (Render) và Frontend (Vercel) từ nhánh `dev`. Giải quyết lỗi khởi động crash server do thiếu cấu hình `staging` ở Pydantic.

---

## 2026-07-08

| Member | Task | Status | Output | Time |
|--------|------|--------|--------|------|
| Nguyễn Vũ Trọng | Biên soạn Guidebook Day 1-28 từ dữ liệu pipeline | ✅ Done | Sử dụng script LLM pipeline (gọi API fallback OpenRouter) chuyển slide thô thành các tệp guidebook học thuật có cấu trúc rõ ràng cho Day 1-28. Định danh file vật lý chứa hậu tố `guidebook` để tránh nhầm lẫn. | 4.0h |
| Nguyễn Vũ Trọng | Khắc phục lỗi mapping hiển thị và 404 Guidebook phân nhánh (Day 16-28) | ✅ Done | Cập nhật `guidebookDayId` đính kèm Track ID trong `program-curriculum.ts`. Tích hợp helper `getProgramDay` để lấy tiêu đề động tại `page.tsx` và `guidebook-view.tsx` nhằm loại bỏ hardcode `TOPICS_MAP`. | 3.0h |
| Nguyễn Vũ Trọng | Phát triển Ingestion Backend & API Quản lý tài liệu cho Mentor | ✅ Done | Thiết lập 4 endpoints trong `material_routes.py` kết nối Supabase Storage (Option B) và LLM GPT-4o-mini tự động sinh quiz kèm 3 cấp độ gợi ý Socratic. | 4.0h |
| Nguyễn Vũ Trọng | Sửa giới hạn 10 ngày & Nạp động Concepts từ DB | ✅ Done | Cập nhật Regex trích xuất Day Label trên backend. Nâng cấp frontend nạp Concepts động qua API `/api/v1/concepts` và mở rộng dropdown lên 30 ngày học. | 3.5h |
| Nguyễn Vũ Trọng | Phát triển Backend & Frontend Duyệt câu hỏi (HITL) | ✅ Done | Tạo SQL migration cho trạng thái `rejected` và cột `rejection_reason`. Viết service và router backend cùng bộ unit tests 10/10 cases. Liên kết API thực tế vào `quiz-editor-tab.tsx`, nạp động concepts/materials và sửa lỗi TypeScript compilation. | 4.5h |

**Tổng kết ngày:** Biên soạn thành công toàn bộ các tệp Guidebook học thuật chất lượng cao cho Day 1-28 và sửa lỗi hiển thị Guidebook phân nhánh. Đồng thời, hoàn thiện hệ thống Quản lý tài liệu (Document Ingestion) và hệ thống duyệt câu hỏi (HITL Quiz Review) cho Mentor trên cả Backend và Frontend, gỡ bỏ giới hạn cứng 10 ngày học, nạp động danh sách Concepts trực tiếp từ Database, chạy pass 100% các unit tests và Next.js production build.

---

## 2026-07-09

| Member | Task | Status | Output | Time |
|--------|------|--------|--------|------|
| Nguyễn Phương Nam | Biên soạn kịch bản chi tiết và quay dựng video Demo Day | ✅ Done | Hoàn thành kịch bản tiếng Việt tại [edugap-demo-video-script-vi.md](file:///d:/AI%20Invidual%20Tutor/Source%20code/C2-App-125/presentation/edugap-demo-video-script-vi.md), thực hiện quay phim màn hình giới thiệu tính năng chính (Dashboard, Socratic Chat, Citation, Adaptive Quiz, Mastery Progress) và sản xuất video demo hoàn chỉnh (2 phút 30 giây) đưa vào [video-demo.md](file:///d:/AI%20Invidual%20Tutor/Source%20code/C2-App-125/docs/video-demo.md). | 5.0h |

**Tổng kết ngày:** Nguyễn Phương Nam hoàn thành biên soạn kịch bản chi tiết và thực hiện quay dựng video demo hoàn chỉnh giới thiệu các tính năng cốt lõi của EduGap (Socratic Chat, RAG citations, Adaptive Quiz và Mastery dashboard) theo đúng tiến độ phân phối.

---

## 2026-07-18

| Member | Task | Status | Output | Time |
|--------|------|--------|--------|------|
| Nguyễn Phương Nam | Align math concepts, purge ML leak terms, and fix CI/CD & SQL tests | ✅ Done | Đồng bộ 100% tên các concept Toán học GDPT 2018; xóa 230 dòng mock code trùng lặp ở frontend dashboard; thanh lọc các thuật ngữ ML ra khỏi activity pool; đưa questions.json và knowledge_graph.json vào git tracking để xanh CI; tối ưu hóa test_adaptive_sql_contracts.py; và tạo công cụ run_demo.ps1. | 6h |
| Nguyễn Vũ Trọng | Implement adaptive exam system & update project context SSoT | ✅ Done | Thiết kế di trú CSDL `20260718_exam_sets_schema.sql`, cập nhật RPC `submit_attempt_v3` tự động cập nhật Elo/BKT & Gap Detection. Viết FastAPI models/endpoints trong `exam_schemas.py` và `exam_routes.py` hỗ trợ ẩn đáp án chống gian lận. Viết script `seed_exams.py` nạp đề thi, cập nhật frontend database client `database.ts`, viết bộ test suite `test_exams.py` và cập nhật `PROJECT-CONTEXT.md` đồng bộ SSoT Toán 6. | 7h |
| Antigravity (Pair Programming) | Clean Math 6 concepts & Seed pedagogical DAG relations | ✅ Done | Viết và chạy `consolidate_math_concepts.py` để gộp 60 concept trùng lặp/kỹ năng con thành aliases. Viết và chạy `seed_math_relations.py` nạp 80 quan hệ prerequisite (Prerequisite_of) có cycle detection, đồng bộ UUID với nhung/knowledge-graph. | 2h |

**Tổng kết ngày:** Nguyễn Phương Nam hoàn thiện chất lượng và đồng bộ 100% các concept Toán học trên toàn bộ hệ thống; loại bỏ triệt để các tệp mock thừa và các thuật ngữ máy học để đảm bảo uy tín demo sư phạm; cấu hình git tracking dữ liệu câu hỏi giải quyết lỗi CI/CD từ xa; hoàn thành bộ kiểm thử tự động đạt 331 tests (100% pass trên local và CI). Nguyễn Vũ Trọng thiết lập hệ thống Quản lý Đề thi thích ứng trên Supabase và FastAPI với RLS và kiểm thử đầy đủ, đồng thời cập nhật tài liệu SSoT `PROJECT-CONTEXT.md`. Đồng thời, gộp nhóm thành công 60 concepts trùng lặp/kỹ năng con và thiết lập 80 quan hệ prerequisite (DAG) chuẩn sư phạm cho Toán 6 có xác thực không chứa chu trình.

---

<!-- Format: copy block trên cho mỗi ngày làm việc -->
