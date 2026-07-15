"""Unit tests for Phase 4: Shared Technical Services."""

from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path
from unittest.mock import AsyncMock, patch

import httpx
import pytest

from src.core.data_loader import load_csv, load_json, load_txt, profile_data
from src.core.errors import NotFoundError, ProviderError, ValidationError
from src.core.evaluation import EvaluationRunner
from src.core.http_client import HttpIntegrationClient, redact_headers
from src.core.logging import SecretRedactingFilter
from src.core.run_manager import RunStateManger
from src.storage import local as storage


@pytest.fixture
def temp_dir():
    with tempfile.TemporaryDirectory() as td:
        yield Path(td)


# ── Data Loaders ─────────────────────────────────────────────────────────────


def test_txt_loader(temp_dir):
    txt_file = temp_dir / "sample.txt"
    txt_file.write_text("Hello, VAIC!", encoding="utf-8")
    assert load_txt(txt_file) == "Hello, VAIC!"

    with pytest.raises(ValidationError):
        load_txt(temp_dir / "nonexistent.txt")


def test_json_loader(temp_dir):
    json_file = temp_dir / "sample.json"
    json_file.write_text(json.dumps({"a": 1, "b": 2}), encoding="utf-8")

    # Valid load
    data = load_json(json_file, required_keys=["a"])
    assert data["a"] == 1

    # Missing keys
    with pytest.raises(ValidationError) as exc:
        load_json(json_file, required_keys=["a", "c"])
    assert "Missing required JSON keys" in str(exc.value)


def test_csv_loader(temp_dir):
    csv_file = temp_dir / "sample.csv"
    csv_file.write_text("id,name,age\n1,Alice,20\n2,Bob,25\n", encoding="utf-8")

    # Valid load
    rows = load_csv(csv_file, required_headers=["id", "name"])
    assert len(rows) == 2
    assert rows[0]["name"] == "Alice"

    # Missing header column
    with pytest.raises(ValidationError):
        load_csv(csv_file, required_headers=["salary"])


def test_data_profiler():
    records = [
        {"name": "Alice", "score": 90, "city": "Hanoi"},
        {"name": "Bob", "score": 85, "city": ""},
        {"name": "Charlie", "score": None, "city": "HCM"},
    ]
    profile = profile_data(records)
    assert profile["row_count"] == 3
    assert "name" in profile["columns"]
    assert profile["missing_values"]["city"] == 1  # Bob city is blank
    assert profile["missing_values"]["score"] == 1  # Charlie score is None


# ── HTTP Client & Secret Redaction ───────────────────────────────────────────


def test_header_redaction():
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer sk-1234567890abcdef",
        "API-Key": "secret123",
    }
    redacted = redact_headers(headers)
    assert redacted["Content-Type"] == "application/json"
    assert redacted["Authorization"] == "[REDACTED]"
    assert redacted["API-Key"] == "[REDACTED]"


@pytest.mark.asyncio
async def test_http_client_success():
    client = HttpIntegrationClient(base_url="https://api.mock.test")

    # Mock httpx.AsyncClient.request with associated request object
    mock_req = httpx.Request("GET", "https://api.mock.test/v1/data")
    mock_resp = httpx.Response(200, json={"status": "ok"}, request=mock_req)

    with patch("httpx.AsyncClient.request", new_callable=AsyncMock) as mock_request:
        mock_request.return_value = mock_resp
        resp = await client.request("GET", "/v1/data")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"
        mock_request.assert_called_once()


@pytest.mark.asyncio
async def test_http_client_failure_error_mapping():
    client = HttpIntegrationClient(base_url="https://api.mock.test", max_retries=1)

    # Mock httpx.AsyncClient.request returning 400 with associated request object
    mock_req = httpx.Request("POST", "https://api.mock.test/v1/submit")
    mock_resp = httpx.Response(400, text="Bad parameters", request=mock_req)

    with patch("httpx.AsyncClient.request", new_callable=AsyncMock) as mock_request:
        mock_request.return_value = mock_resp
        with pytest.raises(ProviderError) as exc:
            await client.request("POST", "/v1/submit")
        assert "Status 400" in str(exc.value)


# ── Run States Transitions ───────────────────────────────────────────────────


def test_run_transitions():
    # Valid transition
    RunStateManger.validate_transition("queued", "running")
    RunStateManger.validate_transition("running", "completed")

    # Invalid transitions
    with pytest.raises(ValidationError):
        RunStateManger.validate_transition("completed", "running")
    with pytest.raises(ValidationError):
        RunStateManger.validate_transition("failed", "completed")


# ── Evaluation ────────────────────────────────────────────────────────────────


def test_evaluation_report_generation(temp_dir):
    runner = EvaluationRunner()

    # Mock run records with durations
    run_records = [
        {
            "run_id": "run-1",
            "capability": "test",
            "status": "completed",
            "started_at": "2026-07-15T00:00:00Z",
            "completed_at": "2026-07-15T00:00:01Z",
        },
        {
            "run_id": "run-2",
            "capability": "test",
            "status": "failed",
            "started_at": "2026-07-15T00:00:00Z",
            "completed_at": "2026-07-15T00:00:02Z",
        },
    ]

    report = runner.generate_report(run_records)
    assert report.total_runs == 2
    assert report.successful_runs == 1
    assert report.failed_runs == 1
    assert report.success_rate == 0.5
    assert report.error_rate == 0.5
    assert report.average_duration_ms == 1500.0  # (1s + 2s)/2

    # Write files
    runner.write_reports(report, temp_dir, "test_eval")
    assert (temp_dir / "test_eval_report.json").exists()
    assert (temp_dir / "test_eval_report.md").exists()


# ── Security Base & Storage Guards ───────────────────────────────────────────


def test_storage_allowlist_enforcement(temp_dir):
    # Setup test directories
    os.environ["STORAGE_PATH"] = str(temp_dir)

    # Save a valid .csv file
    meta = storage.save_upload("test.csv", b"a,b,c")
    assert meta["file_id"] is not None
    assert meta["checksum_sha256"] == storage.calculate_sha256(b"a,b,c")

    # Trying to upload an unauthorized file extension (.exe)
    with pytest.raises(ValidationError) as exc:
        storage.save_upload("malware.exe", b"binary payload")
    assert "not allowed" in str(exc.value)


def test_storage_path_traversal_protection(temp_dir):
    os.environ["STORAGE_PATH"] = str(temp_dir)

    # Traversal file ids must fail path relative_to assertion checks
    with pytest.raises(NotFoundError):
        storage.get_file_meta("../../../etc/passwd")


def test_log_secrets_redaction():
    filt = SecretRedactingFilter()

    # Test OpenAI Key Redaction
    log_text = "Connecting with key: sk-abcdefghijklmnopqrstuvwxyz12345678"
    redacted = filt.redact(log_text)
    assert "sk-abcdefghijklmnopqrstuvwxyz12345678" not in redacted
    assert "[REDACTED]" in redacted

    # Test Bearer Token Redaction
    auth_header = "Authorization: Bearer mySecretToken123xyz"
    redacted_auth = filt.redact(auth_header)
    assert "mySecretToken123xyz" not in redacted_auth
    assert "[REDACTED]" in redacted_auth
