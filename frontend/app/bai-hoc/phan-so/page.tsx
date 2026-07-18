"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AppShell, ProgressBar } from "../../components/AppShell";
import { chapterLessonPreviews } from "../../data";
import { useLessonProgress } from "../../hooks/useLessonProgress";

type TheoryPage = {
  eyebrow: string;
  headline: string;
  lead: string;
  example: string;
  exampleNote: string;
  steps: Array<{ title: string; copy: string }>;
  remember: string;
};

type LessonContent = {
  id: string;
  chapterNumber: string;
  chapterTitle: string;
  order: number;
  title: string;
  duration: string;
  xp: string;
  theoryPages: TheoryPage[];
};

const lessonCatalog: Record<string, LessonContent> = {
  "fraction-concept": {
    id: "fraction-concept", chapterNumber: "01", chapterTitle: "Phân số và số hữu tỉ", order: 1, title: "Khái niệm phân số", duration: "8 phút", xp: "+40 XP",
    theoryPages: [
      {
        eyebrow: "Lý thuyết 1 · Nền tảng", headline: "Phân số biểu thị một hay nhiều phần bằng nhau của một đơn vị.",
        lead: "Muốn đọc đúng một phân số, trước hết hãy hình dung đơn vị đã được chia đều thành bao nhiêu phần.", example: "3 / 4", exampleNote: "Ba phần trong bốn phần bằng nhau.",
        steps: [{ title: "Mẫu số", copy: "Số ở dưới cho biết đơn vị được chia thành bao nhiêu phần bằng nhau." }, { title: "Tử số", copy: "Số ở trên cho biết ta lấy bao nhiêu phần trong các phần đó." }],
        remember: "Mẫu số luôn khác 0 vì không thể chia đơn vị thành 0 phần.",
      },
      {
        eyebrow: "Lý thuyết 2 · Nhận biết", headline: "Cùng một lượng có thể được biểu diễn bằng nhiều phân số bằng nhau.",
        lead: "Khi nhân hoặc chia cả tử số và mẫu số cho cùng một số khác 0, giá trị của phân số không thay đổi.", example: "1 / 2 = 2 / 4", exampleNote: "Cả hai đều biểu thị một nửa đơn vị.",
        steps: [{ title: "Quan sát hình", copy: "Hai cách chia khác nhau vẫn có thể tô cùng một phần diện tích." }, { title: "Kiểm tra", copy: "So sánh bằng hình vẽ hoặc nhân chéo để nhận ra các phân số bằng nhau." }],
        remember: "Đừng chỉ nhìn tử số hoặc mẫu số riêng lẻ; hãy xét cả phân số.",
      },
    ],
  },
  "fraction-common-denominator": {
    id: "fraction-common-denominator", chapterNumber: "01", chapterTitle: "Phân số và số hữu tỉ", order: 2, title: "Quy đồng mẫu số", duration: "9 phút", xp: "+60 XP",
    theoryPages: [
      {
        eyebrow: "Lý thuyết 1 · Chuẩn bị", headline: "Quy đồng đưa các phân số về cùng một đơn vị để dễ so sánh và tính toán.",
        lead: "Khi mẫu số khác nhau, hãy tìm một mẫu số chung trước khi cộng, trừ hoặc so sánh.", example: "2 / 3 và 1 / 4", exampleNote: "Mẫu số chung nhỏ nhất là 12.",
        steps: [{ title: "Tìm bội chung", copy: "Liệt kê hoặc dùng bội chung nhỏ nhất của các mẫu số." }, { title: "Chọn mẫu chung", copy: "Chọn mẫu số chung nhỏ nhất để phép tính gọn hơn." }],
        remember: "Không cộng trực tiếp hai mẫu số với nhau.",
      },
      {
        eyebrow: "Lý thuyết 2 · Thực hiện", headline: "Nhân cả tử và mẫu với cùng một số để tạo ra mẫu số chung.",
        lead: "Với 2/3 và 1/4, ta đổi thành 8/12 và 3/12 trước khi thực hiện phép tính.", example: "2 / 3 = 8 / 12", exampleNote: "Nhân cả tử và mẫu với 4.",
        steps: [{ title: "Đổi từng phân số", copy: "Giữ nguyên giá trị bằng cách nhân cả tử và mẫu." }, { title: "Đối chiếu mẫu", copy: "Chỉ tiếp tục khi các mẫu số đã giống nhau." }],
        remember: "Sau khi quy đồng, hãy rút gọn kết quả nếu có thể.",
      },
    ],
  },
  "fraction-add-subtract": {
    id: "fraction-add-subtract", chapterNumber: "01", chapterTitle: "Phân số và số hữu tỉ", order: 3, title: "Cộng trừ phân số", duration: "10 phút", xp: "+70 XP",
    theoryPages: [
      {
        eyebrow: "Lý thuyết 1 · Cùng mẫu", headline: "Với phân số cùng mẫu, chỉ cộng hoặc trừ các tử số.",
        lead: "Mẫu số đại diện cho kích thước của từng phần, nên nó được giữ nguyên khi các phần đã cùng loại.", example: "3 / 8 + 2 / 8 = 5 / 8", exampleNote: "Năm phần tám.",
        steps: [{ title: "Giữ mẫu số", copy: "Mẫu số không đổi trong phép cộng trừ phân số cùng mẫu." }, { title: "Tính tử số", copy: "Cộng hoặc trừ các tử số như số tự nhiên." }],
        remember: "Luôn kiểm tra xem hai mẫu số đã giống nhau chưa.",
      },
      {
        eyebrow: "Lý thuyết 2 · Khác mẫu", headline: "Với phân số khác mẫu, quy đồng trước rồi mới cộng hoặc trừ.",
        lead: "Bước quy đồng giúp mọi phần có cùng kích thước, từ đó phép tính trở nên chính xác.", example: "1 / 2 + 1 / 3 = 5 / 6", exampleNote: "Đổi thành 3/6 và 2/6 trước khi cộng.",
        steps: [{ title: "Quy đồng", copy: "Đưa hai phân số về cùng mẫu số." }, { title: "Tính và rút gọn", copy: "Thực hiện phép tính ở tử số, sau đó rút gọn nếu cần." }],
        remember: "Sai lầm phổ biến là cộng cả tử lẫn mẫu số.",
      },
    ],
  },
  "fraction-multiply-apply": {
    id: "fraction-multiply-apply", chapterNumber: "01", chapterTitle: "Phân số và số hữu tỉ", order: 4, title: "Nhân chia và vận dụng", duration: "12 phút", xp: "+90 XP",
    theoryPages: [
      {
        eyebrow: "Lý thuyết 1 · Phép nhân", headline: "Nhân hai phân số bằng cách nhân tử với tử và mẫu với mẫu.",
        lead: "Bạn có thể rút gọn chéo trước khi nhân để phép tính nhanh và kết quả gọn hơn.", example: "2 / 3 × 3 / 5 = 2 / 5", exampleNote: "Rút gọn 3 ở tử và mẫu trước khi nhân.",
        steps: [{ title: "Nhân tử số", copy: "Nhân các tử số với nhau." }, { title: "Nhân mẫu số", copy: "Nhân các mẫu số với nhau rồi rút gọn." }],
        remember: "Rút gọn trước khi nhân giúp hạn chế sai số khi tính.",
      },
      {
        eyebrow: "Lý thuyết 2 · Vận dụng", headline: "Chia phân số là nhân với phân số nghịch đảo của số chia.",
        lead: "Khi gặp bài toán thực tế, hãy xác định rõ đại lượng nào là toàn bộ và phần nào đang được lấy.", example: "3 / 4 ÷ 2 / 5 = 15 / 8", exampleNote: "Đổi phép chia thành nhân với 5/2.",
        steps: [{ title: "Đảo số chia", copy: "Đổi phân số đứng sau dấu chia thành phân số nghịch đảo." }, { title: "Diễn giải kết quả", copy: "Kiểm tra kết quả có phù hợp ngữ cảnh bài toán không." }],
        remember: "Không đảo phân số đứng trước dấu chia.",
      },
    ],
  },
  "ratio-concept": {
    id: "ratio-concept", chapterNumber: "02", chapterTitle: "Tỉ lệ thức", order: 1, title: "Khái niệm tỉ lệ thức", duration: "8 phút", xp: "+45 XP",
    theoryPages: [
      {
        eyebrow: "Lý thuyết 1 · Nền tảng", headline: "Tỉ lệ thức khẳng định hai tỉ số bằng nhau.",
        lead: "Một tỉ lệ thức thường được viết dưới dạng a/b = c/d, trong đó b và d khác 0.", example: "2 / 3 = 4 / 6", exampleNote: "Hai tỉ số cùng biểu thị một giá trị.",
        steps: [{ title: "Nhận diện", copy: "Nhìn hai tỉ số được nối bởi dấu bằng." }, { title: "Đọc đúng", copy: "Đọc lần lượt số hạng ngoài và số hạng trong." }],
        remember: "Tỉ số chỉ có nghĩa khi số đứng sau khác 0.",
      },
      {
        eyebrow: "Lý thuyết 2 · Kiểm tra", headline: "Có thể kiểm tra tỉ lệ thức bằng tích chéo.",
        lead: "Nếu a/b = c/d thì a × d bằng b × c.", example: "2 × 6 = 3 × 4", exampleNote: "Cả hai tích đều bằng 12.",
        steps: [{ title: "Nhân chéo", copy: "Nhân số hạng ngoài với nhau và số hạng trong với nhau." }, { title: "So sánh", copy: "Hai tích bằng nhau thì tỉ lệ thức đúng." }],
        remember: "Tích chéo là cách kiểm tra nhanh, không thay thế việc hiểu tỉ số.",
      },
    ],
  },
  "ratio-property": {
    id: "ratio-property", chapterNumber: "02", chapterTitle: "Tỉ lệ thức", order: 2, title: "Tính chất tỉ lệ thức", duration: "9 phút", xp: "+55 XP",
    theoryPages: [
      {
        eyebrow: "Lý thuyết 1 · Tính chất", headline: "Từ một tỉ lệ thức, ta có thể suy ra các tỉ lệ thức tương đương.",
        lead: "Việc đổi chỗ các số hạng cần tuân theo quy tắc để vẫn giữ đúng quan hệ tỉ số.", example: "a / b = c / d", exampleNote: "Suy ra a/c = b/d khi các mẫu số hợp lệ.",
        steps: [{ title: "Giữ tích chéo", copy: "Mọi biến đổi đúng đều bảo toàn quan hệ tích chéo." }, { title: "Đổi chỗ có kiểm soát", copy: "Chỉ biến đổi theo các tính chất đã học." }],
        remember: "Đừng đổi chỗ tùy ý các số hạng trong tỉ lệ thức.",
      },
      {
        eyebrow: "Lý thuyết 2 · Ứng dụng", headline: "Tỉ lệ thức giúp tìm số chưa biết trong các bài toán thực tế.",
        lead: "Viết đúng tỉ lệ trước, sau đó dùng tích chéo để giải ẩn.", example: "x / 5 = 6 / 15", exampleNote: "x = 2 sau khi nhân chéo.",
        steps: [{ title: "Lập tỉ lệ", copy: "Đặt các đại lượng cùng đơn vị vào vị trí tương ứng." }, { title: "Giải ẩn", copy: "Dùng tích chéo và kiểm tra lại kết quả." }],
        remember: "Đơn vị đo phải nhất quán trước khi lập tỉ lệ.",
      },
    ],
  },
};

export default function LessonPage() {
  const searchParams = useSearchParams();
  const subjectCode = searchParams.get("subject") || "TO";
  const requestedChapter = searchParams.get("chapter") || "01";
  const requestedLessonId = searchParams.get("lesson") || "fraction-concept";
  const chapterLessons = chapterLessonPreviews[requestedChapter] || chapterLessonPreviews["01"];
  const lessonIds = chapterLessons.map((lesson) => lesson.id);
  const progress = useLessonProgress(subjectCode, requestedChapter, lessonIds);
  const availableLessonId = progress.isLessonAvailable(requestedLessonId)
    ? requestedLessonId
    : lessonIds[progress.nextLessonIndex];
  const lesson = lessonCatalog[availableLessonId] || lessonCatalog["fraction-concept"];
  const [theoryPageIndex, setTheoryPageIndex] = useState(0);
  const theoryPage = lesson.theoryPages[theoryPageIndex];
  const isLastTheoryPage = theoryPageIndex === lesson.theoryPages.length - 1;
  const wasRedirectedToAvailableLesson = requestedLessonId !== availableLessonId;

  return (
    <AppShell compact>
      <div className="lesson-page lesson-flow-page">
        <aside className="lesson-outline">
          <div>
            <span className="overline">Chương {Number(lesson.chapterNumber)} · Bài học {lesson.order}</span>
            <h2>{lesson.title}</h2>
          </div>
          <div className="lesson-progress">
            <div><span>Tiến độ bài học</span><strong>{Math.round(((theoryPageIndex + 1) / (lesson.theoryPages.length + 1)) * 100)}%</strong></div>
            <ProgressBar value={Math.round(((theoryPageIndex + 1) / (lesson.theoryPages.length + 1)) * 100)} />
          </div>
          <div className="lesson-outline-steps" aria-label="Các bước của bài học">
            <div className="lesson-outline-step active"><span>1</span>Lý thuyết</div>
            <div className="lesson-outline-step"><span>2</span>Bài tập</div>
          </div>
          <div className="lesson-meta"><span>Thời lượng</span><strong>{lesson.duration}</strong><span>Phần thưởng</span><strong>{lesson.xp}</strong></div>
        </aside>

        <article className="lesson-content">
          {wasRedirectedToAvailableLesson && <p className="lesson-lock-notice">Hãy hoàn thành bài đang mở trước khi chuyển sang bài tiếp theo.</p>}
          <div className="lesson-content-head">
            <div>
              <span className="overline">{theoryPage.eyebrow}</span>
              <h1>{theoryPage.headline}</h1>
            </div>
            <span className="page-count">{String(theoryPageIndex + 1).padStart(2, "0")} / {String(lesson.theoryPages.length).padStart(2, "0")}</span>
          </div>
          <p className="lesson-lead">{theoryPage.lead}</p>
          <div className="lesson-concept-stage"><span>Ví dụ</span><strong>{theoryPage.example}</strong><p>{theoryPage.exampleNote}</p></div>
          <div className="explanation-grid">
            {theoryPage.steps.map((step, index) => (
              <section key={step.title}><span className="step-number">{String(index + 1).padStart(2, "0")}</span><h3>{step.title}</h3><p>{step.copy}</p></section>
            ))}
          </div>
          <aside className="remember-note"><strong>Điểm cần nhớ</strong><p>{theoryPage.remember}</p></aside>
          <div className="lesson-actions lesson-next-only">
            {isLastTheoryPage ? (
              <Link className="primary-action" href={`/luyen-tap?subject=${subjectCode}&chapter=${lesson.chapterNumber}&lesson=${lesson.id}`}>Làm bài tập <span>→</span></Link>
            ) : (
              <button className="primary-action button-reset" onClick={() => setTheoryPageIndex((index) => Math.min(lesson.theoryPages.length - 1, index + 1))} type="button">Tiếp theo <span>→</span></button>
            )}
          </div>
        </article>
      </div>
    </AppShell>
  );
}