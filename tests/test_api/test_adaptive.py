from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from src.api.adaptive_routes import get_adaptive_db
from src.main import app
from src.services.adaptive.bandit import LinUCB, build_student_context, calculate_bandit_reward
from src.services.adaptive.bkt import (
    BKTParameters,
    calculate_bkt_posterior,
    calculate_bkt_update,
    determine_mastery_state,
)
from src.services.adaptive.elo import calculate_elo_updates, calculate_expected_success


def test_elo_calculations():
    # 1. Equal Elo -> 50% probability
    assert calculate_expected_success(1200.0, 1200.0) == 0.5

    # 2. Student has higher Elo -> probability > 50%
    assert calculate_expected_success(1400.0, 1200.0) > 0.5

    # 3. Student has lower Elo -> probability < 50%
    assert calculate_expected_success(1000.0, 1200.0) < 0.5

    # 4. Standard Elo updates (Correct answer)
    new_student, new_question = calculate_elo_updates(1200.0, 1200.0, 1.0, hint_count=0)
    assert new_student > 1200.0
    assert new_question < 1200.0

    # 5. Hint discount updates
    new_student_no_hint, _ = calculate_elo_updates(1200.0, 1200.0, 1.0, hint_count=0)
    new_student_with_hint, _ = calculate_elo_updates(1200.0, 1200.0, 1.0, hint_count=1)

    gain_no_hint = new_student_no_hint - 1200.0
    gain_with_hint = new_student_with_hint - 1200.0
    assert gain_with_hint < gain_no_hint


def test_bkt_calculations():
    params = BKTParameters(prior_learned=0.25, transition_learn=0.06, guess=0.20, slip=0.10)

    # 1. Correct answer increases mastery probability
    post_correct = calculate_bkt_posterior(0.25, True, params)
    assert post_correct > 0.25

    # 2. Incorrect answer decreases mastery probability
    post_incorrect = calculate_bkt_posterior(0.25, False, params)
    assert post_incorrect < 0.25

    # 3. Standard updates
    updated_correct = calculate_bkt_update(0.25, 1.0, params)
    assert updated_correct > 0.25

    # 4. Mastery trap capping at 0.9999
    capped = calculate_bkt_update(0.9999, 1.0, params)
    assert capped == 0.9999

    # 5. Mastery should degrade from cap if student fails
    degraded = calculate_bkt_update(capped, 0.0, params)
    assert degraded < capped

    # 6. State mapping
    assert determine_mastery_state(0.15) == "weak"
    assert determine_mastery_state(0.50) == "learning"
    assert determine_mastery_state(0.86) == "mastered"

    # 7. Binary threshold score updates
    updated_boundary_correct = calculate_bkt_update(0.25, 0.75, params)
    updated_boundary_incorrect = calculate_bkt_update(0.25, 0.74, params)
    assert updated_boundary_correct == calculate_bkt_update(0.25, 1.0, params)
    assert updated_boundary_incorrect == calculate_bkt_update(0.25, 0.0, params)


def test_linucb_bandit():
    bandit = LinUCB(context_dim=3, alpha=1.0)

    context = [1.0, 0.5, 0.3]
    arms_states = {
        "q1": bandit.get_default_arm_state(),
        "q2": bandit.get_default_arm_state(),
    }

    # Make q2 have higher b vector -> higher UCB score
    arms_states["q2"]["b"] = [2.0, 1.0, 1.0]

    selected_id, expected_reward = bandit.select_arm(
        context_vector=context, arms_states=arms_states, candidate_arm_ids=["q1", "q2"]
    )

    assert selected_id == "q2"
    assert expected_reward > 0.0

    # Sigmoid context normalization checks
    X = build_student_context(0.50, 1200.0)
    assert len(X) == 3
    assert X[0] == 1.0
    assert X[1] == 0.50
    assert 0.0 < X[2] < 1.0

    # ZPD Reward checks
    # Maximum reward when expectation is 0.75 and actual_score is 1.0
    assert calculate_bandit_reward(0.75, 1.0) == 1.0
    # Reward is 0.0 if actual_score is 0.0
    assert calculate_bandit_reward(0.75, 0.0) == 0.0


@pytest.fixture
def mock_db():
    mock = MagicMock()
    mock.begin = MagicMock()
    mock.commit = MagicMock()
    mock.rollback = MagicMock()
    return mock


@pytest.mark.asyncio
async def test_recommend_endpoint(mock_db, client):
    # Setup mocks
    student_id = uuid4()
    course_id = uuid4()
    concept_id = uuid4()
    q_id = uuid4()
    policy_id = uuid4()

    mock_db.get_student_mastery.return_value = {
        "elo_score": 1200.0,
        "bkt_mastery_probability": 0.25,
        "mastery_state": "weak",
        "weakness_flag": True,
        "attempt_count": 0,
        "correct_count": 0,
    }

    mock_db.get_candidate_questions_meta.return_value = [{"id": q_id, "difficulty_elo": 1200.0}]

    mock_db.get_bandit_policy_state.return_value = (policy_id, {"arms_states": {}})
    mock_db.get_bandit_arms.return_value = {}

    mock_db.get_question_by_id.return_value = {
        "id": q_id,
        "type": "mcq",
        "prompt": "Test Prompt",
        "answer_key": {"options": {"A": "Choice A"}},
        "difficulty_elo": 1200.0,
    }

    mock_db.log_adaptive_decision.return_value = uuid4()

    # Register mock database dependency override
    app.dependency_overrides[get_adaptive_db] = lambda: mock_db

    try:
        response = await client.post(
            "/api/v1/adaptive/recommend",
            json={"student_id": str(student_id), "course_id": str(course_id), "concept_id": str(concept_id)},
            headers={"Authorization": f"Bearer {student_id}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["question_id"] == str(q_id)
        assert data["prompt"] == "Test Prompt"
        assert "expected_success" in data
        assert data["question_difficulty_elo"] == 1200.0
        assert data["candidate_count"] is None
        assert data["concept_elo"] is None
        assert data["bkt_mastery_probability"] is None

        mock_db.begin.assert_called_once()
        mock_db.get_student_mastery.assert_called_once_with(student_id, course_id, concept_id)
        mock_db.get_candidate_questions_meta.assert_called_once_with(course_id, concept_id)
        mock_db.get_bandit_policy_state.assert_called_once_with(course_id)
        mock_db.get_bandit_arms.assert_called_once_with(policy_id, [str(q_id)])
        mock_db.upsert_bandit_arm.assert_called_once_with(
            policy_id=policy_id,
            arm_id=str(q_id),
            a_inv=[[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]],
            b=[0.0, 0.0, 0.0],
        )
        mock_db.log_adaptive_decision.assert_called_once()
        mock_db.commit.assert_called_once()

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_recommend_endpoint_returns_diagnostics_for_admin(mock_db, client):
    student_id = uuid4()
    admin_id = "77777777-7777-7777-7777-777777777777"
    course_id = uuid4()
    concept_id = uuid4()
    q_id = uuid4()
    policy_id = uuid4()

    mock_db.get_student_mastery.return_value = {
        "elo_score": 1234.0,
        "bkt_mastery_probability": 0.41,
        "mastery_state": "learning",
        "weakness_flag": False,
        "attempt_count": 3,
        "correct_count": 2,
    }
    mock_db.get_candidate_questions_meta.return_value = [{"id": q_id, "difficulty_elo": 1275.0}]
    mock_db.get_bandit_policy_state.return_value = (policy_id, {"alpha": 1.0})
    mock_db.get_bandit_arms.return_value = {}
    mock_db.get_question_by_id.return_value = {
        "id": q_id,
        "type": "mcq",
        "prompt": "Admin Prompt",
        "answer_key": {"options": {"A": "Choice A"}, "correct": "A"},
        "difficulty_elo": 1275.0,
    }
    mock_db.log_adaptive_decision.return_value = uuid4()
    app.dependency_overrides[get_adaptive_db] = lambda: mock_db

    try:
        response = await client.post(
            "/api/v1/adaptive/recommend",
            json={"student_id": str(student_id), "course_id": str(course_id), "concept_id": str(concept_id)},
            headers={"Authorization": f"Bearer {admin_id}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["question_difficulty_elo"] == 1275.0
        assert data["candidate_count"] == 1
        assert data["concept_elo"] == 1234.0
        assert data["bkt_mastery_probability"] == 0.41
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_recommend_endpoint_bulk_loads_bandit_arms(mock_db, client):
    student_id = uuid4()
    course_id = uuid4()
    concept_id = uuid4()
    q1_id = uuid4()
    q2_id = uuid4()
    q3_id = uuid4()
    policy_id = uuid4()

    mock_db.get_student_mastery.return_value = {
        "elo_score": 1200.0,
        "bkt_mastery_probability": 0.25,
        "mastery_state": "weak",
        "weakness_flag": True,
        "attempt_count": 0,
        "correct_count": 0,
    }
    mock_db.get_candidate_questions_meta.return_value = [
        {"id": q1_id, "difficulty_elo": 1200.0},
        {"id": q2_id, "difficulty_elo": 1200.0},
        {"id": q3_id, "difficulty_elo": 1200.0},
    ]
    mock_db.get_bandit_policy_state.return_value = (policy_id, {"alpha": 1.0})
    mock_db.get_bandit_arms.return_value = {
        str(q2_id): {
            "a_inv": [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]],
            "b": [5.0, 0.0, 0.0],
        }
    }
    mock_db.get_question_by_id.return_value = {
        "id": q2_id,
        "type": "mcq",
        "prompt": "Selected Prompt",
        "answer_key": {"options": {"A": "Choice A"}},
        "difficulty_elo": 1200.0,
    }
    mock_db.log_adaptive_decision.return_value = uuid4()

    app.dependency_overrides[get_adaptive_db] = lambda: mock_db

    try:
        response = await client.post(
            "/api/v1/adaptive/recommend",
            json={"student_id": str(student_id), "course_id": str(course_id), "concept_id": str(concept_id)},
            headers={"Authorization": f"Bearer {student_id}"},
        )

        assert response.status_code == 200
        assert response.json()["question_id"] == str(q2_id)
        mock_db.get_bandit_arms.assert_called_once_with(policy_id, [str(q1_id), str(q2_id), str(q3_id)])
        mock_db.get_bandit_arm.assert_not_called()
        assert mock_db.upsert_bandit_arm.call_count == 2
        upsert_calls = {
            call.kwargs["arm_id"]: tuple(tuple(row) for row in call.kwargs["a_inv"])
            for call in mock_db.upsert_bandit_arm.call_args_list
        }
        expected_default_a_inv = ((1.0, 0.0, 0.0), (0.0, 1.0, 0.0), (0.0, 0.0, 1.0))
        assert upsert_calls[str(q1_id)] == expected_default_a_inv
        assert upsert_calls[str(q3_id)] == expected_default_a_inv
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_recommend_endpoint_prefers_zpd_candidate_when_bandit_arms_tie(mock_db, client):
    student_id = uuid4()
    course_id = uuid4()
    concept_id = uuid4()
    easy_q_id = uuid4()
    zpd_q_id = uuid4()
    policy_id = uuid4()

    mock_db.get_student_mastery.return_value = {
        "elo_score": 1500.0,
        "bkt_mastery_probability": 0.25,
        "mastery_state": "learning",
        "weakness_flag": False,
        "attempt_count": 0,
        "correct_count": 0,
    }
    mock_db.get_candidate_questions_meta.return_value = [
        {"id": easy_q_id, "difficulty_elo": 900.0},
        {"id": zpd_q_id, "difficulty_elo": 1300.0},
    ]
    mock_db.get_bandit_policy_state.return_value = (policy_id, {"alpha": 1.0})
    mock_db.get_bandit_arms.return_value = {}
    mock_db.get_question_by_id.return_value = {
        "id": zpd_q_id,
        "type": "mcq",
        "prompt": "ZPD question",
        "answer_key": {"options": {"A": "Choice A"}, "correct": "A"},
        "difficulty_elo": 1300.0,
    }
    mock_db.log_adaptive_decision.return_value = uuid4()

    app.dependency_overrides[get_adaptive_db] = lambda: mock_db

    try:
        response = await client.post(
            "/api/v1/adaptive/recommend",
            json={"student_id": str(student_id), "course_id": str(course_id), "concept_id": str(concept_id)},
            headers={"Authorization": f"Bearer {student_id}"},
        )

        assert response.status_code == 200
        assert response.json()["question_id"] == str(zpd_q_id)
        mock_db.get_bandit_arms.assert_called_once_with(policy_id, [str(zpd_q_id), str(easy_q_id)])
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_recommend_endpoint_bandit_store_failure_is_503(mock_db, client):
    student_id = uuid4()
    course_id = uuid4()
    concept_id = uuid4()
    q_id = uuid4()
    policy_id = uuid4()

    mock_db.get_student_mastery.return_value = {
        "elo_score": 1200.0,
        "bkt_mastery_probability": 0.25,
        "mastery_state": "weak",
        "weakness_flag": True,
        "attempt_count": 0,
        "correct_count": 0,
    }
    mock_db.get_candidate_questions_meta.return_value = [{"id": q_id, "difficulty_elo": 1200.0}]
    mock_db.get_bandit_policy_state.return_value = (policy_id, {"alpha": 1.0})
    mock_db.get_bandit_arms.side_effect = RuntimeError("Unable to fetch bandit arm states.")

    app.dependency_overrides[get_adaptive_db] = lambda: mock_db

    try:
        response = await client.post(
            "/api/v1/adaptive/recommend",
            json={"student_id": str(student_id), "course_id": str(course_id), "concept_id": str(concept_id)},
            headers={"Authorization": f"Bearer {student_id}"},
        )

        assert response.status_code == 503
        assert response.json()["detail"] == "Kho dữ liệu adaptive hiện không sẵn sàng."
        mock_db.upsert_bandit_arm.assert_not_called()
        mock_db.log_adaptive_decision.assert_not_called()
        mock_db.rollback.assert_called_once()
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_recommend_endpoint_tolerates_non_dict_answer_key(mock_db, client):
    student_id = uuid4()
    course_id = uuid4()
    concept_id = uuid4()
    q_id = uuid4()
    policy_id = uuid4()

    mock_db.get_student_mastery.return_value = {
        "elo_score": 1200.0,
        "bkt_mastery_probability": 0.25,
        "mastery_state": "weak",
        "weakness_flag": True,
        "attempt_count": 0,
        "correct_count": 0,
    }
    mock_db.get_candidate_questions_meta.return_value = [{"id": q_id, "difficulty_elo": 1200.0}]
    mock_db.get_bandit_policy_state.return_value = (policy_id, {"alpha": 1.0})
    mock_db.get_bandit_arms.return_value = {}
    mock_db.get_question_by_id.return_value = {
        "id": q_id,
        "type": "mcq",
        "prompt": "Question with legacy answer key",
        "answer_key": {"options": ["A", "B"], "correct": 1, "explanation": None},
        "difficulty_elo": 1200.0,
    }
    mock_db.log_adaptive_decision.return_value = uuid4()

    app.dependency_overrides[get_adaptive_db] = lambda: mock_db

    try:
        response = await client.post(
            "/api/v1/adaptive/recommend",
            json={"student_id": str(student_id), "course_id": str(course_id), "concept_id": str(concept_id)},
            headers={"Authorization": f"Bearer {student_id}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["options"] == {}
        assert data["answer"] is None
        assert data["explanation"] is None
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_recommend_endpoint_excludes_questions_already_in_session(mock_db, client):
    student_id = uuid4()
    course_id = uuid4()
    concept_id = uuid4()
    excluded_q_id = uuid4()
    next_q_id = uuid4()
    policy_id = uuid4()

    mock_db.get_student_mastery.return_value = {
        "elo_score": 1200.0,
        "bkt_mastery_probability": 0.25,
        "mastery_state": "weak",
        "weakness_flag": True,
        "attempt_count": 0,
        "correct_count": 0,
    }
    mock_db.get_candidate_questions_meta.return_value = [
        {"id": excluded_q_id, "difficulty_elo": 1200.0},
        {"id": next_q_id, "difficulty_elo": 1200.0},
    ]
    mock_db.get_bandit_policy_state.return_value = (policy_id, {"alpha": 1.0})
    mock_db.get_bandit_arms.return_value = {}
    mock_db.get_question_by_id.return_value = {
        "id": next_q_id,
        "type": "mcq",
        "prompt": "Next question",
        "answer_key": {"options": {"A": "Choice A"}, "correct": "A"},
        "difficulty_elo": 1200.0,
    }
    mock_db.log_adaptive_decision.return_value = uuid4()

    app.dependency_overrides[get_adaptive_db] = lambda: mock_db

    try:
        response = await client.post(
            "/api/v1/adaptive/recommend",
            json={
                "student_id": str(student_id),
                "course_id": str(course_id),
                "concept_id": str(concept_id),
                "excluded_question_ids": [str(excluded_q_id)],
            },
            headers={"Authorization": f"Bearer {student_id}"},
        )

        assert response.status_code == 200
        assert response.json()["question_id"] == str(next_q_id)
        mock_db.get_bandit_arms.assert_called_once_with(policy_id, [str(next_q_id)])
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_submit_endpoint(mock_db, client):
    student_id = uuid4()
    course_id = uuid4()
    concept_id = uuid4()
    question_id = uuid4()
    decision_id = uuid4()
    policy_id = uuid4()

    # Setup mocks
    mock_db.get_adaptive_decision.return_value = {
        "policy_id": policy_id,
        "student_id": student_id,
        "course_id": course_id,
        "concept_id": concept_id,
        "selected_action_id": question_id,
        "expected_success": 0.75,
        "context_snapshot": [1.0, 0.25, 0.25],
        "model_snapshot": {"A_inv": [[1.0]], "b": [0.0]},
        "consumed_at": None,
    }

    mock_db.get_student_mastery.return_value = {
        "elo_score": 1200.0,
        "bkt_mastery_probability": 0.25,
        "mastery_state": "weak",
        "weakness_flag": True,
        "attempt_count": 0,
        "correct_count": 0,
    }

    mock_db.get_question_by_id.return_value = {
        "id": question_id,
        "type": "mcq",
        "prompt": "Test Prompt",
        "answer_key": {"options": {"A": "Choice A"}, "correct": "A"},
        "difficulty_elo": 1200.0,
    }

    mock_db.submit_attempt_v3.return_value = {
        "new_student_elo": 1216.0,
        "new_question_elo": 1184.0,
        "expected_success": 0.75,
        "is_correct": True,
        "new_bkt": 0.28,
        "new_state": "learning",
        "weakness_flag": True,
    }
    mock_db.get_bandit_policy_state.return_value = (policy_id, {"alpha": 1.0})
    mock_db.get_bandit_arm.return_value = None

    # Mocking select attempt response data
    mock_response = MagicMock()
    mock_response.data = [{"id": str(uuid4())}]
    mock_db.app_client.table().select().eq().execute.return_value = mock_response

    # Register mock database dependency override
    app.dependency_overrides[get_adaptive_db] = lambda: mock_db

    try:
        response = await client.post(
            "/api/v1/adaptive/submit",
            json={
                "student_id": str(student_id),
                "course_id": str(course_id),
                "concept_id": str(concept_id),
                "question_id": str(question_id),
                "decision_id": str(decision_id),
                "student_answer": {"selected_option": "A"},
                "hint_count": 0,
                "used_ai_help": False,
            },
            headers={"Authorization": f"Bearer {student_id}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["is_correct"] is True
        assert data["new_elo"] == 1216.0
        assert data["new_bkt"] == 0.28

        mock_db.begin.assert_called_once()
        mock_db.get_adaptive_decision.assert_called_once_with(decision_id)
        mock_db.get_student_mastery.assert_called_once_with(student_id, course_id, concept_id)
        mock_db.submit_attempt_v3.assert_called_once()
        mock_db.commit.assert_called_once()

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_log_hint_usage_endpoint_records_valid_decision(mock_db, client):
    student_id = uuid4()
    course_id = uuid4()
    concept_id = uuid4()
    question_id = uuid4()
    decision_id = uuid4()
    hint_id = uuid4()

    mock_db._stub_mode = False
    mock_db.app_client = object()
    mock_db.get_adaptive_decision.return_value = {
        "student_id": student_id,
        "course_id": course_id,
        "concept_id": concept_id,
        "selected_action_id": question_id,
        "consumed_at": None,
    }
    mock_db.log_hint_usage.return_value = hint_id

    app.dependency_overrides[get_adaptive_db] = lambda: mock_db

    try:
        response = await client.post(
            "/api/v1/adaptive/hints/log",
            json={
                "student_id": str(student_id),
                "course_id": str(course_id),
                "question_id": str(question_id),
                "decision_id": str(decision_id),
                "hint_level": 3,
            },
            headers={"Authorization": f"Bearer {student_id}"},
        )

        assert response.status_code == 200
        assert response.json() == {"id": str(hint_id)}
        mock_db.get_adaptive_decision.assert_called_once_with(decision_id)
        mock_db.log_hint_usage.assert_called_once_with(student_id, course_id, question_id, decision_id, 3)
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_submit_endpoint_uses_server_hint_count_for_elo_discount(mock_db, client):
    student_id = uuid4()
    course_id = uuid4()
    concept_id = uuid4()
    question_id = uuid4()
    decision_id = uuid4()
    policy_id = uuid4()

    mock_db._stub_mode = False
    mock_db.app_client = object()
    mock_db.get_adaptive_decision.return_value = {
        "policy_id": policy_id,
        "student_id": student_id,
        "course_id": course_id,
        "concept_id": concept_id,
        "selected_action_id": question_id,
        "expected_success": 0.75,
        "context_snapshot": [1.0, 0.25, 0.25],
        "model_snapshot": {"A_inv": [[1.0]], "b": [0.0]},
        "consumed_at": None,
    }
    mock_db.get_student_mastery.return_value = {
        "elo_score": 1200.0,
        "bkt_mastery_probability": 0.25,
        "mastery_state": "weak",
        "weakness_flag": True,
        "attempt_count": 0,
        "correct_count": 0,
    }
    mock_db.get_question_by_id.return_value = {
        "id": question_id,
        "type": "mcq",
        "prompt": "Test Prompt",
        "answer_key": {"options": {"A": "Choice A"}, "correct": "A"},
        "difficulty_elo": 1200.0,
    }
    mock_db.count_hints.return_value = 3
    mock_db.submit_attempt_v3.return_value = {
        "new_student_elo": 1200.8,
        "new_question_elo": 1184.0,
        "expected_success": 0.75,
        "is_correct": True,
        "new_bkt": 0.28,
        "new_state": "learning",
        "weakness_flag": True,
    }
    mock_db.get_bandit_policy_state.return_value = (policy_id, {"alpha": 1.0})
    mock_db.get_bandit_arm.return_value = None

    app.dependency_overrides[get_adaptive_db] = lambda: mock_db

    try:
        response = await client.post(
            "/api/v1/adaptive/submit",
            json={
                "student_id": str(student_id),
                "course_id": str(course_id),
                "concept_id": str(concept_id),
                "question_id": str(question_id),
                "decision_id": str(decision_id),
                "student_answer": {"selected_option": "A"},
                "hint_count": 0,
                "used_ai_help": False,
            },
            headers={"Authorization": f"Bearer {student_id}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["calculation_log"]["hint_count"] == 3
        assert data["calculation_log"]["hint_discount"] == 0.1
        payload = mock_db.submit_attempt_v3.call_args.args[0]
        assert payload["p_hint_count"] == 3
        mock_db.count_hints.assert_called_once_with(decision_id)
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_submit_endpoint_empty_transaction_result_is_503(mock_db, client):
    student_id = uuid4()
    course_id = uuid4()
    concept_id = uuid4()
    question_id = uuid4()
    decision_id = uuid4()
    policy_id = uuid4()

    mock_db.get_adaptive_decision.return_value = {
        "policy_id": policy_id,
        "student_id": student_id,
        "course_id": course_id,
        "concept_id": concept_id,
        "selected_action_id": question_id,
        "expected_success": 0.75,
        "context_snapshot": [1.0, 0.25, 0.25],
        "model_snapshot": {"A_inv": [[1.0]], "b": [0.0]},
        "consumed_at": None,
    }
    mock_db.get_student_mastery.return_value = {
        "elo_score": 1200.0,
        "bkt_mastery_probability": 0.25,
        "mastery_state": "weak",
        "weakness_flag": True,
        "attempt_count": 0,
        "correct_count": 0,
    }
    mock_db.get_question_by_id.return_value = {
        "id": question_id,
        "type": "mcq",
        "prompt": "Test Prompt",
        "answer_key": {"options": {"A": "Choice A"}, "correct": "A"},
        "difficulty_elo": 1200.0,
    }
    mock_db.submit_attempt_v3.return_value = {}

    app.dependency_overrides[get_adaptive_db] = lambda: mock_db

    try:
        response = await client.post(
            "/api/v1/adaptive/submit",
            json={
                "student_id": str(student_id),
                "course_id": str(course_id),
                "concept_id": str(concept_id),
                "question_id": str(question_id),
                "decision_id": str(decision_id),
                "student_answer": {"selected_option": "A"},
                "hint_count": 0,
                "used_ai_help": False,
            },
            headers={"Authorization": f"Bearer {student_id}"},
        )

        assert response.status_code == 503
        assert response.json()["detail"] == "Kho dữ liệu adaptive hiện không sẵn sàng."
        mock_db.rollback.assert_called_once()
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_submit_endpoint_replay_attack(mock_db, client):
    student_id = uuid4()
    course_id = uuid4()
    concept_id = uuid4()
    question_id = uuid4()
    decision_id = uuid4()

    mock_db.get_adaptive_decision.return_value = {
        "policy_id": uuid4(),
        "student_id": student_id,
        "course_id": course_id,
        "concept_id": concept_id,
        "selected_action_id": question_id,
        "expected_success": 0.75,
        "context_snapshot": [1.0, 0.25, 0.25],
        "consumed_at": "2026-06-12T00:00:00Z",  # Gợi ý đã tiêu thụ trước đó
    }

    app.dependency_overrides[get_adaptive_db] = lambda: mock_db

    try:
        response = await client.post(
            "/api/v1/adaptive/submit",
            json={
                "student_id": str(student_id),
                "course_id": str(course_id),
                "concept_id": str(concept_id),
                "question_id": str(question_id),
                "decision_id": str(decision_id),
                "student_answer": {"selected_option": "A"},
            },
            headers={"Authorization": f"Bearer {student_id}"},
        )
        assert response.status_code == 409
        assert "đã được nộp trước đó" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_submit_endpoint_rpc_permission_error_is_configuration_error(mock_db, client):
    student_id = uuid4()
    course_id = uuid4()
    concept_id = uuid4()
    question_id = uuid4()
    decision_id = uuid4()

    mock_db.get_adaptive_decision.return_value = {
        "policy_id": uuid4(),
        "student_id": student_id,
        "course_id": course_id,
        "concept_id": concept_id,
        "selected_action_id": question_id,
        "expected_success": 0.75,
        "context_snapshot": [1.0, 0.25, 0.25],
        "consumed_at": None,
    }
    mock_db.get_student_mastery.return_value = {
        "elo_score": 1200.0,
        "bkt_mastery_probability": 0.25,
        "mastery_state": "weak",
        "weakness_flag": True,
        "attempt_count": 0,
        "correct_count": 0,
    }
    mock_db.get_question_by_id.return_value = {
        "id": question_id,
        "type": "mcq",
        "prompt": "Test Prompt",
        "answer_key": {"options": {"A": "Choice A"}, "correct": "A"},
        "difficulty_elo": 1200.0,
    }
    mock_db.submit_attempt_v3.side_effect = RuntimeError(
        "{'message': 'permission denied for function submit_attempt_v3', 'code': '42501'}"
    )

    app.dependency_overrides[get_adaptive_db] = lambda: mock_db

    try:
        response = await client.post(
            "/api/v1/adaptive/submit",
            json={
                "student_id": str(student_id),
                "course_id": str(course_id),
                "concept_id": str(concept_id),
                "question_id": str(question_id),
                "decision_id": str(decision_id),
                "student_answer": {"selected_option": "A"},
            },
            headers={"Authorization": f"Bearer {student_id}"},
        )
        assert response.status_code == 503
        assert "SUPABASE_SECRET_KEY" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_submit_endpoint_signal_store_failure_is_503(mock_db, client):
    student_id = uuid4()
    course_id = uuid4()
    concept_id = uuid4()
    question_id = uuid4()
    decision_id = uuid4()

    mock_db._stub_mode = False
    mock_db.get_adaptive_decision.return_value = {
        "policy_id": uuid4(),
        "student_id": student_id,
        "course_id": course_id,
        "concept_id": concept_id,
        "selected_action_id": question_id,
        "expected_success": 0.75,
        "context_snapshot": [1.0, 0.25, 0.25],
        "consumed_at": None,
    }
    mock_db.get_student_mastery.return_value = {
        "elo_score": 1200.0,
        "bkt_mastery_probability": 0.25,
        "mastery_state": "weak",
        "weakness_flag": True,
        "attempt_count": 0,
        "correct_count": 0,
    }
    mock_db.get_question_by_id.return_value = {
        "id": question_id,
        "type": "mcq",
        "prompt": "Test Prompt",
        "answer_key": {"options": {"A": "Choice A"}, "correct": "A"},
        "difficulty_elo": 1200.0,
    }
    mock_db.count_hints.side_effect = RuntimeError("Unable to count adaptive hints.")

    app.dependency_overrides[get_adaptive_db] = lambda: mock_db

    try:
        response = await client.post(
            "/api/v1/adaptive/submit",
            json={
                "student_id": str(student_id),
                "course_id": str(course_id),
                "concept_id": str(concept_id),
                "question_id": str(question_id),
                "decision_id": str(decision_id),
                "student_answer": {"selected_option": "A"},
            },
            headers={"Authorization": f"Bearer {student_id}"},
        )

        assert response.status_code == 503
        assert response.json()["detail"] == "Kho dữ liệu adaptive hiện không sẵn sàng."
        mock_db.submit_attempt_v3.assert_not_called()
        mock_db.rollback.assert_called_once()
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_submit_endpoint_wrong_student(mock_db, client):
    student_id = uuid4()
    course_id = uuid4()
    concept_id = uuid4()
    question_id = uuid4()
    decision_id = uuid4()

    mock_db.get_adaptive_decision.return_value = {
        "policy_id": uuid4(),
        "student_id": uuid4(),  # Student khác
        "course_id": course_id,
        "concept_id": concept_id,
        "selected_action_id": question_id,
        "expected_success": 0.75,
        "consumed_at": None,
    }

    app.dependency_overrides[get_adaptive_db] = lambda: mock_db

    try:
        response = await client.post(
            "/api/v1/adaptive/submit",
            json={
                "student_id": str(student_id),
                "course_id": str(course_id),
                "concept_id": str(concept_id),
                "question_id": str(question_id),
                "decision_id": str(decision_id),
                "student_answer": {"selected_option": "A"},
            },
            headers={"Authorization": f"Bearer {student_id}"},
        )
        assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_submit_endpoint_wrong_question(mock_db, client):
    student_id = uuid4()
    course_id = uuid4()
    concept_id = uuid4()
    question_id = uuid4()
    decision_id = uuid4()

    mock_db.get_adaptive_decision.return_value = {
        "policy_id": uuid4(),
        "student_id": student_id,
        "course_id": course_id,
        "concept_id": concept_id,
        "selected_action_id": uuid4(),  # Câu hỏi khác
        "expected_success": 0.75,
        "consumed_at": None,
    }

    app.dependency_overrides[get_adaptive_db] = lambda: mock_db

    try:
        response = await client.post(
            "/api/v1/adaptive/submit",
            json={
                "student_id": str(student_id),
                "course_id": str(course_id),
                "concept_id": str(concept_id),
                "question_id": str(question_id),
                "decision_id": str(decision_id),
                "student_answer": {"selected_option": "A"},
            },
            headers={"Authorization": f"Bearer {student_id}"},
        )
        assert response.status_code == 400
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_submit_endpoint_ignores_ai_help_signal(mock_db, client):
    student_id = uuid4()
    course_id = uuid4()
    concept_id = uuid4()
    question_id = uuid4()
    decision_id = uuid4()
    policy_id = uuid4()

    mock_db.get_adaptive_decision.return_value = {
        "policy_id": policy_id,
        "student_id": student_id,
        "course_id": course_id,
        "concept_id": concept_id,
        "selected_action_id": question_id,
        "expected_success": 0.75,
        "context_snapshot": [1.0, 0.25, 0.25],
        "consumed_at": None,
    }

    mock_db.get_student_mastery.return_value = {
        "elo_score": 1200.0,
        "bkt_mastery_probability": 0.25,
        "mastery_state": "weak",
        "weakness_flag": True,
        "attempt_count": 0,
        "correct_count": 0,
    }

    mock_db.get_question_by_id.return_value = {
        "id": question_id,
        "type": "mcq",
        "prompt": "Test Prompt",
        "answer_key": {"options": {"A": "Choice A"}, "correct": "A"},
        "difficulty_elo": 1200.0,
    }

    mock_db.submit_attempt_v3.return_value = {
        "new_student_elo": 1216.0,
        "new_question_elo": 1184.0,  # question ELO vẫn đổi
        "expected_success": 0.75,
        "is_correct": True,
        "new_bkt": 0.4,
        "new_state": "learning",
        "weakness_flag": False,
    }
    mock_db.get_bandit_policy_state.return_value = (policy_id, {"alpha": 1.0})
    mock_db.get_bandit_arm.return_value = None

    app.dependency_overrides[get_adaptive_db] = lambda: mock_db

    try:
        response = await client.post(
            "/api/v1/adaptive/submit",
            json={
                "student_id": str(student_id),
                "course_id": str(course_id),
                "concept_id": str(concept_id),
                "question_id": str(question_id),
                "decision_id": str(decision_id),
                "student_answer": {"selected_option": "A"},
                "used_ai_help": True,
            },
            headers={"Authorization": f"Bearer {student_id}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["new_elo"] == 1216.0
        assert data["new_bkt"] == 0.4

        # AI-help detection is retired; submit should not trust client flags.
        args, kwargs = mock_db.submit_attempt_v3.call_args
        payload = args[0]
        assert payload["p_used_ai_help"] is False

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_mastery_read_store_failure_returns_503(mock_db, client):
    student_id = uuid4()
    course_id = uuid4()
    mock_db.get_all_student_concept_mastery.side_effect = RuntimeError("mastery store unavailable")

    app.dependency_overrides[get_adaptive_db] = lambda: mock_db
    try:
        response = await client.get(
            f"/api/v1/adaptive/mastery?student_id={student_id}&course_id={course_id}",
            headers={"Authorization": f"Bearer {student_id}"},
        )

        assert response.status_code == 503
        assert response.json()["detail"] == "Không thể tải dữ liệu tiến trình."
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_sync_mastery_store_failure_returns_503(mock_db, client):
    student_id = uuid4()
    course_id = uuid4()
    mock_db.get_concept_id_by_code.return_value = uuid4()
    mock_db.update_student_mastery.side_effect = RuntimeError("mastery write unavailable")

    app.dependency_overrides[get_adaptive_db] = lambda: mock_db
    try:
        response = await client.post(
            "/api/v1/adaptive/sync-mastery",
            json={
                "student_id": str(student_id),
                "course_id": str(course_id),
                "concept_code": "docker-basics",
                "elo_score": 1200.0,
                "bkt_mastery_probability": 0.3,
                "mastery_state": "learning",
                "weakness_flag": False,
                "is_correct": True,
            },
            headers={"Authorization": f"Bearer {student_id}"},
        )

        assert response.status_code == 503
        assert response.json()["detail"] == "Không thể đồng bộ tiến trình học tập."
        mock_db.rollback.assert_called_once()
    finally:
        app.dependency_overrides.clear()


def test_graph_propagation_backward():
    from uuid import uuid4

    from src.services.adaptive.graph_propagation import propagate_mastery

    mock_db = MagicMock()
    student_id = uuid4()
    course_id = uuid4()
    parent_id = uuid4()
    child_id = uuid4()  # target concept
    attempt_id = uuid4()

    # Mock get_concept_relations to return prerequisite
    mock_db.get_concept_relations.return_value = [
        {
            "id": uuid4(),
            "course_id": course_id,
            "source_concept_id": parent_id,
            "target_concept_id": child_id,
            "relation_type": "Prerequisite_of",
            "weight": 1.0,
            "status": "approved",
        }
    ]

    # Mock parent mastery
    mock_db.get_student_mastery.return_value = {
        "elo_score": 1200.0,
        "bkt_mastery_probability": 0.80,
        "mastery_state": "learning",
    }

    # Call propagate_mastery (child decreased from 0.70 to 0.30 -> delta = -0.40)
    propagate_mastery(
        db=mock_db,
        student_id=student_id,
        course_id=course_id,
        concept_id=child_id,
        old_bkt=0.70,
        new_bkt=0.30,
        source_attempt_id=attempt_id,
    )

    # Expected parent BKT: 0.80 - 0.25 * 0.40 * 1.0 = 0.70
    mock_db.update_student_bkt.assert_called_once_with(
        student_id=student_id,
        course_id=course_id,
        concept_id=parent_id,
        bkt_prob=0.70,
        mastery_state="learning",
        weakness_flag=False,
    )
    mock_db.log_mastery_event.assert_called_once()
    assert mock_db.log_mastery_event.call_args.kwargs["attempt_id"] == attempt_id


def test_graph_propagation_forward():
    from uuid import uuid4

    from src.services.adaptive.graph_propagation import propagate_mastery

    mock_db = MagicMock()
    student_id = uuid4()
    course_id = uuid4()
    parent_id = uuid4()  # target concept (increased)
    child_id = uuid4()
    attempt_id = uuid4()

    # Mock get_concept_relations to return prerequisite
    mock_db.get_concept_relations.return_value = [
        {
            "id": uuid4(),
            "course_id": course_id,
            "source_concept_id": parent_id,
            "target_concept_id": child_id,
            "relation_type": "Prerequisite_of",
            "weight": 1.5,
            "status": "approved",
        }
    ]

    # Mock child mastery
    mock_db.get_student_mastery.return_value = {
        "elo_score": 1200.0,
        "bkt_mastery_probability": 0.20,
        "mastery_state": "weak",
    }

    # Call propagate_mastery (parent increased from 0.40 to 0.80 -> delta = 0.40)
    propagate_mastery(
        db=mock_db,
        student_id=student_id,
        course_id=course_id,
        concept_id=parent_id,
        old_bkt=0.40,
        new_bkt=0.80,
        source_attempt_id=attempt_id,
    )

    # Expected child BKT: 0.20 + 0.25 * 0.40 * 1.5 = 0.35
    mock_db.update_student_bkt.assert_called_once_with(
        student_id=student_id,
        course_id=course_id,
        concept_id=child_id,
        bkt_prob=0.35,
        mastery_state="learning",
        weakness_flag=True,
    )
    mock_db.log_mastery_event.assert_called_once()
    assert mock_db.log_mastery_event.call_args.kwargs["attempt_id"] == attempt_id


def test_graph_propagation_draft_status():
    from uuid import uuid4

    from src.services.adaptive.graph_propagation import propagate_mastery

    mock_db = MagicMock()
    student_id = uuid4()
    course_id = uuid4()
    parent_id = uuid4()
    child_id = uuid4()

    # Mock get_concept_relations to return a draft prerequisite
    mock_db.get_concept_relations.return_value = [
        {
            "id": uuid4(),
            "course_id": course_id,
            "source_concept_id": parent_id,
            "target_concept_id": child_id,
            "relation_type": "Prerequisite_of",
            "weight": 1.0,
            "status": "draft",
        }
    ]

    # Call propagate_mastery
    propagate_mastery(
        db=mock_db,
        student_id=student_id,
        course_id=course_id,
        concept_id=child_id,
        old_bkt=0.70,
        new_bkt=0.30,
    )

    # Should NOT call update_student_bkt
    mock_db.update_student_bkt.assert_not_called()


@pytest.mark.asyncio
async def test_graph_relation_endpoints(mock_db, client):
    from uuid import uuid4

    course_id = uuid4()
    source_concept_id = uuid4()
    target_concept_id = uuid4()
    relation_id = uuid4()

    student_id = uuid4()
    teacher_id = "11111111-1111-1111-1111-111111111111"

    # Mock DB calls
    mock_db.get_concept_relations.return_value = [
        {
            "id": relation_id,
            "course_id": course_id,
            "source_concept_id": source_concept_id,
            "target_concept_id": target_concept_id,
            "relation_type": "Prerequisite_of",
            "weight": 1.0,
            "status": "draft",
        }
    ]
    mock_db.create_concept_relation.return_value = {
        "id": relation_id,
        "course_id": course_id,
        "source_concept_id": source_concept_id,
        "target_concept_id": target_concept_id,
        "relation_type": "Prerequisite_of",
        "weight": 1.0,
        "status": "draft",
    }
    mock_db.update_concept_relation.return_value = {
        "id": relation_id,
        "course_id": course_id,
        "source_concept_id": source_concept_id,
        "target_concept_id": target_concept_id,
        "relation_type": "Prerequisite_of",
        "weight": 0.8,
        "status": "approved",
    }
    mock_db.delete_concept_relation.return_value = True

    app.dependency_overrides[get_adaptive_db] = lambda: mock_db

    try:
        # 1. GET
        response = await client.get(
            f"/api/v1/adaptive/graph/relations?course_id={course_id}", headers={"Authorization": f"Bearer {student_id}"}
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

        # 2. POST
        response = await client.post(
            "/api/v1/adaptive/graph/relations",
            json={
                "course_id": str(course_id),
                "source_concept_id": str(source_concept_id),
                "target_concept_id": str(target_concept_id),
                "relation_type": "Prerequisite_of",
                "weight": 1.0,
                "status": "draft",
            },
            headers={"Authorization": f"Bearer {teacher_id}"},
        )
        assert response.status_code == 200
        assert response.json()["id"] == str(relation_id)

        # 3. PATCH
        response = await client.patch(
            f"/api/v1/adaptive/graph/relations/{relation_id}",
            json={"weight": 0.8, "status": "approved"},
            headers={"Authorization": f"Bearer {teacher_id}"},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "approved"

        # 4. DELETE
        response = await client.delete(
            f"/api/v1/adaptive/graph/relations/{relation_id}", headers={"Authorization": f"Bearer {teacher_id}"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "success"
        mock_db.delete_concept_relation.assert_called_once_with(relation_id)

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_graph_relation_create_empty_result_is_error(mock_db, client):
    course_id = uuid4()
    source_concept_id = uuid4()
    target_concept_id = uuid4()
    teacher_id = "11111111-1111-1111-1111-111111111111"
    mock_db.create_concept_relation.return_value = {}

    app.dependency_overrides[get_adaptive_db] = lambda: mock_db

    try:
        response = await client.post(
            "/api/v1/adaptive/graph/relations",
            json={
                "course_id": str(course_id),
                "source_concept_id": str(source_concept_id),
                "target_concept_id": str(target_concept_id),
                "relation_type": "Prerequisite_of",
                "weight": 1.0,
                "status": "draft",
            },
            headers={"Authorization": f"Bearer {teacher_id}"},
        )

        assert response.status_code == 503
        assert response.json()["detail"] == "Không thể tạo quan hệ concept."
        mock_db.rollback.assert_called_once()
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_graph_relation_store_failures_return_503(mock_db, client):
    course_id = uuid4()
    relation_id = uuid4()
    teacher_id = "11111111-1111-1111-1111-111111111111"

    app.dependency_overrides[get_adaptive_db] = lambda: mock_db
    try:
        mock_db.get_concept_relations.side_effect = RuntimeError("relation store unavailable")
        response = await client.get(
            f"/api/v1/adaptive/graph/relations?course_id={course_id}",
            headers={"Authorization": f"Bearer {teacher_id}"},
        )
        assert response.status_code == 503
        assert response.json()["detail"] == "Không thể tải quan hệ concept."

        mock_db.get_concept_relations.side_effect = None
        mock_db.update_concept_relation.side_effect = RuntimeError("relation update unavailable")
        response = await client.patch(
            f"/api/v1/adaptive/graph/relations/{relation_id}",
            json={"weight": 0.8, "status": "approved"},
            headers={"Authorization": f"Bearer {teacher_id}"},
        )
        assert response.status_code == 503
        assert response.json()["detail"] == "Không thể cập nhật quan hệ concept."

        mock_db.update_concept_relation.side_effect = None
        mock_db.delete_concept_relation.side_effect = RuntimeError("relation delete unavailable")
        response = await client.delete(
            f"/api/v1/adaptive/graph/relations/{relation_id}",
            headers={"Authorization": f"Bearer {teacher_id}"},
        )
        assert response.status_code == 503
        assert response.json()["detail"] == "Không thể xóa quan hệ concept."
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_graph_relation_delete_missing_relation_returns_404(mock_db, client):
    relation_id = uuid4()
    teacher_id = "11111111-1111-1111-1111-111111111111"
    mock_db.delete_concept_relation.return_value = False

    app.dependency_overrides[get_adaptive_db] = lambda: mock_db

    try:
        response = await client.delete(
            f"/api/v1/adaptive/graph/relations/{relation_id}", headers={"Authorization": f"Bearer {teacher_id}"}
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Không tìm thấy quan hệ concept tương ứng."
        mock_db.rollback.assert_called_once()
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_class_stats_endpoint(mock_db, client):
    course_id = uuid4()
    teacher_id = "55555555-5555-5555-5555-555555555555"  # mentor role
    student_id = "d3b07384-d113-4ec5-a58e-0f2d87e07661"  # student role

    # Set mock_db._stub_mode = True to test stub return
    mock_db._stub_mode = True
    app.dependency_overrides[get_adaptive_db] = lambda: mock_db

    try:
        # 1. Access by student (Forbidden)
        response = await client.get(
            f"/api/v1/adaptive/class-stats?course_id={course_id}",
            headers={"Authorization": f"Bearer {student_id}"},
        )
        assert response.status_code == 403

        # 2. Access by teacher (Success - returns stub data)
        response = await client.get(
            f"/api/v1/adaptive/class-stats?course_id={course_id}",
            headers={"Authorization": f"Bearer {teacher_id}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_students"] == 5
        assert data["class_average_elo"] == 1127.0
        assert data["weakest_skill"]["name"] == "Vận dụng tính chất tỉ lệ thức, đại lượng tỉ lệ"
        assert data["completion_rate"] == 40.0
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_class_insights_endpoint(mock_db, client):
    course_id = uuid4()
    teacher_id = "55555555-5555-5555-5555-555555555555"  # mentor role
    student_id = "d3b07384-d113-4ec5-a58e-0f2d87e07661"  # student role

    # Set mock_db._stub_mode = True to test stub return
    mock_db._stub_mode = True
    app.dependency_overrides[get_adaptive_db] = lambda: mock_db

    try:
        # 1. Access by student (Forbidden)
        response = await client.get(
            f"/api/v1/adaptive/class-insights?course_id={course_id}",
            headers={"Authorization": f"Bearer {student_id}"},
        )
        assert response.status_code == 403

        # 2. Access by teacher (Success - returns stub mock data)
        response = await client.get(
            f"/api/v1/adaptive/class-insights?course_id={course_id}",
            headers={"Authorization": f"Bearer {teacher_id}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_count"] == 5
        assert len(data["students"]) == 5

        # Test search query
        response_search = await client.get(
            f"/api/v1/adaptive/class-insights?course_id={course_id}&search=Trần",
            headers={"Authorization": f"Bearer {teacher_id}"},
        )
        assert response_search.status_code == 200
        data_search = response_search.json()
        assert data_search["total_count"] == 1
        assert data_search["students"][0]["full_name"] == "Trần Thị Bình"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_recommend_endpoint_offline_fallback(mock_db, client):
    student_id = uuid4()
    course_id = uuid4()
    concept_id = uuid4()

    # Mock database begin method to raise a connection/network timeout
    mock_db.begin.side_effect = RuntimeError("Database connection timed out")

    app.dependency_overrides[get_adaptive_db] = lambda: mock_db

    try:
        response = await client.post(
            "/api/v1/adaptive/recommend",
            json={
                "student_id": str(student_id),
                "course_id": str(course_id),
                "concept_id": str(concept_id),
            },
            headers={"Authorization": f"Bearer {student_id}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "decision_id" in data
        assert "question_id" in data
        assert "prompt" in data
        assert any(
            x in data["prompt"]
            for x in ["tỉ lệ thức", "tỉ lệ thuận", "Tỉ lệ thức"]
        )
        assert data["options"] != {}
        assert data["explanation"] == "Chọn ở chế độ offline."
    finally:
        app.dependency_overrides.clear()

