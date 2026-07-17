import React from 'react';
import { Leaf, Sprout } from 'lucide-react';
import { MasterySeedBadge } from '@/components/learning/mastery-seed-badge';
import { MasterySoilStrip } from '@/components/learning/mastery-soil-strip';
import { ActionButton } from '@/components/ui/action-button';
import { TactilePanel } from '@/components/ui/learning';
import { ConceptMastery } from '../utils/profile-utils';
import { getConceptProgress, getPlantState } from '../utils/profile-metaphors';

interface SkillGardenProps {
  concepts: ConceptMastery[];
  onStartPractice: (conceptId: string) => void;
  onOpenConcept: (conceptId: string) => void;
}

const toneClass = {
  green: 'border-primary-green/25 bg-primary-green/5 text-primary-green-dark',
  yellow: 'border-tertiary-yellow/40 bg-tertiary-yellow/10 text-tertiary-yellow-dark',
  orange: 'border-accent-orange/35 bg-accent-orange-light/20 text-accent-orange-dark',
  blue: 'border-primary-blue/30 bg-primary-blue-light/70 text-primary-blue-dark',
  neutral: 'border-stone-200 bg-stone-50 text-stone-500',
};

export function SkillGarden({ concepts, onStartPractice, onOpenConcept }: SkillGardenProps) {
  const planted = concepts.filter((concept) => concept.status !== 'cold_start').length;

  return (
    <TactilePanel className="space-y-3 !p-4">
      <div className="flex items-end justify-between gap-3 text-left">
        <div className="min-w-0">
          <p className="text-kicker-micro font-black uppercase tracking-widest text-primary-green-dark">Skill Garden</p>
          <h2 className="truncate font-fraunces text-xl font-black leading-tight text-on-background">Vườn kỹ năng</h2>
        </div>
          <span className="rounded-xl border border-primary-green/25 bg-primary-green/10 px-3 py-1 text-xs font-black text-primary-green-dark">
            {planted}/{concepts.length} cây
          </span>
      </div>

      <div className="custom-scrollbar overflow-x-auto rounded-2xl border border-primary-green/15 bg-gradient-to-b from-primary-green/5 to-tertiary-yellow/10 p-2.5">
        <div className="flex min-w-max gap-2.5 pb-1">
        {concepts.map((concept) => (
          <SkillPlantCard
            key={concept.id}
            concept={concept}
            onStartPractice={onStartPractice}
            onOpenConcept={onOpenConcept}
          />
        ))}
        </div>
      </div>
    </TactilePanel>
  );
}

function SkillPlantCard({
  concept,
  onStartPractice,
  onOpenConcept,
}: {
  concept: ConceptMastery;
  onStartPractice: (conceptId: string) => void;
  onOpenConcept: (conceptId: string) => void;
}) {
  const progress = getConceptProgress(concept);
  const plant = getPlantState(concept);
  const canPractice = concept.status !== 'mastered';

  return (
    <article className="group flex min-h-[148px] w-[136px] shrink-0 flex-col justify-between rounded-xl border border-gray-border bg-white p-2.5 text-left transition-colors hover:border-primary-green/40">
      <button
        type="button"
        onClick={() => onOpenConcept(concept.id)}
        className="flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-2 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-green"
      >
        <div className="flex w-14 shrink-0 flex-col items-center gap-1">
          <MasterySeedBadge
            progress={progress}
            state={plant.assetState}
            size="sm"
            label={`${concept.name}: ${plant.label}`}
            className="transition group-hover:scale-105"
          />
          <MasterySoilStrip
            progress={progress}
            state={plant.assetState}
            label={`Đất tiến độ ${progress}%`}
            className="h-3.5"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-h-8 items-start justify-center gap-1">
            <h3 className="line-clamp-2 text-label-tight font-black leading-tight text-on-background">{concept.name}</h3>
            {concept.status === 'zpd' ? <Leaf className="mt-0.5 h-3 w-3 shrink-0 text-primary-green-dark" /> : null}
          </div>
          <p className="mt-0.5 text-badge-micro font-bold text-stone-400">Lv. {Math.max(1, Math.ceil(progress / 20))} · {progress}%</p>
          <span className={`mt-1.5 inline-flex rounded-full border px-2 py-0.5 text-badge-micro font-black uppercase ${toneClass[plant.tone]}`}>
            {plant.label}
          </span>
        </div>
      </button>

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-stone-100 pt-2">
        <span className="inline-flex items-center gap-1 text-badge-micro font-bold text-stone-400">
          <Sprout className="h-3 w-3" />
          Elo {Math.round(concept.elo)}
        </span>
        <ActionButton
          onClick={() => onStartPractice(concept.id)}
          disabled={!canPractice}
          variant={plant.tone === 'orange' ? 'orange' : 'green'}
          size="sm"
          className="!min-h-7 !px-2 !text-badge-micro"
        >
          {concept.status === 'cold_start' ? 'Gieo hạt' : plant.tone === 'orange' ? 'Tưới lại' : canPractice ? 'Luyện tiếp' : 'Duy trì'}
        </ActionButton>
      </div>
    </article>
  );
}
