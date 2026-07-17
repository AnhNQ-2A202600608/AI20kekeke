import { Check, Lock, Target } from 'lucide-react';
import type { ProgramDay } from '@/lib/quiz/types';

export type DayVisualState = 'complete' | 'active' | 'preview' | 'weak';

interface DayNavigatorProps {
  days: ProgramDay[];
  selectedDayId: string;
  getDayState: (day: ProgramDay) => DayVisualState;
  onSelectDay: (day: ProgramDay) => void;
}

const stateClass: Record<DayVisualState, string> = {
  complete: 'border-tertiary-yellow-dark bg-tertiary-yellow text-stone-950',
  active: 'border-primary-green-dark bg-primary-green text-white',
  weak: 'border-error-red bg-error-red text-white',
  preview: 'border-gray-border bg-white text-stone-500',
};

export function DayNavigator({ days, selectedDayId, getDayState, onSelectDay }: DayNavigatorProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-fraunces text-base font-black text-on-background">Chọn ngày học</h2>
          <p className="text-[11px] font-semibold text-stone-500">Bấm trực tiếp vào ngày để mở bài làm và concept.</p>
        </div>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0">
        <div className="grid min-w-max grid-flow-col auto-cols-[76px] gap-2 md:min-w-0 md:grid-flow-row md:grid-cols-8 lg:grid-cols-12">
          {days.map((day) => {
            const state = getDayState(day);
            const isSelected = selectedDayId === day.id;

            return (
              <button
                key={day.id}
                type="button"
                onClick={() => onSelectDay(day)}
                className={[
                  'relative flex h-[76px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-b-[5px] text-center transition active:translate-y-1 active:border-b-2',
                  stateClass[state],
                  isSelected ? 'ring-4 ring-primary-green/25' : '',
                ].join(' ')}
                aria-pressed={isSelected}
              >
                <span className="text-[10px] font-black uppercase opacity-75">Day</span>
                <span className="text-xl font-black leading-none">{day.dayNumber}</span>
                <span className="mt-1 h-4">
                  {state === 'complete' && <Check className="h-3.5 w-3.5 stroke-[4]" />}
                  {state === 'active' && <Target className="h-3.5 w-3.5 stroke-[3]" />}
                  {state === 'weak' && <Target className="h-3.5 w-3.5 stroke-[3]" />}
                  {state === 'preview' && day.concepts.every((concept) => concept.setIds.length === 0) && (
                    <Lock className="h-3.5 w-3.5 stroke-[3]" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
