'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ProgramDay } from '@/lib/quiz/types';
import type { RoadmapDayState } from './program-roadmap';
import { MasterySeedBadge } from './mastery-seed-badge';
import { MasterySoilStrip } from './mastery-soil-strip';
import { inferPipelineStep } from './signature/pipeline-day-label';

interface MobileDayRailProps {
  days: ProgramDay[];
  selectedDayId: string;
  onSelectDay: (day: ProgramDay) => void;
  getDayState: (day: ProgramDay) => RoadmapDayState;
  getDayProgress: (day: ProgramDay) => number;
}

const stateMeta: Record<RoadmapDayState, { label: string; seedState?: 'locked' | 'review' }> = {
  active: {
    label: 'Hôm nay',
  },
  complete: {
    label: 'Đã xong',
  },
  weak: {
    label: 'Cần ôn',
    seedState: 'review',
  },
  preview: {
    label: 'Sắp mở',
    seedState: 'locked',
  },
};

export function MobileDayRail({
  days,
  selectedDayId,
  onSelectDay,
  getDayState,
  getDayProgress,
}: MobileDayRailProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  return (
    <section className="relative lg:hidden" aria-labelledby="mobile-day-rail-title">
      <div className="pointer-events-none absolute right-2 top-[-0.35rem] z-20 h-[clamp(3rem,14vw,3.75rem)] w-[clamp(3rem,14vw,3.75rem)] overflow-visible" aria-hidden="true">
        <Image
          src="/mascot/sofi/512/mentora-fox-idle-welcome.webp"
          alt=""
          width={512}
          height={512}
          sizes="(max-width: 640px) 14vw, 60px"
          className="h-full w-full object-contain object-top opacity-95 drop-shadow-[0_8px_14px_rgba(23,30,18,0.12)]"
          priority
        />
      </div>

      <button
        type="button"
        onClick={() => setIsDrawerOpen((open) => !open)}
        className="relative z-10 mb-3 flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-2xl bg-white/70 pr-14 text-left transition hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/20"
        aria-expanded={isDrawerOpen}
        aria-controls="mobile-day-rail-drawer"
      >
        <div className="min-w-0">
          <h2 id="mobile-day-rail-title" className="truncate text-base font-black text-on-background">
            Lộ trình học tập
          </h2>
          <p className="text-[11px] font-semibold text-stone-500">Chạm để {isDrawerOpen ? 'thu gọn' : 'mở danh sách ngày'}</p>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-stone-500 transition-transform ${isDrawerOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isDrawerOpen && (
      <div id="mobile-day-rail-drawer" className="-mx-3 flex snap-x gap-2 overflow-x-auto px-3 pb-2">
        {days.map((day) => {
          const selected = day.id === selectedDayId;
          const state = getDayState(day);
          const progress = getDayProgress(day);
          const { label, seedState } = stateMeta[state];
          const stepLabel = inferPipelineStep(day).label;

          return (
            <button
              key={day.id}
              type="button"
              onClick={() => onSelectDay(day)}
              className={[
                'min-h-20 w-[5.75rem] shrink-0 snap-start rounded-[1.35rem] border p-2 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25 active:scale-[0.98]',
                selected
                  ? 'border-primary-green bg-primary-green/10 shadow-sm'
                  : 'border-gray-border bg-white hover:bg-surface-container-low',
              ].join(' ')}
              aria-pressed={selected}
              aria-label={`Chọn ${day.displayLabel || `ngày ${day.dayNumber}`}: ${day.title}. ${label}, ${progress}% hoàn thành`}
            >
              <MasterySeedBadge
                progress={progress}
                state={seedState}
                label={`${day.displayLabel || `Day ${day.dayNumber}`} ${label}: ${progress}% hoàn thành`}
                size="sm"
              />
              <span className="mt-2 block text-xs font-black leading-tight text-on-background">
                {day.displayLabel || `Day ${day.dayNumber}`}
              </span>
              <span className="mt-0.5 block truncate text-[10px] font-bold text-stone-500">
                {stepLabel}
              </span>
              <MasterySoilStrip
                progress={progress}
                state={seedState}
                label={`Tiến độ ${day.displayLabel || `Day ${day.dayNumber}`}: ${progress}%`}
                className="mt-2 h-3"
              />
            </button>
          );
        })}
      </div>
      )}
    </section>
  );
}
