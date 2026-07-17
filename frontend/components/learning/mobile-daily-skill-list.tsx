'use client';

import type { DetailConceptItem, DetailConceptState } from '@/components/learning/day-detail-card';
import { SofiExpressionAvatar } from '@/components/mascot';
import { getSofiExpressionForConceptState } from './learning-visual-asset-map';
import { MasterySeedBadge } from './mastery-seed-badge';
import { MasterySeedSkillCard } from './mastery-seed-skill-card';
import { MasterySoilStrip } from './mastery-soil-strip';

interface MobileDailySkillListProps {
  items: DetailConceptItem[];
  selectedConceptId: string | null;
  onSelectConcept: (conceptId: string) => void;
  density?: 'comfortable' | 'compact';
}

const stateMeta: Record<
  DetailConceptState,
  { label: string; seedState?: 'locked' | 'review'; badgeClassName: string; panelClassName: string }
> = {
  mastered: {
    label: 'Ổn định',
    badgeClassName: 'border-tertiary-yellow-dark bg-tertiary-yellow text-stone-950',
    panelClassName: 'border-tertiary-yellow/60 bg-tertiary-yellow/10',
  },
  learning: {
    label: 'Đang học',
    badgeClassName: 'border-primary-green-dark bg-primary-green text-white',
    panelClassName: 'border-primary-green/40 bg-primary-green/5',
  },
  weak: {
    label: 'Cần vá',
    seedState: 'review',
    badgeClassName: 'border-error-red-dark bg-error-red text-white',
    panelClassName: 'border-error-red/25 bg-error-red/5',
  },
  'not-started': {
    label: 'Chưa học',
    badgeClassName: 'border-gray-border-dark bg-white text-stone-500',
    panelClassName: 'border-gray-border bg-white',
  },
  empty: {
    label: 'Sắp mở',
    seedState: 'locked',
    badgeClassName: 'border-gray-border-dark bg-stone-100 text-stone-500',
    panelClassName: 'border-gray-border bg-stone-50',
  },
};

export function getPreferredMobileConceptId(
  items: DetailConceptItem[],
  selectedConceptId: string | null,
): string {
  if (selectedConceptId && items.some((item) => item.concept.id === selectedConceptId)) {
    return selectedConceptId;
  }

  return (
    items.find((item) => item.state === 'weak')?.concept.id ||
    items.find((item) => item.state === 'not-started')?.concept.id ||
    items.find((item) => item.state === 'learning')?.concept.id ||
    items[0]?.concept.id ||
    ''
  );
}

export function MobileDailySkillList({
  items,
  selectedConceptId,
  onSelectConcept,
  density = 'comfortable',
}: MobileDailySkillListProps) {
  const activeConceptId = getPreferredMobileConceptId(items, selectedConceptId);
  const compact = density === 'compact';
  const activeItem = items.find((item) => item.concept.id === activeConceptId);

  if (compact) {
    const activeMeta = activeItem ? stateMeta[activeItem.state] : null;
    return (
      <section
        className="space-y-2.5 rounded-xl border border-gray-border bg-white p-2.5 shadow-sm"
        aria-labelledby="mobile-daily-skill-list-title"
      >
        <div className="flex min-w-0 items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary-green-dark">
              Daily Skills
            </p>
            <h2 id="mobile-daily-skill-list-title" className="text-base font-black leading-tight text-on-background">
              Hôm nay học gì?
            </h2>
          </div>
          <span className="shrink-0 rounded-full border border-gray-border bg-surface-container-low px-2.5 py-1 text-[10px] font-black uppercase text-stone-500">
            {items.length} skill
          </span>
        </div>

        <div
          className="grid justify-items-center gap-1.5"
          style={{ gridTemplateColumns: `repeat(${Math.max(1, items.length)}, minmax(0, 1fr))` }}
          role="listbox"
          aria-label="Chọn skill trong ngày"
        >
          {items.map((item, index) => {
            const selected = item.concept.id === activeConceptId;
            const meta = stateMeta[item.state];

            return (
              <MasterySeedSkillCard
                key={item.concept.id}
                title={item.concept.title}
                progress={item.progress}
                stateLabel={meta.label}
                selected={selected}
                state={meta.seedState}
                compact
                index={index}
                onClick={() => onSelectConcept(item.concept.id)}
              />
            );
          })}
        </div>

        {activeItem && activeMeta ? (
          <div data-tour-id="recommended-skill" className="rounded-xl border border-primary-green/30 bg-primary-green/5 p-2.5 shadow-[0_10px_24px_rgba(88,204,2,0.10)]">
            <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2.5">
              <MasterySeedBadge
                progress={activeItem.progress}
                state={activeMeta.seedState}
                label={`${activeItem.concept.title}: ${activeItem.progress}% mastery`}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className={['rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wide', activeMeta.badgeClassName].join(' ')}>
                      {activeMeta.label}
                    </span>
                  </div>
                </div>
                <p className="mt-1.5 text-sm font-black leading-tight text-on-background">{activeItem.concept.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs font-semibold leading-relaxed text-stone-600">
                  {activeItem.concept.description}
                </p>
                <MasterySoilStrip
                  progress={activeItem.progress}
                  state={activeMeta.seedState}
                  label={`${activeItem.concept.title}: soil progress ${activeItem.progress}%`}
                  className="mt-2.5 h-3"
                />
              </div>
              <span data-tour-id="sofi" className="relative z-20">
                <SofiExpressionAvatar
                  expression={getSofiExpressionForConceptState(activeItem.state)}
                  size={36}
                  priority
                />
              </span>
            </div>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section
      className="space-y-3 rounded-2xl border border-gray-border bg-white p-4 shadow-sm"
      aria-labelledby="mobile-daily-skill-list-title"
    >
      <div className="space-y-1">
        <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary-green-dark">
          Daily Skills
        </p>
        <h2
          id="mobile-daily-skill-list-title"
          className="font-fraunces text-xl font-black leading-tight text-on-background"
        >
          Hôm nay học gì?
        </h2>
        <p className="text-sm font-semibold leading-relaxed text-stone-600">
          Chọn một kỹ năng để bắt đầu luyện tập.
        </p>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const selected = item.concept.id === activeConceptId;
          const canStart = item.sets.length > 0;
          const meta = stateMeta[item.state];
          const descriptionId = `daily-skill-description-${item.concept.id}`;
          const statsId = `daily-skill-stats-${item.concept.id}`;

          return (
            <button
              key={item.concept.id}
              type="button"
              onClick={() => onSelectConcept(item.concept.id)}
              aria-pressed={selected}
              aria-describedby={`${descriptionId} ${statsId}`}
              className={[
                'w-full rounded-2xl border text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25 active:scale-[0.99]',
                'p-4',
                selected
                  ? 'border-primary-green bg-primary-green/10 shadow-[0_12px_28px_rgba(88,204,2,0.12)]'
                  : meta.panelClassName,
              ].join(' ')}
            >
              <div className="flex items-start gap-3">
                <MasterySeedBadge
                  progress={item.progress}
                  state={meta.seedState}
                  label={`${item.concept.title}: ${item.progress}% mastery`}
                  size="sm"
                  className="mt-0.5"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={[
                        'inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide',
                        meta.badgeClassName,
                      ].join(' ')}
                    >
                      {meta.label}
                    </span>
                  </div>

                  <p className="mt-3 font-fraunces text-lg font-black leading-tight text-on-background">
                    {item.concept.title}
                  </p>
                  <p
                    id={descriptionId}
                    className={[
                      'mt-1 text-sm font-semibold leading-relaxed text-stone-600',
                      'line-clamp-3',
                    ].join(' ')}
                  >
                    {item.concept.description}
                  </p>

                  <div
                    id={statsId}
                    className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-wide text-stone-500"
                  >
                    <span className="rounded-full border border-gray-border bg-white px-2.5 py-1">
                      Tiến độ {item.progress}%
                    </span>
                    <span className="rounded-full border border-gray-border bg-white px-2.5 py-1">
                      {canStart ? 'Có bài luyện' : 'Chưa có bài'}
                    </span>
                  </div>

                  <MasterySoilStrip
                    progress={item.progress}
                    state={meta.seedState}
                    label={`${item.concept.title}: soil progress ${item.progress}%`}
                    className="mt-3"
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
