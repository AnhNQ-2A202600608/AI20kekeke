import Link from 'next/link';
import { ArrowRight, PlayCircle } from 'lucide-react';

export const LOGIN_PATH = '/login';
export const APP_PATH = '/hoc-tap';

interface LandingCtaProps {
  compact?: boolean;
  primaryLabel?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  showSecondary?: boolean;
}

const landingCtaBaseClass =
  'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25 active:scale-[0.98]';

const landingPrimaryCtaClass = `${landingCtaBaseClass} border border-primary-green-dark bg-primary-green text-white hover:brightness-105`;
const landingSecondaryCtaClass = `${landingCtaBaseClass} border border-gray-border bg-white text-on-background hover:bg-surface-container-low`;

export function LandingCta({
  compact = false,
  primaryLabel = 'Tạo hồ sơ học tập',
  secondaryLabel = 'Xem số liệu sử dụng',
  secondaryHref = '#usage',
  showSecondary = true,
}: LandingCtaProps) {
  return (
    <div className={`flex flex-col gap-2 sm:flex-row ${compact ? 'items-stretch sm:items-center' : 'items-stretch sm:items-center justify-center lg:justify-start'}`}>
      <Link
        href={LOGIN_PATH}
        className={`${landingPrimaryCtaClass} sm:min-w-28`}
      >
        <span>{primaryLabel}</span>
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
      {showSecondary ? (
        <Link
          href={secondaryHref}
          className={`${landingSecondaryCtaClass} sm:min-w-36`}
        >
          <PlayCircle className="h-4 w-4" aria-hidden="true" />
          <span>{secondaryLabel}</span>
        </Link>
      ) : null}
    </div>
  );
}

