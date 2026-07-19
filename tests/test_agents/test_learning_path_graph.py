from uuid import uuid4

import pytest

from src.agents.learning_path.graph import learning_path_agent
from src.agents.learning_path.nodes.evaluation_critic_node import evaluation_critic_node
from src.agents.learning_path.nodes.topo_sort_node import topo_sort_node


@pytest.mark.asyncio
async def test_learning_path_agent_basic_flow(mock_llm):
    """Kiểm tra luồng hoạt động cơ bản của Learning Path Agent (trong môi trường stub)."""
    student_id = str(uuid4())
    course_id = str(uuid4())
    exam_attempt_id = str(uuid4())

    state = {
        "student_id": student_id,
        "course_id": course_id,
        "exam_attempt_id": exam_attempt_id,
        "timings_ms": {},
    }

    result = await learning_path_agent.ainvoke(state)

    assert "error" not in result
    assert "path_instance_id" in result
    assert "path_data" in result
    assert "milestones" in result["path_data"]
    assert len(result["path_data"]["milestones"]) > 0


def test_topo_sort_node_respects_prerequisites(monkeypatch):
    """Kiểm tra thuật toán Kahn sắp xếp đúng thứ tự tiên quyết của các concepts."""
    # Mock database relations & concepts
    mock_relations = [
        {
            "source_concept_id": "concept-1",
            "target_concept_id": "concept-2",
            "relation_type": "Prerequisite_of",
        },
        {
            "source_concept_id": "concept-2",
            "target_concept_id": "concept-3",
            "relation_type": "Prerequisite_of",
        },
    ]

    class MockAppClient:
        def table(self, name):
            class TableQuery:
                def select(self, *args, **kwargs):
                    return self

                def eq(self, *args, **kwargs):
                    return self

                def execute(self):
                    # Mock response for concepts
                    class Resp:
                        data = [
                            {"id": "concept-1", "name": "Concept 1", "status": "active"},
                            {"id": "concept-2", "name": "Concept 2", "status": "active"},
                            {"id": "concept-3", "name": "Concept 3", "status": "active"},
                        ]

                    return Resp()

            return TableQuery()

    class MockDB:
        _stub_mode = False
        app_client = MockAppClient()

        def get_concept_relations(self, course_id, status=None):
            return mock_relations

        def get_student_mastery(self, student_id, course_id, concept_id):
            # Tất cả đều chưa làm chủ (bkt = 0.2)
            return {"bkt_mastery_probability": 0.20}

    # Inject mock db
    monkeypatch.setattr("src.agents.learning_path.nodes.topo_sort_node.get_adaptive_db", lambda: MockDB())

    # Khởi chạy topo sort node
    state = {
        "student_id": str(uuid4()),
        "course_id": str(uuid4()),
        "weak_concept_ids": ["concept-3", "concept-1", "concept-2"],
        "timings_ms": {},
    }

    res = topo_sort_node(state)
    topo_sorted = res.get("topo_sorted_concepts")

    # Thứ tự đúng phải là: concept-1 -> concept-2 -> concept-3
    assert topo_sorted == ["concept-1", "concept-2", "concept-3"]


@pytest.mark.asyncio
async def test_evaluation_critic_node_assigns_correct_tasks(monkeypatch):
    """Kiểm tra gán đúng loại nhiệm vụ dựa trên phân loại lỗi (careless vs conceptual)."""

    class MockAppClient:
        def table(self, name):
            class TableQuery:
                def select(self, *args, **kwargs):
                    return self

                def eq(self, *args, **kwargs):
                    return self

                def in_(self, *args, **kwargs):
                    return self

                def execute(self):
                    class Resp:
                        data = []  # No material chunks

                    return Resp()

            return TableQuery()

    class MockDB:
        _stub_mode = False
        app_client = MockAppClient()

        def get_concept_relations(self, course_id, status=None):
            return []

    monkeypatch.setattr("src.agents.learning_path.nodes.evaluation_critic_node.get_adaptive_db", lambda: MockDB())

    state = {
        "course_id": str(uuid4()),
        "topo_sorted_concepts": ["concept-careless", "concept-conceptual"],
        "llm_analysis": {
            "concept-careless": {"error_type": "careless", "reason": "Simple slip"},
            "concept-conceptual": {"error_type": "conceptual", "reason": "No understanding"},
        },
        "timings_ms": {},
    }

    res = await evaluation_critic_node(state)
    milestones = res.get("draft_milestones")

    assert len(milestones) == 2

    # Milestone 1: careless -> chỉ có 1 practice task với difficulty=quick
    m1 = milestones[0]
    assert m1["error_type"] == "careless"
    assert len(m1["tasks"]) == 1
    assert m1["tasks"][0]["type"] == "practice"
    assert m1["tasks"][0]["difficulty"] == "quick"

    # Milestone 2: conceptual -> slide, video, practice (difficulty=deep)
    m2 = milestones[1]
    assert m2["error_type"] == "conceptual"
    assert len(m2["tasks"]) == 3
    task_types = [t["type"] for t in m2["tasks"]]
    assert "slide" in task_types
    assert "video" in task_types
    assert "practice" in task_types

    deep_practice = [t for t in m2["tasks"] if t["type"] == "practice"][0]
    assert deep_practice["difficulty"] == "deep"
