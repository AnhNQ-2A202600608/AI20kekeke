import json
import logging
import sqlite3
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException

from src.api.adaptive_routes import AuthenticatedUser, get_adaptive_db, get_current_user
from src.config import get_settings
from src.services.adaptive.database_interface import AdaptiveDatabaseInterface

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/sync/status")
def get_sync_status(
    auth_user: AuthenticatedUser = Depends(get_current_user),
):
    """Lấy số lượng sự kiện chưa đồng bộ trong SQLite outbox."""
    settings = get_settings()
    db_path = Path(settings.sgk_data_dir) / "mastery.db"

    count = 0
    if db_path.exists():
        try:
            conn = sqlite3.connect(str(db_path))
            cursor = conn.cursor()
            try:
                cursor.execute("SELECT COUNT(*) FROM offline_outbox")
                count = cursor.fetchone()[0]
            except sqlite3.OperationalError:
                pass
            conn.close()
        except Exception as e:
            logger.error(f"Lỗi kiểm tra trạng thái outbox: {e}")

    return {"pending_sync_count": count}


@router.post("/sync/trigger")
def trigger_sync(
    auth_user: AuthenticatedUser = Depends(get_current_user),
    db: AdaptiveDatabaseInterface = Depends(get_adaptive_db),
):
    """Trigger đồng bộ hóa dữ liệu từ SQLite offline outbox lên database Supabase trung tâm."""
    if getattr(db, "_stub_mode", False) or getattr(db, "app_client", None) is None:
        raise HTTPException(
            status_code=503, detail="Hệ thống hiện tại đang chạy offline (stub mode). Không thể đồng bộ."
        )

    settings = get_settings()
    db_path = Path(settings.sgk_data_dir) / "mastery.db"
    if not db_path.exists():
        return {"status": "no_local_data", "synced_count": 0}

    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()

        # Lấy tất cả bản ghi chưa đồng bộ
        try:
            cursor.execute("SELECT id, payload FROM offline_outbox ORDER BY id ASC")
            rows = cursor.fetchall()
        except sqlite3.OperationalError:
            conn.close()
            return {"status": "success", "synced_count": 0}

        synced_ids = []
        for row_id, payload_str in rows:
            try:
                payload = json.loads(payload_str)
                # Gửi lên Supabase qua transaction RPC
                db.submit_attempt_v3(payload)
                synced_ids.append(row_id)
            except Exception as item_err:
                logger.error(f"Lỗi đồng bộ bản ghi outbox id={row_id}: {item_err}")
                break

        # Xóa các bản ghi đã đồng bộ thành công
        if synced_ids:
            placeholders = ",".join(["?"] * len(synced_ids))
            # nosemgrep: python.sqlalchemy.security.sqlalchemy-execute-raw-query.sqlalchemy-execute-raw-query
            cursor.execute(f"DELETE FROM offline_outbox WHERE id IN ({placeholders})", synced_ids)
            conn.commit()

        conn.close()
        return {"status": "success", "synced_count": len(synced_ids)}
    except Exception as e:
        logger.error(f"Lỗi khi thực hiện đồng bộ outbox: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail="Lỗi đồng bộ hóa dữ liệu ngoại tuyến.")
