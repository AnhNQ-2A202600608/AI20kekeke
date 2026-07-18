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
