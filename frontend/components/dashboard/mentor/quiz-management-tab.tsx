'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, FileEdit } from 'lucide-react';
import { QuizEditorTab } from './quiz-editor-tab';
import { QuizErrorCasesTab } from './quiz-error-cases-tab';

type QuizManagementView = 'review' | 'errors';

type SearchParamsLike = {
  get: (name: string) => string | null;
};

function getViewFromSearch(searchParams: SearchParamsLike): QuizManagementView {
  return searchParams.get('quizView') === 'errors' ? 'errors' : 'review';
}

export function QuizManagementTab({
  initialSourceFilter,
  onClearSourceFilter,
}: {
  initialSourceFilter?: string;
  onClearSourceFilter?: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeView = getViewFromSearch(searchParams);

  const updateView = (nextView: QuizManagementView) => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const normalizedPath = window.location.pathname.replace(/\/$/, '');
    if (normalizedPath === '/mentor/quiz-editor') {
      params.delete('tab');
    } else {
      params.set('tab', 'quiz-editor');
    }

    if (nextView === 'errors') {
      params.set('quizView', 'errors');
    } else {
      params.delete('quizView');
    }

    const query = params.toString();
    router.replace(query ? `${window.location.pathname}?${query}` : window.location.pathname, {
      scroll: false,
    });
  };

  return (
    <div className="space-y-4 font-be-vietnam-pro">
      <div className="flex flex-col gap-3 border-b border-stone-200/80 pb-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex w-full rounded-xl border border-stone-200 bg-white p-1 shadow-sm sm:w-auto">
          <button
            type="button"
            onClick={() => updateView('review')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[10px] font-black uppercase tracking-wider transition-all sm:flex-none ${
              activeView === 'review'
                ? 'border border-primary-green/25 bg-primary-green/10 text-primary-green-dark shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
            aria-pressed={activeView === 'review'}
          >
            <FileEdit className="h-3.5 w-3.5" />
            <span>Câu hỏi chờ duyệt</span>
          </button>
          <button
            type="button"
            onClick={() => updateView('errors')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[10px] font-black uppercase tracking-wider transition-all sm:flex-none ${
              activeView === 'errors'
                ? 'border border-primary-green/25 bg-primary-green/10 text-primary-green-dark shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
            aria-pressed={activeView === 'errors'}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Báo lỗi từ học viên</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-400">
          <span className="h-2 w-2 rounded-full bg-primary-green" />
          <span>Mentor quiz workbench</span>
        </div>
      </div>

      {activeView === 'review' ? (
        <QuizEditorTab
          initialSourceFilter={initialSourceFilter}
          onClearSourceFilter={onClearSourceFilter}
        />
      ) : (
        <QuizErrorCasesTab />
      )}
    </div>
  );
}
