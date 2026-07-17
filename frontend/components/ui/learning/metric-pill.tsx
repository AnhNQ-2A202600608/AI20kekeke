import React from 'react';

interface MetricPillProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  tone?: 'green' | 'orange' | 'blue' | 'yellow' | 'neutral' | 'red';
  icon?: React.ReactNode;
}

const toneClass = {
  green: 'border-primary-green/25 bg-primary-green/10 text-primary-green-dark',
  orange: 'border-accent-orange/25 bg-accent-orange-light/25 text-accent-orange-dark',
  blue: 'border-primary-blue/25 bg-primary-blue-light text-primary-blue-dark',
  yellow: 'border-tertiary-yellow/30 bg-tertiary-yellow/15 text-tertiary-yellow-dark',
  neutral: 'border-gray-border bg-white text-stone-700',
  red: 'border-error-red/25 bg-error-red-light/30 text-error-red-dark',
};

export const MetricPill: React.FC<MetricPillProps> = ({
  label,
  value,
  tone = 'neutral',
  icon,
  className = '',
  ...props
}) => (
  <div
    className={[
      'inline-flex min-h-10 items-center gap-2 rounded-full border-2 px-3 py-1.5 shadow-sm',
      toneClass[tone],
      className,
    ].join(' ')}
    {...props}
  >
    {icon ? <span className="flex h-5 w-5 shrink-0 items-center justify-center">{icon}</span> : null}
    <span className="text-[10px] font-black uppercase text-stone-500">{label}</span>
    <span className="font-mono text-sm font-black text-current">{value}</span>
  </div>
);

export default MetricPill;
