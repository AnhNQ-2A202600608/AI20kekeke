import React from "react";
import {
  ChatCircleDots,
  BookOpenText,
  PlayCircle,
  FileText,
  Certificate,
  Lightning,
  Sparkle,
} from "@phosphor-icons/react";
import { Milestone, MilestoneTask } from "@/lib/learning-path-api";

interface TaskDetailPanelProps {
  milestone: Milestone | null;
  criticReasoning: string | null;
  onStartPractice?: (milestone: Milestone, task: MilestoneTask) => void;
}

export function TaskDetailPanel({ milestone, criticReasoning, onStartPractice }: TaskDetailPanelProps) {
  const getTaskIcon = (type: string) => {
    switch (type) {
      case "video":
        return <PlayCircle size={18} weight="fill" className="task-icon video" />;
      case "slide":
        return <FileText size={18} weight="fill" className="task-icon slide" />;
      case "theory":
        return <BookOpenText size={18} weight="fill" className="task-icon theory" />;
      default:
        return <Certificate size={18} weight="fill" className="task-icon practice" />;
    }
  };

  const getTaskLabel = (task: MilestoneTask) => {
    switch (task.type) {
      case "video":
        return "Xem Video bài giảng";
      case "slide":
        return "Đọc Slide khái niệm";
      case "theory":
        return "Học Lý thuyết trọng tâm";
      case "practice":
        return task.difficulty === "deep" ? "Luyện tập chuyên sâu (Deep)" : "Luyện tập nhanh (Quick)";
      default:
        return "Nhiệm vụ học tập";
    }
  };

  return (
    <aside className="skill-node-panel adaptive-detail-panel">
      {milestone ? (
        <>
          <div className="skill-node-panel-head">
            <span className="overline">Concept học tập thích ứng</span>
            <h1>{milestone.concept_name}</h1>
            <div className="milestone-status-badge-wrapper">
              <span className={`skill-state-pill ${milestone.status}`}>
                {milestone.status === "completed"
                  ? "Đã hoàn thành"
                  : milestone.status === "unlocked"
                    ? "Sẵn sàng học"
                    : "Đang khóa"}
              </span>
              {milestone.error_type && (
                <span className={`node-error-tag ${milestone.error_type}`}>
                  Lỗi: {milestone.error_type === "careless" ? "Bất cẩn" : "Hổng kiến thức"}
                </span>
              )}
            </div>
          </div>

          <div className="panel-section">
            <div className="section-title-sm">
              <ChatCircleDots size={16} weight="fill" />
              <span>Phân tích sư phạm của AI Critic</span>
            </div>
            <div className="ai-critique-box">
              <p>
                {criticReasoning ||
                  "Lộ trình được phê duyệt tự động dựa trên mức độ quan hệ tiên quyết giữa các khái niệm."}
              </p>
            </div>
          </div>

          <div className="panel-section tasks-section">
            <div className="section-title-sm">
              <Lightning size={16} weight="fill" />
              <span>Nhiệm vụ học tập dành riêng cho bạn</span>
            </div>
            <div className="tasks-list-vertical">
              {milestone.tasks.length > 0 ? (
                milestone.tasks.map((task, idx) => (
                  <div key={idx} className={`task-item-card ${milestone.status}`}>
                    <div className="task-item-left">
                      {getTaskIcon(task.type)}
                      <span>{getTaskLabel(task)}</span>
                    </div>
                    {milestone.status === "unlocked" && (
                      <button
                        onClick={() => onStartPractice?.(milestone, task)}
                        className="start-task-btn"
                        type="button"
                      >
                        Bắt đầu
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-muted text-sm">Không có nhiệm vụ nào được gán cho concept này.</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="panel-empty-state">
          <Sparkle size={32} weight="fill" className="empty-sparkle animate-pulse" />
          <h3>Chọn một Concept trên bản đồ</h3>
          <p>Click vào bất kỳ vòng tròn concept nào trên sơ đồ để xem chẩn đoán lỗi sai và nhiệm vụ học tập do AI đề xuất.</p>
        </div>
      )}
    </aside>
  );
}
