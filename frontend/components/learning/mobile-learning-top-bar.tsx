'use client';

import type { PersonaType } from '@/lib/dashboard-tabs';
import { Flame } from 'lucide-react';
import { AppProfileShortcut } from '@/components/app/app-profile-shortcut';
import { LearningBrandMark } from './learning-brand-mark';

interface MobileLearningTopBarProps {
  loggedIn?: boolean;
  mssv?: string;
  onLogOut?: () => void;
  onOpenLogin?: () => void;
  profileName?: string;
  streakDays?: number;
  profileInitial?: string;
  onOpenProfile?: () => void;
  role?: string;
  selectedPersona?: PersonaType;
  setPersona?: (persona: PersonaType) => void;
  userId?: string | null;
}

export function MobileLearningTopBar({
  loggedIn,
  mssv,
  onLogOut,
  onOpenLogin,
  profileName,
  streakDays = 0,
  profileInitial = 'N',
  onOpenProfile,
  role,
  selectedPersona,
  setPersona,
  userId,
}: MobileLearningTopBarProps) {
  return (
    <header className="sticky top-0 z-30 -mx-3 border-b border-gray-border/70 bg-[#F7FDEB]/95 px-3 py-3.5 backdrop-blur lg:hidden">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <LearningBrandMark compact />

        <div className="flex shrink-0 items-center gap-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-black text-on-background">
            <Flame className="h-4 w-4 fill-orange-400 text-orange-500" aria-hidden="true" />
            <span>{streakDays} ngày streak</span>
          </div>
          <AppProfileShortcut
            displayName={profileName}
            initial={profileInitial}
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
      </div>
    </header>
  );
}
