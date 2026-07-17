'use client';

import { useMemo, useState } from 'react';
import { Check, Lock, Target } from 'lucide-react';
import type { ProgramDay, ProgramPhase, ProgramTrack } from '@/lib/quiz/types';

export type RoadmapDayState = 'complete' | 'active' | 'weak' | 'preview';

interface ProgramRoadmapProps {
  phases: ProgramPhase[];
  tracks: ProgramTrack[];
  days: ProgramDay[];
  selectedDayId: string;
  selectedTrackId: string;
  onSelectDay: (day: ProgramDay) => void;
  onSelectTrack: (trackId: string) => void;
  getDayState: (day: ProgramDay) => RoadmapDayState;
  getDayProgress: (day: ProgramDay) => number;
}

const weekRanges = [
  { id: 'week-1', label: 'Tuần 1', range: 'Ngày 1-7', from: 1, to: 7 },
  { id: 'week-2', label: 'Tuần 2', range: 'Ngày 8-14', from: 8, to: 14 },
  { id: 'midterm', label: 'Giữa kỳ', range: 'Ôn thi', from: 15.5, to: 15.5 },
  { id: 'week-3', label: 'Tuần 3', range: 'Ngày 15-21', from: 15, to: 21 },
  { id: 'week-4', label: 'Tuần 4', range: 'Ngày 22-28', from: 22, to: 28 },
];

const tileClass: Record<RoadmapDayState, string> = {
  complete: 'border-tertiary-yellow-dark bg-tertiary-yellow text-stone-950',
  active: 'border-primary-green-dark bg-primary-green text-white',
  weak: 'border-error-red-dark bg-error-red text-white',
  preview: 'border-gray-border-dark bg-white text-stone-500',
};

const DayIcon = ({ state }: { state: RoadmapDayState }) => {
  if (state === 'complete') return <Check className="h-4 w-4 stroke-[4]" />;
  if (state === 'preview') return <Lock className="h-3.5 w-3.5 stroke-[3]" />;
  return <Target className="h-4 w-4 stroke-[3]" />;
};

const getWeekIdForDay = (dayNumber: number) => {
  const week = weekRanges.find((item) => dayNumber >= item.from && dayNumber <= item.to);
  return week?.id || 1;
};

export function ProgramRoadmap({
  phases,
  tracks,
  days,
  selectedDayId,
  selectedTrackId,
  onSelectDay,
  onSelectTrack,
  getDayState,
  getDayProgress,
}: ProgramRoadmapProps) {
  const selectedDay = days.find((day) => day.id === selectedDayId) || days[0];
  const [activeWeekId, setActiveWeekId] = useState(() => getWeekIdForDay(selectedDay?.dayNumber || 1));
  const selectedDayLabel = selectedDay?.displayLabel || `Day ${selectedDay?.dayNumber || 1}`;

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
    <section className="flex h-full w-full max-w-full flex-col rounded-2xl border border-gray-border bg-white p-3 shadow-sm md:p-4">
      <div className="mb-3 shrink-0 border-b border-gray-border/70 pb-3">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wide text-primary-green-dark">Tuần đang học</p>
            <h2 className="mt-0.5 font-fraunces text-lg font-black leading-tight text-on-background">
              {activeWeek.label}
            </h2>
          </div>
          <div className="min-w-0 text-right">
            <p className="truncate text-[10px] font-black uppercase text-stone-400">{phase.shortTitle}</p>
            <p className="font-mono text-xs font-black text-on-background">{selectedDayLabel}</p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7 lg:grid-cols-4 xl:grid-cols-4">
          {activeWeekDays.map((day) => {
            const state = getDayState(day);
            const selected = day.id === selectedDayId;
            const progress = getDayProgress(day);

            return (
              <button
                key={day.id}
                type="button"
                onClick={() => onSelectDay(day)}
                className={[
                  'group flex aspect-square min-w-0 cursor-pointer flex-col items-center justify-center rounded-xl border p-2 text-center transition-colors hover:bg-white active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25',
                  selected ? 'border-primary-green bg-primary-green/10 text-primary-green-dark' : 'border-gray-border bg-surface-container-low text-stone-600',
                ].join(' ')}
                aria-label={`Chọn ${day.displayLabel || `Day ${day.dayNumber}`}: ${day.title}`}
                title={`${day.displayLabel || `Day ${day.dayNumber}`}: ${day.title}`}
              >
                <span
                  className={['flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border', tileClass[state]].join(' ')}
                >
                    <DayIcon state={state} />
                </span>
                <span className="mt-1.5 block text-[9px] font-black uppercase tracking-wide text-primary-green-dark">
                  {day.displayLabel ? 'Ôn' : 'Day'}
                </span>
                <span className="font-mono text-sm font-black leading-none text-on-background">{day.displayLabel || day.dayNumber}</span>
                <span className="mt-1 font-mono text-[9px] font-black text-stone-400">{progress}%</span>
              </button>
            );
          })}
        </div>
      </div>

      {needsTrackSelector && (
        <div className="mt-3 shrink-0 rounded-xl border border-gray-border bg-surface-container-low p-1">
          <div className="grid grid-cols-3 gap-1">
            {tracks.map((track) => {
              const selected = track.id === selectedTrackId;
              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => onSelectTrack(track.id)}
                  className={[
                    'min-h-11 cursor-pointer rounded-xl px-2 py-2 text-[10px] font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25',
                    selected
                      ? 'bg-white text-secondary-green-dark shadow-sm'
                      : 'text-stone-500 hover:bg-white/60 hover:text-on-background',
                  ].join(' ')}
                >
                  {track.shortTitle}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-3 shrink-0 grid grid-cols-2 gap-2 sm:grid-cols-5 lg:grid-cols-2 xl:grid-cols-5">
        {weekRanges.map((week) => {
          const selected = week.id === activeWeekId;
          return (
            <button
              key={week.id}
              type="button"
              onClick={() => handleSelectWeek(week.id)}
              className={[
                'min-h-12 cursor-pointer rounded-xl border px-2 py-2 text-left transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25',
                selected
                  ? 'border-primary-green bg-primary-green text-white'
                  : 'border-gray-border bg-white text-stone-600 hover:bg-surface-container-low',
              ].join(' ')}
            >
              <span className="block text-[10px] font-black uppercase">{week.label}</span>
              <span className={['mt-0.5 block text-[9px] font-bold', selected ? 'text-white/80' : 'text-stone-400'].join(' ')}>
                {week.range.replace('Ngày ', '')}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
