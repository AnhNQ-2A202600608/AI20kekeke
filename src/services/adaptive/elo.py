"""
Educational Elo Rating System Service
====================================

Module này chịu trách nhiệm tính toán xác suất thành công kỳ vọng của học viên đối với
câu hỏi và thực hiện cập nhật chỉ số năng lực của học viên (Student Elo) song song với
độ khó của câu hỏi (Question difficulty Elo) dựa trên kết quả làm bài thực tế.

Tài liệu tham chiếu thiết kế:
---------------------------
- ADR-002: Lựa chọn thuật toán đánh giá năng lực học tập thích ứng
- docs/research/adaptive-learning-and-cold-start.md

Công thức toán học cốt lõi:
--------------------------
1. Xác suất thành công kỳ vọng (Expected Success Probability):
   P(correct) = 1.0 / (1.0 + 10.0^((question_elo - student_elo) / 400.0))

2. Cập nhật chỉ số Elo (Dual Elo Update):
   - student_elo_new = student_elo_old + K * (actual_score - expected) * discount
   - question_elo_new = question_elo_old + K * (expected - actual_score) * discount

Cơ chế tối ưu & Chống gian lận (AI & Hint protection):
------------------------------------------------------
- Hint discount: Nếu học sinh làm bài đúng (delta > 0) nhưng có dùng gợi ý (hint_count > 0),
  lượng điểm Elo nhận được và độ khó giảm trừ của câu hỏi sẽ được khấu trừ tương ứng:
  discount = max(0.1, 1.0 - 0.3 * hint_count)

- AI Help protection: Nếu học sinh dùng AI trợ giúp để trả lời (used_ai_help = True),
  chỉ số Elo của học sinh sẽ được ĐÓNG BĂNG (K_factor = 0 đối với học sinh), nhưng độ khó
  của câu hỏi vẫn được cập nhật bình thường để đảm bảo hiệu chuẩn câu hỏi tự động.
"""


def calculate_expected_success(student_elo: float, question_elo: float) -> float:
    """
    Tính xác suất học viên làm đúng câu hỏi dựa trên Elo.
    P(correct) = 1 / (1 + 10^((question_elo - student_elo) / 400))
    """
    exponent = (question_elo - student_elo) / 400.0
    # Clamping exponent to prevent overflow (issue C1)
    exponent = min(20.0, max(-20.0, exponent))
    return 1.0 / (1.0 + 10.0**exponent)


def calculate_elo_updates(
    student_elo: float,
    question_elo: float,
    actual_score: float,
    hint_count: int = 0,
    k_student: float = 32.0,
    k_question: float = 32.0,
) -> tuple[float, float]:
    """
    Cập nhật điểm Elo của học sinh và độ khó Elo của câu hỏi.
    Áp dụng khấu trừ điểm thưởng nếu dùng gợi ý (Hint discount).
    """
    expected = calculate_expected_success(student_elo, question_elo)

    student_delta = actual_score - expected
    question_delta = expected - actual_score

    # Nếu làm bài đúng và có dùng gợi ý, chiết khấu lượng Elo nhận được
    if student_delta > 0 and hint_count > 0:
        # 1 hint -> còn 70%, 2 hints -> còn 40%, >=3 hints -> còn 10%
        discount = max(0.1, 1.0 - 0.3 * hint_count)
        student_delta *= discount
        question_delta *= discount

    new_student_elo = student_elo + k_student * student_delta
    new_question_elo = question_elo + k_question * question_delta

    return round(new_student_elo, 2), round(new_question_elo, 2)
