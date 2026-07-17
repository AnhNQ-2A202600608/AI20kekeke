import React from 'react';
import { AlertTriangle, Network, Sparkles } from 'lucide-react';
import { ActionButton } from '@/components/ui/action-button';
import type { KnowledgeGraphSummary } from './types';

interface KnowledgeGraphTriggerProps {
  summary: KnowledgeGraphSummary;
  onOpen: () => void;
  isLoading?: boolean;
  className?: string;
  variant?: 'floating' | 'inline';
}

export const KnowledgeGraphTrigger: React.FC<KnowledgeGraphTriggerProps> = ({
  summary,
  onOpen,
  isLoading = false,
  className = '',
  variant = 'floating',
}) => {
  const hasWeakNodes = summary.weak > 0;
  const isInline = variant === 'inline';

  return (
    <ActionButton
      type="button"
      onClick={onOpen}
      variant="white"
      className={`${
        isInline
          ? 'min-h-[168px] w-full justify-start gap-4 rounded-2xl bg-surface-container-low px-5 py-5 text-left text-on-background shadow-sm'
          : 'fixed bottom-5 right-5 z-[1200] min-h-14 gap-2 rounded-2xl bg-white/95 px-3 py-2 text-left text-on-background shadow-[0_12px_28px_rgba(23,30,18,0.14)] backdrop-blur-md md:bottom-7 md:right-7'
      } ${className}`}
      aria-label="Mở bản đồ kiến thức tiên quyết"
      title="Mở bản đồ kiến thức"
    >
      <span className={`relative flex shrink-0 items-center justify-center rounded-xl border border-primary-green/20 bg-primary-green/10 text-primary-green-dark ${isInline ? 'h-14 w-14' : 'h-9 w-9'}`}>
        {isLoading ? (
          <Sparkles className={`${isInline ? 'h-6 w-6' : 'h-4.5 w-4.5'} animate-spin`} />
        ) : (
          <Network className={`${isInline ? 'h-6 w-6' : 'h-4.5 w-4.5'} stroke-[2.6]`} />
        )}
        {hasWeakNodes && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-error-red px-1 text-[9px] font-black text-white shadow-sm">
            {summary.weak}
          </span>
        )}
      </span>
      <span className={`${isInline ? 'flex' : 'hidden sm:flex'} min-w-0 flex-col leading-none`}>
        <span className={`${isInline ? 'text-lg font-fraunces normal-case' : 'text-[11px] uppercase'} font-black tracking-wider text-on-background`}>
          {isInline ? 'Skill Map trong lộ trình' : 'Skill Map'}
        </span>
        <span className={`mt-2 inline-flex items-center gap-1 text-[10px] font-bold ${hasWeakNodes ? 'text-error-red-dark' : 'text-stone-500'}`}>
          {hasWeakNodes && <AlertTriangle className="h-3 w-3" />}
          {hasWeakNodes ? `${summary.weak} điểm yếu` : `${summary.mastered}/${summary.total} mastered`}
        </span>
        {isInline && (
          <span className="mt-3 max-w-xl text-xs font-semibold normal-case leading-relaxed text-stone-600">
            Mở graph quan hệ prerequisite, xem concept yếu và chuyển nhanh sang AI coach hoặc bài luyện liên quan.
          </span>
        )}
      </span>
    </ActionButton>
  );
};
