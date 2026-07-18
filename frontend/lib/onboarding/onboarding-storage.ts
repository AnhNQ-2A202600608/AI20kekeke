import {
  EMPTY_ONBOARDING_DRAFT,
  ONBOARDING_PROFILE_VERSION,
  OnboardingDraft,
  OnboardingSummary,
} from './onboarding-contract';

const keyFor = (userId?: string | null) => `edugap_onboarding_v1:${userId || 'demo'}`;
const statusKeyFor = (userId: string) => `edugap_onboarding_status_v1:${userId}`;

export function loadOnboardingDraft(userId?: string | null): OnboardingDraft {
  if (typeof window === 'undefined') return { ...EMPTY_ONBOARDING_DRAFT };
  const raw = localStorage.getItem(keyFor(userId));
  if (!raw) return { ...EMPTY_ONBOARDING_DRAFT };
  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingDraft>;
    if (parsed.profileVersion !== ONBOARDING_PROFILE_VERSION) {
      return { ...EMPTY_ONBOARDING_DRAFT };
    }
    return {
      ...EMPTY_ONBOARDING_DRAFT,
      ...parsed,
      strengthConceptIds: parsed.strengthConceptIds ?? [],
      weaknessConceptIds: parsed.weaknessConceptIds ?? [],
      diagnosticAnswers: parsed.diagnosticAnswers ?? [],
    };
  } catch {
    return { ...EMPTY_ONBOARDING_DRAFT };
  }
}

export function saveOnboardingDraft(userId: string | null | undefined, draft: OnboardingDraft) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(keyFor(userId), JSON.stringify(draft));
}

export function clearOnboardingDraft(userId?: string | null) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(keyFor(userId));
}

export function markOnboardingComplete(userId: string, summary?: OnboardingSummary) {
  if (typeof window === 'undefined' || !userId) return;
  localStorage.setItem(
    statusKeyFor(userId),
    JSON.stringify({
      completed: true,
      summary,
      completedAt: new Date().toISOString(),
      savedAt: Date.now(),
      syncPending: false,
    }),
  );
}

export function markOnboardingPending(userId: string, summary?: OnboardingSummary, lastSyncError?: string) {
  if (typeof window === 'undefined' || !userId) return;
  localStorage.setItem(
    statusKeyFor(userId),
    JSON.stringify({
      completed: true,
      summary,
      completedAt: new Date().toISOString(),
      savedAt: Date.now(),
      syncPending: true,
      lastSyncError,
    }),
  );
}

export function readLocalOnboardingComplete(userId?: string | null): {
  completed: boolean;
  summary?: OnboardingSummary;
  syncPending: boolean;
  lastSyncError?: string;
} {
  if (typeof window === 'undefined' || !userId) return { completed: false, syncPending: false };
  const raw = localStorage.getItem(statusKeyFor(userId));
  if (!raw) return { completed: false, syncPending: false };
  try {
    const parsed = JSON.parse(raw) as {
      completed?: boolean;
      summary?: OnboardingSummary;
      savedAt?: number;
      syncPending?: boolean;
      lastSyncError?: string;
    };
    return {
      completed: Boolean(parsed.completed),
      summary: parsed.summary,
      syncPending: Boolean(parsed.syncPending),
      lastSyncError: parsed.lastSyncError,
    };
  } catch {
    return { completed: false, syncPending: false };
  }
}
