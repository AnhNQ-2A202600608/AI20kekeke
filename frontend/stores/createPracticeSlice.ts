import { StateCreator } from "zustand";
import { BoundState } from "../hooks/useBoundStore";
import { Skill, ActivePracticeSession, Question } from "../lib/quiz/types";
import { getRequestAuthToken, isDemoAuthToken } from "../lib/auth-token";
import { isDemoMode } from "../lib/demo-mode";
import { getConceptCodeAliases } from "../lib/adaptive/concept-code-aliases";
import { getAggregateLearningElo } from "../lib/adaptive/elo";
import type { AdaptiveSubmitResult } from "../lib/adaptive/api-client";
import {
  masteryScoreFromBkt,
  masteryStatusFromBkt,
} from "../lib/adaptive/practice-scoring";

export interface ConceptMastery {
  conceptId: string;
  conceptCode: string;
  elo: number;
  bkt: number;
  masteryState: string;
  weaknessFlag: boolean;
  attemptCount: number;
  correctCount: number;
}

interface AdaptiveSubmitContext {
  conceptId?: string;
  question?: Question;
  skillId?: string;
  targetSetId?: string;
}

const MASTERY_FETCH_TTL_MS = 60_000;
const masteryFetchState = new Map<string, { fetchedAt: number; inFlight?: Promise<void> }>();

function hasSamePracticeQuestionIdentity(existing: Question, next: Question) {
  const existingAdaptiveId = existing.adaptive?.questionId;
  const nextAdaptiveId = next.adaptive?.questionId;
  if (existingAdaptiveId && nextAdaptiveId) {
    return existingAdaptiveId === nextAdaptiveId;
  }

  return existing.id === next.id;
}

async function parseMasteryError(response: Response) {
  try {
    const payload = await response.json();
    if (typeof payload?.detail === "string") return payload.detail;
    if (typeof payload?.message === "string") return payload.message;
    if (typeof payload?.error === "string") return payload.error;
  } catch {
    // Fall through to the generic status message.
  }

  return `Failed to fetch concept masteries with status ${response.status}`;
}

export interface PracticeSlice {
  skills: Skill[];
  conceptMasteries: Record<string, ConceptMastery>;
  activePracticeSession: ActivePracticeSession | null;
  activePracticeQuestions: any[];
  selectedPersona: 'student' | 'mentor' | 'btc';
  setPersona: (persona: 'student' | 'mentor' | 'btc') => void;
  initializeSkills: (initialSkills: Skill[]) => void;
  fetchConceptMasteries: (studentId: string, courseId: string) => Promise<void>;
  startPracticeSession: (skillId: string, questions: any[], targetSetId?: string, options?: {
    mode?: ActivePracticeSession['mode'];
    conceptId?: string;
    maxQuestions?: number;
  }) => void;
  appendActivePracticeQuestion: (question: Question) => void;
  submitPracticeAnswer: (
    questionId: string | number,
    selectedOption: string | undefined, 
    essayAnswer: string | undefined, 
    isCorrect: boolean,
    hintCount?: number
  ) => void;
  recordAdaptiveSubmitResult: (
    questionId: string | number,
    selectedOption: string | undefined,
    essayAnswer: string | undefined,
    submitResult: AdaptiveSubmitResult,
    hintCount?: number,
    context?: AdaptiveSubmitContext
  ) => void;
  savePracticeSession: (currentQuestionIndex: number) => void;
  resetPracticeSession: (skillId: string) => void;
  clearActiveSession: () => void;
}

export const createPracticeSlice: StateCreator<
  BoundState,
  [],
  [],
  PracticeSlice
> = (set, get) => ({
  skills: [],
  conceptMasteries: {},
  activePracticeSession: null,
  activePracticeQuestions: [],
  selectedPersona: 'student',

  setPersona: (persona) => set(() => ({ selectedPersona: persona })),

  initializeSkills: (initialSkills) => set((state) => {
    if (state.skills && state.skills.length > 0) {
      const existingIds = new Set(state.skills.map(s => s.id));
      const missingSkills = initialSkills.filter(s => !existingIds.has(s.id));
      if (missingSkills.length > 0) {
        return { skills: [...state.skills, ...missingSkills] };
      }
      return {};
    }
    return { skills: initialSkills };
  }),

  fetchConceptMasteries: async (studentId, courseId) => {
    const fetchKey = `${studentId}:${courseId}`;
    const currentFetch = masteryFetchState.get(fetchKey);
    const now = Date.now();
    if (currentFetch?.inFlight) {
      return currentFetch.inFlight;
    }
    if (currentFetch && now - currentFetch.fetchedAt < MASTERY_FETCH_TTL_MS) {
      return;
    }

    const fetchPromise = (async () => {
      let didFetch = false;
      try {
        const state = get();
        const { authToken, usedExpiredToken, rejectedDemoToken } = getRequestAuthToken(state.token);
        if (usedExpiredToken || rejectedDemoToken) {
          set({ token: "" });
        }
        if (isDemoMode() && isDemoAuthToken(authToken || state.token)) {
          return;
        }

        const params = new URLSearchParams({
          student_id: studentId,
          course_id: courseId,
        });
        const response = await fetch(`/api/v1/adaptive/mastery?${params.toString()}`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
          credentials: "same-origin",
        });

        if (response.status === 401) {
          set({ token: "" });
          return;
        }
        if (!response.ok) {
          throw new Error(await parseMasteryError(response));
        }

        const data = await response.json();
        const masteriesRecord: Record<string, ConceptMastery> = {};
        const completedFromDb: string[] = [];
        
        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            if (item.concept_code) {
              const mastery: ConceptMastery = {
                conceptId: item.concept_id,
                conceptCode: item.concept_code,
                elo: item.elo_score,
                bkt: item.bkt_mastery_probability,
                masteryState: item.mastery_state,
                weaknessFlag: item.weakness_flag,
                attemptCount: item.attempt_count,
                correctCount: item.correct_count,
              };
              getConceptCodeAliases(item.concept_code).forEach((alias) => {
                masteriesRecord[alias] = { ...mastery, conceptCode: alias };
              });
              
              if (item.attempt_count > 0) {
                completedFromDb.push(...getConceptCodeAliases(item.concept_code));
              }
            }
          });
        }
        
        set((state) => {
          const updatedSkills = state.skills.map(skill => {
            const associatedSets = skill.associatedSets || [];
            let sumElo = 0;
            let sumBkt = 0;
            let counted = 0;
            associatedSets.forEach(code => {
              const mast = masteriesRecord[code];
              if (mast) {
                sumElo += mast.elo;
                sumBkt += mast.bkt;
                counted++;
              }
            });
            
            const aggregateElo = counted > 0 ? Math.round(sumElo / counted) : 1000;
            const aggregateBkt = counted > 0 ? sumBkt / counted : 0;
            const newMasteryScore = counted > 0 ? masteryScoreFromBkt(aggregateBkt) : 0;
            const newStatus = counted > 0 ? masteryStatusFromBkt(aggregateBkt) : 'NOT_STARTED';
            
            return {
              ...skill,
              elo: aggregateElo,
              masteryScore: newMasteryScore,
              status: newStatus
            };
          });
          
          return {
            conceptMasteries: masteriesRecord,
            completedSets: completedFromDb,
            skills: updatedSkills
          };
        });
        didFetch = true;
      } catch (err) {
        console.error('[fetchConceptMasteries] Failed:', err);
      } finally {
        if (didFetch) {
          masteryFetchState.set(fetchKey, { fetchedAt: Date.now() });
        } else if (masteryFetchState.get(fetchKey)?.inFlight) {
          masteryFetchState.delete(fetchKey);
        }
      }
    })();

    masteryFetchState.set(fetchKey, { fetchedAt: currentFetch?.fetchedAt ?? 0, inFlight: fetchPromise });
    return fetchPromise;
  },

  startPracticeSession: (skillId, questions, targetSetId, options) => set((state) => {
    if (
      state.activePracticeSession &&
      state.activePracticeSession.skillId === skillId &&
      state.activePracticeSession.targetSetId === targetSetId &&
      state.activePracticeSession.mode === options?.mode
    ) {
      return {};
    }
    
    const conceptCode = targetSetId || 'day1-basics';
    const startElo = state.conceptMasteries[conceptCode]?.elo || 1200;
    const startAggregateElo = getAggregateLearningElo(state.conceptMasteries);

    const newSession = {
      skillId,
      currentQuestionIndex: 0,
      questionIdsPool: questions.map(q => q.id),
      responses: {},
      targetSetId,
      startElo,
      startAggregateElo,
      mode: options?.mode || 'static-demo',
      conceptId: options?.conceptId,
      startedAt: new Date().toISOString(),
      maxQuestions: options?.maxQuestions
    };
    return {
      activePracticeQuestions: questions,
      activePracticeSession: newSession
    };
  }),

  appendActivePracticeQuestion: (question) => set((state) => {
    if (!state.activePracticeSession) return {};
    if (state.activePracticeQuestions.some(q => hasSamePracticeQuestionIdentity(q, question))) return {};

    return {
      activePracticeQuestions: [...state.activePracticeQuestions, question],
      activePracticeSession: {
        ...state.activePracticeSession,
        questionIdsPool: [...state.activePracticeSession.questionIdsPool, question.id]
      }
    };
  }),

  submitPracticeAnswer: (questionId, selectedOption, essayAnswer, isCorrect, hintCount = 0) => set((state) => {
    if (!state.activePracticeSession) return {};

    const responses = {
      ...state.activePracticeSession.responses,
      [questionId]: { selected: selectedOption, essayAnswer, isCorrect, hintCount }
    };

    return {
      activePracticeSession: {
        ...state.activePracticeSession,
        responses
      }
    };
  }),

  recordAdaptiveSubmitResult: (questionId, selectedOption, essayAnswer, submitResult, hintCount = 0, context) => set((state) => {
    const session = state.activePracticeSession;
    const question = state.activePracticeQuestions.find(q => q.id === questionId) || context?.question;
    const conceptCode = question?.setId || context?.targetSetId || session?.targetSetId || 'day1-basics';
    const skillId = session?.skillId || context?.skillId;
    if (!skillId) return {};

    const skill = state.skills.find(s => s.id === skillId);
    const previous = state.conceptMasteries[conceptCode];

    const responses = {
      ...(session?.responses || {}),
      [questionId]: {
        selected: selectedOption,
        essayAnswer,
        isCorrect: submitResult.is_correct,
        hintCount,
        adaptiveDecisionId: question?.adaptive?.decisionId,
        submitResult
      }
    };

    const updatedConceptMastery: ConceptMastery = {
      conceptId: session?.conceptId || context?.conceptId || previous?.conceptId || question?.adaptive?.conceptId || '',
      conceptCode,
      elo: Math.round(submitResult.new_elo),
      bkt: submitResult.new_bkt,
      masteryState: submitResult.mastery_state,
      weaknessFlag: submitResult.weakness_flag,
      attemptCount: (previous?.attemptCount || 0) + 1,
      correctCount: (previous?.correctCount || 0) + (submitResult.is_correct ? 1 : 0)
    };

    const conceptAliases = new Set(getConceptCodeAliases(conceptCode));
    conceptAliases.add(conceptCode);
    const newConceptMasteries: Record<string, ConceptMastery> = {};

    Object.entries(state.conceptMasteries).forEach(([key, mastery]) => {
      const matchesSameConcept = Boolean(updatedConceptMastery.conceptId && mastery.conceptId === updatedConceptMastery.conceptId);
      const matchesAlias = conceptAliases.has(key) || conceptAliases.has(mastery.conceptCode);
      newConceptMasteries[key] = matchesSameConcept || matchesAlias
        ? { ...updatedConceptMastery, conceptCode: key }
        : mastery;
    });

    conceptAliases.forEach((alias) => {
      newConceptMasteries[alias] = { ...updatedConceptMastery, conceptCode: alias };
    });

    const associatedSets = skill?.associatedSets || [];
    let sumElo = 0;
    let sumBkt = 0;
    let counted = 0;
    associatedSets.forEach(code => {
      const mast = newConceptMasteries[code];
      if (mast) {
        sumElo += mast.elo;
        sumBkt += mast.bkt;
        counted++;
      }
    });

    const aggregateElo = counted > 0 ? Math.round(sumElo / counted) : updatedConceptMastery.elo;
    const aggregateBkt = counted > 0 ? sumBkt / counted : updatedConceptMastery.bkt;
    const newMasteryScore = masteryScoreFromBkt(aggregateBkt);
    const newStatus = masteryStatusFromBkt(aggregateBkt);
    const eloDelta = Math.round((submitResult.new_elo - submitResult.old_elo) * 10) / 10;
    const calculation = submitResult.calculation_log;
    const formulaHintSuffix = (calculation?.hint_count ?? hintCount) > 0
      ? ` x ${calculation?.hint_discount ?? 1}`
      : '';
    const formulaNote = calculation
      ? [
          `Elo = ${Math.round(calculation.old_elo ?? submitResult.old_elo)}`,
          `+ ${calculation.k_student ?? 0} x (${calculation.actual_score ?? submitResult.actual_score} - ${calculation.expected_success ?? 0})`,
          `${formulaHintSuffix} = ${Math.round(calculation.new_elo ?? submitResult.new_elo)}`,
        ].join(' ')
      : `Elo ${Math.round(submitResult.old_elo)} -> ${Math.round(submitResult.new_elo)} sau lượt luyện tập.`;
    const eventId = question?.adaptive?.decisionId || `${session?.startedAt || context?.targetSetId || 'session'}:${questionId}`;

    return {
      conceptMasteries: newConceptMasteries,
      eloHistoryEvents: [
        {
          id: eventId,
          conceptCode,
          conceptId: updatedConceptMastery.conceptId,
          conceptTitle: skill?.name || conceptCode,
          delta: eloDelta,
          oldElo: Math.round(submitResult.old_elo),
          newElo: Math.round(submitResult.new_elo),
          occurredAt: new Date().toISOString(),
          scope: 'concept' as const,
          source: 'practice' as const,
          note: formulaNote,
          calculationLog: calculation ?? null
        },
        ...state.eloHistoryEvents.filter((event) => event.id !== eventId)
      ].slice(0, 20),
      skills: state.skills.map(s =>
        s.id === skillId
          ? { ...s, elo: aggregateElo, masteryScore: newMasteryScore, status: newStatus }
          : s
      ),
      activePracticeSession: session
        ? {
            ...session,
            responses
          }
        : null
    };
  }),

  savePracticeSession: (currentQuestionIndex) => set((state) => {
    if (!state.activePracticeSession) return {};
    return {
      activePracticeSession: {
        ...state.activePracticeSession,
        currentQuestionIndex
      }
    };
  }),

  resetPracticeSession: (skillId) => set((state) => {
    const updatedSkills = state.skills.map(s => 
      s.id === skillId
        ? { ...s, elo: 1000, masteryScore: 0, status: 'NOT_STARTED' as const }
        : s
    );
    
    // If the active session is for this skill, clear it
    const activeSession = state.activePracticeSession;
    const isCurrentActive = activeSession?.skillId === skillId;

    return {
      skills: updatedSkills,
      activePracticeSession: isCurrentActive ? null : activeSession,
      activePracticeQuestions: isCurrentActive ? [] : state.activePracticeQuestions
    };
  }),

  clearActiveSession: () => set(() => ({
    activePracticeSession: null,
    activePracticeQuestions: []
  }))
});
