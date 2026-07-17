# Thiết kế Cơ sở Dữ liệu (Database Schema ERD)

Tài liệu này chứa sơ đồ thực thể liên kết (ERD) đặc tả cấu trúc của 2 Schema: `app` (chứa các bảng phục vụ runtime) và `audit` (chứa các bảng lưu trữ nhật ký mô hình phục vụ huấn luyện máy và kiểm toán).

---

## Sơ đồ Thực thể Liên kết (Entity Relationship Diagram - ERD)

```mermaid
erDiagram
    %% Schema app (Runtime Tables)
    users {
        uuid id PK
        text email UK
        text full_name
        varchar status
        timestamptz created_at
    }

    student_concept_mastery {
        uuid student_id PK, FK
        uuid course_id PK, FK
        uuid concept_id PK, FK
        numeric elo_score "mặc định 1200"
        numeric bkt_mastery_probability "mặc định 0.25"
        varchar mastery_state "weak, learning, mastered"
        boolean weakness_flag
        integer attempt_count
        integer correct_count
        timestamptz last_practiced_at
        timestamptz updated_at
    }

    questions {
        uuid id PK
        uuid course_id FK
        uuid concept_id FK
        varchar type "mcq, short_answer, code"
        text prompt
        jsonb answer_key
        numeric difficulty_elo
        varchar calibration_status "published, draft"
        timestamptz created_at
    }

    quiz_attempts {
        uuid id PK
        uuid student_id FK
        uuid course_id FK
        uuid question_id FK
        uuid concept_id FK
        uuid adaptive_decision_id FK
        jsonb student_answer
        boolean is_correct
        numeric actual_score "0.0 đến 1.0"
        numeric expected_success
        integer hint_count
        boolean used_ai_help
        timestamptz submitted_at
    }

    %% Schema audit (Append-only & ML Tables)
    adaptive_policies {
        uuid id PK
        text name "zpd_selector"
        text version
        varchar status "active"
        jsonb config "chứa arms_states {A_inv, b}"
        timestamptz created_at
    }

    adaptive_decisions {
        uuid id PK
        uuid policy_id FK
        uuid student_id FK
        uuid course_id FK
        uuid concept_id FK
        uuid selected_action_id FK "question_id"
        jsonb candidate_action_ids
        jsonb context_snapshot
        jsonb model_snapshot
        numeric expected_reward
        numeric expected_success
        varchar exploration_mode
        timestamptz created_at
    }

    adaptive_rewards {
        uuid id PK
        uuid adaptive_decision_id FK
        uuid quiz_attempt_id FK
        numeric reward_value
        text reward_formula "zpd_reward_v1"
        numeric observed_success
        numeric target_success "0.75"
        timestamptz created_at
    }

    mastery_events {
        uuid id PK
        uuid student_id FK
        uuid course_id FK
        uuid concept_id FK
        uuid source_id FK "quiz_attempt_id"
        numeric elo_before
        numeric elo_after
        numeric elo_delta
        numeric bkt_before
        numeric bkt_after
        numeric bkt_delta
        varchar state_before
        varchar state_after
        timestamptz created_at
    }

    question_elo_events {
        uuid id PK
        uuid question_id FK
        uuid quiz_attempt_id FK
        numeric difficulty_before
        numeric difficulty_after
        numeric difficulty_delta
        timestamptz created_at
    }

    %% Relationships
    users ||--o{ student_concept_mastery : "có năng lực"
    student_concept_mastery }|--|| questions : "làm các câu hỏi"
    
    users ||--o{ quiz_attempts : "nộp bài"
    questions ||--o{ quiz_attempts : "được trả lời"
    
    adaptive_policies ||--o{ adaptive_decisions : "quyết định dựa trên"
    users ||--o{ adaptive_decisions : "nhận đề xuất"
    
    adaptive_decisions ||--|| quiz_attempts : "dẫn tới"
    adaptive_decisions ||--o{ adaptive_rewards : "thu về"
    quiz_attempts ||--o{ adaptive_rewards : "tạo ra"

    quiz_attempts ||--o{ mastery_events : "kích hoạt"
    quiz_attempts ||--o{ question_elo_events : "kích hoạt"
    questions ||--o{ question_elo_events : "được cập nhật"
```
