"""Smoke test — end-to-end flow: upload → run → artifact."""

from __future__ import annotations

import io

import pytest


@pytest.mark.asyncio
async def test_full_pipeline(client):
    """End-to-end: upload file → create run with file → verify artifact content."""
    # 1. Upload a file
    text = "The quick brown fox jumps over the lazy dog. Fox fox fox."
    r_upload = await client.post(
        "/api/v1/files",
        files={"file": ("sample.txt", io.BytesIO(text.encode()), "text/plain")},
    )
    assert r_upload.status_code == 200
    file_id = r_upload.json()["data"]["file_id"]

    # 2. Create a run using the uploaded file
    r_run = await client.post(
        "/api/v1/runs",
        json={
            "capability": "example_transform",
            "parameters": {"uppercase": True},
            "input_file_ids": [file_id],
        },
    )
    assert r_run.status_code == 200
    run_data = r_run.json()["data"]
    assert run_data["status"] == "completed"
    assert run_data["capability"] == "example_transform"
    assert len(run_data["artifact_ids"]) == 1
    assert run_data["error"] is None

    artifact_id = run_data["artifact_ids"][0]

    # 3. Retrieve the artifact
    r_art = await client.get(f"/api/v1/artifacts/{artifact_id}")
    assert r_art.status_code == 200
    art_data = r_art.json()["data"]
    assert "Text Analysis Report" in art_data["content"]
    assert "Uppercase" in art_data["content"]

    # 4. Verify run can be retrieved
    r_run2 = await client.get(f"/api/v1/runs/{run_data['run_id']}")
    assert r_run2.status_code == 200
    assert r_run2.json()["data"]["status"] == "completed"

    # 5. Verify file metadata
    r_file = await client.get(f"/api/v1/files/{file_id}")
    assert r_file.status_code == 200
    assert r_file.json()["data"]["original_name"] == "sample.txt"
