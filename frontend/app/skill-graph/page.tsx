"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowClockwise,
  ArrowSquareOut,
  BookOpenText,
  ChatCircleDots,
  CheckCircle,
  Crosshair,
  FunnelSimple,
  Graph,
  LockKey,
  MagnifyingGlass,
  Play,
  Sparkle,
  Target,
  X,
} from "@phosphor-icons/react";
import { AppShell } from "../components/AppShell";
import { activeLearningLevel, subjectPrograms, subjects } from "../data";
import { useOnboardingProfile } from "../hooks/useOnboardingProfile";

type Readiness = "ready" | "locked" | "needs_review";
type Priority = "today" | "recommended" | "optional" | null;
type GraphFilter = "all" | Readiness | "today";

type ReasonTrailStep = {
  label: string;
  detail: string;
};

type LearningCluster = {
  id: string;
  chapterId: string;
  title: string;
  summary: string;
  progress: { completed: number; total: number };
  readiness: Readiness;
  priority: Priority;
  prerequisiteClusterIds: string[];
  nextSkillId?: string;
  useGraphLayout: boolean;
  isFullChapter: boolean;
};

type LearningSkill = {
  id: string;
  clusterId: string;
  goal: string;
  estimatedMinutes: number;
  mastery: { understand: 0 | 1 | 2 | 3; doable: 0 | 1 | 2 | 3; transfer: 0 | 1 | 2 | 3 } | null;
  readiness: Readiness;
  priority: "today" | "recommended" | null;
  reasonTrail: ReasonTrailStep[];
  prerequisiteSkillIds: string[];
  unlocksSkillIds: string[];
  misconception?: { summary: string; triggerCount: number } | null;
  chapterNumber: string;
  chapterTitle: string;
  x: number;
  y: number;
};

type LearningLink = {
  source: LearningSkill;
  target: LearningSkill;
  relation: "prerequisite" | "related" | "unlock" | "chapter_bridge";
  state: "open" | "locked" | "active";
};

type ChapterBlueprint = {
  number: string;
  title: string;
  strand: string;
  clusters: Array<{
    id: string;
    title: string;
    summary: string;
    useGraphLayout: boolean;
    skills: string[];
  }>;
};

const chapterBlueprints: ChapterBlueprint[] = [
  {
    number: "01",
    title: "Số tự nhiên",
    strand: "Nền tảng số học",
    clusters: [
      { id: "set-natural", title: "Tập hợp và số tự nhiên", summary: "Nhận biết tập hợp, phần tử, thứ tự và biểu diễn trên tia số.", useGraphLayout: false, skills: ["Xác định phần tử thuộc một tập hợp", "Biểu diễn số tự nhiên trên tia số", "So sánh và sắp thứ tự số tự nhiên", "Đọc được cấu trúc một biểu thức đơn giản"] },
      { id: "natural-ops", title: "Phép tính số tự nhiên", summary: "Thực hiện phép cộng, trừ, nhân, chia và thứ tự phép tính.", useGraphLayout: true, skills: ["Tính được tổng và hiệu số tự nhiên", "Tính được tích và thương số tự nhiên", "Áp dụng đúng thứ tự phép tính", "Kiểm tra kết quả bằng phép tính ngược"] },
      { id: "power-expression", title: "Lũy thừa và biểu thức", summary: "Dùng lũy thừa, ước lượng và làm tròn trong bài toán số học.", useGraphLayout: true, skills: ["Viết được lũy thừa của một tích lặp", "Rút gọn biểu thức có lũy thừa", "Ước lượng kết quả trước khi tính", "Làm tròn số theo yêu cầu bài toán"] },
      { id: "natural-application", title: "Bài toán thực tế", summary: "Chuyển đề bài thực tế thành phép tính và kiểm tra đáp án.", useGraphLayout: false, skills: ["Tách dữ kiện quan trọng trong đề", "Chọn phép tính phù hợp với tình huống", "Giải bài toán nhiều bước", "Đối chiếu đáp án với ngữ cảnh thực tế"] },
    ],
  },
  {
    number: "02",
    title: "Tính chia hết",
    strand: "Cấu trúc số",
    clusters: [
      { id: "divisibility-signs", title: "Dấu hiệu chia hết", summary: "Nhận biết số chia hết cho 2, 3, 5, 9 và phối hợp nhiều điều kiện.", useGraphLayout: true, skills: ["Nhận biết số chia hết cho 2 và 5", "Nhận biết số chia hết cho 3 và 9", "Tìm chữ số còn thiếu để chia hết", "Kết hợp nhiều dấu hiệu chia hết"] },
      { id: "factor-multiple", title: "Ước, bội và số nguyên tố", summary: "Phân loại ước, bội, số nguyên tố và hợp số.", useGraphLayout: true, skills: ["Liệt kê được ước của một số", "Liệt kê được bội trong một khoảng", "Phân biệt số nguyên tố và hợp số", "Phân tích một số ra thừa số nguyên tố"] },
      { id: "gcd-lcm", title: "ƯCLN và BCNN", summary: "Tìm ước chung, bội chung và dùng trong bài toán nhóm.", useGraphLayout: true, skills: ["Tìm được ước chung lớn nhất", "Tìm được bội chung nhỏ nhất", "Tìm số lớn nhất chia hết cả hai số", "Tìm chu kỳ lặp lại bằng BCNN"] },
      { id: "divisibility-problems", title: "Bài toán chia hết", summary: "Giải bài toán lịch, chia nhóm và điều kiện mở khóa chương sau.", useGraphLayout: false, skills: ["Giải bài toán chia nhóm đều", "Giải bài toán lịch lặp lại", "Giải bài toán tìm số chưa biết", "Tổng hợp điều kiện chia hết trong đề dài"] },
    ],
  },
  {
    number: "03",
    title: "Số nguyên",
    strand: "Mở rộng tập số",
    clusters: [
      { id: "integer-meaning", title: "Ý nghĩa số nguyên", summary: "Hiểu số âm, số đối, giá trị tuyệt đối và trục số.", useGraphLayout: false, skills: ["Biểu diễn số nguyên trên trục số", "Tìm số đối của một số nguyên", "Tính giá trị tuyệt đối", "So sánh hai số nguyên"] },
      { id: "integer-ops", title: "Phép tính số nguyên", summary: "Thực hiện cộng, trừ, nhân, chia số nguyên.", useGraphLayout: true, skills: ["Cộng hai số nguyên cùng dấu", "Cộng hai số nguyên khác dấu", "Nhân chia số nguyên theo quy tắc dấu", "Tính biểu thức số nguyên nhiều bước"] },
      { id: "integer-context", title: "Ngữ cảnh số nguyên", summary: "Vận dụng số nguyên trong nhiệt độ, lãi lỗ và tọa độ.", useGraphLayout: false, skills: ["Mô tả nhiệt độ bằng số nguyên", "Tính tăng giảm lãi lỗ", "Đọc tọa độ trên trục", "Kiểm tra dấu của kết quả thực tế"] },
    ],
  },
];

const readinessLabel: Record<Readiness, string> = {
  ready: "Sẵn sàng",
  locked: "Chưa mở",
  needs_review: "Cần ôn lại",
};

const filterLabels: Record<GraphFilter, string> = {
  all: "Tất cả",
  today: "Hôm nay",
  ready: "Sẵn sàng",
  needs_review: "Cần ôn",
  locked: "Khóa",
};

const readinessIcon: Record<Readiness, typeof CheckCircle> = {
  ready: Target,
  locked: LockKey,
  needs_review: ArrowClockwise,
};

function getReadiness(chapterIndex: number, clusterIndex: number, skillIndex: number): Readiness {
  if (chapterIndex === 0) return skillIndex < 2 ? "ready" : "needs_review";
  if (chapterIndex === 1 && clusterIndex === 0) return skillIndex < 2 ? "ready" : "needs_review";
  if (chapterIndex === 1 && clusterIndex === 1) return "ready";
  if (chapterIndex === 1 && clusterIndex === 2 && skillIndex < 2) return "ready";
  return "locked";
}

function getPriority(chapterIndex: number, clusterIndex: number, skillIndex: number): LearningSkill["priority"] {
  if (chapterIndex === 1 && clusterIndex === 1 && skillIndex === 2) return "today";
  if (chapterIndex === 1 && clusterIndex <= 2 && skillIndex < 3) return "recommended";
  return null;
}

function buildLearningMap() {
  const clusters: LearningCluster[] = [];
  const skills: LearningSkill[] = [];

  chapterBlueprints.forEach((chapter, chapterIndex) => {
    chapter.clusters.forEach((cluster, clusterIndex) => {
      const clusterId = `${chapter.number}-${cluster.id}`;
      const prerequisiteClusterIds = clusterIndex > 0
        ? [`${chapter.number}-${chapter.clusters[clusterIndex - 1].id}`]
        : chapterIndex > 0
          ? [`${chapterBlueprints[chapterIndex - 1].number}-${chapterBlueprints[chapterIndex - 1].clusters.at(-1)?.id}`]
          : [];
      const clusterSkills = cluster.skills.map((goal, skillIndex) => {
        const id = `${clusterId}-s${skillIndex + 1}`;
        const readiness = getReadiness(chapterIndex, clusterIndex, skillIndex);
        const priority = getPriority(chapterIndex, clusterIndex, skillIndex);
        const mastery = readiness === "locked"
          ? null
          : priority === "today"
            ? { understand: 2, doable: 1, transfer: 0 } as const
            : readiness === "needs_review"
              ? { understand: 1, doable: 1, transfer: 0 } as const
              : { understand: 2, doable: 2, transfer: 1 } as const;
        const previousSkillId = skillIndex > 0 ? `${clusterId}-s${skillIndex}` : null;
        const previousClusterLastSkillId = skillIndex === 0 && prerequisiteClusterIds[0] ? `${prerequisiteClusterIds[0]}-s4` : null;
        const prerequisiteSkillIds = [previousSkillId, previousClusterLastSkillId].filter(Boolean) as string[];
        const x = 7 + chapterIndex * 30 + clusterIndex * 6 + skillIndex * 1.8;
        const y = 18 + clusterIndex * 18 + (skillIndex % 2) * 8;

        return {
          id,
          clusterId,
          goal,
          estimatedMinutes: 8 + ((chapterIndex + clusterIndex + skillIndex) % 4) * 3,
          mastery,
          readiness,
          priority,
          reasonTrail: [
            { label: "Nguồn", detail: `Thuộc cụm ${cluster.title}` },
            { label: "Điều kiện", detail: prerequisiteSkillIds.length ? `Cần qua ${prerequisiteSkillIds.length} skill trước đó` : "Skill mở đầu cụm" },
            { label: "Gợi ý", detail: priority === "today" ? "Được chọn làm mục tiêu hôm nay" : readiness === "needs_review" ? "Cần ôn vì mastery chuyển giao còn thấp" : "Sẵn sàng luyện tiếp" },
          ],
          prerequisiteSkillIds,
          unlocksSkillIds: skillIndex < cluster.skills.length - 1 ? [`${clusterId}-s${skillIndex + 2}`] : [],
          misconception: readiness === "needs_review" ? { summary: "Hay nhầm điều kiện chia hết với phép chia có dư.", triggerCount: 2 + skillIndex } : null,
          chapterNumber: chapter.number,
          chapterTitle: chapter.title,
          x,
          y,
        } satisfies LearningSkill;
      });

      skills.push(...clusterSkills);
      const completed = clusterSkills.filter((skill) => skill.mastery && skill.mastery.understand + skill.mastery.doable + skill.mastery.transfer >= 5).length;
      const clusterReadiness: Readiness = clusterSkills.every((skill) => skill.readiness === "locked")
        ? "locked"
        : clusterSkills.some((skill) => skill.readiness === "needs_review")
          ? "needs_review"
          : "ready";

      clusters.push({
        id: clusterId,
        chapterId: chapter.number,
        title: cluster.title,
        summary: cluster.summary,
        progress: { completed, total: clusterSkills.length },
        readiness: clusterReadiness,
        priority: clusterSkills.some((skill) => skill.priority === "today") ? "today" : clusterSkills.some((skill) => skill.priority === "recommended") ? "recommended" : null,
        prerequisiteClusterIds,
        nextSkillId: clusterSkills.find((skill) => skill.priority === "today" || skill.readiness === "ready")?.id,
        useGraphLayout: cluster.useGraphLayout,
        isFullChapter: clusterIndex === chapter.clusters.length - 1,
      });
    });
  });

  return { clusters, skills };
}

function buildLinks(skills: LearningSkill[]) {
  const byId = new Map(skills.map((skill) => [skill.id, skill]));
  const seen = new Set<string>();
  const links: LearningLink[] = [];

  skills.forEach((skill) => {
    skill.prerequisiteSkillIds.forEach((sourceId) => {
      const source = byId.get(sourceId);
      if (!source) return;
      const key = `${source.id}-${skill.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      links.push({
        source,
        target: skill,
        relation: source.chapterNumber !== skill.chapterNumber ? "chapter_bridge" : "prerequisite",
        state: skill.readiness === "locked" || source.readiness === "locked" ? "locked" : skill.priority === "today" ? "active" : "open",
      });
    });

    skill.unlocksSkillIds.forEach((targetId) => {
      const target = byId.get(targetId);
      if (!target) return;
      const key = `${skill.id}-${target.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      links.push({
        source: skill,
        target,
        relation: "unlock",
        state: target.readiness === "locked" ? "locked" : target.priority === "today" ? "active" : "open",
      });
    });
  });

  const chapterBridgePairs = [
    ["01-natural-ops-s4", "02-divisibility-signs-s1"],
    ["01-power-expression-s4", "02-factor-multiple-s4"],
    ["02-factor-multiple-s4", "03-integer-meaning-s1"],
    ["02-gcd-lcm-s4", "03-integer-ops-s4"],
  ];

  chapterBridgePairs.forEach(([sourceId, targetId]) => {
    const source = byId.get(sourceId);
    const target = byId.get(targetId);
    if (!source || !target) return;
    const key = `${source.id}-${target.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    links.push({
      source,
      target,
      relation: "chapter_bridge",
      state: target.readiness === "locked" ? "locked" : target.priority === "today" ? "active" : "open",
    });
  });

  return links;
}

function projectChapterSkills(skills: LearningSkill[], chapterNumber: string) {
  return skills
    .filter((skill) => skill.chapterNumber === chapterNumber)
    .map((skill, index) => ({
      ...skill,
      x: 11 + (index % 4) * 26,
      y: 28 + Math.floor(index / 4) * 17,
    }));
}

function masteryTotal(skill: LearningSkill) {
  if (!skill.mastery) return null;
  return skill.mastery.understand + skill.mastery.doable + skill.mastery.transfer;
}

function graphClass(skill: LearningSkill) {
  const total = masteryTotal(skill);
  if (skill.priority === "today") return "current";
  if (skill.readiness === "locked") return "locked";
  if (skill.readiness === "needs_review") return "review";
  if (total !== null && total >= 7) return "mastered";
  return "ready";
}

export default function SkillGraphPage() {
  const searchParams = useSearchParams();
  const selectedSubjectCode = searchParams.get("subject") || "TO";
  const selectedSubject = subjects.find((subject) => subject.code === selectedSubjectCode) || subjects[0];
  const program = subjectPrograms[selectedSubject.code as keyof typeof subjectPrograms] || subjectPrograms.TO;
  const learningLevel = useOnboardingProfile(selectedSubject.code);
  const { clusters, skills } = useMemo(() => buildLearningMap(), []);
  const links = useMemo(() => buildLinks(skills), [skills]);
  const defaultSkill = skills.find((skill) => skill.priority === "today") || skills.find((skill) => skill.readiness === "ready") || skills[0];
  const [selectedSkillId, setSelectedSkillId] = useState(defaultSkill.id);
  const [activeFilter, setActiveFilter] = useState<GraphFilter>("all");
  const [isFullGraphOpen, setIsFullGraphOpen] = useState(false);
  const selectedSkill = skills.find((skill) => skill.id === selectedSkillId) || defaultSkill;
  const selectedCluster = clusters.find((cluster) => cluster.id === selectedSkill.clusterId) || clusters[0];
  const learningChapterNumber = defaultSkill.chapterNumber;
  const currentChapter = chapterBlueprints.find((chapter) => chapter.number === learningChapterNumber) || chapterBlueprints[0];
  const chapterSkills = useMemo(() => projectChapterSkills(skills, learningChapterNumber), [learningChapterNumber, skills]);
  const chapterSkillIds = new Set(chapterSkills.map((skill) => skill.id));
  const chapterLinks = buildLinks(chapterSkills).filter((link) => chapterSkillIds.has(link.source.id) && chapterSkillIds.has(link.target.id));
  const fullVisibleSkills = activeFilter === "all"
    ? skills
    : skills.filter((skill) => activeFilter === "today" ? skill.priority === "today" || skill.id === selectedSkill.id : skill.readiness === activeFilter || skill.id === selectedSkill.id);
  const fullVisibleIds = new Set(fullVisibleSkills.map((skill) => skill.id));
  const fullVisibleLinks = links.filter((link) => fullVisibleIds.has(link.source.id) && fullVisibleIds.has(link.target.id));
  const chapterClusters = clusters.filter((cluster) => cluster.chapterId === learningChapterNumber);
  const currentChapterProgress = chapterClusters.reduce((sum, cluster) => sum + cluster.progress.completed, 0);
  const currentChapterTotal = chapterClusters.reduce((sum, cluster) => sum + cluster.progress.total, 0);
  const openCount = skills.filter((skill) => skill.readiness !== "locked").length;
  const chapterBridgeCount = links.filter((link) => link.relation === "chapter_bridge").length;
  const currentChapterBridgeCount = links.filter((link) => link.relation === "chapter_bridge" && (link.source.chapterNumber === learningChapterNumber || link.target.chapterNumber === learningChapterNumber)).length;

  const closeFullGraph = () => {
    setIsFullGraphOpen(false);
    setSelectedSkillId(defaultSkill.id);
    setActiveFilter("all");
  };

  return (
    <AppShell>
      <section className="skill-graph-shell">
        <aside className="skill-node-panel">
          <div className="skill-node-panel-head">
            <span className="overline">{program.grade} · {program.title}</span>
            <h1>{selectedSkill.goal}</h1>
            <p>{selectedCluster.summary}</p>
          </div>

          <div className="skill-node-stats">
            <div><span>Progress cụm</span><strong>{selectedCluster.progress.completed}/{selectedCluster.progress.total}</strong></div>
            <div><span>Level môn</span><strong>{learningLevel.name || activeLearningLevel.name}</strong></div>
          </div>

          <span className={`skill-state-pill ${selectedSkill.readiness}`}>{selectedSkill.priority === "today" ? "Hôm nay" : readinessLabel[selectedSkill.readiness]}</span>

          {selectedSkill.mastery && (
            <div className="skill-mastery-axis" aria-label="Mastery theo skill">
              <span>Hiểu <strong>{selectedSkill.mastery.understand}/3</strong></span>
              <span>Làm được <strong>{selectedSkill.mastery.doable}/3</strong></span>
              <span>Chuyển giao <strong>{selectedSkill.mastery.transfer}/3</strong></span>
            </div>
          )}

          <div className="skill-prereq-card">
            <span>Cụm năng lực</span>
            <strong>{selectedCluster.title}</strong>
            <small>{selectedCluster.useGraphLayout ? "Subgraph có hội tụ/phân kỳ, ưu tiên graph layout." : "Subgraph tuyến tính, có thể hiển thị dạng step-path."}</small>
          </div>

          <div className="skill-prereq-card">
            <span>Unlock preview</span>
            <strong>{selectedSkill.unlocksSkillIds.length ? `${selectedSkill.unlocksSkillIds.length} skill sẽ mở tiếp` : "Skill cuối của cụm"}</strong>
            <small>{selectedSkill.unlocksSkillIds.join(", ") || "Hoàn tất để chuyển sang cụm kế tiếp."}</small>
          </div>

          <div className="skill-reason-trail">
            {selectedSkill.reasonTrail.map((step) => (
              <div key={step.label}><span>{step.label}</span><strong>{step.detail}</strong></div>
            ))}
          </div>

          {selectedSkill.misconception && (
            <div className="skill-prereq-card warning">
              <span>Lỗi hay gặp</span>
              <strong>{selectedSkill.misconception.summary}</strong>
              <small>Gặp {selectedSkill.misconception.triggerCount} lần trong bài luyện gần đây.</small>
            </div>
          )}

          <div className="skill-node-actions">
            <Link className="primary-action" href={`/hoi-dap-ai?subject=${selectedSubject.code}&skill=${selectedSkill.id}`}>
              <ChatCircleDots size={17} weight="fill" />
              Hỏi AI về skill này
            </Link>
            <Link className="secondary-action" href="/chuong/phan-so">
              <Play size={16} weight="fill" />
              Luyện tập {selectedSkill.estimatedMinutes} phút
            </Link>
          </div>
        </aside>

        <main className="skill-graph-board">
          <div className="skill-graph-topbar">
            <div>
              <span className="overline">Skill graph</span>
              <h2>Chương {currentChapter.number}: {currentChapter.title}</h2>
              <p>Chỉ hiện chương đang học. Toàn bộ {skills.length} skill nằm trong chế độ xem tất cả.</p>
            </div>
            <div className="skill-subject-switcher" aria-label="Đổi môn skill graph">
              {subjects.map((subject) => (
                <Link className={subject.code === selectedSubject.code ? "active" : ""} href={`/skill-graph?subject=${subject.code}`} key={subject.code}>
                  {subject.name}
                </Link>
              ))}
              <button className="skill-view-all-button" onClick={() => setIsFullGraphOpen(true)} type="button">
                <ArrowSquareOut size={16} weight="bold" />
                Xem tất cả
              </button>
            </div>
          </div>

          <div className="skill-graph-summary" aria-label="Tổng quan skill graph">
            <div><BookOpenText size={18} weight="fill" /><span>Cụm chương này</span><strong>{chapterClusters.length}</strong></div>
            <div><Graph size={18} weight="fill" /><span>Progress</span><strong>{currentChapterProgress}/{currentChapterTotal}</strong></div>
            <div><CheckCircle size={18} weight="fill" /><span>Liên chương</span><strong>{currentChapterBridgeCount}</strong></div>
            <div><Sparkle size={18} weight="fill" /><span>Hôm nay</span><strong>{defaultSkill.goal}</strong></div>
          </div>

          <div className="skill-graph-canvas focus-canvas" aria-label="Bản đồ kỹ năng chương đang học">
            <div className="graph-toolbar">
              <span><Target size={16} weight="fill" /> {selectedCluster.useGraphLayout ? "Graph layout" : "Step-path"}</span>
              <button type="button" onClick={() => setSelectedSkillId(defaultSkill.id)}><Crosshair size={16} /> Về hiện tại</button>
              <button type="button" onClick={() => setIsFullGraphOpen(true)}><ArrowSquareOut size={17} /> Xem tất cả</button>
            </div>

            <div className="skill-graph-stage focus-stage">
              <div className="skill-focus-band">
                <strong>{currentChapter.strand}</strong>
              </div>

              <svg className="skill-graph-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {chapterLinks.map((link) => (
                  <line
                    className={`${link.state} ${link.relation}`}
                    key={`${link.source.id}-${link.target.id}`}
                    x1={link.source.x}
                    x2={link.target.x}
                    y1={link.source.y}
                    y2={link.target.y}
                  />
                ))}
              </svg>

              {chapterSkills.map((skill) => {
                const Icon = skill.priority === "today" ? Sparkle : readinessIcon[skill.readiness];
                const total = masteryTotal(skill);
                return (
                  <button
                    className={`graph-node ${graphClass(skill)} ${skill.id === selectedSkill.id ? "selected" : ""}`}
                    key={skill.id}
                    onClick={() => setSelectedSkillId(skill.id)}
                    style={{ left: `${skill.x}%`, top: `${skill.y}%` }}
                    type="button"
                    title={`${skill.goal} · ${skill.priority === "today" ? "Hôm nay" : readinessLabel[skill.readiness]}`}
                  >
                    <Icon size={15} weight={skill.readiness === "locked" ? "regular" : "fill"} />
                    <span>{skill.goal}</span>
                    <small>{total === null ? `${skill.estimatedMinutes}p` : `${total}/9`}</small>
                  </button>
                );
              })}

              <div className="graph-current-orbit" style={{ left: `${chapterSkills.find((skill) => skill.id === defaultSkill.id)?.x || 50}%`, top: `${chapterSkills.find((skill) => skill.id === defaultSkill.id)?.y || 50}%` }}>
                <Sparkle size={18} weight="fill" />
              </div>
            </div>
          </div>
        </main>
      </section>

      {isFullGraphOpen && (
        <section className="skill-fullscreen" aria-label="Toàn bộ skill graph">
          <div className="skill-fullscreen-head">
            <div>
              <span className="overline">Toàn bộ lộ trình</span>
              <h2>{openCount}/{skills.length} skill đã mở</h2>
              <p>{links.length} liên kết, gồm {chapterBridgeCount} cầu nối liên chương theo Learning Map Aggregator.</p>
            </div>
            <button className="skill-fullscreen-close" onClick={closeFullGraph} type="button" aria-label="Đóng toàn bộ skill graph">
              <X size={20} weight="bold" />
            </button>
          </div>

          <div className="skill-graph-filters" aria-label="Lọc skill theo trạng thái">
            <span><FunnelSimple size={15} weight="bold" /> Bộ lọc</span>
            {(Object.keys(filterLabels) as GraphFilter[]).map((filter) => (
              <button className={activeFilter === filter ? "active" : ""} key={filter} onClick={() => setActiveFilter(filter)} type="button">
                {filterLabels[filter]}
              </button>
            ))}
          </div>

          <div className="skill-link-legend" aria-label="Chú thích liên kết skill graph">
            <span><i className="prerequisite" /> Prerequisite nội chương</span>
            <span><i className="chapter_bridge" /> Cầu nối liên chương</span>
            <span><i className="locked" /> Liên kết chưa mở</span>
          </div>

          <div className="skill-graph-canvas full-canvas" aria-label="Bản đồ kỹ năng Toán lớp 6 đầy đủ">
            <div className="graph-toolbar">
              <span><MagnifyingGlass size={16} /> Kéo ngang để xem các chương</span>
              <button type="button" onClick={() => setSelectedSkillId(defaultSkill.id)}><Crosshair size={16} /> Về hiện tại</button>
            </div>

            <div className="skill-graph-stage full-stage">
              <div className="skill-graph-lanes">
                {chapterBlueprints.map((chapter, index) => (
                  <div className={`skill-graph-lane ${chapter.number === learningChapterNumber ? "active" : ""}`} key={chapter.number} style={{ left: `${index * 30 + 1.5}%` }}>
                    <strong>Chương {chapter.number}</strong>
                    <span>{chapter.title}</span>
                  </div>
                ))}
              </div>

              <svg className="skill-graph-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {fullVisibleLinks.map((link) => (
                  <line
                    className={`${link.state} ${link.relation}`}
                    key={`${link.source.id}-${link.target.id}`}
                    x1={link.source.x}
                    x2={link.target.x}
                    y1={link.source.y}
                    y2={link.target.y}
                  />
                ))}
              </svg>

              {fullVisibleSkills.map((skill) => {
                const Icon = skill.priority === "today" ? Sparkle : readinessIcon[skill.readiness];
                const total = masteryTotal(skill);
                return (
                  <button
                    className={`graph-node ${graphClass(skill)} ${skill.id === selectedSkill.id ? "selected" : ""}`}
                    key={skill.id}
                    onClick={() => setSelectedSkillId(skill.id)}
                    style={{ left: `${skill.x}%`, top: `${skill.y}%` }}
                    type="button"
                    title={`${skill.goal} · ${skill.priority === "today" ? "Hôm nay" : readinessLabel[skill.readiness]}`}
                  >
                    <Icon size={15} weight={skill.readiness === "locked" ? "regular" : "fill"} />
                    <span>{skill.goal}</span>
                    <small>{total === null ? `${skill.estimatedMinutes}p` : `${total}/9`}</small>
                  </button>
                );
              })}

              <div className="graph-current-orbit" style={{ left: `${defaultSkill.x}%`, top: `${defaultSkill.y}%` }}>
                <Sparkle size={18} weight="fill" />
              </div>
            </div>
          </div>
        </section>
      )}
    </AppShell>
  );
}
