import type { HTMLAttributes, ReactNode } from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Bot,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  FileCheck2,
  GraduationCap,
  LibraryBig,
  MessageCircleQuestion,
  Route,
  ShieldCheck,
  Target,
  Trophy,
  UsersRound,
} from 'lucide-react';
import { LearningBrandMark } from '@/components/learning/learning-brand-mark';
import { LandingCta } from './landing-cta';
import { LandingHeader } from './landing-header';
import { LandingHeroSection } from './landing-hero-section';

function SectionEyebrow({ children, tone = 'text-primary-green-dark' }: { children: ReactNode; tone?: string }) {
  return <p className={`text-caption-tight font-black uppercase ${tone}`}>{children}</p>;
}

function TactileCard({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={`rounded-2xl border-2 border-gray-border border-b-[5px] bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function ProblemSection() {
  const problemCards = [
    { label: '01', title: 'Generic AI cho đáp án', text: 'Học viên hoàn thành nhanh hơn nhưng vẫn không chắc mình thật sự hiểu phần nào.', icon: Bot },
    { label: '02', title: 'Practice không đúng trình độ', text: 'Bài quá dễ gây chán, bài quá khó gây bỏ cuộc; hệ thống cần chọn đúng vùng thử thách.', icon: Target },
    { label: '03', title: 'Mentor thiếu tín hiệu lớp', text: 'Nếu không có mastery và completion theo concept, mentor khó biết nhóm nào cần can thiệp.', icon: UsersRound },
  ];

  return (
    <section className="border-y-2 border-gray-border bg-white py-8 md:py-11">
      <div className="mx-auto w-full max-w-[82rem] px-4">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <SectionEyebrow>Điểm khác biệt</SectionEyebrow>
            <h2 className="mt-2 font-fraunces text-question-title-lg font-black leading-tight text-on-background md:text-auth-title-md">
              AI learners đang dùng AI để xong việc, nhưng vẫn chưa biết mình hiểu gì
            </h2>
          </div>
          <p className="max-w-md text-control-label font-semibold leading-6 text-stone-600">
            Pitch deck đóng khung pain này bằng một tín hiệu sớm: 59,191 reach qua 6 bài viết học AI. Đây là pain signal, không phải PMF.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {problemCards.map((card) => (
            <TactileCard key={card.title} className="group p-4 transition hover:-translate-y-0.5 hover:border-primary-green/50 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-primary-green/20 bg-primary-green-light text-primary-green-dark">
                  <card.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="rounded-full bg-surface-container-low px-2.5 py-1 text-caption-tight font-black text-stone-500">
                  {card.label}
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-form-base font-black leading-snug text-on-background">{card.title}</h3>
                <p className="mt-2 text-control-label font-bold leading-6 text-stone-600">{card.text}</p>
              </div>
            </TactileCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function LoopSection() {
  const loopSteps = [
    { title: 'Course docs', text: 'Bắt đầu từ học liệu chính thức của cohort, không trả lời chung chung.', icon: LibraryBig },
    { title: 'Cited Socratic hints', text: 'Gợi mở từng bước với citation để học viên tự đi đến lời giải.', icon: MessageCircleQuestion },
    { title: 'Adaptive practice', text: 'Chọn câu hỏi theo mastery, Elo/BKT và vùng thử thách 70-75%.', icon: BookOpenCheck },
    { title: 'Mastery update', text: 'Cập nhật concept map sau mỗi phiên làm bài, hint và kết quả.', icon: Trophy },
    { title: 'Next review focus', text: 'Đề xuất phần cần ôn tiếp cho học viên và tín hiệu can thiệp cho mentor.', icon: GraduationCap },
  ];

  return (
    <section id="loop" className="bg-background py-8 md:py-11">
      <div className="mx-auto w-full max-w-[82rem] px-4">
        <div className="grid gap-5 lg:grid-cols-[0.34fr_0.66fr] lg:items-start">
          <div className="lg:sticky lg:top-20">
            <SectionEyebrow>Cách gia sư AI Mentora hoạt động</SectionEyebrow>
            <h2 className="mt-2 font-fraunces text-question-title-lg font-black leading-tight text-on-background md:text-auth-title-md">
              Mentora biến học liệu khóa học thành hint, practice và next step
            </h2>
            <p className="mt-3 text-control-label font-semibold leading-6 text-stone-600">
              Đây là learning loop trong pitch deck: course docs, cited Socratic hints, adaptive practice, mastery update, rồi next review focus.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {loopSteps.map((step, index) => (
              <TactileCard key={step.title} className={index === 4 ? 'p-4 md:col-span-2' : 'p-4'}>
                <div className="flex items-start gap-3">
                  <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-primary-green/25 bg-white text-primary-green-dark">
                    <step.icon className="h-5 w-5" aria-hidden="true" />
                    <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-primary-green text-caption-tight font-black text-white">
                      {index + 1}
                    </span>
                  </div>
                <div>
                    <h3 className="text-control-label font-black text-on-background">{step.title}</h3>
                    <p className="mt-1 text-node-label font-bold leading-5 text-stone-600">{step.text}</p>
                </div>
              </div>
              </TactileCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
function AudienceSection() {
  const panels = [
    {
      id: 'students',
      eyebrow: 'Cho học viên',
      title: 'Học AI đúng điểm yếu',
      description: 'Mỗi ngày có hàng đợi luyện tập riêng, mức khó vừa đủ và Sofi gợi mở theo học liệu của lớp.',
      icon: BookOpenCheck,
      tone: 'text-primary-green-dark',
      metric: '70-75%',
      metricLabel: 'vùng thử thách mục tiêu',
      benefits: ['Luyện đúng concept đang yếu', 'Theo lộ trình AI/LLM 28 ngày rõ ràng', 'Nhận hint Socratic có citation, không bị làm hộ'],
    },
    {
      id: 'mentors',
      eyebrow: 'Cho giảng viên',
      title: 'Theo dõi lớp bằng dữ liệu học tập',
      description: 'Mentor không cần đọc từng log rời rạc; hệ thống gom usage, completion và mastery theo concept.',
      icon: UsersRound,
      tone: 'text-primary-blue-dark',
      metric: '1 view',
      metricLabel: 'để thấy lớp đang kẹt ở đâu',
      benefits: ['Heatmap mastery theo concept', 'Tín hiệu nhóm cần hỗ trợ theo Elo/BKT', 'Usage report cho cohort pilot'],
    },
  ];

  return (
    <section className="bg-white py-8 md:py-11">
      <div className="mx-auto grid w-full max-w-[82rem] gap-3 px-4 lg:grid-cols-2">
        {panels.map((panel) => (
          <TactileCard key={panel.id} id={panel.id} className="overflow-hidden">
            <div className="grid gap-0 md:grid-cols-[1fr_0.42fr]">
              <div className="p-4">
                <SectionEyebrow tone={panel.tone}>{panel.eyebrow}</SectionEyebrow>
                <h2 className="mt-1 font-fraunces text-question-title-sm font-black leading-tight text-on-background">{panel.title}</h2>
                <p className="mt-2 text-control-label font-semibold leading-6 text-stone-600">{panel.description}</p>
                <div className="mt-4 space-y-3">
                  {panel.benefits.map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-green-dark" aria-hidden="true" />
                    <p className="text-control-label font-bold leading-6 text-stone-600">{item}</p>
                  </div>
                ))}
                </div>
              </div>
              <div className="border-t-2 border-gray-border bg-surface-container-low p-4 md:border-l-2 md:border-t-0">
                <div className="grid h-full min-h-40 place-items-center rounded-2xl border-2 border-white bg-white/70 p-4 text-center">
                  <panel.icon className={`h-8 w-8 ${panel.tone}`} aria-hidden="true" />
                  <div>
                    <p className="font-fraunces text-auth-title-md font-black leading-none text-on-background">{panel.metric}</p>
                    <p className="mt-1 text-node-label font-black leading-5 text-stone-500">{panel.metricLabel}</p>
                  </div>
                </div>
              </div>
            </div>
          </TactileCard>
        ))}
      </div>
    </section>
  );
}

const earlyUsageMetrics = [
  { value: '828', label: 'unique visitors', detail: 'đã ghé sản phẩm' },
  { value: '292', label: 'active learners', detail: 'bắt đầu học thật' },
  { value: '5,335', label: 'questions answered', detail: 'lượt trả lời câu hỏi' },
  { value: '584', label: 'quiz completions', detail: 'phiên quiz hoàn tất' },
  { value: '118', label: 'peak weekly active', detail: 'WAU cao nhất' },
];

const evidenceLinks = [
  { label: 'Usage analytics', href: 'https://github.com/AI20K-Build-Cohort-2/C2-App-125/blob/dev/report/posthog-early-product-usage-report.md' },
  { label: 'Technical report', href: 'https://github.com/AI20K-Build-Cohort-2/C2-App-125/blob/dev/report/Technical-report.pdf' },
  { label: 'Cost report', href: 'https://github.com/AI20K-Build-Cohort-2/C2-App-125/blob/dev/report/sapia-quiz-first-cost-report-mentor.pdf' },
];

function EarlyUsageSection() {
  return (
    <section id="usage" className="border-y-2 border-gray-border bg-white py-8 md:py-11">
      <div className="mx-auto w-full max-w-[82rem] px-4">
        <div className="grid gap-4 lg:grid-cols-[0.34fr_0.66fr] lg:items-stretch">
          <TactileCard className="flex flex-col justify-between bg-[linear-gradient(180deg,#ffffff_0%,#f4fce8_100%)] p-4">
            <div>
              <SectionEyebrow>Early usage</SectionEyebrow>
              <h2 className="mt-2 font-fraunces text-question-title-lg font-black leading-tight text-on-background md:text-auth-title-md">
                Early learners đã hỏi, luyện tập và hoàn tất quiz
              </h2>
              <p className="mt-3 text-control-label font-semibold leading-6 text-stone-600">
                Dữ liệu PostHog cho thấy traffic đã chuyển thành learning actions. Đây là early usage evidence, không phải tuyên bố PMF hay learning outcome.
              </p>
            </div>
            <div className="mt-5 rounded-2xl border-2 border-primary-green/20 bg-white p-3">
              <p className="text-control-label font-black leading-5 text-on-background">
                35.3% visitors trở thành active learners; mỗi active learner trả lời trung bình 18.3 câu hỏi.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {evidenceLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-primary-green/20 bg-primary-green-light/30 px-2.5 py-1 text-caption-tight font-black uppercase text-primary-green-dark transition hover:bg-primary-green-light"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
              <p className="mt-3 text-caption-tight font-black uppercase text-stone-400">
                Source: PostHog, Jun 2-Jul 6 2026
              </p>
            </div>
          </TactileCard>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {earlyUsageMetrics.map((metric, index) => (
              <TactileCard key={metric.label} className={index === 0 ? 'p-4 sm:col-span-2 xl:col-span-1' : 'p-4'}>
                <Activity className="h-5 w-5 text-primary-green-dark" aria-hidden="true" />
                <p className="mt-3 font-fraunces text-auth-title-md font-black leading-none text-on-background">{metric.value}</p>
                <p className="mt-2 text-node-label font-black uppercase leading-4 text-primary-green-dark">{metric.label}</p>
                <p className="mt-1 text-node-label font-bold leading-5 text-stone-600">{metric.detail}</p>
              </TactileCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const pilotSteps = [
  { title: '4-week pilot', detail: '50-100 learners, official course materials, shared success metrics.', icon: ClipboardList },
  { title: 'Usage report', detail: 'Measure learner usage, citation trust, practice completion and progress signals.', icon: BarChart3 },
  { title: 'Paid cohort', detail: 'Convert validated pilot into cohort rollout when usage and trust are clear.', icon: DollarSign },
  { title: 'Multi-cohort rollout', detail: 'Expand to more AI/programming cohorts with security and SLA review.', icon: Route },
];

const pricingHypotheses = [
  { plan: 'Pilot 4 tuần', price: 'USD 500-1,000 / cohort', fit: 'Tối đa 100 active learners, dùng để đo usage và trust trước khi rollout.' },
  { plan: 'Cohort Standard', price: 'USD 300-500 / cohort / tháng + USD 3-8 / active learner', fit: 'Lớp 50-300 học viên, có mentor theo dõi và báo cáo tiến độ.' },
  { plan: 'Institution', price: 'Custom', fit: 'Nhiều cohort, SLA, data/security review và cost model theo tổ chức.' },
];

function PilotPricingSection() {
  return (
    <section id="pilot" className="bg-background py-8 md:py-11">
      <div className="mx-auto w-full max-w-[82rem] px-4">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <SectionEyebrow>Pilot path & pricing</SectionEyebrow>
            <h2 className="mt-2 font-fraunces text-question-title-lg font-black leading-tight text-on-background md:text-auth-title-md">
              Bắt đầu bằng một cohort, chứng minh usage rồi mới bán rollout
            </h2>
          </div>
          <p className="max-w-md text-control-label font-semibold leading-6 text-stone-600">
            Giá dưới đây là khung pilot để kiểm chứng willingness-to-pay, đi kèm cost report quiz-first cho cohort 500 users / 3 tháng.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-[0.58fr_0.42fr]">
          <TactileCard className="p-4">
            <div className="grid gap-3 md:grid-cols-4">
              {pilotSteps.map((step, index) => (
                <div key={step.title} className="relative rounded-2xl border border-gray-border bg-surface-container-low p-3">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="grid h-10 w-10 place-items-center rounded-xl border border-primary-green/20 bg-white text-primary-green-dark">
                      <step.icon className="h-4.5 w-4.5" aria-hidden="true" />
                    </div>
                    <span className="rounded-full bg-primary-green px-2 py-0.5 text-caption-tight font-black text-white">{index + 1}</span>
                  </div>
                  <h3 className="text-control-label font-black leading-5 text-on-background">{step.title}</h3>
                  <p className="mt-1 text-node-label font-bold leading-5 text-stone-600">{step.detail}</p>
                </div>
              ))}
            </div>
          </TactileCard>

          <TactileCard className="overflow-hidden">
            <div className="border-b-2 border-gray-border bg-primary-green-light/35 p-4">
              <SectionEyebrow>Pricing để test</SectionEyebrow>
              <p className="mt-1 text-control-label font-black leading-5 text-on-background">
                Hybrid theo cohort + active learner. Dùng để test willingness-to-pay, không phải bảng giá cố định.
              </p>
            </div>
            <div className="divide-y divide-gray-border">
              {pricingHypotheses.map((tier) => (
                <div key={tier.plan} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="text-control-label font-black text-on-background">{tier.plan}</h3>
                    <span className="rounded-full border border-primary-green/20 bg-white px-2.5 py-1 text-caption-tight font-black text-primary-green-dark">
                      Pilot
                    </span>
                  </div>
                  <p className="mt-1 text-control-label font-black leading-5 text-primary-green-dark">{tier.price}</p>
                  <p className="mt-1 text-node-label font-bold leading-5 text-stone-600">{tier.fit}</p>
                </div>
              ))}
            </div>
          </TactileCard>
        </div>
      </div>
    </section>
  );
}

function GuardrailsSection() {
  return (
    <section id="guardrails" className="bg-surface-container-low py-8 md:py-11">
      <div className="mx-auto grid w-full max-w-[82rem] gap-3 px-4 lg:grid-cols-[0.85fr_1.15fr]">
        <TactileCard className="p-4">
          <SectionEyebrow>Socratic RAG & guardrails</SectionEyebrow>
          <h2 className="mt-2 font-fraunces text-question-title-sm font-black leading-tight text-on-background">Chatbot trả lời. LMS lưu bài. Mentora xây feedback loop học tập.</h2>
          <p className="mt-3 text-control-label font-semibold leading-6 text-stone-600">
            Moat không nằm ở model. Tài sản là vòng lặp học liệu chính thức, hint có citation, quiz attempt, mastery update và next-review guidance.
          </p>
        </TactileCard>
        <TactileCard className="overflow-hidden">
          <div className="grid md:grid-cols-3">
            {[
              { title: 'Không làm bài hộ', detail: 'Gợi ý theo bậc thang', icon: ShieldCheck },
              { title: 'Citation từ học liệu', detail: 'Dẫn nguồn rõ ràng', icon: LibraryBig },
              { title: 'Audit được nguồn RAG', detail: 'Mentor kiểm tra lại được', icon: FileCheck2 },
            ].map((item) => (
              <div key={item.title} className="border-b-2 border-gray-border p-4 last:border-b-0 md:border-b-0 md:border-r-2 md:last:border-r-0">
                <item.icon className="h-5 w-5 text-primary-green-dark" aria-hidden="true" />
                <h3 className="mt-3 text-control-label font-black text-on-background">{item.title}</h3>
                <p className="mt-1 text-node-label font-bold leading-5 text-stone-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </TactileCard>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="bg-white py-6 md:py-8">
      <div className="mx-auto w-full max-w-[82rem] px-4">
        <TactileCard className="overflow-hidden border-primary-green/25 bg-[linear-gradient(135deg,#ffffff_0%,#f1ffe7_100%)]">
          <div className="grid gap-4 p-4 md:grid-cols-[1fr_0.42fr] md:items-center md:p-5">
            <div>
              <SectionEyebrow>Bắt đầu miễn phí</SectionEyebrow>
              <h2 className="mt-1 font-fraunces text-question-title-sm font-black leading-tight text-on-background">
                Tạo hồ sơ học tập AI đầu tiên
              </h2>
              <p className="mt-2 text-control-label font-semibold leading-6 text-stone-600">
                Làm bài chẩn đoán ngắn để Mentora tạo learning profile, mastery map và hàng đợi luyện tập cá nhân hóa.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-caption-tight font-black text-primary-green-dark">
                {['Không cần setup lớp ngay', 'Có thể bắt đầu từ diagnose', 'Phù hợp học AI/LLM'].map((item) => (
                  <span key={item} className="rounded-full border border-primary-green/20 bg-white px-2.5 py-1">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <LandingCta compact primaryLabel="Tạo hồ sơ học tập" showSecondary={false} />
              <a href="#faq" className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border-2 border-gray-border bg-white text-node-label font-black text-on-background transition hover:bg-surface-container-low">
                Xem FAQ
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </TactileCard>
      </div>
    </section>
  );
}

const landingFaqItems = [
  {
    question: 'Mentora phù hợp với ai?',
    answer: 'Mentora phù hợp với học viên AI/LLM trong cohort, bootcamp, lớp đại học và mentor cần theo dõi tiến độ học theo concept.',
  },
  {
    question: 'Gia sư AI Socratic khác chatbot thường ở điểm nào?',
    answer: 'Socratic AI tutor của Mentora ưu tiên gợi mở từng bước, dùng citation từ học liệu khóa học và tránh đưa lời giải trực tiếp.',
  },
  {
    question: 'Quiz thích ứng hoạt động như thế nào?',
    answer: 'Mentora dùng tín hiệu mastery, Elo/BKT và lịch sử làm bài để chọn câu hỏi gần vùng phát triển hiện tại của học viên.',
  },
  {
    question: 'Giảng viên nhận được dữ liệu gì?',
    answer: 'Mentor có heatmap mastery, nhóm học viên cần hỗ trợ, RAG audit, quiz editor và tín hiệu concept đang yếu trong lớp.',
  },
];

function FaqSection() {
  return (
    <section id="faq" className="bg-surface-container-low py-8 md:py-10">
      <div className="mx-auto w-full max-w-[82rem] px-4">
        <div className="max-w-2xl">
          <SectionEyebrow>FAQ</SectionEyebrow>
          <h2 className="mt-2 font-fraunces text-question-title-sm font-black leading-tight text-on-background md:text-question-title-lg">
            Câu hỏi thường gặp về gia sư AI Mentora
          </h2>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {landingFaqItems.map((item) => (
            <TactileCard key={item.question} className="p-4">
              <h3 className="text-form-base font-black leading-snug text-on-background">{item.question}</h3>
              <p className="mt-2 text-control-label font-semibold leading-6 text-stone-600">{item.answer}</p>
            </TactileCard>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'Mentora',
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web',
        inLanguage: 'vi-VN',
        url: '/',
        description:
          'Course-grounded AI tutor cho học viên AI cohort: Socratic hints có citation, quiz thích ứng, mastery map và next-review guidance.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'VND',
        },
        featureList: [
          'Chẩn đoán mastery theo concept',
          'Quiz thích ứng theo Elo và BKT',
          'Socratic AI tutor có citation',
          'Next-review guidance từ học liệu chính thức',
          'Dashboard mentor theo dõi tiến độ lớp',
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: landingFaqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <main className="min-h-screen bg-background text-on-background font-be-vietnam-pro">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LandingHeader />
      <LandingHeroSection />
      <ProblemSection />
      <LoopSection />
      <AudienceSection />
      <EarlyUsageSection />
      <PilotPricingSection />
      <GuardrailsSection />
      <FaqSection />
      <FinalCtaSection />

      <footer className="border-t-2 border-gray-border bg-background py-5">
        <div className="mx-auto flex w-full max-w-[82rem] flex-col gap-3 px-4 text-node-label font-bold text-stone-500 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <LearningBrandMark compact />
            <span>Gia sư AI cá nhân hóa cho lớp học AI thực chiến.</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <a href="#product" className="hover:text-primary-green-dark">Sản phẩm gia sư AI</a>
            <a href="#guardrails" className="hover:text-primary-green-dark">Guardrails & citation</a>
            <a href="#faq" className="hover:text-primary-green-dark">FAQ</a>
            <span>© 2026 Mentora. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
