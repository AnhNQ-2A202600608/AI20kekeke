import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LearningPulseBlockProps {
  completedCount: number;
  totalCount: number;
  activeIndex?: number;
  className?: string;
}

export function LearningPulseBlock({
  completedCount,
  totalCount,
  activeIndex = 0,
  className,
}: LearningPulseBlockProps) {
  const safeTotal = Math.max(1, totalCount);
  const days = Array.from({ length: safeTotal }, (_, index) => index);
  const stableCount = Math.max(0, Math.min(completedCount, safeTotal));

  return (
    <section
      className={cn('rounded-2xl border border-gray-border bg-surface-container-low p-3', className)}
      aria-label={`Nhịp học tuần này: ${stableCount}/${safeTotal} ngày`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-black text-on-background">
            <BarChart3 className="h-4 w-4 text-primary-green-dark" aria-hidden="true" />
            Learning Pulse
          </p>
          <p className="mt-1 text-[10px] font-semibold leading-4 text-stone-500">
            Nhịp học tốt đang hình thành.
          </p>
        </div>
        <p className="shrink-0 text-[10px] font-black text-stone-500">{stableCount}/{safeTotal}</p>
      </div>

      <div className="mt-3 flex items-end gap-2" aria-hidden="true">
        {days.map((index) => {
          const isComplete = index < stableCount;
          const isActive = index === activeIndex;

          return (
            <span key={index} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span
                className={cn(
                  'block w-full max-w-4 rounded-full transition-all',
                  isComplete ? 'bg-primary-green' : isActive ? 'bg-primary-green-light' : 'bg-gray-border',
                )}
                style={{ height: `${isComplete ? 22 : isActive ? 18 : 12}px` }}
              />
              <span className="text-[8px] font-black text-stone-400">{index + 1}</span>
            </span>
          );
        })}
      </div>
    </section>
  );
}
