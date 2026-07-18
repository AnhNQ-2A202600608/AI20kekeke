from __future__ import annotations

import datetime
import subprocess
import uuid
from pathlib import Path

from pydantic import BaseModel, Field


def get_git_commit_sha() -> str:
    try:
        # Run git command to get short SHA
        return subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], stderr=subprocess.DEVNULL).decode("ascii").strip()
    except Exception:
        return "1.0.0"

class RunContext(BaseModel):
    run_id: str = Field(description="Mã chạy pipeline duy nhất, vd: math-6-20260718-123456")
    extraction_run_id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="UUID lưu DB app.extraction_runs")
    course_code: str = Field(description="Mã khóa học mới (math-k6 hoặc hist-geo-k6)")
    subject: str = Field(description="Tên subject (math hoặc history_geo)")
    grade: int = Field(description="Lớp học, vd: 6")
    graph_version: str = Field(description="Version đồ thị")
    prompt_version: str = Field(description="Version prompt")
    pipeline_version: str = Field(default_factory=get_git_commit_sha, description="Version pipeline")
    started_at: str = Field(default_factory=lambda: datetime.datetime.now(datetime.UTC).isoformat(), description="Thời điểm bắt đầu chạy")
    output_directory: str = Field(description="Thư mục ghi kết quả chạy cục bộ của run này")

    @classmethod
    def create(cls, subject: str, grade: int, course_code: str) -> RunContext:
        now_str = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
        run_id = f"{subject}-k{grade}-{now_str}"

        project_root = Path(__file__).resolve().parents[3]
        out_dir = project_root / "outputs" / "kg_runs" / run_id
        out_dir.mkdir(parents=True, exist_ok=True)

        graph_version = f"{course_code}-{now_str}-v1"
        prompt_version = f"{subject}-k{grade}-v1"

        return cls(
            run_id=run_id,
            course_code=course_code,
            subject=subject,
            grade=grade,
            graph_version=graph_version,
            prompt_version=prompt_version,
            output_directory=str(out_dir)
        )
