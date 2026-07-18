'use client';

import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface EloCounterAnimation {
  id: string;
  oldElo: number;
  newElo: number;
}

interface EloCounterProps {
  animation?: EloCounterAnimation | null;
  value: number;
}

interface RollingDigitProps {
  direction: 'down' | 'up';
  from: string;
  shouldAnimate: boolean;
  to: string;
}

const DIGIT_WIDTH_EM = 0.62;
const ROLL_DURATION_SECONDS = 0.72;

function getRollSequence(from: string, to: string, direction: 'down' | 'up') {
  if (!/^[0-9]$/.test(from) || !/^[0-9]$/.test(to)) return [from, to];

  const sequence = [from];
  const target = Number(to);
  let current = Number(from);

  while (current !== target && sequence.length <= 10) {
    current = direction === 'up'
      ? (current + 1) % 10
      : (current + 9) % 10;
    sequence.push(String(current));
  }

  return sequence;
}

function RollingDigit({ direction, from, shouldAnimate, to }: RollingDigitProps) {
  const isChanged = from !== to;
  const isAdded = from === ' ';
  const isRemoved = to === ' ';
  const finalWidth = isRemoved ? 0 : DIGIT_WIDTH_EM;

  if (!isChanged || !shouldAnimate) {
    return (
      <span
        className="inline-flex h-[1em] items-center justify-center leading-none"
        style={{ width: `${finalWidth}em` }}
      >
        {to === ' ' ? '\u00A0' : to}
      </span>
    );
  }

  const sequence = getRollSequence(from, to, direction);
  const trackDigits = direction === 'down' ? [...sequence].reverse() : sequence;
  const steps = trackDigits.length - 1;
  const initialY = direction === 'down' ? `-${steps}em` : '0em';
  const targetY = direction === 'down' ? '0em' : `-${steps}em`;

  return (
    <motion.span
      initial={{ width: `${isAdded ? 0 : DIGIT_WIDTH_EM}em` }}
      animate={{ width: `${finalWidth}em` }}
      transition={{ duration: 0.24, delay: isRemoved ? 0.48 : 0, ease: 'easeOut' }}
      className="relative inline-block h-[1em] overflow-hidden align-[-0.08em] leading-none"
    >
      <motion.span
        initial={{ y: initialY }}
        animate={{ y: targetY }}
        transition={{ duration: ROLL_DURATION_SECONDS, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-x-0 top-0 flex flex-col will-change-transform"
      >
        {trackDigits.map((digit, index) => (
          <span
            key={`${digit}-${index}`}
            className="flex h-[1em] items-center justify-center leading-none"
          >
            {digit === ' ' ? '\u00A0' : digit}
          </span>
        ))}
      </motion.span>
    </motion.span>
  );
}

interface RollingEloNumberProps {
  animationId: string;
  direction: 'down' | 'up';
  from: number;
  shouldAnimate: boolean;
  to: number;
}

function RollingEloNumber({
  animationId,
  direction,
  from,
  shouldAnimate,
  to,
}: RollingEloNumberProps) {
  const fromText = String(Math.max(0, Math.round(from)));
  const toText = String(Math.max(0, Math.round(to)));
  const digitCount = Math.max(fromText.length, toText.length);
  const fromDigits = fromText.padStart(digitCount, ' ').split('');
  const toDigits = toText.padStart(digitCount, ' ').split('');

  return (
    <span className="inline-flex" key={animationId}>
      {toDigits.map((digit, index) => (
        <RollingDigit
          key={`${animationId}-${index}`}
          direction={direction}
          from={fromDigits[index]}
          shouldAnimate={shouldAnimate}
          to={digit}
        />
      ))}
    </span>
  );
}

export function EloCounter({ animation, value }: EloCounterProps) {
  const targetElo = Math.round(value);
  const oldElo = Math.round(animation?.oldElo ?? targetElo);
  const newElo = Math.round(animation?.newElo ?? targetElo);
  const delta = newElo - oldElo;
  const shouldReduceMotion = useReducedMotion();
  const shouldRoll = Boolean(animation && targetElo === newElo && delta !== 0);
  const direction = delta < 0 ? 'down' : 'up';
  const changeClassName = delta > 0
    ? 'text-primary-green-dark'
    : delta < 0
      ? 'text-error-red-dark'
      : 'text-primary-blue';
  const changeLabel = delta > 0
    ? `tăng ${delta} điểm`
    : delta < 0
      ? `giảm ${Math.abs(delta)} điểm`
      : 'không đổi';

  return (
    <>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Elo {targetElo}, {changeLabel}
      </span>
      <motion.span
        key={animation?.id ?? 'elo-idle'}
        aria-hidden="true"
        animate={animation && !shouldReduceMotion
          ? { scale: [1, 1, 1.12, 1] }
          : { scale: 1 }}
        transition={{ duration: 0.42, delay: 0.58, ease: 'easeOut' }}
        className={cn('inline-flex items-center gap-1 tabular-nums', animation && changeClassName)}
      >
        <span>Elo</span>
        {shouldRoll ? (
          <RollingEloNumber
            animationId={animation!.id}
            direction={direction}
            from={oldElo}
            shouldAnimate={!shouldReduceMotion}
            to={newElo}
          />
        ) : (
          <span>{targetElo}</span>
        )}
        {animation && delta !== 0 ? (
          <motion.span
            initial={shouldReduceMotion ? false : { opacity: 0, x: -3, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn('text-kicker-micro font-black', changeClassName)}
          >
            {delta > 0 ? '+' : ''}{delta}
          </motion.span>
        ) : null}
      </motion.span>
    </>
  );
}

export default EloCounter;
