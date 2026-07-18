import logging
import uuid
from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from src.api.adaptive_routes import (
    AuthenticatedUser,
    get_adaptive_db,
    get_current_user,
    normalize_answer_key,
)
from src.models.exam_schemas import (
    ConceptGapItem,
    ExamDetailsResponse,
    ExamQuestionItem,
    ExamResultResponse,
    ExamSetSummary,
    ExamStartResponse,
    ExamSubmitRequest,
)
from src.services.adaptive.bandit import build_student_context, calculate_bandit_reward
from src.services.adaptive.database_interface import AdaptiveDatabaseInterface
from src.services.adaptive.elo import calculate_expected_success

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/exams", tags=["Exam Sets"])


@router.get("", response_model=list[ExamSetSummary])
async def list_exam_sets(
    course_id: UUID,
    exam_type: str | None = None,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AdaptiveDatabaseInterface = Depends(get_adaptive_db),
):
    """Lấy danh sách các bộ đề thi đã công bố (published) của một khóa học."""
    # Stub mode fallback
    if db._stub_mode or db.app_client is None:
        return [
            ExamSetSummary(
                id=UUID("00000000-0000-0000-0000-111111111111"),
                code="midterm-common-stub",
                title="Đề thi giữa kỳ I - Phần chung (Stub)",
                description="Bộ đề thi giữa kỳ mẫu dùng cho môi trường thử nghiệm.",
                exam_type="midterm",
                difficulty="bình thường",
                duration_minutes=45,
                max_score=10.0,
                question_count=2,
            )
        ]

    try:
        # Lấy thông tin các bộ đề thi
        query = db.app_client.table("exam_sets").select("*").eq("course_id", str(course_id))

        # Chỉ student chỉ được thấy đề published
        if current_user.role == "student":
            query = query.eq("status", "published")
        else:
            # Mentor/admin/dev có thể thấy đề draft/retired
            pass

        if exam_type:
            query = query.eq("exam_type", exam_type)

        exam_sets_resp = query.execute()
        exam_sets_data = exam_sets_resp.data or []

        if not exam_sets_data:
            return []

        # Đếm số lượng câu hỏi trong mỗi bộ đề
        questions_resp = db.app_client.table("exam_questions").select("exam_set_id").execute()
        question_counts = {}
        for row in questions_resp.data or []:
            sid = row["exam_set_id"]
            question_counts[sid] = question_counts.get(sid, 0) + 1

        results = []
        for row in exam_sets_data:
            sid_str = row["id"]
            results.append(
                ExamSetSummary(
                    id=UUID(sid_str),
                    code=row["code"],
                    title=row["title"],
                    description=row.get("description"),
                    exam_type=row["exam_type"],
                    difficulty=row.get("difficulty", "bình thường"),
                    duration_minutes=row.get("duration_minutes", 45),
                    max_score=float(row.get("max_score", 10.0)),
                    question_count=question_counts.get(sid_str, 0),
                )
            )
        return results

    except Exception as e:
        logger.error("Lỗi khi lấy danh sách bộ đề thi: %s", e, exc_info=True)
        raise HTTPException(status_code=503, detail="Không thể truy cập dữ liệu bộ đề thi lúc này.")


@router.get("/{exam_set_id}", response_model=ExamDetailsResponse)
async def get_exam_details(
    exam_set_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AdaptiveDatabaseInterface = Depends(get_adaptive_db),
):
    """Lấy chi tiết đề thi và danh sách các câu hỏi MCQ (đã ẩn đáp án đúng)."""
    # Stub mode fallback
    if db._stub_mode or db.app_client is None:
        summary = ExamSetSummary(
            id=exam_set_id,
            code="midterm-common-stub",
            title="Đề thi giữa kỳ I - Phần chung (Stub)",
            description="Bộ đề thi giữa kỳ mẫu dùng cho môi trường thử nghiệm.",
            exam_type="midterm",
            difficulty="bình thường",
            duration_minutes=45,
            max_score=10.0,
            question_count=2,
        )
        questions = [
            ExamQuestionItem(
                id=UUID("00000000-0000-0000-0000-999999999991"),
                sort_order=1,
                weight=1.0,
                prompt="Câu hỏi trắc nghiệm số 1: Trái Đất quay quanh mặt trời mất bao nhiêu ngày?",
                options={"A": "365 ngày", "B": "366 ngày", "C": "365.25 ngày", "D": "30 ngày"},
            ),
            ExamQuestionItem(
                id=UUID("00000000-0000-0000-0000-999999999992"),
                sort_order=2,
                weight=1.0,
                prompt="Câu hỏi trắc nghiệm số 2: Phép toán nào có kết quả lớn nhất?",
                options={"A": "1 + 1", "B": "2 * 2", "C": "3 - 1", "D": "4 / 2"},
            ),
        ]
        return ExamDetailsResponse(exam=summary, questions=questions)

    try:
        # Lấy thông tin bộ đề
        exam_resp = db.app_client.table("exam_sets").select("*").eq("id", str(exam_set_id)).maybe_single().execute()
        exam_data = exam_resp.data
        if not exam_data:
            raise HTTPException(status_code=404, detail="Không tìm thấy bộ đề thi.")

        # Lọc đề nếu là student và đề chưa published
        if current_user.role == "student" and exam_data["status"] != "published":
            raise HTTPException(status_code=403, detail="Bạn không có quyền truy cập đề thi này.")

        # Lấy danh sách câu hỏi liên kết
        # Join exam_questions với questions
        eq_resp = (
            db.app_client.table("exam_questions")
            .select("sort_order, weight, questions(id, concept_id, type, prompt, answer_key)")
            .eq("exam_set_id", str(exam_set_id))
            .execute()
        )
        eq_data = eq_resp.data or []

        questions_list = []
        for item in eq_data:
            q = item.get("questions")
            if not q:
                continue

            # Chỉ hỗ trợ câu hỏi MCQ trong bộ đề thi theo nghiệp vụ đã xác nhận
            if q.get("type") != "mcq":
                continue

            answer_key = normalize_answer_key(q.get("answer_key"))
            options = answer_key.get("options") or {}

            questions_list.append(
                ExamQuestionItem(
                    id=UUID(q["id"]),
                    sort_order=item["sort_order"],
                    weight=float(item["weight"] or 1.0),
                    prompt=q["prompt"],
                    options=options,
                )
            )

        # Sắp xếp theo sort_order
        questions_list.sort(key=lambda x: x.sort_order)

        summary = ExamSetSummary(
            id=UUID(exam_data["id"]),
            code=exam_data["code"],
            title=exam_data["title"],
            description=exam_data.get("description"),
            exam_type=exam_data["exam_type"],
            difficulty=exam_data.get("difficulty", "bình thường"),
            duration_minutes=exam_data.get("duration_minutes", 45),
            max_score=float(exam_data.get("max_score", 10.0)),
            question_count=len(questions_list),
        )

        return ExamDetailsResponse(exam=summary, questions=questions_list)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Lỗi khi lấy chi tiết bộ đề: %s", e, exc_info=True)
        raise HTTPException(status_code=503, detail="Không thể truy cập chi tiết đề thi lúc này.")


@router.post("/{exam_set_id}/start", response_model=ExamStartResponse)
async def start_exam(
    exam_set_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AdaptiveDatabaseInterface = Depends(get_adaptive_db),
):
    """Bắt đầu làm bài thi. Tạo một lượt thi (exam_attempt) mới."""
    # Stub mode fallback
    if db._stub_mode or db.app_client is None:
        started_at = datetime.now(UTC)
        expires_at = started_at + timedelta(minutes=45)
        return ExamStartResponse(
            attempt_id=uuid.uuid4(), exam_set_id=exam_set_id, started_at=started_at, expires_at=expires_at
        )

    try:
        # Kiểm tra xem bộ đề có tồn tại không
        exam_resp = db.app_client.table("exam_sets").select("*").eq("id", str(exam_set_id)).maybe_single().execute()
        exam_data = exam_resp.data
        if not exam_data:
            raise HTTPException(status_code=404, detail="Không tìm thấy bộ đề thi.")

        # Lọc đề nếu là student và đề chưa published
        if current_user.role == "student" and exam_data["status"] != "published":
            raise HTTPException(status_code=403, detail="Bạn không có quyền làm đề thi này.")

        started_at = datetime.now(UTC)
        duration = exam_data.get("duration_minutes", 45)
        expires_at = started_at + timedelta(minutes=duration)

        attempt_data = {
            "student_id": str(current_user.id),
            "exam_set_id": str(exam_set_id),
            "started_at": started_at.isoformat(),
            "expires_at": expires_at.isoformat(),
            "status": "in_progress",
        }

        attempt_resp = db.app_client.table("exam_attempts").insert(attempt_data).execute()
        if not attempt_resp.data:
            raise HTTPException(status_code=503, detail="Không thể lưu trữ lượt thi mới.")

        inserted = attempt_resp.data[0]
        return ExamStartResponse(
            attempt_id=UUID(inserted["id"]),
            exam_set_id=UUID(inserted["exam_set_id"]),
            started_at=datetime.fromisoformat(inserted["started_at"].replace("Z", "+00:00")),
            expires_at=datetime.fromisoformat(inserted["expires_at"].replace("Z", "+00:00")),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Lỗi khi bắt đầu làm bài thi: %s", e, exc_info=True)
        raise HTTPException(status_code=503, detail="Không thể bắt đầu lượt thi mới.")


@router.post("/attempts/{attempt_id}/submit", response_model=ExamResultResponse)
async def submit_exam(
    attempt_id: UUID,
    request: ExamSubmitRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AdaptiveDatabaseInterface = Depends(get_adaptive_db),
):
    """Nộp toàn bộ bài thi MCQ. Chấm điểm tự động và chạy thuật toán cập nhật Elo/BKT."""
    # Stub mode fallback
    if db._stub_mode or db.app_client is None:
        submitted_at = datetime.now(UTC)
        return ExamResultResponse(
            attempt_id=attempt_id,
            final_score=8.5,
            max_score=10.0,
            correct_count=2,
            total_count=2,
            accuracy_pct=100.0,
            weak_concepts=[
                ConceptGapItem(
                    concept_id=UUID("00000000-0000-0000-0000-888888888888"),
                    concept_name="Phép cộng phân số (Stub)",
                    bkt_before=0.25,
                    bkt_after=0.15,
                    mastery_state="weak",
                )
            ],
            submitted_at=submitted_at,
        )

    try:
        # 1. Lấy và kiểm tra thông tin lượt thi
        attempt_resp = (
            db.app_client.table("exam_attempts").select("*").eq("id", str(attempt_id)).maybe_single().execute()
        )
        attempt = attempt_resp.data
        if not attempt:
            raise HTTPException(status_code=404, detail="Không tìm thấy lượt thi.")

        if attempt["status"] != "in_progress":
            raise HTTPException(status_code=400, detail="Lượt thi đã được nộp hoặc không còn trong trạng thái làm bài.")

        if str(attempt["student_id"]) != str(current_user.id) and current_user.role == "student":
            raise HTTPException(status_code=403, detail="Sinh viên chỉ có quyền nộp bài làm của chính mình.")

        exam_set_id = attempt["exam_set_id"]

        # 2. Lấy danh sách câu hỏi trong bộ đề và thông tin concept, độ khó Elo, weight
        eq_resp = (
            db.app_client.table("exam_questions")
            .select("weight, questions(id, course_id, concept_id, prompt, answer_key, difficulty_elo)")
            .eq("exam_set_id", str(exam_set_id))
            .execute()
        )
        eq_data = eq_resp.data or []
        if not eq_data:
            raise HTTPException(status_code=400, detail="Bộ đề thi không có câu hỏi nào để chấm điểm.")

        # Xây dựng map câu hỏi
        questions_map = {}
        for item in eq_data:
            q = item.get("questions")
            if not q:
                continue
            questions_map[UUID(q["id"])] = {
                "course_id": UUID(q["course_id"]),
                "concept_id": UUID(q["concept_id"]),
                "prompt": q["prompt"],
                "answer_key": normalize_answer_key(q.get("answer_key")),
                "difficulty_elo": float(q.get("difficulty_elo") or 1200),
                "weight": float(item["weight"] or 1.0),
            }

        # 3. Tính điểm số và lưu lịch sử từng câu thông qua RPC submit_attempt_v3
        student_answers_map = {UUID(str(ans.question_id)): ans.selected_option for ans in request.answers}

        total_weight = 0.0
        weighted_score = 0.0
        correct_count = 0
        weak_concepts = []

        # Lấy policy_id cho course
        first_q = next(iter(questions_map.values()))
        course_id = first_q["course_id"]
        policy_id, policy_config = db.get_bandit_policy_state(course_id)

        # Chạy trong transaction để đảm bảo tính nguyên tử
        db.begin()
        try:
            for q_id, q_info in questions_map.items():
                weight = q_info["weight"]
                total_weight += weight

                student_option = student_answers_map.get(q_id, "")
                correct_option = q_info["answer_key"].get("correct", "")
                is_correct = student_option == correct_option
                score = 1.0 if is_correct else 0.0
                if is_correct:
                    correct_count += 1

                weighted_score += score * weight

                # Lấy trạng thái BKT hiện tại để phục vụ snapshot quyết định
                concept_id = q_info["concept_id"]
                mastery = db.get_student_mastery(current_user.id, course_id, concept_id)
                old_elo = float(mastery.get("elo_score", 1200))
                old_bkt = float(mastery.get("bkt_mastery_probability", 0.25))

                # Đề cố định không qua LinUCB chọn, nhưng để chạy submit_attempt_v3 (chống lỗi Replay)
                # ta cần chèn một quyết định giả lập vào audit.adaptive_decisions
                decision_id = uuid.uuid4()
                expected_success = calculate_expected_success(old_elo, q_info["difficulty_elo"])
                X_snapshot = build_student_context(old_bkt, old_elo)
                bandit_reward = calculate_bandit_reward(expected_success, score)

                decision_data = {
                    "id": str(decision_id),
                    "policy_id": str(policy_id),
                    "student_id": str(current_user.id),
                    "course_id": str(course_id),
                    "concept_id": str(concept_id),
                    "decision_type": "question",
                    "selected_action_id": str(q_id),
                    "selected_action_type": "question",
                    "candidate_action_ids": [str(q_id)],
                    "context_snapshot": X_snapshot,
                    "model_snapshot": {},
                    "expected_reward": 0.0,
                    "expected_success": expected_success,
                    "exploration_mode": "exploit",
                }

                db.audit_client.table("adaptive_decisions").insert(decision_data).execute()

                # Gọi RPC submit_attempt_v3 để tính toán lại điểm Elo và BKT trên DB
                payload = {
                    "p_decision_id": str(decision_id),
                    "p_student_id": str(current_user.id),
                    "p_course_id": str(course_id),
                    "p_concept_id": str(concept_id),
                    "p_question_id": str(q_id),
                    "p_student_answer": {"selected_option": student_option},
                    "p_actual_score": score,
                    "p_hint_count": 0,
                    "p_used_ai_help": False,
                    "p_context": X_snapshot,
                    "p_reward": bandit_reward,
                    "p_k_question": 32.0,
                    "p_response_time_ms": 30000,
                }

                txn_result = db.submit_attempt_v3(payload)
                new_bkt = txn_result.get("new_bkt", old_bkt)
                new_state = txn_result.get("new_state", "not_started")

                # Cập nhật trường exam_attempt_id cho bản ghi quiz_attempts vừa sinh ra từ RPC
                attempt_id_raw = txn_result.get("attempt_id") or txn_result.get("quiz_attempt_id")
                if attempt_id_raw:
                    db.app_client.table("quiz_attempts").update({"exam_attempt_id": str(attempt_id)}).eq(
                        "id", str(attempt_id_raw)
                    ).execute()

                # Nếu concept sau cập nhật ở trạng thái yếu (< 0.30), thêm vào danh sách hổng kiến thức
                if new_bkt < 0.30:
                    concept_resp = (
                        db.app_client.table("concepts")
                        .select("name")
                        .eq("id", str(concept_id))
                        .maybe_single()
                        .execute()
                    )
                    concept_name = (
                        concept_resp.data.get("name", "Khái niệm chưa đặt tên")
                        if concept_resp.data
                        else "Khái niệm chưa đặt tên"
                    )
                    weak_concepts.append(
                        ConceptGapItem(
                            concept_id=concept_id,
                            concept_name=concept_name,
                            bkt_before=old_bkt,
                            bkt_after=new_bkt,
                            mastery_state=new_state,
                        )
                    )

            # 4. Tính toán điểm quy đổi và kết thúc lượt làm bài thi
            exam_resp = (
                db.app_client.table("exam_sets").select("max_score").eq("id", str(exam_set_id)).maybe_single().execute()
            )
            max_score = float(exam_resp.data.get("max_score", 10.0)) if exam_resp.data else 10.0

            final_score = round((weighted_score / total_weight) * max_score, 2) if total_weight > 0 else 0.0
            submitted_at = datetime.now(UTC)

            # Cập nhật lượt thi tổng thể
            db.app_client.table("exam_attempts").update(
                {"final_score": final_score, "submitted_at": submitted_at.isoformat(), "status": "submitted"}
            ).eq("id", str(attempt_id)).execute()

            db.commit()

            # Trả về kết quả
            return ExamResultResponse(
                attempt_id=attempt_id,
                final_score=final_score,
                max_score=max_score,
                correct_count=correct_count,
                total_count=len(questions_map),
                accuracy_pct=round((correct_count / len(questions_map)) * 100.0, 2) if questions_map else 0.0,
                weak_concepts=weak_concepts,
                submitted_at=submitted_at,
            )

        except Exception as inner_err:
            db.rollback()
            raise inner_err

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Lỗi khi nộp bài thi giữa kỳ/cuối kỳ: %s", e, exc_info=True)
        raise HTTPException(status_code=503, detail="Không thể chấm điểm và lưu kết quả bài thi.")


@router.get("/attempts/{attempt_id}/result", response_model=ExamResultResponse)
async def get_exam_result(
    attempt_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AdaptiveDatabaseInterface = Depends(get_adaptive_db),
):
    """Lấy lại kết quả đã nộp của một lượt thi trước đó."""
    # Stub mode fallback
    if db._stub_mode or db.app_client is None:
        return ExamResultResponse(
            attempt_id=attempt_id,
            final_score=8.5,
            max_score=10.0,
            correct_count=2,
            total_count=2,
            accuracy_pct=100.0,
            weak_concepts=[],
            submitted_at=datetime.now(UTC),
        )

    try:
        # Lấy lượt thi
        attempt_resp = (
            db.app_client.table("exam_attempts").select("*").eq("id", str(attempt_id)).maybe_single().execute()
        )
        attempt = attempt_resp.data
        if not attempt:
            raise HTTPException(status_code=404, detail="Không tìm thấy lượt thi.")

        if attempt["status"] != "submitted":
            raise HTTPException(status_code=400, detail="Lượt thi chưa được nộp.")

        if str(attempt["student_id"]) != str(current_user.id) and current_user.role == "student":
            raise HTTPException(status_code=403, detail="Bạn không thể xem kết quả thi của học sinh khác.")

        exam_set_id = attempt["exam_set_id"]
        exam_resp = (
            db.app_client.table("exam_sets").select("max_score").eq("id", str(exam_set_id)).maybe_single().execute()
        )
        max_score = float(exam_resp.data.get("max_score", 10.0)) if exam_resp.data else 10.0

        # Lấy các quiz_attempts tương ứng để tính toán
        attempts_resp = (
            db.app_client.table("quiz_attempts")
            .select("is_correct, concept_id")
            .eq("exam_attempt_id", str(attempt_id))
            .execute()
        )
        attempts_data = attempts_resp.data or []

        total_count = len(attempts_data)
        correct_count = sum(1 for row in attempts_data if row.get("is_correct"))

        # Xác định các weak concepts của lượt làm bài thi này
        weak_concepts = []
        for row in attempts_data:
            concept_id = row["concept_id"]
            # Kiểm tra trạng thái mastery của học sinh với concept này
            mastery = db.get_student_mastery(current_user.id, attempt["course_id"], UUID(concept_id))
            bkt = float(mastery.get("bkt_mastery_probability", 0.25))
            if bkt < 0.30:
                concept_resp = (
                    db.app_client.table("concepts").select("name").eq("id", concept_id).maybe_single().execute()
                )
                concept_name = (
                    concept_resp.data.get("name", "Khái niệm chưa đặt tên")
                    if concept_resp.data
                    else "Khái niệm chưa đặt tên"
                )
                weak_concepts.append(
                    ConceptGapItem(
                        concept_id=UUID(concept_id),
                        concept_name=concept_name,
                        bkt_before=bkt,  # Dùng bkt hiện tại làm fallback
                        bkt_after=bkt,
                        mastery_state=mastery.get("mastery_state", "weak"),
                    )
                )

        return ExamResultResponse(
            attempt_id=attempt_id,
            final_score=float(attempt["final_score"]),
            max_score=max_score,
            correct_count=correct_count,
            total_count=total_count,
            accuracy_pct=round((correct_count / total_count) * 100.0, 2) if total_count > 0 else 0.0,
            weak_concepts=weak_concepts,
            submitted_at=datetime.fromisoformat(attempt["submitted_at"].replace("Z", "+00:00")),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Lỗi khi lấy kết quả bài thi: %s", e, exc_info=True)
        raise HTTPException(status_code=503, detail="Không thể truy cập kết quả bài thi lúc này.")
