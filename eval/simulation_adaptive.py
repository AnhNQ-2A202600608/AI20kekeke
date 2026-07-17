import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

import random

from src.services.adaptive.bandit import LinUCB, build_student_context, calculate_bandit_reward
from src.services.adaptive.bkt import BKTParameters, calculate_bkt_update
from src.services.adaptive.elo import calculate_elo_updates, calculate_expected_success


def run_simulation():
    print("=" * 60)
    print("SIMULATING ADAPTIVE LEARNING ENGINE (BKT + ELO + LINUCB)")
    print("=" * 60)

    # 1. Setup Simulation Parameters
    true_student_elo = 1500.0  # True latent ability of student
    _true_student_bkt_mastery = True  # Student has mastered the concept basic skills

    # 10 Questions with true difficulties
    questions = [{"id": f"q_{i}", "true_diff": 1000.0 + i * 100, "est_diff": 1200.0} for i in range(10)]

    # Initialize BKT parameters
    bkt_params = BKTParameters(prior_learned=0.25, transition_learn=0.1, guess=0.2, slip=0.1)

    # Initial estimated states
    est_student_elo = 1200.0
    est_student_bkt = 0.25

    # Initialize Bandit states
    bandit = LinUCB(context_dim=3, alpha=1.0)
    arms_states = {q["id"]: bandit.get_default_arm_state() for q in questions}

    print(f"True Student Elo: {true_student_elo:.1f}")
    print("Initial Student Est. Elo: 1200.0 | Est. BKT: 0.25")
    print("-" * 60)
    print(
        f"{'Step':<5} | {'Selected':<8} | {'Est Elo':<8} | {'Est BKT':<8} | {'Q Elo':<8} | {'Actual':<6} | {'Reward':<6}"
    )
    print("-" * 60)

    # Run 30 steps
    for step in range(1, 31):
        # Build student context
        X = build_student_context(est_student_bkt, est_student_elo)

        # Select best question
        candidate_ids = [q["id"] for q in questions]
        selected_qid, expected_reward = bandit.select_arm(
            context_vector=X, arms_states=arms_states, candidate_arm_ids=candidate_ids
        )

        # Get selected question
        q_idx = int(selected_qid.split("_")[1])
        question = questions[q_idx]

        # Calculate expected success based on estimated Elo
        expected_success = calculate_expected_success(est_student_elo, question["est_diff"])

        # Calculate true probability of success based on true Elo
        true_success_prob = 1.0 / (1.0 + 10.0 ** ((question["true_diff"] - true_student_elo) / 400.0))

        # Simulate student response
        is_correct = random.random() < true_success_prob
        actual_score = 1.0 if is_correct else 0.0

        # Update BKT
        old_bkt = est_student_bkt
        est_student_bkt = calculate_bkt_update(old_bkt, actual_score, bkt_params)

        # Update Elos (student and question difficulty)
        old_student_elo = est_student_elo
        old_q_elo = question["est_diff"]

        est_student_elo, new_q_elo = calculate_elo_updates(
            student_elo=old_student_elo, question_elo=old_q_elo, actual_score=actual_score, hint_count=0
        )

        # Update the estimated question Elo in our list
        question["est_diff"] = new_q_elo

        # Calculate bandit reward
        reward = calculate_bandit_reward(expected_success, actual_score)

        # Update bandit weights
        bandit.update_arm(arm_id=selected_qid, context_vector=X, reward=reward, arms_states=arms_states)

        actual_str = "CORR" if is_correct else "WRONG"
        print(
            f"{step:<5} | {selected_qid:<8} | {est_student_elo:<8.1f} | {est_student_bkt:<8.4f} | {new_q_elo:<8.1f} | {actual_str:<6} | {reward:<6.3f}"
        )

    print("=" * 60)
    print("SIMULATION COMPLETED!")
    print(f"Final Est. Student Elo: {est_student_elo:.1f} (True: {true_student_elo:.1f})")
    print(f"Final Est. BKT Mastery Probability: {est_student_bkt:.4f}")
    print("=" * 60)


if __name__ == "__main__":
    run_simulation()
