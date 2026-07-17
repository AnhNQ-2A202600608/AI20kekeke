import json
import os
from pathlib import Path

from src.pipeline.graphusion.fuse_graphs import get_any_cycle

PROJECT_ROOT = Path(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def test_cycle_detector_unit_test():
    """
    Test cycle detection logic using dummy graphs.
    """
    nodes = ["A", "B", "C", "D"]

    # Cyclic graph: A -> B -> C -> A
    cyclic_edges = [("A", "B"), ("B", "C"), ("C", "A")]
    cycle = get_any_cycle(nodes, cyclic_edges)
    assert cycle is not None
    assert set(cycle) == {"A", "B", "C"}

    # Acyclic graph: A -> B -> C, A -> C
    acyclic_edges = [("A", "B"), ("B", "C"), ("A", "C")]
    cycle = get_any_cycle(nodes, acyclic_edges)
    assert cycle is None


def test_fused_graph_is_dag():
    """
    Verify that the final fused graph contains no cycles in Prerequisite_of relations.
    """
    fused_graph_path = PROJECT_ROOT / "outputs" / "fused_graph.json"
    assert fused_graph_path.exists(), f"File {fused_graph_path} does not exist"

    with open(fused_graph_path, encoding="utf-8") as f:
        graph = json.load(f)

    concepts = graph["concepts"]
    relations = graph["relations"]

    concept_codes = [c["code"] for c in concepts]

    # Only check "Prerequisite_of" relations for DAG constraints
    prereq_edges = [(r["source"], r["target"]) for r in relations if r["relation"] == "Prerequisite_of"]

    cycle = get_any_cycle(concept_codes, prereq_edges)
    assert cycle is None, f"Cycle detected in prerequisite graph: {' -> '.join(cycle)}"


def test_fused_graph_chronological_constraints():
    """
    Verify that for all Prerequisite_of relations, the source day is <= target day.
    """
    fused_graph_path = PROJECT_ROOT / "outputs" / "fused_graph.json"
    assert fused_graph_path.exists()

    with open(fused_graph_path, encoding="utf-8") as f:
        graph = json.load(f)

    concepts = graph["concepts"]
    relations = graph["relations"]

    concept_day_map = {c["code"]: c.get("day", 1) for c in concepts}

    for r in relations:
        if r["relation"] == "Prerequisite_of":
            source = r["source"]
            target = r["target"]
            day_s = concept_day_map[source]
            day_t = concept_day_map[target]

            assert day_s <= day_t, (
                f"Chronological violation: {source} (Day {day_s}) -> Prerequisite_of -> {target} (Day {day_t})"
            )


def test_track_division_in_seeds():
    """
    Verify that for Days 17-24, concepts are divided by track and not merged.
    """
    seed_concepts_path = PROJECT_ROOT / "outputs" / "seed_concepts.json"
    assert seed_concepts_path.exists()

    with open(seed_concepts_path, encoding="utf-8") as f:
        concepts = json.load(f)

    # Group concepts by day
    day_concepts = {}
    for c in concepts:
        day = c.get("day")
        if day not in day_concepts:
            day_concepts[day] = []
        day_concepts[day].append(c)

    # For days 17 to 24, there should be concepts representing all 3 tracks
    for day in range(17, 25):
        assert day in day_concepts, f"No concepts found for Day {day}"
        day_codes = [c["code"] for c in day_concepts[day]]
        day_names = [c["name"] for c in day_concepts[day]]

        # Verify separate track prefixes exist
        t1_found = any(code.startswith("t1-") for code in day_codes)
        t2_found = any(code.startswith("t2-") for code in day_codes)
        t3_found = any(code.startswith("t3-") for code in day_codes)

        assert t1_found, f"Track 1 concept missing on Day {day}. Codes: {day_codes}"
        assert t2_found, f"Track 2 concept missing on Day {day}. Codes: {day_codes}"
        assert t3_found, f"Track 3 concept missing on Day {day}. Codes: {day_codes}"

        # Verify names have [T1], [T2], [T3] prefix
        assert any(name.startswith("[T1]") for name in day_names)
        assert any(name.startswith("[T2]") for name in day_names)
        assert any(name.startswith("[T3]") for name in day_names)
