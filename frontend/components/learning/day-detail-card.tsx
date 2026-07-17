import {
  Activity,
  BookOpen,
  Bot,
  Brain,
  Database,
  GitBranch,
  Network,
  Play,
  ShieldCheck,
  Workflow,
} from 'lucide-react';
import { SofiStateMascot } from '@/components/mascot';
import type { ProgramConcept, ProgramDay, ProgramPhase, ProgramTrack, QuestionSet, Skill } from '@/lib/quiz/types';
import { MasterySeedBadge } from './mastery-seed-badge';
import { MasterySeedSkillCard } from './mastery-seed-skill-card';
import { MasterySoilStrip } from './mastery-soil-strip';

export type DetailConceptState = 'mastered' | 'learning' | 'weak' | 'not-started' | 'empty';

export interface DetailConceptItem {
  concept: ProgramConcept;
  sets: QuestionSet[];
  adapterSkill: Skill;
  state: DetailConceptState;
  progress: number;
  recommendedSetId?: string;
}

interface DayDetailCardProps {
  day: ProgramDay;
  phase: ProgramPhase;
  track?: ProgramTrack;
  items: DetailConceptItem[];
  selectedConceptId: string;
  completionPercent: number;
  availableSetCount: number;
  onSelectConcept: (conceptId: string) => void;
  onStartPractice: (skill: Skill, targetSetId?: string) => void;
  onSelectGuidebook: (dayId: string) => void;
}

const stateCopy: Record<
  DetailConceptState,
  { label: string; seedState?: 'locked' | 'review' }
> = {
  mastered: {
    label: 'Ổn định',
  },
  learning: {
    label: 'Đang học',
  },
  weak: {
    label: 'Cần vá',
    seedState: 'review',
  },
  'not-started': {
    label: 'Chưa học',
  },
  empty: {
    label: 'Sắp mở',
    seedState: 'locked',
  },
};

const getDayVisual = (day: ProgramDay, track?: ProgramTrack) => {
  if (track?.id === 'agent-builder') return { Icon: Bot, label: 'Agent build' };
  if (track?.id === 'ai-product') return { Icon: GitBranch, label: 'Product loop' };
  if (track?.id === 'rag-data') return { Icon: Database, label: 'RAG/Data' };
  if (day.dayNumber <= 4) return { Icon: Brain, label: 'Foundation' };
  if (day.dayNumber <= 7) return { Icon: Network, label: 'Prototype' };
  if (day.dayNumber <= 12) return { Icon: Workflow, label: 'System' };
  if (day.dayNumber <= 16) return { Icon: ShieldCheck, label: 'Production' };
  return { Icon: Activity, label: 'Track' };
};

export function DayDetailCard({
  day,
  phase,
  track,
  items,
  selectedConceptId,
  completionPercent,
  availableSetCount,
  onSelectConcept,
  onStartPractice,
  onSelectGuidebook,
}: DayDetailCardProps) {
  const selectedItem =
    items.find((item) => item.concept.id === selectedConceptId) ||
    items.find((item) => item.sets.length > 0) ||
    items[0];
  const canStart = Boolean(selectedItem?.sets.length);
  const startSetId = selectedItem?.recommendedSetId || selectedItem?.sets[0]?.id;
  const { Icon: DayVisualIcon, label: visualLabel } = getDayVisual(day, track);
  const shortDayLabel = day.displayLabel || `D${day.dayNumber}`;

  return (
    <aside className="flex h-full w-full max-w-full flex-col rounded-2xl border border-gray-border bg-white p-3 pb-24 shadow-sm sm:p-4 md:pb-4 lg:overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col space-y-3">
        <div className="grid min-w-0 grid-cols-[1fr_auto] items-start gap-3 border-b border-gray-border/70 pb-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-wide text-primary-green-dark">
              <span>{phase.shortTitle}{track ? ` / ${track.shortTitle}` : ''}</span>
              <span className="text-stone-300">•</span>
              <span className="inline-flex items-center gap-1 text-stone-500">
                <DayVisualIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {visualLabel}
              </span>
              <span className="rounded-md bg-surface-container-low px-2 py-0.5 font-mono text-on-background">{shortDayLabel}</span>
            </div>
            <h1 className="mt-2 break-words font-fraunces text-xl font-black leading-tight text-on-background md:text-2xl">
              {day.title}
            </h1>
            <p className="mt-1 max-w-2xl text-sm font-semibold leading-relaxed text-stone-600 lg:line-clamp-2">
              {day.outcome}
            </p>
          </div>
          <SofiStateMascot state="coach" size="sm" className="hidden sm:flex" />
        </div>

        <div className="grid min-w-0 grid-cols-3 gap-2">
          <div className="min-w-0 rounded-xl border border-gray-border bg-surface-container-low px-2 py-2 sm:px-3">
            <p className="text-[9px] font-black uppercase text-stone-500">Concept</p>
            <p className="mt-1 text-lg font-black text-on-background">{items.length}</p>
          </div>
          <div className="min-w-0 rounded-xl border border-gray-border bg-surface-container-low px-2 py-2 sm:px-3">
            <p className="text-[9px] font-black uppercase text-stone-500">Bài luyện</p>
            <p className="mt-1 text-lg font-black text-on-background">{availableSetCount}</p>
          </div>
          <div className="min-w-0 rounded-xl border border-gray-border bg-surface-container-low px-2 py-2 sm:px-3">
            <p className="text-[9px] font-black uppercase text-stone-500">Tiến độ</p>
            <p className="mt-1 text-lg font-black text-on-background">{completionPercent}%</p>
          </div>
        </div>

        <div className="min-h-0 space-y-3 lg:flex-1">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-fraunces text-sm font-black text-on-background">Concept đang học</h2>
            <span className="text-[10px] font-bold text-stone-400">Chọn 1 mục để Start</span>
          </div>

          {selectedItem && (
            <div className="rounded-xl border border-primary-green bg-primary-green/5 p-3">
              <div className="flex items-start gap-3">
                <MasterySeedBadge
                  progress={selectedItem.progress}
                  state={stateCopy[selectedItem.state].seedState}
                  label={`${selectedItem.concept.title}: ${selectedItem.progress}% mastery`}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="text-base font-black leading-tight text-on-background">{selectedItem.concept.title}</p>
                  <p className="mt-1 line-clamp-3 text-xs font-semibold leading-relaxed text-stone-600">
                    {selectedItem.concept.description}
                  </p>
                  <p className="mt-2 text-[10px] font-black uppercase text-stone-400">
                    {stateCopy[selectedItem.state].label} • {selectedItem.progress}% • {selectedItem.sets.length || 0} bài
                  </p>
                  <MasterySoilStrip
                    progress={selectedItem.progress}
                    state={stateCopy[selectedItem.state].seedState}
                    label={`${selectedItem.concept.title}: soil progress ${selectedItem.progress}%`}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
            {items.map((item, index) => {
              const selected = item.concept.id === selectedConceptId;
              const state = stateCopy[item.state];
              return (
                <MasterySeedSkillCard
                  key={item.concept.id}
                  title={`${index + 1}. ${item.concept.title}`}
                  progress={item.progress}
                  stateLabel={`C${index + 1}`}
                  selected={selected}
                  state={state.seedState}
                  ariaLabel={`Chọn concept ${item.concept.title}. ${state.label}. Tiến độ ${item.progress}%`}
                  onClick={() => onSelectConcept(item.concept.id)}
                />
              );
            })}
          </div>
        </div>

        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+5rem)] left-3 right-3 z-40 mt-auto grid grid-cols-2 gap-2 rounded-2xl bg-white/95 p-2 shadow-lg shadow-stone-900/10 backdrop-blur md:static md:left-auto md:right-auto md:z-auto md:shrink-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-0 lg:grid-cols-1 xl:grid-cols-2">
          {day.guidebookDayId && (
            <button
              type="button"
              onClick={() => onSelectGuidebook(day.guidebookDayId as string)}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-border bg-white px-4 py-3 text-xs font-black uppercase text-on-background transition hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25 active:scale-[0.98]"
            >
              <BookOpen className="h-4 w-4 stroke-[3]" />
              Guidebook
            </button>
          )}

          <button
            type="button"
            disabled={!canStart}
            onClick={() => {
              if (!selectedItem || !startSetId) return;
              onStartPractice(selectedItem.adapterSkill, startSetId);
            }}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary-green-dark bg-primary-green px-4 py-3 text-xs font-black uppercase text-white transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:border-gray-border-dark disabled:bg-gray-border disabled:text-stone-400"
          >
            <Play className="h-4 w-4 fill-current stroke-[3]" />
            {canStart ? 'Start' : 'Sắp mở'}
          </button>
        </div>
      </div>
    </aside>
  );
}
