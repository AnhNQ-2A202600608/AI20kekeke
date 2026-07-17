import json
import logging
from unittest.mock import MagicMock

import pytest

from src.api import adaptive_routes
from src.api import routes as api_routes


def _sse_payloads(body: str, event_name: str) -> list[dict]:
    payloads = []
    current_event = None
    current_data = []
    for line in body.splitlines():
        if line.startswith("event: "):
            current_event = line.removeprefix("event: ").strip()
            current_data = []
        elif line.startswith("data: "):
            current_data.append(line.removeprefix("data: "))
        elif line == "" and current_event:
            if current_event == event_name:
                payloads.append(json.loads("\n".join(current_data)))
            current_event = None
            current_data = []
    return payloads


def _sse_event_names(body: str) -> list[str]:
    return [line.removeprefix("event: ").strip() for line in body.splitlines() if line.startswith("event: ")]


def _sse_events(body: str) -> list[tuple[str, dict]]:
    events = []
    current_event = None
    current_data = []
    for line in body.splitlines():
        if line.startswith("event: "):
            current_event = line.removeprefix("event: ").strip()
            current_data = []
        elif line.startswith("data: "):
            current_data.append(line.removeprefix("data: "))
        elif line == "" and current_event:
            events.append((current_event, json.loads("\n".join(current_data))))
            current_event = None
            current_data = []
    return events


@pytest.mark.asyncio
async def test_chat_stream_sse(client):
    response = await client.post(
        "/api/v1/chat",
        json={
            "message": "Explain vectors briefly",
            "stream": True,
        },
        headers={"Authorization": "Bearer service_role"},
    )

    assert response.status_code == 200
    assert "text/event-stream" in response.headers.get("content-type", "")
    body = response.text
    assert "event: analysis" in body
    assert "event: token" in body
    assert "event: done" in body
    assert "Mocked LLM response" in body
    event_names = _sse_event_names(body)
    assert event_names[0] == "thinking"
    assert event_names.index("thinking") < event_names.index("token")

    done_payload = _sse_payloads(body, "done")[-1]
    timings = done_payload["metadata"]["timings_ms"]
    assert set(timings).issubset({"total", "rag_embedding", "rag_vector_rpc", "llm_first_token", "llm_total"})
    for key in ["total", "llm_first_token", "llm_total"]:
        assert key in timings
        assert isinstance(timings[key], int | float)


@pytest.mark.asyncio
async def test_chat_stream_session_create_failure_emits_persistence_error(client, monkeypatch):
    db = MagicMock()
    db.create_chat_session.side_effect = RuntimeError("Unable to create chat session.")
    monkeypatch.setattr(adaptive_routes, "get_adaptive_db", lambda: db)

    response = await client.post(
        "/api/v1/chat",
        json={
            "message": "Explain vectors briefly",
            "stream": True,
            "student_id": "d3b07384-d113-4ec5-a58e-0f2d87e07661",
            "course_id": "00000000-0000-0000-0000-000000000001",
        },
        headers={"Authorization": "Bearer service_role"},
    )

    assert response.status_code == 200
    events = _sse_events(response.text)
    assert events[-1][0] == "error"
    assert events[-1][1]["code"] == "chat_persistence_unavailable"


@pytest.mark.asyncio
async def test_chat_stream_agent_failure_emits_sanitized_error(client, monkeypatch):
    import src.agents.graph as graph_module

    class FailingAgent:
        def astream_events(self, state, version):
            async def generator():
                raise RuntimeError("postgres://secret-host/internal")
                yield {}

            return generator()

    monkeypatch.setattr(graph_module, "agent", FailingAgent())

    response = await client.post(
        "/api/v1/chat",
        json={"message": "Explain vectors briefly", "stream": True},
        headers={"Authorization": "Bearer service_role"},
    )

    assert response.status_code == 200
    events = _sse_events(response.text)
    assert events[-1][0] == "error"
    assert events[-1][1]["code"] == api_routes.CHAT_PROCESSING_ERROR_CODE
    assert events[-1][1]["error"] == api_routes.CHAT_PROCESSING_ERROR
    assert "secret-host" not in response.text


@pytest.mark.asyncio
async def test_chat_stream_static_general_fast_path(client, caplog):
    caplog.set_level(logging.INFO, logger="src.api.routes")

    response = await client.post(
        "/api/v1/chat",
        json={
            "message": "xin chào bạn có thể giúp gì cho tôi",
            "stream": True,
        },
        headers={"Authorization": "Bearer service_role"},
    )

    assert response.status_code == 200
    body = response.text
    event_names = _sse_event_names(body)
    assert event_names == ["thinking", "token", "done"]
    assert "event: analysis" not in body

    done_payload = _sse_payloads(body, "done")[-1]
    assert done_payload["metadata"]["intent"] == "general"
    assert done_payload["metadata"]["timings_ms"]["llm_first_token"] == 0.0
    assert done_payload["metadata"]["timings_ms"]["llm_total"] == 0.0
    assert "giúp bạn học" in done_payload["response"]

    local_logs = [record.getMessage() for record in caplog.records if "AI_CHAT_LOCAL_TIMING" in record.getMessage()]
    assert local_logs
    payload = json.loads(local_logs[-1].split("AI_CHAT_LOCAL_TIMING ", 1)[1])
    assert payload["path"] == "chat.static_general"
    assert payload["fast_path"] is True
    assert payload["intent"] == "general"
    assert payload["timings_ms"]["llm_total"] == 0.0


@pytest.mark.asyncio
async def test_chat_stream_v1_header_static_general_fast_path(client):
    response = await client.post(
        "/api/v1/chat",
        json={
            "message": "xin chào bạn có thể giúp gì cho tôi",
            "stream": True,
        },
        headers={
            "Authorization": "Bearer service_role",
            "X-Agent-Chat-Protocol": "v1",
        },
    )

    assert response.status_code == 200
    body = response.text
    event_names = _sse_event_names(body)
    assert event_names == ["status", "text_delta", "done"]
    assert "event: token" not in body
    assert "event: thinking" not in body

    events = _sse_events(body)
    status_payload = events[0][1]
    text_payload = events[1][1]
    done_payload = events[2][1]

    assert status_payload["v"] == 1
    assert status_payload["seq"] == 1
    assert status_payload["event"] == "status"
    assert status_payload["stage"] == "route"

    assert text_payload["v"] == 1
    assert text_payload["seq"] == 2
    assert text_payload["event"] == "text_delta"
    assert "giúp bạn học" in text_payload["delta"]

    assert done_payload["v"] == 1
    assert done_payload["seq"] == 3
    assert done_payload["event"] == "done"
    assert done_payload["response"]["schemaVersion"] == "agent-chat.v1"
    assert done_payload["response"]["message"]["role"] == "assistant"
    assert "giúp bạn học" in done_payload["response"]["message"]["parts"][0]["text"]
    assert done_payload["response"]["metadata"]["intent"] == "general"


@pytest.mark.asyncio
async def test_chat_stream_v1_body_schema_version_static_general_fast_path(client):
    response = await client.post(
        "/api/v1/chat",
        json={
            "schemaVersion": "agent-chat.v1",
            "message": "xin chào bạn có thể giúp gì cho tôi",
            "stream": True,
        },
        headers={"Authorization": "Bearer service_role"},
    )

    assert response.status_code == 200
    body = response.text
    assert _sse_event_names(body) == ["status", "text_delta", "done"]


@pytest.mark.asyncio
async def test_chat_stream_practice_mode_without_topic_asks_clarification(client):
    response = await client.post(
        "/api/v1/chat",
        json={
            "message": "tạo câu hỏi ôn tập cho tôi",
            "mode": "Practice",
            "stream": True,
        },
        headers={"Authorization": "Bearer service_role"},
    )

    assert response.status_code == 200
    body = response.text
    event_names = _sse_event_names(body)
    assert event_names == ["thinking", "token", "done"]

    done_payload = _sse_payloads(body, "done")[-1]
    assert done_payload["metadata"]["intent"] == "clarify_practice_concept"
    assert done_payload["metadata"]["timings_ms"]["llm_total"] == 0.0
    assert "chủ đề" in done_payload["response"]
