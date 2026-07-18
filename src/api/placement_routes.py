import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from src.api.adaptive_routes import AuthenticatedUser, get_adaptive_db, get_current_user
from src.services.adaptive.database_interface import AdaptiveDatabaseInterface

logger = logging.getLogger(__name__)
router = APIRouter()


class PlacementSubmitRequest(BaseModel):
    student_id: UUID = Field(..., description="ID của học sinh")
    course_id: UUID = Field(..., description="ID của khóa học")
    concept_id: UUID = Field(..., description="ID của concept/nút YCCĐ khởi đầu")
    correct_count: int = Field(..., ge=0, le=3, description="Số lượng câu trả lời đúng (0 đến 3)")


@router.post("/placement/submit")
def submit_placement_result(
    request: PlacementSubmitRequest,
    auth_user: AuthenticatedUser = Depends(get_current_user),
    db: AdaptiveDatabaseInterface = Depends(get_adaptive_db),
):
    """
    Nộp kết quả bài thi thử đầu vào để khởi tạo các thông số thích ứng (Elo & BKT).
    Giúp tránh tình trạng cold start cho học sinh mới.
    """
    if auth_user.role == "student" and request.student_id != auth_user.id:
        raise HTTPException(status_code=403, detail="Học sinh chỉ có quyền cập nhật bài placement của chính mình.")

    calibration_map = {
        3: {"elo": 1400.0, "bkt": 0.65, "state": "mastered", "weakness": False},
        2: {"elo": 1200.0, "bkt": 0.45, "state": "learning", "weakness": False},
        1: {"elo": 1000.0, "bkt": 0.30, "state": "learning", "weakness": True},
        0: {"elo": 800.0, "bkt": 0.15, "state": "not_started", "weakness": True},
    }

    config = calibration_map.get(request.correct_count, calibration_map[2])

    try:
        # Cập nhật trực tiếp xuống Supabase (nếu online) hoặc SQLite (nếu offline)
        if not getattr(db, "_stub_mode", False) and getattr(db, "app_client", None) is not None:
            db.begin()
            db.sync_elo_bkt_only(
                student_id=request.student_id,
                course_id=request.course_id,
                concept_id=request.concept_id,
                elo_score=config["elo"],
                bkt_prob=config["bkt"],
                mastery_state=config["state"],
                weakness_flag=config["weakness"],
            )
            db.commit()
            logger.info(f"Đã khởi tạo Elo/BKT online thành công từ placement test cho student {request.student_id}")
        else:
            # Ghi nhận offline xuống SQLite local
            try:
                import datetime
                import sqlite3

                from src.services.diagnostic_engine import DiagnosticEngine

                engine = DiagnosticEngine()
                db_path = engine.db_path

                conn = sqlite3.connect(str(db_path))
                cursor = conn.cursor()
                now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

                # Cập nhật bảng mastery trong SQLite
                cursor.execute(
                    """
                    INSERT INTO mastery (student_id, node_id, p_known, n_attempts, last_updated)
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(student_id, node_id) DO UPDATE SET
                        p_known = excluded.p_known,
                        n_attempts = excluded.n_attempts,
                        last_updated = excluded.last_updated
                """,
                    (str(request.student_id), str(request.concept_id), config["bkt"], 1, now),
                )

                conn.commit()
                conn.close()
                logger.info(
                    f"Đã khởi tạo Elo/BKT offline thành công từ placement test cho student {request.student_id}"
                )
            except Exception as sql_err:
                logger.error(f"Lỗi khi ghi placement test offline xuống SQLite: {sql_err}", exc_info=True)
                raise HTTPException(status_code=503, detail="Không thể lưu kết quả placement test offline.")

        return {
            "status": "success",
            "initialized_elo": config["elo"],
            "initialized_bkt": config["bkt"],
            "mastery_state": config["state"],
            "weakness_flag": config["weakness"],
        }
    except Exception as e:
        logger.error(f"Lỗi khi xử lý placement submit: {e}", exc_info=True)
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=503, detail="Lỗi xử lý kết quả placement.")
