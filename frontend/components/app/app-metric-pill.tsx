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
