-- ============================================================================
-- ai20kekeke | Adaptive Engine — Atomic submit_attempt_v2 (Production Deployment)
-- Target: Supabase Production PostgreSQL 17 (mentora)
-- DB Instance: https://elwyhewuqqlpquzbvtnz.supabase.co
-- Re-run safe: YES — CREATE OR REPLACE
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION app.submit_attempt_v2(
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
    p_k_question     numeric DEFAULT 32.0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_mastery           record;
    v_question          record;
    v_policy_id         uuid;
    v_policy_config     jsonb;
    v_arm               record;
    v_bkt_params        record;
    
    -- Elo calculations
    v_expected          numeric;
    v_sd                numeric;
    v_qd                numeric;
    v_disc              numeric := 1.0;
    v_exponent          numeric;
    v_k_student         numeric;
    v_new_student_elo   numeric;
    v_new_question_elo  numeric;
    v_is_correct        boolean;
    
    -- BKT parameters
    v_prior_learned     numeric;
    v_transition_learn  numeric;
    v_guess             numeric;
    v_slip              numeric;
    
    -- BKT update variables
    v_numerator         numeric;
    v_denominator       numeric;
    v_num_correct       numeric;
    v_den_correct       numeric;
    v_post_correct      numeric;
    v_num_incorrect     numeric;
    v_den_incorrect     numeric;
    v_post_incorrect    numeric;
    v_posterior         numeric;
    v_new_bkt           numeric;
    v_new_state         app.mastery_state;
    v_weakness_flag     boolean;

    -- Bandit Sherman-Morrison variables (3x3)
    a11 numeric; a12 numeric; a13 numeric;
    a21 numeric; a22 numeric; a23 numeric;
    a31 numeric; a32 numeric; a33 numeric;
    b1 numeric; b2 numeric; b3 numeric;
    x1 numeric; x2 numeric; x3 numeric;
    w1 numeric; w2 numeric; w3 numeric;
    denom numeric;
    
    str_question_id     text;
    attempt_id          uuid;
BEGIN
    -- -------------------------------------------------------------------------
    -- 1. Idempotency Check (L-01): Nếu decision đã được nộp và có attempt, trả kết quả cũ
    -- -------------------------------------------------------------------------
    IF EXISTS (
        SELECT 1 FROM audit.adaptive_decisions
         WHERE id = p_decision_id AND consumed_at IS NOT NULL
    ) THEN
        SELECT to_jsonb(qa) INTO attempt_id 
          FROM app.quiz_attempts qa
         WHERE qa.adaptive_decision_id = p_decision_id 
         LIMIT 1;
         
        IF attempt_id IS NOT NULL THEN
            -- Lấy các Elo mới từ database
            SELECT elo_score INTO v_new_student_elo 
              FROM app.student_concept_mastery
             WHERE student_id = p_student_id AND course_id = p_course_id AND concept_id = p_concept_id;
             
            SELECT difficulty_elo INTO v_new_question_elo 
              FROM app.questions 
             WHERE id = p_question_id;

            RETURN jsonb_build_object(
                'new_student_elo',  v_new_student_elo,
                'new_question_elo', v_new_question_elo,
                'expected_success',  1.0, -- mock / fallback
                'is_correct',        (p_actual_score >= 0.75)
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
    -- 3. Khóa bi quan chống Lost Update (SELECT FOR UPDATE)
    --    Khóa theo thứ tự ID ổn định để phòng ngừa deadlock
    -- -------------------------------------------------------------------------
    -- Đọc và khóa Mastery
    SELECT * INTO v_mastery
      FROM app.student_concept_mastery
     WHERE student_id = p_student_id
       AND course_id  = p_course_id
       AND concept_id = p_concept_id
     FOR UPDATE;

    IF NOT FOUND THEN
        -- Khởi tạo mastery mặc định ngay trong Transaction (chống race condition M-01)
        INSERT INTO app.student_concept_mastery (
            student_id, course_id, concept_id, elo_score, bkt_mastery_probability, mastery_state, weakness_flag, attempt_count, correct_count
        ) VALUES (
            p_student_id, p_course_id, p_concept_id, 1200.0, 0.25, 'not_started', false, 0, 0
        )
        RETURNING * INTO v_mastery;
    END IF;

    -- Đọc và khóa câu hỏi
    SELECT * INTO v_question
      FROM app.questions
     WHERE id = p_question_id
     FOR UPDATE;

    -- -------------------------------------------------------------------------
    -- 4. Tính Elo với clamp chống overflow và Provisional K (H-02)
    -- -------------------------------------------------------------------------
    v_exponent := least(20.0, greatest(-20.0, (v_question.difficulty_elo - v_mastery.elo_score) / 400.0));
    v_expected := 1.0 / (1.0 + power(10.0, v_exponent));

    v_sd := p_actual_score - v_expected;
    v_qd := v_expected - p_actual_score;

    -- Hint discount
    IF v_sd > 0 AND p_hint_count > 0 THEN
        v_disc := greatest(0.1, 1.0 - 0.3 * p_hint_count);
        v_sd := v_sd * v_disc;
        v_qd := v_qd * v_disc;
    END IF;

    -- Provisional K-factor based on attempt_count
    v_k_student := CASE 
        WHEN p_used_ai_help THEN 0.0
        ELSE greatest(16.0, 48.0 / (1.0 + v_mastery.attempt_count / 10.0))
    END;

    v_new_student_elo  := round(v_mastery.elo_score       + v_k_student  * v_sd, 2);
    v_new_question_elo := round(v_question.difficulty_elo + p_k_question * v_qd, 2);
    v_is_correct       := (p_actual_score >= 0.75);

    -- -------------------------------------------------------------------------
    -- 5. Cập nhật BKT Bayes ngay trong Transaction (B-02)
    -- -------------------------------------------------------------------------
    IF p_used_ai_help THEN
        v_new_bkt := v_mastery.bkt_mastery_probability;
    ELSE
        -- Đọc tham số BKT từ DB hoặc sử dụng mặc định
        SELECT * INTO v_bkt_params 
          FROM audit.bkt_parameters
         WHERE concept_id = p_concept_id AND status = 'active'
         ORDER BY created_at DESC LIMIT 1;
         
        IF NOT FOUND THEN
            v_prior_learned := 0.25;
            v_transition_learn := 0.10;
            v_guess := 0.20;
            v_slip := 0.10;
        ELSE
            v_prior_learned := v_bkt_params.prior_learned;
            v_transition_learn := v_bkt_params.transition_learn;
            v_guess := v_bkt_params.guess;
            v_slip := v_bkt_params.slip;
        END IF;

        -- BKT posterior updates
        IF p_actual_score >= 1.0 THEN
            v_numerator := v_mastery.bkt_mastery_probability * (1.0 - v_slip);
            v_denominator := v_numerator + (1.0 - v_mastery.bkt_mastery_probability) * v_guess;
        ELSIF p_actual_score <= 0.0 THEN
            v_numerator := v_mastery.bkt_mastery_probability * v_slip;
            v_denominator := v_numerator + (1.0 - v_mastery.bkt_mastery_probability) * (1.0 - v_guess);
        ELSE
            -- Nội suy tuyến tính cho partial credit
            v_num_correct := v_mastery.bkt_mastery_probability * (1.0 - v_slip);
            v_den_correct := v_num_correct + (1.0 - v_mastery.bkt_mastery_probability) * v_guess;
            v_post_correct := CASE WHEN v_den_correct = 0 THEN v_mastery.bkt_mastery_probability ELSE v_num_correct / v_den_correct END;

            v_num_incorrect := v_mastery.bkt_mastery_probability * v_slip;
            v_den_incorrect := v_num_incorrect + (1.0 - v_mastery.bkt_mastery_probability) * (1.0 - v_guess);
            v_post_incorrect := CASE WHEN v_den_incorrect = 0 THEN v_mastery.bkt_mastery_probability ELSE v_num_incorrect / v_den_incorrect END;

            v_numerator := p_actual_score * v_post_correct + (1.0 - p_actual_score) * v_post_incorrect;
            v_denominator := 1.0;
        END IF;

        IF v_denominator = 0 THEN
            v_posterior := v_mastery.bkt_mastery_probability;
        ELSE
            v_posterior := least(1.0, greatest(0.0, v_numerator / v_denominator));
        END IF;

        v_new_bkt := v_posterior + (1.0 - v_posterior) * v_transition_learn;
        v_new_bkt := round(least(0.9999, greatest(0.0001, v_new_bkt)), 4);
    END IF;

    -- Đồng bộ hóa trạng thái mastery (H-01)
    v_new_state := CASE 
        WHEN v_new_bkt < 0.30 THEN 'weak'::app.mastery_state
        WHEN v_new_bkt < 0.85 THEN 'learning'::app.mastery_state
        ELSE 'mastered'::app.mastery_state
    END;
    v_weakness_flag := (v_new_bkt < 0.50);

    -- -------------------------------------------------------------------------
    -- 6. Thực hiện update Elo, BKT và counters (Atomic)
    -- -------------------------------------------------------------------------
    UPDATE app.student_concept_mastery
       SET elo_score               = v_new_student_elo,
           bkt_mastery_probability = v_new_bkt,
           mastery_state           = v_new_state,
           weakness_flag           = v_weakness_flag,
           attempt_count           = attempt_count + 1,
           correct_count           = correct_count + (CASE WHEN v_is_correct THEN 1 ELSE 0 END),
           last_practiced_at       = now(),
           updated_at              = now()
     WHERE student_id = p_student_id
       AND course_id  = p_course_id
       AND concept_id = p_concept_id;

    UPDATE app.questions
       SET difficulty_elo = v_new_question_elo,
           updated_at     = now()
     WHERE id = p_question_id;

    -- -------------------------------------------------------------------------
    -- 7. Cập nhật Bandit Arm trong SQL dưới FOR UPDATE (B-03)
    -- -------------------------------------------------------------------------
    SELECT id INTO v_policy_id 
      FROM audit.adaptive_policies
     WHERE name = 'zpd_selector' AND status = 'active' AND course_id = p_course_id
     ORDER BY created_at DESC LIMIT 1;

    IF v_policy_id IS NOT NULL AND array_length(p_context, 1) = 3 THEN
        str_question_id := p_question_id::text;
        
        -- Khóa và đọc Bandit Arm
        SELECT * INTO v_arm 
          FROM audit.bandit_arms
         WHERE policy_id = v_policy_id AND arm_id = str_question_id
           FOR UPDATE;

        IF NOT FOUND THEN
            a11 := 1.0; a12 := 0.0; a13 := 0.0;
            a21 := 0.0; a22 := 1.0; a23 := 0.0;
            a31 := 0.0; a32 := 0.0; a33 := 1.0;
            b1 := 0.0; b2 := 0.0; b3 := 0.0;
        ELSE
            a11 := v_arm.a_inv[1][1];
            a12 := v_arm.a_inv[1][2];
            a13 := v_arm.a_inv[1][3];
            a21 := v_arm.a_inv[2][1];
            a22 := v_arm.a_inv[2][2];
            a23 := v_arm.a_inv[2][3];
            a31 := v_arm.a_inv[3][1];
            a32 := v_arm.a_inv[3][2];
            a33 := v_arm.a_inv[3][3];
            b1  := v_arm.b[1];
            b2  := v_arm.b[2];
            b3  := v_arm.b[3];
        END IF;

        -- Context vector x
        x1 := p_context[1];
        x2 := p_context[2];
        x3 := p_context[3];

        -- w = A_inv * x
        w1 := a11*x1 + a12*x2 + a13*x3;
        w2 := a21*x1 + a22*x2 + a23*x3;
        w3 := a31*x1 + a32*x2 + a33*x3;

        -- denom = 1 + x^T * A_inv * x
        denom := 1.0 + x1*w1 + x2*w2 + x3*w3;

        -- Sherman-Morrison update
        IF denom > 0.000001 THEN
            a11 := a11 - (w1*w1)/denom;
            a12 := a12 - (w1*w2)/denom;
            a13 := a13 - (w1*w3)/denom;
            a21 := a21 - (w2*w1)/denom;
            a22 := a22 - (w2*w2)/denom;
            a23 := a23 - (w2*w3)/denom;
            a31 := a31 - (w3*w1)/denom;
            a32 := a32 - (w3*w2)/denom;
            a33 := a33 - (w3*w3)/denom;
        END IF;

        -- b = b + reward * x
        b1 := b1 + p_reward*x1;
        b2 := b2 + p_reward*x2;
        b3 := b3 + p_reward*x3;

        INSERT INTO audit.bandit_arms (policy_id, arm_id, a_inv, b, updated_at)
        VALUES (
            v_policy_id,
            str_question_id,
            ARRAY[
                ARRAY[a11, a12, a13]::double precision[],
                ARRAY[a21, a22, a23]::double precision[],
                ARRAY[a31, a32, a33]::double precision[]
            ]::double precision[],
            ARRAY[b1, b2, b3]::double precision[],
            now()
        )
        ON CONFLICT (policy_id, arm_id) DO UPDATE
        SET a_inv = EXCLUDED.a_inv,
            b = EXCLUDED.b,
            updated_at = EXCLUDED.updated_at;
    END IF;

    -- -------------------------------------------------------------------------
    -- 8. Ghi Logs Audit trong cùng Transaction (B-01)
    -- -------------------------------------------------------------------------
    -- Insert attempt log
    INSERT INTO app.quiz_attempts (
        student_id, course_id, question_id, concept_id,
        adaptive_decision_id, student_answer,
        is_correct, actual_score, expected_success,
        hint_count, used_ai_help, grading_method
    ) VALUES (
        p_student_id, p_course_id, p_question_id, p_concept_id,
        p_decision_id, p_student_answer,
        v_is_correct, p_actual_score, v_expected,
        p_hint_count, p_used_ai_help, 'deterministic'
    )
    RETURNING id INTO attempt_id;

    -- Log mastery transition
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

    -- Log question Elo transition
    INSERT INTO audit.question_elo_events (
        question_id, quiz_attempt_id,
        difficulty_before, difficulty_after, difficulty_delta
    ) VALUES (
        p_question_id, attempt_id,
        v_question.difficulty_elo, v_new_question_elo, v_new_question_elo - v_question.difficulty_elo
    );

    -- Log reward
    INSERT INTO audit.adaptive_rewards (
        adaptive_decision_id, quiz_attempt_id, reward_value, reward_formula, observed_success, target_success
    ) VALUES (
        p_decision_id, attempt_id, p_reward, 'zpd_reward_v1', p_actual_score, 0.7500
    );

    -- Trả về kết quả
    RETURN jsonb_build_object(
        'new_student_elo',   v_new_student_elo,
        'new_question_elo',  v_new_question_elo,
        'expected_success',  v_expected,
        'is_correct',        v_is_correct,
        'new_bkt',           v_new_bkt,
        'new_state',         v_new_state,
        'weakness_flag',     v_weakness_flag
    );
END;
$$;

GRANT EXECUTE ON FUNCTION app.submit_attempt_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION app.submit_attempt_v2 TO service_role;

COMMIT;
