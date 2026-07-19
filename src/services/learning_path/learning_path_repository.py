import logging
from uuid import UUID

from src.api.adaptive_routes import get_adaptive_db

logger = logging.getLogger(__name__)


class LearningPathRepository:
    """Repository quản lý các phiên bản lộ trình học tập trong Database (app.learning_path_instances)."""

    @staticmethod
    def create_instance(
        student_id: UUID,
        course_id: UUID,
        source: str,
        trigger_type: str,
        path_data: dict,
        exam_attempt_id: UUID | None = None,
        mentor_id: UUID | None = None,
    ) -> dict | None:
        db = get_adaptive_db()
        if db._stub_mode or db.app_client is None:
            import uuid

            logger.info("Stub mode: Mocking create_instance in database.")
            return {
                "id": str(uuid.uuid4()),
                "student_id": str(student_id),
                "course_id": str(course_id),
                "source": source,
                "trigger_type": trigger_type,
                "exam_attempt_id": str(exam_attempt_id) if exam_attempt_id else None,
                "mentor_id": str(mentor_id) if mentor_id else None,
                "path_data": path_data,
                "status": "active",
            }

        try:
            data = {
                "student_id": str(student_id),
                "course_id": str(course_id),
                "source": source,
                "trigger_type": trigger_type,
                "exam_attempt_id": str(exam_attempt_id) if exam_attempt_id else None,
                "mentor_id": str(mentor_id) if mentor_id else None,
                "path_data": path_data,
                "status": "active",
            }
            resp = db.app_client.table("learning_path_instances").insert(data).execute()
            if resp.data:
                return resp.data[0]
        except Exception as e:
            logger.error(f"Error in LearningPathRepository.create_instance: {e}", exc_info=True)
            raise e
        return None

    @staticmethod
    def get_instances_by_student(student_id: UUID, course_id: UUID) -> list[dict]:
        db = get_adaptive_db()
        if db._stub_mode or db.app_client is None:
            import datetime
            import uuid

            logger.info("Stub mode: Mocking get_instances_by_student list.")
            return [
                {
                    "id": str(uuid.uuid4()),
                    "student_id": str(student_id),
                    "course_id": str(course_id),
                    "source": "auto",
                    "trigger_type": "midterm",
                    "exam_attempt_id": str(uuid.uuid4()),
                    "mentor_id": None,
                    "path_data": {
                        "milestones": [
                            {
                                "id": "concept-1",
                                "concept_id": "00000000-0000-0000-0000-999999999999",
                                "concept_name": "Phép nhân phân số",
                                "status": "unlocked",
                                "error_type": "conceptual",
                                "prerequisites": [],
                                "tasks": [],
                            }
                        ]
                    },
                    "status": "active",
                    "created_at": datetime.datetime.now(datetime.UTC).isoformat(),
                    "updated_at": datetime.datetime.now(datetime.UTC).isoformat(),
                }
            ]
        try:
            resp = (
                db.app_client.table("learning_path_instances")
                .select("*")
                .eq("student_id", str(student_id))
                .eq("course_id", str(course_id))
                .order("created_at", desc=True)
                .execute()
            )
            return resp.data or []
        except Exception as e:
            logger.error(f"Error in LearningPathRepository.get_instances_by_student: {e}", exc_info=True)
            return []

    @staticmethod
    def get_instance_by_id(instance_id: UUID) -> dict | None:
        db = get_adaptive_db()
        if db._stub_mode or db.app_client is None:
            return None
        try:
            resp = (
                db.app_client.table("learning_path_instances")
                .select("*")
                .eq("id", str(instance_id))
                .maybe_single()
                .execute()
            )
            return resp.data
        except Exception as e:
            logger.error(f"Error in LearningPathRepository.get_instance_by_id: {e}", exc_info=True)
            return None

    @staticmethod
    def update_milestone_status(instance_id: UUID, milestone_id: str, status: str) -> dict | None:
        db = get_adaptive_db()
        if db._stub_mode or db.app_client is None:
            return None
        try:
            # 1. Fetch current instance
            instance = LearningPathRepository.get_instance_by_id(instance_id)
            if not instance:
                return None

            path_data = instance.get("path_data", {})
            milestones = path_data.get("milestones", [])

            # 2. Cập nhật trạng thái của milestone mục tiêu
            updated = False
            for m in milestones:
                if str(m.get("id")) == str(milestone_id):
                    m["status"] = status
                    updated = True
                    break

            if not updated:
                logger.warning(f"Milestone {milestone_id} not found in path instance {instance_id}")
                return None

            # 3. Ghi đè cập nhật vào DB
            resp = (
                db.app_client.table("learning_path_instances")
                .update({"path_data": path_data})
                .eq("id", str(instance_id))
                .execute()
            )
            if resp.data:
                return resp.data[0]
        except Exception as e:
            logger.error(f"Error in LearningPathRepository.update_milestone_status: {e}", exc_info=True)
            return None
        return None
