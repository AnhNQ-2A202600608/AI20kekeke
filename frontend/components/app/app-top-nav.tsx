'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Flame, Gauge, Zap } from 'lucide-react';
import { EloCounter, type EloCounterAnimation } from '@/components/app/elo-counter';
import { AppMetricPill } from '@/components/app/app-metric-pill';
import { LearningBrandMark } from '@/components/learning/learning-brand-mark';
import { AppProfileShortcut } from '@/components/app/app-profile-shortcut';
import { EloHistoryPopover, type EloHistoryEvent } from '@/components/app/elo-history-popover';
import { StreakPopover } from '@/components/app/streak-popover';
import { XpPopover } from '@/components/app/xp-popover';
import type { PersonaType } from '@/lib/dashboard-tabs';

interface AppTopNavProps {
  activeDays?: string[];
  title: string;
  subtitle: string;
  averageElo: number;
  activeConceptId?: string | null;
  displayName: string;
  eloScope?: 'aggregate' | 'concept';
  eloCounterAnimation?: EloCounterAnimation | null;
  eloHistoryEvents?: EloHistoryEvent[];
  initial: string;
  isEloHistoryLoading?: boolean;
  loggedIn?: boolean;
  mssv?: string;
  onLogOut?: () => void;
  onLogoClick?: () => void;
  onOpenLogin?: () => void;
  onOpenProfile?: () => void;
  role?: string;
  selectedPersona?: PersonaType;
  setPersona?: (persona: PersonaType) => void;
  streak: number;
  userId?: string | null;
  xp: number;
}

export function AppTopNav({
  activeDays,
  title,
  subtitle,
  averageElo,
  activeConceptId,
  displayName,
  eloScope = 'aggregate',
  eloCounterAnimation,
  eloHistoryEvents,
  initial,
  isEloHistoryLoading,
  loggedIn,
  mssv,
  onLogOut,
  onLogoClick,
  onOpenLogin,
  onOpenProfile,
  role,
  selectedPersona,
  setPersona,
  streak,
  userId,
  xp,
}: AppTopNavProps) {
  const [openMetric, setOpenMetric] = useState<'streak' | 'xp' | 'elo' | null>(null);

  return (
    <header className="mb-2 hidden h-14 shrink-0 items-center justify-between gap-4 border-b border-gray-border/70 pb-2 lg:flex">
      <div className="flex min-w-0 items-center gap-4">
        <Link
          href="/app"
          aria-label="Về trang app EduGap"
          title="Về trang app"
          onClick={onLogoClick}
          className="shrink-0 rounded-xl transition hover:opacity-85 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25"
        >
          <LearningBrandMark compact />
        </Link>
        <div className="h-8 w-px shrink-0 bg-gray-border" aria-hidden="true" />
        <div className="min-w-0 text-left">
          <h1 className="truncate font-fraunces text-lg font-black leading-tight tracking-normal text-on-background xl:text-xl">
            {title}
          </h1>
          <p className="mt-0.5 truncate text-label-tight font-bold text-stone-500">{subtitle}</p>
        </div>
      </div>

      <div data-tour-id="mastery" className="flex shrink-0 items-center gap-2">
        <AppMetricPill
          isOpen={openMetric === 'streak'}
          label="Mở chi tiết streak"
          onOpenChange={(open) => setOpenMetric(open ? 'streak' : null)}
          panel={<StreakPopover activeDays={activeDays} streak={streak} />}
          tone="streak"
        >
          <Flame className="h-4 w-4 fill-orange-400 text-orange-500" aria-hidden="true" />
          {streak} ngày
        </AppMetricPill>
        <AppMetricPill
          isOpen={openMetric === 'xp'}
          label="Mở chi tiết XP"
          onOpenChange={(open) => setOpenMetric(open ? 'xp' : null)}
          panel={<XpPopover xp={xp} />}
          tone="xp"
        >
          <Zap className="h-4 w-4 fill-primary-green text-primary-green-dark" aria-hidden="true" />
          {xp} XP
        </AppMetricPill>
        <AppMetricPill
          isOpen={openMetric === 'elo'}
          label="Mở chi tiết Elo học tập"
          onOpenChange={(open) => setOpenMetric(open ? 'elo' : null)}
          panel={(
            <EloHistoryPopover
              averageElo={averageElo}
              activeConceptId={activeConceptId}
              eloScope={eloScope}
              events={eloHistoryEvents}
              isLoading={isEloHistoryLoading}
            />
          )}
          tone="elo"
        >
          <Gauge className="h-4 w-4 text-primary-blue" aria-hidden="true" />
          <EloCounter animation={eloCounterAnimation} value={averageElo} />
        </AppMetricPill>
        <AppProfileShortcut
          className="ml-1"
          displayName={displayName}
          initial={initial}
          loggedIn={loggedIn}
          mssv={mssv}
          onLogOut={onLogOut}
          onOpenLogin={onOpenLogin}
          onOpenProfile={onOpenProfile}
          label="Mở hồ sơ học viên"
          role={role}
          selectedPersona={selectedPersona}
          setPersona={setPersona}
          userId={userId}
        />
      </div>
    </header>
  );
}

export default AppTopNav;
