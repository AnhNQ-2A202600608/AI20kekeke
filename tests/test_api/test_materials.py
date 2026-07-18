from unittest.mock import MagicMock, patch

import pytest


@pytest.mark.asyncio
async def test_list_materials_empty(client, monkeypatch):
    # Mock supabase config and requests.get for materials
    monkeypatch.setattr(
        "src.api.material_routes.get_backend_supabase_config",
        lambda allow_stub=True: MagicMock(url="https://fake.supabase.co", secret_key="fake-key", is_stub=False),
    )

    mock_resp_slides = MagicMock()
    mock_resp_slides.status_code = 200
    mock_resp_slides.json.return_value = []

    mock_resp_questions = MagicMock()
    mock_resp_questions.status_code = 200
    mock_resp_questions.json.return_value = []

    def mock_get(url, *args, **kwargs):
        if "slide_embeddings" in url:
            return mock_resp_slides
        if "questions" in url:
            return mock_resp_questions
        return MagicMock(status_code=404)

    with patch("requests.get", side_effect=mock_get):
        response = await client.get(
            "/api/v1/materials",
            headers={"Authorization": "Bearer service_role"},
        )
        assert response.status_code == 200
        assert response.json() == []


@pytest.mark.asyncio
async def test_list_materials_with_data(client, monkeypatch):
    monkeypatch.setattr(
        "src.api.material_routes.get_backend_supabase_config",
        lambda allow_stub=True: MagicMock(url="https://fake.supabase.co", secret_key="fake-key", is_stub=False),
    )

    # Mock slide embeddings returned
    slides_data = [
        {"document_name": "Day 08 - Production RAG.pdf", "slide_number": 1, "created_at": "2026-06-13T10:00:00Z"},
        {"document_name": "Day 08 - Production RAG.pdf", "slide_number": 2, "created_at": "2026-06-13T10:00:00Z"},
    ]
    mock_resp_slides = MagicMock()
    mock_resp_slides.status_code = 200
    mock_resp_slides.json.return_value = slides_data

    # Mock questions stats returned
    questions_data = [
        {"id": "q1", "source_document_name": "Day 08 - Production RAG.pdf", "calibration_status": "published"},
        {"id": "q2", "source_document_name": "Day 08 - Production RAG.pdf", "calibration_status": "draft"},
    ]
    mock_resp_questions = MagicMock()
    mock_resp_questions.status_code = 200
    mock_resp_questions.json.return_value = questions_data

    def mock_get(url, *args, **kwargs):
        if "slide_embeddings" in url:
            return mock_resp_slides
        if "questions" in url:
            return mock_resp_questions
        return MagicMock(status_code=404)

    with patch("requests.get", side_effect=mock_get):
        response = await client.get(
            "/api/v1/materials",
            headers={"Authorization": "Bearer service_role"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Day 08 - Production RAG.pdf"
        assert data[0]["totalSlides"] == 2
        assert data[0]["totalQuizGenerated"] == 2
        assert data[0]["totalQuizPublished"] == 1


@pytest.mark.asyncio
async def test_get_chunks(client, monkeypatch):
    monkeypatch.setattr(
        "src.api.material_routes.get_backend_supabase_config",
        lambda allow_stub=True: MagicMock(url="https://fake.supabase.co", secret_key="fake-key", is_stub=False),
    )

    mock_resp_count = MagicMock()
    mock_resp_count.status_code = 200
    mock_resp_count.headers = {"Content-Range": "0-1/2"}

    mock_resp_chunks = MagicMock()
    mock_resp_chunks.status_code = 200
    mock_resp_chunks.json.return_value = [
        {"slide_number": 1, "content": "Slide 1 Content", "image_url": "http://img1"},
        {"slide_number": 2, "content": "Slide 2 Content", "image_url": "http://img2"},
    ]

    def mock_get(url, *args, **kwargs):
        # PostgREST uses Prefer header to differentiate count vs selection
        headers = kwargs.get("headers", {})
        if headers.get("Prefer") == "count=exact":
            return mock_resp_count
        return mock_resp_chunks

    with patch("requests.get", side_effect=mock_get):
        response = await client.get(
            "/api/v1/materials/Day%2008%20-%20Production%20RAG.pdf/chunks?page=1&page_size=20",
            headers={"Authorization": "Bearer service_role"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["document_name"] == "Day 08 - Production RAG.pdf"
        assert data["total_chunks"] == 2
        assert len(data["chunks"]) == 2
        assert data["chunks"][0]["text"] == "Slide 1 Content"
        assert data["chunks"][0]["image_url"] == "http://img1"


@pytest.mark.asyncio
async def test_generate_quizzes_trigger(client, monkeypatch):
    monkeypatch.setattr(
        "src.api.material_routes.get_backend_supabase_config",
        lambda allow_stub=True: MagicMock(url="https://fake.supabase.co", secret_key="fake-key", is_stub=False),
    )

    # Mock generate task
    with patch("src.api.material_routes.generate_quizzes_from_slides_task"):
        response = await client.post(
            "/api/v1/materials/Day%2008%20-%20Production%20RAG.pdf/generate-quizzes",
            json={"num_questions": 3, "difficulty": "dễ", "socratic_hints": True, "concept_code": "d8-rag-pipeline"},
            headers={"Authorization": "Bearer service_role"},
        )
        assert response.status_code == 202
        data = response.json()
        assert data["status"] == "accepted"
        assert data["num_questions_requested"] == 3


@pytest.mark.asyncio
async def test_list_materials_regex_extraction(client, monkeypatch):
    monkeypatch.setattr(
        "src.api.material_routes.get_backend_supabase_config",
        lambda allow_stub=True: MagicMock(url="https://fake.supabase.co", secret_key="fake-key", is_stub=False),
    )

    # Mock slide embeddings returned
    slides_data = [
        {"document_name": "Day 15 - Multi-Agent.pdf", "slide_number": 1, "created_at": "2026-06-13T10:00:00Z"},
        {"document_name": "Day 28 - Deployment.pdf", "slide_number": 1, "created_at": "2026-06-13T10:00:00Z"},
        {"document_name": "No day in title.pdf", "slide_number": 1, "created_at": "2026-06-13T10:00:00Z"},
    ]
    mock_resp_slides = MagicMock()
    mock_resp_slides.status_code = 200
    mock_resp_slides.json.return_value = slides_data

    mock_resp_questions = MagicMock()
    mock_resp_questions.status_code = 200
    mock_resp_questions.json.return_value = []

    def mock_get(url, *args, **kwargs):
        if "slide_embeddings" in url:
            return mock_resp_slides
        if "questions" in url:
            return mock_resp_questions
        return MagicMock(status_code=404)

    with patch("requests.get", side_effect=mock_get):
        response = await client.get(
            "/api/v1/materials",
            headers={"Authorization": "Bearer service_role"},
        )
        assert response.status_code == 200
        data = response.json()

        # We sorted by uploadedAt desc, then name. In this mock, all uploadedAt are the same.
        # So it's sorted by name desc:
        # "No day in title.pdf", "Day 28 - Deployment.pdf", "Day 15 - Multi-Agent.pdf"
        names = [d["name"] for d in data]
        assert "Day 15 - Multi-Agent.pdf" in names
        assert "Day 28 - Deployment.pdf" in names
        assert "No day in title.pdf" in names

        # Find specific items
        item_15 = next(x for x in data if x["name"] == "Day 15 - Multi-Agent.pdf")
        item_28 = next(x for x in data if x["name"] == "Day 28 - Deployment.pdf")
        item_no = next(x for x in data if x["name"] == "No day in title.pdf")

        assert item_15["dayLabel"] == "Day 15"
        assert item_28["dayLabel"] == "Day 28"
        assert item_no["dayLabel"] == "Unknown"


@pytest.mark.asyncio
async def test_generate_quizzes_by_weakness_trigger(client, monkeypatch):
    monkeypatch.setattr(
        "src.api.material_routes.get_backend_supabase_config",
        lambda allow_stub=True: MagicMock(url="https://fake.supabase.co", secret_key="fake-key", is_stub=False),
    )

    mock_resp_concept = MagicMock()
    mock_resp_concept.status_code = 200
    mock_resp_concept.json.return_value = [{"id": "concept-123", "name": "RAG Pipeline"}]

    mock_resp_questions = MagicMock()
    mock_resp_questions.status_code = 200
    mock_resp_questions.json.return_value = []

    mock_resp_materials = MagicMock()
    mock_resp_materials.status_code = 200
    mock_resp_materials.json.return_value = [{"source_filename": "Day 08 - Production RAG.pdf", "title": "RAG Pipeline"}]

    def mock_get(url, *args, **kwargs):
        if "concepts" in url:
            return mock_resp_concept
        if "questions" in url:
            return mock_resp_questions
        if "course_materials" in url:
            return mock_resp_materials
        return MagicMock(status_code=404)

    # Mock generate task
    with patch("src.api.material_routes.generate_quizzes_from_slides_task") as mock_task, \
         patch("requests.get", side_effect=mock_get):
        response = await client.post(
            "/api/v1/materials/generate-by-weakness",
            json={
                "student_id": "4a3563f3-7531-4921-a02a-c16392f91f19",
                "concept_code": "d8-rag-pipeline",
                "num_questions": 3,
                "difficulty": "bình thường",
                "socratic_hints": True
            },
            headers={"Authorization": "Bearer service_role"},
        )
        assert response.status_code == 202
        data = response.json()
        assert data["status"] == "accepted"
        assert data["student_id"] == "4a3563f3-7531-4921-a02a-c16392f91f19"
        assert data["concept_code"] == "d8-rag-pipeline"
        assert data["document_name"] == "Day 08 - Production RAG.pdf"
        assert data["num_questions_requested"] == 3
        mock_task.assert_called_once()


