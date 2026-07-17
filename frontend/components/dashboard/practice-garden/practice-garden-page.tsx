import Image from 'next/image';
import { ArrowRight, Droplets, Leaf, RefreshCw, Sprout } from 'lucide-react';
import { motion } from 'motion/react';

import { MasterySeedBadge } from '@/components/learning/mastery-seed-badge';
import { MasterySoilStrip } from '@/components/learning/mastery-soil-strip';
import { SofiExpressionAvatar } from '@/components/mascot';
import type { ActivePracticeSession } from '@/lib/quiz/types';

import { PracticeSeedCard } from './practice-seed-card';
import type { PracticeDayOption, PracticeGardenSkill } from './practice-garden-data';

interface PracticeGardenPageProps {
  dayOptions: PracticeDayOption[];
  selectedDayId: string | null;
  onSelectDay: (dayId: string | null) => void;
  skills: PracticeGardenSkill[];
  recommendedSkill: PracticeGardenSkill | null;
  selectedSkill: PracticeGardenSkill | null;
  activePracticeSession: ActivePracticeSession | null;
  activeSessionSkillName?: string;
  onSelectSkill: (skillId: string) => void;
  onStartSkill: (skill: PracticeGardenSkill) => void;
  onResumeSession: () => void;
  onClearSession: () => void;
}

function getFocusReason(skill: PracticeGardenSkill | null) {
  if (!skill) return 'Chọn một ngày để Sofi tìm kỹ năng nên chăm tiếp.';
  if (skill.state === 'review') return 'Kỹ năng này đang yếu hơn các luống khác, ôn trước sẽ giữ nhịp học tốt hơn.';
  if (skill.state === 'in_progress') return 'Bạn đã gieo nền ở đây rồi, tiếp tục ngay giúp mạch luyện không bị đứt.';
  if (skill.state === 'mastered') return 'Kỹ năng đã nở hoa, một lượt duy trì ngắn sẽ giúp mastery ổn định.';
  return 'Đây là hạt giống phù hợp để bắt đầu trong ngày đang chọn.';
}

function getCoachVisual(skill: PracticeGardenSkill) {
  if (skill.state === 'review') {
    return {
      src: '/mascot/edo/edo-sofi-weak-soil-diagnosis.webp',
      label: 'Sofi đang soi vùng đất yếu',
      note: 'Ưu tiên ôn để cây không héo.',
    };
  }

  if (skill.state === 'mastered') {
    return {
      src: '/mascot/edo/edo-sofi-achievement-bloom.webp',
      label: 'Luống này đã nở hoa',
      note: 'Một lượt duy trì ngắn là đủ.',
    };
  }

  if (skill.state === 'in_progress') {
    return {
      src: '/mascot/edo/edo-sofi-watering-recovery.webp',
      label: 'Sofi đang tưới tiếp mạch học',
      note: 'Tiếp tục ngay khi nền đã nảy mầm.',
    };
  }

  return {
    src: '/mascot/edo/edo-sofi-next-path-lantern.webp',
    label: 'Sofi chỉ lối cho bước tiếp theo',
    note: 'Bắt đầu nhẹ để mở luống mới.',
  };
}

export function PracticeGardenPage({
  dayOptions,
  selectedDayId,
  onSelectDay,
  skills,
  recommendedSkill,
  selectedSkill,
  activePracticeSession,
  activeSessionSkillName,
  onSelectSkill,
  onStartSkill,
  onResumeSession,
  onClearSession,
}: PracticeGardenPageProps) {
  const selectedOrRecommended = selectedSkill || recommendedSkill;
  const coachVisual = selectedOrRecommended ? getCoachVisual(selectedOrRecommended) : null;
  const activeDay = dayOptions.find((day) => day.id === selectedDayId) || dayOptions[0];
  const averageMastery = skills.length
    ? Math.round(skills.reduce((sum, skill) => sum + skill.mastery, 0) / skills.length)
    : 0;
  const visibleSkills = skills.slice(0, 4);

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col font-be-vietnam-pro">
      <section className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-border bg-white p-2 shadow-sm">
        <div className="relative z-10 mb-2 grid gap-1.5 rounded-xl border border-primary-green/15 bg-surface-container-low/80 p-1.5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="flex flex-wrap gap-1.5">
            {dayOptions.map((day) => {
              const isSelected = selectedDayId === day.id;
              return (
              <button
                key={day.id || 'all'}
                type="button"
                onClick={() => onSelectDay(day.id)}
                title={day.description}
                className={[
                  'min-h-7 shrink-0 cursor-pointer rounded-md border px-2 text-[9px] font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25',
                  isSelected
                    ? 'border-primary-green-dark bg-primary-green text-white'
                    : 'border-gray-border bg-white text-stone-600 hover:border-primary-green/35 hover:bg-primary-green/5',
                ].join(' ')}
              >
                <span>{day.id === null ? 'Tất cả' : day.label}</span>
                <span className={['ml-1 font-mono text-[8px]', isSelected ? 'text-white/80' : 'text-stone-500'].join(' ')}>
                  {day.skillCount}
                </span>
              </button>
              );
            })}
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <span className="rounded-full border border-primary-green/15 bg-white px-2.5 py-1 text-[9px] font-black text-primary-green-dark">
              {activeDay?.label || 'Hôm nay'} · {selectedOrRecommended?.elo || 1000} Elo · {averageMastery}% thành thạo
            </span>
          </div>
        </div>

        <div className="relative z-10 grid min-h-0 flex-1 gap-2 overflow-hidden lg:grid-cols-[minmax(0,1fr)_16rem] xl:grid-cols-[minmax(0,1fr)_17rem]">
          <main className="learning-scrollbar min-h-0 min-w-0 overflow-y-auto rounded-xl border border-gray-border bg-white p-2">
            {visibleSkills.length > 0 ? (
              <div className="grid content-start gap-2 sm:grid-cols-2">
                {visibleSkills.map((skill) => (
                  <PracticeSeedCard
                    key={skill.id}
                    skill={skill}
                    isSelected={selectedOrRecommended?.id === skill.id}
                    onSelect={onSelectSkill}
                    onStart={onStartSkill}
                  />
                ))}
              </div>
              ) : (
                <div className="relative grid min-h-44 place-items-center rounded-[1rem] border-2 border-dashed border-primary-green/25 bg-white/70 p-6 text-center">
                  <div>
                    <Leaf className="mx-auto h-7 w-7 text-primary-green-dark" aria-hidden="true" />
                    <p className="mt-2 text-xs font-black text-on-background">Luống này chưa có kỹ năng</p>
                    <p className="mt-1 text-[10px] font-semibold text-stone-500">Chọn ngày khác hoặc xem toàn bộ vườn.</p>
                  </div>
                </div>
              )}
          </main>

          <aside className="learning-scrollbar relative flex min-h-0 flex-col overflow-y-auto rounded-xl border border-gray-border bg-surface-container-low/80 p-2">
            {activePracticeSession && activeSessionSkillName && (
              <motion.section
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-1.5 rounded-xl border border-primary-green/20 bg-white p-2 shadow-sm"
              >
                <div className="flex min-w-0 items-start gap-2">
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary-green/10 text-primary-green-dark">
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.12em] text-primary-green-dark">
                      Phiên đang mở
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-[10px] font-bold leading-3.5 text-on-background">
                      {activeSessionSkillName}
                    </p>
                    <p className="mt-0.5 text-[9px] font-semibold text-stone-500">
                      Câu {activePracticeSession.currentQuestionIndex + 1}/{activePracticeSession.questionIdsPool.length}
                    </p>
                  </div>
                </div>
                <div className="mt-1.5 grid grid-cols-[0.85fr_1.15fr] gap-1.5">
                  <button
                    type="button"
                    onClick={onClearSession}
                    className="min-h-7 cursor-pointer rounded-lg border border-gray-border bg-white px-2 text-[9px] font-black text-stone-500 transition hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25 active:translate-y-[1px]"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={onResumeSession}
                    className="inline-flex min-h-7 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-primary-green-dark bg-primary-green px-2 text-[9px] font-black uppercase text-white transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25 active:translate-y-[1px]"
                  >
                    Làm tiếp
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </motion.section>
            )}

            <div className="relative z-10 flex items-center gap-2">
              <span data-tour-id="sofi" className="shrink-0">
                <SofiExpressionAvatar expression="happy" size={32} priority />
              </span>
              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase tracking-[0.14em] text-primary-green-dark">
                  Cây tiếp theo nên chăm
                </p>
                <h2 className="mt-0.5 line-clamp-2 h-9 overflow-hidden font-fraunces text-[13px] font-black leading-[1.08] text-[#173312]">
                  {selectedOrRecommended?.name || 'Chọn một kỹ năng'}
                </h2>
              </div>
            </div>
            <p className="relative z-10 mt-1.5 text-[10px] font-semibold leading-3.5 text-[#64745d]">
              {getFocusReason(selectedOrRecommended || null)}
            </p>
            {selectedOrRecommended && (
              <div className="relative z-10">
                <div data-tour-id="mastery" className="mt-2 rounded-lg border border-primary-green/15 bg-[#f4fce8] p-2">
                  <div className="mb-1.5 flex items-center justify-between text-[9px] font-black text-[#64745d]">
                    <span>Mastery</span>
                    <span className="font-mono text-[#173312]">{selectedOrRecommended.mastery}%</span>
                  </div>
                  <MasterySoilStrip
                    progress={selectedOrRecommended.mastery}
                    state={selectedOrRecommended.state === 'locked' ? 'locked' : selectedOrRecommended.state === 'review' ? 'review' : undefined}
                    label={`Đất kỹ năng ${selectedOrRecommended.name}: ${selectedOrRecommended.mastery}%`}
                  />
                  <div className="mt-1.5 flex items-center gap-2">
                    <MasterySeedBadge
                      progress={selectedOrRecommended.mastery}
                      state={selectedOrRecommended.state === 'locked' ? 'locked' : selectedOrRecommended.state === 'review' ? 'review' : undefined}
                      size="xs"
                      label={`${selectedOrRecommended.stateLabel}: ${selectedOrRecommended.mastery}%`}
                    />
                    <span className="text-[9px] font-bold text-[#64745d]">
                      Khoảng 15-20 phút luyện tập
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  data-tour-id="practice-cta"
                  onClick={() => onStartSkill(selectedOrRecommended)}
                  className="mt-2 inline-flex min-h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-primary-green-dark bg-primary-green px-2.5 text-[10px] font-black uppercase text-white transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25 active:translate-y-[1px]"
                >
                  <Droplets className="h-3.5 w-3.5" aria-hidden="true" />
                  {activePracticeSession ? 'Luyện kỹ năng này' : selectedOrRecommended.ctaLabel}
                </button>
                {coachVisual && (
                  <div className="mt-1.5 overflow-hidden rounded-lg border border-primary-green/15 bg-gradient-to-br from-[#f4fce8] via-white to-[#fff8dc] p-1.5">
                    <div className="flex items-center gap-2">
                      <div className="relative h-11 w-11 shrink-0">
                        <Image
                          src={coachVisual.src}
                          alt=""
                          fill
                          sizes="44px"
                          className="object-contain object-bottom drop-shadow-[0_10px_18px_rgba(36,78,22,0.12)]"
                          loading="lazy"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-1 text-[8px] font-black uppercase tracking-[0.12em] text-primary-green-dark">
                          {coachVisual.label}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-[9px] font-bold leading-3.5 text-[#64745d]">
                          {coachVisual.note}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>

        <footer className="relative z-10 mt-1.5 flex items-center justify-between gap-2 rounded-[0.85rem] border border-primary-green/15 bg-white/85 px-2.5 py-1.5 backdrop-blur-[1px]">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-primary-green-dark">
              Tuần 1: Foundation
            </p>
            <div className="mt-1 flex items-center gap-1">
              {skills.slice(0, 10).map((skill) => (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => onSelectSkill(skill.id)}
                  aria-label={`Chọn ${skill.name}`}
                  className={[
                    'h-2.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25',
                    skill.id === selectedOrRecommended?.id ? 'w-7 bg-primary-green' : 'w-2.5 bg-primary-green/20',
                  ].join(' ')}
                />
              ))}
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <Sprout className="h-3.5 w-3.5 text-primary-green-dark" aria-hidden="true" />
            <span className="text-[9px] font-bold text-[#64745d]">
              {skills.length} kỹ năng trong luống hiện tại
            </span>
          </div>
        </footer>
      </section>
    </div>
  );
}
