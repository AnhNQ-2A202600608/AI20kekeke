import { fetchApi } from "./api";
import { useBoundStore } from "../hooks/useBoundStore";
import { isDemoMode } from "./demo-mode";

export interface LearningPathHistoryItem {
  instance_id: string;
  exam_attempt_id: string | null;
  trigger_type: "midterm" | "final" | "mentor_manual";
  source: "auto" | "mentor";
  status: "active" | "archived" | "completed";
  milestone_count: number;
  created_at: string;
}

export interface MilestoneTask {
  type: "theory" | "video" | "slide" | "practice";
  content_id: string | null;
  difficulty: "quick" | "deep" | null;
}

export interface Milestone {
  id: string;
  concept_id: string;
  concept_name: string;
  status: "locked" | "unlocked" | "completed";
  error_type: "careless" | "conceptual" | null;
  prerequisites: string[];
  tasks: MilestoneTask[];
}

export interface PathData {
  milestones: Milestone[];
  critic_reasoning: string | null;
}

export interface LearningPathInstance {
  id: string;
  path_data: PathData;
  trigger_type: string;
  source: string;
  created_at: string;
}

const DEFAULT_COURSE_ID = "00000000-0000-0000-0000-000000000001";

export async function getLearningPathHistory(
  studentId: string,
  courseId: string = DEFAULT_COURSE_ID,
): Promise<LearningPathHistoryItem[]> {
  const store = useBoundStore.getState();
  const token = store.token;

  if (isDemoMode() || !token) {
    // Trả về mock data lịch sử cho chế độ demo
    return [
      {
        instance_id: "demo-instance-midterm-2026",
        exam_attempt_id: "demo-attempt-1",
        trigger_type: "midterm",
        source: "auto",
        status: "active",
        milestone_count: 4,
        created_at: new Date(Date.now() - 3600 * 1000 * 24 * 2).toISOString(), // 2 days ago
      },
      {
        instance_id: "demo-instance-final-2025",
        exam_attempt_id: "demo-attempt-2",
        trigger_type: "final",
        source: "auto",
        status: "archived",
        milestone_count: 4,
        created_at: new Date(Date.now() - 3600 * 1000 * 24 * 60).toISOString(), // 60 days ago
      },
    ];
  }

  try {
    return await fetchApi<LearningPathHistoryItem[]>(
      `/learning-path/history/${studentId}?course_id=${courseId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  } catch (error) {
    console.error("Error in getLearningPathHistory, falling back to mock:", error);
    return [
      {
        instance_id: "demo-instance-midterm-2026",
        exam_attempt_id: "demo-attempt-1",
        trigger_type: "midterm",
        source: "auto",
        status: "active",
        milestone_count: 4,
        created_at: new Date(Date.now() - 3600 * 1000 * 24 * 2).toISOString(),
      },
    ];
  }
}

export async function getLearningPathDetail(
  instanceId: string,
): Promise<LearningPathInstance> {
  const store = useBoundStore.getState();
  const token = store.token;

  if (isDemoMode() || !token || instanceId.startsWith("demo-instance-")) {
    const isMidterm = instanceId.includes("midterm");
    return {
      id: instanceId,
      trigger_type: isMidterm ? "midterm" : "final",
      source: "auto",
      created_at: new Date().toISOString(),
      path_data: {
        critic_reasoning: isMidterm
          ? "Học viên Hoàng Nam có dấu hiệu hiểu sai bản chất khái niệm phép nhân phân số và quy đồng mẫu số (conceptual mistake), tuy nhiên tính toán cơ bản vẫn tốt. Lộ trình tập trung ôn tập lý thuyết phân số trước khi luyện tập sâu."
          : "Học viên Hoàng Nam đã hoàn thành tốt các bài toán cơ bản nhưng làm sai bài toán thực tế do bất cẩn (careless mistake). Lộ trình đề xuất tăng cường các bài tập tình huống thực tế nhanh để cải thiện độ nhạy bén.",
        milestones: isMidterm
          ? [
              {
                id: "concept-1",
                concept_id: "concept-1",
                concept_name: "Khái niệm phân số & biểu diễn",
                status: "completed",
                error_type: null,
                prerequisites: [],
                tasks: [
                  { type: "slide", content_id: null, difficulty: null },
                  { type: "practice", content_id: null, difficulty: "quick" },
                ],
              },
              {
                id: "concept-2",
                concept_id: "concept-2",
                concept_name: "Quy đồng mẫu số nhiều phân số",
                status: "unlocked",
                error_type: "conceptual",
                prerequisites: ["concept-1"],
                tasks: [
                  { type: "video", content_id: null, difficulty: null },
                  { type: "slide", content_id: null, difficulty: null },
                  { type: "practice", content_id: null, difficulty: "deep" },
                ],
              },
              {
                id: "concept-3",
                concept_id: "concept-3",
                concept_name: "Phép nhân và phép chia phân số",
                status: "locked",
                error_type: "conceptual",
                prerequisites: ["concept-2"],
                tasks: [
                  { type: "video", content_id: null, difficulty: null },
                  { type: "practice", content_id: null, difficulty: "deep" },
                ],
              },
              {
                id: "concept-4",
                concept_id: "concept-4",
                concept_name: "Tính chất cơ bản của phép nhân phân số",
                status: "locked",
                error_type: "careless",
                prerequisites: ["concept-3"],
                tasks: [
                  { type: "practice", content_id: null, difficulty: "quick" },
                ],
              },
            ]
          : [
              {
                id: "concept-1",
                concept_id: "concept-1",
                concept_name: "Cộng và trừ phân số",
                status: "completed",
                error_type: null,
                prerequisites: [],
                tasks: [
                  { type: "slide", content_id: null, difficulty: null },
                ],
              },
              {
                id: "concept-2",
                concept_id: "concept-2",
                concept_name: "Quy tắc dấu ngoặc với phân số",
                status: "unlocked",
                error_type: "careless",
                prerequisites: ["concept-1"],
                tasks: [
                  { type: "practice", content_id: null, difficulty: "quick" },
                ],
              },
              {
                id: "concept-3",
                concept_id: "concept-3",
                concept_name: "Hỗn số và số thập phân",
                status: "unlocked",
                error_type: "conceptual",
                prerequisites: ["concept-1"],
                tasks: [
                  { type: "video", content_id: null, difficulty: null },
                  { type: "practice", content_id: null, difficulty: "deep" },
                ],
              },
              {
                id: "concept-4",
                concept_id: "concept-4",
                concept_name: "Bài toán thực tế tìm giá trị phân số",
                status: "locked",
                error_type: "conceptual",
                prerequisites: ["concept-2", "concept-3"],
                tasks: [
                  { type: "video", content_id: null, difficulty: null },
                  { type: "slide", content_id: null, difficulty: null },
                  { type: "practice", content_id: null, difficulty: "deep" },
                ],
              },
            ],
      },
    };
  }

  try {
    return await fetchApi<LearningPathInstance>(`/learning-path/instance/${instanceId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error("Error in getLearningPathDetail, falling back to mock:", error);
    return {
      id: instanceId,
      trigger_type: "midterm",
      source: "auto",
      created_at: new Date().toISOString(),
      path_data: {
        critic_reasoning: "Học viên có một số lỗi hổng kiến thức cần củng cố.",
        milestones: [
          {
            id: "concept-1",
            concept_id: "concept-1",
            concept_name: "Phép nhân phân số",
            status: "unlocked",
            error_type: "conceptual",
            prerequisites: [],
            tasks: [{ type: "practice", content_id: null, difficulty: "deep" }],
          },
        ],
      },
    };
  }
}
