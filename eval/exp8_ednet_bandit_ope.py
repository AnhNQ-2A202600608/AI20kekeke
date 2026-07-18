import csv
import os
import random
import sys
from pathlib import Path
from typing import Any

# Resolve import paths by adding parent directory to sys.path
sys.path.append(str(Path(__file__).parent.parent))

import numpy as np
import pandas as pd

from src.services.adaptive.bandit import LinUCB, build_student_context, calculate_bandit_reward
from src.services.adaptive.bkt import BKTParameters, calculate_bkt_update
from src.services.adaptive.elo import calculate_elo_updates, calculate_expected_success


def generate_synthetic_ednet(path: str):
    """
    Tự động sinh mock data EdNet subset nếu chưa có file thực tế, giúp script chạy thông suốt.
    """
    print(f"Generating synthetic EdNet dataset at {path}...")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    rng = np.random.default_rng(42)
    records = []

    # Giả định 100 câu hỏi thuộc 10 kỹ năng
    questions = [f"q_{i}" for i in range(100)]
    skills = [f"skill_{i // 10}" for i in range(100)]

    # 200 học sinh, mỗi người làm 50 bài -> 10,000 dòng tương tác
    for u_id in range(1, 201):
        timestamp = 1577836800000  # 2020-01-01
        for seq in range(50):
            q_idx = rng.integers(0, 100)
            q_id = questions[q_idx]
            s_id = skills[q_idx]
            correct = int(rng.choice([0, 1], p=[0.4, 0.6]))
            elapsed_time = rng.integers(5000, 30000)
            records.append(
                {
                    "timestamp": timestamp,
                    "user_id": u_id,
                    "solving_id": seq // 5,
                    "question_id": q_id,
                    "user_answer": "a" if correct else "b",
                    "correct": correct,
                    "elapsed_time": elapsed_time,
                    "skill_id": s_id,
                }
            )
            timestamp += int(rng.integers(60000, 3600000))

    df = pd.DataFrame(records)
    df.to_csv(path, index=False)
    print(f"Synthetic EdNet dataset of {len(df)} rows created successfully.")


def run_bandit_ope(
    data_path: str = "eval/data/ednet_subset.csv", candidate_pool_size: int = 5, seed: int = 42
) -> dict[str, Any]:
    print(f"Loading EdNet dataset from {data_path}...")
    if not os.path.exists(data_path):
        generate_synthetic_ednet(data_path)

    df = pd.read_csv(data_path)
    if "subject_id" in df.columns and "user_id" not in df.columns:
        df = df.rename(columns={"subject_id": "user_id"})
    df = df.sort_values(by=["user_id", "timestamp"])

    # Khởi tạo mô hình bandit
    bandit = LinUCB(context_dim=3, alpha=1.0)
    bkt_params = BKTParameters()
    rng = random.Random(seed)

    # Lấy danh sách toàn bộ câu hỏi để làm distractor (đối vật gây nhiễu)
    all_questions = df["question_id"].unique().tolist()
    if len(all_questions) < candidate_pool_size:
        all_questions = all_questions + [f"q_dummy_{i}" for i in range(candidate_pool_size)]

    # Tối ưu hóa bằng cách chuyển các cột thành NumPy arrays để zip thay vì df.iterrows()
    u_ids = df["user_id"].values
    q_ids = df["question_id"].values
    s_ids = df["skill_id"].values
    corrects = df["correct"].values
    hints = df["hint_count"].values if "hint_count" in df.columns else np.zeros(len(df))

    # --- CHẠY LINUCB & RANDOM REPLAY MATCH TRONG CÙNG MỘT VÒNG LẶP ---
    print("Simulating LinUCB & Random Replay Match in a single pass...")
    linucb_arms = {q: bandit.get_default_arm_state() for q in all_questions}
    student_bkt_lin = {}
    student_elo_lin = {}
    question_elo_lin = {}
    linucb_matched_rewards = []
    linucb_cumulative_reward = 0.0

    student_bkt_rand = {}
    student_elo_rand = {}
    question_elo_rand = {}
    random_matched_rewards = []
    random_cumulative_reward = 0.0

    # Khởi tạo generator ngẫu nhiên với seed ổn định
    rng = random.Random(seed)

    for u_id, q_id, s_id, correct, hint in zip(u_ids, q_ids, s_ids, corrects, hints):
        # Khởi tạo trạng thái nếu chưa có (cho LinUCB)
        if (u_id, s_id) not in student_bkt_lin:
            student_bkt_lin[(u_id, s_id)] = bkt_params.prior_learned
        if u_id not in student_elo_lin:
            student_elo_lin[u_id] = 1200.0
        if q_id not in question_elo_lin:
            question_elo_lin[q_id] = 1200.0

        # Khởi tạo trạng thái nếu chưa có (cho Random)
        if (u_id, s_id) not in student_bkt_rand:
            student_bkt_rand[(u_id, s_id)] = bkt_params.prior_learned
        if u_id not in student_elo_rand:
            student_elo_rand[u_id] = 1200.0
        if q_id not in question_elo_rand:
            question_elo_rand[q_id] = 1200.0

        # Tạo candidate set có kích thước candidate_pool_size chứa q_id thực tế
        # Tối ưu hóa O(k) thay vì O(Q) bằng cách chọn ngẫu nhiên trực tiếp và thay thế nếu thiếu q_id
        candidates = rng.sample(all_questions, candidate_pool_size)
        if q_id not in candidates:
            candidates[0] = q_id
        rng.shuffle(candidates)

        # A. Chạy mô phỏng LinUCB
        p_mastery_lin = student_bkt_lin[(u_id, s_id)]
        s_elo_lin = student_elo_lin[u_id]
        X = build_student_context(p_mastery_lin, s_elo_lin)

        # LinUCB chọn câu hỏi
        selected_qid_lin, _ = bandit.select_arm(X, linucb_arms, candidates)

        # Replay Match Check cho LinUCB
        if selected_qid_lin == q_id:
            expected_success_lin = calculate_expected_success(s_elo_lin, question_elo_lin[q_id])
            reward_lin = calculate_bandit_reward(expected_success_lin, correct)
            bandit.update_arm(selected_qid_lin, X, reward_lin, linucb_arms)

            student_bkt_lin[(u_id, s_id)] = calculate_bkt_update(p_mastery_lin, correct == 1, bkt_params)
            new_s_elo_lin, new_q_elo_lin = calculate_elo_updates(
                s_elo_lin, question_elo_lin[q_id], float(correct), hint_count=hint
            )
            student_elo_lin[u_id] = new_s_elo_lin
            question_elo_lin[q_id] = new_q_elo_lin

            linucb_cumulative_reward += reward_lin
            linucb_matched_rewards.append(linucb_cumulative_reward)

        # B. Chạy mô phỏng Random
        selected_qid_rand = rng.choice(candidates)

        # Replay Match Check cho Random
        if selected_qid_rand == q_id:
            s_elo_rand = student_elo_rand[u_id]
            expected_success_rand = calculate_expected_success(s_elo_rand, question_elo_rand[q_id])
            reward_rand = calculate_bandit_reward(expected_success_rand, correct)

            p_mastery_rand = student_bkt_rand[(u_id, s_id)]
            student_bkt_rand[(u_id, s_id)] = calculate_bkt_update(p_mastery_rand, correct == 1, bkt_params)
            new_s_elo_rand, new_q_elo_rand = calculate_elo_updates(
                s_elo_rand, question_elo_rand[q_id], float(correct), hint_count=hint
            )
            student_elo_rand[u_id] = new_s_elo_rand
            question_elo_rand[q_id] = new_q_elo_rand

            random_cumulative_reward += reward_rand
            random_matched_rewards.append(random_cumulative_reward)

    # Cân bằng độ dài để lưu file CSV và vẽ biểu đồ dễ dàng
    min_matches = min(len(linucb_matched_rewards), len(random_matched_rewards))
    linucb_matched_rewards = linucb_matched_rewards[:min_matches]
    random_matched_rewards = random_matched_rewards[:min_matches]

    print(f"Simulation finished. Total matched trials: {min_matches}")
    print(f"LinUCB final cumulative reward: {linucb_matched_rewards[-1]:.2f}")
    print(f"Random final cumulative reward: {random_matched_rewards[-1]:.2f}")

    # Ghi kết quả ra CSV
    os.makedirs("eval/results", exist_ok=True)
    csv_out_path = "eval/results/exp8_ednet_bandit_ope.csv"
    with open(csv_out_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Trial", "LinUCB_CumReward", "Random_CumReward"])
        for idx in range(min_matches):
            writer.writerow([idx + 1, linucb_matched_rewards[idx], random_matched_rewards[idx]])
    print(f"OPE simulation results saved to {csv_out_path}")

    # Vẽ biểu đồ so sánh đường tích lũy phần thưởng
    plot_path = "eval/results/exp8_ednet_bandit_ope.png"
    has_plotted = try_plot_ope(linucb_matched_rewards, random_matched_rewards, plot_path)

    return {
        "matched_trials": min_matches,
        "linucb_final_reward": linucb_matched_rewards[-1] if min_matches > 0 else 0.0,
        "random_final_reward": random_matched_rewards[-1] if min_matches > 0 else 0.0,
        "csv_saved_at": csv_out_path,
        "plot_saved_at": plot_path if has_plotted else None,
    }


def try_plot_ope(linucb_rewards, random_rewards, save_path) -> bool:
    try:
        import matplotlib

        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        trials = list(range(1, len(linucb_rewards) + 1))

        plt.figure(figsize=(10, 6))
        plt.plot(trials, linucb_rewards, label="LinUCB Bandit Policy", color="#58cc02", linewidth=2.5)
        plt.plot(trials, random_rewards, label="Random Policy (Baseline)", color="#888888", linestyle="--", linewidth=2)
        plt.title("Off-Policy Evaluation (OPE) on EdNet via Replay Match", fontsize=12, fontweight="bold")
        plt.xlabel("Matched Trial Number", fontsize=10)
        plt.ylabel("Cumulative Expected ZPD Reward", fontsize=10)
        plt.grid(True, alpha=0.3)
        plt.legend(fontsize=10)
        plt.tight_layout()
        plt.savefig(save_path, dpi=300)
        plt.close()
        return True
    except Exception as e:
        print(f"Warning: Failed to plot OPE results: {e}")
        return False


if __name__ == "__main__":
    res = run_bandit_ope()
    print("\n--- OPE Results ---")
    print(f"Matched Trials: {res['matched_trials']}")
    print(f"LinUCB Reward:  {res['linucb_final_reward']:.2f}")
    print(f"Random Reward:  {res['random_final_reward']:.2f}")
