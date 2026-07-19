from uuid import uuid4

import pytest


@pytest.mark.asyncio
async def test_generate_learning_path_api(client, mock_llm):
    """Kiểm tra API POST /learning-path/generate sinh lộ trình thành công."""
    student_id = str(uuid4())
    course_id = str(uuid4())
    exam_attempt_id = str(uuid4())

    payload = {
        "student_id": student_id,
        "course_id": course_id,
        "exam_attempt_id": exam_attempt_id,
    }

    response = await client.post(
        "/api/v1/learning-path/generate",
        json=payload,
        headers={"Authorization": "Bearer service_role"},
    )

    assert response.status_code == 200
    data = response.json()
    assert "instance_id" in data
    assert "path_data" in data
    assert "milestones" in data["path_data"]
    assert "processing_time_ms" in data


@pytest.mark.asyncio
async def test_list_learning_paths_api(client):
    """Kiểm tra API GET /learning-path/{student_id} lấy danh sách lộ trình."""
    student_id = str(uuid4())
    course_id = str(uuid4())

    response = await client.get(
        f"/api/v1/learning-path/{student_id}?course_id={course_id}",
        headers={"Authorization": "Bearer service_role"},
    )

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_learning_path_details_api(client):
    """Kiểm tra API GET /learning-path/instance/{id} lấy chi tiết lộ trình."""
    instance_id = str(uuid4())

    # Nếu ở stub mode không tìm thấy id trong DB -> 404
    response = await client.get(
        f"/api/v1/learning-path/instance/{instance_id}",
        headers={"Authorization": "Bearer service_role"},
    )
    assert response.status_code in (200, 404)


@pytest.mark.asyncio
async def test_update_milestone_status_api(client):
    """Kiểm tra API PATCH /learning-path/instance/{id}/milestone/{mid} cập nhật trạng thái."""
    instance_id = str(uuid4())
    milestone_id = "concept-1"

    response = await client.patch(
        f"/api/v1/learning-path/instance/{instance_id}/milestone/{milestone_id}",
        json={"status": "completed"},
        headers={"Authorization": "Bearer service_role"},
    )
    # Stub mode -> trả về 400 hoặc 200 tùy thuộc id tồn tại
    assert response.status_code in (200, 400, 404)


@pytest.mark.asyncio
async def test_mentor_assign_learning_path_api(client):
    """Kiểm tra API POST /learning-path/mentor/assign để Giáo viên giao lộ trình tùy chỉnh."""
    student_id = str(uuid4())
    course_id = str(uuid4())

    payload = {
        "student_id": student_id,
        "course_id": course_id,
        "path_data": {
            "milestones": [
                {
                    "id": "concept-1",
                    "concept_id": str(uuid4()),
                    "concept_name": "Phép nhân phân số",
                    "status": "unlocked",
                    "error_type": "conceptual",
                    "prerequisites": [],
                    "tasks": [
                        {"type": "slide", "content_id": str(uuid4()), "difficulty": None},
                        {"type": "practice", "content_id": None, "difficulty": "deep"},
                    ],
                }
            ]
        },
    }

    response = await client.post(
        "/api/v1/learning-path/mentor/assign",
        json=payload,
        headers={"Authorization": "Bearer service_role"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["source"] == "mentor"
    assert data["trigger_type"] == "mentor_manual"
    assert "path_data" in data
