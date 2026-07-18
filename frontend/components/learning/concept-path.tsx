import { forwardRef } from 'react';
import { AlertTriangle, Check, CircleDot, Lock } from 'lucide-react';
import type { ProgramConcept, QuestionSet, Skill } from '@/lib/quiz/types';
import { PracticeSetList } from './practice-set-list';

export type ConceptVisualState = 'mastered' | 'learning' | 'weak' | 'not-started' | 'empty';

export interface ConceptPathItem {
  concept: ProgramConcept;
  sets: QuestionSet[];
  adapterSkill: Skill;
  state: ConceptVisualState;
  progress: number;
  recommendedSetId?: string;
}

interface ConceptPathProps {
  items: ConceptPathItem[];
  activeConceptId?: string;
  completedSets: string[];
  onStartPractice: (skill: Skill, targetSetId?: string) => void;
  setConceptRef: (conceptId: string, node: HTMLElement | null) => void;
}

const stateStyle: Record<ConceptVisualState, { node: string; label: string; icon: React.ReactNode }> = {
  mastered: {
    node: 'border-tertiary-yellow-dark bg-tertiary-yellow text-stone-950',
    label: 'Đã ổn định',
    icon: <Check className="h-5 w-5 stroke-[4]" />,
  },
  learning: {
    node: 'border-primary-green-dark bg-primary-green text-white',
    label: 'Đang học',
    icon: <CircleDot className="h-5 w-5 stroke-[3]" />,
  },
  weak: {
    node: 'border-error-red bg-error-red text-white',
    label: 'Cần củng cố',
    icon: <AlertTriangle className="h-5 w-5 stroke-[3]" />,
  },
  'not-started': {
    node: 'border-gray-border bg-white text-stone-500',
    label: 'Chưa học',
    icon: <CircleDot className="h-5 w-5 stroke-[3]" />,
  },
  empty: {
    node: 'border-gray-border bg-stone-100 text-stone-400',
    label: 'Sắp mở',
    icon: <Lock className="h-5 w-5 stroke-[3]" />,
  },
};

const ConceptCard = forwardRef<HTMLElement, {
  item: ConceptPathItem;
  isActive: boolean;
  completedSets: string[];
  onStartPractice: (skill: Skill, targetSetId?: string) => void;
}>(({ item, isActive, completedSets, onStartPractice }, ref) => {
  const style = stateStyle[item.state];

  return (
    <article
      ref={ref}
      className={[
        'scroll-mt-28 rounded-[1.25rem] border-2 border-gray-border border-b-[5px] bg-white p-4 shadow-sm transition',
        isActive ? 'ring-4 ring-accent-orange/25' : '',
      ].join(' ')}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="flex md:w-[220px] md:shrink-0">
          <div className="flex gap-3">
            <span className={[
              'relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-b-[5px]',
              style.node,
            ].join(' ')}>
              {style.icon}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase text-stone-500">{style.label} • {item.progress}%</p>
              <h3 className="mt-1 font-fraunces text-base font-black leading-tight text-on-background">{item.concept.title}</h3>
              <p className="mt-1 text-[11px] font-semibold leading-relaxed text-stone-500">{item.concept.description}</p>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <PracticeSetList
            conceptId={item.concept.id}
            sets={item.sets}
            adapterSkill={item.adapterSkill}
            completedSets={completedSets}
            recommendedSetId={item.recommendedSetId}
            onStartPractice={onStartPractice}
          />
        </div>
      </div>
    </article>
  );
});

ConceptCard.displayName = 'ConceptCard';

export function ConceptPath({
  items,
  activeConceptId,
  completedSets,
  onStartPractice,
  setConceptRef,
}: ConceptPathProps) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-fraunces text-base font-black text-on-background">Concept trong ngày</h2>
        <p className="text-[11px] font-semibold text-stone-500">Mỗi concept có thể chứa một hoặc nhiều bài luyện trực tiếp.</p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <ConceptCard
            key={item.concept.id}
            ref={(node) => setConceptRef(item.concept.id, node)}
            item={item}
            isActive={activeConceptId === item.concept.id}
            completedSets={completedSets}
            onStartPractice={onStartPractice}
          />
        ))}
      </div>
    </section>
  );
}
