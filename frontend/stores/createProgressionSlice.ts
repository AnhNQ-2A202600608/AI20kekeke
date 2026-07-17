import { StateCreator } from "zustand";
import { BoundState } from "../hooks/useBoundStore";

export interface EloHistoryEvent {
  id: string;
  aggregateLog?: {
    conceptCount?: number;
    formula?: string;
  } | null;
  conceptCode?: string;
  conceptId?: string;
  conceptTitle: string;
  delta: number;
  newElo: number;
  occurredAt: string;
  oldElo: number;
  scope?: 'concept' | 'aggregate';
  source: 'practice' | 'review' | 'decay' | 'manual' | 'aggregate';
  note?: string;
  calculationLog?: {
    formula?: string;
    old_elo?: number;
    new_elo?: number;
    elo_delta?: number;
    question_difficulty_elo?: number;
    expected_success?: number;
    actual_score?: number;
    raw_score_delta?: number;
    hint_count?: number;
    hint_discount?: number;
    k_student?: number;
    used_ai_help?: boolean;
  } | null;
}

export interface ProgressionSlice {
  xp: number;
  streak: number;
  activeDays: string[];
  completedSets: string[];
  eloHistoryEvents: EloHistoryEvent[];
  devMode: boolean;
  selectedLearningDayId: string | null;
  selectedLearningTrackId: string | null;
  addXp: (amount: number) => void;
  setStreak: (count: number) => void;
  addActiveDay: (dayStr: string) => void;
  addCompletedSet: (setId: string) => void;
  addEloHistoryEvent: (event: EloHistoryEvent) => void;
  setSelectedLearningDay: (dayId: string | null) => void;
  setSelectedLearningTrack: (trackId: string | null) => void;
  toggleDevMode: () => void;
}

export const createProgressionSlice: StateCreator<
  BoundState,
  [],
  [],
  ProgressionSlice
> = (set) => ({
  xp: 0,
  streak: 1,
  activeDays: [],
  completedSets: [],
  eloHistoryEvents: [],
  devMode: false,
  selectedLearningDayId: null,
  selectedLearningTrackId: null,
  addXp: (amount) => set((state) => ({ xp: state.xp + amount })),
  setStreak: (count) => set(() => ({ streak: count })),
  addActiveDay: (dayStr) => set((state) => {
    if (state.activeDays.includes(dayStr)) return {};
    return { activeDays: [...state.activeDays, dayStr] };
  }),
  addCompletedSet: (setId) => set((state) => {
    if (state.completedSets.includes(setId)) return {};
    return { completedSets: [...state.completedSets, setId] };
  }),
  addEloHistoryEvent: (event) => set((state) => ({
    eloHistoryEvents: [event, ...state.eloHistoryEvents.filter((existing) => existing.id !== event.id)].slice(0, 20),
  })),
  setSelectedLearningDay: (dayId) => set(() => ({ selectedLearningDayId: dayId })),
  setSelectedLearningTrack: (trackId) => set(() => ({ selectedLearningTrackId: trackId })),
  toggleDevMode: () => set((state) => ({ devMode: !state.devMode })),
});
