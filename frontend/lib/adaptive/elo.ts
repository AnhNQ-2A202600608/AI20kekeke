/**
 * Educational Elo Rating System Service
 * ====================================
 * Calculations for expected success probability and Elo updates for students and questions.
 */

/**
 * Tính xác suất học viên làm đúng câu hỏi dựa trên Elo.
 * P(correct) = 1 / (1 + 10^((question_elo - student_elo) / 400))
 */
export function calculateExpectedSuccess(studentElo: number, questionElo: number): number {
  let exponent = (questionElo - studentElo) / 400.0;
  // Clamping exponent to prevent overflow (issue C1)
  exponent = Math.min(20.0, Math.max(-20.0, exponent));
  return 1.0 / (1.0 + Math.pow(10.0, exponent));
}

/**
 * Cập nhật điểm Elo của học sinh và độ khó Elo của câu hỏi.
 * Áp dụng khấu trừ điểm thưởng nếu dùng gợi ý (Hint discount).
 */
export function calculateEloUpdates(
  studentElo: number,
  questionElo: number,
  actualScore: number,
  hintCount: number = 0,
  kStudent: number = 32.0,
  kQuestion: number = 32.0
): [number, number] {
  const expected = calculateExpectedSuccess(studentElo, questionElo);

  let studentDelta = actualScore - expected;
  let questionDelta = expected - actualScore;

  // Nếu làm bài đúng và có dùng gợi ý, chiết khấu lượng Elo nhận được
  if (studentDelta > 0 && hintCount > 0) {
    // 1 hint -> còn 70%, 2 hints -> còn 40%, >=3 hints -> còn 10%
    const discount = Math.max(0.1, 1.0 - 0.3 * hintCount);
    studentDelta *= discount;
    questionDelta *= discount;
  }

  const newStudentElo = studentElo + kStudent * studentDelta;
  const newQuestionElo = questionElo + kQuestion * questionDelta;

  // Làm tròn 2 chữ số thập phân giống Python
  return [
    Math.round(newStudentElo * 100) / 100,
    Math.round(newQuestionElo * 100) / 100
  ];
}

interface AggregateEloMastery {
  attemptCount?: number;
  conceptCode?: string;
  conceptId?: string;
  elo?: number;
}

export interface AggregateLearningEloDetail {
  conceptCode?: string;
  conceptId?: string;
  elo: number;
  attemptCount: number;
}

export interface AggregateLearningEloResult {
  elo: number;
  conceptCount: number;
  concepts: AggregateLearningEloDetail[];
}

export function getAggregateLearningEloDetails(
  conceptMasteries: Record<string, AggregateEloMastery | undefined> | null | undefined,
  fallbackElo = 1200,
): AggregateLearningEloResult {
  const uniqueByConcept = new Map<string, AggregateEloMastery>();

  Object.entries(conceptMasteries || {}).forEach(([key, mastery]) => {
    if (!mastery) return;
    const elo = Number(mastery?.elo);
    if (!Number.isFinite(elo) || elo <= 0) return;

    const conceptKey = mastery?.conceptId || mastery?.conceptCode || key;
    const current = uniqueByConcept.get(conceptKey);
    if (!current || (mastery?.attemptCount || 0) > (current.attemptCount || 0)) {
      uniqueByConcept.set(conceptKey, mastery);
    }
  });

  const practicedEloValues = Array.from(uniqueByConcept.values())
    .filter((mastery) => (mastery.attemptCount || 0) > 0)
    .map((mastery) => ({
      conceptCode: mastery.conceptCode,
      conceptId: mastery.conceptId,
      elo: Number(mastery.elo),
      attemptCount: mastery.attemptCount || 0,
    }))
    .filter((mastery) => Number.isFinite(mastery.elo) && mastery.elo > 0);

  if (practicedEloValues.length > 0) {
    return {
      elo: Math.round(practicedEloValues.reduce((sum, mastery) => sum + mastery.elo, 0) / practicedEloValues.length),
      conceptCount: practicedEloValues.length,
      concepts: practicedEloValues,
    };
  }

  const seededEloValues = Array.from(uniqueByConcept.values())
    .map((mastery) => ({
      conceptCode: mastery.conceptCode,
      conceptId: mastery.conceptId,
      elo: Number(mastery.elo),
      attemptCount: mastery.attemptCount || 0,
    }))
    .filter((mastery) => Number.isFinite(mastery.elo) && mastery.elo > 0);

  if (seededEloValues.length === 0) {
    return { elo: fallbackElo, conceptCount: 0, concepts: [] };
  }
  return {
    elo: Math.round(seededEloValues.reduce((sum, mastery) => sum + mastery.elo, 0) / seededEloValues.length),
    conceptCount: seededEloValues.length,
    concepts: seededEloValues,
  };
}

export function getAggregateLearningElo(
  conceptMasteries: Record<string, AggregateEloMastery | undefined> | null | undefined,
  fallbackElo = 1200,
): number {
  return getAggregateLearningEloDetails(conceptMasteries, fallbackElo).elo;
}

export function getConceptLearningElo(
  conceptMasteries: Record<string, AggregateEloMastery | undefined> | null | undefined,
  options: { conceptCode?: string | null; conceptId?: string | null },
  fallbackElo = 1200,
): number {
  const candidates = Object.entries(conceptMasteries || {})
    .filter(([key, mastery]) => {
      if (!mastery) return false;
      if (options.conceptId && mastery.conceptId === options.conceptId) return true;
      if (options.conceptCode && (key === options.conceptCode || mastery.conceptCode === options.conceptCode)) {
        return true;
      }
      return false;
    })
    .map(([, mastery]) => mastery)
    .filter((mastery): mastery is AggregateEloMastery => Boolean(mastery))
    .filter((mastery) => Number.isFinite(Number(mastery.elo)) && Number(mastery.elo) > 0)
    .sort((a, b) => (b.attemptCount || 0) - (a.attemptCount || 0));

  if (candidates.length === 0) return fallbackElo;
  return Math.round(Number(candidates[0].elo));
}
