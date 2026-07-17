# Luồng Hoạt động Chi tiết (Detailed Sequence Flows)

Tài liệu này chứa các sơ đồ tuần tự (Sequence Diagrams) mô tả chi tiết thứ tự gọi hàm, tương tác database và logic thuật toán của 2 API chính: `/recommend` và `/submit`.

---

## 1. Luồng Gợi ý Câu hỏi thích ứng (`POST /adaptive/recommend`)

Sơ đồ mô tả quy trình LinUCB tính điểm UCB và chọn câu hỏi nằm trong vùng ZPD dựa theo context vector của học sinh.

```mermaid
sequenceDiagram
    autonumber
    actor Student as Học viên (Client App)
    participant API as FastAPI Router (/recommend)
    participant DB as Supabase DB Adapter
    participant Bandit as LinUCB Engine
    participant Elo as Elo Engine

    Student->>API: Yêu cầu câu hỏi tiếp theo (student_id, course_id, concept_id)
    Note over API: db.begin() <br/> Mở Database Transaction
    
    API->>DB: get_student_mastery()
    DB-->>API: Trả về Student Elo & BKT Probability
    
    API->>DB: get_candidate_questions_meta()
    Note over DB: SELECT id, difficulty_elo <br/> WHERE status = 'published' (Lọc thô)
    DB-->>API: Danh sách rút gọn câu hỏi (id, difficulty_elo)
    
    API->>DB: get_bandit_policy_state()
    DB-->>API: policy_id, policy_config (chứa arms_states)
    
    API->>Bandit: build_student_context(p_mastery, elo_score)
    Note over Bandit: X = [1.0, BKT, Sigmoid(Elo)]
    Bandit-->>API: Context Vector X
    
    API->>Bandit: select_arm(X, arms_states, candidate_ids)
    Note over Bandit: Tính expected_reward & UCB Score<br/>cho từng candidate. Chọn Max UCB.
    Bandit-->>API: selected_qid_str, expected_reward
    
    API->>DB: update_bandit_policy_config(policy_id, policy_config)
    Note over DB: Lưu ma trận cập nhật (nếu khởi tạo default arm)
    
    API->>DB: get_question_by_id(selected_qid)
    Note over DB: SELECT details (prompt, answer_key) <br/> của 1 câu duy nhất (Lọc chi tiết)
    DB-->>API: Đề bài, kiểu câu hỏi, options
    
    API->>Elo: calculate_expected_success(student_elo, question_elo)
    Note over Elo: P(correct) = 1 / (1 + 10^((q_elo - s_elo)/400))<br/>(Dự báo chuẩn cho ZPD ở bước nộp bài)
    Elo-->>API: expected_success
    
    API->>DB: log_adaptive_decision(...)
    Note over DB: INSERT audit.adaptive_decisions<br/>(Lưu vết context, model snapshot, expected_success)
    DB-->>API: decision_id
    
    Note over API: db.commit() <br/> Commit Database Transaction
    API-->>Student: Trả về RecommendResponse<br/>(decision_id, question_id, prompt, expected_success)
```

---

## 2. Luồng Nộp bài & Hiệu chuẩn Hệ thống (`POST /adaptive/submit`)

Sơ đồ tuần tự chi tiết luồng xử lý nộp bài: Kiểm toán chéo chống Replay Attack, rẽ nhánh đóng băng Elo khi học sinh dùng AI help, cập nhật BKT và Elo câu hỏi, và cập nhật ma trận Bandit bằng công thức Sherman-Morrison.

```mermaid
sequenceDiagram
    autonumber
    actor Student as Học viên (Client App)
    participant API as FastAPI Router (/submit)
    participant DB as Supabase DB Adapter
    participant Elo as Elo Engine
    participant BKT as BKT Engine
    participant Bandit as Bandit Engine

    Student->>API: Gửi bài làm & Điểm chấm (student_id, question_id, decision_id, actual_score, hint_count, used_ai_help)
    Note over API: db.begin() <br/> Mở Database Transaction
    
    API->>DB: get_adaptive_decision(decision_id)
    DB-->>API: Trả về decision trace (student_id, question_id, expected_success, context_snapshot)
    
    Note over API: Cross-validation (Chống Replay Attack)<br/>Kiểm tra khớp student_id & question_id
    alt Mismatch / Fraud
        API-->>Student: Ném lỗi 400/403 (Rollback Transaction)
    end
    
    API->>DB: get_student_mastery()
    DB-->>API: Old Student Elo, Old BKT
    
    API->>DB: get_question_by_id(question_id)
    DB-->>API: Old Question Elo
    
    alt used_ai_help == True (Chống gian lận AI)
        API->>Elo: calculate_elo_updates(k_factor=0.0)
        Note over Elo: Giữ nguyên Elo học viên,<br/>chỉ hiệu chuẩn độ khó câu hỏi
        Elo-->>API: new_student_elo, new_question_elo
        Note over API: Giữ nguyên BKT: new_bkt = old_bkt
    else Tự làm bài (Standard Update)
        API->>Elo: calculate_elo_updates(hint_count)
        Note over Elo: Tính toán Elo mới cho cả hai.<br/>Khấu trừ Elo tăng nếu dùng gợi ý.
        Elo-->>API: new_student_elo, new_question_elo
        
        API->>BKT: calculate_bkt_update(old_bkt, actual_score)
        Note over BKT: Tính Bayes Posterior + Transition.<br/>Giới hạn cập nhật <= 0.9999 (Mastery Trap Fix).
        BKT-->>API: new_bkt
    end
    
    API->>BKT: determine_mastery_state(new_bkt)
    BKT-->>API: new_state ('weak', 'learning', 'mastered')
    
    API->>DB: update_student_mastery(...)
    Note over DB: UPDATE app.student_concept_mastery
    API->>DB: update_question_elo(...)
    Note over DB: UPDATE app.questions
    API->>DB: log_quiz_attempt(...)
    Note over DB: INSERT app.quiz_attempts (Lưu lịch sử bài làm)
    DB-->>API: attempt_id
    
    API->>Bandit: calculate_bandit_reward(expected_success, actual_score)
    Note over Bandit: Tính Y dựa trên độ lệch ZPD 75%
    Bandit-->>API: bandit_reward
    
    API->>DB: get_bandit_policy_state()
    DB-->>API: policy_id, policy_config (chứa arms_states)
    
    API->>Bandit: update_arm(question_id, context_snapshot, bandit_reward, arms_states)
    Note over Bandit: Cập nhật ma trận nghịch đảo A_inv & b<br/>bằng công thức Sherman-Morrison (O(d^2))
    Bandit-->>API: updated_arms_states
    
    API->>DB: update_bandit_policy_config(policy_id, policy_config)
    Note over DB: UPDATE audit.adaptive_policies
    
    API->>DB: Ghi log audit phụ trợ
    Note over DB: log_adaptive_reward(), log_mastery_event(), log_question_elo_event()
    
    Note over API: db.commit() <br/> Commit Database Transaction
    
    API-->>Student: Trả về SubmitResponse<br/>(is_correct, new_elo, new_bkt, bandit_reward)
```
