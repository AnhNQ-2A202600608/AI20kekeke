"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AppShell, ProgressBar } from "../../components/AppShell";

const sections = ["Mục tiêu dạng bài", "Quy đồng mẫu số", "Ví dụ minh họa", "Ghi nhớ"];

export default function LessonPage() {
  const searchParams = useSearchParams();
  const subjectCode = searchParams.get("subject") || "TO";
  const [active, setActive] = useState(1);

  return (
    <AppShell compact>
      <div className="lesson-page">
        <aside className="lesson-outline">
          <Link className="back-link" href={`/hoc-tap?subject=${subjectCode}`}>← Lộ trình học</Link>
          <div><span className="overline">Chương 1 · Dạng 2 · Bài học 2</span><h2>Quy đồng mẫu số</h2></div>
          <div className="lesson-progress"><div><span>Tiến độ bài học</span><strong>60%</strong></div><ProgressBar value={60} /></div>
          <nav>{sections.map((section, index) => <button className={active === index ? "active" : ""} onClick={() => setActive(index)} type="button" key={section}><span>{index + 1}</span>{section}</button>)}</nav>
          <div className="lesson-meta"><span>Thời lượng còn lại</span><strong>5 phút</strong><span>Phần thưởng</span><strong>+60 XP</strong></div>
        </aside>
        <article className="lesson-content">
          <div className="lesson-content-head"><div><span className="overline">Kiến thức trọng tâm · Chương 1 / Dạng 2 / Bài học 2</span><h1>Quy đồng để đưa hai phân số về cùng một “đơn vị”.</h1></div><span className="page-count">02 / 04</span></div>
          <p className="lesson-lead">Khi hai phân số có mẫu khác nhau, ta chưa thể cộng trực tiếp tử số. Hãy biến đổi chúng thành hai phân số bằng nhau có cùng mẫu.</p>
          <div className="formula-stage">
            <div className="fraction"><span>2</span><span>3</span></div><strong>+</strong><div className="fraction"><span>1</span><span>4</span></div><strong>=</strong><div className="fraction accent"><span>8 + 3</span><span>12</span></div><strong>=</strong><div className="fraction result"><span>11</span><span>12</span></div>
          </div>
          <div className="explanation-grid">
            <section><span className="step-number">01</span><h3>Tìm mẫu số chung</h3><p>Bội chung nhỏ nhất của 3 và 4 là 12. Đây sẽ là mẫu số chung.</p></section>
            <section><span className="step-number">02</span><h3>Biến đổi từng phân số</h3><p>Nhân cả tử và mẫu của 2/3 với 4; nhân cả tử và mẫu của 1/4 với 3.</p></section>
          </div>
          <aside className="remember-note"><strong>Điểm cần nhớ</strong><p>Chỉ cộng tử số sau khi hai mẫu số đã giống nhau. Không cộng trực tiếp hai mẫu số.</p></aside>
          <div className="lesson-actions"><button type="button" onClick={() => setActive(Math.max(0, active - 1))}>← Phần trước</button><Link className="primary-action" href={`/luyen-tap?subject=${subjectCode}`}>Luyện tập bài học này<span>→</span></Link></div>
        </article>
      </div>
    </AppShell>
  );
}
