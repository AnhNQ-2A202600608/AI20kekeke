# Thiết kế Cấp cao (High-Level Design) - Hệ thống Học tập Thích ứng

Tài liệu này chứa các sơ đồ thiết kế cấp cao mô tả kiến trúc tổng quan, luồng chatbot cá nhân hóa và quy trình tự động sinh câu hỏi thích ứng lúc tải tài liệu lên hệ thống.

---

## 1. Kiến trúc Hệ thống Tổng quan (High-Level Architecture)

Sơ đồ mô tả sự tương tác giữa Client UI, API Router, các mô hình/công cụ tính toán thích ứng (Elo, BKT, LinUCB) và cơ sở dữ liệu Supabase.

```mermaid
graph TB

    %% Client Layer
    subgraph ClientLayer ["GIAO DIỆN HỌC VIÊN (Student Client UI)"]
        UI["Student Dashboard & Quiz Interface"]:::client
    end

    %% API Gateway Layer
    subgraph APIGateway ["TẦNG GIAO TIẾP API (FastAPI Router)"]
        RecommendAPI["POST /api/v1/adaptive/recommend"]:::api
        SubmitAPI["POST /api/v1/adaptive/submit"]:::api
    end

    %% Learner Model
    subgraph LearnerModel ["MÔ HÌNH NGƯỜI HỌC (Learner Model)"]
        BKT["Bayesian Knowledge Tracing BKT Engine<br/>(Ước lượng Xác suất Làm chủ P_Lt)"]:::learner
        EloStudent["Student Elo Rating Engine<br/>(Ước lượng Năng lực Học viên)"]:::learner
    end

    %% Content Model
    subgraph ContentModel ["MÔ HÌNH HỌC LIỆU (Content Model)"]
        Questions["Published Questions Bank<br/>(Ngân hàng câu hỏi thích ứng)"]:::content
        EloQuestion["Question Elo Calibration<br/>(Độ khó Elo câu hỏi b)"]:::content
    end

    %% Instructional Model (Bandit)
    subgraph InstructionalModel ["BỘ ĐIỀU PHỐI SƯ PHẠM (Orchestrator)"]
        LinUCB["LinUCB Contextual Bandit<br/>(Gợi ý câu hỏi trong vùng ZPD ~75% success)"]:::orchestrator
    end

    %% Database Storage
    subgraph DBStore ["CƠ SỞ DỮ LIỆU (Supabase PostgreSQL)"]
        AppSchema[("Schema app<br/>(student_concept_mastery, quiz_attempts)")]:::db
        AuditSchema[("Schema audit<br/>(adaptive_decisions, adaptive_rewards, mastery_events)")]:::db
    end

    %% Relations
    UI -->|1. Yêu cầu gợi ý bài tập| RecommendAPI
    UI -->|4. Nộp bài & chấm điểm| SubmitAPI

    RecommendAPI -->|Lấy Elo & BKT| BKT
    RecommendAPI -->|Lấy danh sách câu hỏi meta| Questions
    BKT & EloStudent -->|Xây dựng Context Vector X| LinUCB
    Questions & EloQuestion -->|Cung cấp Arms & Độ khó| LinUCB
    LinUCB -->|2. Quyết định gợi ý câu hỏi| RecommendAPI
    RecommendAPI -->|3. Trả về đề bài| UI

    SubmitAPI -->|Tính Elo mới & BKT mới| EloStudent & BKT
    SubmitAPI -->|Cập nhật độ khó Elo mới| EloQuestion
    SubmitAPI -->|Tính ZPD Reward & Cập nhật ma trận A_inv, b| LinUCB

    %% Database Sync
    BKT & EloStudent & EloQuestion & LinUCB -->|Lưu trữ & Log vết| AppSchema & AuditSchema
```

---

## 2. Luồng Chatbot Thích ứng Cá nhân hóa (Chatbot Agent Flow)

Kiến trúc tương tác một Agent (Single Agent) với Dynamic System Prompt chứa Elo/BKT và bộ lọc từ khóa tích hợp (Regex + Prompt Guardrails).

```mermaid
graph TD
    User([Học viên]) --> Router{1. Intent Router Agent}
    Router -->|Ambiguous / Out-of-scope| Guardrail[2. Guardrail Node]
    Router -->|Conceptual Q / Debug| Socratic[3. Socratic Tutor Agent]
    Router -->|Practice / Quiz| Practice[4. Practice Agent]
    
    Socratic -->|Cần Context tài liệu| RAG[5. RAG Tool - Vector Store]
    Socratic -->|Cập nhật năng lực| DB[(Database / Mastery Profile)]
    
    Guardrail & Socratic & Practice --> Generator[6. Response Generator Node]
    Generator --> User
```

---

## 3. Luồng Sinh Câu hỏi và Hints Tự động (Ingestion-Time Quiz Generation)

Quy trình xử lý bất đồng bộ khi Giảng viên upload Slide/PDF, tự động sinh trước câu hỏi dạng Draft để kiểm duyệt chất lượng và bảo toàn thuật toán Elo.

```mermaid
graph TD
    A[Giảng viên tải Slide/PDF] --> B[Chia nhỏ Chunk & Trích xuất Concept]
    B --> C[LLM Quiz Generator Node]
    C -->|Sinh 5-10 câu hỏi & 3 cấp độ Hint| D[Lưu DB dạng DRAFT]
    D --> E[Giao diện kiểm duyệt của Giảng viên]
    E -->|1. Sửa lỗi/Hallucination| F[Giảng viên bấm PUBLISH]
    E -->|2. Đồng ý luôn| F
    F --> G[Lưu kho câu hỏi thích ứng app.questions]
    G -->|Recommend API sử dụng LinUCB| H[Học sinh làm bài]
```
