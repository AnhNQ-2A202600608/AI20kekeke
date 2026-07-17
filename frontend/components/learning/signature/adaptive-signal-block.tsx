import { Compass, Lock, RotateCcw } from 'lucide-react';
import type { ProgramConcept, ProgramDay } from '@/lib/quiz/types';
import { cn } from '@/lib/utils';

type AdaptiveSignalMode = 'focus' | 'weak' | 'preview';

interface AdaptiveSignalBlockProps {
  mode: AdaptiveSignalMode;
  day: ProgramDay;
  concept?: ProgramConcept;
  className?: string;
}

const modeMeta = {
  focus: {
    label: 'Concept Compass',
    Icon: Compass,
    tone: 'border-primary-green/20 bg-primary-green/10 text-primary-green-dark',
  },
  weak: {
    label: 'Cần ôn nhẹ',
    Icon: RotateCcw,
    tone: 'border-accent-orange/30 bg-accent-orange/10 text-accent-orange-dark',
  },
  preview: {
    label: 'Sắp mở khóa',
    Icon: Lock,
    tone: 'border-primary-green/20 bg-primary-green/10 text-primary-green-dark',
  },
};

function getBody(mode: AdaptiveSignalMode, day: ProgramDay, concept?: ProgramConcept) {
  const title = concept?.title || day.title;
  const dayLabel = day.displayLabel || `Day ${day.dayNumber}`;

  if (mode === 'weak') {
    return {
      title,
      body: 'Làm lại một câu ngắn để chắc hơn trước khi đi tiếp.',
    };
  }

  if (mode === 'preview') {
    return {
      title,
      body: `Hoàn thành bước trước để mở ${dayLabel}.`,
    };
  }

  return {
    title,
    body: concept?.description || day.outcome,
  };
}

export function AdaptiveSignalBlock({ mode, day, concept, className }: AdaptiveSignalBlockProps) {
  const meta = modeMeta[mode];
  const { title, body } = getBody(mode, day, concept);

  return (
    <section className={cn('rounded-2xl border border-gray-border bg-white p-3 shadow-sm', className)} aria-label={meta.label}>
      <div className="flex items-start gap-3">
        <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl border', meta.tone)}>
          <meta.Icon className="h-5 w-5 stroke-[3]" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-wide text-stone-400">{meta.label}</p>
          <p className="mt-1 text-sm font-black leading-5 text-on-background">{title}</p>
          <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-5 text-stone-600">{body}</p>
        </div>
      </div>
    </section>
  );
}
