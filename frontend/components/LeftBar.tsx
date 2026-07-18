'use client';

import React, { useState } from 'react';
import { useBoundStore } from '@/hooks/useBoundStore';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronDown, Gauge, Menu, UserRound, Users, X } from 'lucide-react';
import { SofiMascot } from '@/components/brand/sofi-mascot';
import { getAllowedPersonas, getDefaultTabForPersona, getNavigationItems, type PersonaType, type TabType } from '@/lib/dashboard-tabs';

interface LeftBarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  loggedIn: boolean;
  variant?: 'sidebar' | 'top';
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const LeftBar: React.FC<LeftBarProps> = ({
  activeTab,
  setActiveTab,
  loggedIn,
  variant = 'sidebar',
  onOpenAuth,
}) => {
  const { selectedPersona, role, setPersona } = useBoundStore();
  const [floatingNavOpen, setFloatingNavOpen] = useState(false);
  const [personaSwitcherOpen, setPersonaSwitcherOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const items = getNavigationItems(selectedPersona, role);
  const allowedPersonas = getAllowedPersonas(role);
  const canShowRoleDropdown = allowedPersonas.length > 1;

  const handleTabClick = (tabId: TabType) => {
    if (tabId === 'profile' && !loggedIn) {
      onOpenAuth('signup');
    } else {
      setActiveTab(tabId);
    }
    setFloatingNavOpen(false);
    setPersonaSwitcherOpen(false);
  };

  const handlePersonaSwitch = (persona: PersonaType) => {
    setPersona(persona);
    setActiveTab(getDefaultTabForPersona(persona));
    setFloatingNavOpen(false);
    setPersonaSwitcherOpen(false);
  };

  const shouldUseFloatingNav = variant === 'top';
  const shouldShowDesktopPill =
    shouldUseFloatingNav ||
    activeTab === 'learn' ||
    activeTab === 'skills' ||
    activeTab === 'skill-graph' ||
    activeTab === 'profile' ||
    activeTab === 'chat';

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`fixed bottom-0 left-0 top-0 w-64 flex-col border-r border-gray-border bg-surface-container-lowest/80 backdrop-blur-md p-5 z-20 ${activeTab === 'chat' || variant === 'top' ? 'hidden' : 'hidden md:flex'}`}>
        <div className="mb-8 flex items-center gap-2.5 px-2 py-3">
          <SofiMascot size={42} animated={true} />
          <div>
            <h1 className="text-xl font-black text-on-background tracking-tight font-fraunces">Edu Gap</h1>
            <span className="text-kicker-micro font-bold uppercase tracking-wider text-primary-green-dark/80 font-mono">Vibrant Learning</span>
          </div>
        </div>

        <nav className="flex-1">
          <ul className="space-y-2 font-be-vietnam-pro">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleTabClick(item.id)}
                    className={`relative flex w-full items-center gap-4 rounded-xl px-4 py-3 text-sm font-extrabold uppercase transition-all cursor-pointer ${
                      isActive
                        ? 'border border-primary-green/45 bg-primary-green/10 text-primary-green-dark'
                        : 'text-stone-500 hover:bg-surface-container-low hover:text-on-background'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeLeftTab"
                        className="absolute inset-0 rounded-xl border border-primary-green/20"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon className={`h-5 w-5 ${isActive ? 'text-primary-green-dark' : 'text-stone-400'}`} />
                    <span>{item.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-auto px-2 py-4 border-t border-gray-border/40 text-caption-tight font-mono text-stone-400">
          <span>Edu Gap &copy; 2026</span>
        </div>
      </aside>

      {/* Floating student navigation */}
      {shouldUseFloatingNav && (
        <div
          className={[
            'fixed right-3 z-50 flex flex-col items-end gap-2 sm:right-5',
            shouldShowDesktopPill
              ? 'top-[calc(env(safe-area-inset-top)+4.5rem)] lg:top-[calc(env(safe-area-inset-top)+5rem)]'
              : 'bottom-[calc(env(safe-area-inset-bottom)+1rem)]',
          ].join(' ')}
        >
          <AnimatePresence>
            {floatingNavOpen && (
              <motion.nav
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.16 }}
                className="w-[min(20rem,calc(100dvw-1.5rem))] rounded-2xl border border-gray-border bg-white/95 p-2 shadow-xl shadow-stone-900/10 backdrop-blur-md"
                aria-label="Điều hướng EduGap"
              >
                <div className="flex items-center gap-2 border-b border-gray-border/70 px-2 pb-2">
                  <SofiMascot size={30} animated={false} />
                  <div className="min-w-0">
                    <p className="font-fraunces text-sm font-black leading-tight text-on-background">Edu Gap</p>
                    <p className="text-caption-tight font-bold uppercase tracking-wide text-primary-green-dark">Điều hướng</p>
                  </div>
                </div>
                <ul className="mt-2 grid gap-1 font-be-vietnam-pro">
                  {canShowRoleDropdown && (
                    <li>
                      <MobilePersonaSwitcher
                        allowedPersonas={allowedPersonas}
                        selectedPersona={selectedPersona}
                        onSelectPersona={handlePersonaSwitch}
                      />
                    </li>
                  )}
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => handleTabClick(item.id)}
                          className={[
                            'flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-extrabold uppercase transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25',
                            isActive
                              ? 'bg-primary-green text-white'
                              : 'text-stone-600 hover:bg-surface-container-low hover:text-on-background',
                          ].join(' ')}
                        >
                          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                          <span className="min-w-0 truncate">{item.name}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </motion.nav>
            )}
          </AnimatePresence>

          {shouldShowDesktopPill && (
            <nav
              data-tour-id="app-navigation"
              className="hidden rounded-full border border-gray-border bg-white/95 p-1.5 shadow-xl shadow-stone-900/10 backdrop-blur-md lg:flex lg:flex-col lg:gap-1"
              aria-label="Lối tắt EduGap"
            >
              {canShowRoleDropdown && (
                <>
                  <DesktopPersonaSwitcher
                    allowedPersonas={allowedPersonas}
                    isOpen={personaSwitcherOpen}
                    onOpenChange={setPersonaSwitcherOpen}
                    onSelectPersona={handlePersonaSwitch}
                    selectedPersona={selectedPersona}
                  />
                  <div className="mx-auto my-1 h-px w-7 bg-gray-border/80" aria-hidden="true" />
                </>
              )}
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabClick(item.id)}
                    className={[
                      'group relative grid h-10 w-10 cursor-pointer place-items-center rounded-full transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25 active:scale-95',
                      isActive
                        ? 'border border-primary-green-dark bg-primary-green text-white'
                        : 'border border-transparent bg-white text-stone-500 hover:border-gray-border hover:bg-surface-container-low hover:text-on-background',
                    ].join(' ')}
                    aria-label={item.name}
                    title={item.name}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    <span className="pointer-events-none absolute right-[calc(100%+0.5rem)] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-full border border-gray-border bg-white px-2.5 py-1 text-caption-tight font-black uppercase text-on-background shadow-sm group-hover:block">
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </nav>
          )}

          <button
            type="button"
            onClick={() => setFloatingNavOpen((open) => !open)}
            className={[
              'grid h-14 w-14 place-items-center rounded-full border border-primary-green/70 bg-primary-green text-white transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25 active:scale-95',
              shouldShowDesktopPill ? 'lg:hidden' : '',
            ].join(' ')}
            aria-label={floatingNavOpen ? 'Đóng điều hướng' : 'Mở điều hướng'}
            aria-expanded={floatingNavOpen}
          >
            {floatingNavOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
          </button>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      {!shouldUseFloatingNav && (
      <nav
        className="fixed bottom-0 left-0 grid w-[100dvw] max-w-[100dvw] overflow-hidden border-t border-gray-border bg-surface-container-lowest/95 px-1 py-1 shadow-lg shadow-stone-900/10 backdrop-blur-md md:hidden z-30"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex w-full min-w-0 flex-col items-center justify-center overflow-hidden rounded-xl px-1 py-1.5 text-kicker-micro font-extrabold uppercase transition-all cursor-pointer font-be-vietnam-pro ${
                isActive ? 'text-on-background font-black' : 'text-stone-500'
              }`}
              title={item.name}
            >
              <div className="relative shrink-0">
                {isActive && (
                  <motion.div
                    layoutId="activeMobileTabIndicator"
                    className="absolute -top-1 left-1/2 -translate-x-1/2 h-1 w-5 rounded-full bg-primary-green"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={`h-5 w-5 mb-0.5 ${isActive ? 'text-primary-green-dark' : 'text-stone-400'}`} />
              </div>
              <span className={selectedPersona === 'student' ? 'block max-w-full truncate leading-tight' : 'sr-only'}>
                {selectedPersona === 'student' ? item.name : item.shortName || item.name}
              </span>
            </button>
          );
        })}
      </nav>
      )}
    </>
  );
};

const personaMeta: Record<PersonaType, {
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  student: { label: 'Học viên', shortLabel: 'HV', icon: UserRound },
  mentor: { label: 'Giảng viên', shortLabel: 'GV', icon: Users },
  btc: { label: 'BTC/Admin', shortLabel: 'BTC', icon: Gauge },
};

function DesktopPersonaSwitcher({
  allowedPersonas,
  isOpen,
  onOpenChange,
  onSelectPersona,
  selectedPersona,
}: {
  allowedPersonas: PersonaType[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPersona: (persona: PersonaType) => void;
  selectedPersona: PersonaType;
}) {
  const CurrentIcon = personaMeta[selectedPersona].icon;
  const choices = allowedPersonas.filter((persona) => persona !== selectedPersona);

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => onOpenChange(!isOpen)}
        className="group relative grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-primary-green-dark bg-primary-green text-white transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25 active:scale-95"
        aria-label={`${isOpen ? 'Thu gọn' : 'Mở'} chọn vai trò`}
        aria-expanded={isOpen}
        title={personaMeta[selectedPersona].label}
      >
        <CurrentIcon className="h-5 w-5" aria-hidden="true" />
        <ChevronDown
          className={`absolute -bottom-0.5 right-0 h-3 w-3 rounded-full bg-white text-stone-400 transition ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
        <span className="pointer-events-none absolute right-[calc(100%+0.5rem)] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-full border border-gray-border bg-white px-2.5 py-1 text-caption-tight font-black uppercase text-on-background shadow-sm group-hover:block">
          {personaMeta[selectedPersona].label}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && choices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="flex flex-col items-center gap-1"
          >
            {choices.map((persona) => {
              const Icon = personaMeta[persona].icon;
              return (
                <button
                  key={persona}
                  type="button"
                  onClick={() => onSelectPersona(persona)}
                  className="group relative grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-transparent bg-white text-stone-500 transition hover:border-gray-border hover:bg-surface-container-low hover:text-on-background focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25 active:scale-95"
                  aria-label={`Chuyển sang ${personaMeta[persona].label}`}
                  title={personaMeta[persona].label}
                >
                  <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                  <span className="pointer-events-none absolute right-[calc(100%+0.5rem)] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-full border border-gray-border bg-white px-2.5 py-1 text-caption-tight font-black uppercase text-on-background shadow-sm group-hover:block">
                    {personaMeta[persona].label}
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobilePersonaSwitcher({
  allowedPersonas,
  onSelectPersona,
  selectedPersona,
}: {
  allowedPersonas: PersonaType[];
  onSelectPersona: (persona: PersonaType) => void;
  selectedPersona: PersonaType;
}) {
  return (
    <div className="rounded-xl border border-gray-border bg-surface-container-low p-2">
      <p className="px-1 pb-1 text-kicker-micro font-black uppercase tracking-widest text-stone-400">
        Chế độ xem
      </p>
      <div className="grid grid-cols-3 gap-1">
        {allowedPersonas.map((persona) => {
          const Icon = personaMeta[persona].icon;
          const isSelected = persona === selectedPersona;
          return (
            <button
              key={persona}
              type="button"
              onClick={() => onSelectPersona(persona)}
              className={[
                'flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 text-kicker-micro font-black uppercase transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/20',
                isSelected
                  ? 'bg-primary-green text-white'
                  : 'bg-white text-stone-600 hover:bg-primary-green/5 hover:text-on-background',
              ].join(' ')}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{personaMeta[persona].shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
