import logging
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from src.api import adaptive_routes
from src.api import routes as api_routes
from src.api.adaptive_routes import get_adaptive_db
from src.api.routes import get_public_supabase_client
from src.main import app
from src.models.schemas import ChatRequest


@pytest.mark.asyncio
async def test_health(client):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_ready(client):
    response = await client.get("/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert "database" in data
    assert "cache" in data


@pytest.mark.asyncio
async def test_ready_sanitizes_dependency_errors(client, monkeypatch):
    import src.api.adaptive_routes
    import src.services.cache

    class FailingDbClient:
        _stub_mode = False

        @property
        def app_client(self):
            raise RuntimeError("postgres://secret-host/internal")

    class FailingCache:
        client = None

        def ping(self):
            raise RuntimeError("redis://secret-host/internal")

    monkeypatch.setattr(src.api.adaptive_routes, "get_adaptive_db", lambda: FailingDbClient())
    monkeypatch.setattr(src.services.cache, "get_cache_store", lambda: FailingCache())

    response = await client.get("/ready")

    assert response.status_code == 503
    assert response.json()["status"] == "unavailable"
    assert response.json()["database"] == "error"
    assert "secret-host" not in response.text


@pytest.mark.asyncio
async def test_chat_empty_message(client):
    response = await client.post(
        "/api/v1/chat",
        json={"message": ""},
        headers={"Authorization": "Bearer service_role"},
    )
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_validation_error_does_not_echo_request_body_or_input(client, caplog):
    caplog.set_level(logging.ERROR, logger="main")
    response = await client.post(
        "/api/v1/chat",
        json={"message": {"secret": "postgres://secret-host/internal"}},
        headers={"Authorization": "Bearer service_role"},
    )

    assert response.status_code == 422
    assert "body" not in response.json()
    assert "secret-host" not in response.text
    assert "input" not in response.json()["detail"][0]
    assert "secret-host" not in caplog.text


@pytest.mark.asyncio
async def test_agent_status(client):
    response = await client.get("/api/v1/status")
    assert response.status_code == 200


class FakeCache:
    def __init__(self, initial=None):
        self.store = dict(initial or {})

    def get(self, key):
        return self.store.get(key)

    def set(self, key, value, ttl=None):
        self.store[key] = value


def chat_profile_request():
    return ChatRequest(
        message="Giải thích bài này",
        student_id="d3b07384-d113-4ec5-a58e-0f2d87e07661",
        course_id="00000000-0000-0000-0000-000000000001",
        concept_id="11111111-1111-1111-1111-111111111111",
    )


@pytest.mark.asyncio
async def test_load_student_profile_db_failure_is_explicit_503(monkeypatch):
    db = MagicMock()
    db.get_student_mastery.side_effect = RuntimeError("db unavailable")
    monkeypatch.setattr(api_routes, "get_cache_store", lambda: FakeCache())
    monkeypatch.setattr(adaptive_routes, "get_adaptive_db", lambda: db)

    with pytest.raises(Exception) as exc_info:
        await api_routes.load_student_profile(chat_profile_request())

    assert getattr(exc_info.value, "status_code", None) == 503
    assert "Không thể tải hồ sơ học tập" in exc_info.value.detail


@pytest.mark.asyncio
async def test_load_student_profile_corrupt_cache_fetches_db(monkeypatch):
    request = chat_profile_request()
    cache_key = "student:d3b07384-d113-4ec5-a58e-0f2d87e07661:course:00000000-0000-0000-0000-000000000001:concept:11111111-1111-1111-1111-111111111111:mastery"
    cache = FakeCache({cache_key: "{not-json"})
    db = MagicMock()
    db.get_student_mastery.return_value = {
        "elo_score": 1330,
        "bkt_mastery_probability": 0.61,
        "weakness_flag": True,
        "mastery_state": "learning",
    }
    monkeypatch.setattr(api_routes, "get_cache_store", lambda: cache)
    monkeypatch.setattr(adaptive_routes, "get_adaptive_db", lambda: db)

    profile, returned_cache_key = await api_routes.load_student_profile(request)

    assert returned_cache_key == cache_key
    assert profile["elo_score"] == 1330
    assert profile["bkt_mastery_probability"] == 0.61
    db.get_student_mastery.assert_called_once()


@pytest.mark.asyncio
async def test_chat_session_create_failure_returns_503(client, monkeypatch):
    db = MagicMock()
    db.create_chat_session.side_effect = RuntimeError("Unable to create chat session.")
    monkeypatch.setattr(adaptive_routes, "get_adaptive_db", lambda: db)

    response = await client.post(
        "/api/v1/chat",
        json={
            "message": "Explain vectors briefly",
            "stream": False,
            "student_id": "d3b07384-d113-4ec5-a58e-0f2d87e07661",
            "course_id": "00000000-0000-0000-0000-000000000001",
        },
        headers={"Authorization": "Bearer service_role"},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == api_routes.CHAT_PERSISTENCE_ERROR


@pytest.mark.asyncio
async def test_chat_agent_failure_returns_sanitized_503(client, monkeypatch):
    import src.agents.graph as graph_module

    class FailingAgent:
        async def ainvoke(self, state):
            raise RuntimeError("postgres://secret-host/internal")

    monkeypatch.setattr(graph_module, "agent", FailingAgent())

    response = await client.post(
        "/api/v1/chat",
        json={"message": "Explain vectors briefly", "stream": False},
        headers={"Authorization": "Bearer service_role"},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == api_routes.CHAT_PROCESSING_ERROR
    assert "secret-host" not in response.text


@pytest.mark.asyncio
async def test_benchmark_caching_disabled_in_production(client, monkeypatch):
    import src.config

    monkeypatch.setattr(
        src.config,
        "get_settings",
        lambda: SimpleNamespace(app_env="production", openai_api_key="sk-test"),
    )

    response = await client.get("/api/v1/benchmark-caching")

    assert response.status_code == 404
    assert response.json()["detail"] == "Benchmark endpoint is not available in production."


@pytest.mark.asyncio
async def test_benchmark_caching_requires_explicit_enablement(client, monkeypatch):
    import src.config

    monkeypatch.delenv("ENABLE_BENCHMARK_CACHING", raising=False)
    monkeypatch.setattr(
        src.config,
        "get_settings",
        lambda: SimpleNamespace(app_env="development", openai_api_key="sk-test"),
    )

    response = await client.get("/api/v1/benchmark-caching")

    assert response.status_code == 404
    assert response.json()["detail"] == "Benchmark endpoint is not enabled."


@pytest.mark.asyncio
async def test_benchmark_caching_enabled_without_openai_key_returns_503(client, monkeypatch):
    import src.config

    monkeypatch.setenv("ENABLE_BENCHMARK_CACHING", "true")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setattr(
        src.config,
        "get_settings",
        lambda: SimpleNamespace(app_env="development", openai_api_key=""),
    )

    response = await client.get("/api/v1/benchmark-caching")

    assert response.status_code == 503
    assert response.json()["detail"] == "OPENAI_API_KEY is not configured for benchmark execution."


class FailingTableClient:
    def table(self, name):
        raise RuntimeError(f"{name} connection string leaked")


@pytest.mark.asyncio
async def test_student_activity_db_failure_is_explicit_503():
    user_id = "00000000-0000-0000-0000-000000000001"
    db = SimpleNamespace(_stub_mode=False, app_client=FailingTableClient())
    user = SimpleNamespace(id=api_routes.UUID(user_id), role="student")

    with pytest.raises(Exception) as exc_info:
        await api_routes.get_student_activity(student_id=api_routes.UUID(user_id), user=user, db=db)

    assert getattr(exc_info.value, "status_code", None) == 503
    assert exc_info.value.detail == "Không thể tải lịch sử hoạt động học tập."


@pytest.mark.asyncio
async def test_student_recent_sessions_db_failure_is_explicit_503():
    user_id = "00000000-0000-0000-0000-000000000001"
    db = SimpleNamespace(_stub_mode=False, app_client=FailingTableClient())
    user = SimpleNamespace(id=api_routes.UUID(user_id), role="student")

    with pytest.raises(Exception) as exc_info:
        await api_routes.get_student_recent_sessions(student_id=api_routes.UUID(user_id), user=user, db=db)

    assert getattr(exc_info.value, "status_code", None) == 503
    assert exc_info.value.detail == "Không thể tải phiên học tập gần đây."


@pytest.fixture
def mock_public_supabase_client():
    client = MagicMock()
    table = MagicMock()
    client.table.return_value = table
    insert_response = MagicMock()
    insert_response.data = {"id": "survey-123"}
    table.insert.return_value.select.return_value.single.return_value.execute.return_value = insert_response
    table.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[{"id": "survey-123"}])
    return client


@pytest.mark.asyncio
async def test_create_survey_submission_uses_backend_client(client, mock_public_supabase_client):
    app.dependency_overrides[get_public_supabase_client] = lambda: mock_public_supabase_client
    try:
        response = await client.post(
            "/api/v1/surveys",
            headers={"Authorization": "Bearer service_role"},
            json={"set_id": "day1", "rating_pre": 4, "comment_pre": "clear"},
        )
        assert response.status_code == 200
        assert response.json() == {"id": "survey-123"}
        mock_public_supabase_client.table.assert_called_with("surveys")
        payload = mock_public_supabase_client.table.return_value.insert.call_args.args[0]
        assert payload == {"set_id": "day1", "rating_pre": 4, "comment_pre": "clear"}
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_create_survey_submission_empty_insert_result_is_503(client, mock_public_supabase_client):
    mock_public_supabase_client.table.return_value.insert.return_value.select.return_value.single.return_value.execute.return_value.data = {}
    app.dependency_overrides[get_public_supabase_client] = lambda: mock_public_supabase_client
    try:
        response = await client.post(
            "/api/v1/surveys",
            headers={"Authorization": "Bearer service_role"},
            json={"set_id": "day1", "rating_pre": 4},
        )
        assert response.status_code == 503
        assert response.json()["detail"] == "Không thể lưu khảo sát lúc này."
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_update_survey_submission_uses_backend_client(client, mock_public_supabase_client):
    app.dependency_overrides[get_public_supabase_client] = lambda: mock_public_supabase_client
    try:
        response = await client.patch(
            "/api/v1/surveys/survey-123",
            headers={"Authorization": "Bearer service_role"},
            json={"email": "student@example.com"},
        )
        assert response.status_code == 200
        assert response.json() == {"id": "survey-123"}
        table = mock_public_supabase_client.table.return_value
        table.update.assert_called_once_with({"email": "student@example.com"})
        table.update.return_value.eq.assert_called_once_with("id", "survey-123")
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_survey_submission_rejects_out_of_range_rating(client, mock_public_supabase_client):
    app.dependency_overrides[get_public_supabase_client] = lambda: mock_public_supabase_client
    try:
        response = await client.post(
            "/api/v1/surveys",
            headers={"Authorization": "Bearer service_role"},
            json={"set_id": "day1", "rating_pre": 9},
        )
        assert response.status_code == 422
        mock_public_supabase_client.table.assert_not_called()
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_quiz_report_db_failure_returns_503(client, monkeypatch, tmp_path):
    db = MagicMock()
    db._stub_mode = False
    table = MagicMock()
    db.app_client.table.return_value = table
    table.insert.return_value.execute.side_effect = RuntimeError("feedback store unavailable")
    monkeypatch.setattr(adaptive_routes, "get_adaptive_db", lambda: db)
    monkeypatch.setenv("QUIZ_REPORT_AUDIT_PATH", str(tmp_path / "quiz_reports.jsonl"))

    response = await client.post(
        "/api/v1/quiz/report",
        headers={"Authorization": "Bearer service_role"},
        json={
            "question_id": "q-1",
            "question_text": "Question text",
            "error_type": "incorrect_answer",
            "detail": "Answer key is wrong",
            "course_id": "00000000-0000-0000-0000-000000000001",
        },
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "Không thể lưu báo cáo lỗi kiến thức."


@pytest.mark.asyncio
async def test_audit_rag_runtime_failure_is_sanitized_503(monkeypatch):
    async def fail_retrieval(self, **kwargs):
        raise RuntimeError("postgres://secret-host/internal")

    monkeypatch.setattr("src.services.rag.RAGService.aretrieve_relevant_slides", fail_retrieval)

    with pytest.raises(Exception) as exc_info:
        await api_routes.audit_rag_test(
            api_routes.RagAuditRequest(query="Explain Docker"),
            user=SimpleNamespace(role="dev"),
        )

    assert getattr(exc_info.value, "status_code", None) == 503
    assert exc_info.value.detail == "Không thể chạy RAG Sandbox lúc này."
    assert "secret-host" not in exc_info.value.detail


def test_audit_concepts_store_failure_is_503():
    db = SimpleNamespace(app_client=FailingTableClient())

    with pytest.raises(Exception) as exc_info:
        api_routes.get_concepts(user=SimpleNamespace(role="dev"), db=db)

    assert getattr(exc_info.value, "status_code", None) == 503
    assert exc_info.value.detail == "Không thể tải danh sách concept."


def test_audit_concept_rule_store_failures_are_503():
    db = SimpleNamespace(app_client=FailingTableClient())

    with pytest.raises(Exception) as get_exc:
        api_routes.get_concept_rule("concept-1", user=SimpleNamespace(role="dev"), db=db)
    with pytest.raises(Exception) as save_exc:
        api_routes.save_concept_rule(
            api_routes.ConceptRuleRequest(concept_id="concept-1", rule_text="Use Socratic prompts."),
            user=SimpleNamespace(role="dev"),
            db=db,
        )

    assert getattr(get_exc.value, "status_code", None) == 503
    assert get_exc.value.detail == "Không thể tải luật prompt của chủ đề."
    assert getattr(save_exc.value, "status_code", None) == 503
    assert save_exc.value.detail == "Không thể lưu luật prompt của chủ đề."


def test_audit_eval_dataset_store_failure_is_503():
    db = SimpleNamespace(app_client=FailingTableClient())

    with pytest.raises(Exception) as exc_info:
        api_routes.save_eval_dataset(
            api_routes.RAGEvalDatasetRequest(
                query="Explain Docker",
                original_answer="Original",
                gold_answer="Gold",
            ),
            user=SimpleNamespace(role="dev"),
            db=db,
        )

    assert getattr(exc_info.value, "status_code", None) == 503
    assert exc_info.value.detail == "Không thể lưu tập đánh giá."


@pytest.mark.asyncio
async def test_update_slide_embedding_provider_failure_is_sanitized_503(monkeypatch):
    class FailingEmbeddings:
        async def aembed_query(self, content):
            raise RuntimeError("provider secret leaked")

    class FailingRagService:
        def __init__(self):
            self.embeddings = FailingEmbeddings()

    monkeypatch.setattr("src.services.rag.RAGService", FailingRagService)

    with pytest.raises(Exception) as exc_info:
        await api_routes.update_slide_embeddings(
            api_routes.SlideEmbeddingsUpdateRequest(
                document_name="day01.pdf",
                slide_number=1,
                content="Updated content",
            ),
            user=SimpleNamespace(role="dev"),
        )

    assert getattr(exc_info.value, "status_code", None) == 503
    assert exc_info.value.detail == "Không thể sinh embedding lúc này."
    assert "secret" not in exc_info.value.detail


@pytest.fixture
def mock_auth_db():
    db = MagicMock()
    db._stub_mode = False

    # Mock Supabase Auth Client
    mock_auth = MagicMock()

    mock_user = MagicMock()
    mock_user.id = "user-uuid-123"
    mock_user.email = "student@mentora.vn"

    mock_session = MagicMock()
    mock_session.access_token = "mock-jwt-access-token"

    mock_auth_response = MagicMock()
    mock_auth_response.user = mock_user
    mock_auth_response.session = mock_session

    mock_auth.sign_in_with_password.return_value = mock_auth_response
    mock_auth.sign_up.return_value = mock_auth_response

    db.app_client.auth = mock_auth
    return db


@pytest.mark.asyncio
async def test_login_success(client, mock_auth_db):
    # Setup database table mocks
    mock_users_response = MagicMock()
    mock_users_response.data = [
        {"id": "user-uuid-123", "email": "student@mentora.vn", "full_name": "Test Student", "mssv": "2A202612345"}
    ]

    mock_roles_response = MagicMock()
    mock_roles_response.data = [{"role_id": 1, "roles": {"code": "student"}}]

    users_table_mock = MagicMock()
    roles_table_mock = MagicMock()

    def get_table_mock(table_name):
        if table_name == "users":
            return users_table_mock
        elif table_name == "user_roles":
            return roles_table_mock
        return MagicMock()

    mock_auth_db.app_client.table.side_effect = get_table_mock
    users_table_mock.select.return_value.eq.return_value.execute.return_value = mock_users_response
    roles_table_mock.select.return_value.eq.return_value.execute.return_value = mock_roles_response

    app.dependency_overrides[get_adaptive_db] = lambda: mock_auth_db
    try:
        response = await client.post(
            "/api/v1/auth/login", json={"email": "student@mentora.vn", "password": "Password123!"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "user-uuid-123"
        assert data["role"] == "student"
        assert data["token"] == "mock-jwt-access-token"
        mock_auth_db.reset_service_auth.assert_called()
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_auth_me_success(client, mock_auth_db):
    user_id = "d3b07384-d113-4ec5-a58e-0f2d87e07661"
    mock_users_response = MagicMock()
    mock_users_response.data = [
        {"id": user_id, "email": "student@mentora.vn", "full_name": "Test Student", "mssv": "2A202612345"}
    ]
    mock_roles_response = MagicMock()
    mock_roles_response.data = [{"role_id": 1, "roles": {"code": "student"}}]

    users_table_mock = MagicMock()
    roles_table_mock = MagicMock()

    def get_table_mock(table_name):
        if table_name == "users":
            return users_table_mock
        if table_name == "user_roles":
            return roles_table_mock
        return MagicMock()

    mock_auth_db.app_client.table.side_effect = get_table_mock
    users_table_mock.select.return_value.eq.return_value.execute.return_value = mock_users_response
    roles_table_mock.select.return_value.eq.return_value.execute.return_value = mock_roles_response

    app.dependency_overrides[get_adaptive_db] = lambda: mock_auth_db
    try:
        response = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {user_id}"})
        assert response.status_code == 200
        data = response.json()
        assert data == {
            "id": user_id,
            "email": "student@mentora.vn",
            "full_name": "Test Student",
            "mssv": "2A202612345",
            "role": "student",
            "is_demo_account": False,
            "demo_profile_key": None,
        }
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_login_hoang_admin_stub(client):
    mock_db = MagicMock()
    mock_db._stub_mode = True
    mock_db.app_client = None

    app.dependency_overrides[get_adaptive_db] = lambda: mock_db
    try:
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": "hoang.htb@mentora.vn", "password": "Password123!"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "36bc990a-5bb6-48a6-a488-b97118497d3f"
        assert data["role"] == "admin"
        assert data["token"] == "fake-jwt-token-36bc990a-5bb6-48a6-a488-b97118497d3f"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_login_invalid_email(client):
    response = await client.post("/api/v1/auth/login", json={"email": "invalid_email", "password": "Password123!"})
    assert response.status_code == 400
    assert "Định dạng email không hợp lệ" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_profile_store_failure_returns_503(client, mock_auth_db):
    mock_auth_db.app_client.auth.sign_in_with_password.return_value.user.id = "user-uuid-123"
    mock_auth_db.app_client.auth.sign_in_with_password.return_value.session.access_token = "jwt-token"
    mock_auth_db.app_client.table.side_effect = RuntimeError("app user store unavailable")

    app.dependency_overrides[get_adaptive_db] = lambda: mock_auth_db
    try:
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": "student@mentora.vn", "password": "Password123!"},
        )
        assert response.status_code == 503
        assert response.json()["detail"] == "Có lỗi xảy ra trong quá trình xử lý đăng nhập."
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_signup_success(client, mock_auth_db):
    mock_check_response = MagicMock()
    mock_check_response.data = []
    mock_insert_response = MagicMock()
    mock_insert_response.data = [
        {"id": "user-uuid-123", "email": "newstudent@mentora.vn", "full_name": "New Student", "mssv": "2A202611111"}
    ]
    mock_roles_response = MagicMock()
    mock_roles_response.data = [{"id": 1}]

    users_table_mock = MagicMock()
    roles_table_mock = MagicMock()
    user_roles_table_mock = MagicMock()

    def get_table_mock(table_name):
        if table_name == "users":
            return users_table_mock
        if table_name == "roles":
            return roles_table_mock
        if table_name == "user_roles":
            return user_roles_table_mock
        return MagicMock()

    mock_auth_db.app_client.table.side_effect = get_table_mock
    users_table_mock.select.return_value.eq.return_value.execute.return_value = mock_check_response
    users_table_mock.insert.return_value.execute.return_value = mock_insert_response
    roles_table_mock.select.return_value.eq.return_value.execute.return_value = mock_roles_response
    user_roles_table_mock.insert.return_value.execute.return_value = MagicMock(data=[{"user_id": "user-uuid-123"}])

    app.dependency_overrides[get_adaptive_db] = lambda: mock_auth_db
    try:
        response = await client.post(
            "/api/v1/auth/signup",
            json={
                "email": "newstudent@mentora.vn",
                "password": "Password123!",
                "full_name": "New Student",
                "mssv": "2A202611111",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "user-uuid-123"
        assert data["role"] == "student"
        user_roles_table_mock.insert.assert_called_once_with({"user_id": "user-uuid-123", "role_id": 1})
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_signup_missing_student_role_rolls_back(client, mock_auth_db):
    mock_check_response = MagicMock()
    mock_check_response.data = []
    mock_insert_response = MagicMock()
    mock_insert_response.data = [{"id": "user-uuid-123"}]
    mock_roles_response = MagicMock()
    mock_roles_response.data = []

    users_table_mock = MagicMock()
    roles_table_mock = MagicMock()

    def get_table_mock(table_name):
        if table_name == "users":
            return users_table_mock
        if table_name == "roles":
            return roles_table_mock
        return MagicMock()

    mock_auth_db.app_client.table.side_effect = get_table_mock
    users_table_mock.select.return_value.eq.return_value.execute.return_value = mock_check_response
    users_table_mock.insert.return_value.execute.return_value = mock_insert_response
    users_table_mock.delete.return_value.eq.return_value.execute.return_value = MagicMock()
    roles_table_mock.select.return_value.eq.return_value.execute.return_value = mock_roles_response

    app.dependency_overrides[get_adaptive_db] = lambda: mock_auth_db
    try:
        response = await client.post(
            "/api/v1/auth/signup",
            json={
                "email": "newstudent@mentora.vn",
                "password": "Password123!",
                "full_name": "New Student",
                "mssv": "2A202611111",
            },
        )
        assert response.status_code == 503
        assert "vai trò" in response.json()["detail"]
        users_table_mock.delete.return_value.eq.assert_called_once_with("id", "user-uuid-123")
        mock_auth_db.app_client.auth.admin.delete_user.assert_called_once_with("user-uuid-123")
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_signup_role_assignment_failure_rolls_back(client, mock_auth_db):
    mock_check_response = MagicMock()
    mock_check_response.data = []
    mock_insert_response = MagicMock()
    mock_insert_response.data = [{"id": "user-uuid-123"}]
    mock_roles_response = MagicMock()
    mock_roles_response.data = [{"id": 1}]

    users_table_mock = MagicMock()
    roles_table_mock = MagicMock()
    user_roles_table_mock = MagicMock()

    def get_table_mock(table_name):
        if table_name == "users":
            return users_table_mock
        if table_name == "roles":
            return roles_table_mock
        if table_name == "user_roles":
            return user_roles_table_mock
        return MagicMock()

    mock_auth_db.app_client.table.side_effect = get_table_mock
    users_table_mock.select.return_value.eq.return_value.execute.return_value = mock_check_response
    users_table_mock.insert.return_value.execute.return_value = mock_insert_response
    users_table_mock.delete.return_value.eq.return_value.execute.return_value = MagicMock()
    roles_table_mock.select.return_value.eq.return_value.execute.return_value = mock_roles_response
    user_roles_table_mock.insert.return_value.execute.side_effect = RuntimeError("insert role failed")

    app.dependency_overrides[get_adaptive_db] = lambda: mock_auth_db
    try:
        response = await client.post(
            "/api/v1/auth/signup",
            json={
                "email": "newstudent@mentora.vn",
                "password": "Password123!",
                "full_name": "New Student",
                "mssv": "2A202611111",
            },
        )
        assert response.status_code == 503
        assert response.json()["detail"] == "Không thể gán vai trò cho tài khoản mới."
        users_table_mock.delete.return_value.eq.assert_called_once_with("id", "user-uuid-123")
        mock_auth_db.app_client.auth.admin.delete_user.assert_called_once_with("user-uuid-123")
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_signup_duplicate_email(client, mock_auth_db):
    # Setup duplicate check to return an existing user
    mock_check_response = MagicMock()
    mock_check_response.data = [{"id": "existing-uuid"}]

    table_mock = MagicMock()
    mock_auth_db.app_client.table.return_value = table_mock
    table_mock.select.return_value.eq.return_value.execute.return_value = mock_check_response

    app.dependency_overrides[get_adaptive_db] = lambda: mock_auth_db
    try:
        response = await client.post(
            "/api/v1/auth/signup",
            json={"email": "student@mentora.vn", "password": "Password123!", "full_name": "New Student"},
        )
        assert response.status_code == 409
        assert "Email này đã được đăng ký" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_signup_auth_provider_failure_is_sanitized(client, mock_auth_db):
    mock_check_response = MagicMock()
    mock_check_response.data = []
    table_mock = MagicMock()
    mock_auth_db.app_client.table.return_value = table_mock
    table_mock.select.return_value.eq.return_value.execute.return_value = mock_check_response
    mock_auth_db.app_client.auth.sign_up.side_effect = RuntimeError("provider secret leaked")

    app.dependency_overrides[get_adaptive_db] = lambda: mock_auth_db
    try:
        response = await client.post(
            "/api/v1/auth/signup",
            json={
                "email": "newstudent@mentora.vn",
                "password": "Password123!",
                "full_name": "New Student",
                "mssv": "2A202611111",
            },
        )
        assert response.status_code == 400
        assert response.json()["detail"] == "Đăng ký thất bại trên hệ thống Auth."
        assert "secret" not in response.text
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_signup_business_user_store_failure_returns_503(client, mock_auth_db):
    mock_check_response = MagicMock()
    mock_check_response.data = []
    table_mock = MagicMock()
    mock_auth_db.app_client.table.return_value = table_mock
    table_mock.select.return_value.eq.return_value.execute.return_value = mock_check_response
    table_mock.insert.return_value.execute.side_effect = RuntimeError("app user store unavailable")

    app.dependency_overrides[get_adaptive_db] = lambda: mock_auth_db
    try:
        response = await client.post(
            "/api/v1/auth/signup",
            json={
                "email": "newstudent@mentora.vn",
                "password": "Password123!",
                "full_name": "New Student",
                "mssv": "2A202611111",
            },
        )
        assert response.status_code == 503
        assert response.json()["detail"] == "Lỗi lưu trữ thông tin học viên."
        mock_auth_db.app_client.auth.admin.delete_user.assert_called_once()
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_memory_buffering_and_debounce(monkeypatch):
    import src.api.routes as routes_module
    from src.api.routes import buffer_and_update_student_memory

    # Mock Cache Store
    class DictCache:
        def __init__(self):
            self.store = {}

        def get(self, key):
            return self.store.get(key)

        def set(self, key, value, ttl=None):
            self.store[key] = value
            return True

        def delete(self, key):
            self.store.pop(key, None)
            return True

        def exists(self, key):
            return key in self.store

    fake_cache = DictCache()
    monkeypatch.setattr(routes_module, "get_cache_store", lambda: fake_cache)

    # Track calls to update_long_term_memories_job
    calls = []

    async def mock_update_job(student_id_str, turns):
        calls.append((student_id_str, turns))

    monkeypatch.setattr(routes_module, "update_long_term_memories_job", mock_update_job)

    # Background tasks mock
    class FakeBackgroundTasks:
        def __init__(self):
            self.tasks = []

        def add_task(self, func, *args, **kwargs):
            self.tasks.append((func, args, kwargs))

    # Test case 1: Buffering under BATCH_SIZE (no instant trigger, schedules debounce)
    student_id = "test-student-uuid"
    bg_tasks = FakeBackgroundTasks()

    await buffer_and_update_student_memory(student_id, "Hello", "Hi there", "concept-1", bg_tasks)

    # Should be in cache
    assert fake_cache.exists(f"student_chat_buffer:{student_id}")
    assert fake_cache.exists(f"student_chat_buffer_version:{student_id}")

    # Should schedule delayed flush
    assert len(bg_tasks.tasks) == 1
    assert bg_tasks.tasks[0][0].__name__ == "delayed_flush_memory_buffer"

    # Test case 2: Adding up to BATCH_SIZE (5 turns) triggers update immediately
    for i in range(4):
        await buffer_and_update_student_memory(student_id, f"Query {i}", f"Response {i}", "concept-1", bg_tasks)

    # Now len(buffer) == 5. Should have triggered update_long_term_memories_job immediately
    # And cleared the cache keys
    assert not fake_cache.exists(f"student_chat_buffer:{student_id}")

    # Find the job call in background tasks
    instant_job_calls = [t for t in bg_tasks.tasks if t[0] == mock_update_job]
    assert len(instant_job_calls) == 1
    # Check turns passed
    turns_arg = instant_job_calls[0][1][1]
    assert len(turns_arg) == 5
    assert turns_arg[0]["q"] == "Hello"
    assert turns_arg[4]["q"] == "Query 3"

    # Test case 3: Concept change triggers immediate flush
    bg_tasks_concept = FakeBackgroundTasks()
    # Add first turn under concept-1
    await buffer_and_update_student_memory(student_id, "Math query", "Math response", "concept-1", bg_tasks_concept)
    # Add second turn under concept-2 (changed!)
    await buffer_and_update_student_memory(
        student_id, "Science query", "Science response", "concept-2", bg_tasks_concept
    )
    # Should trigger update immediately due to concept change
    concept_job_calls = [t for t in bg_tasks_concept.tasks if t[0] == mock_update_job]
    assert len(concept_job_calls) == 1
    turns_concept = concept_job_calls[0][1][1]
    assert len(turns_concept) == 2
