"use client";

import { useMemo, useSyncExternalStore } from "react";

export type LessonProgressRecord = {
  completedLessonIds: string[];
  updatedAt: string;
};

type LessonProgressStore = Record<string, LessonProgressRecord>;

const STORAGE_KEY = "mentora-lesson-progress";
const LEGACY_STORAGE_KEY = "orbitlearn-lesson-progress";
const CHANGE_EVENT = "mentora-lesson-progress-change";
const emptyRecord: LessonProgressRecord = { completedLessonIds: [], updatedAt: "" };

function progressKey(subjectCode: string, chapterNumber: string) {
  return `${subjectCode}:${chapterNumber}`;
}

function parseProgressStore(raw: string | null): LessonProgressStore {
  if (!raw) return {};

  try {
    return JSON.parse(raw) as LessonProgressStore;
  } catch {
    return {};
  }
}

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(CHANGE_EVENT, listener);
  };
}

function getSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem(LEGACY_STORAGE_KEY) || "";
}

export function completeLesson(subjectCode: string, chapterNumber: string, lessonId: string) {
  const store = parseProgressStore(window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem(LEGACY_STORAGE_KEY));
  const key = progressKey(subjectCode, chapterNumber);
  const current = store[key] || emptyRecord;
  const completedLessonIds = current.completedLessonIds.includes(lessonId)
    ? current.completedLessonIds
    : [...current.completedLessonIds, lessonId];

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...store,
    [key]: { completedLessonIds, updatedAt: new Date().toISOString() },
  }));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useLessonProgress(subjectCode: string, chapterNumber: string, lessonIds: string[]) {
  const rawStore = useSyncExternalStore(subscribe, getSnapshot, () => "");
  const key = progressKey(subjectCode, chapterNumber);
  const record = useMemo(() => parseProgressStore(rawStore)[key] || emptyRecord, [key, rawStore]);

  return useMemo(() => {
    const completedLessonIds = lessonIds.filter((lessonId) => record.completedLessonIds.includes(lessonId));
    const nextLessonIndex = Math.min(completedLessonIds.length, Math.max(lessonIds.length - 1, 0));

    return {
      completedLessonIds,
      completedCount: completedLessonIds.length,
      nextLessonIndex,
      isChapterComplete: lessonIds.length > 0 && completedLessonIds.length === lessonIds.length,
      isLessonComplete: (lessonId: string) => completedLessonIds.includes(lessonId),
      isLessonAvailable: (lessonId: string) => lessonIds.indexOf(lessonId) <= nextLessonIndex,
    };
  }, [lessonIds, record.completedLessonIds]);
}