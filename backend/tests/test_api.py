"""Unit tests for core API endpoints."""

from __future__ import annotations

import io

import pytest


@pytest.mark.asyncio
async def test_health(client):
    r = await client.get("/api/v1/health")
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    assert body["data"]["status"] == "healthy"


@pytest.mark.asyncio
async def test_ready(client):
    r = await client.get("/api/v1/ready")
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    assert body["data"]["status"] == "ready"


@pytest.mark.asyncio
async def test_capabilities_list(client):
    r = await client.get("/api/v1/capabilities")
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    caps = body["data"]
    assert isinstance(caps, list)
    assert len(caps) >= 1
    names = [c["name"] for c in caps]
    assert "example_transform" in names


@pytest.mark.asyncio
async def test_upload_file(client):
    content = b"Hello, VAIC Universal Starter!"
    r = await client.post(
        "/api/v1/files",
        files={"file": ("test.txt", io.BytesIO(content), "text/plain")},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    assert body["data"]["original_name"] == "test.txt"
    assert body["data"]["size_bytes"] == len(content)
    assert "file_id" in body["data"]


@pytest.mark.asyncio
async def test_get_file_metadata(client):
    # Upload first
    content = b"test content"
    r1 = await client.post(
        "/api/v1/files",
        files={"file": ("data.csv", io.BytesIO(content), "text/csv")},
    )
    file_id = r1.json()["data"]["file_id"]

    # Retrieve
    r2 = await client.get(f"/api/v1/files/{file_id}")
    assert r2.status_code == 200
    body = r2.json()
    assert body["success"] is True
    assert body["data"]["file_id"] == file_id
    assert body["data"]["original_name"] == "data.csv"


@pytest.mark.asyncio
async def test_get_file_not_found(client):
    r = await client.get("/api/v1/files/nonexistent-id")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_create_run_with_text(client):
    r = await client.post(
        "/api/v1/runs",
        json={
            "capability": "example_transform",
            "parameters": {"text": "Hello world, this is a test of the system."},
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    run = body["data"]
    assert run["status"] == "completed"
    assert run["capability"] == "example_transform"
    assert len(run["artifact_ids"]) == 1


@pytest.mark.asyncio
async def test_create_run_unknown_capability(client):
    r = await client.post(
        "/api/v1/runs",
        json={"capability": "nonexistent", "parameters": {}},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is False
    assert body["error"]["code"] == "NOT_FOUND"


@pytest.mark.asyncio
async def test_create_run_missing_capability(client):
    r = await client.post("/api/v1/runs", json={"parameters": {}})
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is False
    assert body["error"]["code"] == "VALIDATION_ERROR"


@pytest.mark.asyncio
async def test_get_run(client):
    # Create a run
    r1 = await client.post(
        "/api/v1/runs",
        json={
            "capability": "example_transform",
            "parameters": {"text": "Test run retrieval."},
        },
    )
    run_id = r1.json()["data"]["run_id"]

    # Retrieve it
    r2 = await client.get(f"/api/v1/runs/{run_id}")
    assert r2.status_code == 200
    body = r2.json()
    assert body["success"] is True
    assert body["data"]["run_id"] == run_id


@pytest.mark.asyncio
async def test_get_artifact(client):
    # Create a run that produces artifacts
    r1 = await client.post(
        "/api/v1/runs",
        json={
            "capability": "example_transform",
            "parameters": {"text": "Artifact test content here."},
        },
    )
    artifact_id = r1.json()["data"]["artifact_ids"][0]

    # Retrieve artifact
    r2 = await client.get(f"/api/v1/artifacts/{artifact_id}")
    assert r2.status_code == 200
    body = r2.json()
    assert body["success"] is True
    assert "content" in body["data"]
    assert "Text Analysis Report" in body["data"]["content"]


@pytest.mark.asyncio
async def test_run_with_file_input(client):
    # Upload a file
    content = b"This is file content for analysis with multiple words and lines."
    r1 = await client.post(
        "/api/v1/files",
        files={"file": ("input.txt", io.BytesIO(content), "text/plain")},
    )
    file_id = r1.json()["data"]["file_id"]

    # Run with file input
    r2 = await client.post(
        "/api/v1/runs",
        json={
            "capability": "example_transform",
            "parameters": {},
            "input_file_ids": [file_id],
        },
    )
    assert r2.status_code == 200
    body = r2.json()
    assert body["success"] is True
    assert body["data"]["status"] == "completed"
    assert len(body["data"]["artifact_ids"]) == 1


@pytest.mark.asyncio
async def test_error_envelope_structure(client):
    """Verify error responses match the error envelope spec."""
    r = await client.post("/api/v1/runs", json={"parameters": {}})
    body = r.json()
    assert "success" in body
    assert "data" in body
    assert "error" in body
    assert "meta" in body
    assert body["success"] is False
    assert body["data"] is None
    err = body["error"]
    assert "code" in err
    assert "message" in err
    assert "retryable" in err
    assert "details" in err
    assert "request_id" in body["meta"]
