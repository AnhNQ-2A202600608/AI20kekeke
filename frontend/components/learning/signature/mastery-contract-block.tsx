import { GraduationCap } from 'lucide-react';
import type { ProgramDay } from '@/lib/quiz/types';
import { cn } from '@/lib/utils';

interface MasteryContractBlockProps {
  day: ProgramDay;
  className?: string;
}

export function MasteryContractBlock({ day, className }: MasteryContractBlockProps) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-primary-green/20 bg-white p-3 shadow-sm',
        className,
      )}
      aria-label="Mục tiêu học hôm nay"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary-green/20 bg-primary-green/10 text-primary-green-dark">
          <GraduationCap className="h-5 w-5 stroke-[3]" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-wide text-stone-400">Sau hôm nay bạn sẽ biết</p>
          <p className="mt-1 text-xs font-black leading-5 text-on-background">{day.outcome}</p>
        </div>
      </div>
    </section>
  );
}
