import { ArrowDown, BookOpenCheck, Brain, FileText, ShieldCheck } from 'lucide-react';

const learningSignals = [
  { label: 'Câu trả lời', value: 'Sai ở Docker network', tone: 'bg-error-red-light text-error-red-dark border-error-red/30' },
  { label: 'Gợi ý Sapia AI', value: 'Chỉ hỏi bước kế tiếp', tone: 'bg-primary-blue-light text-primary-blue-dark border-primary-blue-border' },
  { label: 'Nguồn chính thức', value: 'Slide 09, RAG pipeline', tone: 'bg-surface-container-low text-primary-green-dark border-primary-green/30' },
];

export function AdaptiveProofSimulator() {
  return (
    <section id="proof" className="bg-white py-8 md:py-10">
      <div className="mx-auto grid w-full max-w-[82rem] gap-4 px-3 md:px-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="text-xs font-black uppercase text-secondary-green">Một vòng học có thể kiểm chứng</p>
          <h2 className="mt-2 text-xl font-black leading-tight text-on-background md:text-2xl">
            Từ một câu quiz, Edugap tạo tín hiệu cho cả học viên lẫn giảng viên.
          </h2>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-stone-600 md:text-base md:leading-7">
            Hệ thống không chỉ chấm đúng sai. Mỗi câu trả lời, lượt gợi ý Socratic và nguồn RAG được nối thành bằng chứng học tập để đề xuất bước luyện tiếp theo.
          </p>
        </div>

        <div className="rounded-2xl border-2 border-gray-border border-b-[5px] bg-background p-3 shadow-sm md:p-4">
          <div className="rounded-2xl border-2 border-gray-border bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-primary-green/30 bg-primary-green-light text-primary-green-dark">
                <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase text-stone-500">Adaptive quiz</p>
                <h3 className="text-lg font-black text-on-background">Docker Compose ở vùng ZPD</h3>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border-2 border-gray-border bg-warm-cream p-3">
              <p className="text-sm font-extrabold leading-6 text-stone-700">
                Khi hai service cần gọi nhau trong Compose, học viên nên dùng gì để chúng cùng nhìn thấy tên service?
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {['Port mapping', 'Shared network', 'Volume mount', 'Image tag'].map((answer, index) => (
                  <div
                    key={answer}
                    className={`rounded-xl border-2 px-3 py-2 text-sm font-extrabold ${index === 1 ? 'border-primary-green bg-primary-green-light text-primary-green-dark' : 'border-gray-border bg-white text-stone-500'}`}
                  >
                    {answer}
                  </div>
                ))}
              </div>
            </div>

            <ArrowDown className="mx-auto my-3 h-5 w-5 text-stone-400" aria-hidden="true" />

            <div className="grid gap-3">
              {learningSignals.map((signal) => (
                <div key={signal.label} className={`rounded-2xl border-2 px-3 py-2.5 ${signal.tone}`}>
                  <p className="text-[11px] font-black uppercase">{signal.label}</p>
                  <p className="mt-1 text-sm font-extrabold">{signal.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Brain, label: 'Mastery', value: '+38 Elo' },
                { icon: FileText, label: 'Citation', value: 'Slide 09' },
                { icon: ShieldCheck, label: 'Guardrail', value: 'Hint only' },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border-2 border-gray-border bg-white p-3 text-center">
                  <item.icon className="mx-auto h-5 w-5 text-primary-green" aria-hidden="true" />
                  <p className="mt-2 text-[11px] font-black uppercase text-stone-400">{item.label}</p>
                  <p className="text-sm font-black text-on-background">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

