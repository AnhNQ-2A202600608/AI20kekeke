import { ExerciseExperience } from "../components/ExerciseExperience";
import { Suspense } from "react";

export default function TestPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-muted">Đang tải bài kiểm tra...</div>}>
      <ExerciseExperience mode="test" />
    </Suspense>
  );
}
