import type { Metadata } from 'next';
import { Be_Vietnam_Pro, Fraunces } from 'next/font/google';
import "@fontsource-variable/plus-jakarta-sans";
import './globals.css'; // Global styles
import 'katex/dist/katex.min.css'; // KaTeX styles for math formulas
import { Analytics } from '@vercel/analytics/react';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-be-vietnam-pro',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-fraunces',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://mentora.ai'),
  title: {
    default: 'Mentora | Course-grounded AI tutor cho học sinh',
    template: '%s | Mentora',
  },
  description: 'Mentora giúp học sinh hiểu, luyện tập và biết nên ôn gì tiếp từ học liệu chính thức bằng Socratic hints có citation, quiz thích ứng và mastery map.',
  keywords: [
    'course-grounded AI tutor',
    'gia sư AI cá nhân hóa',
    'AI tutor Socratic',
    'AI cohort learning',
    'luyện tập AI thích ứng',
    'adaptive quiz',
    'RAG citation',
    'mastery map',
    'next review focus',
    'học AI thực chiến',
    'dashboard mentor',
  ],
  authors: [{ name: 'Mentora' }],
  creator: 'Mentora',
  publisher: 'Mentora',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: '/',
    siteName: 'Mentora',
    title: 'Mentora | Học để hiểu, không chỉ lấy đáp án',
    description: 'Course-grounded AI tutor cho học sinh: cited Socratic hints, adaptive practice, mastery updates và next-review guidance từ học liệu chính thức.',
    images: [
      {
        url: '/app-backgrounds/code-bay-app-shell-bg.webp',
        width: 1200,
        height: 630,
        alt: 'Mentora AI learning workspace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mentora | Course-grounded AI tutor',
    description: 'Học để hiểu, luyện đúng điểm yếu và biết nên ôn gì tiếp từ học liệu chính thức.',
    images: ['/app-backgrounds/code-bay-app-shell-bg.webp'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/brand/mentora/favicon.ico', sizes: 'any' },
      { url: '/brand/mentora/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/mentora/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/brand/mentora/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <body className="font-be-vietnam-pro bg-background text-on-background min-h-screen" suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
