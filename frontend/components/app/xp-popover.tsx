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
          <p className="text-caption-tight font-black uppercase tracking-[0.16em] text-primary-green-dark">XP hiện có</p>
          <p className="mt-0.5 text-xl font-black leading-tight text-on-background">{xp.toLocaleString('vi-VN')} XP</p>
          <p className="mt-1 text-label-tight font-bold leading-4 text-stone-500">
            XP tăng khi hoàn thành bài luyện và giữ nhịp học đều.
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-primary-green/15 bg-primary-green/5 p-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-caption-tight font-black uppercase tracking-[0.14em] text-primary-green-dark">
            <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
            Level {level.level}
          </div>
          <span className="font-mono text-caption-tight font-black text-stone-500">
            {level.progress}%
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white ring-1 ring-primary-green/10">
          <div className="h-full rounded-full bg-primary-green" style={{ width: `${level.progress}%` }} />
        </div>
        <p className="mt-2 text-caption-tight font-bold text-stone-500">
          {xp.toLocaleString('vi-VN')} / {level.nextLevelXp.toLocaleString('vi-VN')} XP tới level kế tiếp
        </p>
      </div>
    </div>
  );
}

export default XpPopover;
