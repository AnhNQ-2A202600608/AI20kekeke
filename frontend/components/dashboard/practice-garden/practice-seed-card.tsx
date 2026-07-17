import { AlertCircle, ArrowRight, CheckCircle2, Clock3, Lock, Play, Sprout } from 'lucide-react';

import { MasterySeedBadge } from '@/components/learning/mastery-seed-badge';
import { MasterySoilStrip } from '@/components/learning/mastery-soil-strip';

import type { PracticeGardenSkill } from './practice-garden-data';

interface PracticeSeedCardProps {
  skill: PracticeGardenSkill;
  isSelected: boolean;
  onSelect: (skillId: string) => void;
  onStart: (skill: PracticeGardenSkill) => void;
}

const stateIcon = {
  new: Sprout,
  in_progress: Clock3,
  review: AlertCircle,
  mastered: CheckCircle2,
  locked: Lock,
};

const stateClassName = {
  new: 'border-primary-green/20 bg-primary-green/8 text-primary-green-dark',
  in_progress: 'border-tertiary-yellow/35 bg-tertiary-yellow/15 text-[#9a6d00]',
  review: 'border-error-red/25 bg-error-red/10 text-error-red',
  mastered: 'border-primary-green/30 bg-primary-green/12 text-primary-green-dark',
  locked: 'border-stone-200 bg-stone-100 text-stone-500',
};

export function PracticeSeedCard({
  skill,
  isSelected,
  onSelect,
  onStart,
}: PracticeSeedCardProps) {
  const Icon = stateIcon[skill.state];
  const isLocked = skill.state === 'locked';

  return (
    <article
      data-tour-id={isSelected ? 'recommended-skill' : undefined}
      className={[
        'group relative flex min-h-[7rem] w-full flex-col rounded-[0.8rem] border-2 border-b-[3px] bg-[#fffdf7]/92 p-1.5 text-left shadow-[0_5px_10px_rgba(50,32,17,0.07)] transition md:min-h-[7.65rem]',
        'focus-within:ring-4 focus-within:ring-primary-green/20',
        isSelected
          ? 'border-primary-green border-b-primary-green-dark shadow-[0_10px_18px_rgba(88,204,2,0.16)]'
          : 'border-primary-green/15 border-b-primary-green/25 hover:border-primary-green/45 md:hover:-translate-y-0.5',
      ].join(' ')}
    >
      {skill.isRecommended && (
        <span className="absolute right-1.5 top-1.5 rounded-full border border-primary-green/20 bg-primary-green/10 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wide text-primary-green-dark">
          Sofi chọn
        </span>
      )}

      <button
        type="button"
        onClick={() => onSelect(skill.id)}
        aria-pressed={isSelected}
        className="flex min-h-0 flex-1 cursor-pointer flex-col text-left focus-visible:outline-none"
      >
        <div className="mb-0.5 flex items-start gap-1.5 pr-10">
          <MasterySeedBadge
            progress={skill.mastery}
            state={skill.state === 'locked' ? 'locked' : skill.state === 'review' ? 'review' : undefined}
            size="xs"
            label={`${skill.stateLabel}: ${skill.mastery}%`}
          />
          <div className="min-w-0">
            <p className="text-[7px] font-black uppercase tracking-[0.08em] text-stone-400">
              {skill.dayLabel} · {skill.elo} Elo
            </p>
            <h3 className="mt-0.5 line-clamp-1 font-fraunces text-[10.5px] font-black leading-tight text-on-background md:text-[11px]">
              {skill.name}
            </h3>
          </div>
        </div>

        <p className="hidden text-[8px] font-semibold leading-3 text-stone-600 sm:line-clamp-1 md:block">
          {skill.description}
        </p>

        <div className="mt-0.5 flex flex-wrap items-center gap-1">
          <span
            className={[
              'inline-flex min-h-4 items-center gap-1 rounded-full border px-1.5 text-[7px] font-black uppercase tracking-wide',
              stateClassName[skill.state],
            ].join(' ')}
          >
            <Icon className="h-2.5 w-2.5" aria-hidden="true" />
            {skill.stateLabel}
          </span>
          <span className="rounded-full border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-[7px] font-black text-stone-500">
            {skill.associatedSets.length} phần
          </span>
        </div>

        <div className="mt-0.5 pt-0.5 md:mt-auto md:pt-1">
          <div className="mb-0.5 flex items-center justify-between text-[7.5px] font-black text-stone-500">
            <span>Độ thành thạo</span>
            <span className="font-mono text-on-background">{skill.mastery}%</span>
          </div>
          <MasterySoilStrip
            progress={skill.mastery}
            state={skill.state === 'locked' ? 'locked' : skill.state === 'review' ? 'review' : undefined}
            label={`Đất kỹ năng ${skill.name}: ${skill.mastery}%`}
            className="h-2.5"
          />
        </div>
      </button>

      <div className="mt-0.5 border-t border-dashed border-stone-200 pt-0.5">
        <button
          type="button"
          onClick={() => onStart(skill)}
          disabled={isLocked}
          className={[
            'inline-flex min-h-6 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border px-2 text-[8px] font-black uppercase transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25 active:translate-y-[1px] disabled:cursor-not-allowed',
            isLocked
              ? 'border-stone-200 bg-stone-100 text-stone-400'
              : skill.state === 'review'
                ? 'border-error-red bg-error-red text-white hover:brightness-105'
            : 'border-primary-green-dark bg-primary-green text-white hover:brightness-105',
          ].join(' ')}
        >
          {skill.state === 'new' ? <Play className="h-3 w-3 fill-white" aria-hidden="true" /> : null}
          <span>{skill.ctaLabel}</span>
          {!isLocked ? <ArrowRight className="h-3 w-3" aria-hidden="true" /> : null}
        </button>
      </div>
    </article>
  );
}
