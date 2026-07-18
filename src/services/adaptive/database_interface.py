from abc import ABC, abstractmethod
from typing import Any
from uuid import UUID


class AdaptiveDatabaseInterface(ABC):
    @abstractmethod
    def get_student_mastery(self, student_id: UUID, course_id: UUID, concept_id: UUID) -> dict[str, Any]:
        """Lấy thông tin năng lực học viên. Nếu chưa có, tự động tạo mới mặc định."""
        pass

    @abstractmethod
    def update_student_mastery(
        self,
        student_id: UUID,
        course_id: UUID,
        concept_id: UUID,
        elo_score: float,
        bkt_mastery_probability: float,
        mastery_state: str,
        weakness_flag: bool,
        is_correct: bool,
    ) -> None:
        """Cập nhật Elo, BKT và các biến số năng lực của học viên."""
        pass

    @abstractmethod
    def get_candidate_questions_meta(self, course_id: UUID, concept_id: UUID) -> list[dict[str, Any]]:
        """Lấy thông tin tối giản (id, difficulty_elo) của các câu hỏi thuộc concept."""
        pass

    @abstractmethod
    def get_question_by_id(self, question_id: UUID) -> dict[str, Any] | None:
        """Lấy thông tin chi tiết câu hỏi (đề bài, đáp án)."""
        pass

    @abstractmethod
    def update_question_elo(self, question_id: UUID, difficulty_elo: float) -> None:
        """Cập nhật độ khó Elo của câu hỏi."""
        pass

    @abstractmethod
    def get_bandit_policy_state(self, course_id: UUID) -> tuple[UUID, dict[str, Any]]:
        """Lấy chính sách bandit hoạt động. Trả về (policy_id, config)."""
        pass

    @abstractmethod
    def update_bandit_policy_config(self, policy_id: UUID, config: dict[str, Any]) -> None:
        """Lưu trữ cấu hình Bandit cập nhật mới."""
        pass

    @abstractmethod
    def get_bandit_arm(self, policy_id: UUID, arm_id: str) -> dict[str, Any] | None:
        """Lấy trạng thái LinUCB (A_inv, b) của một arm (câu hỏi) cụ thể."""
        pass

    def get_bandit_arms(self, policy_id: UUID, arm_ids: list[str]) -> dict[str, dict[str, Any]]:
        """Lấy trạng thái LinUCB của nhiều arm trong một lượt truy vấn."""
        return {arm_id: arm for arm_id in arm_ids if (arm := self.get_bandit_arm(policy_id, arm_id)) is not None}

    @abstractmethod
    def upsert_bandit_arm(self, policy_id: UUID, arm_id: str, a_inv: list, b: list) -> None:
        """Cập nhật hoặc chèn mới trạng thái LinUCB của một arm."""
        pass

    @abstractmethod
    def submit_attempt_v3(self, payload: dict) -> dict:
        """Gọi RPC submit_attempt_v3 để xử lý giao dịch nộp bài nguyên tử tích hợp BKT, Bandit và lan truyền đồ thị."""
        pass

    @abstractmethod
    def update_student_bkt(
        self,
        student_id: UUID,
        course_id: UUID,
        concept_id: UUID,
        bkt_prob: float,
        mastery_state: str,
        weakness_flag: bool,
    ) -> None:
        """Cập nhật riêng chỉ số BKT của học sinh không làm tăng attempt_count."""
        pass

    @abstractmethod
    def sync_elo_bkt_only(
        self,
        student_id: UUID,
        course_id: UUID,
        concept_id: UUID,
        elo_score: float,
        bkt_prob: float,
        mastery_state: str,
        weakness_flag: bool,
    ) -> None:
        """Cập nhật Elo và BKT của học sinh từ chat mà không tăng attempt_count."""
        pass

    @abstractmethod
    def log_adaptive_decision(
        self,
        policy_id: UUID,
        student_id: UUID,
        course_id: UUID,
        concept_id: UUID,
        selected_action_id: UUID,
        candidate_action_ids: list[str],
        context_snapshot: list[float],
        model_snapshot: dict[str, Any],
        expected_reward: float,
        expected_success: float,
    ) -> UUID:
        """Ghi nhận vết quyết định gợi ý câu hỏi của LinUCB."""
        pass

    @abstractmethod
    def get_adaptive_decision(self, decision_id: UUID) -> dict[str, Any] | None:
        """Truy xuất vết quyết định gợi ý câu hỏi."""
        pass

    @abstractmethod
    def log_quiz_attempt(
        self,
        student_id: UUID,
        course_id: UUID,
        question_id: UUID,
        concept_id: UUID,
        decision_id: UUID,
        student_answer: dict[str, Any],
        is_correct: bool,
        actual_score: float,
        expected_success: float,
        hint_count: int,
        used_ai_help: bool,
    ) -> UUID:
        """Ghi nhận lịch sử làm bài trắc nghiệm."""
        pass

    @abstractmethod
    def log_adaptive_reward(
        self, decision_id: UUID, quiz_attempt_id: UUID, reward_value: float, observed_success: float
    ) -> None:
        """Ghi nhận tín hiệu reward thu về cho Bandit."""
        pass

    @abstractmethod
    def log_mastery_event(
        self,
        student_id: UUID,
        course_id: UUID,
        concept_id: UUID,
        attempt_id: UUID | None,
        elo_before: float,
        elo_after: float,
        bkt_before: float,
        bkt_after: float,
        state_before: str,
        state_after: str,
    ) -> None:
        """Ghi nhận log sự kiện chuyển đổi trạng thái năng lực học viên."""
        pass

    @abstractmethod
    def log_question_elo_event(
        self, question_id: UUID, quiz_attempt_id: UUID, difficulty_before: float, difficulty_after: float
    ) -> None:
        """Ghi nhận log sự kiện điều chỉnh độ khó Elo của câu hỏi."""
        pass

    @abstractmethod
    def get_all_student_concept_mastery(self, student_id: UUID, course_id: UUID) -> list[dict[str, Any]]:
        """Lấy toàn bộ thông tin tiến độ/độ thành thạo của học viên đối với tất cả các Concept."""
        pass

    @abstractmethod
    def get_concept_id_by_code(self, code: str) -> UUID | None:
        """Lấy UUID của concept dựa vào mã concept code."""
        pass

    @abstractmethod
    def get_concept_relations(self, course_id: UUID, status: str | None = None) -> list[dict[str, Any]]:
        """Lấy danh sách quan hệ giữa các concept."""
        pass

    @abstractmethod
    def create_concept_relation(
        self,
        course_id: UUID,
        source_concept_id: UUID,
        target_concept_id: UUID,
        relation_type: str,
        weight: float,
        status: str,
    ) -> dict[str, Any]:
        """Tạo quan hệ mới giữa các concept."""
        pass

    @abstractmethod
    def update_concept_relation(
        self, relation_id: UUID, status: str | None = None, weight: float | None = None
    ) -> dict[str, Any]:
        """Cập nhật trạng thái hoặc trọng số của một quan hệ concept."""
        pass

    @abstractmethod
    def delete_concept_relation(self, relation_id: UUID) -> bool:
        """Xóa một quan hệ concept."""
        pass

    # Các hàm giao dịch (Transaction Management)
    @abstractmethod
    def begin(self) -> None:
        """Khởi động transaction."""
        pass

    @abstractmethod
    def commit(self) -> None:
        """Commit transaction lưu dữ liệu xuống DB."""
        pass

    @abstractmethod
    def rollback(self) -> None:
        """Rollback nếu xảy ra lỗi để bảo toàn dữ liệu."""
        pass

    @abstractmethod
    def count_hints(self, decision_id: UUID) -> int:
        """Đếm số gợi ý thực tế học sinh đã dùng cho quyết định này (ở server-side)."""
        pass

    @abstractmethod
    def log_hint_usage(
        self,
        student_id: UUID,
        course_id: UUID,
        question_id: UUID,
        decision_id: UUID,
        hint_level: int,
    ) -> UUID:
        """Ghi nhận một lượt mở gợi ý để submit dùng server-side hint count."""
        pass

    @abstractmethod
    def get_chat_history(self, session_id: UUID, limit: int = 10) -> list[dict[str, Any]]:
        """Lấy lịch sử hội thoại của một phiên chat cụ thể."""
        pass

    @abstractmethod
    def create_chat_session(self, student_id: UUID, course_id: UUID, mode: str) -> UUID:
        """Tạo một phiên chat mới."""
        pass

    @abstractmethod
    def add_chat_message(self, session_id: UUID, role: str, content: str, concept_id: UUID | None = None) -> None:
        """Lưu một tin nhắn mới vào phiên chat."""
        pass

    @abstractmethod
    def get_student_memory(self, student_id: UUID) -> dict[str, Any]:
        """Lấy trí nhớ dài hạn (facts) của học sinh."""
        pass

    @abstractmethod
    def save_student_memory(self, student_id: UUID, facts: dict[str, Any]) -> None:
        """Lưu trí nhớ dài hạn (facts) của học sinh."""
        pass

    @abstractmethod
    def get_calibration_outbox(self, limit: int = 100) -> list[dict[str, Any]]:
        """Lấy danh sách các bản ghi outbox để xử lý hiệu chuẩn."""
        pass

    @abstractmethod
    def delete_calibration_outbox_batch(self, ids: list[UUID]) -> None:
        """Xóa hàng loạt bản ghi outbox sau khi xử lý thành công."""
        pass

    @abstractmethod
    def get_questions_by_ids(self, question_id_list: list[UUID]) -> list[dict[str, Any]]:
        """Lấy thông tin hiệu chuẩn của danh sách câu hỏi."""
        pass

    @abstractmethod
    def update_question_calibration(
        self, question_id: UUID, difficulty_elo: float, attempt_count: int, avg_response_time_ms: float
    ) -> None:
        """Cập nhật các thông số độ khó Elo, lượt làm bài, và thời gian trung bình của câu hỏi."""
        pass

    @abstractmethod
    def upsert_bandit_arm_v3(
        self, policy_id: UUID, arm_id: str, a: list, a_inv: list, b: list, update_count: int
    ) -> None:
        """Cập nhật trạng thái LinUCB nâng cao (A, A_inv, b, update_count) của một arm."""
        pass

    @abstractmethod
    def get_student_mastery_as_of(
        self, student_id: UUID, course_id: UUID, concept_id: UUID, target_time: Any
    ) -> dict[str, Any] | None:
        """Lấy thông tin năng lực học viên tại một thời điểm lịch sử (As Of)."""
        pass

    @abstractmethod
    def save_student_mastery_bitemporal(
        self,
        student_id: UUID,
        course_id: UUID,
        concept_id: UUID,
        elo_score: float,
        bkt_mastery_probability: float,
        mastery_state: str,
        weakness_flag: bool,
        attempt_count: int,
        correct_count: int,
        last_practiced_at: Any,
        stability_days: float,
        valid_range: str | None = None,
    ) -> None:
        """Lưu thông tin năng lực bitemporal (hỗ trợ cả cập nhật tuần tự và cập nhật hồi tố)."""
        pass
