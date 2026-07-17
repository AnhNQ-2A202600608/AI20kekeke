import { ArrowDownToLine, BookOpen, CheckCircle2 } from 'lucide-react';
import type { ProgramDay } from '@/lib/quiz/types';

interface DaySummaryCardProps {
  day: ProgramDay;
  conceptCount: number;
  availableSetCount: number;
  completionPercent: number;
  onStartHere: () => void;
  onSelectGuidebook: (dayId: string) => void;
}

export function DaySummaryCard({
  day,
  conceptCount,
  availableSetCount,
  completionPercent,
  onStartHere,
  onSelectGuidebook,
}: DaySummaryCardProps) {
  const dayLabel = day.displayLabel || `Day ${day.dayNumber}`;

  return (
    <section className="rounded-[1.25rem] border-2 border-secondary-green-dark border-b-[5px] bg-secondary-green p-5 text-white shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <p className="text-[11px] font-black uppercase text-white/80">{dayLabel}</p>
          <h2 className="font-fraunces text-2xl font-black leading-tight md:text-3xl">{day.title}</h2>
          <p className="max-w-2xl text-sm font-semibold leading-relaxed text-white/90">{day.outcome}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 lg:w-[300px]">
          <div className="rounded-2xl border border-white/20 bg-white/15 px-3 py-2 text-center">
            <p className="text-[10px] font-black uppercase text-white/75">Concept</p>
            <p className="mt-1 text-xl font-black">{conceptCount}</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/15 px-3 py-2 text-center">
            <p className="text-[10px] font-black uppercase text-white/75">Bài luyện</p>
            <p className="mt-1 text-xl font-black">{availableSetCount}</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/15 px-3 py-2 text-center">
            <p className="text-[10px] font-black uppercase text-white/75">Tiến độ</p>
            <p className="mt-1 text-xl font-black">{completionPercent}%</p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2 text-[11px] font-bold text-white/85">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Start here sẽ đưa bạn đến concept yếu hoặc chưa hoàn thành đầu tiên.</span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {day.guidebookDayId && (
            <button
              type="button"
              onClick={() => onSelectGuidebook(day.guidebookDayId as string)}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-white/50 border-b-[5px] bg-white/15 px-4 py-3 text-xs font-black uppercase text-white transition hover:bg-white/25 active:translate-y-1 active:border-b-2"
            >
              <BookOpen className="h-4 w-4 stroke-[3]" />
              Guidebook
            </button>
          )}
          <button
            type="button"
            onClick={onStartHere}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-primary-green-dark border-b-[5px] bg-primary-green px-4 py-3 text-xs font-black uppercase text-white transition hover:brightness-105 active:translate-y-1 active:border-b-2"
          >
            <ArrowDownToLine className="h-4 w-4 stroke-[3]" />
            Start here
          </button>
        </div>
      </div>
    </section>
  );
}
