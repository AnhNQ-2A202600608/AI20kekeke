import { BookOpen, Clock3, Sprout } from 'lucide-react';
import { MasterySeedBadge } from './mastery-seed-badge';

interface TodayMissionCapsuleProps {
  concepts: number;
  practices: number;
  estimatedMinutes: number;
  progress: number;
  className?: string;
}

export function TodayMissionCapsule({
  concepts,
  estimatedMinutes,
  progress,
  className = '',
}: TodayMissionCapsuleProps) {
  const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));
  const complete = safeProgress >= 100;
  const summaryLabel = `Hôm nay: ${concepts} concept, khoảng ${estimatedMinutes} phút, tiến độ ${safeProgress} phần trăm`;

  return (
    <div
      className={[
        'relative z-10 grid min-h-[3.25rem] min-w-0 items-center gap-2 rounded-2xl border border-primary-green/20 bg-surface-container-low/80 p-2 shadow-sm shadow-primary-green/5 backdrop-blur-sm sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:rounded-full sm:py-1.5 sm:pl-2 sm:pr-2.5',
        className,
      ].join(' ')}
      aria-label={summaryLabel}
    >
      <div className="flex min-w-0 items-center gap-2">
        <MasterySeedBadge
          progress={safeProgress}
          label={`Tiến độ nhiệm vụ hôm nay: ${safeProgress}%`}
          size="xs"
          className="bg-white"
        />
        <div className="min-w-0 sm:hidden">
          <p className="text-[10px] font-black uppercase tracking-wide text-primary-green-dark">Hôm nay</p>
          <p className="text-xs font-black leading-tight text-on-background">{safeProgress}% tiến độ</p>
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-black text-stone-600">
          <span className="inline-flex min-w-0 items-center gap-1">
            <BookOpen className="h-3 w-3 shrink-0 text-primary-green-dark" aria-hidden="true" />
            <span className="whitespace-nowrap">{concepts} concept</span>
          </span>
          <span className="inline-flex min-w-0 items-center gap-1">
            <Clock3 className="h-3 w-3 shrink-0 text-stone-500" aria-hidden="true" />
            <span className="whitespace-nowrap">~{estimatedMinutes} phút</span>
          </span>
        </div>

        <div
          className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white shadow-inner"
          role="progressbar"
          aria-label="Tiến độ nhiệm vụ hôm nay"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={safeProgress}
        >
          <div
            className="h-full rounded-full bg-primary-green transition-[width] duration-300 ease-out"
            style={{ width: `${safeProgress}%` }}
          />
        </div>
      </div>

      <div className="hidden shrink-0 items-center gap-1.5 rounded-full border border-primary-green/25 bg-white px-2.5 py-1.5 text-primary-green-dark sm:inline-flex">
        <Sprout className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="text-xs font-black tabular-nums">{safeProgress}%</span>
        <span className="hidden text-[10px] font-black uppercase text-stone-500 md:inline">
          {complete ? 'xong' : 'tiến độ'}
        </span>
      </div>
    </div>
  );
}
