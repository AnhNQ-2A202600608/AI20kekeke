"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ReactNode, useEffect, useState, Suspense } from "react";
import {
  BookOpenText,
  Books,
  Calculator,
  ChartBar,
  ChatCircleDots,
  Fire,
  Flask,
  Graph,
  Plus,
  SidebarSimple,
  Translate,
  Trophy,
} from "@phosphor-icons/react";
import { activeLearningLevel, levelThemes, subjectPrograms, subjects } from "../data";
import { useSubjectProfiles } from "../hooks/useOnboardingProfile";

const navItems = [
  { href: "/hoc-tap", label: "Học tập", icon: BookOpenText },
  { href: "/skill-graph", label: "Skill Graph", icon: Graph },
  { href: "/hoi-dap-ai", label: "Hỏi đáp AI", icon: ChatCircleDots },
  { href: "/dashboard", label: "Dashboard", icon: ChartBar },
  { href: "/thanh-tich", label: "Thành tích", icon: Trophy },
];

const subjectIcons = {
  TO: Calculator,
  NV: Books,
  TA: Translate,
  KH: Flask,
};

export function AppShell({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return (
    <Suspense fallback={<div className="app-shell-loading">Đang tải...</div>}>
      <AppShellInner compact={compact}>{children}</AppShellInner>
    </Suspense>
  );
}

function AppShellInner({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isProfilePage = pathname.startsWith("/ho-so");
  const isAiQuestionPage = pathname.startsWith("/hoi-dap-ai");
  const isSkillGraphPage = pathname.startsWith("/skill-graph");
  const hideSidebar = compact || isProfilePage || isAiQuestionPage || isSkillGraphPage;
  const selectedSubjectCode = searchParams.get("subject") || "TO";
  const selectedSubject = subjects.find((subject) => subject.code === selectedSubjectCode) || subjects[0];
  const currentProgram = subjectPrograms[selectedSubject.code as keyof typeof subjectPrograms] || subjectPrograms.TO;
  const shouldCollapseSidebar = !hideSidebar && sidebarCollapsed;
  const subjectProfiles = useSubjectProfiles();

  useEffect(() => {
    const isCollapsed = window.localStorage.getItem("mentora-sidebar-collapsed") === "true";
    setTimeout(() => {
      setSidebarCollapsed(isCollapsed);
    }, 0);
  }, []);

  const handleToggleSidebar = () => {
    setSidebarCollapsed((value) => {
      const nextValue = !value;
      window.localStorage.setItem("mentora-sidebar-collapsed", String(nextValue));
      return nextValue;
    });
  };

  return (
    <div className={`app-shell subject-${currentProgram.accent} ${hideSidebar ? "app-shell-compact" : ""} ${shouldCollapseSidebar ? "sidebar-collapsed" : ""}`}>
      <a className="skip-link" href="#main-content">Đi thẳng đến nội dung</a>
      <header className="app-header">
        <div className="header-leading">
          <Link className="brand" href="/hoc-tap" aria-label="Về trang học tập">
            <span className="brand-symbol">OL</span>
            <span>Mentora</span>
          </Link>
        </div>
        <nav className="main-nav" aria-label="Điều hướng chính">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            const href = `${item.href}?subject=${selectedSubject.code}`;
            return (
              <Link className={active ? "active" : ""} href={href} key={item.href}>
                <Icon size={17} weight={active ? "fill" : "regular"} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="header-account-actions">
          <Link className="profile-summary" href="/ho-so" aria-label="Mở hồ sơ Hoàng Nam">
            <span className="header-streak" title={`${activeLearningLevel.streak} ngày học liên tiếp`}>
              <Fire size={15} weight="fill" />
              <strong>{activeLearningLevel.streak}</strong>
            </span>
            <span className="avatar">HN</span>
          </Link>
          <Link className="logout-action" href="/dang-xuat">Đăng xuất</Link>
        </div>
      </header>

      <div className="workspace-grid">
        {!hideSidebar && (
          <aside className="subject-sidebar">
            <div className="sidebar-heading">
              <span>Môn học của bạn</span>
              <div className="sidebar-actions">
                <button
                  className="shell-toggle"
                  type="button"
                  onClick={handleToggleSidebar}
                  aria-label={sidebarCollapsed ? "Mở rộng danh sách môn học" : "Thu gọn danh sách môn học"}
                  title={sidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
                >
                  <SidebarSimple size={17} weight="regular" />
                </button>
                <Link className="add-subject" href="/onboarding?create=subject" title="Thêm môn học" aria-label="Thêm môn học">
                  <Plus size={15} weight="bold" />
                </Link>
              </div>
            </div>
            <div className="subject-list">
              {subjects.map((subject) => {
                const SubjectIcon = subjectIcons[subject.code as keyof typeof subjectIcons];
                const isActive = subject.code === selectedSubject.code;
                return (
                  <Link className={isActive ? "subject-item active" : "subject-item"} href={`/hoc-tap?subject=${subject.code}`} key={subject.name} title={subject.name}>
                    <span className="subject-code">
                      <SubjectIcon size={18} weight={isActive ? "fill" : "regular"} />
                    </span>
                    <span>
                      <strong>{subject.name}</strong>
                      <small>{subjectProfiles[subject.code]?.progress ?? 0}% hoàn thành</small>
                    </span>
                  </Link>
                );
              })}
            </div>
            <div className="weekly-goal">
              <div><span><Fire size={15} weight="fill" /> Mục tiêu tuần</span><strong>4/5 buổi</strong></div>
              <div className="progress-track"><span style={{ width: "80%" }} /></div>
              <small>Còn 1 buổi để giữ chuỗi</small>
            </div>
          </aside>
        )}
        <main className="workspace-main" id="main-content">{children}</main>
      </div>
    </div>
  );
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  return <div className="progress-track" aria-label={label ?? `Tiến độ ${value}%`}><span style={{ width: `${value}%` }} /></div>;
}

export function LevelBadge({ level }: { level: keyof typeof levelThemes }) {
  const theme = levelThemes[level];
  return <span className={`level-badge ${theme.className}`}>{theme.label}</span>;
}
