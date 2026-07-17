"use client";

import Link from "next/link";
import { useState } from "react";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <Link className="brand auth-brand" href="/auth"><span className="brand-symbol">OL</span><span>OrbitLearn</span></Link>
        <div className="auth-intro">
          <span className="overline">Lộ trình dành riêng cho bạn</span>
          <h1>Học đúng phần mình cần, tiến bộ theo nhịp của riêng mình.</h1>
          <p>Mỗi bài học, bài luyện tập và bài kiểm tra đều được kết nối thành một hành trình có mục tiêu rõ ràng.</p>
        </div>
        <div className="auth-preview">
          <div className="preview-profile"><span className="avatar avatar-large">HN</span><div><strong>Hoàng Nam</strong><small>Explorer · Toán lớp 7</small></div></div>
          <div className="preview-xp"><div><span>Tiến độ cấp độ</span><strong>1.840 / 2.400 XP</strong></div><div className="progress-track"><span style={{ width: "77%" }} /></div></div>
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
            <p>{mode === "login" ? "Tiếp tục hành trình học tập của bạn hôm nay." : "Bắt đầu với lớp học, môn học và mục tiêu phù hợp."}</p>
          </div>
          <form className="form-stack">
            {mode === "register" && <label>Họ và tên<input placeholder="Nguyễn Hoàng Nam" autoComplete="name" /></label>}
            <label>Email<input type="email" placeholder="nam@school.edu.vn" autoComplete="email" /></label>
            <label>Mật khẩu<input type="password" placeholder="Tối thiểu 8 ký tự" autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
            {mode === "register" && <div className="form-row"><label>Lớp<select defaultValue="7"><option>6</option><option>7</option><option>8</option><option>9</option></select></label><label>Mục tiêu<select defaultValue="Nắm chắc kiến thức"><option>Nắm chắc kiến thức</option><option>Cải thiện điểm số</option><option>Thi học sinh giỏi</option></select></label></div>}
            {mode === "login" && <div className="form-assist"><label className="check-label"><input type="checkbox" /> Ghi nhớ đăng nhập</label><button type="button">Quên mật khẩu?</button></div>}
            <Link className="primary-action" href="/hoc-tap">{mode === "login" ? "Vào workspace" : "Tạo lộ trình"}<span>→</span></Link>
          </form>
          <p className="auth-terms">Bằng cách tiếp tục, bạn đồng ý với Điều khoản sử dụng và Chính sách bảo mật.</p>
        </div>
      </section>
    </main>
  );
}
