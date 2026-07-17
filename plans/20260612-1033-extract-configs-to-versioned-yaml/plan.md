# Trích xuất Cấu hình, Prompt và Rules ra file YAML có Versioning

Kế hoạch này phác thảo thiết kế và các bước để tách các prompt hệ thống, hằng số, luật cá nhân hóa (scaffolding rules) và các thiết lập môi trường đang bị hardcode trong mã nguồn Python ra các file cấu hình YAML có cấu trúc và quản lý phiên bản (versioning).

---

## Nghiên cứu Ứng dụng Production Thực tế (Cách các App lớn triển khai)

Dựa trên các tiêu chuẩn công nghiệp và các ứng dụng LLM thực tế chạy ở production (sử dụng mô hình GitOps, Pydantic và Prompt-as-Code), các thực hành tốt nhất bao gồm:

1. **Tách biệt Prompt-as-Code:** Các prompt được lưu trữ như các tài sản độc lập kèm theo metadata (các cấu hình model như temperature, version, và chuỗi template).
2. **Xác thực Schema khi Khởi chạy:** Các file YAML được phân tích, kiểm tra tính hợp lệ và tải vào các cấu hình được định kiểu (thường dùng Pydantic `BaseModel` hoặc `pydantic-settings`) khi khởi động ứng dụng để tránh lỗi runtime.
3. **Engine quản lý Rules có cấu trúc:** Các logic động (như kiểm tra khoảng Elo hoặc chuyển chế độ học tập) được thể hiện dưới dạng cấu trúc dữ liệu trong YAML (ví dụ: danh sách các điều kiện Elo tối thiểu/tối đa và nội dung hướng dẫn tương ứng) thay vì viết cứng bằng câu lệnh `if-elif` trong mã nguồn Python.
4. **Cô lập Môi trường & GitOps:** File cấu hình được quản lý phiên bản qua Git. Các khóa bảo mật (API keys, DB credentials) được giữ trong các biến môi trường (trong file `.env` hoặc trình quản lý secret) và được nạp động tại runtime nhằm tránh rò rỉ thông tin nhạy cảm.

---

## Yêu cầu Người dùng Đánh giá (User Review Required)

> [!IMPORTANT]
> - **Phân tách Cấu hình thành 3 File:** Đề xuất chia nhỏ cấu hình thành 3 file chuyên biệt:
>   1. `settings.yaml`: Cài đặt môi trường hệ thống, database, cache, LLM.
>   2. `prompts.yaml`: Định nghĩa system prompt và các chuỗi prompt template độc lập.
>   3. `algorithm.yaml`: Định nghĩa thuật toán/luật phân tầng Elo (scaffolding rules) và chỉ dẫn chế độ tương tác (mode instructions).
> - **Tiến hóa Schema:** Việc thay đổi file YAML đòi hỏi quy trình validate chặt chẽ. Pydantic model sẽ đảm bảo tính toàn vẹn của cấu hình ngay khi ứng dụng khởi chạy.
> - **Chuyển đổi Logic Động:** Chúng ta sẽ chuyển đổi các quy tắc Python `if/elif` của Elo và chế độ học tập (mode) thành các list và map có cấu trúc trong file `algorithm.yaml`.

---

## Câu hỏi cần làm rõ (Open Questions)

> [!IMPORTANT]
> Vui lòng xem xét và cho ý kiến về các câu hỏi thiết kế chiến lược sau:
>
> 1. **Tải lại Động (Dynamic Reloading) vs Tải khi Khởi động (Startup Loading):**
>    Ứng dụng có cần tự động tải lại các thay đổi trong file YAML khi ứng dụng đang chạy mà không cần khởi động lại server không (ví dụ: dùng file watcher)? Hay chỉ cần tải một lần khi khởi động (yêu cầu restart server hoặc redeploy CI/CD) là đủ?
>
> 2. **Engine định dạng Prompt (Rule Templating Engine):**
>    Chúng ta nên dùng công cụ định dạng nào (như `Jinja2` hay tính năng `.format` mặc định của Python) để điền các biến động vào prompt? Hiện tại hệ thống đang sử dụng `.format(context=..., elo=...)` của Python.
>
> 3. **Cú pháp thực thi Luật Elo (Rule Execution Syntax):**
>    Đối với các luật phân tầng Elo, độ linh hoạt của khoảng Elo cần như thế nào?
>    - *Lựa chọn A (Khuyến nghị)*: Định nghĩa khoảng Elo cố định trong YAML:
>      ```yaml
>      rules:
>        - min_elo: 0
>          max_elo: 400
>          instructions: "..."
>      ```
>      Mã Python sẽ parse cấu trúc này và kiểm tra đơn giản: `min_elo <= elo <= max_elo`.
>    - *Lựa chọn B*: Đánh giá biểu thức động trong YAML (chạy eval các điều kiện tùy ý như `elo < 400` bằng thư viện an toàn).
>
> 4. **Quản lý thông tin nhạy cảm (Secret Management):**
>    Các thông tin nhạy cảm (như `openai_api_key`) sẽ được giữ hoàn toàn ở biến môi trường / `.env` và tự động merge bởi Pydantic, hay bạn muốn đặt placeholder trong file YAML (ví dụ: `openai_api_key: "${OPENAI_API_KEY}"`)?

---

## Các thay đổi đề xuất (Proposed Changes)

Chúng ta sẽ tạo thư mục `config/` ở thư mục gốc để chứa các file YAML và cập nhật `src/config.py` để đóng vai trò là cấu hình loader duy nhất.

### Các File Cấu hình

#### [NEW] [settings.yaml](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/config/settings.yaml)
Chứa cấu hình môi trường và các tham số kỹ thuật của hệ thống.
```yaml
version: "1.0.0"
app:
  name: "AI20K Agent"
  env: "development"
  port: 8000
  host: "0.0.0.0"
  log_level: "INFO"
  cors_origins: "http://localhost:3000"

database:
  database_url: "sqlite:///./data/app.db"

cache:
  cache_type: "in_memory"
  redis_url: "redis://localhost:6379/0"

vector_store:
  chroma_persist_dir: "./data/chroma"

llm:
  model_name: "gpt-4o-mini"
  llm_temperature: 0.7
```

#### [NEW] [prompts.yaml](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/config/prompts.yaml)
Chứa các prompt template hệ thống.
```yaml
version: "1.0.0"

prompts:
  system_prompt: |
    Bạn là một Gia sư AI cá nhân hóa (AI Tutor) xuất sắc tại Đại học VinUniversity.
    Nhiệm vụ của bạn là hỗ trợ sinh viên học tập theo phương pháp Socratic (Socratic ladder).

    [THÔNG TIN HỌC VIÊN HIỆN TẠI]
    - Trình độ năng lực (Elo): {student_elo:.1f}
    - Khả năng làm chủ kiến thức (BKT Mastery): {student_bkt:.2f}
    - Trạng thái yếu thế (Weakness Flag): {student_weakness}
    - Trạng thái kiểm tra (Active Quiz): {active_quiz_session}

    [QUY TẮC CÁ NHÂN HÓA THEO NĂNG LỰC (SCAFFOLDING RULES)]
    {scaffolding_rules}

    [CHẾ ĐỘ TƯƠNG TÁC HIỆN TẠI]
    {mode_instructions}

    [LUẬT AN TOÀN HỌC THUẬT (ACADEMIC INTEGRITY GUARDRAILS)]
    1. KHÔNG BAO GIỜ cung cấp lời giải trực tiếp, mã nguồn code hoàn chỉnh, hoặc đáp án trực tiếp cho bài tập/assignment/quiz.
    2. Sử dụng thang gợi ý Socratic (Hint Ladder) gồm 4 bậc tùy theo câu hỏi và mức độ hiểu bài của sinh viên:
       - Bậc 1: Gợi ý khái niệm tổng quan hoặc sử dụng ẩn dụ/ví dụ thực tế trực quan để sinh viên nắm bắt bản chất.
       - Bậc 2: Định hướng sinh viên đọc phần cụ thể của slide bài học trong context (ví dụ: chỉ ra slide chứa công thức hoặc hình vẽ cần xem).
       - Bậc 3: Đưa ra câu hỏi gợi mở tư duy hoặc gợi ý mã giả (pseudocode), hướng dẫn thuật toán cơ bản.
       - Bậc 4: Hướng dẫn phân tích logic từng bước để sinh viên tự suy luận ra đáp án.

    [QUY TẮC TRÍCH DẪN & RAG GROUNDING]
    1. Chỉ trả lời dựa trên học liệu tham khảo được cung cấp bên dưới.
    2. Nếu câu hỏi nằm ngoài phạm vi khóa học, lịch sự từ chối và định hướng học sinh quay lại bài học.
    3. Luôn luôn trích dẫn nguồn (citation) từ học liệu tham khảo được cung cấp bên dưới.
    4. Định dạng trích dẫn BẮT BUỘC: Bạn chỉ được trích dẫn bằng cách chèn tag dạng `[Tên tài liệu, Slide X]` (ví dụ: `[Day10 data pipeline observability E402, Slide 3]`) tại vị trí thông tin được sử dụng. Không tự bịa ra tài liệu hoặc slide không có trong phần học liệu tham khảo.

    HỌC LIỆU THAM KHẢO CHÍNH THỨC:
    {context}
```

#### [NEW] [algorithm.yaml](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/config/algorithm.yaml)
Chứa các luật logic, thuật toán xử lý phân tầng năng lực (Scaffolding Rules) và chỉ dẫn chế độ tương tác (Mode Instructions).
```yaml
version: "1.0.0"

scaffolding_rules:
  - min_elo: 0
    max_elo: 400
    instructions: |
      - Học viên đang gặp khó khăn (Elo thấp). Tránh dùng thuật ngữ cao siêu (như tail call, stack overhead).
      - Hãy giải thích bằng các ẩn dụ thực tế cực kỳ trực quan và đơn giản.
      - Chia nhỏ kiến thức tối đa. Không giải thích dồn dập nhiều khái niệm cùng lúc.
      - Áp dụng gợi ý mức độ cao (high scaffolding) nhưng KHÔNG viết code giải giùm.
  - min_elo: 801
    max_elo: 9999
    instructions: |
      - Học viên có năng lực xuất sắc (Elo cao). Hãy trao đổi bằng ngôn ngữ học thuật chuyên sâu và chính xác.
      - Đi thẳng vào vấn đề. Phân tích tối ưu hiệu năng, độ phức tạp thuật toán (Big O Notation) và edge-cases.
      - Khuyến khích học viên tự tối ưu, thử thách họ với các câu hỏi tư duy sâu hơn.
  - min_elo: 400
    max_elo: 800
    instructions: |
      - Học viên có trình độ trung bình. Sử dụng ngôn từ kỹ thuật chuẩn hóa trong bài giảng.
      - Đóng vai người gợi mở. Đưa ra các câu hỏi Socratic để học viên tự điền vào chỗ trống hoặc tìm ra giải pháp.

mode_instructions:
  Explain: |
    CHẾ ĐỘ: GIẢI THÍCH (Explain Mode)
    - Nhiệm vụ: Giải thích khái niệm học thuật một cách dễ hiểu, bám sát tài liệu giáo trình.
    - Kết thúc phản hồi bằng một câu hỏi kiểm tra nhanh (concept check question) để học sinh tự đánh giá.
  Step-by-step hint: |
    CHẾ ĐỘ: GỢI Ý TỪNG BƯỚC (Step-by-step hint Mode)
    - Nhiệm vụ: Không đưa ra câu trả lời trực tiếp. Hãy triển khai cơ chế 'Nấc thang gợi ý' (Hint Ladder).
    - Gợi ý 1: Định hướng tư duy, gợi ý khái niệm.
    - Gợi ý 2: Gợi ý mã giả (pseudocode) hoặc thuật toán sơ bộ.
    - Gợi ý 3: Gợi ý các điều kiện dừng, biên (boundary conditions) hoặc lỗi phổ biến.
  Debug code: |
    CHẾ ĐỘ: SỬA LỖI CODE (Debug code Mode)
    - Nhiệm vụ: Giúp học viên tìm và sửa lỗi logic/cú pháp trong code của họ.
    - Chỉ ra dòng code có vấn đề, giải thích tại sao nó gây lỗi nhưng KHÔNG viết lại đoạn code đã sửa hoàn chỉnh.
    - Hướng dẫn học sinh tự sửa bằng cách hỏi các câu hỏi như 'Điều gì xảy ra khi biến x nhận giá trị 0?'.
  Practice: |
    CHẾ ĐỘ: LUYỆN TẬP (Practice Mode)
    - Nhiệm vụ: Đóng vai người ra đề. Đưa ra một bài toán nhỏ/câu đố ngắn phù hợp với concept học viên đang hỏi.
    - Chờ học viên đưa ra câu trả lời rồi mới nhận xét và nâng cao Elo thực tế.
  Review submission: |
    CHẾ ĐỘ: REVIEW BÀI NỘP (Review submission Mode)
    - Nhiệm vụ: Nhận xét chi tiết bài làm của học viên.
    - Đánh giá dựa trên: 1) Tính đúng đắn, 2) Clean code, 3) Hiệu năng/Tối ưu hóa bộ nhớ.
    - Đưa ra thang điểm 1-5 kèm nhận xét Socratic khuyến khích học viên cải thiện.
```

---

### Các Component Cốt lõi

#### [MODIFY] [config.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/config.py)
- Tích hợp YAML loader (sử dụng thư viện `PyYAML`) vào luồng khởi tạo của Pydantic settings để nạp cả 3 file: `settings.yaml`, `prompts.yaml`, và `algorithm.yaml`.
- Thêm định dạng dữ liệu (validation schema) cho prompts và rules bằng Pydantic.
- Tự động nạp ghi đè các secret an toàn từ file `.env` bằng cơ chế merge môi trường của Pydantic.

#### [MODIFY] [analyze_node.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/agents/nodes/analyze_node.py)
- Import cấu hình để tải động các rules hỗ trợ (scaffolding rules) và chỉ dẫn chế độ tương tác (mode instructions) từ `algorithm.yaml`.
- Tìm luật hỗ trợ tương ứng dựa trên khoảng Elo đã được định nghĩa trong file YAML.
- Lấy hướng dẫn tương tác động dựa trên chế độ học tập (`mode`) hiện tại từ cấu hình.

#### [MODIFY] [respond_node.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/agents/nodes/respond_node.py)
- Loại bỏ chuỗi hằng số `SYSTEM_PROMPT` đang bị hardcode.
- Tải động template của System Prompt trực tiếp từ file cấu hình `prompts.yaml`.

---

## Kế hoạch Xác minh (Verification Plan)

### Kiểm thử tự động (Automated Tests)
- Chạy toàn bộ test suite để đảm bảo không bị regression:
  ```bash
  pytest tests/
  ```
- Viết file test mới `tests/test_config.py` để kiểm tra việc đọc cấu hình từ 3 file YAML, xác định tính hợp lệ của schema và xử lý phiên bản (version).

### Xác minh thủ công (Manual Verification)
- Kiểm tra quá trình khởi chạy LangGraph agent có lấy đúng System Prompt động từ file cấu hình hay không.
- Đảm bảo các luật scaffolding được giải quyết chính xác dựa trên các điểm Elo khác nhau (ví dụ: 350, 600, 900) được nạp từ YAML.
