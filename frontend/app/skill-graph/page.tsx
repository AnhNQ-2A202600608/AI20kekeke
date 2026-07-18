"use client";

import Link from "next/link";
import { useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowCounterClockwise,
  ChatCircleDots,
  CheckCircle,
  Crosshair,
  Lightning,
  LockKey,
  MagnifyingGlassPlus,
  Minus,
  Play,
  Plus,
  Sparkle,
} from "@phosphor-icons/react";
import { AppShell } from "../components/AppShell";
import { subjectPrograms, subjects } from "../data";
import { useOnboardingProfile } from "../hooks/useOnboardingProfile";

type SkillState = "mastered" | "current" | "ready" | "locked";

type SkillNode = {
  id: string;
  title: string;
  chapter: string;
  detail: string;
  state: SkillState;
  mastery: number;
  x: number;
  y: number;
};

const skillBySubject = {
  TO: ["Khái niệm", "Quy đồng", "Tính toán", "So sánh", "Vận dụng", "Kiểm tra"],
} as const;

const stateLabel: Record<SkillState, string> = {
  mastered: "Đã vững",
  current: "Đang học",
  ready: "Sẵn sàng",
  locked: "Khóa",
};

function buildSkillNodes(subjectCode: keyof typeof skillBySubject, program: (typeof subjectPrograms)[keyof typeof subjectPrograms]) {
  const skillNames = skillBySubject[subjectCode] || skillBySubject.TO;
  return program.chapters.flatMap((chapter, chapterIndex) =>
    skillNames.map((skillName, skillIndex) => {
      const state: SkillState = chapter.active
        ? skillIndex < 2
          ? "mastered"
          : skillIndex === 2
            ? "current"
            : "ready"
        : chapterIndex === 1 && skillIndex < 2
          ? "ready"
          : "locked";
      const mastery = state === "mastered" ? 86 + ((skillIndex + chapterIndex) % 9) : state === "current" ? 61 : state === "ready" ? 22 + skillIndex * 7 : 0;
      return {
        id: `${chapter.number}-${skillIndex}`,
        title: skillName,
        chapter: `Chương ${Number(chapter.number)} · ${chapter.title}`,
        detail: `${skillName} trong mạch ${chapter.title.toLowerCase()}. ${chapter.summary}`,
        state,
        mastery,
        x: 11 + skillIndex * 14 + (chapterIndex % 2) * 5,
        y: 20 + chapterIndex * 24 + (skillIndex % 2) * 7,
      };
    }),
  );
}

function SkillGraphPageContent() {
  const searchParams = useSearchParams();
  const selectedSubjectCode = searchParams.get("subject") || "TO";
  const selectedSubject = subjects.find((subject) => subject.code === selectedSubjectCode) || subjects[0];
  const program = subjectPrograms[selectedSubject.code as keyof typeof subjectPrograms] || subjectPrograms.TO;
  const learningLevel = useOnboardingProfile(selectedSubject.code);
  const nodes = useMemo(() => buildSkillNodes(selectedSubject.code as keyof typeof skillBySubject, program), [program, selectedSubject.code]);
  const defaultNode = nodes.find((node) => node.state === "current") || nodes[0];
  const [selectedNodeId, setSelectedNodeId] = useState(defaultNode.id);
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) || defaultNode;
  const unlockedCount = nodes.filter((node) => node.state !== "locked").length;
  const links = nodes.slice(0, -1).map((node, index) => ({ from: node, to: nodes[index + 1] }));

  return (
    <section className="skill-graph-shell">
        <aside className="skill-node-panel">
          <div className="skill-node-panel-head">
            <span className="overline">{program.grade} · {program.title}</span>
            <h1>{selectedNode.title}</h1>
            <p>{selectedNode.detail}</p>
          </div>

          <div className="skill-node-stats">
            <div><span>Mastery</span><strong>{selectedNode.mastery}%</strong></div>
            <div><span>Level</span><strong>{learningLevel.name}</strong></div>
          </div>

          <span className={`skill-state-pill ${selectedNode.state}`}>{stateLabel[selectedNode.state]}</span>

          <div className="skill-prereq-card">
            <span>Cần nắm trước</span>
            <strong>{selectedNode.chapter}</strong>
          </div>

          <div className="skill-node-actions">
            <Link className="primary-action" href={`/hoi-dap-ai?subject=${selectedSubject.code}`}>
              <ChatCircleDots size={17} weight="fill" />
              Hỏi AI về node này
            </Link>
            <Link className="secondary-action" href="/chuong/phan-so">
              <Play size={16} weight="fill" />
              Luyện tập node này
            </Link>
          </div>
        </aside>

        <main className="skill-graph-board">
          <div className="skill-graph-topbar">
            <div>
              <span className="overline">Knowledge graph</span>
              <h2>{unlockedCount}/{nodes.length} node đang mở</h2>
              <p>{nodes.length} nodes · {links.length} liên kết · cá nhân hóa theo {program.title}</p>
            </div>
            <div className="skill-subject-switcher" aria-label="Đổi môn skill graph">
              {subjects.map((subject) => (
                <Link className={subject.code === selectedSubject.code ? "active" : ""} href={`/skill-graph?subject=${subject.code}`} key={subject.code}>
                  {subject.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="skill-graph-canvas">
            <div className="graph-toolbar">
              <span><MagnifyingGlassPlus size={16} /> Cuộn để zoom</span>
              <button type="button"><Crosshair size={16} /> Về hiện tại</button>
              <button type="button" aria-label="Phóng to"><Plus size={17} /></button>
              <button type="button" aria-label="Thu nhỏ"><Minus size={17} /></button>
              <button type="button" aria-label="Làm mới"><ArrowCounterClockwise size={17} /></button>
            </div>

            <svg className="skill-graph-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {links.map((link) => (
                <line
                  className={link.from.state === "locked" || link.to.state === "locked" ? "locked" : "open"}
                  key={`${link.from.id}-${link.to.id}`}
                  x1={link.from.x}
                  x2={link.to.x}
                  y1={link.from.y}
                  y2={link.to.y}
                />
              ))}
            </svg>

            {nodes.map((node) => (
              <button
                className={`graph-node ${node.state} ${node.id === selectedNode.id ? "selected" : ""}`}
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                type="button"
              >
                {node.state === "mastered" ? <CheckCircle size={15} weight="fill" /> : node.state === "locked" ? <LockKey size={14} /> : <Sparkle size={14} weight="fill" />}
                <span>{node.title}</span>
                <small>{node.mastery}%</small>
              </button>
            ))}

            <div className="graph-current-orbit">
              <Lightning size={18} weight="fill" />
            </div>
          </div>
        </main>
      </section>
  );
}

export default function SkillGraphPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-muted">Đang tải sơ đồ kỹ năng...</div>}>
      <AppShell>
        <SkillGraphPageContent />
      </AppShell>
    </Suspense>
  );
}
