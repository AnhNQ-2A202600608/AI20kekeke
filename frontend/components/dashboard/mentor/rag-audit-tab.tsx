'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  Flag,
  Loader2,
  MoreHorizontal,
  RefreshCcw,
  Search,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import { useBoundStore } from '@/hooks/useBoundStore';
import { MascotLoadingBlock } from '@/components/mascot';
import { getRequestAuthToken } from '@/lib/auth-token';
import { motion, AnimatePresence } from 'motion/react';
import {
  AiResponseFeedbackReport,
  AiResponseReviewItem,
  AiResponseReviewStatus,
  AiResponseSentiment,
  fetchAiResponseReviewItems,
  updateAiResponseReviewItem,
} from '@/lib/mentor/ai-response-feedback';
import { SocraticMarkdown } from '../socratic-chat/student/components/ai-message-item';

const COURSE_ID = '00000000-0000-0000-0000-000000000001';

type RatingFilter = 'all' | 'positive' | 'negative';
type StatusFilter = 'all' | AiResponseReviewStatus;

type ReviewCounts = {
  all: number;
  pending: number;
  resolved: number;
  rejected: number;
  flagged: number;
  like: number;
  dislike: number;
  total_feedback: number;
  like_rate: number;
  dislike_rate: number;
};

type ReviewRow = {
  id: string;
  item: AiResponseReviewItem;
  sentiment: AiResponseSentiment;
  reports: AiResponseFeedbackReport[];
  issueGroup: string;
  reportedAt?: string | null;
};

const EMPTY_COUNTS: ReviewCounts = {
  all: 0,
  pending: 0,
  resolved: 0,
  rejected: 0,
  flagged: 0,
  like: 0,
  dislike: 0,
  total_feedback: 0,
  like_rate: 0,
  dislike_rate: 0,
};

const STATUS_LABELS: Record<AiResponseReviewStatus, string> = {
  pending: 'Mới',
  resolved: 'Đã xem',
  rejected: 'Từ chối',
  flagged: 'Đã gắn cờ',
};

const STATUS_STYLES: Record<AiResponseReviewStatus, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  resolved: 'border-primary-green/20 bg-primary-green/10 text-primary-green-dark',
  rejected: 'border-rose-200 bg-rose-50 text-rose-700',
  flagged: 'border-blue-200 bg-blue-50 text-blue-700',
};

const ISSUE_LABELS: Record<string, string> = {
  helpful: 'Tốt',
  unhelpful: 'Chưa hữu ích',
  incorrect: 'Thiếu chính xác',
  bad_citation: 'Trích dẫn sai',
  unsafe: 'Không an toàn',
};

function normalizeCounts(counts?: Partial<ReviewCounts>): ReviewCounts {
  return {
    all: counts?.all || 0,
    pending: counts?.pending || 0,
    resolved: counts?.resolved || 0,
    rejected: counts?.rejected || 0,
    flagged: counts?.flagged || 0,
    like: counts?.like || 0,
    dislike: counts?.dislike || 0,
    total_feedback: counts?.total_feedback || 0,
    like_rate: counts?.like_rate || 0,
    dislike_rate: counts?.dislike_rate || 0,
  };
}

function formatDate(value?: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function formatLongDate(value?: string | null) {
  if (!value) return 'Chưa có thời gian';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getQuestionText(item: AiResponseReviewItem) {
  return item.prompt_text || item.response_text || 'Chưa có nội dung câu hỏi';
}

function getSummaryText(item: AiResponseReviewItem) {
  return item.response_text || item.prompt_text || 'Chưa có nội dung response để hiển thị.';
}

function getLatestReport(reports: AiResponseFeedbackReport[]) {
  return [...reports].sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))[0];
}

function getIssueGroupForReports(sentiment: AiResponseSentiment, reports: AiResponseFeedbackReport[], fallback: AiResponseReviewItem) {
  if (sentiment === 'like') return 'Tốt';

  const latest = getLatestReport(reports);
  const issueKey = latest?.issue_type || latest?.feedback_type || fallback.latest_issue_type || fallback.latest_feedback_type;
  if (issueKey && ISSUE_LABELS[issueKey]) return ISSUE_LABELS[issueKey];
  return latest?.issue_label || fallback.latest_issue_label || 'Cần review';
}

function buildReviewRows(items: AiResponseReviewItem[]): ReviewRow[] {
  return items.flatMap((item) => {
    const likeReports = item.reports.filter((report) => report.sentiment === 'like' || report.feedback_type === 'helpful');
    const dislikeReports = item.reports.filter((report) => report.sentiment === 'dislike' || report.feedback_type !== 'helpful');
    const rows: ReviewRow[] = [];

    if (likeReports.length > 0) {
      rows.push({
        id: `${item.id}:like`,
        item,
        sentiment: 'like',
        reports: likeReports,
        issueGroup: getIssueGroupForReports('like', likeReports, item),
        reportedAt: getLatestReport(likeReports)?.created_at || item.last_reported_at,
      });
    }

    if (dislikeReports.length > 0) {
      rows.push({
        id: `${item.id}:dislike`,
        item,
        sentiment: 'dislike',
        reports: dislikeReports,
        issueGroup: getIssueGroupForReports('dislike', dislikeReports, item),
        reportedAt: getLatestReport(dislikeReports)?.created_at || item.last_reported_at,
      });
    }

    if (rows.length === 0) {
      rows.push({
        id: `${item.id}:${item.sentiment}`,
        item,
        sentiment: item.sentiment,
        reports: [],
        issueGroup: item.sentiment === 'like' ? 'Tốt' : item.latest_issue_label || 'Cần review',
        reportedAt: item.last_reported_at,
      });
    }

    return rows;
  }).sort((a, b) => String(b.reportedAt || '').localeCompare(String(a.reportedAt || '')));
}

function reportComment(report: AiResponseFeedbackReport, sentiment: AiResponseSentiment) {
  if (report.comment?.trim()) return report.comment;
  return sentiment === 'like' ? 'Học viên đánh giá câu trả lời này hữu ích.' : 'Học viên không nhập mô tả chi tiết.';
}

export const RagAuditTab: React.FC = () => {
  const token = useBoundStore((state) => state.token);
  const [items, setItems] = useState<AiResponseReviewItem[]>([]);
  const [counts, setCounts] = useState<ReviewCounts>(EMPTY_COUNTS);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [reviewNote, setReviewNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadItems = async (preserveSelection = true) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetchAiResponseReviewItems(COURSE_ID, token);
      const nextItems = response.items || [];
      const nextRows = buildReviewRows(nextItems);
      setItems(nextItems);
      setCounts(normalizeCounts(response.counts));

      const nextSelectedRowId =
        preserveSelection && selectedRowId && nextRows.some((row) => row.id === selectedRowId)
          ? selectedRowId
          : nextRows[0]?.id || null;
      setSelectedRowId(nextSelectedRowId);

      const selectedRow = nextRows.find((row) => row.id === nextSelectedRowId);
      setReviewNote(selectedRow?.item.review_note || '');
    } catch (error) {
      console.error('Failed to load AI response review items:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải danh sách mentor review.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadItems(false);
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const reviewRows = useMemo(() => buildReviewRows(items), [items]);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return reviewRows.filter((row) => {
      if (ratingFilter === 'positive' && row.sentiment !== 'like') return false;
      if (ratingFilter === 'negative' && row.sentiment !== 'dislike') return false;
      if (statusFilter !== 'all' && row.item.status !== statusFilter) return false;
      if (!keyword) return true;

      return [row.item.prompt_text, row.item.response_text, row.issueGroup, row.item.latest_issue_label]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(keyword);
    });
  }, [ratingFilter, reviewRows, search, statusFilter]);

  const selectedRow = useMemo(
    () => filteredRows.find((row) => row.id === selectedRowId) || reviewRows.find((row) => row.id === selectedRowId) || null,
    [filteredRows, reviewRows, selectedRowId],
  );

  const flaggedCount = counts.flagged || items.filter((item) => item.status === 'flagged').length;

  const saveReview = async (reviewStatus: AiResponseReviewStatus) => {
    if (!selectedRow) return;
    setIsSaving(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await updateAiResponseReviewItem(
        selectedRow.item.target_id,
        {
          course_id: COURSE_ID,
          review_status: reviewStatus,
          note: reviewNote,
        },
        token,
      );
      setStatusMessage(reviewStatus === 'flagged' ? 'Đã gắn cờ để retrain.' : 'Đã đánh dấu feedback là đã xem.');
      await loadItems();
    } catch (error) {
      console.error('Failed to save AI response review:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Không thể lưu trạng thái review.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="font-be-vietnam-pro">
      <section className="rounded-3xl border-2 border-gray-border bg-white p-5 shadow-sm md:p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Tổng feedback" value={counts.total_feedback} />
          <MetricCard label="Tỷ lệ hài lòng" value={`${counts.like_rate}%`} valueClassName="text-primary-green" />
          <MetricCard label="Cần xử lý" value={counts.pending} valueClassName="text-amber-500" />
          <MetricCard
            label="Đã gắn cờ retrain"
            value={flaggedCount}
            valueClassName="text-rose-500"
            action={<MoreHorizontal className="h-5 w-5 text-stone-400" />}
          />
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_210px_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo nội dung câu hỏi..."
              className="h-12 w-full rounded-2xl border-2 border-gray-border bg-white pl-11 pr-4 text-sm font-bold text-on-background outline-none transition placeholder:text-stone-400 focus:border-primary-green"
            />
          </label>

          <SelectField
            value={ratingFilter}
            onChange={(value) => setRatingFilter(value as RatingFilter)}
            options={[
              ['all', 'Mọi đánh giá'],
              ['positive', 'Tích cực'],
              ['negative', 'Tiêu cực'],
            ]}
          />

          <SelectField
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as StatusFilter)}
            options={[
              ['all', 'Mọi trạng thái'],
              ['pending', 'Mới'],
              ['resolved', 'Đã xem'],
              ['flagged', 'Đã gắn cờ'],
              ['rejected', 'Từ chối'],
            ]}
          />
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border-2 border-gray-border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] table-fixed border-collapse">
              <colgroup>
                <col className="w-14" />
                <col />
                <col className="w-48" />
                <col className="w-40" />
                <col className="w-28" />
              </colgroup>
              <thead className="bg-surface-container-low">
                <tr className="border-b border-gray-border text-left text-xs font-black uppercase tracking-wide text-stone-500">
                  <th className="px-4 py-4" />
                  <th className="px-4 py-4">Câu hỏi</th>
                  <th className="px-4 py-4">Nhóm lỗi</th>
                  <th className="px-4 py-4">Trạng thái</th>
                  <th className="px-4 py-4">Ngày</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="h-72 px-6 text-center text-sm font-bold text-stone-500">
                      <span className="inline-flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-primary-green" />
                        Đang tải feedback...
                      </span>
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="h-72 px-6 text-center text-sm font-bold text-stone-500">
                      Không có feedback phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => {
                    const isActive = row.id === selectedRowId;
                    const isPositive = row.sentiment === 'like';

                    return (
                      <tr
                        key={row.id}
                        onClick={() => {
                          setSelectedRowId(row.id);
                          setReviewNote(row.item.review_note || '');
                          setStatusMessage(null);
                          setErrorMessage(null);
                        }}
                        className={`cursor-pointer border-b border-gray-border transition last:border-b-0 ${
                          isActive ? 'bg-primary-green/5' : 'bg-white hover:bg-stone-50'
                        }`}
                      >
                        <td className="px-4 py-4 align-middle">
                          {isPositive ? (
                            <ThumbsUp className="h-5 w-5 text-primary-green" />
                          ) : (
                            <ThumbsDown className="h-5 w-5 text-rose-500" />
                          )}
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <p className="line-clamp-2 text-sm font-black leading-6 text-on-background">{getQuestionText(row.item)}</p>
                        </td>
                        <td className="px-4 py-4 align-middle text-sm font-black leading-5 text-stone-500">{row.issueGroup}</td>
                        <td className="px-4 py-4 align-middle">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                              STATUS_STYLES[row.item.status] || 'border-stone-200 bg-stone-50 text-stone-500'
                            }`}
                          >
                            {STATUS_LABELS[row.item.status] || row.item.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-middle text-sm font-black text-stone-400">{formatDate(row.reportedAt)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {(errorMessage || statusMessage) && (
          <div
            className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-bold ${
              errorMessage
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-primary-green/20 bg-primary-green/10 text-primary-green-dark'
            }`}
          >
            {errorMessage || statusMessage}
          </div>
        )}

        <div className="mt-6">
          {!selectedRow ? (
            <div className="rounded-3xl border-2 border-dashed border-primary-green/20 bg-surface-container-low p-8 text-center text-sm font-bold text-primary-green-dark">
              Chọn một dòng trong bảng để xem chi tiết response.
            </div>
          ) : (
            <DetailPanel
              row={selectedRow}
              reviewNote={reviewNote}
              isSaving={isSaving}
              onNoteChange={setReviewNote}
              onMarkSeen={() => saveReview('resolved')}
              onFlagRetrain={() => saveReview('flagged')}
            />
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => loadItems()}
            className="inline-flex h-10 items-center gap-2 rounded-2xl border border-gray-border bg-white px-4 text-xs font-black uppercase tracking-wide text-stone-600 transition hover:bg-stone-50 active:translate-y-px"
          >
            <RefreshCcw className="h-4 w-4 text-primary-green" />
            Làm mới dữ liệu
          </button>
        </div>
      </section>
    </div>
  );
};

function MetricCard({
  label,
  value,
  valueClassName = 'text-on-background',
  action,
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border-2 border-gray-border bg-surface-container-low px-5 py-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-stone-500">{label}</p>
        {action}
      </div>
      <p className={`mt-3 font-fraunces text-4xl font-black leading-none ${valueClassName}`}>{value}</p>
    </div>
  );
}

function SelectField({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative block">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full appearance-none rounded-2xl border-2 border-gray-border bg-white px-4 pr-11 text-sm font-black text-on-background outline-none transition focus:border-primary-green"
      >
        {options.map(([optionValue, label]) => (
          <option key={optionValue} value={optionValue}>
            {label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
    </label>
  );
}

function DetailPanel({
  row,
  reviewNote,
  isSaving,
  onNoteChange,
  onMarkSeen,
  onFlagRetrain,
}: {
  row: ReviewRow;
  reviewNote: string;
  isSaving: boolean;
  onNoteChange: (value: string) => void;
  onMarkSeen: () => void;
  onFlagRetrain: () => void;
}) {
  const { item, sentiment, reports } = row;
  const isPositive = sentiment === 'like';

  return (
    <div className="rounded-3xl border-2 border-gray-border bg-surface-container-low p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="line-clamp-2 font-fraunces text-2xl font-black leading-8 text-on-background">
            {getQuestionText(item)}
          </h3>
          <p className="mt-2 text-sm font-black text-stone-500">
            {formatLongDate(row.reportedAt)} · {row.issueGroup}
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-gray-border bg-white">
          {isPositive ? (
            <ThumbsUp className="h-5 w-5 text-primary-green" />
          ) : (
            <ThumbsDown className="h-5 w-5 text-rose-500" />
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_0.72fr]">
        <div>
          <div className="rounded-2xl border border-primary-green/15 bg-white/70 p-4 text-sm font-bold leading-7 text-stone-700">
            <SocraticMarkdown text={getSummaryText(item)} />
          </div>
          <div className="mt-4 space-y-3 rounded-2xl border border-gray-border bg-white p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">
              Feedback học viên ({reports.length})
            </p>
            {reports.length === 0 ? (
              <p className="text-sm font-bold leading-6 text-stone-500">Chưa có chi tiết feedback.</p>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="rounded-2xl border border-gray-border bg-surface-container-low p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                        sentiment === 'like'
                          ? 'border-primary-green/20 bg-primary-green/10 text-primary-green-dark'
                          : 'border-rose-200 bg-rose-50 text-rose-700'
                      }`}
                    >
                      {sentiment === 'like' ? <ThumbsUp className="h-3 w-3" /> : <ThumbsDown className="h-3 w-3" />}
                      {sentiment === 'like' ? 'Tích cực' : 'Tiêu cực'}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wide text-stone-400">
                      {formatLongDate(report.created_at)}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-6 text-stone-600">
                    {reportComment(report, sentiment)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-border bg-white p-4">
          <div className="grid grid-cols-2 gap-3 text-xs font-black">
            <div>
              <p className="text-stone-400">Đánh giá</p>
              <p className={isPositive ? 'mt-1 text-primary-green-dark' : 'mt-1 text-rose-600'}>
                {isPositive ? 'Tích cực' : 'Tiêu cực'}
              </p>
            </div>
            <div>
              <p className="text-stone-400">Trạng thái</p>
              <p className="mt-1 text-on-background">{STATUS_LABELS[item.status] || item.status}</p>
            </div>
            <div>
              <p className="text-stone-400">Số lượt</p>
              <p className="mt-1 text-on-background">{reports.length}</p>
            </div>
            <div>
              <p className="text-stone-400">Người học</p>
              <p className="mt-1 truncate text-on-background">{item.student_name || 'EduGap learner'}</p>
            </div>
          </div>
        </div>
      </div>

      <textarea
        value={reviewNote}
        onChange={(event) => onNoteChange(event.target.value)}
        placeholder="Ghi chú xử lý..."
        className="mt-5 min-h-24 w-full rounded-2xl border-2 border-gray-border bg-white px-4 py-3 text-sm font-bold text-stone-700 outline-none transition placeholder:text-stone-400 focus:border-primary-green"
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={isSaving}
          onClick={onMarkSeen}
          className="inline-flex h-12 items-center gap-2 rounded-2xl border border-primary-green/20 bg-primary-green px-5 text-sm font-black text-white shadow-sm transition hover:brightness-105 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Đánh dấu đã xem
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={onFlagRetrain}
          className="inline-flex h-12 items-center gap-2 rounded-2xl border border-gray-border bg-white px-5 text-sm font-black text-on-background transition hover:bg-stone-50 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Flag className="h-4 w-4 text-primary-green" />
          Gắn cờ để retrain
        </button>
      </div>
    </div>
  );
}
