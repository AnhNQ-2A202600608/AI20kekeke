'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Sprout, X } from 'lucide-react';

import {
  FIRST_RUN_TOUR_EVENT,
  dismissFirstRunTour,
  readFirstRunState,
  startFirstRunTour,
  updateFirstRunStep,
} from '@/lib/onboarding/first-run-storage';

interface FirstRunGuideProps {
  activeTab: string;
  isStudent: boolean;
  userId?: string | null;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface BoxSize {
  width: number;
  height: number;
}

const viewportMargin = 16;
const bottomSafeArea = 104;
const desktopCalloutWidth = 336;
const calloutTargetGap = 16;

const steps = [
  {
    id: 'learning-path',
    title: 'Chọn tuần và chọn ngày',
    body: 'Panel bên trái là lộ trình theo tuần. Dùng nó để đổi ngày học, xem kỹ năng đang cần ôn và quay lại phần đã học.',
  },
  {
    id: 'guidebook-cta',
    title: 'Mở Guidebook khi cần đọc lại',
    body: 'Nút Guidebook ở dưới mở phần ghi chú nền tảng của ngày học. Dùng nó để đọc lại lý thuyết trước khi vào phiên luyện.',
  },
  {
    id: 'mastery',
    title: 'Độ vững, XP và Elo',
    body: 'Các chỉ số trên đầu trang cho biết nhịp học và độ thành thạo. Độ vững tăng sau nhiều phiên luyện, không chỉ sau một câu đúng.',
  },
  {
    id: 'sofi',
    title: 'Sofi là trợ lý học tập',
    body: 'Khi kẹt, mở Sofi để nhận gợi ý Socratic từng bước. Sofi giúp bạn nghĩ tiếp, không làm hộ bài.',
  },
  {
    id: 'app-navigation',
    title: 'Các trang bên phải',
    body: 'Cụm điều hướng bên phải mở Guidebook, luyện kỹ năng, chat, hồ sơ và skill graph. Đây là đường tắt để chuyển vùng trong app.',
  },
  {
    id: 'practice-cta',
    title: 'Bắt đầu phiên ngắn',
    body: 'Một phiên 15-20 phút là đủ để EduGap cập nhật Elo/BKT và đề xuất bước tiếp theo chính xác hơn.',
  },
];

function queryAnchor(stepId: string) {
  const elements = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour-id="${stepId}"]`));
  return elements.find((element) => {
    const rect = element.getBoundingClientRect();
    return rect.width >= 8 && rect.height >= 8;
  }) || null;
}

function getTargetRect(stepId: string): TargetRect | null {
  const element = queryAnchor(stepId);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  if (rect.width < 8 || rect.height < 8) return null;
  return {
    top: Math.max(8, rect.top),
    left: Math.max(8, rect.left),
    width: rect.width,
    height: rect.height,
  };
}

export function FirstRunGuide({ activeTab, isStudent, userId }: FirstRunGuideProps) {
  const calloutRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [calloutSize, setCalloutSize] = useState<BoxSize>({ width: desktopCalloutWidth, height: 220 });
  const [isMobile, setIsMobile] = useState(false);
  const currentStep = steps[stepIndex];
  const canRender = mounted && isStudent && Boolean(userId) && (activeTab === 'learn' || activeTab === 'skills');

  const syncRect = useCallback(() => {
    if (!currentStep) return;
    setIsMobile(window.matchMedia('(max-width: 767px)').matches);
    setTargetRect(getTargetRect(currentStep.id));
    const rect = calloutRef.current?.getBoundingClientRect();
    if (rect && rect.width > 0 && rect.height > 0) {
      setCalloutSize({ width: rect.width, height: rect.height });
    }
  }, [currentStep]);

  useEffect(() => {
    const mountId = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(mountId);
  }, []);

  useEffect(() => {
    if (!mounted || !userId || !isStudent) return;
    const syncId = window.setTimeout(() => {
      const state = readFirstRunState(userId);
      if (state.status === 'pending' || state.status === 'active') {
        const nextStep = Math.min(Math.max(0, state.currentStep), steps.length - 1);
        setStepIndex(nextStep);
        startFirstRunTour(userId);
        setOpen(true);
      }
    }, 0);
    return () => window.clearTimeout(syncId);
  }, [isStudent, mounted, userId]);

  useEffect(() => {
    if (!mounted || !userId) return;
    const handleStart = () => {
      setStepIndex(0);
      startFirstRunTour(userId);
      setOpen(true);
      window.setTimeout(syncRect, 40);
    };

    window.addEventListener(FIRST_RUN_TOUR_EVENT, handleStart);
    return () => {
      window.removeEventListener(FIRST_RUN_TOUR_EVENT, handleStart);
    };
  }, [mounted, syncRect, userId]);

  useEffect(() => {
    if (!open || !canRender) return;
    const frameId = window.requestAnimationFrame(syncRect);
    const handleUpdate = () => syncRect();
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);
    const interval = window.setInterval(handleUpdate, 600);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
      window.clearInterval(interval);
    };
  }, [canRender, open, syncRect]);

  useEffect(() => {
    if (!open || !userId) return;
    updateFirstRunStep(userId, stepIndex);
  }, [open, stepIndex, userId]);

  const calloutStyle = useMemo(() => {
    if (!targetRect || isMobile) return undefined;
    const width = Math.max(desktopCalloutWidth, calloutSize.width);
    const height = Math.max(180, calloutSize.height);
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const maxLeft = Math.max(viewportMargin, viewportWidth - width - viewportMargin);
    const maxTop = Math.max(viewportMargin, viewportHeight - height - bottomSafeArea);
    const targetCenterX = targetRect.left + targetRect.width / 2;

    if (currentStep?.id === 'practice-cta' || currentStep?.id === 'guidebook-cta') {
      const left = Math.min(maxLeft, Math.max(viewportMargin, targetCenterX - width / 2));
      const preferredTop = targetRect.top - height - calloutTargetGap;
      const top = Math.min(maxTop, Math.max(viewportMargin, preferredTop));
      return { left, top };
    }

    const rightSpace = viewportWidth - (targetRect.left + targetRect.width);
    const leftSpace = targetRect.left;
    const canUseRight = rightSpace >= width + viewportMargin + calloutTargetGap;
    const canUseLeft = leftSpace >= width + viewportMargin + calloutTargetGap;
    const verticalCenterTop = targetRect.top + targetRect.height / 2 - height / 2;

    if (canUseRight || canUseLeft) {
      const left = canUseRight
        ? Math.min(maxLeft, targetRect.left + targetRect.width + calloutTargetGap)
        : Math.max(viewportMargin, targetRect.left - width - calloutTargetGap);
      const top = Math.min(maxTop, Math.max(viewportMargin, verticalCenterTop));
      return { left, top };
    }

    const availableBelow = viewportHeight - bottomSafeArea - (targetRect.top + targetRect.height);
    const availableAbove = targetRect.top - viewportMargin;
    const left = Math.min(maxLeft, Math.max(viewportMargin, targetCenterX - width / 2));

    if (availableBelow >= height + calloutTargetGap || availableBelow >= availableAbove) {
      const top = Math.min(maxTop, Math.max(viewportMargin, targetRect.top + targetRect.height + calloutTargetGap));
      return { left, top };
    }

    const top = Math.min(maxTop, Math.max(viewportMargin, targetRect.top - height - calloutTargetGap));
    return { left, top };
  }, [calloutSize, currentStep?.id, isMobile, targetRect]);

  if (!canRender || !open || !currentStep) return null;

  const dismiss = () => {
    dismissFirstRunTour(userId);
    setOpen(false);
  };

  const next = () => {
    if (stepIndex >= steps.length - 1) {
      dismiss();
      return;
    }
    setStepIndex((value) => Math.min(steps.length - 1, value + 1));
  };

  const previous = () => {
    setStepIndex((value) => Math.max(0, value - 1));
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-[70]" aria-live="polite">
      {targetRect && !isMobile ? (
        <div
          className="absolute rounded-[1.25rem] border-2 border-primary-green bg-primary-green/8 shadow-[0_0_0_9999px_rgba(23,30,18,0.34),0_16px_40px_rgba(88,204,2,0.24)] transition-all duration-200"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
          aria-hidden="true"
        />
      ) : (
        <div className="absolute inset-0 bg-stone-950/28" aria-hidden="true" />
      )}

      <aside
        ref={calloutRef}
        className={[
          'pointer-events-auto fixed w-[21rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-primary-green/25 border-b-[5px] border-b-primary-green-dark bg-white p-3.5 text-on-background shadow-2xl shadow-stone-950/20',
          isMobile ? 'bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] left-3 right-3 w-auto p-3.5' : '',
        ].join(' ')}
        style={isMobile ? undefined : calloutStyle ?? { left: 16, top: 16 }}
        role="dialog"
        aria-label="Hướng dẫn EduGap lần đầu"
      >
        <div className="flex items-start gap-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-primary-green/25 bg-primary-green/10 text-primary-green-dark">
            <Sprout className="h-4.5 w-4.5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary-green-dark">
              Bước {stepIndex + 1}/{steps.length}
            </p>
            <h2 className="mt-0.5 font-fraunces text-base font-black leading-tight text-on-background">
              {currentStep.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full border border-gray-border bg-white text-stone-500 transition hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25"
            aria-label="Đóng hướng dẫn"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-2.5 text-[13px] font-semibold leading-relaxed text-stone-600">{currentStep.body}</p>

        <div className="mt-3.5 flex items-center gap-1.5" aria-hidden="true">
          {steps.map((step, index) => (
            <span
              key={step.id}
              className={['h-1.5 rounded-full transition-all', index === stepIndex ? 'w-8 bg-primary-green' : 'w-2 bg-primary-green/20'].join(' ')}
            />
          ))}
        </div>

        <div className="mt-3.5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={dismiss}
            className="min-h-11 cursor-pointer rounded-xl border border-gray-border bg-white px-4 text-sm font-black text-stone-500 transition hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25"
          >
            Bỏ qua
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={previous}
              disabled={stepIndex === 0}
              className="grid h-11 w-11 cursor-pointer place-items-center rounded-xl border border-gray-border bg-white text-stone-600 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25"
              aria-label="Quay lại bước trước"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={next}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-primary-green-dark bg-primary-green px-4 text-sm font-black uppercase text-white transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25"
            >
              {stepIndex >= steps.length - 1 ? (
                <>
                  Đã hiểu
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                </>
              ) : (
                <>
                  Tiếp
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
