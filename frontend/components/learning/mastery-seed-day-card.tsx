import type { MouseEventHandler } from 'react';
import { MasterySeedBadge } from './mastery-seed-badge';
import { MasterySoilStrip } from './mastery-soil-strip';

interface MasterySeedDayCardProps {
  dayNumber: number;
  displayLabel?: string;
  title: string;
  topic?: string;
  progress: number;
  stateLabel: string;
  badgeLabel?: string;
  selected: boolean;
  state?: 'locked' | 'review';
  onClick: MouseEventHandler<HTMLButtonElement>;
}

export function MasterySeedDayCard({
  dayNumber,
  displayLabel,
  title,
  topic,
  progress,
  stateLabel,
  badgeLabel,
  selected,
  state,
  onClick,
}: MasterySeedDayCardProps) {
  const label = displayLabel || `Day ${dayNumber}`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'group grid min-h-[3.7rem] w-full grid-cols-[2.65rem_minmax(0,1fr)] items-center gap-1.5 rounded-[1.35rem] border bg-white p-1.5 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25 active:scale-[0.99]',
        selected
          ? 'border-primary-green bg-primary-green/10 shadow-[0_8px_18px_rgba(88,204,2,0.10)]'
          : state === 'locked'
            ? 'border-gray-border bg-stone-50 hover:bg-surface-container-low'
            : 'border-gray-border bg-white hover:bg-surface-container-low',
      ].join(' ')}
      aria-pressed={selected}
      aria-label={`Chọn ${label}: ${title}. ${stateLabel}, ${progress}% hoàn thành`}
    >
      <MasterySeedBadge
        progress={progress}
        state={state}
        label={`${label} ${stateLabel}: ${progress}% hoàn thành`}
        size="sm"
        className="relative z-10"
      />
      <span className="min-w-0">
        <span className="flex min-w-0 items-center justify-between gap-2">
          <span className="truncate text-xs font-black leading-tight text-on-background">{label}</span>
          <span
            className={[
              'shrink-0 rounded-full border px-1.5 py-0.5 text-[7px] font-black uppercase',
              selected
                ? 'border-primary-green/30 bg-white text-primary-green-dark'
                : state === 'review'
                  ? 'border-error-red/25 bg-error-red/5 text-error-red-dark'
                  : 'border-gray-border bg-surface-container-low text-stone-500',
            ].join(' ')}
            title={badgeLabel || stateLabel}
          >
            {badgeLabel || stateLabel}
          </span>
        </span>
        {topic ? <span className="mt-0.5 block truncate text-[8px] font-bold text-stone-500">{topic}</span> : null}
        <MasterySoilStrip
          progress={progress}
          state={state}
          label={`Tiến độ ${label}: ${progress}%`}
          className="mt-1.5 h-3"
        />
      </span>
    </button>
  );
}
