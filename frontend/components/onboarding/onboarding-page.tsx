'use client';

import { MouseEvent, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUpRight, BellRing, BookOpen, CheckCircle2, Clock, Gauge, ListTodo, RotateCcw, Route, Target, WifiOff } from 'lucide-react';

import { MascotLoadingBlock } from '@/components/mascot';
import { useBoundStore } from '@/hooks/useBoundStore';
import { isDemoAuthToken, isJwtExpired, isJwtToken } from '@/lib/auth-token';
import { diagnosticsLog } from '@/lib/diagnostics/logger';
import { isDemoMode } from '@/lib/demo-mode';
import {
  answerOnboardingDiagnostic,
  completeOnboarding,
  OnboardingApiError,
  startOnboardingDiagnostic,
} from '@/lib/onboarding/onboarding-api';
import {
  DIAGNOSTIC_COUNT_OPTIONS,
  DiagnosticQuestionCount,
  DiagnosticSessionState,
  EMPTY_ONBOARDING_DRAFT,
  GOAL_OPTIONS,
  LearningGoal,
  OnboardingContextPayload,
  OnboardingDraft,
  WeeklyPracticeMinutes,
  WEEKLY_TIME_OPTIONS,
  toSubmitPayload,
} from '@/lib/onboarding/onboarding-contract';
import { buildLocalSummary, conceptLabel } from '@/lib/onboarding/onboarding-scoring';
import { markFirstRunPending } from '@/lib/onboarding/first-run-storage';
import {
  clearOnboardingDraft,
  loadOnboardingDraft,
  markOnboardingComplete,
  markOnboardingPending,
  saveOnboardingDraft,
} from '@/lib/onboarding/onboarding-storage';

const contextStepCount = 2;
const diagnosticStep = contextStepCount + 1;
const resultStep = diagnosticStep + 1;
const totalSteps = resultStep + 1;
const defaultDiagnosticQuestions = 15;
const baselineBkt = 0.25;
const baselineElo = 1200;

type SubmitState = 'idle' | 'starting' | 'answering' | 'submitting' | 'offline' | 'invalid' | 'done';
type OnboardingTransition = {
  key: string;
  type: 'difficulty' | 'concept';
  eyebrow: string;
  title: string;
  body: string;
};

function clampStep(step: number) {
  return Math.max(0, Math.min(step, resultStep));
}

function OptionButton({
  active,
  title,
  detail,
  marker,
  onClick,
  disabled = false,
}: {
  active: boolean;
  title: string;
  detail?: string;
  marker?: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-16 w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200 active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-primary-green/20 disabled:cursor-not-allowed disabled:opacity-60 ${
        active
          ? 'border-primary-green bg-primary-green-light/30 text-primary-green-dark font-bold ring-2 ring-primary-green/10 shadow-[0_8px_22px_rgba(88,204,2,0.12)]'
          : 'border-tertiary-yellow/30 bg-warm-cream text-stone-750 shadow-sm hover:border-tertiary-yellow/60 hover:bg-warm-cream-light'
      }`}
    >
      {marker ? (
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border font-mono text-body-dense font-black transition-colors ${
            active
              ? 'border-primary-green/25 bg-primary-green-light text-primary-green-dark'
              : 'border-tertiary-yellow/20 bg-tertiary-yellow/10 text-tertiary-yellow-dark'
          }`}
        >
          {marker}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-body-dense font-black leading-snug md:text-control-label">{title}</span>
        {detail ? <span className="mt-1 block text-label-tight font-semibold leading-snug text-neutral-500 md:text-node-label">{detail}</span> : null}
      </span>
    </button>
  );
}

function StepHeader({ step }: { step: number }) {
  const progress = Math.round(((step + 1) / totalSteps) * 100);
  return (
    <div className="shrink-0 border-b border-primary-green/10 bg-white/90 px-4 py-2.5 backdrop-blur md:px-6">
      <div className="mx-auto flex max-w-[1280px] items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary-green/15 bg-primary-green/10 text-primary-green shadow-sm">
          <ListTodo className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-control-label font-black text-neutral-900 md:text-form-base">Thiết lập lộ trình học</p>
            <span className="rounded-full bg-lime-100 px-2.5 py-0.5 text-node-label font-black text-primary-green-dark">
              {progress}%
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100" aria-label={`Tiến độ ${progress}%`}>
            <div className="h-full rounded-full bg-primary-green transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function validateStep(step: number, draft: OnboardingDraft) {
  if (step === 0) return Boolean(draft.weeklyPracticeMinutes);
  if (step === 1) return Boolean(draft.learningGoal);
  if (step === 2) return Boolean(draft.targetQuestionCount);
  if (step === diagnosticStep) {
    const question = draft.currentQuestion;
    return Boolean(question && draft.diagnosticAnswers.some((answer) => answer.questionId === question.id));
  }
  return true;
}

function toContextPayload(draft: OnboardingDraft): OnboardingContextPayload | null {
  if (!draft.weeklyPracticeMinutes || !draft.learningGoal) return null;
  return {
    weekly_practice_minutes: draft.weeklyPracticeMinutes,
    learning_goal: draft.learningGoal,
    target_question_count: draft.targetQuestionCount ?? defaultDiagnosticQuestions,
    strength_concept_ids: draft.strengthConceptIds,
    weakness_concept_ids: draft.weaknessConceptIds,
    support_style: draft.supportStyle,
    learning_cadence: draft.learningCadence,
  };
}

function makeDiagnosticPrefetchKey(payload: OnboardingContextPayload) {
  return JSON.stringify({
    weeklyPracticeMinutes: payload.weekly_practice_minutes,
    learningGoal: payload.learning_goal,
    targetQuestionCount: payload.target_question_count ?? defaultDiagnosticQuestions,
    strengthConceptIds: payload.strength_concept_ids,
    weaknessConceptIds: payload.weakness_concept_ids,
    supportStyle: payload.support_style,
    learningCadence: payload.learning_cadence,
  });
}

function diagnosticDifficultyBand(elo?: number | null): { label: string; rank: number } {
  if (typeof elo !== 'number' || !Number.isFinite(elo)) return { label: 'bình thường', rank: 1 };
  if (elo < 1150) return { label: 'dễ', rank: 0 };
  if (elo < 1300) return { label: 'bình thường', rank: 1 };
  return { label: 'khó', rank: 2 };
}

function buildDiagnosticTransition(
  currentQuestion: DiagnosticSessionState['current_question'],
  nextQuestion: DiagnosticSessionState['current_question'],
): OnboardingTransition | null {
  if (!currentQuestion || !nextQuestion) return null;
  const before = diagnosticDifficultyBand(currentQuestion.difficulty_elo);
  const after = diagnosticDifficultyBand(nextQuestion.difficulty_elo);
  if (after.rank > before.rank) {
    return {
      key: `${nextQuestion.id}:difficulty:${before.label}-${after.label}`,
      type: 'difficulty',
      eyebrow: 'Độ khó đã tăng',
      title: `${before.label} -> ${after.label}`,
      body: 'Bạn vừa trả lời đủ tốt để Mentora nâng mức thử thách ở câu kế tiếp.',
    };
  }
  if (currentQuestion.concept_id !== nextQuestion.concept_id) {
    return {
      key: `${nextQuestion.id}:concept:${currentQuestion.concept_id}-${nextQuestion.concept_id}`,
      type: 'concept',
      eyebrow: 'Đổi chủ đề',
      title: conceptLabel(nextQuestion.concept_id),
      body: 'Câu tiếp theo chuyển sang concept khác để kiểm tra độ phủ, không chỉ lặp lại một mảng kiến thức.',
    };
  }
  return null;
}

export function OnboardingPage() {
  const router = useRouter();
  const loggedIn = useBoundStore((state) => state.loggedIn);
  const userId = useBoundStore((state) => state.userId);
  const token = useBoundStore((state) => state.token);
  const logOut = useBoundStore((state) => state.logOut);
  const setForceDemoOnboarding = useBoundStore((state) => state.setForceDemoOnboarding);
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState<OnboardingDraft>(() => loadOnboardingDraft('demo'));
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const [pendingDiagnosticOptionId, setPendingDiagnosticOptionId] = useState<string | null>(null);
  const [diagnosticTransition, setDiagnosticTransition] = useState<OnboardingTransition | null>(null);
  const questionStartedAtRef = useRef<number>(0);
  const diagnosticPrefetchRef = useRef<{
    key: string;
    promise: Promise<DiagnosticSessionState | null>;
  } | null>(null);
  const demoMode = isDemoMode();

  useEffect(() => {
    if (hydrated) return;
    const persistApi = useBoundStore.persist;
    if (!persistApi) {
      const fallbackReadyId = window.setTimeout(() => setHydrated(true), 0);
      return () => window.clearTimeout(fallbackReadyId);
    }
    if (persistApi.hasHydrated()) {
      const readyCheckId = window.setTimeout(() => setHydrated(true), 0);
      return () => window.clearTimeout(readyCheckId);
    }
    return persistApi.onFinishHydration(() => {
      window.setTimeout(() => setHydrated(true), 0);
    });
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    queueMicrotask(() => {
      setDraft((current) => {
        const loaded = loadOnboardingDraft(userId || 'demo');
        return loaded.currentStep ||
          loaded.weeklyPracticeMinutes ||
          loaded.learningGoal ||
          loaded.strengthConceptIds.length ||
          loaded.weaknessConceptIds.length ||
          loaded.diagnosticAnswers.length
          ? loaded
          : current;
      });
    });
  }, [hydrated, userId]);

  useEffect(() => {
    if (!hydrated) return;
    saveOnboardingDraft(userId || 'demo', draft);
  }, [draft, hydrated, userId]);

  const step = clampStep(draft.currentStep);
  const summary = draft.diagnosticSummary ?? buildLocalSummary(draft);
  const canContinue = validateStep(step, draft);
  const usesLocalDemoAuth = demoMode && isDemoAuthToken(token);
  const hasRealAuthSession = loggedIn && Boolean(userId) && isJwtToken(token) && !isJwtExpired(token) && !isDemoAuthToken(token);
  const activeQuestion = step === diagnosticStep ? draft.currentQuestion : null;
  const activeAnswer = activeQuestion
    ? draft.diagnosticAnswers.find((answer) => answer.questionId === activeQuestion.id)
    : null;
  const diagnosticTargetCount = draft.targetQuestionCount ?? defaultDiagnosticQuestions;

  const prefetchDiagnostic = useCallback((sourceDraft: OnboardingDraft) => {
    const payload = toContextPayload(sourceDraft);
    if (!payload) return;
    if (!hasRealAuthSession || usesLocalDemoAuth) {
      return;
    }

    const key = makeDiagnosticPrefetchKey(payload);
    if (diagnosticPrefetchRef.current?.key === key) return;

    const promise = startOnboardingDiagnostic(payload, token).catch(() => null);
    promise.then((response) => {
      if (!response && diagnosticPrefetchRef.current?.key === key) {
        diagnosticPrefetchRef.current = null;
      }
    });

    diagnosticPrefetchRef.current = { key, promise };
  }, [hasRealAuthSession, token, usesLocalDemoAuth]);

  useEffect(() => {
    if (!activeQuestion?.id) return;
    questionStartedAtRef.current = performance.now();
  }, [activeQuestion?.id]);

  useEffect(() => {
    if (!hydrated || step >= diagnosticStep || draft.diagnosticSessionId) return;
    if (!draft.weeklyPracticeMinutes || !draft.learningGoal) return;
    prefetchDiagnostic(draft);
  }, [
    draft,
    hydrated,
    prefetchDiagnostic,
    step,
  ]);

  useEffect(() => {
    if (!hydrated || hasRealAuthSession) return;
    logOut();
    router.replace('/login');
  }, [hasRealAuthSession, hydrated, logOut, router]);

  if (hydrated && !hasRealAuthSession) {
    return (
      <main className="grid h-[100dvh] place-items-center bg-warm-cream px-6 text-on-background font-be-vietnam-pro">
        <div className="rounded-2xl border border-primary-green/15 bg-white px-5 py-4 text-center shadow-sm">
          <p className="text-control-label font-black text-neutral-900">Đang mở trang đăng nhập...</p>
          <p className="mt-1 text-node-label font-semibold text-neutral-500">Bạn cần tài khoản Mentora để thiết lập lộ trình học.</p>
        </div>
      </main>
    );
  }

  const updateDraft = (patch: Partial<OnboardingDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const applyDiagnosticSession = (response: DiagnosticSessionState) => {
    setDiagnosticTransition(null);
    setDraft((current) => ({
      ...current,
      currentStep: diagnosticStep,
      diagnosticSessionId: response.session_id,
      currentQuestion: response.current_question,
      pendingQuestion: null,
      diagnosticSummary: response.summary ?? null,
      lastFeedback: null,
      diagnosticAnswers: [],
    }));
  };

  const startDiagnostic = async (sourceDraft = draft) => {
    const payload = toContextPayload(sourceDraft);
    if (!payload) return;
    if (!hasRealAuthSession || usesLocalDemoAuth) {
      setSubmitState('offline');
      setSubmitMessage('Bạn cần đăng nhập để lấy câu hỏi diagnostic từ question bank.');
      return;
    }
    setSubmitState('starting');
    setSubmitMessage('');
    try {
      const key = makeDiagnosticPrefetchKey(payload);
      const prefetched = diagnosticPrefetchRef.current?.key === key
        ? await diagnosticPrefetchRef.current.promise
        : null;
      if (diagnosticPrefetchRef.current?.key === key) {
        diagnosticPrefetchRef.current = null;
      }
      const response = prefetched ?? await startOnboardingDiagnostic(payload, token);
      applyDiagnosticSession(response);
      setSubmitState('idle');
    } catch (error) {
      const apiError = error instanceof OnboardingApiError ? error : null;
      setSubmitState(apiError?.type === 'invalid' ? 'invalid' : 'offline');
      setSubmitMessage(apiError?.message || 'Chưa lấy được câu hỏi diagnostic từ question bank.');
    }
  };

  const selectWeeklyTime = (optionId: WeeklyPracticeMinutes) => {
    const nextDraft = {
      ...draft,
      weeklyPracticeMinutes: optionId,
      currentStep: 1,
    };
    setDraft(nextDraft);
    if (nextDraft.learningGoal) prefetchDiagnostic(nextDraft);
  };

  const selectLearningGoal = async (optionId: LearningGoal) => {
    if (submitState === 'starting') return;
    const nextDraft = {
      ...draft,
      targetQuestionCount: draft.targetQuestionCount ?? defaultDiagnosticQuestions,
      learningGoal: optionId,
      currentStep: 2,
    };
    setDraft(nextDraft);
    prefetchDiagnostic(nextDraft);
  };

  const selectDiagnosticCount = async (optionId: DiagnosticQuestionCount) => {
    if (submitState === 'starting') return;
    const nextDraft = {
      ...draft,
      targetQuestionCount: optionId,
      currentStep: 2,
    };
    setDraft(nextDraft);
    prefetchDiagnostic(nextDraft);
  };

  const answerQuestion = async (optionId: string, eventTimeStamp: number) => {
    if (!activeQuestion || !draft.diagnosticSessionId || submitState === 'answering' || activeAnswer) return;
    setPendingDiagnosticOptionId(optionId);
    setSubmitState('answering');
    setSubmitMessage('');
    try {
      const targetCount = draft.targetQuestionCount ?? defaultDiagnosticQuestions;
      const response = await answerOnboardingDiagnostic(
        {
          session_id: draft.diagnosticSessionId,
          question_id: activeQuestion.id,
          selected_option_id: optionId,
          response_time_ms: Math.max(0, Math.round(eventTimeStamp - questionStartedAtRef.current)),
        },
        token,
      );
      const nextAnswers = [
        ...draft.diagnosticAnswers.filter((answer) => answer.questionId !== activeQuestion.id),
        {
          questionId: activeQuestion.id,
          conceptId: activeQuestion.concept_id,
          selectedOptionId: optionId,
          prompt: activeQuestion.prompt,
          options: activeQuestion.options,
          correct: response.feedback.correct,
          feedbackMessage: response.feedback.message,
          explanation: response.feedback.explanation,
          bloomLevel: activeQuestion.bloom_level,
          difficultyElo: activeQuestion.difficulty_elo,
        },
      ];
      const diagnosticTargetComplete = nextAnswers.length >= targetCount || !response.current_question;
      const nextTransition = diagnosticTargetComplete
        ? null
        : buildDiagnosticTransition(activeQuestion, response.current_question);
      const nextDraft = {
        ...draft,
        currentStep: diagnosticTargetComplete ? resultStep : diagnosticStep,
        currentQuestion: diagnosticTargetComplete ? draft.currentQuestion : response.current_question,
        pendingQuestion: diagnosticTargetComplete ? response.current_question : null,
        diagnosticSummary: response.summary ?? draft.diagnosticSummary ?? null,
        lastFeedback: diagnosticTargetComplete ? response.feedback : null,
        diagnosticAnswers: nextAnswers,
      };

      setDraft(nextDraft);
      setDiagnosticTransition(nextTransition);
      setPendingDiagnosticOptionId(null);
      if (diagnosticTargetComplete) {
        setSubmitState('idle');
        return;
      }
      setSubmitState('idle');
    } catch (error) {
      const apiError = error instanceof OnboardingApiError ? error : null;
      setSubmitState(apiError?.type === 'invalid' ? 'invalid' : 'offline');
      setSubmitMessage(apiError?.message || 'Chưa gửi được câu trả lời diagnostic.');
      setPendingDiagnosticOptionId(null);
    }
  };

  const goBack = () => {
    updateDraft({ currentStep: clampStep(step - 1) });
    setSubmitState('idle');
    setSubmitMessage('');
    setPendingDiagnosticOptionId(null);
    setDiagnosticTransition(null);
  };

  const goNext = async () => {
    if (!canContinue) return;
    if (step === 1) {
      updateDraft({ currentStep: 2 });
      return;
    }
    if (step === 2) {
      await startDiagnostic();
      return;
    }
    if (activeQuestion && draft.diagnosticAnswers.length >= (draft.targetQuestionCount ?? defaultDiagnosticQuestions)) {
      updateDraft({ currentStep: resultStep });
      return;
    }
    if (activeQuestion && draft.pendingQuestion) {
      updateDraft({ currentQuestion: draft.pendingQuestion, pendingQuestion: null, lastFeedback: null });
      setPendingDiagnosticOptionId(null);
      setDiagnosticTransition(null);
      return;
    }
    updateDraft({ currentStep: clampStep(step + 1) });
  };

  const continueDiagnostic = () => {
    if (draft.diagnosticAnswers.length >= (draft.targetQuestionCount ?? defaultDiagnosticQuestions) || !draft.pendingQuestion) return;
    updateDraft({ currentStep: diagnosticStep, currentQuestion: draft.pendingQuestion, pendingQuestion: null, lastFeedback: null });
    setSubmitState('idle');
    setSubmitMessage('');
    setPendingDiagnosticOptionId(null);
    setDiagnosticTransition(null);
  };

  const restart = () => {
    const cleanDraft = { ...EMPTY_ONBOARDING_DRAFT };
    diagnosticPrefetchRef.current = null;
    clearOnboardingDraft(userId || 'demo');
    setDraft(cleanDraft);
    setSubmitState('idle');
    setSubmitMessage('');
    setPendingDiagnosticOptionId(null);
    setDiagnosticTransition(null);
  };

  const finishLocally = (sourceDraft = draft) => {
    if (!demoMode) return;
    const sourceSummary = buildLocalSummary(sourceDraft);
    if (userId) {
      markOnboardingPending(userId, sourceSummary, submitMessage || 'Chưa lưu được hồ sơ học tập.');
      markFirstRunPending(userId, sourceSummary);
    }
    if (submitState === 'offline' && loggedIn) {
      saveOnboardingDraft(userId || 'demo', { ...sourceDraft, syncPending: true });
    } else {
      clearOnboardingDraft(userId || 'demo');
    }
    diagnosticsLog('info', 'navigation.app', {
      from: '/onboarding',
      to: '/app',
      reason: 'onboarding_finish_local',
      answers: sourceDraft.diagnosticAnswers.length,
      syncPending: submitState === 'offline' && loggedIn,
    });
    router.push('/app');
  };

  const submit = async (sourceDraft = draft) => {
    const payload = toSubmitPayload(sourceDraft);
    if (!payload) {
      setSubmitState('invalid');
      setSubmitMessage('Bạn cần hoàn thành 2 câu thiết lập và ít nhất 5 câu diagnostic trước khi vào app.');
      return;
    }

    if (!hasRealAuthSession || usesLocalDemoAuth) {
      if (!demoMode) {
        setSubmitState('offline');
        setSubmitMessage('Bạn cần đăng nhập lại để lưu hồ sơ học tập lên tài khoản.');
        return;
      }
      finishLocally(sourceDraft);
      return;
    }

    setSubmitState('submitting');
    setSubmitMessage('');
    try {
      const response = await completeOnboarding(payload, token);
      if (userId) {
        markOnboardingComplete(userId, response.summary);
        markFirstRunPending(userId, response.summary);
      }
      clearOnboardingDraft(userId || 'demo');
      setForceDemoOnboarding(false);
      setSubmitState('done');
      diagnosticsLog('info', 'navigation.app', {
        from: '/onboarding',
        to: '/app',
        reason: 'onboarding_submit_success',
        answers: sourceDraft.diagnosticAnswers.length,
      });
      router.push('/app');
    } catch (error) {
      const apiError = error instanceof OnboardingApiError ? error : null;
      const nextDraft = { ...sourceDraft, syncPending: true };
      setDraft(nextDraft);
      saveOnboardingDraft(userId || 'demo', nextDraft);
      setSubmitState(apiError?.type === 'invalid' ? 'invalid' : 'offline');
      setSubmitMessage(
        apiError?.type === 'invalid'
          ? apiError.message
          : demoMode
            ? 'Chưa lưu được hồ sơ học tập. Bản nháp đã được lưu trên thiết bị này; bạn có thể thử lại hoặc vào app trước với dữ liệu mẫu.'
            : 'Chưa lưu được hồ sơ học tập. Bản nháp đã được lưu trên thiết bị này; vui lòng thử lưu lại khi kết nối ổn định.',
      );
    }
  };

  return (
    <main className="flex h-[100dvh] flex-col overflow-hidden bg-warm-cream text-on-background font-be-vietnam-pro">
      <StepHeader step={step} />

      <section className="flex min-h-0 flex-1 overflow-y-auto px-3 py-3 md:px-6 md:py-4">
        <div className="mx-auto my-auto w-full max-w-[1240px]">
          <div className="rounded-[1.4rem] border border-primary-green/15 border-b-[5px] bg-[#fbfff4] p-4 shadow-[0_16px_36px_rgba(70,163,2,0.1)] md:p-5">
            {!hydrated ? (
              <MascotLoadingBlock
                title="Sofi đang mở onboarding..."
                description="Đang khôi phục tiến trình thiết lập của bạn"
                className="border-[#e8dec5] border-b-[4px] bg-[#fffdf7] py-10"
                mascotClassName="scale-[0.78]"
              />
            ) : (
              <>
                {step === 0 ? (
                  <OnboardingStepLayout
                    insight={{
                      eyebrow: 'Nhịp học',
                      title: 'Đặt nhịp vừa đủ để không bỏ cuộc giữa chừng.',
                      body: 'Mentora dùng thời lượng này để giới hạn số bài luyện mỗi tuần, nhịp nhắc học và độ dài phiên Socratic tutor.',
                      stats: ['Ước lượng tải học', 'Giữ streak thực tế', 'Cân bằng quiz và lab'],
                    }}
                  >
                    <StepBlock
                      eyebrow="Thiết lập 1 / 2"
                      title="Bạn có thể luyện tập bao lâu mỗi tuần?"
                      subtitle="Chọn một mức thực tế để hệ thống đặt nhịp học phù hợp."
                    >
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {WEEKLY_TIME_OPTIONS.map((option, index) => (
                          <OptionButton
                            key={option.id}
                            active={draft.weeklyPracticeMinutes === option.id}
                            title={option.label}
                            detail={option.detail}
                            marker={String(index + 1)}
                            onClick={() => selectWeeklyTime(option.id)}
                          />
                        ))}
                      </div>
                    </StepBlock>
                  </OnboardingStepLayout>
                ) : null}

                {step === 1 ? (
                  <OnboardingStepLayout
                    insight={{
                      eyebrow: 'Ưu tiên',
                      title: 'Cùng một điểm yếu nhưng lộ trình sẽ khác theo mục tiêu.',
                      body: 'Người học lab cần nhiều debug scenario hơn; người ôn nền tảng cần ví dụ ngắn và kiểm tra concept trước.',
                      stats: ['Chọn concept ưu tiên', 'Điều chỉnh gợi ý', 'Tối ưu bài luyện sau diagnostic'],
                    }}
                  >
                    <StepBlock eyebrow="Thiết lập 2 / 2" title="Mục tiêu chính của bạn là gì?" subtitle="Mục tiêu này giúp ưu tiên vùng kiến thức sau diagnostic.">
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {GOAL_OPTIONS.map((option, index) => (
                          <OptionButton
                            key={option.id}
                            active={draft.learningGoal === option.id}
                            title={option.label}
                            detail={option.detail}
                            marker={String(index + 1)}
                            disabled={submitState === 'starting'}
                            onClick={() => selectLearningGoal(option.id)}
                          />
                        ))}
                      </div>
                      {submitMessage ? (
                        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-control-label font-bold text-red-700">
                          {submitMessage}
                        </div>
                      ) : null}
                    </StepBlock>
                  </OnboardingStepLayout>
                ) : null}

                {step === 2 ? (
                  <OnboardingStepLayout>
                    <StepBlock
                      eyebrow="Diagnostic"
                      title="Bạn muốn bắt đầu nhanh hay chẩn đoán kỹ hơn?"
                      subtitle="Chọn độ dài phù hợp với thời gian của bạn. Bộ 15 câu thường là lựa chọn cân bằng nhất để vào học mà vẫn đủ dữ liệu cá nhân hóa."
                    >
                      <div className="grid gap-2.5 md:grid-cols-3">
                        {DIAGNOSTIC_COUNT_OPTIONS.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => selectDiagnosticCount(option.id)}
                            className={`relative flex min-h-[7.5rem] cursor-pointer flex-col rounded-2xl border-2 bg-white p-3 text-left transition active:translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-primary-green/20 sm:min-h-[9.5rem] sm:p-4 md:min-h-[11rem] ${
                              draft.targetQuestionCount === option.id
                                ? 'border-primary-green border-b-[5px] shadow-[0_12px_26px_rgba(88,204,2,0.14)]'
                                : 'border-gray-border border-b-[5px] hover:border-primary-green/45'
                            } ${option.recommended ? 'ring-2 ring-primary-green/20' : ''}`}
                          >
                            <span className="flex min-h-5 items-center justify-between gap-2">
                              <span className="text-label-tight font-black uppercase text-primary-green-dark">
                                {option.id === 8 ? 'Nhanh' : option.id === 15 ? 'Cân bằng' : 'Kỹ hơn'}
                              </span>
                              {option.recommended ? (
                                <span className="rounded-full border border-primary-green/20 bg-primary-green-light px-2 py-0.5 text-caption-tight font-black uppercase text-primary-green-dark">
                                  Phổ biến
                                </span>
                              ) : null}
                            </span>
                            <span className="mt-1.5 font-fraunces text-question-title-sm font-black leading-none text-on-background">
                              {option.label}
                            </span>
                            <span className="mt-2 text-control-label font-black leading-5 text-neutral-800">{option.detail}</span>
                            <span className={`mt-1.5 text-node-label font-semibold leading-5 text-neutral-500 ${
                              draft.targetQuestionCount === option.id ? 'block' : 'hidden sm:block'
                            }`}>{option.note}</span>
                            <span className="mt-auto pt-2.5 text-label-tight font-black uppercase text-primary-green-dark">
                              {draft.targetQuestionCount === option.id ? 'Đang chọn' : 'Chọn bộ này'}
                            </span>
                          </button>
                        ))}
                      </div>
                      {submitMessage ? (
                        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-control-label font-bold text-red-700">
                          {submitMessage}
                        </div>
                      ) : null}
                    </StepBlock>
                  </OnboardingStepLayout>
                ) : null}

                {activeQuestion ? (
                  <StepBlock
                    eyebrow={`Diagnostic ${Math.min(draft.diagnosticAnswers.length + (activeAnswer ? 0 : 1), diagnosticTargetCount)} / ${diagnosticTargetCount}`}
                    title={activeQuestion.prompt}
                    subtitle="Chọn đáp án đúng nhất theo hiểu biết hiện tại của bạn."
                  >
                    <OnboardingTransitionOverlay
                      transition={diagnosticTransition}
                      onDismiss={() => setDiagnosticTransition(null)}
                    />
                    <DiagnosticQuestionMeta question={activeQuestion} />
                    <div className="grid gap-2.5 md:grid-cols-2">
                      {activeQuestion.options.map((option) => (
                        <OptionButton
                          key={option.id}
                          active={activeAnswer?.selectedOptionId === option.id || pendingDiagnosticOptionId === option.id}
                          title={option.label}
                          marker={option.id}
                          disabled={Boolean(activeAnswer) || submitState === 'answering'}
                          onClick={(event) => answerQuestion(option.id, event.timeStamp)}
                        />
                      ))}
                    </div>
                    {activeAnswer && draft.lastFeedback ? (
                      <div className={`mt-4 rounded-xl border-2 border-b-4 p-3 text-control-label font-bold ${
                        draft.lastFeedback.correct
                          ? 'border-primary-green/40 border-b-primary-green bg-lime-50 text-primary-green-dark'
                          : 'border-primary-blue/30 border-b-primary-blue bg-primary-blue-light/60 text-primary-blue-dark'
                      }`}>
                        {draft.lastFeedback.message}
                      </div>
                    ) : null}
                    {submitMessage ? (
                      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-control-label font-bold text-red-700">
                        {submitMessage}
                      </div>
                    ) : null}
                  </StepBlock>
                ) : null}

                {step === resultStep ? (
                    <StepBlock eyebrow="Kết quả ban đầu" title="Hồ sơ năng lực đầu tiên đã sẵn sàng" subtitle="Hồ sơ này sẽ seed điểm Elo và BKT P(L) ban đầu cho các kỹ năng liên quan.">
                    <div className="grid gap-3 sm:grid-cols-4">
                      <SummaryTile icon={<CheckCircle2 className="h-5 w-5" />} label="Mạnh nhất" value={conceptLabel(summary.strongest_concepts[0])} />
                      <SummaryTile icon={<Target className="h-5 w-5" />} label="Cần ưu tiên" value={conceptLabel(summary.recommended_concept_id)} />
                      <SummaryTile icon={<Clock className="h-5 w-5" />} label="Nhịp tuần" value={`${summary.weekly_practice_minutes} phút`} />
                      <SummaryTile icon={<ListTodo className="h-5 w-5" />} label="Độ tin cậy" value={summary.confidence === 'high' ? 'Cao' : summary.confidence === 'medium' ? 'Vừa' : 'Thấp'} />
                    </div>
                    <div className="mt-4 rounded-xl border border-lime-100 bg-lime-50 p-4">
                      <p className="text-control-label font-black text-primary-green-dark">Bước tiếp theo</p>
                      <p className="mt-1 text-control-label font-semibold leading-relaxed text-neutral-700">
                        Bắt đầu với <span className="font-black">{conceptLabel(summary.recommended_concept_id)}</span>, sau đó hệ thống sẽ gợi ý bài luyện phù hợp với nhịp {summary.weekly_practice_minutes} phút mỗi tuần.
                      </p>
                      <p className="mt-2 text-node-label font-semibold leading-5 text-neutral-600">
                        Hồ sơ này dựa trên {summary.diagnostic_total}/{summary.target_question_count ?? draft.targetQuestionCount ?? defaultDiagnosticQuestions} câu diagnostic. Càng nhiều câu, hệ thống càng có thêm tín hiệu để phân biệt điểm yếu thật với một lần chọn nhầm.
                      </p>
                    </div>
                    <MasteryJudgmentExplanation summary={summary} />
                    <MasterySeedReport summary={summary} />
                    <DiagnosticReviewList answers={draft.diagnosticAnswers} />
                    {draft.diagnosticAnswers.length < (draft.targetQuestionCount ?? defaultDiagnosticQuestions) && draft.pendingQuestion ? (
                      <button
                        type="button"
                        onClick={continueDiagnostic}
                        className="mt-4 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border-2 border-primary-blue border-b-primary-blue-dark bg-primary-blue-light px-4 py-2 text-control-label font-black text-primary-blue-dark transition active:translate-y-1 active:border-b-2"
                      >
                        Làm thêm {(draft.targetQuestionCount ?? defaultDiagnosticQuestions) - draft.diagnosticAnswers.length} câu để hồ sơ chính xác hơn
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </button>
                    ) : null}
                    {submitMessage ? (
                      <div className={`mt-4 flex gap-2.5 rounded-xl border p-3 text-control-label font-bold ${
                        submitState === 'offline'
                          ? 'border-primary-blue/25 bg-primary-blue-light/60 text-primary-blue-dark'
                          : 'border-red-200 bg-red-50 text-red-700'
                      }`}>
                        {submitState === 'offline' ? <WifiOff className="h-5 w-5 shrink-0" /> : null}
                        <span>{submitMessage}</span>
                      </div>
                    ) : null}
                  </StepBlock>
                ) : null}
              </>
            )}
          </div>
        </div>
      </section>

      <footer className="shrink-0 border-t border-stone-100 bg-white/95 px-4 py-2.5 backdrop-blur md:px-6">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0 || submitState === 'submitting'}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-control-label font-black text-neutral-700 transition hover:border-primary-green/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Quay lại
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={restart}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-control-label font-black text-neutral-700 transition hover:border-primary-green/50"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Làm lại
            </button>
            {demoMode && step === resultStep && submitState === 'offline' ? (
              <button
                type="button"
                onClick={() => finishLocally()}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-primary-blue-dark bg-primary-blue px-4 py-2 text-control-label font-black text-white shadow-soft transition hover:-translate-y-0.5"
              >
                Vào app trước
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={step === resultStep ? () => submit() : goNext}
              disabled={!canContinue || submitState === 'submitting' || submitState === 'starting' || submitState === 'answering'}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary-green px-4 py-2 text-control-label font-black text-white shadow-soft transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              {step === resultStep
                ? submitState === 'submitting'
                  ? 'Đang lưu...'
                  : 'Bắt đầu học'
                : submitState === 'starting'
                  ? 'Đang lấy câu hỏi...'
                  : submitState === 'answering'
                    ? 'Đang chấm...'
                    : activeQuestion && draft.diagnosticAnswers.length + 1 >= diagnosticTargetCount
                      ? 'Xem kết quả'
                      : 'Tiếp tục'}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}

function StepBlock({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="relative h-full min-h-[320px] rounded-2xl border border-[#e8dec5] border-b-[4px] bg-[#fffdf7] p-4 shadow-sm sm:p-5 lg:min-h-[360px]">
      <div className="pointer-events-none absolute left-0 top-8 hidden -translate-x-1/2 flex-col gap-7 sm:flex">
        <span className="h-4 w-4 rounded-full border border-primary-green/25 bg-[#f4fce8] shadow-sm" />
        <span className="h-4 w-4 rounded-full border border-primary-green/25 bg-[#f4fce8] shadow-sm" />
        <span className="h-4 w-4 rounded-full border border-primary-green/25 bg-[#f4fce8] shadow-sm" />
      </div>
      <div className="flex items-start justify-between gap-3">
        <p className="w-fit rounded-full bg-primary-green/10 px-2.5 py-1 text-label-tight font-black uppercase tracking-normal text-primary-green-dark">{eyebrow}</p>
      </div>
      <h1 className="mt-3 max-w-[820px] font-fraunces text-question-title-sm font-black leading-[1.25] tracking-normal text-on-background lg:text-question-title-lg">{title}</h1>
      <p className="mt-2 max-w-4xl text-control-label font-semibold leading-relaxed text-neutral-500">{subtitle}</p>
      {eyebrow.toLowerCase().startsWith('diagnostic') ? <DiagnosticTip /> : null}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function DiagnosticQuestionMeta({ question }: { question: DiagnosticSessionState['current_question'] }) {
  if (!question) return null;
  const difficulty = diagnosticDifficultyBand(question.difficulty_elo);
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <CompactMetaChip icon={<BookOpen className="h-3.5 w-3.5" />} label={conceptLabel(question.concept_id)} />
      <CompactMetaChip icon={<Gauge className="h-3.5 w-3.5" />} label={difficulty.label} tone="green" />
      <CompactMetaChip icon={<Route className="h-3.5 w-3.5" />} label={question.bloom_level} />
      <CompactMetaChip icon={<Target className="h-3.5 w-3.5" />} label={`${Math.round(question.difficulty_elo)} Elo`} />
    </div>
  );
}

function CompactMetaChip({
  icon,
  label,
  tone = 'neutral',
}: {
  icon: ReactNode;
  label: string;
  tone?: 'neutral' | 'green';
}) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-xl border px-2.5 py-1 text-caption-tight font-black ${
        tone === 'green'
          ? 'border-primary-green/20 bg-primary-green-light/70 text-primary-green-dark'
          : 'border-stone-200 bg-white text-stone-600'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </span>
  );
}

function OnboardingTransitionOverlay({
  transition,
  onDismiss,
}: {
  transition: OnboardingTransition | null;
  onDismiss: () => void;
}) {
  return (
    <AnimatePresence>
      {transition ? (
        <motion.div
          key={transition.key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-30 grid place-items-center rounded-2xl bg-[#fffdf7]/95 px-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.96, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.98, y: -8 }}
            transition={{ type: 'spring', damping: 18, stiffness: 170 }}
            className="w-full max-w-sm rounded-2xl border border-primary-green/25 border-b-[5px] bg-white p-5 text-center shadow-[0_24px_70px_rgba(70,163,2,0.18)]"
          >
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-primary-green/25 bg-primary-green-light text-primary-green-dark">
              {transition.type === 'difficulty' ? (
                <ArrowUpRight className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Route className="h-6 w-6" aria-hidden="true" />
              )}
            </div>
            <p className="mt-4 text-label-tight font-black uppercase text-primary-green-dark">{transition.eyebrow}</p>
            <h2 className="mt-2 font-fraunces text-question-title-sm font-black leading-tight text-on-background">
              {transition.title}
            </h2>
            <p className="mt-2 text-control-label font-semibold leading-relaxed text-stone-600">{transition.body}</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-primary-green-light">
              <motion.div
                className="h-full rounded-full bg-primary-green"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.25, ease: 'easeOut' }}
              />
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="mt-4 inline-flex min-h-10 cursor-pointer items-center justify-center rounded-xl border border-stone-200 bg-white px-4 text-label-tight font-black uppercase text-on-background shadow-sm transition hover:bg-stone-50"
            >
              Tiếp tục
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function OnboardingStepLayout({
  children,
  insight,
}: {
  children: ReactNode;
  insight?: {
    eyebrow: string;
    title: string;
    body: string;
    stats: string[];
  };
}) {
  return (
    <div className={`grid items-stretch gap-4 ${insight ? 'lg:grid-cols-[minmax(0,1fr)_320px]' : ''}`}>
      {children}
      {insight ? (
        <aside className="hidden min-h-[360px] flex-col justify-between rounded-2xl border border-primary-green/15 border-b-[4px] bg-white p-5 shadow-sm lg:flex">
          <div>
            <p className="text-label-tight font-black uppercase text-primary-green-dark">{insight.eyebrow}</p>
            <h2 className="mt-3 font-fraunces text-question-title-sm font-black leading-tight text-on-background">
              {insight.title}
            </h2>
            <p className="mt-3 text-control-label font-semibold leading-6 text-stone-600">
              {insight.body}
            </p>
          </div>
          <div className="mt-5 space-y-2">
            {insight.stats.map((item) => (
              <div key={item} className="rounded-xl border border-primary-green/10 bg-primary-green-light/35 px-3 py-2 text-node-label font-black text-primary-green-dark">
                {item}
              </div>
            ))}
          </div>
        </aside>
      ) : null}
    </div>
  );
}

function DiagnosticTip() {
  return (
    <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-primary-blue/20 bg-primary-blue-light/45 px-3 py-2.5 text-primary-blue-dark">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-primary-blue/25 bg-white">
        <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-caption-tight font-black uppercase">Trả lời theo năng lực hiện tại</p>
        <p className="mt-1 text-node-label font-semibold leading-relaxed">
          Câu trả lời đầu tiên giúp Mentora chọn bài luyện vừa sức hơn. Không cần cố đạt điểm cao ở bước này.
        </p>
      </div>
    </div>
  );
}

function SummaryTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-stone-100 bg-stone-50 p-3">
      <div className="flex items-center gap-2 text-primary-green">{icon}</div>
      <p className="mt-2 text-node-label font-black uppercase tracking-normal text-neutral-400">{label}</p>
      <p className="mt-1 text-control-label font-black leading-tight text-neutral-900">{value}</p>
    </div>
  );
}

function DiagnosticReviewList({ answers }: { answers: OnboardingDraft['diagnosticAnswers'] }) {
  if (!answers.length) return null;
  const correctCount = answers.filter((answer) => answer.correct).length;

  return (
    <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-control-label font-black text-on-background">Review câu diagnostic</p>
          <p className="mt-1 text-node-label font-semibold leading-relaxed text-stone-600">
            Xem lại câu đã làm, lựa chọn của bạn và tín hiệu đúng/sai dùng để seed hồ sơ ban đầu.
          </p>
        </div>
        <span className="rounded-full bg-primary-green/10 px-2.5 py-1 text-label-tight font-black text-primary-green-dark">
          {correctCount}/{answers.length} đúng
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {answers.map((answer, index) => {
          const selectedLabel = answer.options?.find((option) => option.id === answer.selectedOptionId)?.label;
          return (
            <details key={`${answer.questionId}-${index}`} className="rounded-xl border border-stone-200 bg-warm-cream px-3 py-2.5">
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-node-label font-black uppercase text-stone-400">Câu {index + 1} · {conceptLabel(answer.conceptId)}</p>
                    <p className="mt-1 line-clamp-2 text-control-label font-black leading-5 text-on-background">
                      {answer.prompt || 'Câu hỏi diagnostic'}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-label-tight font-black ${
                    answer.correct
                      ? 'bg-primary-green/10 text-primary-green-dark'
                      : 'bg-error-red/10 text-error-red'
                  }`}>
                    {answer.correct ? 'Đúng' : 'Chưa đúng'}
                  </span>
                </div>
              </summary>
              <div className="mt-3 border-t border-stone-200 pt-3 text-node-label font-semibold leading-5 text-stone-600">
                <p><span className="font-black text-on-background">Bạn chọn:</span> {selectedLabel || answer.selectedOptionId}</p>
                {answer.feedbackMessage ? (
                  <p className="mt-1"><span className="font-black text-on-background">Phản hồi:</span> {answer.feedbackMessage}</p>
                ) : null}
                {answer.explanation ? (
                  <p className="mt-1"><span className="font-black text-on-background">Giải thích:</span> {answer.explanation}</p>
                ) : null}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}

function formatSignedNumber(value: number, unit = '') {
  const rounded = Math.round(value);
  if (rounded === 0) return `0${unit}`;
  return `${rounded > 0 ? '+' : ''}${rounded}${unit}`;
}

function formatMasteryPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function masteryStateLabel(state: string) {
  if (state === 'mastered') return 'Đã vững';
  if (state === 'learning') return 'Đang học';
  if (state === 'weak') return 'Cần ưu tiên';
  return 'Mới bắt đầu';
}

function confidenceLabel(confidence: ReturnType<typeof buildLocalSummary>['confidence']) {
  if (confidence === 'high') return 'Cao';
  if (confidence === 'medium') return 'Vừa';
  return 'Thấp';
}

function MasteryJudgmentExplanation({ summary }: { summary: ReturnType<typeof buildLocalSummary> }) {
  const targetCount = summary.target_question_count ?? defaultDiagnosticQuestions;
  const correctRatio = summary.diagnostic_total > 0
    ? Math.round((summary.diagnostic_correct / summary.diagnostic_total) * 100)
    : 0;
  const seededEvidenceCount = (summary.seeded_concepts || []).reduce((total, concept) => total + concept.evidence_count, 0);
  const priorityConcept = conceptLabel(summary.recommended_concept_id);
  const strongestConcept = conceptLabel(summary.strongest_concepts[0]);
  const weakestConcept = conceptLabel(summary.weakest_concepts[0] ?? summary.recommended_concept_id);
  const confidenceCopy = summary.confidence === 'high'
    ? 'đủ tín hiệu để bắt đầu cá nhân hóa ngay'
    : summary.confidence === 'medium'
      ? 'đủ dùng cho lộ trình ban đầu, nên luyện thêm để tinh chỉnh'
      : 'mới là ước lượng thô, hệ thống sẽ cập nhật mạnh sau vài bài luyện đầu';

  const reasons = [
    {
      label: 'Tỷ lệ trả lời',
      value: `${summary.diagnostic_correct}/${summary.diagnostic_total} đúng`,
      detail: `Tương đương ${correctRatio}% trên bộ ${targetCount} câu bạn chọn.`,
    },
    {
      label: 'Concept ưu tiên',
      value: priorityConcept,
      detail: weakestConcept === priorityConcept
        ? 'Concept này có tín hiệu yếu nhất hoặc được hệ thống đánh dấu cần luyện trước.'
        : `Hệ thống ưu tiên ${priorityConcept} sau khi so với nhóm yếu ${weakestConcept}.`,
    },
    {
      label: 'Độ tin cậy',
      value: confidenceLabel(summary.confidence),
      detail: `Mức này ${confidenceCopy}.`,
    },
  ];

  return (
    <div className="mt-4 rounded-2xl border border-primary-blue/15 bg-primary-blue-light/35 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-control-label font-black text-on-background">Vì sao hệ thống phán đoán như vậy?</p>
          <p className="mt-1 max-w-2xl text-node-label font-semibold leading-relaxed text-stone-600">
            Mentora kết hợp đúng/sai, độ khó câu hỏi, concept liên quan và số tín hiệu thu được để seed hồ sơ ban đầu. Đây là điểm xuất phát, không phải kết luận cố định.
          </p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-label-tight font-black text-primary-blue-dark">
          {seededEvidenceCount || summary.diagnostic_total} tín hiệu
        </span>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {reasons.map((reason) => (
          <div key={reason.label} className="rounded-xl border border-white/80 bg-white/80 px-3 py-2.5">
            <p className="text-caption-tight font-black uppercase text-primary-blue-dark">{reason.label}</p>
            <p className="mt-1 text-control-label font-black leading-tight text-on-background">{reason.value}</p>
            <p className="mt-1 text-label-tight font-semibold leading-4 text-stone-600">{reason.detail}</p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-node-label font-semibold leading-5 text-primary-blue-dark">
        Điểm mạnh tạm thời: <span className="font-black">{strongestConcept}</span>. Điểm cần kiểm chứng thêm: <span className="font-black">{weakestConcept}</span>.
      </p>
    </div>
  );
}

function MasterySeedReport({ summary }: { summary: ReturnType<typeof buildLocalSummary> }) {
  const seededConcepts = (summary.seeded_concepts || []).slice(0, 4);
  const correctRatio = summary.diagnostic_total > 0
    ? Math.round((summary.diagnostic_correct / summary.diagnostic_total) * 100)
    : 0;

  return (
    <div className="mt-4 rounded-2xl border border-primary-green/15 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-control-label font-black text-on-background">Báo cáo seed mastery</p>
          <p className="mt-1 max-w-2xl text-node-label font-semibold leading-relaxed text-stone-600">
            Mỗi câu diagnostic cập nhật Elo và BKT cho các concept liên quan. Làm đúng câu khó đẩy tín hiệu lên mạnh hơn; làm sai giúp hệ thống đánh dấu vùng cần ưu tiên luyện trước.
          </p>
        </div>
        <span className="rounded-full bg-primary-green/10 px-2.5 py-1 text-label-tight font-black text-primary-green-dark">
          {summary.diagnostic_correct}/{summary.diagnostic_total} đúng · {correctRatio}%
        </span>
      </div>

      {seededConcepts.length ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {seededConcepts.map((concept) => {
            const masteryDelta = concept.bkt_mastery_probability - baselineBkt;
            const eloDelta = concept.elo_score - baselineElo;
            return (
              <div key={concept.concept_id} className="rounded-xl border border-stone-200 bg-warm-cream px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-control-label font-black text-on-background">{conceptLabel(concept.concept_id)}</p>
                    <p className="mt-0.5 text-label-tight font-bold text-stone-500">
                      {masteryStateLabel(concept.mastery_state)} · {concept.evidence_count} tín hiệu
                    </p>
                  </div>
                  {concept.weakness_flag ? (
                    <span className="shrink-0 rounded-full bg-tertiary-yellow/15 px-2 py-0.5 text-caption-tight font-black text-tertiary-yellow-dark">
                      Ưu tiên
                    </span>
                  ) : null}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-label-tight font-bold text-stone-600">
                  <div>
                    <p className="uppercase tracking-wide text-stone-400">Mastery BKT</p>
                    <p className="mt-0.5 text-control-label font-black text-on-background">
                      {formatMasteryPercent(concept.bkt_mastery_probability)}
                      <span className="ml-1 text-label-tight text-primary-green-dark">
                        {formatSignedNumber(masteryDelta * 100, '%')}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="uppercase tracking-wide text-stone-400">Elo seed</p>
                    <p className="mt-0.5 text-control-label font-black text-on-background">
                      {Math.round(concept.elo_score)}
                      <span className="ml-1 text-label-tight text-primary-green-dark">
                        {formatSignedNumber(eloDelta)}
                      </span>
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-label-tight font-semibold leading-4 text-stone-500">
                  {concept.weakness_flag
                    ? 'Hệ thống ưu tiên concept này vì mastery/Elo seed còn thấp so với mốc khởi đầu.'
                    : 'Concept này có tín hiệu ổn hơn, nên chưa cần đặt làm điểm vá đầu tiên.'}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 rounded-xl border border-stone-200 bg-warm-cream px-3 py-2 text-node-label font-semibold leading-relaxed text-stone-600">
          Khi đủ câu diagnostic, báo cáo sẽ hiển thị từng concept được seed mastery, mức BKT ban đầu và Elo khởi tạo.
        </p>
      )}
    </div>
  );
}
