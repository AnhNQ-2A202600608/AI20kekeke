# Khung Kỹ Thuật Adaptive Learning Unified & Các Luồng Nghiệp Vụ Người Dùng (User Stories)

Tài liệu này hợp nhất các nghiên cứu học thuật, kiến trúc phân tầng hệ thống và các luồng tương tác người dùng (User Stories) chi tiết cho hệ thống **Adaptive Learning** (Học tập Thích ứng). Mục tiêu là thiết lập một nền tảng kỹ thuật vững chắc hỗ trợ đầy đủ các giai đoạn phát triển từ MVP (tối giản, chạy ngay), Post-MVP (cải tiến nâng cao) đến Research (nghiên cứu mở rộng).

---

## I. CÁC LUỒNG NGHIỆP VỤ NGƯỜI DÙNG CHỦ ĐẠO (USER STORIES)

### 1. Luồng Làm Bài Quiz Thích Ứng & Cập Nhật Mastery (ZPD Quiz)

> **User Story:** 
> *Là một học sinh,* tôi muốn khi thực hiện các bài trắc nghiệm ôn tập, các câu hỏi được đưa ra sẽ tự động nâng hoặc hạ độ khó thích ứng trực tiếp với trình độ của tôi, đồng thời khi tôi chuyển qua một mảng kiến thức hoàn toàn mới thì hệ thống sẽ đưa độ khó về mức cơ bản ban đầu để tránh việc tôi bị nản lòng bởi các câu hỏi quá khó ngay từ đầu.

```mermaid
graph TD
    Start(["1. Học viên bắt đầu Adaptive Quiz"]) --> SelectConcept["2. Hệ thống chọn Concept yếu hoặc cần học"]
    SelectConcept --> CheckMastery{"3. Đã có điểm Elo cho Concept này?"}
    CheckMastery -->|Có| UseMastery["4. Sử dụng điểm Elo hiện tại"]
    CheckMastery -->|Không| InitDefault["5. Khởi tạo điểm Elo Baseline mặc định 1200"]
    UseMastery & InitDefault --> SelectQuestion["6. Lọc câu hỏi có độ khó gần ZPD (mục tiêu làm đúng 70% - 75%)"]
    SelectQuestion --> Attempt["7. Học viên làm bài và nộp đáp án"]
    Attempt --> Grade["8. Chấm điểm: Tự động hoặc qua AI bounded"]
    Grade --> UpdateElo["9. Cập nhật điểm Elo của Học sinh và Độ khó của Đề"]
    UpdateElo --> StoreTelemetry["10. Ghi nhận nhật ký tương tác Telemetry"]
    StoreTelemetry --> UpdateWeakness["11. Cập nhật cờ cảnh báo lỗ hổng kiến thức"]
    UpdateWeakness --> EndCheck{"12. Đã hoàn thành bộ Quiz?"}
    EndCheck -->|Chưa| SelectQuestion
    EndCheck -->|Rồi| End(["13. Trả về kết quả và Cập nhật Hồ sơ năng lực"])
```

#### Phạm vi Triển khai chi tiết:
* **MVP:**
  * Dùng thuật toán Elo tĩnh cập nhật sau mỗi lượt trả lời (student Elo $\theta$ và item difficulty $d$).
  * Lựa chọn câu hỏi theo nguyên lý ZPD (Zone of Proximal Development) hướng tới xác suất làm đúng cố định trong khoảng $P(\text{correct}) \in [0.70, 0.75]$.
  * Khi chuyển sang Concept mới chưa có dữ liệu, khởi tạo Elo Baseline mặc định ($1200$ Elo) thay vì tính thừa kế phức tạp để tránh Data Sparsity.
* **Post-MVP:**
  * Áp dụng mô hình mạng Bayesian BKT (Bayesian Knowledge Tracing) làm lớp phủ (overlay) để phân cấp trạng thái: yếu, đang học, hoặc đã làm chủ.
  * Kế thừa Elo xuất phát dựa trên khoảng cách giữa các node trên cây quan hệ Prerequisites (tiền đề).
* **Research:**
  * Ứng dụng lý thuyết IRT (Item Response Theory) / mô hình Rasch hiệu chuẩn tham số câu hỏi ngoại tuyến (offline batch calibration).
  * Thuật toán Thompson Sampling hoặc Contextual Bandit (LinUCB) để tối ưu hóa việc chọn câu hỏi thay vì dùng ZPD tĩnh.

---

### 2. Trợ Lý Socratic Trong Quiz & Cập Nhật Hệ Số Phạt Elo (Socratic Discount)

> **User Story:** 
> *Là một học sinh,* tôi muốn khi gặp câu hỏi quá khó trong bài Quiz ôn tập, tôi có thể bấm hỏi AI để được giải thích khái niệm hoặc gợi ý lý thuyết liên quan. Tuy nhiên, AI không được đưa ra đáp án trực tiếp mà phải đặt câu hỏi dẫn dắt từng bước (Socratic) để tôi tự suy nghĩ ra đáp án. Khi tôi làm đúng nhờ sự trợ giúp này, hệ thống phải tự động tính toán hệ số phạt điểm cập nhật để phân biệt giữa việc tôi tự làm đúng hoàn toàn với việc làm đúng nhờ AI gợi mở.

```mermaid
sequenceDiagram
    autonumber
    actor Student as Học sinh
    participant UI as Giao diện Quiz
    participant Tutor as AI Socratic Tutor
    participant Backend as Core Backend
    participant AI_Service as AI Microservice

    UI->>Student: Hiển thị câu hỏi trắc nghiệm
    Student->>UI: Yêu cầu AI trợ giúp (Socratic Hint)
    UI->>AI_Service: Gửi nội dung câu hỏi, Concept & ngữ cảnh cho phép
    AI_Service-->>UI: Trả về câu hỏi gợi mở, không đưa đáp án
    UI->>Backend: Tăng biến đếm hint_count & set cờ used_ai_help = True
    Student->>UI: Điền đáp án cuối cùng và nộp bài
    UI->>Backend: Gửi đáp án kèm dữ liệu hint_count & used_ai_help
    Backend->>Backend: Áp dụng Socratic Discount Rule
    Backend->>Backend: Cập nhật Elo của Học sinh với hệ số K phạt (K = 8 thay vì K = 32)
    Backend-->>UI: Trả về kết quả và cập nhật Mastery State mới
```

#### Quy tắc Phạt hệ số K (Socratic Discount Rule) trong MVP:
| Kiểu làm bài (Attempt type) | Cách thức cập nhật Mastery / Elo |
| --- | --- |
| **Đúng hoàn toàn (Không hỏi AI)** | Nhận trọn vẹn điểm Elo cải thiện ($K = 32$). |
| **Đúng nhờ AI gợi mở (Hỏi Socratic)** | Nhận điểm Elo cải thiện bị giảm dựa theo số lượng gợi ý ($K = 8$). |
| **Sai hoàn toàn (Không hỏi AI)** | Cập nhật giảm điểm Elo tiêu chuẩn ($K = 32$). |
| **Sai mặc dù đã hỏi AI** | Giảm điểm Elo tiêu chuẩn hoặc áp dụng giảm nhẹ tùy thuộc vào chính sách sư phạm. |

---

### 3. Tra Cứu Tài Liệu RAG Thích Ứng Theo Năng Lực (Adaptive RAG)

> **User Story:** 
> *Là một học sinh,* tôi muốn khi tôi tra cứu tài liệu học tập hoặc đặt câu hỏi tự do cho AI Tutor, kết quả trả về phải thích ứng chính xác với trình độ hiện tại của tôi trên hệ thống. Ví dụ: Nếu tôi mới học hoặc đang yếu Concept đó, AI sẽ giải thích siêu đơn giản (dùng phương pháp Feynman); nếu tôi đang ở mức trung bình, AI giải thích chi tiết hơn và liên kết các khái niệm; còn nếu tôi đã giỏi, AI sẽ không giải thích trực tiếp mà đưa ra các câu hỏi phản biện nâng cao.

```mermaid
graph TD
    Ask(["1. Học sinh đặt câu hỏi tra cứu"]) --> Auth["2. Kiểm tra quyền truy cập khóa học"]
    Auth --> Retrieve["3. Truy xuất các mảnh tài liệu nguồn RAG"]
    Retrieve --> MapConcept["4. Ánh xạ câu hỏi vào Concept tương ứng"]
    MapConcept --> ReadMastery["5. Đọc điểm Elo Mastery hiện tại của Học sinh"]
    ReadMastery --> Branch{"6. Đánh giá mức độ thành thạo?"}
    Branch -->|Chưa đạt / Weak| Feynman["7. Prompt RAG: Giải thích kiểu Feynman kèm ví dụ trực quan"]
    Branch -->|Đang học / Learning| Deep["8. Prompt RAG: Giải thích chi tiết và Liên kết chéo cây Concept"]
    Branch -->|Thành thạo / Strong| Challenge["9. Prompt RAG: Đặt câu hỏi phản biện Socratic thách thức"]
    Feynman & Deep & Challenge --> Generate["10. LLM sinh phản hồi cá nhân hóa kèm nguồn trích dẫn"]
    Generate --> Store["11. Lưu log hội thoại và metadata trích dẫn"]
    Store --> Display(["12. Hiển thị câu trả lời cá nhân hóa lên giao diện"])
```

#### Các mức độ phản hồi thích ứng (Feynman - Deep - Challenge):
1. **Weak (Chưa đạt - Elo thấp):** Trọng tâm là giải thích trực quan, lược bỏ thuật ngữ chuyên ngành phức tạp, sử dụng các phép ẩn dụ thực tế.
2. **Learning (Đang phát triển - Elo trung bình):** Cung cấp tài liệu sâu rộng hơn, chỉ ra các lỗi sai phổ biến và liên kết trực tiếp với các Concepts đã làm chủ trước đó trên cây đồ thị.
3. **Strong (Thành thạo - Elo cao):** Kích hoạt chế độ "Peer review/Challenge". AI không trả lời ngay mà đưa ra các bài toán biên (edge cases) yêu cầu học sinh chứng minh năng lực ứng dụng thực tế.

---

### 4. Khởi Đầu Lạnh Câu Hỏi Mới (Item Cold Start Calibration)

> **User Story:** 
> *Là một giáo viên,* tôi muốn khi tôi tạo mới một câu hỏi trắc nghiệm trong ngân hàng đề, hệ thống sẽ tự động phân loại độ khó ban đầu dựa trên tag gán nhãn của tôi và nhanh chóng hiệu chuẩn chính xác độ khó thực tế của câu hỏi đó chỉ sau một số lượng ít học sinh làm thử ban đầu mà không làm sai lệch lớn điểm số của học sinh.

```mermaid
graph TD
    NewItem["1. Giáo viên tạo câu hỏi mới"] --> Tag["2. Gán nhãn Concept và Cấp độ khó mặc định"]
    Tag --> InitElo["3. Ánh xạ Cấp độ khó mặc định sang điểm Elo đề tương ứng"]
    InitElo --> Flag["4. Gán cờ is_cold_start = True"]
    Flag --> Attempt["5. Học sinh làm bài thử nghiệm"]
    Attempt --> Check{"6. Tổng số lượt làm dưới 10?"}
    Check -->|Đúng| Fast["7. Hiệu chuẩn nhanh: Sử dụng hệ số cập nhật K cực lớn K = 64"]
    Check -->|Sai| Stable["8. Đạt hội tụ: Gỡ bỏ cờ cold_start và Đưa K về mức tiêu chuẩn K = 16"]
    Fast & Stable --> Update["9. Tính toán và lưu điểm Elo mới của đề vào DB"]
```

#### Quy tắc hiệu chuẩn nhanh trong MVP:
* **Khởi tạo:** Giáo viên tag cấp độ năng lực (Ví dụ: Dễ $\to$ 1000 Elo, Trung bình $\to$ 1200 Elo, Khó $\to$ 1400 Elo).
* **Giai đoạn lạnh (`is_cold_start = True`):** Trong 10 lượt làm bài đầu tiên của học sinh, áp dụng $K_{item} = 64$ để điểm Elo của câu hỏi nhảy cực nhanh về vùng giá trị thực tế dựa trên tỷ lệ làm đúng/sai của học sinh.
* **Giai đoạn ổn định:** Sau 10 lượt làm bài, gỡ bỏ cờ, đưa về hệ số ổn định $K_{item} = 16$.

---

### 5. Ingestion Pipeline Khai Thác Nội Dung & Tự Động Sinh Đề (PDF to Active Graph)

> **User Story:** 
> *Là một giảng viên,* tôi muốn khi tôi tải lên một file tài liệu slide bài giảng hoặc sách PDF nặng từ 50-70 trang, hệ thống sẽ tự động phân rã văn bản, nhận diện các Concept cốt lõi, phác thảo đồ thị DAG (tiền đề) và tự sinh ngân hàng câu hỏi thích ứng kèm gợi ý Socratic để tôi kiểm duyệt nhanh trước khi xuất bản cho học sinh làm bài.

```mermaid
graph TD
    PDF["Tài liệu PDF thô (50-70 trang)"] --> Parse["1. Phân rã văn bản (PDF Text Parser)"]
    Parse --> Extract["2. LLM trích xuất danh sách Concepts và Skills"]
    Extract --> Hierarchy["3. LLM tự động phác thảo đồ thị Prerequisite DAG"]
    
    Hierarchy --> TeacherReview{"4. Giảng viên kiểm duyệt và Chỉnh sửa liên kết (HITL)"}
    
    TeacherReview -->|Approved Concepts| QGen["5. LLM tự động sinh ngân hàng câu hỏi theo độ khó SFIA"]
    QGen --> PromptScaff["6. LLM sinh gợi ý Socratic (light/medium/deep hints)"]
    
    PromptScaff --> DBStore[("7. Liên kết và Lưu Database: Question ID <--> Concept ID")]
    DBStore --> ActiveGraph(["8. Kích hoạt Đồ thị Tri thức Hoạt động (Active Graph)"])
```

#### Các bước xử lý trong Pipeline:
1. **Document Parsing:** Sử dụng các thư viện chuẩn (như `pypdf`) để đọc nội dung text và phân nhóm theo page ranges.
2. **DAG Extraction:** LLM xử lý ngữ nghĩa để nhận diện mối quan hệ tiên quyết giữa các Concept (Ví dụ: Concept A là Prerequisites của Concept B).
3. **HITL (Human-in-the-loop) Gate:** Giảng viên kiểm duyệt trực tiếp trên giao diện Dashboard kéo thả để sửa đổi các liên kết DAG bị sai lệch trước khi cho phép sinh đề.
4. **Item Generation & Scaffolding:** LLM sinh câu hỏi trắc nghiệm kèm giải thích chi tiết lý do sai của từng distractor và biên soạn trước 3 cấp độ gợi ý Socratic (nhẹ, vừa, sâu) để lưu trữ sẵn trong DB, tiết kiệm chi phí chạy LLM thời gian thực.

---

### 6. Vòng Lặp Thích Ứng Socratic Hợp Nhất & Đánh Giá Hội Thoại (Unified Loop)

> **User Story:** 
> *Là một học sinh,* tôi muốn khi tôi thảo luận chuyên sâu hoặc thực hành luyện tập hội thoại tự do với AI Tutor, hệ thống sẽ phân tích các câu hỏi và câu trả lời của tôi để liên tục đánh giá ngầm năng lực của tôi, đồng thời điều chỉnh độ khó của câu hỏi dẫn dắt tiếp theo của AI mà không bắt tôi phải làm các bài trắc nghiệm thông thường.

#### Sơ đồ Vòng lặp Hợp nhất Socratic & Thích ứng thời gian thực (Unified Loop):
```mermaid
graph TD
    Student["1. Học viên gửi phản hồi hoặc đặt câu hỏi"] --> SocraticAI["2. AI Socratic Tutor (Người dẫn dắt hội thoại)"]
    SocraticAI -->|Ghi nhận log chat| Transcript["3. Nhật ký Hội thoại (Turn-level Transcript)"]
    Transcript -->|Phân tích ngữ nghĩa nền| LLMEval["4. LLM Evaluator Agent"]
    LLMEval -->|Trích xuất định lượng JSON| StructuredJSON["5. Skill ID, Score, Confidence, Evidence"]
    StructuredJSON -->|Đồng bộ điểm số| SaaSEngine["6. SaaS Adaptive Engine"]
    SaaSEngine -->|Cập nhật Elo / BKT| CompetencyProfile[("7. Hồ sơ Năng lực Học viên (Dynamic theta)")]
    CompetencyProfile -->|Phản hồi thông tin trình độ| SocraticAI
    DB_RAG[("Kho tri thức RAG (Syllabus, Giáo trình)")] -->|Lấy dữ liệu ngữ cảnh| SocraticAI
    SocraticAI -->|8. AI điều chỉnh độ khó gợi mở, đặt câu hỏi Socratic tiếp theo| Student
```

#### Cơ chế hoạt động của Đánh giá Hội thoại:
1. **Semantic Signal Extraction:** LLM Evaluator chạy ngầm để phát hiện lỗ hổng kiến thức dựa trên cách sinh viên tương tác (Ví dụ: sinh viên không biết cách sử dụng biến môi trường khi được hỏi về Docker $\to$ Node `env_variables` bị hụt điểm).
2. **Dynamic Scaffolding Adjustments:**
   * **Năng lực tăng:** Giảm bớt gợi ý (Fading Scaffolding), đưa ra câu hỏi mang tính ứng dụng thực tiễn cao hơn.
   * **Năng lực giảm:** Tăng cường gợi ý chi tiết (Hints), lùi bước sư phạm về các khái niệm nền tảng (Backtracking).

---

## II. KIẾN TRÚC PHÂN TẦNG HỆ THỐNG (3 LAYERS SAAS ARCHITECTURE)

Để đảm bảo hệ thống có thể mở rộng quy mô thành một giải pháp **SaaS đa trường học** (decoupled từ syllabus riêng biệt của từng trường đại học như VinUni), kiến trúc lõi được chia thành **3 lớp độc lập**:

```mermaid
graph TD
    subgraph Layer1 ["Layer 1: Lớp Giáo trình của Trường (School Syllabus / LMS)"]
        Syllabus["Giáo trình cụ thể của các trường đại học (Ví dụ: VinUni Course)"]
        StudentQuiz["Bài kiểm tra trắc nghiệm / Hội thoại của Học sinh"]
    end

    subgraph Layer2 ["Layer 2: Lớp Ánh xạ Cấu hình (Syllabus Mapping Config)"]
        MapConfig["Config JSON: Ánh xạ câu hỏi/bài học ==> Core Concept ID"]
    end

    subgraph Layer3 ["Layer 3: Lõi Hệ thống Thích ứng (SaaS Core Engine)"]
        GraphDB[("Đồ thị Phụ thuộc Khái niệm (Concept Dependency DAG)")]
        AdaptiveEngine["Lõi Thích ứng (Elo Engine / BKT Engine / Bandit)"]
    end

    subgraph Layer4 ["Layer 4: Lớp Chuyển đổi Khung Năng lực (Competency Adapter)"]
        Adapter["Adapter Quy đổi: Điểm Elo/BKT ==> Khung năng lực cụ thể (SFIA Level / CEFR)"]
    end

    subgraph Layer5 ["Layer 5: Giao diện Học viên (Student Dashboard)"]
        SkillTree["Hồ sơ Năng lực cá nhân hóa (Skill Tree) hiển thị theo khung của trường"]
    end

    Syllabus --> StudentQuiz
    StudentQuiz -->|Gửi kết quả Đúng/Sai| MapConfig
    MapConfig -->|Ánh xạ phân phối kết quả tới các Node| GraphDB
    GraphDB --> AdaptiveEngine
    AdaptiveEngine --> Layer4
    Adapter -->|Hiển thị năng lực| SkillTree
```

### Chi tiết 3 Lớp Lõi (MVP Decoupled):
1. **Syllabus Mapping Layer (Lớp Ánh xạ Giáo trình):** Lưu trữ file cấu hình JSON ánh xạ các câu hỏi thực tế từ LMS của trường vào các Concept ID chung trên hệ thống của chúng ta. Lớp này giúp hệ thống hoạt động như một SaaS cắm-rút (plug-and-play).
2. **Core Dependency Graph DAG (Lớp Đồ thị Tri thức Lõi):** Quản lý quan hệ phụ thuộc giữa các node kiến thức trừu tượng, hoàn toàn không phụ thuộc vào cấu trúc bài giảng của trường. Điểm số Elo và độ thành thạo BKT được tính toán và lưu trữ tại các node này.
3. **Competency Translation Layer (Lớp Dịch Khung Năng lực):** Lớp adapter quy đổi điểm Elo/BKT nội bộ thành các cấp bậc năng lực theo yêu cầu của từng trường (Ví dụ: Quy đổi sang 5 Cấp độ SFIA của VinUni hoặc cấp độ A1-C2 của CEFR).

---

## III. PHÂN TÍCH RỦI RO & PHƯƠNG ÁN TỐI ƯU CHI PHÍ VẬN HÀNH (OPERATIONAL COSTS)

### 1. Quản lý Rủi ro Hệ thống (Failure Modes & Mitigations)

| Rủi ro | Mức độ nguy hiểm | Giải pháp khắc phục (Mitigation) |
| --- | --- | --- |
| **AI chấm điểm sai lệch** (AI grading variance) | Cao | Giới hạn điểm số trong khoảng xác định, sử dụng chấm điểm deterministic cho trắc nghiệm và chỉ dùng LLM chấm cho tự luận ngắn có giám sát. |
| **Data Sparsity gây nhiễu khuyến nghị** | Trung bình | Sử dụng thuật toán ZPD tĩnh trong giai đoạn MVP. Chỉ kích hoạt Thompson Bandit khi hệ thống thu thập đủ số lượng tương tác ổn định. |
| **Lạm dụng AI gợi ý làm lệch điểm Elo** | Cao | Áp dụng quy tắc phạt **Socratic Discount Rule** để giảm tối đa hệ số cập nhật Elo ($K = 8$) đối với các câu trả lời đúng có sự trợ giúp của AI. |
| **Nhiễu đồ thị DAG tự động** | Trung bình | Bắt buộc phải có bước phê duyệt thủ công của giảng viên thông qua cơ chế **HITL (Human-in-the-loop)** trên Dashboard. |

### 2. Tối ưu hóa Chi phí vận hành LLM (Token Cost Optimization)

Việc chạy LLM thời gian thực cho hàng ngàn học sinh có nguy cơ làm tăng chi phí và độ trễ (latency). Hệ thống giải quyết bằng 3 phương án tối ưu:

* **Tách biệt tác vụ Ngoại tuyến (Offline Ingestion):**
  Tác vụ trích xuất PDF môn học và sinh ngân hàng câu hỏi, đáp án kèm gợi ý Socratic được chạy **1 lần duy nhất** khi giáo viên tải tài liệu lên hệ thống. Học sinh khi làm bài chỉ truy xuất dữ liệu tĩnh có sẵn trong cơ sở dữ liệu, không tốn chi phí gọi LLM thời gian thực.
* **Đánh giá theo Phiên bất đồng bộ (Batch Session Evaluation):**
  Thay vì gọi LLM Evaluator phân tích năng lực sau mỗi lượt chat (Turn-level), hệ thống cho phép học sinh hội thoại bình thường thông qua prompt nhẹ. Khi học sinh kết thúc phiên học (Session), toàn bộ transcript hội thoại sẽ được nén và gửi qua **1 cuộc gọi LLM duy nhất** để phân tích tổng hợp, giảm 80% chi phí token.
* **Prompt Caching & LLM nhỏ:**
  Sử dụng GPT-4o-mini hoặc Gemini Flash kết hợp tính năng prompt caching để lưu trữ các tài liệu RAG lặp đi lặp lại trong context, giúp tiết kiệm đến 90% chi phí input token cho các lượt hội thoại sau.
