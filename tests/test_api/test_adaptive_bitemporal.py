from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from src.api.adaptive_routes import get_adaptive_db
from src.services.adaptive.supabase_database import SupabaseAdaptiveDatabase
from src.services.supabase_config import classify_supabase_key


def test_bitemporal_stub_mode_methods():
    """
    Test that bitemporal methods run successfully in stub mode and return default/expected values.
    """
    db = SupabaseAdaptiveDatabase(url="", key="")
    assert db._stub_mode is True

    student_id = uuid4()
    course_id = uuid4()
    concept_id = uuid4()

    # Test get_student_mastery_as_of in stub mode
    now = datetime.now(UTC)
    res = db.get_student_mastery_as_of(student_id, course_id, concept_id, now)
    assert res is not None
    assert res["elo_score"] == 1200.0
    assert res["bkt_mastery_probability"] == 0.25

    # Test save_student_mastery_bitemporal in stub mode (should not raise error)
    db.save_student_mastery_bitemporal(
        student_id=student_id,
        course_id=course_id,
        concept_id=concept_id,
        elo_score=1250.0,
        bkt_mastery_probability=0.35,
        mastery_state="learning",
        weakness_flag=False,
        attempt_count=1,
        correct_count=1,
        last_practiced_at=now,
        stability_days=3.0,
        valid_range=None,
    )


@pytest.mark.asyncio
async def test_real_database_bitemporal_integration():
    """
    Integration test for verifying PostgreSQL triggers, stored procedure and exclusion constraints.
    Skips if database URL is local or stub mode.
    """
    import os

    db = get_adaptive_db()
    if db._stub_mode or db.app_client is None:
        pytest.skip("Skipping real database bitemporal integration test in Stub Mode")

    # Verify if we have service_role privileges (required to write to student_concept_mastery table directly)
    is_service_role = False
    try:
        key = os.environ.get("SUPABASE_SECRET_KEY") or os.environ.get("SUPABASE_KEY")
        is_service_role = classify_supabase_key(key or "") == "legacy_service_role"
    except Exception:
        pass

    if not is_service_role:
        pytest.skip("Skipping database write integration test as it requires service_role key to bypass RLS policies.")

    # Generate IDs
    student_id = uuid4()
    course_id = uuid4()
    concept_id = uuid4()

    try:
        # 1. Setup prerequisite records
        db.app_client.table("users").insert(
            {
                "id": str(student_id),
                "email": f"test-bi-{student_id.hex[:6]}@example.com",
                "full_name": "Bitemporal Test Student",
            }
        ).execute()

        db.app_client.table("courses").insert(
            {
                "id": str(course_id),
                "code": f"test-bi-{course_id.hex[:6]}",
                "title": "Bitemporal Test Course",
            }
        ).execute()

        db.app_client.table("concepts").insert(
            {
                "id": str(concept_id),
                "course_id": str(course_id),
                "code": f"test-bi-{concept_id.hex[:6]}",
                "name": "Bitemporal Test Concept",
            }
        ).execute()

        # 2. Test standard sequential updates
        t0 = datetime.now(UTC) - timedelta(hours=2)

        # We manually insert a bitemporal record to simulate history start at t0
        db.app_client.table("student_mastery_bitemporal").insert(
            {
                "student_id": str(student_id),
                "course_id": str(course_id),
                "concept_id": str(concept_id),
                "elo_score": 1200.00,
                "bkt_mastery_probability": 0.2500,
                "mastery_state": "not_started",
                "weakness_flag": True,
                "attempt_count": 0,
                "correct_count": 0,
                "stability_days": 3.0,
                "valid_time": f"[{t0.isoformat()},)",
            }
        ).execute()

        # T1 update: standard update (writes to student_concept_mastery, which syncs to bitemporal)
        t1 = datetime.now(UTC) - timedelta(hours=1)
        db.app_client.table("student_concept_mastery").upsert(
            {
                "student_id": str(student_id),
                "course_id": str(course_id),
                "concept_id": str(concept_id),
                "elo_score": 1250.00,
                "bkt_mastery_probability": 0.3500,
                "mastery_state": "learning",
                "weakness_flag": False,
                "attempt_count": 1,
                "correct_count": 1,
                "stability_days": 6.0,
                "last_practiced_at": t1.isoformat(),
            }
        ).execute()

        # Verify historical querying "AS OF" T0 (should return Elo 1200)
        t_as_of_t0 = t0 + timedelta(minutes=10)
        mastery_t0 = db.get_student_mastery_as_of(student_id, course_id, concept_id, t_as_of_t0)
        assert mastery_t0 is not None
        assert float(mastery_t0["elo_score"]) == 1200.00
        assert float(mastery_t0["bkt_mastery_probability"]) == 0.2500

        # Verify historical querying "AS OF" T1 (should return Elo 1250)
        # Note: The sync trigger fn_sync_concept_mastery_to_bitemporal sets valid_time to start at now(),
        # so we query as of current time + 5s to hit the new range.
        t_as_of_t1 = datetime.now(UTC) + timedelta(seconds=5)
        mastery_t1 = db.get_student_mastery_as_of(student_id, course_id, concept_id, t_as_of_t1)
        assert mastery_t1 is not None
        assert float(mastery_t1["elo_score"]) == 1250.00
        assert float(mastery_t1["bkt_mastery_probability"]) == 0.3500

        # 3. Test Retroactive splits using Stored Procedure
        # We patch a past interval [t0 + 10 mins, t0 + 20 mins) with Elo 1300
        t_patch_start = t0 + timedelta(minutes=10)
        t_patch_end = t0 + timedelta(minutes=20)
        valid_range = f"[{t_patch_start.isoformat()}, {t_patch_end.isoformat()})"

        db.save_student_mastery_bitemporal(
            student_id=student_id,
            course_id=course_id,
            concept_id=concept_id,
            elo_score=1300.00,
            bkt_mastery_probability=0.5000,
            mastery_state="learning",
            weakness_flag=False,
            attempt_count=2,
            correct_count=2,
            last_practiced_at=t_patch_start,
            stability_days=4.0,
            valid_range=valid_range,
        )

        # Query during patch range (should return Elo 1300)
        t_during_patch = t0 + timedelta(minutes=15)
        mastery_patched = db.get_student_mastery_as_of(student_id, course_id, concept_id, t_during_patch)
        assert mastery_patched is not None
        assert float(mastery_patched["elo_score"]) == 1300.00
        assert float(mastery_patched["bkt_mastery_probability"]) == 0.5000

        # Query before patch range (should return Elo 1200)
        t_before_patch = t0 + timedelta(minutes=5)
        mastery_before = db.get_student_mastery_as_of(student_id, course_id, concept_id, t_before_patch)
        assert mastery_before is not None
        assert float(mastery_before["elo_score"]) == 1200.00

        # Query after patch range but before t1 (should return Elo 1200, which is the original range split)
        t_after_patch = t0 + timedelta(minutes=25)
        mastery_after = db.get_student_mastery_as_of(student_id, course_id, concept_id, t_after_patch)
        assert mastery_after is not None
        assert float(mastery_after["elo_score"]) == 1200.00

    finally:
        # Clean up database records
        try:
            db.app_client.table("student_mastery_bitemporal").delete().eq("student_id", str(student_id)).execute()
            db.app_client.table("student_concept_mastery").delete().eq("student_id", str(student_id)).execute()
            db.app_client.table("concepts").delete().eq("id", str(concept_id)).execute()
            db.app_client.table("courses").delete().eq("id", str(course_id)).execute()
            db.app_client.table("users").delete().eq("id", str(student_id)).execute()
        except Exception:
            pass


@pytest.mark.asyncio
async def test_get_student_mastery_history_endpoint(client):
    """
    Test GET /api/v1/student/mastery/history endpoint behavior under stub and mock modes.
    """
    from src.api.adaptive_routes import get_adaptive_db
    from src.main import app

    mock_db = MagicMock()
    mock_db._stub_mode = False

    # Mock response for get_student_mastery_as_of (time travel)
    mock_db.get_student_mastery_as_of.return_value = {
        "elo_score": 1250.0,
        "bkt_mastery_probability": 0.35,
        "mastery_state": "learning",
        "weakness_flag": False,
        "attempt_count": 1,
        "correct_count": 1,
        "stability_days": 3.0,
        "last_practiced_at": None,
    }

    # Mock response for student_mastery_bitemporal (full history list)
    mock_response = MagicMock()
    mock_response.data = [
        {
            "elo_score": 1250.0,
            "bkt_mastery_probability": 0.35,
            "mastery_state": "learning",
            "weakness_flag": False,
            "attempt_count": 1,
            "correct_count": 1,
            "stability_days": 3.0,
            "last_practiced_at": "2026-06-24T12:00:00Z",
            "valid_time": "[2026-06-24T12:00:00Z,)",
            "transaction_time": "[2026-06-24T12:00:00Z,)",
        }
    ]
    mock_db.app_client.table.return_value.select.return_value.eq.return_value.eq.return_value.eq.return_value.filter.return_value.execute.return_value = mock_response

    student_id = uuid4()
    course_id = uuid4()
    concept_id = uuid4()

    app.dependency_overrides[get_adaptive_db] = lambda: mock_db
    try:
        # Case 1: as_of parameter provided (returns single state)
        as_of_time = "2026-06-24T12:05:00+00:00"
        response = await client.get(
            "/api/v1/student/mastery/history",
            params={
                "student_id": str(student_id),
                "course_id": str(course_id),
                "concept_id": str(concept_id),
                "as_of": as_of_time,
            },
            headers={"Authorization": "Bearer service_role"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["elo_score"] == 1250.0

        # Case 2: as_of parameter not provided (returns historical list)
        response = await client.get(
            "/api/v1/student/mastery/history",
            params={
                "student_id": str(student_id),
                "course_id": str(course_id),
                "concept_id": str(concept_id),
            },
            headers={"Authorization": "Bearer service_role"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["elo_score"] == 1250.0
        assert data[0]["valid_time"] == "[2026-06-24T12:00:00Z,)"

        # Case 3: Invalid as_of parameter (returns 400)
        response = await client.get(
            "/api/v1/student/mastery/history",
            params={
                "student_id": str(student_id),
                "course_id": str(course_id),
                "concept_id": str(concept_id),
                "as_of": "invalid-time-format",
            },
            headers={"Authorization": "Bearer service_role"},
        )
        assert response.status_code == 400
        assert "không hợp lệ" in response.json()["detail"]

    finally:
        app.dependency_overrides.clear()
