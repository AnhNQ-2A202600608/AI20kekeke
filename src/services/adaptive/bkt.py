"""
Bayesian Knowledge Tracing (BKT) Service
=======================================

Module này thực hiện mô hình toán học Bayesian Knowledge Tracing để ước lượng
xác suất làm chủ tri thức (mastery probability) của học sinh đối với từng Concept.

Tài liệu tham chiếu thiết kế:
---------------------------
- docs/research/bayesian-knowledge-tracing.md
- docs/research/adaptive-implementation_guide.md
"""


class BKTParameters:
    def __init__(
        self,
        prior_learned: float = 0.25,
        transition_learn: float = 0.06,
        guess: float = 0.20,
        slip: float = 0.10,
    ):
        """
        Khởi tạo tham số BKT cho một concept kiến thức.
        - prior_learned (P(L0)): Xác suất ban đầu học sinh đã làm chủ kiến thức.
        - transition_learn (P(T)): Xác suất học sinh học được sau mỗi cơ hội học tập.
        - guess (P(G)): Xác suất đoán bừa đúng dù chưa làm chủ kiến thức.
        - slip (P(S)): Xác suất làm sai ngớ ngẩn dù đã làm chủ kiến thức.
        """
        self.prior_learned = prior_learned
        self.transition_learn = transition_learn
        self.guess = guess
        self.slip = slip


def calculate_bkt_posterior(
    p_mastery: float,
    is_correct: bool,
    params: BKTParameters,
) -> float:
    """
    Tính xác suất hậu nghiệm (Posterior Probability) P(L_t | Result)
    ngay sau khi nhận kết quả câu trả lời Đúng/Sai.
    """
    if is_correct:
        numerator = p_mastery * (1.0 - params.slip)
        denominator = numerator + (1.0 - p_mastery) * params.guess
    else:
        numerator = p_mastery * params.slip
        denominator = numerator + (1.0 - p_mastery) * (1.0 - params.guess)

    if denominator == 0:
        return p_mastery
    return min(1.0, max(0.0, numerator / denominator))


def calculate_bkt_update(
    p_mastery: float,
    actual_score: float,
    params: BKTParameters,
) -> float:
    """
    Cập nhật và trả về xác suất làm chủ mới của học sinh sau lượt thử nghiệm.
    Sử dụng logic nhị phân chuẩn (Đúng khi actual_score >= 0.75, ngược lại là Sai).
    """
    is_correct = actual_score >= 0.75
    p_posterior = calculate_bkt_posterior(p_mastery, is_correct, params)

    # 2. Áp dụng xác suất học tập chuyển tiếp P(T) cho cơ hội học tiếp theo
    p_mastery_new = p_posterior + (1.0 - p_posterior) * params.transition_learn

    # Giới hạn cận trên là 0.9999 và cận dưới là 0.0001, làm tròn 4 chữ số
    return round(min(0.9999, max(0.0001, p_mastery_new)), 4)


def determine_mastery_state(p_mastery: float) -> str:
    """
    Ánh xạ xác suất BKT của học viên về trạng thái tương ứng trong Database:
    - Mastery 1 (Weak): P(L) < 0.30
    - Mastery 2 & 3 (Learning): 0.30 <= P(L) < 0.85
    - Mastery 4 (Mastered): P(L) >= 0.85
    """
    if p_mastery < 0.30:
        return "weak"
    elif p_mastery < 0.85:
        return "learning"
    else:
        return "mastered"
