import type { QuestionsData, TopicMetadata } from './types';

export const FALLBACK_DATA: QuestionsData = {
  sets: [
    {
      id: 'day1-basics',
      parent_id: 'day1',
      topic_title: 'Day 1: AI & LLM Foundation',
      title: 'Phần 1: Khái niệm cơ bản LLM',
      description: 'Lý thuyết nền tảng về Transformer, Tokenization và mô hình ngôn ngữ lớn.',
      difficulty: 'dễ',
      questions: [
        {
          id: 1,
          question: 'Kiến trúc nền tảng đứng sau sự bùng nổ của các Đại mô hình ngôn ngữ (LLM) hiện nay là gì?',
          options: {
            A: 'Kiến trúc mạng nơ-ron tích chập (CNN).',
            B: 'Kiến trúc mạng nơ-ron hồi quy (RNN).',
            C: 'Kiến trúc Transformer giới thiệu cơ chế Self-Attention.',
            D: 'Kiến trúc mạng bộ nhớ dài-ngắn (LSTM).',
          },
          answer: 'C',
          explanation: 'Kiến trúc Transformer giới thiệu cơ chế Self-Attention năm 2017 là nền móng cốt lõi cho các mô hình GPT, Claude, Gemini ngày nay nhờ khả năng xử lý song song và học ngữ cảnh vượt trội.',
        },
      ],
    },
  ],
};

export const TOPICS: TopicMetadata[] = [
  { id: 'day1', title: 'Day 1: AI & LLM Foundation', desc: 'Nắm vững Transformer, Tokenization, Embeddings và Inference Dynamics.' },
  { id: 'day2', title: 'Day 2: Xác định Bài toán cho AI', desc: 'Định hình bài toán, đánh giá tính khả thi, chiến lược dữ liệu và đo lường chất lượng.' },
  { id: 'day3', title: 'Day 3: Design Pattern ReAct', desc: 'Vòng lặp ReAct, Function Schema, an ninh Agent (Guardrails) và trace debugging.' },
  { id: 'day4', title: 'Day 4: Prompt Engineering & Tool Calling', desc: 'Context Engineering, Token Budget, JIT context và bảo mật Tool Calling.' },
  { id: 'day5', title: 'Day 5: Thiết kế sản phẩm AI cho sự không chắc chắn', desc: 'Thiết kế UX/UI cho sự bất định, Augmentation vs Automation, và bài toán tối ưu ROI.' },
  { id: 'day6', title: 'Day 6: Hackathon Day & Prototyping', desc: 'Lộ trình xây dựng sản phẩm mẫu (Prototype), tài liệu đặc tả và kỹ năng Demo Pitch.' },
  { id: 'day7', title: 'Day 7: Data Foundations - Embedding & Vector Store', desc: 'Kiến trúc bộ nhớ Agent, Embedding, Vector Indexing (HNSW, IVF) và thực hành RAG.' },
  { id: 'week1', title: 'Week 1: Ôn Tập Tổng Hợp', desc: 'Đề ôn tập tổng hợp toàn diện các nội dung đã học trong tuần thứ nhất.' },
  { id: 'day8', title: 'Day 8: RAG Pipeline - Retrieval — Augmentation — Generation', desc: 'Nắm vững kiến thức nền tảng về RAG, In-Context vs Fine-Tuning, Hybrid Search, Reranking và RAGAS Evaluation.' },
  { id: 'day9', title: 'Day 9: Multi-Agent Systems & Connected Architectures', desc: 'Kiến trúc điều phối (Orchestration), phân vai tác tử (Role playing), giao thức MCP và kết nối hệ thống.' },
  { id: 'day10', title: 'Day 10: Data Pipeline & Data Observability', desc: 'Chuỗi xử lý dữ liệu ETL/ELT, kỹ thuật trích xuất, làm sạch, kiểm soát chất lượng (Quality Gates) và giám sát (Observability).' },
  { id: 'day11', title: 'Day 11: Guardrails & AI Safety', desc: 'Các mối đe dọa bảo mật phổ biến, thiết lập bộ lọc Input/Output, quy trình HITL và Red Teaming.' },
  { id: 'day12', title: 'Day 12: Cloud Infrastructure & Deployment', desc: 'Kiến trúc hạ tầng đám mây, các nhà cung cấp, quản lý tài nguyên tính toán và triển khai Agent lên cloud.' },
  { id: 'day13', title: 'Day 13: Monitoring, Logging & Observability', desc: 'Ghi nhật ký cấu trúc JSON, theo dõi vết distributed tracing (OTel, Langfuse), thu thập metrics LLM và thiết lập cảnh báo SLO.' },
  { id: 'day14', title: 'Day 14: AI Evaluation & Benchmarking', desc: 'Xây dựng hệ thống đánh giá chất lượng AI, thiết lập Golden Dataset, cơ chế LLM-as-a-judge và kiểm thử hồi quy (RAGAS).' },
  { id: 'day15', title: 'Day 15: Real-World Deployment & Operating Cost', desc: 'Các yếu tố hạ tầng thực tế khi triển khai, FinOps tối ưu chi phí API (cache, routing) và chuẩn bị định hướng specialization.' },
  { id: 'day16', title: 'Day 16: Specialization Track Selection', desc: 'Đánh giá kiến trúc Capstone tổng hợp giai đoạn 2 và lựa chọn phân nhánh chuyên sâu (Product, Cloud, Agent Builder).' },
];

export const WEEKS = [
  {
    id: 'week1_sect',
    title: 'Tuần 1',
    subtitle: 'Nền Tảng AI & LLM & Prototyping',
    desc: 'Nắm vững Transformer, xác định bài toán AI, Prompt Engineering, Agent ReAct, Prototype, và Vector Store.',
    topics: ['day1', 'day2', 'day3', 'day4', 'day5', 'day6', 'day7', 'week1'],
    mascotSpeech: 'Chào mừng bạn đến với tuần đầu tiên! Hãy học tập thật tốt nhé.',
    mascotPose: 'hello' as const,
  },
  {
    id: 'week2_sect',
    title: 'Tuần 2',
    subtitle: 'RAG Pipeline & Multi-Agent',
    desc: 'Học cách xây dựng Vector Database, RAG thực tế, hệ thống Multi-Agent và triển khai sản phẩm AI lên môi trường production.',
    topics: ['day8', 'day9', 'day10', 'day11', 'day12', 'day13', 'day14', 'day15', 'day16'],
    mascotSpeech: 'Học cách xây dựng RAG nâng cao và Multi-Agent trong tuần này!',
    mascotPose: 'starting' as const,
  },
];

export const UNIT_STYLES: Record<string, { bg: string; border: string; text: string; lightBg: string }> = {
  day1: { bg: 'bg-emerald-500', border: 'border-emerald-600', text: 'text-emerald-600', lightBg: 'bg-emerald-50' },
  day2: { bg: 'bg-amber-500', border: 'border-amber-600', text: 'text-amber-600', lightBg: 'bg-amber-50' },
  day3: { bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-blue-600', lightBg: 'bg-blue-50' },
  day4: { bg: 'bg-rose-500', border: 'border-rose-600', text: 'text-rose-600', lightBg: 'bg-rose-50' },
  day5: { bg: 'bg-teal-500', border: 'border-teal-600', text: 'text-teal-600', lightBg: 'bg-teal-55' },
  day6: { bg: 'bg-orange-500', border: 'border-orange-600', text: 'text-orange-600', lightBg: 'bg-orange-50' },
  day7: { bg: 'bg-zinc-600', border: 'border-zinc-700', text: 'text-zinc-600', lightBg: 'bg-zinc-100' },
  week1: { bg: 'bg-sky-500', border: 'border-sky-600', text: 'text-sky-600', lightBg: 'bg-sky-50' },
  day8: { bg: 'bg-violet-500', border: 'border-violet-600', text: 'text-violet-600', lightBg: 'bg-violet-50' },
  day9: { bg: 'bg-indigo-500', border: 'border-indigo-600', text: 'text-indigo-600', lightBg: 'bg-indigo-50' },
  day10: { bg: 'bg-purple-500', border: 'border-purple-600', text: 'text-purple-600', lightBg: 'bg-purple-50' },
  day11: { bg: 'bg-cyan-500', border: 'border-cyan-600', text: 'text-cyan-600', lightBg: 'bg-cyan-50' },
  day12: { bg: 'bg-pink-500', border: 'border-pink-600', text: 'text-pink-600', lightBg: 'bg-pink-50' },
  day13: { bg: 'bg-emerald-600', border: 'border-emerald-700', text: 'text-emerald-700', lightBg: 'bg-emerald-50' },
  day14: { bg: 'bg-blue-600', border: 'border-blue-700', text: 'text-blue-700', lightBg: 'bg-blue-50' },
  day15: { bg: 'bg-rose-600', border: 'border-rose-700', text: 'text-rose-700', lightBg: 'bg-rose-50' },
  day16: { bg: 'bg-purple-600', border: 'border-purple-700', text: 'text-purple-700', lightBg: 'bg-purple-50' },
};
