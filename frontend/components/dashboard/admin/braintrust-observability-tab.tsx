'use client';

import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Cpu,
  Database,
  DollarSign,
  ExternalLink,
  Gauge,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useBoundStore } from '@/hooks/useBoundStore';
import type { BraintrustAgentMetric, BraintrustScoreMetric, BraintrustTraceIssue } from './braintrust-observability-types';
import { useBraintrustSummary } from './use-braintrust-summary';

const formatPercent = (value: number) => `${Math.round(value * 1000) / 10}%`;
const formatMs = (value: number) => `${Math.round(value).toLocaleString('vi-VN')} ms`;
const formatShortMs = (value: number) => (value >= 1000 ? `${(value / 1000).toFixed(1)}s` : `${Math.round(value)} ms`);
const formatNumber = (value: number) => value.toLocaleString('vi-VN');

const formatDate = (value?: string | null) => {
  if (!value) return 'Chưa có';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const getLatencyStatus = (ms: number) => {
  if (ms < 4000) return { color: 'text-green-600 bg-green-50 border-green-200', text: 'Nhanh', dot: 'bg-green-500' };
  if (ms <= 8000) return { color: 'text-amber-600 bg-amber-50 border-amber-200', text: 'Theo dõi', dot: 'bg-amber-500' };
  return { color: 'text-red-600 bg-red-50 border-red-200', text: 'Chậm', dot: 'bg-red-500' };
};

const getPipelineTone = (ms: number, warningMs: number, dangerMs: number) => {
  if (ms >= dangerMs) {
    return {
      badge: 'bg-red-50 border-red-200 text-red-600',
      border: 'border-red-200',
      icon: 'bg-red-50 text-red-600',
      text: 'Nghẽn',
    };
  }
  if (ms >= warningMs) {
    return {
      badge: 'bg-amber-50 border-amber-200 text-amber-600',
      border: 'border-amber-200',
      icon: 'bg-amber-50 text-amber-600',
      text: 'Theo dõi',
    };
  }
  return {
    badge: 'bg-green-50 border-green-200 text-green-600',
    border: 'border-primary-green/25',
    icon: 'bg-primary-green/10 text-primary-green-dark',
    text: 'Ổn',
  };
};

function StatusPill({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-black ${tone}`}>
      {children}
    </span>
  );
}

function StatTile({
  label,
  value,
  helper,
  icon: Icon,
  statusColor,
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ComponentType<{ className?: string }>;
  statusColor?: 'green' | 'yellow' | 'red' | null;
}) {
  return (
    <div className="rounded-2xl border-2 border-gray-border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 font-mono">{label}</p>
        <Icon className="h-4 w-4 text-primary-green-dark" />
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <p className="text-2xl font-black text-on-background font-fraunces">{value}</p>
        {statusColor ? (
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              statusColor === 'green' ? 'bg-green-500' : statusColor === 'yellow' ? 'bg-amber-500' : 'bg-red-500'
            }`}
            aria-hidden="true"
          />
        ) : null}
      </div>
      <p className="mt-1 text-[11px] font-semibold leading-relaxed text-stone-500">{helper}</p>
    </div>
  );
}

function SignalCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = 'default',
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'default' | 'good' | 'warn' | 'bad';
}) {
  const toneClass = {
    default: 'border-gray-border bg-white text-primary-green-dark',
    good: 'border-primary-green/25 bg-primary-green/5 text-primary-green-dark',
    warn: 'border-amber-200 bg-amber-50 text-amber-600',
    bad: 'border-error-red/25 bg-red-50 text-error-red-dark',
  }[tone];

  return (
    <div className={`rounded-2xl border-2 p-4 shadow-sm ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 font-mono">{label}</p>
        <Icon className="h-4 w-4 shrink-0" />
      </div>
      <p className="mt-3 text-2xl font-black text-on-background font-fraunces">{value}</p>
      <p className="mt-1 text-[11px] font-semibold leading-relaxed text-stone-500">{helper}</p>
    </div>
  );
}

function TraceList({ rows }: { rows: BraintrustTraceIssue[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-surface-container-low p-4 text-xs font-semibold text-stone-500">
        Không có trace phù hợp trong cửa sổ dữ liệu hiện tại.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-xs">
        <thead className="text-[10px] uppercase tracking-widest text-stone-400 font-mono">
          <tr className="border-b border-stone-200">
            <th className="py-2 pr-3">Thời điểm</th>
            <th className="py-2 pr-3">Root span</th>
            <th className="py-2 pr-3">Span</th>
            <th className="py-2 pr-3">Lý do</th>
            <th className="py-2 pr-3 text-right">Link</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {rows.map((row) => (
            <tr key={`${row.root_span_id}-${row.span}-${row.reason}`}>
              <td className="py-3 pr-3 font-semibold text-stone-600">{formatDate(row.created)}</td>
              <td className="py-3 pr-3 font-mono text-[11px] text-stone-500">{row.root_span_id.slice(0, 18)}</td>
              <td className="py-3 pr-3 font-bold text-on-background">{row.span}</td>
              <td className="py-3 pr-3 font-semibold text-stone-600">{row.reason}</td>
              <td className="py-3 pr-3 text-right">
                {row.detail_link ? (
                  <a
                    href={row.detail_link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-xl border border-primary-green/30 bg-primary-green/10 px-2.5 py-1 font-black text-primary-green-dark"
                  >
                    Mở
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <span className="font-semibold text-stone-400">N/A</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TraceTable({ title, rows }: { title: string; rows: BraintrustTraceIssue[] }) {
  return (
    <section className="rounded-3xl border-2 border-gray-border bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-black text-on-background font-fraunces">{title}</h3>
      </div>
      <TraceList rows={rows} />
    </section>
  );
}

function ScoreTable({ rows }: { rows: BraintrustScoreMetric[] }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-xs">
        <thead className="text-[10px] uppercase tracking-widest text-stone-400 font-mono">
          <tr className="border-b border-stone-200">
            <th className="py-2 pr-3">Score</th>
            <th className="py-2 pr-3">Count</th>
            <th className="py-2 pr-3">Average</th>
            <th className="py-2 pr-3">Min</th>
            <th className="py-2 pr-3">Max</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {rows.map((row) => (
            <tr key={row.name}>
              <td className="py-3 pr-3 font-bold text-on-background">{row.name}</td>
              <td className="py-3 pr-3 font-semibold text-stone-600">{formatNumber(row.count)}</td>
              <td className="py-3 pr-3 font-semibold text-stone-600">{formatPercent(row.average)}</td>
              <td className="py-3 pr-3 font-semibold text-stone-600">{formatPercent(row.minimum)}</td>
              <td className="py-3 pr-3 font-semibold text-stone-600">{formatPercent(row.maximum)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CompactAgentList({ rows }: { rows: BraintrustAgentMetric[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-surface-container-low p-4 text-xs font-semibold text-stone-500">
        Chưa có dữ liệu agent/tool trong cửa sổ hiện tại.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {rows.map((row) => {
        const status = getLatencyStatus(row.p95_ms);
        return (
          <div key={row.name} className="rounded-2xl border border-stone-150 bg-stone-50/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs font-black text-on-background">{row.name}</p>
                <p className="mt-1 text-[11px] font-semibold text-stone-500">
                  {formatNumber(row.events)} events, {formatNumber(row.traces)} traces
                </p>
              </div>
              <StatusPill tone={status.color}>{formatShortMs(row.p95_ms)}</StatusPill>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] font-semibold text-stone-500">
              <span>
                Errors <b className="text-on-background">{formatNumber(row.errors)}</b>
              </span>
              <span>
                Tools <b className="text-on-background">{formatNumber(row.tool_calls)}</b>
              </span>
              <span>
                Models <b className="text-on-background">{formatNumber(row.model_calls)}</b>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function BraintrustObservabilityTab() {
  const token = useBoundStore((state) => state.token);
  const role = useBoundStore((state) => state.role);
  const selectedPersona = useBoundStore((state) => state.selectedPersona);
  const { summary, isLoading, isRefreshing, error, refreshSummary } = useBraintrustSummary(token);
  const [isSimpleView, setIsSimpleView] = useState(true);
  const [activeActivityTab, setActiveActivityTab] = useState<'workflows' | 'tools'>('workflows');
  const [activeTraceTab, setActiveTraceTab] = useState<'errors' | 'slow' | 'review'>('errors');

  const { ragSpeedMs, llmSpeedMs, totalSpeedMs } = useMemo(() => {
    if (!summary) return { ragSpeedMs: 450, llmSpeedMs: 2200, totalSpeedMs: 3100 };

    const ragRetrieveSpan = summary.latency_by_span.find((span) => span.name === 'rag.retrieve' || span.name.includes('retrieve'));
    const llmSpan = summary.latency_by_span.find(
      (span) => span.name === 'ChatOpenAI' || span.name.toLowerCase().includes('openai') || span.name.toLowerCase().includes('llm')
    );
    const totalSpan = summary.latency_by_span.find((span) => span.name === 'chat.stream' || span.name === 'LangGraph');

    return {
      ragSpeedMs: ragRetrieveSpan?.p50_ms ?? 450,
      llmSpeedMs: llmSpan?.p50_ms ?? 2200,
      totalSpeedMs: totalSpan?.p50_ms ?? 3100,
    };
  }, [summary]);

  const healthScore = useMemo(() => {
    if (!summary) return 100;
    return Math.max(10, Math.round(100 - summary.overview.error_rate * 100 - summary.overview.errors * 0.5));
  }, [summary]);

  const health = useMemo(() => {
    if (healthScore >= 95) {
      return {
        color: 'text-green-600 bg-green-50 border-green-200',
        text: 'Hoạt động tốt',
        bgCircle: '#22c55e',
        desc: 'AI đang phản hồi ổn định, không có tín hiệu lỗi đáng chú ý trong cửa sổ hiện tại.',
      };
    }
    if (healthScore >= 85) {
      return {
        color: 'text-amber-600 bg-amber-50 border-amber-200',
        text: 'Cần theo dõi',
        bgCircle: '#f59e0b',
        desc: 'AI vẫn hoạt động, nhưng có độ trễ hoặc lỗi nhỏ cần xem lại.',
      };
    }
    return {
      color: 'text-red-600 bg-red-50 border-red-200',
      text: 'Cần kiểm tra',
      bgCircle: '#ef4444',
      desc: 'AI có dấu hiệu gián đoạn hoặc tốc độ xử lý giảm rõ rệt.',
    };
  }, [healthScore]);

  const slowestRows = useMemo(
    () => [...(summary?.latency_by_span || [])].sort((a, b) => b.p95_ms - a.p95_ms).slice(0, 5),
    [summary]
  );
  const maxP95Ms = slowestRows[0]?.p95_ms ?? 0;

  const topAgents = useMemo(
    () => [...(summary?.agents.agents || [])].sort((a, b) => b.events - a.events).slice(0, 4),
    [summary]
  );

  const topTools = useMemo(
    () => [...(summary?.agents.top_tools || [])].sort((a, b) => b.events - a.events).slice(0, 4),
    [summary]
  );

  const attentionTotal = summary ? summary.errors.length + summary.problem_traces.length + summary.review_queue.items.length : 0;
  const inputTokenShare = summary?.usage.total_tokens ? Math.round((summary.usage.input_tokens / summary.usage.total_tokens) * 100) : 0;
  const outputTokenShare = summary?.usage.total_tokens ? Math.max(0, 100 - inputTokenShare) : 0;

  const pipelineStages = useMemo(
    () => [
      {
        name: 'Học viên đặt câu hỏi',
        helper: 'Học viên gửi câu hỏi',
        value: 'Tức thì',
        Icon: MessageSquare,
        tone: getPipelineTone(0, 1, 1),
      },
      {
        name: 'Tìm kiếm RAG',
        helper: 'Tìm kiếm tài liệu học',
        value: formatShortMs(ragSpeedMs),
        Icon: Database,
        tone: getPipelineTone(ragSpeedMs, 1500, 3000),
      },
      {
        name: 'Trí tuệ AI (LLM)',
        helper: 'Sinh nội dung giải thích',
        value: formatShortMs(llmSpeedMs),
        Icon: Cpu,
        tone: getPipelineTone(llmSpeedMs, 3500, 7000),
      },
      {
        name: 'Trả lời xong',
        helper: 'Phản hồi đến học viên',
        value: formatShortMs(totalSpeedMs),
        Icon: CheckCircle2,
        tone: getPipelineTone(totalSpeedMs, 5000, 9000),
      },
    ],
    [llmSpeedMs, ragSpeedMs, totalSpeedMs]
  );

  const normalizedRole = role.trim().toLowerCase();
  const canViewBraintrust = ['admin', 'btc'].includes(normalizedRole) || selectedPersona === 'btc';

  if (role && !canViewBraintrust) {
    return (
      <div className="w-full max-w-6xl mx-auto pb-24 md:py-6 px-4 font-be-vietnam-pro">
        <section className="rounded-3xl border-2 border-error-red/20 bg-red-50 p-6">
          <h2 className="text-lg font-black text-error-red-dark font-fraunces">Không có quyền truy cập</h2>
          <p className="mt-2 text-sm font-semibold text-stone-600">
            Panel Braintrust chỉ mở cho tài khoản admin hoặc BTC.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto pb-24 md:py-6 px-4 font-be-vietnam-pro space-y-6">
      <div className="flex flex-col gap-3 border-b border-gray-border pb-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-green">
            <Gauge className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 font-mono">
              Ban tổ chức • Braintrust
            </p>
            <h2 className="text-lg font-black text-on-background font-fraunces">AI Observability</h2>
            {summary ? (
              <p className="mt-1 text-[11px] font-semibold text-stone-500">
                {summary.meta.data_source === 'braintrust' ? 'Braintrust live' : 'Backend cache'} • cache{' '}
                {Math.round(summary.meta.cache_age_seconds)}s • next {formatDate(summary.meta.next_refresh_at)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl bg-stone-100 p-1">
            <button
              type="button"
              onClick={() => setIsSimpleView(true)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                isSimpleView ? 'bg-white text-primary-green-dark shadow-sm' : 'text-stone-500 hover:text-stone-850'
              }`}
            >
              Đơn giản
            </button>
            <button
              type="button"
              onClick={() => setIsSimpleView(false)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                !isSimpleView ? 'bg-white text-primary-green-dark shadow-sm' : 'text-stone-500 hover:text-stone-850'
              }`}
            >
              Kỹ thuật
            </button>
          </div>

          <button
            type="button"
            onClick={refreshSummary}
            disabled={isLoading || isRefreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-primary-green bg-primary-green/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-primary-green-dark disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading || isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <section className="rounded-3xl border-2 border-error-red/20 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-error-red-dark" />
            <div>
              <h3 className="font-black text-error-red-dark">Không tải được Braintrust summary</h3>
              <p className="mt-1 text-xs font-semibold text-stone-600">{error}</p>
            </div>
          </div>
        </section>
      ) : null}

      {isLoading && !summary ? (
        <section className="rounded-3xl border-2 border-gray-border bg-white p-6 text-sm font-bold text-stone-500">
          Đang tải aggregate từ Braintrust...
        </section>
      ) : null}

      {summary ? (
        isSimpleView ? (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <section className="md:col-span-3 rounded-3xl border-2 border-primary-green/20 bg-gradient-to-br from-white to-primary-green/5 p-6 shadow-sm">
                <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
                  <div className="flex flex-col items-center gap-6 md:flex-row">
                    <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
                      <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                        <circle cx="50" cy="50" r="40" stroke="#f1f1f0" strokeWidth="8" fill="transparent" />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke={health.bgCircle}
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray="251.2"
                          strokeDashoffset={251.2 - (251.2 * healthScore) / 100}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="text-3xl font-black text-neutral-800 font-fraunces">{healthScore}%</span>
                    </div>
                    <div className="space-y-2 text-center md:text-left">
                      <div className="flex justify-center md:justify-start">
                        <StatusPill tone={health.color}>{health.text}</StatusPill>
                      </div>
                      <h3 className="text-lg font-black text-neutral-800 font-fraunces">Đánh giá sức khỏe AI</h3>
                      <p className="max-w-md text-xs font-semibold leading-relaxed text-stone-500">{health.desc}</p>
                    </div>
                  </div>

                  <div className="flex w-full flex-col justify-center gap-2 border-t border-stone-200 pt-4 md:w-auto md:border-l md:border-t-0 md:pl-8 md:pt-0">
                    <div className="flex items-center gap-2 text-xs font-bold text-stone-600">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Tốc độ RAG và LLM đang được theo dõi
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-stone-600">
                      {summary.overview.errors === 0 ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                      {summary.overview.errors === 0 ? 'Không có lỗi nghiêm trọng' : `${summary.overview.errors} sự cố được ghi nhận`}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-stone-600">
                      <ShieldCheck className="h-4 w-4 text-primary-green-dark" />
                      Đang nhận giám sát tự động từ Braintrust
                    </div>
                  </div>
                </div>
              </section>

              <div className="md:col-span-3 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatTile
                  label="Lượt tương tác"
                  value={formatNumber(summary.overview.events)}
                  helper={`${formatNumber(summary.overview.traces)} luồng xử lý`}
                  icon={Activity}
                />
                <StatTile
                  label="Lỗi phát sinh"
                  value={formatNumber(summary.overview.errors)}
                  helper={`${formatPercent(summary.overview.error_rate)} tỷ lệ lỗi`}
                  icon={AlertTriangle}
                  statusColor={summary.overview.error_rate === 0 ? 'green' : summary.overview.error_rate <= 0.05 ? 'yellow' : 'red'}
                />
                <StatTile
                  label="Điểm chất lượng"
                  value={formatNumber(summary.overview.score_events)}
                  helper={summary.score_status.configured ? 'Có điểm đánh giá' : 'Chưa thiết lập đánh giá'}
                  icon={ShieldCheck}
                />
                <StatTile
                  label="Hoạt động cuối"
                  value={formatDate(summary.overview.latest_event_at)}
                  helper={`Range ${summary.window.range}, limit ${summary.window.limit}`}
                  icon={Clock3}
                />
              </div>

              <section className="md:col-span-3 rounded-3xl border-2 border-gray-border bg-white p-5 shadow-sm">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 font-mono">
                    AI Pipeline Flow
                  </p>
                  <h3 className="text-base font-black text-on-background font-fraunces">Sơ đồ hoạt động và điểm nghẽn hệ thống</h3>
                </div>

                <div className="mt-6 flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center md:gap-2">
                  {pipelineStages.map(({ name, helper, value, Icon, tone }, index) => (
                    <React.Fragment key={name}>
                      <div className="flex w-full flex-col items-center rounded-2xl border border-stone-100 bg-stone-50/60 p-4 text-center md:w-44">
                        <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${tone.icon}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <h4 className="text-xs font-bold text-neutral-800">
                          {index + 1}. {name}
                        </h4>
                        <p className="mt-1 text-[11px] font-semibold text-stone-500">{helper}</p>
                        <StatusPill tone={tone.badge}>{value}</StatusPill>
                      </div>

                      {index < pipelineStages.length - 1 ? (
                        <svg
                          className="hidden h-8 min-w-10 flex-1 text-stone-250 md:block"
                          viewBox="0 0 64 32"
                          aria-hidden="true"
                        >
                          <path
                            d="M 2 16 L 62 16"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeDasharray="4 5"
                            strokeLinecap="round"
                            fill="none"
                          />
                          <circle r="3.5" fill="#22c55e" className="motion-reduce:hidden">
                            <animateMotion dur="2.4s" repeatCount="indefinite" path="M 2 16 L 62 16" />
                          </circle>
                        </svg>
                      ) : null}
                    </React.Fragment>
                  ))}
                </div>
              </section>
            </div>
          </>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-3xl border-2 border-primary-green/20 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
                      <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                        <circle cx="50" cy="50" r="40" stroke="#f1f1f0" strokeWidth="8" fill="transparent" />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke={health.bgCircle}
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray="251.2"
                          strokeDashoffset={251.2 - (251.2 * healthScore) / 100}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="text-2xl font-black text-on-background font-fraunces">{healthScore}%</span>
                    </div>
                    <div className="space-y-2">
                      <StatusPill tone={health.color}>{health.text}</StatusPill>
                      <h3 className="text-lg font-black text-on-background font-fraunces">Tình trạng AI hiện tại</h3>
                      <p className="max-w-xl text-xs font-semibold leading-relaxed text-stone-500">{health.desc}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-stone-150 bg-stone-50/70 p-3 text-[11px] font-semibold leading-relaxed text-stone-500">
                    <span className="font-black text-stone-700">Nguồn dữ liệu:</span>{' '}
                    {summary.meta.data_source === 'braintrust' ? 'Braintrust live' : 'Backend cache'}
                    <br />
                    Cache {Math.round(summary.meta.cache_age_seconds)}s, tự làm mới lúc {formatDate(summary.meta.next_refresh_at)}.
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <SignalCard
                  label="Tương tác"
                  value={formatNumber(summary.overview.events)}
                  helper={`${formatNumber(summary.overview.traces)} traces trong ${summary.window.range}`}
                  icon={Activity}
                />
                <SignalCard
                  label="Lỗi"
                  value={formatNumber(summary.overview.errors)}
                  helper={`${formatPercent(summary.overview.error_rate)} error rate`}
                  icon={AlertTriangle}
                  tone={summary.overview.error_rate > 0.05 ? 'bad' : summary.overview.error_rate > 0 ? 'warn' : 'good'}
                />
                <SignalCard
                  label="Chậm nhất"
                  value={slowestRows.length ? formatShortMs(slowestRows[0].p95_ms) : 'N/A'}
                  helper={slowestRows[0]?.name ?? 'Chưa có span latency'}
                  icon={Clock3}
                  tone={slowestRows[0]?.p95_ms > 8000 ? 'bad' : slowestRows[0]?.p95_ms > 4000 ? 'warn' : 'default'}
                />
                <SignalCard
                  label="Cần xem"
                  value={formatNumber(attentionTotal)}
                  helper="Lỗi, trace chậm, phản hồi chờ duyệt"
                  icon={Gauge}
                  tone={attentionTotal > 0 ? 'warn' : 'good'}
                />
              </div>
            </section>

            <section className="rounded-3xl border-2 border-gray-border bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-base font-black text-on-background font-fraunces">Đường đi của một phản hồi AI</h3>
                  <p className="mt-1 text-xs font-semibold text-stone-500">
                    Nhìn nhanh nơi hệ thống đang mất thời gian trong luồng chat/RAG.
                  </p>
                </div>
                <StatusPill tone={getPipelineTone(totalSpeedMs, 5000, 9000).badge}>
                  Tổng {formatShortMs(totalSpeedMs)}
                </StatusPill>
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
                {pipelineStages.map(({ name, helper, value, Icon, tone }) => (
                  <div key={name} className={`rounded-2xl border-2 bg-stone-50/60 p-4 ${tone.border}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone.icon}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <StatusPill tone={tone.badge}>{tone.text}</StatusPill>
                    </div>
                    <h4 className="mt-4 text-sm font-black text-on-background">{name}</h4>
                    <p className="mt-1 text-[11px] font-semibold text-stone-500">{helper}</p>
                    <p className="mt-3 font-mono text-lg font-black text-on-background">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <section className="lg:col-span-2 rounded-3xl border-2 border-gray-border bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-on-background font-fraunces">Bottleneck latency</h3>
                    <p className="mt-1 text-xs font-semibold text-stone-500">Top span theo P95, ưu tiên điều tra từ trên xuống.</p>
                  </div>
                  <BarChart3 className="h-5 w-5 text-primary-green-dark" />
                </div>

                {slowestRows.length ? (
                  <div className="space-y-3">
                    {slowestRows.map((row) => {
                      const status = getLatencyStatus(row.p95_ms);
                      const width = maxP95Ms ? Math.max(8, Math.round((row.p95_ms / maxP95Ms) * 100)) : 0;
                      return (
                        <div key={row.name} className="rounded-2xl border border-stone-150 bg-stone-50/60 p-3">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-mono text-xs font-black text-on-background">{row.name}</p>
                              <p className="mt-1 text-[11px] font-semibold text-stone-500">
                                {formatNumber(row.count)} samples, P50 {formatShortMs(row.p50_ms)}
                              </p>
                            </div>
                            <StatusPill tone={status.color}>P95 {formatShortMs(row.p95_ms)}</StatusPill>
                          </div>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200">
                            <div className="h-full rounded-full bg-primary-green" style={{ width: `${width}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-stone-200 bg-surface-container-low p-4 text-xs font-semibold text-stone-500">
                    Chưa có latency metric trong cửa sổ dữ liệu hiện tại.
                  </div>
                )}
              </section>

              <section className="rounded-3xl border-2 border-gray-border bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-on-background font-fraunces">Chi phí và token</h3>
                    <p className="mt-1 text-xs font-semibold text-stone-500">Theo dõi áp lực prompt và output.</p>
                  </div>
                  <DollarSign className="h-5 w-5 text-primary-green-dark" />
                </div>
                <div className="rounded-2xl border border-primary-green/20 bg-primary-green/5 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 font-mono">Ước tính</p>
                  <p className="mt-2 text-3xl font-black text-primary-green-dark font-fraunces">
                    ${summary.usage.estimated_cost.toFixed(4)}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-stone-500">
                    {summary.usage.available ? 'Có dữ liệu usage từ traces' : 'Chưa có usage đầy đủ'}
                  </p>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-600">
                    <span>Total tokens</span>
                    <span>{formatNumber(summary.usage.total_tokens)}</span>
                  </div>
                  <div className="flex h-2 overflow-hidden rounded-full bg-stone-200">
                    <div className="bg-primary-green" style={{ width: `${inputTokenShare}%` }} />
                    <div className="bg-stone-400" style={{ width: `${outputTokenShare}%` }} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-stone-500">
                    <div className="rounded-xl bg-stone-50 p-3">
                      <span className="block text-stone-400">Input</span>
                      <span className="font-mono font-black text-on-background">{formatNumber(summary.usage.input_tokens)}</span>
                    </div>
                    <div className="rounded-xl bg-stone-50 p-3">
                      <span className="block text-stone-400">Output</span>
                      <span className="font-mono font-black text-on-background">{formatNumber(summary.usage.output_tokens)}</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <section className="rounded-3xl border-2 border-gray-border bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-on-background font-fraunces">Quality coverage</h3>
                    <p className="mt-1 text-xs font-semibold text-stone-500">{summary.score_status.message}</p>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-primary-green-dark" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <SignalCard
                    label="Coverage"
                    value={formatPercent(summary.scores.score_coverage)}
                    helper={`${formatNumber(summary.scores.missing_score_traces)} traces thiếu score`}
                    icon={ShieldCheck}
                    tone={summary.scores.score_coverage < 0.5 ? 'warn' : 'good'}
                  />
                  <SignalCard
                    label="Evaluators"
                    value={formatNumber(summary.scores.metrics.length)}
                    helper={summary.score_status.configured ? 'Đang ghi nhận score' : 'Chưa cấu hình'}
                    icon={Gauge}
                    tone={summary.score_status.configured ? 'good' : 'warn'}
                  />
                </div>
                {summary.score_status.score_names.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {summary.score_status.score_names.map((name) => (
                      <span key={name} className="rounded-xl border border-primary-green/30 bg-primary-green/10 px-2.5 py-1 text-[10px] font-bold text-primary-green-dark">
                        {name}
                      </span>
                    ))}
                  </div>
                ) : null}
                {summary.scores.metrics.length ? <ScoreTable rows={summary.scores.metrics} /> : null}
              </section>

              <section className="lg:col-span-2 rounded-3xl border-2 border-gray-border bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-black text-on-background font-fraunces">Agents và tools</h3>
                    <p className="mt-1 text-xs font-semibold text-stone-500">Xem nơi traffic AI đang tập trung.</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-xl bg-stone-100 p-1 self-start">
                    <button
                      type="button"
                      onClick={() => setActiveActivityTab('workflows')}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                        activeActivityTab === 'workflows' ? 'bg-white text-primary-green-dark shadow-sm' : 'text-stone-500 hover:text-stone-850'
                      }`}
                    >
                      Workflows
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveActivityTab('tools')}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                        activeActivityTab === 'tools' ? 'bg-white text-primary-green-dark shadow-sm' : 'text-stone-500 hover:text-stone-850'
                      }`}
                    >
                      Tools
                    </button>
                  </div>
                </div>

                <CompactAgentList rows={activeActivityTab === 'workflows' ? topAgents : topTools} />
              </section>
            </div>

            <section className="rounded-3xl border-2 border-gray-border bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-black text-on-background font-fraunces">Hàng chờ cần xử lý</h3>
                  <p className="mt-1 text-xs font-semibold text-stone-500">Ưu tiên lỗi, sau đó đến trace chậm và phản hồi cần review.</p>
                </div>
                <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-stone-100 p-1 self-start">
                  {[
                    { id: 'errors' as const, label: 'Lỗi', count: summary.errors.length, tone: 'text-error-red-dark' },
                    { id: 'slow' as const, label: 'Chậm', count: summary.problem_traces.length, tone: 'text-amber-600' },
                    { id: 'review' as const, label: 'Review', count: summary.review_queue.items.length, tone: 'text-primary-green-dark' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTraceTab(tab.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                        activeTraceTab === tab.id ? `bg-white ${tab.tone} shadow-sm` : 'text-stone-500 hover:text-stone-850'
                      }`}
                    >
                      {tab.label} {tab.count}
                    </button>
                  ))}
                </div>
              </div>

              {activeTraceTab === 'errors' && <TraceList rows={summary.errors} />}
              {activeTraceTab === 'slow' && <TraceList rows={summary.problem_traces} />}
              {activeTraceTab === 'review' && <TraceList rows={summary.review_queue.items} />}
            </section>
          </>
        )
      ) : null}
    </div>
  );
}
