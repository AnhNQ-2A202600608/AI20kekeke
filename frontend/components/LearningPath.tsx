'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Play, X } from 'lucide-react';
import { useBoundStore } from '@/hooks/useBoundStore';
import {
  DEFAULT_TRACK_ID,
  PROGRAM_DAY_COUNT,
  PROGRAM_PHASES,
  PROGRAM_TRACKS,
  getDaysForPhase,
  getPhaseForDay,
} from '@/lib/quiz/program-curriculum';
import type { ProgramConcept, ProgramDay, QuestionSet, Skill } from '@/lib/quiz/types';
import type { DetailConceptItem, DetailConceptState } from '@/components/learning/day-detail-card';
import type { RoadmapDayState } from '@/components/learning/program-roadmap';
import { AppTopNav } from '@/components/app/app-top-nav';
import { getAggregateLearningElo } from '@/lib/adaptive/elo';
import { DesktopLearningSidebar } from '@/components/learning/desktop-learning-sidebar';
import { MobileLearningTopBar } from '@/components/learning/mobile-learning-top-bar';
import { MobileDayRail } from '@/components/learning/mobile-day-rail';
import { MobileTodayMissionCard } from '@/components/learning/mobile-today-mission-card';
import { MobileDailySkillList } from '@/components/learning/mobile-daily-skill-list';
import { ConceptPreviewRouter } from '@/components/learning/concept-preview-router';
import { SofiCoachSheet, type SofiCoachContext } from '@/components/learning/sofi-coach-sheet';

type AnswerHistoryBySet = Record<string, Record<string, { isCorrect?: boolean }>>;

interface LearningPathProps {
  skills: Skill[];
  sets: QuestionSet[];
  completedSets: string[];
  answersHistory: AnswerHistoryBySet;
  onStartPractice: (skill: Skill, targetSetId?: string) => void;
  devMode: boolean;
  onToggleDevMode: () => void;
  onSelectGuidebook: (dayId: string) => void;
  onOpenAiCoach?: () => void;
  onOpenLogin?: () => void;
  onOpenProfile?: () => void;
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
): DetailConceptState => {
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

const getDayCompletionPercent = (
  day: ProgramDay,
  conceptMasteries: Record<string, any>,
  completedSets: string[],
) => {
  if (day.concepts.length === 0) return 0;
  const total = day.concepts.reduce(
    (sum, concept) => sum + getConceptProgress(concept, conceptMasteries, completedSets),
    0,
  );
  return Math.round(total / day.concepts.length);
};

const getDayAvailableSetCount = (day: ProgramDay, availableSetIds: Set<string>) =>
  day.concepts.reduce(
    (sum, concept) => sum + concept.setIds.filter((setId) => availableSetIds.has(setId)).length,
    0,
  );

interface MidtermSetPanelProps {
  items: DetailConceptItem[];
  sets: QuestionSet[];
  answersHistory: AnswerHistoryBySet;
  completedSets: string[];
  onStartPractice: (skill: Skill, targetSetId?: string) => void;
}

const MIDTERM_PRESETS = [
  { id: 'midterm-mix-all', group: 'mix', label: 'Mix', badge: 'Full', questionCount: 65 },
  { id: 'midterm-common-full', group: 'common', label: 'Phần I', badge: 'Chung', questionCount: 20 },
  { id: 'midterm-business-full', group: 'business', label: 'Phần II', badge: 'Business', questionCount: 15 },
  { id: 'midterm-infrastructure-full', group: 'infrastructure', label: 'Phần III', badge: 'Infrastructure', questionCount: 15 },
  { id: 'midterm-app-build-full', group: 'app-build', label: 'Phần IV', badge: 'App Build', questionCount: 15 },
] as const;

const MIDTERM_FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'mix', label: 'Mix' },
  { id: 'common', label: 'Phần I' },
  { id: 'business', label: 'Business' },
  { id: 'infrastructure', label: 'Infrastructure' },
  { id: 'app-build', label: 'App Build' },
] as const;

function MidtermSetPanel({
  items,
  sets,
  answersHistory,
  completedSets,
  onStartPractice,
}: MidtermSetPanelProps) {
  const [activeFilter, setActiveFilter] = useState<(typeof MIDTERM_FILTERS)[number]['id']>('all');
  const adapterSkill = items[0]?.adapterSkill;
  const setsById = useMemo(() => new Map(sets.map((set) => [set.id, set])), [sets]);
  const rows = MIDTERM_PRESETS
    .filter((preset) => activeFilter === 'all' || preset.group === activeFilter)
    .map((preset) => {
      const set = setsById.get(preset.id);
      if (!set || !adapterSkill) return null;
      const setHistory = answersHistory[set.id] || {};
      const answeredCount = Object.keys(setHistory).length;
      const totalQuestions = set.questions?.length || preset.questionCount;
      const correctCount = Object.values(setHistory).filter((answer) => answer?.isCorrect).length;
      const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
      const isComplete = completedSets.includes(set.id) || (totalQuestions > 0 && answeredCount >= totalQuestions);
      const status = isComplete ? 'Đã xong' : answeredCount > 0 ? 'Đang làm' : 'Chưa làm';

      return {
        set,
        answeredCount,
        totalQuestions,
        correctCount,
        scorePercent,
        isComplete,
        status,
        preset,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  if (rows.length === 0) return null;

  return (
    <section className="rounded-xl border border-primary-green/20 bg-primary-green/5 p-3 shadow-sm">
      <div className="mb-2 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-kicker-micro font-black uppercase tracking-[0.16em] text-primary-green-dark">Bộ đề giữa kỳ</p>
          <h2 className="text-base font-black leading-tight text-on-background">Chọn đề để luyện và ghi điểm riêng</h2>
        </div>
        <span className="shrink-0 rounded-full border border-primary-green/20 bg-white px-2.5 py-1 text-caption-tight font-black uppercase text-primary-green-dark">
          {rows.filter((row) => row.isComplete).length}/{rows.length} xong
        </span>
      </div>

      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
        {MIDTERM_FILTERS.map((filter) => {
          const selected = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={[
                'shrink-0 rounded-full border px-3 py-1.5 text-caption-tight font-black uppercase transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25',
                selected
                  ? 'border-primary-green-dark bg-primary-green text-white'
                  : 'border-gray-border bg-white text-stone-500 hover:border-primary-green/40 hover:text-on-background',
              ].join(' ')}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {rows.map((row) => (
          <button
            key={row.set.id}
            type="button"
            onClick={() => onStartPractice(adapterSkill, row.set.id)}
            className="group min-w-0 cursor-pointer rounded-xl border border-gray-border bg-white p-3 text-left transition hover:border-primary-green/60 hover:bg-primary-green/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25 active:scale-[0.99]"
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="mb-1 text-kicker-micro font-black uppercase tracking-[0.16em] text-primary-green-dark">
                  {row.preset.label} · {row.preset.badge}
                </p>
                <p className="line-clamp-2 text-sm font-black leading-tight text-on-background">{row.set.title}</p>
                <p className="mt-1 line-clamp-2 text-label-tight font-semibold leading-relaxed text-stone-500">{row.set.description}</p>
              </div>
              <span
                className={[
                  'shrink-0 rounded-full border px-2 py-0.5 text-kicker-micro font-black uppercase',
                  row.isComplete
                    ? 'border-tertiary-yellow-dark bg-tertiary-yellow text-stone-950'
                    : row.answeredCount > 0
                      ? 'border-primary-blue/30 bg-primary-blue-light text-primary-blue-dark'
                      : 'border-gray-border bg-surface-container-low text-stone-500',
                ].join(' ')}
              >
                {row.status}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <span className="rounded-lg border border-gray-border bg-surface-container-low px-2 py-1">
                <span className="block text-kicker-micro font-black uppercase text-stone-400">Điểm</span>
                <span className="block text-sm font-black text-on-background">{row.correctCount}/{row.totalQuestions}</span>
              </span>
              <span className="rounded-lg border border-gray-border bg-surface-container-low px-2 py-1">
                <span className="block text-kicker-micro font-black uppercase text-stone-400">Đã làm</span>
                <span className="block text-sm font-black text-on-background">{row.answeredCount}/{row.totalQuestions}</span>
              </span>
              <span className="rounded-lg border border-gray-border bg-surface-container-low px-2 py-1">
                <span className="block text-kicker-micro font-black uppercase text-stone-400">Tỷ lệ</span>
                <span className="block text-sm font-black text-primary-green-dark">{row.scorePercent}%</span>
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
              <div className="h-full rounded-full bg-primary-green transition-all" style={{ width: `${row.scorePercent}%` }} />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

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

interface GuideNotesOverlayProps {
  item?: DetailConceptItem | null;
  day: ProgramDay;
  isOpen: boolean;
  onClose: () => void;
  onOpenGuidebook: (dayId: string) => void;
}

function GuideNotesOverlay({
  item,
  day,
  isOpen,
  onClose,
  onOpenGuidebook,
}: GuideNotesOverlayProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 p-3 backdrop-blur-[2px] sm:p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        aria-label={`Guide notes cho ${day.title}`}
        className="w-full max-w-2xl overflow-hidden rounded-2xl border-2 border-primary-green/15 border-b-[5px] bg-white shadow-2xl shadow-stone-950/20 outline-none"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex max-h-[min(84dvh,42rem)] flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-gray-border px-4 py-4 md:px-5">
            <div className="min-w-0">
              <p className="text-caption-tight font-black uppercase tracking-[0.18em] text-primary-green-dark">
                Guide notes
              </p>
              <h2 className="mt-1 truncate font-fraunces text-lg font-black leading-tight text-on-background">
                {day.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-gray-border bg-white text-stone-500 transition hover:bg-surface-container-low hover:text-on-background focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25 active:scale-[0.98]"
              aria-label="Đóng guide notes"
            >
              <X className="h-4 w-4 stroke-[3]" aria-hidden="true" />
            </button>
          </div>

          <div className="learning-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-3 md:px-4">
            <ConceptPreviewRouter item={item} eyebrow="Guide notes" />

            {day.guidebookDayId && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenGuidebook(day.guidebookDayId as string);
                }}
                className="mt-3 inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary-green-dark bg-primary-green px-4 py-3 text-xs font-black uppercase text-white transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25 active:scale-[0.98]"
              >
                <BookOpen className="h-4 w-4 stroke-[3]" aria-hidden="true" />
                Mở guidebook đầy đủ
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

export const LearningPath: React.FC<LearningPathProps> = ({
  sets,
  completedSets,
  answersHistory,
  onStartPractice,
  devMode,
  onSelectGuidebook,
  onOpenAiCoach,
  onOpenLogin,
  onOpenProfile,
}) => {
  const {
    conceptMasteries,
    streak,
    xp,
    activeDays,
    name,
    username,
    mssv,
    role,
    loggedIn,
    logOut,
    selectedPersona,
    setPersona,
    userId,
    demoProfileKey,
    eloHistoryEvents,
    selectedLearningDayId,
    selectedLearningTrackId,
    setSelectedLearningDay,
    setSelectedLearningTrack,
  } = useBoundStore();
  const selectedTrackId = selectedLearningTrackId || DEFAULT_TRACK_ID;
  const selectedDayId = selectedLearningDayId || 'day1';
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [sofiCoachOpen, setSofiCoachOpen] = useState(false);
  const [guideNotesOpen, setGuideNotesOpen] = useState(false);
  const [isLearningDrawerOpen, setIsLearningDrawerOpen] = useState(true);

  const availableSetIds = useMemo(() => new Set(sets.map((set) => set.id)), [sets]);
  const setsById = useMemo(() => new Map(sets.map((set) => [set.id, set])), [sets]);
  const visibleDays = useMemo(
    () => [
      ...getDaysForPhase('foundation', selectedTrackId),
      ...getDaysForPhase('systems', selectedTrackId),
      ...getDaysForPhase('midterm', selectedTrackId),
      ...getDaysForPhase('specialization', selectedTrackId),
    ],
    [selectedTrackId],
  );

  const selectedDay = useMemo(
    () => visibleDays.find((day) => day.id === selectedDayId) || visibleDays[0],
    [selectedDayId, visibleDays],
  );
  useEffect(() => {
    if (!visibleDays.length) return;
    if (!visibleDays.some((day) => day.id === selectedDayId)) {
      const syncSelection = window.setTimeout(() => {
        setSelectedLearningDay(visibleDays[0].id);
        setSelectedConceptId(null);
      }, 0);
      return () => window.clearTimeout(syncSelection);
    }
  }, [selectedDayId, setSelectedLearningDay, visibleDays]);
  const demoLockedDayIds = useMemo(
    () => demoProfileKey === 'full_flow_v1'
      ? new Set(visibleDays.filter((day) => day.dayNumber >= 9).map((day) => day.id))
      : new Set<string>(),
    [demoProfileKey, visibleDays],
  );
  const selectedDayLocked = demoLockedDayIds.has(selectedDay.id);
  const selectedPhase = getPhaseForDay(selectedDay);
  const selectedTrack = selectedDay.trackId
    ? PROGRAM_TRACKS.find((track) => track.id === selectedDay.trackId)
    : undefined;

  const detailItems = useMemo<DetailConceptItem[]>(() => {
    return selectedDay.concepts.map((concept) => {
      const progress = getConceptProgress(concept, conceptMasteries, completedSets);
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
        adapterSkill: makeSkillAdapter(selectedDay, concept, progress),
        state: getConceptState(concept, progress, conceptMasteries),
        progress,
        recommendedSetId,
      };
    });
  }, [completedSets, conceptMasteries, selectedDay, setsById]);

  const activeConceptId =
    selectedConceptId && detailItems.some((item) => item.concept.id === selectedConceptId)
      ? selectedConceptId
      : detailItems.find((item) => item.state === 'weak')?.concept.id ||
        detailItems.find((item) => item.state === 'not-started' || item.state === 'learning')?.concept.id ||
        detailItems[0]?.concept.id ||
        '';
  const selectedItem =
    detailItems.find((item) => item.concept.id === activeConceptId) ||
    detailItems.find((item) => item.sets.length > 0) ||
    detailItems[0];
  const isMidtermDay = selectedDay.phaseId === 'midterm';
  const startSetId = isMidtermDay ? 'midterm-mix-all' : selectedItem?.recommendedSetId || selectedItem?.sets[0]?.id;
  const canStartSelected = Boolean(startSetId && availableSetIds.has(startSetId)) && !selectedDayLocked;
  const selectedDayLabel = selectedDay.displayLabel || `Day ${selectedDay.dayNumber}`;
  const selectedDayCompletion = getDayCompletionPercent(selectedDay, conceptMasteries, completedSets);
  const selectedDayAvailableSetCount = getDayAvailableSetCount(selectedDay, availableSetIds);
  const sofiContext: SofiCoachContext | null = selectedItem
    ? {
        conceptId: selectedItem.concept.id,
        conceptTitle: selectedItem.concept.title,
        conceptDescription: selectedItem.concept.description,
        conceptState: selectedItem.state,
        dayTitle: selectedDay.title,
        dayNumber: selectedDay.dayNumber,
        dayLabel: selectedDayLabel,
        progressPercent: selectedItem.progress,
      }
    : null;

  const getDayState = (day: ProgramDay): RoadmapDayState => {
    if (demoLockedDayIds.has(day.id)) return 'preview';
    const completion = getDayCompletionPercent(day, conceptMasteries, completedSets);
    if (completion >= 75) return 'complete';
    const hasWeakConcept = day.concepts.some((concept) =>
      concept.setIds.some((setId) => {
        const mastery = conceptMasteries[setId];
        return mastery?.masteryState === 'weak' || (mastery?.elo !== undefined && Number(mastery.elo) <= 1000);
      }),
    );
    if (hasWeakConcept) return 'weak';
    if (getDayAvailableSetCount(day, availableSetIds) > 0) return 'active';
    return 'preview';
  };

  const completedDayCount = visibleDays.filter((day) => getDayCompletionPercent(day, conceptMasteries, completedSets) >= 75).length;
  const totalAvailableSets = visibleDays.reduce((sum, day) => sum + getDayAvailableSetCount(day, availableSetIds), 0);
  const overallProgress = Math.round((completedDayCount / PROGRAM_DAY_COUNT) * 100);
  const averageElo = useMemo(() => {
    return getAggregateLearningElo(conceptMasteries);
  }, [conceptMasteries]);

  const handleSelectDay = (day: ProgramDay) => {
    setSelectedLearningDay(day.id);
    setSelectedConceptId(null);
    setGuideNotesOpen(false);
  };

  const handleSelectTrack = (trackId: string) => {
    setSelectedLearningTrack(trackId);
    setGuideNotesOpen(false);
    if (selectedDay.phaseId === 'specialization') {
      const sameNumberDay = getDaysForPhase('specialization', trackId).find((day) => day.dayNumber === selectedDay.dayNumber);
      setSelectedLearningDay(sameNumberDay?.id || getDaysForPhase('specialization', trackId)[0]?.id || selectedDayId);
      setSelectedConceptId(null);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[100dvw] flex-col overflow-x-hidden px-3 pb-28 pt-0 font-be-vietnam-pro lg:h-full lg:max-w-[82rem] lg:overflow-hidden lg:px-3 lg:pb-2">
      <MobileLearningTopBar
        profileName={name || username || 'Học viên Mentora'}
        streakDays={streak}
        profileInitial={(name || username || 'N').trim().charAt(0).toUpperCase() || 'N'}
        loggedIn={loggedIn}
        mssv={mssv}
        onLogOut={logOut}
        onOpenLogin={onOpenLogin}
        onOpenProfile={onOpenProfile}
        role={role}
        selectedPersona={selectedPersona}
        setPersona={setPersona}
        userId={userId ? String(userId) : null}
      />

      <AppTopNav
        activeDays={activeDays}
        title="Lộ trình học tập"
        subtitle={`${PROGRAM_DAY_COUNT} ngày • ${totalAvailableSets} bài luyện • ${devMode ? 'Dev mode' : `${overallProgress}% hoàn thành`}`}
        averageElo={averageElo}
        displayName={name || username || 'Học viên Mentora'}
        eloHistoryEvents={eloHistoryEvents}
        initial={(name || username || 'N').trim().charAt(0).toUpperCase() || 'N'}
        loggedIn={loggedIn}
        mssv={mssv}
        onLogOut={logOut}
        onOpenLogin={onOpenLogin}
        onOpenProfile={onOpenProfile}
        role={role}
        selectedPersona={selectedPersona}
        setPersona={setPersona}
        streak={streak}
        userId={userId ? String(userId) : null}
        xp={xp}
      />

      <main
        className={[
          'hidden min-w-0 flex-1 gap-3 overflow-visible transition-[grid-template-columns] duration-200 lg:grid lg:min-h-0 lg:items-stretch lg:overflow-hidden',
          isLearningDrawerOpen
            ? 'lg:grid-cols-[14.5rem_minmax(0,1fr)] xl:grid-cols-[15.5rem_minmax(0,1fr)]'
            : 'lg:grid-cols-[4.25rem_minmax(0,1fr)]',
        ].join(' ')}
      >
        <DesktopLearningSidebar
            phases={PROGRAM_PHASES}
            tracks={PROGRAM_TRACKS}
            days={visibleDays}
            selectedDayId={selectedDay.id}
            selectedTrackId={selectedTrackId}
            isDrawerOpen={isLearningDrawerOpen}
            onToggleDrawer={() => setIsLearningDrawerOpen((open) => !open)}
            onSelectDay={handleSelectDay}
            onSelectTrack={handleSelectTrack}
            getDayState={getDayState}
            getDayProgress={(day) => getDayCompletionPercent(day, conceptMasteries, completedSets)}
        />

        <section className="flex min-h-0 min-w-0 flex-col rounded-2xl border border-gray-border bg-white p-3 shadow-sm xl:p-4">
          <div className="learning-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto pr-2">
            <div>
              <MobileTodayMissionCard
                day={selectedDay}
                phase={selectedPhase}
                track={selectedTrack}
                conceptCount={isMidtermDay ? MIDTERM_PRESETS.length : detailItems.length}
                practiceCount={isMidtermDay ? MIDTERM_PRESETS.length : selectedDayAvailableSetCount}
                completionPercent={selectedDayCompletion}
                onOpenSofiCoach={() => setSofiCoachOpen(true)}
                density="compact"
              />
            </div>

            {!isMidtermDay && (
            <div>
              <MobileDailySkillList
                items={detailItems}
                selectedConceptId={activeConceptId}
                onSelectConcept={setSelectedConceptId}
                density="compact"
              />
            </div>
            )}

            {isMidtermDay && (
              <MidtermSetPanel
                items={detailItems}
                sets={sets}
                answersHistory={answersHistory}
                completedSets={completedSets}
                onStartPractice={onStartPractice}
              />
            )}
          </div>

          <div className="mt-3 grid shrink-0 grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-2 border-t border-gray-border/70 pt-3">
            {selectedDay.guidebookDayId && (
              <button
                type="button"
                data-tour-id="guidebook-cta"
                onClick={() => setGuideNotesOpen(true)}
                className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-border bg-white px-3 py-2 text-xs font-black uppercase text-on-background transition hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25 active:scale-[0.98]"
                aria-haspopup="dialog"
                aria-expanded={guideNotesOpen}
              >
                <BookOpen className="h-4 w-4 stroke-[3]" aria-hidden="true" />
                Guidebook
              </button>
            )}
            <button
              type="button"
              disabled={!canStartSelected}
              data-tour-id="practice-cta"
              onClick={() => {
                if (!selectedItem || !startSetId) return;
                onStartPractice(selectedItem.adapterSkill, startSetId);
              }}
              className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary-green-dark bg-primary-green px-3 py-2 text-xs font-black uppercase text-white transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:border-gray-border-dark disabled:bg-gray-border disabled:text-stone-400"
            >
              <Play className="h-4 w-4 fill-current stroke-[3]" aria-hidden="true" />
              {canStartSelected ? `Bắt đầu ${selectedDayLabel}` : 'Sắp mở'}
            </button>
          </div>
        </section>
      </main>

      <main className="space-y-4 pt-4 lg:hidden">
        <MobileDayRail
          days={visibleDays}
          selectedDayId={selectedDay.id}
          onSelectDay={handleSelectDay}
          getDayState={getDayState}
          getDayProgress={(day) => getDayCompletionPercent(day, conceptMasteries, completedSets)}
        />

        <div>
          <MobileTodayMissionCard
            day={selectedDay}
            phase={selectedPhase}
            track={selectedTrack}
            conceptCount={isMidtermDay ? MIDTERM_PRESETS.length : detailItems.length}
            practiceCount={isMidtermDay ? MIDTERM_PRESETS.length : selectedDayAvailableSetCount}
            completionPercent={selectedDayCompletion}
            onOpenSofiCoach={() => setSofiCoachOpen(true)}
            density="compact"
          />
        </div>

        {!isMidtermDay && (
        <div>
          <MobileDailySkillList
            items={detailItems}
            selectedConceptId={activeConceptId}
            onSelectConcept={setSelectedConceptId}
            density="compact"
          />
        </div>
        )}

        {isMidtermDay && (
          <MidtermSetPanel
            items={detailItems}
            sets={sets}
            answersHistory={answersHistory}
            completedSets={completedSets}
            onStartPractice={onStartPractice}
          />
        )}

        <div className="h-28" aria-hidden="true" />
      </main>

      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] left-3 right-[5.25rem] z-40 grid grid-cols-[auto_minmax(0,1fr)] gap-2 rounded-xl bg-white/95 p-1.5 shadow-lg shadow-stone-900/10 backdrop-blur lg:hidden">
        {selectedDay.guidebookDayId && (
          <button
            type="button"
            data-tour-id="guidebook-cta"
            onClick={() => setGuideNotesOpen(true)}
            className="inline-flex min-h-11 w-12 cursor-pointer items-center justify-center rounded-lg border border-gray-border bg-white text-on-background transition hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25 active:scale-[0.98]"
            aria-label="Mở Guidebook"
            aria-haspopup="dialog"
            aria-expanded={guideNotesOpen}
            title="Guidebook"
          >
            <BookOpen className="h-5 w-5 stroke-[3]" aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          disabled={!canStartSelected}
          data-tour-id="practice-cta"
          onClick={() => {
            if (!selectedItem || !startSetId) return;
            onStartPractice(selectedItem.adapterSkill, startSetId);
          }}
          className={[
            'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-primary-green-dark bg-primary-green px-3 py-2 text-xs font-black uppercase text-white transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:border-gray-border-dark disabled:bg-gray-border disabled:text-stone-400',
            !selectedDay.guidebookDayId ? 'col-span-2' : '',
          ].join(' ')}
        >
          <Play className="h-4 w-4 fill-current stroke-[3]" aria-hidden="true" />
          {canStartSelected ? `Bắt đầu ${selectedDayLabel}` : 'Sắp mở'}
        </button>
      </div>

      <SofiCoachSheet
        isOpen={sofiCoachOpen}
        context={sofiContext}
        onClose={() => setSofiCoachOpen(false)}
        onAskAi={onOpenAiCoach ? () => onOpenAiCoach() : undefined}
      />

      <GuideNotesOverlay
        item={selectedItem}
        day={selectedDay}
        isOpen={guideNotesOpen}
        onClose={() => setGuideNotesOpen(false)}
        onOpenGuidebook={onSelectGuidebook}
      />
    </div>
  );
};
