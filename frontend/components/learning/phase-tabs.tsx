import type { ProgramPhase, ProgramPhaseId } from '@/lib/quiz/types';

interface PhaseTabsProps {
  phases: ProgramPhase[];
  selectedPhaseId: ProgramPhaseId;
  onSelectPhase: (phaseId: ProgramPhaseId) => void;
  getPhaseProgress: (phaseId: ProgramPhaseId) => { completed: number; total: number };
}

export function PhaseTabs({
  phases,
  selectedPhaseId,
  onSelectPhase,
  getPhaseProgress,
}: PhaseTabsProps) {
  return (
    <div className="grid gap-2 md:grid-cols-3">
      {phases.map((phase) => {
        const isSelected = phase.id === selectedPhaseId;
        const progress = getPhaseProgress(phase.id);

        return (
          <button
            key={phase.id}
            type="button"
            onClick={() => onSelectPhase(phase.id)}
            className={[
              'cursor-pointer rounded-2xl border-2 border-b-[5px] p-4 text-left transition active:translate-y-1 active:border-b-2',
              isSelected
                ? 'border-primary-green-dark bg-primary-green text-white'
                : 'border-gray-border bg-white text-on-background hover:border-primary-green/60',
            ].join(' ')}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={`text-[10px] font-black uppercase ${isSelected ? 'text-white/80' : 'text-stone-500'}`}>
                  {phase.dayRange}
                </p>
                <h2 className="mt-1 font-fraunces text-base font-black leading-tight">{phase.shortTitle}</h2>
              </div>
              <span className={`rounded-full px-2 py-1 text-[10px] font-black ${isSelected ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'}`}>
                {progress.completed}/{progress.total}
              </span>
            </div>
            <p className={`mt-2 line-clamp-2 text-[11px] font-semibold leading-relaxed ${isSelected ? 'text-white/85' : 'text-stone-500'}`}>
              {phase.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
