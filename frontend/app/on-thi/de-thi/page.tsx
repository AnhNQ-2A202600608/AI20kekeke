import { ExamExperience } from "../../components/ExamExperience";
import { Suspense } from "react";

export default function ExamPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-muted">Đang tải đề thi...</div>}>
      <ExamExperience />
    </Suspense>
  );
}
