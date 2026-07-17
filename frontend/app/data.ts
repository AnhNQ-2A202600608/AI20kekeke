export const subjects = [
  { name: "Toán học", code: "TO", progress: 68, active: true },
  { name: "Ngữ văn", code: "NV", progress: 52, active: false },
  { name: "Tiếng Anh", code: "TA", progress: 74, active: false },
  { name: "Khoa học", code: "KH", progress: 41, active: false },
];

export const levelThemes = {
  beginner: { label: "Beginner", className: "level-beginner" },
  explorer: { label: "Explorer", className: "level-explorer" },
  challenger: { label: "Challenger", className: "level-challenger" },
  expert: { label: "Expert", className: "level-expert" },
  master: { label: "Master", className: "level-master" },
} as const;

export const tracks = [
  {
    title: "Bài 1: Phân số",
    description: "Bài học nền tảng gồm khái niệm, quy đồng, cộng trừ, nhân chia và bài kiểm tra tổng kết.",
    level: "explorer" as const,
    progress: 72,
    status: "active",
    lessons: 5,
    xp: 640,
  },
  {
    title: "Bài 2: Tỉ lệ thức",
    description: "Mở rộng từ phân số sang tỉ số, tính chất tỉ lệ thức và bài toán ứng dụng.",
    level: "explorer" as const,
    progress: 0,
    status: "locked",
    lessons: 5,
    xp: 720,
  },
  {
    title: "Bài 3: Biểu thức đại số",
    description: "Làm quen với biến, biểu thức, thay giá trị và rút gọn biểu thức theo từng mức.",
    level: "challenger" as const,
    progress: 0,
    status: "locked",
    lessons: 6,
    xp: 880,
  },
];

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
