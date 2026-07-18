import json
import os
import statistics
import time
from pathlib import Path

import httpx
import pytest

try:
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parents[2] / ".env")
except Exception:
    pass

from supabase import create_client
from supabase.client import ClientOptions

from src.services.supabase_config import get_backend_supabase_config

DEFAULT_FRONTEND_SLUG = "d1-ai-llm-foundations"
DEFAULT_CONCEPT_ID = "597ff89c-f60d-5521-b5e2-6baf78a59252"
DEFAULT_COURSE_ID = "00000000-0000-0000-0000-000000000001"


def _supabase_url() -> str:
    return (
        os.getenv("SUPABASE_URL")
        or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        or os.getenv("NEXT_PUBLIC_SUPABASE_URL_DEV")
        or os.getenv("NEXT_PUBLIC_SUPABASE_URL_PROD")
        or ""
    )


def _supabase_key() -> str:
    config = get_backend_supabase_config(allow_stub=True)
    return config.secret_key


@pytest.mark.asyncio
async def test_live_frontend_questions_endpoint_returns_supabase_questions():
    if os.getenv("RUN_REAL_SUPABASE_VALIDATION") != "1":
        pytest.skip("Set RUN_REAL_SUPABASE_VALIDATION=1 to run live Supabase frontend validation.")

    frontend_base_url = os.getenv("FRONTEND_BASE_URL", "").rstrip("/")
    if not frontend_base_url:
        pytest.skip("Set FRONTEND_BASE_URL, e.g. http://localhost:3000, to validate Next questions endpoint.")

    url = _supabase_url()
    key = _supabase_key()
    if not url or not key:
        pytest.skip("Supabase env vars are missing.")

    slug = os.getenv("REAL_FRONTEND_QUESTION_SLUG", DEFAULT_FRONTEND_SLUG)
    concept_id = os.getenv("REAL_FRONTEND_CONCEPT_ID", DEFAULT_CONCEPT_ID)
    course_id = os.getenv("REAL_FRONTEND_COURSE_ID", DEFAULT_COURSE_ID)
    repetitions = int(os.getenv("REAL_FRONTEND_REPETITIONS", "3"))

    app_client = create_client(url, key, options=ClientOptions(schema="app"))
    direct_rows = (
        app_client.table("questions")
        .select("id, prompt, answer_key")
        .eq("course_id", course_id)
        .eq("concept_id", concept_id)
        .eq("calibration_status", "published")
        .execute()
        .data
        or []
    )
    direct_by_id = {row["id"]: row for row in direct_rows}
    assert len(direct_by_id) > 1, "Live validation needs multiple published DB questions."

    latencies_ms: list[float] = []
    last_payload = None
    async with httpx.AsyncClient(base_url=frontend_base_url, timeout=45.0) as client:
        for _ in range(repetitions):
            start = time.perf_counter()
            response = await client.get(f"/api/questions/{slug}")
            latencies_ms.append((time.perf_counter() - start) * 1000)
            assert response.status_code == 200, response.text
            last_payload = response.json()

    assert last_payload is not None
    assert last_payload["id"] == slug
    returned_questions = last_payload.get("questions") or []
    returned_by_id = {question["id"]: question for question in returned_questions}
    assert len(returned_by_id) == len(direct_by_id)
    assert set(returned_by_id) == set(direct_by_id)

    sample_id = sorted(returned_by_id)[0]
    assert returned_by_id[sample_id]["question"] == direct_by_id[sample_id]["prompt"]
    assert returned_by_id[sample_id].get("options") == direct_by_id[sample_id]["answer_key"].get("options")
    assert returned_by_id[sample_id].get("answer") == direct_by_id[sample_id]["answer_key"].get("correct")

    summary = {
        "source": "supabase",
        "frontend_base_url": frontend_base_url,
        "slug": slug,
        "course_id": course_id,
        "concept_id": concept_id,
        "published_question_count": len(direct_by_id),
        "returned_question_count": len(returned_by_id),
        "sample_question_id": sample_id,
        "latency_ms": {
            "min": round(min(latencies_ms), 1),
            "median": round(statistics.median(latencies_ms), 1),
            "mean": round(statistics.mean(latencies_ms), 1),
            "max": round(max(latencies_ms), 1),
            "runs": [round(value, 1) for value in latencies_ms],
        },
    }
    print("REAL_FRONTEND_QUESTIONS_VALIDATION=" + json.dumps(summary, ensure_ascii=False, sort_keys=True))
