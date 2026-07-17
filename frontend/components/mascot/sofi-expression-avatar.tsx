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
