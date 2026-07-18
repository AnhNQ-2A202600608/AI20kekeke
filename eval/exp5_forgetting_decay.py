import csv
import os
from datetime import UTC, datetime, timedelta
from typing import Any

from src.services.adaptive.forgetting import apply_forgetting_decay, update_stability


def run_forgetting_evaluation() -> dict[str, Any]:
    # 1. Test case 1: apply_forgetting_decay exact calculations
    # stability_days = 4.0, p_stored = 0.80
    last_practiced = datetime.now(UTC)

    # 0 days decay
    p_eff_0d = apply_forgetting_decay(0.80, last_practiced, 4.0, now=last_practiced)
    # 2 days decay (delta_days = 2.0 -> decay = 2^(-0.5) = 0.707106 -> p_eff = 0.5657)
    now_2d = last_practiced + timedelta(days=2)
    p_eff_2d = apply_forgetting_decay(0.80, last_practiced, 4.0, now=now_2d)
    # 4 days decay (delta_days = 4.0 -> decay = 2^(-1) = 0.5 -> p_eff = 0.4000)
    now_4d = last_practiced + timedelta(days=4)
    p_eff_4d = apply_forgetting_decay(0.80, last_practiced, 4.0, now=now_4d)
    # 8 days decay (delta_days = 8.0 -> decay = 2^(-2) = 0.25 -> p_eff = 0.2000)
    now_8d = last_practiced + timedelta(days=8)
    p_eff_8d = apply_forgetting_decay(0.80, last_practiced, 4.0, now=now_8d)

    decay_correct = (
        abs(p_eff_0d - 0.80) < 1e-4
        and abs(p_eff_2d - 0.5657) < 1e-4
        and abs(p_eff_4d - 0.4000) < 1e-4
        and abs(p_eff_8d - 0.2000) < 1e-4
    )

    # 2. Test case 2: update_stability transitions
    s_old = 5.0
    s_success = update_stability(s_old, 1.0, ease_factor=2.0)  # score >= 0.8 -> 5.0 * 2.0 = 10.0
    s_neutral = update_stability(s_old, 0.6)  # 0.5 <= score < 0.8 -> 5.0
    s_fail = update_stability(s_old, 0.2)  # score < 0.5 -> max(1.0, 5.0 * 0.5) = 2.5
    s_fail_min = update_stability(1.5, 0.0)  # score < 0.5 -> max(1.0, 1.5 * 0.5) = 1.0

    stability_correct = (
        abs(s_success - 10.0) < 1e-4
        and abs(s_neutral - 5.0) < 1e-4
        and abs(s_fail - 2.5) < 1e-4
        and abs(s_fail_min - 1.0) < 1e-4
    )

    # 3. Simulate a longitudinal decay of 100 students
    # All start with mastery = 0.90, stability = 3.0 days
    # Simulate decay over 15 days, logging the daily average mastery
    daily_history = []
    for day in range(16):
        total_p = 0.0
        for student_idx in range(100):
            # Each student has a slightly different stability to represent variance (N(3.0, 0.5))
            # Just simple linear scaling for mock variance:
            stud_stability = 2.0 + (student_idx / 100.0) * 2.0  # stability in [2.0, 4.0]
            now_day = last_practiced + timedelta(days=day)
            p_eff = apply_forgetting_decay(0.90, last_practiced, stud_stability, now=now_day)
            total_p += p_eff

        daily_history.append({"day": day, "mean_mastery": total_p / 100.0})

    # Save results to CSV
    os.makedirs("eval/results", exist_ok=True)
    csv_path = "eval/results/exp5_forgetting_decay.csv"
    with open(csv_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Day", "Mean_Mastery"])
        for h in daily_history:
            writer.writerow([h["day"], h["mean_mastery"]])

    return {
        "p_eff_4d": p_eff_4d,
        "s_success": s_success,
        "s_fail": s_fail,
        "decay_math_correct": decay_correct,
        "stability_updates_correct": stability_correct,
        "final_mean_mastery_15d": daily_history[-1]["mean_mastery"],
        "csv_saved_at": csv_path,
    }
