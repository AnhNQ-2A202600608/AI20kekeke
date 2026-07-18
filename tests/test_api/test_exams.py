from uuid import uuid4

import pytest


@pytest.mark.asyncio
async def test_list_exam_sets(client):
    course_id = uuid4()
    response = await client.get(
        f"/api/v1/exams?course_id={course_id}", headers={"Authorization": "Bearer service_role"}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "code" in data[0]
    assert "title" in data[0]
    assert "duration_minutes" in data[0]


@pytest.mark.asyncio
async def test_get_exam_details(client):
    exam_set_id = uuid4()
    response = await client.get(f"/api/v1/exams/{exam_set_id}", headers={"Authorization": "Bearer service_role"})
    assert response.status_code == 200
    data = response.json()
    assert "exam" in data
    assert "questions" in data
    assert data["exam"]["id"] == str(exam_set_id)
    assert len(data["questions"]) > 0
    assert "prompt" in data["questions"][0]
    assert "options" in data["questions"][0]
    # Ensure correct answer is hidden
    assert "answer" not in data["questions"][0]
    assert "explanation" not in data["questions"][0]


@pytest.mark.asyncio
async def test_start_exam(client):
    exam_set_id = uuid4()
    response = await client.post(f"/api/v1/exams/{exam_set_id}/start", headers={"Authorization": "Bearer service_role"})
    assert response.status_code == 200
    data = response.json()
    assert "attempt_id" in data
    assert "exam_set_id" in data
    assert data["exam_set_id"] == str(exam_set_id)
    assert "started_at" in data
    assert "expires_at" in data


@pytest.mark.asyncio
async def test_submit_exam(client):
    attempt_id = uuid4()
    answers = [
        {"question_id": str(uuid4()), "selected_option": "A"},
        {"question_id": str(uuid4()), "selected_option": "B"},
    ]
    response = await client.post(
        f"/api/v1/exams/attempts/{attempt_id}/submit",
        json={"answers": answers},
        headers={"Authorization": "Bearer service_role"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "attempt_id" in data
    assert "final_score" in data
    assert "max_score" in data
    assert "accuracy_pct" in data
    assert "weak_concepts" in data
    assert isinstance(data["weak_concepts"], list)


@pytest.mark.asyncio
async def test_get_exam_result(client):
    attempt_id = uuid4()
    response = await client.get(
        f"/api/v1/exams/attempts/{attempt_id}/result", headers={"Authorization": "Bearer service_role"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["attempt_id"] == str(attempt_id)
    assert "final_score" in data
    assert "max_score" in data
    assert "weak_concepts" in data
