import { useMemo, useRef, useState } from 'react';
import type { ProgramConcept, ProgramDay, QuestionSet, Skill } from '@/lib/quiz/types';
import { DaySummaryCard } from './day-summary-card';
import { ConceptPath, type ConceptPathItem, type ConceptVisualState } from './concept-path';

interface DayFocusViewProps {
  day: ProgramDay;
  sets: QuestionSet[];
  completedSets: string[];
  conceptMasteries: Record<string, any>;
  onStartPractice: (skill: Skill, targetSetId?: string) => void;
  onSelectGuidebook: (dayId: string) => void;
}

const getSetProgress = (
  setId: string,
  conceptMasteries: Record<string, any>,
  completedSets: string[],
) => {
  const mastery = conceptMasteries[setId];
  if (mastery?.bkt !== undefined) {
    return Math.max(0, Math.min(100, Math.round(Number(mastery.bkt) * 100)));
  }
  return completedSets.includes(setId) ? 100 : 0;
};

const getConceptProgress = (
  concept: ProgramConcept,
  conceptMasteries: Record<string, any>,
  completedSets: string[],
) => {
  if (concept.setIds.length === 0) return 0;
  const total = concept.setIds.reduce(
    (sum, setId) => sum + getSetProgress(setId, conceptMasteries, completedSets),
    0,
  );
  return Math.round(total / concept.setIds.length);
};

const getConceptState = (
  concept: ProgramConcept,
  progress: number,
  conceptMasteries: Record<string, any>,
): ConceptVisualState => {
  if (concept.setIds.length === 0) return 'empty';
  if (progress >= 75) return 'mastered';
  const hasWeakMastery = concept.setIds.some((setId) => {
    const mastery = conceptMasteries[setId];
    return mastery?.masteryState === 'weak' || (mastery?.elo !== undefined && Number(mastery.elo) <= 1000);
  });
  if (hasWeakMastery || (progress > 0 && progress < 45)) return 'weak';
  if (progress > 0) return 'learning';
  return 'not-started';
};

const makeSkillAdapter = (day: ProgramDay, concept: ProgramConcept, progress: number): Skill => ({
  id: `${day.id}-${concept.id}`,
  name: concept.title,
  description: concept.description,
  dayId: day.guidebookDayId || `day${day.dayNumber}`,
  masteryScore: progress,
  status: progress >= 75 ? 'MASTERED' : progress > 0 ? 'LEARNING' : 'NOT_STARTED',
  elo: 1000,
  associatedSets: concept.setIds,
});

export function getDayCompletionPercent(
  day: ProgramDay,
  conceptMasteries: Record<string, any>,
  completedSets: string[],
) {
  if (day.concepts.length === 0) return 0;
  const total = day.concepts.reduce(
    (sum, concept) => sum + getConceptProgress(concept, conceptMasteries, completedSets),
    0,
  );
  return Math.round(total / day.concepts.length);
}

export function getDayAvailableSetCount(day: ProgramDay) {
  return day.concepts.reduce((sum, concept) => sum + concept.setIds.length, 0);
}

export function DayFocusView({
  day,
  sets,
  completedSets,
  conceptMasteries,
  onStartPractice,
  onSelectGuidebook,
}: DayFocusViewProps) {
  const conceptRefs = useRef<Record<string, HTMLElement | null>>({});
  const [activeConceptId, setActiveConceptId] = useState<string | undefined>();
  const setsById = useMemo(() => new Map(sets.map((set) => [set.id, set])), [sets]);

  const items = useMemo<ConceptPathItem[]>(() => {
    return day.concepts.map((concept) => {
      const progress = getConceptProgress(concept, conceptMasteries, completedSets);
      const state = getConceptState(concept, progress, conceptMasteries);
      const conceptSets = concept.setIds
        .map((setId) => setsById.get(setId))
        .filter(Boolean) as QuestionSet[];
      const recommendedSetId = concept.setIds
        .filter((setId) => setsById.has(setId))
        .sort((a, b) =>
          getSetProgress(a, conceptMasteries, completedSets) -
          getSetProgress(b, conceptMasteries, completedSets),
        )[0];

      return {
        concept,
        sets: conceptSets,
        adapterSkill: makeSkillAdapter(day, concept, progress),
        state,
        progress,
        recommendedSetId,
      };
    });
  }, [completedSets, conceptMasteries, day, setsById]);

  const availableSetCount = getDayAvailableSetCount(day);
  const completionPercent = getDayCompletionPercent(day, conceptMasteries, completedSets);

  const focusStartConcept = () => {
    const target =
      items.find((item) => item.state === 'weak') ||
      items.find((item) => item.state === 'not-started' || item.state === 'learning') ||
      items.find((item) => item.sets.length > 0) ||
      items[0];

    if (!target) return;
    setActiveConceptId(target.concept.id);
    conceptRefs.current[target.concept.id]?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  return (
    <div className="space-y-5">
      <DaySummaryCard
        day={day}
        conceptCount={day.concepts.length}
        availableSetCount={availableSetCount}
        completionPercent={completionPercent}
        onStartHere={focusStartConcept}
        onSelectGuidebook={onSelectGuidebook}
      />

      <ConceptPath
        items={items}
        activeConceptId={activeConceptId}
        completedSets={completedSets}
        onStartPractice={onStartPractice}
        setConceptRef={(conceptId, node) => {
          conceptRefs.current[conceptId] = node;
        }}
      />
    </div>
  );
}
