/**
 * Bayesian Knowledge Tracing (BKT) Service
 * =======================================
 * Estimates student mastery probability for knowledge concepts.
 */

export class BKTParameters {
  public priorLearned: number;
  public transitionLearn: number;
  public guess: number;
  public slip: number;

  constructor(
    priorLearned: number = 0.25,
    transitionLearn: number = 0.06,
    guess: number = 0.20,
    slip: number = 0.10
  ) {
    this.priorLearned = priorLearned;
    this.transitionLearn = transitionLearn;
    this.guess = guess;
    this.slip = slip;
  }
}

/**
 * Tính xác suất hậu nghiệm P(L_t | Result) sau khi trả lời Đúng/Sai.
 */
export function calculateBktPosterior(
  pMastery: number,
  isCorrect: boolean,
  params: BKTParameters
): number {
  let numerator = 0;
  let denominator = 0;

  if (isCorrect) {
    numerator = pMastery * (1.0 - params.slip);
    denominator = numerator + (1.0 - pMastery) * params.guess;
  } else {
    numerator = pMastery * params.slip;
    denominator = numerator + (1.0 - pMastery) * (1.0 - params.guess);
  }

  if (denominator === 0) {
    return pMastery;
  }

  return Math.min(1.0, Math.max(0.0, numerator / denominator));
}

/**
 * Cập nhật xác suất làm chủ của học sinh sau khi làm câu hỏi với điểm actualScore.
 * Hỗ trợ partial credit bằng nội suy tuyến tính.
 * Giới hạn [0.0001, 0.9999] để tránh Mastery Trap.
 */
export function calculateBktUpdate(
  pMastery: number,
  actualScore: number,
  params: BKTParameters
): number {
  let pPosterior = 0;

  if (actualScore >= 1.0) {
    pPosterior = calculateBktPosterior(pMastery, true, params);
  } else if (actualScore <= 0.0) {
    pPosterior = calculateBktPosterior(pMastery, false, params);
  } else {
    // Nội suy tuyến tính
    const pPostCorrect = calculateBktPosterior(pMastery, true, params);
    const pPostIncorrect = calculateBktPosterior(pMastery, false, params);
    pPosterior = actualScore * pPostCorrect + (1.0 - actualScore) * pPostIncorrect;
  }

  // Áp dụng học tập chuyển tiếp P(T)
  const pMasteryNew = pPosterior + (1.0 - pPosterior) * params.transitionLearn;

  // Giới hạn [0.0001, 0.9999] và làm tròn 4 chữ số thập phân
  const clamped = Math.min(0.9999, Math.max(0.0001, pMasteryNew));
  return Math.round(clamped * 10000) / 10000;
}

/**
 * Ánh xạ xác suất BKT sang nhãn trạng thái tương ứng trong Database:
 * - Mastery 1 (Weak): P(L) < 0.30
 * - Mastery 2 & 3 (Learning): 0.30 <= P(L) < 0.85
 * - Mastery 4 (Mastered): P(L) >= 0.85
 */
export function determineMasteryState(pMastery: number): string {
  if (pMastery < 0.30) {
    return 'weak';
  } else if (pMastery < 0.85) {
    return 'learning';
  } else {
    return 'mastered';
  }
}
