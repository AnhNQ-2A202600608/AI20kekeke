import { calculateEloUpdates } from './elo';

type AnswerRecord = {
  isCorrect: boolean;
  hintCount?: number;
};

type PracticeQuestion = {
  id: string | number;
  difficulty?: string;
  difficulty_elo?: number;
};

export const DEFAULT_STUDENT_ELO = 1200;
export const DEFAULT_BKT = 0.25;
export const BKT_TRANSITION_LEARN = 0.06;
export const BKT_GUESS = 0.20;
export const BKT_SLIP = 0.10;

export function getQuestionDifficultyElo(question?: PracticeQuestion, setDifficulty?: string): number {
  if (question?.difficulty_elo !== undefined && Number.isFinite(Number(question.difficulty_elo))) {
    return Number(question.difficulty_elo);
  }

  const difficulty = question?.difficulty || setDifficulty || 'bình thường';
  if (difficulty === 'dễ') return 900;
  if (difficulty === 'khó') return 1300;
  return 1100;
}

export function calculateNextStudentElo(
  studentElo: number,
  question: PracticeQuestion | undefined,
  isCorrect: boolean,
  hintCount = 0,
  setDifficulty?: string
): number {
  const questionElo = getQuestionDifficultyElo(question, setDifficulty);
  const [nextStudentElo] = calculateEloUpdates(studentElo, questionElo, isCorrect ? 1 : 0, hintCount);
  return Math.max(600, Math.round(nextStudentElo));
}

export function calculatePracticeEloProgression(
  startElo: number,
  questions: PracticeQuestion[],
  answersByQuestionId: Record<string, AnswerRecord | undefined>,
  setDifficulty?: string
) {
  const beforeByQuestionId: Record<string, number> = {};
  const deltaByQuestionId: Record<string, number> = {};
  let currentElo = startElo;

  questions.forEach((question) => {
    beforeByQuestionId[question.id] = currentElo;
    const answer = answersByQuestionId[question.id];
    if (!answer) {
      deltaByQuestionId[question.id] = 0;
      return;
    }

    const nextElo = calculateNextStudentElo(
      currentElo,
      question,
      answer.isCorrect,
      answer.hintCount ?? 0,
      setDifficulty
    );
    deltaByQuestionId[question.id] = nextElo - currentElo;
    currentElo = nextElo;
  });

  return {
    startElo,
    finalElo: currentElo,
    delta: currentElo - startElo,
    beforeByQuestionId,
    deltaByQuestionId,
  };
}

export function masteryScoreFromBkt(bkt: number): number {
  return Math.min(100, Math.max(0, Math.round(bkt * 100)));
}

export function masteryStatusFromBkt(bkt: number): 'MASTERED' | 'LEARNING' | 'WEAK' | 'NOT_STARTED' {
  if (bkt <= 0) return 'NOT_STARTED';
  if (bkt < 0.3) return 'WEAK';
  if (bkt < 0.85) return 'LEARNING';
  return 'MASTERED';
}
