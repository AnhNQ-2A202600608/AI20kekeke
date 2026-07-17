'use client';

import { useState } from 'react';
import { ChevronDown, Gauge, History, Info, Loader2, TrendingDown, TrendingUp } from 'lucide-react';

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

interface EloHistoryPopoverProps {
  averageElo: number;
  activeConceptId?: string | null;
  eloScope?: 'aggregate' | 'concept';
  events?: EloHistoryEvent[];
  isLoading?: boolean;
}

const sourceLabel: Record<EloHistoryEvent['source'], string> = {
  practice: 'Luyện tập',
  review: 'Ôn lại',
  decay: 'Suy giảm',
  manual: 'Điều chỉnh',
  aggregate: 'Tổng hợp',
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function formatSigned(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded >= 0 ? '+' : ''}${rounded.toFixed(rounded % 1 === 0 ? 0 : 1)}`;
}

function formatScore(value: number | undefined, digits = 3) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  return Number(value.toFixed(digits)).toString();
}

export function EloHistoryPopover({
  averageElo,
  activeConceptId,
  eloScope = 'aggregate',
  events = [],
  isLoading = false,
}: EloHistoryPopoverProps) {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [showFormula, setShowFormula] = useState(false);
  const visibleEvents = events.filter((event) => {
    const eventScope = event.scope || 'concept';
    if (eventScope !== eloScope) return false;
    if (eloScope === 'concept' && activeConceptId) {
      return event.conceptId === activeConceptId;
    }
    return true;
  });
  const totalDelta = visibleEvents.reduce((sum, event) => sum + event.delta, 0);

  return (
    <div>
      <div className="flex items-start gap-2.5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-primary-blue/20 bg-sky-50 text-primary-blue">
          <Gauge className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-caption-tight font-black uppercase tracking-[0.16em] text-primary-blue">
            {eloScope === 'concept' ? 'Elo concept hiện tại' : 'Elo học tập hiện tại'}
          </p>
          <p className="mt-0.5 text-xl font-black leading-tight text-on-background">{averageElo}</p>
          <p className="mt-1 text-label-tight font-bold leading-4 text-stone-500">
            {eloScope === 'concept'
              ? 'Đang xem Elo riêng của concept trong bài. Các dòng bên dưới chỉ là lịch sử cộng/trừ của concept này sau từng câu.'
              : 'Đang xem Elo tổng. Điểm này lấy trung bình các concept đã luyện và chỉ ghi log khi bạn rời một phiên luyện.'}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-primary-blue/15 bg-sky-50/70 p-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1.5 text-caption-tight font-black uppercase tracking-[0.14em] text-primary-blue">
              <History className="h-3.5 w-3.5" aria-hidden="true" />
              {eloScope === 'concept' ? 'Sổ Elo concept' : 'Sổ Elo tổng'}
            </div>
            <button
              type="button"
              onClick={() => setShowFormula((open) => !open)}
              className="grid h-6 w-6 place-items-center rounded-full border border-primary-blue/20 bg-white text-primary-blue transition hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-blue/20"
              aria-label="Xem công thức thuật toán Elo"
              title="Công thức Elo"
            >
              <Info className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          {visibleEvents.length > 0 ? (
            <span className={['font-mono text-caption-tight font-black', totalDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'].join(' ')}>
              {formatSigned(totalDelta)}
            </span>
          ) : null}
        </div>

        {showFormula ? (
          <div className="mt-2 rounded-xl border border-primary-blue/15 bg-white p-2 text-caption-tight font-semibold leading-4 text-stone-600">
            <p className="font-black text-on-background">Công thức cập nhật</p>
            <p className="mt-1 font-mono text-[10px] leading-4 text-stone-600">
              Elo mới = Elo cũ + K x (điểm thực tế - xác suất kỳ vọng) x hệ số hint
            </p>
            <p className="mt-1">
              K-factor cao hơn khi dữ liệu còn ít, giảm dần khi đã có nhiều lượt làm. Dùng hint chỉ giảm phần Elo tăng, không che giấu lượt sai.
            </p>
          </div>
        ) : null}

        <div className="mt-2 max-h-56 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="grid min-h-24 place-items-center rounded-xl border border-dashed border-primary-blue/20 bg-white text-center">
              <div>
                <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary-blue" aria-hidden="true" />
                <p className="mt-2 text-label-tight font-black text-stone-600">Đang tải lịch sử tiến bộ</p>
              </div>
            </div>
          ) : visibleEvents.length > 0 ? (
            <div className="space-y-1.5">
              {visibleEvents.map((event) => {
                const isGain = event.delta >= 0;
                const TrendIcon = isGain ? TrendingUp : TrendingDown;
                const isExpanded = expandedEventId === event.id;
                const log = event.calculationLog;
                const aggregateLog = event.aggregateLog;
                return (
                  <div key={event.id} className="rounded-xl border border-gray-border bg-white p-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-label-tight font-black text-on-background">{event.conceptTitle}</p>
                        <p className="mt-0.5 text-kicker-micro font-bold text-stone-500">
                          {formatDate(event.occurredAt)} · {sourceLabel[event.source]} · {event.oldElo} → {event.newElo}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <span className={['inline-flex items-center gap-1 rounded-full px-2 py-1 text-caption-tight font-black', isGain ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'].join(' ')}>
                          <TrendIcon className="h-3 w-3" aria-hidden="true" />
                          {formatSigned(event.delta)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                          className="grid h-7 w-7 place-items-center rounded-full border border-gray-border bg-white text-stone-500 transition hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-blue/20"
                          aria-label={isExpanded ? 'Thu gọn giải thích Elo' : 'Mở giải thích Elo'}
                          title={isExpanded ? 'Thu gọn' : 'Giải thích'}
                        >
                          <ChevronDown className={['h-3.5 w-3.5 transition-transform', isExpanded ? 'rotate-180' : ''].join(' ')} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    {isExpanded ? (
                      <div className="mt-2 rounded-lg border border-gray-border/80 bg-surface-container-low p-2">
                        <p className="text-caption-tight font-bold leading-4 text-stone-600">
                          {event.note || (event.scope === 'aggregate' ? 'Elo tổng được tính lại từ trung bình các concept đã luyện.' : 'Concept Elo được cập nhật sau câu trả lời này.')}
                        </p>
                        {aggregateLog ? (
                          <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] font-bold leading-4 text-stone-500">
                            <div>
                              <dt className="uppercase text-stone-400">Công thức</dt>
                              <dd className="font-mono text-on-background">{aggregateLog.formula || 'Trung bình concept'}</dd>
                            </div>
                            <div>
                              <dt className="uppercase text-stone-400">Số concept</dt>
                              <dd className="font-mono text-on-background">{aggregateLog.conceptCount ?? '-'}</dd>
                            </div>
                          </dl>
                        ) : null}
                        {log ? (
                          <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] font-bold leading-4 text-stone-500">
                            <div>
                              <dt className="uppercase text-stone-400">Câu hỏi Elo</dt>
                              <dd className="font-mono text-on-background">{formatScore(log.question_difficulty_elo, 0)}</dd>
                            </div>
                            <div>
                              <dt className="uppercase text-stone-400">Kỳ vọng</dt>
                              <dd className="font-mono text-on-background">{formatScore(log.expected_success)}</dd>
                            </div>
                            <div>
                              <dt className="uppercase text-stone-400">Điểm thực tế</dt>
                              <dd className="font-mono text-on-background">{formatScore(log.actual_score)}</dd>
                            </div>
                            <div>
                              <dt className="uppercase text-stone-400">K</dt>
                              <dd className="font-mono text-on-background">{formatScore(log.k_student, 2)}</dd>
                            </div>
                            <div>
                              <dt className="uppercase text-stone-400">Hint</dt>
                              <dd className="font-mono text-on-background">{log.hint_count ?? 0}</dd>
                            </div>
                            <div>
                              <dt className="uppercase text-stone-400">Hệ số</dt>
                              <dd className="font-mono text-on-background">{formatScore(log.hint_discount, 2)}</dd>
                            </div>
                          </dl>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-primary-blue/20 bg-white p-3 text-center">
              <p className="text-label-tight font-black text-on-background">Chưa có lịch sử tiến bộ</p>
              <p className="mt-1 text-caption-tight font-semibold leading-4 text-stone-500">
                {eloScope === 'concept'
                  ? 'Khi bạn trả lời câu hỏi trong concept này, lịch sử cộng/trừ của concept sẽ hiện tại đây.'
                  : 'Khi bạn rời một phiên luyện có thay đổi Elo, lịch sử tính lại Elo tổng sẽ hiện tại đây.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EloHistoryPopover;
