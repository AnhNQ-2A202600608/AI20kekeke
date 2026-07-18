import { Dumbbell, Lock, Star } from 'lucide-react';
import type { QuestionSet, Skill } from '@/lib/quiz/types';

interface PracticeSetListProps {
  conceptId: string;
  sets: QuestionSet[];
  adapterSkill: Skill;
  completedSets: string[];
  recommendedSetId?: string;
  onStartPractice: (skill: Skill, targetSetId?: string) => void;
}

export function PracticeSetList({
  sets,
  adapterSkill,
  completedSets,
  recommendedSetId,
  onStartPractice,
}: PracticeSetListProps) {
  if (sets.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-border bg-stone-50 px-4 py-4 text-center">
        <Lock className="mx-auto h-5 w-5 text-stone-400" />
        <p className="mt-2 text-xs font-black uppercase text-stone-500">Bài luyện sắp mở</p>
        <p className="mt-1 text-[11px] font-semibold text-stone-400">Concept này đã có vị trí trong lộ trình nhưng chưa gắn question set.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {sets.map((set) => {
        const isComplete = completedSets.includes(set.id);
        const isRecommended = recommendedSetId === set.id;

        return (
          <button
            key={set.id}
            type="button"
            onClick={() => onStartPractice(adapterSkill, set.id)}
            className={[
              'cursor-pointer rounded-2xl border-2 border-b-[5px] bg-white p-4 text-left transition hover:border-primary-green/70 active:translate-y-1 active:border-b-2',
              isRecommended ? 'border-accent-orange bg-orange-50' : 'border-gray-border',
            ].join(' ')}
          >
            <div className="flex items-start gap-3">
              <span className={[
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white',
                isComplete ? 'bg-tertiary-yellow text-stone-950' : isRecommended ? 'bg-accent-orange' : 'bg-primary-green',
              ].join(' ')}>
                {isRecommended ? <Star className="h-4 w-4 fill-current" /> : <Dumbbell className="h-4 w-4 stroke-[3]" />}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-black leading-tight text-on-background">{set.title}</span>
                <span className="mt-1 line-clamp-2 block text-[11px] font-semibold leading-relaxed text-stone-500">{set.description}</span>
                <span className="mt-2 block text-[10px] font-black uppercase text-primary-green-dark">
                  {isComplete ? 'Đã hoàn thành' : isRecommended ? 'Nên luyện trước' : 'Bắt đầu luyện'}
                </span>
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
