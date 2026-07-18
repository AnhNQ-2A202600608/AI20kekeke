"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpenText, ChatCircleDots, Graph, Sparkle, Target } from "@phosphor-icons/react";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <main className="auth-page auth-page-refined">
      <section className="auth-visual">
        <Link className="brand auth-brand" href="/auth"><span className="brand-symbol">M</span><span>Mentora</span></Link>
        <div className="auth-intro">
          <span className="overline">Lộ trình dành riêng cho bạn</span>
          <h1>Một nơi để biết hôm nay nên học gì.</h1>
          <p>Mentora gom lộ trình, skill graph, bài luyện và trợ giảng AI vào một không gian rõ ràng cho từng học sinh.</p>
        </div>
        <div className="auth-learning-preview auth-system-preview" aria-label="Mô hình học tập cá nhân hóa">
          <div className="auth-preview-head">
            <div>
              <span>Cách Mentora tạo lộ trình</span>
              <strong>Mỗi học sinh có một bản đồ học khác nhau</strong>
            </div>
            <span className="auth-level-chip">Cá nhân hóa sau đăng nhập</span>
          </div>
          <div className="auth-mini-grid">
            <div className="auth-mini-card active">
              <BookOpenText size={19} weight="fill" />
              <span>Bước 1</span>
              <strong>Chọn môn học</strong>
            </div>
            <div className="auth-mini-card">
              <Graph size={19} weight="bold" />
              <span>Bước 2</span>
              <strong>Mở skill graph</strong>
            </div>
            <div className="auth-mini-card">
              <ChatCircleDots size={19} weight="fill" />
              <span>Bước 3</span>
              <strong>Hỏi AI khi bí</strong>
            </div>
          </div>
          <div className="auth-path-preview">
            <span className="done"><Target size={16} weight="fill" /> Mục tiêu học</span>
            <span className="current"><Sparkle size={16} weight="fill" /> Gợi ý bài tiếp theo</span>
            <span>Ôn tập theo năng lực</span>
          </div>
          <div className="auth-neutral-note">
            <span>Không hiển thị dữ liệu học cá nhân trước khi đăng nhập.</span>
            <strong>Lộ trình thật sẽ được tạo sau khi học sinh chọn lớp, môn và mục tiêu.</strong>
          </div>
        </div>
      </section>

      <section className="auth-form-section">
        <div className="auth-form-wrap">
          <div className="auth-tabs">
            <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")} type="button">Đăng nhập</button>
            <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")} type="button">Đăng ký</button>
          </div>
          <div className="auth-copy">
            <h2>{mode === "login" ? "Chào mừng bạn trở lại" : "Tạo hồ sơ học tập"}</h2>
            <p>{mode === "login" ? "Tiếp tục mục tiêu hôm nay và xem trợ giảng gợi ý bước tiếp theo." : "Tạo tài khoản trước. Lớp, level và bài test xếp trình độ sẽ nằm ở bước thiết lập tiếp theo."}</p>
          </div>
          <form className="form-stack">
            {mode === "register" && <label>Họ và tên<input placeholder="Nguyễn Hoàng Nam" autoComplete="name" /></label>}
            <label>Email<input type="email" placeholder="nam@school.edu.vn" autoComplete="email" /></label>
            <label>Mật khẩu<input type="password" placeholder="Tối thiểu 8 ký tự" autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
            {mode === "login" && <div className="form-assist"><label className="check-label"><input type="checkbox" /> Ghi nhớ đăng nhập</label><button type="button">Quên mật khẩu?</button></div>}
            <Link className="primary-action" href={mode === "login" ? "/hoc-tap" : "/onboarding"}>{mode === "login" ? "Vào workspace" : "Tiếp tục thiết lập"}<span>→</span></Link>
          </form>
          <p className="auth-terms">Bằng cách tiếp tục, bạn đồng ý với Điều khoản sử dụng và Chính sách bảo mật.</p>
        </div>
      </section>
    </main>
  );
}
