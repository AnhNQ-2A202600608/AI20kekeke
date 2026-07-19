"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpenText, ChatCircleDots, Graph, Sparkle, Target } from "@phosphor-icons/react";
import { ApiClientError, loginWithPassword, registerAccount } from "../lib/api-client";
import { saveAuthSession } from "../lib/session";

const staffRoles = new Set(["mentor", "admin", "dev", "btc"]);

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const changeMode = (nextMode: "login" | "register") => {
    setMode(nextMode);
    setError("");
    setNotice("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      const account = mode === "login"
        ? await loginWithPassword(email.trim(), password)
        : await registerAccount({ email: email.trim(), password, fullName: fullName.trim() });

      if (!account.token) {
        setMode("login");
        setNotice("Tài khoản đã được tạo. Hãy xác thực email (nếu được yêu cầu) rồi đăng nhập để tiếp tục.");
        return;
      }

      saveAuthSession({
        token: account.token,
        user: {
          id: account.id,
          email: account.email,
          fullName: account.full_name,
          mssv: account.mssv,
          role: account.role,
        },
      }, remember);

      const requestedPath = searchParams.get("next");
      const safeRequestedPath = requestedPath?.startsWith("/") && !requestedPath.startsWith("//") ? requestedPath : null;
      const destination = safeRequestedPath || (staffRoles.has(account.role) ? "/giao-vien" : mode === "register" ? "/onboarding" : "/hoc-tap");
      router.replace(destination);
    } catch (requestError) {
      setError(requestError instanceof ApiClientError ? requestError.message : "Không thể hoàn tất xác thực. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <div className="auth-mini-card active"><BookOpenText size={19} weight="fill" /><span>Bước 1</span><strong>Chọn môn học</strong></div>
            <div className="auth-mini-card"><Graph size={19} weight="bold" /><span>Bước 2</span><strong>Mở skill graph</strong></div>
            <div className="auth-mini-card"><ChatCircleDots size={19} weight="fill" /><span>Bước 3</span><strong>Hỏi AI khi bí</strong></div>
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
            <button className={mode === "login" ? "active" : ""} onClick={() => changeMode("login")} type="button">Đăng nhập</button>
            <button className={mode === "register" ? "active" : ""} onClick={() => changeMode("register")} type="button">Đăng ký</button>
          </div>
          <div className="auth-copy">
            <h2>{mode === "login" ? "Chào mừng bạn trở lại" : "Tạo hồ sơ học tập"}</h2>
            <p>{mode === "login" ? "Tiếp tục mục tiêu hôm nay và xem trợ giảng gợi ý bước tiếp theo." : "Tạo tài khoản trước. Lớp, level và bài test xếp trình độ sẽ nằm ở bước thiết lập tiếp theo."}</p>
          </div>
          <form className="form-stack" onSubmit={handleSubmit}>
            {mode === "register" && <label>Họ và tên<input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Nguyễn Hoàng Nam" autoComplete="name" required /></label>}
            <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nam@school.edu.vn" autoComplete="email" required /></label>
            <label>Mật khẩu<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Tối thiểu 8 ký tự" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "register" ? 6 : undefined} required /></label>
            {mode === "login" && <div className="form-assist"><label className="check-label"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> Ghi nhớ đăng nhập</label><button type="button" onClick={() => setNotice("Liên hệ giáo viên hoặc quản trị viên để được hỗ trợ đặt lại mật khẩu.")}>Quên mật khẩu?</button></div>}
            {error && <p className="auth-form-status error" role="alert">{error}</p>}
            {notice && <p className="auth-form-status" role="status">{notice}</p>}
            <button className="primary-action" disabled={isSubmitting} type="submit">{isSubmitting ? "Đang xác thực" : mode === "login" ? "Vào workspace" : "Tiếp tục thiết lập"}<span>→</span></button>
          </form>
          <p className="auth-terms">Bằng cách tiếp tục, bạn đồng ý với Điều khoản sử dụng và Chính sách bảo mật.</p>
        </div>
      </section>
    </main>
  );
}