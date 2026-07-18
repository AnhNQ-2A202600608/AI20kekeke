'use client';

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQuizSession } from '../hooks/useQuizSession';
import { useSocraticSidebar } from '../hooks/useSocraticSidebar';
import { useSurveyHandlers } from '../hooks/useSurveyHandlers';

import { QuizWorkspace } from './quiz-workspace';
import { DashboardLayout } from './dashboard-layout';
import { OnboardingGate } from '@/components/onboarding/onboarding-gate';
import { MascotLoadingBlock } from '@/components/mascot';
import { useBoundStore } from '@/hooks/useBoundStore';
import { isDemoAuthToken, isJwtExpired, isJwtToken } from '@/lib/auth-token';
import { isDemoMode } from '@/lib/demo-mode';
import type { TabType } from '@/lib/dashboard-tabs';

export function QuizAppShell({ initialTab = 'learn' }: { initialTab?: TabType }) {
  return (
    <AppAuthGate>
      <OnboardingGate>
        <QuizAppShellContent initialTab={initialTab} />
      </OnboardingGate>
    </AppAuthGate>
  );
}

function AppAuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const loggedIn = useBoundStore((state) => state.loggedIn);
  const token = useBoundStore((state) => state.token);
  const logOut = useBoundStore((state) => state.logOut);
  const [ready, setReady] = useState(false);
  const hasRealAuthSession = loggedIn && isJwtToken(token) && !isJwtExpired(token) && !isDemoAuthToken(token);
  const hasDemoSession = loggedIn && isDemoMode() && isDemoAuthToken(token);
  const canEnterApp = hasRealAuthSession || hasDemoSession;

  useEffect(() => {
    const readyCheckId = window.setTimeout(() => {
      setReady(true);
    }, 0);
    return () => {
      window.clearTimeout(readyCheckId);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!canEnterApp) {
      if (loggedIn) logOut();
      router.replace('/');
    }
  }, [canEnterApp, logOut, loggedIn, ready, router]);

  if (!ready || !canEnterApp) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-on-background font-be-vietnam-pro">
        <MascotLoadingBlock
          title="Sofi đang mở trang giới thiệu..."
          description="Đang điều hướng về Mentora"
          className="max-w-sm border-2 border-gray-border border-b-[5px]"
          mascotClassName="scale-[0.82]"
        />
      </main>
    );
  }

  return <>{children}</>;
}

function QuizAppShellContent({ initialTab }: { initialTab: TabType }) {
  const router = useRouter();

  // Use a ref to solve circular dependency between useQuizSession and useSurveyHandlers
  const resetSurveysRef = useRef<(setId: string) => void>(() => {});

  const handleResetSurveys = useCallback((setId: string) => {
    resetSurveysRef.current(setId);
  }, []);

  // 1. Initialize custom hooks
  const quiz = useQuizSession(handleResetSurveys, initialTab);
  const aiSidebar = useSocraticSidebar(quiz.currentQuestion, quiz.currentQuestionIdx, quiz.activeSetId, quiz.answersHistory);
  const surveys = useSurveyHandlers(quiz.activeSetId, quiz.activeSet, quiz.totalQuestions);

  // Keep resetSurveysRef updated with the latest function from useSurveyHandlers
  useEffect(() => {
    resetSurveysRef.current = surveys.resetSurveys;
  }, [surveys.resetSurveys]);

  const isChatPage = !quiz.isQuizMode && quiz.activeTab === 'chat';

  useEffect(() => {
    document.documentElement.classList.toggle('chat-page-scroll-lock', isChatPage);
    document.body.classList.toggle('chat-page-scroll-lock', isChatPage);

    return () => {
      document.documentElement.classList.remove('chat-page-scroll-lock');
      document.body.classList.remove('chat-page-scroll-lock');
    };
  }, [isChatPage]);

  // 3. Render main layouts based on quiz mode state
  return (
    <div className={`${isChatPage ? 'h-[100dvh] min-h-0 overflow-hidden' : 'min-h-screen'} bg-background text-on-background flex flex-col font-be-vietnam-pro selection:bg-primary-green/20 selection:text-primary-green-dark`}>
      {quiz.isQuizMode ? (
        <QuizWorkspace
          quiz={quiz}
          aiSidebar={aiSidebar}
          surveys={surveys}
        />
      ) : (
        <DashboardLayout
          quiz={quiz}
          onOpenAuth={(mode) => router.push(mode === 'signup' ? '/login?mode=signup' : '/login')}
        />
      )}
    </div>
  );
}
