"use client";

import Link from "next/link";
import { ArrowRight, House } from "@phosphor-icons/react";

export default function NotFound() {
  return (
    <main className="logout-page">
      <section>
        <span className="brand-symbol">OL</span>
        <h1>Không tìm thấy trang này</h1>
        <p>Đường dẫn có thể đã thay đổi. Hãy quay về khu vực học tập để tiếp tục.</p>
        <Link className="primary-action" href="/auth">
          <House size={17} weight="fill" />
          Về trang đăng nhập
          <ArrowRight size={16} weight="bold" />
        </Link>
      </section>
    </main>
  );
}
