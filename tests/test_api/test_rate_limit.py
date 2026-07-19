import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi import HTTPException
from src.main import app

# autouse fixture to reset storage
@pytest.fixture(autouse=True)
def reset_limiter_storage():
    try:
        from src.api.rate_limit import limiter
        if hasattr(limiter, "_limiter") and hasattr(limiter._limiter, "storage"):
            limiter._limiter.storage.reset()
    except Exception:
        pass

# Mock agent.ainvoke for /chat requests
@pytest.fixture(autouse=True)
def mock_chat_agent(monkeypatch):
    import src.agents.graph
    mock_ainvoke = AsyncMock(return_value={
        "response": "Mock agent response",
        "student_profile": None,
        "metadata": {"valid_citations": []},
        "timings_ms": {}
    })
    monkeypatch.setattr(src.agents.graph.agent, "ainvoke", mock_ainvoke)
    return mock_ainvoke

@pytest.mark.asyncio
async def test_chat_rate_limit_429(client, monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_ENABLED", "true")
    
    headers = {"Authorization": "Bearer d3b07384-d113-4ec5-a58e-0f2d87e07661"}
    # Send 20 requests
    for i in range(20):
        res = await client.post(
            "/api/v1/chat",
            json={
                "message": f"Hello {i}",
                "mode": "Explain",
                "student_id": "d3b07384-d113-4ec5-a58e-0f2d87e07661"
            },
            headers=headers
        )
        assert res.status_code == 200, f"Failed at request {i}: {res.text}"

    # Request 21 should return 429
    res = await client.post(
        "/api/v1/chat",
        json={
            "message": "Exceeded request",
            "mode": "Explain",
            "student_id": "d3b07384-d113-4ec5-a58e-0f2d87e07661"
        },
        headers=headers
    )
    assert res.status_code == 429
    assert "Too Many Requests" in res.json().get("detail", "")

@pytest.mark.asyncio
async def test_login_brute_force_429(client, monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_ENABLED", "true")
    
    # We send 5 login requests with the same email and IP
    # They should fail with 400/401, but not 429
    for i in range(5):
        res = await client.post(
            "/api/v1/auth/login",
            json={"email": "wrong@mentora.vn", "password": "wrongpassword"}
        )
        assert res.status_code != 429

    # The 6th request should fail with 429
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": "wrong@mentora.vn", "password": "wrongpassword"}
    )
    assert res.status_code == 429

@pytest.mark.asyncio
async def test_login_different_email_same_ip_not_blocked(client, monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_ENABLED", "true")
    
    # 5 failed login attempts for email A
    for i in range(5):
        res = await client.post(
            "/api/v1/auth/login",
            json={"email": "emaila@mentora.vn", "password": "wrongpassword"}
        )
        assert res.status_code != 429

    # 1 login attempt for email B (same IP) should NOT be blocked
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": "emailb@mentora.vn", "password": "wrongpassword"}
    )
    assert res.status_code != 429

@pytest.mark.asyncio
async def test_normal_request_not_blocked(client, monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_ENABLED", "true")
    
    # Send a few normal requests to different endpoints
    res = await client.get("/health")
    assert res.status_code == 200
    
    res = await client.get("/ready")
    assert res.status_code == 200

@pytest.mark.asyncio
async def test_429_has_retry_after_header(client, monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_ENABLED", "true")
    
    # Trigger 429 on signup (limit is 3/minute per IP)
    for i in range(3):
        res = await client.post(
            "/api/v1/auth/signup",
            json={"email": f"user{i}@mentora.vn", "password": "wrongpassword", "full_name": "Test User"}
        )
        assert res.status_code != 429

    res = await client.post(
        "/api/v1/auth/signup",
        json={"email": "final@mentora.vn", "password": "wrongpassword", "full_name": "Test User"}
    )
    assert res.status_code == 429
    assert "Retry-After" in res.headers
    assert int(res.headers["Retry-After"]) >= 0
    assert "detail" in res.json()

@pytest.mark.asyncio
async def test_redis_down_allows_request(client, monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_ENABLED", "true")
    
    # Mock limiter._limiter.hit to raise ConnectionError to simulate Redis down
    from src.api.rate_limit import limiter
    
    def mock_hit(*args, **kwargs):
        raise ConnectionError("Mocked Redis Connection Error")
        
    if hasattr(limiter, "_limiter"):
        monkeypatch.setattr(limiter._limiter, "hit", mock_hit)
        
    headers = {"Authorization": "Bearer d3b07384-d113-4ec5-a58e-0f2d87e07661"}
    res = await client.post(
        "/api/v1/chat",
        json={
            "message": "Hello failopen",
            "mode": "Explain",
            "student_id": "d3b07384-d113-4ec5-a58e-0f2d87e07661"
        },
        headers=headers
    )
    assert res.status_code == 200
