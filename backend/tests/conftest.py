"""Pytest fixtures for backend tests."""

from __future__ import annotations

import os
import shutil
import tempfile

import pytest
from httpx import ASGITransport, AsyncClient

# Override storage path BEFORE importing app
_TEST_DATA = tempfile.mkdtemp(prefix="vaic_test_")
os.environ["STORAGE_PATH"] = _TEST_DATA
os.environ["APP_ENV"] = "test"
os.environ["DEBUG"] = "false"

from src.api.main import create_app  # noqa: E402


@pytest.fixture
def app():
    """Create a fresh app for each test."""
    return create_app()


@pytest.fixture
async def client(app):
    """Async HTTP client for testing."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture(autouse=True)
def clean_storage():
    """Clean test storage between tests."""
    yield
    # Clean up after test
    for subdir in ["uploads", "artifacts", "runs"]:
        p = os.path.join(_TEST_DATA, subdir)
        if os.path.exists(p):
            shutil.rmtree(p)
