import type { Metadata } from "next";
import { Suspense } from "react";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mentora | Học tập cá nhân hóa",
  description:
    "Nền tảng học tập cá nhân hóa với lộ trình, bài học, luyện tập, kiểm tra và phân tích tiến độ.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning><Suspense fallback={null}>{children}</Suspense></body>
    </html>
  );
}
