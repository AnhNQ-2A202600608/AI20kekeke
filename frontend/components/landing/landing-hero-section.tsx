import Image from 'next/image';
import type { ReactNode } from 'react';
import {
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Flame,
  MessageCircleQuestion,
  Sparkles,
  Trophy,
  UserRound,
  Zap,
} from 'lucide-react';
import { LearningBrandMark } from '@/components/learning/learning-brand-mark';
import { LandingCta } from './landing-cta';

const heroTrustChips = [
  { label: 'Từ học liệu chính thức', icon: ClipboardCheck },
  { label: 'Gợi ý Socratic có citation', icon: MessageCircleQuestion },
  { label: 'Biết nên ôn gì tiếp', icon: UserRound },
];

const heroLearningDays = [
  { day: 'Day 1', title: 'AI & LLM Foundation', tag: 'TEXT + TOKENS', active: true },
  { day: 'Day 2', title: 'Xác định bài toán cho AI', tag: 'PROBLEM FIT' },
  { day: 'Day 3', title: 'Design Pattern React', tag: 'REACT LOOP' },
  { day: 'Day 4', title: 'Prompt Engineering & Tool Calling', tag: 'TOOLS' },
  { day: 'Day 5', title: 'Thiết kế sản phẩm AI', tag: 'UNCERTAINTY' },
  { day: 'Day 6', title: 'Hackathon Day & Prototyping', tag: 'PROTOTYPE' },
  { day: 'Day 7', title: 'Data Foundations', tag: 'EVALUATION' },
];

const heroSkills = [
  { label: 'Tokenization', active: true },
  { label: 'Embedding' },
  { label: 'Vector' },
  { label: 'Chunking' },
  { label: 'Retrieval' },
];

function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[#fffefa]" />
      <div className="absolute inset-0 hidden bg-[url('/landing/hero-background.webp')] bg-cover bg-center bg-no-repeat opacity-100 md:block" />
      <div className="absolute right-[-22%] top-20 hidden h-[38rem] w-[38rem] rounded-full bg-primary-green-light/25 blur-3xl sm:block md:hidden" />
    </div>
  );
}

function HeroSectionEyebrow({ children }: { children: ReactNode }) {
  return <p className="text-caption-tight font-black uppercase text-primary-green-dark">{children}</p>;
}

function HeroLearningSeed({ active = false, index }: { active?: boolean; index: number }) {
  return (
    <div className="grid place-items-center gap-1">
      <div className={`relative grid h-9 w-9 place-items-center rounded-full border ${active ? 'border-primary-green/45 bg-primary-green-light' : 'border-gray-border bg-white'}`}>
        <Image
          src={active ? '/learning-seeds/seed-growing.webp' : '/learning-seeds/seed-empty.webp'}
          alt=""
          width={30}
          height={30}
          className="h-7 w-7 object-contain"
        />
        <span className="absolute -right-1 -top-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-white text-badge-micro font-black text-stone-500 shadow-sm">
          {index}
        </span>
      </div>
    </div>
  );
}

function HeroLaptopMockup() {
  return (
    <div id="product" className="relative mx-auto w-full max-w-[46rem] lg:-ml-2 lg:mr-0">
      <div className="relative overflow-hidden rounded-[20px] border-[6px] border-[#cfd3d2] bg-[#e8ebea] p-1.5 shadow-[0_14px_38px_rgba(74,89,57,0.2)]">
        <div className="max-h-[23rem] overflow-hidden rounded-[14px] border border-stone-200 bg-[#fffef7] p-2 shadow-inner xl:max-h-[24rem]">
          <div className="mb-2 flex items-center gap-1.5 border-b border-gray-border/70 pb-2">
            <span className="h-2.5 w-2.5 rounded-full bg-error-red" />
            <span className="h-2.5 w-2.5 rounded-full bg-accent-orange" />
            <span className="h-2.5 w-2.5 rounded-full bg-primary-green" />
          </div>

          <div className="w-[118%] origin-top-left scale-[0.84] rounded-[16px] bg-[linear-gradient(180deg,#fffffb_0%,#f9fde9_100%)] p-2.5 md:p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <LearningBrandMark compact />
                <div className="min-w-0 border-l border-gray-border pl-2.5">
                  <h2 className="font-fraunces text-base font-black leading-none text-on-background md:text-lg">Lộ trình học tập</h2>
                  <p className="mt-1 text-kicker-micro font-extrabold text-stone-500 md:text-caption-tight">28 ngày - 39 bài luyện - 0% hoàn thành</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="hidden min-h-8 items-center gap-1 rounded-xl border border-gray-border bg-white px-2.5 text-caption-tight font-black text-stone-700 shadow-sm sm:flex">
                  <Flame className="h-3.5 w-3.5 text-accent-orange" /> 0 ngày
                </div>
                <div className="hidden min-h-8 items-center gap-1 rounded-xl border border-gray-border bg-white px-2.5 text-caption-tight font-black text-stone-700 shadow-sm sm:flex">
                  <Zap className="h-3.5 w-3.5 text-primary-green-dark" /> 0 XP
                </div>
                <div className="min-h-8 rounded-xl border border-gray-border bg-white px-2.5 py-2 text-caption-tight font-black text-stone-700 shadow-sm">
                  Độ vững 43%
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-2.5 lg:grid-cols-[0.4fr_1fr]">
              <aside className="rounded-xl border border-primary-green/18 bg-white/92 p-2 shadow-sm">
                <div className="mb-2 flex items-center justify-between gap-2 rounded-xl bg-primary-green-light/40 px-2.5 py-2">
                  <p className="text-label-tight font-black text-on-background">Lộ trình tuần 1</p>
                  <Trophy className="h-3.5 w-3.5 text-primary-green-dark" />
                </div>
                <div className="space-y-1.5">
                  {heroLearningDays.map((item) => (
                    <div
                      key={item.day}
                      className={`grid grid-cols-[1.9rem_1fr] gap-2 rounded-xl border p-1.5 ${item.active ? 'border-primary-green/45 bg-primary-green-light/25' : 'border-gray-border bg-white'}`}
                    >
                      <Image
                        src={item.active ? '/learning-seeds/seed-growing.webp' : '/learning-seeds/seed-empty.webp'}
                        alt=""
                        width={30}
                        height={30}
                        className="h-7.5 w-7.5 object-contain"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-label-tight font-black text-on-background">{item.day}</p>
                          <span className="rounded-full bg-surface-container-low px-1.5 py-0.5 text-annotation-micro font-black text-primary-green-dark">
                            {item.tag}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-badge-micro font-bold text-stone-500">{item.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-4 gap-1 text-center text-badge-micro font-black">
                  {['W1', 'W2', 'W3', 'W4'].map((week, index) => (
                    <span key={week} className={`rounded-lg px-2 py-1.5 ${index === 0 ? 'bg-primary-green text-white' : 'bg-white text-stone-500 ring-1 ring-gray-border'}`}>
                      {week}
                    </span>
                  ))}
                </div>
              </aside>

              <section className="rounded-xl border border-gray-border bg-white/90 p-2.5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2.5 rounded-xl border border-primary-green/16 bg-[#fffff8] p-2.5">
                  <div className="min-w-0">
                    <p className="text-kicker-micro font-black uppercase text-stone-500">Nền tảng</p>
                    <h3 className="mt-1 font-fraunces text-base font-black leading-tight text-on-background md:text-lg">Day 1 - AI & LLM Foundation</h3>
                    <p className="mt-1 text-caption-tight font-bold text-stone-500">Nắm vững Transformer, Tokenization, Embeddings và Inference Dynamics.</p>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-xl border border-primary-green/20 bg-white px-2.5 py-1.5 text-kicker-micro font-black text-primary-green-dark">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Gỡ rối hôm nay
                  </div>
                  <div className="basis-full rounded-xl border border-primary-green/20 bg-primary-green-light/20 p-2.5">
                    <div className="mb-2 flex flex-wrap items-center gap-2.5 text-kicker-micro font-black text-stone-600">
                      <span className="inline-flex items-center gap-1 text-primary-green-dark"><BookOpen className="h-3 w-3" /> 5 concept</span>
                      <span>5 bài luyện</span>
                      <span>~20 phút</span>
                      <span className="ml-auto rounded-full bg-white px-2 py-1 text-primary-green-dark">30% tiến độ</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white">
                      <div className="h-full w-[30%] rounded-full bg-primary-green" />
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <HeroSectionEyebrow>Daily skills</HeroSectionEyebrow>
                  <h4 className="mt-1 text-sm font-black text-on-background">Hôm nay học gì?</h4>
                  <div className="mt-2.5 grid grid-cols-5 gap-1.5">
                    {heroSkills.map((skill, index) => (
                      <HeroLearningSeed key={skill.label} active={skill.active} index={index + 1} />
                    ))}
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-primary-green/20 bg-[#fffffb] p-2.5">
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-error-red px-2 py-0.5 text-badge-micro font-black text-white">CẦN VÁ</span>
                    <span className="rounded-full bg-surface-container-low px-2 py-0.5 text-badge-micro font-black text-stone-500">1 BÀI</span>
                    <span className="rounded-full bg-primary-green-light px-2 py-0.5 text-badge-micro font-black text-primary-green-dark">ĐANG CHỌN</span>
                  </div>
                  <div className="grid grid-cols-[2rem_1fr] gap-2.5">
                    <Image src="/learning-seeds/seed-growing.webp" alt="" width={34} height={34} className="h-8 w-8 object-contain" />
                    <div>
                      <h5 className="text-xs font-black leading-tight text-on-background">Tokenization & Kỹ thuật Embeddings</h5>
                      <p className="mt-1 text-caption-tight font-semibold leading-4 text-stone-600">
                        Tìm hiểu thuật toán cắt từ BPE, WordPiece, SentencePiece và chuyển từ sang không gian vector.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-[0.45fr_1fr]">
                  <button className="min-h-10 rounded-xl border-2 border-gray-border bg-white text-caption-tight font-black text-on-background">GUIDEBOOK</button>
                  <button className="min-h-10 rounded-xl border-2 border-primary-green-dark bg-primary-green text-caption-tight font-black text-white shadow-[0_3px_0_#46a302]">
                    BẮT ĐẦU DAY 1
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto h-5 w-[78%] rounded-b-[30px] bg-[linear-gradient(180deg,#d7dad8,#bfc4c1)] shadow-[0_12px_24px_rgba(74,89,57,0.14)]" />

      <Image
        src="/mascot/sofi/1024/mentora-fox-quiz-coach.webp"
        alt="Sofi, mascot Mentora đang cầm bảng học tập"
        width={320}
        height={320}
        priority
        className="absolute -bottom-3 -right-2 hidden h-32 w-32 object-contain drop-shadow-[0_12px_18px_rgba(74,89,57,0.18)] md:block lg:-right-6 lg:h-40 lg:w-40"
      />
    </div>
  );
}

export function LandingHeroSection() {
  return (
    <section className="relative isolate overflow-hidden">
      <HeroBackground />
      <div className="relative mx-auto grid min-h-[calc(100dvh-46px)] w-full max-w-[82rem] gap-5 px-3 pb-6 pt-6 md:px-6 lg:grid-cols-[0.34fr_0.66fr] lg:items-center lg:gap-5 lg:pb-6 lg:pt-6">
        <div className="z-10 max-w-[27rem] lg:pl-5">
          <div className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-primary-green/45 bg-white/78 px-3 text-kicker-micro font-black uppercase text-primary-green-dark shadow-sm backdrop-blur">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            Course-grounded AI tutor
          </div>
          <h1 className="mt-4 max-w-[27rem] text-wrap font-fraunces text-[1.75rem] font-black leading-[1.08] text-[#102017] md:text-[2rem] lg:text-[1.85rem] xl:text-[1.9rem] 2xl:text-[2rem]">
            Học AI để hiểu, không chỉ lấy đáp án
          </h1>
          <p className="mt-3 max-w-[25rem] text-[0.8rem] font-semibold leading-6 text-stone-600 md:text-[0.85rem]">
            Mentora biến học liệu chính thức thành gợi ý Socratic có citation, quiz thích ứng và mastery map để học viên biết mình hổng gì, nên luyện gì tiếp.
          </p>
          <div className="mt-4">
            <LandingCta />
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {heroTrustChips.map((chip) => (
              <div key={chip.label} className="flex min-h-10 items-center gap-2 rounded-xl border border-gray-border bg-white/88 px-2.5 py-2 text-caption-tight font-black text-on-background shadow-[0_6px_14px_rgba(74,89,57,0.06)]">
                <chip.icon className="h-4 w-4 shrink-0 text-primary-green-dark" aria-hidden="true" />
                <span>{chip.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <div className="flex -space-x-2">
              {['LA', 'BT', 'HN'].map((name, index) => (
                <span
                  key={name}
                  className={`grid h-7 w-7 place-items-center rounded-full border-2 border-white text-badge-micro font-black text-white shadow-sm ${
                    index === 0 ? 'bg-stone-500' : index === 1 ? 'bg-primary-blue-dark' : 'bg-accent-orange-dark'
                  }`}
                >
                  {name}
                </span>
              ))}
              <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-primary-green text-white shadow-sm">
                <Check className="h-3.5 w-3.5" />
              </span>
            </div>
            <p className="max-w-[14rem] text-caption-tight font-semibold leading-4 text-stone-600">
              Thiết kế cho AI cohort, bootcamp và lớp đại học cần đo hành vi học thật, không chỉ pageview.
            </p>
          </div>
        </div>

        <div className="relative min-h-[22rem] pt-5 lg:min-h-[25rem] lg:pt-6">
          <HeroLaptopMockup />
        </div>
      </div>
    </section>
  );
}
