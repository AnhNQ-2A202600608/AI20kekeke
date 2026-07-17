import { getLearningSoilStage } from '@/lib/learning-soil-assets';

interface MasterySoilStripProps {
  progress: number;
  state?: 'locked' | 'review';
  label: string;
  className?: string;
}

export function MasterySoilStrip({
  progress,
  state,
  label,
  className = '',
}: MasterySoilStripProps) {
  const asset = getLearningSoilStage(progress, state);

  return (
    <span
      className={['block h-3 w-full', className].join(' ')}
      aria-label={label}
      role="img"
    >
      <picture className="block h-full w-full">
        <source srcSet={asset.webp} type="image/webp" />
        <img
          src={asset.png}
          alt=""
          className="h-full w-full object-fill"
          draggable={false}
          loading="lazy"
        />
      </picture>
    </span>
  );
}
