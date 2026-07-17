import math
from datetime import UTC, datetime


def apply_forgetting_decay(
    p_stored: float, last_practiced_at: datetime | None, stability_days: float = 3.0, now: datetime | None = None
) -> float:
    """
    Tính p_effective dựa trên công thức Exponential Decay (đồng bộ với profile-utils.ts):
    p_effective = p_stored * e^(-0.1386 * delta_days)

    Args:
        p_stored: Xác suất mastery lưu trong DB
        last_practiced_at: Thời gian luyện tập cuối cùng
        stability_days: Được giữ lại để tương thích ngược nhưng không dùng
        now: Thời gian hiện tại để so sánh (mặc định là UTC now)

    Returns:
        p_effective được clamp trong [0.0001, 0.9999]
    """
    if last_practiced_at is None:
        return p_stored

    if now is None:
        now = datetime.now(UTC)

    # Đảm bảo đồng bộ timezone-aware / naive
    if last_practiced_at.tzinfo is not None and now.tzinfo is None:
        now = now.replace(tzinfo=UTC)
    elif last_practiced_at.tzinfo is None and now.tzinfo is not None:
        now = now.astimezone(None).replace(tzinfo=None)

    delta_time = now - last_practiced_at
    delta_days = delta_time.total_seconds() / 86400.0

    if delta_days <= 0:
        return p_stored

    # Tính decay theo công thức hàm mũ đơn giản (đồng bộ với frontend profile-utils.ts)
    decay_factor = math.exp(-0.1386 * delta_days)
    p_effective = p_stored * decay_factor

    # Clamp output trong [0.0001, 0.9999]
    return min(0.9999, max(0.0001, p_effective))


def update_stability(stability_days: float, actual_score: float, ease_factor: float = 2.0) -> float:
    """
    Cập nhật độ bền stability_days dựa trên điểm số thực tế của lần submit gần nhất.

    Args:
        stability_days: Giá trị stability hiện tại
        actual_score: Điểm số bài làm thực tế [0.0, 1.0]
        ease_factor: Hệ số kéo dài stability khi ôn tập thành công

    Returns:
        stability_days mới (giá trị float)
    """
    stability_val = float(stability_days)
    if actual_score >= 0.8:
        return stability_val * ease_factor
    elif actual_score < 0.5:
        # Giảm stability nhưng giữ tối thiểu là 1.0 ngày
        return max(1.0, stability_val * 0.5)
    else:
        return stability_val
