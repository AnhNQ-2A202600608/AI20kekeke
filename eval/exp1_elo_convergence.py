import csv
import math
import os
from typing import Any

from eval.synthetic_students import generate_questions, generate_students, simulate_student_response
from src.services.adaptive.bandit import LinUCB, build_student_context, calculate_bandit_reward
from src.services.adaptive.elo import calculate_elo_updates, calculate_expected_success


def run_elo_convergence(steps: int = 50, seed: int = 42) -> dict[str, Any]:
    import random

    rng = random.Random(seed)

    # 1. Setup Student and Question Pools
    students_rand = generate_students(num_students=50, rng=rng)
    questions_rand = generate_questions(num_questions=100, rng=rng)

    students_adap = generate_students(num_students=50, rng=rng)
    # Clone student abilities to have paired comparison
    for s_a, s_r in zip(students_adap, students_rand):
        s_a.true_elo = s_r.true_elo

    questions_adap = generate_questions(num_questions=100, rng=rng)
    for q_a, q_r in zip(questions_adap, questions_rand):
        q_a.true_difficulty = q_r.true_difficulty

    # 2. Setup Bandit for Adaptive Mode
    bandit = LinUCB(context_dim=3, alpha=1.0)
    arms_states = {q.question_id: bandit.get_default_arm_state() for q in questions_adap}

    history_rand = []
    history_adap = []

    # 3. Simulate step-by-step
    for step in range(1, steps + 1):
        # Step metric accumulators
        se_rand_sq_student = 0.0
        ae_rand_student = 0.0
        se_adap_sq_student = 0.0
        ae_adap_student = 0.0

        # Run Random Mode
        for s in students_rand:
            q = random_select_question(questions_rand, rng)
            # Use pure Elo model without BKT scaling to test pure Elo calibration
            response = simulate_student_response(s, q, use_bkt=False, rng=rng)
            score = 1.0 if response["is_correct"] else 0.0

            # Update estimated Elos
            s.est_elo, q.est_difficulty = calculate_elo_updates(
                student_elo=s.est_elo, question_elo=q.est_difficulty, actual_score=score, hint_count=0
            )

            se_rand_sq_student += (s.est_elo - s.true_elo) ** 2
            ae_rand_student += abs(s.est_elo - s.true_elo)

        # Run Adaptive Mode
        for s in students_adap:
            X = build_student_context(s.est_bkt, s.est_elo)
            candidate_ids = [q.question_id for q in questions_adap]

            selected_qid, expected_reward = bandit.select_arm(
                context_vector=X, arms_states=arms_states, candidate_arm_ids=candidate_ids
            )

            # Find the actual question object
            q = next(qi for qi in questions_adap if qi.question_id == selected_qid)
            # Use pure Elo model without BKT scaling to test pure Elo calibration
            response = simulate_student_response(s, q, use_bkt=False, rng=rng)
            score = 1.0 if response["is_correct"] else 0.0

            # Expected success for bandit reward calculation
            expected_success = calculate_expected_success(s.est_elo, q.est_difficulty)

            # Update Elos
            s.est_elo, q.est_difficulty = calculate_elo_updates(
                student_elo=s.est_elo, question_elo=q.est_difficulty, actual_score=score, hint_count=0
            )

            # Update Bandit
            reward = calculate_bandit_reward(expected_success, score)
            bandit.update_arm(arm_id=selected_qid, context_vector=X, reward=reward, arms_states=arms_states)

            se_adap_sq_student += (s.est_elo - s.true_elo) ** 2
            ae_adap_student += abs(s.est_elo - s.true_elo)

        # Calculate averages for this step
        n_students = len(students_rand)
        rmse_rand = math.sqrt(se_rand_sq_student / n_students)
        mae_rand = ae_rand_student / n_students
        rmse_adap = math.sqrt(se_adap_sq_student / n_students)
        mae_adap = ae_adap_student / n_students

        history_rand.append({"step": step, "rmse": rmse_rand, "mae": mae_rand})
        history_adap.append({"step": step, "rmse": rmse_adap, "mae": mae_adap})

    # 4. Save results to CSV
    os.makedirs("eval/results", exist_ok=True)
    csv_path = "eval/results/exp1_elo_convergence.csv"
    with open(csv_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Step", "Rand_RMSE", "Rand_MAE", "Adap_RMSE", "Adap_MAE"])
        for r, a in zip(history_rand, history_adap):
            writer.writerow([r["step"], r["rmse"], r["mae"], a["rmse"], a["mae"]])

    # 5. Try plotting
    plot_path = "eval/results/exp1_elo_convergence.png"
    has_plotted = try_plot_elo_convergence(history_rand, history_adap, plot_path)

    return {
        "rand_final_rmse": history_rand[-1]["rmse"],
        "rand_final_mae": history_rand[-1]["mae"],
        "adap_final_rmse": history_adap[-1]["rmse"],
        "adap_final_mae": history_adap[-1]["mae"],
        "csv_saved_at": csv_path,
        "plot_saved_at": plot_path if has_plotted else None,
    }


def random_select_question(questions, rng):
    return rng.choice(questions)


def try_plot_elo_convergence(rand_hist, adap_hist, save_path) -> bool:
    try:
        import matplotlib

        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        steps = [r["step"] for r in rand_hist]
        r_rmse = [r["rmse"] for r in rand_hist]
        a_rmse = [a["rmse"] for a in adap_hist]

        plt.figure(figsize=(10, 5))
        plt.plot(steps, r_rmse, label="Random Selection (Baseline)", color="#888888", linestyle="--")
        plt.plot(steps, a_rmse, label="Adaptive Selection (LinUCB)", color="#58cc02", linewidth=2)
        plt.title("Elo Estimation Convergence Profile (RMSE over time)")
        plt.xlabel("Interaction Step")
        plt.ylabel("Student Elo RMSE")
        plt.grid(True, alpha=0.3)
        plt.legend()
        plt.tight_layout()
        plt.savefig(save_path)
        plt.close()
        return True
    except ImportError:
        return False
