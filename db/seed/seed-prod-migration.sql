-- ============================================================================
-- PROD MIGRATION: Questions + Hints Seed
-- Target: mentora (prod) — elwyhewuqqlpquzbvtnz
-- Run in: Supabase Dashboard → SQL Editor (mentora project)
-- Note: Schema đã apply xong. File này chỉ seed Questions + Hints.
-- Idempotent: YES — all ON CONFLICT DO UPDATE / DO NOTHING
-- ============================================================================

-- ============================================================================
-- STEP 1: Disable RLS tạm thời để seed data (re-enable sau nếu cần)
-- ============================================================================
ALTER TABLE app.student_concept_mastery DISABLE ROW LEVEL SECURITY;
ALTER TABLE app.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE app.quiz_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit.bandit_arms DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit.adaptive_policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit.adaptive_decisions DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit.adaptive_rewards DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit.mastery_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit.question_elo_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE app.hint_logs DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Seed Questions từ seed-questions.sql (Day 1-10 cơ bản)
-- ============================================================================

-- Day 1 Question (concept 101 - day1-basics)
INSERT INTO app.questions (id, course_id, concept_id, type, prompt, answer_key, difficulty_elo, calibration_status)
VALUES (
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000101',
    'mcq',
    'Kiến trúc Transformer giới thiệu cơ chế nào giúp xử lý song song thay thế RNN?',
    '{"options": {"A": "Cơ chế Convolutional Pooling.", "B": "Cơ chế Recurrent Gate.", "C": "Cơ chế Self Attention.", "D": "Cơ chế Feed Forward."}, "correct": "C", "explanation": "Cơ chế Self Attention cho phép các token trong chuỗi tương tác đồng thời với nhau, loại bỏ tính tuần tự của RNN/LSTM và tăng tốc độ tính toán song song."}'::jsonb,
    1200.00, 'published'
) ON CONFLICT (id) DO UPDATE SET prompt = EXCLUDED.prompt, answer_key = EXCLUDED.answer_key;

INSERT INTO app.question_hints (id, question_id, level, hint_text) VALUES ('00000000-0000-0000-0000-000000003011', '00000000-0000-0000-0000-000000000201', 1, 'Kiến trúc Transformer loại bỏ hoàn toàn việc xử lý tuần tự (RNN) để xử lý song song. Hãy nghĩ về cơ chế giúp kết nối trực tiếp các từ.') ON CONFLICT (question_id, level) DO UPDATE SET hint_text = EXCLUDED.hint_text;
INSERT INTO app.question_hints (id, question_id, level, hint_text) VALUES ('00000000-0000-0000-0000-000000003012', '00000000-0000-0000-0000-000000000201', 2, 'Cơ chế này tính toán độ tương đồng giữa các từ thông qua phép nhân ma trận Query và Key.') ON CONFLICT (question_id, level) DO UPDATE SET hint_text = EXCLUDED.hint_text;
INSERT INTO app.question_hints (id, question_id, level, hint_text) VALUES ('00000000-0000-0000-0000-000000003013', '00000000-0000-0000-0000-000000000201', 3, 'Đây chính là cơ chế ''Tự chú ý'' (Self Attention), trái tim của mạng Transformer.') ON CONFLICT (question_id, level) DO UPDATE SET hint_text = EXCLUDED.hint_text;

-- Day 2 Question
INSERT INTO app.questions (id, course_id, concept_id, type, prompt, answer_key, difficulty_elo, calibration_status)
VALUES (
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000102',
    'mcq',
    'Khi bắt đầu một dự án AI, bước nào cần được ưu tiên thực hiện trước nhất để định hình bài toán?',
    '{"options": {"A": "Lựa chọn dòng card đồ họa GPU đắt tiền nhất để chạy.", "B": "Xác định rõ vấn đề kinh doanh, mục tiêu và nguồn dữ liệu.", "C": "Viết code huấn luyện các mô hình học sâu phức tạp ngay.", "D": "Thiết kế giao diện người dùng frontend thật bắt mắt cho app."}, "correct": "B", "explanation": "Định nghĩa rõ ràng mục tiêu kinh doanh và chuẩn bị dữ liệu sạch là bước quyết định sự thành bại của bất kỳ dự án AI nào trước khi chọn mô hình hoặc hạ tầng phần cứng."}'::jsonb,
    1200.00, 'published'
) ON CONFLICT (id) DO UPDATE SET prompt = EXCLUDED.prompt, answer_key = EXCLUDED.answer_key;

INSERT INTO app.question_hints (id, question_id, level, hint_text) VALUES ('00000000-0000-0000-0000-000000003021', '00000000-0000-0000-0000-000000000202', 1, 'Trước khi chọn mô hình hay viết code, chúng ta cần hiểu rõ mục tiêu mình muốn đạt được và tài nguyên đang có.') ON CONFLICT (question_id, level) DO UPDATE SET hint_text = EXCLUDED.hint_text;
INSERT INTO app.question_hints (id, question_id, level, hint_text) VALUES ('00000000-0000-0000-0000-000000003022', '00000000-0000-0000-0000-000000000202', 2, 'Hãy nghĩ đến việc thu thập dữ liệu và xác định các yêu vụ thực tế.') ON CONFLICT (question_id, level) DO UPDATE SET hint_text = EXCLUDED.hint_text;
INSERT INTO app.question_hints (id, question_id, level, hint_text) VALUES ('00000000-0000-0000-0000-000000003023', '00000000-0000-0000-0000-000000000202', 3, 'Việc xác định rõ vấn đề kinh doanh, mục tiêu và nguồn dữ liệu là nền tảng bắt buộc trước khi bắt tay vào kỹ thuật.') ON CONFLICT (question_id, level) DO UPDATE SET hint_text = EXCLUDED.hint_text;

-- Day 3 Question
INSERT INTO app.questions (id, course_id, concept_id, type, prompt, answer_key, difficulty_elo, calibration_status)
VALUES (
    '00000000-0000-0000-0000-000000000203',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000103',
    'mcq',
    'Một chatbot FAQ trả lời sai khi người dùng hỏi tồn kho hiện tại. Khi nào nên chuyển bài toán này sang ReAct Agent?',
    '{"options": {"A": "Khi câu trả lời cần đọc tồn kho mới nhất rồi quyết định phản hồi.", "B": "Khi câu trả lời cần văn phong tự nhiên hơn và dài hơn bình thường.", "C": "Khi câu trả lời chỉ lấy từ danh sách FAQ đã duyệt sẵn.", "D": "Khi câu trả lời cần dịch sang nhiều ngôn ngữ khác nhau ngay."}, "correct": "A", "explanation": "ReAct Agent phù hợp khi câu trả lời phụ thuộc dữ liệu động từ công cụ, không chỉ kiến thức tĩnh trong prompt."}'::jsonb,
    1200.00, 'published'
) ON CONFLICT (id) DO UPDATE SET prompt = EXCLUDED.prompt, answer_key = EXCLUDED.answer_key;

INSERT INTO app.question_hints (id, question_id, level, hint_text) VALUES ('00000000-0000-0000-0000-000000003031', '00000000-0000-0000-0000-000000000203', 1, 'ReAct Agent khác biệt ở chỗ nó có khả năng suy nghĩ (Thought) và hành động (Action) thông qua việc gọi các công cụ ngoài.') ON CONFLICT (question_id, level) DO UPDATE SET hint_text = EXCLUDED.hint_text;
INSERT INTO app.question_hints (id, question_id, level, hint_text) VALUES ('00000000-0000-0000-0000-000000003032', '00000000-0000-0000-0000-000000000203', 2, 'Dữ liệu tĩnh như FAQ không cần cập nhật liên tục, nhưng dữ liệu động như số lượng hàng tồn kho trong kho thì cần gọi API/Tool.') ON CONFLICT (question_id, level) DO UPDATE SET hint_text = EXCLUDED.hint_text;
INSERT INTO app.question_hints (id, question_id, level, hint_text) VALUES ('00000000-0000-0000-0000-000000003033', '00000000-0000-0000-0000-000000000203', 3, 'Khi câu trả lời cần truy vấn thông tin tồn kho mới nhất theo thời gian thực từ cơ sở dữ liệu.') ON CONFLICT (question_id, level) DO UPDATE SET hint_text = EXCLUDED.hint_text;

-- Day 4 Question
INSERT INTO app.questions (id, course_id, concept_id, type, prompt, answer_key, difficulty_elo, calibration_status)
VALUES (
    '00000000-0000-0000-0000-000000000204',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000104',
    'mcq',
    'Khác biệt cốt lõi giữa prompt engineering và context engineering là gì?',
    '{"options": {"A": "Prompt engineering chỉ tối ưu câu lệnh, còn context engineering quản lý toàn bộ thông tin trong lượt suy luận.", "B": "Prompt engineering luôn dùng công cụ ngoài, còn context engineering chỉ dùng văn bản trong system prompt.", "C": "Prompt engineering chỉ dành cho mô hình nhỏ, còn context engineering chỉ dành cho mô hình chạy offline.", "D": "Prompt engineering xử lý bảo mật mạng, còn context engineering chỉ kiểm tra cú pháp JSON đầu ra."}, "correct": "A", "explanation": "Prompt là một phần của context. Context engineering quản lý system prompt, history, tool definitions, dữ liệu ngoài và kết quả công cụ trong từng lượt gọi."}'::jsonb,
    1200.00, 'published'
) ON CONFLICT (id) DO UPDATE SET prompt = EXCLUDED.prompt, answer_key = EXCLUDED.answer_key;

INSERT INTO app.question_hints (id, question_id, level, hint_text) VALUES ('00000000-0000-0000-0000-000000003041', '00000000-0000-0000-0000-000000000204', 1, 'Prompt chỉ là câu lệnh đơn lẻ mà bạn gửi cho mô hình. Hãy nghĩ về bức tranh toàn cảnh rộng lớn hơn trong một cuộc hội thoại.') ON CONFLICT (question_id, level) DO UPDATE SET hint_text = EXCLUDED.hint_text;
INSERT INTO app.question_hints (id, question_id, level, hint_text) VALUES ('00000000-0000-0000-0000-000000003042', '00000000-0000-0000-0000-000000000204', 2, 'Context (ngữ cảnh) bao gồm lịch sử trò chuyện, biến hệ thống, kết quả gọi công cụ và toàn bộ bộ nhớ đệm.') ON CONFLICT (question_id, level) DO UPDATE SET hint_text = EXCLUDED.hint_text;
INSERT INTO app.question_hints (id, question_id, level, hint_text) VALUES ('00000000-0000-0000-0000-000000003043', '00000000-0000-0000-0000-000000000204', 3, 'Sự khác biệt nằm ở chỗ prompt chỉ là câu lệnh tối ưu, còn context engineering quản lý toàn bộ vòng đời và luồng thông tin.') ON CONFLICT (question_id, level) DO UPDATE SET hint_text = EXCLUDED.hint_text;

-- Day 5 Question
INSERT INTO app.questions (id, course_id, concept_id, type, prompt, answer_key, difficulty_elo, calibration_status)
VALUES (
    '00000000-0000-0000-0000-000000000205',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000105',
    'mcq',
    'Điểm khác biệt cốt lõi giữa phần mềm truyền thống và sản phẩm AI là gì?',
    '{"options": {"A": "Phần mềm truyền thống xử lý logic xác định, còn AI dự đoán theo xác suất và luôn có sai số.", "B": "Phần mềm truyền thống không cần yêu cầu, còn AI chỉ cần giao diện đẹp để hoạt động đúng.", "C": "Phần mềm truyền thống luôn chạy offline, còn AI chỉ chạy được khi có dữ liệu mạng xã hội.", "D": "Phần mềm truyền thống không thể có bug, còn AI chỉ sai khi lập trình viên viết thiếu code."}, "correct": "A", "explanation": "AI không vận hành theo đúng/sai tuyệt đối như phần mềm xác định. Nó tạo dự đoán xác suất nên sản phẩm phải thiết kế cho sai số và độ tin cậy."}'::jsonb,
    1200.00, 'published'
) ON CONFLICT (id) DO UPDATE SET prompt = EXCLUDED.prompt, answer_key = EXCLUDED.answer_key;

INSERT INTO app.question_hints (id, question_id, level, hint_text) VALUES ('00000000-0000-0000-0000-000000003051', '00000000-0000-0000-0000-000000000205', 1, 'Phần mềm truyền thống chạy theo các quy tắc logic cứng (If-Else) nên kết quả luôn cố định. AI học từ dữ liệu nên hoạt động thế nào?') ON CONFLICT (question_id, level) DO UPDATE SET hint_text = EXCLUDED.hint_text;
INSERT INTO app.question_hints (id, question_id, level, hint_text) VALUES ('00000000-0000-0000-0000-000000003052', '00000000-0000-0000-0000-000000000205', 2, 'Mô hình AI đưa ra các kết quả dựa trên xác suất, do đó không thể tránh khỏi các sai số hoặc ảo giác.') ON CONFLICT (question_id, level) DO UPDATE SET hint_text = EXCLUDED.hint_text;
INSERT INTO app.question_hints (id, question_id, level, hint_text) VALUES ('00000000-0000-0000-0000-000000003053', '00000000-0000-0000-0000-000000000205', 3, 'Khác biệt cốt lõi là phần mềm truyền thống xử lý logic xác định (deterministic), còn AI dự đoán theo xác suất (probabilistic).') ON CONFLICT (question_id, level) DO UPDATE SET hint_text = EXCLUDED.hint_text;

-- Day 6 Question
INSERT INTO app.questions (id, course_id, concept_id, type, prompt, answer_key, difficulty_elo, calibration_status)
VALUES (
    '00000000-0000-0000-0000-000000000206',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000106',
    'mcq',
    'Trong một sự kiện Hackathon Day của sản phẩm AI, mục tiêu quan trọng nhất khi xây dựng sản phẩm mẫu (Prototype) là gì?',
    '{"options": {"A": "Tập trung hoàn thiện một luồng trải nghiệm cốt lõi (core flow) bằng dữ liệu thực tế.", "B": "Xây dựng toàn bộ tất cả các tính năng phụ của ứng dụng để người dùng dùng thử.", "C": "Viết báo cáo chi tiết về kế hoạch phát triển sản phẩm trong vòng năm năm tới.", "D": "Thiết kế giao diện đồ họa đẹp mắt và bóng bẩy nhất có thể mà không cần chạy được."}, "correct": "A", "explanation": "Trong Hackathon, thời gian có hạn nên việc tập trung hoàn thành một luồng cốt lõi (core flow) chạy được là điều tối quan trọng để chứng minh tính khả thi."}'::jsonb,
    1200.00, 'published'
) ON CONFLICT (id) DO UPDATE SET prompt = EXCLUDED.prompt, answer_key = EXCLUDED.answer_key;

INSERT INTO app.question_hints (id, question_id, level, hint_text) VALUES ('00000000-0000-0000-0000-000000003061', '00000000-0000-0000-0000-000000000206', 1, 'Một cuộc thi Hackathon diễn ra trong thời gian rất ngắn (thường chỉ 24-48 giờ). Bạn có nên cố xây dựng toàn bộ hệ thống không?') ON CONFLICT (question_id, level) DO UPDATE SET hint_text = EXCLUDED.hint_text;
INSERT INTO app.question_hints (id, question_id, level, hint_text) VALUES ('00000000-0000-0000-0000-000000003062', '00000000-0000-0000-0000-000000000206', 2, 'Mục tiêu hàng đầu là chứng minh ý tưởng cốt lõi của bạn hoạt động được và mang lại giá trị.') ON CONFLICT (question_id, level) DO UPDATE SET hint_text = EXCLUDED.hint_text;
INSERT INTO app.question_hints (id, question_id, level, hint_text) VALUES ('00000000-0000-0000-0000-000000003063', '00000000-0000-0000-0000-000000000206', 3, 'Tập trung hoàn thiện một luồng trải nghiệm cốt lõi (core flow) chạy được và ổn định bằng dữ liệu thực tế.') ON CONFLICT (question_id, level) DO UPDATE SET hint_text = EXCLUDED.hint_text;

-- Day 7 Question
INSERT INTO app.questions (id, course_id, concept_id, type, prompt, answer_key, difficulty_elo, calibration_status)
VALUES (
    '00000000-0000-0000-0000-000000000207',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000107',
    'mcq',
    'Khi một Agent trả lời sai hoặc gặp hiện tượng ảo giác (hallucination) do dữ liệu đầu vào bị lỗi hoặc chưa được làm sạch, giải pháp nào dưới đây là hiệu quả và đúng đắn nhất?',
    '{"options": {"A": "Chuyển sang sử dụng một mô hình ngôn ngữ lớn (LLM) khác đắt tiền và mạnh mẽ hơn.", "B": "Tăng độ dài của Context Window và nạp thêm toàn bộ tài liệu thô vào prompt.", "C": "Tiến hành lọc sạch, chuẩn hóa và xử lý chất lượng của nguồn dữ liệu đầu vào.", "D": "Thiết lập nhiệt độ (temperature) của mô hình về giá trị cao nhất để tăng tính sáng tạo."}, "correct": "C", "explanation": "Theo nguyên tắc ''Garbage In, Garbage Out'', chất lượng dữ liệu đầu vào quyết định tính chính xác của Agent."}'::jsonb,
    1200.00, 'published'
) ON CONFLICT (id) DO UPDATE SET prompt = EXCLUDED.prompt, answer_key = EXCLUDED.answer_key;

INSERT INTO app.question_hints (id, question_id, level, hint_text) VALUES ('00000000-0000-0000-0000-000000003071', '00000000-0000-0000-0000-000000000207', 1, 'Nguyên tắc vàng trong khoa học dữ liệu là ''Garbage In, Garbage Out''.') ON CONFLICT (question_id, level) DO UPDATE SET hint_text = EXCLUDED.hint_text;
INSERT INTO app.question_hints (id, question_id, level, hint_text) VALUES ('00000000-0000-0000-0000-000000003072', '00000000-0000-0000-0000-000000000207', 2, 'Nếu dữ liệu đầu vào bị sai lệch hoặc chứa rác, việc đổi mô hình đắt tiền hơn cũng chỉ tạo ra câu trả lời sai bóng bẩy hơn.') ON CONFLICT (question_id, level) DO UPDATE SET hint_text = EXCLUDED.hint_text;
INSERT INTO app.question_hints (id, question_id, level, hint_text) VALUES ('00000000-0000-0000-0000-000000003073', '00000000-0000-0000-0000-000000000207', 3, 'Bạn cần tập trung vào việc lọc sạch, chuẩn hóa cấu trúc và xử lý chất lượng của nguồn dữ liệu đầu vào.') ON CONFLICT (question_id, level) DO UPDATE SET hint_text = EXCLUDED.hint_text;

-- Day 8 Question
INSERT INTO app.questions (id, course_id, concept_id, type, prompt, answer_key, difficulty_elo, calibration_status)
VALUES (
    '00000000-0000-0000-0000-000000000208',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000108',
    'mcq',
    'Vấn đề cốt lõi nào dưới đây mà kỹ thuật RAG (Retrieval-Augmented Generation) được thiết kế để giải quyết cho mô hình ngôn ngữ lớn?',
    '{"options": {"A": "Cung cấp chứng cứ thực tế từ kho dữ liệu ngoài để hạn chế ảo giác và cập nhật kiến thức mới.", "B": "Huấn luyện lại toàn bộ tham số của mô hình ngôn ngữ lớn để ghi nhớ thêm các tri thức mới.", "C": "Mở rộng kích thước cửa sổ ngữ cảnh của mô hình ngôn ngữ lớn để nạp toàn bộ tài liệu thô.", "D": "Điều chỉnh các tham số giải mã của mô hình ngôn ngữ lớn để tăng tính sáng tạo khi sinh."}, "correct": "A", "explanation": "RAG cung cấp thông tin thực tế từ bên ngoài để giúp LLM trả lời chính xác, tránh ảo giác và vượt qua giới hạn ngày đóng băng kiến thức (knowledge cutoff)."}'::jsonb,
    1200.00, 'published'
) ON CONFLICT (id) DO UPDATE SET prompt = EXCLUDED.prompt, answer_key = EXCLUDED.answer_key;

INSERT INTO app.question_hints (id, question_id, level, hint_text) VALUES ('00000000-0000-0000-0000-000000003081', '00000000-0000-0000-0000-000000000208', 1, 'Mô hình ngôn ngữ lớn bị giới hạn bởi ngày đóng băng kiến thức và không có quyền truy cập vào tài liệu nội bộ của doanh nghiệp.') ON CONFLICT (question_id, level) DO UPDATE SET hint_text = EXCLUDED.hint_text;
INSERT INTO app.question_hints (id, question_id, level, hint_text) VALUES ('00000000-0000-0000-0000-000000003082', '00000000-0000-0000-0000-000000000208', 2, 'RAG giúp ''cắm'' thêm một thư viện tài liệu bên ngoài để LLM tra cứu thông tin trước khi trả lời.') ON CONFLICT (question_id, level) DO UPDATE SET hint_text = EXCLUDED.hint_text;
INSERT INTO app.question_hints (id, question_id, level, hint_text) VALUES ('00000000-0000-0000-0000-000000003083', '00000000-0000-0000-0000-000000000208', 3, 'RAG cung cấp chứng cứ thực tế từ kho dữ liệu ngoài để hạn chế ảo giác và cập nhật các thông tin mới nhất.') ON CONFLICT (question_id, level) DO UPDATE SET hint_text = EXCLUDED.hint_text;

-- Day 9 Question
INSERT INTO app.questions (id, course_id, concept_id, type, prompt, answer_key, difficulty_elo, calibration_status)
VALUES (
    '00000000-0000-0000-0000-000000000209',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000109',
    'mcq',
    'Nguyên nhân chính dẫn đến hiện tượng ''God Agent'' trong thiết kế hệ thống trợ lý AI là gì?',
    '{"options": {"A": "Do sử dụng một mô hình ngôn ngữ có kích thước cực lớn.", "B": "Do thiết kế một tác tử duy nhất gánh vác quá nhiều vai trò.", "C": "Do tích hợp quá nhiều cơ sở dữ liệu vector vào hệ thống.", "D": "Do giới hạn tốc độ xử lý của hệ thống phần cứng máy."}, "correct": "B", "explanation": "Hiện tượng God Agent xảy ra khi một agent duy nhất phải đảm nhận quá nhiều trách nhiệm như lập kế hoạch, truy xuất, thực thi và tổng hợp."}'::jsonb,
    1200.00, 'published'
) ON CONFLICT (id) DO UPDATE SET prompt = EXCLUDED.prompt, answer_key = EXCLUDED.answer_key;

INSERT INTO app.question_hints (id, question_id, level, hint_text) VALUES ('00000000-0000-0000-0000-000000003091', '00000000-0000-0000-0000-000000000209', 1, 'Thuật ngữ ''God Agent'' ám chỉ một tác tử cố gắng làm tất cả mọi việc một mình trong hệ thống.') ON CONFLICT (question_id, level) DO UPDATE SET hint_text = EXCLUDED.hint_text;
INSERT INTO app.question_hints (id, question_id, level, hint_text) VALUES ('00000000-0000-0000-0000-000000003092', '00000000-0000-0000-0000-000000000209', 2, 'Khi một Agent phải gánh vác quá nhiều task từ lập kế hoạch, code, dịch, truy vấn DB, nó sẽ dễ bị quá tải context.') ON CONFLICT (question_id, level) DO UPDATE SET hint_text = EXCLUDED.hint_text;
INSERT INTO app.question_hints (id, question_id, level, hint_text) VALUES ('00000000-0000-0000-0000-000000003093', '00000000-0000-0000-0000-000000000209', 3, 'Hiện tượng này xảy ra do thiết kế một tác tử duy nhất gánh vác quá nhiều vai trò và trách nhiệm thay vì chia nhỏ.') ON CONFLICT (question_id, level) DO UPDATE SET hint_text = EXCLUDED.hint_text;

-- Day 10 Question
INSERT INTO app.questions (id, course_id, concept_id, type, prompt, answer_key, difficulty_elo, calibration_status)
VALUES (
    '00000000-0000-0000-0000-000000000210',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000110',
    'mcq',
    'Theo thống kê thực tế, phần lớn thời gian trong một dự án AI được dành cho nhiệm vụ nào sau đây?',
    '{"options": {"A": "Huấn luyện và tinh chỉnh các siêu tham số mô hình.", "B": "Thu thập, làm sạch và giám sát chất lượng dữ liệu.", "C": "Thiết kế giao diện người dùng và triển khai ứng dụng.", "D": "Tối ưu hóa hệ thống máy chủ và hạ tầng mạng."}, "correct": "B", "explanation": "60-80% thời gian của dự án AI thực tế dành cho công việc chuẩn bị, làm sạch và giám sát dữ liệu (data work)."}'::jsonb,
    1200.00, 'published'
) ON CONFLICT (id) DO UPDATE SET prompt = EXCLUDED.prompt, answer_key = EXCLUDED.answer_key;

INSERT INTO app.question_hints (id, question_id, level, hint_text) VALUES ('00000000-0000-0000-0000-000000003101', '00000000-0000-0000-0000-000000000210', 1, 'Huấn luyện mô hình thực chất chỉ chiếm một phần nhỏ trong toàn bộ vòng đời sản xuất của dự án AI.') ON CONFLICT (question_id, level) DO UPDATE SET hint_text = EXCLUDED.hint_text;
INSERT INTO app.question_hints (id, question_id, level, hint_text) VALUES ('00000000-0000-0000-0000-000000003102', '00000000-0000-0000-0000-000000000210', 2, 'Phần lớn thời gian của các kỹ sư dữ liệu và AI được dành cho việc xử lý dữ liệu thô.') ON CONFLICT (question_id, level) DO UPDATE SET hint_text = EXCLUDED.hint_text;
INSERT INTO app.question_hints (id, question_id, level, hint_text) VALUES ('00000000-0000-0000-0000-000000003103', '00000000-0000-0000-0000-000000000210', 3, '60-80% thời gian thực tế của dự án được dành cho việc thu thập, làm sạch và giám sát chất lượng dữ liệu.') ON CONFLICT (question_id, level) DO UPDATE SET hint_text = EXCLUDED.hint_text;

-- ============================================================================
-- STEP 3: Seed Day 1 Extended Questions (45 MCQs + 5 Short Answer)
-- Từ seed-day1.sql — concepts: day1-basics, tokenization, llm-architecture,
--                               inference-decoding, short-answer
-- ============================================================================
\i db/seed/seed-day1.sql

-- ============================================================================
-- STEP 4: Verification
-- ============================================================================
SELECT
    c.code AS concept_code,
    c.name AS concept_name,
    COUNT(q.id) AS question_count,
    COUNT(qh.id) AS hint_count
FROM app.concepts c
LEFT JOIN app.questions q ON q.concept_id = c.id
LEFT JOIN app.question_hints qh ON qh.question_id = q.id
WHERE c.course_id = '00000000-0000-0000-0000-000000000001'
GROUP BY c.code, c.name
ORDER BY c.code;
