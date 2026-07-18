import csv
import logging
import os
import random
import sys
from datetime import datetime
from typing import Any

# Thêm project root vào sys.path để import src
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from src.api.adaptive_routes import get_adaptive_db  # noqa: E402

logger = logging.getLogger("exp5_forgetting_calibration")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


def load_review_attempts_from_db(db) -> list[tuple[float, int]]:
    """
    Nạp dữ liệu log ôn tập từ database.
    Sắp xếp các quiz attempts của từng học sinh đối với từng concept theo thời gian,
    tính khoảng cách thời gian delta_t (ngày) giữa các lần làm bài liên tiếp và ghi nhận kết quả.
    """
    if db._stub_mode or db.app_client is None:
        logger.info("Đang ở Stub Mode. Chuyển sang sinh dữ liệu giả lập.")
        return []

    try:
        # Lấy toàn bộ quiz attempts
        response = (
            db.app_client.table("quiz_attempts")
            .select("student_id, concept_id, is_correct, submitted_at")
            .order("submitted_at", desc=False)
            .execute()
        )

        attempts = response.data or []
        if not attempts:
            logger.info("Bảng quiz_attempts trống. Chuyển sang sinh dữ liệu giả lập.")
            return []

        # Gom nhóm attempts theo (student_id, concept_id)
        student_concept_history = {}
        for att in attempts:
            sid = att["student_id"]
            cid = att["concept_id"]
            key = (sid, cid)
            if key not in student_concept_history:
                student_concept_history[key] = []
            student_concept_history[key].append(att)

        data_points = []
        for key, history in student_concept_history.items():
            if len(history) < 2:
                continue

            for i in range(1, len(history)):
                prev_att = history[i - 1]
                curr_att = history[i]

                # Parse thời gian
                try:
                    t_prev = datetime.fromisoformat(prev_att["submitted_at"].replace("Z", "+00:00"))
                    t_curr = datetime.fromisoformat(curr_att["submitted_at"].replace("Z", "+00:00"))
                    delta_days = (t_curr - t_prev).total_seconds() / 86400.0

                    if delta_days > 0.01:  # Khoảng cách tối thiểu 15 phút
                        is_correct = 1 if curr_att["is_correct"] else 0
                        data_points.append((delta_days, is_correct))
                except Exception as e:
                    logger.error(f"Lỗi khi parse ngày: {e}")

        logger.info(f"Đã nạp {len(data_points)} điểm dữ liệu ôn tập thực tế từ Database.")
        return data_points
    except Exception as e:
        logger.error(f"Lỗi khi truy vấn database: {e}. Chuyển sang sinh dữ liệu giả lập.")
        return []


def generate_synthetic_review_data(
    num_points: int = 800, true_s: float = 6.5, seed: int = 42
) -> list[tuple[float, int]]:
    """
    Sinh dữ liệu giả lập mô phỏng quy luật phân rã trí nhớ sinh học: P(recall) = 2^(-t / S_true)
    """
    rng = random.Random(seed)
    data_points = []
    for _ in range(num_points):
        # Giãn cách thời gian delta_t từ 0.1 đến 30 ngày (phân bố lệch trái để giống thực tế)
        delta_t = rng.gammavariate(2.0, 3.0)
        delta_t = max(0.1, min(35.0, delta_t))

        # Xác suất làm đúng thực tế theo đường quên
        p_recall = 2.0 ** (-delta_t / true_s)

        # Thêm chút noise nhiễu ngẫu nhiên từ Elo/Guess/Slip
        p_recall = 0.15 + 0.80 * p_recall  # min = 0.15, max = 0.95

        is_correct = 1 if rng.random() < p_recall else 0
        data_points.append((delta_t, is_correct))

    logger.info(f"Đã sinh {num_points} điểm dữ liệu ôn tập giả lập (S_true = {true_s}).")
    return data_points


def fit_forgetting_curve(data_points: list[tuple[float, int]]) -> tuple[float, float]:
    """
    Khớp dữ liệu sử dụng Grid Search để tìm tham số stability S tối ưu
    tối thiểu hóa lỗi Mean Squared Error (MSE).
    Trả về (S_optimal, min_mse)
    """
    if not data_points:
        return 3.0, 0.0

    best_s = 3.0
    min_mse = float("inf")

    # Grid search S từ 0.5 đến 40.0, bước 0.1
    s_candidates = [x * 0.1 for x in range(5, 400)]
    for s in s_candidates:
        mse_sum = 0.0
        for delta_t, y in data_points:
            p_pred = 2.0 ** (-delta_t / s)
            mse_sum += (y - p_pred) ** 2

        mse = mse_sum / len(data_points)
        if mse < min_mse:
            min_mse = mse
            best_s = s

    return best_s, min_mse


def calculate_expected_calibration_error(
    data_points: list[tuple[float, int]], s_optimal: float
) -> tuple[float, list[dict[str, Any]]]:
    """
    Tính Expected Calibration Error (ECE) dựa trên việc phân chia dữ liệu vào 5 bins thời gian.
    """
    # Định nghĩa các bins thời gian (ngày)
    bins = [(0.0, 2.0), (2.0, 5.0), (5.0, 10.0), (10.0, 20.0), (20.0, float("inf"))]

    bin_data = []
    total_ece = 0.0
    total_n = len(data_points)

    for b_idx, (b_start, b_end) in enumerate(bins):
        # Lọc các điểm thuộc bin
        points_in_bin = [(dt, y) for dt, y in data_points if b_start <= dt < b_end]
        n_b = len(points_in_bin)
        if n_b == 0:
            continue

        acc_actual = sum(y for _, y in points_in_bin) / n_b
        acc_pred = sum(2.0 ** (-dt / s_optimal) for dt, _ in points_in_bin) / n_b

        error = abs(acc_actual - acc_pred)
        weight = n_b / total_n
        total_ece += weight * error

        bin_data.append(
            {
                "bin_index": b_idx + 1,
                "range": f"[{b_start:.1f}, {b_end:.1f})",
                "count": n_b,
                "acc_actual": acc_actual,
                "acc_pred": acc_pred,
                "error": error,
            }
        )

    return total_ece, bin_data


def run_forgetting_calibration(seed: int = 42) -> dict[str, Any]:
    db = get_adaptive_db()
    data_points = load_review_attempts_from_db(db)

    is_synthetic = False
    if not data_points:
        data_points = generate_synthetic_review_data(num_points=1000, true_s=7.5, seed=seed)
        is_synthetic = True

    # 1. Khớp curve
    s_opt, min_mse = fit_forgetting_curve(data_points)

    # 2. Tính Calibration Error
    ece, bin_data = calculate_expected_calibration_error(data_points, s_opt)

    logger.info("==============================================================")
    logger.info("--- BÁO CÁO HIỆU CHUẨN ĐƯỜNG CONG QUÊN (FORGETTING CURVE) ---")
    logger.info(f"Dữ liệu sử dụng: {'GIẢ LẬP' if is_synthetic else 'THỰC TẾ DB'}")
    logger.info(f"Độ ổn định tối ưu (S*): {s_opt:.2f} ngày")
    logger.info(f"Mean Squared Error (MSE) nhỏ nhất: {min_mse:.4f}")
    logger.info(f"Expected Calibration Error (ECE): {ece:.4f}")
    logger.info("--------------------------------------------------------------")
    logger.info("Chi tiết các bins thời gian:")
    for b in bin_data:
        logger.info(
            f"Bin {b['bin_index']} {b['range']} (N={b['count']}): Thực tế={b['acc_actual']:.3f}, Dự đoán={b['acc_pred']:.3f}, Sai số={b['error']:.3f}"
        )
    logger.info("==============================================================")

    # 3. Lưu kết quả CSV
    os.makedirs("eval/results", exist_ok=True)
    csv_path = "eval/results/exp5_forgetting_calibration.csv"
    with open(csv_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Bin", "Range", "Count", "Actual_Accuracy", "Predicted_Accuracy", "Error"])
        for b in bin_data:
            writer.writerow([b["bin_index"], b["range"], b["count"], b["acc_actual"], b["acc_pred"], b["error"]])

    # 4. Vẽ biểu đồ
    plot_path = "eval/results/exp5_forgetting_calibration.png"
    has_plotted = try_plot_forgetting_curve(data_points, s_opt, bin_data, plot_path)

    return {
        "is_synthetic": is_synthetic,
        "optimal_stability_s": s_opt,
        "minimum_mse": min_mse,
        "ece": ece,
        "csv_saved_at": csv_path,
        "plot_saved_at": plot_path if has_plotted else None,
    }


def try_plot_forgetting_curve(
    data_points: list[tuple[float, int]], s_opt: float, bin_data: list[dict], save_path: str
) -> bool:
    try:
        import matplotlib

        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        import numpy as np

        # Tạo dải delta_t lý thuyết
        t_theoretical = np.linspace(0.1, 35.0, 200)
        p_theoretical = 2.0 ** (-t_theoretical / s_opt)

        plt.figure(figsize=(10, 6))

        # Vẽ đường cong lý thuyết
        plt.plot(
            t_theoretical,
            p_theoretical,
            label=f"Theoretical Forgetting Curve (S* = {s_opt:.2f}d)",
            color="#ff9600",
            linewidth=2.5,
        )

        # Vẽ các điểm thực tế của từng bin
        # Lấy mốc thời gian đại diện ở giữa khoảng của bin
        bin_centers = [1.0, 3.5, 7.5, 15.0, 27.5]  # mốc đại diện cho 5 bins
        actual_accs = [b["acc_actual"] for b in bin_data]
        counts = [b["count"] for b in bin_data]

        # Scatter size tỷ lệ với count của từng bin
        sizes = [c * 0.5 for c in counts]
        plt.scatter(
            bin_centers,
            actual_accs,
            s=sizes,
            color="#58cc02",
            label="Empirical Accuracy per Bin (size ~ N)",
            zorder=3,
            edgecolor="black",
        )

        plt.title("Forgetting Curve Fitting vs Empirical Retention Data", fontsize=14, fontweight="bold")
        plt.xlabel("Elapse Time since Last Practice (Days)", fontsize=12)
        plt.ylabel("Retention Rate / Accuracy", fontsize=12)
        plt.ylim(0.0, 1.05)
        plt.xlim(0.0, 35.0)
        plt.grid(True, alpha=0.3)
        plt.legend(fontsize=11)
        plt.tight_layout()

        plt.savefig(save_path)
        plt.close()
        return True
    except Exception as e:
        logger.error(f"Lỗi khi vẽ biểu đồ forgetting curve: {e}")
        return False


if __name__ == "__main__":
    run_forgetting_calibration()
