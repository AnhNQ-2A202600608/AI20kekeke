'use client';

import React, { useEffect, useMemo, useState } from 'react';

import { AppTopNav } from '@/components/app/app-top-nav';
import { MascotLoadingBlock } from '@/components/mascot';
import { useBoundStore } from '@/hooks/useBoundStore';
import { getAggregateLearningElo } from '@/lib/adaptive/elo';
import type { PersonaType } from '@/lib/dashboard-tabs';
import { loadSkillsManifest } from '@/lib/quiz/manifest-client';
import type { Skill } from '@/lib/quiz/types';

import { PracticeGardenPage } from './practice-garden/practice-garden-page';
import {
  createPracticeGardenModel,
  type PracticeGardenSkill,
} from './practice-garden/practice-garden-data';

interface SkillsPracticeTabProps {
  onStartPractice: (skill: Skill, targetSetId?: string) => void;
  onOpenLogin?: () => void;
  onOpenProfile?: () => void;
}

const courseDays = [
  { id: 'day1', label: 'Ngày 1', desc: 'LLM Foundations' },
  { id: 'day2', label: 'Ngày 2', desc: 'AI formulation & Data' },
  { id: 'day3', label: 'Ngày 3', desc: 'ReAct Agent Loop' },
  { id: 'day4', label: 'Ngày 4', desc: 'Prompt & Tool Calling' },
  { id: 'day5', label: 'Ngày 5', desc: 'AI Product Uncertainty' },
  { id: 'day7', label: 'Ngày 7', desc: 'Embedding & Vector DB' },
  { id: 'day8', label: 'Ngày 8', desc: 'RAG Pipelines & Search' },
];

export const SkillsPracticeTab: React.FC<SkillsPracticeTabProps> = ({
  onStartPractice,
  onOpenLogin,
  onOpenProfile,
}) => {
  const {
    skills,
    conceptMasteries,
    initializeSkills,
    activePracticeSession,
    clearActiveSession,
    activeDays,
    eloHistoryEvents,
    loggedIn,
    logOut,
    mssv,
    name,
    role,
    selectedPersona,
    setPersona,
    streak,
    username,
    xp,
  } = useBoundStore();

  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string>('');

  useEffect(() => {
    async function hydrateSkillsManifest() {
      try {
        const data = await loadSkillsManifest();
        if (data?.skills) {
          initializeSkills(data.skills);
        }
      } catch (err) {
        console.error('Failed to load skills manifest:', err);
      }
    }

    hydrateSkillsManifest();
  }, [initializeSkills]);

  const gardenModel = useMemo(() => (
    createPracticeGardenModel({
      skills,
      days: courseDays,
      selectedDayId,
      activePracticeSession,
    })
  ), [activePracticeSession, selectedDayId, skills]);

  const selectedSkill = useMemo(() => (
    gardenModel.gardenSkills.find((skill) => skill.id === selectedSkillId)
      || gardenModel.recommendedSkill
      || gardenModel.gardenSkills[0]
      || null
  ), [gardenModel.gardenSkills, gardenModel.recommendedSkill, selectedSkillId]);

  const activeSessionSkill = activePracticeSession
    ? skills.find((skill) => skill.id === activePracticeSession.skillId)
    : null;

  const averageMastery = useMemo(() => {
    if (gardenModel.gardenSkills.length === 0) return 0;
    return Math.round(
      gardenModel.gardenSkills.reduce((sum, skill) => sum + skill.mastery, 0) / gardenModel.gardenSkills.length,
    );
  }, [gardenModel.gardenSkills]);

  const averageElo = useMemo(() => {
    const aggregateElo = getAggregateLearningElo(conceptMasteries, 0);
    if (aggregateElo > 0) return aggregateElo;
    const gardenEloValues = gardenModel.gardenSkills
      .map((skill) => Number(skill.elo))
      .filter((value) => Number.isFinite(value) && value > 0);

    if (gardenEloValues.length === 0) return 1000;
    return Math.round(gardenEloValues.reduce((sum, value) => sum + value, 0) / gardenEloValues.length);
  }, [conceptMasteries, gardenModel.gardenSkills]);

  const handleStartGardenSkill = (gardenSkill: PracticeGardenSkill) => {
    if (gardenSkill.state === 'locked') return;

    if (activePracticeSession?.skillId === gardenSkill.id) {
      const activeSkill = skills.find((skill) => skill.id === activePracticeSession.skillId);
      if (activeSkill) {
        onStartPractice(activeSkill, activePracticeSession.targetSetId);
      }
      return;
    }

    setIsLoading(true);
    setLoadingText(`Sofi đang tưới luống ${gardenSkill.name}...`);
    window.setTimeout(() => {
      setIsLoading(false);
      onStartPractice(gardenSkill.sourceSkill, gardenSkill.activeSetId);
    }, 120);
  };

  const handleResumeActiveSession = () => {
    if (!activePracticeSession) return;

    const activeSkill = skills.find((skill) => skill.id === activePracticeSession.skillId);
    if (activeSkill) {
      onStartPractice(activeSkill, activePracticeSession.targetSetId);
    }
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-[82rem] flex-col overflow-hidden px-3 pb-2 pt-0 font-be-vietnam-pro">
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm">
          <MascotLoadingBlock
            title={loadingText || 'Sofi đang chuẩn bị phiên luyện...'}
            description="Đang nối bạn vào bài luyện phù hợp"
            className="w-full max-w-sm border-2 border-gray-border shadow-2xl"
          />
        </div>
      )}

      <AppTopNav
        activeDays={activeDays}
        title="Vườn kỹ năng"
        subtitle={`${gardenModel.gardenSkills.length} kỹ năng • ${courseDays.length} ngày • ${averageMastery}% thành thạo`}
        averageElo={averageElo}
        displayName={name || username || 'Học viên EduGap'}
        eloHistoryEvents={eloHistoryEvents}
        initial={(name || username || 'N').trim().charAt(0).toUpperCase() || 'N'}
        loggedIn={loggedIn}
        mssv={mssv}
        onLogOut={logOut}
        onOpenLogin={onOpenLogin}
        onOpenProfile={onOpenProfile}
        role={role}
        selectedPersona={selectedPersona as PersonaType}
        setPersona={setPersona}
        streak={streak}
        xp={xp}
      />

      <div className="min-h-0 flex-1">
        <PracticeGardenPage
          dayOptions={gardenModel.dayOptions}
          selectedDayId={selectedDayId}
          onSelectDay={setSelectedDayId}
          skills={gardenModel.gardenSkills}
          recommendedSkill={gardenModel.recommendedSkill}
          selectedSkill={selectedSkill}
          activePracticeSession={activePracticeSession}
          activeSessionSkillName={activeSessionSkill?.name}
          onSelectSkill={setSelectedSkillId}
          onStartSkill={handleStartGardenSkill}
          onResumeSession={handleResumeActiveSession}
          onClearSession={clearActiveSession}
        />
      </div>
    </div>
  );
};
