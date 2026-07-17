"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import {
  BookOpenText,
  Books,
  Calculator,
  ChartBar,
  ChatCircleDots,
  Fire,
  Flask,
  PaperPlaneTilt,
  Plus,
  SidebarSimple,
  Sparkle,
  Translate,
  Trophy,
  X,
} from "@phosphor-icons/react";
import { levelThemes, subjects } from "../data";

const navItems = [
  { href: "/hoc-tap", label: "Học tập", icon: BookOpenText },
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
  const pathname = usePathname();
  const [chatOpen, setChatOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const currentLevel = levelThemes.explorer;

  return (
    <div className={`app-shell ${compact ? "app-shell-compact" : ""} ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <a className="skip-link" href="#main-content">Đi thẳng đến nội dung</a>
      <header className="app-header">
        <div className="header-leading">
          <Link className="brand" href="/hoc-tap" aria-label="Về trang học tập">
            <span className="brand-symbol">OL</span>
            <span>OrbitLearn</span>
          </Link>
        </div>
        <nav className="main-nav" aria-label="Điều hướng chính">
          {navItems.map((item) => {
            const Icon = item.icon;
            return <Link className={pathname.startsWith(item.href) ? "active" : ""} href={item.href} key={item.href}><Icon size={17} weight={pathname.startsWith(item.href) ? "fill" : "regular"}/><span>{item.label}</span></Link>;
          })}
        </nav>
        <div className="profile-summary">
          <div className="profile-copy"><strong>Hoàng Nam</strong><span>Lớp 7A · 12 ngày liên tiếp</span></div>
          <span className={`level-badge ${currentLevel.className}`}>{currentLevel.label}</span>
          <span className="avatar">HN</span>
        </div>
      </header>

      <div className="workspace-grid">
        {!compact && (
          <aside className="subject-sidebar">
            <div className="sidebar-heading">
              <span>Môn học của bạn</span>
              <div className="sidebar-actions">
                <button className="shell-toggle" type="button" onClick={() => setSidebarCollapsed((value) => !value)} aria-label={sidebarCollapsed ? "Mở rộng danh sách môn học" : "Thu gọn danh sách môn học"} title={sidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}><SidebarSimple size={17} weight="regular" /></button>
                <button className="add-subject" type="button" title="Thêm môn học" aria-label="Thêm môn học"><Plus size={15} weight="bold"/></button>
              </div>
            </div>
            <div className="subject-list">
              {subjects.map((subject) => {
                const SubjectIcon = subjectIcons[subject.code as keyof typeof subjectIcons];
                return <Link className={subject.active ? "subject-item active" : "subject-item"} href="/hoc-tap" key={subject.name} title={subject.name}>
                  <span className="subject-code"><SubjectIcon size={18} weight={subject.active ? "fill" : "regular"}/></span>
                  <span><strong>{subject.name}</strong><small>{subject.progress}% hoàn thành</small></span>
                </Link>;
              })}
            </div>
            <div className="weekly-goal">
              <div><span><Fire size={15} weight="fill"/> Mục tiêu tuần</span><strong>4/5 buổi</strong></div>
              <div className="progress-track"><span style={{ width: "80%" }} /></div>
              <small>Còn 1 buổi để giữ chuỗi</small>
            </div>
          </aside>
        )}
        <main className="workspace-main" id="main-content">{children}</main>
      </div>

      <button className="chat-trigger" type="button" onClick={() => setChatOpen((value) => !value)} aria-expanded={chatOpen}>
        <span><Sparkle size={18} weight="fill"/></span><strong>Hỏi trợ giảng</strong>
      </button>
      {chatOpen && (
        <aside className="chat-panel" aria-label="Trợ giảng AI">
          <div className="chat-header"><div className="chat-title-icon"><span><ChatCircleDots size={19} weight="fill"/></span><div><strong>Trợ giảng Orbit</strong><small>Đang theo dõi bài học hiện tại</small></div></div><button type="button" onClick={() => setChatOpen(false)} aria-label="Đóng trợ giảng"><X size={18}/></button></div>
          <div className="chat-body">
            <div className="chat-message bot">Mình có thể giải thích kiến thức, gợi ý từng bước hoặc phân tích lỗi sai của bạn.</div>
            <button className="chat-suggestion" type="button">Vì sao phải quy đồng mẫu số?</button>
            <button className="chat-suggestion" type="button">Giải thích lại câu mình vừa làm sai</button>
          </div>
          <form className="chat-input"><input aria-label="Nội dung câu hỏi" placeholder="Nhập câu hỏi về bài học..."/><button type="button" aria-label="Gửi câu hỏi"><PaperPlaneTilt size={18} weight="fill"/></button></form>
        </aside>
      )}
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
