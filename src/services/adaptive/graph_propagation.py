import logging
from uuid import UUID

from src.services.adaptive.bkt import determine_mastery_state
from src.services.adaptive.database_interface import AdaptiveDatabaseInterface

logger = logging.getLogger(__name__)

# Hệ số lan truyền
GAMMA = 0.25  # Hệ số lan truyền ngược (Backward Propagation)
BETA = 0.25  # Hệ số lan truyền xuôi (Forward Propagation)


def propagate_mastery(
    db: AdaptiveDatabaseInterface,
    student_id: UUID,
    course_id: UUID,
    concept_id: UUID,
    old_bkt: float,
    new_bkt: float,
    source_attempt_id: UUID | None = None,
    visited: set[UUID] | None = None,
) -> set[UUID]:
    """
    Thực hiện lan truyền độ thông thạo trên đồ thị khái niệm.
    Sử dụng tham số `visited` để ngăn chặn đệ quy vô hạn trong đồ thị tuần hoàn (cycle protection).
    Trả về tập hợp các concept_id đã được cập nhật để cho phép xóa cache đồng bộ.
    """
    if visited is None:
        visited = set()

    modified_concepts = set()

    if concept_id in visited:
        return modified_concepts

    visited.add(concept_id)

    delta = new_bkt - old_bkt
    if abs(delta) < 1e-5:
        return modified_concepts

    # Lấy các quan hệ đã phê duyệt (approved)
    try:
        relations = db.get_concept_relations(course_id, status="approved")
    except Exception as e:
        logger.error(f"Error fetching concept relations: {e}")
        return modified_concepts

    # Chỉ lọc các quan hệ tiên quyết (Prerequisite_of)
    prereqs = [r for r in relations if r["relation_type"] == "Prerequisite_of"]
    if not prereqs:
        return modified_concepts

    # 1. Lan truyền ngược (Backward Propagation) - Khi concept đích bị giảm điểm (delta < 0)
    if delta < 0:
        delta_abs = abs(delta)
        for rel in prereqs:
            if str(rel["target_concept_id"]) == str(concept_id):
                parent_id = UUID(str(rel["source_concept_id"]))
                if parent_id in visited:
                    continue
                weight = float(rel.get("weight", 1.0))

                try:
                    parent_mastery = db.get_student_mastery(student_id, course_id, parent_id)
                    parent_old_bkt = parent_mastery["bkt_mastery_probability"]
                    parent_old_elo = parent_mastery["elo_score"]
                    parent_old_state = parent_mastery["mastery_state"]

                    # Công thức: M(p)_new = M(p)_old - gamma * delta_abs * weight
                    parent_new_bkt = parent_old_bkt - GAMMA * delta_abs * weight
                    parent_new_bkt = round(min(0.9999, max(0.0001, parent_new_bkt)), 4)

                    if parent_new_bkt != parent_old_bkt:
                        new_state = determine_mastery_state(parent_new_bkt)
                        weakness_flag = parent_new_bkt < 0.50

                        # Cập nhật DB
                        db.update_student_bkt(
                            student_id=student_id,
                            course_id=course_id,
                            concept_id=parent_id,
                            bkt_prob=parent_new_bkt,
                            mastery_state=new_state,
                            weakness_flag=weakness_flag,
                        )

                        # Log mastery event
                        db.log_mastery_event(
                            student_id=student_id,
                            course_id=course_id,
                            concept_id=parent_id,
                            attempt_id=source_attempt_id,
                            elo_before=parent_old_elo,
                            elo_after=parent_old_elo,
                            bkt_before=parent_old_bkt,
                            bkt_after=parent_new_bkt,
                            state_before=parent_old_state,
                            state_after=new_state,
                        )

                        # Clear write-through cache
                        _clear_mastery_cache(student_id, course_id, parent_id)
                        modified_concepts.add(parent_id)

                        # Đệ quy lan truyền sang các node cha tiếp theo (Multi-step propagation)
                        sub_modified = propagate_mastery(
                            db=db,
                            student_id=student_id,
                            course_id=course_id,
                            concept_id=parent_id,
                            old_bkt=parent_old_bkt,
                            new_bkt=parent_new_bkt,
                            source_attempt_id=source_attempt_id,
                            visited=visited,
                        )
                        modified_concepts.update(sub_modified)
                except Exception as e:
                    logger.error(f"Error in backward propagation to parent {parent_id}: {e}")

    # 2. Lan truyền xuôi (Forward Propagation) - Khi concept tiên quyết tăng điểm (delta > 0)
    elif delta > 0:
        for rel in prereqs:
            if str(rel["source_concept_id"]) == str(concept_id):
                child_id = UUID(str(rel["target_concept_id"]))
                if child_id in visited:
                    continue
                weight = float(rel.get("weight", 1.0))

                try:
                    child_mastery = db.get_student_mastery(student_id, course_id, child_id)
                    child_old_bkt = child_mastery["bkt_mastery_probability"]
                    child_old_elo = child_mastery["elo_score"]
                    child_old_state = child_mastery["mastery_state"]

                    # Công thức: M(c)_new = M(c)_old + beta * delta * weight
                    child_new_bkt = child_old_bkt + BETA * delta * weight
                    child_new_bkt = round(min(0.9999, max(0.0001, child_new_bkt)), 4)

                    if child_new_bkt != child_old_bkt:
                        new_state = determine_mastery_state(child_new_bkt)
                        weakness_flag = child_new_bkt < 0.50

                        # Cập nhật DB
                        db.update_student_bkt(
                            student_id=student_id,
                            course_id=course_id,
                            concept_id=child_id,
                            bkt_prob=child_new_bkt,
                            mastery_state=new_state,
                            weakness_flag=weakness_flag,
                        )

                        # Log mastery event
                        db.log_mastery_event(
                            student_id=student_id,
                            course_id=course_id,
                            concept_id=child_id,
                            attempt_id=source_attempt_id,
                            elo_before=child_old_elo,
                            elo_after=child_old_elo,
                            bkt_before=child_old_bkt,
                            bkt_after=child_new_bkt,
                            state_before=child_old_state,
                            state_after=new_state,
                        )

                        # Clear write-through cache
                        _clear_mastery_cache(student_id, course_id, child_id)
                        modified_concepts.add(child_id)

                        # Đệ quy lan truyền sang các node con tiếp theo (Multi-step propagation)
                        sub_modified = propagate_mastery(
                            db=db,
                            student_id=student_id,
                            course_id=course_id,
                            concept_id=child_id,
                            old_bkt=child_old_bkt,
                            new_bkt=child_new_bkt,
                            source_attempt_id=source_attempt_id,
                            visited=visited,
                        )
                        modified_concepts.update(sub_modified)
                except Exception as e:
                    logger.error(f"Error in forward propagation to child {child_id}: {e}")

    return modified_concepts


def _clear_mastery_cache(student_id: UUID, course_id: UUID, concept_id: UUID) -> None:
    try:
        from src.services.cache import get_cache_store
        from src.services.cache_keys import mastery_cache_key

        cache = get_cache_store()
        if cache:
            key = mastery_cache_key(str(student_id), str(course_id), str(concept_id))
            cache.delete(key)
    except Exception as e:
        logger.error(f"Error clearing mastery cache during propagation: {e}")
