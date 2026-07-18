export const subjects = [
  { name: "Toán học", code: "TO", progress: 68 },
  { name: "Ngữ văn", code: "NV", progress: 52 },
  { name: "Tiếng Anh", code: "TA", progress: 74 },
  { name: "Khoa học", code: "KH", progress: 41 },
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
    grade: "Lớp 7",
    goal: "Hoàn thành dạng Quy đồng mẫu số",
    assistantName: "Trợ giảng Toán",
    assistantPrompt: "Mình đang theo dõi Chương 1 · Phân số và số hữu tỉ. Cần mình gợi ý từng bước không?",
    accent: "math",
    chapters: [
      { number: "01", title: "Phân số và số hữu tỉ", summary: "Khái niệm phân số, quy đồng, phép tính và bài toán vận dụng.", progress: 62, types: 4, xp: 1640, active: true, unlock: "Đang học" },
      { number: "02", title: "Tỉ lệ thức", summary: "Tỉ số, tính chất tỉ lệ thức và các bài toán thực tế.", progress: 0, types: 2, xp: 1320, active: false, unlock: "Hoàn thành Chương 1 để mở khóa" },
      { number: "03", title: "Biểu thức đại số", summary: "Biến, biểu thức đại số và các phép biến đổi cơ bản.", progress: 0, types: 3, xp: 1480, active: false, unlock: "Hoàn thành Chương 2 để mở khóa" },
    ],
  },
  NV: {
    title: "Ngữ văn",
    grade: "Lớp 7",
    goal: "Viết dàn ý đoạn nghị luận ngắn",
    assistantName: "Trợ giảng Văn",
    assistantPrompt: "Mình có thể giúp bạn tìm luận điểm, dẫn chứng và sửa cách diễn đạt.",
    accent: "literature",
    chapters: [
      { number: "01", title: "Đọc hiểu văn bản", summary: "Nhận diện chủ đề, chi tiết quan trọng và thái độ của người viết.", progress: 52, types: 3, xp: 1320, active: true, unlock: "Đang học" },
      { number: "02", title: "Viết đoạn nghị luận", summary: "Luận điểm, dẫn chứng, liên kết câu và kết đoạn.", progress: 0, types: 3, xp: 1420, active: false, unlock: "Hoàn thành Chương 1 để mở khóa" },
      { number: "03", title: "Tiếng Việt thực hành", summary: "Từ loại, biện pháp tu từ và sắc thái biểu đạt.", progress: 0, types: 2, xp: 1180, active: false, unlock: "Hoàn thành Chương 2 để mở khóa" },
    ],
  },
  TA: {
    title: "Tiếng Anh",
    grade: "Lớp 7",
    goal: "Ôn Present Perfect qua 12 câu nhanh",
    assistantName: "English Coach",
    assistantPrompt: "I can help you compare tenses, fix mistakes, and practice short dialogues.",
    accent: "english",
    chapters: [
      { number: "01", title: "Tenses in context", summary: "Hiện tại đơn, tiếp diễn và hoàn thành trong tình huống quen thuộc.", progress: 74, types: 4, xp: 1500, active: true, unlock: "Đang học" },
      { number: "02", title: "Reading skills", summary: "Skimming, scanning và đoán nghĩa từ trong ngữ cảnh.", progress: 0, types: 3, xp: 1280, active: false, unlock: "Hoàn thành Chương 1 để mở khóa" },
      { number: "03", title: "Speaking missions", summary: "Hỏi đáp, trình bày ý kiến và phản hồi ngắn.", progress: 0, types: 3, xp: 1360, active: false, unlock: "Hoàn thành Chương 2 để mở khóa" },
    ],
  },
  KH: {
    title: "Khoa học",
    grade: "Lớp 7",
    goal: "Hoàn thành thí nghiệm ảo về lực",
    assistantName: "Trợ lý Khoa học",
    assistantPrompt: "Mình có thể mô phỏng hiện tượng, giải thích công thức và kiểm tra giả thuyết.",
    accent: "science",
    chapters: [
      { number: "01", title: "Lực và chuyển động", summary: "Quan sát lực, vận tốc và các tình huống thực nghiệm đơn giản.", progress: 41, types: 3, xp: 1260, active: true, unlock: "Đang học" },
      { number: "02", title: "Năng lượng quanh ta", summary: "Dạng năng lượng, chuyển hóa và bảo toàn trong đời sống.", progress: 0, types: 3, xp: 1380, active: false, unlock: "Hoàn thành Chương 1 để mở khóa" },
      { number: "03", title: "Hệ sinh thái", summary: "Chuỗi thức ăn, cân bằng sinh thái và tác động của con người.", progress: 0, types: 2, xp: 1180, active: false, unlock: "Hoàn thành Chương 2 để mở khóa" },
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
