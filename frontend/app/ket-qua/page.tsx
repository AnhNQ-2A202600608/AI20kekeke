import Link from "next/link";
import { AppShell, ProgressBar } from "../components/AppShell";

export default function ResultPage() {
  return (
    <AppShell compact>
      <div className="result-page">
        <section className="result-hero">
          <div className="result-score"><span>86</span><small>/ 100 điểm</small></div>
          <div><span className="overline">Đã vượt qua bài kiểm tra</span><h1>Bạn đã mở khóa dạng “Tỉ lệ thức”.</h1><p>Kết quả cho thấy bạn đã nắm chắc kiến thức nền ở mức Explorer.</p></div>
        </section>
        <section className="result-summary">
          <div><span>Đúng</span><strong>13 / 15 câu</strong></div><div><span>Độ chính xác</span><strong>86%</strong></div><div><span>Kinh nghiệm</span><strong>+280 XP</strong></div><div><span>Thời gian</span><strong>11 phút 24 giây</strong></div>
        </section>
        <section className="result-detail">
          <div className="mastery-review"><div className="section-title"><div><h2>Mức độ thông hiểu</h2><p>Phân tích theo từng kỹ năng trong dạng bài.</p></div></div>{[["Nhận biết phân số tương đương",94],["Quy đồng mẫu số",88],["Cộng và trừ phân số",82],["Bài toán thực tế",68]].map(([label,value]) => <div className="mastery-row" key={String(label)}><span>{label}</span><ProgressBar value={Number(value)}/><strong>{value}%</strong></div>)}</div>
          <aside className="unlock-panel"><span className="unlock-mark">MỞ</span><h2>Dạng tiếp theo đã sẵn sàng</h2><p>Bạn có thể học Tỉ lệ thức ở mức Explorer hoặc quay lại học Phân số ở mức Challenger.</p><label>Chọn mức độ<select defaultValue="Explorer"><option>Explorer</option><option>Challenger</option></select></label><Link className="primary-action" href="/hoc-tap">Xem lộ trình mới<span>→</span></Link></aside>
        </section>
        <div className="result-footer"><Link href="/luyen-tap">Xem lại câu sai</Link><Link href="/dashboard">Mở dashboard</Link></div>
      </div>
    </AppShell>
  );
}
