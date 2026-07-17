import { AlertTriangle, BarChart3, CheckCircle2, UsersRound } from 'lucide-react';

const weakConcepts = [
  { name: 'Docker network', score: 42, color: 'bg-error-red' },
  { name: 'RAG retrieval', score: 58, color: 'bg-accent-orange' },
  { name: 'Prompt guardrail', score: 74, color: 'bg-primary-green' },
];

const riskStudents = [
  { name: 'Nhóm cần can thiệp', count: '8 học viên', note: 'Sai liên tiếp sau 2 lượt gợi ý' },
  { name: 'Nhóm cần luyện thêm', count: '17 học viên', note: 'Mastery dưới vùng mục tiêu' },
];

export function TeacherReportPreview() {
  return (
    <section className="bg-surface-container-low py-8 md:py-10">
      <div className="mx-auto w-full max-w-[82rem] px-3 md:px-4">
        <div className="max-w-2xl">
          <p className="text-xs font-black uppercase text-primary-green">Teacher loop</p>
          <h2 className="mt-2 text-xl font-black leading-tight text-on-background md:text-2xl">
            Báo cáo giúp giảng viên nhìn thấy lỗ hổng trước khi điểm số quá muộn.
          </h2>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-2xl border-2 border-gray-border border-b-[5px] bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-blue-light text-primary-blue-dark">
                <BarChart3 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase text-stone-500">Class mastery snapshot</p>
                <h3 className="text-lg font-black text-on-background">Điểm yếu theo concept</h3>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {weakConcepts.map((concept) => (
                <div key={concept.name}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-on-background">{concept.name}</p>
                    <p className="text-sm font-black text-stone-500">{concept.score}%</p>
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-border">
                    <div className={`h-full rounded-full ${concept.color}`} style={{ width: `${concept.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl border-2 border-gray-border border-b-[5px] bg-white p-4">
              <div className="flex items-center gap-3">
                <UsersRound className="h-5 w-5 text-accent-orange" aria-hidden="true" />
                <h3 className="text-lg font-black text-on-background">Danh sách ưu tiên</h3>
              </div>
              <div className="mt-3 space-y-3">
                {riskStudents.map((item) => (
                  <div key={item.name} className="rounded-2xl border-2 border-gray-border bg-warm-cream p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-black text-on-background">{item.name}</p>
                      <p className="shrink-0 text-sm font-black text-accent-orange-dark">{item.count}</p>
                    </div>
                    <p className="mt-1 text-sm font-bold leading-6 text-stone-600">{item.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border-2 border-primary-green/25 border-b-[5px] bg-primary-green-light p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary-green-dark" aria-hidden="true" />
                <h3 className="text-lg font-black text-primary-green-dark">Có dấu vết kiểm chứng</h3>
              </div>
              <p className="mt-2 text-sm font-extrabold leading-6 text-primary-green-dark">
                Mỗi nhận định có thể truy lại quiz, lượt gợi ý, nguồn trích dẫn và phản hồi học viên. AI hỗ trợ quyết định, không thay giảng viên ra kết luận.
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border-2 border-accent-orange/20 bg-white p-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-accent-orange" aria-hidden="true" />
              <p className="text-sm font-bold leading-6 text-stone-600">
                Landing này minh họa luồng dữ liệu sản phẩm, không tuyên bố số liệu triển khai thật hay tích hợp LMS ngoài phạm vi hiện tại.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

