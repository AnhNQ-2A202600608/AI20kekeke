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
          <p className="text-caption-tight font-black uppercase tracking-[0.16em] text-orange-600">Streak hiện có</p>
          <p className="mt-0.5 text-xl font-black leading-tight text-on-background">{streak} ngày</p>
          <p className="mt-1 text-label-tight font-bold leading-4 text-stone-500">
            {hasStudiedToday ? 'Hôm nay đã giữ streak.' : 'Học một phiên ngắn để giữ streak hôm nay.'}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-gray-border bg-surface-container-low p-2.5">
        <div className="mb-2 flex items-center gap-1.5 text-caption-tight font-black uppercase tracking-[0.14em] text-stone-500">
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
                    'mx-auto grid h-7 w-7 place-items-center rounded-full border text-caption-tight font-black',
                    isActive
                      ? 'border-accent-orange/30 bg-orange-100 text-orange-600'
                      : 'border-gray-border bg-white text-stone-300',
                  ].join(' ')}
                  aria-label={`${day.label}: ${isActive ? 'có học' : 'chưa học'}`}
                >
                  {isActive ? '✓' : '·'}
                </div>
                <p className="mt-1 text-badge-micro font-bold text-stone-400">{day.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default StreakPopover;
