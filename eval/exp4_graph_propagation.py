import time
from typing import Any
from uuid import UUID, uuid4

from src.services.adaptive.database_interface import AdaptiveDatabaseInterface
from src.services.adaptive.graph_propagation import propagate_mastery


class MockAdaptiveDatabase(AdaptiveDatabaseInterface):
    def __init__(self):
        self.relations = []
        self.mastery = {}
        self.log_events = []
        self.update_calls = []

    def get_concept_relations(self, course_id: UUID, status: str | None = None) -> list[dict[str, Any]]:
        if status:
            return [r for r in self.relations if r["status"] == status]
        return self.relations

    def get_student_mastery(self, student_id: UUID, course_id: UUID, concept_id: UUID) -> dict[str, Any]:
        cid = str(concept_id)
        if cid not in self.mastery:
            self.mastery[cid] = {
                "elo_score": 1200.0,
                "bkt_mastery_probability": 0.30,
                "mastery_state": "learning",
                "weakness_flag": True,
                "attempt_count": 0,
                "correct_count": 0,
            }
        return self.mastery[cid]

    def update_student_bkt(
        self,
        student_id: UUID,
        course_id: UUID,
        concept_id: UUID,
        bkt_prob: float,
        mastery_state: str,
        weakness_flag: bool,
    ) -> None:
        cid = str(concept_id)
        self.update_calls.append(cid)
        if cid not in self.mastery:
            self.get_student_mastery(student_id, course_id, concept_id)
        self.mastery[cid]["bkt_mastery_probability"] = bkt_prob
        self.mastery[cid]["mastery_state"] = mastery_state
        self.mastery[cid]["weakness_flag"] = weakness_flag

    def log_mastery_event(
        self,
        student_id: UUID,
        course_id: UUID,
        concept_id: UUID,
        attempt_id: UUID,
        elo_before: float,
        elo_after: float,
        bkt_before: float,
        bkt_after: float,
        state_before: str,
        state_after: str,
    ) -> None:
        self.log_events.append({"concept_id": str(concept_id), "bkt_before": bkt_before, "bkt_after": bkt_after})

    # Dummy implementations for required abstract methods
    def update_student_mastery(self, *args, **kwargs):
        pass

    def get_candidate_questions_meta(self, *args, **kwargs):
        return []

    def get_question_by_id(self, *args, **kwargs):
        return None

    def update_question_elo(self, *args, **kwargs):
        pass

    def get_bandit_policy_state(self, *args, **kwargs):
        return uuid4(), {}

    def update_bandit_policy_config(self, *args, **kwargs):
        pass

    def get_bandit_arm(self, *args, **kwargs):
        return None

    def upsert_bandit_arm(self, *args, **kwargs):
        pass

    def submit_attempt_txn(self, *args, **kwargs):
        return {}

    def submit_attempt_v2(self, *args, **kwargs):
        return {}

    def submit_attempt_v3(self, *args, **kwargs):
        return {}

    def sync_elo_bkt_only(self, *args, **kwargs):
        pass

    def log_adaptive_decision(self, *args, **kwargs):
        return uuid4()

    def get_adaptive_decision(self, *args, **kwargs):
        return None

    def log_quiz_attempt(self, *args, **kwargs):
        return uuid4()

    def log_adaptive_reward(self, *args, **kwargs):
        pass

    def log_question_elo_event(self, *args, **kwargs):
        pass

    def get_all_student_concept_mastery(self, *args, **kwargs):
        return []

    def get_concept_id_by_code(self, *args, **kwargs):
        return None

    def create_concept_relation(self, *args, **kwargs):
        return {}

    def update_concept_relation(self, *args, **kwargs):
        return {}

    def delete_concept_relation(self, *args, **kwargs):
        pass

    def begin(self):
        pass

    def commit(self):
        pass

    def rollback(self):
        pass

    def count_hints(self, *args, **kwargs):
        return 0

    def was_ai_used(self, *args, **kwargs):
        return False

    def delete_calibration_outbox_batch(self, *args, **kwargs):
        pass

    def get_calibration_outbox(self, *args, **kwargs):
        return []

    def get_questions_by_ids(self, *args, **kwargs):
        return []

    def update_question_calibration(self, *args, **kwargs):
        pass

    def upsert_bandit_arm_v3(self, *args, **kwargs):
        pass


def run_graph_propagation_validation() -> dict[str, Any]:
    # 1. Setup Mock DB
    db = MockAdaptiveDatabase()
    course_id = uuid4()
    student_id = uuid4()

    # Define concept UUIDs
    concepts = {name: uuid4() for name in ["A", "B", "C", "D", "E", "F"]}

    # Setup Prerequisite relations
    # A -> B -> C -> A (cycle)
    # C -> D -> E (acyclic branch)
    # F -> A (acyclic helper)
    relations_definition = [("A", "B"), ("B", "C"), ("C", "A"), ("C", "D"), ("D", "E"), ("F", "A")]

    for src_name, tgt_name in relations_definition:
        db.relations.append(
            {
                "id": uuid4(),
                "course_id": course_id,
                "source_concept_id": concepts[src_name],
                "target_concept_id": concepts[tgt_name],
                "relation_type": "Prerequisite_of",
                "weight": 1.0,
                "status": "approved",
            }
        )

    # Set initial masteries (all 0.30)
    for name, cid in concepts.items():
        db.get_student_mastery(student_id, course_id, cid)

    # 2. Test Case 1: Forward Propagation (A increases 0.30 -> 0.80, delta = +0.50)
    # Forward propagation should traverse A -> B -> C -> D -> E
    # It should NOT update F (F is prerequisite of A, not dependent)
    # Visited set should prevent infinite loop back to A
    db.update_calls = []
    db.log_events = []

    from unittest.mock import MagicMock, patch

    mock_cache = MagicMock()
    mock_cache.delete = MagicMock()

    with patch("src.services.cache.get_cache_store", return_value=mock_cache):
        t0 = time.perf_counter()
        modified = propagate_mastery(
            db=db, student_id=student_id, course_id=course_id, concept_id=concepts["A"], old_bkt=0.30, new_bkt=0.80
        )
        t1 = time.perf_counter()
        duration_ms = (t1 - t0) * 1000.0

    # Let's inspect final BKT values
    mastery_after = {name: db.mastery[str(cid)]["bkt_mastery_probability"] for name, cid in concepts.items()}

    # Verify node visits
    unique_visits = len(db.update_calls) == len(set(db.update_calls))
    all_within_bounds = all(0.0 <= v <= 1.0 for v in mastery_after.values())

    # Assert exact expected forward decay values
    # B = 0.30 + 0.25 * 0.50 = 0.425
    # C = 0.30 + 0.25 * (0.425 - 0.30) = 0.3312
    # D = 0.30 + 0.25 * (0.3312 - 0.30) = 0.3078
    # E = 0.30 + 0.25 * (0.3078 - 0.30) = 0.3020
    # F = 0.30 (no update)
    forward_decay_correct = (
        abs(mastery_after["B"] - 0.4250) < 1e-4
        and abs(mastery_after["C"] - 0.3312) < 1e-4
        and abs(mastery_after["D"] - 0.3078) < 1e-4
        and abs(mastery_after["E"] - 0.3020) < 1e-4
        and abs(mastery_after["F"] - 0.3000) < 1e-4
    )

    # Verify cache invalidation calls
    from src.services.cache_keys import mastery_cache_key

    expected_cache_keys = [
        mastery_cache_key(str(student_id), str(course_id), str(concepts[name])) for name in ["B", "C", "D", "E"]
    ]
    actual_deleted_keys = [call[0][0] for call in mock_cache.delete.call_args_list]
    cache_invalidation_verified = all(key in actual_deleted_keys for key in expected_cache_keys)

    # 3. Test Case 2: Backward Propagation (C decreases 0.70 -> 0.30, delta = -0.40)
    # Backward propagation should traverse reverse links to B, A, then F
    db.update_calls = []

    with patch("src.services.cache.get_cache_store", return_value=mock_cache):
        propagate_mastery(
            db=db, student_id=student_id, course_id=course_id, concept_id=concepts["C"], old_bkt=0.70, new_bkt=0.30
        )
    mastery_after_backward = {name: db.mastery[str(cid)]["bkt_mastery_probability"] for name, cid in concepts.items()}

    # Assert exact expected backward decay values
    # Starting values from forward state:
    # B_old = 0.425, A_old = 0.30, F_old = 0.30
    # B_new = 0.425 - 0.25 * 0.40 = 0.325
    # A_new = 0.30 - 0.25 * (0.425 - 0.325) = 0.275
    # F_new = 0.30 - 0.25 * (0.30 - 0.275) = 0.2938
    backward_decay_correct = (
        abs(mastery_after_backward["B"] - 0.3250) < 1e-4
        and abs(mastery_after_backward["A"] - 0.2750) < 1e-4
        and abs(mastery_after_backward["F"] - 0.2938) < 1e-4
    )

    # 4. Stress Test: Large Graph with multiple overlapping cycles
    # Generate 40 nodes: Node_0 -> Node_1 -> ... -> Node_39 -> Node_0
    # Add random chords
    db_stress = MockAdaptiveDatabase()
    stress_nodes = [uuid4() for _ in range(40)]
    for i in range(40):
        db_stress.relations.append(
            {
                "id": uuid4(),
                "course_id": course_id,
                "source_concept_id": stress_nodes[i],
                "target_concept_id": stress_nodes[(i + 1) % 40],
                "relation_type": "Prerequisite_of",
                "weight": 1.0,
                "status": "approved",
            }
        )
        # Add a chord to complicate loops
        if i % 5 == 0:
            db_stress.relations.append(
                {
                    "id": uuid4(),
                    "course_id": course_id,
                    "source_concept_id": stress_nodes[i],
                    "target_concept_id": stress_nodes[(i + 15) % 40],
                    "relation_type": "Prerequisite_of",
                    "weight": 1.0,
                    "status": "approved",
                }
            )

    # Initialize mastery for stress nodes
    for node in stress_nodes:
        db_stress.get_student_mastery(student_id, course_id, node)

    t0_stress = time.perf_counter()
    propagate_mastery(
        db=db_stress, student_id=student_id, course_id=course_id, concept_id=stress_nodes[0], old_bkt=0.30, new_bkt=0.90
    )
    t1_stress = time.perf_counter()
    stress_duration_ms = (t1_stress - t0_stress) * 1000.0

    return {
        "forward_updated_nodes": list(modified),
        "duration_ms": duration_ms,
        "unique_visits_confirmed": unique_visits,
        "all_within_bounds": all_within_bounds,
        "forward_decay_correct": forward_decay_correct,
        "backward_decay_correct": backward_decay_correct,
        "cache_invalidation_verified": cache_invalidation_verified,
        "mastery_after_forward": mastery_after,
        "mastery_after_backward": mastery_after_backward,
        "stress_test_nodes_count": 40,
        "stress_test_duration_ms": stress_duration_ms,
    }
