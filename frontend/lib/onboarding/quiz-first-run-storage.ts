const QUIZ_FIRST_RUN_VERSION = 1;

export const QUIZ_FIRST_RUN_TOUR_EVENT = 'mentora:quiz-first-run-tour:start';

const keyFor = (userId?: string | null) => `mentora_quiz_first_run_v${QUIZ_FIRST_RUN_VERSION}:${userId || 'demo'}`;

export type QuizFirstRunStatus = 'idle' | 'active' | 'dismissed' | 'completed';

export interface QuizFirstRunState {
  version: number;
  status: QuizFirstRunStatus;
  currentStep: number;
  completedAt?: string;
  dismissedAt?: string;
  updatedAt: number;
}

const idleState: QuizFirstRunState = {
  version: QUIZ_FIRST_RUN_VERSION,
  status: 'idle',
  currentStep: 0,
  updatedAt: 0,
};

function normalizeState(value: Partial<QuizFirstRunState> | null): QuizFirstRunState {
  if (!value || value.version !== QUIZ_FIRST_RUN_VERSION) return { ...idleState };
  return {
    ...idleState,
    ...value,
    currentStep: Math.max(0, Number(value.currentStep) || 0),
    updatedAt: Number(value.updatedAt) || Date.now(),
  };
}

export function readQuizFirstRunState(userId?: string | null): QuizFirstRunState {
  if (typeof window === 'undefined') return { ...idleState };
  const raw = localStorage.getItem(keyFor(userId));
  if (!raw) return { ...idleState };
  try {
    return normalizeState(JSON.parse(raw) as Partial<QuizFirstRunState>);
  } catch {
    return { ...idleState };
  }
}

function writeQuizFirstRunState(userId: string | null | undefined, state: QuizFirstRunState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(keyFor(userId), JSON.stringify({ ...state, updatedAt: Date.now() }));
}

export function startQuizFirstRun(userId?: string | null) {
  const current = readQuizFirstRunState(userId);
  if (current.status === 'completed' || current.status === 'dismissed') return current;

  const next = {
    ...current,
    version: QUIZ_FIRST_RUN_VERSION,
    status: 'active' as const,
    updatedAt: Date.now(),
  };
  writeQuizFirstRunState(userId, next);
  return next;
}

export function resetQuizFirstRun(userId?: string | null) {
  const next = {
    version: QUIZ_FIRST_RUN_VERSION,
    status: 'active' as const,
    currentStep: 0,
    updatedAt: Date.now(),
  };
  writeQuizFirstRunState(userId, next);
  return next;
}

export function updateQuizFirstRunStep(userId: string | null | undefined, currentStep: number) {
  const current = readQuizFirstRunState(userId);
  if (current.status === 'completed' || current.status === 'dismissed') return;
  writeQuizFirstRunState(userId, {
    ...current,
    status: 'active',
    currentStep,
    updatedAt: Date.now(),
  });
}

export function dismissQuizFirstRun(userId?: string | null) {
  const current = readQuizFirstRunState(userId);
  if (current.status === 'completed') return;
  writeQuizFirstRunState(userId, {
    ...current,
    status: 'dismissed',
    dismissedAt: new Date().toISOString(),
    updatedAt: Date.now(),
  });
}

export function completeQuizFirstRun(userId?: string | null) {
  const current = readQuizFirstRunState(userId);
  if (current.status === 'completed') return;
  writeQuizFirstRunState(userId, {
    ...current,
    status: 'completed',
    completedAt: new Date().toISOString(),
    updatedAt: Date.now(),
  });
}
