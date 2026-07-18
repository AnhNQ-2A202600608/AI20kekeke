"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, BookOpenText, CheckCircle, Gauge, Sparkle, Target } from "@phosphor-icons/react";
import { saveSubjectProfile } from "../hooks/useOnboardingProfile";

type Level = "beginner" | "intermediate" | "advanced" | "master";
type SubjectCode = "TO" | "NV" | "TA" | "KH";

const subjectOptions: Array<{ code: SubjectCode; name: string; detail: string }> = [
  { code: "TO", name: "Toán học", detail: "Phân số, đại số, hình học và xác suất." },
  { code: "NV", name: "Ngữ văn", detail: "Đọc hiểu, viết đoạn, tiếng Việt thực hành." },
  { code: "TA", name: "Tiếng Anh", detail: "Từ vựng, ngữ pháp, đọc hiểu và giao tiếp." },
  { code: "KH", name: "Khoa học", detail: "Lực, năng lượng, hệ sinh thái và thí nghiệm." },
];

const levelOptions: Array<{ id: Level; label: string; detail: string }> = [
  { id: "beginner", label: "Beginner", detail: "Cần ôn lại nền tảng và học theo từng bước nhỏ." },
  { id: "intermediate", label: "Intermediate", detail: "Đã nắm kiến thức chính, cần luyện để chắc hơn." },
  { id: "advanced", label: "Advanced", detail: "Làm được đa số bài, muốn tăng tốc và giảm lỗi." },
  { id: "master", label: "Master", detail: "Muốn thử thách khó và bài vận dụng tổng hợp." },
];

const placementQuestions = [
  {
    title: "Khi gặp một khái niệm mới trong môn học, cách học nào giúp hệ thống đánh giá đúng trình độ nhất?",
    options: ["Chỉ xem đáp án", "Làm bài theo từng bước và lưu lỗi sai", "Bỏ qua phần chưa hiểu", "Chọn ngẫu nhiên cho nhanh"],
    answer: 1,
  },
  {
    title: "Nếu một bài có nhiều lỗi sai giống nhau, OrbitLearn nên ưu tiên gì?",
    options: ["Bỏ qua lỗi đó", "Tăng độ khó ngay", "Gợi ý ôn kỹ năng liên quan", "Chỉ hiển thị điểm số"],
    answer: 2,
  },
  {
    title: "Skill graph dùng để làm gì trong profile môn học?",
    options: ["Trang trí dashboard", "Hiển thị kỹ năng đã, đang và chưa mở", "Thay thế toàn bộ bài học", "Chỉ dành cho giảng viên"],
    answer: 1,
  },
];

function getStepTitle(step: number, subjectName: string) {
  if (step === 0) return "Bạn muốn tạo profile cho môn nào?";
  if (step === 1) return "Chọn lớp cho profile môn học.";
  if (step === 2) return `Bạn đang ở level nào trong ${subjectName}?`;
  if (step === 3) return "Chuẩn bị làm bài test xếp level.";
  return "Profile môn học đã sẵn sàng.";
}

function getStepCopy(step: number, subjectName: string) {
  if (step === 0) return "Mỗi môn có level, skill graph và lộ trình riêng. Chọn môn trước để OrbitLearn tạo đúng profile học tập.";
  if (step === 1) return "Lớp giúp hệ thống chọn chương trình học phù hợp trước khi xếp level chi tiết.";
  if (step === 2) return "Đây là level tự đánh giá. Bài test ngắn ở bước sau sẽ dùng để xếp lại chính xác hơn.";
  if (step === 3) return `Bài test sẽ tạo profile ${subjectName} riêng. Khi hoàn thành, level của môn này sẽ được dùng khi vào workspace học tập.`;
  return `Bạn có thể vào lộ trình ${subjectName}, hoặc tạo thêm profile cho môn khác từ nút thêm môn ở sidebar.`;
}

export default function OnboardingPage() {
  const searchParams = useSearchParams();
  const initialSubject = subjectOptions.some((subject) => subject.code === searchParams.get("subject"))
    ? searchParams.get("subject") as SubjectCode
    : "TO";
  const [step, setStep] = useState(0);
  const [subjectCode, setSubjectCode] = useState<SubjectCode>(initialSubject);
  const [grade, setGrade] = useState("7");
  const [level, setLevel] = useState<Level>("intermediate");
  const [answers, setAnswers] = useState<number[]>([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  const selectedSubject = subjectOptions.find((subject) => subject.code === subjectCode) || subjectOptions[0];
  const score = answers.reduce((total, answer, index) => total + (answer === placementQuestions[index].answer ? 1 : 0), 0);
  const placedLevel = useMemo<Level>(() => {
    if (score <= 1) return "beginner";
    if (score === 2) return "intermediate";
    return level === "master" ? "advanced" : "advanced";
  }, [level, score]);

  const progress = Math.round(((step + 1) / 6) * 100);
  const activeQuestion = placementQuestions[activeQuestionIndex];
  const currentQuestionAnswered = answers[activeQuestionIndex] !== undefined;

  const chooseAnswer = (questionIndex: number, optionIndex: number) => {
    setAnswers((current) => {
      const next = [...current];
      next[questionIndex] = optionIndex;
      return next;
    });
  };

  const startPlacementTest = () => {
    setAnswers([]);
    setActiveQuestionIndex(0);
    setStep(4);
  };

  const goToNextQuestion = () => {
    if (activeQuestionIndex < placementQuestions.length - 1) {
      setActiveQuestionIndex((current) => current + 1);
      return;
    }

    setStep(5);
  };

  useEffect(() => {
    if (step !== 5) return;

    const nextProfile = {
      subjectCode,
      grade,
      level: placedLevel,
      levelNumber: 0,
      xp: 0,
      nextXp: placedLevel === "master" ? 6000 : placedLevel === "advanced" ? 4200 : placedLevel === "intermediate" ? 2400 : 900,
      progress: 0,
      selfRatedLevel: level,
      score,
      total: placementQuestions.length,
    };
    saveSubjectProfile(subjectCode, nextProfile);
  }, [grade, level, placedLevel, score, step, subjectCode]);

  return (
    <main className="new-onboarding">
      <section className="onboarding-shell">
        {step !== 4 && (
          <header className="onboarding-header">
            <Link className="brand" href="/auth">
              <span className="brand-symbol">OL</span>
              <span>OrbitLearn</span>
            </Link>
            <div className="onboarding-progress">
              <span>{progress}% thiết lập</span>
              <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
            </div>
          </header>
        )}

        <section className={`onboarding-stage ${step === 4 ? "test-only" : ""}`}>
          {step !== 4 && (
            <aside className="onboarding-copy">
              <span className="overline">Thiết lập profile môn học</span>
              <h1>{getStepTitle(step, selectedSubject.name)}</h1>
              <p>{getStepCopy(step, selectedSubject.name)}</p>
              <div className="onboarding-flow">
                <span className={step >= 0 ? "active" : ""}><BookOpenText size={16} weight="fill" /> Chọn môn</span>
                <span className={step >= 1 ? "active" : ""}><BookOpenText size={16} weight="fill" /> Chọn lớp</span>
                <span className={step >= 2 ? "active" : ""}><Gauge size={16} weight="fill" /> Set level</span>
                <span className={step >= 3 ? "active" : ""}><Target size={16} weight="fill" /> Test xếp level</span>
                <span className={step >= 5 ? "active" : ""}><Sparkle size={16} weight="fill" /> Mở lộ trình</span>
              </div>
            </aside>
          )}

          <div className="onboarding-panel">
            {step === 0 && (
              <div className="onboarding-options subject-options">
                {subjectOptions.map((subject) => (
                  <button className={subjectCode === subject.code ? "active" : ""} key={subject.code} onClick={() => setSubjectCode(subject.code)} type="button">
                    <strong>{subject.name}</strong>
                    <span>{subject.detail}</span>
                  </button>
                ))}
              </div>
            )}

            {step === 1 && (
              <div className="onboarding-options grade-options">
                {["6", "7", "8", "9"].map((item) => (
                  <button className={grade === item ? "active" : ""} key={item} onClick={() => setGrade(item)} type="button">
                    <strong>Lớp {item}</strong>
                    <span>Chương trình học cơ sở</span>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="onboarding-options">
                {levelOptions.map((item) => (
                  <button className={level === item.id ? "active" : ""} key={item.id} onClick={() => setLevel(item.id)} type="button">
                    <strong>{item.label}</strong>
                    <span>{item.detail}</span>
                  </button>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="placement-start-card">
                <span className="overline">Bài test xếp level · {selectedSubject.name}</span>
                <h2>Sẵn sàng kiểm tra nhanh trình độ của bạn?</h2>
                <p>Bài test gồm {placementQuestions.length} câu. Màn làm bài chỉ hiển thị số câu, câu hỏi và đáp án để bạn tập trung. Sau khi bấm hoàn thành, OrbitLearn sẽ chấm điểm và tạo profile riêng cho {selectedSubject.name}.</p>
                <div className="placement-start-meta">
                  <span>{selectedSubject.name}</span>
                  <span>Lớp {grade}</span>
                  <span>Level tự đánh giá: {levelOptions.find((item) => item.id === level)?.label}</span>
                  <span>{placementQuestions.length} câu</span>
                </div>
                <button onClick={startPlacementTest} type="button">
                  Bắt đầu làm bài <ArrowRight size={16} />
                </button>
              </div>
            )}

            {step === 4 && (
              <div className="placement-exam">
                <section className="placement-question-card">
                  <span className="placement-question-count">Câu {activeQuestionIndex + 1}/{placementQuestions.length}</span>
                  <h2>{activeQuestion.title}</h2>
                  <div className="placement-answer-grid">
                    {activeQuestion.options.map((option, optionIndex) => (
                      <button
                        className={answers[activeQuestionIndex] === optionIndex ? "active" : ""}
                        key={option}
                        onClick={() => chooseAnswer(activeQuestionIndex, optionIndex)}
                        type="button"
                      >
                        <span>{String.fromCharCode(65 + optionIndex)}</span>
                        <strong>{option}</strong>
                      </button>
                    ))}
                  </div>
                </section>

                <footer className="placement-exam-controls">
                  <button disabled={!currentQuestionAnswered} onClick={goToNextQuestion} type="button">
                    {activeQuestionIndex < placementQuestions.length - 1 ? "Tiếp theo" : "Hoàn thành"}
                  </button>
                </footer>
              </div>
            )}

            {step === 5 && (
              <div className="onboarding-result">
                <CheckCircle size={44} weight="fill" />
                <span>Profile {selectedSubject.name}</span>
                <h2>{levelOptions.find((item) => item.id === placedLevel)?.label}</h2>
                <p>Lớp {grade} · đúng {score}/{placementQuestions.length} câu. Level này sẽ được dùng khi bạn vào workspace {selectedSubject.name}.</p>
              </div>
            )}

            {step !== 4 && (
              <footer className="onboarding-actions">
                <button disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))} type="button">Quay lại</button>
                {step < 3 ? (
                  <button onClick={() => setStep((current) => current + 1)} type="button">
                    Tiếp tục <ArrowRight size={16} />
                  </button>
                ) : step === 3 ? (
                  <span className="onboarding-action-note">Bấm “Bắt đầu làm bài” để vào màn kiểm tra.</span>
                ) : (
                  <Link className="primary-action" href={`/hoc-tap?subject=${subjectCode}`}>Vào lộ trình <span>→</span></Link>
                )}
              </footer>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
