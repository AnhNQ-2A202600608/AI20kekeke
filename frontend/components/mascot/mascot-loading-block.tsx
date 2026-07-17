'use client';

import { motion } from 'motion/react';

import { SofiStateMascot } from './sofi-state-mascot';

interface MascotLoadingBlockProps {
  title?: string;
  description?: string;
  className?: string;
  mascotClassName?: string;
}

export function MascotLoadingBlock({
  title = 'Sofi đang chuẩn bị dữ liệu...',
  description = 'Hệ thống đang nạp nội dung học tập',
  className = '',
  mascotClassName = '',
}: MascotLoadingBlockProps) {
  return (
    <div
      className={`relative flex min-h-[14rem] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-primary-green/15 bg-white p-6 text-center shadow-sm ${className}`}
      aria-live="polite"
    >
      <div className="pointer-events-none absolute inset-x-8 top-8 h-20 rounded-full bg-primary-green/10 blur-3xl" />

      <SofiStateMascot
        state="loading"
        size="sm"
        className={`relative scale-[0.9] ${mascotClassName}`}
      />

      <div className="relative mt-1 space-y-1">
        <h3 className="font-fraunces text-sm font-bold text-on-background">{title}</h3>
        <p className="text-[10px] font-mono text-stone-400">{description}</p>
      </div>

      <div className="relative mt-4 h-2 w-44 overflow-hidden rounded-full bg-primary-green/10">
        <motion.div
          className="h-full w-20 rounded-full bg-primary-green"
          animate={{ x: [-80, 176] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
}
