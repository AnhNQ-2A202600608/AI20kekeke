"""
Contextual Bandit (LinUCB) Service
==================================

Module này thực hiện thuật toán Contextual Bandit (LinUCB) để cá nhân hóa việc
gợi ý câu hỏi trong Vùng Phát triển Gần nhất (ZPD - Zone of Proximal Development).

Tối ưu hóa:
-----------
Sử dụng công thức Sherman-Morrison để tính trực tiếp ma trận nghịch đảo A_inv
ngay lúc submit bài, loại bỏ hoàn toàn việc gọi phép toán np.linalg.inv() lúc gợi ý.

Tài liệu tham chiếu thiết kế:
---------------------------
- ADR-003: Lựa chọn giải pháp Contextual Bandit gợi ý bài tập thích ứng
- docs/research/contextual-bandit.md
"""

import math
from typing import Any

import numpy as np


class LinUCB:
    def __init__(self, context_dim: int = 3, alpha: float = 1.0):
        """
        Khởi tạo LinUCB.
        - context_dim: Kích thước của vector ngữ cảnh (mặc định = 3).
        - alpha: Tham số thăm dò (thăm dò nhiều hơn nếu alpha cao).
        """
        self.context_dim = context_dim
        self.alpha = alpha

    def get_default_arm_state(self) -> dict[str, list[float]]:
        """
        Khởi tạo trạng thái mặc định của một câu hỏi (arm).
        Thay vì lưu ma trận hiệp biến A, ta khởi tạo và lưu trực tiếp ma trận
        nghịch đảo A_inv (ban đầu là ma trận đơn vị Identity) để tăng hiệu năng.
        """
        A_inv = np.eye(self.context_dim).tolist()
        b = np.zeros(self.context_dim).tolist()
        return {"A_inv": A_inv, "b": b}

    def compute_ucb_score(
        self,
        context: np.ndarray,
        arm_state: dict[str, Any],
    ) -> tuple[float, float]:
        """
        Tính toán phần thưởng kỳ vọng (Pred) và cận trên UCB của câu hỏi (arm).
        Độ phức tạp tính toán: O(d^2) (không dùng phép nghịch đảo).
        """
        try:
            A_inv = np.array(arm_state["A_inv"], dtype=float)
            b = np.array(arm_state["b"], dtype=float).reshape(-1, 1)

            if not np.all(np.isfinite(A_inv)) or not np.all(np.isfinite(b)):
                A_inv = np.eye(self.context_dim)
                b = np.zeros((self.context_dim, 1))
        except Exception:
            A_inv = np.eye(self.context_dim)
            b = np.zeros((self.context_dim, 1))

        x = context.reshape(-1, 1)

        theta = A_inv.dot(b)

        pred = float(theta.T.dot(x)[0][0])
        if not np.isfinite(pred):
            pred = 0.0

        variance = float(x.T.dot(A_inv).dot(x)[0][0])
        if not np.isfinite(variance) or variance < 0.0:
            variance = 0.0

        std_dev = np.sqrt(variance)
        if not np.isfinite(std_dev):
            std_dev = 0.0

        ucb = pred + self.alpha * std_dev

        if not np.isfinite(ucb):
            ucb = pred

        return pred, ucb

    def select_arm(
        self,
        context_vector: list[float],
        arms_states: dict[str, dict[str, Any]],
        candidate_arm_ids: list[str],
    ) -> tuple[str, float]:
        """
        Chọn câu hỏi tốt nhất (arm) dựa trên điểm UCB cao nhất.
        Trả về (selected_arm_id, expected_reward).
        """
        context = np.array(context_vector)
        best_arm_id = None
        best_ucb = -float("inf")
        best_pred = 0.0

        if not candidate_arm_ids:
            raise ValueError("Danh sách câu hỏi ứng viên không được trống")

        for arm_id in candidate_arm_ids:
            arm_state = arms_states.get(arm_id)
            if not arm_state:
                arm_state = self.get_default_arm_state()
                arms_states[arm_id] = arm_state

            pred, ucb = self.compute_ucb_score(context, arm_state)
            if ucb > best_ucb:
                best_ucb = ucb
                best_pred = pred
                best_arm_id = arm_id

        if best_arm_id is None:
            best_arm_id = candidate_arm_ids[0]
            best_pred = 0.0

        return best_arm_id, best_pred

    def update_arm(
        self,
        arm_id: str,
        context_vector: list[float],
        reward: float,
        arms_states: dict[str, dict[str, Any]],
    ) -> dict[str, Any]:
        """
        Cập nhật ma trận hiệp biến nghịch đảo A_inv trực tiếp bằng
        công thức Sherman-Morrison:
        (A + x*x^T)^-1 = A^-1 - (A^-1 * x * x^T * A^-1) / (1 + x^T * A^-1 * x)
        """
        x = np.array(context_vector).reshape(-1, 1)
        arm_state = arms_states.get(arm_id)
        if not arm_state:
            arm_state = self.get_default_arm_state()

        A_inv = np.array(arm_state["A_inv"])
        b = np.array(arm_state["b"]).reshape(-1, 1)

        # 1. Tính mẫu số: 1 + x^T * A_inv * x
        denominator = 1.0 + float(x.T.dot(A_inv).dot(x)[0][0])

        # 2. Áp dụng Sherman-Morrison cập nhật A_inv_new
        A_inv_new = A_inv - (A_inv.dot(x).dot(x.T).dot(A_inv)) / denominator

        # Enforce symmetry to prevent floating-point numerical drift (Copilot PR Review Fix)
        A_inv_new = (A_inv_new + A_inv_new.T) / 2.0

        # 3. Cập nhật b_new = b + reward * x
        b_new = b + reward * x

        updated_state = {"A_inv": A_inv_new.tolist(), "b": b_new.flatten().tolist()}
        arms_states[arm_id] = updated_state
        return updated_state


def build_student_context(p_mastery: float, student_elo: float) -> list[float]:
    """
    Xây dựng vector ngữ cảnh 3 chiều: [Bias=1.0, BKT_mastery, Sigmoid_normalized_Elo].
    Sử dụng chuẩn hóa Sigmoid mềm xung quanh trung vị Elo = 1600.
    """
    # Soft Sigmoid normalization with overflow clamp (issue C1)
    exponent = -(student_elo - 1600.0) / 400.0
    exponent = min(20.0, max(-20.0, exponent))
    normalized_elo = 1.0 / (1.0 + math.exp(exponent))
    return [1.0, p_mastery, normalized_elo]


def calculate_bandit_reward(expected_success: float, actual_score: float) -> float:
    """
    Tính tín hiệu thưởng (Reward Y) dựa trên ZPD (mục tiêu 75% làm đúng).
    R = actual_score * (1.0 - 2.0 * |expected_success - 0.75|)
    """
    zpd_reward = 1.0 - 2.0 * abs(expected_success - 0.75)
    reward = actual_score * zpd_reward
    return round(reward, 4)
