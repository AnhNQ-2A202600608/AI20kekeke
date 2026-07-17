/**
 * Contextual Bandit (LinUCB) Service
 * ==================================
 * Implements LinUCB algorithm for personalized question recommendation in ZPD.
 * Uses Sherman-Morrison formula for O(d^2) matrix updates.
 */

export interface ArmState {
  A_inv: number[][]; // 3x3 matrix
  b: number[];       // size 3 vector
}

export class LinUCB {
  public contextDim: number;
  public alpha: number;

  constructor(contextDim: number = 3, alpha: number = 1.0) {
    this.contextDim = contextDim;
    this.alpha = alpha;
  }

  /**
   * Khởi tạo trạng thái mặc định của một câu hỏi (arm).
   * A_inv là ma trận đơn vị Identity 3x3, b là vector 0.
   */
  public getDefaultArmState(): ArmState {
    const A_inv = [
      [1.0, 0.0, 0.0],
      [0.0, 1.0, 0.0],
      [0.0, 0.0, 1.0],
    ];
    const b = [0.0, 0.0, 0.0];
    return { A_inv, b };
  }

  /**
   * Tính toán phần thưởng kỳ vọng (Pred) và cận trên UCB của câu hỏi.
   * A_inv: 3x3 matrix, b: size 3 vector, context: size 3 vector.
   */
  public computeUcbScore(context: number[], armState: ArmState): [number, number] {
    const A_inv = armState.A_inv;
    const b = armState.b;
    const x = context;

    // theta = A_inv * b
    const theta = [0.0, 0.0, 0.0];
    for (let i = 0; i < 3; i++) {
      theta[i] = A_inv[i][0] * b[0] + A_inv[i][1] * b[1] + A_inv[i][2] * b[2];
    }

    // pred = theta^T * x
    const pred = theta[0] * x[0] + theta[1] * x[1] + theta[2] * x[2];

    // variance = x^T * A_inv * x
    // Đầu tiên tính temp = x^T * A_inv (vector hàng 1x3)
    const temp = [0.0, 0.0, 0.0];
    for (let j = 0; j < 3; j++) {
      temp[j] = x[0] * A_inv[0][j] + x[1] * A_inv[1][j] + x[2] * A_inv[2][j];
    }
    // Sau đó nhân với x
    const variance = temp[0] * x[0] + temp[1] * x[1] + temp[2] * x[2];
    const stdDev = Math.sqrt(Math.max(0.0, variance));

    // UCB score
    const ucb = pred + this.alpha * stdDev;

    return [pred, ucb];
  }

  /**
   * Chọn câu hỏi tốt nhất (arm) dựa trên điểm UCB cao nhất.
   */
  public selectArm(
    contextVector: number[],
    armsStates: Record<string, ArmState>,
    candidateArmIds: string[]
  ): [string, number] {
    if (!candidateArmIds || candidateArmIds.length === 0) {
      throw new Error('Danh sách câu hỏi ứng viên không được trống');
    }

    let bestArmId = '';
    let bestUcb = -Infinity;
    let bestPred = 0.0;

    for (const armId of candidateArmIds) {
      let armState = armsStates[armId];
      if (!armState) {
        armState = this.getDefaultArmState();
        armsStates[armId] = armState;
      }

      const [pred, ucb] = this.computeUcbScore(contextVector, armState);
      if (ucb > bestUcb) {
        bestUcb = ucb;
        bestPred = pred;
        bestArmId = armId;
      }
    }

    return [bestArmId, bestPred];
  }

  /**
   * Cập nhật ma trận hiệp biến nghịch đảo A_inv trực tiếp bằng công thức Sherman-Morrison
   */
  public updateArm(
    armId: string,
    contextVector: number[],
    reward: number,
    armsStates: Record<string, ArmState>
  ): ArmState {
    let armState = armsStates[armId];
    if (!armState) {
      armState = this.getDefaultArmState();
    }

    const A_inv = armState.A_inv;
    const b = armState.b;
    const x = contextVector;

    // 1. Tính toán x^T * A_inv * x (variance)
    const temp = [0.0, 0.0, 0.0];
    for (let j = 0; j < 3; j++) {
      temp[j] = x[0] * A_inv[0][j] + x[1] * A_inv[1][j] + x[2] * A_inv[2][j];
    }
    const xT_Ainv_x = temp[0] * x[0] + temp[1] * x[1] + temp[2] * x[2];
    const denominator = 1.0 + xT_Ainv_x;

    // 2. Tính w = A_inv * x (vector cột 3x1)
    const w = [0.0, 0.0, 0.0];
    for (let i = 0; i < 3; i++) {
      w[i] = A_inv[i][0] * x[0] + A_inv[i][1] * x[1] + A_inv[i][2] * x[2];
    }

    // 3. Tính A_inv_new = A_inv - (w * w^T) / denominator
    const A_inv_new: number[][] = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const outerProduct = w[i] * w[j];
        A_inv_new[i][j] = A_inv[i][j] - outerProduct / denominator;
      }
    }

    // Đảm bảo tính đối xứng để chống trôi số dấu phẩy động
    for (let i = 0; i < 3; i++) {
      for (let j = i; j < 3; j++) {
        const symmetricValue = (A_inv_new[i][j] + A_inv_new[j][i]) / 2.0;
        A_inv_new[i][j] = symmetricValue;
        A_inv_new[j][i] = symmetricValue;
      }
    }

    // 4. Cập nhật b_new = b + reward * x
    const b_new = [0.0, 0.0, 0.0];
    for (let i = 0; i < 3; i++) {
      b_new[i] = b[i] + reward * x[i];
    }

    const updatedState = {
      A_inv: A_inv_new,
      b: b_new,
    };
    armsStates[armId] = updatedState;
    return updatedState;
  }
}

/**
 * Xây dựng vector ngữ cảnh 3 chiều: [Bias=1.0, BKT_mastery, Sigmoid_normalized_Elo].
 */
export function buildStudentContext(pMastery: number, studentElo: number): number[] {
  // Soft Sigmoid normalization with overflow clamp (issue C1)
  let exponent = -(studentElo - 1600.0) / 400.0;
  exponent = Math.min(20.0, Math.max(-20.0, exponent));
  const normalizedElo = 1.0 / (1.0 + Math.exp(exponent));
  return [1.0, pMastery, normalizedElo];
}

/**
 * Tính tín hiệu thưởng (Reward Y) dựa trên ZPD (mục tiêu 75% làm đúng).
 */
export function calculateBanditReward(expectedSuccess: number, actualScore: number): number {
  const zpdReward = 1.0 - 2.0 * Math.abs(expectedSuccess - 0.75);
  const reward = actualScore * zpdReward;
  return Math.round(reward * 10000) / 10000;
}
