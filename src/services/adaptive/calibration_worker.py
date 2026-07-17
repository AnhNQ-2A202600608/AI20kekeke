import logging
import os
import sys
import time
from uuid import UUID

import numpy as np

# Thêm project root vào sys.path để import src
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "..", "..", ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from src.services.adaptive.database_interface import AdaptiveDatabaseInterface  # noqa: E402

logger = logging.getLogger("calibration_worker")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


class BackgroundCalibrationWorker:
    def __init__(self, db: AdaptiveDatabaseInterface):
        self.db = db
        self.context_dim = 3

    def process_batch(self, limit: int = 100) -> int:
        """
        Xử lý 1 lô (batch) từ app.calibration_outbox.
        Trả về số lượng bản ghi đã xử lý thành công.
        """
        outbox_items = self.db.get_calibration_outbox(limit=limit)
        if not outbox_items:
            return 0

        logger.info(f"Đang xử lý lô hiệu chuẩn gồm {len(outbox_items)} bản ghi outbox...")

        # 1. Thu thập danh sách câu hỏi cần hiệu chuẩn Elo và Counters
        question_ids = list({UUID(item["question_id"]) for item in outbox_items})
        questions_meta = self.db.get_questions_by_ids(question_ids)
        questions_map = {q["id"]: q for q in questions_meta}

        # Gom nhóm submissions theo question_id
        grouped_submissions = {}
        for item in outbox_items:
            qid = UUID(item["question_id"])
            if qid not in grouped_submissions:
                grouped_submissions[qid] = []
            grouped_submissions[qid].append(item)

        # 2. Gom nhóm submissions theo (policy_id, question_id) cho Bandit updates
        grouped_bandits = {}
        for item in outbox_items:
            if not item.get("policy_id"):
                continue
            pid = UUID(item["policy_id"])
            qid = UUID(item["question_id"])
            key = (pid, qid)
            if key not in grouped_bandits:
                grouped_bandits[key] = []
            grouped_bandits[key].append(item)

        # 3. Hiệu chuẩn Elo & counters cho các câu hỏi
        for qid, subs in grouped_submissions.items():
            q = questions_map.get(qid)
            if not q:
                logger.warning(f"Không tìm thấy thông tin câu hỏi {qid} trong DB. Bỏ qua hiệu chuẩn Elo câu này.")
                continue

            difficulty_elo = float(q["difficulty_elo"])
            attempt_count = int(q["attempt_count"])
            avg_response_time_ms = float(q["avg_response_time_ms"])

            # Cập nhật tuần tự in-memory cho từng submission trong batch
            for sub in subs:
                actual_score = float(sub["actual_score"])
                expected_success = float(sub["expected_success"])
                hint_count = int(sub.get("hint_count", 0))
                used_ai_help = bool(sub.get("used_ai_help", False))
                response_time_ms = sub.get("response_time_ms")

                v_sd = actual_score - expected_success
                v_qd = expected_success - actual_score

                # Áp dụng discount hint nếu trả lời đúng
                if v_sd > 0 and hint_count > 0:
                    v_disc = max(0.1, 1.0 - 0.3 * hint_count)
                    v_qd *= v_disc

                # Tính K_question động
                if used_ai_help:
                    k_q = 32.0
                else:
                    k_q = max(8.0, 32.0 / (1.0 + attempt_count / 20.0))

                    # Áp dụng Speed Factor
                    if response_time_ms is not None and actual_score >= 0.75:
                        clamped_time = max(300.0, min(3600000.0, float(response_time_ms)))
                        if avg_response_time_ms > 0:
                            speed_ratio = clamped_time / avg_response_time_ms
                            speed_factor = max(0.8, min(1.2, 1.0 + 0.2 * (1.0 - speed_ratio)))
                            v_qd *= speed_factor

                difficulty_elo += k_q * v_qd

                # Cập nhật avg_response_time_ms
                if response_time_ms is not None:
                    avg_response_time_ms = avg_response_time_ms + (response_time_ms - avg_response_time_ms) / (
                        attempt_count + 1
                    )

                attempt_count += 1

            # Lưu cập nhật câu hỏi xuống DB
            try:
                self.db.update_question_calibration(
                    qid, round(difficulty_elo, 2), attempt_count, round(avg_response_time_ms, 2)
                )
            except Exception as e:
                logger.error(f"Lỗi khi lưu hiệu chuẩn cho câu hỏi {qid}: {e}")

        # 4. Cập nhật ma trận LinUCB cho các Bandit Arms
        for (pid, qid), subs in grouped_bandits.items():
            arm_id = str(qid)
            arm_data = self.db.get_bandit_arm(pid, arm_id)

            if not arm_data:
                A = np.eye(self.context_dim)
                A_inv = np.eye(self.context_dim)
                b = np.zeros((self.context_dim, 1))
                update_count = 0
            else:
                A = np.array(arm_data.get("a") or np.eye(self.context_dim).tolist())
                A_inv = np.array(arm_data.get("a_inv") or np.eye(self.context_dim).tolist())
                b = np.array(arm_data.get("b") or np.zeros(self.context_dim).tolist()).reshape(-1, 1)
                update_count = int(arm_data.get("update_count", 0))

            for sub in subs:
                x = np.array(sub["context_vector"]).reshape(-1, 1)
                reward = float(sub["reward"])

                # Cập nhật ma trận hiệp biến A gốc (không sai số tích lũy của phép chia)
                A = A + x.dot(x.T)

                # Sherman-Morrison cập nhật A_inv_new
                denominator = 1.0 + float(x.T.dot(A_inv).dot(x)[0][0])
                if denominator > 0.000001:
                    A_inv = A_inv - (A_inv.dot(x).dot(x.T).dot(A_inv)) / denominator

                # Symmetrization
                A_inv = 0.5 * (A_inv + A_inv.T)

                # Cập nhật b
                b = b + reward * x
                update_count += 1

                # Re-inversion định kỳ mỗi 100 lượt cập nhật để khử sai số tích lũy
                if update_count % 100 == 0:
                    try:
                        A_inv_direct = np.linalg.inv(A)
                        A_inv = 0.5 * (A_inv_direct + A_inv_direct.T)
                        logger.info(f"Đã re-invert ma trận cho arm {arm_id} tại lượt update {update_count}.")
                    except np.linalg.LinAlgError:
                        logger.warning(f"Lỗi ma trận suy biến khi re-invert arm {arm_id}. Giữ nguyên ma trận cũ.")

            # Lưu ma trận cập nhật xuống DB
            try:
                self.db.upsert_bandit_arm_v3(
                    pid, arm_id, A.tolist(), A_inv.tolist(), b.flatten().tolist(), update_count
                )
            except Exception as e:
                logger.error(f"Lỗi khi cập nhật ma trận bandit arm {arm_id}: {e}")

        # 5. Dọn dẹp outbox
        outbox_ids = [UUID(item["id"]) for item in outbox_items]
        try:
            self.db.delete_calibration_outbox_batch(outbox_ids)
            logger.info(f"Đã xóa thành công {len(outbox_ids)} bản ghi khỏi outbox.")
        except Exception as e:
            logger.error(f"Lỗi khi dọn dẹp calibration outbox: {e}")

        return len(outbox_items)

    def run(self, interval_seconds: float = 5.0):
        """
        Bắt đầu chạy worker định kỳ xử lý outbox.
        """
        logger.info("Background Calibration Worker đã khởi động và đang lắng nghe calibration_outbox...")
        while True:
            try:
                processed_count = self.process_batch()
                if processed_count > 0:
                    # Nếu có xử lý được dữ liệu, lập tức chạy tiếp lô sau để tránh trễ
                    continue
            except Exception as e:
                logger.error(f"Lỗi không mong muốn trong vòng lặp worker: {e}", exc_info=True)
            time.sleep(interval_seconds)


if __name__ == "__main__":
    from src.api.adaptive_routes import get_adaptive_db

    # Khởi tạo db adapter
    db = get_adaptive_db()
    if db._stub_mode:
        logger.error("DB Adapter đang chạy ở chế độ STUB MODE. Vui lòng cấu hình SUPABASE_URL / KEY.")
        sys.exit(1)

    worker = BackgroundCalibrationWorker(db)
    worker.run(interval_seconds=5.0)
