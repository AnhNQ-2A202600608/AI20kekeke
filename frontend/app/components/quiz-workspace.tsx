'use client';

import { AnimatePresence } from 'motion/react';
import { useMemo } from 'react';
import { useQuizSession } from '../hooks/useQuizSession';
import { useSocraticSidebar } from '../hooks/useSocraticSidebar';
import { useSurveyHandlers } from '../hooks/useSurveyHandlers';

// Import our modular components
import { AppTopNav } from '@/components/app/app-top-nav';
import type { EloCounterAnimation } from '@/components/app/elo-counter';
import { LoadingQuestionsCard } from '@/components/quiz/loading-questions-card';
import { QuizFirstRunWalkthrough } from '@/components/quiz/quiz-first-run-walkthrough';
import { QuizQuestionView } from '@/components/quiz/quiz-question-view';
import { QuizResults } from '@/components/quiz/quiz-results';
import { SocraticSidebarView } from '@/components/quiz/socratic-sidebar-view';
import { useBoundStore } from '@/hooks/useBoundStore';
import { getAggregateLearningElo, getConceptLearningElo } from '@/lib/adaptive/elo';

interface QuizWorkspaceProps {
  quiz: ReturnType<typeof useQuizSession>;
  aiSidebar: ReturnType<typeof useSocraticSidebar>;
  surveys: ReturnType<typeof useSurveyHandlers>;
}

export function QuizWorkspace({ quiz, aiSidebar, surveys }: QuizWorkspaceProps) {
  const {
    isLoadingQuestions,
    showFinishScreen,
    currentQuestion,
  } = quiz;
  const conceptMasteries = useBoundStore((state) => state.conceptMasteries);
  const userId = useBoundStore((state) => state.userId);

  const canShowSocraticSheet = !!(
    !showFinishScreen &&
    !isLoadingQuestions &&
    currentQuestion
  );
  const hasNoLoadedQuestion = !isLoadingQuestions && !showFinishScreen && !currentQuestion;
  const activeConceptId = currentQuestion?.adaptive?.conceptId || quiz.activePracticeSession?.conceptId || null;
  const aggregateElo = useMemo(() => getAggregateLearningElo(conceptMasteries), [conceptMasteries]);
  const conceptElo = useMemo(() => {
    const latestSubmitElo = Number(quiz.currentHistory?.submitResult?.new_elo);
    if (Number.isFinite(latestSubmitElo) && latestSubmitElo > 0) {
      return Math.round(latestSubmitElo);
    }

    return getConceptLearningElo(
      conceptMasteries,
      {
        conceptCode: currentQuestion?.setId || quiz.activeSetId,
        conceptId: activeConceptId,
      },
      aggregateElo,
    );
  }, [
    activeConceptId,
    aggregateElo,
    conceptMasteries,
    currentQuestion?.setId,
    quiz.activeSetId,
    quiz.currentHistory?.submitResult?.new_elo,
  ]);
  const displayedElo = showFinishScreen ? aggregateElo : conceptElo;
  const displayedEloScope = showFinishScreen ? 'aggregate' : 'concept';
  const eloCounterAnimation = useMemo<EloCounterAnimation | null>(() => {
    const submitResult = quiz.currentHistory?.submitResult;
    if (!currentQuestion || !submitResult) return null;
    if (!Number.isFinite(submitResult.old_elo) || !Number.isFinite(submitResult.new_elo)) return null;

    return {
      id: `${currentQuestion.id}-${currentQuestion.adaptive?.decisionId || 'submitted'}`,
      oldElo: submitResult.old_elo,
      newElo: submitResult.new_elo,
    };
  }, [currentQuestion, quiz.currentHistory?.submitResult]);

  const displayName = quiz.name || quiz.username || 'Học viên EduGap';
  const activeTitle = quiz.activeSet?.topic_title || quiz.activeSet?.title || quiz.activeSetId;
  const titleMatch = String(activeTitle).match(/^Day\s*(\d+)\s*:\s*(.+)$/i);
  const daySubtitle = titleMatch
    ? `Day ${titleMatch[1].padStart(2, '0')}: ${titleMatch[2]}`
    : String(activeTitle);
  const currentProgress = quiz.totalQuestions > 0
    ? Math.round(((quiz.currentQuestionIdx + 1) / quiz.totalQuestions) * 100)
    : 0;

  return (
    <div className="h-dvh min-h-dvh w-full bg-warm-cream flex flex-col overflow-hidden animate-in fade-in duration-300">
      <div className="shrink-0 px-3 pt-2 sm:px-4 lg:px-5 xl:px-6">
        <div className="mx-auto w-full max-w-[1360px]">
          <AppTopNav
            activeDays={quiz.activeDays}
            activeConceptId={activeConceptId}
            title={`Xin chào, ${displayName}`}
            subtitle={daySubtitle}
            averageElo={displayedElo}
            displayName={displayName}
            eloCounterAnimation={eloCounterAnimation}
            eloScope={displayedEloScope}
            eloHistoryEvents={quiz.eloHistoryEvents}
            initial={displayName.trim().charAt(0).toUpperCase() || 'N'}
            loggedIn={quiz.loggedIn}
            mssv={quiz.mssv}
            onLogoClick={() => {
              quiz.handleExitQuiz();
              quiz.setActiveTab('learn');
            }}
            onLogOut={quiz.logOut}
            onOpenProfile={() => {
              quiz.handleExitQuiz();
              quiz.setActiveTab('profile');
            }}
            role={quiz.role}
            selectedPersona={quiz.selectedPersona}
            setPersona={quiz.setPersona}
            streak={quiz.streak}
            userId={userId ? String(userId) : null}
            xp={quiz.xp}
          />

          <div className="mb-1 flex items-center gap-2 rounded-xl border border-primary-green/10 bg-white/80 px-3 py-2 shadow-sm lg:hidden">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black text-on-background">
                {displayName}
              </p>
              <p className="truncate text-caption-tight font-bold text-stone-500">
                Câu {quiz.currentQuestionIdx + 1}/{quiz.totalQuestions || 1} - {quiz.xp} XP - {quiz.streak || 0} ngày streak
              </p>
            </div>
            <span className="shrink-0 text-caption-tight font-black text-primary-green-dark">{currentProgress}%</span>
          </div>
        </div>
      </div>

      {/* Main Quiz Content */}
      <main className="flex min-h-0 flex-1 w-full overflow-hidden px-2 sm:px-4 md:px-5 xl:px-6">
        {/* Quiz content keeps a stable width; AI Tutor opens as an overlay sheet. */}
        <section className="mx-auto flex h-full w-full max-w-[1360px] flex-col overflow-hidden pb-2 pt-1 sm:pb-3">
          <div className="w-full flex-1 flex flex-col min-h-0">
            <AnimatePresence mode="wait">
              {isLoadingQuestions || hasNoLoadedQuestion ? (
                <LoadingQuestionsCard />
              ) : !showFinishScreen ? (
                <QuizQuestionView
                  quiz={quiz}
                  aiSidebar={aiSidebar}
                  surveys={surveys}
                />
              ) : (
                // Results Screen
                <QuizResults
                  quiz={quiz}
                  surveys={surveys}
                />
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Right Panel & Mobile Drawer: Socratic AI Sidebar */}
        <SocraticSidebarView
          aiSidebar={aiSidebar}
          showSidebar={canShowSocraticSheet}
        />

        <QuizFirstRunWalkthrough
          userId={userId ? String(userId) : null}
          enabled={canShowSocraticSheet}
          isSocraticOpen={aiSidebar.isSocraticOpen || aiSidebar.isMobileSidebarOpen}
          onOpenSofi={() => {
            const question = currentQuestion?.question || 'câu hỏi hiện tại';
            aiSidebar.setSidebarInputValue(
              `Sofi giúp mình kiểm tra cách nghĩ cho câu này theo kiểu gợi mở nhé: ${question}`
            );
            aiSidebar.setIsSocraticOpen(true);
            aiSidebar.setIsMobileSidebarOpen(true);
          }}
        />
      </main>
    </div>
  );
}
