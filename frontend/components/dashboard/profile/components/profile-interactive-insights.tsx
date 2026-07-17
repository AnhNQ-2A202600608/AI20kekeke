import React, { useMemo } from 'react';
import { Activity, BarChart3, Brain, Target } from 'lucide-react';
import {
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ConceptMastery, DayActivity, Session } from '../utils/profile-utils';

interface ProfileInteractiveInsightsProps {
  concepts: ConceptMastery[];
  heatmapActivities: DayActivity[];
  sessions: Session[];
}

const statusLabel: Record<ConceptMastery['status'], string> = {
  mastered: 'Vững',
  zpd: 'ZPD',
  learning: 'Đang học',
  weak: 'Cần ôn',
  cold_start: 'Mới',
};

const statusColor: Record<ConceptMastery['status'], string> = {
  mastered: '#58cc02',
  zpd: '#1cb0f6',
  learning: '#ffc800',
  weak: '#ff4b4b',
  cold_start: '#a8a29e',
};

const clampPct = (value: number) => Math.max(0, Math.min(100, value));

export function ProfileInteractiveInsights({ concepts, heatmapActivities, sessions }: ProfileInteractiveInsightsProps) {
  const sortedConcepts = useMemo(() => {
    return [...concepts].sort((a, b) => {
      const aGap = Math.abs(a.elo - a.zpdThreshold);
      const bGap = Math.abs(b.elo - b.zpdThreshold);
      return a.status === 'weak' || a.decayRisk ? -1 : b.status === 'weak' || b.decayRisk ? 1 : aGap - bGap;
    });
  }, [concepts]);

  const zpdScatter = useMemo(() => {
    return sortedConcepts.map((concept) => ({
      id: concept.id,
      name: concept.name,
      elo: Math.round(concept.elo),
      mastery: clampPct(concept.bktVal ?? 0),
      zpdGap: Math.round(concept.elo - concept.zpdThreshold),
      status: concept.status,
    }));
  }, [sortedConcepts]);

  const practiceDays = heatmapActivities.filter((day) => day.eloGain > 0).length;
  const quizCount = heatmapActivities.reduce((sum, day) => sum + (day.quizCount || 0), 0);
  const chatCount = heatmapActivities.reduce((sum, day) => sum + (day.chatCount || 0), 0);
  const latestSession = sessions[0];

  return (
    <div className="grid min-h-0 gap-3 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="rounded-2xl border border-gray-border bg-white p-4 text-left">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-kicker-micro font-black uppercase tracking-widest text-primary-green-dark">
              <Target className="h-3.5 w-3.5" />
              ZPD Map
            </p>
            <h3 className="mt-1 font-fraunces text-xl font-black leading-tight text-on-background">
              Elo x BKT Mastery
            </h3>
            <p className="mt-1 max-w-2xl text-caption-tight font-semibold leading-relaxed text-stone-500">
              Mỗi điểm là một concept. Điểm thấp mastery nhưng gần vùng Elo mục tiêu là nơi nên luyện có chủ đích.
            </p>
          </div>
          <div className="rounded-xl border border-primary-green/20 bg-primary-green/10 px-3 py-2 text-right">
            <p className="font-mono text-lg font-black text-primary-green-dark">{practiceDays}/30</p>
            <p className="text-badge-micro font-black uppercase text-stone-500">ngày hoạt động</p>
          </div>
        </div>

        <div className="h-[270px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 12, right: 18, bottom: 10, left: -12 }}>
              <CartesianGrid stroke="#ede9dd" strokeDasharray="3 3" />
              <XAxis
                dataKey="elo"
                domain={[800, 1300]}
                name="Elo"
                tick={{ fontSize: 11, fill: '#78716c', fontWeight: 700 }}
                type="number"
              />
              <YAxis
                dataKey="mastery"
                domain={[0, 100]}
                name="Mastery"
                tick={{ fontSize: 11, fill: '#78716c', fontWeight: 700 }}
                type="number"
              />
              <ReferenceLine y={85} stroke="#58cc02" strokeDasharray="5 5" label={{ value: 'Mastery', position: 'insideTopRight', fill: '#46a302', fontSize: 11 }} />
              <ReferenceLine y={50} stroke="#ffb020" strokeDasharray="4 4" />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload as (typeof zpdScatter)[number];
                  return (
                    <div className="rounded-xl border border-gray-border bg-white p-3 text-xs shadow-sm">
                      <p className="font-black text-on-background">{data.name}</p>
                      <p className="mt-1 font-semibold text-stone-500">Elo {data.elo} · Mastery {data.mastery}%</p>
                      <p className="font-semibold text-stone-500">ZPD gap {data.zpdGap > 0 ? '+' : ''}{data.zpdGap}</p>
                    </div>
                  );
                }}
              />
              <Scatter data={zpdScatter}>
                {zpdScatter.map((entry) => (
                  <Cell key={entry.id} fill={statusColor[entry.status]} stroke="#fff" strokeWidth={2} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </section>

      <aside className="grid gap-3">
        <section className="rounded-2xl border border-gray-border bg-white p-4 text-left">
          <p className="flex items-center gap-1.5 text-kicker-micro font-black uppercase tracking-widest text-primary-green-dark">
            <Activity className="h-3.5 w-3.5" />
            Tín hiệu gần đây
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-primary-green/15 bg-primary-green/5 p-3">
              <p className="font-mono text-xl font-black text-on-background">{quizCount}</p>
              <p className="text-badge-micro font-black uppercase text-stone-500">bài luyện</p>
            </div>
            <div className="rounded-xl border border-primary-blue/15 bg-primary-blue-light/70 p-3">
              <p className="font-mono text-xl font-black text-on-background">{chatCount}</p>
              <p className="text-badge-micro font-black uppercase text-stone-500">phiên chat</p>
            </div>
          </div>
          <p className="mt-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-caption-tight font-bold leading-relaxed text-stone-600">
            {latestSession
              ? `Gần nhất: ${latestSession.conceptName} (${latestSession.eloDelta > 0 ? '+' : ''}${latestSession.eloDelta} Elo).`
              : 'Chưa có phiên học gần đây.'}
          </p>
        </section>

        <section className="rounded-2xl border border-gray-border bg-white p-4 text-left">
          <p className="flex items-center gap-1.5 text-kicker-micro font-black uppercase tracking-widest text-primary-green-dark">
            <Brain className="h-3.5 w-3.5" />
            Legend
          </p>
          <div className="mt-3 grid gap-2 text-caption-tight font-bold text-stone-600">
            {(['weak', 'zpd', 'learning', 'mastered'] as const).map((status) => (
              <div key={status} className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 px-3 py-2">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusColor[status] }} />
                  {statusLabel[status]}
                </span>
              </div>
            ))}
          </div>
        </section>
      </aside>

      <section className="rounded-2xl border border-gray-border bg-white p-4 text-left xl:col-span-2">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-kicker-micro font-black uppercase tracking-widest text-primary-green-dark">
              <BarChart3 className="h-3.5 w-3.5" />
              Mastery by skill
            </p>
            <h3 className="mt-1 font-fraunces text-xl font-black leading-tight text-on-background">
              Độ thành thạo từng concept
            </h3>
          </div>
          <span className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-1 text-caption-tight font-black text-stone-500">
            Marker xanh: ZPD target
          </span>
        </div>

        <div className="space-y-3">
          {sortedConcepts.map((concept) => {
            const masteryPct = clampPct(concept.bktVal ?? 0);
            const eloPct = clampPct(((concept.elo - 800) / 500) * 100);
            const zpdPct = clampPct(((concept.zpdThreshold - 800) / 500) * 100);

            return (
              <div key={concept.id} className="grid gap-2 rounded-xl border border-stone-200 bg-stone-50/40 p-3 md:grid-cols-[13rem_minmax(0,1fr)_5rem] md:items-center">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-on-background" title={concept.name}>{concept.name}</p>
                  <p className="text-badge-micro font-bold uppercase text-stone-400">{statusLabel[concept.status]} · BKT {masteryPct}%</p>
                </div>
                <div className="relative h-5 rounded-full border border-stone-200 bg-white">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ width: `${eloPct}%`, backgroundColor: statusColor[concept.status] }}
                  />
                  <div
                    className="absolute -top-1 h-7 w-0.5 rounded-full bg-primary-green-dark"
                    style={{ left: `${zpdPct}%` }}
                    title={`ZPD target ${concept.zpdThreshold}`}
                  />
                </div>
                <p className="font-mono text-sm font-black text-stone-700 md:text-right">{Math.round(concept.elo)} Elo</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
