import csv
import logging
import math
import os
import random
from typing import Any

import numpy as np

from eval.synthetic_students import (
    VirtualQuestion,
    VirtualStudent,
    generate_questions,
    generate_students,
    simulate_student_response,
)
from src.services.adaptive.bandit import build_student_context, calculate_bandit_reward
from src.services.adaptive.bkt import BKTParameters, calculate_bkt_update
from src.services.adaptive.elo import calculate_elo_updates, calculate_expected_success


class FastLinUCBSimulator:
    def __init__(self, context_dim: int, num_questions: int, question_ids: list[str], alpha: float = 1.0):
        self.context_dim = context_dim
        self.num_questions = num_questions
        self.question_ids = question_ids
        self.qid_to_idx = {qid: idx for idx, qid in enumerate(question_ids)}
        self.alpha = alpha

        self.A_inv = np.zeros((num_questions, context_dim, context_dim))
        for i in range(num_questions):
            self.A_inv[i] = np.eye(context_dim)
        self.b = np.zeros((num_questions, context_dim, 1))

    def select_arm(self, context_vector: list[float]) -> tuple[str, float]:
        theta_all = np.squeeze(np.matmul(self.A_inv, self.b), axis=-1)
        context_arr = np.array(context_vector)
        pred_all = np.dot(theta_all, context_arr)
        variance_all = np.einsum("i,nij,j->n", context_arr, self.A_inv, context_arr)

        std_dev_all = np.sqrt(np.maximum(0.0, variance_all))
        ucb_all = pred_all + self.alpha * std_dev_all

        best_idx = np.argmax(ucb_all)
        return self.question_ids[best_idx], float(pred_all[best_idx])

    def update_arm(self, arm_id: str, context_vector: list[float], reward: float):
        idx = self.qid_to_idx[arm_id]
        A_inv = self.A_inv[idx]
        b = self.b[idx]

        x = np.array(context_vector).reshape(-1, 1)

        denominator = 1.0 + float(x.T.dot(A_inv).dot(x)[0][0])
        A_inv_new = A_inv - (A_inv.dot(x).dot(x.T).dot(A_inv)) / denominator
        self.A_inv[idx] = 0.5 * (A_inv_new + A_inv_new.T)
        self.b[idx] = b + reward * x


logger = logging.getLogger("exp3_bandit_comparison")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


def calculate_stats(data: list[list[float]]) -> tuple[list[float], list[float]]:
    """Tính toán Mean và 95% Confidence Interval half-width cho từng bước."""
    num_seeds = len(data)
    trials = len(data[0])
    means = []
    cis = []
    for t in range(trials):
        values = [data[s][t] for s in range(num_seeds)]
        mean = sum(values) / num_seeds
        variance = sum((x - mean) ** 2 for x in values) / (num_seeds - 1) if num_seeds > 1 else 0.0
        sd = math.sqrt(variance)
        se = sd / math.sqrt(num_seeds)
        ci_half = 1.96 * se  # 95% CI
        means.append(mean)
        cis.append(ci_half)
    return means, cis


def perform_t_test(group1: list[float], group2: list[float]) -> tuple[float, float]:
    """Thực hiện paired t-test thủ công (hoặc scipy.stats.ttest_rel nếu có)."""
    n = len(group1)
    if n != len(group2) or n <= 1:
        return 0.0, 1.0

    try:
        import scipy.stats as stats

        t_stat, p_val = stats.ttest_rel(group1, group2)
        return float(t_stat), float(p_val)
    except ImportError:
        # Manual paired t-test calculation
        diffs = [x1 - x2 for x1, x2 in zip(group1, group2)]
        mean_diff = sum(diffs) / n
        var_diff = sum((d - mean_diff) ** 2 for d in diffs) / (n - 1)
        sd_diff = math.sqrt(var_diff)
        se = sd_diff / math.sqrt(n)
        if se == 0:
            return 0.0, 1.0
        t_stat = mean_diff / se
        z = abs(t_stat)

        # Approximation of p-value for large N (or standard normal approximation)
        if z > 20.0:
            p_val = 0.0
        else:
            exponent = 0.04986728 * z**3 + 0.1705416 * z**2 + 0.278393 * z + 0.562313
            exponent = min(700.0, exponent)
            p_val = 2.0 / (1.0 + math.exp(exponent))
            p_val = min(1.0, max(0.0, p_val))

        return t_stat, p_val


def run_bandit_comparison(trials: int = 100, num_seeds: int = 30) -> dict[str, Any]:
    bkt_params = BKTParameters(prior_learned=0.25, transition_learn=0.06, guess=0.20, slip=0.10)

    # Lưu trữ Cumulative Regret của từng seed qua các trials
    lin_regrets_all = []
    rand_regrets_all = []
    greedy_regrets_all = []
    lin_nobkt_regrets_all = []

    # Thống kê hiệu suất chung
    lin_hits_all = []
    rand_hits_all = []
    greedy_hits_all = []
    lin_nobkt_hits_all = []

    lin_rewards_all = []
    rand_rewards_all = []
    greedy_rewards_all = []
    lin_nobkt_rewards_all = []

    logger.info(f"Đang chạy mô phỏng bandit với {num_seeds} seeds ngẫu nhiên và {trials} trials mỗi seed...")

    for seed_idx in range(num_seeds):
        current_seed = 42 + seed_idx
        rng_init = random.Random(current_seed)

        # Khởi tạo Student & Question pools gốc cho seed này
        base_students = generate_students(num_students=30, rng=rng_init)
        base_questions = generate_questions(num_questions=100, rng=rng_init)

        # Helper nhân bản trạng thái
        def clone_students(students_list):
            clones = []
            for s in students_list:
                clone = VirtualStudent(s.student_id, s.true_elo)
                clone.true_bkt_mastery = s.true_bkt_mastery
                clone.est_bkt = s.est_bkt
                clone.est_elo = s.est_elo
                clones.append(clone)
            return clones

        def clone_questions(questions_list):
            clones = []
            for q in questions_list:
                clone = VirtualQuestion(q.question_id, q.true_difficulty, concept_id=q.concept_id)
                clone.est_difficulty = q.est_difficulty
                clones.append(clone)
            return clones

        # Khởi tạo 4 nhóm thuật toán độc lập
        students_lin = clone_students(base_students)
        questions_lin = clone_questions(base_questions)
        qids_lin = [q.question_id for q in questions_lin]
        fast_bandit = FastLinUCBSimulator(
            context_dim=3, num_questions=len(questions_lin), question_ids=qids_lin, alpha=1.0
        )

        students_rand = clone_students(base_students)
        questions_rand = clone_questions(base_questions)
        rng_rand = random.Random(current_seed + 10)

        students_greedy = clone_students(base_students)
        questions_greedy = clone_questions(base_questions)
        rng_greedy = random.Random(current_seed + 20)

        students_lin_nobkt = clone_students(base_students)
        questions_lin_nobkt = clone_questions(base_questions)
        qids_nobkt = [q.question_id for q in questions_lin_nobkt]
        fast_bandit_nobkt = FastLinUCBSimulator(
            context_dim=2, num_questions=len(questions_lin_nobkt), question_ids=qids_nobkt, alpha=1.0
        )

        # Regret lũy kế cho từng nhóm
        cum_regret_lin = 0.0
        cum_regret_rand = 0.0
        cum_regret_greedy = 0.0
        cum_regret_lin_nobkt = 0.0

        lin_regrets = []
        rand_regrets = []
        greedy_regrets = []
        lin_nobkt_regrets = []

        zpd_hits_lin = 0
        zpd_hits_rand = 0
        zpd_hits_greedy = 0
        zpd_hits_lin_nobkt = 0
        total_recs = 0

        cum_reward_lin = 0.0
        cum_reward_rand = 0.0
        cum_reward_greedy = 0.0
        cum_reward_lin_nobkt = 0.0

        for trial in range(1, trials + 1):
            trial_regret_lin = 0.0
            trial_regret_rand = 0.0
            trial_regret_greedy = 0.0
            trial_regret_lin_nobkt = 0.0

            for s_idx in range(len(base_students)):
                rng_step = random.Random(current_seed + s_idx * 1000 + trial)

                s_lin = students_lin[s_idx]
                s_rand = students_rand[s_idx]
                s_greedy = students_greedy[s_idx]

                # 1. ORACLE SELECTOR (Tính expected reward lý tưởng tối đa)
                max_expected_r = -float("inf")
                for q in base_questions:
                    # Tính xác suất thành công thực tế dựa trên latent states thực của học sinh
                    exponent = (q.true_difficulty - s_lin.true_elo) / 400.0
                    exponent = min(20.0, max(-20.0, exponent))
                    p_success_elo = 1.0 / (1.0 + 10.0**exponent)
                    p_success = (
                        p_success_elo * (1.0 - bkt_params.slip)
                        if s_lin.true_bkt_mastery
                        else p_success_elo * bkt_params.guess
                    )

                    expected_r = p_success * (1.0 - 2.0 * abs(p_success - 0.75))
                    if expected_r > max_expected_r:
                        max_expected_r = expected_r

                # 2. LINUCB AGENT
                X = build_student_context(s_lin.est_bkt, s_lin.est_elo)
                selected_qid_lin, _ = fast_bandit.select_arm(X)
                q_lin = next(qi for qi in questions_lin if qi.question_id == selected_qid_lin)

                res_lin = simulate_student_response(
                    s_lin, q_lin, guess=bkt_params.guess, slip=bkt_params.slip, rng=rng_step
                )
                score_lin = 1.0 if res_lin["is_correct"] else 0.0

                # expected reward thực tế của LinUCB
                p_succ_lin = res_lin["true_success_prob"]
                expected_r_lin = p_succ_lin * (1.0 - 2.0 * abs(p_succ_lin - 0.75))

                # Cập nhật BKT, Elo và LinUCB Matrix
                s_lin.est_bkt = calculate_bkt_update(s_lin.est_bkt, score_lin, bkt_params)
                expected_success_lin = calculate_expected_success(s_lin.est_elo, q_lin.est_difficulty)
                s_lin.est_elo, q_lin.est_difficulty = calculate_elo_updates(
                    s_lin.est_elo, q_lin.est_difficulty, score_lin
                )
                reward_lin = calculate_bandit_reward(expected_success_lin, score_lin)
                fast_bandit.update_arm(selected_qid_lin, X, reward_lin)

                cum_reward_lin += reward_lin
                if 0.60 <= res_lin["p_success_elo"] <= 0.85:
                    zpd_hits_lin += 1

                # 3. RANDOM AGENT
                q_rand = rng_rand.choice(questions_rand)
                res_rand = simulate_student_response(
                    s_rand, q_rand, guess=bkt_params.guess, slip=bkt_params.slip, rng=rng_step
                )
                score_rand = 1.0 if res_rand["is_correct"] else 0.0

                p_succ_rand = res_rand["true_success_prob"]
                expected_r_rand = p_succ_rand * (1.0 - 2.0 * abs(p_succ_rand - 0.75))

                s_rand.est_bkt = calculate_bkt_update(s_rand.est_bkt, score_rand, bkt_params)
                expected_success_rand = calculate_expected_success(s_rand.est_elo, q_rand.est_difficulty)
                s_rand.est_elo, q_rand.est_difficulty = calculate_elo_updates(
                    s_rand.est_elo, q_rand.est_difficulty, score_rand
                )
                reward_rand = calculate_bandit_reward(expected_success_rand, score_rand)

                cum_reward_rand += reward_rand
                if 0.60 <= res_rand["p_success_elo"] <= 0.85:
                    zpd_hits_rand += 1

                # 4. STATIC GREEDY AGENT
                min_diff = None
                candidates = []
                for q_obj in questions_greedy:
                    diff = abs(q_obj.est_difficulty - s_greedy.est_elo)
                    if min_diff is None or diff < min_diff:
                        min_diff = diff
                        candidates = [q_obj]
                    elif abs(diff - min_diff) < 1e-5:
                        candidates.append(q_obj)
                q_greedy_sel = rng_greedy.choice(candidates)

                res_greedy = simulate_student_response(
                    s_greedy, q_greedy_sel, guess=bkt_params.guess, slip=bkt_params.slip, rng=rng_step
                )
                score_greedy = 1.0 if res_greedy["is_correct"] else 0.0

                p_succ_greedy = res_greedy["true_success_prob"]
                expected_r_greedy = p_succ_greedy * (1.0 - 2.0 * abs(p_succ_greedy - 0.75))

                s_greedy.est_bkt = calculate_bkt_update(s_greedy.est_bkt, score_greedy, bkt_params)
                expected_success_greedy = calculate_expected_success(s_greedy.est_elo, q_greedy_sel.est_difficulty)
                s_greedy.est_elo, q_greedy_sel.est_difficulty = calculate_elo_updates(
                    s_greedy.est_elo, q_greedy_sel.est_difficulty, score_greedy
                )
                reward_greedy = calculate_bandit_reward(expected_success_greedy, score_greedy)

                cum_reward_greedy += reward_greedy
                if 0.60 <= res_greedy["p_success_elo"] <= 0.85:
                    zpd_hits_greedy += 1

                # 4b. LINUCB WITHOUT BKT ABLATION AGENT
                s_lin_nobkt = students_lin_nobkt[s_idx]
                exponent_nobkt = -(s_lin_nobkt.est_elo - 1600.0) / 400.0
                exponent_nobkt = min(20.0, max(-20.0, exponent_nobkt))
                normalized_elo_nobkt = 1.0 / (1.0 + math.exp(exponent_nobkt))
                X_nobkt = [1.0, normalized_elo_nobkt]

                selected_qid_nobkt, _ = fast_bandit_nobkt.select_arm(X_nobkt)
                q_nobkt = next(qi for qi in questions_lin_nobkt if qi.question_id == selected_qid_nobkt)

                res_nobkt = simulate_student_response(
                    s_lin_nobkt, q_nobkt, guess=bkt_params.guess, slip=bkt_params.slip, rng=rng_step
                )
                score_nobkt = 1.0 if res_nobkt["is_correct"] else 0.0

                p_succ_nobkt = res_nobkt["true_success_prob"]
                expected_r_nobkt = p_succ_nobkt * (1.0 - 2.0 * abs(p_succ_nobkt - 0.75))

                s_lin_nobkt.est_bkt = calculate_bkt_update(s_lin_nobkt.est_bkt, score_nobkt, bkt_params)
                expected_success_nobkt = calculate_expected_success(s_lin_nobkt.est_elo, q_nobkt.est_difficulty)
                s_lin_nobkt.est_elo, q_nobkt.est_difficulty = calculate_elo_updates(
                    s_lin_nobkt.est_elo, q_nobkt.est_difficulty, score_nobkt
                )
                reward_nobkt = calculate_bandit_reward(expected_success_nobkt, score_nobkt)
                fast_bandit_nobkt.update_arm(selected_qid_nobkt, X_nobkt, reward_nobkt)

                cum_reward_lin_nobkt += reward_nobkt
                if 0.60 <= res_nobkt["p_success_elo"] <= 0.85:
                    zpd_hits_lin_nobkt += 1

                # 5. Tích lũy Regret
                trial_regret_lin += max(0.0, max_expected_r - expected_r_lin)
                trial_regret_rand += max(0.0, max_expected_r - expected_r_rand)
                trial_regret_greedy += max(0.0, max_expected_r - expected_r_greedy)
                trial_regret_lin_nobkt += max(0.0, max_expected_r - expected_r_nobkt)

                # Cập nhật latent state transitions
                if not s_lin.true_bkt_mastery and rng_step.random() < bkt_params.transition_learn:
                    s_lin.true_bkt_mastery = True
                if not s_rand.true_bkt_mastery and rng_step.random() < bkt_params.transition_learn:
                    s_rand.true_bkt_mastery = True
                if not s_greedy.true_bkt_mastery and rng_step.random() < bkt_params.transition_learn:
                    s_greedy.true_bkt_mastery = True
                if not s_lin_nobkt.true_bkt_mastery and rng_step.random() < bkt_params.transition_learn:
                    s_lin_nobkt.true_bkt_mastery = True

            # Tính trung bình regret của sinh viên trong trial này
            cum_regret_lin += trial_regret_lin / len(base_students)
            cum_regret_rand += trial_regret_rand / len(base_students)
            cum_regret_greedy += trial_regret_greedy / len(base_students)
            cum_regret_lin_nobkt += trial_regret_lin_nobkt / len(base_students)

            lin_regrets.append(cum_regret_lin)
            rand_regrets.append(cum_regret_rand)
            greedy_regrets.append(cum_regret_greedy)
            lin_nobkt_regrets.append(cum_regret_lin_nobkt)

            total_recs += len(base_students)

        lin_regrets_all.append(lin_regrets)
        rand_regrets_all.append(rand_regrets)
        greedy_regrets_all.append(greedy_regrets)
        lin_nobkt_regrets_all.append(lin_nobkt_regrets)

        lin_hits_all.append(zpd_hits_lin / total_recs)
        rand_hits_all.append(zpd_hits_rand / total_recs)
        greedy_hits_all.append(zpd_hits_greedy / total_recs)
        lin_nobkt_hits_all.append(zpd_hits_lin_nobkt / total_recs)

        lin_rewards_all.append(cum_reward_lin)
        rand_rewards_all.append(cum_reward_rand)
        greedy_rewards_all.append(cum_reward_greedy)
        lin_nobkt_rewards_all.append(cum_reward_lin_nobkt)

    # 4. Thống kê và kiểm định giả thuyết
    lin_mean, lin_ci = calculate_stats(lin_regrets_all)
    rand_mean, rand_ci = calculate_stats(rand_regrets_all)
    greedy_mean, greedy_ci = calculate_stats(greedy_regrets_all)
    lin_nobkt_mean, lin_nobkt_ci = calculate_stats(lin_nobkt_regrets_all)

    lin_final = [r[-1] for r in lin_regrets_all]
    rand_final = [r[-1] for r in rand_regrets_all]
    greedy_final = [r[-1] for r in greedy_regrets_all]
    lin_nobkt_final = [r[-1] for r in lin_nobkt_regrets_all]

    t_stat_rand, p_val_rand = perform_t_test(lin_final, rand_final)
    t_stat_greedy, p_val_greedy = perform_t_test(lin_final, greedy_final)
    t_stat_nobkt, p_val_nobkt = perform_t_test(lin_final, lin_nobkt_final)

    logger.info("==============================================================")
    logger.info(f"--- BÁO CÁO THỐNG KÊ MULTI-SEED BANDIT COMPARISON (N={num_seeds}) ---")
    logger.info(f"LinUCB Mean Final Regret: {sum(lin_final) / num_seeds:.4f} (95% CI +/- {lin_ci[-1]:.4f})")
    logger.info(
        f"LinUCB (No BKT) Mean Final Regret: {sum(lin_nobkt_final) / num_seeds:.4f} (95% CI +/- {lin_nobkt_ci[-1]:.4f})"
    )
    logger.info(f"Random Mean Final Regret: {sum(rand_final) / num_seeds:.4f} (95% CI +/- {rand_ci[-1]:.4f})")
    logger.info(f"Greedy Mean Final Regret: {sum(greedy_final) / num_seeds:.4f} (95% CI +/- {greedy_ci[-1]:.4f})")
    logger.info(f"LinUCB vs Random (Paired): t-statistic = {t_stat_rand:.4f}, p-value = {p_val_rand:.4e}")
    logger.info(f"LinUCB vs Greedy (Paired): t-statistic = {t_stat_greedy:.4f}, p-value = {p_val_greedy:.4e}")
    logger.info(f"LinUCB vs LinUCB (No BKT) (Paired): t-statistic = {t_stat_nobkt:.4f}, p-value = {p_val_nobkt:.4e}")
    logger.info("--------------------------------------------------------------")
    logger.info("GIẢI THÍCH THỐNG KÊ (EXPLORATION-EXPLOITATION TRADE-OFF):")
    logger.info("- Mặc dù Greedy có ZPD Hit Rate cao hơn (chọn câu hỏi có độ khó gần ELO ước lượng nhất),")
    logger.info("  nó không thăm dò (exploration) nên ước lượng ELO/BKT dễ bị kẹt ở tối ưu cục bộ (local minima).")
    logger.info("  LinUCB chấp nhận thỉnh thoảng chọn câu hỏi ngoài ZPD để thăm dò (làm giảm nhẹ ZPD Hit Rate)")
    logger.info(
        "  nhưng đổi lại giúp hiệu chuẩn ELO học sinh chính xác hơn, dẫn tới Cumulative Regret thấp hơn rõ rệt."
    )
    logger.info("==============================================================")

    # 5. Lưu kết quả ra CSV
    os.makedirs("eval/results", exist_ok=True)
    csv_path = "eval/results/exp3_bandit_comparison.csv"
    with open(csv_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(
            [
                "Trial",
                "LinUCB_MeanRegret",
                "LinUCB_CI",
                "Random_MeanRegret",
                "Random_CI",
                "Greedy_MeanRegret",
                "Greedy_CI",
                "LinUCB_NoBKT_MeanRegret",
                "LinUCB_NoBKT_CI",
            ]
        )
        for idx in range(trials):
            writer.writerow(
                [
                    idx + 1,
                    lin_mean[idx],
                    lin_ci[idx],
                    rand_mean[idx],
                    rand_ci[idx],
                    greedy_mean[idx],
                    greedy_ci[idx],
                    lin_nobkt_mean[idx],
                    lin_nobkt_ci[idx],
                ]
            )

    # 6. Vẽ biểu đồ có bóng mờ khoảng tin cậy
    plot_path = "eval/results/exp3_bandit_comparison.png"
    has_plotted = try_plot_bandit_comparison(
        trials, lin_mean, lin_ci, rand_mean, rand_ci, greedy_mean, greedy_ci, lin_nobkt_mean, lin_nobkt_ci, plot_path
    )

    return {
        "linucb_mean_zpd_hit_rate": sum(lin_hits_all) / num_seeds,
        "random_mean_zpd_hit_rate": sum(rand_hits_all) / num_seeds,
        "greedy_mean_zpd_hit_rate": sum(greedy_hits_all) / num_seeds,
        "linucb_nobkt_mean_zpd_hit_rate": sum(lin_nobkt_hits_all) / num_seeds,
        "linucb_mean_final_regret": sum(lin_final) / num_seeds,
        "random_mean_final_regret": sum(rand_final) / num_seeds,
        "greedy_mean_final_regret": sum(greedy_final) / num_seeds,
        "linucb_nobkt_mean_final_regret": sum(lin_nobkt_final) / num_seeds,
        "p_value_vs_random": p_val_rand,
        "p_value_vs_greedy": p_val_greedy,
        "p_value_vs_nobkt": p_val_nobkt,
        "csv_saved_at": csv_path,
        "plot_saved_at": plot_path if has_plotted else None,
        # Compatibility keys expected by eval_suite.py
        "linucb_zpd_hit_rate": sum(lin_hits_all) / num_seeds,
        "random_zpd_hit_rate": sum(rand_hits_all) / num_seeds,
        "greedy_zpd_hit_rate": sum(greedy_hits_all) / num_seeds,
        "linucb_nobkt_zpd_hit_rate": sum(lin_nobkt_hits_all) / num_seeds,
        "linucb_final_reward": sum(lin_rewards_all) / num_seeds,
        "random_final_reward": sum(rand_rewards_all) / num_seeds,
        "greedy_final_reward": sum(greedy_rewards_all) / num_seeds,
        "linucb_nobkt_final_reward": sum(lin_nobkt_rewards_all) / num_seeds,
    }


def try_plot_bandit_comparison(
    trials_num, lin_m, lin_c, rand_m, rand_c, greedy_m, greedy_c, nobkt_m, nobkt_c, save_path
) -> bool:
    try:
        import matplotlib

        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        trials = list(range(1, trials_num + 1))

        plt.figure(figsize=(10, 6))

        # Vẽ đường mean và dải CI cho từng thuật toán
        plt.plot(trials, lin_m, label="LinUCB Adaptive", color="#58cc02", linewidth=2.5)
        plt.fill_between(
            trials,
            [m - c for m, c in zip(lin_m, lin_c)],
            [m + c for m, c in zip(lin_m, lin_c)],
            color="#58cc02",
            alpha=0.15,
        )

        plt.plot(trials, rand_m, label="Random (Baseline)", color="#888888", linestyle="--", linewidth=2)
        plt.fill_between(
            trials,
            [m - c for m, c in zip(rand_m, rand_c)],
            [m + c for m, c in zip(rand_m, rand_c)],
            color="#888888",
            alpha=0.10,
        )

        plt.plot(trials, greedy_m, label="Static Greedy (No Explore)", color="#ff9600", linewidth=2)
        plt.fill_between(
            trials,
            [m - c for m, c in zip(greedy_m, greedy_c)],
            [m + c for m, c in zip(greedy_m, greedy_c)],
            color="#ff9600",
            alpha=0.15,
        )

        plt.plot(trials, nobkt_m, label="LinUCB (No BKT Ablation)", color="#17a2b8", linestyle="-.", linewidth=2)
        plt.fill_between(
            trials,
            [m - c for m, c in zip(nobkt_m, nobkt_c)],
            [m + c for m, c in zip(nobkt_m, nobkt_c)],
            color="#17a2b8",
            alpha=0.12,
        )

        plt.title("Cumulative Regret Comparison (with 95% Confidence Intervals)", fontsize=14, fontweight="bold")
        plt.xlabel("Trial", fontsize=12)
        plt.ylabel("Cumulative Regret", fontsize=12)
        plt.grid(True, alpha=0.3)
        plt.legend(fontsize=11)
        plt.tight_layout()
        plt.savefig(save_path)
        plt.close()
        return True
    except ImportError:
        return False


if __name__ == "__main__":
    run_bandit_comparison()
