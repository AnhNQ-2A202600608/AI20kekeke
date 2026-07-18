'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import dayjs from 'dayjs';
import posthog from 'posthog-js';
import { trackQuizEvent } from '@/lib/analytics';
import {
  getAllowedPersonas,
  getAllowedTabsForPersona,
  getDefaultTabForPersona,
  resolvePersonaForRole,
  type PersonaType,
  type TabType,
} from '@/lib/dashboard-tabs';
import { getTabForRoute } from '@/lib/dashboard-routes';
import { FALLBACK_DATA } from '@/lib/quiz/constants';
import { loadQuizManifest, loadSkillsManifest } from '@/lib/quiz/manifest-client';
import { getStreak } from '@/lib/quiz/progress';
import type { Question, QuestionsData, Skill } from '@/lib/quiz/types';
import { useBoundStore } from '@/hooks/useBoundStore';
import {
  DEFAULT_ADAPTIVE_COURSE_ID,
  AdaptiveApiError,
  recommendAdaptiveQuestion,
  submitAdaptiveAnswer,
  type AdaptiveSubmitResult,
} from '@/lib/adaptive/api-client';
import { resolveAdaptiveConceptCandidates, resolveAdaptiveConceptId } from '@/lib/adaptive/concept-map';
import { getAggregateLearningEloDetails } from '@/lib/adaptive/elo';
import { buildAdaptiveQuestion, buildMcqStudentAnswer } from '@/lib/adaptive/quiz-question';

const staticQuestionFetches = new Map<string, Promise<Question[] | null>>();
const guidebookFetches = new Map<string, Promise<string | null>>();

function getAdaptiveQuestionId(question?: Question | null) {
  return question?.adaptive?.questionId || null;
}

function hasSameQuestionIdentity(existing: Question, next: Question) {
  const existingAdaptiveId = getAdaptiveQuestionId(existing);
  const nextAdaptiveId = getAdaptiveQuestionId(next);
  if (existingAdaptiveId && nextAdaptiveId) {
    return existingAdaptiveId === nextAdaptiveId;
  }

  return existing.id === next.id;
}

export function useQuizSession(resetSurveys: (setId: string) => void, initialTab: TabType = 'learn') {
  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [hasOpenedChat, setHasOpenedChat] = useState<boolean>(initialTab === 'chat');
  const hasHandledInitialUrlRef = useRef<boolean>(false);

  useEffect(() => {
    if (activeTab === 'chat') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasOpenedChat(true);
    }
  }, [activeTab]);

  const [isQuizMode, setIsQuizMode] = useState<boolean>(false);
  const lastInitializedSetIdRef = useRef<string | null>(null);

  // Guidebook inline states
  const [activeGuidebookDayId, setActiveGuidebookDayId] = useState<string | null>(null);
  const [guidebookHtml, setGuidebookHtml] = useState<string>('');
  const [isLoadingGuidebook, setIsLoadingGuidebook] = useState<boolean>(false);

  // Gamified progression state (bound to Zustand Store)
  const {
    xp,
    addXp,
    streak,
    setStreak,
    activeDays,
    addActiveDay,
    completedSets,
    addCompletedSet,
    eloHistoryEvents,
    addEloHistoryEvent,
    devMode,
    toggleDevMode,
    name,
    username,
    mssv,
    role,
    loggedIn,
    joinedAt,
    logOut,
    selectedPersona,
    setPersona,
    skills,
    initializeSkills,
    startPracticeSession,
    userId,
    fetchConceptMasteries,
    activePracticeSession,
    conceptMasteries,
    activePracticeQuestions,
    submitPracticeAnswer,
    recordAdaptiveSubmitResult,
    appendActivePracticeQuestion,
    savePracticeSession,
    clearActiveSession,
    token,
    setToken,
  } = useBoundStore();

  const resolveUrlTab = useCallback((requestedTab: TabType | null): { persona: PersonaType; tab: TabType } => {
    const currentPersona = resolvePersonaForRole(selectedPersona, role);
    const currentPersonaTabs = getAllowedTabsForPersona(currentPersona, role);

    if (requestedTab && currentPersonaTabs.has(requestedTab)) {
      return { persona: currentPersona, tab: requestedTab };
    }

    if (requestedTab) {
      const matchingPersona = getAllowedPersonas(role).find((persona) =>
        getAllowedTabsForPersona(persona, role).has(requestedTab)
      );

      if (matchingPersona) {
        return { persona: matchingPersona, tab: requestedTab };
      }
    }

    return { persona: currentPersona, tab: getDefaultTabForPersona(currentPersona) };
  }, [role, selectedPersona]);

  const applyUrlTab = useCallback((requestedTab: TabType | null) => {
    const resolved = resolveUrlTab(requestedTab);
    if (resolved.persona !== selectedPersona) {
      setPersona(resolved.persona);
    }
    setActiveTab(resolved.tab);
  }, [resolveUrlTab, selectedPersona, setPersona]);

  useEffect(() => {
    const resolvedPersona = resolvePersonaForRole(selectedPersona, role);
    const allowedTabs = getAllowedTabsForPersona(resolvedPersona, role);
    const defaultTab = getDefaultTabForPersona(resolvedPersona);

    if (resolvedPersona !== selectedPersona) {
      setPersona(resolvedPersona);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveTab((currentTab) => {
      if (allowedTabs.has(currentTab)) {
        return currentTab;
      }

      return defaultTab;
    });
  }, [role, selectedPersona, setPersona]);

  // Core quiz state
  const [data, setData] = useState<QuestionsData>(FALLBACK_DATA);
  const [activeSetId, setActiveSetId] = useState<string>('day1-basics');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [answersHistory, setAnswersHistory] = useState<{
    [setId: string]: {
      [qId: string]: {
        selected?: string;
        essayAnswer?: string;
        checkedPoints?: string[];
        isCorrect: boolean;
        hintCount?: number;
        adaptiveDecisionId?: string;
        submitResult?: AdaptiveSubmitResult;
      };
    };
  }>({});
  const [showFinishScreen, setShowFinishScreen] = useState<boolean>(false);
  const [essayInput, setEssayInput] = useState<string>('');
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(true);
  const [isLoadingNextQuestion, setIsLoadingNextQuestion] = useState<boolean>(false);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState<boolean>(false);
  const [adaptiveError, setAdaptiveError] = useState<string | null>(null);
  const adaptivePrefetchPromiseRef = useRef<Promise<Question | null> | null>(null);
  const adaptivePrefetchKeyRef = useRef<string | null>(null);
  const adaptiveStartInFlightSetRef = useRef<string | null>(null);
  const adaptiveQuestionIdsBySetRef = useRef<Map<string, Set<string>>>(new Map());
  const staticQuestionsInFlightSetRef = useRef<string | null>(null);

  // Synchronize state changes to URL query parameters (Shallow routing)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!hasHandledInitialUrlRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const currentMode = params.get('mode');
    const currentSet = params.get('set');
    const currentTab = params.get('tab');
    const resolvedPersona = resolvePersonaForRole(selectedPersona, role);
    const currentTabForCompare = currentTab ?? getDefaultTabForPersona(resolvedPersona);
    const routeTab = getTabForRoute(window.location.pathname);

    const nextMode = isQuizMode ? 'quiz' : null;
    const nextSet = isQuizMode ? activeSetId : null;
    const nextTab = !isQuizMode && routeTab !== activeTab ? activeTab : null;

    let hasChanged = false;
    const newUrl = new URL(window.location.href);

    if (isQuizMode) {
      if (currentMode !== 'quiz' || currentSet !== activeSetId) {
        newUrl.searchParams.set('mode', 'quiz');
        newUrl.searchParams.set('set', activeSetId);
        newUrl.searchParams.delete('tab');
        newUrl.searchParams.delete('quizView');
        hasChanged = true;
      }
      if (newUrl.searchParams.has('quizView')) {
        newUrl.searchParams.delete('quizView');
        hasChanged = true;
      }
    } else {
      if (currentMode !== null || currentSet !== null || currentTabForCompare !== activeTab) {
        newUrl.searchParams.delete('mode');
        newUrl.searchParams.delete('set');
        if (routeTab === activeTab) {
          newUrl.searchParams.delete('tab');
        } else if (activeTab && activeTab !== 'learn') {
          newUrl.searchParams.set('tab', activeTab);
        } else {
          newUrl.searchParams.delete('tab');
        }
        hasChanged = true;
      }

      if (activeTab !== 'quiz-editor' && newUrl.searchParams.has('quizView')) {
        newUrl.searchParams.delete('quizView');
        hasChanged = true;
      }
    }

    if (hasChanged) {
      window.history.pushState({ mode: nextMode, set: nextSet, tab: nextTab }, '', newUrl.toString());
    }
  }, [isQuizMode, activeSetId, activeTab, role, selectedPersona]);

  // Listen to browser Back/Forward (popstate)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      const set = params.get('set');
      const tab = params.get('tab') as TabType | null;
      const routeTab = getTabForRoute(window.location.pathname);

      if (mode === 'quiz' && set) {
        setIsQuizMode(true);
        setActiveSetId(set);
      } else {
        setIsQuizMode(false);
        applyUrlTab(tab || routeTab);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [applyUrlTab]);

  // Read initial tab parameter from URL query string on mount
  useEffect(() => {
    if (typeof window === 'undefined') {
      hasHandledInitialUrlRef.current = true;
      return;
    }
    if (hasHandledInitialUrlRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as TabType | null;
    const routeTab = getTabForRoute(window.location.pathname);
    const initialTab = tabParam || routeTab;

    const initialUrlSync = window.setTimeout(() => {
      if (hasHandledInitialUrlRef.current) return;
      // Let the URL sync effect run only after the initial tab query is read.
      // Otherwise it can remove ?tab=... while activeTab is still the default.
      hasHandledInitialUrlRef.current = true;
      applyUrlTab(initialTab);
    }, 0);

    return () => window.clearTimeout(initialUrlSync);
  }, [applyUrlTab]);

  // Leaderboard scope state
  const [leaderboardScope, setLeaderboardScope] = useState<'daily' | 'global'>('daily');

  // Load guidebook content inline
  const handleSelectGuidebook = async (dayId: string) => {
    setActiveGuidebookDayId(dayId);
    setIsLoadingGuidebook(true);
    setGuidebookHtml('');
    try {
      const existingFetch = guidebookFetches.get(dayId);
      const guidebookFetch = existingFetch || (async () => {
        const response = await fetch(
          `/api/guidebook/${encodeURIComponent(dayId)}`,
          process.env.NODE_ENV === 'development' ? { cache: 'no-store' } : { cache: 'force-cache' }
        );
        if (!response.ok) {
          return null;
        }
        const resData = await response.json();
        return typeof resData.html === 'string' ? resData.html : null;
      })();
      if (!existingFetch) {
        guidebookFetches.set(dayId, guidebookFetch);
        void guidebookFetch.finally(() => {
          if (guidebookFetches.get(dayId) === guidebookFetch) {
            guidebookFetches.delete(dayId);
          }
        });
      }

      const html = await guidebookFetch;
      if (html) {
        setGuidebookHtml(html);
      } else {
        setGuidebookHtml('<p class="text-xs font-semibold text-stone-500">Không tìm thấy hướng dẫn cho ngày học này.</p>');
      }
    } catch (err) {
      console.error('Error fetching guidebook:', err);
      setGuidebookHtml('<p class="text-xs font-semibold text-stone-500">Không thể tải hướng dẫn lúc này.</p>');
    } finally {
      setIsLoadingGuidebook(false);
    }
  };

  const handleCloseGuidebook = () => {
    setActiveGuidebookDayId(null);
    setGuidebookHtml('');
  };

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem('mentora_answers_history');
      if (savedHistory) {
        try {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setAnswersHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error('Failed to parse answers history:', e);
        }
      }
    }
  }, []);

  // Synchronize and calculate streak based on activeDays
  useEffect(() => {
    const computedStreak = getStreak(activeDays);
    if (computedStreak !== streak) {
      setStreak(computedStreak);
    }
  }, [activeDays, streak, setStreak]);

  // Reset guidebook view when switching tabs
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveGuidebookDayId(null);
    setGuidebookHtml('');
  }, [activeTab]);

  const activeSet = data.sets.find(s => s.id === activeSetId) || data.sets[0];
  const questionsList = useMemo(() => activeSet?.questions || [], [activeSet]);
  const isAdaptiveSession = activePracticeSession?.mode === 'adaptive' && activePracticeSession.targetSetId === activeSetId;
  const adaptiveMaxQuestions = activePracticeSession?.maxQuestions || 10;
  const totalQuestions = isAdaptiveSession ? adaptiveMaxQuestions : questionsList.length;
  const currentQuestionIdxBounded = questionsList.length > 0 ? Math.min(currentQuestionIdx, questionsList.length - 1) : 0;
  const currentQuestion = questionsList[currentQuestionIdxBounded];

  // Derive active question states on-the-fly based on answersHistory
  const currentHistory = currentQuestion && activeSetId ? answersHistory[activeSetId]?.[currentQuestion.id] : undefined;
  const selectedOption = currentHistory ? currentHistory.selected : null;
  const isSubmitted = !!currentHistory;
  const showExplanation = isSubmitted;
  const currentQuestionHasMcqOptions = Boolean(
    currentQuestion?.options &&
    Object.values(currentQuestion.options).some((option) => typeof option === 'string' && option.trim().length > 0)
  );
  const isCurrentEssayQuestion = Boolean(
    currentQuestion &&
    (currentQuestion.type === 'short_answer' || !currentQuestionHasMcqOptions || currentQuestion.expected_answer)
  );
  const isEssayCompleted = isCurrentEssayQuestion
    ? (selectedOption === 'essay_correct' || selectedOption === 'essay_incorrect')
    : true;

  const getExistingAdaptiveQuestionIds = useCallback((setId: string) => {
    const existingIds = new Set<string>(adaptiveQuestionIdsBySetRef.current.get(setId) || []);
    const setQuestions = data.sets.find(set => set.id === setId)?.questions || [];

    [...setQuestions, ...activePracticeQuestions].forEach((question: Question) => {
      if (question?.adaptive?.questionId) {
        existingIds.add(question.adaptive.questionId);
      }
    });

    return Array.from(existingIds);
  }, [activePracticeQuestions, data.sets]);

  const rememberAdaptiveQuestion = useCallback((setId: string, question: Question) => {
    const questionId = question.adaptive?.questionId;
    if (!questionId) return;

    const existingIds = adaptiveQuestionIdsBySetRef.current.get(setId) || new Set<string>();
    existingIds.add(questionId);
    adaptiveQuestionIdsBySetRef.current.set(setId, existingIds);
  }, []);

  const resetAdaptiveQuestionMemory = useCallback((setId: string) => {
    adaptiveQuestionIdsBySetRef.current.delete(setId);
    adaptivePrefetchKeyRef.current = null;
    adaptivePrefetchPromiseRef.current = null;
  }, []);

  const recommendWithConceptFallback = useCallback(async (
    setId: string,
    preferredConceptId?: string | null,
    excludedQuestionIds: string[] = [],
  ) => {
    const resolvedCandidates = resolveAdaptiveConceptCandidates(setId, conceptMasteries);
    const candidateConceptIds = Array.from(new Set((
      preferredConceptId && !resolvedCandidates.includes(preferredConceptId)
        ? [preferredConceptId, ...resolvedCandidates]
        : resolvedCandidates
    ).filter(Boolean) as string[]));

    let lastError: unknown = null;
    for (const conceptId of candidateConceptIds) {
      try {
        const recommendation = await recommendAdaptiveQuestion({
          token,
          setToken,
          studentId: userId as string,
          courseId: DEFAULT_ADAPTIVE_COURSE_ID,
          conceptId,
          excludedQuestionIds,
          setId,
        });
        return { recommendation, conceptId };
      } catch (error) {
        lastError = error;
        if (!(error instanceof AdaptiveApiError) || error.status !== 404) {
          throw error;
        }
      }
    }

    throw lastError || new Error(`No adaptive recommendation candidates for set ${setId}`);
  }, [conceptMasteries, setToken, token, userId]);

  const recommendUniqueAdaptiveQuestion = useCallback(async (
    setId: string,
    preferredConceptId?: string | null,
  ) => {
    let excludedQuestionIds = getExistingAdaptiveQuestionIds(setId);
    let lastDuplicateId: string | null = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const { recommendation, conceptId } = await recommendWithConceptFallback(
        setId,
        preferredConceptId,
        excludedQuestionIds,
      );
      const question = buildAdaptiveQuestion(recommendation, setId, conceptId);
      const adaptiveQuestionId = getAdaptiveQuestionId(question);
      const latestExcludedIds = getExistingAdaptiveQuestionIds(setId);
      const isDuplicate = adaptiveQuestionId
        ? latestExcludedIds.includes(adaptiveQuestionId)
        : false;

      if (!isDuplicate) {
        return { question, conceptId };
      }

      if (!adaptiveQuestionId) {
        return { question, conceptId };
      }

      lastDuplicateId = adaptiveQuestionId;
      excludedQuestionIds = Array.from(new Set([...latestExcludedIds, adaptiveQuestionId]));
    }

    throw new Error(`Adaptive recommend returned duplicate question ${lastDuplicateId || 'unknown'} after retries`);
  }, [getExistingAdaptiveQuestionIds, recommendWithConceptFallback]);

  const putQuestionInActiveSet = useCallback((setId: string, question: Question, replace = false) => {
    setData(prev => ({
      sets: prev.sets.map(set => {
        if (set.id !== setId) return set;
        const nextQuestions = replace
          ? [question]
          : set.questions.some(existing => hasSameQuestionIdentity(existing, question))
            ? set.questions
            : [...set.questions, question];
        return { ...set, questions: nextQuestions };
      })
    }));
  }, []);

  const findNextAvailableQuestionIndex = useCallback((startIndex: number) => {
    const setHistory = answersHistory[activeSetId] || {};
    const answeredAdaptiveQuestionIds = new Set(
      questionsList
        .filter((question: Question) => setHistory[question.id])
        .map(getAdaptiveQuestionId)
        .filter((questionId): questionId is string => Boolean(questionId))
    );

    for (let index = startIndex; index < questionsList.length; index += 1) {
      const candidate = questionsList[index];
      if (!candidate || setHistory[candidate.id]) continue;

      const candidateAdaptiveId = getAdaptiveQuestionId(candidate);
      if (candidateAdaptiveId && answeredAdaptiveQuestionIds.has(candidateAdaptiveId)) continue;

      return index;
    }

    return -1;
  }, [activeSetId, answersHistory, questionsList]);

  const hydrateActiveSetQuestions = useCallback((setId: string, questions: Question[]) => {
    if (questions.length === 0) return;

    setData(prev => ({
      sets: prev.sets.map(set =>
        set.id === setId
          ? { ...set, questions }
          : set
      )
    }));
  }, []);

  const fetchStaticQuestionsForSet = useCallback(async (setId: string) => {
    const existingFetch = staticQuestionFetches.get(setId);
    if (existingFetch) {
      return existingFetch;
    }

    const currentSet = data.sets.find(s => s.id === setId);
    const parentId = currentSet?.parent_id || 'day1';

    const fetchPromise = (async () => {
      try {
        const response = await fetch(`/api/questions/${setId}`);
        if (!response.ok) {
          trackQuizEvent('quiz_questions_load_failed', {
            set_id: setId,
            parent_id: parentId
          });
          return null;
        }

        const quizSet = await response.json();
        const questions = quizSet.questions || [];
        setData(prev => ({
          sets: prev.sets.map(s =>
            s.id === setId
              ? { ...s, ...quizSet, questions }
              : s
          )
        }));
        return questions as Question[];
      } catch (err) {
        trackQuizEvent('quiz_questions_load_failed', {
          set_id: setId,
          parent_id: parentId
        });
        console.error('Error fetching questions:', err);
        return null;
      }
    })();

    staticQuestionFetches.set(setId, fetchPromise);
    void fetchPromise.finally(() => {
      if (staticQuestionFetches.get(setId) === fetchPromise) {
        staticQuestionFetches.delete(setId);
      }
    });
    return fetchPromise;
  }, [data.sets]);

  const prefetchNextAdaptiveQuestion = useCallback((
    setId: string,
    preferredConceptId: string,
    answeredCount: number,
  ) => {
    if (
      !userId ||
      !activePracticeSession ||
      activePracticeSession.mode !== 'adaptive' ||
      activePracticeSession.targetSetId !== setId ||
      answeredCount >= adaptiveMaxQuestions
    ) {
      return;
    }

    const prefetchKey = `${setId}:${preferredConceptId}:${answeredCount}`;
    if (adaptivePrefetchKeyRef.current === prefetchKey && adaptivePrefetchPromiseRef.current) {
      return;
    }

    const prefetchPromise = recommendUniqueAdaptiveQuestion(setId, preferredConceptId)
      .then(({ question }) => {
        if (adaptivePrefetchPromiseRef.current !== prefetchPromise) {
          return null;
        }
        rememberAdaptiveQuestion(setId, question);
        putQuestionInActiveSet(setId, question);
        appendActivePracticeQuestion(question);
        return question;
      })
      .catch((error) => {
        console.warn('Adaptive next-question prefetch failed:', error);
        return null;
      })
      .finally(() => {
        if (adaptivePrefetchKeyRef.current === prefetchKey) {
          adaptivePrefetchKeyRef.current = null;
          adaptivePrefetchPromiseRef.current = null;
        }
      });

    adaptivePrefetchKeyRef.current = prefetchKey;
    adaptivePrefetchPromiseRef.current = prefetchPromise;
  }, [
    activePracticeSession,
    adaptiveMaxQuestions,
    appendActivePracticeQuestion,
    putQuestionInActiveSet,
    rememberAdaptiveQuestion,
    recommendUniqueAdaptiveQuestion,
    userId,
  ]);

  const getCompactQuizAnalyticsProperties = useCallback(() => ({
    set_id: activeSetId,
    difficulty: activeSet?.difficulty || null,
    question_count: totalQuestions
  }), [activeSet, activeSetId, totalQuestions]);

  const logAggregateEloForActiveSession = useCallback(() => {
    if (!activePracticeSession?.targetSetId) return;

    const latestConceptMasteries = useBoundStore.getState().conceptMasteries;
    const aggregateDetails = getAggregateLearningEloDetails(latestConceptMasteries);
    const oldAggregateElo = activePracticeSession.startAggregateElo ?? aggregateDetails.elo;
    const aggregateDelta = Math.round((aggregateDetails.elo - oldAggregateElo) * 10) / 10;
    if (aggregateDelta === 0) return;

    const eventId = `${activePracticeSession.startedAt || activePracticeSession.targetSetId}:aggregate-elo`;

    addEloHistoryEvent({
      id: eventId,
      aggregateLog: {
        conceptCount: aggregateDetails.conceptCount,
        formula: 'Elo tổng = trung bình Elo các concept đã luyện',
      },
      conceptTitle: 'Elo tổng sau phiên luyện',
      delta: aggregateDelta,
      oldElo: Math.round(oldAggregateElo),
      newElo: aggregateDetails.elo,
      occurredAt: new Date().toISOString(),
      scope: 'aggregate',
      source: 'aggregate',
      note: `Concept Elo đã cập nhật theo từng câu trong phiên này. Khi rời phiên, Elo tổng lấy trung bình ${aggregateDetails.conceptCount || 0} concept đã luyện.`,
    });
  }, [activePracticeSession, addEloHistoryEvent]);

  const completeActiveQuiz = useCallback(() => {
    const setHistory = answersHistory[activeSetId] || {};
    const answeredQuestions = questionsList.filter((question: Question) => setHistory[question.id]);
    const correctCount = answeredQuestions.reduce(
      (correct: number, question: Question) => correct + (setHistory[question.id]?.isCorrect ? 1 : 0),
      0
    );
    const attemptedCount = isAdaptiveSession ? Math.min(adaptiveMaxQuestions, answeredQuestions.length) : totalQuestions;

    trackQuizEvent('quiz_completed', {
      ...getCompactQuizAnalyticsProperties(),
      score_percent: attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0,
      correct_count: correctCount
    });

    const isNewCompletion = !completedSets.includes(activeSetId);
    if (isNewCompletion) {
      addCompletedSet(activeSetId);
    }

    addXp(isNewCompletion ? 10 : 5);

    logAggregateEloForActiveSession();

    const todayStr = dayjs().format('YYYY-MM-DD');
    if (!activeDays.includes(todayStr)) {
      addActiveDay(todayStr);
    }

    setShowFinishScreen(true);
  }, [
    activeSetId,
    activeDays,
    adaptiveMaxQuestions,
    addActiveDay,
    addCompletedSet,
    addXp,
    answersHistory,
    completedSets,
    getCompactQuizAnalyticsProperties,
    isAdaptiveSession,
    logAggregateEloForActiveSession,
    questionsList,
    totalQuestions,
  ]);

  // Toggle Developer mode
  const handleToggleDevMode = () => {
    toggleDevMode();
  };

  // Initialize skills list from manifest on mount
  useEffect(() => {
    async function hydrateSkillsManifest() {
      try {
        const mData = await loadSkillsManifest();
        if (mData?.skills) {
          initializeSkills(mData.skills);
        }
      } catch (err) {
        console.error('Failed to load skills manifest:', err);
      }
    }
    if (skills.length === 0) {
      hydrateSkillsManifest();
    }
  }, [initializeSkills, skills.length]);

  // Load concept masteries from database when logged in
  useEffect(() => {
    if (!loggedIn || !userId) {
      return;
    }

    const masteryFetchTimer = window.setTimeout(() => {
      fetchConceptMasteries(userId, '00000000-0000-0000-0000-000000000001');
    }, 250);

    return () => window.clearTimeout(masteryFetchTimer);
  }, [loggedIn, userId, fetchConceptMasteries]);

  // Fetch the data from quiz-manifest.json
  useEffect(() => {
    async function loadManifest() {
      try {
        const fetchedData = await loadQuizManifest();
        if (fetchedData && fetchedData.sets && fetchedData.sets.length > 0) {
          const setsWithEmptyQuestions = fetchedData.sets.map((s: any) => ({
            ...s,
            questions: s.questions || []
          }));
          setData({ sets: setsWithEmptyQuestions });

          // Read "set" parameter from URL query string
          const params = new URLSearchParams(window.location.search);
          const querySet = params.get('set')?.toLowerCase();

          let targetSetId = fetchedData.sets[0].id;
          let shouldTriggerQuiz = false;

          if (querySet) {
            const searchSlug = querySet;
            const found = fetchedData.sets.find((s: any) => {
              const normalizedTitle = s.title
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[đĐ]/g, 'd')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');

              return (
                s.id.toLowerCase() === searchSlug ||
                normalizedTitle === searchSlug ||
                (searchSlug === 'design-pattern-react' && s.id === 'react-loop-basics') ||
                (searchSlug === 'react-agent-day3' && s.id === 'react-loop-basics')
              );
            });

            if (found) {
              targetSetId = found.id;
              shouldTriggerQuiz = true;
            }
          }

          setActiveSetId(targetSetId);
          if (shouldTriggerQuiz) {
            setIsQuizMode(true);
          }
        }
      } catch (err) {
        console.warn('Yeu cau tai quiz-manifest.json khong co ket qua, dang xai du lieu du phong.', err);
      }
    }
    loadManifest();
  }, []);

  // Load questions for the active set dynamically based on parent directory
  useEffect(() => {
    if (!activeSetId || !data.sets || data.sets.length === 0) return;

    const currentSet = data.sets.find(s => s.id === activeSetId);
    const shouldLoadQuestions = isQuizMode || activePracticeSession?.targetSetId === activeSetId;
    if (currentSet && currentSet.questions && currentSet.questions.length > 0) {
      if (
        isQuizMode &&
        adaptiveStartInFlightSetRef.current === activeSetId &&
        !currentSet.questions[0]?.adaptive
      ) {
        return;
      }

      setIsLoadingQuestions(false);

      if (lastInitializedSetIdRef.current !== activeSetId) {
        lastInitializedSetIdRef.current = activeSetId;

        // Auto-initialize practice session in the Zustand store if it matches the current skill
        const skill = skills.find(s => s.associatedSets?.includes(activeSetId));
        const adaptiveConceptId = resolveAdaptiveConceptId(activeSetId, conceptMasteries);
        if (
          isQuizMode &&
          skill &&
          loggedIn &&
          userId &&
          adaptiveConceptId &&
          adaptiveStartInFlightSetRef.current !== activeSetId &&
          !currentSet.questions[0]?.adaptive &&
          (!activePracticeSession ||
            activePracticeSession.skillId !== skill.id ||
            activePracticeSession.targetSetId !== activeSetId ||
            activePracticeSession.mode !== 'adaptive')
        ) {
          recommendWithConceptFallback(activeSetId, adaptiveConceptId)
            .then(({ recommendation, conceptId }) => {
              const question = buildAdaptiveQuestion(recommendation, activeSetId, conceptId);
              putQuestionInActiveSet(activeSetId, question, true);
              clearActiveSession();
              startPracticeSession(skill.id, [question], activeSetId, {
                mode: 'adaptive',
                conceptId,
                maxQuestions: 10,
              });
              setCurrentQuestionIdx(0);
            })
            .catch((error) => {
              console.error('Adaptive auto-start failed:', error);
              setAdaptiveError(
                error instanceof AdaptiveApiError && error.status === 401
                  ? 'Phiên đăng nhập đã hết hạn. Bạn đang luyện bằng bộ câu có sẵn; hãy đăng nhập lại để dùng adaptive.'
                  : 'Chưa đồng bộ được câu adaptive. Bạn vẫn có thể luyện với bộ câu hiện có; điểm mastery sẽ cập nhật khi kết nối ổn định.'
              );
              startPracticeSession(skill.id, currentSet.questions, activeSetId, { mode: 'static-demo' });
            });
          return;
        }

        if (
          skill &&
          (!activePracticeSession ||
            activePracticeSession.skillId !== skill.id ||
            activePracticeSession.targetSetId !== activeSetId)
        ) {
          const firstQuestion = currentSet.questions[0];
          startPracticeSession(skill.id, currentSet.questions, activeSetId, {
            mode: firstQuestion?.adaptive ? 'adaptive' : 'static-demo',
            conceptId: firstQuestion?.adaptive?.conceptId,
            maxQuestions: firstQuestion?.adaptive ? 10 : undefined,
          });
        }

        // Check if we should resume from the saved index in the practice session
        let initialIdx = 0;
        if (activePracticeSession && activePracticeSession.targetSetId === activeSetId) {
          initialIdx = activePracticeSession.currentQuestionIndex;
        } else {
          const setHistory = answersHistory[activeSetId] || {};
          const firstUnanswered = currentSet.questions.findIndex((q: any) => !setHistory[q.id]);
          initialIdx = firstUnanswered !== -1 ? firstUnanswered : 0;
        }
        setCurrentQuestionIdx(initialIdx);
      }
      return;
    }

    if (!shouldLoadQuestions) {
      const idleQuestionsState = window.setTimeout(() => {
        setIsLoadingQuestions(false);
      }, 0);
      return () => window.clearTimeout(idleQuestionsState);
    }

    if (adaptiveStartInFlightSetRef.current === activeSetId) {
      return;
    }
    if (staticQuestionsInFlightSetRef.current === activeSetId) {
      return;
    }

    let isMounted = true;
    async function fetchQuestions() {
      setIsLoadingQuestions(true);
      staticQuestionsInFlightSetRef.current = activeSetId;
      await fetchStaticQuestionsForSet(activeSetId);
      if (staticQuestionsInFlightSetRef.current === activeSetId) {
        staticQuestionsInFlightSetRef.current = null;
      }
      if (isMounted) {
        setIsLoadingQuestions(false);
      }
    }

    fetchQuestions();
    return () => {
      isMounted = false;
    };
  }, [
    activeSetId,
    data.sets,
    skills,
    activePracticeSession,
    startPracticeSession,
    answersHistory,
    isQuizMode,
    loggedIn,
    userId,
    conceptMasteries,
    token,
    setToken,
    putQuestionInActiveSet,
    clearActiveSession,
    fetchStaticQuestionsForSet,
    recommendWithConceptFallback,
  ]);

  // Load essay input when switching questions
  useEffect(() => {
    if (currentQuestion) {
      const savedEssay = answersHistory[activeSetId]?.[currentQuestion.id]?.essayAnswer || '';
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEssayInput(savedEssay);
    } else {
      setEssayInput('');
    }
  }, [currentQuestionIdx, activeSetId, currentQuestion, answersHistory]);

  // Final MCQ submission. The view may collect a reversible pending option before calling this.
  const handleSelectOption = useCallback(async (optionKey: string, hintCount?: number) => {
    if (isSubmitted || isSubmittingAnswer || !currentQuestion || !currentQuestion.options) return;

    const canGradeLocally = typeof currentQuestion.answer === 'string' && currentQuestion.answer.length > 0;
    const localIsCorrect = canGradeLocally && optionKey === currentQuestion.answer;

    if (isAdaptiveSession && currentQuestion.adaptive && userId) {
      if (!canGradeLocally) {
        setIsSubmittingAnswer(true);
        setAdaptiveError(null);
        try {
          const startedAtMs = Date.parse(currentQuestion.adaptive.startedAt);
          const result = await submitAdaptiveAnswer({
            token,
            setToken,
            studentId: userId,
            courseId: DEFAULT_ADAPTIVE_COURSE_ID,
            conceptId: currentQuestion.adaptive.conceptId,
            questionId: currentQuestion.adaptive.questionId,
            decisionId: currentQuestion.adaptive.decisionId,
            studentAnswer: buildMcqStudentAnswer(optionKey),
            responseTimeMs: Number.isFinite(startedAtMs) ? Math.max(0, Date.now() - startedAtMs) : 0,
            hintCount: hintCount ?? 0,
          });

          posthog.capture('question_answered', {
            set_id: activeSetId,
            question_id: currentQuestion.id,
            question_index: currentQuestionIdx,
            is_correct: result.is_correct,
            selected_option: optionKey,
          });

          const nextHistory = {
            ...answersHistory,
            [activeSetId]: {
              ...(answersHistory[activeSetId] || {}),
              [currentQuestion.id]: {
                selected: optionKey,
                isCorrect: result.is_correct,
                hintCount: hintCount ?? 0,
                adaptiveDecisionId: currentQuestion.adaptive.decisionId,
                submitResult: result,
              }
            }
          };
          setAnswersHistory(nextHistory);
          localStorage.setItem('mentora_answers_history', JSON.stringify(nextHistory));
          recordAdaptiveSubmitResult(currentQuestion.id, optionKey, undefined, result, hintCount, {
            conceptId: currentQuestion.adaptive.conceptId,
            question: currentQuestion,
            skillId: activePracticeSession?.skillId || skills.find(s => s.associatedSets?.includes(activeSetId))?.id,
            targetSetId: activeSetId,
          });
          prefetchNextAdaptiveQuestion(
            activeSetId,
            currentQuestion.adaptive.conceptId,
            Object.keys(nextHistory[activeSetId] || {}).length,
          );
        } catch (error) {
          console.error('Adaptive submit failed:', error);
          setAdaptiveError(error instanceof Error ? error.message : 'Không thể gửi đáp án adaptive.');
        } finally {
          setIsSubmittingAnswer(false);
        }
        return;
      }

      const optimisticHistory = {
        ...answersHistory,
        [activeSetId]: {
          ...(answersHistory[activeSetId] || {}),
          [currentQuestion.id]: {
            selected: optionKey,
            isCorrect: localIsCorrect,
            hintCount: hintCount ?? 0,
            adaptiveDecisionId: currentQuestion.adaptive.decisionId,
          }
        }
      };
      setAnswersHistory(optimisticHistory);
      localStorage.setItem('mentora_answers_history', JSON.stringify(optimisticHistory));
      if (activePracticeSession && activePracticeSession.targetSetId === activeSetId) {
        submitPracticeAnswer(currentQuestion.id, optionKey, undefined, localIsCorrect, hintCount);
      }

      setIsSubmittingAnswer(true);
      setAdaptiveError(null);
      try {
        const startedAtMs = Date.parse(currentQuestion.adaptive.startedAt);
        const result = await submitAdaptiveAnswer({
          token,
          setToken,
          studentId: userId,
          courseId: DEFAULT_ADAPTIVE_COURSE_ID,
          conceptId: currentQuestion.adaptive.conceptId,
          questionId: currentQuestion.adaptive.questionId,
          decisionId: currentQuestion.adaptive.decisionId,
          studentAnswer: buildMcqStudentAnswer(optionKey),
          responseTimeMs: Number.isFinite(startedAtMs) ? Math.max(0, Date.now() - startedAtMs) : 0,
          hintCount: hintCount ?? 0,
        });

        posthog.capture('question_answered', {
          set_id: activeSetId,
          question_id: currentQuestion.id,
          question_index: currentQuestionIdx,
          is_correct: result.is_correct,
          selected_option: optionKey,
        });

        const serverIsCorrect = result.is_correct;
        setAnswersHistory(prev => {
          const nextHistory = {
            ...prev,
            [activeSetId]: {
              ...(prev[activeSetId] || {}),
              [currentQuestion.id]: {
                selected: optionKey,
                isCorrect: serverIsCorrect,
                hintCount: hintCount ?? 0,
                adaptiveDecisionId: currentQuestion.adaptive!.decisionId,
                submitResult: result,
              }
            }
          };
          localStorage.setItem('mentora_answers_history', JSON.stringify(nextHistory));
          return nextHistory;
        });
        recordAdaptiveSubmitResult(currentQuestion.id, optionKey, undefined, result, hintCount, {
          conceptId: currentQuestion.adaptive.conceptId,
          question: currentQuestion,
          skillId: activePracticeSession?.skillId || skills.find(s => s.associatedSets?.includes(activeSetId))?.id,
          targetSetId: activeSetId,
        });
        prefetchNextAdaptiveQuestion(
          activeSetId,
          currentQuestion.adaptive.conceptId,
          Object.keys(optimisticHistory[activeSetId] || {}).length,
        );
      } catch (error) {
        console.error('Adaptive submit failed:', error);
        setAdaptiveError('Đã hiển thị đáp án từ dữ liệu câu hỏi. Chưa đồng bộ được điểm adaptive, hãy thử tiếp tục hoặc quay lại sau.');
      } finally {
        setIsSubmittingAnswer(false);
      }
      return;
    }

    posthog.capture('question_answered', {
      set_id: activeSetId,
      question_id: currentQuestion.id,
      question_index: currentQuestionIdx,
      is_correct: localIsCorrect,
      selected_option: optionKey,
    });

    const nextHistory = {
      ...answersHistory,
      [activeSetId]: {
        ...(answersHistory[activeSetId] || {}),
        [currentQuestion.id]: {
          selected: optionKey,
          isCorrect: localIsCorrect,
          hintCount: hintCount ?? 0,
        }
      }
    };
    setAnswersHistory(nextHistory);
    localStorage.setItem('mentora_answers_history', JSON.stringify(nextHistory));

    // Update Zustand activePracticeSession if we are in quiz mode
    if (activePracticeSession && activePracticeSession.targetSetId === activeSetId) {
      submitPracticeAnswer(currentQuestion.id, optionKey, undefined, localIsCorrect, hintCount);
    }
  }, [
    activeSetId,
    currentQuestion,
    currentQuestionIdx,
    isSubmitted,
    isSubmittingAnswer,
    answersHistory,
    activePracticeSession,
    submitPracticeAnswer,
    isAdaptiveSession,
    userId,
    skills,
    token,
    setToken,
    recordAdaptiveSubmitResult,
    prefetchNextAdaptiveQuestion,
  ]);

  // Submit the essay text
  const handleSubmitEssay = useCallback(() => {
    if (isSubmitted || !currentQuestion || !essayInput.trim()) return;

    posthog.capture('essay_submitted', {
      set_id: activeSetId,
      question_id: currentQuestion.id,
      question_index: currentQuestionIdx,
      answer_length: essayInput.trim().length,
    });

    const nextHistory = {
      ...answersHistory,
      [activeSetId]: {
        ...(answersHistory[activeSetId] || {}),
        [currentQuestion.id]: {
          essayAnswer: essayInput,
          isCorrect: false, // Default false until graded
          selected: 'essay_submitted',
          checkedPoints: []
        }
      }
    };
    setAnswersHistory(nextHistory);
    localStorage.setItem('mentora_answers_history', JSON.stringify(nextHistory));
  }, [activeSetId, currentQuestion, currentQuestionIdx, essayInput, isSubmitted, answersHistory]);

  // Grade the essay (user clicks Correct or Incorrect)
  const handleGradeEssay = useCallback((isCorrect: boolean, hintCount?: number) => {
    if (!currentQuestion || !currentHistory) return;

    posthog.capture('essay_graded', {
      set_id: activeSetId,
      question_id: currentQuestion.id,
      question_index: currentQuestionIdx,
      is_correct: isCorrect,
      checked_points_count: currentHistory.checkedPoints?.length ?? 0,
    });

    const nextHistory = {
      ...answersHistory,
      [activeSetId]: {
        ...(answersHistory[activeSetId] || {}),
        [currentQuestion.id]: {
          ...answersHistory[activeSetId][currentQuestion.id],
          isCorrect,
          selected: isCorrect ? 'essay_correct' : 'essay_incorrect',
          hintCount: hintCount ?? answersHistory[activeSetId][currentQuestion.id]?.hintCount ?? 0
        }
      }
    };
    setAnswersHistory(nextHistory);
    localStorage.setItem('mentora_answers_history', JSON.stringify(nextHistory));

    // Update Zustand activePracticeSession
    if (activePracticeSession && activePracticeSession.targetSetId === activeSetId) {
      submitPracticeAnswer(currentQuestion.id, undefined, currentHistory.essayAnswer, isCorrect, hintCount);
    }
  }, [activeSetId, currentQuestion, currentQuestionIdx, currentHistory, answersHistory, activePracticeSession, submitPracticeAnswer]);

  // Toggle checklist for evaluation points
  const handleToggleEvaluationPoint = useCallback((point: string) => {
    if (!currentQuestion || !currentHistory) return;

    const currentPoints = currentHistory.checkedPoints || [];
    const newPoints = currentPoints.includes(point)
      ? currentPoints.filter(p => p !== point)
      : [...currentPoints, point];

    const nextHistory = {
      ...answersHistory,
      [activeSetId]: {
        ...(answersHistory[activeSetId] || {}),
        [currentQuestion.id]: {
          ...answersHistory[activeSetId][currentQuestion.id],
          checkedPoints: newPoints
        }
      }
    };
    setAnswersHistory(nextHistory);
    localStorage.setItem('mentora_answers_history', JSON.stringify(nextHistory));
  }, [activeSetId, currentQuestion, currentHistory, answersHistory]);

  // Move to next question or show finish details
  const handleNextQuestion = useCallback(async () => {
    if (isAdaptiveSession) {
      const answeredCount = Object.keys(answersHistory[activeSetId] || {}).length;
      if (answeredCount >= adaptiveMaxQuestions) {
        completeActiveQuiz();
        return;
      }

      const moveToQuestionIndex = (nextIdx: number) => {
        if (nextIdx < 0) return;
        setCurrentQuestionIdx(nextIdx);
        savePracticeSession(nextIdx);
      };

      const nextAvailableQuestionIndex = findNextAvailableQuestionIndex(currentQuestionIdx + 1);
      if (nextAvailableQuestionIndex >= 0) {
        moveToQuestionIndex(nextAvailableQuestionIndex);
        return;
      }

      if (!activePracticeSession?.conceptId || !userId) {
        setAdaptiveError('Không có concept adaptive cho phiên này. Vui lòng khởi động lại quiz.');
        return;
      }

      setIsLoadingNextQuestion(true);
      setAdaptiveError(null);
      try {
        const pendingPrefetch = adaptivePrefetchKeyRef.current?.startsWith(`${activeSetId}:`)
          ? adaptivePrefetchPromiseRef.current
          : null;
        if (pendingPrefetch) {
          const prefetchedQuestion = await pendingPrefetch;
          if (prefetchedQuestion) {
            const prefetchedQuestionIndex = findNextAvailableQuestionIndex(currentQuestionIdx + 1);
            moveToQuestionIndex(prefetchedQuestionIndex >= 0 ? prefetchedQuestionIndex : questionsList.length);
            return;
          }
        }

        const { question } = await recommendUniqueAdaptiveQuestion(activeSetId, activePracticeSession.conceptId);
        rememberAdaptiveQuestion(activeSetId, question);
        putQuestionInActiveSet(activeSetId, question);
        appendActivePracticeQuestion(question);

        moveToQuestionIndex(questionsList.length);
      } catch (error) {
        console.error('Adaptive recommend failed:', error);
        setAdaptiveError('Không lấy được câu adaptive tiếp theo. Vui lòng thử lại hoặc quay lại sau.');
      } finally {
        setIsLoadingNextQuestion(false);
      }
      return;
    }

    if (currentQuestionIdx === totalQuestions - 1) {
      completeActiveQuiz();
      return;
    }

    const nextIdx = currentQuestionIdx + 1;
    setCurrentQuestionIdx(nextIdx);
    if (activePracticeSession && activePracticeSession.targetSetId === activeSetId) {
      savePracticeSession(nextIdx);
    }
  }, [
    activeSetId,
    activePracticeSession,
    adaptiveMaxQuestions,
    answersHistory,
    appendActivePracticeQuestion,
    completeActiveQuiz,
    currentQuestionIdx,
    findNextAvailableQuestionIndex,
    isAdaptiveSession,
    putQuestionInActiveSet,
    rememberAdaptiveQuestion,
    questionsList,
    recommendUniqueAdaptiveQuestion,
    savePracticeSession,
    totalQuestions,
    userId,
  ]);

  // Helper to reset quiz progress cleanly
  const resetQuizProgress = useCallback((setId: string) => {
    const nextHistory = { ...answersHistory };
    delete nextHistory[setId];
    setAnswersHistory(nextHistory);
    localStorage.setItem('mentora_answers_history', JSON.stringify(nextHistory));

    // Delegate survey reset
    resetSurveys(setId);
  }, [answersHistory, resetSurveys]);

  // Reset the current active set
  const handleRestart = useCallback(async () => {
    posthog.capture('quiz_restarted', {
      set_id: activeSetId,
      difficulty: activeSet.difficulty ?? null,
      question_count: totalQuestions,
    });

    lastInitializedSetIdRef.current = null;
    setCurrentQuestionIdx(0);
    setShowFinishScreen(false);
    setEssayInput('');
    
    resetQuizProgress(activeSetId);

    // Also restart the practice session in the store!
    const skill = skills.find(s => s.associatedSets?.includes(activeSetId));
    if (skill && isAdaptiveSession) {
      resetAdaptiveQuestionMemory(activeSetId);
      clearActiveSession();
      const conceptId = resolveAdaptiveConceptId(activeSetId, conceptMasteries) || activePracticeSession?.conceptId;
      if (!loggedIn || !userId || !conceptId) {
        setAdaptiveError('Phiên này đang dùng bộ câu có sẵn vì chưa xác định được concept adaptive cho tài khoản của bạn.');
        if (activeSet.questions) {
          startPracticeSession(skill.id, activeSet.questions, activeSetId, { mode: 'static-demo' });
        }
        return;
      }

      setIsLoadingQuestions(true);
      try {
        const { recommendation, conceptId: resolvedConceptId } = await recommendWithConceptFallback(activeSetId, conceptId);
        const question = buildAdaptiveQuestion(recommendation, activeSetId, resolvedConceptId);
        rememberAdaptiveQuestion(activeSetId, question);
        putQuestionInActiveSet(activeSetId, question, true);
        startPracticeSession(skill.id, [question], activeSetId, {
          mode: 'adaptive',
          conceptId: resolvedConceptId,
          maxQuestions: 10,
        });
      } catch (error) {
        console.error('Adaptive restart failed:', error);
        setAdaptiveError('Chưa đồng bộ được câu adaptive. Bạn vẫn có thể luyện với bộ câu hiện có; điểm mastery sẽ cập nhật khi kết nối ổn định.');
        startPracticeSession(skill.id, activeSet.questions, activeSetId, { mode: 'static-demo' });
      } finally {
        setIsLoadingQuestions(false);
      }
      return;
    }

    if (skill && activeSet.questions) {
      resetAdaptiveQuestionMemory(activeSetId);
      clearActiveSession();
      startPracticeSession(skill.id, activeSet.questions, activeSetId, { mode: 'static-demo' });
    }
  }, [
    activePracticeSession?.conceptId,
    activeSetId,
    activeSet,
    clearActiveSession,
    conceptMasteries,
    isAdaptiveSession,
    loggedIn,
    putQuestionInActiveSet,
    recommendWithConceptFallback,
    resetQuizProgress,
    rememberAdaptiveQuestion,
    resetAdaptiveQuestionMemory,
    skills,
    startPracticeSession,
    totalQuestions,
    userId,
  ]);

  const handleExitQuiz = useCallback(() => {
    logAggregateEloForActiveSession();
    setIsQuizMode(false);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('set');
      window.history.pushState({}, '', url.pathname);
    }
  }, [logAggregateEloForActiveSession]);

  // Triggered when starting practice from path (either for a specific concept/set, or for all sets)
  const handleStartPractice = useCallback(async (skill?: Skill, targetSetId?: string) => {
    if (!skill) {
      setAdaptiveError('Chưa tìm thấy kỹ năng để luyện tập. Hãy chọn lại một kỹ năng trong lộ trình học.');
      return;
    }

    const setId = targetSetId || skill?.associatedSets?.[0];
    if (!setId) {
      setAdaptiveError('Kỹ năng này chưa có học phần luyện tập. Hãy chọn kỹ năng khác hoặc quay lại sau.');
      return;
    }

    const nextSet = data.sets.find((set) => set.id === setId);
    trackQuizEvent('quiz_started', {
      set_id: setId,
      difficulty: nextSet?.difficulty || null,
      question_count: nextSet?.questions?.length || 0,
    });

    // Directly open in normal Quiz mode
    setActiveSetId(setId);
    setCurrentQuestionIdx(0);
    setShowFinishScreen(false);
    setEssayInput('');
    setIsQuizMode(true);
    setAdaptiveError(null);
    resetAdaptiveQuestionMemory(setId);

    const isResumingActiveSession =
      activePracticeSession?.skillId === skill.id &&
      activePracticeSession.targetSetId === setId;

    if (isResumingActiveSession) {
      const sessionQuestions = activePracticeQuestions.length > 0
        ? activePracticeQuestions
        : nextSet?.questions || [];
      hydrateActiveSetQuestions(setId, sessionQuestions as Question[]);
      sessionQuestions.forEach((question) => rememberAdaptiveQuestion(setId, question as Question));
      setCurrentQuestionIdx(activePracticeSession.currentQuestionIndex);
      setIsLoadingQuestions(false);
      return;
    }

    // Update URL query param to make it shareable
    const slug = setId === 'react-loop-basics' ? 'design-pattern-react' : setId;
    const newUrl = `${window.location.pathname}?set=${slug}`;
    window.history.pushState({ path: newUrl }, '', newUrl);

    const conceptId = resolveAdaptiveConceptId(setId, conceptMasteries);
    if (!loggedIn || !userId || !conceptId) {
      const fallbackQuestions = nextSet?.questions?.length
        ? nextSet.questions
        : await fetchStaticQuestionsForSet(setId);
      if (fallbackQuestions?.length) {
        clearActiveSession();
        startPracticeSession(skill.id, fallbackQuestions, setId, { mode: 'static-demo' });
      }
      setAdaptiveError('Phiên này đang dùng bộ câu có sẵn vì chưa xác định được concept adaptive cho tài khoản của bạn.');
      return;
    }

    setIsLoadingQuestions(true);
    adaptiveStartInFlightSetRef.current = setId;
    try {
      const { recommendation, conceptId: resolvedConceptId } = await recommendWithConceptFallback(setId, conceptId);
      const question = buildAdaptiveQuestion(recommendation, setId, resolvedConceptId);
      rememberAdaptiveQuestion(setId, question);
      putQuestionInActiveSet(setId, question, true);
      clearActiveSession();
      startPracticeSession(skill.id, [question], setId, {
        mode: 'adaptive',
        conceptId: resolvedConceptId,
        maxQuestions: 10,
      });
      setAnswersHistory(prev => {
        const next = { ...prev, [setId]: {} };
        localStorage.setItem('mentora_answers_history', JSON.stringify(next));
        return next;
      });
    } catch (error) {
      console.error('Adaptive start failed:', error);
      const fallbackQuestions = nextSet?.questions?.length
        ? nextSet.questions
        : await fetchStaticQuestionsForSet(setId);
      if (fallbackQuestions?.length) {
        clearActiveSession();
        startPracticeSession(skill.id, fallbackQuestions, setId, { mode: 'static-demo' });
      }
      setAdaptiveError(
        error instanceof AdaptiveApiError && error.status === 401
          ? 'Phiên đăng nhập đã hết hạn. Bạn đang luyện bằng bộ câu có sẵn; hãy đăng nhập lại để dùng adaptive.'
          : 'Chưa đồng bộ được câu adaptive. Bạn vẫn có thể luyện với bộ câu hiện có; điểm mastery sẽ cập nhật khi kết nối ổn định.'
      );
    } finally {
      if (adaptiveStartInFlightSetRef.current === setId) {
        adaptiveStartInFlightSetRef.current = null;
      }
      setIsLoadingQuestions(false);
    }
  }, [
    activePracticeQuestions,
    activePracticeSession,
    clearActiveSession,
    conceptMasteries,
    data.sets,
    hydrateActiveSetQuestions,
    fetchStaticQuestionsForSet,
    loggedIn,
    putQuestionInActiveSet,
    rememberAdaptiveQuestion,
    recommendWithConceptFallback,
    resetAdaptiveQuestionMemory,
    startPracticeSession,
    userId,
  ]);

  // Calculate score for the active set
  const getActiveSetCorrectCount = useCallback(() => {
    let correct = 0;
    const setHistory = answersHistory[activeSetId] || {};
    activeSet?.questions.forEach((q: any) => {
      if (setHistory[q.id]?.isCorrect) {
        correct += 1;
      }
    });
    return correct;
  }, [answersHistory, activeSetId, activeSet]);

  // Find incorrectly answered questions
  const getIncorrectQuestions = useCallback(() => {
    const setHistory = answersHistory[activeSetId] || {};
    return activeSet?.questions.filter((q: any) => {
      const record = setHistory[q.id];
      return record && !record.isCorrect;
    }) || [];
  }, [answersHistory, activeSetId, activeSet]);

  const progressPercent = totalQuestions > 0 ? Math.min(100, Math.round(((currentQuestionIdx + (isSubmitted ? 1 : 0)) / totalQuestions) * 100)) : 0;

  return {
    activeTab,
    setActiveTab,
    hasOpenedChat,
    isQuizMode,
    handleExitQuiz,
    handleStartPractice,
    getActiveSetCorrectCount,
    getIncorrectQuestions,
    progressPercent,
    // Store states
    xp,
    streak,
    activeDays,
    completedSets,
    eloHistoryEvents,
    devMode,
    name,
    username,
    mssv,
    role,
    loggedIn,
    joinedAt,
    logOut,
    selectedPersona,
    setPersona,
    skills,
    activePracticeSession,
    // Quiz state & handlers
    data,
    activeSetId,
    activeSet,
    questionsList,
    totalQuestions,
    currentQuestionIdx,
    currentQuestion,
    currentHistory,
    selectedOption,
    isSubmitted,
    showExplanation,
    isEssayCompleted,
    isLoadingQuestions,
    isLoadingNextQuestion,
    isSubmittingAnswer,
    adaptiveError,
    showFinishScreen,
    essayInput,
    setEssayInput,
    answersHistory,
    handleSelectOption,
    handleSubmitEssay,
    handleGradeEssay,
    handleToggleEvaluationPoint,
    handleNextQuestion,
    setCurrentQuestionIdx,
    handleRestart,
    // Guidebook & Dev Mode & Leaderboard
    activeGuidebookDayId,
    guidebookHtml,
    isLoadingGuidebook,
    handleCloseGuidebook,
    handleToggleDevMode,
    handleSelectGuidebook,
    leaderboardScope,
    setLeaderboardScope,
  };
}
