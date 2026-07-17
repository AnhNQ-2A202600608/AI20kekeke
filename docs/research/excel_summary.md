# Excel Summary: team_project_management_template_ai_tutor_filled_with_progress_styled_summary.xlsx

## Sheet: Tổng hợp

| HỒ SƠ QUẢN LÝ DỰ ÁN |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Được cập nhật liên tục bởi Trưởng nhóm — Nguồn tin cậy duy nhất về tình hình dự án |  |  |  |  |  |  |  |
| Tình hình hiện tại | Đang chuẩn bị MVP |  |  |  |  |  |  |
| Tên dự án | AI Gia Sư Cá Nhân Hóa Theo Năng Lực Từng Sinh Viên |  |  |  |  |  |  |
| Nhóm | Nhóm AI Tutor MVP - 3 thành viên |  |  |  |  |  |  |
| Ngày bắt đầu | 2026-01-06 00:00:00 |  |  |  |  |  |  |
| Ngày kết thúc dự kiến | 18/07/2026 |  |  |  |  |  |  |
| Trưởng nhóm | Thành viên 1 - Product/BA + AI/RAG Lead |  |  |  |  |  |  |
| Mentor phụ trách | [Điền tên mentor phụ trách] |  |  |  |  |  |  |
| Đối tác sử dụng (Stakeholder) | Sinh viên khóa AI thực chiến; Mentor; BTC/Admin |  |  |  |  |  |  |
| Kho lưu mã nguồn (GitHub) | https://github.com/blu1606/EduGap |  |  |  |  |  |  |
| Địa chỉ sản phẩm (Live URL) | [Dán link staging/demo khi có] |  |  |  |  |  |  |
| Mục tiêu dự án | Trong 4-6 tuần, xây MVP AI tutor trả lời thắc mắc kiến thức dựa trên tài liệu chính thức, kèm citation, có guardrail chống làm hộ lab/gate và demo được happy + error paths. |  |  |  |  |  |  |
| TỔNG HỢP TIẾN ĐỘ THEO SPRINT |  |  |  |  |  |  |  |
| Sprint | Giai đoạn | Từ ngày | Đến ngày | Tổng số việc | Đã xong | Đang làm | Trạng thái |
| Sprint 1 | Khởi động, scope, source schema và mock data | 06/06/2026 | 12/06/2026 | 7 | 0 | 0 | Chưa bắt đầu |
| Sprint 2 | Retrieval, tutor API, citation và guardrail | 13/06/2026 | 19/06/2026 | 8 | 0 | 0 | Chưa bắt đầu |
| Sprint 3 | Chat UI, feedback, source UI và learning signals | 20/06/2026 | 26/06/2026 | 6 | 0 | 0 | Chưa bắt đầu |
| Sprint 4 | RBAC, mentor plan v0, QA, demo evidence | 27/06/2026 | 04/07/2026 | 7 | 0 | 0 | Chưa bắt đầu |
| CHỈ SỐ THEO DÕI CHÍNH |  |  |  |  |  |  |  |
| Tổng số User Story | 18 | câu |  |  |  |  |  |
| Task đã hoàn thành | 0 / 28 | task |  |  |  |  |  |
| Task blocked | 0 | task |  |  |  |  |  |
| Số lần gặp mentor/BTC | 1 | lần |  |  |  |  |  |
| Mức hài lòng (Demo) | Chưa đo | trên 10 |  |  |  |  |  |
| Tình trạng triển khai | Local prototype / Mock data |  |  |  |  |  |  |
| TÓM TẮT SCOPE MVP |  |  |  |  |  |  |  |
| Hạng mục | Tóm tắt theo spec | Owner chính | Liên quan |  |  |  |  |
| Core user | Sinh viên hỏi kiến thức trong chương trình và nhận giải thích theo trình độ. | Thành viên 2 | US-001, US-006 |  |  |  |  |
| Nguồn tri thức | Chỉ dùng tài liệu chính thức đã publish; mỗi chunk có metadata workshop/slide/section/content type. | Thành viên 3 | F-02, US-009, US-011 |  |  |  |  |
| Citation | Mỗi câu trả lời kiến thức cần citation card gồm title, slide/page/section và excerpt ngắn. | Thành viên 1 | F-01, US-002 |  |  |  |  |
| Guardrail | Off-scope, low-confidence và xin lời giải lab/gate đều có fallback đúng policy, không làm hộ bài. | Thành viên 1 | F-03, US-004, US-005, US-017 |  |  |  |  |
| Learning signal | Ghi topic, mode, citation, confidence, feedback và guardrail trigger để cập nhật profile sau. | Thành viên 3 | F-04, US-008 |  |  |  |  |
| Mentor/BTC | Mentor/BTC nhập nguồn, test nhanh RAG, review lỗi citation/low-confidence và có thể giao learning plan. | Thành viên 2 + 3 | F-02, F-05, US-010, US-012, US-013 |  |  |  |  |
| Eval | Có 30-50 golden test cases; bản đầu tối thiểu 15 case cho happy/error paths. | Thành viên 1 | US-016 |  |  |  |  |
| RỦI RO CHÍNH VÀ CÁCH GIẢM THIỂU |  |  |  |  |  |  |  |
| Rủi ro | Tác động | Cách giảm thiểu | Owner |  |  |  |  |
| AI trả lời không bám nguồn | Mất độ tin cậy, citation sai. | Dùng retrieval confidence threshold, citation validator và no-answer khi thiếu nguồn. | Thành viên 1 + 3 |  |  |  |  |
| Scope phình thành full LMS/dashboard | Không kịp 4-6 tuần. | Neo vào slice: question -> retrieval -> answer + citation -> fallback. | Thành viên 1 |  |  |  |  |
| Nguồn tài liệu thiếu metadata | Retrieval sai hoặc không trace được citation. | Bắt buộc metadata tối thiểu trước khi publish source. | Thành viên 3 |  |  |  |  |
| Guardrail chống làm hộ chưa đủ mạnh | Rủi ro học thuật khi demo với lab/gate. | Golden tests cho cheating-risk và hint ladder; audit bypass attempts. | Thành viên 1 |  |  |  |  |
| NEXT ACTIONS |  |  |  |  |  |  |  |
| Thứ tự | Việc cần làm ngay | Output | Owner | Liên kết task |  |  |  |
| 1 | Chốt source metadata và mock data | JSON/source schema dùng được cho retrieval | Thành viên 3 | P-003, P-004, P-006 |  |  |  |
| 2 | Viết golden test cases v0 | Tối thiểu 15 test cases | Thành viên 1 | P-005 |  |  |  |
| 3 | Dựng retrieval mock + citation validator | Top chunks, confidence, citation card | Thành viên 1 + 3 | P-008, P-010 |  |  |  |
| 4 | Làm Tutor API contract | POST /api/tutor/ask response có answer/citations/policy_action | Thành viên 3 | P-011 |  |  |  |
| 5 | Làm Chat UI + citation card | Demo happy path đầu tiên | Thành viên 2 | P-016, P-018 |  |  |  |


## Sheet: Danh sách User Story

| DANH SÁCH USER STORY / USE CASE |  |  |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mọi tình huống sử dụng cần thực hiện — Mỗi câu chuyện có mã riêng để liên kết với Backlog |  |  |  |  |  |  |  |  |  |
| Mã | Tên câu chuyện sử dụng | Mô tả ngắn | Với vai trò | Tôi muốn | Để đạt được | Mức ưu tiên | Trạng thái | Sprint dự kiến | Xem đặc tả |
| US-001 | Sinh viên hỏi khái niệm trong khóa học | Sinh viên nhập câu hỏi kiến thức, tutor trả lời dựa trên tài liệu đã publish và có citation. | Sinh viên | hỏi một khái niệm trong chương trình AI thực chiến | hiểu đúng kiến thức mà không phải chờ mentor trả lời thủ công | Bắt buộc | Chưa làm | Sprint 1 | F-01 |
| US-002 | Xem nguồn trích dẫn của câu trả lời | Mỗi câu trả lời kiến thức hiển thị tên tài liệu, slide/trang/section và đoạn trích ngắn. | Sinh viên | xem citation rõ ràng ngay dưới câu trả lời | kiểm chứng được AI lấy kiến thức từ nguồn chính thức | Bắt buộc | Chưa làm | Sprint 1 | F-01 |
| US-003 | Tutor hỏi lại khi câu hỏi mơ hồ | Nếu câu hỏi thiếu ngữ cảnh, tutor hỏi lại workshop/chủ đề thay vì đoán bừa. | Sinh viên | nhận câu hỏi làm rõ khi input chưa đủ rõ | có câu trả lời sát nhu cầu hơn | Bắt buộc | Chưa làm | Sprint 1 | F-01 |
| US-004 | Từ chối câu hỏi ngoài phạm vi | Tutor phát hiện off-scope, từ chối lịch sự và gợi ý quay về nội dung khóa học. | Sinh viên | biết vì sao tutor không trả lời câu hỏi ngoài chương trình | không nhận thông tin không được kiểm chứng bởi tài liệu khóa học | Bắt buộc | Chưa làm | Sprint 1 | F-03 |
| US-005 | Không làm hộ lab/gate | Khi sinh viên xin đáp án hoặc copy đề lab/gate, tutor chuyển sang Socratic/hint ladder. | Sinh viên | nhận gợi ý từng bước thay vì lời giải hoàn chỉnh | rèn tư duy và tuân thủ chính sách chống gian lận | Bắt buộc | Chưa làm | Sprint 2 | F-03 |
| US-006 | Chọn mode học tập | Sinh viên chọn Giải thích, Gợi ý từng bước, Debug code, Luyện tập hoặc Review bài làm. | Sinh viên | chọn mode phù hợp với nhu cầu học | nhận cách hỗ trợ đúng bối cảnh | Nên có | Chưa làm | Sprint 2 | F-01 |
| US-007 | Gửi feedback cho câu trả lời | Sinh viên đánh giá helpful/unhelpful và báo lỗi citation hoặc câu trả lời chưa đúng. | Sinh viên | gửi phản hồi nhanh sau mỗi câu trả lời | giúp team cải thiện prompt, retrieval và nguồn tài liệu | Bắt buộc | Chưa làm | Sprint 2 | F-04 |
| US-008 | Ghi learning signal từ phiên hỏi đáp | Hệ thống lưu topic, mode, citation, confidence, feedback và guardrail trigger. | Hệ thống | ghi lại tín hiệu học tập có cấu trúc | cập nhật learning profile theo phiên/ngày/tuần | Nên có | Chưa làm | Sprint 3 | F-04 |
| US-009 | BTC/Mentor nhập nguồn tài liệu | BTC hoặc mentor nhập mô tả tài liệu/slide, tag workshop, skill, content type và trạng thái publish. | BTC/Admin hoặc Mentor | quản lý nguồn tài liệu chính thức cho tutor | đảm bảo AI chỉ trả lời từ nguồn đã được duyệt | Bắt buộc | Chưa làm | Sprint 1 | F-02 |
| US-010 | Test nhanh RAG trước khi publish | Người phụ trách nhập câu hỏi mẫu để kiểm tra chunk/citation trước khi bật nguồn cho sinh viên. | BTC/Admin hoặc Mentor | test câu hỏi mẫu trên tài liệu vừa nhập | phát hiện nguồn thiếu hoặc citation sai trước khi dùng thật | Bắt buộc | Chưa làm | Sprint 2 | F-02 |
| US-011 | Quản lý trạng thái publish/draft | Nguồn draft không được retrieval cho sinh viên; chỉ nguồn publish mới dùng cho tutor. | BTC/Admin | bật/tắt nguồn tài liệu theo trạng thái | kiểm soát chất lượng và phạm vi kiến thức | Bắt buộc | Chưa làm | Sprint 2 | F-02 |
| US-012 | Mentor xem lỗi citation/low-confidence | Mentor/BTC xem danh sách câu hỏi bị low confidence, không có nguồn hoặc bị feedback xấu. | Mentor hoặc BTC/Admin | review các ca tutor chưa trả lời tốt | ưu tiên bổ sung nguồn hoặc sửa prompt đúng chỗ | Nên có | Chưa làm | Sprint 3 | F-04 |
| US-013 | Mentor giao learning plan bắt buộc | Mentor chọn template/bài luyện và giao cho sinh viên hoặc team với deadline. | Mentor | giao learning plan hoặc bài luyện bắt buộc | can thiệp kịp thời cho sinh viên/team đang yếu | Nên có | Chưa làm | Sprint 4 | F-05 |
| US-014 | Sinh viên xem learning plan được giao | Sinh viên xem mục tiêu, bài luyện, deadline, trạng thái và ghi chú mentor. | Sinh viên | theo dõi việc học bắt buộc được giao | biết mình cần hoàn thành gì để cải thiện | Nên có | Chưa làm | Sprint 4 | F-05 |
| US-015 | Phân quyền Student/Mentor/BTC | Hệ thống dùng email/password trong MVP và RBAC cho ba vai trò chính. | BTC/Admin | quản lý role và quyền truy cập | đảm bảo dữ liệu học viên và nguồn tài liệu được kiểm soát | Bắt buộc | Chưa làm | Sprint 1 | F-06 |
| US-016 | Chạy golden test cases | Team có 30-50 test case để kiểm tra grounded answer, citation accuracy và guardrail compliance. | Team dự án | chạy bộ test định kỳ cho tutor | đo độ tin cậy trước demo và trước khi mở rộng | Bắt buộc | Chưa làm | Sprint 3 | F-01/F-03 |
| US-017 | Fallback khi retrieval confidence thấp | Nếu không tìm thấy nguồn phù hợp, tutor nói không đủ căn cứ và đề xuất nguồn/chủ đề liên quan. | Sinh viên | nhận phản hồi trung thực khi tài liệu chưa đủ | tránh hallucination và giữ niềm tin vào tutor | Bắt buộc | Chưa làm | Sprint 2 | F-03 |
| US-018 | Xuất evidence cho demo | Team lưu câu hỏi mẫu, nguồn trích dẫn, ảnh màn hình và kết quả test để trình bày với mentor/BTC. | Team dự án | xuất bằng chứng end-to-end của prototype | chứng minh hệ thống chạy được happy path và error path | Nên có | Chưa làm | Sprint 4 | F-04 |
| US-027 |  |  |  |  |  |  |  |  |  |
| US-028 |  |  |  |  |  |  |  |  |  |
| THANG MỨC ƯU TIÊN |  |  |  |  |  |  |  |  |  |
| Bắt buộc | Sản phẩm không hoạt động nếu thiếu — Phải hoàn thành |  |  |  |  |  |  |  |  |
| Nên có | Tăng giá trị đáng kể nhưng không ảnh hưởng đến hoạt động cốt lõi |  |  |  |  |  |  |  |  |
| Có thì tốt | Làm nếu còn thời gian — Không ảnh hưởng nếu bỏ qua |  |  |  |  |  |  |  |  |
| Không làm | Ngoài phạm vi giai đoạn này |  |  |  |  |  |  |  |  |


## Sheet: Đặc tả tính năng

| ĐẶC TẢ TÍNH NĂNG / FEATURE SPECIFICATION |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Mô tả chi tiết từng tính năng theo cấu trúc: Động lực → Thiết kế → Kế hoạch |  |  |  |  |  |  |  |
| ĐẶC TẢ #1 - F-01 |  |  |  |  |  |  |  |
| Mã User Story liên quan | US-001, US-002, US-003, US-005, US-006, US-007, US-016, US-017 |  |  |  |  |  |  |
| Tên tính năng | F-01 - AI Tutor hỏi đáp kiến thức kèm citation |  |  |  |  |  |  |
| Người viết | Thành viên 1 - Product/BA + AI/RAG Lead |  |  |  |  |  |  |
| Ngày tạo | 06/06/2026 |  |  |  |  |  |  |
| Ngày cập nhật gần nhất | 06/06/2026 |  |  |  |  |  |  |
| Trạng thái | Đang review |  |  |  |  |  |  |
| 1. ĐỘNG LÝ (MOTIVATION) |  |  |  |  |  |  |  |
| Vấn đề cần giải quyết | Trong lớp đông, mentor không thể giải thích từng khái niệm cho mọi sinh viên. Nếu dùng LLM chung, câu trả lời dễ lệch tài liệu hoặc không có căn cứ kiểm chứng. |  |  |  |  |  |  |
| Người dùng mục tiêu | Sinh viên khóa AI thực chiến cần hỏi nhanh về workshop/lab; mentor và BTC cần hệ thống trả lời đáng tin cậy, có citation để audit. |  |  |  |  |  |  |
| Mục tiêu kỳ vọng | Tutor trả lời đúng phạm vi nguồn đã publish, luôn có citation cho câu hỏi kiến thức, và đạt tỷ lệ pass cao trên golden test cases. |  |  |  |  |  |  |
| Phương án thay thế đã xem xét | FAQ tĩnh và chatbot LLM chung đã được xem xét nhưng không đủ cá nhân hóa, khó kiểm chứng nguồn và khó xử lý guardrail học thuật. |  |  |  |  |  |  |
| 2. THIẾT KẾ (DESIGN) |  |  |  |  |  |  |  |
| Kiến trúc hệ thống | Student Chat UI -> Tutor API -> intent/policy classifier -> retriever trên published chunks -> answer generator -> citation validator -> learning/feedback log. |  |  |  |  |  |  |
| Thiết kế giao diện (UI/UX) | Chat UI tiếng Việt với mode selector, vùng câu trả lời, citation card, trạng thái low-confidence, nút feedback helpful/unhelpful và báo lỗi citation. |  |  |  |  |  |  |
| Thiết kế API | POST /api/tutor/ask nhận question, mode, user_id, profile_snapshot; trả answer, citations[], confidence, policy_action. POST /api/tutor/feedback ghi feedback. |  |  |  |  |  |  |
| Mô hình dữ liệu | users, learning_profiles, source_documents, source_chunks, tutor_sessions, tutor_messages, citations, learning_signals, feedback_events. |  |  |  |  |  |  |
| Thiết kế AI/ML | RAG với top-k retrieval, prompt yêu cầu trả lời cùng ngôn ngữ câu hỏi, chỉ dùng context được retrieve, citation-required và no-answer khi confidence thấp. |  |  |  |  |  |  |
| Trường hợp đặc biệt và Xử lý lỗi | Happy path có nguồn rõ; ambiguous hỏi lại; low-confidence từ chối có hướng dẫn; off-scope kéo về chương trình; lab/gate dùng hint ladder, không full solution. |  |  |  |  |  |  |
| Bảo mật và Quyền riêng tư | RBAC: sinh viên chỉ xem lịch sử của mình. Không log dữ liệu nhạy cảm không cần thiết. Guardrail chống xin đáp án lab/gate và audit khi có bypass attempt. |  |  |  |  |  |  |
| 3. KẾ HOẠCH (PLAN) |  |  |  |  |  |  |  |
| Các bước thực hiện | 1) Chuẩn hóa mock source. 2) Viết retrieval mock. 3) Viết prompt/policy. 4) Làm Chat UI + citation card. 5) Tạo feedback/log. 6) Chạy golden tests. |  |  |  |  |  |  |
| Công việc con (liên kết Backlog) | T-001 source schema \| T-002 retrieval mock \| T-003 tutor prompt \| T-004 citation validator \| T-005 chat UI \| T-006 feedback/log \| T-007 golden tests |  |  |  |  |  |  |
| Phụ thuộc | Cần nguồn tài liệu đã tag workshop/skill, policy guardrail và bộ câu hỏi mẫu trước khi demo end-to-end. |  |  |  |  |  |  |
| Timeline dự kiến | Sprint 1 -> Sprint 3, ước tính 30-36 giờ cho MVP slice. |  |  |  |  |  |  |
| Kế hoạch kiểm thử | Golden cases gồm: hỏi RAG là gì, hỏi mơ hồ, hỏi ngoài phạm vi, xin lời giải lab/gate, retrieval confidence thấp, citation mismatch. |  |  |  |  |  |  |
| Kế hoạch triển khai | Triển khai mock mode trước, sau đó thay retrieval mock bằng vector index thật khi có thời gian. Bật feature flag theo cohort/team. |  |  |  |  |  |  |
| Tiêu chí thành công | Mỗi câu trả lời kiến thức có citation title + slide/page/section; low-confidence không hallucinate; guardrail pass trên test xin đáp án. |  |  |  |  |  |  |
| Rủi ro và Cách giảm thiểu | Rủi ro citation sai hoặc AI suy diễn quá nguồn. Giảm thiểu bằng citation validator, confidence threshold, feedback review và golden test hàng tuần. |  |  |  |  |  |  |
| ──────────────────────────────────────────────────────────────────────────────── |  |  |  |  |  |  |  |
| ĐẶC TẢ #2 - F-02 |  |  |  |  |  |  |  |
| Mã User Story liên quan | US-009, US-010, US-011, US-012, US-015, US-018 |  |  |  |  |  |  |
| Tên tính năng | F-02 - Quản lý nguồn tài liệu và kiểm thử RAG cho BTC/Mentor |  |  |  |  |  |  |
| Người viết | Thành viên 3 - Backend/Data + QA Lead |  |  |  |  |  |  |
| Ngày tạo | 06/06/2026 |  |  |  |  |  |  |
| Ngày cập nhật gần nhất | 06/06/2026 |  |  |  |  |  |  |
| Trạng thái | Đang review |  |  |  |  |  |  |
| 1. ĐỘNG LÝ (MOTIVATION) |  |  |  |  |  |  |  |
| Vấn đề cần giải quyết | Tutor chỉ đáng tin khi nguồn chính thức được nhập, gắn metadata và kiểm thử trước khi publish. Nếu thiếu quy trình này, AI dễ trả lời từ nguồn không đúng hoặc không đủ căn cứ. |  |  |  |  |  |  |
| Người dùng mục tiêu | BTC/Admin quản lý tài liệu; mentor có thể đề xuất/bổ sung mô tả nguồn, xem ca lỗi và yêu cầu cập nhật nguồn cho workshop mình phụ trách. |  |  |  |  |  |  |
| Mục tiêu kỳ vọng | Nguồn được tag rõ workshop/skill/content type, có trạng thái draft/published, có test nhanh RAG và có danh sách feedback/low-confidence để cải tiến. |  |  |  |  |  |  |
| Phương án thay thế đã xem xét | Nhập JSON thủ công bởi engineer giúp demo nhanh nhưng không đủ bền vững cho mentor/BTC vận hành sau này. |  |  |  |  |  |  |
| 2. THIẾT KẾ (DESIGN) |  |  |  |  |  |  |  |
| Kiến trúc hệ thống | Admin/Mentor Source UI -> Content API -> object/source store -> parser/chunker/mock chunk store -> retrieval test panel -> publish status -> tutor retrieval. |  |  |  |  |  |  |
| Thiết kế giao diện (UI/UX) | Bảng danh sách tài liệu, form nhập title/workshop/skill/content type, trạng thái draft/published, panel test câu hỏi mẫu và bảng lỗi cần review. |  |  |  |  |  |  |
| Thiết kế API | POST /api/admin/sources, PATCH /api/admin/sources/:id/publish, POST /api/admin/rag-test, GET /api/admin/feedback-events, GET /api/admin/audit-log. |  |  |  |  |  |  |
| Mô hình dữ liệu | source_documents, source_chunks, ingestion_jobs, rag_test_cases, feedback_events, audit_logs, user_roles. |  |  |  |  |  |  |
| Thiết kế AI/ML | Chunk theo slide/page/section, lưu metadata, retrieval chỉ lấy published chunks cùng cohort. Test RAG trả về top chunks và expected citation trước khi publish. |  |  |  |  |  |  |
| Trường hợp đặc biệt và Xử lý lỗi | Unsupported file, thiếu metadata, duplicate source, parser fail, retrieval below threshold, citation mismatch, nguồn draft bị hỏi bởi sinh viên. |  |  |  |  |  |  |
| Bảo mật và Quyền riêng tư | Chỉ BTC/Admin publish nguồn. Mentor chỉ thấy nguồn/feedback trong phạm vi phụ trách. Audit mọi thao tác publish/unpublish và import. |  |  |  |  |  |  |
| 3. KẾ HOẠCH (PLAN) |  |  |  |  |  |  |  |
| Các bước thực hiện | 1) Tạo source schema. 2) Import mock Day05/Workshop sources. 3) Làm source list/form. 4) Làm RAG test panel. 5) Gắn publish filter. 6) Log feedback/evidence. |  |  |  |  |  |  |
| Công việc con (liên kết Backlog) | T-008 admin source schema \| T-009 source form \| T-010 rag-test endpoint \| T-011 publish workflow \| T-012 feedback review \| T-013 audit/evidence export |  |  |  |  |  |  |
| Phụ thuộc | Phụ thuộc vào quyết định metadata chuẩn, bộ tài liệu mock đầu tiên và quyền truy cập của ba role Student/Mentor/BTC. |  |  |  |  |  |  |
| Timeline dự kiến | Sprint 1 -> Sprint 3, ước tính 28-34 giờ cho MVP slice. |  |  |  |  |  |  |
| Kế hoạch kiểm thử | Test import nguồn hợp lệ/thiếu metadata, test draft không retrieve, test publish retrieve được, test câu hỏi mẫu trả đúng slide/page/section. |  |  |  |  |  |  |
| Kế hoạch triển khai | Release nội bộ cho team dự án trước, sau đó mở cho mentor/BTC nhập nguồn mới khi quy trình đã có checklist kiểm thử. |  |  |  |  |  |  |
| Tiêu chí thành công | 100% nguồn dùng cho tutor có metadata và trạng thái publish; RAG test có thể trả citation trước khi cho sinh viên hỏi. |  |  |  |  |  |  |
| Rủi ro và Cách giảm thiểu | Rủi ro nhập nguồn không chuẩn hoặc parse sai. Giảm thiểu bằng validation bắt buộc, preview chunk, test question trước publish và audit log. |  |  |  |  |  |  |
| DANH MỤC TÍNH NĂNG MVP VÀ BACKLOG |  |  |  |  |  |  |  |
| Mã tính năng | Tên tính năng | User stories liên quan | Owner | MVP? | Trạng thái | Tiêu chí nghiệm thu ngắn | Ghi chú |
| F-01 | AI Tutor hỏi đáp kiến thức kèm citation | US-001, US-002, US-003, US-006, US-016 | Thành viên 1 | Có | Đặc tả chi tiết | Trả lời đúng nguồn, có citation, không hallucinate khi thiếu nguồn. | Core demo slice. |
| F-02 | Quản lý nguồn tài liệu và kiểm thử RAG | US-009, US-010, US-011 | Thành viên 3 | Có | Đặc tả chi tiết | Nguồn draft không retrieve; nguồn publish có test câu hỏi mẫu. | Nguồn cho tutor. |
| F-03 | Guardrail và error path | US-004, US-005, US-017 | Thành viên 1 + 3 | Có | Backlog chi tiết | Off-scope/low-confidence/xin đáp án đều có phản hồi đúng policy. | Không làm hộ lab/gate. |
| F-04 | Feedback, learning signal và evidence | US-007, US-008, US-012, US-018 | Thành viên 2 + 3 | Có | Backlog chi tiết | Feedback được lưu và có thể review; demo evidence xuất được. | Phục vụ cải tiến tutor. |
| F-05 | Mentor learning plan | US-013, US-014 | Thành viên 2 + 3 | Sau core MVP | Backlog | Mentor giao plan/bài luyện cho student/team và theo dõi trạng thái. | Làm sau khi tutor ổn định. |
| F-06 | RBAC Student/Mentor/BTC | US-015 | Thành viên 3 | Có | Backlog chi tiết | Email/password MVP, phân quyền dữ liệu theo role. | Thiết kế sẵn SSO/OAuth sau. |


## Sheet: Tiến trình

| TIẾN TRÌNH TRIỂN KHAI MVP AI TUTOR |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Checklist theo thứ tự build để thành viên cập nhật trạng thái, % tiến độ, evidence/link và ghi chú. |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Tổng task | 28 |  | Xong | 0 |  | Đang làm | 1 |  | Blocked | 0 |  | Tiến độ TB | 0 |  |  |
| Hướng dẫn cập nhật |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| STT | Giai đoạn | Task ID | Checklist task | Kết quả cần có | Owner chính | Phối hợp | Feature/User Story | Ưu tiên | Sprint/Thứ tự | Trạng thái | % tiến độ (0-100) | Deadline gợi ý | Evidence/Link | Ghi chú cập nhật | Cập nhật lần cuối |
| 1 | Alignment | P-001 | Chốt phạm vi MVP và demo slice | Scope được neo vào student hỏi kiến thức -> RAG -> answer kèm citation -> fallback/guardrail. | Thành viên 1 | Thành viên 2, Thành viên 3 | F-01, F-03 | Bắt buộc | Sprint 1 / 1 | Đang làm | 0 | Cuối tuần 1 |  |  |  |
| 2 | Alignment | P-002 | Xác nhận owner và quy trình cập nhật tiến độ | 3 thành viên thống nhất owner, người phối hợp, lịch check-in và cách cập nhật sheet Tiến trình. | Thành viên 1 | Thành viên 2, Thành viên 3 | Tất cả | Bắt buộc | Sprint 1 / 2 | Chưa làm | 0 | Cuối tuần 1 |  |  |  |
| 3 | Alignment | P-003 | Chuẩn hóa metadata nguồn tài liệu | Có schema tối thiểu: source_id, title, workshop, slide/page, section, skill_tags, content_type, published_status. | Thành viên 3 | Thành viên 1 | F-02, US-009 | Bắt buộc | Sprint 1 / 3 | Chưa làm | 0 | Cuối tuần 1 |  |  |  |
| 4 | Alignment | P-004 | Chuẩn bị mock source data từ tài liệu/slide | Có mock data để tutor retrieve và trả citation trong demo. | Thành viên 1 | Thành viên 3 | F-02, US-009 | Bắt buộc | Sprint 1 / 4 | Chưa làm | 0 | Cuối tuần 1 |  |  |  |
| 5 | Alignment | P-005 | Viết golden test cases v0 | Có tối thiểu 15 case đầu cho happy path, ambiguous, low-confidence, off-scope, cheating-risk, citation mismatch. | Thành viên 1 | Thành viên 3 | F-01, F-03, US-016 | Bắt buộc | Sprint 1 / 5 | Chưa làm | 0 | Cuối tuần 1 |  |  |  |
| 6 | Source/RAG | P-006 | Tạo schema source_documents và source_chunks | Mock DB hoặc JSON schema lưu được tài liệu, chunk, metadata và trạng thái draft/published. | Thành viên 3 | Thành viên 1 | F-02, US-009, US-011 | Bắt buộc | Sprint 1 / 6 | Chưa làm | 0 | Cuối tuần 1 |  |  |  |
| 7 | Source/RAG | P-007 | Làm import source mock/API | BTC/Mentor có cách nhập hoặc cập nhật source mock với metadata cần thiết. | Thành viên 3 | Thành viên 2 | F-02, US-009 | Bắt buộc | Sprint 1 / 7 | Chưa làm | 0 | Cuối tuần 1 |  |  |  |
| 8 | Source/RAG | P-008 | Tạo retrieval mock và confidence threshold | Query trả top chunks, confidence và fallback khi không đủ nguồn. | Thành viên 3 | Thành viên 1 | F-01, F-02, US-001, US-017 | Bắt buộc | Sprint 2 / 1 | Chưa làm | 0 | Cuối tuần 2 |  |  |  |
| 9 | Source/RAG | P-009 | Làm RAG test panel hoặc endpoint test nhanh | Người phụ trách nhập câu hỏi mẫu và xem chunks/citation trước khi publish source. | Thành viên 3 | Thành viên 2 | F-02, US-010 | Bắt buộc | Sprint 2 / 2 | Chưa làm | 0 | Cuối tuần 2 |  |  |  |
| 10 | Source/RAG | P-010 | Tạo citation validator | Kiểm tra câu trả lời kiến thức có citation hợp lệ: title, slide/page/section, excerpt. | Thành viên 1 | Thành viên 3 | F-01, F-03, US-002 | Bắt buộc | Sprint 2 / 3 | Chưa làm | 0 | Cuối tuần 2 |  |  |  |
| 11 | Tutor API | P-011 | Thiết kế contract POST /api/tutor/ask | Có request/response gồm question, mode, user_id, answer, citations, confidence, policy_action. | Thành viên 3 | Thành viên 1, Thành viên 2 | F-01, US-001 | Bắt buộc | Sprint 2 / 4 | Chưa làm | 0 | Cuối tuần 2 |  |  |  |
| 12 | Tutor API | P-012 | Implement intent/policy classifier | Phân loại explain, hint, debug, practice, review, off-scope, cheating-risk. | Thành viên 1 | Thành viên 3 | F-01, F-03, US-003, US-004, US-005 | Bắt buộc | Sprint 2 / 5 | Chưa làm | 0 | Cuối tuần 2 |  |  |  |
| 13 | Tutor API | P-013 | Implement prompt sinh câu trả lời kèm citation | Tutor trả lời cùng ngôn ngữ câu hỏi, chỉ dựa trên context retrieve và có citation. | Thành viên 1 | Thành viên 3 | F-01, US-001, US-002 | Bắt buộc | Sprint 2 / 6 | Chưa làm | 0 | Cuối tuần 2 |  |  |  |
| 14 | Tutor API | P-014 | Implement guardrail và fallback | Off-scope, low-confidence, no-full-solution và citation mismatch đều có phản hồi đúng policy. | Thành viên 1 | Thành viên 3 | F-03, US-004, US-005, US-017 | Bắt buộc | Sprint 2 / 7 | Chưa làm | 0 | Cuối tuần 2 |  |  |  |
| 15 | Tutor API | P-015 | Ghi feedback event và learning signal | Lưu topic, mode, citations, confidence, feedback, guardrail trigger để dùng cho profile/eval. | Thành viên 3 | Thành viên 1 | F-04, US-007, US-008 | Nên có | Sprint 3 / 1 | Chưa làm | 0 | Cuối tuần 3 |  |  |  |
| 16 | Frontend | P-016 | Làm Chat UI tiếng Việt | Sinh viên nhập câu hỏi, xem câu trả lời và trạng thái xử lý trong một màn hình chính. | Thành viên 2 | Thành viên 3 | F-01, US-001 | Bắt buộc | Sprint 2 / 8 | Chưa làm | 0 | Cuối tuần 2 |  |  |  |
| 17 | Frontend | P-017 | Làm mode selector 5 mode | UI có Giải thích, Gợi ý từng bước, Debug code, Luyện tập, Review bài làm. | Thành viên 2 | Thành viên 1 | F-01, US-006 | Nên có | Sprint 3 / 2 | Chưa làm | 0 | Cuối tuần 3 |  |  |  |
| 18 | Frontend | P-018 | Làm citation card | Hiển thị title, workshop, slide/page/section, excerpt và confidence nếu có. | Thành viên 2 | Thành viên 1, Thành viên 3 | F-01, US-002 | Bắt buộc | Sprint 3 / 3 | Chưa làm | 0 | Cuối tuần 3 |  |  |  |
| 19 | Frontend | P-019 | Làm UI cho error/guardrail states | Có màn hình/khối phản hồi cho ambiguous, low-confidence, off-scope và cheating-risk. | Thành viên 2 | Thành viên 1 | F-03, US-003, US-004, US-005, US-017 | Bắt buộc | Sprint 3 / 4 | Chưa làm | 0 | Cuối tuần 3 |  |  |  |
| 20 | Frontend | P-020 | Làm feedback controls | Sinh viên gửi helpful/unhelpful, báo lỗi citation hoặc ghi chú ngắn. | Thành viên 2 | Thành viên 3 | F-04, US-007 | Nên có | Sprint 3 / 5 | Chưa làm | 0 | Cuối tuần 3 |  |  |  |
| 21 | Mentor/Admin | P-021 | Làm source management UI nhẹ | BTC/Mentor nhập hoặc chỉnh source, metadata, trạng thái draft/published. | Thành viên 2 | Thành viên 3 | F-02, US-009, US-011 | Nên có | Sprint 3 / 6 | Chưa làm | 0 | Cuối tuần 3 |  |  |  |
| 22 | Mentor/Admin | P-022 | Làm danh sách feedback/low-confidence để review | Mentor/BTC xem ca thiếu nguồn, citation sai, feedback xấu để cải tiến. | Thành viên 3 | Thành viên 2 | F-04, US-012 | Nên có | Sprint 4 / 1 | Chưa làm | 0 | Cuối tuần 4 |  |  |  |
| 23 | Mentor/Admin | P-023 | Làm RBAC email/password minimal | Có 3 role Student/Mentor/BTC và quyền truy cập dữ liệu cơ bản. | Thành viên 3 | Thành viên 1 | F-06, US-015 | Bắt buộc | Sprint 4 / 2 | Chưa làm | 0 | Cuối tuần 4 |  |  |  |
| 24 | Mentor/Admin | P-024 | Làm mentor assign learning plan v0 | Mentor giao bài luyện/learning plan cho sinh viên hoặc team, có deadline và trạng thái. | Thành viên 2 | Thành viên 3 | F-05, US-013, US-014 | Sau core MVP | Sprint 4 / 3 | Chưa làm | 0 | Cuối tuần 4 |  |  |  |
| 25 | QA/Demo | P-025 | Chạy golden tests v0 | Có kết quả pass/fail cho grounded answer, citation accuracy, guardrail compliance. | Thành viên 1 | Thành viên 3 | US-016 | Bắt buộc | Sprint 4 / 4 | Chưa làm | 0 | Cuối tuần 4 |  |  |  |
| 26 | QA/Demo | P-026 | Fix top citation/guardrail issues | Các lỗi nghiêm trọng nhất từ golden tests được sửa hoặc có mitigation rõ. | Thành viên 1 | Thành viên 2, Thành viên 3 | F-01, F-03 | Bắt buộc | Sprint 4 / 5 | Chưa làm | 0 | Cuối tuần 4 |  |  |  |
| 27 | QA/Demo | P-027 | Chuẩn bị demo script 4 paths | Demo có happy, low-confidence, off-scope và cheating-risk path, kèm expected output. | Thành viên 1 | Thành viên 2 | US-018 | Bắt buộc | Sprint 4 / 6 | Chưa làm | 0 | Cuối tuần 4 |  |  |  |
| 28 | QA/Demo | P-028 | Xuất evidence cho mentor/BTC | Có screenshot/log/citation evidence và checklist pass/fail để trình bày. | Thành viên 2 | Thành viên 1, Thành viên 3 | US-018 | Nên có | Sprint 4 / 7 | Chưa làm | 0 | Cuối tuần 4 |  |  |  |


## Sheet: Lộ trình

| LỘ TRÌNH DỰ ÁN — CÁC MỐC CHÍNH |  |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Tổng hợp các mốc quan trọng — Cập nhật trạng thái ngay khi đạt được |  |  |  |  |  |  |  |  |
| Mã | Mốc quan trọng | Mô tả chi tiết | Tuần | Từ ngày | Đến ngày | Người chịu trách nhiệm | Trạng thái | Kết quả giao nộp |
| M1 | Hoàn thành Project Charter | Mục tiêu, phạm vi, đối tác, chỉ số đo lường đã chốt | W1 |  |  | Trưởng nhóm | Đang làm | Tài liệu Charter, Quy chế làm việc |
| M2 | Trình bày ý tưởng cho mentor | Giới thiệu dự án, lắng nghe nhu cầu, xác nhận hướng đi | W1 |  |  | Trưởng nhóm | Hoàn thành | Biên bản họp, Báo cáo phản hồi |
| M3 | Hoàn thành thiết kế giải pháp | Thiết kế kiến trúc hệ thống, mô hình dữ liệu, phương án kỹ thuật | W2 |  |  | Cả nhóm | Chưa bắt đầu | Sơ đồ kiến trúc, Tài liệu giải pháp |
| M4 | Demo lần 1 — Bản thử nghiệm | Trình bày sản phẩm vòng 1 cho mentor, thu thập phản hồi | W3 |  |  | Cả nhóm | Chưa bắt đầu | Bản thử nghiệm chạy được, Kịch bản demo |
| M5 | Xử lý xong phản hồi Demo 1 | Triển khai phản hồi, phân loại lỗi, lên kế hoạch vòng 2 | W4 |  |  | Cả nhóm | Chưa bắt đầu | Báo cáo phản hồi, Danh sách việc cập nhật |
| M6 | Demo lần 2 — Sản phẩm hoàn thiện | Trình bày sản phẩm hoàn chỉnh cho mentor | W5 |  |  | Cả nhóm | Chưa bắt đầu | Sản phẩm hoàn thiện, Báo cáo chỉ số |
| M7 | Phiên bản chính thức hoạt động | Triển khai sản phẩm lên môi trường thực tế, có người dùng thật | W6 |  |  | Cả nhóm | Chưa bắt đầu | Địa chỉ sản phẩm, Danh sách kiểm tra triển khai |
| M8 | Đánh giá cuối kỳ | Thuyết trình tổng kết, báo cáo tác động, chấm điểm | W6 |  |  | Cả nhóm | Chưa bắt đầu | Slide thuyết trình, Báo cáo tác động |


## Sheet: Đường link quan trọng

| TẬP HỢP ĐƯỜNG LINK QUAN TRỌNG |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- |
| Lưu mọi đường link liên quan đến dự án — Cập nhật ngay khi có link mới |  |  |  |  |  |
| STT | Phân loại | Nội dung / Mô tả | Địa chỉ (URL) | Người quản lý | Ghi chú |
|  | Mã nguồn và Triển khai |  |  |  |  |
| 1 |  | Kho lưu mã nguồn (GitHub Repository) | [Dán link vào đây] | [Họ tên người quản lý] |  |
| 2 |  | Địa chỉ sản phẩm (Production) | [Dán link vào đây] | [Họ tên] |  |
| 3 |  | Địa chỉ thử nghiệm (Staging) | [Dán link vào đây] | [Họ tên] |  |
| 4 |  | Quy trình tự động (CI/CD Pipeline) | [Dán link vào đây] | [Họ tên] | GitHub Actions, v.v. |
| 5 |  | Trang giám sát hệ thống (Monitoring) | [Dán link vào đây] | [Họ tên] | Sentry, Langfuse, v.v. |
|  | Tài liệu thiết kế |  |  |  |  |
| 6 |  | Sơ đồ kiến trúc hệ thống | [Dán link vào đây] | [Họ tên] | Draw.io, Figma, v.v. |
| 7 |  | Thiết kế giao diện (UI/UX) | [Dán link vào đây] | [Họ tên] | Figma, v.v. |
| 8 |  | Tài liệu API | [Dán link vào đây] | [Họ tên] | Swagger, Postman, v.v. |
| 9 |  | Sơ đồ cơ sở dữ liệu | [Dán link vào đây] | [Họ tên] |  |
|  | Liên lạc và Hợp tác |  |  |  |  |
| 10 |  | Kênh Discord nhóm | [Dán link vào đây] | [Họ tên] |  |
| 11 |  | Kênh họp trực tuyến (Teams/Zoom) | [Dán link vào đây] | [Họ tên] |  |
| 12 |  | Ổ đĩa dùng chung (Google Drive) | [Dán link vào đây] | [Họ tên] |  |
|  | Đối tác (Stakeholder) |  |  |  |  |
| 13 |  | Biên bản họp với đối tác | [Dán link vào đây] | [Họ tên] | Google Doc, Notion, v.v. |
| 14 |  | Báo cáo phản hồi từ đối tác | [Dán link vào đây] | [Họ tên] |  |
| 15 |  |  |  |  |  |
| 16 |  |  |  |  |  |
| 17 |  |  |  |  |  |


## Sheet: Thành viên nhóm

| DANH SÁCH THÀNH VIÊN NHÓM |  |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Thông tin thành viên và phân vai — Cập nhật khi có thay đổi nhân sự |  |  |  |  |  |  |  |  |
| STT | Họ và tên | Vai trò chính | Vai trò phụ | Email | Discord | GitHub | Cam kết (giờ/tuần) | Ghi chú |
| 1 | Thành viên 1 | Product/BA + AI/RAG Lead | QA/Eval |  |  |  | 40 | Owner thin spec, user stories, prompt/policy, citation behavior, golden test cases và demo script. |
| 2 | Thành viên 2 | Frontend/UX Lead | Demo & tài liệu |  |  |  | 40 | Owner chat UI, mode selector, citation card, feedback buttons, happy/error flow và mockup trình diễn. |
| 3 | Thành viên 3 | Backend/Data + QA Lead | DevOps nhẹ |  |  |  | 40 | Owner API mock, source schema, retrieval service, logs/audit, export evidence và kiểm thử end-to-end. |
| BẢNG THAM KHẢO PHÂN VAI |  |  |  |  |  |  |  |  |
| Vai trò | Trách nhiệm chính | Kỹ năng cần có | Công việc cụ thể trong giai đoạn RA |  |  |  |  |  |
| Trưởng nhóm (Team Lead) | Điều phối toàn bộ dự án, báo cáo mentor, chốt quyết định | Quản lý, giao tiếp, kỹ thuật | Phân việc, review code, báo cáo, gặp đối tác |  |  |  |  |  |
| Lập trình Backend | Phát triển API, cơ sở dữ liệu, logic server, xác thực người dùng | Node.js / Python / Java, SQL/NoSQL | Xây dựng API, triển khai server, viết test |  |  |  |  |  |
| Lập trình Frontend | Phát triển giao diện, trải nghiệm người dùng, tương tác | React / Vue / Flutter, CSS, HTML | Xây dựng giao diện, tích hợp API, kiểm thử |  |  |  |  |  |
| Kỹ sư AI | Mô hình AI, prompt engineering, pipeline AI, RAG | Python, LLM APIs, embedding, vector DB | Xây dựng tính năng AI, tối ưu mô hình, đánh giá |  |  |  |  |  |
| Xử lý dữ liệu / Knowledge Base | Thu thập, xử lý dữ liệu, xây dựng cơ sở tri thức | Python, xử lý dữ liệu, vector DB | Chuẩn bị dữ liệu, xây dựng KB, kiểm thử |  |  |  |  |  |
| Kiểm thử / Đảm bảo chất lượng | Kiểm thử sản phẩm, báo cáo lỗi, viết tài liệu | Công cụ test, viết tài liệu, tỉ mỉ | Viết test case, báo cáo lỗi, hướng dẫn sử dụng |  |  |  |  |  |


## Sheet: Backlog

| BACKLOG — QUẢN LÝ CÔNG VIỆC THEO SPRINT |  |  |  |  |  |  |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mọi công việc của dự án, chia theo Sprint, liên kết với User Story, có hạn chót và người phụ trách rõ ràng |  |  |  |  |  |  |  |  |  |  |  |  |  |
| STT | Mã việc | Tên công việc | Mã US liên quan | Mô tả chi tiết | Sprint | Ưu tiên | Dự kiến (giờ) | Người phụ trách | Hạn chót | Trạng thái | Link Spec / PR | Vướng mắc | Ghi chú |
|  | Sprint 1: Khởi động và Thiết kế (W1-W2) |  |  |  |  |  |  |  |  |  |  |  |  |
| 1 | T-001 | Lập Project Charter | US-001 | Xác định mục tiêu, phạm vi, đối tác, chỉ số đo lường | Sprint 1 | P0 | 4 | [Họ tên Trưởng nhóm] |  | Chưa làm |  |  |  |
| 2 | T-002 | Thiết lập GitHub và quy trình nhánh | — | Tạo kho lưu, bảo vệ nhánh, cấu hình CI/CD | Sprint 1 | P0 | 2 | [Họ tên] |  | Chưa làm |  |  |  |
| 3 | T-003 | Thiết kế sơ đồ kiến trúc hệ thống | US-001 | Thiết kế hệ thống, luồng dữ liệu, công nghệ sử dụng | Sprint 1 | P0 | 6 | [Họ tên] |  | Chưa làm |  |  |  |
| 4 | T-004 | Gặp đối tác lần đầu tiên | — | Giới thiệu dự án, lắng nghe nhu cầu thực tế | Sprint 1 | P0 | 2 | [Họ tên Trưởng nhóm] |  | Chưa làm |  |  |  |
| 5 | T-005 | Xây dựng cơ sở tri thức phiên bản 1 | US-002 | Thu thập dữ liệu, tạo vector database | Sprint 1 | P1 | 8 | [Họ tên] |  | Chưa làm |  |  |  |
|  | Sprint 2: Phát triển vòng 1 (W2-W3) |  |  |  |  |  |  |  |  |  |  |  |  |
| 6 | T-006 | Phát triển các API endpoint chính | US-003 | Xây dựng API cốt lõi cho sản phẩm | Sprint 2 | P0 | 10 | [Họ tên] |  | Chưa làm |  |  |  |
| 7 | T-007 | Phát triển giao diện chính | US-003 | Xây dựng các trang giao diện cốt lõi | Sprint 2 | P0 | 10 | [Họ tên] |  | Chưa làm |  |  |  |
| 8 | T-008 | Tích hợp mô hình AI | US-004 | Kết nối AI vào sản phẩm, tối ưu phản hồi | Sprint 2 | P0 | 8 | [Họ tên] |  | Chưa làm |  |  |  |
| 9 | T-009 | Chuẩn bị Demo lần 1 | — | Viết kịch bản demo, kiểm tra luồng, triển khai staging | Sprint 2 | P0 | 4 | [Họ tên] |  | Chưa làm |  |  |  |
|  | Sprint 3: Phát triển vòng 2 và Sửa lỗi (W4-W5) |  |  |  |  |  |  |  |  |  |  |  |  |
| 10 | T-010 | Xử lý phản hồi từ Demo 1 | — | Triển khai phản hồi từ đối tác sau Demo 1 | Sprint 3 | P0 | 6 | [Họ tên] |  | Chưa làm |  |  |  |
| 11 | T-011 | Phát triển thêm tính năng từ phản hồi | US-005 | Thêm tính năng mới theo yêu cầu đối tác | Sprint 3 | P1 | 8 | [Họ tên] |  | Chưa làm |  |  |  |
| 12 | T-012 | Kiểm thử toàn diện và Sửa lỗi | — | Kiểm tra kỹ lưỡng, sửa tất cả lỗi phát hiện | Sprint 3 | P0 | 6 | [Họ tên] |  | Chưa làm |  |  |  |
|  | Sprint 4: Hoàn thiện và Bàn giao (W6) |  |  |  |  |  |  |  |  |  |  |  |  |
| 13 | T-013 | Triển khai lên môi trường thực tế | — | Cấu hình production, triển khai, xác nhận hoạt động | Sprint 4 | P0 | 4 | [Họ tên] |  | Chưa làm |  |  |  |
| 14 | T-014 | Kiểm thử cuối cùng và Tinh chỉnh giao diện | — | Kiểm tra toàn diện, hoàn thiện trải nghiệm người dùng | Sprint 4 | P0 | 6 | [Họ tên] |  | Chưa làm |  |  |  |
| 15 | T-015 | Viết tài liệu hướng dẫn | — | README, hướng dẫn sử dụng, tài liệu API | Sprint 4 | P1 | 4 | [Họ tên] |  | Chưa làm |  |  |  |
| 16 | T-016 | Chuẩn bị thuyết trình cuối kỳ | — | Slide, kịch bản demo, báo cáo tác động | Sprint 4 | P0 | 4 | [Họ tên Trưởng nhóm] |  | Chưa làm |  |  |  |
| 17 | T-017 |  |  |  |  |  |  |  |  |  |  |  |  |
| 18 | T-018 |  |  |  |  |  |  |  |  |  |  |  |  |
| 19 | T-019 |  |  |  |  |  |  |  |  |  |  |  |  |
| 20 | T-020 |  |  |  |  |  |  |  |  |  |  |  |  |
| 21 | T-021 |  |  |  |  |  |  |  |  |  |  |  |  |
| 22 | T-022 |  |  |  |  |  |  |  |  |  |  |  |  |
| 23 | T-023 |  |  |  |  |  |  |  |  |  |  |  |  |
| 24 | T-024 |  |  |  |  |  |  |  |  |  |  |  |  |


## Sheet: Theo dõi lỗi

| THEO DÕI LỖI (BUG TRACKING) |  |  |  |  |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Báo cáo ngay khi phát hiện lỗi — Cập nhật trạng thái khi xử lý xong |  |  |  |  |  |  |  |  |  |  |  |
| STT | Mã lỗi | Tiêu đề lỗi | Mô tả chi tiết | Cách tái hiện | Mức nghiêm trọng | Ưu tiên | Mã US liên quan | Người xử lý | Ngày phát hiện | Trạng thái | Ngày sửa / Ghi chú |
| 1 | BUG-001 | [Tiêu đề lỗi, ví dụ: Chatbot không trả lời khi nhập tiếng Việt có dấu] | [Mô tả chi tiết hiện tượng] | 1. Mở trang chat 2. Nhập câu hỏi có dấu 3. Quan sát phản hồi | Nghiêm trọng | P0 | US-001 | [Họ tên người xử lý] |  | Mở |  |
| 2 | BUG-002 |  |  |  |  |  |  |  |  |  |  |
| 3 | BUG-003 |  |  |  |  |  |  |  |  |  |  |
| 4 | BUG-004 |  |  |  |  |  |  |  |  |  |  |
| 5 | BUG-005 |  |  |  |  |  |  |  |  |  |  |
| 6 | BUG-006 |  |  |  |  |  |  |  |  |  |  |
| 7 | BUG-007 |  |  |  |  |  |  |  |  |  |  |
| 8 | BUG-008 |  |  |  |  |  |  |  |  |  |  |
| 9 | BUG-009 |  |  |  |  |  |  |  |  |  |  |
| 10 | BUG-010 |  |  |  |  |  |  |  |  |  |  |
| 11 | BUG-011 |  |  |  |  |  |  |  |  |  |  |
| 12 | BUG-012 |  |  |  |  |  |  |  |  |  |  |
| 13 | BUG-013 |  |  |  |  |  |  |  |  |  |  |
| 14 | BUG-014 |  |  |  |  |  |  |  |  |  |  |
| 15 | BUG-015 |  |  |  |  |  |  |  |  |  |  |
| 16 | BUG-016 |  |  |  |  |  |  |  |  |  |  |
| 17 | BUG-017 |  |  |  |  |  |  |  |  |  |  |
| 18 | BUG-018 |  |  |  |  |  |  |  |  |  |  |
| 19 | BUG-019 |  |  |  |  |  |  |  |  |  |  |
| 20 | BUG-020 |  |  |  |  |  |  |  |  |  |  |
| 21 | BUG-021 |  |  |  |  |  |  |  |  |  |  |
| 22 | BUG-022 |  |  |  |  |  |  |  |  |  |  |
| 23 | BUG-023 |  |  |  |  |  |  |  |  |  |  |
| 24 | BUG-024 |  |  |  |  |  |  |  |  |  |  |
| 25 | BUG-025 |  |  |  |  |  |  |  |  |  |  |
| 26 | BUG-026 |  |  |  |  |  |  |  |  |  |  |
| 27 | BUG-027 |  |  |  |  |  |  |  |  |  |  |
| 28 | BUG-028 |  |  |  |  |  |  |  |  |  |  |
| 29 | BUG-029 |  |  |  |  |  |  |  |  |  |  |
| 30 | BUG-030 |  |  |  |  |  |  |  |  |  |  |
| 31 | BUG-031 |  |  |  |  |  |  |  |  |  |  |
| THANG MỨC NGHIÊM TRỌNG |  |  |  |  |  |  |  |  |  |  |  |
| Nghiêm trọng | Ứng dụng sập hoặc mất dữ liệu — Không thể sử dụng được |  |  |  |  |  |  |  |  |  |  |
| Cao | Tính năng chính không hoạt động đúng, ảnh hưởng nhiều người dùng |  |  |  |  |  |  |  |  |  |  |
| Trung bình | Tính năng phụ bị lỗi, trải nghiệm không tốt nhưng vẫn dùng được |  |  |  |  |  |  |  |  |  |  |
| Thấp | Lỗi nhỏ, liên quan giao diện, không ảnh hưởng chức năng |  |  |  |  |  |  |  |  |  |  |


## Sheet: Tài liệu quan trọng

| DANH SÁCH TÀI LIỆU QUAN TRỌNG |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Tập hợp link tới mọi tài liệu dự án — Cập nhật ngay khi có tài liệu mới |  |  |  |  |  |  |  |
| STT | Phân loại | Tên tài liệu | Mô tả ngắn | Đường link | Người tạo | Ngày tạo | Cập nhật lần cuối |
|  | Quy trình và Hướng dẫn |  |  |  |  |  |  |
| 1 |  | Project Charter (Hiến chương dự án) | Mục tiêu, phạm vi, đối tác, chỉ số đo lường thành công | [Dán link vào đây] | [Họ tên] |  |  |
| 2 |  | Quy chế làm việc nội bộ | Quy tắc phân việc, họp hành, liên lạc | [Dán link vào đây] | [Họ tên] |  |  |
| 3 |  | Lộ trình 6 tuần (chi tiết) | Kế hoạch từng tuần từ W1 đến W6 | [Dán link vào đây] | [Họ tên] |  |  |
|  | Thiết kế và Đặc tả |  |  |  |  |  |  |
| 4 |  | Sơ đồ kiến trúc hệ thống | Kiến trúc tổng thể, các thành phần, luồng dữ liệu | [Dán link vào đây] | [Họ tên] |  |  |
| 5 |  | Tài liệu thiết kế giải pháp | Phương án kỹ thuật, công nghệ, data model | [Dán link vào đây] | [Họ tên] |  |  |
| 6 |  | Tài liệu API | Swagger / Postman — Danh sách endpoints | [Dán link vào đây] | [Họ tên] |  |  |
| 7 |  | Sơ đồ cơ sở dữ liệu | ER diagram, cấu trúc bảng, quan hệ | [Dán link vào đây] | [Họ tên] |  |  |
| 8 |  | Thiết kế giao diện (Wireframes) | Figma / design files — Mô phỏng giao diện | [Dán link vào đây] | [Họ tên] |  |  |
|  | Báo cáo và Biên bản họp |  |  |  |  |  |  |
| 9 |  | Biên bản họp với đối tác | Ghi chép mọi buổi gặp với stakeholder | [Dán link vào đây] | [Họ tên] |  |  |
| 10 |  | Báo cáo phản hồi Demo 1 | Phản hồi từ đối tác sau buổi demo lần 1 | [Dán link vào đây] | [Họ tên] |  |  |
| 11 |  | Báo cáo phản hồi Demo 2 | Phản hồi từ đối tác sau buổi demo lần 2 | [Dán link vào đây] | [Họ tên] |  |  |
| 12 |  | Báo cáo tuần | Tổng hợp tình hình từng tuần gửi mentor | [Dán link vào đây] | [Họ tên] |  |  |
|  | Tài liệu kỹ thuật |  |  |  |  |  |  |
| 13 |  | README.md (GitHub) | Hướng dẫn cài đặt, chạy, triển khai dự án | [Dán link vào đây] | [Họ tên] |  |  |
| 14 |  | Hướng dẫn triển khai (Deployment Guide) | Quy trình deploy lên staging và production | [Dán link vào đây] | [Họ tên] |  |  |
| 15 |  | Tài liệu kiểm thử | Test cases, kết quả test, ghi chú QA | [Dán link vào đây] | [Họ tên] |  |  |
| 16 |  | Hướng dẫn cài đặt môi trường | Cài đặt môi trường phát triển cho thành viên mới | [Dán link vào đây] | [Họ tên] |  |  |
|  | Tác động và Thuyết trình |  |  |  |  |  |  |
| 17 |  | Báo cáo tác động (Impact Report) | Chỉ số đo lường, kết quả thực tế, bài học | [Dán link vào đây] | [Họ tên] |  |  |
| 18 |  | Slide thuyết trình cuối kỳ | Slide cho buổi đánh giá cuối kỳ | [Dán link vào đây] | [Họ tên] |  |  |
| 19 |  | Kịch bản demo | Kịch bản chi tiết cho Demo 1 và Demo 2 | [Dán link vào đây] | [Họ tên] |  |  |
| 20 |  |  |  |  |  |  |  |
| 21 |  |  |  |  |  |  |  |
| 22 |  |  |  |  |  |  |  |


## Sheet: Hướng dẫn sử dụng

| HƯỚNG DẪN SỬ DỤNG TEMPLATE |  |  |  |  |
| --- | --- | --- | --- | --- |
| Đọc kỹ trước khi bắt đầu điền — Tránh sai sót và tận dụng tối đa các tính năng |  |  |  |  |
| A. TỔNG QUAN VỀ TEMPLATE |  |  |  |  |
| Mục đích | Template này là hồ sơ quản lý dự án duy nhất của nhóm. Mọi thông tin về tiến độ, công việc, lỗi, và tài liệu đều được ghi nhận tại đây. Trưởng nhóm chịu trách nhiệm cập nhật liên tục. |  |  |  |
| Nguyên tắc cốt lõi | • Chỉ có 1 bản duy nhất — không tách file, không copy • Cập nhật ít nhất 1 lần/ngày trong giờ làm việc • Mọi thành viên đều đọc được, chỉ Trưởng nhóm và người được ủy quyền mới sửa |  |  |  |
| Đối tượng sử dụng | • Trưởng nhóm: Quản lý, phân việc, báo cáo • Thành viên: Xem công việc, cập nhật trạng thái • Mentor: Theo dõi tiến độ, đánh giá • Đối tác (Stakeholder): XemDemo, phản hồi |  |  |  |
| B. HƯỚNG DẪN TỪNG SHEET |  |  |  |  |
| 1. Tổng hợp | • Điền thông tin dự án ở phần đầu (tên, nhóm, ngày, trưởng nhóm) • Chọn "Tình hình hiện tại" ở ô B3: Đúng tiến độ / Có rủi ro / Bị kẹt • Các chỉ số ở dưới sẽ tự động đếm từ các sheet khác (không cần điền tay) • Cập nhật trạng thái Sprint khi bắt đầu/kết thúc mỗi Sprint |  |  |  |
| 2. Đường link quan trọng | • Dán mọi link liên quan vào đúng phân loại • Khi thêm link mới, điền ngay "Người quản lý" để biết ai phụ trách • Xóa placeholder [Dán link vào đây] khi đã điền link thật |  |  |  |
| 3. Thành viên nhóm | • Điền đủ 4 thành viên với vai trò chính xác • Tham khảo bảng phân vai bên dưới để hiểu trách nhiệm mỗi vai • Cập nhật nếu có thay đổi nhân sự |  |  |  |
| 4. Danh sách User Story | • Viết theo cấu trúc: "Với vai trò [X], tôi muốn [Y], để đạt được [Z]" • Chọn Mức ưu tiên từ dropdown: Bắt buộc / Nên có / Có thì tốt / Không làm • Mã US (US-001, US-002...) dùng để liên kết với Backlog và Đặc tả |  |  |  |
| 5. Lộ trình | • 8 mốc quan trọng đã được tạo sẵn theo quy trình 6 tuần • Cập nhật ngày cụ thể khi bắt đầu dự án • Chuyển trạng thái sang "Hoàn thành" ngay khi đạt được mốc |  |  |  |
| 6. Backlog | • Đây là sheet quan trọng nhất — Phân công và theo dõi mọi công việc • Mỗi việc phải có: Mã US liên quan, Người phụ trách, Hạn chót, Trạng thái • Ưu tiên P0 = phải làm ngay, P3 = làm nếu còn thời gian • Trạng thái sẽ tự đổi màu: Xanh = Hoàn thành, Vàng = Đang làm, Đỏ = Bị kẹt |  |  |  |
| 7. Đặc tả tính năng | • Viết đặc tả theo 3 phần: Động lực → Thiết kế → Kế hoạch • Mỗi tính năng quan trọng cần có 1 đặc tả riêng • Liên kết mã US và mã Task từ Backlog để dễ tra cứu |  |  |  |
| 8. Theo dõi lỗi | • Báo lỗi ngay khi phát hiện — không đợi • Điền đủ "Cách tái hiện" để người sửa hiểu rõ vấn đề • Chọn Mức nghiêm trọng phù hợp (xem thang đo ở cuối sheet) • Màu tự động hiện: Đỏ = Nghiêm trọng, Vàng = Trung bình, Xanh = Thấp |  |  |  |
| 9. Tài liệu quan trọng | • Lưu link mọi tài liệu dự án theo đúng phân loại • Cập nhật "Cập nhật lần cuối" mỗi khi sửa tài liệu • Đây là nơi duy nhất để tìm tài liệu — không để link rải rác ở Discord/Email |  |  |  |
| C. MẸO SỬ DỤNG HIỆU QUẢ |  |  |  |  |
| Dropdown tự động | Nhiều cột đã có sẵn danh sách chọn (Priority, Status, Severity). Nhấn vào ô và chọn từ dropdown — không gõ tay để tránh sai chính tả. |  |  |  |
| Màu sắc tự động | Trạng thái sẽ tự đổi màu theo giá trị: • Xanh lá = Hoàn thành / Thấp • Vàng = Đang làm / Trung bình • Đỏ = Bị kẹt / Nghiêm trọng / P0 |  |  |  |
| Công thức tự động | Một số ô ở sheet Tổng hợp sẽ tự động đếm số lượng từ các sheet khác. KHÔNG sửa các ô có công thức (bắt đầu bằng dấu =). |  |  |  |
| Liên kết giữa các sheet | Mã User Story (US-001) xuất hiện ở 4 sheet: Danh sách US, Backlog, Đặc tả, và Theo dõi lỗi. Dùng mã này để tra cứu chéo. |  |  |  |
| Quy trình hàng ngày | 1. Sáng: Mở file, kiểm tra công việc hôm nay trong Backlog 2. Trong ngày: Cập nhật trạng thái công việc khi thay đổi 3. Chiều: Báo cáo standup dựa trên thông tin trong file 4. Tối: Trưởng nhóm kiểm tra và tổng hợp |  |  |  |
| D. LƯU Ý QUAN TRỌNG |  |  |  |  |
| Không xóa dòng có sẵn | Các dòng đã có mã (US-001, T-001, BUG-001) được giữ sẵn để điền. Chỉ cần điền nội dung, không cần thêm dòng mới trừ khi hết chỗ. |  |  |  |
| Luôn lưu (Ctrl+S) | Nếu dùng Google Sheets, dữ liệu tự lưu. Nếu dùng Excel, nhớ lưu thường xuyên. |  |  |  |
| Bảo mật | Không chia sẻ file công khai. Chỉ chia sẻ cho thành viên nhóm và mentor. |  |  |  |


