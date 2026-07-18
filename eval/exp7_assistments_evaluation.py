import math
import os
import sys
from pathlib import Path
from typing import Any

# Resolve import paths by adding parent directory to sys.path
sys.path.append(str(Path(__file__).parent.parent))

import numpy as np
import pandas as pd

from src.services.adaptive.bkt import BKTParameters, calculate_bkt_update
from src.services.adaptive.elo import calculate_elo_updates, calculate_expected_success


def calculate_auc_score(y_true: list[int], y_scores: list[float]) -> float:
    """
    Tự tính toán AUC trong trường hợp sklearn gặp vấn đề hoặc không khả dụng.
    """
    if not y_true or len(set(y_true)) < 2:
        return 1.0
    paired = sorted(zip(y_scores, y_true), key=lambda x: x[0])
    n_neg = sum(1 for _, y in paired if not y)
    n_pos = len(paired) - n_neg
    if n_neg == 0 or n_pos == 0:
        return 1.0
    rank_sum = 0.0
    for rank, (_, y) in enumerate(paired, 1):
        if y:
            rank_sum += rank
    return (rank_sum - (n_pos * (n_pos + 1)) / 2.0) / (n_pos * n_neg)


def calculate_auc_ci(
    y_true: list[int], y_scores: list[float], n_bootstraps: int = 50, seed: int = 42
) -> tuple[float, float]:
    """
    Tính khoảng tin cậy 95% cho AUC bằng phương pháp Bootstrap nhanh trên NumPy.
    """
    y_true_np = np.array(y_true)
    y_scores_np = np.array(y_scores)
    n_samples = len(y_true_np)
    bootstrapped_scores = []

    rng = np.random.default_rng(seed)

    for _ in range(n_bootstraps):
        indices = rng.integers(0, n_samples, n_samples)
        if len(np.unique(y_true_np[indices])) < 2:
            continue

        # Sắp xếp và tính toán AUC nhanh bằng rank_sum
        paired = sorted(zip(y_scores_np[indices], y_true_np[indices]), key=lambda x: x[0])
        n_neg = sum(1 for _, y in paired if not y)
        n_pos = len(paired) - n_neg
        if n_neg == 0 or n_pos == 0:
            continue
        rank_sum = sum(rank for rank, (_, y) in enumerate(paired, 1) if y)
        auc = (rank_sum - (n_pos * (n_pos + 1)) / 2.0) / (n_pos * n_neg)
        bootstrapped_scores.append(auc)

    if not bootstrapped_scores:
        return 0.0, 0.0

    sorted_scores = np.sort(bootstrapped_scores)
    ci_lower = sorted_scores[int(0.025 * len(sorted_scores))]
    ci_upper = sorted_scores[int(0.975 * len(sorted_scores))]
    return round(ci_lower, 4), round(ci_upper, 4)


def run_assistments_evaluation(data_path: str = "eval/data/assistments_subset.csv") -> dict[str, Any]:
    import time

    print(f"Loading ASSISTments subset from {data_path}...")
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}. Please place the file there first.")

    df = pd.read_csv(data_path)

    # Thu thập chỉ số thống kê mô tả về tập dữ liệu lớn
    total_interactions = len(df)
    n_students = df["user_id"].nunique()
    n_questions = df["problem_id"].nunique()
    n_skills = df["skill_id"].nunique()

    # Đảm bảo sắp xếp đúng chuỗi thời gian
    df = df.sort_values(by=["user_id", "order_id"])

    # Khởi tạo mô hình BKT và Elo
    bkt_params = BKTParameters(prior_learned=0.25, transition_learn=0.06, guess=0.20, slip=0.10)

    student_bkt = {}  # key: (user_id, skill_id) -> p_mastery
    student_elo = {}  # key: user_id -> elo
    question_elo = {}  # key: problem_id -> elo

    y_true = []
    y_pred_bkt = []
    y_pred_elo = []

    # Lưu lại chuỗi để xuất file CSV kết quả chi tiết
    results_records = []

    # Trích xuất sang mảng NumPy để tối ưu hóa vòng lặp (Vectorization-like loop)
    user_ids = df["user_id"].values
    problem_ids = df["problem_id"].values
    skill_ids = df["skill_id"].values.astype(str)
    corrects = df["correct"].values
    order_ids = df["order_id"].values
    hints = df["hint_count"].values if "hint_count" in df.columns else np.zeros(total_interactions)

    print(f"Running sequential simulation loop on {total_interactions} records...")
    start_time = time.time()

    for u_id, p_id, s_id, actual, hint, o_id in zip(user_ids, problem_ids, skill_ids, corrects, hints, order_ids):
        u_id = int(u_id)
        p_id = int(p_id)
        actual = int(actual)
        hint = int(hint)

        # Khởi tạo Elo và BKT nếu chưa tồn tại
        if (u_id, s_id) not in student_bkt:
            student_bkt[(u_id, s_id)] = bkt_params.prior_learned
        if u_id not in student_elo:
            student_elo[u_id] = 1200.0
        if p_id not in question_elo:
            question_elo[p_id] = 1200.0

        # 1. Dự đoán kết quả làm bài
        p_mastery_prev = student_bkt[(u_id, s_id)]
        pred_bkt = p_mastery_prev * (1.0 - bkt_params.slip) + (1.0 - p_mastery_prev) * bkt_params.guess
        pred_elo = calculate_expected_success(student_elo[u_id], question_elo[p_id])

        y_true.append(actual)
        y_pred_bkt.append(pred_bkt)
        y_pred_elo.append(pred_elo)

        results_records.append(
            {
                "order_id": o_id,
                "user_id": u_id,
                "problem_id": p_id,
                "skill_id": s_id,
                "actual": actual,
                "pred_bkt": round(pred_bkt, 4),
                "pred_elo": round(pred_elo, 4),
            }
        )

        # 2. Cập nhật các tham số dựa trên kết quả thực tế
        student_bkt[(u_id, s_id)] = calculate_bkt_update(p_mastery_prev, actual == 1, bkt_params)

        new_student_elo, new_question_elo = calculate_elo_updates(
            student_elo[u_id], question_elo[p_id], float(actual), hint_count=hint
        )
        student_elo[u_id] = new_student_elo
        question_elo[p_id] = new_question_elo

    end_time = time.time()
    duration = end_time - start_time
    throughput = total_interactions / duration

    print(f"Simulation completed in {duration:.4f} seconds.")
    print(f"Throughput: {throughput:.2f} interactions/sec")

    # Tính toán các chỉ số chất lượng
    try:
        from sklearn.metrics import mean_squared_error, roc_auc_score

        bkt_auc = roc_auc_score(y_true, y_pred_bkt)
        bkt_rmse = math.sqrt(mean_squared_error(y_true, y_pred_bkt))

        elo_auc = roc_auc_score(y_true, y_pred_elo)
        elo_rmse = math.sqrt(mean_squared_error(y_true, y_pred_elo))
    except ImportError:
        bkt_auc = calculate_auc_score(y_true, y_pred_bkt)
        elo_auc = calculate_auc_score(y_true, y_pred_elo)

        bkt_mse = sum((t - p) ** 2 for t, p in zip(y_true, y_pred_bkt)) / len(y_true)
        bkt_rmse = math.sqrt(bkt_mse)

        elo_mse = sum((t - p) ** 2 for t, p in zip(y_true, y_pred_elo)) / len(y_true)
        elo_rmse = math.sqrt(elo_mse)

    # Tính khoảng tin cậy 95% cho AUC (Bootstrap)
    print("Computing 95% Confidence Intervals for AUC...")
    bkt_ci = calculate_auc_ci(y_true, y_pred_bkt)
    elo_ci = calculate_auc_ci(y_true, y_pred_elo)

    # Ghi kết quả chi tiết ra CSV
    os.makedirs("eval/results", exist_ok=True)
    csv_out_path = "eval/results/exp7_assistments_evaluation.csv"
    pd.DataFrame(results_records).to_csv(csv_out_path, index=False)
    print(f"Detailed logs saved to {csv_out_path}")

    # Vẽ biểu đồ và lưu ảnh
    plot_path = "eval/results/exp7_assistments_evaluation.png"
    has_plotted = try_plot_results(y_true, y_pred_bkt, y_pred_elo, plot_path)

    return {
        "total_interactions": total_interactions,
        "n_students": n_students,
        "n_questions": n_questions,
        "n_skills": n_skills,
        "duration_sec": duration,
        "throughput": throughput,
        "bkt_auc": bkt_auc,
        "bkt_auc_ci": bkt_ci,
        "bkt_rmse": bkt_rmse,
        "elo_auc": elo_auc,
        "elo_auc_ci": elo_ci,
        "elo_rmse": elo_rmse,
        "csv_saved_at": csv_out_path,
        "plot_saved_at": plot_path if has_plotted else None,
    }


def try_plot_results(y_true, y_pred_bkt, y_pred_elo, save_path) -> bool:
    try:
        import matplotlib

        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        from sklearn.metrics import roc_curve

        y_true_np = np.array(y_true)
        y_pred_bkt_np = np.array(y_pred_bkt)
        y_pred_elo_np = np.array(y_pred_elo)

        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))

        # 1. Đường cong ROC (ROC Curve)
        bkt_fpr, bkt_tpr, _ = roc_curve(y_true_np, y_pred_bkt_np)
        elo_fpr, elo_tpr, _ = roc_curve(y_true_np, y_pred_elo_np)

        ax1.plot(
            bkt_fpr,
            bkt_tpr,
            label=f"BKT (AUC = {calculate_auc_score(y_true, y_pred_bkt):.4f})",
            color="#ff9600",
            linewidth=2.5,
        )
        ax1.plot(
            elo_fpr,
            elo_tpr,
            label=f"Elo (AUC = {calculate_auc_score(y_true, y_pred_elo):.4f})",
            color="#58cc02",
            linewidth=2.5,
        )
        ax1.plot([0, 1], [0, 1], linestyle="--", color="#888888", label="Random Guess (AUC = 0.50)")
        ax1.set_title("ROC Curves for Next-Step Correctness Prediction", fontsize=12, fontweight="bold")
        ax1.set_xlabel("False Positive Rate", fontsize=10)
        ax1.set_ylabel("True Positive Rate", fontsize=10)
        ax1.grid(True, alpha=0.3)
        ax1.legend(fontsize=10)

        # 2. Đường cong Hiệu chuẩn (Calibration Curve)
        def compute_calibration_curve(y_true, y_prob, n_bins=10):
            bins = np.linspace(0, 1, n_bins + 1)
            bin_centers = []
            true_rates = []
            for i in range(n_bins):
                bin_lower = bins[i]
                bin_upper = bins[i + 1]
                mask = (y_prob >= bin_lower) & (y_prob < bin_upper)
                if i == n_bins - 1:
                    mask = mask | (y_prob == bin_upper)
                if np.sum(mask) > 0:
                    bin_centers.append(np.mean(y_prob[mask]))
                    true_rates.append(np.mean(y_true[mask]))
            return bin_centers, true_rates

        bkt_centers, bkt_rates = compute_calibration_curve(y_true_np, y_pred_bkt_np)
        elo_centers, elo_rates = compute_calibration_curve(y_true_np, y_pred_elo_np)

        ax2.plot(bkt_centers, bkt_rates, "o-", label="BKT Calibration", color="#ff9600", linewidth=2)
        ax2.plot(elo_centers, elo_rates, "s-", label="Elo Calibration", color="#58cc02", linewidth=2)
        ax2.plot([0, 1], [0, 1], "--", color="#888888", label="Perfect Calibration (y = x)")
        ax2.set_title("Calibration Curves (Reliability Diagrams)", fontsize=12, fontweight="bold")
        ax2.set_xlabel("Predicted Probability of Correctness", fontsize=10)
        ax2.set_ylabel("Actual Average Correctness", fontsize=10)
        ax2.grid(True, alpha=0.3)
        ax2.legend(fontsize=10)

        plt.tight_layout()
        plt.savefig(save_path, dpi=300)
        plt.close()
        return True
    except Exception as e:
        print(f"Warning: Failed to generate plots: {e}")
        return False


if __name__ == "__main__":
    res = run_assistments_evaluation()
    print("\n==================================================")
    print("      REAL-WORLD EVALUATION RESULTS (ASSISTments)")
    print("==================================================")
    print("Dataset Statistics:")
    print(f"  - Total Interactions: {res['total_interactions']:,}")
    print(f"  - Unique Students:    {res['n_students']:,}")
    print(f"  - Unique Questions:   {res['n_questions']:,}")
    print(f"  - Unique Skills:      {res['n_skills']:,}")
    print("Performance Metrics:")
    print(f"  - Simulation Duration: {res['duration_sec']:.4f} seconds")
    print(f"  - System Throughput:   {res['throughput']:.2f} interactions/sec")
    print("Algorithm Quality:")
    print(
        f"  - BKT: AUC = {res['bkt_auc']:.4f} (95% CI: [{res['bkt_auc_ci'][0]:.4f}, {res['bkt_auc_ci'][1]:.4f}]), RMSE = {res['bkt_rmse']:.4f}"
    )
    print(
        f"  - Elo: AUC = {res['elo_auc']:.4f} (95% CI: [{res['elo_auc_ci'][0]:.4f}, {res['elo_auc_ci'][1]:.4f}]), RMSE = {res['elo_rmse']:.4f}"
    )
    print("==================================================")
