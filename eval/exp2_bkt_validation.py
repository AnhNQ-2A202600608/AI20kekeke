import csv
import os
import random
from typing import Any

from eval.synthetic_students import generate_questions, generate_students, simulate_student_response
from src.services.adaptive.bkt import BKTParameters, calculate_bkt_update


def calculate_auc(y_true: list[int], y_scores: list[float]) -> float:
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


def run_bkt_validation(steps: int = 50, seed: int = 42) -> dict[str, Any]:
    rng = random.Random(seed)

    # 1. Setup Parameters
    # Standard cognitive params: guess = 20%, slip = 10%, transition = 6%
    bkt_params = BKTParameters(prior_learned=0.25, transition_learn=0.06, guess=0.20, slip=0.10)
    students = generate_students(num_students=100, rng=rng)

    # Initialize all students to unlearned
    for s in students:
        s.true_bkt_mastery = False
        s.est_bkt = bkt_params.prior_learned

    questions = generate_questions(num_questions=steps, rng=rng)
    history = []

    y_true = []
    y_scores = []

    # Initialize next_step_pred helper
    for s in students:
        s.next_step_pred = s.est_bkt * (1.0 - bkt_params.slip) + (1.0 - s.est_bkt) * bkt_params.guess

    # 2. Simulate step-by-step
    for step in range(1, steps + 1):
        q = questions[step - 1]

        mastered_estimates = []
        unmastered_estimates = []

        for s in students:
            # Simulate outcome based on current true state (before transition)
            response = simulate_student_response(
                s, q, guess=bkt_params.guess, slip=bkt_params.slip, use_bkt=True, bkt_only=True, rng=rng
            )
            score = 1.0 if response["is_correct"] else 0.0

            # If step > 1, we can match the actual score at this step with the prediction made at the previous step
            if step > 1:
                y_true.append(int(score))
                y_scores.append(s.next_step_pred)

            # Update estimated state in BKT
            s.est_bkt = calculate_bkt_update(s.est_bkt, score, bkt_params)

            # Calculate prediction for the next step (step + 1)
            s.next_step_pred = s.est_bkt * (1.0 - bkt_params.slip) + (1.0 - s.est_bkt) * bkt_params.guess

            if s.true_bkt_mastery:
                mastered_estimates.append(s.est_bkt)
            else:
                unmastered_estimates.append(s.est_bkt)

            # Latent state transition: P(T) chance to learn for next practice opportunity
            if not s.true_bkt_mastery:
                if rng.random() < bkt_params.transition_learn:
                    s.true_bkt_mastery = True

        mean_mastered = sum(mastered_estimates) / len(mastered_estimates) if mastered_estimates else 0.0
        mean_unmastered = sum(unmastered_estimates) / len(unmastered_estimates) if unmastered_estimates else 0.0
        n_mastered = len(mastered_estimates)

        history.append(
            {"step": step, "mean_mastered": mean_mastered, "mean_unmastered": mean_unmastered, "n_mastered": n_mastered}
        )

    # 3. Responsiveness Test (Mistake Test)
    # Simulate 1 student who masters, then fails 20 times in a row
    s_test = students[0]
    s_test.est_bkt = 0.9999
    mistake_history = [s_test.est_bkt]
    for _ in range(20):
        s_test.est_bkt = calculate_bkt_update(s_test.est_bkt, 0.0, bkt_params)
        mistake_history.append(s_test.est_bkt)

    # Calculate Latent State Prediction AUC
    auc = calculate_auc(y_true, y_scores)

    # 4. Save results to CSVs
    os.makedirs("eval/results", exist_ok=True)
    csv_path = "eval/results/exp2_bkt_validation.csv"
    with open(csv_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Step", "Mean_Mastered_Est", "Mean_Unmastered_Est", "Num_Mastered"])
        for h in history:
            writer.writerow([h["step"], h["mean_mastered"], h["mean_unmastered"], h["n_mastered"]])

    csv_mistake_path = "eval/results/exp2_bkt_responsiveness.csv"
    with open(csv_mistake_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Mistake_Step", "Est_BKT"])
        for idx, val in enumerate(mistake_history):
            writer.writerow([idx, val])

    # 5. Try plotting
    plot_path = "eval/results/exp2_bkt_validation.png"
    has_plotted = try_plot_bkt_validation(history, mistake_history, plot_path)

    return {
        "final_num_mastered": history[-1]["n_mastered"],
        "mean_mastered_est": history[-1]["mean_mastered"],
        "mean_unmastered_est": history[-1]["mean_unmastered"],
        "responsiveness_final_est": mistake_history[-1],
        "bkt_state_auc": auc,
        "csv_saved_at": csv_path,
        "plot_saved_at": plot_path if has_plotted else None,
    }


def try_plot_bkt_validation(history, mistake_history, save_path) -> bool:
    try:
        import matplotlib

        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        steps = [h["step"] for h in history]
        mastered = [h["mean_mastered"] for h in history]
        unmastered = [h["mean_unmastered"] for h in history]

        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

        ax1.plot(steps, mastered, label="Learners who reached Mastery", color="#58cc02", linewidth=2)
        ax1.plot(steps, unmastered, label="Learners who did NOT reach Mastery", color="#888888", linestyle="--")
        ax1.set_title("BKT Mastery Probability Trajectory")
        ax1.set_xlabel("Practice Opportunity")
        ax1.set_ylabel("Estimated Mastery Prob")
        ax1.grid(True, alpha=0.3)
        ax1.legend()

        ax2.plot(range(len(mistake_history)), mistake_history, color="#ff9600", linewidth=2)
        ax2.set_title("Mastery Trap Responsiveness Test (Forced Mistake)")
        ax2.set_xlabel("Consecutive Incorrect Answers")
        ax2.set_ylabel("Estimated BKT Mastery")
        ax2.grid(True, alpha=0.3)

        plt.tight_layout()
        plt.savefig(save_path)
        plt.close()
        return True
    except ImportError:
        return False


if __name__ == "__main__":
    run_bkt_validation()
