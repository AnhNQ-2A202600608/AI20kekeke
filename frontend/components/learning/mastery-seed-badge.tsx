import { getLearningSeedStage } from '@/lib/learning-seed-assets';

interface MasterySeedBadgeProps {
  progress: number;
  state?: 'locked' | 'review';
  size?: 'xs' | 'sm' | 'md';
  label: string;
  className?: string;
}

const sizeClassName = {
  xs: 'h-8 w-8',
  sm: 'h-10 w-10',
  md: 'h-12 w-12',
};

export function MasterySeedBadge({
  progress,
  state,
  size = 'sm',
  label,
  className = '',
}: MasterySeedBadgeProps) {
  const asset = getLearningSeedStage(progress, state);

  return (
    <span
      className={[
        'relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-primary-green/25 bg-primary-green/5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.68)]',
        sizeClassName[size],
        className,
      ].join(' ')}
      aria-label={label}
      role="img"
    >
      <picture className="block h-full w-full">
        <source srcSet={asset.webp} type="image/webp" />
        <img
          src={asset.png}
          alt=""
          className="h-full w-full object-contain"
          draggable={false}
          loading="lazy"
        />
      </picture>
    </span>
  );
}
