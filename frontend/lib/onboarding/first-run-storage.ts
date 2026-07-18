import type { OnboardingSummary } from './onboarding-contract';

export const FIRST_RUN_TOUR_EVENT = 'mentora:first-run-tour:start';

const FIRST_RUN_VERSION = 1;
const keyFor = (userId?: string | null) => `mentora_first_run_v${FIRST_RUN_VERSION}:${userId || 'demo'}`;

export type FirstRunStatus = 'idle' | 'pending' | 'active' | 'dismissed' | 'completed';

export interface FirstRunState {
  version: number;
  status: FirstRunStatus;
  currentStep: number;
  summary?: OnboardingSummary;
  pendingSince?: string;
  dismissedAt?: string;
  completedAt?: string;
  updatedAt: number;
}

const idleState: FirstRunState = {
  version: FIRST_RUN_VERSION,
  status: 'idle',
  currentStep: 0,
  updatedAt: 0,
};

function normalizeState(value: Partial<FirstRunState> | null): FirstRunState {
  if (!value || value.version !== FIRST_RUN_VERSION) return { ...idleState };
  return {
    ...idleState,
    ...value,
    currentStep: Math.max(0, Number(value.currentStep) || 0),
    updatedAt: Number(value.updatedAt) || Date.now(),
  };
}

export function readFirstRunState(userId?: string | null): FirstRunState {
  if (typeof window === 'undefined') return { ...idleState };
  const raw = localStorage.getItem(keyFor(userId));
  if (!raw) return { ...idleState };
  try {
    return normalizeState(JSON.parse(raw) as Partial<FirstRunState>);
  } catch {
    return { ...idleState };
  }
}

function writeFirstRunState(userId: string | null | undefined, state: FirstRunState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(keyFor(userId), JSON.stringify({ ...state, updatedAt: Date.now() }));
}

export function markFirstRunPending(userId: string | null | undefined, summary?: OnboardingSummary) {
  if (!userId) return;
  const current = readFirstRunState(userId);
  if (current.status === 'completed' || current.status === 'pending' || current.status === 'active') return;
  writeFirstRunState(userId, {
    version: FIRST_RUN_VERSION,
    status: 'pending',
    currentStep: 0,
    summary,
    pendingSince: new Date().toISOString(),
    updatedAt: Date.now(),
  });
}

export function startFirstRunTour(userId: string | null | undefined) {
  if (!userId) return;
  const current = readFirstRunState(userId);
  writeFirstRunState(userId, {
    ...current,
    version: FIRST_RUN_VERSION,
    status: 'active',
    currentStep: Math.min(Math.max(0, current.currentStep), 4),
    updatedAt: Date.now(),
  });
}

export function updateFirstRunStep(userId: string | null | undefined, currentStep: number) {
  if (!userId) return;
  const current = readFirstRunState(userId);
  if (current.status === 'completed') return;
  writeFirstRunState(userId, {
    ...current,
    status: 'active',
    currentStep,
    updatedAt: Date.now(),
  });
}

export function dismissFirstRunTour(userId: string | null | undefined) {
  if (!userId) return;
  const current = readFirstRunState(userId);
  if (current.status === 'completed') return;
  writeFirstRunState(userId, {
    ...current,
    status: 'dismissed',
    dismissedAt: new Date().toISOString(),
    updatedAt: Date.now(),
  });
}

export function completeFirstRun(userId: string | null | undefined) {
  if (!userId) return;
  const current = readFirstRunState(userId);
  if (current.status === 'completed') return;
  writeFirstRunState(userId, {
    ...current,
    status: 'completed',
    completedAt: new Date().toISOString(),
    updatedAt: Date.now(),
  });
}
