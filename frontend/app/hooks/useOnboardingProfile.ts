"use client";

import { useEffect, useMemo, useState } from "react";
import { activeLearningLevel, levelThemes } from "../data";

type LearningLevelKey = keyof typeof levelThemes;
type CoreLevelKey = Extract<LearningLevelKey, "beginner" | "intermediate" | "advanced" | "master">;

export type StoredSubjectProfile = {
  subjectCode?: string;
  grade?: string;
  level?: LearningLevelKey;
  levelNumber?: number;
  xp?: number;
  nextXp?: number;
  progress?: number;
  score?: number;
  total?: number;
};

const PROFILE_KEY = "orbitlearn-subject-profiles";
const LEGACY_PROFILE_KEY = "orbitlearn-onboarding-profile";
const ACTIVE_SUBJECT_KEY = "orbitlearn-active-subject";

const levelDetails: Record<CoreLevelKey, {
  description: string;
  nextXp: number;
}> = {
  beginner: {
    description: "Đang củng cố nền tảng, học theo từng bước nhỏ",
    nextXp: 900,
  },
  intermediate: {
    description: "Nắm chắc nền tảng, đang tăng tốc lên Advanced",
    nextXp: 2400,
  },
  advanced: {
    description: "Đã xử lý tốt bài chuẩn, sẵn sàng luyện vận dụng",
    nextXp: 4200,
  },
  master: {
    description: "Thành thạo nội dung chính, ưu tiên bài thử thách",
    nextXp: 6000,
  },
};

const isLearningLevel = (value: unknown): value is CoreLevelKey => (
  value === "beginner" || value === "intermediate" || value === "advanced" || value === "master"
);

function readProfiles() {
  const rawProfiles = window.localStorage.getItem(PROFILE_KEY);
  if (!rawProfiles) return {};

  try {
    return JSON.parse(rawProfiles) as Record<string, StoredSubjectProfile>;
  } catch {
    return {};
  }
}

function readStoredProfile(subjectCode?: string) {
  const profiles = readProfiles();
  if (subjectCode && profiles[subjectCode]) return profiles[subjectCode];

  const activeSubjectCode = window.localStorage.getItem(ACTIVE_SUBJECT_KEY);
  if (!subjectCode && activeSubjectCode && profiles[activeSubjectCode]) return profiles[activeSubjectCode];

  const rawLegacyProfile = window.localStorage.getItem(LEGACY_PROFILE_KEY);
  if (!rawLegacyProfile) return null;

  try {
    const legacyProfile = JSON.parse(rawLegacyProfile) as StoredSubjectProfile;
    if (!subjectCode || subjectCode === "TO" || legacyProfile.subjectCode === subjectCode) return legacyProfile;
    return null;
  } catch {
    return null;
  }
}

export function saveSubjectProfile(subjectCode: string, profile: StoredSubjectProfile) {
  const profiles = readProfiles();
  const nextProfile = {
    ...profiles[subjectCode],
    ...profile,
    subjectCode,
  };

  profiles[subjectCode] = nextProfile;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles));
  window.localStorage.setItem(ACTIVE_SUBJECT_KEY, subjectCode);
  window.localStorage.setItem(LEGACY_PROFILE_KEY, JSON.stringify(nextProfile));
}

export function updateSubjectLearningProgress(subjectCode: string, delta: { xp?: number; progress?: number }) {
  const currentProfile = readStoredProfile(subjectCode) || { subjectCode, level: "beginner" as const };
  const currentXp = typeof currentProfile.xp === "number" ? currentProfile.xp : 0;
  const currentProgress = typeof currentProfile.progress === "number" ? currentProfile.progress : 0;

  saveSubjectProfile(subjectCode, {
    ...currentProfile,
    xp: Math.max(0, currentXp + (delta.xp || 0)),
    progress: Math.min(100, Math.max(0, currentProgress + (delta.progress || 0))),
  });
}

export function useSubjectProfiles() {
  const [profiles, setProfiles] = useState<Record<string, StoredSubjectProfile>>({});

  useEffect(() => {
    const data = readProfiles();
    setTimeout(() => {
      setProfiles(data);
    }, 0);
  }, []);

  return profiles;
}

export function useOnboardingProfile(subjectCode?: string) {
  const [profile, setProfile] = useState<StoredSubjectProfile | null>(null);

  useEffect(() => {
    const data = readStoredProfile(subjectCode);
    setTimeout(() => {
      setProfile(data);
    }, 0);
  }, [subjectCode]);

  const levelKey = isLearningLevel(profile?.level) ? profile.level : "beginner";
  const levelMeta = levelDetails[levelKey];
  const levelName = levelThemes[levelKey].label;
  const xp = typeof profile?.xp === "number" ? profile.xp : 0;
  const nextXp = typeof profile?.nextXp === "number" ? profile.nextXp : levelMeta.nextXp;
  const progress = typeof profile?.progress === "number" ? profile.progress : 0;
  const levelNumber = typeof profile?.levelNumber === "number" ? profile.levelNumber : 0;

  return useMemo(() => ({
    ...activeLearningLevel,
    key: levelKey,
    name: levelName,
    title: `Level ${levelNumber} · ${levelName}`,
    description: levelMeta.description,
    xp,
    nextXp,
    progress,
    subjectCode: profile?.subjectCode,
    grade: profile?.grade ? `Lớp ${profile.grade}` : undefined,
    placementScore: typeof profile?.score === "number" && typeof profile?.total === "number"
      ? `${profile.score}/${profile.total}`
      : undefined,
  }), [levelKey, levelMeta.description, levelName, levelNumber, nextXp, profile?.grade, profile?.score, profile?.subjectCode, profile?.total, progress, xp]);
}
