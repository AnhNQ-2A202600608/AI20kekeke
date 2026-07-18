import { ArrowDownToLine, BookOpenCheck, CalendarDays, Flame } from 'lucide-react';
import type { ProgramDay, ProgramTrack } from '@/lib/quiz/types';
import { PROGRAM_DAY_COUNT } from '@/lib/quiz/program-curriculum';

interface ProgramOverviewHeaderProps {
  selectedDay: ProgramDay;
  selectedTrack?: ProgramTrack;
  completedDays: number;
  availablePracticeCount: number;
  onStartHere: () => void;
}

export function ProgramOverviewHeader({
  selectedDay,
  selectedTrack,
  completedDays,
  availablePracticeCount,
  onStartHere,
}: ProgramOverviewHeaderProps) {
  const progressPercent = Math.round((completedDays / PROGRAM_DAY_COUNT) * 100);
  const selectedDayLabel = selectedDay.displayLabel || `Day ${selectedDay.dayNumber}`;

  return (
    <section className="rounded-[1.25rem] border-2 border-gray-border border-b-[5px] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 border-primary-green-dark bg-primary-green text-white">
              <BookOpenCheck className="h-4.5 w-4.5 stroke-[3]" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase text-primary-green-dark">
                AI Thực Chiến
              </p>
              <h1 className="font-fraunces text-xl font-black leading-tight text-on-background md:text-2xl">
                Bản đồ chương trình 28 ngày
              </h1>
            </div>
          </div>

          <p className="max-w-2xl text-sm font-semibold leading-relaxed text-stone-600">
            Truy cập trực tiếp từng ngày học, xem các concept cần luyện và bắt đầu tại phần ưu tiên của ngày đang chọn.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:w-[400px]">
          <div className="rounded-2xl border-2 border-gray-border bg-surface-container-low px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-stone-500">
              <CalendarDays className="h-3.5 w-3.5" />
              Ngày đang mở
            </div>
            <p className="mt-1 text-lg font-black text-on-background">{selectedDayLabel}</p>
          </div>
          <div className="rounded-2xl border-2 border-gray-border bg-surface-container-low px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-stone-500">
              <Flame className="h-3.5 w-3.5 text-accent-orange" />
              Hoàn thành
            </div>
            <p className="mt-1 text-lg font-black text-on-background">{progressPercent}%</p>
          </div>
          <div className="col-span-2 rounded-2xl border-2 border-gray-border bg-surface-container-low px-3 py-2.5 sm:col-span-1">
            <p className="text-[10px] font-black uppercase text-stone-500">Track</p>
            <p className="mt-1 text-sm font-black leading-tight text-on-background">
              {selectedTrack?.shortTitle || 'Chung'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="h-3 overflow-hidden rounded-full border border-gray-border bg-stone-100">
            <div className="h-full rounded-full bg-primary-green" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="mt-1.5 text-[11px] font-bold text-stone-500">
            {completedDays}/{PROGRAM_DAY_COUNT} ngày có bài luyện đã hoàn thành • {availablePracticeCount} bộ luyện đang có sẵn
          </p>
        </div>

        <button
          type="button"
          onClick={onStartHere}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-primary-green-dark border-b-[5px] bg-primary-green px-5 py-3 text-xs font-black uppercase text-white transition hover:brightness-105 active:translate-y-1 active:border-b-2"
        >
          <ArrowDownToLine className="h-4 w-4 stroke-[3]" />
          Start here
        </button>
      </div>
    </section>
  );
}
