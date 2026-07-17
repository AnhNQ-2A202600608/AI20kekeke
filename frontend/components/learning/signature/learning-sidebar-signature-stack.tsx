import type { ProgramConcept, ProgramDay } from '@/lib/quiz/types';
import type { RoadmapDayState } from '../program-roadmap';
import { AdaptiveSignalBlock } from './adaptive-signal-block';
import { LearningPulseBlock } from './learning-pulse-block';
import { MasteryContractBlock } from './mastery-contract-block';
import { SofiCheckInBlock } from './sofi-check-in-block';

interface LearningSidebarSignatureStackProps {
  selectedDay: ProgramDay;
  selectedConcept?: ProgramConcept;
  selectedDayState: RoadmapDayState;
  activeWeekDays: ProgramDay[];
  completedInWeek: number;
}

export function LearningSidebarSignatureStack({
  selectedDay,
  selectedConcept,
  selectedDayState,
  activeWeekDays,
  completedInWeek,
}: LearningSidebarSignatureStackProps) {
  const activeWeekIndex = activeWeekDays.findIndex((day) => day.id === selectedDay.id);
  const shouldShowPulse = activeWeekDays.length > 0 && completedInWeek > 0;
  const shouldShowAdaptiveSignal = selectedDayState === 'weak' || selectedDayState === 'preview';

  return (
    <div className="space-y-3 border-t border-gray-border/70 pt-3">
      {shouldShowPulse ? (
        <LearningPulseBlock
          completedCount={completedInWeek}
          totalCount={activeWeekDays.length}
          activeIndex={Math.max(0, activeWeekIndex)}
        />
      ) : null}

      {shouldShowAdaptiveSignal ? (
        <AdaptiveSignalBlock
          mode={selectedDayState === 'weak' ? 'weak' : 'preview'}
          day={selectedDay}
          concept={selectedConcept}
        />
      ) : (
        <MasteryContractBlock day={selectedDay} />
      )}

      <SofiCheckInBlock
        day={selectedDay}
        concept={selectedConcept}
        state={selectedDayState === 'weak' ? 'weak' : selectedDayState === 'complete' ? 'complete' : selectedDayState === 'preview' ? 'preview' : 'active'}
      />
    </div>
  );
}
