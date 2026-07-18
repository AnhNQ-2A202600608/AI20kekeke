-- ============================================================================
-- ai20kekeke | Onboarding diagnostic mastery seed
-- Target: Supabase PostgreSQL
-- Re-run safe: YES
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION app.complete_onboarding_diagnostic(p_profile jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app, audit, public
AS $$
DECLARE
    v_profile_id uuid := (p_profile->>'id')::uuid;
    v_student_id uuid := (p_profile->>'student_id')::uuid;
    v_profile_version text := coalesce(p_profile->>'profile_version', 'onboarding_v1');
    v_summary jsonb := coalesce(p_profile->'summary', '{}'::jsonb);
    v_seed jsonb;
    v_concept record;
    v_now timestamptz := now();
    v_elo numeric;
    v_bkt numeric;
    v_state app.mastery_state;
    v_weakness boolean;
    v_evidence_count integer;
    v_elo_before numeric;
    v_bkt_before numeric;
    v_state_before app.mastery_state;
BEGIN
    IF v_profile_id IS NULL OR v_student_id IS NULL THEN
        RAISE EXCEPTION 'invalid onboarding profile payload';
    END IF;

    INSERT INTO app.onboarding_profiles (
        id,
        student_id,
        profile_version,
        survey,
        diagnostic_answers,
        summary,
        recommended_concept_id,
        completed_at,
        updated_at
    )
    VALUES (
        v_profile_id,
        v_student_id,
        v_profile_version,
        coalesce(p_profile->'survey', '{}'::jsonb),
        coalesce(p_profile->'diagnostic_answers', '[]'::jsonb),
        v_summary,
        p_profile->>'recommended_concept_id',
        coalesce((p_profile->>'completed_at')::timestamptz, v_now),
        v_now
    )
    ON CONFLICT (student_id, profile_version)
    DO UPDATE SET
        survey = EXCLUDED.survey,
        diagnostic_answers = EXCLUDED.diagnostic_answers,
        summary = EXCLUDED.summary,
        recommended_concept_id = EXCLUDED.recommended_concept_id,
        completed_at = EXCLUDED.completed_at,
        updated_at = v_now
    RETURNING id INTO v_profile_id;

    FOR v_seed IN SELECT * FROM jsonb_array_elements(coalesce(v_summary->'seeded_concepts', '[]'::jsonb))
    LOOP
        IF v_seed->>'db_concept_code' IS NULL THEN
            CONTINUE;
        END IF;

        SELECT id, course_id INTO v_concept
          FROM app.concepts
         WHERE course_id = '00000000-0000-0000-0000-000000000001'::uuid
           AND code = v_seed->>'db_concept_code'
         LIMIT 1;

        IF NOT FOUND THEN
            CONTINUE;
        END IF;

        v_elo := (v_seed->>'elo_score')::numeric;
        v_bkt := (v_seed->>'bkt_mastery_probability')::numeric;
        v_state := (v_seed->>'mastery_state')::app.mastery_state;
        v_weakness := coalesce((v_seed->>'weakness_flag')::boolean, v_bkt < 0.50);
        v_evidence_count := greatest(0, coalesce((v_seed->>'evidence_count')::integer, 0));

        SELECT elo_score, bkt_mastery_probability, mastery_state
          INTO v_elo_before, v_bkt_before, v_state_before
          FROM app.student_concept_mastery
         WHERE student_id = v_student_id
           AND course_id = v_concept.course_id
           AND concept_id = v_concept.id
         FOR UPDATE;

        IF NOT FOUND THEN
            v_elo_before := 1200.0;
            v_bkt_before := 0.25;
            v_state_before := 'not_started'::app.mastery_state;
        END IF;

        INSERT INTO app.student_concept_mastery (
            student_id,
            course_id,
            concept_id,
            elo_score,
            bkt_mastery_probability,
            mastery_state,
            weakness_flag,
            attempt_count,
            correct_count,
            last_practiced_at,
            updated_at
        )
        VALUES (
            v_student_id,
            v_concept.course_id,
            v_concept.id,
            v_elo,
            v_bkt,
            v_state,
            v_weakness,
            v_evidence_count,
            0,
            v_now,
            v_now
        )
        ON CONFLICT (student_id, course_id, concept_id)
        DO UPDATE SET
            elo_score = EXCLUDED.elo_score,
            bkt_mastery_probability = EXCLUDED.bkt_mastery_probability,
            mastery_state = EXCLUDED.mastery_state,
            weakness_flag = EXCLUDED.weakness_flag,
            attempt_count = greatest(app.student_concept_mastery.attempt_count, EXCLUDED.attempt_count),
            last_practiced_at = EXCLUDED.last_practiced_at,
            updated_at = v_now;

        INSERT INTO audit.mastery_events (
            student_id,
            course_id,
            concept_id,
            source_type,
            source_id,
            elo_before,
            elo_after,
            elo_delta,
            bkt_before,
            bkt_after,
            bkt_delta,
            state_before,
            state_after,
            parameters_snapshot
        )
        VALUES (
            v_student_id,
            v_concept.course_id,
            v_concept.id,
            'diagnostic'::audit.mastery_source_type,
            v_profile_id,
            v_elo_before,
            v_elo,
            round(v_elo - v_elo_before, 2),
            v_bkt_before,
            v_bkt,
            round(v_bkt - v_bkt_before, 4),
            v_state_before,
            v_state,
            jsonb_build_object(
                'profile_version', v_profile_version,
                'onboarding_concept_id', v_seed->>'concept_id',
                'evidence_count', v_evidence_count
            )
        );
    END LOOP;

    RETURN jsonb_build_object('profile_id', v_profile_id, 'seeded_total', jsonb_array_length(coalesce(v_summary->'seeded_concepts', '[]'::jsonb)));
END;
$$;

REVOKE EXECUTE ON FUNCTION app.complete_onboarding_diagnostic(jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION app.complete_onboarding_diagnostic(jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION app.complete_onboarding_diagnostic(jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION app.complete_onboarding_diagnostic(jsonb) TO service_role;

COMMIT;
