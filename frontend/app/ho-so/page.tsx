import Link from "next/link";
import { AppShell, ProgressBar } from "../components/AppShell";

const activity = [
  { title: "Quy đồng hai phân số", kind: "Bài học", when: "Hôm nay · 16:20", progress: 60, href: "/bai-hoc/phan-so" },
  { title: "Luyện tập có gợi ý", kind: "Luyện tập", when: "Hôm qua · 19:10", progress: 100, href: "/luyen-tap" },
  { title: "Khái niệm phân số", kind: "Dạng bài", when: "15 tháng 7", progress: 100, href: "/chuong/phan-so" },
];

export default function ProfilePage() {
  return <AppShell><section className="profile-page-head"><div><span className="overline">Hồ sơ học tập</span><h1>Hoàng Nam</h1><p>Lớp 7A · Explorer · Toán học</p></div><Link className="chapter-open" href="/onboarding">Điều chỉnh lộ trình</Link></section><section className="profile-layout"><article className="profile-card identity-card"><span className="avatar avatar-large">HN</span><div><h2>Thông tin cá nhân</h2><p>nam@school.edu.vn</p></div><dl><div><dt>Lớp hiện tại</dt><dd>7A</dd></div><div><dt>Mục tiêu</dt><dd>Nắm chắc kiến thức</dd></div><div><dt>Nhịp học</dt><dd>30 phút mỗi ngày</dd></div></dl></article><article className="profile-card"><div className="panel-heading"><div><h2>Hoạt động gần đây</h2><p>Tiếp tục đúng nơi bạn đang dở.</p></div></div><div className="history-list">{activity.map((item) => <Link href={item.href} key={item.title}><div><span>{item.kind}</span><strong>{item.title}</strong><small>{item.when}</small></div><ProgressBar value={item.progress}/><b>{item.progress}%</b></Link>)}</div></article><aside className="profile-card settings-card"><div><h2>Cài đặt học tập</h2><p>Các lựa chọn áp dụng cho gợi ý bài học.</p></div><label>Nhắc học<select defaultValue="19:00"><option>18:00</option><option>19:00</option><option>20:00</option></select></label><label>Ngôn ngữ<select defaultValue="Tiếng Việt"><option>Tiếng Việt</option><option>English</option></select></label><button className="text-action" type="button">Đổi mật khẩu</button></aside></section></AppShell>;
}
