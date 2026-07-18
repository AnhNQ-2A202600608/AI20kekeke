'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, BookOpen, Check, MessageCircle, Sparkles, X } from 'lucide-react';
import { SofiExpressionAvatar } from '@/components/mascot';
import {
  completeQuizFirstRun,
  dismissQuizFirstRun,
  QUIZ_FIRST_RUN_TOUR_EVENT,
  resetQuizFirstRun,
  startQuizFirstRun,
  updateQuizFirstRunStep,
} from '@/lib/onboarding/quiz-first-run-storage';

interface QuizFirstRunWalkthroughProps {
  userId?: string | null;
  enabled: boolean;
  isSocraticOpen: boolean;
  onOpenSofi: () => void;
}

interface TourStep {
  id: string;
  targetId: string;
  eyebrow: string;
  title: string;
  body: string;
  actionLabel?: string;
  action?: 'open-sofi';
}

const steps: TourStep[] = [
  {
    id: 'question',
    targetId: 'question-card',
    eyebrow: 'Câu hỏi thích ứng',
    title: 'Mentora chọn câu theo vùng bạn cần luyện',
    body: 'Câu hỏi được lấy từ kỹ năng hiện tại và mức mastery/Elo của bạn, nên mục tiêu là luyện đúng vùng gần vừa sức thay vì làm một đề cố định.',
  },
  {
    id: 'difficulty',
    targetId: 'difficulty-chip',
    eyebrow: 'Độ khó',
    title: 'Xem câu này đang dễ, vừa sức hay thử thách',
    body: 'Bấm vào chip độ khó để xem vì sao câu được chọn. Khi bạn trả lời tốt, hệ thống có thể tăng độ khó; khi hụt nền, hệ thống giảm lại để vá kiến thức.',
  },
  {
    id: 'hint',
    targetId: 'hint-button',
    eyebrow: 'Gợi ý Sofi',
    title: 'Dùng gợi ý khi kẹt, nhưng có giảm Elo',
    body: 'Sofi mở gợi ý theo từng nấc Socratic. Mỗi lượt gợi ý giúp bạn nghĩ tiếp, nhưng điểm Elo nhận được sẽ bị giảm để giữ công bằng.',
  },
  {
    id: 'answer',
    targetId: 'answer-options',
    eyebrow: 'Trả lời',
    title: 'Chọn đáp án rồi kiểm tra ngay',
    body: 'Bấm một đáp án trong vùng này trước. Sau đó nút kiểm tra sẽ hiện ở thanh dưới để bạn xem đúng/sai; Elo mới được cập nhật ở thanh góc phải phía trên.',
  },
  {
    id: 'sofi',
    targetId: 'sofi-panel',
    eyebrow: 'AI hỏi đáp',
    title: 'Mở Sofi để hỏi vì sao',
    body: 'Khi bạn muốn kiểm tra cách hiểu, hãy hỏi Sofi. Sofi sẽ trả lời theo kiểu gợi mở, ưu tiên giúp bạn tự suy luận thay vì đưa lời giải thẳng.',
    actionLabel: 'Mở Sofi hỏi đáp',
    action: 'open-sofi',
  },
  {
    id: 'citation',
    targetId: 'citation-list',
    eyebrow: 'Citation',
    title: 'Bấm citation để xem slide nguồn',
    body: 'Khi câu trả lời có tài liệu tham khảo, bấm vào citation hoặc slide để kiểm tra nguồn học liệu. Nếu citation chưa hiện, hãy gửi một câu hỏi cho Sofi trước.',
  },
];

function getVisibleTarget(targetId: string): Element | null {
  if (typeof window === 'undefined') return null;
  const targets = Array.from(document.querySelectorAll(`[data-quiz-tour-id="${targetId}"]`));
  return targets.find((target) => {
    const rect = target.getBoundingClientRect();
    const style = window.getComputedStyle(target);
    return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
  }) || null;
}

function getTargetRect(targetId: string): DOMRect | null {
  const target = getVisibleTarget(targetId);
  return target?.getBoundingClientRect() || null;
}

function getTooltipPosition(rect: DOMRect | null) {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const height = typeof window !== 'undefined' ? window.innerHeight : 768;
  const tooltipWidth = Math.min(420, width - 32);
  const tooltipHeight = 420;
  const gap = 16;

  if (!rect) {
    return {
      left: Math.max(16, (width - tooltipWidth) / 2),
      top: Math.max(16, height * 0.22),
      width: tooltipWidth,
    };
  }

  const placements = [
    {
      left: rect.left + rect.width / 2 - tooltipWidth / 2,
      top: rect.bottom + gap,
      fits: rect.bottom + gap + tooltipHeight < height - 16,
    },
    {
      left: rect.left + rect.width / 2 - tooltipWidth / 2,
      top: rect.top - tooltipHeight - gap,
      fits: rect.top - tooltipHeight - gap > 16,
    },
    {
      left: rect.right + gap,
      top: rect.top + rect.height / 2 - tooltipHeight / 2,
      fits: rect.right + gap + tooltipWidth < width - 16,
    },
    {
      left: rect.left - tooltipWidth - gap,
      top: rect.top + rect.height / 2 - tooltipHeight / 2,
      fits: rect.left - tooltipWidth - gap > 16,
    },
  ];
  const placement = placements.find((item) => item.fits) || placements[1] || placements[0];

  return {
    left: Math.min(Math.max(16, placement.left), width - tooltipWidth - 16),
    top: Math.min(Math.max(16, placement.top), height - tooltipHeight - 16),
    width: tooltipWidth,
  };
}

function getDimRects(rect: DOMRect | null) {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const height = typeof window !== 'undefined' ? window.innerHeight : 768;
  if (!rect) {
    return [{ left: 0, top: 0, width, height }];
  }

  const padding = 12;
  const left = Math.max(0, rect.left - padding);
  const top = Math.max(0, rect.top - padding);
  const right = Math.min(width, rect.right + padding);
  const bottom = Math.min(height, rect.bottom + padding);

  return [
    { left: 0, top: 0, width, height: top },
    { left: 0, top: bottom, width, height: Math.max(0, height - bottom) },
    { left: 0, top, width: left, height: Math.max(0, bottom - top) },
    { left: right, top, width: Math.max(0, width - right), height: Math.max(0, bottom - top) },
  ].filter((item) => item.width > 0 && item.height > 0);
}

export function QuizFirstRunWalkthrough({
  userId,
  enabled,
  isSocraticOpen,
  onOpenSofi,
}: QuizFirstRunWalkthroughProps) {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const currentStep = steps[Math.min(stepIndex, steps.length - 1)];
  const tooltipStyle = useMemo(() => getTooltipPosition(targetRect), [targetRect]);
  const dimRects = useMemo(() => getDimRects(targetRect), [targetRect]);
  const highlightStyle = targetRect
    ? {
        left: targetRect.left - 12,
        top: targetRect.top - 12,
        width: targetRect.width + 24,
        height: targetRect.height + 24,
      }
    : null;

  const refreshTarget = useCallback(() => {
    if (!currentStep) return;
    const fallbackTargetId = currentStep.id === 'citation' ? 'sofi-panel' : 'question-card';
    const rect = getTargetRect(currentStep.targetId) || getTargetRect(fallbackTargetId) || getTargetRect('question-card');
    setTargetRect(rect);
    if (rect) {
      const target = getVisibleTarget(currentStep.targetId) || getVisibleTarget(fallbackTargetId) || getVisibleTarget('question-card');
      target?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    }
  }, [currentStep]);

  useEffect(() => {
    if (!enabled) return;
    const current = startQuizFirstRun(userId);
    if (current.status !== 'active') return;
    const id = window.setTimeout(() => {
      setStepIndex(Math.min(current.currentStep, steps.length - 1));
      setActive(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, [enabled, userId]);

  useEffect(() => {
    const handleStart = () => {
      const next = resetQuizFirstRun(userId);
      setStepIndex(Math.min(next.currentStep, steps.length - 1));
      setActive(true);
    };

    window.addEventListener(QUIZ_FIRST_RUN_TOUR_EVENT, handleStart);
    return () => window.removeEventListener(QUIZ_FIRST_RUN_TOUR_EVENT, handleStart);
  }, [userId]);

  useEffect(() => {
    if (!active) return;
    const id = window.setTimeout(refreshTarget, 80);
    window.addEventListener('resize', refreshTarget);
    window.addEventListener('scroll', refreshTarget, true);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('resize', refreshTarget);
      window.removeEventListener('scroll', refreshTarget, true);
    };
  }, [active, refreshTarget]);

  useEffect(() => {
    if (!active) return;
    const id = window.setTimeout(refreshTarget, 0);
    return () => window.clearTimeout(id);
  }, [active, isSocraticOpen, stepIndex, refreshTarget]);

  useEffect(() => {
    if (!active || currentStep?.action !== 'open-sofi' || isSocraticOpen) return;
    onOpenSofi();
  }, [active, currentStep, isSocraticOpen, onOpenSofi]);

  if (!active || !currentStep) return null;

  const close = (kind: 'dismiss' | 'complete') => {
    if (kind === 'complete') {
      completeQuizFirstRun(userId);
    } else {
      dismissQuizFirstRun(userId);
    }
    setActive(false);
  };

  const goToStep = (nextIndex: number) => {
    const bounded = Math.min(Math.max(0, nextIndex), steps.length - 1);
    setStepIndex(bounded);
    updateQuizFirstRunStep(userId, bounded);
  };

  const runAction = () => {
    if (currentStep.action === 'open-sofi') {
      onOpenSofi();
      window.setTimeout(refreshTarget, 120);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9980] pointer-events-none font-be-vietnam-pro" aria-live="polite">
        {dimRects.map((rect, index) => (
          <motion.div
            key={`${currentStep.id}-dim-${index}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bg-stone-950/46"
            style={rect}
          />
        ))}

        {highlightStyle && (
          <motion.div
            key={`${currentStep.id}-highlight`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.18 }}
            className="absolute rounded-2xl border-2 border-primary-green bg-transparent shadow-[0_18px_55px_rgba(88,204,2,0.22)]"
            style={highlightStyle}
          />
        )}

        <motion.section
          key={currentStep.id}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className="pointer-events-auto fixed max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl border border-primary-green/20 border-b-[6px] bg-white p-4 shadow-[0_26px_70px_rgba(31,41,55,0.24)] sm:p-5"
          style={tooltipStyle}
          role="dialog"
          aria-modal="false"
          aria-label={currentStep.title}
        >
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-primary-green/20 bg-primary-green-light">
              {currentStep.id === 'sofi' ? (
                <SofiExpressionAvatar expression="happy" size={34} priority />
              ) : currentStep.id === 'citation' ? (
                <BookOpen className="h-6 w-6 text-primary-green-dark" />
              ) : (
                <Sparkles className="h-6 w-6 text-primary-green-dark" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary-green-dark">
                Bước {stepIndex + 1}/{steps.length} · {currentStep.eyebrow}
              </p>
              <h2 className="mt-1 font-fraunces text-xl font-black leading-tight text-on-background">
                {currentStep.title}
              </h2>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-stone-600">
                {currentStep.body}
              </p>
            </div>
            <button
              type="button"
              onClick={() => close('dismiss')}
              className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full border border-stone-200 bg-stone-50 text-stone-500 transition hover:bg-stone-100"
              aria-label="Bỏ qua onboarding quiz"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-1.5">
            {steps.map((step, index) => (
              <span
                key={step.id}
                className={`h-2 rounded-full transition-all ${
                  index === stepIndex ? 'w-8 bg-primary-green' : 'w-2 bg-primary-green/20'
                }`}
              />
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => close('dismiss')}
              className="min-h-10 cursor-pointer rounded-xl border border-stone-200 bg-white px-4 text-sm font-black text-stone-500 shadow-sm transition hover:bg-stone-50"
            >
              Bỏ qua
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={stepIndex === 0}
                onClick={() => goToStep(stepIndex - 1)}
                className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-stone-200 bg-white text-stone-600 shadow-sm transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Quay lại bước trước"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              {currentStep.actionLabel && (
                <button
                  type="button"
                  onClick={runAction}
                  className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-primary-green/25 bg-primary-green-light px-3 text-xs font-black uppercase text-primary-green-dark shadow-sm transition hover:bg-primary-green-light/80"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  {currentStep.actionLabel}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (stepIndex >= steps.length - 1) {
                    close('complete');
                  } else {
                    goToStep(stepIndex + 1);
                  }
                }}
                className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-primary-green-dark bg-primary-green px-4 text-sm font-black uppercase text-white shadow-[0_3px_0_#46a302] transition hover:brightness-105 active:translate-y-[1px] active:shadow-none"
              >
                {stepIndex >= steps.length - 1 ? (
                  <>
                    Xong
                    <Check className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Tiếp
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.section>
      </div>
    </AnimatePresence>
  );
}
