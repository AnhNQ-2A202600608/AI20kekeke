export const subjects = [
  { name: "Toán học", code: "TO", progress: 68, courseId: "cf76850d-0738-50c3-bf34-1c464fa3b4d3" },
];

export const levelThemes = {
  beginner: { label: "Beginner", className: "level-beginner" },
  intermediate: { label: "Intermediate", className: "level-intermediate" },
  advanced: { label: "Advanced", className: "level-advanced" },
  master: { label: "Master", className: "level-master" },
  explorer: { label: "Intermediate", className: "level-intermediate" },
  challenger: { label: "Advanced", className: "level-advanced" },
  expert: { label: "Advanced", className: "level-advanced" },
} as const;

export const activeLearningLevel = {
  key: "intermediate" as const,
  name: "Intermediate",
  title: "Level 8 · Intermediate",
  description: "Nắm chắc nền tảng, đang tăng tốc lên Advanced",
  xp: 1840,
  nextXp: 2400,
  progress: 77,
  weeklyXp: 320,
  streak: 12,
};

export const subjectPrograms = {
  TO: {
    title: "Toán học",
    grade: "Lớp 6",
    goal: "Đạt chuẩn kiến thức Phân số",
    assistantName: "Trợ giảng Toán",
    assistantPrompt: "Mình đang theo dõi Chương VI · Phân số. Cần mình gợi ý từng bước không?",
    accent: "math",
    chapters: [
      { number: "01", title: "Tập hợp các số tự nhiên", summary: "Tập hợp, cách ghi số tự nhiên, các phép tính và lũy thừa.", progress: 0, types: 7, xp: 1400, active: true, unlock: "Đang học" },
      { number: "02", title: "Tính chia hết trong tập hợp các số tự nhiên", summary: "Quan hệ chia hết, dấu hiệu chia hết, số nguyên tố, ước chung và bội chung.", progress: 0, types: 5, xp: 1200, active: true, unlock: "Đang học" },
      { number: "03", title: "Số nguyên", summary: "Tập hợp số nguyên, các phép tính và quy tắc dấu ngoặc.", progress: 0, types: 5, xp: 1300, active: true, unlock: "Đang học" },
      { number: "04", title: "Một số hình phẳng trong thực tiễn", summary: "Tam giác đều, hình vuông, lục giác đều, hình chữ nhật, hình thoi, hình bình hành.", progress: 0, types: 3, xp: 1100, active: true, unlock: "Đang học" },
      { number: "05", title: "Tính đối xứng của hình phẳng trong tự nhiên", summary: "Trục đối xứng và tâm đối xứng của các hình phẳng.", progress: 0, types: 2, xp: 1000, active: true, unlock: "Đang học" },
      { number: "06", title: "Phân số", summary: "Khái niệm phân số, phân số bằng nhau, so sánh phân số và các phép tính phân số.", progress: 62, types: 5, xp: 1500, active: true, unlock: "Đang học" },
      { number: "07", title: "Số thập phân", summary: "Tính toán số thập phân, làm tròn, ước lượng và các bài toán tỉ số.", progress: 0, types: 4, xp: 1250, active: true, unlock: "Đang học" },
      { number: "08", title: "Những hình hình học cơ bản", summary: "Điểm, đường thẳng, tia, đoạn thẳng, trung điểm và góc.", progress: 0, types: 6, xp: 1350, active: true, unlock: "Đang học" },
      { number: "09", title: "Dữ liệu và xác suất thực nghiệm", summary: "Thu thập dữ liệu, biểu đồ tranh, biểu đồ cột, cột kép và xác suất thực nghiệm.", progress: 0, types: 6, xp: 1450, active: true, unlock: "Chương cuối" },
    ],
  },
} as const;

export const tracks = subjectPrograms.TO.chapters.map((chapter) => ({
  title: `Chương ${chapter.number}: ${chapter.title}`,
  description: chapter.summary,
  level: activeLearningLevel.key,
  progress: chapter.progress,
  status: chapter.active ? "active" : "locked",
  lessons: chapter.types,
  xp: chapter.xp,
}));

export const leaderboard = [
  { rank: 1, name: "Minh Anh", xp: 4820, accuracy: 92 },
  { rank: 2, name: "Bảo Trân", xp: 4590, accuracy: 89 },
  { rank: 3, name: "Hoàng Nam", xp: 4385, accuracy: 87, isUser: true },
  { rank: 4, name: "Gia Huy", xp: 4210, accuracy: 85 },
  { rank: 5, name: "Khánh Linh", xp: 3980, accuracy: 83 },
];

export const weeklyScores = [58, 66, 64, 72, 78, 76, 86];

export const skills = [
  { label: "Nhận biết khái niệm", value: 88 },
  { label: "Thực hiện phép tính", value: 76 },
  { label: "Vận dụng thực tế", value: 64 },
  { label: "Tốc độ làm bài", value: 71 },
];
