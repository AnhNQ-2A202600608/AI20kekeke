'use client';

import { useEffect, useRef, useState, type ButtonHTMLAttributes } from 'react';
import Image from 'next/image';
import { Check, ChevronDown, HelpCircle, LogIn, LogOut, UserRound } from 'lucide-react';
import { getAllowedPersonas, type PersonaType } from '@/lib/dashboard-tabs';
import { FIRST_RUN_TOUR_EVENT } from '@/lib/onboarding/first-run-storage';
import { QUIZ_FIRST_RUN_TOUR_EVENT, resetQuizFirstRun } from '@/lib/onboarding/quiz-first-run-storage';

interface AppProfileShortcutProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  avatarSrc?: string;
  displayName?: string;
  initial?: string;
  isActive?: boolean;
  label?: string;
  loggedIn?: boolean;
  mssv?: string;
  onLogOut?: () => void;
  onOpenLogin?: () => void;
  onOpenProfile?: () => void;
  role?: string;
  roleLabel?: string;
  selectedPersona?: PersonaType;
  setPersona?: (persona: PersonaType) => void;
  userId?: string | null;
}

const personaLabels: Record<PersonaType, string> = {
  student: 'Học viên',
  mentor: 'Giảng viên',
  btc: 'BTC',
};

function getRoleLabel(persona?: PersonaType, fallback?: string) {
  if (fallback) return fallback;
  return personaLabels[persona || 'student'];
}

export function AppProfileShortcut({
  avatarSrc = '/mascot/edo/edo-sofi-shoulder-companion.webp',
  displayName,
  initial,
  isActive = false,
  label = 'Mở hồ sơ người dùng',
  loggedIn = true,
  mssv,
  onLogOut,
  onOpenLogin,
  onOpenProfile,
  role,
  roleLabel,
  selectedPersona = 'student',
  setPersona,
  userId,
  className = '',
  type = 'button',
  ...props
}: AppProfileShortcutProps) {
  const { onClick, ...buttonProps } = props;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const normalizedInitial = (initial || displayName)?.trim().charAt(0).toUpperCase();
  const profileName = displayName?.trim() || 'Hồ sơ học viên';
  const resolvedRoleLabel = getRoleLabel(selectedPersona, roleLabel);
  const allowedPersonas = getAllowedPersonas(role);
  const canSwitchPersona = Boolean(setPersona) && allowedPersonas.length > 1;

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleOpenProfile = () => {
    setOpen(false);
    onOpenProfile?.();
  };

  const handleLogOut = () => {
    setOpen(false);
    onLogOut?.();
  };

  const handleOpenLogin = () => {
    setOpen(false);
    onOpenLogin?.();
  };

  const handleOpenFirstRunGuide = () => {
    setOpen(false);
    resetQuizFirstRun(userId);
    window.dispatchEvent(new Event(FIRST_RUN_TOUR_EVENT));
    window.dispatchEvent(new Event(QUIZ_FIRST_RUN_TOUR_EVENT));
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type={type}
        className={[
          'group inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border px-1 shadow-sm transition',
          'sm:w-auto sm:min-w-[11.25rem] sm:max-w-[14rem] sm:justify-start sm:px-2.5',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25 active:scale-95',
          isActive
            ? 'border-primary-green-dark bg-primary-green text-white'
            : 'border-gray-border bg-white text-on-background hover:border-primary-green/35 hover:bg-white',
          className,
        ].join(' ')}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={label}
        onClick={(event) => {
          event.stopPropagation();
          onClick?.(event);
          setOpen((value) => !value);
        }}
        title={label}
        {...buttonProps}
      >
        <span
          className={[
            'relative grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full transition',
            isActive
              ? 'bg-white/20 text-white'
              : 'bg-primary-green/10 text-primary-green-dark group-hover:bg-primary-green/15',
          ].join(' ')}
          aria-hidden="true"
        >
          {avatarSrc ? (
            <Image
              src={avatarSrc}
              alt=""
              width={56}
              height={56}
              className="h-full w-full object-contain object-bottom"
            />
          ) : (
            <UserRound className="h-4.5 w-4.5 stroke-[2.25]" />
          )}
        </span>

        <span className="hidden min-w-0 flex-1 text-left leading-none sm:block">
          <span className="block truncate font-fraunces text-body-dense font-black leading-tight text-current">
            {profileName}
          </span>
          <span
            className={[
              'mt-0.5 block truncate font-mono text-kicker-micro font-black uppercase leading-none tracking-wide',
              isActive ? 'text-white/80' : 'text-primary-green-dark',
            ].join(' ')}
          >
            {resolvedRoleLabel}
            {normalizedInitial ? <span className="sr-only"> {normalizedInitial}</span> : null}
          </span>
        </span>

        <ChevronDown
          className={[
            'hidden h-3.5 w-3.5 shrink-0 stroke-[2.5] transition sm:block',
            open ? 'rotate-180' : '',
            isActive ? 'text-white/80' : 'text-stone-400',
          ].join(' ')}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[17.5rem] rounded-2xl border border-gray-border bg-white p-2.5 text-left shadow-xl shadow-stone-900/10"
          role="menu"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-surface-container-low px-2.5 py-2">
            <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-primary-green/15 bg-primary-green/10 text-primary-green-dark">
              {avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt=""
                  width={80}
                  height={80}
                  className="h-full w-full object-contain object-bottom"
                />
              ) : (
                <UserRound className="h-5 w-5" aria-hidden="true" />
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-fraunces text-sm font-black leading-tight text-on-background">
                {profileName}
              </span>
              <span className="mt-0.5 block truncate text-kicker-micro font-black uppercase tracking-wider text-stone-500">
                {[mssv, role ? role.toUpperCase() : resolvedRoleLabel].filter(Boolean).join(' · ')}
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={handleOpenProfile}
            className="flex min-h-9 w-full cursor-pointer items-center justify-between rounded-xl px-3 text-xs font-black text-stone-700 transition hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/20"
            role="menuitem"
          >
            Xem hồ sơ
            <UserRound className="h-4 w-4 text-primary-green-dark" aria-hidden="true" />
          </button>

          {selectedPersona === 'student' ? (
            <button
              type="button"
              onClick={handleOpenFirstRunGuide}
              className="flex min-h-9 w-full cursor-pointer items-center justify-between rounded-xl px-3 text-xs font-black text-stone-700 transition hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/20"
              role="menuitem"
            >
              Xem hướng dẫn app & quiz
              <HelpCircle className="h-4 w-4 text-primary-green-dark" aria-hidden="true" />
            </button>
          ) : null}

          {canSwitchPersona ? (
            <>
              <div className="my-2 h-px bg-gray-border" aria-hidden="true" />
              <p className="px-3 pb-1 text-kicker-micro font-black uppercase tracking-widest text-stone-400">
                Chuyển vai trò
              </p>
              <div className="grid gap-1">
                {allowedPersonas.map((persona) => {
                  const isSelected = selectedPersona === persona;
                  return (
                    <button
                      key={persona}
                      type="button"
                      onClick={() => {
                        setPersona?.(persona);
                        setOpen(false);
                      }}
                      className={[
                        'flex min-h-9 w-full cursor-pointer items-center justify-between rounded-xl px-3 text-xs font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/20',
                        isSelected
                          ? 'bg-primary-green text-white'
                          : 'text-stone-600 hover:bg-surface-container-low',
                      ].join(' ')}
                      role="menuitemradio"
                      aria-checked={isSelected}
                    >
                      {personaLabels[persona]}
                      {isSelected ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}

          <div className="my-2 h-px bg-gray-border" aria-hidden="true" />
          {loggedIn ? (
            <button
              type="button"
              onClick={handleLogOut}
              className="flex min-h-9 w-full cursor-pointer items-center justify-between rounded-xl px-3 text-xs font-black text-stone-600 transition hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/20"
              role="menuitem"
            >
              Đăng xuất
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenLogin}
              className="flex min-h-9 w-full cursor-pointer items-center justify-between rounded-xl px-3 text-xs font-black text-primary-green-dark transition hover:bg-primary-green/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/20"
              role="menuitem"
            >
              Đăng nhập / Tạo hồ sơ
              <LogIn className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default AppProfileShortcut;
