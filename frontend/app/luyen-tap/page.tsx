import { ExerciseExperience } from "../components/ExerciseExperience";
import { Suspense } from "react";

export default function PracticePage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-muted">Đang tải bài luyện tập...</div>}>
      <ExerciseExperience mode="practice" />
    </Suspense>
  );
}
