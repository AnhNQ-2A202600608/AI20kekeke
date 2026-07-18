'use client';

import React, { type ReactNode, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  Activity,
  ArrowRight,
  Award,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  GitBranch,
  Lock,
  Sparkles,
  Target,
  UserRoundCheck,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import dayjs from 'dayjs';
import { useBoundStore } from '@/hooks/useBoundStore';
import { FireSvg, EmptyFireSvg } from './Svgs';

import ZpdWidget from './dashboard/ZpdWidget';
import type { TabType } from '@/lib/dashboard-tabs';

interface RightBarProps {
  xp: number;
  streak: number;
  completedSetsCount: number;
  totalSetsCount: number;
  activeDays?: string[];
  activeTab?: TabType;
  loggedIn: boolean;
  variant?: 'default' | 'learning';
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onViewLearningPath?: () => void;
  onViewGraph?: () => void;
  onViewProfile?: () => void;
  onViewClassInsights?: () => void;
  onViewRagAudit?: () => void;
  onViewBtcOps?: () => void;
  skillMapPanel?: ReactNode;
}

type ConceptMasteryPreview = {
  bkt?: number;
  elo?: number;
  weaknessFlag?: boolean;
  masteryState?: string;
};

const formatConceptLabel = (setId: string) => {
  const readable = setId
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
  return readable.length > 30 ? `${readable.slice(0, 27)}...` : readable;
};

export const RightBar: React.FC<RightBarProps> = ({
  xp,
  streak,
  completedSetsCount,
  totalSetsCount,
  activeDays = [],
  activeTab,
  loggedIn,
  variant = 'default',
  onOpenAuth,
  onViewLearningPath,
  onViewGraph,
  onViewProfile,
  onViewClassInsights,
  onViewRagAudit,
  onViewBtcOps,
  skillMapPanel,
}) => {
  const { conceptMasteries, name, selectedPersona } = useBoundStore();
  const [streakShown, setStreakShown] = useState(false);
  const progressPercent = totalSetsCount > 0 ? Math.round((completedSetsCount / totalSetsCount) * 100) : 0;

  const todayStr = dayjs().format('YYYY-MM-DD');
  const hasStudiedToday = activeDays.includes(todayStr);

  const getWeekDaysStatus = (days: string[]) => {
    const today = dayjs();
    const currentDayOfWeek = today.day(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
    const daysToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    const monday = today.add(daysToMonday, 'day');
    
    const weekDays = [];
    const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    
    let activeCount = 0;
    for (let i = 0; i < 7; i++) {
      const dateStr = monday.add(i, 'day').format('YYYY-MM-DD');
      const isActive = days.includes(dateStr);
      if (isActive) activeCount++;
      weekDays.push({
        label: labels[i],
        isActive,
        isToday: dateStr === today.format('YYYY-MM-DD')
      });
    }
    
    return { weekDays, activeCount };
  };

  const { weekDays, activeCount } = getWeekDaysStatus(activeDays);
  const weakConcepts = useMemo(() => {
    return Object.entries((conceptMasteries || {}) as Record<string, ConceptMasteryPreview>)
      .map(([setId, mastery]) => ({
        setId,
        title: formatConceptLabel(setId),
        bkt: Math.round(((mastery.bkt ?? 0) * 100)),
        elo: mastery.elo ?? 1000,
        weaknessFlag: Boolean(mastery.weaknessFlag),
        masteryState: mastery.masteryState || 'learning',
      }))
      .filter((concept) => concept.weaknessFlag || concept.bkt < 75)
      .sort((a, b) => {
        if (a.weaknessFlag !== b.weaknessFlag) return a.weaknessFlag ? -1 : 1;
        return a.bkt - b.bkt;
      })
      .slice(0, 3);
  }, [conceptMasteries]);

  return (
    <aside className="fixed right-0 top-6 bottom-6 hidden lg:flex w-80 flex-col gap-5 rounded-l-3xl border border-r-0 border-gray-border bg-surface-container-lowest/90 p-5 shadow-xl shadow-stone-900/5 backdrop-blur-md z-20 font-be-vietnam-pro overflow-visible">
      {/* Top Header Row for Stats */}
      <div className="flex items-center justify-between gap-4 p-1">
        {/* Streak Flame */}
        <span
          className="relative flex items-center gap-2 rounded-xl p-3 font-bold text-accent-orange hover:bg-surface-container-low cursor-pointer select-none transition-colors"
          onMouseEnter={() => setStreakShown(true)}
          onMouseLeave={() => {
            setStreakShown(false);
          }}
          onClick={(event) => {
            if (event.target !== event.currentTarget) return;
            setStreakShown((x) => !x);
          }}
          role="button"
          tabIndex={0}
        >
          <div className="pointer-events-none">
            {streak > 0 ? <FireSvg /> : <EmptyFireSvg />}
          </div>
          <span className={streak > 0 ? "text-accent-orange font-mono text-sm" : "text-stone-300 font-mono text-sm"}>
            {streak}
          </span>

          {/* Popover Streak Info (Light Theme - Project Match) */}
          <div
            className="absolute top-[80%] right-0 z-30 pt-3 transition-all duration-200"
            style={{
              width: 320,
              display: streakShown ? "block" : "none",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Inner styled popover container */}
            <div className="flex flex-col gap-4 rounded-2xl border border-gray-border bg-white p-5 text-on-background shadow-xl">
              {/* Header section with large flame */}
               <div className="flex justify-between items-start w-full">
                <div className="flex flex-col gap-1.5 text-left max-w-[210px]">
                  <h2 className="text-lg font-black text-on-background font-fraunces">{streak} ngày streak</h2>
                  <p className="text-caption-tight text-stone-500 font-semibold leading-relaxed">
                    {hasStudiedToday 
                      ? "Bạn đã học ngày hôm nay! Hãy tiếp tục duy trì nhé." 
                      : "Học một bài học ngay hôm nay để bắt đầu chuỗi streak mới nào!"}
                  </p>
                </div>
                <div className="scale-[1.8] origin-top-right shrink-0 opacity-[0.08] mr-1 mt-1">
                  <FireSvg />
                </div>
              </div>

              {/* Weekly progress tracker box */}
              <div className="bg-accent-orange/5 border border-gray-border rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex justify-between text-caption-tight font-black tracking-wide">
                  {weekDays.map((day, i) => (
                    <span 
                      key={i} 
                      className={day.isActive 
                        ? "text-accent-orange-dark font-extrabold" 
                        : day.isToday 
                          ? "text-on-background underline decoration-accent-orange decoration-2 underline-offset-4 font-black" 
                          : "text-stone-400"
                      }
                    >
                      {day.label}
                    </span>
                  ))}
                </div>
                
                <div className="relative w-full h-4 bg-stone-100 rounded-full flex items-center pr-1 border border-stone-200/40 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-accent-orange to-tertiary-yellow rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(4, (activeCount / 7) * 100)}%` }}
                  />
                  <div className="absolute right-1 w-5 h-5 flex items-center justify-center scale-75">
                    <div className="scale-[0.6] origin-center">
                      {activeCount > 0 ? <FireSvg /> : <EmptyFireSvg />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Streak Society Lock Section */}
              <div className="border border-gray-border rounded-2xl p-4 flex gap-4 items-center bg-accent-orange/5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-400">
                  {streak >= 7 ? (
                    <Sparkles className="h-6 w-6 text-accent-orange fill-tertiary-yellow" />
                  ) : (
                    <Lock className="h-6 w-6 stroke-[2]" />
                  )}
                </div>
                <div className="flex flex-col gap-0.5 text-left">
                  <h3 className="text-xs font-extrabold text-on-background">Hội Streak</h3>
                  <p className="text-kicker-micro text-stone-500 font-semibold leading-normal">
                    {streak >= 7 
                      ? "Tuyệt vời! Bạn đã gia nhập Hội Streak thành công và nhận được đặc quyền."
                      : "Đạt 7 ngày streak để gia nhập Hội Streak và nhận những phần thưởng độc quyền."}
                  </p>
                </div>
              </div>

              {/* Action button */}
              <button
                type="button"
                className="btn-3d btn-green w-full text-xs py-3 font-black tracking-wider uppercase cursor-pointer"
              >
                Xem thêm
              </button>
            </div>
          </div>
        </span>

        {/* XP Points */}
        <div className="flex items-center gap-2 rounded-2xl border border-tertiary-yellow/20 bg-tertiary-yellow/5 px-4 py-2 hover:bg-tertiary-yellow/10 transition-colors cursor-default" title="Điểm tích lũy kinh nghiệm">
          <Award className="h-5 w-5 text-tertiary-yellow-dark fill-tertiary-yellow" />
          <span className="text-sm font-extrabold text-on-background font-mono">{xp} XP</span>
        </div>
      </div>

      {/* Scrollable container for widgets */}
      <div className="flex-1 overflow-y-auto hover-scrollbar flex flex-col gap-6 pr-1 -mr-1">
        {selectedPersona === 'student' && activeTab === 'profile' && (
          <StudentProfileRail
            name={name}
            xp={xp}
            streak={streak}
            activeCount={activeCount}
            progressPercent={progressPercent}
            weakConcepts={weakConcepts}
            onViewLearningPath={onViewLearningPath}
            onViewGraph={onViewGraph}
            skillMapPanel={skillMapPanel}
          />
        )}

        {selectedPersona === 'student' && activeTab !== 'profile' && (
          <>
            {skillMapPanel ? (
              <section className="rounded-2xl border border-gray-border bg-white p-4 shadow-sm">
                {skillMapPanel}
              </section>
            ) : (
              <section className="rounded-2xl border border-gray-border bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-green/10 text-primary-green-dark">
                      <GitBranch className="h-4 w-4" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-primary-green-dark">Skill Map</h3>
                  </div>
                  <span className="rounded-full border border-primary-green/20 bg-primary-green/5 px-2 py-0.5 text-kicker-micro font-black uppercase text-primary-green-dark">
                    Prerequisite
                  </span>
                </div>
                <p className="text-caption-tight font-semibold leading-relaxed text-stone-600">
                  Xem các concept đang yếu, concept tiền đề và bài luyện liên quan trong knowledge graph cá nhân.
                </p>
                <button
                  type="button"
                  onClick={onViewGraph}
                  className="btn-3d btn-white w-full text-caption-tight py-2.5 font-black tracking-wider uppercase cursor-pointer"
                >
                  Mở Skill Map
                </button>
              </section>
            )}

            <section className="rounded-2xl border border-gray-border bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-tertiary-yellow/20 bg-tertiary-yellow/10 text-tertiary-yellow-dark">
                  <UserRoundCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-black text-on-background">{name || 'Hồ sơ học viên'}</h3>
                  <p className="text-caption-tight font-bold uppercase tracking-wider text-stone-500">
                    Elo, BKT, streak và lịch sử luyện tập
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onViewProfile}
                className="btn-3d btn-green w-full text-caption-tight py-2.5 font-black tracking-wider uppercase cursor-pointer"
              >
                Xem chi tiết học viên
              </button>
            </section>
          </>
        )}

        {selectedPersona === 'mentor' && (
          <>
            <section className="rounded-2xl border-2 border-primary-green/25 bg-primary-green/10 p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-kicker-micro font-black uppercase tracking-wider text-primary-green-dark">
                    <Users className="h-3.5 w-3.5" />
                    Teacher panel
                  </div>
                  <h3 className="mt-1 font-fraunces text-base font-black leading-tight text-on-background">
                    Học viên cần can thiệp
                  </h3>
                </div>
                <span className="rounded-full bg-white px-2 py-1 text-caption-tight font-black text-error-red-dark">6</span>
              </div>
              <p className="text-caption-tight font-semibold leading-relaxed text-stone-600">
                Mở class insights để xem nhóm yếu theo concept, heatmap mastery và hồ sơ từng học viên.
              </p>
              <button
                type="button"
                onClick={onViewClassInsights}
                className="btn-3d btn-green w-full text-caption-tight py-2.5 font-black tracking-wider uppercase cursor-pointer"
              >
                Xem lớp học
              </button>
            </section>

            <section className="rounded-2xl border border-gray-border bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-orange/10 text-accent-orange-dark">
                  <FileSearch className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-accent-orange-dark">Mentor review</h3>
              </div>
              <p className="text-caption-tight font-semibold leading-relaxed text-stone-600">
                Xem các báo cáo AI response từ học viên, đọc ngữ cảnh thật và chốt mentor review.
              </p>
              <button
                type="button"
                onClick={onViewRagAudit}
                className="btn-3d btn-white w-full cursor-pointer py-2.5 text-caption-tight font-black uppercase tracking-wider"
              >
                Mentor Review
              </button>
            </section>
          </>
        )}

        {selectedPersona === 'btc' && (
          <>
            <section className="rounded-2xl border-2 border-primary-green/25 bg-primary-green/10 p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-kicker-micro font-black uppercase tracking-wider text-primary-green-dark">
                    <ClipboardCheck className="h-3.5 w-3.5" />
                    BTC panel
                  </div>
                  <h3 className="mt-1 font-fraunces text-base font-black leading-tight text-on-background">
                    Vận hành Springstorm
                  </h3>
                </div>
                <span className="rounded-full border border-primary-green/20 bg-white px-2 py-1 text-kicker-micro font-black uppercase text-primary-green-dark">
                  Live
                </span>
              </div>
              <p className="text-caption-tight font-semibold leading-relaxed text-stone-600">
                Theo dõi cohort, cảnh báo AI Ops và các điểm nóng học tập cần BTC điều phối trong ngày.
              </p>
              <button
                type="button"
                onClick={onViewBtcOps}
                className="btn-3d btn-green w-full text-caption-tight py-2.5 font-black tracking-wider uppercase cursor-pointer"
              >
                Mở AI Ops
              </button>
            </section>

            <section className="rounded-2xl border border-gray-border bg-white p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600">Ưu tiên BTC</h3>
              {['Cohort có mastery tụt nhanh', 'Nội dung cần duyệt trước khi public', 'Phiên tutor có độ tin cậy thấp'].map((item) => (
                <div key={item} className="rounded-xl border border-gray-border bg-surface-container-low p-3 text-caption-tight font-bold leading-relaxed text-stone-600">
                  {item}
                </div>
              ))}
            </section>
          </>
        )}

        {selectedPersona === 'student' && activeTab !== 'profile' && (
          <>
        <section className="rounded-2xl border-2 border-primary-green/25 bg-primary-green/10 p-5 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-kicker-micro font-black uppercase tracking-wider text-primary-green-dark">
                <Target className="h-3.5 w-3.5" />
                Hôm nay
              </div>
              <h3 className="font-fraunces text-base font-black leading-tight text-on-background">
                Ưu tiên bài nằm trong vùng ZPD
              </h3>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-primary-green/20 bg-white text-primary-green-dark">
              <Brain className="h-5 w-5" />
            </div>
          </div>

          <p className="text-caption-tight font-semibold leading-relaxed text-stone-600">
            Bắt đầu bằng bài vừa đủ khó, sau đó kiểm tra lại các phần còn yếu để giữ nhịp tiến bộ.
          </p>

          <button
            onClick={onViewLearningPath}
            className="btn-3d btn-green w-full text-caption-tight py-2.5 font-black tracking-wider uppercase cursor-pointer"
          >
            <span>Luyện ngay</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </section>

        {loggedIn && variant !== 'learning' && (
          <ZpdWidget onViewLearningPath={onViewLearningPath} />
        )}

        <section className="rounded-2xl border border-gray-border bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-green/10 text-primary-green-dark">
                <Activity className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary-green-dark">Nhịp học tuần này</h3>
            </div>
            <span className="font-mono text-caption-tight font-black text-stone-500">
              {activeCount}/7 ngày
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {weekDays.map((day) => (
              <div key={day.label} className="space-y-1 text-center">
                <div
                  className={`mx-auto h-7 w-7 rounded-xl border flex items-center justify-center text-kicker-micro font-black ${
                    day.isActive
                      ? 'border-accent-orange/40 bg-accent-orange/15 text-accent-orange-dark'
                      : day.isToday
                        ? 'border-primary-green/40 bg-primary-green/10 text-primary-green-dark'
                        : 'border-gray-border bg-stone-50 text-stone-400'
                  }`}
                >
                  {day.label}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-end justify-between text-xs font-semibold text-stone-700">
              <span>Hoàn thành lộ trình</span>
              <span className="font-mono font-bold text-primary-green-dark">{completedSetsCount}/{totalSetsCount}</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-stone-100 border border-stone-200/40 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-primary-green to-tertiary-yellow rounded-full"
              />
            </div>
            <div className="text-caption-tight text-right font-mono text-stone-500 font-bold">
              {progressPercent}% tổng tiến độ
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-border bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-orange/10 text-accent-orange-dark">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-accent-orange-dark">Lỗ hổng cần vá</h3>
            </div>
            <span className="rounded-full border border-gray-border bg-stone-50 px-2 py-0.5 text-kicker-micro font-black uppercase text-stone-500">
              Top 3
            </span>
          </div>

          {weakConcepts.length > 0 ? (
            <div className="space-y-2.5">
              {weakConcepts.map((concept, index) => (
                <div key={concept.setId} className="rounded-xl border border-gray-border bg-surface-container-low p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-label-tight font-black text-on-background">
                        {index + 1}. {concept.title}
                      </p>
                      <p className="mt-1 text-kicker-micro font-bold uppercase tracking-wider text-stone-500">
                        BKT {concept.bkt}% • Elo {concept.elo}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-badge-micro font-black uppercase ${
                      concept.weaknessFlag
                        ? 'bg-error-red/10 text-error-red-dark'
                        : 'bg-tertiary-yellow/15 text-tertiary-yellow-dark'
                    }`}>
                      {concept.weaknessFlag ? 'Yếu' : concept.masteryState}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-primary-green/20 bg-primary-green/5 p-4 text-center">
              <CheckCircle2 className="mx-auto h-5 w-5 text-primary-green-dark" />
              <p className="mt-2 text-caption-tight font-bold leading-relaxed text-stone-600">
                Chưa có lỗ hổng nổi bật. Hãy làm thêm bài ZPD để hệ thống đo chính xác hơn.
              </p>
            </div>
          )}
        </section>

      {/* Create Profile Section (if not logged in) */}
      {!loggedIn && (
        <div className="rounded-2xl border border-primary-green/20 bg-gradient-to-tr from-primary-green/10 via-tertiary-yellow/5 to-transparent p-5 shadow-sm space-y-4">
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-on-background leading-snug uppercase tracking-wider">
              Tạo hồ sơ để lưu tiến trình!
            </h4>
            <p className="text-caption-tight text-stone-500 leading-relaxed">
              Tạo tài khoản cá nhân giúp bạn lưu giữ điểm tích lũy (XP), chuỗi học tập (Streak) và đồng bộ hóa kết quả lên bảng xếp hạng chung.
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => onOpenAuth('signup')}
              className="btn-3d btn-green w-full text-caption-tight py-2.5 font-bold tracking-wider uppercase cursor-pointer shadow-sm shadow-primary-green/15"
            >
              Tạo Hồ Sơ
            </button>
            <button
              onClick={() => onOpenAuth('login')}
              className="btn-3d btn-white w-full text-caption-tight py-2.5 font-bold tracking-wider uppercase cursor-pointer"
            >
              Đăng nhập
            </button>
          </div>
        </div>
      )}
          </>
        )}
      </div>
    </aside>
  );
};

function StudentProfileRail({
  name,
  xp,
  streak,
  activeCount,
  progressPercent,
  weakConcepts,
  onViewLearningPath,
  onViewGraph,
  skillMapPanel,
}: {
  name: string;
  xp: number;
  streak: number;
  activeCount: number;
  progressPercent: number;
  weakConcepts: Array<{
    setId: string;
    title: string;
    bkt: number;
    elo: number;
    weaknessFlag: boolean;
    masteryState: string;
  }>;
  onViewLearningPath?: () => void;
  onViewGraph?: () => void;
  skillMapPanel?: ReactNode;
}) {
  const healthScore = Math.max(12, Math.min(98, Math.round(progressPercent * 0.45 + Math.min(streak, 14) * 3 + activeCount * 4)));

  return (
    <>
      <section className="rounded-2xl border-2 border-primary-green/25 bg-primary-green/10 p-5 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-kicker-micro font-black uppercase tracking-wider text-primary-green-dark">
              <UserRoundCheck className="h-3.5 w-3.5" />
              Hồ sơ RPG
            </div>
            <h3 className="mt-1 font-fraunces text-base font-black leading-tight text-on-background">
              {name || 'Nhân vật học tập'}
            </h3>
          </div>
          <span className="rounded-full border border-primary-green/20 bg-white px-2 py-1 text-kicker-micro font-black uppercase text-primary-green-dark">
            Edo
          </span>
        </div>

        <div className="relative h-32 overflow-hidden rounded-2xl border border-primary-green/20 bg-white">
          <Image
            src="/mascot/edo/edo-sofi-next-path-lantern.webp"
            alt=""
            width={260}
            height={150}
            className="h-full w-full object-contain object-bottom"
            loading="lazy"
          />
        </div>

        <button
          type="button"
          onClick={onViewLearningPath}
          className="btn-3d btn-green w-full text-caption-tight py-2.5 font-black tracking-wider uppercase cursor-pointer"
        >
          <span>Việc nên làm tiếp</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </section>

      <section className="rounded-2xl border border-gray-border bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-fraunces text-base font-black leading-tight text-on-background">Sức khỏe học tập</h3>
            <p className="mt-1 text-caption-tight font-bold text-stone-500">XP {xp} · Streak {streak} ngày</p>
          </div>
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full border-[6px] border-primary-green bg-primary-green/5">
            <span className="font-mono text-sm font-black text-on-background">{healthScore}%</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-end justify-between text-xs font-semibold text-stone-700">
            <span>Tiến độ lộ trình</span>
            <span className="font-mono font-bold text-primary-green-dark">{progressPercent}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full border border-stone-200/40 bg-stone-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-primary-green to-tertiary-yellow"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-border bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-orange/10 text-accent-orange-dark">
              <Sparkles className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-accent-orange-dark">Vùng đất cần chăm</h3>
          </div>
          <span className="rounded-full border border-gray-border bg-stone-50 px-2 py-0.5 text-kicker-micro font-black uppercase text-stone-500">
            Top 3
          </span>
        </div>

        <div className="relative h-24 overflow-hidden rounded-2xl border border-accent-orange/20 bg-accent-orange-light/10">
          <Image
            src="/mascot/edo/edo-sofi-watering-recovery.webp"
            alt=""
            width={230}
            height={110}
            className="h-full w-full object-contain object-bottom"
            loading="lazy"
          />
        </div>

        {weakConcepts.length > 0 ? (
          <div className="space-y-2.5">
            {weakConcepts.map((concept, index) => (
              <div key={concept.setId} className="rounded-xl border border-gray-border bg-surface-container-low p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-label-tight font-black text-on-background">
                      {index + 1}. {concept.title}
                    </p>
                    <p className="mt-1 text-kicker-micro font-bold uppercase tracking-wider text-stone-500">
                      BKT {concept.bkt}% · Elo {concept.elo}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-accent-orange-light/30 px-2 py-0.5 text-badge-micro font-black uppercase text-accent-orange-dark">
                    Cần tưới
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-primary-green/20 bg-primary-green/5 p-4 text-center">
            <CheckCircle2 className="mx-auto h-5 w-5 text-primary-green-dark" />
            <p className="mt-2 text-caption-tight font-bold leading-relaxed text-stone-600">
              Khu vườn đang ổn định. Tiếp tục giữ nhịp tưới cây.
            </p>
          </div>
        )}
      </section>

      {skillMapPanel ? (
        <section className="rounded-2xl border border-gray-border bg-white p-4 shadow-sm">
          {skillMapPanel}
        </section>
      ) : (
        <section className="rounded-2xl border border-gray-border bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-green/10 text-primary-green-dark">
              <GitBranch className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary-green-dark">Skill Map</h3>
          </div>
          <p className="text-caption-tight font-semibold leading-relaxed text-stone-600">
            Mở graph để xem prerequisite và bài luyện liên quan.
          </p>
          <button
            type="button"
            onClick={onViewGraph}
            className="btn-3d btn-white w-full text-caption-tight py-2.5 font-black tracking-wider uppercase cursor-pointer"
          >
            Mở Skill Map
          </button>
        </section>
      )}
    </>
  );
}
