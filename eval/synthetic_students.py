import math
import random
from typing import Any


class VirtualStudent:
    def __init__(self, student_id: str, true_elo: float, initial_est_elo: float = 1200.0):
        self.student_id = student_id
        self.true_elo = true_elo
        self.est_elo = initial_est_elo
        self.true_bkt_mastery = False  # Latent state (False: unlearned, True: learned)
        self.est_bkt = 0.25  # Estimated BKT probability


class VirtualQuestion:
    def __init__(
        self, question_id: str, true_difficulty: float, initial_est_diff: float = 1200.0, concept_id: str = "concept_1"
    ):
        self.question_id = question_id
        self.true_difficulty = true_difficulty
        self.est_difficulty = initial_est_diff
        self.concept_id = concept_id


def generate_students(
    num_students: int = 100, mean_elo: float = 1500.0, std_elo: float = 200.0, rng: random.Random | None = None
) -> list[VirtualStudent]:
    if rng is None:
        rng = random
    students = []
    for i in range(num_students):
        # Generate normal-like distribution using Box-Muller transform
        u1 = rng.random()
        u1 = max(u1, 1e-12)
        u2 = rng.random()
        z0 = math.sqrt(-2.0 * math.log(u1)) * math.cos(2.0 * math.pi * u2)
        true_elo = mean_elo + z0 * std_elo
        students.append(VirtualStudent(f"student_{i}", true_elo))
    return students


def generate_questions(
    num_questions: int = 150,
    mean_diff: float = 1500.0,
    std_diff: float = 250.0,
    concept_id: str = "concept_1",
    rng: random.Random | None = None,
) -> list[VirtualQuestion]:
    if rng is None:
        rng = random
    questions = []
    for i in range(num_questions):
        u1 = rng.random()
        u1 = max(u1, 1e-12)
        u2 = rng.random()
        z0 = math.sqrt(-2.0 * math.log(u1)) * math.cos(2.0 * math.pi * u2)
        true_diff = mean_diff + z0 * std_diff
        questions.append(VirtualQuestion(f"q_{i}", true_diff, concept_id=concept_id))
    return questions


def simulate_student_response(
    student: VirtualStudent,
    question: VirtualQuestion,
    guess: float = 0.20,
    slip: float = 0.10,
    use_bkt: bool = True,
    bkt_only: bool = False,
    rng: random.Random | None = None,
) -> dict[str, Any]:
    """
    Simulates a student response using their latent true parameters.
    True success probability is derived from:
    1. Elo probability P(correct_elo) = 1 / (1 + 10^((question_diff - student_elo) / 400))
    2. BKT state logic:
       - If student has true mastery: P(correct) = P(correct_elo) * (1 - slip)
       - If student does not have mastery: P(correct) = P(correct_elo) * guess
    """
    if rng is None:
        rng = random
    exponent = (question.true_difficulty - student.true_elo) / 400.0
    exponent = min(20.0, max(-20.0, exponent))
    p_success_elo = 1.0 / (1.0 + 10.0**exponent)

    if bkt_only:
        p_success = (1.0 - slip) if student.true_bkt_mastery else guess
    elif not use_bkt:
        p_success = p_success_elo
    else:
        if student.true_bkt_mastery:
            p_success = p_success_elo * (1.0 - slip)
        else:
            p_success = p_success_elo * guess

    is_correct = rng.random() < p_success

    return {"is_correct": is_correct, "true_success_prob": p_success, "p_success_elo": p_success_elo}
