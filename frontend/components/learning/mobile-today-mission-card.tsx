'use client';

import Image from 'next/image';
import { CircleHelp } from 'lucide-react';
import type { ProgramDay, ProgramPhase, ProgramTrack } from '@/lib/quiz/types';
import { TodayMissionCapsule } from './today-mission-capsule';

interface MobileTodayMissionCardProps {
  day: ProgramDay;
  phase: ProgramPhase;
  track?: ProgramTrack;
  conceptCount: number;
  practiceCount: number;
  completionPercent: number;
  onOpenSofiCoach?: () => void;
  density?: 'comfortable' | 'compact';
}

function MissionMascotArt({
  compact,
  dayTitle,
  onOpenSofiCoach,
}: {
  compact: boolean;
  dayTitle: string;
  onOpenSofiCoach?: () => void;
}) {
  const mascot = (
    <span
      className={[
        'relative block shrink-0 overflow-visible',
        compact ? 'h-[clamp(2.75rem,6vw,4rem)] w-[clamp(2.75rem,6vw,4rem)]' : 'h-[clamp(3.5rem,7vw,6rem)] w-[clamp(3.5rem,7vw,6rem)]',
      ].join(' ')}
      aria-hidden="true"
    >
      <Image
        src="/mascot/sofi/512/edugap-fox-quiz-coach.webp"
        alt=""
        fill
        sizes={compact ? '(max-width: 1280px) 48px, 64px' : '(max-width: 1280px) 64px, 96px'}
        className="object-contain opacity-95"
        priority
      />
    </span>
  );

  if (!onOpenSofiCoach) {
    return (
      <div className="pointer-events-none absolute right-2 top-1 z-20 overflow-visible" aria-hidden="true">
        {mascot}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpenSofiCoach}
      className={[
        'absolute right-2 top-1 z-20 inline-flex cursor-pointer items-start justify-end overflow-visible text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/20 active:translate-y-[1px]',
        compact ? 'gap-1' : 'gap-2',
      ].join(' ')}
      aria-label={`Mở Sofi gỡ rối ${dayTitle}`}
    >
      <span
        className={[
          'relative mt-1 hidden max-w-36 rounded-2xl border border-primary-green/25 bg-white px-3 py-2 text-[10px] font-black uppercase leading-tight text-primary-green-dark shadow-md shadow-stone-900/10 before:absolute before:right-[-6px] before:top-4 before:h-3 before:w-3 before:rotate-45 before:border-r before:border-t before:border-primary-green/25 before:bg-white sm:inline-flex',
          compact ? 'xl:inline-flex' : '',
        ].join(' ')}
      >
        <CircleHelp className="mr-1.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Gỡ rối hôm nay
      </span>
      {mascot}
    </button>
  );
}

export function MobileTodayMissionCard({
  day,
  phase,
  track,
  conceptCount,
  practiceCount,
  completionPercent,
  onOpenSofiCoach,
  density = 'comfortable',
}: MobileTodayMissionCardProps) {
  const estimatedMinutes = Math.max(8, practiceCount * 4);
  const compact = density === 'compact';
  const dayLabel = day.displayLabel || `Day ${day.dayNumber}`;

  return (
    <section className={compact ? 'relative overflow-hidden rounded-xl border border-primary-green/25 bg-white p-2.5 shadow-sm' : 'relative overflow-hidden rounded-2xl border border-primary-green/25 bg-white p-3 shadow-sm'} aria-labelledby="today-mission-title">
      <MissionMascotArt
        compact={compact}
        dayTitle={`${dayLabel} · ${day.title}`}
        onOpenSofiCoach={onOpenSofiCoach}
      />
      <div className="relative z-10 flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1 pr-14 xl:pr-20">
          <p className={compact ? 'mb-1 text-[10px] font-black uppercase text-stone-400' : 'mb-1.5 text-[10px] font-black uppercase text-stone-400'}>
            {phase.shortTitle}{track ? ` · ${track.shortTitle}` : ''}
          </p>
          <h1 id="today-mission-title" className={compact ? 'text-lg font-black leading-tight text-on-background' : 'text-xl font-black leading-tight text-on-background'}>
            {dayLabel} · {day.title}
          </h1>
          <p className={compact ? 'mt-0.5 line-clamp-1 text-xs font-semibold leading-relaxed text-stone-600' : 'mt-1 line-clamp-2 text-sm font-semibold leading-relaxed text-stone-600'}>
            {day.outcome}
          </p>
        </div>
      </div>

      <TodayMissionCapsule
        concepts={conceptCount}
        practices={practiceCount}
        estimatedMinutes={estimatedMinutes}
        progress={completionPercent}
        className={compact ? 'mt-2' : 'mt-3'}
      />
    </section>
  );
}
