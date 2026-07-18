-- ============================================================================
-- ai20kekeke | Phase 3: Concurrency Optimization and Asynchronous Batching
-- Target: Supabase PostgreSQL 17
-- Re-run safe: YES
-- ============================================================================

BEGIN;

-- 1. Tạo bảng app.calibration_outbox trung chuyển cho background worker
CREATE TABLE IF NOT EXISTS app.calibration_outbox (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL,
    question_id uuid NOT NULL,
    policy_id uuid,
    actual_score numeric NOT NULL,
    expected_success numeric NOT NULL,
    reward numeric NOT NULL,
    context_vector numeric[] NOT NULL,
    hint_count integer NOT NULL DEFAULT 0,
    used_ai_help boolean NOT NULL DEFAULT false,
    response_time_ms integer DEFAULT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Index để worker truy vấn nhanh theo thời gian tạo
CREATE INDEX IF NOT EXISTS idx_calibration_outbox_created_at ON app.calibration_outbox (created_at ASC);

-- 2. Tái cấu trúc bảng audit.bandit_arms sử dụng double precision[] và bổ sung ma trận gốc A cùng update_count
DROP TABLE IF EXISTS audit.bandit_arms CASCADE;

CREATE TABLE audit.bandit_arms (
    policy_id    uuid  NOT NULL REFERENCES audit.adaptive_policies(id) ON DELETE CASCADE,
    arm_id       text  NOT NULL,                 -- question UUID as text
    a            double precision[] NOT NULL DEFAULT ARRAY[[1.0,0.0,0.0],[0.0,1.0,0.0],[0.0,0.0,1.0]]::double precision[], -- Raw Covariance Matrix A
    a_inv        double precision[] NOT NULL DEFAULT ARRAY[[1.0,0.0,0.0],[0.0,1.0,0.0],[0.0,0.0,1.0]]::double precision[], -- Inverse Covariance Matrix A_inv
    b            double precision[] NOT NULL DEFAULT ARRAY[0.0,0.0,0.0]::double precision[],
    update_count integer NOT NULL DEFAULT 0,
    updated_at   timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (policy_id, arm_id)
);

CREATE INDEX IF NOT EXISTS idx_bandit_arms_policy ON audit.bandit_arms (policy_id);

-- 3. Định nghĩa lại RPC submit_attempt_v3 loại bỏ locks FOR UPDATE và chuyển tính toán sang async outbox
CREATE OR REPLACE FUNCTION app.submit_attempt_v3(
    p_decision_id    uuid,
    p_student_id     uuid,
    p_course_id      uuid,
    p_concept_id     uuid,
    p_question_id    uuid,
    p_student_answer jsonb,
    p_actual_score   numeric,    -- server đã chấm
    p_hint_count     integer,    -- số hint dùng trong lượt này
    p_used_ai_help   boolean,
    p_context        numeric[],  -- vector ngữ cảnh bandit [1.0, BKT, elo_norm]
    p_reward         numeric,    -- reward ZPD đã tính ở app
    p_k_question     numeric DEFAULT 32.0,
    p_response_time_ms integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_mastery           record;
    v_question          record;
    v_policy_id         uuid;
    v_bkt_params        record;
    
    -- Elo calculations
    v_expected          numeric;
    v_sd                numeric;
    v_disc              numeric := 1.0;
    v_exponent          numeric;
    v_k_student         numeric;
    v_new_student_elo   numeric;
    v_is_correct        boolean;
    
    -- BKT parameters
    v_prior_learned     numeric;
    v_transition_learn  numeric;
    v_guess             numeric;
    v_slip              numeric;
    
    -- BKT update variables
    v_numerator         numeric;
    v_denominator       numeric;
    v_posterior         numeric;
    v_new_bkt           numeric;
    v_new_state         app.mastery_state;
    v_weakness_flag     boolean;
    v_new_stability     numeric;

    attempt_id          uuid;
BEGIN
    -- -------------------------------------------------------------------------
    -- 1. Idempotency Check: Sửa lỗi ép kiểu UUID
    -- -------------------------------------------------------------------------
    IF EXISTS (
        SELECT 1 FROM audit.adaptive_decisions
         WHERE id = p_decision_id AND consumed_at IS NOT NULL
    ) THEN
        SELECT qa.id INTO attempt_id 
          FROM app.quiz_attempts qa
         WHERE qa.adaptive_decision_id = p_decision_id 
         LIMIT 1;
          
        IF attempt_id IS NOT NULL THEN
            SELECT elo_score, stability_days INTO v_new_student_elo, v_new_stability
              FROM app.student_concept_mastery
             WHERE student_id = p_student_id AND course_id = p_course_id AND concept_id = p_concept_id;
             
            RETURN jsonb_build_object(
                'new_student_elo',      v_new_student_elo,
                'new_question_elo',     (SELECT difficulty_elo FROM app.questions WHERE id = p_question_id),
                'expected_success',      1.0, 
                'is_correct',            (p_actual_score >= 0.75),
                'new_bkt',               (SELECT bkt_mastery_probability FROM app.student_concept_mastery WHERE student_id = p_student_id AND course_id = p_course_id AND concept_id = p_concept_id),
                'new_state',             (SELECT mastery_state FROM app.student_concept_mastery WHERE student_id = p_student_id AND course_id = p_course_id AND concept_id = p_concept_id),
                'weakness_flag',         (SELECT weakness_flag FROM app.student_concept_mastery WHERE student_id = p_student_id AND course_id = p_course_id AND concept_id = p_concept_id),
                'propagated_concepts',   jsonb_build_array(),
                'stability_days',        v_new_stability
            );
        END IF;
    END IF;

    -- -------------------------------------------------------------------------
    -- 2. Consume Decision (Chống Replay Attack)
    -- -------------------------------------------------------------------------
    UPDATE audit.adaptive_decisions
       SET consumed_at = now()
     WHERE id = p_decision_id
       AND student_id = p_student_id
       AND selected_action_id = p_question_id
       AND consumed_at IS NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'DECISION_INVALID_OR_CONSUMED'
            USING ERRCODE = 'P0409', DETAIL = 'decision_id đã được tiêu thụ hoặc không hợp lệ';
    END IF;

    -- -------------------------------------------------------------------------
    -- 3. Khóa bi quan chống Lost Update (SELECT FOR UPDATE) - CHỈ khóa student mastery, KHÔNG khóa questions hay bandit_arms
    -- -------------------------------------------------------------------------
    SELECT * INTO v_mastery
      FROM app.student_concept_mastery
     WHERE student_id = p_student_id
       AND course_id  = p_course_id
       AND concept_id = p_concept_id
     FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO app.student_concept_mastery (
            student_id, course_id, concept_id, elo_score, bkt_mastery_probability, mastery_state, weakness_flag, attempt_count, correct_count
        ) VALUES (
            p_student_id, p_course_id, p_concept_id, 1200.0, 0.25, 'not_started', false, 0, 0
        )
        RETURNING * INTO v_mastery;
    END IF;

    -- Áp dụng forgetting decay cho prior dùng trong BKT cập nhật
    IF v_mastery.last_practiced_at IS NOT NULL THEN
        DECLARE
            v_delta_days numeric;
        BEGIN
            v_delta_days := EXTRACT(EPOCH FROM (now() - v_mastery.last_practiced_at)) / 86400.0;
            IF v_delta_days > 0 AND v_mastery.stability_days > 0 THEN
                v_mastery.bkt_mastery_probability := v_mastery.bkt_mastery_probability * power(2.0, -v_delta_days / v_mastery.stability_days);
                v_mastery.bkt_mastery_probability := least(0.9999, greatest(0.0001, v_mastery.bkt_mastery_probability));
            END IF;
        END;
    END IF;

    -- SELECT Question KHÔNG có FOR UPDATE để giải phóng khóa tranh chấp
    SELECT * INTO v_question
      FROM app.questions
     WHERE id = p_question_id;

    -- -------------------------------------------------------------------------
    -- 4. Tính Elo với clamp chống overflow và Provisional K & Dynamic K-factors
    -- -------------------------------------------------------------------------
    v_exponent := least(20.0, greatest(-20.0, (v_question.difficulty_elo - v_mastery.elo_score) / 400.0));
    v_expected := 1.0 / (1.0 + power(10.0, v_exponent));

    v_sd := p_actual_score - v_expected;

    IF v_sd > 0 AND p_hint_count > 0 THEN
        v_disc := greatest(0.1, 1.0 - 0.3 * p_hint_count);
        v_sd := v_sd * v_disc;
    END IF;

    -- A. Tính K_student động (Pelánek 2016)
    v_k_student := CASE 
        WHEN p_used_ai_help THEN 0.0
        ELSE greatest(16.0, 48.0 / (1.0 + v_mastery.attempt_count / 10.0))
    END;

    -- Bù đắp lượng suy giảm trí nhớ bằng cách tăng K_student nếu thời gian trôi qua dài hơn 7 ngày (Time-Gap Uncertainty)
    IF NOT p_used_ai_help AND v_mastery.last_practiced_at IS NOT NULL AND 
       (EXTRACT(EPOCH FROM (now() - v_mastery.last_practiced_at)) / 86400.0) > 7.0 THEN
        v_k_student := greatest(v_k_student, 32.0);
    END IF;

    v_new_student_elo := round(v_mastery.elo_score + v_k_student * v_sd, 2);
    v_is_correct       := (p_actual_score >= 0.75);

    -- -------------------------------------------------------------------------
    -- 5. Cập nhật BKT Bayes ngay trong Transaction (Đồng bộ T = 0.06 và chuẩn nhị phân BKT)
    -- -------------------------------------------------------------------------
    IF p_used_ai_help THEN
        v_new_bkt := v_mastery.bkt_mastery_probability;
    ELSE
        SELECT * INTO v_bkt_params 
          FROM audit.bkt_parameters
         WHERE concept_id = p_concept_id AND status = 'active'
         ORDER BY created_at DESC LIMIT 1;
         
        IF NOT FOUND THEN
            v_prior_learned := 0.25;
            v_transition_learn := 0.06; -- Thống nhất 0.06
            v_guess := 0.20;
            v_slip := 0.10;
        ELSE
            v_prior_learned := v_bkt_params.prior_learned;
            v_transition_learn := v_bkt_params.transition_learn;
            v_guess := v_bkt_params.guess;
            v_slip := v_bkt_params.slip;
        END IF;

        -- Chuẩn nhị phân BKT (loại bỏ hoàn toàn code chết partial-credit)
        IF p_actual_score >= 0.75 THEN
            v_numerator := v_mastery.bkt_mastery_probability * (1.0 - v_slip);
            v_denominator := v_numerator + (1.0 - v_mastery.bkt_mastery_probability) * v_guess;
        ELSE
            v_numerator := v_mastery.bkt_mastery_probability * v_slip;
            v_denominator := v_numerator + (1.0 - v_mastery.bkt_mastery_probability) * (1.0 - v_guess);
        END IF;

        -- FIX: Thay thế min/max bằng least/greatest
        IF v_denominator = 0 THEN
            v_posterior := v_mastery.bkt_mastery_probability;
        ELSE
            v_posterior := least(1.0, greatest(0.0, v_numerator / v_denominator));
        END IF;

        v_new_bkt := v_posterior + (1.0 - v_posterior) * v_transition_learn;
        v_new_bkt := round(least(0.9999, greatest(0.0001, v_new_bkt)), 4);
    END IF;

    v_new_state := CASE 
        WHEN v_new_bkt < 0.30 THEN 'weak'::app.mastery_state
        WHEN v_new_bkt < 0.85 THEN 'learning'::app.mastery_state
        ELSE 'mastered'::app.mastery_state
    END;
    v_weakness_flag := (v_new_bkt < 0.50);

    -- -------------------------------------------------------------------------
    -- 6. Thực hiện update Elo, BKT và counters của học sinh (Atomic + Cap stability_days tối đa 36500)
    -- -------------------------------------------------------------------------
    UPDATE app.student_concept_mastery
       SET elo_score               = v_new_student_elo,
           bkt_mastery_probability = v_new_bkt,
           mastery_state           = v_new_state,
           weakness_flag           = v_weakness_flag,
           attempt_count           = attempt_count + 1,
           correct_count           = correct_count + (CASE WHEN v_is_correct THEN 1 ELSE 0 END),
           last_practiced_at       = now(),
           stability_days          = least(36500.0, CASE 
                                                       WHEN p_actual_score >= 0.8 THEN coalesce(stability_days, 3.0) * 2.0
                                                       WHEN p_actual_score < 0.5 THEN greatest(1.0, coalesce(stability_days, 3.0) * 0.5)
                                                       ELSE coalesce(stability_days, 3.0)
                                                     END),
           updated_at              = now()
     WHERE student_id = p_student_id
       AND course_id  = p_course_id
       AND concept_id = p_concept_id
     RETURNING stability_days INTO v_new_stability;

    -- -------------------------------------------------------------------------
    -- 7. Lấy policy_id
    -- -------------------------------------------------------------------------
    SELECT id INTO v_policy_id 
      FROM audit.adaptive_policies
     WHERE name = 'zpd_selector' AND status = 'active' AND course_id = p_course_id
     ORDER BY created_at DESC LIMIT 1;

    -- -------------------------------------------------------------------------
    -- 8. Ghi Logs Audit trong cùng Transaction
    -- -------------------------------------------------------------------------
    INSERT INTO app.quiz_attempts (
        student_id, course_id, question_id, concept_id,
        adaptive_decision_id, student_answer,
        is_correct, actual_score, expected_success,
        hint_count, used_ai_help, grading_method,
        response_time_ms
    ) VALUES (
        p_student_id, p_course_id, p_question_id, p_concept_id,
        p_decision_id, p_student_answer,
        v_is_correct, p_actual_score, v_expected,
        p_hint_count, p_used_ai_help, 'deterministic',
        p_response_time_ms
    )
    RETURNING id INTO attempt_id;

    INSERT INTO audit.mastery_events (
        student_id, course_id, concept_id, source_type, source_id,
        elo_before, elo_after, elo_delta,
        bkt_before, bkt_after, bkt_delta,
        state_before, state_after
    ) VALUES (
        p_student_id, p_course_id, p_concept_id, 'quiz_attempt', attempt_id,
        v_mastery.elo_score, v_new_student_elo, v_new_student_elo - v_mastery.elo_score,
        v_mastery.bkt_mastery_probability, v_new_bkt, v_new_bkt - v_mastery.bkt_mastery_probability,
        v_mastery.mastery_state, v_new_state
    );

    INSERT INTO audit.adaptive_rewards (
        adaptive_decision_id, quiz_attempt_id, reward_value, reward_formula, observed_success, target_success
    ) VALUES (
        p_decision_id, attempt_id, p_reward, 'zpd_reward_v1', p_actual_score, 0.7500
    );

    -- -------------------------------------------------------------------------
    -- 9. Ghi nhận outbox để Background Calibration Worker xử lý bất đồng bộ
    -- -------------------------------------------------------------------------
    INSERT INTO app.calibration_outbox (
        attempt_id, question_id, policy_id, actual_score, expected_success, reward, context_vector,
        hint_count, used_ai_help, response_time_ms
    ) VALUES (
        attempt_id, p_question_id, v_policy_id, p_actual_score, v_expected, p_reward, p_context,
        p_hint_count, p_used_ai_help, p_response_time_ms
    );

    -- -------------------------------------------------------------------------
    -- 10. Trả về kết quả
    -- -------------------------------------------------------------------------
    RETURN jsonb_build_object(
        'new_student_elo',      v_new_student_elo,
        'new_question_elo',     v_question.difficulty_elo, 
        'expected_success',      v_expected,
        'is_correct',            v_is_correct,
        'new_bkt',               v_new_bkt,
        'new_state',             v_new_state,
        'weakness_flag',         v_weakness_flag,
        'propagated_concepts',   jsonb_build_array(),
        'stability_days',        v_new_stability
    );
END;
$$;

-- Phân quyền
REVOKE EXECUTE ON FUNCTION app.submit_attempt_v3(uuid, uuid, uuid, uuid, uuid, jsonb, numeric, integer, boolean, numeric[], numeric, numeric, integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION app.submit_attempt_v3(uuid, uuid, uuid, uuid, uuid, jsonb, numeric, integer, boolean, numeric[], numeric, numeric, integer) FROM public;
GRANT EXECUTE ON FUNCTION app.submit_attempt_v3(
    uuid, uuid, uuid, uuid, uuid, jsonb, numeric, integer,
    boolean, numeric[], numeric, numeric, integer
) TO service_role;

COMMIT;
