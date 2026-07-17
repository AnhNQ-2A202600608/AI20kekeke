from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock

import pytest

from src.api.adaptive_routes import get_adaptive_db
from src.main import app
from src.services.braintrust_dashboard import clear_braintrust_dashboard_cache, summarize_braintrust_events


@pytest.fixture
def stub_db():
    db = MagicMock()
    db._stub_mode = True
    db.app_client = None
    return db


@pytest.fixture(autouse=True)
def clear_braintrust_cache():
    clear_braintrust_dashboard_cache()
    yield
    clear_braintrust_dashboard_cache()


def sample_events():
    now = datetime.now(UTC)
    created_at = [
        (now - timedelta(minutes=3)).isoformat().replace("+00:00", "Z"),
        (now - timedelta(minutes=2)).isoformat().replace("+00:00", "Z"),
        (now - timedelta(minutes=1)).isoformat().replace("+00:00", "Z"),
    ]
    return [
        {
            "id": "evt-1",
            "created": created_at[0],
            "root_span_id": "root-1",
            "span_id": "span-1",
            "span_attributes": {"name": "analyze"},
            "metadata": {"agent_name": "coach-agent"},
            "metrics": {"start": 10.0, "end": 11.0, "input_tokens": 10, "output_tokens": 20, "cost": 0.001},
            "scores": {"helpfulness": 0.8},
            "error": None,
        },
        {
            "id": "evt-2",
            "created": created_at[1],
            "root_span_id": "root-1",
            "span_id": "span-2",
            "span_attributes": {"name": "rag.retrieve"},
            "metadata": {"agent_name": "coach-agent", "type": "tool"},
            "metrics": {"duration_ms": 250.0},
            "scores": {"helpfulness": 0.6},
            "error": {"message": "retrieval failed"},
        },
        {
            "id": "evt-3",
            "created": created_at[2],
            "root_span_id": "root-2",
            "span_id": "span-3",
            "span_attributes": {"name": "respond_academic"},
            "metadata": {"agent_name": "answer-agent", "type": "llm"},
            "metrics": {"duration_ms": 500.0},
            "scores": {},
            "error": None,
        },
    ]


def test_summarize_braintrust_events_handles_empty_scores():
    events = sample_events()
    for event in events:
        event["scores"] = {}
    summary = summarize_braintrust_events(
        events,
        limit=200,
        api_url="https://api.braintrust.dev",
        project_id="project-1",
    )

    assert summary.overview.events == 3
    assert summary.overview.traces == 2
    assert summary.overview.errors == 1
    assert summary.overview.score_events == 0
    assert summary.score_status.configured is False
    assert summary.score_status.message == "No Braintrust evaluator scores configured."
    assert summary.errors[0].detail_link is not None
    assert "project-1" in summary.errors[0].detail_link
    assert "root-1" in summary.errors[0].detail_link
    assert summary.agents.agents
    assert summary.usage.total_tokens == 30
    assert summary.review_queue.items


def test_summarize_braintrust_events_builds_six_dashboards():
    summary = summarize_braintrust_events(
        sample_events(),
        limit=200,
        api_url="https://api.braintrust.dev",
        project_id="project-1",
    )

    assert summary.executive.overview.events == 3
    assert summary.agents.agents[0].name == "coach-agent"
    assert summary.agents.top_tools[0].name == "rag.retrieve"
    assert summary.scores.status.configured is True
    assert summary.scores.metrics[0].name == "helpfulness"
    assert summary.incidents.error_count == 1
    assert summary.usage.available is True
    assert summary.review_queue.items


@pytest.mark.asyncio
async def test_admin_braintrust_summary_requires_admin_or_btc(client, stub_db, monkeypatch):
    app.dependency_overrides[get_adaptive_db] = lambda: stub_db
    monkeypatch.setattr(
        "src.services.braintrust_dashboard.fetch_braintrust_events",
        lambda **_: sample_events(),
    )
    monkeypatch.setenv("BRAINTRUST_API_URL", "https://api.braintrust.dev")
    monkeypatch.setenv("BRAINTRUST_API_KEY", "test-key")
    monkeypatch.setenv("BRAINTRUST_PROJECT_ID", "project-1")
    try:
        response = await client.get(
            "/api/v1/admin/braintrust/summary",
            headers={"Authorization": "Bearer d3b07384-d113-4ec5-a58e-0f2d87e07661"},
        )
        assert response.status_code == 403

        response = await client.get(
            "/api/v1/admin/braintrust/summary",
            headers={"Authorization": "Bearer 77777777-7777-7777-7777-777777777777"},
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload["overview"]["events"] == 3
        assert payload["score_status"]["configured"] is True
        assert payload["agents"]["agents"]
        assert payload["usage"]["available"] is True
        assert "test-key" not in str(payload)

        response = await client.get(
            "/api/v1/admin/braintrust/summary",
            headers={"Authorization": "Bearer 88888888-8888-8888-8888-888888888888"},
        )
        assert response.status_code == 200
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_admin_braintrust_dashboard_endpoints_and_cache(client, stub_db, monkeypatch):
    app.dependency_overrides[get_adaptive_db] = lambda: stub_db
    calls = {"count": 0}

    def fake_fetch(**_):
        calls["count"] += 1
        return sample_events()

    monkeypatch.setattr("src.services.braintrust_dashboard.fetch_braintrust_events", fake_fetch)
    monkeypatch.setenv("BRAINTRUST_API_URL", "https://api.braintrust.dev")
    monkeypatch.setenv("BRAINTRUST_API_KEY", "test-key")
    monkeypatch.setenv("BRAINTRUST_PROJECT_ID", "project-1")
    headers = {"Authorization": "Bearer 77777777-7777-7777-7777-777777777777"}
    try:
        first = await client.get("/api/v1/admin/braintrust/summary", headers=headers)
        second = await client.get("/api/v1/admin/braintrust/summary", headers=headers)
        assert first.status_code == 200
        assert second.status_code == 200
        assert calls["count"] == 1
        assert second.json()["meta"]["cached"] is True

        for path in ("overview", "agents", "scores", "errors", "usage", "review-queue"):
            response = await client.get(f"/api/v1/admin/braintrust/{path}", headers=headers)
            assert response.status_code == 200

        refresh = await client.post("/api/v1/admin/braintrust/refresh", headers=headers)
        assert refresh.status_code == 200
        assert refresh.json()["meta"]["data_source"] in {"braintrust", "cache_rate_limited"}
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_admin_braintrust_summary_missing_env_returns_503(client, stub_db, monkeypatch):
    app.dependency_overrides[get_adaptive_db] = lambda: stub_db
    monkeypatch.delenv("BRAINTRUST_API_URL", raising=False)
    monkeypatch.delenv("BRAINTRUST_API_KEY", raising=False)
    monkeypatch.delenv("BRAINTRUST_PROJECT_ID", raising=False)
    try:
        response = await client.get(
            "/api/v1/admin/braintrust/summary",
            headers={"Authorization": "Bearer 77777777-7777-7777-7777-777777777777"},
        )
        assert response.status_code == 503
        assert response.json()["detail"] == "Braintrust dashboard is not configured."
    finally:
        app.dependency_overrides.clear()
