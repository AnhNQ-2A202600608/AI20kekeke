from datetime import UTC, datetime, timedelta

from src.services.adaptive.forgetting import apply_forgetting_decay, update_stability


def test_apply_forgetting_decay_no_decay():
    # If last_practiced_at is None, return p_stored unchanged
    assert apply_forgetting_decay(0.85, None, 3.0) == 0.85

    # If delta_time is negative or 0, return p_stored unchanged
    now = datetime.now(UTC)
    assert apply_forgetting_decay(0.85, now, 3.0, now=now) == 0.85
    assert apply_forgetting_decay(0.85, now + timedelta(days=1), 3.0, now=now) == 0.85


def test_apply_forgetting_decay_with_decay():
    now = datetime.now(UTC)
    # 3 days ago -> factor = e^(-0.1386 * 3) = 0.6598 -> 0.80 * 0.6598 = 0.5278
    last_practiced = now - timedelta(days=3)
    result = apply_forgetting_decay(0.80, last_practiced, 3.0, now=now)
    assert abs(result - 0.5278) < 1e-3

    # 1.5 days ago -> factor = e^(-0.1386 * 1.5) = 0.8123 -> 0.80 * 0.8123 = 0.6498
    last_practiced = now - timedelta(days=1.5)
    result = apply_forgetting_decay(0.80, last_practiced, 3.0, now=now)
    assert abs(result - 0.6498) < 1e-3


def test_apply_forgetting_decay_clamps():
    now = datetime.now(UTC)
    # Long time ago -> decays below 0.0001 -> clamps to 0.0001
    last_practiced = now - timedelta(days=100)
    result = apply_forgetting_decay(0.80, last_practiced, 3.0, now=now)
    assert result == 0.0001


def test_update_stability():
    # Practice success (score >= 0.8) -> multiply by ease_factor (default 2.0)
    assert update_stability(3.0, 0.8) == 6.0
    assert update_stability(3.0, 1.0) == 6.0

    # Practice failure (score < 0.5) -> stability * 0.5, min 1.0
    assert update_stability(3.0, 0.0) == 1.5
    assert update_stability(1.5, 0.0) == 1.0

    # Practice borderline (0.5 <= score < 0.8) -> unchanged
    assert update_stability(3.0, 0.6) == 3.0
