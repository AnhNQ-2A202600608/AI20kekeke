import { Heart } from 'lucide-react';
import { SofiMascot } from '@/components/brand/sofi-mascot';
import type { ProgramConcept, ProgramDay } from '@/lib/quiz/types';
import { cn } from '@/lib/utils';

type SofiCheckInState = 'active' | 'weak' | 'complete' | 'preview';

interface SofiCheckInBlockProps {
  day: ProgramDay;
  concept?: ProgramConcept;
  state?: SofiCheckInState;
  className?: string;
}

function getCopy(day: ProgramDay, concept?: ProgramConcept, state: SofiCheckInState = 'active') {
  const dayLabel = day.displayLabel || `Day ${day.dayNumber}`;

  if (state === 'weak') {
    return {
      title: 'Sofi nhắc nhẹ',
      body: concept ? `Ôn lại ${concept.title} trước khi làm bài tiếp theo.` : 'Chọn điểm cần ôn nhất rồi làm một bài ngắn.',
    };
  }

  if (state === 'complete') {
    return {
      title: 'Sofi ghi nhận',
      body: `${dayLabel} đã ổn. Chuyển tiếp khi bạn còn năng lượng.`,
    };
  }

  if (state === 'preview') {
    return {
      title: 'Sofi mở đường',
      body: 'Phần này sẽ rõ hơn sau khi bạn hoàn thành bước trước.',
    };
  }

  return {
    title: 'Sofi nhắc nhẹ',
    body: concept
      ? `Hiểu ${concept.title} trước, làm quiz sẽ dễ hơn.`
      : 'Hiểu pipeline trước, làm quiz sẽ dễ hơn.',
  };
}

export function SofiCheckInBlock({ day, concept, state = 'active', className }: SofiCheckInBlockProps) {
  const copy = getCopy(day, concept, state);

  return (
    <section
      className={cn('rounded-2xl border border-tertiary-yellow/35 bg-white p-3 shadow-sm', className)}
      aria-label="Sofi check-in"
    >
      <div className="flex items-center gap-3">
        <SofiMascot size={48} expression={state === 'weak' ? 'thinking' : 'smile'} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[11px] font-black text-on-background">
            {copy.title}
            <Heart className="h-3.5 w-3.5 fill-tertiary-yellow text-tertiary-yellow-dark" aria-hidden="true" />
          </p>
          <p className="mt-1 text-[11px] font-semibold leading-5 text-stone-600">{copy.body}</p>
        </div>
      </div>
    </section>
  );
}
