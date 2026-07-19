import logging
from collections import deque
from uuid import UUID

from src.agents.learning_path.state import LearningPathState
from src.api.adaptive_routes import get_adaptive_db

logger = logging.getLogger(__name__)


def topo_sort_node(state: LearningPathState) -> dict:
    """Node thực hiện Topological Sort trên đồ thị con của các concept bị hổng và prerequisites chưa làm chủ."""
    timings = state.get("timings_ms") or {}
    import time

    start_time = time.perf_counter()

    student_id = state.get("student_id")
    course_id = state.get("course_id")
    weak_concept_ids = state.get("weak_concept_ids") or []

    if not student_id or not course_id:
        return {"error": "Missing student_id or course_id in state", "topo_sorted_concepts": []}

    try:
        db = get_adaptive_db()
        if db._stub_mode or db.app_client is None:
            logger.info("Database is in STUB mode. Mocking topo sort response.")
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            timings["topo_sort_node"] = elapsed_ms
            return {"topo_sorted_concepts": weak_concept_ids, "timings_ms": timings}

        # 1. Lấy tất cả quan hệ prerequisite trong khóa học
        # db.get_concept_relations trả về list[dict]
        relations = db.get_concept_relations(UUID(course_id), status="approved")
        prereqs = [r for r in relations if r.get("relation_type") == "Prerequisite_of"]

        # 2. Xây dựng map kề phục vụ duyệt ngược (child -> parents)
        parent_map = {}  # child_id -> list of parent_ids
        for r in prereqs:
            parent_id = str(r["source_concept_id"])
            child_id = str(r["target_concept_id"])
            if child_id not in parent_map:
                parent_map[child_id] = []
            parent_map[child_id].append(parent_id)

        # 3. Lấy thông tin active concepts để lọc
        concepts_resp = (
            db.app_client.table("concepts").select("id, name, status").eq("course_id", str(course_id)).execute()
        )
        active_concept_ids = set()
        concept_names = {}
        for c in concepts_resp.data or []:
            c_id = str(c["id"])
            concept_names[c_id] = c.get("name", "Khái niệm")
            if c.get("status") == "active":
                active_concept_ids.add(c_id)

        # Lọc weak_concept_ids chỉ giữ lại các active concepts
        weak_concept_ids = [cid for cid in weak_concept_ids if cid in active_concept_ids]

        # 4. Duyệt ngược từ các weak concepts để tìm toàn bộ prerequisites của chúng
        nodes_to_sort = set(weak_concept_ids)
        queue = deque(weak_concept_ids)
        visited = set(weak_concept_ids)

        while queue:
            curr = queue.popleft()
            parents = parent_map.get(curr, [])
            for parent in parents:
                # Chỉ xử lý các active concepts
                if parent not in active_concept_ids:
                    continue
                if parent not in visited:
                    visited.add(parent)
                    # Kiểm tra xem parent đã làm chủ (mastered) chưa
                    try:
                        mastery = db.get_student_mastery(UUID(student_id), UUID(course_id), UUID(parent))
                        bkt_prob = mastery.get("bkt_mastery_probability", 0.25)
                    except Exception as e:
                        logger.warning(f"Failed to fetch mastery for concept {parent}: {e}")
                        bkt_prob = 0.25

                    # Nếu chưa làm chủ (bkt < 0.50), bắt buộc học viên phải học
                    if bkt_prob < 0.50:
                        nodes_to_sort.add(parent)
                        queue.append(parent)

        # 5. Xây dựng đồ thị con xuôi (parent -> children) chỉ chứa các nodes trong nodes_to_sort
        adj = {node: [] for node in nodes_to_sort}
        in_degree = {node: 0 for node in nodes_to_sort}

        for r in prereqs:
            parent = str(r["source_concept_id"])
            child = str(r["target_concept_id"])
            if parent in nodes_to_sort and child in nodes_to_sort:
                adj[parent].append(child)
                in_degree[child] += 1

        # 6. Kahn's Algorithm (BFS topological sort)
        sort_queue = deque([node for node in nodes_to_sort if in_degree[node] == 0])
        topo_sorted = []

        while sort_queue:
            # Sắp xếp nhẹ theo tên để đảm bảo tính deterministic nếu cùng mức độ ưu tiên
            sort_queue = deque(sorted(list(sort_queue), key=lambda x: concept_names.get(x, "")))
            curr = sort_queue.popleft()
            topo_sorted.append(curr)

            for neighbor in adj[curr]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    sort_queue.append(neighbor)

        # Cycle protection fallback (nếu có vòng lặp, thêm các node còn lại)
        if len(topo_sorted) < len(nodes_to_sort):
            logger.warning("Cycle detected in concept graph! Falling back to raw list.")
            remaining = nodes_to_sort - set(topo_sorted)
            topo_sorted.extend(sorted(list(remaining), key=lambda x: concept_names.get(x, "")))

        elapsed_ms = (time.perf_counter() - start_time) * 1000
        timings["topo_sort_node"] = elapsed_ms

        return {"topo_sorted_concepts": topo_sorted, "timings_ms": timings}

    except Exception as e:
        logger.error(f"Error in topo_sort_node: {e}", exc_info=True)
        return {"error": f"Internal error in topo_sort_node: {str(e)}", "topo_sorted_concepts": []}
