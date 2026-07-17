import type { ReactNode } from 'react';

type ProgressTone = 'success' | 'warning' | 'danger' | 'neutral';

interface CircularProgressBadgeProps {
  value: number;
  label: string;
  tone?: ProgressTone;
  size?: 'xs' | 'sm' | 'md';
  children: ReactNode;
  className?: string;
}

const sizeClassNames = {
  xs: {
    root: 'h-7 w-7',
    icon: 'h-4 w-4',
    stroke: 3.2,
    radius: 13,
  },
  sm: {
    root: 'h-9 w-9',
    icon: 'h-[18px] w-[18px]',
    stroke: 3.5,
    radius: 17,
  },
  md: {
    root: 'h-10 w-10',
    icon: 'h-5 w-5',
    stroke: 3.8,
    radius: 19,
  },
};

const toneClassNames: Record<ProgressTone, { ring: string; track: string; center: string }> = {
  success: {
    ring: 'text-primary-green',
    track: 'text-primary-green/15',
    center: 'border-primary-green/25 bg-primary-green text-white',
  },
  warning: {
    ring: 'text-tertiary-yellow-dark',
    track: 'text-tertiary-yellow/20',
    center: 'border-tertiary-yellow-dark/35 bg-tertiary-yellow text-stone-950',
  },
  danger: {
    ring: 'text-error-red',
    track: 'text-error-red/15',
    center: 'border-error-red/25 bg-error-red text-white',
  },
  neutral: {
    ring: 'text-stone-400',
    track: 'text-stone-200',
    center: 'border-gray-border bg-white text-stone-500',
  },
};

const clampProgress = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function CircularProgressBadge({
  value,
  label,
  tone = 'success',
  size = 'md',
  children,
  className = '',
}: CircularProgressBadgeProps) {
  const progress = clampProgress(value);
  const sizeMeta = sizeClassNames[size];
  const toneMeta = toneClassNames[tone];
  const circumference = 2 * Math.PI * sizeMeta.radius;
  const dashOffset = circumference * (1 - progress / 100);

  return (
    <span
      className={['relative grid shrink-0 place-items-center rounded-full bg-white shadow-sm', sizeMeta.root, className].join(' ')}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      aria-valuetext={`${progress}%`}
    >
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 40 40" aria-hidden="true">
        <circle
          className={toneMeta.track}
          cx="20"
          cy="20"
          r={sizeMeta.radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={sizeMeta.stroke}
        />
        <circle
          className={toneMeta.ring}
          cx="20"
          cy="20"
          r={sizeMeta.radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={sizeMeta.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <span className={['relative z-10 grid rounded-full border place-items-center', sizeMeta.root, toneMeta.center].join(' ')}>
        <span className={sizeMeta.icon}>{children}</span>
      </span>
    </span>
  );
}
