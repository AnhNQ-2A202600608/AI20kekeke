'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  BarChart3,
  BookOpen,
  Clock3,
  FileEdit,
  Flame,
  Info,
  ListChecks,
  Search,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react';
import { QuestionsData } from '@/lib/quiz/types';
import type { TabType } from '@/lib/dashboard-tabs';
import { EloHistoryPopover, type EloHistoryEvent } from '@/components/app/elo-history-popover';
import { AppProfileShortcut } from '@/components/app/app-profile-shortcut';
import { AppTopNav } from '@/components/app/app-top-nav';
import { LearningPageShell, TactilePanel } from '@/components/ui/learning';
import { useProfileData } from './hooks/useProfileData';

// Static Sub-components
import { RpgProfileHero } from './components/rpg-profile-hero';
import { SkillGarden } from './components/skill-garden';
import { ConceptDetailDrawer } from './components/concept-detail-drawer';
import { ProfileInteractiveInsights } from './components/profile-interactive-insights';
import type { ConceptMastery, DayActivity, Session } from './utils/profile-utils';

interface ProfileTabProps {
  activeDays?: string[];
  completedSets: string[];
  data: QuestionsData;
  joinedAt: string;
  loggedIn: boolean;
  name: string;
  username: string;
  mssv?: string;
  role?: string;
  onLogOut: () => void;
  streak: number;
  xp: number;
  eloHistoryEvents?: EloHistoryEvent[];
  selectedPersona: 'student' | 'mentor' | 'btc';
  setPersona: (persona: 'student' | 'mentor' | 'btc') => void;
  onStartPractice?: (skillId: string, targetSetId?: string) => void;
  setActiveTab: (tab: TabType) => void;
  userId?: string | null;
}

function AdminProfileView({
  name,
  username,
  mssv,
  role,
  joinedAt,
  loggedIn,
  onLogOut,
  selectedPersona,
  setPersona,
  userId,
}: Pick<
  ProfileTabProps,
  'name' | 'username' | 'mssv' | 'role' | 'joinedAt' | 'loggedIn' | 'onLogOut' | 'selectedPersona' | 'setPersona' | 'userId'
>) {
  const roleLabel = selectedPersona === 'mentor' ? 'Giảng viên' : 'BTC';

  const adminMetrics =
    selectedPersona === 'mentor'
      ? [
          {
            label: 'Lớp phụ trách',
            value: '03',
            note: '2 lớp active, 1 lớp review',
            icon: Users,
          },
          {
            label: 'Học viên cần hỗ trợ',
            value: '11',
            note: '4 trường hợp cần follow-up sớm',
            icon: Flame,
          },
          {
            label: 'Câu hỏi chờ duyệt',
            value: '18',
            note: 'Ưu tiên câu hỏi Day 8-10',
            icon: FileEdit,
          },
          {
            label: 'RAG audit gần đây',
            value: '07',
            note: '2 cảnh báo citation confidence',
            icon: Search,
          },
        ]
      : [
          {
            label: 'Học viên toàn khóa',
            value: '120',
            note: 'Khóa K2 đang hoạt động',
            icon: Users,
          },
          {
            label: 'Skill nguy cơ cao',
            value: '02',
            note: 'Agent Security, Tool Calling',
            icon: ShieldCheck,
          },
          {
            label: 'Workshop đề xuất',
            value: '01',
            note: 'Bổ trợ cho nhóm yếu Day 3-4',
            icon: Flame,
          },
          {
            label: 'Tiến độ khóa',
            value: '68%',
            note: 'Đang bám đúng lộ trình',
            icon: BarChart3,
          },
        ];

  return (
    <motion.div
      key={`profile-${selectedPersona}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full w-full"
    >
      <LearningPageShell size="lg">
        <AppProfileShortcut
          displayName={name || username || `${roleLabel} Sandbox`}
          initial={(name || username || roleLabel).trim().charAt(0).toUpperCase() || 'N'}
          loggedIn={loggedIn}
          mssv={mssv}
          onLogOut={onLogOut}
          onOpenProfile={() => undefined}
          role={role}
          selectedPersona={selectedPersona}
          setPersona={setPersona}
          userId={userId}
          label="Mở hồ sơ người dùng"
        />

      <TactilePanel className="space-y-5">
        <div className="flex items-center justify-between gap-5 flex-wrap">
          <div className="flex items-center gap-4 text-left">
            <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-accent-orange to-tertiary-yellow text-white flex items-center justify-center font-bold text-lg shadow-sm uppercase shrink-0">
              {(name || roleLabel).substring(0, 2)}
            </div>
            <div className="space-y-0.5">
              <h2 className="text-md md:text-lg font-black text-stone-900 tracking-tight">
                {name || `${roleLabel} Sandbox`}
              </h2>
              <p className="text-caption-tight text-stone-400 font-mono font-bold uppercase tracking-wider">
                {mssv ? `${mssv} • ` : ''}
                {role ? role.toUpperCase() : username ? `@${username}` : `${roleLabel.toUpperCase()} SANDBOX`}
              </p>
              <p className="text-kicker-micro text-stone-500 font-semibold font-mono">
                Vai trò: {roleLabel} • Role hệ thống: {role || 'guest'} • Thành viên từ {joinedAt.slice(0, 7) || '2026-06'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {loggedIn && (
              <button
                onClick={onLogOut}
                className="px-4 py-2 border border-stone-200 hover:bg-stone-50 active:translate-y-[1px] text-caption-tight font-black uppercase text-stone-600 rounded-xl transition-all cursor-pointer shadow-sm bg-white"
              >
                Đăng xuất
              </button>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary-green/20 via-primary-green/5 to-tertiary-yellow/10 border border-primary-green/15 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-xs text-primary-green-dark font-medium shadow-sm">
          <span className="font-bold">
            Chế độ sandbox đang mô phỏng dữ liệu quản trị để kiểm tra luồng điều phối frontend.
          </span>
          <span className="text-kicker-micro font-black uppercase bg-primary-green/20 border border-primary-green-dark/30 px-2 py-0.5 rounded font-mono shrink-0">
            Sandbox
          </span>
        </div>
      </TactilePanel>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {adminMetrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <article
              key={metric.label}
              className="flex min-h-[144px] flex-col justify-between rounded-2xl border border-gray-border bg-white p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-kicker-micro text-stone-400 font-bold uppercase tracking-wider">
                  {metric.label}
                </span>
                <div className="h-9 w-9 rounded-xl bg-primary-green/10 text-primary-green-dark flex items-center justify-center">
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-stone-900">{metric.value}</p>
                <p className="text-label-tight text-stone-500 font-semibold leading-relaxed mt-1">
                  {metric.note}
                </p>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
        <article className="rounded-2xl border border-gray-border bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4.5 h-4.5 text-primary-green-dark" />
            <h3 className="text-sm font-black text-stone-900 uppercase tracking-wide">
              Tóm tắt vận hành
            </h3>
          </div>
          <div className="space-y-3 text-sm text-stone-600 font-medium leading-relaxed">
            <p>
              {selectedPersona === 'mentor'
                ? 'Luồng giảng viên đang ưu tiên theo dõi tiến độ lớp, kiểm duyệt câu hỏi AI sinh và xác minh log RAG trước khi giao bài.'
                : 'Luồng BTC đang ưu tiên theo dõi heatmap toàn khóa, phát hiện cụm kỹ năng rủi ro và chuẩn bị workshop can thiệp.'}
            </p>
            <p>
              Profile admin đã được làm phẳng để tập trung vào danh tính và chỉ số điều phối, không còn hiển thị Elo, XP, streak hay biểu đồ cá nhân của học viên.
            </p>
          </div>
        </article>

        <article className="rounded-2xl border border-gray-border bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4.5 h-4.5 text-stone-400" />
            <h3 className="text-sm font-black text-stone-900 uppercase tracking-wide">
              Checklist nhanh
            </h3>
          </div>
          <div className="space-y-2 text-node-label text-stone-600 font-semibold">
            <p>Sidebar role-based đổi tức thì khi chuyển persona.</p>
            <p>Right sidebar học viên đã bị ẩn hoàn toàn ngoài luồng student.</p>
            <p>Trang này chỉ giữ thông tin cá nhân và metric điều phối theo vai trò.</p>
          </div>
        </article>
      </section>
      </LearningPageShell>
    </motion.div>
  );
}

function ProfileInsightSummary({
  averageElo,
  concepts,
  eloHistoryEvents,
  heatmapActivities,
  sessions,
}: {
  averageElo: number;
  concepts: ConceptMastery[];
  eloHistoryEvents?: EloHistoryEvent[];
  heatmapActivities: DayActivity[];
  sessions: Session[];
}) {
  const reviewConcepts = concepts.filter((concept) => concept.status === 'weak' || concept.decayRisk);
  const zpdConcepts = concepts.filter((concept) => concept.status === 'zpd' || concept.status === 'learning');
  const masteredConcepts = concepts.filter((concept) => concept.status === 'mastered');
  const activeDays = heatmapActivities.filter((day) => day.eloGain > 0).length;
  const quizCount = heatmapActivities.reduce((sum, day) => sum + (day.quizCount || 0), 0);
  const chatCount = heatmapActivities.reduce((sum, day) => sum + (day.chatCount || 0), 0);
  const latestSession = sessions[0];
  const topReview = reviewConcepts[0] || zpdConcepts[0] || concepts[0];

  const insightCards = [
    {
      label: 'Cần ôn',
      value: reviewConcepts.length.toString(),
      detail: topReview ? topReview.name : 'Chưa có vùng rủi ro',
      icon: Flame,
      tone: 'text-accent-orange-dark bg-accent-orange-light/20 border-accent-orange/25',
    },
    {
      label: 'Đang mở',
      value: zpdConcepts.length.toString(),
      detail: `${masteredConcepts.length}/${concepts.length} concept đã vững`,
      icon: Target,
      tone: 'text-primary-green-dark bg-primary-green/10 border-primary-green/20',
    },
    {
      label: 'Nhịp 30 ngày',
      value: `${activeDays}/30`,
      detail: `${quizCount} bài luyện · ${chatCount} phiên chat`,
      icon: BarChart3,
      tone: 'text-primary-blue-dark bg-primary-blue-light/70 border-primary-blue/20',
    },
    {
      label: 'Gần nhất',
      value: latestSession ? (latestSession.type === 'quiz' ? 'Quiz' : 'Chat') : '-',
      detail: latestSession
        ? `${latestSession.conceptName} · ${latestSession.eloDelta > 0 ? '+' : ''}${latestSession.eloDelta} Elo`
        : 'Chưa có phiên gần đây',
      icon: Clock3,
      tone: 'text-stone-600 bg-stone-50 border-stone-200',
    },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {insightCards.map((card) => {
        const Icon = card.icon;
        return (
          <article key={card.label} className={`rounded-2xl border bg-white p-4 text-left ${card.tone}`}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-kicker-micro font-black uppercase tracking-widest opacity-80">{card.label}</p>
              <Icon className="h-4.5 w-4.5 shrink-0" />
            </div>
            <p className="font-mono text-2xl font-black leading-none text-on-background">{card.value}</p>
            <p className="mt-2 line-clamp-2 text-caption-tight font-bold leading-snug text-stone-500">{card.detail}</p>
          </article>
        );
      })}
      <article className="rounded-2xl border border-gray-border bg-white p-4 text-left md:col-span-2 xl:col-span-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-kicker-micro font-black uppercase tracking-widest text-primary-green-dark">Tóm tắt học tập</p>
            <h3 className="mt-1 font-fraunces text-xl font-black leading-tight text-on-background">
              Hồ sơ chỉ giữ chỉ số có thể hành động
            </h3>
          </div>
          <span className="rounded-xl border border-primary-green/20 bg-primary-green/10 px-3 py-1 text-caption-tight font-black text-primary-green-dark">
            Elo trung bình {Math.round(averageElo)}
          </span>
        </div>
        <div className="mt-4 rounded-2xl border border-primary-green/10 bg-primary-green/5 p-3">
          <EloHistoryPopover
            averageElo={Math.round(averageElo)}
            eloScope="aggregate"
            events={eloHistoryEvents}
          />
        </div>
      </article>
    </section>
  );
}

export function ProfileTab({
  activeDays,
  completedSets,
  data,
  joinedAt,
  loggedIn,
  name,
  username,
  mssv,
  role,
  onLogOut,
  streak,
  xp,
  eloHistoryEvents,
  selectedPersona,
  setPersona,
  onStartPractice,
  setActiveTab,
  userId,
}: ProfileTabProps) {
  const [activeProfileTab, setActiveProfileTab] = useState<'basic' | 'interactive'>('basic');
  const {
    computedConcepts,
    averageElo,
    zpdConceptsCount,
    sortedConcepts,
    heatmapActivities,
    activeDrawerConcept,
    setActiveDrawerConceptId,
    handleStartConceptPractice,
    sessions,
  } = useProfileData({ onStartPractice });

  if (selectedPersona !== 'student') {
    return (
      <AdminProfileView
        name={name}
        username={username}
        mssv={mssv}
        role={role}
        joinedAt={joinedAt}
        loggedIn={loggedIn}
        onLogOut={onLogOut}
        selectedPersona={selectedPersona}
        setPersona={setPersona}
        userId={userId}
      />
    );
  }

  return (
    <motion.div
      key="profile-tab"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full w-full"
    >
      <div className="mx-auto flex h-full w-full max-w-[100dvw] flex-col overflow-hidden px-3 pb-2 pt-0 font-be-vietnam-pro text-on-background lg:max-w-[82rem]">
        <AppTopNav
          activeDays={activeDays}
          title="Hồ sơ học tập"
          subtitle="Nhân vật học tập, khu vườn kỹ năng và nhiệm vụ tiếp theo"
          averageElo={Math.round(averageElo)}
          displayName={name || username || 'Học viên EduGap'}
          eloHistoryEvents={eloHistoryEvents}
          initial={(name || username || 'N').trim().charAt(0).toUpperCase() || 'N'}
          loggedIn={loggedIn}
          mssv={mssv}
          onLogOut={onLogOut}
          onOpenProfile={() => setActiveTab('profile')}
          role={role}
          selectedPersona={selectedPersona}
          setPersona={setPersona}
          streak={streak}
          xp={xp}
        />

        <section className="min-h-0 flex-1 overflow-hidden rounded-[1.25rem] border border-primary-green/15 bg-[#fffdf3] p-2.5 md:p-3">
          <div className="mb-3 grid grid-cols-2 gap-2 rounded-2xl border border-gray-border bg-white p-1.5">
            {([
              { id: 'basic', label: 'Thông tin cơ bản', hint: 'Hồ sơ, nhịp học, vườn kỹ năng' },
              { id: 'interactive', label: 'Phân tích tương tác', hint: 'ZPD, BKT, mastery chart' },
            ] as const).map((tab) => {
              const isActive = activeProfileTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveProfileTab(tab.id)}
                  className={`min-h-14 rounded-xl border px-3 text-left transition-colors ${
                    isActive
                      ? 'border-primary-green/45 bg-primary-green/10 text-primary-green-dark'
                      : 'border-transparent bg-transparent text-stone-500 hover:bg-stone-50 hover:text-on-background'
                  }`}
                >
                  <span className="block text-xs font-black uppercase tracking-wide">{tab.label}</span>
                  <span className="mt-0.5 block truncate text-badge-micro font-bold">{tab.hint}</span>
                </button>
              );
            })}
          </div>

          <div className="learning-scrollbar h-[calc(100%-4.75rem)] min-h-0 overflow-y-auto pr-1">
            {activeProfileTab === 'basic' ? (
              <div className="space-y-3">
              <RpgProfileHero
                name={name}
                username={username}
                mssv={mssv}
                role={role}
                joinedAt={joinedAt}
                xp={xp}
                streak={streak}
                zpdConceptsCount={zpdConceptsCount}
                concepts={computedConcepts}
              />

              <ProfileInsightSummary
                averageElo={averageElo}
                concepts={sortedConcepts}
                eloHistoryEvents={eloHistoryEvents}
                heatmapActivities={heatmapActivities}
                sessions={sessions}
              />

              <SkillGarden
                concepts={sortedConcepts}
                onStartPractice={handleStartConceptPractice}
                onOpenConcept={setActiveDrawerConceptId}
              />
              </div>
            ) : (
              <ProfileInteractiveInsights
                concepts={sortedConcepts}
                heatmapActivities={heatmapActivities}
                sessions={sessions}
              />
            )}
          </div>
        </section>

      {/* 8. Concept detail bottom drawer dialog */}
      <ConceptDetailDrawer
        activeDrawerConcept={activeDrawerConcept}
        onClose={() => setActiveDrawerConceptId(null)}
        onStartPractice={handleStartConceptPractice}
      />
      </div>
    </motion.div>
  );
}
export default ProfileTab;
