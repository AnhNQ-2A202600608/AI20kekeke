import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Compass, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8 font-be-vietnam-pro text-on-background">
      <Image
        src="/app-backgrounds/code-bay-app-shell-bg.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover opacity-55"
      />
      <div className="absolute inset-0 -z-10 bg-background/45" />

      <section className="grid w-full max-w-5xl items-center gap-6 rounded-[1.75rem] border border-primary-green/20 bg-white/90 p-5 shadow-[0_24px_80px_rgba(44,91,18,0.18)] backdrop-blur-sm md:grid-cols-[minmax(0,1fr)_22rem] md:p-8">
        <div className="min-w-0">
          <Image
            src="/brand/edugap/logo-cropped.png"
            alt="EduGap"
            width={190}
            height={64}
            priority
            className="h-11 w-auto object-contain"
          />

          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-primary-green/25 bg-primary-green/10 px-3 py-1.5 text-[11px] font-black uppercase text-primary-green-dark">
            <Compass className="h-4 w-4" aria-hidden="true" />
            404 - Lạc đường học tập
          </div>

          <h1 className="mt-4 max-w-2xl text-4xl font-black leading-tight text-on-background md:text-5xl">
            Sofi chưa tìm thấy trang này.
          </h1>
          <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-stone-600 md:text-base">
            Đường dẫn có thể đã thay đổi hoặc bài học không còn ở vị trí này. Quay lại EduGap để tiếp tục lộ trình đang học.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/app"
              className="btn-3d btn-green gap-2 px-5 py-3 text-xs"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              Về trang học
            </Link>
            <Link
              href="/"
              className="btn-3d btn-white gap-2 px-5 py-3 text-xs"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Về trang chủ
            </Link>
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-[18rem] justify-center md:max-w-none">
          <div className="absolute bottom-2 h-20 w-56 rounded-full bg-primary-green/15 blur-2xl" />
          <Image
            src="/mascot/edo/edo-sofi-next-path-lantern.webp"
            alt="Sofi đang cầm đèn chỉ đường quay lại lộ trình học"
            width={520}
            height={520}
            priority
            className="relative h-auto w-full max-w-[18rem] object-contain drop-shadow-[0_22px_28px_rgba(27,57,14,0.18)] md:max-w-[21rem]"
          />
        </div>
      </section>
    </main>
  );
}
