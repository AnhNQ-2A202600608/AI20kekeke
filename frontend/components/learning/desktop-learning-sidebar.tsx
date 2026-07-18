'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ProgramDay, ProgramPhase, ProgramTrack } from '@/lib/quiz/types';
import type { RoadmapDayState } from './program-roadmap';
import { MasterySeedBadge } from './mastery-seed-badge';
import { MasterySeedDayCard } from './mastery-seed-day-card';
import { inferPipelineStep } from './signature/pipeline-day-label';

interface DesktopLearningSidebarProps {
  phases: ProgramPhase[];
  tracks: ProgramTrack[];
  days: ProgramDay[];
  selectedDayId: string;
  selectedTrackId: string;
  isDrawerOpen: boolean;
  onToggleDrawer: () => void;
  onSelectDay: (day: ProgramDay) => void;
  onSelectTrack: (trackId: string) => void;
  getDayState: (day: ProgramDay) => RoadmapDayState;
  getDayProgress: (day: ProgramDay) => number;
}

const weekRanges = [
  { id: 'week-1', title: 'tuần 1', label: 'W1', range: '1-7', from: 1, to: 7 },
  { id: 'week-2', title: 'tuần 2', label: 'W2', range: '8-14', from: 8, to: 14 },
  { id: 'midterm', title: 'giữa kỳ', label: 'GK', range: 'Ôn thi', from: 15.5, to: 15.5 },
  { id: 'week-3', title: 'tuần 3', label: 'W3', range: '15-21', from: 15, to: 21 },
  { id: 'week-4', title: 'tuần 4', label: 'W4', range: '22-28', from: 22, to: 28 },
];

const stateMeta: Record<RoadmapDayState, { label: string; seedState?: 'locked' | 'review' }> = {
  active: {
    label: 'Hôm nay',
  },
  complete: {
    label: 'Đã hoàn thành',
  },
  weak: {
    label: 'Cần ôn',
    seedState: 'review',
  },
  preview: {
    label: 'Sắp mở khóa',
    seedState: 'locked',
  },
};

const getWeekIdForDay = (dayNumber: number) =>
  weekRanges.find((week) => dayNumber >= week.from && dayNumber <= week.to)?.id || 1;

export function DesktopLearningSidebar({
  phases,
  tracks,
  days,
  selectedDayId,
  selectedTrackId,
  isDrawerOpen,
  onToggleDrawer,
  onSelectDay,
  onSelectTrack,
  getDayState,
  getDayProgress,
}: DesktopLearningSidebarProps) {
  const selectedDay = days.find((day) => day.id === selectedDayId) || days[0];
  const [activeWeekId, setActiveWeekId] = useState(() => getWeekIdForDay(selectedDay?.dayNumber || 1));
  const activeWeek = weekRanges.find((week) => week.id === activeWeekId) || weekRanges[0];
  const activeWeekDays = useMemo(
    () =>
      days.filter((day) => {
        const isInRange = day.dayNumber >= activeWeek.from && day.dayNumber <= activeWeek.to;
        if (!isInRange) return false;
        return activeWeek.id === 'midterm' ? day.phaseId === 'midterm' : day.phaseId !== 'midterm';
      }),
    [activeWeek.from, activeWeek.id, activeWeek.to, days],
  );
  const phase = phases.find((item) => item.id === selectedDay?.phaseId) || phases[0];
  const needsTrackSelector = activeWeek.to >= 17;
  const completedInWeek = activeWeekDays.filter((day) => getDayProgress(day) >= 75).length;
  const weekProgressPercent = Math.round((completedInWeek / Math.max(1, activeWeekDays.length)) * 100);

  const handleSelectWeek = (weekId: string) => {
    const nextWeek = weekRanges.find((week) => week.id === weekId) || weekRanges[0];
    const firstDay = days.find((day) => {
      const isInRange = day.dayNumber >= nextWeek.from && day.dayNumber <= nextWeek.to;
      if (!isInRange) return false;
      return nextWeek.id === 'midterm' ? day.phaseId === 'midterm' : day.phaseId !== 'midterm';
    });
    setActiveWeekId(weekId);
    if (firstDay) onSelectDay(firstDay);
  };

  return (
    <aside
      data-tour-id="learning-path"
      className={[
        'flex min-h-0 flex-col rounded-[1.4rem] border border-gray-border bg-white p-2.5 shadow-sm transition-all duration-200',
        isDrawerOpen ? '' : 'items-center',
      ].join(' ')}
    >
      <div className={['relative pb-2.5', isDrawerOpen ? 'border-b border-gray-border/70' : 'w-full'].join(' ')}>
        {isDrawerOpen ? (
        <div className="pointer-events-none absolute right-1 top-[-0.25rem] z-20 h-[clamp(2.75rem,4vw,3.35rem)] w-[clamp(2.75rem,4vw,3.35rem)] overflow-visible" aria-hidden="true">
          <Image
            src="/mascot/sofi/512/mentora-fox-idle-welcome.webp"
            alt=""
            width={512}
            height={512}
            sizes="(min-width: 1280px) 54px, 44px"
            className="h-full w-full object-contain object-top drop-shadow-[0_8px_14px_rgba(23,30,18,0.12)]"
            priority
          />
        </div>
        ) : null}
        <button
          type="button"
          onClick={onToggleDrawer}
          className={[
            'relative z-10 flex cursor-pointer items-center rounded-2xl bg-white/70 transition hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/20',
            isDrawerOpen
              ? 'min-h-12 w-full justify-between gap-3 py-1 pl-1 pr-12 text-left'
              : 'mx-auto grid h-12 w-12 place-items-center rounded-full border border-primary-green/20 bg-white shadow-sm',
          ].join(' ')}
          aria-expanded={isDrawerOpen}
          aria-controls="desktop-learning-week-drawer"
          title={isDrawerOpen ? 'Thu gọn lộ trình' : 'Mở lộ trình'}
        >
          {isDrawerOpen ? (
          <>
            <div className="min-w-0">
              <h2 className="text-sm font-black leading-tight text-on-background">Lộ trình {activeWeek.title}</h2>
              <p className="mt-0.5 text-[11px] font-semibold text-stone-500">{phase.shortTitle}</p>
            </div>
            <ChevronLeft
              className="h-4 w-4 shrink-0 text-stone-500"
              aria-hidden="true"
            />
          </>
          ) : (
          <span className="relative grid h-10 w-10 place-items-center">
            <Image
              src="/mascot/sofi/512/mentora-fox-idle-welcome.webp"
              alt=""
              width={512}
              height={512}
              sizes="40px"
              className="h-full w-full object-contain object-top drop-shadow-[0_8px_14px_rgba(23,30,18,0.12)]"
              priority
            />
            <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border border-primary-green/20 bg-white text-primary-green-dark shadow-sm">
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
            </span>
          </span>
          )}
        </button>
      </div>

      {isDrawerOpen && (
        <div id="desktop-learning-week-drawer" className="contents">
          <div className="learning-scrollbar relative min-h-0 flex-1 overflow-y-auto overscroll-contain py-1.5 pr-1">
            <div className="absolute bottom-6 left-[1.1rem] top-6 w-0.5 rounded-full bg-gray-border" aria-hidden="true" />
            <div
              className="absolute left-[1.1rem] top-6 w-0.5 rounded-full bg-primary-green transition-all"
              style={{ height: `calc((100% - 3rem) * ${weekProgressPercent / 100})` }}
              aria-hidden="true"
            />
            <div className="relative space-y-1">
            {activeWeekDays.map((day) => {
              const selected = day.id === selectedDayId;
              const state = getDayState(day);
              const progress = getDayProgress(day);
              const { label, seedState } = stateMeta[state];
              const stepLabel = inferPipelineStep(day).label;

              return (
                <MasterySeedDayCard
                  key={day.id}
                  dayNumber={day.dayNumber}
                  displayLabel={day.displayLabel}
                  title={day.title}
                  topic={day.title}
                  progress={progress}
                  stateLabel={label}
                  badgeLabel={stepLabel}
                  selected={selected}
                  state={seedState}
                  onClick={() => onSelectDay(day)}
                />
              );
            })}
            </div>
          </div>

          {needsTrackSelector && (
            <div className="mb-3 rounded-2xl border border-gray-border bg-surface-container-low p-1">
              <div className="grid grid-cols-3 gap-1">
                {tracks.map((track) => {
                  const selected = track.id === selectedTrackId;
                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => onSelectTrack(track.id)}
                      className={[
                        'min-h-10 rounded-xl px-2 text-[10px] font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25',
                        selected ? 'bg-white text-secondary-green-dark shadow-sm' : 'text-stone-500 hover:bg-white/70',
                      ].join(' ')}
                    >
                      {track.shortTitle}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-5 gap-1 border-t border-gray-border/70 pt-2">
            {weekRanges.map((week) => {
              const selected = week.id === activeWeekId;
              return (
                <button
                  key={week.id}
                  type="button"
                  onClick={() => handleSelectWeek(week.id)}
                  className={[
                    'rounded-xl border px-1.5 py-1 text-center transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25 active:scale-[0.98]',
                    selected ? 'border-primary-green bg-primary-green text-white' : 'border-gray-border bg-white text-stone-600',
                  ].join(' ')}
                >
                  <span className="block text-[10px] font-black uppercase">{week.label}</span>
                  <span className={['block text-[9px] font-bold', selected ? 'text-white/80' : 'text-stone-400'].join(' ')}>
                    {week.range}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!isDrawerOpen && (
        <div
          id="desktop-learning-week-drawer"
          className="relative mt-1 flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto overflow-x-visible px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="absolute left-1/2 top-5 h-[calc(7*2.75rem+6*0.5rem-1rem)] max-h-[calc(100%-2rem)] w-1 -translate-x-1/2 rounded-full bg-primary-green/10" aria-hidden="true" />
          <div
            className="absolute left-1/2 top-5 w-1 -translate-x-1/2 rounded-full bg-primary-green transition-all duration-300"
            style={{
              height: `calc(min(100% - 2rem, 7 * 2.75rem + 6 * 0.5rem - 1rem) * ${weekProgressPercent / 100})`,
            }}
            aria-hidden="true"
          />
          {activeWeekDays.map((day) => {
            const selected = day.id === selectedDayId;
            const state = getDayState(day);
            const progress = getDayProgress(day);
            const { label, seedState } = stateMeta[state];

            return (
              <button
                key={day.id}
                type="button"
                onClick={() => onSelectDay(day)}
                className={[
                  'group relative z-10 grid h-11 w-11 shrink-0 cursor-pointer place-items-center overflow-visible rounded-full border bg-white shadow-sm transition duration-150 hover:-translate-y-0.5 hover:border-primary-green hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25 active:scale-[0.96]',
                  selected
                    ? 'border-primary-green ring-2 ring-primary-green/20'
                    : 'border-gray-border hover:border-primary-green/40',
                ].join(' ')}
                aria-label={`Chọn ${day.displayLabel || `ngày ${day.dayNumber}`}: ${day.title}. ${label}, ${progress}% hoàn thành`}
                aria-pressed={selected}
                title={`${day.displayLabel || `Day ${day.dayNumber}`}: ${day.title}`}
              >
                <MasterySeedBadge
                  progress={progress}
                  state={seedState}
                  size="xs"
                  label={`${day.displayLabel || `Day ${day.dayNumber}`} ${label}: ${progress}% hoàn thành`}
                  className="transition-transform duration-150 group-hover:scale-105"
                />
                <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full border border-primary-green/20 bg-white px-1 text-[8px] font-black text-primary-green-dark transition-colors group-hover:border-primary-green group-hover:bg-primary-green group-hover:text-white">
                  {day.displayLabel || day.dayNumber}
                </span>
              </button>
            );
          })}
        </div>
      )}

    </aside>
  );
}
