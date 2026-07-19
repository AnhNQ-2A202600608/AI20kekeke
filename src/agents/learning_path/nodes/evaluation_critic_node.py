import logging
from uuid import UUID

from src.agents.learning_path.state import LearningPathState
from src.api.adaptive_routes import get_adaptive_db

logger = logging.getLogger(__name__)


async def evaluation_critic_node(state: LearningPathState) -> dict:
    """Evaluation Agent (Critic) hợp nhất kết quả LLM analysis và Topo Sort để gán các task phù hợp."""
    timings = state.get("timings_ms") or {}
    import time

    start_time = time.perf_counter()

    course_id = state.get("course_id")
    topo_sorted_concepts = state.get("topo_sorted_concepts") or []
    llm_analysis = state.get("llm_analysis") or {}

    if not course_id:
        return {"error": "Missing course_id in state", "draft_milestones": []}

    if not topo_sorted_concepts:
        elapsed_ms = (time.perf_counter() - start_time) * 1000
        timings["evaluation_critic_node"] = elapsed_ms
        return {"draft_milestones": [], "timings_ms": timings}

    try:
        db = get_adaptive_db()
        if db._stub_mode or db.app_client is None:
            logger.info("Database is in STUB mode. Mocking draft milestones.")
            draft_milestones = []
            for idx, concept_id in enumerate(topo_sorted_concepts):
                analysis = llm_analysis.get(concept_id) or {}
                error_type = analysis.get("error_type", "conceptual")
                status = "unlocked" if idx == 0 else "locked"

                # Mock tasks
                tasks = []
                if error_type == "careless":
                    tasks.append({"type": "practice", "content_id": None, "difficulty": "quick"})
                else:
                    tasks.extend(
                        [
                            {"type": "slide", "content_id": None, "difficulty": None},
                            {"type": "video", "content_id": None, "difficulty": None},
                            {"type": "practice", "content_id": None, "difficulty": "deep"},
                        ]
                    )

                # Prerequisites: the previous element in list for simple mock linear prerequisite chain
                prereqs_list = [topo_sorted_concepts[idx - 1]] if idx > 0 else []

                draft_milestones.append(
                    {
                        "id": concept_id,
                        "concept_id": concept_id,
                        "concept_name": f"STUB Concept {idx + 1}",
                        "status": status,
                        "error_type": error_type,
                        "prerequisites": prereqs_list,
                        "tasks": tasks,
                    }
                )
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            timings["evaluation_critic_node"] = elapsed_ms
            return {"draft_milestones": draft_milestones, "timings_ms": timings}

        # 1. Fetch thông tin tên của tất cả concepts trong khóa học
        concepts_resp = db.app_client.table("concepts").select("id, name").eq("course_id", str(course_id)).execute()
        concept_names = {str(c["id"]): c["name"] for c in concepts_resp.data or []}

        # 2. Fetch danh sách quan hệ để lọc prerequisites cho từng milestone
        relations = db.get_concept_relations(UUID(course_id), status="approved")
        prereqs = [r for r in relations if r.get("relation_type") == "Prerequisite_of"]

        # Xây dựng map prerequisites: concept_id -> list of prerequisite concept_ids
        concept_prereqs = {}
        for r in prereqs:
            parent = str(r["source_concept_id"])
            child = str(r["target_concept_id"])
            if child not in concept_prereqs:
                concept_prereqs[child] = []
            concept_prereqs[child].append(parent)

        # 3. Batch fetch material_chunks để tìm tài liệu học tập thực tế
        chunks_resp = (
            db.app_client.table("material_chunks")
            .select("concept_id, material_id")
            .in_("concept_id", topo_sorted_concepts)
            .execute()
        )

        concept_materials = {}
        for chunk in chunks_resp.data or []:
            c_id = str(chunk["concept_id"])
            m_id = str(chunk["material_id"])
            if c_id not in concept_materials:
                concept_materials[c_id] = []
            if m_id not in concept_materials[c_id]:
                concept_materials[c_id].append(m_id)

        # 4. Tạo các milestones dạng DAG
        draft_milestones = []

        for concept_id in topo_sorted_concepts:
            # Lấy phân loại lỗi từ LLM analysis, nếu không có (do concept tiên quyết tự động mở rộng) -> default là conceptual
            analysis = llm_analysis.get(concept_id) or {}
            error_type = analysis.get("error_type", "conceptual")

            # Lọc danh sách prerequisites chỉ giữ lại những concept nằm trong lộ trình này
            all_parents = concept_prereqs.get(concept_id, [])
            filtered_parents = [p for p in all_parents if p in topo_sorted_concepts]

            # Gán trạng thái khóa/mở khóa ban đầu
            # Nếu không có prerequisite nào trong lộ trình -> unlocked. Ngược lại -> locked
            status = "unlocked" if not filtered_parents else "locked"

            # Tìm material_id liên kết với concept này (nếu có)
            material_ids = concept_materials.get(concept_id, [])
            primary_material_id = material_ids[0] if material_ids else None

            # Tạo danh sách tasks theo error_type
            tasks = []
            if error_type == "careless":
                # Lỗi bất cẩn -> chỉ cần làm nhanh bài luyện tập
                tasks.append({"type": "practice", "content_id": None, "difficulty": "quick"})
            else:
                # Lỗi kiến thức nền tảng -> học bài bản lý thuyết trước khi luyện tập sâu
                # 1. Slide/Theory task
                tasks.append({"type": "slide", "content_id": primary_material_id, "difficulty": None})
                # 2. Video task (nếu có thể, sử dụng chung material_id hoặc None)
                tasks.append({"type": "video", "content_id": primary_material_id, "difficulty": None})
                # 3. Luyện tập sâu
                tasks.append({"type": "practice", "content_id": None, "difficulty": "deep"})

            draft_milestones.append(
                {
                    "id": concept_id,
                    "concept_id": concept_id,
                    "concept_name": concept_names.get(concept_id, "Khái niệm toán học"),
                    "status": status,
                    "error_type": error_type,
                    "prerequisites": filtered_parents,
                    "tasks": tasks,
                }
            )

        # 5. Kiểm định ràng buộc Topo lần cuối (Safety Check)
        # Đảm bảo các concept xuất hiện trong filtered_parents phải có index đứng trước concept_id hiện tại
        milestone_indices = {m["id"]: idx for idx, m in enumerate(draft_milestones)}
        for m in draft_milestones:
            for p in m["prerequisites"]:
                p_idx = milestone_indices.get(p)
                m_idx = milestone_indices.get(m["id"])
                if p_idx is not None and m_idx is not None and p_idx >= m_idx:
                    logger.error(
                        f"Pedagogical ordering safety check violation: parent {p} is index {p_idx} but child {m['id']} is index {m_idx}"
                    )
                    # Sửa lại index topo của parent cho lên trước child (nhưng thực tế Kahn algorithm đã đảm bảo tính đúng đắn này)

        elapsed_ms = (time.perf_counter() - start_time) * 1000
        timings["evaluation_critic_node"] = elapsed_ms

        return {"draft_milestones": draft_milestones, "timings_ms": timings}

    except Exception as e:
        logger.error(f"Error in evaluation_critic_node: {e}", exc_info=True)
        return {"error": f"Internal error in evaluation_critic_node: {str(e)}", "draft_milestones": []}
