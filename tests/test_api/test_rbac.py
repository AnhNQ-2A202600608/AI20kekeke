from unittest.mock import MagicMock, patch
from uuid import UUID

import pytest
from fastapi import HTTPException

from src.api.adaptive_routes import get_adaptive_db, get_current_user
from src.main import app


@pytest.fixture
def stub_db():
    db = MagicMock()
    db._stub_mode = True
    db.audit_client = None
    return db


def live_db():
    db = MagicMock()
    db._stub_mode = False
    db.app_client = MagicMock()
    db.supabase_url = "https://project.supabase.co"
    db.app_client.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
    return db


def test_live_auth_rejects_raw_uuid_token(monkeypatch):
    monkeypatch.delenv("AUTH_ALLOW_DEV_TOKENS", raising=False)
    db = live_db()

    with pytest.raises(HTTPException) as exc:
        get_current_user("Bearer d3b07384-d113-4ec5-a58e-0f2d87e07661", db)

    assert exc.value.status_code == 401
    db.app_client.auth.get_user.assert_not_called()


def test_live_auth_rejects_fake_token(monkeypatch):
    monkeypatch.delenv("AUTH_ALLOW_DEV_TOKENS", raising=False)
    db = live_db()

    with pytest.raises(HTTPException) as exc:
        get_current_user("Bearer fake-jwt-token-d3b07384-d113-4ec5-a58e-0f2d87e07661", db)

    assert exc.value.status_code == 401
    db.app_client.auth.get_user.assert_not_called()


def test_live_auth_accepts_supabase_jwt(monkeypatch):
    monkeypatch.delenv("AUTH_ALLOW_DEV_TOKENS", raising=False)
    db = live_db()
    db.app_client.auth.get_user.return_value.user.id = "d3b07384-d113-4ec5-a58e-0f2d87e07661"
    db.app_client.auth.get_user.return_value.user.email = "student@edugap.vn"

    user = get_current_user("Bearer header.payload.signature", db)

    assert user.id == UUID("d3b07384-d113-4ec5-a58e-0f2d87e07661")
    assert user.email == "student@edugap.vn"
    assert user.role == "student"


def test_live_auth_role_store_failure_returns_503(monkeypatch):
    monkeypatch.delenv("AUTH_ALLOW_DEV_TOKENS", raising=False)
    db = live_db()
    db.app_client.auth.get_user.return_value.user.id = "d3b07384-d113-4ec5-a58e-0f2d87e07661"
    db.app_client.auth.get_user.return_value.user.email = "student@edugap.vn"
    db.app_client.table.side_effect = RuntimeError("role store unavailable")

    with pytest.raises(HTTPException) as exc:
        get_current_user("Bearer header.payload.signature", db)

    assert exc.value.status_code == 503
    assert exc.value.detail == {
        "code": "role_store_unavailable",
        "message": "Không thể xác minh vai trò người dùng.",
    }


def test_service_role_bypass_requires_explicit_flag(monkeypatch):
    monkeypatch.setenv("AUTH_ALLOW_DEV_TOKENS", "true")
    monkeypatch.delenv("AUTH_ALLOW_SERVICE_ROLE_BYPASS", raising=False)
    db = live_db()

    with pytest.raises(HTTPException) as exc:
        get_current_user("Bearer service_role", db)

    assert exc.value.status_code == 401


def test_service_role_bypass_allows_only_with_flag(monkeypatch):
    monkeypatch.delenv("AUTH_ALLOW_DEV_TOKENS", raising=False)
    monkeypatch.setenv("AUTH_ALLOW_SERVICE_ROLE_BYPASS", "true")
    db = live_db()

    user = get_current_user("Bearer service_role", db)

    assert user.id == UUID("00000000-0000-0000-0000-000000000000")
    assert user.role == "dev"
    assert user.email == "service_role@system"


@pytest.mark.asyncio
async def test_public_endpoints_unauthorized(client, stub_db):
    app.dependency_overrides[get_adaptive_db] = lambda: stub_db
    try:
        # Chat without token
        response = await client.post(
            "/api/v1/chat",
            json={
                "message": "hello",
                "student_id": "d3b07384-d113-4ec5-a58e-0f2d87e07661",
                "course_id": "00000000-0000-0000-0000-000000000000",
            },
        )
        assert response.status_code == 401

        # History without token
        response = await client.get(
            "/api/v1/student/mastery/history",
            params={
                "student_id": "d3b07384-d113-4ec5-a58e-0f2d87e07661",
                "course_id": "00000000-0000-0000-0000-000000000000",
                "concept_id": "00000000-0000-0000-0000-000000000000",
            },
        )
        assert response.status_code == 401

        # Ingest without token
        response = await client.post("/api/v1/ingest/slides", json={})
        assert response.status_code == 401

        # Audit decisions without token
        response = await client.get("/api/v1/audit/decisions")
        assert response.status_code == 401
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_student_role_boundaries(client, stub_db):
    app.dependency_overrides[get_adaptive_db] = lambda: stub_db
    student_headers = {
        "Authorization": "Bearer d3b07384-d113-4ec5-a58e-0f2d87e07661"
    }  # maps to student role in stub mode
    try:
        # Student cannot chat for another student
        response = await client.post(
            "/api/v1/chat",
            json={
                "message": "hello",
                "student_id": "11111111-1111-1111-1111-111111111111",  # different student id
                "course_id": "00000000-0000-0000-0000-000000000000",
                "concept_id": "00000000-0000-0000-0000-000000000000",
            },
            headers=student_headers,
        )
        assert response.status_code == 403

        # Student cannot view history of another student
        response = await client.get(
            "/api/v1/student/mastery/history",
            params={
                "student_id": "11111111-1111-1111-1111-111111111111",  # different student id
                "course_id": "00000000-0000-0000-0000-000000000000",
                "concept_id": "00000000-0000-0000-0000-000000000000",
            },
            headers=student_headers,
        )
        assert response.status_code == 403

        # Student cannot ingest slides
        response = await client.post("/api/v1/ingest/slides", json={"target_filter": "Docker"}, headers=student_headers)
        assert response.status_code == 403

        # Student cannot read audit decisions
        response = await client.get("/api/v1/audit/decisions", headers=student_headers)
        assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_mentor_role_boundaries(client, stub_db):
    app.dependency_overrides[get_adaptive_db] = lambda: stub_db
    mentor_headers = {"Authorization": "Bearer 55555555-5555-5555-5555-555555555555"}  # maps to mentor role
    try:
        # Mentor can view student's history
        response = await client.get(
            "/api/v1/student/mastery/history",
            params={
                "student_id": "d3b07384-d113-4ec5-a58e-0f2d87e07661",  # student id
                "course_id": "00000000-0000-0000-0000-000000000000",
                "concept_id": "00000000-0000-0000-0000-000000000000",
            },
            headers=mentor_headers,
        )
        assert response.status_code == 200  # returns mock list

        # Mentor can trigger slide ingestion (mock ingest_slides to avoid side effects/crashes)
        with patch("src.pipeline.ingest.rag_ingestion.ingest_slides") as mock_ingest:
            response = await client.post(
                "/api/v1/ingest/slides", json={"target_filter": "Docker"}, headers=mentor_headers
            )
            assert response.status_code == 202
            assert response.json()["status"] == "accepted"
            mock_ingest.assert_called_once_with("Docker")

        # Mentor cannot view audit decisions
        response = await client.get("/api/v1/audit/decisions", headers=mentor_headers)
        assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_admin_and_dev_role_boundaries(client, stub_db):
    app.dependency_overrides[get_adaptive_db] = lambda: stub_db
    admin_headers = {"Authorization": "Bearer 77777777-7777-7777-7777-777777777777"}
    dev_headers = {"Authorization": "Bearer 11111111-1111-1111-1111-111111111111"}
    try:
        # Admin can view audit decisions
        response = await client.get("/api/v1/audit/decisions", headers=admin_headers)
        assert response.status_code == 200
        assert response.json() == []

        # Dev can view audit rewards
        response = await client.get("/api/v1/audit/rewards", headers=dev_headers)
        assert response.status_code == 200
        assert response.json() == []
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_audit_log_store_failures_return_503(client, monkeypatch):
    monkeypatch.setenv("AUTH_ALLOW_SERVICE_ROLE_BYPASS", "true")
    db = MagicMock()
    db._stub_mode = False
    db.app_client = MagicMock()
    db.audit_client = MagicMock()
    db.audit_client.table.side_effect = RuntimeError("audit schema unavailable")

    app.dependency_overrides[get_adaptive_db] = lambda: db
    headers = {"Authorization": "Bearer service_role"}
    try:
        decisions = await client.get("/api/v1/audit/decisions", headers=headers)
        rewards = await client.get("/api/v1/audit/rewards", headers=headers)

        assert decisions.status_code == 503
        assert decisions.json()["detail"] == "Không thể tải dữ liệu audit decisions."
        assert rewards.status_code == 503
        assert rewards.json()["detail"] == "Không thể tải dữ liệu audit rewards."
    finally:
        app.dependency_overrides.clear()
