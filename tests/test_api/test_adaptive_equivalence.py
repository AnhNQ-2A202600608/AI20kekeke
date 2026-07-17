from uuid import uuid4

import pytest

from src.api.adaptive_routes import get_adaptive_db
from src.services.adaptive.bkt import BKTParameters, calculate_bkt_update, determine_mastery_state
from src.services.adaptive.elo import calculate_expected_success
from src.services.supabase_config import classify_supabase_key


def run_sql_elo_bkt_emulator(
    student_elo: float,
    question_elo: float,
    actual_score: float,
    hint_count: int,
    used_ai_help: bool,
    bkt_prob: float,
    attempt_count: int,
    stability_days: float,
    response_time_ms: int | None = None,
    avg_response_time_ms: float = 30000.0,
    k_question: float = 32.0,
) -> dict:
    """
    Giả lập logic tính toán Elo và BKT của hàm SQL submit_attempt_v3 trên cơ sở dữ liệu.
    """
    # 1. Tính Elo expected
    exponent = (question_elo - student_elo) / 400.0
    exponent = min(20.0, max(-20.0, exponent))
    expected = 1.0 / (1.0 + 10.0**exponent)

    sd = actual_score - expected
    qd = expected - actual_score

    # Hint discount
    if sd > 0 and hint_count > 0:
        disc = max(0.1, 1.0 - 0.3 * hint_count)
        sd *= disc
        qd *= disc

    # K student
    if used_ai_help:
        k_student = 0.0
    else:
        k_student = max(16.0, 48.0 / (1.0 + attempt_count / 10.0))

    # K question dynamic
    k_q_dynamic = max(8.0, 32.0 / (1.0 + attempt_count / 20.0))

    # Speed factor
    if not used_ai_help and response_time_ms is not None and actual_score >= 0.75:
        clamped_time = max(300.0, min(3600000.0, float(response_time_ms)))
        if avg_response_time_ms > 0:
            speed_ratio = clamped_time / avg_response_time_ms
            speed_factor = max(0.8, min(1.2, 1.0 + 0.2 * (1.0 - speed_ratio)))
            sd *= speed_factor
            qd *= speed_factor

    # Cập nhật Elo
    if used_ai_help:
        new_question_elo = round(question_elo + k_question * qd, 2)
    else:
        new_question_elo = round(question_elo + k_q_dynamic * qd, 2)

    new_student_elo = round(student_elo + k_student * sd, 2)
    is_correct = actual_score >= 0.75

    # 2. Tính BKT (Đồng bộ tham số 0.06 và nhị phân)
    if used_ai_help:
        new_bkt = bkt_prob
    else:
        transition_learn = 0.06
        guess = 0.20
        slip = 0.10

        if is_correct:
            numerator = bkt_prob * (1.0 - slip)
            denominator = numerator + (1.0 - bkt_prob) * guess
        else:
            numerator = bkt_prob * slip
            denominator = numerator + (1.0 - bkt_prob) * (1.0 - guess)

        if denominator == 0:
            posterior = bkt_prob
        else:
            posterior = min(1.0, max(0.0, numerator / denominator))

        new_bkt = posterior + (1.0 - posterior) * transition_learn
        new_bkt = round(min(0.9999, max(0.0001, new_bkt)), 4)

    new_state = "weak" if new_bkt < 0.30 else ("learning" if new_bkt < 0.85 else "mastered")
    weakness_flag = new_bkt < 0.50

    # Stability days cap 36500
    new_stability = min(
        36500.0,
        (stability_days * 2.0)
        if actual_score >= 0.8
        else ((stability_days * 0.5) if actual_score < 0.5 else stability_days),
    )

    return {
        "new_student_elo": new_student_elo,
        "new_question_elo": new_question_elo,
        "is_correct": is_correct,
        "new_bkt": new_bkt,
        "new_state": new_state,
        "weakness_flag": weakness_flag,
        "stability_days": new_stability,
    }


def test_python_and_sql_emulator_equivalence():
    """
    Kiểm tra xem hàm giả lập logic SQL RPC có đồng nhất tuyệt đối với code Python service hay không.
    """
    student_elo = 1250.0
    question_elo = 1180.0
    actual_score = 1.0
    hint_count = 1
    used_ai_help = False
    bkt_prob = 0.35
    attempt_count = 5
    stability_days = 4.0
    response_time_ms = 15000

    # 1. Chạy qua giả lập SQL logic
    sql_result = run_sql_elo_bkt_emulator(
        student_elo=student_elo,
        question_elo=question_elo,
        actual_score=actual_score,
        hint_count=hint_count,
        used_ai_help=used_ai_help,
        bkt_prob=bkt_prob,
        attempt_count=attempt_count,
        stability_days=stability_days,
        response_time_ms=response_time_ms,
    )

    # 2. Chạy qua Python Services chính thống
    expected = calculate_expected_success(student_elo, question_elo)
    sd = actual_score - expected
    if sd > 0 and hint_count > 0:
        sd *= max(0.1, 1.0 - 0.3 * hint_count)

    k_student = max(16.0, 48.0 / (1.0 + attempt_count / 10.0))

    # Giả lập speed factor trong python (vì speed factor là một phần mở rộng)
    clamped_time = max(300.0, min(3600000.0, float(response_time_ms)))
    speed_ratio = clamped_time / 30000.0
    speed_factor = max(0.8, min(1.2, 1.0 + 0.2 * (1.0 - speed_ratio)))
    sd *= speed_factor

    py_new_student_elo = round(student_elo + k_student * sd, 2)
    py_new_bkt = calculate_bkt_update(bkt_prob, actual_score, BKTParameters(transition_learn=0.06))

    # 3. Assert đối sánh
    assert sql_result["new_student_elo"] == py_new_student_elo
    assert sql_result["new_bkt"] == py_new_bkt
    assert sql_result["new_state"] == determine_mastery_state(py_new_bkt)


@pytest.mark.asyncio
async def test_real_sql_rpc_equivalence_integration():
    """
    Kiểm thử tích hợp gọi RPC submit_attempt_v3 thật trên database (nếu có kết nối Supabase thật).
    Tự động bỏ qua nếu đang ở chế độ Stub Mode.
    """
    db = get_adaptive_db()
    if db._stub_mode or db.app_client is None:
        pytest.skip("Bỏ qua kiểm thử tích hợp SQL RPC thật ở chế độ Stub Mode")

    # Verify if we have service_role privileges (required to write to courses/concepts/questions tables directly)
    import os

    is_service_role = False
    try:
        key = os.environ.get("SUPABASE_SECRET_KEY") or os.environ.get("SUPABASE_KEY")
        is_service_role = classify_supabase_key(key or "") == "legacy_service_role"
    except Exception:
        pass

    if not is_service_role:
        pytest.skip("Skipping database write integration test as it requires service_role key to bypass RLS policies.")

    # Sinh các ID ngẫu nhiên cho test case
    student_id = uuid4()
    course_id = uuid4()
    concept_id = uuid4()
    question_id = uuid4()
    decision_id = uuid4()
    policy_id = uuid4()

    # Tạo các mock data thật trên database để chuẩn bị test
    # (Bài test này giả định môi trường test đã chạy migrate đầy đủ schema và RPC)
    try:
        # 0. Tạo student (user)
        db.app_client.table("users").insert(
            {
                "id": str(student_id),
                "email": f"test-eq-{student_id.hex[:6]}@example.com",
                "full_name": "Equivalence Test Student",
            }
        ).execute()

        # 0b. Tạo course
        db.app_client.table("courses").insert(
            {
                "id": str(course_id),
                "code": f"test-eq-{course_id.hex[:6]}",
                "title": "Equivalence Test Course",
            }
        ).execute()

        # 1. Tạo concept
        db.app_client.table("concepts").insert(
            {
                "id": str(concept_id),
                "course_id": str(course_id),
                "code": f"test-eq-{concept_id.hex[:6]}",
                "name": "Equivalence Test Concept",
            }
        ).execute()

        # 2. Tạo question
        db.app_client.table("questions").insert(
            {
                "id": str(question_id),
                "course_id": str(course_id),
                "concept_id": str(concept_id),
                "type": "mcq",
                "prompt": "Equivalence MCQ Test Prompt",
                "answer_key": {"options": {"A": "A"}, "correct": "A"},
                "difficulty_elo": 1200.0,
                "calibration_status": "published",
            }
        ).execute()

        # 3. Tạo policy và decision
        db.audit_client.table("adaptive_policies").insert(
            {
                "id": str(policy_id),
                "name": "zpd_selector",
                "version": f"v-{policy_id.hex[:6]}",
                "status": "active",
                "course_id": str(course_id),
            }
        ).execute()

        db.audit_client.table("adaptive_decisions").insert(
            {
                "id": str(decision_id),
                "policy_id": str(policy_id),
                "student_id": str(student_id),
                "course_id": str(course_id),
                "concept_id": str(concept_id),
                "selected_action_id": str(question_id),
                "expected_success": 0.5,
                "context_snapshot": [1.0, 0.25, 0.5],
                "model_snapshot": {},
            }
        ).execute()

        # 4. Thực thi gọi RPC
        payload = {
            "p_decision_id": str(decision_id),
            "p_student_id": str(student_id),
            "p_course_id": str(course_id),
            "p_concept_id": str(concept_id),
            "p_question_id": str(question_id),
            "p_student_answer": {"selected_option": "A"},
            "p_actual_score": 1.0,
            "p_hint_count": 0,
            "p_used_ai_help": False,
            "p_context": [1.0, 0.25, 0.5],
            "p_reward": 1.0,
            "p_k_question": 32.0,
            "p_response_time_ms": 30000,
        }

        rpc_result = db.submit_attempt_v3(payload)

        # 5. Chạy tính toán song song bằng Python
        expected_py = run_sql_elo_bkt_emulator(
            student_elo=1200.0,
            question_elo=1200.0,
            actual_score=1.0,
            hint_count=0,
            used_ai_help=False,
            bkt_prob=0.25,
            attempt_count=0,
            stability_days=3.0,
            response_time_ms=30000,
        )

        # 6. Xác minh khớp 100%
        assert float(rpc_result["new_student_elo"]) == float(expected_py["new_student_elo"])
        assert float(rpc_result["new_bkt"]) == float(expected_py["new_bkt"])
        assert rpc_result["new_state"] == expected_py["new_state"]

    finally:
        # Dọn dẹp dữ liệu test
        try:
            db.audit_client.table("adaptive_decisions").delete().eq("id", str(decision_id)).execute()
            db.audit_client.table("adaptive_policies").delete().eq("id", str(policy_id)).execute()
            db.app_client.table("questions").delete().eq("id", str(question_id)).execute()
            db.app_client.table("concepts").delete().eq("id", str(concept_id)).execute()
            db.app_client.table("student_concept_mastery").delete().eq("student_id", str(student_id)).execute()
            db.app_client.table("courses").delete().eq("id", str(course_id)).execute()
            db.app_client.table("users").delete().eq("id", str(student_id)).execute()
        except Exception:
            pass
