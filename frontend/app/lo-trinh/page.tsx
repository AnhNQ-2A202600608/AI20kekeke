"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AppShell } from "../components/AppShell";
import { useBoundStore } from "../hooks/useBoundStore";
import { subjects } from "../data";
import {
  getLearningPathHistory,
  getLearningPathDetail,
  LearningPathHistoryItem,
  Milestone,
  MilestoneTask,
} from "@/lib/learning-path-api";
import { HistorySelector } from "@/components/adaptive-path/history-selector";
import { TaskDetailPanel } from "@/components/adaptive-path/task-detail-panel";
import { AdaptivePathGraph } from "@/components/adaptive-path/adaptive-path-graph";
import { ReactFlowProvider } from "@xyflow/react";
import { ArrowLeft, Sparkle } from "@phosphor-icons/react";
import Link from "next/link";

function AdaptiveRoadmapContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const store = useBoundStore();
  
  const studentId = store.userId || "00000000-0000-0000-0000-000000000000";
  const selectedSubjectCode = searchParams.get("subject") || "TO";
  const currentSubject = subjects.find((s) => s.code === selectedSubjectCode) || subjects[0];
  const courseId = currentSubject.courseId || "00000000-0000-0000-0000-000000000001";

  const [historyList, setHistoryList] = useState<LearningPathHistoryItem[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [criticReasoning, setCriticReasoning] = useState<string | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingGraph, setLoadingGraph] = useState<boolean>(false);

  // 1. Fetch History
  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);
        const data = await getLearningPathHistory(studentId, courseId);
        setHistoryList(data);
        if (data.length > 0) {
          setSelectedInstanceId(data[0].instance_id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading adaptive history:", err);
        setLoading(false);
      }
    }
    loadHistory();
  }, [studentId, courseId]);

  // 2. Fetch Detail Lộ trình khi chọn instance_id khác
  useEffect(() => {
    if (!selectedInstanceId) return;

    async function loadDetail() {
      try {
        setLoadingGraph(true);
        const detail = await getLearningPathDetail(selectedInstanceId);
        const fetchedMilestones = detail.path_data.milestones || [];
        setMilestones(fetchedMilestones);
        setCriticReasoning(detail.path_data.critic_reasoning || null);
        
        // Tự động chọn milestone đầu tiên ở trạng thái unlocked hoặc completed
        const defaultMilestone =
          fetchedMilestones.find((m) => m.status === "unlocked") ||
          fetchedMilestones.find((m) => m.status === "completed") ||
          fetchedMilestones[0] ||
          null;
        setSelectedMilestone(defaultMilestone);
      } catch (err) {
        console.error("Error loading adaptive detail:", err);
      } finally {
        setLoadingGraph(false);
        setLoading(false);
      }
    }
    loadDetail();
  }, [selectedInstanceId]);

  const handleStartPractice = (milestone: Milestone, task: MilestoneTask) => {
    // Điều hướng sang trang làm bài học/luyện tập tương ứng
    router.push(`/chuong/phan-so?subject=${selectedSubjectCode}`);
  };

  if (loading) {
    return (
      <div className="adaptive-loading-container">
        <div className="spinner"></div>
        <p>Đang tải lộ trình học tập cá nhân hóa do AI phân tích...</p>
      </div>
    );
  }

  if (historyList.length === 0) {
    return (
      <div className="adaptive-empty-roadmap">
        <Sparkle size={48} weight="fill" className="text-accent animate-pulse" />
        <h2>Chưa có lộ trình thích ứng</h2>
        <p>
          Học viên cần hoàn thành bài kiểm tra Giữa kỳ hoặc Cuối kỳ để AI phân tích lỗi sai và tự động kiến thiết lộ trình sửa lỗi.
        </p>
        <Link href={`/on-thi?subject=${selectedSubjectCode}`} className="primary-action">
          Làm bài kiểm tra ngay
        </Link>
      </div>
    );
  }

  return (
    <section className="skill-graph-shell adaptive-shell">
      {/* Panel trái để xem thông tin chi tiết của node đã click */}
      <TaskDetailPanel
        milestone={selectedMilestone}
        criticReasoning={criticReasoning}
        onStartPractice={handleStartPractice}
      />

      {/* Vùng canvas vẽ DAG */}
      <main className="skill-graph-board">
        <div className="skill-graph-topbar">
          <div className="topbar-leading-actions">
            <Link href={`/hoc-tap?subject=${selectedSubjectCode}`} className="back-link">
              <ArrowLeft size={16} />
              Quay lại ôn tập
            </Link>
            <div className="topbar-title-wrapper">
              <span className="overline">Học tập thích ứng (Adaptive Learning)</span>
              <h2>Lộ trình khắc phục lỗ hổng kiến thức</h2>
            </div>
          </div>
          
          <div className="topbar-filters">
            <HistorySelector
              history={historyList}
              selectedId={selectedInstanceId}
              onSelect={setSelectedInstanceId}
            />
          </div>
        </div>

        <div className="skill-graph-canvas adaptive-canvas">
          {loadingGraph ? (
            <div className="graph-loading-overlay">
              <div className="spinner"></div>
            </div>
          ) : (
            <ReactFlowProvider>
              <AdaptivePathGraph
                milestones={milestones}
                selectedMilestoneId={selectedMilestone?.id || null}
                onSelectMilestone={setSelectedMilestone}
              />
            </ReactFlowProvider>
          )}
        </div>
      </main>
    </section>
  );
}

export default function AdaptiveRoadmapPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-muted">Đang tải trang lộ trình thích ứng...</div>}>
      <AppShell>
        <AdaptiveRoadmapContent />
      </AppShell>
    </Suspense>
  );
}
