'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BarChart3, FileEdit, GraduationCap, Search, Upload, Users } from 'lucide-react';
import { ClassInsightsTab } from './mentor/class-insights-tab';
import { IngestionTab } from './mentor/ingestion-tab';
import { QuizEditorTab } from './mentor/quiz-editor-tab';
import { RagAuditTab } from './mentor/rag-audit-tab';

/**
 * Mentor Portal - shell container with sidebar + content area
 *
 * Main mentor tabs:
 *   - insights    -> Thong ke lop
 *   - ingestion   -> Tai lieu & Graph
 *   - quiz-editor -> Duyet cau hoi
 *   - rag-audit   -> Mentor Review
 */

export type MentorTabId = 'insights' | 'ingestion' | 'quiz-editor' | 'rag-audit';

interface MentorTabDef {
  id: MentorTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  emoji: string;
  description: string;
}

const MENTOR_TABS: MentorTabDef[] = [
  {
    id: 'insights',
    label: 'Thong Ke Lop',
    icon: Users,
    emoji: '📊',
    description: 'Ho so nang luc va canh bao do',
  },
  {
    id: 'ingestion',
    label: 'Tai Lieu & Graph',
    icon: Upload,
    emoji: '📤',
    description: 'Upload tai lieu va duyet knowledge graph',
  },
  {
    id: 'quiz-editor',
    label: 'Duyet Cau Hoi',
    icon: FileEdit,
    emoji: '✏️',
    description: 'Chinh sua va phe duyet cau hoi AI sinh',
  },
  {
    id: 'rag-audit',
    label: 'Mentor Review',
    icon: Search,
    emoji: '🔍',
    description: 'Mentor review inbox cho AI response',
  },
];

interface MentorDashboardProps {
  defaultTab?: MentorTabId;
}

export const MentorDashboard: React.FC<MentorDashboardProps> = ({
  defaultTab = 'insights',
}) => {
  const [activeTab, setActiveTab] = useState<MentorTabId>(defaultTab);
  const [quizEditorSourceFilter, setQuizEditorSourceFilter] = useState<string | undefined>(undefined);

  const handleNavigateToQuizEditor = (sourceDocName?: string) => {
    setQuizEditorSourceFilter(sourceDocName);
    setActiveTab('quiz-editor');
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'insights':
        return <ClassInsightsTab />;
      case 'ingestion':
        return <IngestionTab onNavigateToQuizEditor={handleNavigateToQuizEditor} />;
      case 'quiz-editor':
        return (
          <QuizEditorTab
            initialSourceFilter={quizEditorSourceFilter}
            onClearSourceFilter={() => setQuizEditorSourceFilter(undefined)}
          />
        );
      case 'rag-audit':
        return <RagAuditTab />;
      default:
        return <ClassInsightsTab />;
    }
  };

  const activeTabDef = MENTOR_TABS.find((tab) => tab.id === activeTab) ?? MENTOR_TABS[0];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 font-be-vietnam-pro md:py-6">
      <div className="mb-6 flex items-center justify-between border-b border-gray-border pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-green">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <h2 className="font-fraunces text-sm font-black uppercase tracking-tight text-on-background md:text-md">
            Cong Giang Vien
          </h2>
        </div>
        <div className="rounded-xl border border-gray-border bg-surface-container-low px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-stone-500">
          {activeTabDef.emoji} {activeTabDef.label}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="rounded-3xl border-2 border-gray-border bg-white p-4 shadow-sm">
          <div className="mb-4 border-b border-gray-border pb-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-stone-500">Mentor Workspace</h3>
            <p className="mt-1 text-[11px] font-semibold leading-relaxed text-stone-500">
              Quan sat lop, duyet quiz, va review cac bao cao AI response.
            </p>
          </div>

          <div className="space-y-2">
            {MENTOR_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTab;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full rounded-2xl border-2 px-4 py-3 text-left transition-all ${
                    isActive
                      ? 'border-primary-green bg-primary-green/10 text-primary-green-dark shadow-sm'
                      : 'border-gray-border bg-white text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl bg-white/80 p-2 shadow-sm">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-black uppercase tracking-wider">{tab.label}</div>
                      <div className="mt-1 text-[11px] font-semibold leading-relaxed opacity-80">
                        {tab.description}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {renderActiveTab()}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
};

export default MentorDashboard;
