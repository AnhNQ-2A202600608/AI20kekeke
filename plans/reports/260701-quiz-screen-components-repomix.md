This file is a merged representation of a subset of the codebase, containing specifically included files and files not matching ignore patterns, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of a subset of the repository's contents that is considered the most important context.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Only files matching these patterns are included: frontend/app/components/quiz-app-shell.tsx, frontend/app/components/quiz-workspace.tsx, frontend/app/hooks/useQuizSession.ts, frontend/app/hooks/useSocraticSidebar.ts, frontend/app/hooks/useSurveyHandlers.ts, frontend/components/quiz/**/*.tsx, frontend/components/app/*.tsx, frontend/components/learning/learning-brand-mark.tsx, frontend/components/mascot/**/*, frontend/components/dashboard/socratic-chat/components/ai-message-item.tsx, frontend/lib/dashboard-tabs.ts, frontend/lib/adaptive/api-client.ts, frontend/app/globals.css, frontend/package.json, frontend/tsconfig.json, frontend/next.config.ts
- Files matching these patterns are excluded: **/*.png, **/*.jpg, **/*.jpeg, **/*.webp, **/*.svg, **/node_modules/**, .env, .env.*
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
frontend/app/components/quiz-app-shell.tsx
frontend/app/components/quiz-workspace.tsx
frontend/app/globals.css
frontend/app/hooks/useQuizSession.ts
frontend/app/hooks/useSocraticSidebar.ts
frontend/app/hooks/useSurveyHandlers.ts
frontend/components/app/app-metric-pill.tsx
frontend/components/app/app-profile-shortcut.tsx
frontend/components/app/app-top-nav.tsx
frontend/components/app/elo-history-popover.tsx
frontend/components/app/streak-popover.tsx
frontend/components/app/xp-popover.tsx
frontend/components/dashboard/socratic-chat/components/ai-message-item.tsx
frontend/components/learning/learning-brand-mark.tsx
frontend/components/mascot/index.ts
frontend/components/mascot/sofi-expression-avatar.tsx
frontend/components/mascot/sofi-mascot-assets.ts
frontend/components/mascot/sofi-state-mascot.tsx
frontend/components/mascot/use-sofi-mascot-controller.ts
frontend/components/quiz/adaptive-admin-dashboard.tsx
frontend/components/quiz/adaptive-challenge-info.tsx
frontend/components/quiz/loading-questions-card.tsx
frontend/components/quiz/quiz-question-view.tsx
frontend/components/quiz/quiz-results.tsx
frontend/components/quiz/socratic-sidebar-view.tsx
frontend/lib/adaptive/api-client.ts
frontend/lib/dashboard-tabs.ts
frontend/next.config.ts
frontend/package.json
frontend/tsconfig.json
```

# Files

## File: frontend/components/quiz/loading-questions-card.tsx
````typescript
import { Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export function LoadingQuestionsCard() {
  return (
    <motion.div
      key="loading-questions"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="w-full p-8 md:p-12 rounded-2xl bg-white border border-gray-border shadow-sm flex flex-col items-center justify-center space-y-4 text-center min-h-[350px] font-be-vietnam-pro"
    >
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-primary-green/10 border-t-primary-green animate-spin" />
        <div className="absolute inset-2 bg-primary-green/10 rounded-full flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary-green animate-pulse" />
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-on-background font-fraunces">Đang tải câu hỏi...</h3>
        <p className="text-[10px] text-stone-400 font-mono">Hệ thống đang nạp dữ liệu bài học</p>
      </div>
    </motion.div>
  );
}
````

## File: frontend/tsconfig.json
````json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "./*"
      ],
      "collections/*": [
        "./.source/*"
      ]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
````

## File: frontend/app/hooks/useSurveyHandlers.ts
````typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { trackQuizEvent } from '@/lib/analytics';

interface SurveyRatings {
  [setId: string]: {
    understanding: number;
    utility: number;
    personalized: number;
  };
}

export function useSurveyHandlers(
  activeSetId: string,
  activeSet: any,
  totalQuestions: number
) {
  // Survey states linked by activeSetId
  const [preQuizRatings, setPreQuizRatings] = useState<{ [setId: string]: number }>({});
  const [preQuizSubmitted, setPreQuizSubmitted] = useState<{ [setId: string]: boolean }>({});
  
  // Post-quiz survey states linked by activeSetId
  const [postRatings, setPostRatings] = useState<SurveyRatings>({});
  const [postQuizSubmitted, setPostQuizSubmitted] = useState<{ [setId: string]: boolean }>({});
  const [preQuizComments, setPreQuizComments] = useState<{ [setId: string]: string }>({});
  const [postQuizComments, setPostQuizComments] = useState<{ [setId: string]: string }>({});
  
  const [waitlistEmail, setWaitlistEmail] = useState<string>('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState<boolean>(false);
  const [showPreComment, setShowPreComment] = useState<boolean>(false);
  
  // Session survey mapping ID
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [copiedShareLink, setCopiedShareLink] = useState<boolean>(false);

  // Load pre-quiz submission states from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPreSubmitted = localStorage.getItem('edugap_pre_submitted');
      if (savedPreSubmitted) {
        try {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setPreQuizSubmitted(JSON.parse(savedPreSubmitted));
        } catch (e) {
          console.error('Failed to parse pre-quiz submission states:', e);
        }
      }
    }
  }, []);

  const getCompactQuizAnalyticsProperties = useCallback(() => ({
    set_id: activeSetId,
    difficulty: activeSet?.difficulty || null,
    question_count: totalQuestions
  }), [activeSet, activeSetId, totalQuestions]);

  const getShareUrl = useCallback(() => {
    if (typeof window === 'undefined') return '';
    const slug = activeSetId === 'react-loop-basics' ? 'design-pattern-react' : activeSetId;
    return `${window.location.origin}${window.location.pathname}?set=${slug}`;
  }, [activeSetId]);

  const handleCopyShareLink = useCallback((source: string) => {
    if (typeof navigator === 'undefined') return;
    navigator.clipboard.writeText(getShareUrl());
    trackQuizEvent('share_link_copied', {
      set_id: activeSetId,
      source
    });
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2000);
  }, [activeSetId, getShareUrl]);

  // Supabase submission handlers
  const handlePreQuizSubmit = useCallback(async () => {
    const rating = preQuizRatings[activeSetId];
    const comment = preQuizComments[activeSetId] || '';
    if (!rating) return;
    
    trackQuizEvent('pre_quiz_submitted', {
      ...getCompactQuizAnalyticsProperties(),
      rating_pre: rating,
      has_comment: comment.trim().length > 0
    });
    
    const updatedPre = { ...preQuizSubmitted, [activeSetId]: true };
    setPreQuizSubmitted(updatedPre);
    localStorage.setItem('edugap_pre_submitted', JSON.stringify(updatedPre));
    
    try {
      const { data, error } = await supabase
        .from('surveys')
        .insert({
          set_id: activeSetId,
          rating_pre: rating,
          comment_pre: comment
        })
        .select('id')
        .single();
        
      if (error) {
        console.error('Failed to submit pre-quiz survey to Supabase:', error);
      } else if (data) {
        setSubmissionId(data.id);
      }
    } catch (err) {
      console.error('Failed to submit pre-quiz survey to Supabase:', err);
    }
  }, [activeSetId, preQuizRatings, preQuizComments, preQuizSubmitted, getCompactQuizAnalyticsProperties]);

  const handleWaitlistSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail || !waitlistEmail.includes('@')) return;
    
    trackQuizEvent('waitlist_submitted', {
      set_id: activeSetId,
      has_email: true
    });
    setWaitlistSubmitted(true);
    
    try {
      if (submissionId) {
        const { error } = await supabase
          .from('surveys')
          .update({
            email: waitlistEmail
          })
          .eq('id', submissionId);
          
        if (error) {
          console.error('Failed to update waitlist email in Supabase:', error);
        }
      } else {
        const { data, error } = await supabase
          .from('surveys')
          .insert({
            set_id: activeSetId,
            email: waitlistEmail
          })
          .select('id')
          .single();
          
        if (error) {
          console.error('Failed to insert waitlist email to Supabase:', error);
        } else if (data) {
          setSubmissionId(data.id);
        }
      }
    } catch (err) {
      console.error('Failed to submit waitlist email to Supabase:', err);
    }
  }, [activeSetId, waitlistEmail, submissionId]);

  const handlePostQuizSubmit = useCallback(async () => {
    const ratings = postRatings[activeSetId];
    const comment = postQuizComments[activeSetId] || '';
    if (!ratings || !ratings.understanding || !ratings.utility || !ratings.personalized) return;
    
    trackQuizEvent('post_quiz_submitted', {
      set_id: activeSetId,
      understanding: ratings.understanding,
      utility: ratings.utility,
      personalized: ratings.personalized,
      has_comment: comment.trim().length > 0
    });
    setPostQuizSubmitted(prev => ({ ...prev, [activeSetId]: true }));
    
    try {
      if (submissionId) {
        const { error } = await supabase
          .from('surveys')
          .update({
            rating_understanding: ratings.understanding,
            rating_utility: ratings.utility,
            rating_personalized: ratings.personalized,
            comment_post: comment
          })
          .eq('id', submissionId);
          
        if (error) {
          console.error('Failed to update post-quiz survey in Supabase:', error);
        }
      } else {
        const { data, error } = await supabase
          .from('surveys')
          .insert({
            set_id: activeSetId,
            rating_understanding: ratings.understanding,
            rating_utility: ratings.utility,
            rating_personalized: ratings.personalized,
            comment_post: comment
          })
          .select('id')
          .single();
          
        if (error) {
          console.error('Failed to insert post-quiz survey to Supabase:', error);
        } else if (data) {
          setSubmissionId(data.id);
        }
      }
    } catch (err) {
      console.error('Failed to submit post-quiz survey to Supabase:', err);
    }
  }, [activeSetId, postRatings, postQuizComments, submissionId]);

  const resetSurveys = useCallback((setId: string) => {
    setSubmissionId(null);
    setWaitlistSubmitted(false);
    setWaitlistEmail('');
    setShowPreComment(false);

    setPostQuizSubmitted(prev => {
      const copy = { ...prev };
      delete copy[setId];
      return copy;
    });
    setPreQuizSubmitted(prev => {
      const copy = { ...prev };
      delete copy[setId];
      // Sync to local storage
      localStorage.setItem('edugap_pre_submitted', JSON.stringify(copy));
      return copy;
    });
    setPreQuizRatings(prev => {
      const copy = { ...prev };
      delete copy[setId];
      return copy;
    });
    setPreQuizComments(prev => {
      const copy = { ...prev };
      delete copy[setId];
      return copy;
    });
    setPostRatings(prev => {
      const copy = { ...prev };
      delete copy[setId];
      return copy;
    });
    setPostQuizComments(prev => {
      const copy = { ...prev };
      delete copy[setId];
      return copy;
    });
  }, []);

  return {
    preQuizRatings,
    setPreQuizRatings,
    preQuizSubmitted,
    setPreQuizSubmitted,
    postRatings,
    setPostRatings,
    postQuizSubmitted,
    setPostQuizSubmitted,
    preQuizComments,
    setPreQuizComments,
    postQuizComments,
    setPostQuizComments,
    waitlistEmail,
    setWaitlistEmail,
    waitlistSubmitted,
    setWaitlistSubmitted,
    showPreComment,
    setShowPreComment,
    submissionId,
    setSubmissionId,
    copiedShareLink,
    handleCopyShareLink,
    handlePreQuizSubmit,
    handleWaitlistSubmit,
    handlePostQuizSubmit,
    resetSurveys,
    getShareUrl
  };
}
````

## File: frontend/components/app/app-metric-pill.tsx
````typescript
'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export type AppMetricTone = 'streak' | 'xp' | 'elo';

interface AppMetricPillProps {
  children: ReactNode;
  className?: string;
  isOpen: boolean;
  label: string;
  onOpenChange: (open: boolean) => void;
  panel: ReactNode;
  tone: AppMetricTone;
}

const toneClassName: Record<AppMetricTone, string> = {
  streak: 'border-accent-orange/20 hover:border-accent-orange/35 focus-visible:ring-accent-orange/20',
  xp: 'border-primary-green/20 hover:border-primary-green/35 focus-visible:ring-primary-green/20',
  elo: 'border-primary-blue/20 hover:border-primary-blue/35 focus-visible:ring-primary-blue/20',
};

export function AppMetricPill({
  children,
  className,
  isOpen,
  label,
  onOpenChange,
  panel,
  tone,
}: AppMetricPillProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onOpenChange]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label={label}
        onClick={() => onOpenChange(!isOpen)}
        className={cn(
          'inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border bg-white px-3 text-xs font-black text-on-background shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 active:translate-y-0',
          toneClassName[tone],
          className,
        )}
      >
        {children}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.55rem)] z-[90] w-[18rem] rounded-2xl border border-gray-border bg-white p-3 text-left shadow-2xl shadow-stone-950/15">
          {panel}
        </div>
      ) : null}
    </div>
  );
}

export default AppMetricPill;
````

## File: frontend/components/app/app-profile-shortcut.tsx
````typescript
'use client';

import { useEffect, useRef, useState, type ButtonHTMLAttributes } from 'react';
import Image from 'next/image';
import { Check, ChevronDown, LogIn, LogOut, UserRound } from 'lucide-react';
import { getAllowedPersonas, type PersonaType } from '@/lib/dashboard-tabs';

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
          <span className="block truncate font-fraunces text-[13px] font-black leading-tight text-current">
            {profileName}
          </span>
          <span
            className={[
              'mt-0.5 block truncate font-mono text-[9px] font-black uppercase leading-none tracking-wide',
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
              <span className="mt-0.5 block truncate text-[9px] font-black uppercase tracking-wider text-stone-500">
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

          {canSwitchPersona ? (
            <>
              <div className="my-2 h-px bg-gray-border" aria-hidden="true" />
              <p className="px-3 pb-1 text-[9px] font-black uppercase tracking-widest text-stone-400">
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
````

## File: frontend/components/app/streak-popover.tsx
````typescript
'use client';

import { CalendarDays, Flame } from 'lucide-react';

interface StreakPopoverProps {
  activeDays?: string[];
  streak: number;
}

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const makeLastSevenDays = () => {
  const today = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return {
      key: formatDateKey(date),
      label: date.toLocaleDateString('vi-VN', { weekday: 'short' }).replace('Th ', 'T'),
    };
  });
};

export function StreakPopover({ activeDays = [], streak }: StreakPopoverProps) {
  const activeDaySet = new Set(activeDays);
  const todayKey = formatDateKey(new Date());
  const hasStudiedToday = activeDaySet.has(todayKey);
  const lastSevenDays = makeLastSevenDays();

  return (
    <div>
      <div className="flex items-start gap-2.5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-accent-orange/20 bg-accent-orange-light/20 text-orange-500">
          <Flame className="h-5 w-5 fill-orange-400" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-600">Streak hiện có</p>
          <p className="mt-0.5 text-xl font-black leading-tight text-on-background">{streak} ngày</p>
          <p className="mt-1 text-[11px] font-bold leading-4 text-stone-500">
            {hasStudiedToday ? 'Hôm nay đã giữ streak.' : 'Học một phiên ngắn để giữ streak hôm nay.'}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-gray-border bg-surface-container-low p-2.5">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
          7 ngày gần nhất
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {lastSevenDays.map((day) => {
            const isActive = activeDaySet.has(day.key);
            return (
              <div key={day.key} className="text-center">
                <div
                  className={[
                    'mx-auto grid h-7 w-7 place-items-center rounded-full border text-[10px] font-black',
                    isActive
                      ? 'border-accent-orange/30 bg-orange-100 text-orange-600'
                      : 'border-gray-border bg-white text-stone-300',
                  ].join(' ')}
                  aria-label={`${day.label}: ${isActive ? 'có học' : 'chưa học'}`}
                >
                  {isActive ? '✓' : '·'}
                </div>
                <p className="mt-1 text-[8px] font-bold text-stone-400">{day.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default StreakPopover;
````

## File: frontend/components/app/xp-popover.tsx
````typescript
'use client';

import { Trophy, Zap } from 'lucide-react';

interface XpPopoverProps {
  xp: number;
}

function getLevel(xp: number) {
  const safeXp = Math.max(0, xp || 0);
  const level = Math.max(1, Math.floor(safeXp / 1000) + 1);
  const currentLevelXp = (level - 1) * 1000;
  const nextLevelXp = level * 1000;
  const progress = Math.round(((safeXp - currentLevelXp) / 1000) * 100);
  return { currentLevelXp, level, nextLevelXp, progress };
}

export function XpPopover({ xp }: XpPopoverProps) {
  const level = getLevel(xp);

  return (
    <div>
      <div className="flex items-start gap-2.5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-primary-green/20 bg-primary-green/10 text-primary-green-dark">
          <Zap className="h-5 w-5 fill-primary-green" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary-green-dark">XP hiện có</p>
          <p className="mt-0.5 text-xl font-black leading-tight text-on-background">{xp.toLocaleString('vi-VN')} XP</p>
          <p className="mt-1 text-[11px] font-bold leading-4 text-stone-500">
            XP tăng khi hoàn thành bài luyện và giữ nhịp học đều.
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-primary-green/15 bg-primary-green/5 p-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-primary-green-dark">
            <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
            Level {level.level}
          </div>
          <span className="font-mono text-[10px] font-black text-stone-500">
            {level.progress}%
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white ring-1 ring-primary-green/10">
          <div className="h-full rounded-full bg-primary-green" style={{ width: `${level.progress}%` }} />
        </div>
        <p className="mt-2 text-[10px] font-bold text-stone-500">
          {xp.toLocaleString('vi-VN')} / {level.nextLevelXp.toLocaleString('vi-VN')} XP tới level kế tiếp
        </p>
      </div>
    </div>
  );
}

export default XpPopover;
````

## File: frontend/components/mascot/sofi-mascot-assets.ts
````typescript
export type SofiMascotState =
  | 'idle'
  | 'thinking'
  | 'correct'
  | 'wrong'
  | 'coach'
  | 'mastery'
  | 'loading'
  | 'soft_error';

export type SofiMascotOneShotState = Exclude<SofiMascotState, 'idle' | 'loading'>;

export type SofiMascotAsset = {
  state: SofiMascotState;
  fileName: string;
  alt: string;
  prompt: string;
  durationMs: number;
};

const MASCOT_BASE_PATH = '/mascot/sofi';

export const SOFI_MASCOT_ASSETS: Record<SofiMascotState, SofiMascotAsset> = {
  idle: {
    state: 'idle',
    fileName: 'edugap-fox-idle-welcome.webp',
    alt: 'Sofi the EduGap fox mascot welcoming the learner',
    prompt: 'Sẵn sàng học tiếp.',
    durationMs: 0,
  },
  thinking: {
    state: 'thinking',
    fileName: 'edugap-fox-thinking.webp',
    alt: 'Sofi the EduGap fox mascot thinking',
    prompt: 'Sofi đang chuẩn bị gợi ý.',
    durationMs: 1500,
  },
  correct: {
    state: 'correct',
    fileName: 'edugap-fox-correct-answer.webp',
    alt: 'Sofi the EduGap fox mascot celebrating a correct answer',
    prompt: 'Chính xác. Giữ nhịp này.',
    durationMs: 1400,
  },
  wrong: {
    state: 'wrong',
    fileName: 'edugap-fox-wrong-answer-encouragement.webp',
    alt: 'Sofi the EduGap fox mascot encouraging another attempt',
    prompt: 'Chưa đúng. Thử tách bài thành bước nhỏ hơn.',
    durationMs: 1600,
  },
  coach: {
    state: 'coach',
    fileName: 'edugap-fox-quiz-coach.webp',
    alt: 'Sofi the EduGap fox mascot coaching the learner',
    prompt: 'Nhìn vào quan hệ giữa khái niệm và câu hỏi.',
    durationMs: 1700,
  },
  mastery: {
    state: 'mastery',
    fileName: 'edugap-fox-level-up-mastery.webp',
    alt: 'Sofi the EduGap fox mascot celebrating mastery',
    prompt: 'Đã đạt mastery cho phần này.',
    durationMs: 2200,
  },
  loading: {
    state: 'loading',
    fileName: 'edugap-fox-loading-reading.webp',
    alt: 'Sofi the EduGap fox mascot reading while loading',
    prompt: 'Đang tải dữ liệu học tập...',
    durationMs: 0,
  },
  soft_error: {
    state: 'soft_error',
    fileName: 'edugap-fox-error-apology.webp',
    alt: 'Sofi the EduGap fox mascot apologizing for a recoverable issue',
    prompt: 'Có lỗi nhẹ, thử lại là được.',
    durationMs: 1400,
  },
};

export const PRELOAD_SOFI_MASCOT_STATES: SofiMascotState[] = [
  'idle',
  'loading',
  'thinking',
  'correct',
  'wrong',
];

export function getSofiMascotSrc(
  state: SofiMascotState,
  size: 512 | 1024 = 512,
) {
  return `${MASCOT_BASE_PATH}/${size}/${SOFI_MASCOT_ASSETS[state].fileName}`;
}

export function getSofiMascotSrcSet(state: SofiMascotState) {
  return `${getSofiMascotSrc(state, 512)} 512w, ${getSofiMascotSrc(state, 1024)} 1024w`;
}

export function preloadSofiMascotAssets(states = PRELOAD_SOFI_MASCOT_STATES) {
  if (typeof window === 'undefined') return;

  states.forEach((state) => {
    const image = new Image();
    image.src = getSofiMascotSrc(state, 512);
  });
}
````

## File: frontend/components/mascot/sofi-state-mascot.tsx
````typescript
'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';
import {
  SOFI_MASCOT_ASSETS,
  getSofiMascotSrc,
  type SofiMascotState,
} from './sofi-mascot-assets';

type SofiStateMascotProps = {
  state?: SofiMascotState;
  size?: 'sm' | 'md' | 'lg';
  showPrompt?: boolean;
  className?: string;
};

const sizeClasses = {
  sm: 'w-24 sm:w-28',
  md: 'w-36 sm:w-44',
  lg: 'w-52 sm:w-64',
};

const stateMotion = {
  idle: {
    y: [0, -5, 0],
    rotate: [-0.5, 0.5, -0.5],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const },
  },
  thinking: {
    y: [0, -4, 0],
    rotate: [-1, 1, 0],
    transition: { duration: 1.5, ease: 'easeInOut' as const },
  },
  correct: {
    y: [8, -14, 0],
    scale: [0.98, 1.05, 1],
    transition: { duration: 0.65, ease: 'easeOut' as const },
  },
  wrong: {
    rotate: [0, -2, 1.2, 0],
    transition: { duration: 0.75, ease: 'easeOut' as const },
  },
  coach: {
    x: [0, 5, 0],
    rotate: [0, 1, 0],
    transition: { duration: 0.9, ease: 'easeOut' as const },
  },
  mastery: {
    y: [10, -18, 0],
    scale: [0.96, 1.08, 1],
    rotate: [-1, 1, 0],
    transition: { duration: 0.8, ease: 'easeOut' as const },
  },
  loading: {
    y: [0, -4, 0],
    scale: [1, 1.015, 1],
    transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' as const },
  },
  soft_error: {
    y: [0, 5, 0],
    rotate: [0, -1.5, 0],
    transition: { duration: 0.75, ease: 'easeOut' as const },
  },
};

export function SofiStateMascot({
  state = 'idle',
  size = 'md',
  showPrompt = false,
  className = '',
}: SofiStateMascotProps) {
  const reduceMotion = useReducedMotion();
  const asset = SOFI_MASCOT_ASSETS[state];
  const imageSizes = size === 'lg' ? '256px' : size === 'md' ? '176px' : '112px';

  return (
    <figure className={`inline-flex flex-col items-center gap-2 ${className}`}>
      <motion.div
        className="relative grid place-items-center"
        animate={reduceMotion ? undefined : stateMotion[state]}
        aria-live="polite"
      >
        <Image
          src={getSofiMascotSrc(state, 512)}
          sizes={imageSizes}
          alt={asset.alt}
          width={512}
          height={512}
          priority={state === 'idle' || state === 'loading'}
          className={`${sizeClasses[size]} h-auto select-none object-contain drop-shadow-[0_14px_22px_rgba(23,30,18,0.16)]`}
        />
      </motion.div>

      {showPrompt ? (
        <figcaption className="max-w-44 rounded-xl border-2 border-gray-border bg-white px-3 py-2 text-center font-be-vietnam-pro text-xs font-bold text-on-background shadow-sm">
          {asset.prompt}
        </figcaption>
      ) : null}
    </figure>
  );
}
````

## File: frontend/components/mascot/use-sofi-mascot-controller.ts
````typescript
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  SOFI_MASCOT_ASSETS,
  type SofiMascotOneShotState,
  type SofiMascotState,
  preloadSofiMascotAssets,
} from './sofi-mascot-assets';

type SofiMascotControllerOptions = {
  initialState?: SofiMascotState;
  preload?: boolean;
};

export type SofiMascotController = {
  state: SofiMascotState;
  isLoading: boolean;
  send: (state: SofiMascotOneShotState) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
};

export function useSofiMascotController({
  initialState = 'idle',
  preload = true,
}: SofiMascotControllerOptions = {}): SofiMascotController {
  const [state, setState] = useState<SofiMascotState>(initialState);
  const [isLoading, setIsLoading] = useState(initialState === 'loading');
  const returnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearReturnTimer = useCallback(() => {
    if (!returnTimerRef.current) return;
    clearTimeout(returnTimerRef.current);
    returnTimerRef.current = null;
  }, []);

  useEffect(() => {
    if (preload) {
      preloadSofiMascotAssets();
    }

    return clearReturnTimer;
  }, [clearReturnTimer, preload]);

  const reset = useCallback(() => {
    clearReturnTimer();
    setIsLoading(false);
    setState('idle');
  }, [clearReturnTimer]);

  const setLoading = useCallback((loading: boolean) => {
    clearReturnTimer();
    setIsLoading(loading);
    setState(loading ? 'loading' : 'idle');
  }, [clearReturnTimer]);

  const send = useCallback((nextState: SofiMascotOneShotState) => {
    if (isLoading) {
      setState('loading');
      return;
    }

    clearReturnTimer();
    setState(nextState);

    const durationMs = SOFI_MASCOT_ASSETS[nextState].durationMs;
    returnTimerRef.current = setTimeout(() => {
      setState('idle');
      returnTimerRef.current = null;
    }, durationMs);
  }, [clearReturnTimer, isLoading]);

  return {
    state,
    isLoading,
    send,
    setLoading,
    reset,
  };
}
````

## File: frontend/components/quiz/adaptive-admin-dashboard.tsx
````typescript
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, CheckCircle2, Loader2, X, XCircle } from 'lucide-react';
import type { AdaptiveSubmitResult } from '@/lib/adaptive/api-client';
import type { ActivePracticeSession, Question, QuestionSet } from '@/lib/quiz/types';

type AnswerHistoryBySet = Record<
  string,
  Record<
    string,
    {
      selected?: string;
      essayAnswer?: string;
      isCorrect: boolean;
      hintCount?: number;
      adaptiveDecisionId?: string;
      submitResult?: AdaptiveSubmitResult;
    }
  >
>;

interface AdaptiveAdminDashboardProps {
  activePracticeSession: ActivePracticeSession | null;
  activeSet?: QuestionSet;
  activeSetId: string;
  answersHistory: AnswerHistoryBySet;
  currentQuestion: Question;
  currentQuestionIdx: number;
  isLoadingNextQuestion: boolean;
  questionsList: Question[];
  role?: string;
}

function formatNumber(value?: number | null, digits = 0) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'n/a';
  return value.toLocaleString('vi-VN', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function formatPercent(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'n/a';
  return `${Math.round(value * 100)}%`;
}

function metricDelta(oldValue?: number, newValue?: number, digits = 0) {
  if (typeof oldValue !== 'number' || typeof newValue !== 'number') return 'n/a';
  const delta = newValue - oldValue;
  const rounded = Number(delta.toFixed(digits));
  return `${rounded >= 0 ? '+' : ''}${formatNumber(rounded, digits)}`;
}

export function AdaptiveAdminDashboard({
  activePracticeSession,
  activeSet,
  activeSetId,
  answersHistory,
  currentQuestion,
  currentQuestionIdx,
  isLoadingNextQuestion,
  questionsList,
  role,
}: AdaptiveAdminDashboardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const isAdmin = role?.toLowerCase() === 'admin';
  const adaptive = currentQuestion.adaptive;
  const currentHistory = answersHistory[activeSetId]?.[currentQuestion.id];
  const latestSubmitted = useMemo(() => {
    const histories = Object.values(answersHistory[activeSetId] || {})
      .map((history) => history.submitResult)
      .filter(Boolean) as AdaptiveSubmitResult[];
    return histories.at(-1);
  }, [activeSetId, answersHistory]);

  const conceptElo = currentHistory?.submitResult?.new_elo
    ?? latestSubmitted?.new_elo
    ?? adaptive?.conceptElo
    ?? activePracticeSession?.startElo;
  const bktMastery = currentHistory?.submitResult?.new_bkt
    ?? latestSubmitted?.new_bkt
    ?? adaptive?.bktMasteryProbability;

  const timeline = useMemo(() => {
    const setHistory = answersHistory[activeSetId] || {};
    return questionsList
      .map((question, index) => ({
        index,
        question,
        history: setHistory[question.id],
      }))
      .filter((item) => item.history?.submitResult);
  }, [activeSetId, answersHistory, questionsList]);

  const nextQuestion = questionsList.find((question, index) => index > currentQuestionIdx && question.adaptive);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isAdmin || !adaptive) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label="Adaptive diagnostics"
        title="Adaptive diagnostics"
        onClick={() => setIsOpen((open) => !open)}
        className="grid h-9 w-9 place-items-center rounded-xl border border-primary-blue/20 bg-white text-primary-blue shadow-sm transition-colors hover:bg-primary-blue-light/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-blue/15"
      >
        <Activity className="h-4 w-4" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="fixed inset-x-3 bottom-3 z-[100] max-h-[78dvh] overflow-hidden rounded-2xl border border-stone-200 bg-white text-left shadow-2xl shadow-stone-950/20 sm:absolute sm:inset-auto sm:right-0 sm:top-[calc(100%+0.6rem)] sm:w-[38rem] sm:max-w-[calc(100vw-2rem)]">
          <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-4 py-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary-blue">Admin diagnostics</p>
              <h3 className="truncate text-sm font-black text-stone-900">{activeSet?.topic_title || activeSet?.title || activeSetId}</h3>
            </div>
            <button
              type="button"
              aria-label="Đóng adaptive diagnostics"
              onClick={() => setIsOpen(false)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-stone-400 transition-colors hover:bg-stone-50 hover:text-stone-700"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="custom-scrollbar max-h-[calc(78dvh-3.6rem)] overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Metric label="Concept Elo" value={formatNumber(conceptElo)} />
              <Metric label="Question Elo" value={formatNumber(adaptive.questionDifficultyElo)} />
              <Metric label="BKT" value={formatPercent(bktMastery)} />
              <Metric label="Expected" value={formatPercent(adaptive.expectedSuccess)} />
            </div>

            <section className="mt-4 rounded-xl border border-stone-200 p-3">
              <h4 className="text-xs font-black text-stone-850">Current recommendation</h4>
              <div className="mt-2 grid gap-1.5 text-[11px] font-bold text-stone-600 sm:grid-cols-2">
                <Row label="Concept" value={adaptive.conceptId} mono />
                <Row label="Question" value={adaptive.questionId} mono />
                <Row label="Decision" value={adaptive.decisionId} mono />
                <Row label="Candidates" value={formatNumber(adaptive.candidateCount)} />
                <Row label="Reward" value={formatNumber(adaptive.expectedReward, 3)} />
                <Row label="Session q" value={`${currentQuestionIdx + 1}/${activePracticeSession?.maxQuestions || questionsList.length}`} />
              </div>
            </section>

            <section className="mt-3 rounded-xl border border-stone-200 p-3">
              <h4 className="text-xs font-black text-stone-850">Learner model</h4>
              <div className="mt-2 grid gap-1.5 text-[11px] font-bold text-stone-600 sm:grid-cols-2">
                <Row
                  label="Elo change"
                  value={
                    currentHistory?.submitResult
                      ? `${formatNumber(currentHistory.submitResult.old_elo)} -> ${formatNumber(currentHistory.submitResult.new_elo)} (${metricDelta(currentHistory.submitResult.old_elo, currentHistory.submitResult.new_elo)})`
                      : formatNumber(conceptElo)
                  }
                />
                <Row
                  label="BKT change"
                  value={
                    currentHistory?.submitResult
                      ? `${formatPercent(currentHistory.submitResult.old_bkt)} -> ${formatPercent(currentHistory.submitResult.new_bkt)} (${metricDelta(currentHistory.submitResult.old_bkt * 100, currentHistory.submitResult.new_bkt * 100, 1)} pts)`
                      : formatPercent(bktMastery)
                  }
                />
                <Row label="State" value={currentHistory?.submitResult?.mastery_state || latestSubmitted?.mastery_state || 'n/a'} />
                <Row label="Weakness" value={String(currentHistory?.submitResult?.weakness_flag ?? latestSubmitted?.weakness_flag ?? 'n/a')} />
              </div>
            </section>

            <section className="mt-3 rounded-xl border border-stone-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-black text-stone-850">Session timeline</h4>
                <span className="rounded-full bg-stone-100 px-2 py-1 text-[10px] font-black text-stone-500">{timeline.length} submitted</span>
              </div>
              <div className="mt-2 space-y-1.5">
                {timeline.length > 0 ? timeline.map(({ index, question, history }) => {
                  const result = history.submitResult!;
                  const StatusIcon = result.is_correct ? CheckCircle2 : XCircle;
                  return (
                    <details key={question.id} className="rounded-lg border border-stone-100 bg-stone-50 px-2.5 py-2">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-[11px] font-black text-stone-700">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <StatusIcon className={`h-3.5 w-3.5 shrink-0 ${result.is_correct ? 'text-emerald-600' : 'text-rose-600'}`} />
                          <span>Q{index + 1}</span>
                          <span className="truncate font-mono text-stone-500">{question.adaptive?.questionId || question.id}</span>
                        </span>
                        <span className={result.new_elo >= result.old_elo ? 'text-emerald-600' : 'text-rose-600'}>
                          {metricDelta(result.old_elo, result.new_elo)}
                        </span>
                      </summary>
                      <div className="mt-2 grid gap-1 text-[10px] font-bold text-stone-500 sm:grid-cols-2">
                        <Row label="Elo" value={`${formatNumber(result.old_elo)} -> ${formatNumber(result.new_elo)}`} />
                        <Row label="BKT" value={`${formatPercent(result.old_bkt)} -> ${formatPercent(result.new_bkt)}`} />
                        <Row label="Hints" value={formatNumber(history.hintCount || 0)} />
                        <Row label="AI help" value="client false/server verified" />
                      </div>
                    </details>
                  );
                }) : (
                  <div className="rounded-lg border border-dashed border-stone-200 p-3 text-center text-[11px] font-bold text-stone-500">
                    Chưa submit câu adaptive nào trong phiên này.
                  </div>
                )}
              </div>
            </section>

            <section className="mt-3 rounded-xl border border-stone-200 p-3">
              <h4 className="text-xs font-black text-stone-850">Next recommendation</h4>
              <div className="mt-2 text-[11px] font-bold text-stone-600">
                {isLoadingNextQuestion ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-blue" />
                    Đang lấy câu tiếp theo
                  </span>
                ) : nextQuestion?.adaptive ? (
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    <Row label="Question" value={nextQuestion.adaptive.questionId} mono />
                    <Row label="Expected" value={formatPercent(nextQuestion.adaptive.expectedSuccess)} />
                  </div>
                ) : (
                  <span>Chưa có câu tiếp theo được prefetch hoặc phiên đã gần kết thúc.</span>
                )}
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-primary-blue/10 bg-primary-blue-light/25 p-2">
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-primary-blue">{label}</p>
      <p className="mt-1 truncate font-mono text-sm font-black text-stone-900">{value}</p>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <span className="text-stone-400">{label}: </span>
      <span className={mono ? 'break-all font-mono text-stone-650' : 'text-stone-650'}>{value}</span>
    </div>
  );
}

export default AdaptiveAdminDashboard;
````

## File: frontend/components/quiz/adaptive-challenge-info.tsx
````typescript
'use client';

import { useEffect, useRef, useState } from 'react';
import { Info, X } from 'lucide-react';

export function AdaptiveChallengeInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className="relative inline-flex shrink-0">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label="Vì sao hệ thống chọn câu này?"
        title="Vì sao hệ thống chọn câu này?"
        onClick={() => setIsOpen((open) => !open)}
        className="grid h-5 w-5 place-items-center rounded-full border border-primary-blue/25 bg-primary-blue-light/60 text-primary-blue shadow-sm transition-colors hover:bg-primary-blue-light focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-blue/15"
      >
        <Info className="h-3 w-3" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-[calc(100%+0.45rem)] z-[95] w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-primary-blue/15 bg-white p-3 text-left text-[11px] font-bold leading-relaxed text-stone-650 shadow-2xl shadow-stone-950/15">
          <div className="flex items-start justify-between gap-2">
            <p className="font-black text-stone-850">Vì sao là câu này?</p>
            <button
              type="button"
              aria-label="Đóng giải thích"
              onClick={() => setIsOpen(false)}
              className="grid h-6 w-6 shrink-0 place-items-center rounded-lg text-stone-400 transition-colors hover:bg-stone-50 hover:text-stone-700"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-1.5">
            Hệ thống chọn câu này vì nó đang vừa sức với phần bạn đang luyện.
            Nếu bạn làm đúng, bài sau có thể khó hơn một chút. Nếu bạn gặp khó,
            hệ thống sẽ chọn câu củng cố nền tảng hơn.
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default AdaptiveChallengeInfo;
````

## File: frontend/next.config.ts
````typescript
import { createMDX } from 'fumadocs-mdx/next';
import type {NextConfig} from 'next';

const disableDocs = process.env.DISABLE_DOCS === 'true';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  serverExternalPackages: [
    '@opentelemetry/sdk-node',
    '@opentelemetry/resources',
    '@traceloop/instrumentation-google-generativeai',
    '@posthog/ai/otel'
  ],
  typescript: {
    ignoreBuildErrors: false,
  },
  outputFileTracingIncludes: {
    '/api/guidebook/[slug]': ['./knowledge/**/*'],
    '/api/questions': ['./public/quiz-manifest.json', './public/quizzes/**/*'],
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
    ],
  },
  async rewrites() {
    return [
      // `/api/v1/*` is handled by app/api/v1/[...path]/route.ts so the
      // frontend can convert Supabase cookies into FastAPI bearer auth.
      // PostHog analytics proxy
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/array/:path*',
        destination: 'https://us-assets.i.posthog.com/array/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ];
  },
  skipTrailingSlashRedirect: true,
  output: 'standalone',
  transpilePackages: ['motion'],
  webpack: (config, {dev}) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ['**/.source/**'],
      };
    }
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify—file watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

// Vô hiệu hóa biên dịch tài liệu nếu biến môi trường DISABLE_DOCS=true
export default disableDocs ? nextConfig : createMDX()(nextConfig);
````

## File: frontend/components/app/app-top-nav.tsx
````typescript
'use client';

import { useState } from 'react';
import { Flame, Gauge, Zap } from 'lucide-react';
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
  displayName: string;
  eloHistoryEvents?: EloHistoryEvent[];
  initial: string;
  isEloHistoryLoading?: boolean;
  loggedIn?: boolean;
  mssv?: string;
  onLogOut?: () => void;
  onOpenLogin?: () => void;
  onOpenProfile?: () => void;
  role?: string;
  selectedPersona?: PersonaType;
  setPersona?: (persona: PersonaType) => void;
  streak: number;
  xp: number;
}

export function AppTopNav({
  activeDays,
  title,
  subtitle,
  averageElo,
  displayName,
  eloHistoryEvents,
  initial,
  isEloHistoryLoading,
  loggedIn,
  mssv,
  onLogOut,
  onOpenLogin,
  onOpenProfile,
  role,
  selectedPersona,
  setPersona,
  streak,
  xp,
}: AppTopNavProps) {
  const [openMetric, setOpenMetric] = useState<'streak' | 'xp' | 'elo' | null>(null);
  const masteryPercent = Math.max(0, Math.min(100, Math.round(((averageElo - 800) / 800) * 100)));

  return (
    <header className="mb-3 hidden min-h-[68px] shrink-0 items-center justify-between gap-5 border-b border-gray-border/70 pb-3 lg:flex">
      <div className="flex min-w-0 items-center gap-5">
        <LearningBrandMark compact />
        <div className="h-8 w-px shrink-0 bg-gray-border" aria-hidden="true" />
        <div className="min-w-0 text-left">
          <h1 className="truncate font-fraunces text-xl font-black leading-tight tracking-normal text-on-background">
            {title}
          </h1>
          <p className="mt-1 truncate text-xs font-bold text-stone-500">{subtitle}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
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
          label="Mở chi tiết độ vững kiến thức"
          onOpenChange={(open) => setOpenMetric(open ? 'elo' : null)}
          panel={(
            <EloHistoryPopover
              averageElo={averageElo}
              events={eloHistoryEvents}
              isLoading={isEloHistoryLoading}
            />
          )}
          tone="elo"
        >
          <Gauge className="h-4 w-4 text-primary-blue" aria-hidden="true" />
          Độ vững {masteryPercent}%
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
        />
      </div>
    </header>
  );
}

export default AppTopNav;
````

## File: frontend/components/app/elo-history-popover.tsx
````typescript
'use client';

import { Gauge, History, Loader2, TrendingDown, TrendingUp } from 'lucide-react';

export interface EloHistoryEvent {
  id: string;
  conceptTitle: string;
  delta: number;
  newElo: number;
  occurredAt: string;
  oldElo: number;
  source: 'practice' | 'review' | 'decay' | 'manual';
  note?: string;
}

interface EloHistoryPopoverProps {
  averageElo: number;
  events?: EloHistoryEvent[];
  isLoading?: boolean;
}

const sourceLabel: Record<EloHistoryEvent['source'], string> = {
  practice: 'Luyện tập',
  review: 'Ôn lại',
  decay: 'Suy giảm',
  manual: 'Điều chỉnh',
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

export function EloHistoryPopover({
  averageElo,
  events = [],
  isLoading = false,
}: EloHistoryPopoverProps) {
  const totalDelta = events.reduce((sum, event) => sum + event.delta, 0);
  const masteryPercent = Math.max(0, Math.min(100, Math.round(((averageElo - 800) / 800) * 100)));

  return (
    <div>
      <div className="flex items-start gap-2.5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-primary-blue/20 bg-sky-50 text-primary-blue">
          <Gauge className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary-blue">Độ vững hiện tại</p>
          <p className="mt-0.5 text-xl font-black leading-tight text-on-background">{masteryPercent}%</p>
          <p className="mt-1 text-[11px] font-bold leading-4 text-stone-500">
            Chỉ số tóm tắt theo các phần kiến thức bạn đã luyện, không phải điểm xếp hạng cá nhân.
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-primary-blue/15 bg-sky-50/70 p-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-primary-blue">
            <History className="h-3.5 w-3.5" aria-hidden="true" />
            Lịch sử tiến bộ
          </div>
          {events.length > 0 ? (
            <span className={['font-mono text-[10px] font-black', totalDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'].join(' ')}>
              {totalDelta >= 0 ? '+' : ''}{totalDelta}
            </span>
          ) : null}
        </div>

        <div className="mt-2 max-h-56 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="grid min-h-24 place-items-center rounded-xl border border-dashed border-primary-blue/20 bg-white text-center">
              <div>
                <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary-blue" aria-hidden="true" />
                <p className="mt-2 text-[11px] font-black text-stone-600">Đang tải lịch sử tiến bộ</p>
              </div>
            </div>
          ) : events.length > 0 ? (
            <div className="space-y-1.5">
              {events.map((event) => {
                const isGain = event.delta >= 0;
                const TrendIcon = isGain ? TrendingUp : TrendingDown;
                return (
                  <div key={event.id} className="rounded-xl border border-gray-border bg-white p-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-black text-on-background">{event.conceptTitle}</p>
                        <p className="mt-0.5 text-[9px] font-bold text-stone-500">
                          {formatDate(event.occurredAt)} · {sourceLabel[event.source]} · {event.oldElo} → {event.newElo}
                        </p>
                      </div>
                      <span className={['inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black', isGain ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'].join(' ')}>
                        <TrendIcon className="h-3 w-3" aria-hidden="true" />
                        {isGain ? '+' : ''}{event.delta}
                      </span>
                    </div>
                    {event.note ? <p className="mt-1 text-[10px] font-semibold leading-4 text-stone-500">{event.note}</p> : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-primary-blue/20 bg-white p-3 text-center">
              <p className="text-[11px] font-black text-on-background">Chưa có lịch sử tiến bộ</p>
              <p className="mt-1 text-[10px] font-semibold leading-4 text-stone-500">
                Khi có dữ liệu luyện tập theo concept, timeline sẽ hiển thị tại đây.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EloHistoryPopover;
````

## File: frontend/components/learning/learning-brand-mark.tsx
````typescript
'use client';

import Image from 'next/image';

interface LearningBrandMarkProps {
  compact?: boolean;
}

export function LearningBrandMark({ compact = false }: LearningBrandMarkProps) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Image
        src="/brand/edugap/logo-cropped.png"
        alt="EduGap"
        width={1892}
        height={425}
        priority
        className={compact ? 'h-8 w-auto object-contain' : 'h-12 w-auto object-contain'}
      />
    </div>
  );
}
````

## File: frontend/components/mascot/index.ts
````typescript
export {
  SOFI_MASCOT_ASSETS,
  PRELOAD_SOFI_MASCOT_STATES,
  getSofiMascotSrc,
  getSofiMascotSrcSet,
  preloadSofiMascotAssets,
  type SofiMascotAsset,
  type SofiMascotOneShotState,
  type SofiMascotState,
} from './sofi-mascot-assets';
export {
  useSofiMascotController,
  type SofiMascotController,
} from './use-sofi-mascot-controller';
export { SofiStateMascot } from './sofi-state-mascot';
export {
  SofiExpressionAvatar,
  type SofiExpressionName,
} from './sofi-expression-avatar';
````

## File: frontend/package.json
````json
{
  "name": "edugap",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "set DISABLE_DOCS=true&& node --max-old-space-size=1024 node_modules/next/dist/bin/next dev",
    "dev:lowmem": "set DISABLE_DOCS=true&& node --max-old-space-size=1024 node_modules/next/dist/bin/next dev --webpack --disable-source-maps --no-server-fast-refresh",
    "prebuild": "fumadocs-mdx",
    "build": "node --max-old-space-size=8192 node_modules/next/dist/bin/next build",
    "start:lowmem": "node --max-old-space-size=512 node_modules/next/dist/bin/next start",
    "start": "next start",
    "lint": "eslint .",
    "clean": "node -e \"const fs = require('fs'); fs.rmSync('.next', { recursive: true, force: true }); fs.rmSync('.source', { recursive: true, force: true });\""
  },
  "dependencies": {
    "@google/genai": "^2.4.0",
    "@hookform/resolvers": "^5.2.1",
    "@opentelemetry/resources": "^2.7.1",
    "@opentelemetry/sdk-node": "^0.218.0",
    "@posthog/ai": "^7.20.5",
    "@supabase/ssr": "^0.12.0",
    "@supabase/supabase-js": "^2.106.2",
    "@traceloop/instrumentation-google-generativeai": "^0.27.0",
    "@types/dagre": "^0.7.54",
    "@types/mdx": "^2.0.14",
    "@vercel/analytics": "^2.0.1",
    "@xyflow/react": "^12.11.0",
    "autoprefixer": "^10.4.21",
    "chart.js": "^4.5.1",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "dagre": "^0.8.5",
    "dayjs": "^1.11.21",
    "fumadocs-core": "16.10.4",
    "fumadocs-ui": "16.10.4",
    "katex": "^0.17.0",
    "lucide-react": "^0.553.0",
    "motion": "^12.23.24",
    "next": "16.2.7",
    "next-themes": "^0.4.6",
    "postcss": "^8.5.6",
    "posthog-js": "^1.378.1",
    "react": "^19.2.1",
    "react-chartjs-2": "^5.3.1",
    "react-dom": "^19.2.1",
    "recharts": "^3.8.1",
    "rehype-katex": "^7.0.1",
    "remark-math": "^6.0.0",
    "tailwind-merge": "^3.3.1",
    "zustand": "^5.0.3"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "4.1.11",
    "@tailwindcss/typography": "^0.5.19",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "9.39.1",
    "eslint-config-next": "16.0.8",
    "firebase-tools": "^15.0.0",
    "fumadocs-mdx": "15.0.12",
    "tailwindcss": "4.1.11",
    "tw-animate-css": "^1.4.0",
    "typescript": "5.9.3"
  }
}
````

## File: frontend/app/components/quiz-workspace.tsx
````typescript
'use client';

import { AnimatePresence } from 'motion/react';
import { useMemo } from 'react';
import { useQuizSession } from '../hooks/useQuizSession';
import { useSocraticSidebar } from '../hooks/useSocraticSidebar';
import { useSurveyHandlers } from '../hooks/useSurveyHandlers';

// Import our modular components
import { AppTopNav } from '@/components/app/app-top-nav';
import { LoadingQuestionsCard } from '@/components/quiz/loading-questions-card';
import { QuizQuestionView } from '@/components/quiz/quiz-question-view';
import { QuizResults } from '@/components/quiz/quiz-results';
import { SocraticSidebarView } from '@/components/quiz/socratic-sidebar-view';
import { useBoundStore } from '@/hooks/useBoundStore';

interface QuizWorkspaceProps {
  quiz: ReturnType<typeof useQuizSession>;
  aiSidebar: ReturnType<typeof useSocraticSidebar>;
  surveys: ReturnType<typeof useSurveyHandlers>;
}

export function QuizWorkspace({ quiz, aiSidebar, surveys }: QuizWorkspaceProps) {
  const {
    isLoadingQuestions,
    showFinishScreen,
    currentQuestion,
  } = quiz;
  const conceptMasteries = useBoundStore((state) => state.conceptMasteries);

  const canShowSocraticSheet = !!(
    !showFinishScreen &&
    !isLoadingQuestions &&
    currentQuestion
  );
  const averageElo = useMemo(() => {
    const eloValues = Object.values(conceptMasteries)
      .map((mastery) => Number(mastery?.elo))
      .filter((value) => Number.isFinite(value) && value > 0);

    if (eloValues.length === 0) return 1000;
    return Math.round(eloValues.reduce((sum, value) => sum + value, 0) / eloValues.length);
  }, [conceptMasteries]);

  const displayName = quiz.name || quiz.username || 'Học viên EduGap';
  const currentProgress = quiz.totalQuestions > 0
    ? Math.round(((quiz.currentQuestionIdx + 1) / quiz.totalQuestions) * 100)
    : 0;

  return (
    <div className="h-dvh min-h-dvh w-full bg-warm-cream flex flex-col overflow-hidden animate-in fade-in duration-300">
      <div className="shrink-0 px-3 pt-2 sm:px-4 lg:px-6 xl:px-8">
        <div className="mx-auto w-full max-w-[1420px]">
          <AppTopNav
            activeDays={quiz.activeDays}
            title={`Xin chào, ${displayName}`}
            subtitle={`${quiz.activeSet?.topic_title || quiz.activeSet?.title || quiz.activeSetId} - Câu ${quiz.currentQuestionIdx + 1}/${quiz.totalQuestions || 1}`}
            averageElo={averageElo}
            displayName={displayName}
            initial={displayName.trim().charAt(0).toUpperCase() || 'N'}
            loggedIn={quiz.loggedIn}
            mssv={quiz.mssv}
            onLogOut={quiz.logOut}
            onOpenProfile={() => {
              quiz.handleExitQuiz();
              quiz.setActiveTab('profile');
            }}
            role={quiz.role}
            selectedPersona={quiz.selectedPersona}
            setPersona={quiz.setPersona}
            streak={quiz.streak}
            xp={quiz.xp}
          />

          <div className="mb-1 flex items-center gap-2 rounded-xl border border-primary-green/10 bg-white/80 px-3 py-2 shadow-sm lg:hidden">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black text-on-background">
                {displayName}
              </p>
              <p className="truncate text-[10px] font-bold text-stone-500">
                Câu {quiz.currentQuestionIdx + 1}/{quiz.totalQuestions || 1} - {quiz.xp} XP - {quiz.streak || 0} ngày streak
              </p>
            </div>
            <span className="shrink-0 text-[10px] font-black text-primary-green-dark">{currentProgress}%</span>
          </div>
        </div>
      </div>

      {/* Main Quiz Content */}
      <main className="flex-1 w-full px-1.5 sm:px-4 md:px-6 xl:px-8 flex min-h-0 overflow-hidden">
        {/* Quiz content keeps a stable width; AI Tutor opens as an overlay sheet. */}
        <section className="h-full w-full max-w-[1420px] mx-auto pb-2 pt-1 sm:pb-3 md:pb-4 overflow-hidden flex flex-col">
          <div className="w-full flex-1 flex flex-col min-h-0">
            <AnimatePresence mode="wait">
              {isLoadingQuestions ? (
                <LoadingQuestionsCard />
              ) : !showFinishScreen ? (
                <QuizQuestionView
                  quiz={quiz}
                  aiSidebar={aiSidebar}
                  surveys={surveys}
                />
              ) : (
                // Results Screen
                <QuizResults
                  quiz={quiz}
                  surveys={surveys}
                />
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Right Panel & Mobile Drawer: Socratic AI Sidebar */}
        <SocraticSidebarView
          aiSidebar={aiSidebar}
          showSidebar={canShowSocraticSheet}
        />
      </main>
    </div>
  );
}
````

## File: frontend/components/mascot/sofi-expression-avatar.tsx
````typescript
'use client';

import Image from 'next/image';

export type SofiExpressionName =
  | 'calm'
  | 'happy'
  | 'thinking'
  | 'surprised'
  | 'wink'
  | 'worried'
  | 'thumbs-up'
  | 'laughing';

interface SofiExpressionAvatarProps {
  expression?: SofiExpressionName;
  size?: number;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}

export function SofiExpressionAvatar({
  expression = 'happy',
  size = 32,
  className = '',
  imageClassName = '',
  priority = false,
}: SofiExpressionAvatarProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary-green/20 bg-primary-green/10 shadow-sm ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      aria-hidden="true"
    >
      <Image
        src={`/mascot/sofi/expressions/sofi-${expression}.webp`}
        alt=""
        width={size}
        height={size}
        priority={priority}
        className={`h-full w-full object-contain ${imageClassName}`}
      />
    </span>
  );
}
````

## File: frontend/components/quiz/quiz-results.tsx
````typescript
'use client';

import { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Share2,
  Award,
  Star,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  X
} from 'lucide-react';
import { useQuizSession } from '../../app/hooks/useQuizSession';
import { useSurveyHandlers } from '../../app/hooks/useSurveyHandlers';
import { useBoundStore } from '@/hooks/useBoundStore';

interface QuizResultsProps {
  quiz: ReturnType<typeof useQuizSession>;
  surveys: ReturnType<typeof useSurveyHandlers>;
}

export function QuizResults({ quiz, surveys }: QuizResultsProps) {
  const { conceptMasteries } = useBoundStore();

  const {
    activeSetId,
    activeSet,
    totalQuestions,
    handleRestart,
    handleExitQuiz,
    getActiveSetCorrectCount,
    getIncorrectQuestions,
    answersHistory,
    activePracticeSession,
    devMode
  } = quiz;

  const {
    copiedShareLink,
    handleCopyShareLink,
    postQuizSubmitted,
    postRatings,
    postQuizComments,
    setPostRatings,
    setPostQuizComments,
    handlePostQuizSubmit
  } = surveys;

  const eloInfo = useMemo(() => {
    const backendResults = Object.values(answersHistory[activeSetId] || {})
      .map(answer => answer.submitResult)
      .filter(Boolean);

    if (backendResults.length > 0) {
      const first = backendResults[0]!;
      const last = backendResults[backendResults.length - 1]!;
      return {
        oldElo: Math.round(first.old_elo),
        newElo: Math.round(last.new_elo),
        delta: Math.round(last.new_elo - first.old_elo)
      };
    }

    const currentElo = conceptMasteries[activeSetId]?.elo || activePracticeSession?.startElo || 1200;

    return {
      oldElo: currentElo,
      newElo: currentElo,
      delta: 0
    };
  }, [conceptMasteries, activeSetId, activePracticeSession?.startElo, answersHistory]);

  const correctCount = getActiveSetCorrectCount();
  const incorrectQuestions = getIncorrectQuestions();

  return (
    <motion.div
      key="result-dashboard"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative flex h-full min-h-0 flex-grow flex-col overflow-hidden rounded-2xl border-2 border-primary-green/15 border-b-[5px] bg-white p-5 shadow-sm font-be-vietnam-pro md:p-6"
    >
      <button
        onClick={handleExitQuiz}
        className="absolute left-4 top-4 z-10 flex cursor-pointer items-center justify-center rounded-lg border border-gray-border bg-white p-2 text-stone-500 shadow-sm transition-colors hover:bg-surface-container-low hover:text-on-background"
        title="Quay lại lộ trình"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => handleCopyShareLink('results')}
        className="absolute right-4 top-4 z-10 flex cursor-pointer items-center gap-1.5 rounded-lg border border-primary-green/20 bg-white p-2 text-[11px] font-semibold text-primary-green-dark shadow-sm transition-colors hover:bg-primary-green/10"
      >
        <Share2 className="w-3.5 h-3.5" />
        <span>{copiedShareLink ? 'Đã copy' : 'Chia sẻ'}</span>
      </button>

      <div className="flex-grow flex flex-col justify-start space-y-6 py-4 overflow-y-auto custom-scrollbar">
        <div className="flex flex-col items-center text-center space-y-4 pt-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-primary-green/15 border-b-[5px] bg-primary-green/10 shadow-sm">
            <Award className="h-8 w-8 animate-pulse text-primary-green-dark" />
          </div>
          <div>
            <h2 className="font-fraunces text-xl font-black tracking-tight text-on-background md:text-2xl">Ghi Nhận Tiến Độ</h2>
            <p className="text-xs text-stone-500 mt-1 max-w-sm leading-relaxed">
              Bạn đã học xong bộ đề <span className="font-bold text-primary-green-dark">{activeSet?.title}</span>! +XP đã được ghi nhận.
            </p>
          </div>
        </div>

        {/* Stats and ELO Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto w-full">
          <div className="flex flex-col items-center justify-center rounded-xl border border-primary-green/15 bg-primary-green/5 p-4 text-center">
            <span className="mb-1 text-[10px] font-bold uppercase tracking-wider text-primary-green-dark/70">Điểm số</span>
            <span className="text-2xl font-black tracking-tight text-primary-green-dark">
              {correctCount} / {totalQuestions}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center rounded-xl border border-primary-blue/20 bg-primary-blue-light/60 p-4 text-center">
            <span className="mb-1 text-[10px] font-bold uppercase tracking-wider text-primary-blue-dark/70">Độ chính xác</span>
            <span className="text-2xl font-black text-tertiary-yellow-dark tracking-tight">
              {totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0}%
            </span>
          </div>

          {/* 8. Elo compact badge */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-tertiary-yellow/30 bg-tertiary-yellow/10 p-4 text-center">
            <span className="mb-1 text-[10px] font-bold uppercase tracking-wider text-tertiary-yellow-dark/70">Học lực (Elo)</span>
            <span className="text-sm font-black text-stone-800 tracking-tight mt-1">
              {eloInfo.oldElo} → {eloInfo.newElo}
            </span>
            <span className={`text-[10px] font-bold mt-0.5 ${eloInfo.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              ({eloInfo.delta >= 0 ? '+' : ''}{eloInfo.delta})
            </span>
          </div>
        </div>

        {/* Feedback Survey */}
        <div className="mx-auto w-full max-w-xl space-y-4 rounded-xl border border-primary-green/15 bg-primary-green/5 p-5 text-left">
          <div className="flex items-center gap-1.5 border-b border-primary-green/10 pb-2">
            <Star className="w-4 h-4 fill-tertiary-yellow text-tertiary-yellow-dark" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary-green-dark font-mono">
              Khảo Sát Đánh Giá Đề Bài
            </h3>
          </div>

          {!postQuizSubmitted[activeSetId] ? (
            <div className="space-y-4">
              {/* Survey Questions */}
              {[
                { key: 'understanding', label: '1. Bạn hiểu nội dung đề này ở mức độ nào?' },
                { key: 'utility', label: '2. Quy trình làm bài trắc nghiệm hữu ích thế nào?' },
                { key: 'personalized', label: '3. Bạn muốn học các câu hỏi cá nhân hóa tiếp theo?' }
              ].map((q) => {
                const val = (postRatings[activeSetId] as any)?.[q.key] || 0;
                return (
                  <div key={q.key} className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-stone-850 block">{q.label}</label>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 rounded-lg border border-primary-green/15 bg-white p-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setPostRatings(prev => ({
                              ...prev,
                              [activeSetId]: {
                                ...(prev[activeSetId] || { understanding: 0, utility: 0, personalized: 0 }),
                                [q.key]: star
                              }
                            }))}
                            className="p-0.5 cursor-pointer hover:scale-110 transition-transform"
                          >
                            <Star className={`w-6 h-6 transition-colors ${
                              star <= val ? 'fill-tertiary-yellow text-tertiary-yellow' : 'text-stone-300'
                            }`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Qualitative Comment */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-stone-850 block">Góp ý cải thiện (không bắt buộc):</label>
                <textarea
                  value={postQuizComments[activeSetId] || ''}
                  onChange={(e) => setPostQuizComments(prev => ({ ...prev, [activeSetId]: e.target.value }))}
                  placeholder="Nhập cảm nhận của bạn để tụi mình cải tiến đề tốt hơn..."
                  className="min-h-[60px] w-full rounded-lg border border-stone-200 bg-white p-2.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary-green/25"
                />
              </div>

              <button
                disabled={
                  !(
                    postRatings[activeSetId]?.understanding > 0 &&
                    postRatings[activeSetId]?.utility > 0 &&
                    postRatings[activeSetId]?.personalized > 0
                  )
                }
                onClick={handlePostQuizSubmit}
                className="cursor-pointer rounded-xl border border-primary-green-dark bg-primary-green px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:brightness-105 disabled:border-stone-200 disabled:bg-stone-50 disabled:text-stone-400"
              >
                Gửi khảo sát phản hồi
              </button>
            </div>
          ) : (
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 text-emerald-800 rounded-lg text-center text-xs font-semibold leading-relaxed animate-in fade-in">
              Cực kỳ cảm ơn những đóng góp hữu ích của bạn để cải tiến chất lượng học thuật và lộ trình! 🌟
            </div>
          )}
        </div>

        {/* Incorrect Questions Listing */}
        <div className="space-y-3 text-left max-w-xl mx-auto w-full">
          <div className="flex items-center gap-2 border-b border-primary-blue/15 pb-2 text-xs font-bold uppercase tracking-wider text-primary-blue-dark/70">
            <AlertTriangle className="w-4 h-4 text-primary-blue" />
            Câu hỏi cần ôn tập thêm ({incorrectQuestions.length})
          </div>

          {incorrectQuestions.length > 0 ? (
            <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
              {incorrectQuestions.map((q: any) => {
                const history = answersHistory[activeSetId]?.[q.id];
                const wrongChoice = history?.selected;
                const isEssay = !q.options || q.expected_answer;
                
                return (
                  <div key={q.id} className="space-y-2 rounded-xl border border-primary-blue/15 bg-primary-blue-light/45 p-3.5 text-xs">
                    <p className="font-bold text-stone-850 leading-relaxed">#{q.id} {"->"} {q.question}</p>
                    
                    {isEssay ? (
                      <div className="space-y-1.5 pl-2">
                        <p className="text-[10px] text-stone-500">Bài làm của bạn: <span className="italic">&quot;{history?.essayAnswer}&quot;</span></p>
                        <p className="text-[10px] text-emerald-800 font-semibold font-mono">Đáp án mẫu: {q.expected_answer}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <span className="text-[10px] text-rose-800 bg-rose-50 border border-rose-100 rounded px-2 py-0.5">Lựa chọn: {wrongChoice === 'unknown' ? 'Chưa biết' : wrongChoice}</span>
                        {q.answer && (
                          <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-100 rounded px-2 py-0.5">Đáp án đúng: {q.answer}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-center text-stone-500 text-xs">
              Tuyệt vời! Bạn đã trả lời đúng tất cả các câu hỏi.
            </div>
          )}
        </div>

        {/* 7. Algorithmic Dev Mode details */}
        {devMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-3 bg-stone-900/5 border border-stone-900/10 rounded-xl space-y-2 max-w-xl mx-auto w-full text-[10px] text-stone-600 font-mono"
          >
            <div className="font-extrabold uppercase text-stone-700 tracking-wider">
              📊 DEV MODE: Thuật toán và Chỉ số tổng kết
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-bold text-stone-800">Concept ID:</span> {activeSetId}
              </div>
              <div>
                <span className="font-bold text-stone-800">Độ khó đề:</span> {activeSet?.difficulty || 'bình thường'}
              </div>
              <div>
                <span className="font-bold text-stone-800">Elo cuối:</span> {conceptMasteries[activeSetId]?.elo || 1200}
              </div>
              <div>
                <span className="font-bold text-stone-800">BKT Mastery Prob:</span> {conceptMasteries[activeSetId]?.bkt !== undefined ? (conceptMasteries[activeSetId].bkt * 100).toFixed(1) + '%' : '25.0%'}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Action Row */}
      <div className="flex shrink-0 justify-center gap-3 border-t border-primary-green/10 pt-4">
        <button
          onClick={handleRestart}
          className="px-5 py-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Làm lại đề</span>
        </button>

        <button
          onClick={handleExitQuiz}
          className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-primary-green-dark bg-primary-green px-6 py-2.5 text-xs font-black uppercase text-white shadow-sm transition hover:brightness-105 active:translate-y-[1px]"
        >
          <span>Quay lại lộ trình</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
````

## File: frontend/app/components/quiz-app-shell.tsx
````typescript
'use client';

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQuizSession } from '../hooks/useQuizSession';
import { useSocraticSidebar } from '../hooks/useSocraticSidebar';
import { useSurveyHandlers } from '../hooks/useSurveyHandlers';

import { QuizWorkspace } from './quiz-workspace';
import { DashboardLayout } from './dashboard-layout';
import { OnboardingGate } from '@/components/onboarding/onboarding-gate';
import { useBoundStore } from '@/hooks/useBoundStore';
import type { TabType } from '@/lib/dashboard-tabs';

export function QuizAppShell({ initialTab = 'learn' }: { initialTab?: TabType }) {
  return (
    <AppAuthGate>
      <QuizAppShellContent initialTab={initialTab} />
    </AppAuthGate>
  );
}

function AppAuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const loggedIn = useBoundStore((state) => state.loggedIn);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const readyCheckId = window.setTimeout(() => {
      setReady(true);
    }, 0);
    return () => {
      window.clearTimeout(readyCheckId);
    };
  }, []);

  useEffect(() => {
    if (ready && !loggedIn) {
      router.replace('/');
    }
  }, [ready, loggedIn, router]);

  if (!ready || !loggedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-on-background font-be-vietnam-pro">
        <div className="rounded-2xl border-2 border-gray-border border-b-[5px] bg-white px-6 py-5 text-center shadow-sm">
          <p className="text-sm font-black uppercase text-primary-green">Edugap</p>
          <p className="mt-1 text-xs font-bold text-stone-500">Đang mở trang giới thiệu...</p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}

function QuizAppShellContent({ initialTab }: { initialTab: TabType }) {
  const router = useRouter();

  // Use a ref to solve circular dependency between useQuizSession and useSurveyHandlers
  const resetSurveysRef = useRef<(setId: string) => void>(() => {});

  const handleResetSurveys = useCallback((setId: string) => {
    resetSurveysRef.current(setId);
  }, []);

  // 1. Initialize custom hooks
  const quiz = useQuizSession(handleResetSurveys, initialTab);
  const aiSidebar = useSocraticSidebar(quiz.currentQuestion, quiz.currentQuestionIdx, quiz.activeSetId, quiz.answersHistory);
  const surveys = useSurveyHandlers(quiz.activeSetId, quiz.activeSet, quiz.totalQuestions);

  // Keep resetSurveysRef updated with the latest function from useSurveyHandlers
  useEffect(() => {
    resetSurveysRef.current = surveys.resetSurveys;
  }, [surveys.resetSurveys]);

  const isChatPage = !quiz.isQuizMode && quiz.activeTab === 'chat';

  useEffect(() => {
    document.documentElement.classList.toggle('chat-page-scroll-lock', isChatPage);
    document.body.classList.toggle('chat-page-scroll-lock', isChatPage);

    return () => {
      document.documentElement.classList.remove('chat-page-scroll-lock');
      document.body.classList.remove('chat-page-scroll-lock');
    };
  }, [isChatPage]);

  // 3. Render main layouts based on quiz mode state
  return (
    <OnboardingGate>
      <div className={`${isChatPage ? 'h-[100dvh] min-h-0 overflow-hidden' : 'min-h-screen'} bg-background text-on-background flex flex-col font-be-vietnam-pro selection:bg-primary-green/20 selection:text-primary-green-dark`}>
        {quiz.isQuizMode ? (
          <QuizWorkspace
            quiz={quiz}
            aiSidebar={aiSidebar}
            surveys={surveys}
          />
        ) : (
          <DashboardLayout
            quiz={quiz}
            onOpenAuth={(mode) => router.push(mode === 'signup' ? '/login?mode=signup' : '/login')}
          />
        )}
      </div>
    </OnboardingGate>
  );
}
````

## File: frontend/app/globals.css
````css
@import "tailwindcss";

html {
  font-size: 18px;
  scrollbar-gutter: stable;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

html::-webkit-scrollbar,
body::-webkit-scrollbar {
  display: none;
}

@theme {
  --color-background: #f4fce8;
  --color-on-background: #171e12;
  
  --color-surface-container-lowest: #ffffff;
  --color-surface-container-low: #eef7e3;
  --color-surface-container: #e9f1dd;
  --color-surface-container-high: #e3ebd8;

  --color-primary-green: #58cc02;
  --color-primary-green-dark: #46a302;
  
  --color-secondary-green: #00cd9c;
  --color-secondary-green-dark: #00a47d;

  --color-tertiary-yellow: #ffc800;
  --color-tertiary-yellow-dark: #cc9600;

  --color-accent-orange: #ff9600;
  --color-accent-orange-dark: #cc7000;

  --color-error-red: #ff4b4b;
  --color-error-red-dark: #ea2b2b;

  --color-primary-blue: #1cb0f6;
  --color-primary-blue-dark: #1899d6;
  --color-primary-blue-light: #ddf4ff;
  --color-primary-blue-border: #84d8ff;

  --color-warm-cream: #fdfbf7;
  --color-warm-cream-light: #fffdf9;
  --color-warm-cream-dark: #fcfbfa;

  --color-primary-green-light: #d7ffb8;
  --color-error-red-light: #ffd8d8;
  --color-accent-orange-light: #ffdf92;
  --color-accent-orange-border: #ddad00;

  --color-gray-border: #e5e5e5;
  --color-gray-border-dark: #b7b7b7;
  
  --font-fraunces: var(--font-fraunces), serif;
  --font-be-vietnam-pro: var(--font-be-vietnam-pro), sans-serif;
}

body {
  font-family: var(--font-be-vietnam-pro);
  scrollbar-width: none;
  -ms-overflow-style: none;
}

html.chat-page-scroll-lock,
body.chat-page-scroll-lock {
  height: 100%;
  overflow: hidden;
  overscroll-behavior: none;
}

/* Override browser autofill background/text styling to match design system */
input:-webkit-autofill,
input:-webkit-autofill:hover, 
input:-webkit-autofill:focus, 
input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px #f9fafb inset !important;
  -webkit-text-fill-color: #1f2937 !important;
  transition: background-color 5000s ease-in-out 0s;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-fraunces);
}

/* Custom Scrollbar Styles */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(88, 204, 2, 0.34) transparent;
  overscroll-behavior: contain;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(88, 204, 2, 0.28);
  border-radius: 999px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(70, 163, 2, 0.46);
}

.custom-scrollbar::-webkit-scrollbar-button {
  display: none;
  width: 0;
  height: 0;
}

/* Reusable 3D Tactile Buttons & Cards */
.btn-3d {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border-radius: 16px;
  font-family: var(--font-be-vietnam-pro);
  font-weight: 800;
  text-transform: uppercase;
  font-size: 0.875rem;
  letter-spacing: 0.05em;
  cursor: pointer;
  border: 2px solid transparent;
  transition: filter 0.2s, transform 0.1s, border-bottom-width 0.1s;
  outline: none;
  user-select: none;
}

.btn-3d:active {
  transform: translateY(4px) !important;
  border-bottom-width: 0px !important;
  margin-bottom: 4px;
}

.btn-green {
  background-color: var(--color-primary-green) !important;
  border-bottom: 5px solid var(--color-primary-green-dark) !important;
  color: white !important;
}
.btn-green:hover {
  filter: brightness(1.08);
}

.btn-teal {
  background-color: var(--color-secondary-green) !important;
  border-bottom: 5px solid var(--color-secondary-green-dark) !important;
  color: white !important;
}
.btn-teal:hover {
  filter: brightness(1.08);
}

.btn-yellow {
  background-color: var(--color-tertiary-yellow) !important;
  border-bottom: 5px solid var(--color-tertiary-yellow-dark) !important;
  color: white !important;
}
.btn-yellow:hover {
  filter: brightness(1.08);
}

.btn-orange {
  background-color: var(--color-accent-orange) !important;
  border-bottom: 5px solid var(--color-accent-orange-dark) !important;
  color: white !important;
}
.btn-orange:hover {
  filter: brightness(1.08);
}

.btn-red {
  background-color: var(--color-error-red) !important;
  border-bottom: 5px solid var(--color-error-red-dark) !important;
  color: white !important;
}
.btn-red:hover {
  filter: brightness(1.08);
}

.btn-blue {
  background-color: var(--color-primary-blue) !important;
  border-bottom: 5px solid var(--color-primary-blue-dark) !important;
  color: white !important;
}
.btn-blue:hover {
  filter: brightness(1.08);
}

.btn-white {
  background-color: white !important;
  border: 2px solid var(--color-gray-border) !important;
  border-bottom: 5px solid var(--color-gray-border) !important;
  color: var(--color-primary-green) !important;
}
.btn-white:hover {
  background-color: var(--color-surface-container-low) !important;
  border-color: var(--color-gray-border-dark) !important;
}

.btn-disabled {
  background-color: var(--color-gray-border) !important;
  border-bottom: 5px solid var(--color-gray-border-dark) !important;
  color: var(--color-gray-400) !important;
  cursor: not-allowed;
  pointer-events: none;
}

/* Hover-to-reveal scrollbar styling (Webkit) */
.hover-scrollbar::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
.hover-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.hover-scrollbar::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 3px;
  transition: background-color 0.2s ease;
}
.hover-scrollbar:hover::-webkit-scrollbar-thumb {
  background: rgba(88, 204, 2, 0.28);
}
.hover-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(70, 163, 2, 0.46);
}
.hover-scrollbar::-webkit-scrollbar-button {
  display: none;
  width: 0;
  height: 0;
}

/* Hover-to-reveal scrollbar styling (Firefox) */
.hover-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  transition: scrollbar-color 0.2s ease;
}
.hover-scrollbar:hover {
  scrollbar-color: rgba(88, 204, 2, 0.34) transparent;
}

/* Learning-page scroll areas keep visible, low-noise bars for scroll affordance. */
.learning-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(88, 204, 2, 0.32) transparent;
  overscroll-behavior: contain;
}

.learning-scrollbar::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.learning-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.learning-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(88, 204, 2, 0.26);
  border-radius: 999px;
}

.learning-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(70, 163, 2, 0.44);
}

.learning-scrollbar::-webkit-scrollbar-button {
  display: none;
  width: 0;
  height: 0;
}

/* Sofi search animation (used in socratic-chat-tab typing indicator) */
@keyframes searchMotion {
  0% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(4px, -3px) rotate(10deg); }
  50% { transform: translate(8px, 0) rotate(0deg); }
  75% { transform: translate(4px, 5px) rotate(-10deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}
.anim-search {
  animation: searchMotion 3s infinite ease-in-out;
}

@keyframes pulseSoft {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
.anim-pulse-soft {
  animation: pulseSoft 1.5s infinite ease-in-out;
}

@keyframes wave-flow {
  0% { transform: translate3d(0, 0, 0); }
  100% { transform: translate3d(-50%, 0, 0); }
}

@keyframes wave-flow-reverse {
  0% { transform: translate3d(-50%, 0, 0); }
  100% { transform: translate3d(0, 0, 0); }
}

.wave-progress-flow {
  animation: wave-flow 8s linear infinite;
}

.wave-progress-flow-reverse {
  animation: wave-flow-reverse 6s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .wave-progress-flow,
  .wave-progress-flow-reverse {
    animation: none;
  }
}
````

## File: frontend/lib/dashboard-tabs.ts
````typescript
import type { ComponentType } from 'react';
import {
  BarChart3,
  BookOpen,
  Dumbbell,
  Gauge,
  FileEdit,
  MessageSquare,
  Search,
  Upload,
  User,
  Users,
} from 'lucide-react';

export type PersonaType = 'student' | 'mentor' | 'btc';
export type AppRole = 'student' | 'mentor' | 'teacher' | 'admin' | 'btc' | 'dev' | string;

export type TabType =
  | 'learn'
  | 'skills'
  | 'chat'
  | 'leaderboard'
  | 'profile'
  | 'insights'
  | 'ingestion'
  | 'quiz-editor'
  | 'rag-audit'
  | 'btc-heatmap'
  | 'braintrust-observability';

type NavigationItem = {
  id: TabType;
  name: string;
  shortName?: string;
  icon: ComponentType<{ className?: string }>;
};

const STUDENT_ITEMS: NavigationItem[] = [
  { id: 'learn', name: 'Học tập', icon: BookOpen },
  { id: 'skills', name: 'Luyện tập', shortName: 'Luyện', icon: Dumbbell },
  { id: 'chat', name: 'Trợ lý AI', shortName: 'AI', icon: MessageSquare },
  { id: 'profile', name: 'Tiến độ', shortName: 'Tiến độ', icon: User },
];

const MENTOR_ITEMS: NavigationItem[] = [
  { id: 'insights', name: 'Thống kê lớp', shortName: 'Lớp', icon: Users },
  { id: 'ingestion', name: 'Tài liệu & Graph', shortName: 'Graph', icon: Upload },
  { id: 'quiz-editor', name: 'Duyệt câu hỏi', shortName: 'Duyệt', icon: FileEdit },
  { id: 'rag-audit', name: 'Kiểm tra RAG', shortName: 'RAG', icon: Search },
  { id: 'chat', name: 'Trợ lý AI', shortName: 'AI', icon: MessageSquare },
  { id: 'profile', name: 'Cá nhân', shortName: 'Tôi', icon: User },
];

const BTC_ITEMS: NavigationItem[] = [
  { id: 'braintrust-observability', name: 'AI Observability', shortName: 'AI Ops', icon: Gauge },
  { id: 'btc-heatmap', name: 'Cổng BTC', shortName: 'BTC', icon: BarChart3 },
  { id: 'chat', name: 'Trợ lý AI', shortName: 'AI', icon: MessageSquare },
  { id: 'profile', name: 'Cá nhân', shortName: 'Tôi', icon: User },
];

export function normalizeRole(role?: AppRole | null) {
  return (role || '').trim().toLowerCase();
}

export function getAllowedPersonas(role?: AppRole | null): PersonaType[] {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === 'admin' || normalizedRole === 'dev') {
    return ['btc', 'mentor', 'student'];
  }
  if (normalizedRole === 'mentor' || normalizedRole === 'teacher') {
    return ['mentor'];
  }
  if (normalizedRole === 'btc') {
    return ['btc'];
  }
  return ['student'];
}

export function resolvePersonaForRole(persona: PersonaType, role?: AppRole | null): PersonaType {
  const allowedPersonas = getAllowedPersonas(role);
  return allowedPersonas.includes(persona) ? persona : allowedPersonas[0];
}

export function getNavigationItems(persona: PersonaType, role?: AppRole | null): NavigationItem[] {
  const resolvedPersona = resolvePersonaForRole(persona, role);
  switch (resolvedPersona) {
    case 'mentor':
      return MENTOR_ITEMS;
    case 'btc':
      return BTC_ITEMS;
    case 'student':
    default:
      return STUDENT_ITEMS;
  }
}

export function getDefaultTabForRole(role?: AppRole | null): TabType {
  const persona = getAllowedPersonas(role)[0];
  return getDefaultTabForPersona(persona);
}

export function getDefaultTabForPersona(persona: PersonaType): TabType {
  if (persona === 'mentor') return 'insights';
  if (persona === 'btc') return 'braintrust-observability';
  return 'learn';
}

export function getAllowedTabsForRole(role?: AppRole | null): Set<TabType> {
  const tabs = getAllowedPersonas(role).flatMap((persona) =>
    getNavigationItems(persona, role).map((item) => item.id)
  );
  return new Set(tabs);
}

export function getAllowedTabsForPersona(persona: PersonaType, role?: AppRole | null): Set<TabType> {
  return new Set(getNavigationItems(persona, role).map((item) => item.id));
}
````

## File: frontend/components/dashboard/socratic-chat/components/ai-message-item.tsx
````typescript
import React, { useMemo, useState } from 'react';
import {
  Brain,
  ChevronRight, 
  Check, 
  GraduationCap, 
  AlertTriangle, 
  Sparkles, 
  BookOpen, 
  ThumbsUp, 
  ThumbsDown,
  Database,
  Wrench,
  Loader2,
  CircleCheck,
  CircleAlert,
  Clock3,
  Copy,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SofiExpressionAvatar } from '@/components/mascot';
import { ChatAction, Message, ReasoningStep, Slide } from '../hooks/useSocraticChat';
import { parseThinkingProcess, parseQuizData } from '../utils/parser';

// ==========================================
// SocraticMarkdown Component (Lightweight Markdown Parser)
// ==========================================
interface SocraticMarkdownProps {
  text: string;
  className?: string;
}

export const SocraticMarkdown: React.FC<SocraticMarkdownProps> = ({ text, className = '' }) => {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let codeBlockLang = '';

  const parseInlineStyles = (lineText: string, keyPrefix: string) => {
    const parts = lineText.split(/(\*\*.*?\*\*|\`.*?\`)/g);
    return parts.map((part, idx) => {
      const key = `${keyPrefix}-${idx}`;
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={key} className="font-extrabold text-stone-900 dark:text-stone-850">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={key} className="bg-stone-100/90 text-rose-600 px-1.5 py-0.5 rounded font-mono text-[11px] border border-stone-200/40">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    // 1. Code block detection
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        inCodeBlock = false;
        elements.push(
          <pre 
            key={`codeblock-${lineIdx}`} 
            className="bg-stone-900 text-stone-200 p-3.5 rounded-xl border border-stone-800 font-mono text-[11px] overflow-x-auto whitespace-pre my-3 max-w-full shadow-inner leading-relaxed"
          >
            <code className={codeBlockLang ? `language-${codeBlockLang}` : ''}>
              {codeBlockLines.join('\n')}
            </code>
          </pre>
        );
        codeBlockLines = [];
      } else {
        inCodeBlock = true;
        codeBlockLang = trimmed.slice(3).trim();
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      return;
    }

    // 2. Unordered List Item detection
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) {
        inList = true;
        listItems = [];
      }
      listItems.push(
        <li key={`li-${lineIdx}`} className="ml-4 list-disc pl-1 leading-relaxed text-stone-800">
          {parseInlineStyles(trimmed.substring(2), `li-inline-${lineIdx}`)}
        </li>
      );
      return;
    }

    if (inList) {
      elements.push(
        <ul key={`ul-${lineIdx}`} className="space-y-1.5 my-2.5">
          {[...listItems]}
        </ul>
      );
      listItems = [];
      inList = false;
    }

    // 3. Regular paragraph or spacer
    if (trimmed.length === 0) {
      elements.push(<div key={`space-${lineIdx}`} className="h-2" />);
    } else {
      elements.push(
        <p key={`p-${lineIdx}`} className={`leading-relaxed text-stone-800 ${className}`}>
          {parseInlineStyles(line, `p-inline-${lineIdx}`)}
        </p>
      );
    }
  });

  if (inList && listItems.length > 0) {
    elements.push(
      <ul key="ul-end" className="space-y-1.5 my-2.5">
        {listItems}
      </ul>
    );
  }

  return <div className="space-y-2">{elements}</div>;
};

const formatToolPayload = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const getToolSummary = (toolName: string) => {
  const normalized = toolName.toLowerCase();
  if (normalized.includes('rag') || normalized.includes('slide') || normalized.includes('match')) {
    return 'Tra cứu học liệu';
  }
  if (normalized.includes('sandbox') || normalized.includes('python') || normalized.includes('code')) {
    return 'Kiểm tra đoạn mã';
  }
  return 'Kiểm tra thông tin';
};

const renderTraceValue = (value: unknown) => {
  if (typeof value === 'string') return value;
  return formatToolPayload(value);
};

const JsonTraceBlock: React.FC<{
  label: string;
  value: unknown;
  tone?: 'input' | 'output' | 'error';
  icon?: React.ReactNode;
}> = ({ label, value, tone = 'output', icon }) => {
  const toneClass =
    tone === 'error'
      ? 'text-rose-700 bg-rose-50/70'
      : tone === 'input'
      ? 'text-amber-700 bg-amber-50/70'
      : 'text-stone-700 bg-warm-cream-light';

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50 px-3 py-2 font-mono text-[11px] font-black uppercase text-stone-500">
        <span className="flex items-center gap-1.5">
          {icon}
          {label}
        </span>
        <Copy className="h-3.5 w-3.5 text-stone-300" />
      </div>
      <pre className={`max-h-56 overflow-auto p-3 text-[11px] leading-relaxed custom-scrollbar ${toneClass}`}>
        <code>{renderTraceValue(value)}</code>
      </pre>
    </div>
  );
};

interface MessageAuditTrailProps {
  msg: Message;
  thought: string;
  isThinking: boolean;
  isGeneratingMainText: boolean;
}

const normalizeTraceSteps = (msg: Message, thought: string): ReasoningStep[] => {
  if (msg.traceSteps && msg.traceSteps.length > 0) {
    const hasRagTrace = msg.traceSteps.some((step) => {
      const normalized = `${step.toolName || ''} ${step.title}`.toLowerCase();
      return normalized.includes('rag') || normalized.includes('slide') || normalized.includes('match');
    });

    return [
      ...msg.traceSteps,
      ...(!hasRagTrace && msg.slides?.length
        ? [
            {
              id: `slides-${msg.id}`,
              kind: 'observation' as const,
              title: 'Nguồn học liệu đã chọn',
              content: `Tìm thấy ${msg.slides.length} slide liên quan để grounding phản hồi.`,
              status: 'completed' as const,
              output: msg.slides.map((slide) => ({
                document_name: slide.document_name,
                slide_number: slide.slide_number,
                similarity: slide.similarity,
              })),
            },
          ]
        : []),
      ...(msg.sandboxRun
        ? [
            {
              id: `sandbox-${msg.id}`,
              kind: 'tool' as const,
              title: 'Kiểm tra đoạn mã',
              content: msg.sandboxRun.status === 'failed' ? 'Đoạn mã trả về lỗi khi chạy thử.' : 'Đoạn mã đã chạy xong.',
              status: msg.sandboxRun.status === 'failed' ? 'error' as const : 'completed' as const,
              toolName: 'python_sandbox',
              input: { code: msg.sandboxRun.code },
              output: msg.sandboxRun.output,
              durationMs: msg.sandboxRun.execution_time_ms,
            },
          ]
        : []),
    ];
  }

  const thoughtSteps: ReasoningStep[] = (msg.thinkingSteps && msg.thinkingSteps.length > 0
    ? msg.thinkingSteps
    : thought
      ? [thought]
      : []
  ).map((step, index) => ({
    id: `legacy-thought-${msg.id}-${index}`,
    kind: 'thought',
    title: step.replace(/\.+$/, ''),
    content: step,
    status: 'completed',
  }));

  const toolSteps: ReasoningStep[] = (msg.toolRuns || []).map((run, index) => ({
    id: `legacy-tool-${msg.id}-${index}`,
    kind: 'tool',
    title: run.toolName,
    content: run.status === 'running' ? 'Đang kiểm tra thông tin...' : run.status === 'error' ? 'Chưa kiểm tra được thông tin.' : 'Đã nhận kết quả kiểm tra.',
    status: run.status === 'running' ? 'running' : run.status === 'error' ? 'error' : 'completed',
    toolName: run.toolName,
    input: run.args,
    output: run.result,
    startedAt: run.startedAt,
    durationMs: run.durationMs,
  }));

  const slideStep: ReasoningStep[] = msg.slides?.length
    ? [
        {
          id: `legacy-slides-${msg.id}`,
          kind: 'observation',
          title: 'Nguồn học liệu đã chọn',
          content: `Tìm thấy ${msg.slides.length} slide liên quan để grounding phản hồi.`,
          status: 'completed',
          output: msg.slides.map((slide) => ({
            document_name: slide.document_name,
            slide_number: slide.slide_number,
            similarity: slide.similarity,
          })),
        },
      ]
    : [];

  const sandboxStep: ReasoningStep[] = msg.sandboxRun
    ? [
        {
          id: `legacy-sandbox-${msg.id}`,
          kind: 'tool',
          title: 'Kiểm tra đoạn mã',
          content: msg.sandboxRun.status === 'failed' ? 'Đoạn mã trả về lỗi khi chạy thử.' : 'Đoạn mã đã chạy xong.',
          status: msg.sandboxRun.status === 'failed' ? 'error' : 'completed',
          toolName: 'python_sandbox',
          input: { code: msg.sandboxRun.code },
          output: msg.sandboxRun.output,
          durationMs: msg.sandboxRun.execution_time_ms,
        },
      ]
    : [];

  return [...thoughtSteps, ...toolSteps, ...slideStep, ...sandboxStep];
};

const StepStatusIcon: React.FC<{ step: ReasoningStep }> = ({ step }) => {
  if (step.status === 'running' || step.status === 'pending') {
    return <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-700" />;
  }
  if (step.status === 'error') {
    return <CircleAlert className="h-3.5 w-3.5 text-rose-700" />;
  }
  if (step.kind === 'tool') {
    return <Wrench className="h-3.5 w-3.5 text-primary-green-dark" />;
  }
  if (step.kind === 'observation') {
    return <Database className="h-3.5 w-3.5 text-primary-green-dark" />;
  }
  return <CircleCheck className="h-3.5 w-3.5 text-primary-green" />;
};

const TraceStepItem: React.FC<{ step: ReasoningStep; index: number }> = ({ step, index }) => {
  const [open, setOpen] = useState(step.status === 'running');
  const isToolLike = step.kind === 'tool' || step.input !== undefined || step.output !== undefined;
  const statusLabel =
    step.status === 'running' || step.status === 'pending'
      ? 'executing'
      : step.status === 'error'
        ? 'error'
        : 'done';

  if (!isToolLike) {
    return (
      <div className="flex gap-3 rounded-xl border border-stone-100 bg-white px-3 py-2.5">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-stone-100 bg-warm-cream-light">
          <StepStatusIcon step={step} />
        </span>
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] font-black uppercase text-stone-500">{step.kind}</span>
            <span className="text-xs font-extrabold text-stone-700">{step.title || `Bước ${index + 1}`}</span>
          </div>
          <p className="text-[11px] font-semibold leading-relaxed text-stone-500">{step.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-left transition hover:bg-stone-50/80"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
            step.status === 'running' || step.status === 'pending'
              ? 'border-amber-200 bg-amber-50'
              : step.status === 'error'
                ? 'border-rose-200 bg-rose-50'
                : 'border-primary-green/20 bg-primary-green/10'
          }`}>
            <StepStatusIcon step={step} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xs font-extrabold text-stone-700">
              {getToolSummary(step.toolName || step.title)}
            </span>
            <span className="block truncate font-mono text-[11px] font-bold uppercase text-stone-500">
              {getToolSummary(step.toolName || step.title)}{step.durationMs ? ` · ${(step.durationMs / 1000).toFixed(1)}s` : ''}
            </span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-black uppercase ${
            step.status === 'running' || step.status === 'pending'
              ? 'border-amber-200 bg-amber-50 text-amber-700'
              : step.status === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}>
            {statusLabel}
          </span>
          <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.16 }}>
            <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
          </motion.span>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-stone-100 bg-warm-cream-light/70"
          >
            <div className="grid gap-3 p-3 md:grid-cols-2">
              {step.input !== undefined && <JsonTraceBlock label="Dữ liệu kiểm tra" value={step.input} tone="input" />}
              {step.output !== undefined && (
                <JsonTraceBlock
                  label="Kết quả đối chiếu"
                  value={step.output}
                  tone={step.status === 'error' ? 'error' : 'output'}
                />
              )}
              {step.input === undefined && step.output === undefined && (
                <p className="text-[11px] font-semibold text-stone-500">{step.content}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MessageAuditTrail: React.FC<MessageAuditTrailProps> = ({
  msg,
  thought,
  isThinking: _isThinking,
  isGeneratingMainText: _isGeneratingMainText,
}) => {
  const steps = useMemo(() => normalizeTraceSteps(msg, thought), [msg, thought]);
  const isComplete = !!msg.latencyMs;
  const [manualExpanded, setManualExpanded] = useState<boolean | null>(null);
  const isExpanded = manualExpanded ?? false;

  if (steps.length === 0) return null;

  const isRunning = steps.some((step) => step.status === 'running' || step.status === 'pending') || !isComplete;
  const toolCount = steps.filter((step) => step.kind === 'tool').length;
  const sourceCount = msg.slides?.length || 0;
  const completedCount = steps.filter((step) => step.status === 'completed').length;
  const summaryItems = [
    isRunning ? 'Đang suy nghĩ' : 'Đã suy nghĩ',
    `${steps.length} bước`,
    toolCount ? `${toolCount} lượt kiểm tra` : null,
    sourceCount ? `${sourceCount} nguồn` : null,
    msg.latencyMs ? `${(msg.latencyMs / 1000).toFixed(1)}s` : null,
  ].filter(Boolean);

  return (
    <div className="max-w-4xl overflow-hidden rounded-2xl border border-stone-200 bg-[#fffcf6] text-xs shadow-sm">
      <button
        type="button"
        onClick={() => setManualExpanded((current) => !(current ?? !isComplete))}
        className="flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 px-3.5 py-2.5 text-left transition hover:bg-stone-50/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-green"
        aria-expanded={isExpanded}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-primary-green-dark">
            {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
          </span>
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2 text-[11px] font-extrabold text-stone-700">
              <span className="font-mono text-xs uppercase text-stone-600">Cách Sofi kiểm tra câu trả lời</span>
              {msg.latencyMs && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary-green/20 bg-primary-green/10 px-2 py-0.5 text-[11px] font-black text-primary-green-dark">
                  <Clock3 className="h-3 w-3" />
                  {(msg.latencyMs / 1000).toFixed(1)}s
                </span>
              )}
            </span>
            <span className="block truncate text-[11px] font-bold uppercase text-stone-500">
              {summaryItems.join(' · ') || `${completedCount} bước đã ghi nhận`}
            </span>
          </span>
        </span>
        <motion.span animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.16 }} className="shrink-0 text-stone-400">
          <ChevronRight className="h-4 w-4" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-stone-200"
          >
            <div className="space-y-2.5 bg-[#fefcf5] p-3">
              {steps.map((step, index) => (
                <TraceStepItem key={step.id} step={step} index={index} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==========================================
// AIMessageContent Component
// ==========================================
interface AIMessageContentProps {
  msg: Message;
  onSelectOption: (option: { key: string; text: string }) => void;
}

const AIMessageContent: React.FC<AIMessageContentProps> = React.memo(({ msg, onSelectOption }) => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const { thought, response, isThinking } = useMemo(
    () => parseThinkingProcess(msg.text),
    [msg.text],
  );
  const quiz = useMemo(() => parseQuizData(response || msg.text), [response, msg.text]);

  const hasThinking = !!msg.traceSteps?.length || !!msg.thinkingText || !!thought || isThinking || (msg.toolRuns && msg.toolRuns.length > 0) || (msg.slides && msg.slides.length > 0) || !!msg.sandboxRun;
  const isGeneratingMainText = !!response || (!!msg.text && !msg.thinkingText && msg.text.trim().length > 0);
  const hasMainResponse = !!response.trim();

  const handleChoiceClick = (key: string, text: string) => {
    if (selectedKey) return;
    setSelectedKey(key);
    onSelectOption({ key, text });
  };

  return (
    <div className="space-y-3.5 max-w-full">
      {quiz ? (
          <div className="border-2 border-gray-border border-b-[5px] bg-white rounded-2xl p-4.5 space-y-4 max-w-full shadow-sm">
          <div className="flex items-center gap-2 text-primary-green font-black text-[11px] uppercase tracking-wider font-mono">
            <GraduationCap className="w-4.5 h-4.5" />
            <span>Câu hỏi củng cố kiến thức</span>
          </div>
          <h4 className="font-fraunces font-bold text-sm text-on-background leading-relaxed">
            {quiz.question}
          </h4>
          <div className="flex flex-col gap-2.5">
            {quiz.options.map((opt) => {
              const isSelected = selectedKey === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  disabled={selectedKey !== null}
                  onClick={() => handleChoiceClick(opt.key, opt.text)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all font-semibold text-[13px] md:text-sm flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-primary-green/10 border-primary-green text-primary-green-dark shadow-sm'
                      : selectedKey !== null
                      ? 'bg-white border-gray-border text-stone-400 opacity-60'
                      : 'bg-white border-gray-border text-stone-600 hover:bg-stone-50 hover:border-stone-400 cursor-pointer active:translate-y-[1px]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                      isSelected ? 'bg-primary-green text-white' : 'bg-stone-100 text-stone-500'
                    }`}>
                      {opt.key}
                    </span>
                    <span className="leading-snug">{opt.text}</span>
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-primary-green shrink-0 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        hasMainResponse && (
          <div className="text-xs md:text-sm font-semibold leading-relaxed text-stone-850">
            <SocraticMarkdown text={response} />
          </div>
        )
      )}

      {hasThinking && (
        <MessageAuditTrail
          msg={msg}
          thought={thought}
          isThinking={isThinking}
          isGeneratingMainText={isGeneratingMainText}
        />
      )}
    </div>
  );
});
AIMessageContent.displayName = 'AIMessageContent';

// ==========================================
// AIMessageItem Component
// ==========================================
interface AIMessageItemProps {
  msg: Message;
  setRetrievedSlides: (slides: Slide[]) => void;
  setActiveSlideIndex: (idx: number) => void;
  setIsSlidePanelOpen: (open: boolean) => void;
  handleSendMessage: (e?: React.FormEvent, customText?: string, action?: ChatAction) => Promise<void>;
  handleFeedback: (messageId: string, type: 'up' | 'down') => void;
  setToastMessage: (val: string | null) => void;
}

export const AIMessageItem: React.FC<AIMessageItemProps> = ({
  msg,
  setRetrievedSlides,
  setActiveSlideIndex,
  setIsSlidePanelOpen,
  handleSendMessage,
  handleFeedback,
  setToastMessage,
}) => {
  const isAI = msg.sender === 'ai';

  const handleCitationClick = (e: React.MouseEvent, cit: any) => {
    e.stopPropagation();
    setIsSlidePanelOpen(true);
    if (msg.slides && msg.slides.length > 0) {
      setRetrievedSlides(msg.slides);
      const matchedIdx = msg.slides.findIndex((s: Slide) => 
        s.slide_number === cit.page && 
        cit.source &&
        s.document_name.toLowerCase().includes(cit.source.toLowerCase())
      );
      if (matchedIdx !== -1) {
        setActiveSlideIndex(matchedIdx);
      } else {
        setActiveSlideIndex(0);
      }
    }
  };

  const handleThumbsUpClick = () => {
    handleFeedback(msg.id, 'up');
    setToastMessage('Đã ghi nhận đánh giá hữu ích. Hệ thống sẽ tối ưu phong cách Socratic.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleThumbsDownClick = () => {
    handleFeedback(msg.id, 'down');
    setToastMessage('Đã ghi nhận phản hồi. Sofi sẽ điều chỉnh phong cách giải thích.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleReportCitationError = () => {
    setToastMessage('Tính năng báo lỗi trích dẫn đang được kết nối với hệ thống kiểm định.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex max-w-[90%] gap-2.5 ${!isAI ? 'flex-row-reverse ml-auto' : ''}`}
    >
      {/* Avatar */}
      {isAI ? (
        <SofiExpressionAvatar
          expression={msg.isGuardrail || msg.isFallback ? 'worried' : 'happy'}
          size={32}
        />
      ) : (
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs border shadow-sm shrink-0 bg-tertiary-yellow/20 border-tertiary-yellow-dark text-tertiary-yellow-dark font-extrabold font-mono">
          HS
        </div>
      )}

      {/* Speech Bubble */}
      <div className="flex flex-col gap-1.5 max-w-full">
        {msg.isGuardrail ? (
          <div className="p-4 rounded-2xl relative shadow-sm border-2 border-b-[5px] rounded-tl-none border-error-red/30 bg-error-red-light/40 text-error-red-dark">
            <div className="flex items-center gap-1.5 text-error-red font-black text-[11px] uppercase tracking-wider mb-2 font-mono">
              <AlertTriangle className="w-4 h-4 text-error-red shrink-0" />
              Cảnh báo: Vi phạm tính trung thực học thuật
            </div>
            <div className="text-xs md:text-sm font-semibold leading-relaxed">
              <SocraticMarkdown text={msg.text} />
            </div>
          </div>
        ) : msg.isFallback ? (
          <div className="p-4 rounded-2xl relative shadow-sm border-2 border-b-[5px] rounded-tl-none border-accent-orange/30 bg-accent-orange-light/10 text-accent-orange-dark">
            <div className="flex items-center gap-1.5 text-accent-orange font-black text-[11px] uppercase tracking-wider mb-2 font-mono">
              <AlertTriangle className="w-4 h-4 text-accent-orange shrink-0" />
              Thông báo: Độ tin cậy thấp (Low Confidence)
            </div>
            <div className="text-xs md:text-sm font-semibold leading-relaxed">
              <SocraticMarkdown text={msg.text} />
            </div>
          </div>
        ) : (
          <div 
            className={`p-3.5 rounded-2xl relative shadow-sm border-2 border-b-[5px] transition-all ${
              isAI 
                ? 'bg-white border-gray-border rounded-tl-none text-stone-800' 
                : 'bg-primary-green border-primary-green-dark text-white rounded-tr-none'
            }`}
          >
            {isAI ? (
              <AIMessageContent 
                msg={msg} 
                onSelectOption={(option) => {
                  handleSendMessage(
                    undefined,
                    `Mình chọn đáp án ${option.key}: ${option.text}`,
                    { type: 'quiz_option_select', optionKey: option.key, optionText: option.text },
                  );
                }}
              />
            ) : (
              <p className="text-xs md:text-sm font-semibold leading-relaxed whitespace-pre-line">
                {msg.text}
              </p>
            )}

            {/* Confidence score */}
            {isAI && msg.confidence_score !== undefined && (
              (() => {
                const pct = Math.round(msg.confidence_score * 100);
                let confStyle = 'text-rose-700 bg-rose-50 border-rose-200/50';
                let confText = `Độ tin cậy: Thấp (${pct}%)`;
                if (msg.confidence_score >= 0.8) {
                  confStyle = 'text-emerald-700 bg-emerald-50 border-emerald-200/50';
                  confText = `Độ tin cậy: Cao (${pct}%)`;
                } else if (msg.confidence_score >= 0.5) {
                  confStyle = 'text-amber-700 bg-amber-50 border-amber-200/50';
                  confText = `Độ tin cậy: Trung bình (${pct}%)`;
                }
                return (
                  <div className={`mt-2 flex items-center gap-1 text-[11px] font-black uppercase tracking-wider border rounded-md px-1.5 py-0.5 w-fit ${confStyle}`}>
                    <Sparkles className="w-2.5 h-2.5 shrink-0" />
                    <span>{confText}</span>
                  </div>
                );
              })()
            )}

            {/* Citation Badges */}
            {isAI && msg.citations && msg.citations.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-stone-200/60 space-y-1.5">
                <p className="text-[11px] text-stone-400 font-black uppercase tracking-wider">Học liệu trích dẫn chính thống (Bấm để xem)</p>
                <div className="flex flex-wrap gap-1.5">
                  {msg.citations.map((cit, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => handleCitationClick(e, cit)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-primary-green/20 bg-warm-cream hover:bg-primary-green/5 text-xs font-bold text-primary-green-dark cursor-pointer transition-colors active:translate-y-[1px]"
                    >
                      <BookOpen className="w-3 h-3 shrink-0" />
                      <span>{cit.source} {cit.page ? `(Slide ${cit.page})` : ''}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chat Bubble Footer Actions */}
        {isAI && (
          <div className="flex items-center gap-3.5 ml-2 text-stone-400 opacity-45 hover:opacity-100 transition-opacity duration-200">
            <button 
              onClick={handleThumbsUpClick}
              className={`p-1 hover:text-primary-green transition-all cursor-pointer rounded hover:scale-115 active:scale-95 ${
                msg.isFeedbackGiven === 'up' ? 'text-primary-green font-bold' : ''
              }`}
              title="Hữu ích"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={handleThumbsDownClick}
              className={`p-1 hover:text-error-red transition-all cursor-pointer rounded hover:scale-115 active:scale-95 ${
                msg.isFeedbackGiven === 'down' ? 'text-error-red font-bold' : ''
              }`}
              title="Chưa tốt"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={handleReportCitationError}
              className="p-1 hover:text-accent-orange transition-all cursor-pointer rounded flex items-center gap-1.5 text-[11px] font-extrabold uppercase hover:scale-105 active:scale-95"
              title="Báo lỗi trích dẫn học liệu"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Báo lỗi trích dẫn</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
````

## File: frontend/lib/adaptive/api-client.ts
````typescript
import { getRequestAuthToken, isDemoAuthToken } from "@/lib/auth-token";
import { isDemoMode } from "@/lib/demo-mode";

export const DEFAULT_ADAPTIVE_COURSE_ID = "00000000-0000-0000-0000-000000000001";

export interface AdaptiveRecommendation {
  decision_id: string;
  question_id: string;
  type: string;
  prompt: string;
  options?: Record<string, string>;
  answer?: string | null;
  explanation?: string | null;
  expected_success: number;
  expected_reward: number;
  question_difficulty_elo?: number | null;
  candidate_count?: number | null;
  concept_elo?: number | null;
  bkt_mastery_probability?: number | null;
}

export type AdaptiveStudentAnswer =
  | { selected_option: string }
  | { text: string }
  | { value: string | number }
  | Record<string, unknown>;

export interface AdaptiveSubmitResult {
  is_correct: boolean;
  actual_score: number;
  old_elo: number;
  new_elo: number;
  old_bkt: number;
  new_bkt: number;
  mastery_state: string;
  weakness_flag: boolean;
  bandit_reward: number;
  stability_days?: number;
}

interface AdaptiveAuth {
  token?: string;
  studentId: string;
  setToken?: (token: string) => void;
}

interface RecommendParams extends AdaptiveAuth {
  courseId?: string;
  conceptId: string;
  excludedQuestionIds?: string[];
}

interface SubmitParams extends AdaptiveAuth {
  courseId?: string;
  conceptId: string;
  questionId: string | number;
  decisionId: string;
  studentAnswer: AdaptiveStudentAnswer;
  responseTimeMs: number;
  hintCount?: number;
  usedAiHelp?: boolean;
}

export class AdaptiveApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AdaptiveApiError";
    this.status = status;
  }
}

async function parseAdaptiveError(response: Response) {
  try {
    const payload = await response.json();
    if (typeof payload?.detail === "string") return payload.detail;
    if (payload?.detail) return JSON.stringify(payload.detail);
    if (typeof payload?.message === "string") return payload.message;
    if (typeof payload?.error === "string") return payload.error;
  } catch {
    // Fall through to the generic status message.
  }

  return `Adaptive API failed with status ${response.status}`;
}

function getHeaders({ token, setToken }: AdaptiveAuth) {
  const { authToken, usedExpiredToken } = getRequestAuthToken(token);
  if (usedExpiredToken) {
    setToken?.("");
  }
  if (isDemoMode() && isDemoAuthToken(authToken || token)) {
    throw new AdaptiveApiError("Demo mode đang dùng bộ câu cục bộ; không gọi adaptive backend bằng fake token.", 401);
  }

  return {
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };
}

export async function recommendAdaptiveQuestion({
  token,
  studentId,
  setToken,
  courseId = DEFAULT_ADAPTIVE_COURSE_ID,
  conceptId,
  excludedQuestionIds = [],
}: RecommendParams): Promise<AdaptiveRecommendation> {
  const response = await fetch("/api/v1/adaptive/recommend", {
    method: "POST",
    headers: getHeaders({ token, studentId, setToken }),
    credentials: "same-origin",
    body: JSON.stringify({
      student_id: studentId,
      course_id: courseId,
      concept_id: conceptId,
      excluded_question_ids: excludedQuestionIds,
    }),
  });

  if (!response.ok) {
    throw new AdaptiveApiError(await parseAdaptiveError(response), response.status);
  }

  return response.json();
}

export async function submitAdaptiveAnswer({
  token,
  studentId,
  setToken,
  courseId = DEFAULT_ADAPTIVE_COURSE_ID,
  conceptId,
  questionId,
  decisionId,
  studentAnswer,
  responseTimeMs,
  hintCount = 0,
  usedAiHelp = false,
}: SubmitParams): Promise<AdaptiveSubmitResult> {
  const response = await fetch("/api/v1/adaptive/submit", {
    method: "POST",
    headers: getHeaders({ token, studentId, setToken }),
    credentials: "same-origin",
    body: JSON.stringify({
      student_id: studentId,
      course_id: courseId,
      concept_id: conceptId,
      question_id: String(questionId),
      decision_id: decisionId,
      student_answer: studentAnswer,
      response_time_ms: responseTimeMs,
      hint_count: hintCount,
      used_ai_help: usedAiHelp,
    }),
  });

  if (!response.ok) {
    throw new AdaptiveApiError(await parseAdaptiveError(response), response.status);
  }

  return response.json();
}
````

## File: frontend/app/hooks/useSocraticSidebar.ts
````typescript
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useBoundStore } from '@/hooks/useBoundStore';
import { buildChatArtifacts } from '@/lib/chat/stream';
import { getRequestAuthToken } from '@/lib/auth-token';

interface SidebarMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  citations?: any[];
  confidence_score?: number;
}

const DEFAULT_STUDENT_ID = 'd3b07384-d113-4ec5-a58e-0f2d87e07661';
const COURSE_UUID = '00000000-0000-0000-0000-000000000001';

export function useSocraticSidebar(
  currentQuestion: any,
  currentQuestionIdx: number,
  activeSetId: string,
  answersHistory: any
) {
  const token = useBoundStore((s) => s.token);
  const userId = useBoundStore((s) => s.userId);
  const setToken = useBoundStore((s) => s.setToken);
  const [sidebarMessages, setSidebarMessages] = useState<SidebarMessage[]>([]);
  const [quizHintCount, setQuizHintCount] = useState<number>(0);
  const [isSidebarTyping, setIsSidebarTyping] = useState<boolean>(false);
  const [sidebarInputValue, setSidebarInputValue] = useState<string>('');
  const [lastWelcomedIdx, setLastWelcomedIdx] = useState<number>(-1);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSocraticOpen, setIsSocraticOpen] = useState<boolean>(false);

  // Sidebar auto-scroll refs
  const sidebarEndRef = useRef<HTMLDivElement>(null);
  const mobileSidebarEndRef = useRef<HTMLDivElement>(null);

  // Socratic Sidebar Desktop auto-scroll
  const scrollToSidebarBottom = useCallback(() => {
    sidebarEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToSidebarBottom();
  }, [sidebarMessages, isSidebarTyping, scrollToSidebarBottom]);

  // Socratic Sidebar Mobile Drawer auto-scroll
  const scrollToMobileSidebarBottom = useCallback(() => {
    mobileSidebarEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isMobileSidebarOpen) {
      const timer = setTimeout(scrollToMobileSidebarBottom, 100);
      return () => clearTimeout(timer);
    }
  }, [sidebarMessages, isSidebarTyping, isMobileSidebarOpen, scrollToMobileSidebarBottom]);

  // Reset hint count only when the question or set changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuizHintCount(0);
  }, [currentQuestionIdx, activeSetId]);

  // Persist Socratic sidebar chat on question change (without transition welcome prompts)
  useEffect(() => {
    if (currentQuestion) {
      const timer = setTimeout(() => {
        if (sidebarMessages.length === 0) {
          setSidebarMessages([
            {
              id: 'quiz-init-1',
              sender: 'ai',
              text: `Chào bạn! Mình là Trợ lý Socratic. Cùng giải câu hỏi số ${currentQuestionIdx + 1} nhé. Em cần gợi ý gì không? Hãy bấm nút "AI Hint" bên dưới hoặc trò chuyện cùng mình ở đây nhé! 😉`
            }
          ]);
          setLastWelcomedIdx(currentQuestionIdx);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [currentQuestionIdx, activeSetId, currentQuestion, sidebarMessages.length]);

  // Handle requesting a Socratic hint during quiz (decoupled from sidebar)
  const handleRequestQuizHint = useCallback(() => {
    if (!currentQuestion) return;
    const nextHintCount = Math.min(3, quizHintCount + 1);
    setQuizHintCount(nextHintCount);
  }, [currentQuestion, quizHintCount]);

  const sendChatRequest = useCallback(async (message: string) => {
    const currentStudentId = userId || DEFAULT_STUDENT_ID;
    const { authToken, usedExpiredToken } = getRequestAuthToken(token);
    if (usedExpiredToken) setToken('');
    if (!authToken) {
      throw new Error('Bạn cần đăng nhập lại để dùng trợ lý AI.');
    }
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    };
    const payload = {
      message,
      student_id: currentStudentId,
      course_id: COURSE_UUID,
      mode: 'Explain',
    };

    const response = await fetch('/api/v1/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (response.status === 401 && token) setToken('');

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(errorText || `API failed with status ${response.status}`);
    }

    return response.json();
  }, [token, userId, setToken]);

  // Automatically close sidebar when moving to a new unanswered question
  useEffect(() => {
    if (currentQuestion && activeSetId) {
      const history = answersHistory[activeSetId]?.[currentQuestion.id];
      if (!history) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsSocraticOpen(false);
      }
    }
  }, [currentQuestionIdx, activeSetId, answersHistory, currentQuestion]);

  const openSocraticWithDraft = useCallback((draft: string) => {
    setSidebarInputValue(draft);
    setIsSocraticOpen(true);
    setIsMobileSidebarOpen(true);
  }, []);

  // Handle custom Socratic sidebar questions from the student
  const handleSendQuizSidebarMessage = useCallback(async (text: string) => {
    if (!text.trim() || !currentQuestion || isSidebarTyping) return;

    setSidebarMessages(prev => [
      ...prev,
      { id: `user-${Date.now()}`, sender: 'user', text }
    ]);
    setIsSidebarTyping(true);

    try {
      const contextMessage = `[Bối cảnh bài kiểm tra - Câu hỏi hiện tại: "${currentQuestion.question}". Học sinh đang chọn đáp án và hỏi:] ${text}`;
      
      const data = await sendChatRequest(contextMessage);
      const { slides, citations, confidenceScore } = buildChatArtifacts(data);
      
      const enrichedCitations = citations.map(cit => {
        const matched = slides.find(s => 
          s.slide_number === cit.page && 
          cit.source &&
          s.document_name.toLowerCase().includes(cit.source.toLowerCase())
        );
        return {
          ...cit,
          image_url: matched?.image_url || null
        };
      });

      setSidebarMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: data.response || 'Mình đang suy nghĩ, bạn thử đặt câu hỏi khác xem sao nhé.',
          citations: enrichedCitations,
          slides: slides,
          confidence_score: confidenceScore
        }
      ]);
    } catch (e) {
      console.error(e);
      setSidebarMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: 'Có lỗi khi kết nối tới trợ lý AI. Hãy thử hỏi lại hoặc bấm nút AI Hint nhé!'
        }
      ]);
    } finally {
      setIsSidebarTyping(false);
    }
  }, [currentQuestion, isSidebarTyping, sendChatRequest]);

  const resetSidebar = useCallback(() => {
    setSidebarMessages([]);
    setQuizHintCount(0);
    setLastWelcomedIdx(-1);
    setIsMobileSidebarOpen(false);
    setIsSocraticOpen(false);
  }, []);

  return {
    sidebarMessages,
    setSidebarMessages,
    quizHintCount,
    setQuizHintCount,
    isSidebarTyping,
    setIsSidebarTyping,
    sidebarInputValue,
    setSidebarInputValue,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    isSocraticOpen,
    setIsSocraticOpen,
    openSocraticWithDraft,
    sidebarEndRef,
    mobileSidebarEndRef,
    handleRequestQuizHint,
    handleSendQuizSidebarMessage,
    resetSidebar
  };
}
````

## File: frontend/components/quiz/socratic-sidebar-view.tsx
````typescript
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, Sparkles, BookOpen, Send } from 'lucide-react';
import { useSocraticSidebar } from '../../app/hooks/useSocraticSidebar';
import { SofiExpressionAvatar } from '@/components/mascot';
import { SocraticMarkdown } from '../dashboard/socratic-chat/components/ai-message-item';

const CitationsBlock = ({
  citations,
  onZoom,
  onReportCitation,
}: {
  citations: any[];
  onZoom?: (url: string) => void;
  onReportCitation?: () => void;
}) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  return (
    <div className="mt-2 pt-2 border-t border-stone-200/60 space-y-1.5">
      <p className="text-[9px] text-stone-400 font-black uppercase tracking-wider">
        Tài liệu tham khảo (Bấm để xem slide)
      </p>
      <div className="flex flex-wrap gap-1.5">
        {citations.map((cit: any, idx: number) => {
          const isActive = activeIdx === idx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (isActive) {
                  setActiveIdx(null);
                } else {
                  setActiveIdx(idx);
                  if (cit.image_url && onZoom) {
                    onZoom(cit.image_url);
                  }
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all active:translate-y-[1px] ${
                isActive
                    ? 'border-primary-green bg-primary-green/10 text-primary-green-dark'
                    : cit.image_url
                      ? 'border-primary-green/20 bg-warm-cream hover:bg-primary-green/5 text-primary-green-dark'
                      : 'border-stone-200 bg-stone-50 text-stone-500 hover:bg-stone-100'
              }`}
              title={cit.image_url && onZoom ? 'Mở slide trích dẫn' : 'Xem thông tin trích dẫn'}
            >
              <BookOpen className="w-3 h-3 shrink-0" />
              <span>{cit.source} {cit.page ? `(Slide ${cit.page})` : ''}</span>
            </button>
          );
        })}
      </div>
      {activeIdx !== null && citations[activeIdx] && (
        <div className="relative p-2.5 text-[9.5px] text-stone-500 italic leading-relaxed border border-gray-border bg-stone-50/50 rounded-lg pr-6">
          <button
            type="button"
            onClick={() => setActiveIdx(null)}
            className="absolute top-1.5 right-1.5 p-0.5 text-stone-400 hover:text-stone-600 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
          &ldquo;{citations[activeIdx].context_snippet}&rdquo;
        </div>
      )}
      {onReportCitation && (
        <button
          type="button"
          onClick={onReportCitation}
          className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-[9px] font-black uppercase text-stone-400 transition-colors hover:text-accent-orange"
        >
          <AlertTriangle className="h-3 w-3" />
          Báo lỗi trích dẫn
        </button>
      )}
    </div>
  );
};

interface SocraticSidebarViewProps {
  aiSidebar: ReturnType<typeof useSocraticSidebar>;
  showSidebar: boolean;
}

export function SocraticSidebarView({ aiSidebar, showSidebar }: SocraticSidebarViewProps) {
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  const {
    sidebarMessages,
    quizHintCount,
    isSidebarTyping,
    sidebarInputValue,
    setSidebarInputValue,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    isSocraticOpen,
    setIsSocraticOpen,
    sidebarEndRef,
    mobileSidebarEndRef,
    handleSendQuizSidebarMessage,
  } = aiSidebar;

  const isSheetOpen = showSidebar && (isSocraticOpen || isMobileSidebarOpen);
  const sheetEndRef = isMobileSidebarOpen ? mobileSidebarEndRef : sidebarEndRef;
  const closeSheet = () => {
    setIsMobileSidebarOpen(false);
    setIsSocraticOpen(false);
  };

  return (
    <>
      <AnimatePresence>
        {isSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.42 }}
              exit={{ opacity: 0 }}
              onClick={closeSheet}
              className="fixed inset-0 bg-stone-900/60 z-40 lg:hidden"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex h-[82dvh] max-h-[620px] w-full max-w-4xl flex-col rounded-t-2xl border-t border-gray-border bg-white shadow-2xl font-be-vietnam-pro lg:hidden"
            >
              {/* Header / Pull Bar */}
              <div className="p-2.5 sm:p-4 border-b border-gray-border flex flex-col gap-1.5 sm:gap-2 relative shrink-0">
                {/* Pull indicator */}
                <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto mb-1 sm:mb-2 cursor-pointer" onClick={closeSheet} />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <SofiExpressionAvatar expression="happy" size={32} priority />
                    <div>
                      <h3 className="font-extrabold text-sm text-on-background leading-none">Sofi · Trợ lý học tập</h3>
                      <span className="hidden text-[9px] text-primary-green font-black uppercase tracking-wider mt-0.5 sm:block">Socratic Focus</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={closeSheet}
                    className="h-8 w-8 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 text-[10px] font-bold cursor-pointer flex items-center justify-center"
                    title="Đóng AI Tutor"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="px-2 py-1.5 sm:p-2.5 bg-surface-container-low rounded-xl border border-gray-border flex flex-wrap justify-between items-center gap-1.5 text-[10px] mt-0.5 sm:mt-1">
                  <span className="font-bold text-stone-500">Gợi ý đã dùng: {quizHintCount}/3</span>
                  {quizHintCount > 0 && (
                    <span className="text-[8px] text-error-red font-black uppercase flex items-center gap-0.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-error-red" />
                      Phạt Elo: -{quizHintCount === 1 ? '30' : quizHintCount === 2 ? '60' : '90'}%
                    </span>
                  )}
                </div>
              </div>

              {/* Chat Body */}
              <SocraticChatBody
                messages={sidebarMessages}
                isTyping={isSidebarTyping}
                scrollRef={sheetEndRef}
                inputValue={sidebarInputValue}
                setInputValue={setSidebarInputValue}
                onSubmit={handleSendQuizSidebarMessage}
                isMobile
                onZoom={setZoomedImageUrl}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Lightbox Modal for Zoomed Slide */}
      <AnimatePresence>
        {zoomedImageUrl && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              onClick={() => setZoomedImageUrl(null)}
              className="fixed inset-0 bg-stone-950/85 z-[9999] cursor-zoom-out"
            />

            {/* Zoomed Content Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-4 md:inset-10 z-[10000] flex flex-col items-center justify-center pointer-events-none"
            >
              <div className="relative max-w-full max-h-[85vh] p-2 bg-white rounded-2xl border-2 border-stone-100 shadow-2xl pointer-events-auto flex items-center justify-center overflow-hidden">
                {/* Close Button */}
                <button
                  onClick={() => setZoomedImageUrl(null)}
                  className="absolute top-3 right-3 p-2 bg-stone-900/80 text-white rounded-full hover:bg-stone-900 transition-all cursor-pointer z-10 shadow-md"
                  title="Đóng xem lớn"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={zoomedImageUrl}
                  alt="Slide bài học bổ trợ"
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// -------------------------------------------------------------
// Reusable sub-component to dry out Desktop & Mobile Drawer JSX
// -------------------------------------------------------------
interface SocraticChatBodyProps {
  messages: any[];
  isTyping: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  inputValue: string;
  setInputValue: (val: string) => void;
  onSubmit: (val: string) => void;
  isMobile: boolean;
  onZoom?: (url: string) => void;
  onReportCitation?: () => void;
}

export function SocraticChatBody({
  messages,
  isTyping,
  scrollRef,
  inputValue,
  setInputValue,
  onSubmit,
  isMobile,
  onZoom,
  onReportCitation,
}: SocraticChatBodyProps) {
  // Helper to get styled confidence label
  const getConfidenceInfo = (score: number) => {
    const pct = Math.round(score * 100);
    if (score >= 0.8) {
      return {
        text: `Độ tin cậy: Cao (${pct}%)`,
        style: 'text-emerald-700 bg-emerald-50 border-emerald-200/50'
      };
    }
    if (score >= 0.5) {
      return {
        text: `Độ tin cậy: Trung bình (${pct}%)`,
        style: 'text-accent-orange-dark bg-accent-orange-light/20 border-accent-orange/30'
      };
    }
    return {
      text: `Độ tin cậy: Thấp (${pct}%)`,
      style: 'text-rose-700 bg-rose-50 border-rose-200/50'
    };
  };

  return (
    <>
      {/* Messages */}
      <div className={`flex-1 overflow-y-auto space-y-3 custom-scrollbar ${isMobile ? 'bg-background/10 p-3 sm:p-4 sm:space-y-4' : 'bg-[#fbfff4] p-4'}`}>
        {messages.map((msg) => {
          const isAI = msg.sender === 'ai';
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className={`flex max-w-[96%] items-start gap-2.5 ${!isAI ? 'flex-row-reverse ml-auto' : ''}`}
            >
              {isAI ? (
                <SofiExpressionAvatar expression="calm" size={28} />
              ) : (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] border shadow-sm shrink-0 bg-tertiary-yellow/20 border-tertiary-yellow-dark text-tertiary-yellow-dark font-bold">
                  HS
                </div>
              )}
              <div className={`min-w-0 p-3 rounded-xl text-xs md:text-sm leading-relaxed flex flex-col gap-2 ${
                isAI 
                  ? 'bg-white border border-primary-green/10 rounded-tl-none text-stone-700 shadow-sm' 
                  : 'bg-primary-green border-primary-green-dark text-white rounded-tr-none'
                }`}>
                {isAI ? (
                  <SocraticMarkdown text={msg.text} />
                ) : (
                  <p className="font-semibold whitespace-pre-line">{msg.text}</p>
                )}

                {isAI && msg.confidence_score !== undefined && (
                  (() => {
                    const conf = getConfidenceInfo(msg.confidence_score);
                    return (
                      <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-wider border rounded-md px-1.5 py-0.5 w-fit ${conf.style}`}>
                        <Sparkles className="w-2.5 h-2.5 shrink-0" />
                        <span>{conf.text}</span>
                      </div>
                    );
                  })()
                )}

                {isAI && msg.citations && msg.citations.length > 0 && (
                  <CitationsBlock citations={msg.citations} onZoom={onZoom} onReportCitation={onReportCitation} />
                )}
              </div>
            </motion.div>
          );
        })}

        {isTyping && (
          <div className="flex gap-2.5 max-w-[90%]">
            <SofiExpressionAvatar expression="thinking" size={28} />
            <div className="bg-white border border-primary-green/10 p-3 rounded-xl rounded-tl-none shadow-sm flex items-center gap-0.5 h-9">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Form */}
      <div className={`border-t border-primary-green/10 bg-white p-3 sm:p-4 ${isMobile ? 'pb-[calc(0.75rem+env(safe-area-inset-bottom))] shrink-0' : 'shrink-0'}`}>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!inputValue.trim()) return;
          onSubmit(inputValue);
          setInputValue('');
        }} className="relative">
          <textarea
            rows={2}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!inputValue.trim() || isTyping) return;
                onSubmit(inputValue);
                setInputValue('');
              }
            }}
            placeholder="Hỏi trợ lý Socratic..."
            className="max-h-28 min-h-[52px] w-full resize-none bg-surface-container-low border border-gray-border rounded-xl py-2.5 pl-4 pr-11 focus:border-primary-green outline-none text-xs font-semibold leading-relaxed custom-scrollbar"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="absolute bottom-2 right-2 h-8 w-8 bg-primary-green text-white rounded-lg flex items-center justify-center border-b-2 border-primary-green-dark hover:brightness-105 active:translate-y-[1px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:active:translate-y-0 transition-opacity duration-150"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </>
  );
}
````

## File: frontend/components/quiz/quiz-question-view.tsx
````typescript
'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Share2,
  Sparkles,
  AlertTriangle,
  ListTodo,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  MessageCircle,
  Loader2,
  BookOpen
} from 'lucide-react';
import { useQuizSession } from '../../app/hooks/useQuizSession';
import { useSocraticSidebar } from '../../app/hooks/useSocraticSidebar';
import { useSurveyHandlers } from '../../app/hooks/useSurveyHandlers';
import { useBoundStore } from '@/hooks/useBoundStore';
import { SocraticMarkdown } from '../dashboard/socratic-chat/components/ai-message-item';
import { SocraticChatBody } from './socratic-sidebar-view';
import { SofiExpressionAvatar } from '@/components/mascot';
import { DEFAULT_ADAPTIVE_COURSE_ID } from '@/lib/adaptive/api-client';
import { AdaptiveChallengeInfo } from './adaptive-challenge-info';

interface QuizQuestionViewProps {
  quiz: ReturnType<typeof useQuizSession>;
  aiSidebar: ReturnType<typeof useSocraticSidebar>;
  surveys: ReturnType<typeof useSurveyHandlers>;
}

export function QuizQuestionView({ quiz, aiSidebar, surveys }: QuizQuestionViewProps) {
  const { conceptMasteries, userId, activePracticeSession } = useBoundStore();

  // Report error states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportErrorType, setReportErrorType] = useState('Sai kiến thức chuyên môn');
  const [reportDetail, setReportDetail] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeHintIndex, setActiveHintIndex] = useState(0);
  const [hintPopoverQuestionId, setHintPopoverQuestionId] = useState<string | number | null>(null);
  const [openExplanationQuestionId, setOpenExplanationQuestionId] = useState<string | number | null>(null);
  const [pendingSelection, setPendingSelection] = useState<{
    questionId: string | number;
    optionKey: string;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSubmitReport = async () => {
    if (!reportDetail.trim() || !currentQuestion) return;
    setIsSubmittingReport(true);
    try {
      const response = await fetch('/api/v1/quiz/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question_id: String(currentQuestion.id),
          question_text: currentQuestion.question || '',
          selected_option: selectedOption ? String(selectedOption) : null,
          error_type: reportErrorType,
          detail: reportDetail,
          student_id: userId ? String(userId) : null,
          course_id: DEFAULT_ADAPTIVE_COURSE_ID
        }),
      });

      if (response.ok) {
        showToast('Đã gửi báo cáo lỗi kiến thức thành công. Cảm ơn bạn!');
        setIsReportModalOpen(false);
        setReportDetail('');
      } else {
        showToast('❌ Gửi báo cáo thất bại. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      showToast('❌ Đã xảy ra lỗi kết nối khi gửi báo cáo.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const {
    activeSetId,
    activeSet,
    currentQuestionIdx,
    totalQuestions,
    currentQuestion,
    currentHistory,
    selectedOption,
    isSubmitted,
    isEssayCompleted,
    essayInput,
    setEssayInput,
    showExplanation,
    handleSelectOption,
    handleSubmitEssay,
    handleGradeEssay,
    handleToggleEvaluationPoint,
    handleNextQuestion,
    setCurrentQuestionIdx,
    handleExitQuiz,
    adaptiveError,
    isLoadingNextQuestion,
    isSubmittingAnswer
  } = quiz;
  const {
    quizHintCount,
    setIsMobileSidebarOpen,
    isSocraticOpen,
    setIsSocraticOpen,
    isSidebarTyping,
    handleRequestQuizHint,
    openSocraticWithDraft,
    sidebarMessages,
    sidebarInputValue,
    setSidebarInputValue,
    sidebarEndRef,
    handleSendQuizSidebarMessage
  } = aiSidebar;

  const { handleCopyShareLink } = surveys;

  // 3. 2-Part Explanation Heuristic Parser
  const parsedExplanation = useMemo(() => {
    if (!currentQuestion?.explanation) return { correct: '', incorrect: null };
    const text = currentQuestion.explanation;
    const splitKeywords = [
      /trong khi đó/i,
      /tuy nhiên/i,
      /ngược lại/i,
      /còn lại/i,
      /phương án khác/i,
      /đáp án khác/i
    ];
    for (const regex of splitKeywords) {
      const match = text.match(regex);
      if (match && match.index !== undefined) {
        return {
          correct: text.substring(0, match.index).trim(),
          incorrect: text.substring(match.index).trim()
        };
      }
    }
    return {
      correct: text,
      incorrect: "Các phương án khác không mô tả chính xác bản chất hoặc cơ chế hoạt động của khái niệm này."
    };
  }, [currentQuestion]);

  const isAdaptiveQuestion = activePracticeSession?.mode === 'adaptive' && !!currentQuestion?.adaptive;

  // 5. Unlocked Socratic hints rendered inline pre-submission
  const unlockedHints = useMemo(() => {
    if (quizHintCount === 0 || !currentQuestion) return [];
    const dbHints = (currentQuestion.hints || [])
      .slice(0, quizHintCount)
      .map((hint: any, index: number) => {
        const discountLabel = index === 0 ? '30%' : index === 1 ? '60%' : '90%';
        const content = typeof hint === 'string' ? hint : hint.content || hint.hint_text || '';
        return `**Gợi ý ${index + 1}** (ảnh hưởng ${discountLabel} điểm luyện tập): ${content}`;
      })
      .filter(Boolean);
    if (dbHints.length > 0) return dbHints;

    const hints: string[] = [];
    if (quizHintCount >= 1) {
      hints.push(`**Gợi ý 1** (ảnh hưởng 30% điểm luyện tập): Tập trung vào yêu cầu chính của câu hỏi. Từ khóa cốt lõi đang hỏi về vai trò hay kết quả của khái niệm?`);
    }
    if (quizHintCount >= 2) {
      const expl = currentQuestion.explanation || '';
      const clue = expl.length > 50 ? expl.substring(0, 80) + '...' : expl;
      hints.push(`**Gợi ý 2** (ảnh hưởng 60% điểm luyện tập): Manh mối quan trọng: "${clue}". Lựa chọn nào khớp trực tiếp nhất với mô tả này?`);
    }
    if (quizHintCount >= 3) {
      hints.push(currentQuestion.answer
        ? `**Gợi ý 3** (ảnh hưởng 90% điểm luyện tập): Đây là gợi ý cuối. Hãy xem xét kỹ đáp án **${currentQuestion.answer}**.`
        : '**Gợi ý 3**: Loại trừ phương án không khớp bản chất khái niệm, rồi chọn đáp án còn lại hợp lý nhất.'
      );
    }
    return hints;
  }, [quizHintCount, currentQuestion]);
  const selectedHintIndex = unlockedHints.length > 0
    ? Math.min(activeHintIndex, unlockedHints.length - 1)
    : 0;
  const selectedHint = unlockedHints[selectedHintIndex] ?? null;
  const isExplanationOpen = openExplanationQuestionId === currentQuestion?.id;
  const shouldShowHintPanel = !!selectedHint && hintPopoverQuestionId === currentQuestion.id;
  const canSkipAfterHints = quizHintCount >= 2;
  const pendingSelectedOption = currentQuestion && pendingSelection && !isSubmitted && pendingSelection.questionId === currentQuestion.id
    ? pendingSelection.optionKey
    : null;

  useEffect(() => {
    if (!currentQuestion?.options || isSubmitted || isSubmittingAnswer) return;

    const optionKeys = Object.keys(currentQuestion.options);
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, [contenteditable="true"]')) return;

      const numericIndex = Number(event.key) - 1;
      if (Number.isInteger(numericIndex) && numericIndex >= 0 && numericIndex < optionKeys.length) {
        event.preventDefault();
        setPendingSelection({
          questionId: currentQuestion.id,
          optionKey: optionKeys[numericIndex],
        });
        return;
      }

      if (event.key === 'Enter' && pendingSelectedOption) {
        event.preventDefault();
        handleSelectOption(pendingSelectedOption, quizHintCount);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion, handleSelectOption, isSubmitted, isSubmittingAnswer, pendingSelectedOption, quizHintCount]);

  // 5. Random feedback copy (Seed-based to remain consistent for the same question)
  const feedbackCopy = useMemo(() => {
    if (!isSubmitted || !currentQuestion) return '';
    const isCorrect = currentHistory?.isCorrect;
    const correctOptions = [
      "Tuyệt vời! Bạn nắm kiến thức rất vững.",
      "Chuẩn xác! Lập luận của bạn rất xuất sắc.",
      "Chính xác! Câu trả lời rất thuyết phục.",
      "Tuyệt cú mèo! Bạn tư duy rất nhạy bén.",
      "Quá đỉnh! Không thể sai được.",
      "Lựa chọn tuyệt vời! Bạn đang làm rất tốt."
    ];
    const incorrectOptions = [
      "Không sao cả, sai sót là bước đệm để học tập!",
      "Chưa chính xác, hãy đọc kỹ phần giải thích bên dưới nhé.",
      "Tiếc quá! Xem giải thích để lấp đầy EduGap này nhé.",
      "Đừng nản lòng, câu tiếp theo bạn sẽ làm tốt hơn!",
      "Thử thách này hơi khó, hãy ôn lại kiến thức này nhé.",
      "Chưa đúng rồi, hãy cùng AI Tutor phân tích lại nhé."
    ];
    const options = isCorrect ? correctOptions : incorrectOptions;
    const numericId = Number(currentQuestion.id);
    const seed = (Number.isFinite(numericId) ? numericId : currentQuestion.question.length) + (isCorrect ? 100 : 200);
    return options[seed % options.length];
  }, [isSubmitted, currentQuestion, currentHistory]);

  // Framer motion variants for staggered entry
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06
      }
    }
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { type: 'spring' as const, damping: 20, stiffness: 150 } 
    }
  } as const;
  const [zoomedTutorImageUrl, setZoomedTutorImageUrl] = useState<string | null>(null);
  const [wrongPromptDraftState, setWrongPromptDraftState] = useState<{
    questionId: string | number | null;
    used: boolean;
  }>({ questionId: null, used: false });

  if (!currentQuestion) return null;

  const quizViewState = (() => {
    if (!currentQuestion.options || currentQuestion.expected_answer) {
      if (!isSubmitted) return 'essay-input';
      return isEssayCompleted ? 'essay-graded' : 'essay-review';
    }
    if (!isSubmitted) {
      if (pendingSelectedOption) return 'mcq-selected';
      return selectedHint ? 'mcq-hint-open' : 'mcq-answering';
    }
    return currentHistory?.isCorrect ? 'mcq-correct' : 'mcq-wrong';
  })();
  const isWrongSubmitted = quizViewState === 'mcq-wrong';
  const explanationSummary = parsedExplanation.correct.length > 220
    ? `${parsedExplanation.correct.slice(0, 220).trim()}...`
    : parsedExplanation.correct;
  const hasExplanationDetail = !!parsedExplanation.incorrect || parsedExplanation.correct.length > explanationSummary.length;
  const correctAnswerText = currentQuestion.answer && currentQuestion.options?.[currentQuestion.answer]
    ? `${currentQuestion.answer}. ${currentQuestion.options[currentQuestion.answer]}`
    : currentQuestion.answer;
  const shouldShowTokenizerFlow = /token|tokenizer|embedding/i.test(
    `${currentQuestion.question} ${correctAnswerText || ''}`
  );
  const progressPct = totalQuestions > 0
    ? Math.round(((currentQuestionIdx + 1) / totalQuestions) * 100)
    : 0;
  const contextLabel = activeSet?.topic_title || activeSet?.title || activeSetId;
  const difficultyLabel = activeSet?.difficulty || 'Dễ';
  const showSidebarButton = !!(
    currentQuestion &&
    isSubmitted
  );
  const showWrongAnswerNudge = !!(
    isSubmitted &&
    currentHistory &&
    !currentHistory.isCorrect
  );
  const wrongAnswerPrompt = showWrongAnswerNudge ? (() => {
    const selected = currentHistory?.selected;
    const selectedText = selected && currentQuestion.options?.[selected]
      ? `\nĐáp án em đã chọn: ${selected}. ${currentQuestion.options[selected]}`
      : selected === 'unknown'
        ? '\nEm đã chọn chưa biết hoặc bỏ qua câu này.'
        : currentHistory?.essayAnswer
          ? `\nBài tự luận em đã viết: ${currentHistory.essayAnswer}`
          : '';
    const correctText = currentQuestion.answer && currentQuestion.options?.[currentQuestion.answer]
      ? `\nĐáp án đúng là: ${currentQuestion.answer}. ${currentQuestion.options[currentQuestion.answer]}`
      : currentQuestion.expected_answer
        ? `\nĐáp án tham chiếu: ${currentQuestion.expected_answer}`
        : '';

    return `Em vừa làm sai câu này. Hãy giải thích theo kiểu Socratic: vì sao cách nghĩ của em chưa đúng, gợi ý từng bước để hiểu bản chất, và nếu có thể hãy chỉ ra tài liệu/slide nên ôn lại.\n\nCâu hỏi: ${currentQuestion.question}${selectedText}${correctText}`;
  })() : '';

  const handleRequestNextHint = () => {
    if (quizHintCount < 3) {
      handleRequestQuizHint();
      setActiveHintIndex(Math.min(quizHintCount, 2));
    } else {
      setActiveHintIndex(Math.min(unlockedHints.length - 1, 2));
    }
    setHintPopoverQuestionId(currentQuestion.id);
  };

  const handlePickOption = (optionKey: string) => {
    if (isSubmitted || isSubmittingAnswer || !currentQuestion) return;
    setPendingSelection({
      questionId: currentQuestion.id,
      optionKey,
    });
  };

  const handleClearPendingOption = () => {
    if (isSubmittingAnswer) return;
    setPendingSelection(null);
  };

  const handleCheckPendingOption = () => {
    if (!pendingSelectedOption || isSubmittingAnswer) return;
    handleSelectOption(pendingSelectedOption, quizHintCount);
  };

  const handleSkipAfterHints = () => {
    if (!canSkipAfterHints || isSubmittingAnswer) return;
    handleSelectOption('unknown', quizHintCount);
  };

  const handleOpenWrongAnswerTutor = () => {
    if (!wrongAnswerPrompt) return;
    openSocraticWithDraft(wrongAnswerPrompt);
  };

  const hasUsedWrongPromptDraft = wrongPromptDraftState.questionId === currentQuestion.id && wrongPromptDraftState.used;
  const tutorInputValue = showWrongAnswerNudge && !hasUsedWrongPromptDraft && !sidebarInputValue.trim()
    ? wrongAnswerPrompt
    : sidebarInputValue;

  const handleSubmitTutorMessage = (text: string) => {
    setWrongPromptDraftState({ questionId: currentQuestion.id, used: true });
    handleSendQuizSidebarMessage(text);
  };

  const handleOpenTutorChat = (draft?: string) => {
    if (draft) {
      setSidebarInputValue(draft);
    }
    setIsMobileSidebarOpen(true);
    setIsSocraticOpen(true);
  };

  const wrongAnswerTutorNudge = showWrongAnswerNudge ? (
    <div className="flex items-center gap-2 rounded-lg border border-primary-green/25 bg-primary-green-light/20 p-2 shadow-sm sm:rounded-xl sm:p-3">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:items-start sm:gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-primary-green/25 bg-white text-primary-green shadow-sm sm:h-8 sm:w-8">
          <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </div>
        <div className="min-w-0 space-y-0.5">
          <p className="text-xs font-extrabold text-stone-850">
            Cần AI Tutor gỡ lỗi cách nghĩ?
          </p>
          <p className="hidden text-[11px] font-medium leading-relaxed text-stone-600 sm:block">
            Mình đã chuẩn bị sẵn câu hỏi. Bạn xem lại rồi bấm gửi nếu muốn AI phân tích.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleOpenWrongAnswerTutor}
        className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border-b-2 border-primary-green-dark bg-primary-green px-2.5 text-[11px] font-extrabold text-white shadow-sm transition-all hover:brightness-105 active:translate-y-[1px] cursor-pointer sm:h-9 sm:px-3"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        <span>Hỏi AI</span>
      </button>
    </div>
  ) : null;

  return (
    <motion.div
      key={`${activeSetId}-${currentQuestion.id}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border-2 border-primary-green/15 border-b-[6px] bg-[#fbfff4] shadow-[0_18px_46px_rgba(70,163,2,0.10)] font-be-vietnam-pro"
    >
      <div className="flex h-full min-h-0 flex-col p-2 sm:p-2.5 md:p-3">
        <div className="flex min-h-[50px] shrink-0 items-center gap-2 rounded-t-[20px] border-x border-t border-primary-green/10 bg-white/80 px-3 py-1.5 shadow-sm sm:px-4 md:min-h-[56px]">
          <button
            type="button"
            onClick={handleExitQuiz}
            className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-2.5 text-[11px] font-extrabold text-stone-650 shadow-sm transition-colors hover:bg-stone-50 md:h-10 md:px-3"
            title="Quay lại lộ trình"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Lộ trình</span>
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5 text-[10px] font-extrabold text-stone-700 sm:text-xs md:text-[13px]">
              <span className="shrink-0">Câu {currentQuestionIdx + 1}/{totalQuestions}</span>
              <span className="text-stone-300">-</span>
              <span className="truncate">{contextLabel}</span>
              <span className="hidden text-stone-300 sm:inline">-</span>
              <span className="hidden shrink-0 sm:inline">{difficultyLabel}</span>
              {isAdaptiveQuestion ? <AdaptiveChallengeInfo /> : null}
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100">
                <div className="h-full rounded-full bg-primary-green transition-all duration-300" style={{ width: `${progressPct}%` }} />
              </div>
              <span className="w-8 text-right text-[10px] font-extrabold text-stone-500">{progressPct}%</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-red-200 bg-white text-red-650 shadow-sm transition-colors hover:bg-red-50 md:h-10 md:w-10"
              title="Báo lỗi câu hỏi"
              aria-label="Báo lỗi câu hỏi"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            </button>

            <button
              type="button"
              onClick={() => handleCopyShareLink('question')}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-primary-green/20 bg-white text-primary-green-dark shadow-sm transition-colors hover:bg-primary-green-light/20 md:h-10 md:w-10"
              title="Chia sẻ câu hỏi"
              aria-label="Chia sẻ câu hỏi"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className={`flex-1 min-h-0 overflow-hidden border-x border-b border-primary-green/10 bg-white ${
          isSubmitted && currentQuestion.options ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] xl:grid-cols-[minmax(0,1fr)_390px]' : ''
        }`}>
        <div className="min-w-0 overflow-y-auto custom-scrollbar p-4 sm:p-5 md:p-6 lg:p-6 xl:p-6 space-y-3.5 md:space-y-4">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary-green-light/40 text-primary-green-dark shadow-sm sm:h-10 sm:w-10">
              <span className="text-base font-black">?</span>
            </div>
            <h3 className="max-w-[920px] text-lg font-black leading-tight text-on-background sm:text-xl md:text-[22px] lg:text-2xl">
              {currentQuestion.question}
            </h3>
          </div>

        {/* Question Type Rendering: Essay or MCQ */}
        {!currentQuestion.options || currentQuestion.expected_answer ? (
          /* ESSAY QUESTION LAYOUT */
          <div className="space-y-4 pt-2">
            {(currentQuestion.sfia_level || currentQuestion.competency) && (
              <div className="flex flex-wrap gap-2 items-center">
                {currentQuestion.sfia_level && (
                  <span className="px-2 py-0.5 bg-accent-orange-light/25 border border-accent-orange/25 text-accent-orange-dark text-[9px] uppercase font-bold tracking-wider font-mono rounded">
                    {currentQuestion.sfia_level}
                  </span>
                )}
                {currentQuestion.competency && (
                  <span className="text-[10px] text-stone-500 italic">
                    Năng lực: {currentQuestion.competency}
                  </span>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-accent-orange-dark/65 uppercase tracking-wider font-mono">
                Bài làm tự luận ngắn của bạn:
              </label>
              <textarea
                disabled={isSubmitted}
                value={essayInput}
                onChange={(e) => setEssayInput(e.target.value)}
                placeholder="Trình bày giải pháp của bạn cho tình huống trên..."
                className="w-full min-h-[140px] p-3 text-xs md:text-sm text-stone-850 bg-warm-cream border border-stone-200 focus:border-tertiary-yellow focus:ring-1 focus:ring-tertiary-yellow/20 rounded-xl focus:outline-none transition-all leading-relaxed shadow-sm"
              />
            </div>

            {!isSubmitted && (
              <div className="flex justify-end">
                <button
                  disabled={!essayInput.trim()}
                  onClick={handleSubmitEssay}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                    essayInput.trim()
                      ? 'bg-accent-orange hover:bg-accent-orange-dark text-white shadow-md shadow-accent-orange/15'
                      : 'bg-stone-50 border border-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  <span>Nộp bài & Đối chiếu</span>
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {isSubmitted && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 pt-1"
              >
                {/* Encouraging Feedback Text */}
                {feedbackCopy && (
                  currentHistory?.isCorrect === false ? (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => {
                        setIsMobileSidebarOpen(true);
                        setIsSocraticOpen(true);
                      }}
                      className="flex cursor-pointer items-center justify-between rounded-xl border border-primary-blue/25 bg-primary-blue-light/70 p-2.5 text-xs font-semibold text-primary-blue-dark shadow-sm transition-all duration-200 hover:bg-primary-blue-light md:text-sm group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="animate-bounce text-sm">🦊</span>
                        <span className="italic">AI Tutor: &ldquo;{feedbackCopy}&rdquo;</span>
                      </div>
                      <div className="ml-3 flex shrink-0 items-center gap-1 text-[10px] font-bold text-primary-blue-dark transition-transform group-hover:translate-x-0.5 md:text-xs">
                        <span>
                          {isSidebarTyping 
                            ? "Đang tìm slide gợi ý... 🔄" 
                            : "Học tiếp"}
                        </span>
                        {!isSidebarTyping && <ArrowRight className="w-3.5 h-3.5" />}
                      </div>
                    </motion.div>
                  ) : (
                    <p className="text-xs font-bold italic text-primary-green-dark">
                      🦊 AI Tutor: &ldquo;{feedbackCopy}&rdquo;
                    </p>
                  )
                )}

                <div className="space-y-2 rounded-xl border border-primary-blue/25 bg-primary-blue-light/60 p-4">
                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary-blue-dark font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-primary-blue" />
                    Đáp án tham chiếu đề xuất
                  </div>
                  <p className="text-stone-800 text-xs md:text-sm leading-relaxed whitespace-pre-line">
                    {currentQuestion.expected_answer}
                  </p>
                </div>

                {wrongAnswerTutorNudge}

                {/* Evaluation Checklist */}
                {currentQuestion.evaluation_points && currentQuestion.evaluation_points.length > 0 && (
                  <div className="p-4 rounded-xl bg-white border border-stone-200 space-y-3">
                    <div className="flex items-center gap-1.5 text-stone-650 text-[10px] font-bold uppercase tracking-wider font-mono">
                      <ListTodo className="w-3.5 h-3.5 text-accent-orange" />
                      Tự kiểm tra tiêu chí đạt được (Checklist):
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {currentQuestion.evaluation_points.map((point: string, idx: number) => {
                        const isChecked = currentHistory?.checkedPoints?.includes(point);
                        return (
                          <button
                            key={idx}
                            onClick={() => handleToggleEvaluationPoint(point)}
                            className={`flex items-start text-left gap-2.5 p-2 rounded-lg border transition-all duration-100 cursor-pointer active:scale-[0.98] active:translate-y-[1px] ${
                              isChecked
                                ? 'bg-accent-orange-light/20 border-accent-orange/50 text-accent-orange-dark font-medium'
                                : 'bg-stone-50/50 border-stone-200 text-stone-600 hover:bg-stone-50'
                            }`}
                          >
                            <span className={`w-4 h-4 shrink-0 rounded flex items-center justify-center border text-[9px] mt-0.5 ${
                              isChecked ? 'bg-accent-orange border-accent-orange text-white' : 'border-stone-300 bg-white'
                            }`}>
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </span>
                            <span className="text-[11px] leading-normal">{point}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Rubrics Grading Buttons */}
                <div className="p-4 rounded-xl bg-warm-cream border border-tertiary-yellow/20 space-y-3 text-center sm:text-left">
                  <div className="text-xs font-bold text-stone-850">
                    Đánh giá mức độ khớp câu trả lời của bạn so với đáp án mẫu:
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <button
                      onClick={() => handleGradeEssay(true, quizHintCount)}
                      className={`px-4.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                        selectedOption === 'essay_correct'
                          ? 'bg-emerald-500 border border-emerald-500 text-white shadow-md'
                          : 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 hover:bg-emerald-500/20'
                      }`}
                    >
                      <span>Khớp đáp án (Đạt chuẩn)</span>
                    </button>
                    <button
                      onClick={() => handleGradeEssay(false, quizHintCount)}
                      className={`px-4.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                        selectedOption === 'essay_incorrect'
                          ? 'bg-rose-500 border border-rose-500 text-white shadow-md'
                          : 'bg-rose-500/10 border border-rose-500/25 text-rose-800 hover:bg-rose-500/20'
                      }`}
                    >
                      <span>Chưa chính xác (Cần ôn tập)</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          /* MCQ OPTIONS LAYOUT */
          <div className="space-y-3.5 sm:space-y-4">
            {/* MCQ Options with Staggered Framer Motion */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-3 pt-0.5 md:grid-cols-2 lg:gap-3.5 xl:gap-4"
            >
              {(Object.keys(currentQuestion.options!) as Array<'A' | 'B' | 'C' | 'D'>).map(key => {
                const optionText = currentQuestion.options![key];
                const isSelected = selectedOption === key;
                const isPendingSelected = pendingSelectedOption === key;
                const isAnswerCorrectKey = currentQuestion.answer === key;
                
                let buttonStyle = 'bg-warm-cream border-tertiary-yellow/30 text-stone-750 hover:bg-warm-cream-light hover:border-tertiary-yellow/60 shadow-sm';
                let badgeStyle = 'bg-tertiary-yellow/10 text-tertiary-yellow-dark border-tertiary-yellow/20';
                let indicatorIcon = null;

                if (!isSubmitted) {
                  if (isPendingSelected) {
                    buttonStyle = 'bg-primary-green-light/30 border-primary-green text-primary-green-dark font-bold ring-2 ring-primary-green/10 shadow-[0_8px_22px_rgba(88,204,2,0.12)]';
                    badgeStyle = 'bg-primary-green-light text-primary-green-dark border-primary-green/25';
                    indicatorIcon = <span className="ml-auto h-7 w-7 rounded-full border-4 border-primary-green/10 bg-primary-green/5" />;
                  }
                } else {
                  if (isSelected) {
                    if (currentQuestion.answer ? isAnswerCorrectKey : Boolean(currentHistory?.isCorrect)) {
                      buttonStyle = 'bg-primary-green-light/40 border-primary-green text-primary-green-dark font-semibold ring-1 ring-primary-green/20';
                      badgeStyle = 'bg-primary-green text-white border-primary-green';
                      indicatorIcon = <Check className="w-4 h-4 text-primary-green-dark ml-auto" />;
                    } else {
                      buttonStyle = 'bg-error-red-light/40 border-error-red text-error-red-dark font-semibold ring-1 ring-error-red/20';
                      badgeStyle = 'bg-error-red text-white border-error-red';
                      indicatorIcon = <X className="w-4 h-4 text-error-red-dark ml-auto" />;
                    }
                  } else {
                    if (isAnswerCorrectKey) {
                      buttonStyle = 'bg-primary-green-light/20 border-primary-green text-primary-green-dark font-medium';
                      badgeStyle = 'bg-primary-green text-white border-primary-green';
                      indicatorIcon = <Check className="w-4 h-4 text-primary-green-dark ml-auto" />;
                    } else {
                      buttonStyle = 'opacity-40 bg-stone-100/30 border-transparent text-stone-400 cursor-not-allowed';
                      badgeStyle = 'bg-stone-200/50 text-stone-500 border-transparent';
                    }
                  }
                }

                return (
                  <motion.div key={key} variants={itemVariants} className="space-y-2">
                    <button
                      disabled={isSubmitted || isSubmittingAnswer}
                      onClick={() => handlePickOption(key)}
                      className={`w-full text-left p-3 sm:p-3.5 rounded-2xl border flex items-center gap-3 transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                        isSubmitted ? 'min-h-[58px] sm:min-h-[64px]' : 'min-h-[74px] sm:min-h-[84px]'
                      } ${buttonStyle}`}
                    >
                      <span className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center font-mono text-sm border font-black transition-colors ${badgeStyle}`}>
                        {key}
                      </span>
                      <span className={`flex-1 leading-relaxed ${isSubmitted ? 'text-sm' : 'text-sm md:text-[15px]'}`}>{optionText}</span>
                      {indicatorIcon}
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>

            {adaptiveError && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
                {adaptiveError}
              </div>
            )}

            {isSubmitted && showExplanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="overflow-hidden"
              >
                <div className={`rounded-xl border p-3 shadow-sm space-y-2.5 ${
                  currentHistory?.isCorrect
                    ? 'bg-primary-green-light/20 border-primary-green/25'
                    : 'bg-rose-50/70 border-rose-500/25'
                }`}>
                  <div className="flex items-start gap-2">
                    <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-white ${
                      currentHistory?.isCorrect ? 'bg-primary-green' : 'bg-error-red'
                    }`}>
                      {currentHistory?.isCorrect ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className={`text-xs font-extrabold ${currentHistory?.isCorrect ? 'text-emerald-850' : 'text-rose-850'}`}>
                        {currentHistory?.isCorrect
                          ? `Đáp án đúng là ${currentHistory.selected || currentQuestion.answer}`
                          : 'Chưa chính xác.'}
                        {!currentHistory?.isCorrect && feedbackCopy ? ` ${feedbackCopy}` : ''}
                      </p>
                      {correctAnswerText && (
                        <p className="text-xs font-bold leading-relaxed text-stone-850">
                          Đáp án đúng: <span className="text-primary-green-dark">{correctAnswerText}</span>
                        </p>
                      )}
                      {explanationSummary && (
                        <p className="text-xs leading-relaxed text-stone-700">
                          {explanationSummary}
                        </p>
                      )}
                    </div>
                  </div>

                  {shouldShowTokenizerFlow && (
                    <div className="hidden rounded-xl border border-primary-green/20 bg-white/75 p-2.5 text-[10px] font-bold text-stone-650 shadow-sm sm:block">
                      <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-center gap-2">
                        <div className="rounded-lg border border-primary-green/20 bg-primary-green-light/20 px-2 py-2 text-center">
                          Text
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-stone-400" />
                        <div className="rounded-lg border border-primary-green/20 bg-primary-green-light/20 px-2 py-2 text-center">
                          Tokens
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-stone-400" />
                        <div className="rounded-lg border border-primary-green/20 bg-primary-green-light/20 px-2 py-2 text-center">
                          Token IDs
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-stone-400" />
                        <div className="rounded-lg border border-primary-green/20 bg-primary-green-light/20 px-2 py-2 text-center">
                          LLM
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 border-t border-stone-900/10 pt-2">
                    {hasExplanationDetail && !isAdaptiveQuestion && (
                      <button
                        type="button"
                        onClick={() => setOpenExplanationQuestionId(prev => (
                          prev === currentQuestion.id ? null : currentQuestion.id
                        ))}
                        className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-stone-650 shadow-sm transition-colors hover:bg-stone-50 cursor-pointer"
                      >
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExplanationOpen ? 'rotate-180' : ''}`} />
                        {isExplanationOpen ? 'Thu gọn' : 'Xem giải thích đầy đủ'}
                      </button>
                    )}

                    {selectedHint && isSubmitted && (
                      <button
                        type="button"
                        onClick={() => {
                          setHintPopoverQuestionId(currentQuestion.id);
                        }}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-primary-blue/25 bg-white px-2.5 py-1.5 text-[11px] font-bold text-primary-blue-dark shadow-sm transition-colors hover:bg-primary-blue-light/60"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Xem lại gợi ý
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsReportModalOpen(true)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-red-650 shadow-sm transition-colors hover:bg-red-50 cursor-pointer"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Báo lỗi
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {isExplanationOpen && !isAdaptiveQuestion && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 rounded-lg border border-stone-200 bg-white p-3 text-xs leading-relaxed text-stone-700">
                          <p>{parsedExplanation.correct}</p>
                          {parsedExplanation.incorrect && (
                            <div className="border-t border-stone-100 pt-2">
                              <p className="font-bold text-rose-800">Tại sao phương án khác chưa tối ưu</p>
                              <p>{parsedExplanation.incorrect}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {wrongAnswerTutorNudge}
                </div>
              </motion.div>
            )}

            {/* Skip is available only after the learner has tried hints first. */}
            {!isSubmitted && canSkipAfterHints && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex justify-center">
                <button
                  disabled={isSubmittingAnswer}
                  onClick={handleSkipAfterHints}
                  className="mt-0.5 cursor-pointer rounded-xl border border-dashed border-stone-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-stone-500 shadow-sm transition-colors hover:border-primary-blue/40 hover:text-primary-blue-dark sm:px-4 sm:py-2 sm:text-xs"
                >
                  Bỏ qua & xem giải thích
                </button>
              </motion.div>
            )}
          </div>
        )}

        {/* AI Hint Deck */}
        {shouldShowHintPanel && (
          <motion.div
            initial={{ opacity: 0, y: 8, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 8, x: '-50%' }}
            className="fixed bottom-[82px] left-1/2 z-[80] w-[calc(100vw-2rem)] max-w-[480px] rounded-2xl border-2 border-primary-blue/20 border-b-[5px] bg-white p-3 shadow-[0_22px_60px_rgba(11,120,176,0.16)] sm:bottom-[88px] sm:p-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-primary-blue-dark font-mono md:text-xs">
                <Sparkles className="w-3.5 h-3.5 text-primary-blue" />
                <span>Gợi ý AI Tutor</span>
                <span className="rounded-full bg-primary-blue-light px-2 py-0.5 text-primary-blue-dark">
                  {selectedHintIndex + 1}/{unlockedHints.length}
                </span>
              </div>
              {unlockedHints.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={selectedHintIndex === 0}
                    onClick={() => setActiveHintIndex(prev => Math.max(prev - 1, 0))}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-primary-blue/25 bg-white/80 text-primary-blue-dark transition-colors hover:bg-primary-blue-light/60 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Xem gợi ý trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={selectedHintIndex >= unlockedHints.length - 1}
                    onClick={() => setActiveHintIndex(prev => Math.min(prev + 1, unlockedHints.length - 1))}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-primary-blue/25 bg-white/80 text-primary-blue-dark transition-colors hover:bg-primary-blue-light/60 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Xem gợi ý tiếp theo"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setHintPopoverQuestionId(null);
                }}
                className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-lg border border-primary-blue/25 bg-primary-blue-light/60 text-primary-blue-dark transition-colors hover:bg-primary-blue-light sm:right-3 sm:top-3"
                title="Đóng gợi ý"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="custom-scrollbar mt-3 max-h-[38dvh] overflow-y-auto border-l-2 border-primary-blue/30 pl-2.5 pr-1 text-xs leading-relaxed text-stone-700 md:text-sm">
              <SocraticMarkdown text={selectedHint} />
            </div>
          </motion.div>
        )}

        {/* 7. Algorithmic Dev Mode details */}
        {quiz.devMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-3 bg-stone-900/5 border border-stone-900/10 rounded-xl space-y-2 mt-4 text-[10px] text-stone-600 font-mono"
          >
            <div className="font-extrabold uppercase text-stone-700 tracking-wider">
              📊 DEV MODE: Thông số thuật toán (Elo, MAB, BKT)
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-bold text-stone-800">Concept ID:</span> {activeSetId}
              </div>
              <div>
                <span className="font-bold text-stone-800">Độ khó đề:</span> {activeSet?.difficulty || 'bình thường'}
              </div>
              <div>
                <span className="font-bold text-stone-800">Student Concept Elo:</span> {conceptMasteries[activeSetId]?.elo || 1200}
              </div>
              <div>
                <span className="font-bold text-stone-800">BKT Mastery Prob:</span> {conceptMasteries[activeSetId]?.bkt !== undefined ? (conceptMasteries[activeSetId].bkt * 100).toFixed(1) + '%' : '25.0%'}
              </div>
            </div>
            <div className="pt-1.5 border-t border-stone-200/50 leading-relaxed">
              <span className="font-bold text-stone-700">Nguồn cập nhật:</span><br />
              Adaptive backend trả về old/new Elo và old/new BKT sau mỗi lượt submit.
            </div>
          </motion.div>
        )}
        </div>

        {isSubmitted && currentQuestion.options && (
          <aside className="hidden min-h-0 flex-col overflow-hidden border-l border-primary-green/10 bg-[#fbfff4] lg:flex">
            <div className="flex min-h-[64px] items-center justify-between border-b border-primary-green/10 bg-white/90 px-5 py-3">
              <div className="flex items-center gap-2">
                <SofiExpressionAvatar expression={currentHistory?.isCorrect ? 'thumbs-up' : 'worried'} size={28} />
                <span className="text-sm font-black text-stone-900">Sofi · Trợ lý học tập</span>
              </div>
              <ChevronDown className="h-4 w-4 text-stone-400" />
            </div>

            {isSocraticOpen ? (
              <div className="flex min-h-0 flex-1 flex-col">
                <SocraticChatBody
                  messages={sidebarMessages}
                  isTyping={isSidebarTyping}
                  scrollRef={sidebarEndRef}
                  inputValue={tutorInputValue}
                  setInputValue={setSidebarInputValue}
                  onSubmit={handleSubmitTutorMessage}
                  isMobile={false}
                  onZoom={setZoomedTutorImageUrl}
                  onReportCitation={() => showToast('Đã ghi nhận báo lỗi trích dẫn. Team học liệu sẽ kiểm tra lại nguồn này.')}
                />
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5 custom-scrollbar">
                <div className={`rounded-2xl border-2 border-b-[5px] p-5 ${
                  currentHistory?.isCorrect
                    ? 'border-primary-green/20 bg-primary-green/5'
                    : 'border-primary-blue/20 bg-primary-blue-light/55'
                }`}>
                  <div className="flex items-start gap-3">
                    <SofiExpressionAvatar expression={currentHistory?.isCorrect ? 'thumbs-up' : 'thinking'} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary-green-dark">
                        {currentHistory?.isCorrect ? 'Củng cố nhanh' : 'Gỡ lỗi cách nghĩ'}
                      </p>
                      <h3 className="mt-1 font-fraunces text-base font-black leading-tight text-on-background">
                        {currentHistory?.isCorrect ? 'Bạn đã chọn đúng ý chính.' : 'Đáp án này lệch ở đâu?'}
                      </h3>
                      <p className="mt-2 text-xs font-semibold leading-relaxed text-stone-650">
                        {currentHistory?.isCorrect
                          ? 'Nếu muốn chắc hơn, xem giải thích ngắn rồi tiếp tục. Chat đầy đủ chỉ mở khi bạn hỏi thêm.'
                          : 'Trước khi chat dài, hãy xem một nhịp phân tích ngắn: so sánh lựa chọn của bạn với đáp án đúng và xác định điểm hiểu nhầm.'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-white/80 bg-white p-3 text-xs leading-relaxed text-stone-700 shadow-sm">
                    <p className="font-black text-on-background">
                      {currentHistory?.isCorrect ? 'Vì sao đúng?' : 'Gợi ý phân tích'}
                    </p>
                    <p className="mt-1">
                      {currentHistory?.isCorrect
                        ? explanationSummary || 'Đáp án bạn chọn khớp với bản chất khái niệm trong câu hỏi.'
                        : 'Đọc lại từ khóa trong câu hỏi, đối chiếu đáp án đúng, rồi hỏi Sofi nếu bạn muốn phân tích từng bước.'}
                    </p>
                    {!currentHistory?.isCorrect && correctAnswerText ? (
                      <p className="mt-2 rounded-lg border border-primary-green/15 bg-primary-green/5 px-2.5 py-2 font-bold text-primary-green-dark">
                        Đáp án đúng: {correctAnswerText}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenTutorChat(showWrongAnswerNudge ? wrongAnswerPrompt : `Hãy giải thích ngắn gọn vì sao đáp án này đúng.\n\nCâu hỏi: ${currentQuestion.question}\nĐáp án đúng: ${correctAnswerText || currentQuestion.answer}`)}
                      className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary-green-dark bg-primary-green px-3 py-2 text-xs font-black uppercase text-white shadow-sm transition hover:brightness-105 active:translate-y-[1px]"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {currentHistory?.isCorrect ? 'Hỏi thêm vì sao đúng' : 'Giải thích vì sao sai'}
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenTutorChat(`Cho em một ví dụ tương tự để tự luyện.\n\nCâu hỏi gốc: ${currentQuestion.question}`)}
                        className="flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-primary-blue/20 bg-white px-2 py-2 text-[11px] font-extrabold text-primary-blue-dark shadow-sm transition hover:bg-primary-blue-light/60"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Ví dụ tương tự
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenTutorChat(`Tóm tắt bài học từ câu này trong 3 gạch đầu dòng.\n\nCâu hỏi: ${currentQuestion.question}`)}
                        className="flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-2 py-2 text-[11px] font-extrabold text-stone-650 shadow-sm transition hover:bg-stone-50"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        Tóm tắt
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-[11px] font-semibold leading-relaxed text-stone-500">
                  Sofi chỉ mở khung chat đầy đủ khi bạn chọn một câu hỏi tiếp theo. Màn hình chính vẫn ưu tiên làm bài và tiếp tục câu kế.
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Bottom Sticky Action Footer Row */}
      <div className="rounded-b-[20px] border-x border-b border-primary-green/10 bg-white px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] sm:px-5 md:px-6 flex flex-col sm:flex-row gap-2 justify-between items-center z-10 shrink-0">
        <div className="w-full min-w-0 sm:w-auto">
          {quizViewState === 'mcq-selected' ? (
            <div className="flex items-center gap-2">
              <SofiExpressionAvatar expression="thinking" size={32} />
              <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-650 shadow-sm">
                Bạn chọn rồi - kiểm tra đáp án nhé!
              </div>
            </div>
          ) : !isSubmitted && currentQuestion.options ? (
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <button
                type="button"
                disabled={quizHintCount >= 3}
                onClick={handleRequestNextHint}
                className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-primary-blue/25 bg-primary-blue-light/70 px-3 py-1.5 text-xs font-extrabold text-primary-blue-dark shadow-sm transition-colors hover:bg-primary-blue-light disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
              >
                <Sparkles className="h-4 w-4 text-primary-blue" />
                <span>{quizHintCount >= 3 ? 'AI Hint 3/3' : `AI Hint ${quizHintCount}/3`}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMobileSidebarOpen(true);
                  setIsSocraticOpen(true);
                }}
                className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-extrabold text-stone-700 shadow-sm hover:bg-stone-50 sm:flex-none"
              >
                <SofiExpressionAvatar expression="happy" size={24} />
                <span>Sofi</span>
                <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
              </button>
            </div>
          ) : !currentQuestion.options || currentQuestion.expected_answer ? (
            <span className="hidden text-[10px] text-stone-400 font-mono sm:block">
              Điền câu trả lời và tự đánh giá
            </span>
          ) : (
            <span className="hidden sm:block" aria-hidden="true" />
          )}
        </div>

        <div className="w-full sm:w-auto flex flex-wrap gap-2 justify-end">
          {quizViewState === 'mcq-selected' && (
            <>
              <button
                type="button"
                disabled={isSubmittingAnswer}
                onClick={handleClearPendingOption}
                className="min-h-10 flex-1 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-extrabold text-stone-600 shadow-sm transition-all hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
              >
                Bỏ chọn
              </button>
              <button
                type="button"
                disabled={!pendingSelectedOption || isSubmittingAnswer}
                onClick={handleCheckPendingOption}
                className="order-first flex min-h-10 flex-[2] items-center justify-center gap-1.5 rounded-xl border border-primary-green-dark bg-primary-green px-4 py-1.5 text-xs font-black uppercase text-white shadow-sm transition hover:brightness-105 active:translate-y-[1px] sm:order-none sm:flex-none"
              >
                <span>{isSubmittingAnswer ? 'Đang kiểm tra...' : 'Kiểm tra đáp án'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}

          {/* Next Button */}
          {isSubmitted && isEssayCompleted && (
            <button
              onClick={handleNextQuestion}
              disabled={isLoadingNextQuestion}
              className="order-first flex min-h-10 w-full cursor-pointer animate-in items-center justify-center gap-1.5 rounded-xl border border-primary-green-dark bg-primary-green px-4 py-1.5 text-xs font-black uppercase text-white shadow-sm transition duration-200 hover:brightness-105 active:translate-y-[1px] zoom-in-95 disabled:cursor-wait disabled:opacity-75 sm:order-none sm:w-auto sm:flex-none"
            >
              {isLoadingNextQuestion ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
              <span>
                {isLoadingNextQuestion
                  ? 'Đang lấy câu tiếp...'
                  : currentQuestionIdx === totalQuestions - 1
                    ? 'Xem kết quả'
                    : `Tiếp tục câu ${currentQuestionIdx + 2}`}
              </span>
            </button>
          )}

          {/* Back button */}
          {currentQuestionIdx > 0 && (
            <button
              onClick={() => setCurrentQuestionIdx(currentQuestionIdx - 1)}
              className="flex min-h-10 items-center justify-center gap-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-[11px] font-semibold text-stone-700 transition-all hover:bg-stone-100 cursor-pointer sm:text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Lùi lại</span>
            </button>
          )}

          {/* AI Tutor Toggle button */}
          {showSidebarButton && (
            <button
              type="button"
              onClick={() => {
                setIsMobileSidebarOpen(true);
                setIsSocraticOpen(true);
              }}
              className="min-h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-[11px] font-semibold text-stone-700 shadow-sm transition-all hover:bg-stone-100 cursor-pointer sm:flex-none sm:text-xs flex"
            >
              <MessageCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden min-[300px]:inline">{currentHistory?.isCorrect ? 'AI giải thích thêm' : 'Hỏi AI vì sao sai'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Report Modal Overlay */}
      <AnimatePresence>
        {isReportModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border border-stone-200 rounded-2xl w-full max-w-md p-5 shadow-2xl relative flex flex-col gap-4 font-be-vietnam-pro"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                <h4 className="text-sm font-extrabold text-stone-850 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Báo cáo lỗi câu hỏi Quiz
                </h4>
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-50 rounded-lg cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Question Context */}
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider font-mono">Nội dung câu hỏi:</span>
                <p className="text-xs text-stone-700 font-medium line-clamp-2 leading-relaxed">
                  {currentQuestion.question}
                </p>
              </div>

              {/* Form fields */}
              <div className="flex flex-col gap-3">
                {/* Error Type Selector */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider font-mono">Loại lỗi phát hiện:</span>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {[
                      'Sai kiến thức chuyên môn',
                      'Đáp án bị cấu hình sai',
                      'Giải thích chưa chuẩn xác',
                      'Lỗi khác'
                    ].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setReportErrorType(type)}
                        className={`p-2.5 rounded-xl border text-[11px] font-bold text-left cursor-pointer transition-all ${
                          reportErrorType === type
                            ? 'bg-red-50 border-red-500 text-red-755 font-extrabold'
                            : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description details */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider font-mono">Mô tả chi tiết lỗi kiến thức:</span>
                  <textarea
                    value={reportDetail}
                    onChange={(e) => setReportDetail(e.target.value)}
                    placeholder="Mô tả cụ thể lỗi kiến thức hoặc sai sót bạn phát hiện..."
                    className="w-full min-h-[90px] p-2.5 text-xs text-stone-855 bg-stone-50 border border-stone-200 focus:border-red-400 focus:ring-1 focus:ring-red-400/20 rounded-xl focus:outline-none transition-all leading-relaxed"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex gap-2 justify-end pt-2 border-t border-stone-100 mt-1">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-600 rounded-xl font-bold text-xs cursor-pointer hover:bg-stone-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={!reportDetail.trim() || isSubmittingReport}
                  onClick={handleSubmitReport}
                  className={`px-4 py-2 rounded-xl font-extrabold text-xs cursor-pointer transition-all flex items-center gap-1.5 ${
                    reportDetail.trim() && !isSubmittingReport
                      ? 'bg-red-500 hover:bg-red-650 text-white shadow-md shadow-red-500/10 active:scale-95'
                      : 'bg-stone-100 border border-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  {isSubmittingReport ? 'Đang gửi...' : 'Gửi báo cáo'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {zoomedTutorImageUrl && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              onClick={() => setZoomedTutorImageUrl(null)}
              className="fixed inset-0 z-[9999] bg-stone-950/85"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 z-[10000] flex pointer-events-none items-center justify-center md:inset-10"
            >
              <div className="relative flex max-h-[85vh] max-w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-stone-100 bg-white p-2 shadow-2xl pointer-events-auto">
                <button
                  type="button"
                  onClick={() => setZoomedTutorImageUrl(null)}
                  className="absolute right-3 top-3 z-10 rounded-full bg-stone-900/80 p-2 text-white shadow-md transition-colors hover:bg-stone-900"
                  title="Đóng xem lớn"
                >
                  <X className="h-4 w-4 stroke-[2.5]" />
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={zoomedTutorImageUrl}
                  alt="Slide bài học bổ trợ"
                  className="max-h-[80vh] max-w-full rounded-lg object-contain"
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] bg-stone-900/90 backdrop-blur-md text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-stone-850 text-xs font-bold font-be-vietnam-pro"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 animate-bounce" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </motion.div>
  );
}
````

## File: frontend/app/hooks/useQuizSession.ts
````typescript
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import dayjs from 'dayjs';
import posthog from 'posthog-js';
import { trackQuizEvent } from '@/lib/analytics';
import {
  getAllowedTabsForPersona,
  getDefaultTabForPersona,
  resolvePersonaForRole,
  type TabType,
} from '@/lib/dashboard-tabs';
import { getTabForRoute } from '@/lib/dashboard-routes';
import { FALLBACK_DATA } from '@/lib/quiz/constants';
import { getStreak } from '@/lib/quiz/progress';
import type { Question, QuestionsData, Skill } from '@/lib/quiz/types';
import { useBoundStore } from '@/hooks/useBoundStore';
import {
  DEFAULT_ADAPTIVE_COURSE_ID,
  AdaptiveApiError,
  recommendAdaptiveQuestion,
  submitAdaptiveAnswer,
  type AdaptiveSubmitResult,
} from '@/lib/adaptive/api-client';
import { resolveAdaptiveConceptCandidates, resolveAdaptiveConceptId } from '@/lib/adaptive/concept-map';
import { buildAdaptiveQuestion, buildMcqStudentAnswer } from '@/lib/adaptive/quiz-question';

export function useQuizSession(resetSurveys: (setId: string) => void, initialTab: TabType = 'learn') {
  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [hasOpenedChat, setHasOpenedChat] = useState<boolean>(false);

  useEffect(() => {
    const syncInitialTab = window.setTimeout(() => {
      setActiveTab(initialTab);
    }, 0);

    return () => window.clearTimeout(syncInitialTab);
  }, [initialTab]);

  useEffect(() => {
    if (activeTab === 'chat') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasOpenedChat(true);
    }
  }, [activeTab]);

  const [isQuizMode, setIsQuizMode] = useState<boolean>(false);
  const lastInitializedSetIdRef = useRef<string | null>(null);

  // Guidebook inline states
  const [activeGuidebookDayId, setActiveGuidebookDayId] = useState<string | null>(null);
  const [guidebookHtml, setGuidebookHtml] = useState<string>('');
  const [isLoadingGuidebook, setIsLoadingGuidebook] = useState<boolean>(false);

  // Gamified progression state (bound to Zustand Store)
  const {
    xp,
    addXp,
    streak,
    setStreak,
    activeDays,
    addActiveDay,
    completedSets,
    addCompletedSet,
    devMode,
    toggleDevMode,
    name,
    username,
    mssv,
    role,
    loggedIn,
    joinedAt,
    logOut,
    selectedPersona,
    setPersona,
    skills,
    initializeSkills,
    startPracticeSession,
    userId,
    fetchConceptMasteries,
    activePracticeSession,
    conceptMasteries,
    activePracticeQuestions,
    submitPracticeAnswer,
    recordAdaptiveSubmitResult,
    appendActivePracticeQuestion,
    savePracticeSession,
    clearActiveSession,
    token,
    setToken,
  } = useBoundStore();

  useEffect(() => {
    const resolvedPersona = resolvePersonaForRole(selectedPersona, role);
    const allowedTabs = getAllowedTabsForPersona(resolvedPersona, role);
    const defaultTab = getDefaultTabForPersona(resolvedPersona);

    const syncActiveTab = window.setTimeout(() => {
      if (resolvedPersona !== selectedPersona) {
        setPersona(resolvedPersona);
      }
      setActiveTab((currentTab) => {
        if (allowedTabs.has(currentTab)) {
          return currentTab;
        }

        return defaultTab;
      });
    }, 0);

    return () => window.clearTimeout(syncActiveTab);
  }, [role, selectedPersona, setPersona]);

  // Core quiz state
  const [data, setData] = useState<QuestionsData>(FALLBACK_DATA);
  const [activeSetId, setActiveSetId] = useState<string>('day1-basics');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [answersHistory, setAnswersHistory] = useState<{
    [setId: string]: {
      [qId: string]: {
        selected?: string;
        essayAnswer?: string;
        checkedPoints?: string[];
        isCorrect: boolean;
        hintCount?: number;
        adaptiveDecisionId?: string;
        submitResult?: AdaptiveSubmitResult;
      };
    };
  }>({});
  const [showFinishScreen, setShowFinishScreen] = useState<boolean>(false);
  const [essayInput, setEssayInput] = useState<string>('');
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(true);
  const [isLoadingNextQuestion, setIsLoadingNextQuestion] = useState<boolean>(false);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState<boolean>(false);
  const [adaptiveError, setAdaptiveError] = useState<string | null>(null);
  const adaptivePrefetchPromiseRef = useRef<Promise<Question | null> | null>(null);
  const adaptivePrefetchKeyRef = useRef<string | null>(null);
  const adaptiveStartInFlightSetRef = useRef<string | null>(null);

  // Synchronize state changes to URL query parameters (Shallow routing)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const currentMode = params.get('mode');
    const currentSet = params.get('set');
    const currentTab = params.get('tab');
    const routeTab = getTabForRoute(window.location.pathname);

    const nextMode = isQuizMode ? 'quiz' : null;
    const nextSet = isQuizMode ? activeSetId : null;
    const nextTab = !isQuizMode && routeTab !== activeTab ? activeTab : null;

    let hasChanged = false;
    const newUrl = new URL(window.location.href);

    if (isQuizMode) {
      if (currentMode !== 'quiz' || currentSet !== activeSetId) {
        newUrl.searchParams.set('mode', 'quiz');
        newUrl.searchParams.set('set', activeSetId);
        newUrl.searchParams.delete('tab');
        hasChanged = true;
      }
    } else {
      if (currentMode !== null || currentSet !== null || currentTab !== activeTab) {
        newUrl.searchParams.delete('mode');
        newUrl.searchParams.delete('set');
        if (routeTab === activeTab) {
          newUrl.searchParams.delete('tab');
        } else if (activeTab && activeTab !== 'learn') {
          newUrl.searchParams.set('tab', activeTab);
        } else {
          newUrl.searchParams.delete('tab');
        }
        hasChanged = true;
      }
    }

    if (hasChanged) {
      window.history.pushState({ mode: nextMode, set: nextSet, tab: nextTab }, '', newUrl.toString());
    }
  }, [isQuizMode, activeSetId, activeTab]);

  // Listen to browser Back/Forward (popstate)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      const set = params.get('set');
      const tab = params.get('tab') as TabType | null;
      const routeTab = getTabForRoute(window.location.pathname);
      const allowedTabs: TabType[] = [
        'learn',
        'skills',
        'profile',
        'chat',
        'insights',
        'ingestion',
        'quiz-editor',
        'rag-audit',
        'btc-heatmap',
        'braintrust-observability',
      ];

      if (mode === 'quiz' && set) {
        setIsQuizMode(true);
        setActiveSetId(set);
      } else {
        setIsQuizMode(false);
        if (routeTab && allowedTabs.includes(routeTab)) {
          setActiveTab(routeTab);
        } else if (tab && allowedTabs.includes(tab)) {
          setActiveTab(tab);
        } else {
          setActiveTab('learn');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Read initial tab parameter from URL query string on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as TabType | null;
    const routeTab = getTabForRoute(window.location.pathname);
    if (routeTab) {
      const syncRouteTab = window.setTimeout(() => {
        setActiveTab(routeTab);
      }, 0);
      return () => window.clearTimeout(syncRouteTab);
    }

    if (
      tabParam &&
      [
        'learn',
        'skills',
        'profile',
        'chat',
        'insights',
        'ingestion',
        'quiz-editor',
        'rag-audit',
        'btc-heatmap',
        'braintrust-observability',
      ].includes(tabParam)
    ) {
      const syncQueryTab = window.setTimeout(() => {
        setActiveTab(tabParam);
      }, 0);
      return () => window.clearTimeout(syncQueryTab);
    }

    return undefined;
  }, []);

  // Leaderboard scope state
  const [leaderboardScope, setLeaderboardScope] = useState<'daily' | 'global'>('daily');

  // Load guidebook content inline
  const handleSelectGuidebook = async (dayId: string) => {
    setActiveGuidebookDayId(dayId);
    setIsLoadingGuidebook(true);
    setGuidebookHtml('');
    try {
      const response = await fetch(`/api/guidebook/${dayId}`);
      if (response.ok) {
        const resData = await response.json();
        setGuidebookHtml(resData.html || '');
      } else {
        console.error('Failed to fetch guidebook content');
      }
    } catch (err) {
      console.error('Error fetching guidebook:', err);
    } finally {
      setIsLoadingGuidebook(false);
    }
  };

  const handleCloseGuidebook = () => {
    setActiveGuidebookDayId(null);
    setGuidebookHtml('');
  };

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem('edugap_answers_history');
      if (savedHistory) {
        try {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setAnswersHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error('Failed to parse answers history:', e);
        }
      }
    }
  }, []);

  // Synchronize and calculate streak based on activeDays
  useEffect(() => {
    const computedStreak = getStreak(activeDays);
    if (computedStreak !== streak) {
      setStreak(computedStreak);
    }
  }, [activeDays, streak, setStreak]);

  // Reset guidebook view when switching tabs
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveGuidebookDayId(null);
    setGuidebookHtml('');
  }, [activeTab]);

  const activeSet = data.sets.find(s => s.id === activeSetId) || data.sets[0];
  const questionsList = useMemo(() => activeSet?.questions || [], [activeSet]);
  const isAdaptiveSession = activePracticeSession?.mode === 'adaptive' && activePracticeSession.targetSetId === activeSetId;
  const adaptiveMaxQuestions = activePracticeSession?.maxQuestions || 10;
  const totalQuestions = isAdaptiveSession ? adaptiveMaxQuestions : questionsList.length;
  const currentQuestionIdxBounded = questionsList.length > 0 ? Math.min(currentQuestionIdx, questionsList.length - 1) : 0;
  const currentQuestion = questionsList[currentQuestionIdxBounded];

  // Derive active question states on-the-fly based on answersHistory
  const currentHistory = currentQuestion && activeSetId ? answersHistory[activeSetId]?.[currentQuestion.id] : undefined;
  const selectedOption = currentHistory ? currentHistory.selected : null;
  const isSubmitted = !!currentHistory;
  const showExplanation = isSubmitted;
  const isEssayCompleted = currentQuestion && (!currentQuestion.options || currentQuestion.expected_answer)
    ? (selectedOption === 'essay_correct' || selectedOption === 'essay_incorrect')
    : true;

  const getExistingAdaptiveQuestionIds = useCallback((setId: string) => {
    const existingIds = new Set<string>();
    const setQuestions = data.sets.find(set => set.id === setId)?.questions || [];

    [...setQuestions, ...activePracticeQuestions].forEach((question: Question) => {
      if (question?.adaptive?.questionId) {
        existingIds.add(question.adaptive.questionId);
      }
    });

    return Array.from(existingIds);
  }, [activePracticeQuestions, data.sets]);

  const recommendWithConceptFallback = useCallback(async (
    setId: string,
    preferredConceptId?: string | null,
    excludedQuestionIds: string[] = [],
  ) => {
    const resolvedCandidates = resolveAdaptiveConceptCandidates(setId, conceptMasteries);
    const candidateConceptIds = Array.from(new Set((
      preferredConceptId && !resolvedCandidates.includes(preferredConceptId)
        ? [preferredConceptId, ...resolvedCandidates]
        : resolvedCandidates
    ).filter(Boolean) as string[]));

    let lastError: unknown = null;
    for (const conceptId of candidateConceptIds) {
      try {
        const recommendation = await recommendAdaptiveQuestion({
          token,
          setToken,
          studentId: userId as string,
          courseId: DEFAULT_ADAPTIVE_COURSE_ID,
          conceptId,
          excludedQuestionIds,
        });
        return { recommendation, conceptId };
      } catch (error) {
        lastError = error;
        if (!(error instanceof AdaptiveApiError) || error.status !== 404) {
          throw error;
        }
      }
    }

    throw lastError || new Error(`No adaptive recommendation candidates for set ${setId}`);
  }, [conceptMasteries, setToken, token, userId]);

  const putQuestionInActiveSet = useCallback((setId: string, question: Question, replace = false) => {
    setData(prev => ({
      sets: prev.sets.map(set => {
        if (set.id !== setId) return set;
        const nextQuestions = replace
          ? [question]
          : set.questions.some(existing => existing.id === question.id)
            ? set.questions
            : [...set.questions, question];
        return { ...set, questions: nextQuestions };
      })
    }));
  }, []);

  const hydrateActiveSetQuestions = useCallback((setId: string, questions: Question[]) => {
    if (questions.length === 0) return;

    setData(prev => ({
      sets: prev.sets.map(set =>
        set.id === setId
          ? { ...set, questions }
          : set
      )
    }));
  }, []);

  const fetchStaticQuestionsForSet = useCallback(async (setId: string) => {
    const currentSet = data.sets.find(s => s.id === setId);
    const parentId = currentSet?.parent_id || 'day1';

    try {
      const response = await fetch(`/api/questions/${setId}`);
      if (!response.ok) {
        trackQuizEvent('quiz_questions_load_failed', {
          set_id: setId,
          parent_id: parentId
        });
        return null;
      }

      const quizSet = await response.json();
      const questions = quizSet.questions || [];
      setData(prev => ({
        sets: prev.sets.map(s =>
          s.id === setId
            ? { ...s, ...quizSet, questions }
            : s
        )
      }));
      return questions as Question[];
    } catch (err) {
      trackQuizEvent('quiz_questions_load_failed', {
        set_id: setId,
        parent_id: parentId
      });
      console.error('Error fetching questions:', err);
      return null;
    }
  }, [data.sets]);

  const prefetchNextAdaptiveQuestion = useCallback((
    setId: string,
    preferredConceptId: string,
    answeredCount: number,
  ) => {
    if (
      !userId ||
      !activePracticeSession ||
      activePracticeSession.mode !== 'adaptive' ||
      activePracticeSession.targetSetId !== setId ||
      answeredCount >= adaptiveMaxQuestions
    ) {
      return;
    }

    const prefetchKey = `${setId}:${preferredConceptId}:${answeredCount}`;
    if (adaptivePrefetchKeyRef.current === prefetchKey && adaptivePrefetchPromiseRef.current) {
      return;
    }

    const prefetchPromise = recommendWithConceptFallback(setId, preferredConceptId, getExistingAdaptiveQuestionIds(setId))
      .then(({ recommendation, conceptId }) => {
        const question = buildAdaptiveQuestion(recommendation, setId, conceptId);
        putQuestionInActiveSet(setId, question);
        appendActivePracticeQuestion(question);
        return question;
      })
      .catch((error) => {
        console.warn('Adaptive next-question prefetch failed:', error);
        return null;
      })
      .finally(() => {
        if (adaptivePrefetchKeyRef.current === prefetchKey) {
          adaptivePrefetchKeyRef.current = null;
          adaptivePrefetchPromiseRef.current = null;
        }
      });

    adaptivePrefetchKeyRef.current = prefetchKey;
    adaptivePrefetchPromiseRef.current = prefetchPromise;
  }, [
    activePracticeSession,
    adaptiveMaxQuestions,
    appendActivePracticeQuestion,
    putQuestionInActiveSet,
    getExistingAdaptiveQuestionIds,
    recommendWithConceptFallback,
    userId,
  ]);

  const getCompactQuizAnalyticsProperties = useCallback(() => ({
    set_id: activeSetId,
    difficulty: activeSet?.difficulty || null,
    question_count: totalQuestions
  }), [activeSet, activeSetId, totalQuestions]);

  const completeActiveQuiz = useCallback(() => {
    const setHistory = answersHistory[activeSetId] || {};
    const answeredQuestions = questionsList.filter((question: Question) => setHistory[question.id]);
    const correctCount = answeredQuestions.reduce(
      (correct: number, question: Question) => correct + (setHistory[question.id]?.isCorrect ? 1 : 0),
      0
    );
    const attemptedCount = isAdaptiveSession ? Math.min(adaptiveMaxQuestions, answeredQuestions.length) : totalQuestions;

    trackQuizEvent('quiz_completed', {
      ...getCompactQuizAnalyticsProperties(),
      score_percent: attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0,
      correct_count: correctCount
    });

    const isNewCompletion = !completedSets.includes(activeSetId);
    if (isNewCompletion) {
      addCompletedSet(activeSetId);
    }

    addXp(isNewCompletion ? 10 : 5);

    const todayStr = dayjs().format('YYYY-MM-DD');
    if (!activeDays.includes(todayStr)) {
      addActiveDay(todayStr);
    }

    setShowFinishScreen(true);
  }, [
    activeSetId,
    activeDays,
    adaptiveMaxQuestions,
    addActiveDay,
    addCompletedSet,
    addXp,
    answersHistory,
    completedSets,
    getCompactQuizAnalyticsProperties,
    isAdaptiveSession,
    questionsList,
    totalQuestions,
  ]);

  // Toggle Developer mode
  const handleToggleDevMode = () => {
    toggleDevMode();
  };

  // Initialize skills list from manifest on mount
  useEffect(() => {
    async function loadSkillsManifest() {
      try {
        const response = await fetch('/skills-manifest.json');
        if (response.ok) {
          const mData = await response.json();
          if (mData && mData.skills) {
            initializeSkills(mData.skills);
          }
        }
      } catch (err) {
        console.error('Failed to load skills manifest:', err);
      }
    }
    if (skills.length === 0) {
      loadSkillsManifest();
    }
  }, [initializeSkills, skills.length]);

  // Load concept masteries from database when logged in
  useEffect(() => {
    if (loggedIn && userId) {
      fetchConceptMasteries(userId, '00000000-0000-0000-0000-000000000001');
    }
  }, [loggedIn, userId, fetchConceptMasteries]);

  // Fetch the data from quiz-manifest.json
  useEffect(() => {
    async function loadManifest() {
      try {
        const response = await fetch('/quiz-manifest.json');
        if (response.ok) {
          const fetchedData = await response.json();
          if (fetchedData && fetchedData.sets && fetchedData.sets.length > 0) {
            const setsWithEmptyQuestions = fetchedData.sets.map((s: any) => ({
              ...s,
              questions: s.questions || []
            }));
            setData({ sets: setsWithEmptyQuestions });
            
            // Read "set" parameter from URL query string
            const params = new URLSearchParams(window.location.search);
            const querySet = params.get('set')?.toLowerCase();
            
            let targetSetId = fetchedData.sets[0].id;
            let shouldTriggerQuiz = false;
            
            if (querySet) {
              const searchSlug = querySet;
              const found = fetchedData.sets.find((s: any) => {
                const normalizedTitle = s.title
                  .toLowerCase()
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '')
                  .replace(/[đĐ]/g, 'd')
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/(^-|-$)+/g, '');
                
                return (
                  s.id.toLowerCase() === searchSlug ||
                  normalizedTitle === searchSlug ||
                  (searchSlug === 'design-pattern-react' && s.id === 'react-loop-basics') ||
                  (searchSlug === 'react-agent-day3' && s.id === 'react-loop-basics')
                );
              });
              
              if (found) {
                targetSetId = found.id;
                shouldTriggerQuiz = true;
              }
            }
            
            setActiveSetId(targetSetId);
            if (shouldTriggerQuiz) {
              setIsQuizMode(true);
            }
          }
        }
      } catch (err) {
        console.warn('Yeu cau tai quiz-manifest.json khong co ket qua, dang xai du lieu du phong.', err);
      }
    }
    loadManifest();
  }, []);

  // Load questions for the active set dynamically based on parent directory
  useEffect(() => {
    if (!activeSetId || !data.sets || data.sets.length === 0) return;

    const currentSet = data.sets.find(s => s.id === activeSetId);
    const shouldLoadQuestions = isQuizMode || activePracticeSession?.targetSetId === activeSetId;
    if (currentSet && currentSet.questions && currentSet.questions.length > 0) {
      if (
        isQuizMode &&
        adaptiveStartInFlightSetRef.current === activeSetId &&
        !currentSet.questions[0]?.adaptive
      ) {
        return;
      }

      setIsLoadingQuestions(false);

      if (lastInitializedSetIdRef.current !== activeSetId) {
        lastInitializedSetIdRef.current = activeSetId;

        // Auto-initialize practice session in the Zustand store if it matches the current skill
        const skill = skills.find(s => s.associatedSets?.includes(activeSetId));
        const adaptiveConceptId = resolveAdaptiveConceptId(activeSetId, conceptMasteries);
        if (
          isQuizMode &&
          skill &&
          loggedIn &&
          userId &&
          adaptiveConceptId &&
          adaptiveStartInFlightSetRef.current !== activeSetId &&
          !currentSet.questions[0]?.adaptive &&
          (!activePracticeSession ||
            activePracticeSession.skillId !== skill.id ||
            activePracticeSession.targetSetId !== activeSetId ||
            activePracticeSession.mode !== 'adaptive')
        ) {
          recommendWithConceptFallback(activeSetId, adaptiveConceptId)
            .then(({ recommendation, conceptId }) => {
              const question = buildAdaptiveQuestion(recommendation, activeSetId, conceptId);
              putQuestionInActiveSet(activeSetId, question, true);
              clearActiveSession();
              startPracticeSession(skill.id, [question], activeSetId, {
                mode: 'adaptive',
                conceptId,
                maxQuestions: 10,
              });
              setCurrentQuestionIdx(0);
            })
            .catch((error) => {
              console.error('Adaptive auto-start failed:', error);
              setAdaptiveError(
                error instanceof AdaptiveApiError && error.status === 401
                  ? 'Phiên đăng nhập đã hết hạn. Bạn đang luyện bằng bộ câu có sẵn; hãy đăng nhập lại để dùng adaptive.'
                  : 'Chưa đồng bộ được câu adaptive. Bạn vẫn có thể luyện với bộ câu hiện có; điểm mastery sẽ cập nhật khi kết nối ổn định.'
              );
              startPracticeSession(skill.id, currentSet.questions, activeSetId, { mode: 'static-demo' });
            });
          return;
        }

        if (
          skill &&
          (!activePracticeSession ||
            activePracticeSession.skillId !== skill.id ||
            activePracticeSession.targetSetId !== activeSetId)
        ) {
          const firstQuestion = currentSet.questions[0];
          startPracticeSession(skill.id, currentSet.questions, activeSetId, {
            mode: firstQuestion?.adaptive ? 'adaptive' : 'static-demo',
            conceptId: firstQuestion?.adaptive?.conceptId,
            maxQuestions: firstQuestion?.adaptive ? 10 : undefined,
          });
        }

        // Check if we should resume from the saved index in the practice session
        let initialIdx = 0;
        if (activePracticeSession && activePracticeSession.targetSetId === activeSetId) {
          initialIdx = activePracticeSession.currentQuestionIndex;
        } else {
          const setHistory = answersHistory[activeSetId] || {};
          const firstUnanswered = currentSet.questions.findIndex((q: any) => !setHistory[q.id]);
          initialIdx = firstUnanswered !== -1 ? firstUnanswered : 0;
        }
        setCurrentQuestionIdx(initialIdx);
      }
      return;
    }

    if (!shouldLoadQuestions) {
      const idleQuestionsState = window.setTimeout(() => {
        setIsLoadingQuestions(false);
      }, 0);
      return () => window.clearTimeout(idleQuestionsState);
    }

    if (adaptiveStartInFlightSetRef.current === activeSetId) {
      return;
    }

    let isMounted = true;
    async function fetchQuestions() {
      setIsLoadingQuestions(true);
      await fetchStaticQuestionsForSet(activeSetId);
      if (isMounted) {
        setIsLoadingQuestions(false);
      }
    }

    fetchQuestions();
    return () => {
      isMounted = false;
    };
  }, [
    activeSetId,
    data.sets,
    skills,
    activePracticeSession,
    startPracticeSession,
    answersHistory,
    isQuizMode,
    loggedIn,
    userId,
    conceptMasteries,
    token,
    setToken,
    putQuestionInActiveSet,
    clearActiveSession,
    fetchStaticQuestionsForSet,
    recommendWithConceptFallback,
  ]);

  // Load essay input when switching questions
  useEffect(() => {
    if (currentQuestion) {
      const savedEssay = answersHistory[activeSetId]?.[currentQuestion.id]?.essayAnswer || '';
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEssayInput(savedEssay);
    } else {
      setEssayInput('');
    }
  }, [currentQuestionIdx, activeSetId, currentQuestion, answersHistory]);

  // Final MCQ submission. The view may collect a reversible pending option before calling this.
  const handleSelectOption = useCallback(async (optionKey: string, hintCount?: number) => {
    if (isSubmitted || isSubmittingAnswer || !currentQuestion || !currentQuestion.options) return;

    const canGradeLocally = typeof currentQuestion.answer === 'string' && currentQuestion.answer.length > 0;
    const localIsCorrect = canGradeLocally && optionKey === currentQuestion.answer;

    if (isAdaptiveSession && currentQuestion.adaptive && userId) {
      if (!canGradeLocally) {
        setIsSubmittingAnswer(true);
        setAdaptiveError(null);
        try {
          const startedAtMs = Date.parse(currentQuestion.adaptive.startedAt);
          const result = await submitAdaptiveAnswer({
            token,
            setToken,
            studentId: userId,
            courseId: DEFAULT_ADAPTIVE_COURSE_ID,
            conceptId: currentQuestion.adaptive.conceptId,
            questionId: currentQuestion.adaptive.questionId,
            decisionId: currentQuestion.adaptive.decisionId,
            studentAnswer: buildMcqStudentAnswer(optionKey),
            responseTimeMs: Number.isFinite(startedAtMs) ? Math.max(0, Date.now() - startedAtMs) : 0,
            hintCount: hintCount ?? 0,
          });

          posthog.capture('question_answered', {
            set_id: activeSetId,
            question_id: currentQuestion.id,
            question_index: currentQuestionIdx,
            is_correct: result.is_correct,
            selected_option: optionKey,
          });

          const nextHistory = {
            ...answersHistory,
            [activeSetId]: {
              ...(answersHistory[activeSetId] || {}),
              [currentQuestion.id]: {
                selected: optionKey,
                isCorrect: result.is_correct,
                hintCount: hintCount ?? 0,
                adaptiveDecisionId: currentQuestion.adaptive.decisionId,
                submitResult: result,
              }
            }
          };
          setAnswersHistory(nextHistory);
          localStorage.setItem('edugap_answers_history', JSON.stringify(nextHistory));
          recordAdaptiveSubmitResult(currentQuestion.id, optionKey, undefined, result, hintCount);
          prefetchNextAdaptiveQuestion(
            activeSetId,
            currentQuestion.adaptive.conceptId,
            Object.keys(nextHistory[activeSetId] || {}).length,
          );
        } catch (error) {
          console.error('Adaptive submit failed:', error);
          setAdaptiveError(error instanceof Error ? error.message : 'Không thể gửi đáp án adaptive.');
        } finally {
          setIsSubmittingAnswer(false);
        }
        return;
      }

      const optimisticHistory = {
        ...answersHistory,
        [activeSetId]: {
          ...(answersHistory[activeSetId] || {}),
          [currentQuestion.id]: {
            selected: optionKey,
            isCorrect: localIsCorrect,
            hintCount: hintCount ?? 0,
            adaptiveDecisionId: currentQuestion.adaptive.decisionId,
          }
        }
      };
      setAnswersHistory(optimisticHistory);
      localStorage.setItem('edugap_answers_history', JSON.stringify(optimisticHistory));
      if (activePracticeSession && activePracticeSession.targetSetId === activeSetId) {
        submitPracticeAnswer(currentQuestion.id, optionKey, undefined, localIsCorrect, hintCount);
      }

      setIsSubmittingAnswer(true);
      setAdaptiveError(null);
      try {
        const startedAtMs = Date.parse(currentQuestion.adaptive.startedAt);
        const result = await submitAdaptiveAnswer({
          token,
          setToken,
          studentId: userId,
          courseId: DEFAULT_ADAPTIVE_COURSE_ID,
          conceptId: currentQuestion.adaptive.conceptId,
          questionId: currentQuestion.adaptive.questionId,
          decisionId: currentQuestion.adaptive.decisionId,
          studentAnswer: buildMcqStudentAnswer(optionKey),
          responseTimeMs: Number.isFinite(startedAtMs) ? Math.max(0, Date.now() - startedAtMs) : 0,
          hintCount: hintCount ?? 0,
        });

        posthog.capture('question_answered', {
          set_id: activeSetId,
          question_id: currentQuestion.id,
          question_index: currentQuestionIdx,
          is_correct: result.is_correct,
          selected_option: optionKey,
        });

        const serverIsCorrect = result.is_correct;
        setAnswersHistory(prev => {
          const nextHistory = {
            ...prev,
            [activeSetId]: {
              ...(prev[activeSetId] || {}),
              [currentQuestion.id]: {
                selected: optionKey,
                isCorrect: serverIsCorrect,
                hintCount: hintCount ?? 0,
                adaptiveDecisionId: currentQuestion.adaptive!.decisionId,
                submitResult: result,
              }
            }
          };
          localStorage.setItem('edugap_answers_history', JSON.stringify(nextHistory));
          return nextHistory;
        });
        recordAdaptiveSubmitResult(currentQuestion.id, optionKey, undefined, result, hintCount);
        prefetchNextAdaptiveQuestion(
          activeSetId,
          currentQuestion.adaptive.conceptId,
          Object.keys(optimisticHistory[activeSetId] || {}).length,
        );
      } catch (error) {
        console.error('Adaptive submit failed:', error);
        setAdaptiveError('Đã hiển thị đáp án từ dữ liệu câu hỏi. Chưa đồng bộ được điểm adaptive, hãy thử tiếp tục hoặc quay lại sau.');
      } finally {
        setIsSubmittingAnswer(false);
      }
      return;
    }

    posthog.capture('question_answered', {
      set_id: activeSetId,
      question_id: currentQuestion.id,
      question_index: currentQuestionIdx,
      is_correct: localIsCorrect,
      selected_option: optionKey,
    });

    const nextHistory = {
      ...answersHistory,
      [activeSetId]: {
        ...(answersHistory[activeSetId] || {}),
        [currentQuestion.id]: {
          selected: optionKey,
          isCorrect: localIsCorrect,
          hintCount: hintCount ?? 0,
        }
      }
    };
    setAnswersHistory(nextHistory);
    localStorage.setItem('edugap_answers_history', JSON.stringify(nextHistory));

    // Update Zustand activePracticeSession if we are in quiz mode
    if (activePracticeSession && activePracticeSession.targetSetId === activeSetId) {
      submitPracticeAnswer(currentQuestion.id, optionKey, undefined, localIsCorrect, hintCount);
    }
  }, [
    activeSetId,
    currentQuestion,
    currentQuestionIdx,
    isSubmitted,
    isSubmittingAnswer,
    answersHistory,
    activePracticeSession,
    submitPracticeAnswer,
    isAdaptiveSession,
    userId,
    token,
    setToken,
    recordAdaptiveSubmitResult,
    prefetchNextAdaptiveQuestion,
  ]);

  // Submit the essay text
  const handleSubmitEssay = useCallback(() => {
    if (isSubmitted || !currentQuestion || !essayInput.trim()) return;

    posthog.capture('essay_submitted', {
      set_id: activeSetId,
      question_id: currentQuestion.id,
      question_index: currentQuestionIdx,
      answer_length: essayInput.trim().length,
    });

    const nextHistory = {
      ...answersHistory,
      [activeSetId]: {
        ...(answersHistory[activeSetId] || {}),
        [currentQuestion.id]: {
          essayAnswer: essayInput,
          isCorrect: false, // Default false until graded
          selected: 'essay_submitted',
          checkedPoints: []
        }
      }
    };
    setAnswersHistory(nextHistory);
    localStorage.setItem('edugap_answers_history', JSON.stringify(nextHistory));
  }, [activeSetId, currentQuestion, currentQuestionIdx, essayInput, isSubmitted, answersHistory]);

  // Grade the essay (user clicks Correct or Incorrect)
  const handleGradeEssay = useCallback((isCorrect: boolean, hintCount?: number) => {
    if (!currentQuestion || !currentHistory) return;

    posthog.capture('essay_graded', {
      set_id: activeSetId,
      question_id: currentQuestion.id,
      question_index: currentQuestionIdx,
      is_correct: isCorrect,
      checked_points_count: currentHistory.checkedPoints?.length ?? 0,
    });

    const nextHistory = {
      ...answersHistory,
      [activeSetId]: {
        ...(answersHistory[activeSetId] || {}),
        [currentQuestion.id]: {
          ...answersHistory[activeSetId][currentQuestion.id],
          isCorrect,
          selected: isCorrect ? 'essay_correct' : 'essay_incorrect',
          hintCount: hintCount ?? answersHistory[activeSetId][currentQuestion.id]?.hintCount ?? 0
        }
      }
    };
    setAnswersHistory(nextHistory);
    localStorage.setItem('edugap_answers_history', JSON.stringify(nextHistory));

    // Update Zustand activePracticeSession
    if (activePracticeSession && activePracticeSession.targetSetId === activeSetId) {
      submitPracticeAnswer(currentQuestion.id, undefined, currentHistory.essayAnswer, isCorrect, hintCount);
    }
  }, [activeSetId, currentQuestion, currentQuestionIdx, currentHistory, answersHistory, activePracticeSession, submitPracticeAnswer]);

  // Toggle checklist for evaluation points
  const handleToggleEvaluationPoint = useCallback((point: string) => {
    if (!currentQuestion || !currentHistory) return;

    const currentPoints = currentHistory.checkedPoints || [];
    const newPoints = currentPoints.includes(point)
      ? currentPoints.filter(p => p !== point)
      : [...currentPoints, point];

    const nextHistory = {
      ...answersHistory,
      [activeSetId]: {
        ...(answersHistory[activeSetId] || {}),
        [currentQuestion.id]: {
          ...answersHistory[activeSetId][currentQuestion.id],
          checkedPoints: newPoints
        }
      }
    };
    setAnswersHistory(nextHistory);
    localStorage.setItem('edugap_answers_history', JSON.stringify(nextHistory));
  }, [activeSetId, currentQuestion, currentHistory, answersHistory]);

  // Move to next question or show finish details
  const handleNextQuestion = useCallback(async () => {
    if (isAdaptiveSession) {
      const answeredCount = Object.keys(answersHistory[activeSetId] || {}).length;
      if (answeredCount >= adaptiveMaxQuestions) {
        completeActiveQuiz();
        return;
      }

      const moveToNextPrefetchedQuestion = () => {
        const nextIdx = currentQuestionIdx + 1;
        setCurrentQuestionIdx(nextIdx);
        savePracticeSession(nextIdx);
      };

      if (questionsList[currentQuestionIdx + 1]) {
        moveToNextPrefetchedQuestion();
        return;
      }

      if (!activePracticeSession?.conceptId || !userId) {
        setAdaptiveError('Không có concept adaptive cho phiên này. Vui lòng khởi động lại quiz.');
        return;
      }

      setIsLoadingNextQuestion(true);
      setAdaptiveError(null);
      try {
        const pendingPrefetch = adaptivePrefetchKeyRef.current?.startsWith(`${activeSetId}:`)
          ? adaptivePrefetchPromiseRef.current
          : null;
        if (pendingPrefetch) {
          const prefetchedQuestion = await pendingPrefetch;
          if (prefetchedQuestion) {
            moveToNextPrefetchedQuestion();
            return;
          }
        }

        const { recommendation, conceptId } = await recommendWithConceptFallback(
          activeSetId,
          activePracticeSession.conceptId,
          getExistingAdaptiveQuestionIds(activeSetId),
        );
        const question = buildAdaptiveQuestion(recommendation, activeSetId, conceptId);
        putQuestionInActiveSet(activeSetId, question);
        appendActivePracticeQuestion(question);

        const nextIdx = currentQuestionIdx + 1;
        setCurrentQuestionIdx(nextIdx);
        savePracticeSession(nextIdx);
      } catch (error) {
        console.error('Adaptive recommend failed:', error);
        setAdaptiveError('Không lấy được câu adaptive tiếp theo. Vui lòng thử lại hoặc quay lại sau.');
      } finally {
        setIsLoadingNextQuestion(false);
      }
      return;
    }

    if (currentQuestionIdx === totalQuestions - 1) {
      completeActiveQuiz();
      return;
    }

    const nextIdx = currentQuestionIdx + 1;
    setCurrentQuestionIdx(nextIdx);
    if (activePracticeSession && activePracticeSession.targetSetId === activeSetId) {
      savePracticeSession(nextIdx);
    }
  }, [
    activeSetId,
    activePracticeSession,
    adaptiveMaxQuestions,
    answersHistory,
    appendActivePracticeQuestion,
    completeActiveQuiz,
    currentQuestionIdx,
    getExistingAdaptiveQuestionIds,
    isAdaptiveSession,
    putQuestionInActiveSet,
    questionsList,
    recommendWithConceptFallback,
    savePracticeSession,
    totalQuestions,
    userId,
  ]);

  // Helper to reset quiz progress cleanly
  const resetQuizProgress = useCallback((setId: string) => {
    const nextHistory = { ...answersHistory };
    delete nextHistory[setId];
    setAnswersHistory(nextHistory);
    localStorage.setItem('edugap_answers_history', JSON.stringify(nextHistory));

    // Delegate survey reset
    resetSurveys(setId);
  }, [answersHistory, resetSurveys]);

  // Reset the current active set
  const handleRestart = useCallback(async () => {
    posthog.capture('quiz_restarted', {
      set_id: activeSetId,
      difficulty: activeSet.difficulty ?? null,
      question_count: totalQuestions,
    });

    lastInitializedSetIdRef.current = null;
    setCurrentQuestionIdx(0);
    setShowFinishScreen(false);
    setEssayInput('');
    
    resetQuizProgress(activeSetId);

    // Also restart the practice session in the store!
    const skill = skills.find(s => s.associatedSets?.includes(activeSetId));
    if (skill && isAdaptiveSession) {
      clearActiveSession();
      const conceptId = resolveAdaptiveConceptId(activeSetId, conceptMasteries) || activePracticeSession?.conceptId;
      if (!loggedIn || !userId || !conceptId) {
        setAdaptiveError('Phiên này đang dùng bộ câu có sẵn vì chưa xác định được concept adaptive cho tài khoản của bạn.');
        if (activeSet.questions) {
          startPracticeSession(skill.id, activeSet.questions, activeSetId, { mode: 'static-demo' });
        }
        return;
      }

      setIsLoadingQuestions(true);
      try {
        const { recommendation, conceptId: resolvedConceptId } = await recommendWithConceptFallback(activeSetId, conceptId);
        const question = buildAdaptiveQuestion(recommendation, activeSetId, resolvedConceptId);
        putQuestionInActiveSet(activeSetId, question, true);
        startPracticeSession(skill.id, [question], activeSetId, {
          mode: 'adaptive',
          conceptId: resolvedConceptId,
          maxQuestions: 10,
        });
      } catch (error) {
        console.error('Adaptive restart failed:', error);
        setAdaptiveError('Chưa đồng bộ được câu adaptive. Bạn vẫn có thể luyện với bộ câu hiện có; điểm mastery sẽ cập nhật khi kết nối ổn định.');
        startPracticeSession(skill.id, activeSet.questions, activeSetId, { mode: 'static-demo' });
      } finally {
        setIsLoadingQuestions(false);
      }
      return;
    }

    if (skill && activeSet.questions) {
      clearActiveSession();
      startPracticeSession(skill.id, activeSet.questions, activeSetId, { mode: 'static-demo' });
    }
  }, [
    activePracticeSession?.conceptId,
    activeSetId,
    activeSet,
    clearActiveSession,
    conceptMasteries,
    isAdaptiveSession,
    loggedIn,
    putQuestionInActiveSet,
    recommendWithConceptFallback,
    resetQuizProgress,
    skills,
    startPracticeSession,
    totalQuestions,
    userId,
  ]);

  const handleExitQuiz = useCallback(() => {
    setIsQuizMode(false);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('set');
      window.history.pushState({}, '', url.pathname);
    }
  }, []);

  // Triggered when starting practice from path (either for a specific concept/set, or for all sets)
  const handleStartPractice = useCallback(async (skill?: Skill, targetSetId?: string) => {
    if (!skill) {
      setAdaptiveError('Chưa tìm thấy kỹ năng để luyện tập. Hãy chọn lại một kỹ năng trong lộ trình học.');
      return;
    }

    const setId = targetSetId || skill?.associatedSets?.[0];
    if (!setId) {
      setAdaptiveError('Kỹ năng này chưa có học phần luyện tập. Hãy chọn kỹ năng khác hoặc quay lại sau.');
      return;
    }

    const nextSet = data.sets.find((set) => set.id === setId);
    trackQuizEvent('quiz_started', {
      set_id: setId,
      difficulty: nextSet?.difficulty || null,
      question_count: nextSet?.questions?.length || 0,
    });

    // Directly open in normal Quiz mode
    setActiveSetId(setId);
    setCurrentQuestionIdx(0);
    setShowFinishScreen(false);
    setEssayInput('');
    setIsQuizMode(true);
    setAdaptiveError(null);

    const isResumingActiveSession =
      activePracticeSession?.skillId === skill.id &&
      activePracticeSession.targetSetId === setId;

    if (isResumingActiveSession) {
      const sessionQuestions = activePracticeQuestions.length > 0
        ? activePracticeQuestions
        : nextSet?.questions || [];
      hydrateActiveSetQuestions(setId, sessionQuestions as Question[]);
      setCurrentQuestionIdx(activePracticeSession.currentQuestionIndex);
      setIsLoadingQuestions(false);
      return;
    }

    // Update URL query param to make it shareable
    const slug = setId === 'react-loop-basics' ? 'design-pattern-react' : setId;
    const newUrl = `${window.location.pathname}?set=${slug}`;
    window.history.pushState({ path: newUrl }, '', newUrl);

    const conceptId = resolveAdaptiveConceptId(setId, conceptMasteries);
    if (!loggedIn || !userId || !conceptId) {
      const fallbackQuestions = nextSet?.questions?.length
        ? nextSet.questions
        : await fetchStaticQuestionsForSet(setId);
      if (fallbackQuestions?.length) {
        clearActiveSession();
        startPracticeSession(skill.id, fallbackQuestions, setId, { mode: 'static-demo' });
      }
      setAdaptiveError('Phiên này đang dùng bộ câu có sẵn vì chưa xác định được concept adaptive cho tài khoản của bạn.');
      return;
    }

    setIsLoadingQuestions(true);
    adaptiveStartInFlightSetRef.current = setId;
    try {
      const { recommendation, conceptId: resolvedConceptId } = await recommendWithConceptFallback(setId, conceptId);
      const question = buildAdaptiveQuestion(recommendation, setId, resolvedConceptId);
      putQuestionInActiveSet(setId, question, true);
      clearActiveSession();
      startPracticeSession(skill.id, [question], setId, {
        mode: 'adaptive',
        conceptId: resolvedConceptId,
        maxQuestions: 10,
      });
      setAnswersHistory(prev => {
        const next = { ...prev, [setId]: {} };
        localStorage.setItem('edugap_answers_history', JSON.stringify(next));
        return next;
      });
    } catch (error) {
      console.error('Adaptive start failed:', error);
      const fallbackQuestions = nextSet?.questions?.length
        ? nextSet.questions
        : await fetchStaticQuestionsForSet(setId);
      if (fallbackQuestions?.length) {
        clearActiveSession();
        startPracticeSession(skill.id, fallbackQuestions, setId, { mode: 'static-demo' });
      }
      setAdaptiveError(
        error instanceof AdaptiveApiError && error.status === 401
          ? 'Phiên đăng nhập đã hết hạn. Bạn đang luyện bằng bộ câu có sẵn; hãy đăng nhập lại để dùng adaptive.'
          : 'Chưa đồng bộ được câu adaptive. Bạn vẫn có thể luyện với bộ câu hiện có; điểm mastery sẽ cập nhật khi kết nối ổn định.'
      );
    } finally {
      if (adaptiveStartInFlightSetRef.current === setId) {
        adaptiveStartInFlightSetRef.current = null;
      }
      setIsLoadingQuestions(false);
    }
  }, [
    activePracticeQuestions,
    activePracticeSession,
    clearActiveSession,
    conceptMasteries,
    data.sets,
    hydrateActiveSetQuestions,
    fetchStaticQuestionsForSet,
    loggedIn,
    putQuestionInActiveSet,
    recommendWithConceptFallback,
    startPracticeSession,
    userId,
  ]);

  // Calculate score for the active set
  const getActiveSetCorrectCount = useCallback(() => {
    let correct = 0;
    const setHistory = answersHistory[activeSetId] || {};
    activeSet?.questions.forEach((q: any) => {
      if (setHistory[q.id]?.isCorrect) {
        correct += 1;
      }
    });
    return correct;
  }, [answersHistory, activeSetId, activeSet]);

  // Find incorrectly answered questions
  const getIncorrectQuestions = useCallback(() => {
    const setHistory = answersHistory[activeSetId] || {};
    return activeSet?.questions.filter((q: any) => {
      const record = setHistory[q.id];
      return record && !record.isCorrect;
    }) || [];
  }, [answersHistory, activeSetId, activeSet]);

  const progressPercent = totalQuestions > 0 ? Math.min(100, Math.round(((currentQuestionIdx + (isSubmitted ? 1 : 0)) / totalQuestions) * 100)) : 0;

  return {
    activeTab,
    setActiveTab,
    hasOpenedChat,
    isQuizMode,
    handleExitQuiz,
    handleStartPractice,
    getActiveSetCorrectCount,
    getIncorrectQuestions,
    progressPercent,
    // Store states
    xp,
    streak,
    activeDays,
    completedSets,
    devMode,
    name,
    username,
    mssv,
    role,
    loggedIn,
    joinedAt,
    logOut,
    selectedPersona,
    setPersona,
    skills,
    activePracticeSession,
    // Quiz state & handlers
    data,
    activeSetId,
    activeSet,
    questionsList,
    totalQuestions,
    currentQuestionIdx,
    currentQuestion,
    currentHistory,
    selectedOption,
    isSubmitted,
    showExplanation,
    isEssayCompleted,
    isLoadingQuestions,
    isLoadingNextQuestion,
    isSubmittingAnswer,
    adaptiveError,
    showFinishScreen,
    essayInput,
    setEssayInput,
    answersHistory,
    handleSelectOption,
    handleSubmitEssay,
    handleGradeEssay,
    handleToggleEvaluationPoint,
    handleNextQuestion,
    setCurrentQuestionIdx,
    handleRestart,
    // Guidebook & Dev Mode & Leaderboard
    activeGuidebookDayId,
    guidebookHtml,
    isLoadingGuidebook,
    handleCloseGuidebook,
    handleToggleDevMode,
    handleSelectGuidebook,
    leaderboardScope,
    setLeaderboardScope,
  };
}
````
