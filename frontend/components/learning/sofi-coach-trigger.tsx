'use client';

import { MessageSquare, Sparkles } from 'lucide-react';
import { SofiStateMascot } from '@/components/mascot';
import { cn } from '@/lib/utils';
import type { SofiCoachConceptState, SofiCoachContext } from './sofi-coach-sheet';
import { getSofiMascotStateForConceptState } from './learning-visual-asset-map';

interface SofiCoachTriggerProps {
  context: SofiCoachContext | null;
  onOpen: () => void;
  variant?: 'card' | 'floating' | 'compact';
  disabled?: boolean;
  className?: string;
}

const stateLabel: Record<SofiCoachConceptState, string> = {
  mastered: 'Ổn định',
  learning: 'Đang học',
  weak: 'Cần vá',
  'not-started': 'Chưa học',
  empty: 'Sắp mở',
};

const getTriggerCopy = (context: SofiCoachContext | null) => {
  if (!context) {
    return {
      title: 'Mở Sofi coach',
      body: 'Nhận gợi ý ngắn theo concept đang active trước khi Start.',
      chip: 'Coach theo context',
    };
  }

  if ((context.conceptTitle + context.conceptDescription).toLowerCase().includes('token')) {
    return {
      title: `Sofi đang canh ${context.conceptTitle}`,
      body: 'Có thể giải thích tokenization bằng ví dụ ngắn trước khi em vào bài luyện.',
      chip: stateLabel[context.conceptState ?? 'learning'],
    };
  }

  if (context.conceptState === 'weak') {
    return {
      title: `Ôn nhẹ ${context.conceptTitle}`,
      body: 'Mở Sofi để chốt lại ý chính và vá đúng điểm đang yếu.',
      chip: stateLabel.weak,
    };
  }

  return {
    title: `Hỏi Sofi về ${context.conceptTitle}`,
    body: 'Mở coach sheet để xem giải thích dễ hiểu, ví dụ ngắn, hoặc chuyển sang AI chat.',
    chip: stateLabel[context.conceptState ?? 'learning'],
  };
};

export function SofiCoachTrigger({
  context,
  onOpen,
  variant = 'card',
  disabled = false,
  className,
}: SofiCoachTriggerProps) {
  const copy = getTriggerCopy(context);
  const mascotState = getSofiMascotStateForConceptState(context?.conceptState);

  if (variant === 'floating') {
    return (
      <button
        type="button"
        onClick={onOpen}
        disabled={disabled}
        className={cn(
          'inline-flex min-h-14 cursor-pointer items-center gap-3 rounded-full border border-primary-green-dark bg-primary-green px-4 py-3 text-left text-white shadow-lg shadow-primary-green/20 transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25 active:translate-y-[1px] disabled:cursor-not-allowed disabled:border-gray-border-dark disabled:bg-gray-border disabled:text-stone-400 disabled:shadow-none',
          className,
        )}
        aria-label={`Mở Sofi coach cho ${context?.conceptTitle || 'concept hiện tại'}`}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
          <Sparkles className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-white/80">Sofi coach</span>
          <span className="mt-0.5 block truncate text-sm font-black">{context?.conceptTitle || 'Mở trợ lý học tập'}</span>
        </span>
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={onOpen}
        disabled={disabled}
        className={cn(
          'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-2xl border border-gray-border bg-white px-3 py-2 text-left transition hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/20 active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60',
          className,
        )}
        aria-label={`Mở Sofi coach cho ${context?.conceptTitle || 'concept hiện tại'}`}
      >
        <SofiStateMascot state={mascotState} size="sm" className="-ml-2 -mr-1 scale-[0.72]" />
        <span className="min-w-0">
          <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-primary-green-dark">Sofi</span>
          <span className="block truncate text-xs font-black text-on-background">{context?.conceptTitle || 'Coach theo concept'}</span>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={disabled}
      className={cn(
        'flex w-full cursor-pointer items-center gap-3 rounded-[26px] border border-primary-green/15 bg-[#f5fbe9] p-3 text-left shadow-sm transition hover:border-primary-green/30 hover:bg-[#f0f8df] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/20 active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      aria-label={`Mở Sofi coach cho ${context?.conceptTitle || 'concept hiện tại'}`}
    >
      <SofiStateMascot state={mascotState} size="sm" className="shrink-0" />

      <span className="min-w-0 flex-1">
        <span className="inline-flex items-center gap-1 rounded-full border border-primary-green/15 bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-primary-green-dark">
          <MessageSquare className="h-3.5 w-3.5" />
          {copy.chip}
        </span>
        <span className="mt-2 block text-base font-black leading-tight text-on-background">{copy.title}</span>
        <span className="mt-1 block text-sm font-semibold leading-6 text-stone-600">{copy.body}</span>
      </span>

      <span className="rounded-full bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-primary-green-dark shadow-sm">
        Mở coach
      </span>
    </button>
  );
}
