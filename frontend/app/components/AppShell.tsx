"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ReactNode, useState, useSyncExternalStore } from "react";
import {
  BookOpenText,
  CaretDown,
  Calculator,
  ChartBar,
  ChatCircleDots,
  ClipboardText,
  Fire,
  Graph,
  Plus,
  SignOut,
  SidebarSimple,
  Trophy,
  UserCircle,
} from "@phosphor-icons/react";
import { activeLearningLevel, levelThemes, subjectPrograms, subjects } from "../data";
import { useSubjectProfiles } from "../hooks/useOnboardingProfile";
import { useAuthSession } from "../lib/session";
import shellStyles from "./app-shell.module.css";

const navItems = [
  { href: "/hoc-tap", label: "Ôn tập", icon: BookOpenText },
  { href: "/on-thi", label: "Ôn thi", icon: ClipboardText },
];

const profileMenuItems = [
  { href: "/dashboard", label: "Dashboard", description: "Tiến độ và nhận xét", icon: ChartBar },
  { href: "/skill-graph", label: "Kỹ năng", description: "Bản đồ năng lực", icon: Graph },
  { href: "/hoi-dap-ai", label: "Hỏi đáp AI", description: "Giải đáp theo bài học", icon: ChatCircleDots },
  { href: "/thanh-tich", label: "Thành tích", description: "Huy hiệu và bảng xếp hạng", icon: Trophy },
  { href: "/ho-so", label: "Hồ sơ", description: "Tài khoản và cài đặt", icon: UserCircle },
];

const subjectIcons = {
  TO: Calculator,
};

const SIDEBAR_COLLAPSE_KEY = "mentora-sidebar-collapsed";
const LEGACY_SIDEBAR_COLLAPSE_KEY = "orbitlearn-sidebar-collapsed";
const SIDEBAR_CHANGE_EVENT = "orbitlearn-sidebar-change";

function subscribeToSidebarPreference(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(SIDEBAR_CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(SIDEBAR_CHANGE_EVENT, listener);
  };
}

function getSidebarPreference() {
  return (window.localStorage.getItem(SIDEBAR_COLLAPSE_KEY) || window.localStorage.getItem(LEGACY_SIDEBAR_COLLAPSE_KEY)) === "true";
}

export function AppShell({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sidebarCollapsed = useSyncExternalStore(subscribeToSidebarPreference, getSidebarPreference, () => false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const isProfilePage = pathname.startsWith("/ho-so");
  const isAiQuestionPage = pathname.startsWith("/hoi-dap-ai");
  const isSkillGraphPage = pathname.startsWith("/skill-graph");
  const isExamPage = pathname.startsWith("/on-thi");
  const hideSidebar = compact || isProfilePage || isAiQuestionPage || isSkillGraphPage || isExamPage;
  const selectedSubjectCode = searchParams.get("subject") || "TO";
  const selectedSubject = subjects.find((subject) => subject.code === selectedSubjectCode) || subjects[0];
  const currentProgram = subjectPrograms[selectedSubject.code as keyof typeof subjectPrograms] || subjectPrograms.TO;
  const shouldCollapseSidebar = !hideSidebar && sidebarCollapsed;
  const subjectProfiles = useSubjectProfiles();
  const authSession = useAuthSession();
  const profileName = authSession?.user.fullName || "Hoàng Nam";
  const profileInitials = profileName.split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]).join("").toUpperCase() || "HN";


  const handleToggleSidebar = () => {
    window.localStorage.setItem(SIDEBAR_COLLAPSE_KEY, String(!sidebarCollapsed));
    window.dispatchEvent(new Event(SIDEBAR_CHANGE_EVENT));
  };

  return (
    <div className={`app-shell subject-${currentProgram.accent} ${hideSidebar ? "app-shell-compact" : ""} ${shouldCollapseSidebar ? "sidebar-collapsed" : ""}`}>
      <a className="skip-link" href="#main-content">Đi thẳng đến nội dung</a>
      <header className="app-header">
        <div className="header-leading">
          <Link className="brand" href="/hoc-tap" aria-label="Về trang học tập">
            <span className="brand-symbol">M</span>
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
          <Link className={`header-ai-link ${isAiQuestionPage ? "active" : ""}`} href={`/hoi-dap-ai?subject=${selectedSubject.code}`} aria-label="Mở Trợ lý AI" title="Trợ lý AI">
            <ChatCircleDots size={18} weight={isAiQuestionPage ? "fill" : "regular"} />
            <span>Trợ lý AI</span>
          </Link>
          <div className={shellStyles.profileMenu}>
            <button
              className="profile-summary"
              type="button"
              aria-label={`Mở menu tài khoản ${profileName}`}
              aria-expanded={profileMenuOpen}
              onClick={() => setProfileMenuOpen((open) => !open)}
            >
              <span className="header-streak" title={`${activeLearningLevel.streak} ngày học liên tiếp`}>
                <Fire size={15} weight="fill" />
                <strong>{activeLearningLevel.streak}</strong>
              </span>
              <span className="avatar">{profileInitials}</span>
              <CaretDown className={profileMenuOpen ? shellStyles.menuCaretOpen : shellStyles.menuCaret} size={15} weight="bold" />
            </button>
            {profileMenuOpen && (
              <div className={shellStyles.profileDropdown} role="menu" aria-label="Tiện ích tài khoản">
                <div className={shellStyles.profileDropdownHeader}>
                  <span className="avatar">{profileInitials}</span>
                  <div><strong>{profileName}</strong><small>{authSession?.user.email || activeLearningLevel.title}</small></div>
                </div>
                <div className={shellStyles.profileMenuLinks}>
                  {profileMenuItems.map((item) => {
                    const Icon = item.icon;
                    return <Link href={`${item.href}?subject=${selectedSubject.code}`} key={item.href} onClick={() => setProfileMenuOpen(false)}>
                      <Icon size={18} weight="regular" />
                      <span><strong>{item.label}</strong><small>{item.description}</small></span>
                    </Link>;
                  })}
                </div>
                <Link className={shellStyles.profileLogout} href="/dang-xuat" onClick={() => setProfileMenuOpen(false)}><SignOut size={17} weight="bold" />Đăng xuất</Link>
              </div>
            )}
          </div>
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
