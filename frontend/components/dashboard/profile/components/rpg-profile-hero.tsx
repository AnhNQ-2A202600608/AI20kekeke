import React from 'react';
import dayjs from 'dayjs';
import Image from 'next/image';
import { Leaf, ShieldCheck, Sparkles } from 'lucide-react';
import { TactilePanel } from '@/components/ui/learning';
import { ConceptMastery } from '../utils/profile-utils';
import { getLearningHealth, getProfileLevel } from '../utils/profile-metaphors';

interface RpgProfileHeroProps {
  name: string;
  username: string;
  joinedAt: string;
  mssv?: string;
  role?: string;
  xp: number;
  streak: number;
  zpdConceptsCount: number;
  concepts: ConceptMastery[];
}

export function RpgProfileHero({
  name,
  username,
  joinedAt,
  mssv,
  role,
  xp,
  streak,
  zpdConceptsCount,
  concepts,
}: RpgProfileHeroProps) {
  const level = getProfileLevel(xp);
  const health = getLearningHealth(concepts, streak);
  const healthScore = Math.max(0, Math.min(100, health.score));
  const displayName = name || 'Học viên EduGap';
  const initials = displayName.substring(0, 2);

  return (
    <TactilePanel className="overflow-hidden !p-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_11rem]">
        <div className="grid min-w-0 gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
          <div className="relative mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-[1.1rem] border border-primary-green/25 bg-primary-green/10 pb-5 sm:mx-0 sm:h-28 sm:w-28">
            <Image
              src="/mascot/edo/edo-sofi-shoulder-companion.webp"
              alt=""
              width={112}
              height={112}
              className="h-full w-full rounded-2xl object-contain object-bottom opacity-95"
              loading="lazy"
            />
            <span className="absolute bottom-1 left-1/2 min-w-14 -translate-x-1/2 rounded-lg border border-primary-green/70 bg-primary-green px-2.5 py-0.5 text-center text-caption-tight font-black leading-none text-white">
              Lv. {level.level}
            </span>
            <span className="sr-only">{initials}</span>
          </div>

          <div className="min-w-0 space-y-2 text-left">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-kicker-micro font-black uppercase tracking-widest text-primary-green-dark">
                <Leaf className="h-3 w-3" />
                Hồ sơ học tập
              </p>
              <h2 className="mt-0.5 truncate text-xl font-black leading-tight text-on-background">
                {displayName}
              </h2>
              <p className="text-label-tight font-bold text-stone-500">Người chăm vườn kỹ năng</p>
              <p className="mt-0.5 text-kicker-micro font-mono font-bold uppercase tracking-wider text-stone-400">
                {mssv ? `${mssv} · ` : ''}{role ? role.toUpperCase() : username ? `@${username}` : 'Chưa lập hồ sơ'} · Từ{' '}
                {dayjs(joinedAt).isValid() ? dayjs(joinedAt).format('MM/YYYY') : '06/2026'}
              </p>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between gap-3 text-caption-tight font-bold text-stone-500">
                <span>{xp.toLocaleString('vi-VN')} / {level.nextLevelXp.toLocaleString('vi-VN')} XP</span>
                <span>đến Lv. {level.level + 1}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full border border-primary-green/20 bg-stone-100">
                <div className="h-full rounded-full bg-primary-green" style={{ width: `${level.progress}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-full flex-col items-center justify-center gap-2 px-1 text-center">
          <div className="flex items-center justify-center gap-1.5 text-kicker-micro font-black uppercase tracking-widest text-primary-green-dark">
            <span>Sức khỏe học tập</span>
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          </div>

          <div className="grid h-20 w-20 place-items-center rounded-full shadow-sm shadow-primary-green/10">
            <div
              className="grid h-full w-full place-items-center rounded-full p-1.5"
              style={{
                background: `conic-gradient(#58cc02 ${healthScore * 3.6}deg, rgba(88, 204, 2, 0.14) 0deg)`,
              }}
              aria-label={`Sức khỏe học tập ${healthScore}%`}
            >
              <div className="grid h-full w-full place-items-center rounded-full bg-white">
                <div className="text-center leading-none">
                  <p className="font-mono text-lg font-black text-on-background">{healthScore}%</p>
                  <p className="mt-0.5 text-annotation-micro font-black uppercase text-primary-green-dark">{health.label}</p>
                </div>
              </div>
            </div>
          </div>

          <p className="line-clamp-2 text-caption-tight font-bold leading-snug text-stone-500">{health.detail}</p>
          <div className="flex items-center gap-1.5 text-kicker-micro font-black text-stone-500">
            <Sparkles className="h-3.5 w-3.5 text-tertiary-yellow-dark" />
            {zpdConceptsCount} vùng mở
          </div>
        </div>
      </div>
    </TactilePanel>
  );
}
