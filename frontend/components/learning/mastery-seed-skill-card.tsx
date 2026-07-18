import type { MouseEventHandler } from 'react';
import { MasterySeedBadge } from './mastery-seed-badge';
import { MasterySoilStrip } from './mastery-soil-strip';

interface MasterySeedSkillCardProps {
  title: string;
  progress: number;
  stateLabel: string;
  selected: boolean;
  state?: 'locked' | 'review';
  compact?: boolean;
  index?: number;
  ariaLabel?: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
}

export function MasterySeedSkillCard({
  title,
  progress,
  stateLabel,
  selected,
  state,
  compact = false,
  index,
  ariaLabel,
  onClick,
}: MasterySeedSkillCardProps) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel || `${title}. ${stateLabel}. Tiến độ ${progress}%`}
        title={title}
        className={[
          'group relative flex h-10 w-10 shrink-0 items-center justify-center justify-self-center rounded-full border transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25 active:scale-[0.98]',
          selected ? 'border-primary-green bg-primary-green/10 shadow-sm' : 'border-gray-border bg-white hover:bg-surface-container-low',
        ].join(' ')}
        role="option"
        aria-selected={selected}
      >
        <MasterySeedBadge
          progress={progress}
          state={state}
          label={`${title}: ${progress}% mastery`}
          size="xs"
        />
        {typeof index === 'number' ? (
          <span className="absolute right-[-0.15rem] top-[-0.15rem] grid h-4 min-w-4 place-items-center rounded-full border border-white bg-surface-container-low px-1 text-[8px] font-black text-stone-600 shadow-sm">
            {index + 1}
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel || `${title}. ${stateLabel}. Tiến độ ${progress}%`}
      aria-pressed={selected}
      title={title}
      className={[
        'flex h-16 min-w-24 cursor-pointer flex-col items-center justify-center rounded-[1.6rem] border p-2 text-center transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25',
        selected ? 'border-primary-green bg-primary-green/5' : 'border-gray-border bg-white hover:bg-surface-container-low',
      ].join(' ')}
    >
      <MasterySeedBadge
        progress={progress}
        state={state}
        label={`${title}: ${progress}% mastery`}
        size="xs"
      />
      <span className="mt-1 block max-w-full truncate text-[10px] font-black text-on-background">
        {stateLabel} • {progress}%
      </span>
      <MasterySoilStrip
        progress={progress}
        state={state}
        label={`${title}: soil progress ${progress}%`}
        className="mt-1 h-2.5"
      />
    </button>
  );
}
