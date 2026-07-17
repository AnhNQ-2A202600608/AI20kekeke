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
