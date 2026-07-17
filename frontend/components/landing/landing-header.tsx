import Link from 'next/link';
import { ChevronDown, Globe2 } from 'lucide-react';
import { LearningBrandMark } from '@/components/learning/learning-brand-mark';
import { LOGIN_PATH } from './landing-cta';

const navItems = [
  { label: 'Sản phẩm', href: '#product' },
  { label: 'Học viên', href: '#students' },
  { label: 'Giảng viên', href: '#mentors' },
  { label: 'Số liệu', href: '#usage' },
  { label: 'Pilot', href: '#pilot' },
  { label: 'RAG & Guardrails', href: '#guardrails' },
];

const headerButtonBaseClass =
  'inline-flex min-h-8 cursor-pointer items-center justify-center rounded-xl px-2.5 text-caption-tight font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25 active:scale-[0.98]';

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-border/70 bg-[#fffefa]/88 backdrop-blur-xl">
      <div className="mx-auto flex h-[46px] w-full max-w-[82rem] items-center justify-between gap-2 px-3 lg:px-4 xl:px-5">
        <Link href="/" className="flex min-w-0 origin-left scale-[0.62] items-center rounded-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25 lg:scale-[0.64] xl:scale-[0.68]">
          <LearningBrandMark compact />
        </Link>
        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-2.5 text-helper-micro font-extrabold leading-tight text-stone-600 lg:flex xl:gap-4 xl:text-caption-tight">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="whitespace-nowrap rounded-lg px-1.5 py-1 transition hover:bg-primary-green-light/50 hover:text-primary-green-dark focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1.5">
          <Link href={LOGIN_PATH} className={`${headerButtonBaseClass} border border-primary-green-dark bg-primary-green text-white hover:brightness-105 xl:px-4`}>
            <span className="sm:hidden">Tạo hồ sơ</span>
            <span className="hidden sm:inline">Dùng thử miễn phí</span>
          </Link>
          <button className="hidden min-h-8 items-center gap-1 rounded-xl px-1.5 text-caption-tight font-bold text-stone-700 xl:inline-flex" aria-label="Đổi ngôn ngữ">
            <Globe2 className="h-3.5 w-3.5" aria-hidden="true" />
            VI
            <ChevronDown className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
