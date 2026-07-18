'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, CheckCircle2, Loader2, X, XCircle } from 'lucide-react';
import type { AdaptiveSubmitResult } from '@/lib/adaptive/api-client';
import type { ActivePracticeSession, Question, QuestionSet } from '@/lib/quiz/types';

type AnswerHistoryBySet = Record<
  string,
  Record<
    string,
    {
      selected?: string;
      essayAnswer?: string;
      isCorrect: boolean;
      hintCount?: number;
      adaptiveDecisionId?: string;
      submitResult?: AdaptiveSubmitResult;
    }
  >
>;

interface AdaptiveAdminDashboardProps {
  activePracticeSession: ActivePracticeSession | null;
  activeSet?: QuestionSet;
  activeSetId: string;
  answersHistory: AnswerHistoryBySet;
  currentQuestion: Question;
  currentQuestionIdx: number;
  isLoadingNextQuestion: boolean;
  questionsList: Question[];
  role?: string;
}

function formatNumber(value?: number | null, digits = 0) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'n/a';
  return value.toLocaleString('vi-VN', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function formatPercent(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'n/a';
  return `${Math.round(value * 100)}%`;
}

function metricDelta(oldValue?: number, newValue?: number, digits = 0) {
  if (typeof oldValue !== 'number' || typeof newValue !== 'number') return 'n/a';
  const delta = newValue - oldValue;
  const rounded = Number(delta.toFixed(digits));
  return `${rounded >= 0 ? '+' : ''}${formatNumber(rounded, digits)}`;
}

export function AdaptiveAdminDashboard({
  activePracticeSession,
  activeSet,
  activeSetId,
  answersHistory,
  currentQuestion,
  currentQuestionIdx,
  isLoadingNextQuestion,
  questionsList,
  role,
}: AdaptiveAdminDashboardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const isAdmin = role?.toLowerCase() === 'admin';
  const adaptive = currentQuestion.adaptive;
  const currentHistory = answersHistory[activeSetId]?.[currentQuestion.id];
  const latestSubmitted = useMemo(() => {
    const histories = Object.values(answersHistory[activeSetId] || {})
      .map((history) => history.submitResult)
      .filter(Boolean) as AdaptiveSubmitResult[];
    return histories.at(-1);
  }, [activeSetId, answersHistory]);

  const conceptElo = currentHistory?.submitResult?.new_elo
    ?? latestSubmitted?.new_elo
    ?? adaptive?.conceptElo
    ?? activePracticeSession?.startElo;
  const bktMastery = currentHistory?.submitResult?.new_bkt
    ?? latestSubmitted?.new_bkt
    ?? adaptive?.bktMasteryProbability;

  const timeline = useMemo(() => {
    const setHistory = answersHistory[activeSetId] || {};
    return questionsList
      .map((question, index) => ({
        index,
        question,
        history: setHistory[question.id],
      }))
      .filter((item) => item.history?.submitResult);
  }, [activeSetId, answersHistory, questionsList]);

  const nextQuestion = questionsList.find((question, index) => index > currentQuestionIdx && question.adaptive);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isAdmin || !adaptive) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label="Adaptive diagnostics"
        title="Adaptive diagnostics"
        onClick={() => setIsOpen((open) => !open)}
        className="grid h-9 w-9 place-items-center rounded-xl border border-primary-blue/20 bg-white text-primary-blue shadow-sm transition-colors hover:bg-primary-blue-light/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-blue/15"
      >
        <Activity className="h-4 w-4" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="fixed inset-x-3 bottom-3 z-[100] max-h-[78dvh] overflow-hidden rounded-2xl border border-stone-200 bg-white text-left shadow-2xl shadow-stone-950/20 sm:absolute sm:inset-auto sm:right-0 sm:top-[calc(100%+0.6rem)] sm:w-[38rem] sm:max-w-[calc(100vw-2rem)]">
          <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-4 py-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary-blue">Admin diagnostics</p>
              <h3 className="truncate text-sm font-black text-stone-900">{activeSet?.topic_title || activeSet?.title || activeSetId}</h3>
            </div>
            <button
              type="button"
              aria-label="Đóng adaptive diagnostics"
              onClick={() => setIsOpen(false)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-stone-400 transition-colors hover:bg-stone-50 hover:text-stone-700"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="custom-scrollbar max-h-[calc(78dvh-3.6rem)] overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Metric label="Concept Elo" value={formatNumber(conceptElo)} />
              <Metric label="Question Elo" value={formatNumber(adaptive.questionDifficultyElo)} />
              <Metric label="BKT" value={formatPercent(bktMastery)} />
              <Metric label="Expected" value={formatPercent(adaptive.expectedSuccess)} />
            </div>

            <section className="mt-4 rounded-xl border border-stone-200 p-3">
              <h4 className="text-xs font-black text-stone-850">Current recommendation</h4>
              <div className="mt-2 grid gap-1.5 text-[11px] font-bold text-stone-600 sm:grid-cols-2">
                <Row label="Concept" value={adaptive.conceptId} mono />
                <Row label="Question" value={adaptive.questionId} mono />
                <Row label="Decision" value={adaptive.decisionId} mono />
                <Row label="Candidates" value={formatNumber(adaptive.candidateCount)} />
                <Row label="Reward" value={formatNumber(adaptive.expectedReward, 3)} />
                <Row label="Session q" value={`${currentQuestionIdx + 1}/${activePracticeSession?.maxQuestions || questionsList.length}`} />
              </div>
            </section>

            <section className="mt-3 rounded-xl border border-stone-200 p-3">
              <h4 className="text-xs font-black text-stone-850">Learner model</h4>
              <div className="mt-2 grid gap-1.5 text-[11px] font-bold text-stone-600 sm:grid-cols-2">
                <Row
                  label="Elo change"
                  value={
                    currentHistory?.submitResult
                      ? `${formatNumber(currentHistory.submitResult.old_elo)} -> ${formatNumber(currentHistory.submitResult.new_elo)} (${metricDelta(currentHistory.submitResult.old_elo, currentHistory.submitResult.new_elo)})`
                      : formatNumber(conceptElo)
                  }
                />
                <Row
                  label="BKT change"
                  value={
                    currentHistory?.submitResult
                      ? `${formatPercent(currentHistory.submitResult.old_bkt)} -> ${formatPercent(currentHistory.submitResult.new_bkt)} (${metricDelta(currentHistory.submitResult.old_bkt * 100, currentHistory.submitResult.new_bkt * 100, 1)} pts)`
                      : formatPercent(bktMastery)
                  }
                />
                <Row label="State" value={currentHistory?.submitResult?.mastery_state || latestSubmitted?.mastery_state || 'n/a'} />
                <Row label="Weakness" value={String(currentHistory?.submitResult?.weakness_flag ?? latestSubmitted?.weakness_flag ?? 'n/a')} />
              </div>
            </section>

            <section className="mt-3 rounded-xl border border-stone-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-black text-stone-850">Session timeline</h4>
                <span className="rounded-full bg-stone-100 px-2 py-1 text-[10px] font-black text-stone-500">{timeline.length} submitted</span>
              </div>
              <div className="mt-2 space-y-1.5">
                {timeline.length > 0 ? timeline.map(({ index, question, history }) => {
                  const result = history.submitResult!;
                  const StatusIcon = result.is_correct ? CheckCircle2 : XCircle;
                  return (
                    <details key={question.id} className="rounded-lg border border-stone-100 bg-stone-50 px-2.5 py-2">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-[11px] font-black text-stone-700">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <StatusIcon className={`h-3.5 w-3.5 shrink-0 ${result.is_correct ? 'text-emerald-600' : 'text-rose-600'}`} />
                          <span>Q{index + 1}</span>
                          <span className="truncate font-mono text-stone-500">{question.adaptive?.questionId || question.id}</span>
                        </span>
                        <span className={result.new_elo >= result.old_elo ? 'text-emerald-600' : 'text-rose-600'}>
                          {metricDelta(result.old_elo, result.new_elo)}
                        </span>
                      </summary>
                      <div className="mt-2 grid gap-1 text-[10px] font-bold text-stone-500 sm:grid-cols-2">
                        <Row label="Elo" value={`${formatNumber(result.old_elo)} -> ${formatNumber(result.new_elo)}`} />
                        <Row label="BKT" value={`${formatPercent(result.old_bkt)} -> ${formatPercent(result.new_bkt)}`} />
                        <Row label="Hints" value={formatNumber(history.hintCount || 0)} />
                        <Row label="AI help" value="client false/server verified" />
                      </div>
                    </details>
                  );
                }) : (
                  <div className="rounded-lg border border-dashed border-stone-200 p-3 text-center text-[11px] font-bold text-stone-500">
                    Chưa submit câu adaptive nào trong phiên này.
                  </div>
                )}
              </div>
            </section>

            <section className="mt-3 rounded-xl border border-stone-200 p-3">
              <h4 className="text-xs font-black text-stone-850">Next recommendation</h4>
              <div className="mt-2 text-[11px] font-bold text-stone-600">
                {isLoadingNextQuestion ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-blue" />
                    Đang lấy câu tiếp theo
                  </span>
                ) : nextQuestion?.adaptive ? (
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    <Row label="Question" value={nextQuestion.adaptive.questionId} mono />
                    <Row label="Expected" value={formatPercent(nextQuestion.adaptive.expectedSuccess)} />
                  </div>
                ) : (
                  <span>Chưa có câu tiếp theo được prefetch hoặc phiên đã gần kết thúc.</span>
                )}
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-primary-blue/10 bg-primary-blue-light/25 p-2">
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-primary-blue">{label}</p>
      <p className="mt-1 truncate font-mono text-sm font-black text-stone-900">{value}</p>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <span className="text-stone-400">{label}: </span>
      <span className={mono ? 'break-all font-mono text-stone-650' : 'text-stone-650'}>{value}</span>
    </div>
  );
}

export default AdaptiveAdminDashboard;
