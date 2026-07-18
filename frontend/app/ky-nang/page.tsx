"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle, LockKey, Sparkle } from "@phosphor-icons/react";
import { AppShell, ProgressBar } from "../components/AppShell";

const skills = [
  { title: "Khái niệm phân số", detail: "Nhận biết và so sánh phân số", progress: 92, state: "mastered" },
  { title: "Quy đồng mẫu số", detail: "Tìm mẫu số chung và biến đổi phân số", progress: 76, state: "current" },
  { title: "Cộng trừ phân số", detail: "Tính toán cùng và khác mẫu số", progress: 32, state: "next" },
  { title: "Bài toán vận dụng", detail: "Đưa phân số vào tình huống thực tế", progress: 0, state: "locked" },
];

export default function SkillsPage() {
  return <AppShell><section className="skills-head"><div><span className="overline">Bản đồ kỹ năng</span><h1>Nhìn rõ điều cần học tiếp.</h1><p>Các kỹ năng được mở theo thứ tự để bạn không bỏ qua kiến thức nền.</p></div><aside><span>Kỹ năng đã vững</span><strong>1 / 4</strong></aside></section><section className="skill-map">{skills.map((skill, index) => <article className={`skill-map-card ${skill.state}`} key={skill.title}><div className="skill-node">{skill.state === "mastered" ? <CheckCircle weight="fill"/> : skill.state === "locked" ? <LockKey/> : index + 1}</div><div><span>{skill.state === "mastered" ? "Đã nắm vững" : skill.state === "current" ? "Đang tập trung" : skill.state === "locked" ? "Chưa mở khóa" : "Sắp tới"}</span><h2>{skill.title}</h2><p>{skill.detail}</p><ProgressBar value={skill.progress}/></div><strong>{skill.progress}%</strong>{skill.state === "current" && <Link className="chapter-open" href="/chuong/phan-so">Học tiếp <ArrowRight size={16}/></Link>}{skill.state === "locked" && <Sparkle className="skill-lock-spark" size={22}/>}</article>)}</section></AppShell>;
}
