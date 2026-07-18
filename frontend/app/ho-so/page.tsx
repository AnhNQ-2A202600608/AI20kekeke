import Link from "next/link";
import { AppShell, LevelBadge, ProgressBar } from "../components/AppShell";
import { activeLearningLevel } from "../data";

const activity = [
  { title: "Quy đồng hai phân số", kind: "Bài học", when: "Hôm nay · 16:20", progress: 60, href: "/bai-hoc/phan-so" },
  { title: "Luyện tập có gợi ý", kind: "Luyện tập", when: "Hôm qua · 19:10", progress: 100, href: "/luyen-tap" },
  { title: "Khái niệm phân số", kind: "Dạng bài", when: "15 tháng 7", progress: 100, href: "/chuong/phan-so" },
];

const stats = [
  { label: "Độ thông hiểu", value: "78%", note: "+6% tuần này", tone: "strong" },
  { label: "Chuỗi học", value: "12", note: "ngày liên tiếp", tone: "good" },
  { label: "Cần ôn", value: "1", note: "kỹ năng vận dụng", tone: "review" },
];

export default function ProfilePage() {
  return (
    <AppShell>
      <section className="profile-studio">
        <div className="profile-hero-panel">
          <div className="profile-avatar-block">
            <span className="profile-avatar">HN</span>
            <div>
              <span className="overline">Hồ sơ học tập</span>
              <h1>Hoàng Nam</h1>
              <p>Lớp 7A · Toán học · đang học Chương 1</p>
            </div>
          </div>
          <div className="profile-level-card">
            <LevelBadge level={activeLearningLevel.key} />
            <strong>{activeLearningLevel.title}</strong>
            <span>{activeLearningLevel.description}</span>
            <ProgressBar value={activeLearningLevel.progress} />
            <small>{activeLearningLevel.xp.toLocaleString("vi-VN")} / {activeLearningLevel.nextXp.toLocaleString("vi-VN")} XP</small>
          </div>
        </div>

        <div className="profile-stat-grid">
          {stats.map((stat) => (
            <article className={`profile-stat ${stat.tone}`} key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small>{stat.note}</small>
            </article>
          ))}
        </div>

        <section className="profile-main-grid">
          <article className="profile-panel profile-identity">
            <div className="panel-heading">
              <div><h2>Thông tin cá nhân</h2><p>Các dữ liệu nền để cá nhân hóa lộ trình.</p></div>
              <Link className="secondary-action" href="/onboarding">Điều chỉnh</Link>
            </div>
            <dl className="profile-detail-list">
              <div><dt>Email</dt><dd>nam@school.edu.vn</dd></div>
              <div><dt>Lớp hiện tại</dt><dd>7A</dd></div>
              <div><dt>Level</dt><dd>Intermediate</dd></div>
              <div><dt>Nhịp học</dt><dd>30 phút mỗi ngày</dd></div>
            </dl>
          </article>

          <article className="profile-panel profile-activity">
            <div className="panel-heading"><div><h2>Hoạt động gần đây</h2><p>Tiếp tục đúng nơi bạn đang dở.</p></div></div>
            <div className="profile-timeline">
              {activity.map((item) => (
                <Link href={item.href} key={item.title}>
                  <span className="timeline-dot" />
                  <div>
                    <small>{item.kind} · {item.when}</small>
                    <strong>{item.title}</strong>
                    <ProgressBar value={item.progress} />
                  </div>
                  <b>{item.progress}%</b>
                </Link>
              ))}
            </div>
          </article>

          <aside className="profile-panel profile-settings">
            <div><h2>Cài đặt học tập</h2><p>Áp dụng cho nhắc học và gợi ý từ trợ giảng.</p></div>
            <label>Nhắc học<select defaultValue="19:00"><option>18:00</option><option>19:00</option><option>20:00</option></select></label>
            <label>Ngôn ngữ<select defaultValue="Tiếng Việt"><option>Tiếng Việt</option><option>English</option></select></label>
            <button className="text-action" type="button">Đổi mật khẩu</button>
          </aside>
        </section>
      </section>
    </AppShell>
  );
}
