'use client';

import { useEffect, useMemo, type ReactNode } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';

// Import our layouts & components
import { AppTopNav } from '@/components/app/app-top-nav';
import { LeftBar } from '@/components/LeftBar';
import { LearningPath } from '@/components/LearningPath';
import { GuidebookView } from '@/components/dashboard/guidebook-view';
import { MascotLoadingBlock } from '@/components/mascot';
import { FirstRunGuide } from '@/components/onboarding/first-run-guide';
import type { useQuizSession } from '@/app/hooks/useQuizSession';
import { useBoundStore } from '@/hooks/useBoundStore';
import { getAggregateLearningElo } from '@/lib/adaptive/elo';
import { completeFirstRun } from '@/lib/onboarding/first-run-storage';


import type { TabType } from '@/lib/dashboard-tabs';
import { getRouteForTab, getTabForRoute } from '@/lib/dashboard-routes';

const TabLoadingFallback = () => (
  <MascotLoadingBlock
    title="Sofi đang mở khu vực học tập..."
    description="Đang chuẩn bị giao diện phù hợp với tab này"
    className="mx-auto min-h-[18rem] max-w-xl"
  />
);

const ProfileTab = dynamic(
  () => import('@/components/dashboard/profile').then((mod) => mod.ProfileTab),
  { ssr: false, loading: TabLoadingFallback },
);

const SocraticChatTab = dynamic(
  () => import('@/components/dashboard/socratic-chat').then((mod) => mod.SocraticChatTab),
  { ssr: false, loading: TabLoadingFallback },
);

const SkillsPracticeTab = dynamic(
  () => import('@/components/dashboard/skills-practice-tab').then((mod) => mod.SkillsPracticeTab),
  { ssr: false, loading: TabLoadingFallback },
);

const KnowledgeGraphPage = dynamic(
  () => import('@/components/dashboard/knowledge-graph-page').then((mod) => mod.KnowledgeGraphPage),
  { ssr: false, loading: TabLoadingFallback },
);

const BtcHeatmap = dynamic(
  () => import('@/components/dashboard/btc-heatmap').then((mod) => mod.BtcHeatmap),
  { ssr: false, loading: TabLoadingFallback },
);

const BraintrustObservabilityTab = dynamic(
  () => import('@/components/dashboard/admin/braintrust-observability-tab').then((mod) => mod.BraintrustObservabilityTab),
  { ssr: false, loading: TabLoadingFallback },
);

const ClassInsightsTab = dynamic(
  () => import('@/components/dashboard/mentor/class-insights-tab').then((mod) => mod.ClassInsightsTab),
  { ssr: false, loading: TabLoadingFallback },
);

const IngestionTab = dynamic(
  () => import('@/components/dashboard/mentor/ingestion-tab').then((mod) => mod.IngestionTab),
  { ssr: false, loading: TabLoadingFallback },
);

const QuizManagementTab = dynamic(
  () => import('@/components/dashboard/mentor/quiz-management-tab').then((mod) => mod.QuizManagementTab),
  { ssr: false, loading: TabLoadingFallback },
);

const RagAuditTab = dynamic(
  () => import('@/components/dashboard/mentor/rag-audit-tab').then((mod) => mod.RagAuditTab),
  { ssr: false, loading: TabLoadingFallback },
);

function MentorTabWrapper({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="w-full max-w-6xl mx-auto pb-24 px-4 font-be-vietnam-pro">
      {children}
    </div>
  );
}

const WORKSPACE_HEADER_COPY: Partial<Record<TabType, { title: string; subtitle: string }>> = {
  insights: {
    title: 'Thống kê lớp',
    subtitle: 'Giảng viên • Theo dõi tiến độ và điểm yếu của học viên',
  },
  ingestion: {
    title: 'Tài liệu & Graph',
    subtitle: 'Giảng viên • Nạp học liệu và quản lý knowledge graph',
  },
  'quiz-editor': {
    title: 'Quản lý quiz',
    subtitle: 'Giảng viên • Ngân hàng câu hỏi và bộ luyện tập',
  },
  'rag-audit': {
    title: 'Mentor Review',
    subtitle: 'Giảng viên • Kiểm tra phản hồi AI và chất lượng RAG',
  },
  'braintrust-observability': {
    title: 'AI Observability',
    subtitle: 'Ban tổ chức • Braintrust live và giám sát pipeline',
  },
  'btc-heatmap': {
    title: 'Cổng BTC',
    subtitle: 'Ban tổ chức • Tổng quan năng lực và điểm yếu cohort',
  },
};

interface DashboardLayoutProps {
  quiz: ReturnType<typeof useQuizSession>;
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export function DashboardLayout({ quiz, onOpenAuth }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const userId = useBoundStore((state) => state.userId);
  const conceptMasteries = useBoundStore((state) => state.conceptMasteries);
  const useAppFloatingNav = true;
  const showRightBar = false;
  const isStudentWorkspaceTab = quiz.activeTab === 'learn' || quiz.activeTab === 'skills' || quiz.activeTab === 'skill-graph';
  const showSharedAppTopNav = !isStudentWorkspaceTab && quiz.activeTab !== 'chat' && quiz.activeTab !== 'profile';
  const usesCodeBayBackground = quiz.activeTab !== 'chat' || quiz.selectedPersona === 'student';
  const codeBayBackgroundSrc = quiz.activeTab === 'profile'
    ? '/app-backgrounds/code-bay-profile-bg.webp'
    : '/app-backgrounds/code-bay-app-shell-bg.webp';
  const averageElo = useMemo(() => getAggregateLearningElo(conceptMasteries), [conceptMasteries]);
  const displayName = quiz.name || quiz.username || 'Học viên EduGap';
  const sharedTopNavCopy = WORKSPACE_HEADER_COPY[quiz.activeTab] || {
    title: 'EduGap Workspace',
    subtitle: 'Điều phối học tập và vận hành AI',
  };
  const contentShellClass = 'mx-auto w-full max-w-[1360px] px-3 lg:px-5 xl:px-6';
  const mainLayoutClass = useMemo(() => {
    if (quiz.activeTab === 'chat') {
      return `h-[100dvh] min-h-0 overflow-hidden p-0 md:ml-0 ${useAppFloatingNav ? 'lg:pr-20' : ''}`;
    }

    if (quiz.activeTab === 'learn' || quiz.activeTab === 'skill-graph') {
      return `min-h-[100dvh] pt-2 pb-20 md:h-[100dvh] md:min-h-0 md:overflow-hidden md:pb-2 ${useAppFloatingNav ? 'md:pt-2 lg:pr-20' : 'md:ml-64 md:pt-4 lg:pr-20'}`;
    }

    if (quiz.activeTab === 'skills' || quiz.activeTab === 'profile') {
      return `min-h-[100dvh] pt-2 pb-20 md:h-[100dvh] md:min-h-0 md:overflow-hidden md:pb-2 md:pt-2 ${useAppFloatingNav ? 'lg:pr-20' : 'md:ml-64 lg:pr-20'}`;
    }

    return `min-h-screen pt-4 pb-20 md:pt-6 ${useAppFloatingNav ? 'lg:pr-20' : 'md:ml-64'} ${showRightBar ? 'lg:mr-80' : ''}`;
  }, [quiz.activeTab, showRightBar, useAppFloatingNav]);
  const setActiveRouteTab = (tab: TabType) => {
    quiz.setActiveTab(tab);
    router.push(getRouteForTab(tab));
  };
  const handleStartPracticeWithActivation: typeof quiz.handleStartPractice = (skill, targetSetId) => {
    if (skill && quiz.selectedPersona === 'student') {
      completeFirstRun(userId);
    }
    return quiz.handleStartPractice(skill, targetSetId);
  };

  useEffect(() => {
    if (quiz.isQuizMode) return;

    const routeTab = getTabForRoute(pathname);
    if (routeTab === quiz.activeTab) return;

    router.replace(getRouteForTab(quiz.activeTab), { scroll: false });
  }, [pathname, quiz.activeTab, quiz.isQuizMode, router]);

  return (
    <>
      {/* 2. Learning Dashboard Mode (3-Columns Layout) */}
      <div className={`relative isolate flex w-full flex-col md:flex-row ${quiz.activeTab === 'chat' ? 'fixed inset-0 z-0 h-[100dvh] min-h-0 overflow-hidden' : 'flex-1 overflow-hidden bg-[#f4fce8]'}`}>
        {usesCodeBayBackground && (
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
            <Image
              src={codeBayBackgroundSrc}
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-45"
              priority={quiz.activeTab === 'learn' || quiz.activeTab === 'skills' || quiz.activeTab === 'profile'}
            />
            <div className="absolute inset-0 bg-[#f4fce8]/42" />
          </div>
        )}

        {/* Navigation Sidebar */}
        <LeftBar 
          activeTab={quiz.activeTab} 
          setActiveTab={setActiveRouteTab} 
          loggedIn={quiz.loggedIn}
          variant={useAppFloatingNav ? 'top' : 'sidebar'}
          onOpenAuth={onOpenAuth}
        />

        {/* Center Main Tab View */}
        <main
          className={`flex-1 ${mainLayoutClass}`}
        >
          {showSharedAppTopNav && (
            <div className={contentShellClass}>
              <AppTopNav
                activeDays={quiz.activeDays}
                title={sharedTopNavCopy.title}
                subtitle={sharedTopNavCopy.subtitle}
                averageElo={averageElo}
                displayName={displayName}
                eloHistoryEvents={quiz.eloHistoryEvents}
                initial={displayName.trim().charAt(0).toUpperCase() || 'N'}
                loggedIn={quiz.loggedIn}
                mssv={quiz.mssv}
                onLogOut={quiz.logOut}
                onOpenLogin={() => onOpenAuth('login')}
                onOpenProfile={() => setActiveRouteTab('profile')}
                role={quiz.role}
                selectedPersona={quiz.selectedPersona}
                setPersona={quiz.setPersona}
                streak={quiz.streak}
                userId={userId ? String(userId) : null}
                xp={quiz.xp}
              />
            </div>
          )}

          {isStudentWorkspaceTab && (
            <div className="relative z-10 h-full w-full">
              <section
                className={quiz.activeTab === 'learn' ? 'h-full w-full' : 'hidden h-full w-full'}
                aria-hidden={quiz.activeTab !== 'learn'}
              >
                {quiz.activeGuidebookDayId ? (
                  <div className="h-full w-full overflow-y-auto learning-scrollbar">
                    <GuidebookView
                      activeGuidebookDayId={quiz.activeGuidebookDayId}
                      guidebookHtml={quiz.guidebookHtml}
                      isLoadingGuidebook={quiz.isLoadingGuidebook}
                      onClose={quiz.handleCloseGuidebook}
                    />
                  </div>
                ) : (
                  <LearningPath
                    skills={quiz.skills}
                    sets={quiz.data.sets}
                    completedSets={quiz.completedSets}
                    answersHistory={quiz.answersHistory}
                    onStartPractice={handleStartPracticeWithActivation}
                    devMode={quiz.devMode}
                    onToggleDevMode={quiz.handleToggleDevMode}
                    onSelectGuidebook={quiz.handleSelectGuidebook}
                    onOpenAiCoach={() => setActiveRouteTab('chat')}
                    onOpenLogin={() => onOpenAuth('signup')}
                    onOpenProfile={() => setActiveRouteTab('profile')}
                  />
                )}
              </section>

              <section
                className={quiz.activeTab === 'skills' ? 'h-full w-full' : 'hidden h-full w-full'}
                aria-hidden={quiz.activeTab !== 'skills'}
              >
                <SkillsPracticeTab
                  onStartPractice={handleStartPracticeWithActivation}
                  onOpenLogin={() => onOpenAuth('signup')}
                  onOpenProfile={() => setActiveRouteTab('profile')}
                />
              </section>

              <section
                className={quiz.activeTab === 'skill-graph' ? 'h-full w-full' : 'hidden h-full w-full'}
                aria-hidden={quiz.activeTab !== 'skill-graph'}
              >
                <KnowledgeGraphPage
                  setActiveTab={setActiveRouteTab}
                  onStartPractice={handleStartPracticeWithActivation}
                  onOpenLogin={() => onOpenAuth('signup')}
                  onOpenProfile={() => setActiveRouteTab('profile')}
                />
              </section>
            </div>
          )}

          <AnimatePresence mode="wait">
            {!isStudentWorkspaceTab && quiz.activeTab === 'profile' && (
              <ProfileTab
                activeDays={quiz.activeDays}
                completedSets={quiz.completedSets}
                data={quiz.data}
                streak={quiz.streak}
                xp={quiz.xp}
                eloHistoryEvents={quiz.eloHistoryEvents}
                name={quiz.name}
                username={quiz.username}
                mssv={quiz.mssv}
                role={quiz.role}
                joinedAt={quiz.joinedAt}
                loggedIn={quiz.loggedIn}
                onLogOut={quiz.logOut}
                selectedPersona={quiz.selectedPersona}
                setPersona={quiz.setPersona}
                setActiveTab={setActiveRouteTab}
                userId={userId ? String(userId) : null}
                onStartPractice={(skillId, targetSetId) => {
                  const skill = quiz.skills.find((s) => s.id === skillId);
                  handleStartPracticeWithActivation(skill, targetSetId);
                }}
              />
            )}

            {!isStudentWorkspaceTab && quiz.activeTab === 'insights' && (
              <motion.div key="insights-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <MentorTabWrapper>
                  <ClassInsightsTab />
                </MentorTabWrapper>
              </motion.div>
            )}

            {!isStudentWorkspaceTab && quiz.activeTab === 'ingestion' && (
              <motion.div key="ingestion-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <MentorTabWrapper>
                  <IngestionTab />
                </MentorTabWrapper>
              </motion.div>
            )}

            {!isStudentWorkspaceTab && quiz.activeTab === 'quiz-editor' && (
              <motion.div key="quiz-editor-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <MentorTabWrapper>
                  <QuizManagementTab />
                </MentorTabWrapper>
              </motion.div>
            )}

            {!isStudentWorkspaceTab && quiz.activeTab === 'rag-audit' && (
              <motion.div key="rag-audit-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <MentorTabWrapper>
                  <RagAuditTab />
                </MentorTabWrapper>
              </motion.div>
            )}

            {!isStudentWorkspaceTab && quiz.activeTab === 'btc-heatmap' && (
              <motion.div key="btc-heatmap-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <BtcHeatmap />
              </motion.div>
            )}

            {!isStudentWorkspaceTab && quiz.activeTab === 'braintrust-observability' && (
              <motion.div key="braintrust-observability-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <BraintrustObservabilityTab />
              </motion.div>
            )}
          </AnimatePresence>

          {quiz.hasOpenedChat && (
            <div className={`w-full h-full ${quiz.activeTab === 'chat' ? 'block animate-in fade-in' : 'hidden'}`}>
              <SocraticChatTab 
                setActiveTab={setActiveRouteTab}
                loggedIn={quiz.loggedIn}
                onOpenAuth={onOpenAuth}
                activeTab={quiz.activeTab}
              />
            </div>
          )}
        </main>

        {/* Desktop right sidebar is disabled; role shortcuts live in the floating app navigation. */}
      </div>

      {/* Footer copyright */}
      {quiz.activeTab !== 'chat' && quiz.activeTab !== 'learn' && quiz.activeTab !== 'skills' && quiz.activeTab !== 'skill-graph' && (
        <footer className="w-full bg-warm-cream/50 border-t border-tertiary-yellow/15 py-4 text-center text-caption-tight font-mono text-stone-400 mt-auto">
          EduGap AI Thực Chiến &copy; 2026 {"->"} Nền tảng học tập cá nhân hóa
        </footer>
      )}

      <FirstRunGuide
        activeTab={quiz.activeTab}
        isStudent={quiz.selectedPersona === 'student'}
        userId={userId}
      />
    </>
  );
}

