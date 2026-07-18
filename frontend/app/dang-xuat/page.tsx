"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    window.localStorage.removeItem("orbitlearn-sidebar-collapsed");
    window.sessionStorage.clear();
    router.replace("/auth");
  }, [router]);

  return (
    <main className="logout-page">
      <section>
        <span className="brand-symbol">OL</span>
        <h1>Đang đăng xuất</h1>
        <p>Phiên làm việc đang được đóng và bạn sẽ quay về trang đăng nhập.</p>
      </section>
    </main>
  );
}
