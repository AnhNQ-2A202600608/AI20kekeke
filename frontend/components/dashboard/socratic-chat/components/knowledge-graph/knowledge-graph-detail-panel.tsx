import React from 'react';
import { ChevronLeft, ChevronRight, MessageSquareText, Play, Target } from 'lucide-react';
import { MetricPill } from '@/components/ui/learning';
import type { KnowledgeGraphDetail, KnowledgeGraphNode } from './types';

interface KnowledgeGraphDetailPanelProps {
  detail: KnowledgeGraphDetail | null;
  isCollapsed?: boolean;
  onAskAboutConcept?: (node: KnowledgeGraphNode) => void;
  onNavigateToCurrent?: () => void;
  onStartPractice?: (node: KnowledgeGraphNode) => void;
  onToggleCollapsed?: () => void;
}

const statusLabel = {
  mastered: 'Đã thành thạo',
  learning: 'Đang học',
  weak: 'Cần ôn tập',
  not_started: 'Chưa học',
  locked: 'Đang khóa',
};

const statusClass = {
  mastered: 'border-primary-green/30 bg-primary-green/10 text-primary-green-dark',
  learning: 'border-tertiary-yellow/30 bg-tertiary-yellow/15 text-stone-700',
  weak: 'border-error-red/25 bg-error-red-light/25 text-error-red-dark',
  not_started: 'border-stone-200 bg-stone-100 text-stone-500',
  locked: 'border-stone-200 bg-stone-50 text-stone-400',
};

const PrerequisiteList = ({ nodes }: { nodes: KnowledgeGraphNode[] }) => {
  const visibleNodes = nodes.slice(0, 2);

  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.08em] text-stone-400">Cần nắm trước</p>
      <div className="mt-2 space-y-2">
        {visibleNodes.length > 0 ? (
          visibleNodes.map((node) => (
            <div
              key={node.id}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-[13px] font-bold leading-5 text-stone-700"
            >
              {node.label}
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-stone-200 bg-stone-50 px-3 py-2 text-[13px] font-semibold text-stone-400">
            Có thể học ngay.
          </p>
        )}
      </div>
    </div>
  );
};

const actionButtonClass =
  'inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 text-[13px] font-black transition duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-green disabled:cursor-not-allowed disabled:opacity-45';

const primaryActionButtonClass =
  `${actionButtonClass} border-primary-green-dark bg-primary-green text-white shadow-sm hover:brightness-105 active:translate-y-[1px]`;

const secondaryActionButtonClass =
  `${actionButtonClass} border-stone-200 bg-white text-on-background hover:border-primary-green/35 hover:bg-primary-green/5 active:translate-y-[1px]`;

export const KnowledgeGraphDetailPanel: React.FC<KnowledgeGraphDetailPanelProps> = ({
  detail,
  isCollapsed = false,
  onAskAboutConcept,
  onStartPractice,
  onToggleCollapsed,
}) => {
  if (!detail) {
    return (
      <aside className="flex h-full min-h-0 flex-col justify-center rounded-2xl border-2 border-dashed border-gray-border bg-white p-5 text-center">
        {onToggleCollapsed ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-stone-200 bg-white text-stone-500 shadow-sm transition hover:bg-stone-50"
            aria-label={isCollapsed ? 'Mở panel chi tiết' : 'Thu gọn panel chi tiết'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        ) : null}
        <Target className="mx-auto h-8 w-8 text-stone-300" />
        <p className="mt-3 text-sm font-black text-stone-600">Chọn một node để xem lộ trình</p>
        <p className="mt-1 text-[13px] font-semibold leading-6 text-stone-400">
          Panel sẽ hiện trạng thái học và bước nên làm tiếp theo.
        </p>
      </aside>
    );
  }

  const { node, prerequisites } = detail;

  if (isCollapsed) {
    return (
      <aside className="flex h-full min-h-0 flex-col items-center rounded-2xl border border-gray-border bg-white px-2 py-3">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="grid h-10 w-10 place-items-center rounded-full border border-primary-green/30 bg-primary-green/10 text-primary-green-dark shadow-sm transition hover:bg-primary-green/15"
          aria-label="Mở panel chi tiết node"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <div className="mt-4 flex min-h-0 flex-1 flex-col items-center gap-3">
          <span className={`h-3 w-3 rounded-full border ${statusClass[node.status]}`} aria-hidden="true" />
          <p className="max-h-44 writing-mode-vertical text-center text-[12px] font-black uppercase tracking-[0.08em] text-stone-600 [writing-mode:vertical-rl]">
            {node.shortLabel || node.label}
          </p>
        </div>
        <div className="mb-1 rounded-full border border-primary-green/25 bg-primary-green/10 px-2 py-1 text-[11px] font-black text-primary-green-dark">
          {node.masteryPct}%
        </div>
      </aside>
    );
  }

  return (
    <aside className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-border bg-white p-4">
      {onToggleCollapsed ? (
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-stone-200 bg-white text-stone-500 shadow-sm transition hover:bg-stone-50"
          aria-label="Thu gọn panel chi tiết node"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      ) : null}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 pr-10">
          <p className="text-[12px] font-black uppercase text-primary-green-dark">
            {node.dayId || 'concept'}
          </p>
          <h3 className="mt-1 font-fraunces text-[1.35rem] font-black leading-tight text-on-background">
            {node.label}
          </h3>
        </div>
      </div>

      {node.description ? (
        <p className="mt-3 max-h-[5.5rem] overflow-hidden text-[13px] font-semibold leading-6 text-stone-600">
          {node.description}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <MetricPill label="Mastery" value={`${node.masteryPct}%`} tone="green" />
        <MetricPill label="Elo" value={node.elo} tone="neutral" />
      </div>

      <div className="mt-3">
        <span className={`inline-flex rounded-full border px-3 py-1 text-[12px] font-black ${statusClass[node.status]}`}>
          {statusLabel[node.status]}
        </span>
      </div>

      <div className="mt-4">
        <PrerequisiteList nodes={prerequisites} />
      </div>

      <div className="mt-auto pt-4">
        <button
          type="button"
          onClick={() => onAskAboutConcept?.(node)}
          className={primaryActionButtonClass}
        >
          <MessageSquareText className="h-4 w-4" />
          Hỏi Sofi về node này
        </button>
        <button
          type="button"
          onClick={() => onStartPractice?.(node)}
          disabled={!onStartPractice || node.associatedSets.length === 0}
          className={`${secondaryActionButtonClass} mt-2`}
        >
          <Play className="h-4 w-4" />
          Luyện tập node này
        </button>
      </div>
    </aside>
  );
};
