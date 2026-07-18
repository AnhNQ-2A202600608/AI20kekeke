'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Check,
  ChevronRight,
  Eye,
  FileText,
  Loader2,
  Plus,
  Sparkles,
  Upload,
  X,
  Database,
  Calendar,
  Layers,
  ArrowRight,
  Terminal,
  AlertCircle,
  Tag,
  Link2,
} from 'lucide-react';
import { isDemoMode } from '@/lib/demo-mode';
import { useBoundStore } from '@/hooks/useBoundStore';
import {
  fetchMaterials,
  fetchMaterialChunks,
  uploadMaterial,
  generateQuizzes,
  fetchConcepts,
  type ConceptOption
} from '@/lib/mentor/materials';

// Types aligning with Supabase schema context
export type DocumentStatus = 'indexed' | 'draft';
export type RelationStatus = 'pending' | 'approved' | 'rejected';
export type RelationType = 'Tiên quyết' | 'Đồng yêu cầu' | 'Mở rộng';
export type RelationSource = 'AI sinh' | 'Thủ công';
type WorkspaceTab = 'documents' | 'graph' | 'weakness-gen';

interface MockDocument {
  id: string;
  name: string;
  dayLabel: string;
  concept: string;
  conceptName: string;
  totalSlides: number;
  totalQuizGenerated: number;
  totalQuizPublished: number;
  status: DocumentStatus;
  uploadedAt: string;
  fileType: 'pdf' | 'pptx' | 'docx' | 'md';
}

interface GraphRelation {
  id: string;
  sourceSkill: string;
  targetSkill: string;
  relationType: RelationType;
  provenance: RelationSource;
  reviewStatus: RelationStatus;
}

// Initial Mock Documents matching RAG day contents
const INITIAL_DOCUMENTS: MockDocument[] = [
  {
    id: 'doc-day08-rag',
    name: 'Day 08 - Production RAG.pdf',
    dayLabel: 'Day 08',
    concept: 'd8-rag-pipeline',
    conceptName: 'RAG Pipeline',
    totalSlides: 42,
    totalQuizGenerated: 10,
    totalQuizPublished: 8,
    status: 'indexed',
    uploadedAt: '2026-06-13',
    fileType: 'pdf',
  },
  {
    id: 'doc-day04-prompt',
    name: 'Day 04 - Prompt Engineering.pdf',
    dayLabel: 'Day 04',
    concept: 'd4-prompt-engineering',
    conceptName: 'Prompt Engineering',
    totalSlides: 35,
    totalQuizGenerated: 8,
    totalQuizPublished: 6,
    status: 'indexed',
    uploadedAt: '2026-06-09',
    fileType: 'pdf',
  },
  {
    id: 'doc-day10-observability',
    name: 'Day 10 - Data Observability.pdf',
    dayLabel: 'Day 10',
    concept: 'd10-observability',
    conceptName: 'Data Observability',
    totalSlides: 28,
    totalQuizGenerated: 12,
    totalQuizPublished: 10,
    status: 'indexed',
    uploadedAt: '2026-06-15',
    fileType: 'pdf',
  },
  {
    id: 'doc-day01-foundations',
    name: 'Day 01 - AI & LLM Foundations.pdf',
    dayLabel: 'Day 01',
    concept: 'd1-ai-llm-foundations',
    conceptName: 'AI & LLM Foundations',
    totalSlides: 50,
    totalQuizGenerated: 15,
    totalQuizPublished: 15,
    status: 'indexed',
    uploadedAt: '2026-06-01',
    fileType: 'pdf',
  },
  {
    id: 'doc-day02-framing',
    name: 'Day 02 - Problem Framing.pdf',
    dayLabel: 'Day 02',
    concept: 'd2-ai-problem-framing',
    conceptName: 'AI Problem Framing',
    totalSlides: 24,
    totalQuizGenerated: 6,
    totalQuizPublished: 5,
    status: 'indexed',
    uploadedAt: '2026-06-04',
    fileType: 'pdf',
  },
];

const INITIAL_RELATIONS: GraphRelation[] = [
  {
    id: 'rel-1',
    sourceSkill: 'Embedding Vector Stores',
    targetSkill: 'RAG Pipelines',
    relationType: 'Tiên quyết',
    provenance: 'AI sinh',
    reviewStatus: 'pending',
  },
  {
    id: 'rel-2',
    sourceSkill: 'Context Engineering',
    targetSkill: 'Tool Calling Execution',
    relationType: 'Đồng yêu cầu',
    provenance: 'Thủ công',
    reviewStatus: 'approved',
  },
  {
    id: 'rel-3',
    sourceSkill: 'RAG Pipelines',
    targetSkill: 'Citation Validation',
    relationType: 'Mở rộng',
    provenance: 'AI sinh',
    reviewStatus: 'rejected',
  },
];

const SKILL_OPTIONS = [
  'Context Engineering',
  'RAG Pipelines',
  'Graph Reasoning',
  'Embedding Vector Stores',
  'Tool Calling Execution',
  'Citation Validation',
];

const CONCEPT_OPTIONS = [
  { code: 'd8-rag-pipeline', name: 'RAG Pipeline' },
  { code: 'd4-prompt-engineering', name: 'Prompt Engineering' },
  { code: 'd10-observability', name: 'Data Observability' },
  { code: 'd1-ai-llm-foundations', name: 'AI & LLM Foundations' },
  { code: 'd2-ai-problem-framing', name: 'AI Problem Framing' },
];

const MOCK_DOCUMENT_CHUNKS: Record<string, Array<{ page: number; title: string; text: string }>> = {
  'doc-day08-rag': [
    { page: 1, title: 'Production RAG Overview', text: 'Giới thiệu về Retrieval-Augmented Generation trong môi trường doanh nghiệp. Các thách thức chính khi chuyển từ bản thử nghiệm sang hệ thống chịu tải thật.' },
    { page: 2, title: 'Page-level Chunking Strategy', text: 'Chiến thuật cắt mảnh dữ liệu theo trang PDF. Một trang slide được biểu diễn như một chunk độc lập để bảo toàn tính toàn vẹn thông tin và ngữ cảnh trực quan.' },
    { page: 14, title: 'Metadata Filters & Semantic Search', text: 'Metadata filters narrow the candidate pool before semantic search to improve relevance and reduce noisy retrieval. Tận dụng thuộc tính slide và concept code.' },
    { page: 20, title: 'Evaluation with Ragas', text: 'Đánh giá chất lượng RAG thông qua các chỉ số: faithfulness, answer relevance, context recall, và context precision.' },
  ],
  'doc-day04-prompt': [
    { page: 1, title: 'Prompt & Instruction Design', text: 'Kỹ thuật thiết kế prompt nâng cao. Cấu trúc system instruction rõ ràng, cung cấp định dạng đầu ra mong muốn dưới dạng JSON schema.' },
    { page: 12, title: 'Function Calling Mechanism', text: 'Cơ chế mô hình ngôn ngữ lớn gọi hàm hệ thống bằng cách trả về một cấu trúc JSON khớp chính xác với khai báo schema.' },
    { page: 22, title: 'Tool Affordances', text: 'The model performs better when tool affordances, JSON schema, and invocation criteria are explicit. Cung cấp mô tả chi tiết cho từng công cụ.' },
  ],
  'doc-day10-observability': [
    { page: 1, title: 'Observability & Monitoring', text: 'Giám sát vận hành các ứng dụng LLM trong production. Theo dõi latency, tokens consumed, cost, và trace chi tiết từng bước.' },
    { page: 11, title: 'Batch Success Rate Metrics', text: 'Batch success rate is a leading operational metric for ingest stability because it captures failures early in the pipeline.' },
  ],
};

const QUIZ_GEN_LOGS = [
  '[AI Engine] Khởi chạy đường ống sinh câu hỏi trắc nghiệm tự động...',
  '[Retriever] Đang phân tích mức độ đậm đặc tri thức của các slide...',
  '[Retriever] Đã chọn 5 slide mục tiêu có chứa mã concept quan trọng.',
  '[Generator] Đang gọi mô hình GPT-4o để sinh bản nháp câu hỏi...',
  '[Generator] Đang tối ưu hóa các đáp án gây nhiễu (distractors)...',
  '[Socratic Engine] Đang xây dựng bộ 3 cấp độ gợi ý Socratic (nhẹ, trung bình, sâu)...',
  '[Validator] Đang kiểm tra tính hợp lệ của schema dữ liệu câu hỏi...',
  '🎉 [Thành công] Đã tạo thành công 5 câu hỏi nháp trong hàng chờ duyệt!',
];

const UPLOAD_LOGS = [
  '[System] Đang kết nối kênh truyền tải tệp tin an toàn...',
  '[Parser] Đã tải lên tệp tin thành công! Bắt đầu trích xuất cấu trúc slide...',
  '[Parser] Đang chạy công cụ đọc và chuẩn hóa văn bản (Page-level PDF parsing)...',
  '[Parser] Đã trích xuất cấu trúc văn bản: Tìm thấy 20 trang slide.',
  '[Embedding] Đang chuyển đổi nội dung slide thành vector (OpenAI text-embedding-3-small)...',
  '[VectorDB] Đang lưu trữ 20 slide embeddings vào cơ sở dữ liệu pgvector trên Supabase...',
  '🎉 [Thành công] Đã lập chỉ mục tài liệu và đồng bộ đồ thị tri thức hoàn tất!',
];

export interface IngestionTabProps {
  onNavigateToQuizEditor?: (sourceDocName?: string) => void;
}

export const IngestionTab: React.FC<IngestionTabProps> = ({ onNavigateToQuizEditor }) => {
  const demoMode = isDemoMode();
  const token = useBoundStore((s) => s.token);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<WorkspaceTab>('documents');
  const [documents, setDocuments] = useState<MockDocument[]>(demoMode ? INITIAL_DOCUMENTS : []);
  const [relations, setRelations] = useState<GraphRelation[]>(demoMode ? INITIAL_RELATIONS : []);
  const [relationFilter, setRelationFilter] = useState<'all' | RelationStatus>('all');

  // New relation state
  const [newRelation, setNewRelation] = useState<{
    sourceSkill: string;
    targetSkill: string;
    relationType: RelationType;
  }>({
    sourceSkill: SKILL_OPTIONS[0],
    targetSkill: SKILL_OPTIONS[1],
    relationType: 'Tiên quyết',
  });

  // Slide Chunks Drawer state
  const [selectedDocForChunks, setSelectedDocForChunks] = useState<MockDocument | null>(null);
  const [realChunks, setRealChunks] = useState<any[]>([]);
  const [isLoadingChunks, setIsLoadingChunks] = useState(false);

  // AI Quiz Gen Drawer state
  const [selectedDocForQuizGen, setSelectedDocForQuizGen] = useState<MockDocument | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizGenProgress, setQuizGenProgress] = useState(0);
  const [quizGenLogs, setQuizGenLogs] = useState<string[]>([]);
  const [quizGenCompleted, setQuizGenCompleted] = useState(false);
  const [quizGenParams, setQuizGenParams] = useState({
    numQuestions: 5,
    difficulty: 'bình thường',
    socraticHints: true,
  });

  const [isLiveMode, setIsLiveMode] = useState(false);
  const [promptOverride, setPromptOverride] = useState('');
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [selectedConceptCode, setSelectedConceptCode] = useState('');

  // Weakness targeted Quiz Gen state
  const [students, setStudents] = useState<any[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [weakConcepts, setWeakConcepts] = useState<any[]>([]);
  const [isLoadingWeakConcepts, setIsLoadingWeakConcepts] = useState(false);
  const [selectedConceptForGen, setSelectedConceptForGen] = useState<string>('');
  const [isGeneratingWeaknessQuiz, setIsGeneratingWeaknessQuiz] = useState(false);
  const [weaknessProgress, setWeaknessProgress] = useState(0);
  const [weaknessLogs, setWeaknessLogs] = useState<string[]>([]);
  const [weaknessCompleted, setWeaknessCompleted] = useState(false);
  const [weaknessParams, setWeaknessParams] = useState({
    numQuestions: 5,
    difficulty: 'bình thường',
    socraticHints: true,
    isLiveMode: false,
    promptOverride: '',
  });
  const [showWeaknessPromptEditor, setShowWeaknessPromptEditor] = useState(false);

  const DEFAULT_VIETNAMESE_QUIZ_PROMPT = `Bạn là chuyên gia thiết kế chương trình học và chuyên gia khảo thí theo Chương trình Giáo dục Phổ thông 2018 (CT GDPT 2018) của Việt Nam.
Hãy tạo ra đúng {num_questions} câu hỏi trắc nghiệm khách quan (MCQ) dựa TRÊN DUY NHẤT nội dung các trang slide bài giảng dưới đây.

Khái niệm mục tiêu: {concept_name} (Mã concept: {concept_code})
Mức độ nhận thức mục tiêu (Độ khó): {difficulty} (dễ: Nhận biết, bình thường: Thông hiểu, khó: Vận dụng/Vận dụng cao)

Nội dung slide bài giảng:
{slides_content}

Yêu cầu đối với mỗi câu hỏi MCQ:
1. Câu hỏi phải kiểm tra đúng chuẩn đầu ra năng lực của khái niệm mục tiêu, bám sát kiến thức thực tế được trình bày trong các trang slide.
2. Câu hỏi phải sử dụng ngôn ngữ Tiếng Việt chuẩn sư phạm, diễn đạt trong sáng, dễ hiểu, phù hợp với lứa tuổi học sinh phổ thông Việt Nam.
3. Cung cấp đúng 4 phương án lựa chọn: A, B, C, và D. Các phương án sai (distractors) phải là các lỗi tư duy hoặc hiểu lầm phổ biến mà học sinh Việt Nam thường mắc phải liên quan đến bài học.
4. Cung cấp lời giải thích chi tiết, thuyết phục tại sao phương án đúng là đúng, và tại sao các phương án khác lại sai, chỉ rõ căn cứ từ nội dung slide.
5. Ngôn ngữ câu hỏi, các lựa chọn và lời giải thích BẮT BUỘC phải viết hoàn toàn bằng Tiếng Việt.

Định dạng đầu ra là một mảng JSON hợp lệ gồm các đối tượng, trong đó mỗi đối tượng có các khóa sau (tên khóa giữ nguyên tiếng Anh để khớp hệ thống):
{{
  "prompt": "Nội dung câu hỏi bằng tiếng Việt...",
  "options": {{
    "A": "Nội dung phương án A...",
    "B": "Nội dung phương án B...",
    "C": "Nội dung phương án B...",
    "D": "Nội dung phương án D..."
  }},
  "correct_option": "A" | "B" | "C" | "D",
  "explanation": "Lời giải thích chi tiết bằng tiếng Việt..."
}}

Tuyệt đối không bao quanh đầu ra bằng các ký tự định dạng markdown (như \`\`\`json), chỉ trả về duy nhất chuỗi JSON thô.`;

  // Fetch students list on activeWorkspaceTab weakness-gen
  useEffect(() => {
    if (activeWorkspaceTab !== 'weakness-gen') return;
    const fetchStudents = async () => {
      setIsLoadingStudents(true);
      try {
        const response = await fetch(
          '/api/v1/adaptive/class-insights?course_id=00000000-0000-0000-0000-000000000001&limit=100',
          { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
        );
        if (response.ok) {
          const data = await response.json();
          setStudents(data.students || []);
        } else {
          // fallback mock students
          setStudents([
            { id: 'student-1', full_name: 'Nguyễn Văn A', email: '2a202600001@edugap.vn', average_elo: 1150 },
            { id: 'student-2', full_name: 'Trần Thị B', email: '2a202600002@edugap.vn', average_elo: 980 },
            { id: 'student-3', full_name: 'Phạm Văn C', email: '2a202600003@edugap.vn', average_elo: 1250 },
          ]);
        }
      } catch (err) {
        console.error('Failed to fetch students:', err);
        setStudents([
          { id: 'student-1', full_name: 'Nguyễn Văn A', email: '2a202600001@edugap.vn', average_elo: 1150 },
          { id: 'student-2', full_name: 'Trần Thị B', email: '2a202600002@edugap.vn', average_elo: 980 },
          { id: 'student-3', full_name: 'Phạm Văn C', email: '2a202600003@edugap.vn', average_elo: 1250 },
        ]);
      } finally {
        setIsLoadingStudents(false);
      }
    };
    fetchStudents();
  }, [activeWorkspaceTab, token]);

  // Load weak concepts when selected student changes
  useEffect(() => {
    if (!selectedStudentId) {
      setWeakConcepts([]);
      return;
    }
    const fetchWeakConcepts = async () => {
      setIsLoadingWeakConcepts(true);
      try {
        const response = await fetch(
          `/api/v1/adaptive/mastery?student_id=${selectedStudentId}&course_id=00000000-0000-0000-0000-000000000001`,
          { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
        );
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            const weak = data.filter((item: any) => item.mastery_state === 'weak' || item.weakness_flag === true);
            setWeakConcepts(weak);
          }
        } else {
          // fallback mock weak concepts
          setWeakConcepts([
            { concept_id: 'c1', concept_code: 'd8-rag-pipeline', concept_name: 'RAG Pipeline', elo_score: 950 },
            { concept_id: 'c2', concept_code: 'd4-prompt-engineering', concept_name: 'Prompt Engineering', elo_score: 980 },
          ]);
        }
      } catch (err) {
        console.error('Failed to fetch weak concepts:', err);
        setWeakConcepts([
          { concept_id: 'c1', concept_code: 'd8-rag-pipeline', concept_name: 'RAG Pipeline', elo_score: 950 },
          { concept_id: 'c2', concept_code: 'd4-prompt-engineering', concept_name: 'Prompt Engineering', elo_score: 980 },
        ]);
      } finally {
        setIsLoadingWeakConcepts(false);
      }
    };
    fetchWeakConcepts();
  }, [selectedStudentId, token]);

  // Sync selectedConceptCode with selectedDocForQuizGen concept code
  useEffect(() => {
    if (selectedDocForQuizGen) {
      setSelectedConceptCode(selectedDocForQuizGen.concept);
    } else {
      setSelectedConceptCode('');
    }
  }, [selectedDocForQuizGen]);

  // Trigger targeted weakness quiz generation
  const runWeaknessQuizGen = async () => {
    const selectedConceptObj = weakConcepts.find((c) => c.concept_code === selectedConceptForGen);
    const conceptName = selectedConceptObj?.concept_name || selectedConceptForGen;

    if (!weaknessParams.isLiveMode) {
      setIsGeneratingWeaknessQuiz(true);
      setWeaknessProgress(0);
      setWeaknessLogs([]);
      setWeaknessCompleted(false);

      const mockLogs = [
        '[System] Đang bắt đầu luồng sinh câu hỏi mục tiêu cá nhân hóa cho học viên...',
        `[Mastery] Đã phân tích thấy concept [${conceptName}] thuộc diện yếu (Cần củng cố).`,
        `[RAG] Đang truy vấn slide bài giảng tương thích cho concept [${selectedConceptForGen}] từ Database...`,
        `[LLM Generator] Đang phân tích và tạo câu hỏi kèm 3 mức độ gợi ý Socratic (tiếng Việt)...`,
        '[Validator] Đang kiểm tra cấu trúc JSON schema câu hỏi...',
        `🎉 [Thành công] Đã tạo thành công ${weaknessParams.numQuestions} câu hỏi nháp khắc phục điểm yếu!`,
      ];

      let logIndex = 0;
      const interval = setInterval(() => {
        if (logIndex < mockLogs.length) {
          setWeaknessLogs((prev) => [...prev, mockLogs[logIndex]]);
          setWeaknessProgress((prev) => Math.min(prev + 18, 90));
          logIndex++;
        } else {
          clearInterval(interval);
          setWeaknessProgress(100);
          setWeaknessCompleted(true);
          setIsGeneratingWeaknessQuiz(false);
        }
      }, 600);
      return;
    }

    setIsGeneratingWeaknessQuiz(true);
    setWeaknessProgress(0);
    setWeaknessLogs(['[Live Mode] Bắt đầu kết nối FastAPI backend và Supabase...', '[Live Mode] Đang kiểm tra thông tin học viên và concept yếu...']);
    setWeaknessCompleted(false);

    try {
      setWeaknessProgress(20);
      setWeaknessLogs((prev) => [...prev, `[Live Mode] Đang gửi yêu cầu sinh ${weaknessParams.numQuestions} câu hỏi cho concept [${selectedConceptForGen}]...`]);
      
      const { generateQuizzesForWeakness } = await import('@/lib/mentor/materials');
      
      await generateQuizzesForWeakness(
        {
          studentId: selectedStudentId,
          conceptCode: selectedConceptForGen,
          numQuestions: weaknessParams.numQuestions,
          difficulty: weaknessParams.difficulty,
          socraticHints: weaknessParams.socraticHints,
          promptOverride: weaknessParams.promptOverride || undefined,
        },
        token
      );

      setWeaknessProgress(70);
      setWeaknessLogs((prev) => [...prev, '[Live Mode] Background pipeline đã bắt đầu chạy trên server.', '[Live Mode] Đang đồng bộ hóa câu hỏi nháp vào CSDL Supabase...']);
      
      setTimeout(() => {
        setWeaknessProgress(100);
        setWeaknessCompleted(true);
        setIsGeneratingWeaknessQuiz(false);
        setWeaknessLogs((prev) => [...prev, '🎉 [Thành công] Đã hoàn thành kích hoạt sinh câu hỏi trên Live DB! Vui lòng chuyển sang tab Quản lý quiz để duyệt.']);
      }, 1500);

    } catch (err) {
      console.error('Failed to generate weakness quizzes:', err);
      setWeaknessLogs((prev) => [...prev, `[Error] Có lỗi xảy ra: ${err instanceof Error ? err.message : String(err)}`]);
      setIsGeneratingWeaknessQuiz(false);
    }
  };

  // Concept Options state (fallback to static CONCEPT_OPTIONS in demo mode)
  const [conceptOptions, setConceptOptions] = useState<Array<{ code: string; name: string }>>(CONCEPT_OPTIONS);

  // Document Upload Ingestion Drawer state
  const [isUploadDrawerOpen, setIsUploadDrawerOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadLogs, setUploadLogs] = useState<string[]>([]);
  const [uploadPhase, setUploadPhase] = useState<'idle' | 'running' | 'completed'>('idle');
  const [uploadForm, setUploadForm] = useState({
    name: '',
    dayLabel: 'Day 01',
    conceptCode: 'd1-ai-llm-foundations',
    file: null as File | null,
    fileName: '',
  });

  // Load concepts from backend when not in demo mode
  useEffect(() => {
    if (demoMode) return;
    const loadConcepts = async () => {
      try {
        const data = await fetchConcepts();
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((c) => ({ code: c.code, name: c.name }));
          setConceptOptions(mapped);
          setUploadForm((prev) => ({
            ...prev,
            conceptCode: mapped[0].code,
          }));
        }
      } catch (err) {
        console.error('Failed to fetch concepts:', err);
      }
    };
    loadConcepts();
  }, [demoMode]);

  // Load materials from backend when not in demo mode
  useEffect(() => {
    if (demoMode) return;
    const loadMaterials = async () => {
      try {
        const data = await fetchMaterials();
        setDocuments(data);
      } catch (err) {
        console.error('Failed to fetch materials:', err);
      }
    };
    loadMaterials();
  }, [demoMode]);

  // Load chunks from backend when selectedDocForChunks changes and not in demo mode
  useEffect(() => {
    if (demoMode || !selectedDocForChunks) {
      setRealChunks([]);
      return;
    }
    const loadChunks = async () => {
      setIsLoadingChunks(true);
      try {
        const data = await fetchMaterialChunks(selectedDocForChunks.name);
        setRealChunks(data.chunks || []);
      } catch (err) {
        console.error('Failed to fetch chunks:', err);
      } finally {
        setIsLoadingChunks(false);
      }
    };
    loadChunks();
  }, [selectedDocForChunks, demoMode]);

  // Simulated Quiz Generation Pipeline
  const runQuizGenMock = () => {
    if (!selectedDocForQuizGen) return;
    setIsGeneratingQuiz(true);
    setQuizGenProgress(0);
    setQuizGenLogs([]);
    setQuizGenCompleted(false);

    let logIndex = 0;
    const interval = setInterval(() => {
      if (logIndex < QUIZ_GEN_LOGS.length) {
        setQuizGenLogs((prev) => [...prev, QUIZ_GEN_LOGS[logIndex]]);
        setQuizGenProgress((prev) => Math.min(prev + 13, 90));
        logIndex++;
      } else {
        clearInterval(interval);
        setQuizGenProgress(100);
        setQuizGenCompleted(true);
        setIsGeneratingQuiz(false);

        // Update document statistics locally
        setDocuments((prevDocs) =>
          prevDocs.map((d) =>
            d.id === selectedDocForQuizGen.id
              ? {
                  ...d,
                  totalQuizGenerated: d.totalQuizGenerated + quizGenParams.numQuestions,
                }
              : d
          )
        );
      }
    }, 550);
  };

  const runQuizGen = async () => {
    if (!isLiveMode && demoMode) {
      runQuizGenMock();
      return;
    }

    if (!selectedDocForQuizGen) return;
    setIsGeneratingQuiz(true);
    setQuizGenProgress(0);
    setQuizGenLogs([]);
    setQuizGenCompleted(false);

    try {
      // Simulate progress logs on frontend
      let logIndex = 0;
      const interval = setInterval(() => {
        if (logIndex < QUIZ_GEN_LOGS.length) {
          setQuizGenLogs((prev) => [...prev, QUIZ_GEN_LOGS[logIndex]]);
          setQuizGenProgress((prev) => Math.min(prev + 13, 90));
          logIndex++;
        }
      }, 550);

      await generateQuizzes(selectedDocForQuizGen.name, {
        numQuestions: quizGenParams.numQuestions,
        difficulty: quizGenParams.difficulty,
        socraticHints: quizGenParams.socraticHints,
        conceptCode: selectedConceptCode || selectedDocForQuizGen.concept,
        promptOverride: promptOverride || undefined,
      }, token);

      clearInterval(interval);
      setQuizGenProgress(100);
      setQuizGenCompleted(true);

      // Re-fetch materials list
      const data = await fetchMaterials(token);
      setDocuments(data);
    } catch (err) {
      console.error('Failed to generate quizzes:', err);
      setQuizGenLogs((prev) => [...prev, `[Error] Có lỗi xảy ra: ${err instanceof Error ? err.message : String(err)}`]);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // Simulated Ingest Document Pipeline
  const runUploadMock = () => {
    if (!uploadForm.name || !uploadForm.fileName) return;
    setIsUploading(true);
    setUploadProgress(0);
    setUploadLogs([]);
    setUploadPhase('running');

    let logIndex = 0;
    const interval = setInterval(() => {
      if (logIndex < UPLOAD_LOGS.length) {
        setUploadLogs((prev) => [...prev, UPLOAD_LOGS[logIndex]]);
        setUploadProgress((prev) => Math.min(prev + 15, 95));
        logIndex++;
      } else {
        clearInterval(interval);
        setUploadProgress(100);
        setUploadPhase('completed');
        setIsUploading(false);

        // Add document to list
        const matchedConcept = conceptOptions.find((c) => c.code === uploadForm.conceptCode);
        const newDoc: MockDocument = {
          id: `doc-${Date.now()}`,
          name: uploadForm.name.endsWith('.pdf') ? uploadForm.name : `${uploadForm.name}.pdf`,
          dayLabel: uploadForm.dayLabel,
          concept: uploadForm.conceptCode,
          conceptName: matchedConcept ? matchedConcept.name : 'Unknown Concept',
          totalSlides: Math.floor(Math.random() * 20) + 15,
          totalQuizGenerated: 0,
          totalQuizPublished: 0,
          status: 'indexed',
          uploadedAt: new Date().toISOString().split('T')[0],
          fileType: 'pdf',
        };

        setDocuments((prev) => [newDoc, ...prev]);
      }
    }, 600);
  };

  const runUpload = async () => {
    if (demoMode) {
      runUploadMock();
      return;
    }

    if (!uploadForm.file) return;
    setIsUploading(true);
    setUploadProgress(0);
    setUploadLogs([]);
    setUploadPhase('running');

    try {
      // Simulate progress logs on frontend
      let logIndex = 0;
      const interval = setInterval(() => {
        if (logIndex < UPLOAD_LOGS.length) {
          setUploadLogs((prev) => [...prev, UPLOAD_LOGS[logIndex]]);
          setUploadProgress((prev) => Math.min(prev + 15, 95));
          logIndex++;
        }
      }, 600);

      await uploadMaterial(uploadForm.file);

      clearInterval(interval);
      setUploadProgress(100);
      setUploadPhase('completed');

      // Re-fetch materials list
      const data = await fetchMaterials();
      setDocuments(data);
    } catch (err) {
      console.error('Failed to upload material:', err);
      setUploadLogs((prev) => [...prev, `[Error] Có lỗi xảy ra: ${err instanceof Error ? err.message : String(err)}`]);
    } finally {
      setIsUploading(false);
    }
  };

  const updateRelationStatus = (id: string, nextStatus: RelationStatus) => {
    setRelations((current) =>
      current.map((item) => (item.id === id ? { ...item, reviewStatus: nextStatus } : item))
    );
  };

  const addRelation = () => {
    setRelations((current) => [
      {
        id: `rel-${Date.now()}`,
        ...newRelation,
        provenance: 'Thủ công',
        reviewStatus: 'pending',
      },
      ...current,
    ]);
  };

  const relationCounts = useMemo(
    () => ({
      pending: relations.filter((item) => item.reviewStatus === 'pending').length,
      approved: relations.filter((item) => item.reviewStatus === 'approved').length,
      rejected: relations.filter((item) => item.reviewStatus === 'rejected').length,
    }),
    [relations]
  );

  const visibleRelations = useMemo(() => {
    if (relationFilter === 'all') return relations;
    return relations.filter((item) => item.reviewStatus === relationFilter);
  }, [relationFilter, relations]);

  const getFileTypeColor = (fileType: MockDocument['fileType']) => {
    switch (fileType) {
      case 'pptx':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'docx':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'md':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-stone-100 text-stone-600 border-stone-200';
    }
  };

  return (
    <div className="space-y-6 font-be-vietnam-pro relative overflow-x-hidden">
      {/* Tab Switch & Top Header */}
      <section className="rounded-3xl border-2 border-gray-border bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-widest text-stone-400">
              Quản trị học liệu
            </p>
            <h3 className="font-fraunces text-lg font-black text-on-background">
              Không Gian Tri Thức Giảng Viên
            </h3>
            <p className="mt-1 text-xs font-medium text-stone-500">
              Quản lý tài liệu học tập, lập chỉ mục RAG, và duyệt các mối quan hệ đồ thị kiến thức.
            </p>
          </div>

          <div className="flex rounded-2xl border border-gray-border bg-stone-50 p-1 self-start md:self-auto">
            <button
              onClick={() => setActiveWorkspaceTab('documents')}
              className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wide transition-all ${
                activeWorkspaceTab === 'documents'
                  ? 'border border-stone-200 bg-white text-primary-green-dark shadow-sm'
                  : 'text-stone-500'
              }`}
            >
              📚 Thư viện tài liệu
            </button>
            <button
              onClick={() => setActiveWorkspaceTab('graph')}
              className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wide transition-all ${
                activeWorkspaceTab === 'graph'
                  ? 'border border-stone-200 bg-white text-primary-green-dark shadow-sm'
                  : 'text-stone-500'
              }`}
            >
              🕸️ Đồ thị tri thức
            </button>
            <button
              onClick={() => setActiveWorkspaceTab('weakness-gen')}
              className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wide transition-all ${
                activeWorkspaceTab === 'weakness-gen'
                  ? 'border border-stone-200 bg-white text-primary-green-dark shadow-sm'
                  : 'text-stone-500'
              }`}
            >
              🎯 Sinh theo điểm yếu
            </button>
          </div>
        </div>
      </section>

      {activeWorkspaceTab === 'documents' ? (
        <div className="space-y-6">
          {/* Document Table Workspace */}
          <section className="rounded-3xl border-2 border-gray-border bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-4 mb-5 gap-3">
              <div>
                <h4 className="text-sm font-black text-on-background uppercase tracking-tight">
                  Tài liệu giảng dạy hiện hữu
                </h4>
                <p className="text-[11px] text-stone-400 font-semibold mt-0.5">
                  Tải lên tài liệu mới hoặc chọn tài liệu sẵn có để yêu cầu AI tạo bộ câu hỏi luyện tập.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setUploadPhase('idle');
                  setIsUploadDrawerOpen(true);
                }}
                className="btn-3d btn-green text-[10px] flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                Thêm tài liệu
              </button>
            </div>

            {/* Document Table / Cards List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b-2 border-stone-100 text-[10px] font-black uppercase tracking-widest text-stone-400">
                    <th className="py-3 px-2">Tên tài liệu</th>
                    <th className="py-3 px-2 text-center">Trang / Chunks</th>
                    <th className="py-3 px-2">Ngày nạp</th>
                    <th className="py-3 px-2">Concept liên kết</th>
                    <th className="py-3 px-2 text-center">Trạng thái Quiz</th>
                    <th className="py-3 px-2 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="group hover:bg-stone-50/50 transition-colors">
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-xl border flex items-center justify-center font-black text-[9px] uppercase font-mono ${getFileTypeColor(doc.fileType)}`}>
                            {doc.fileType}
                          </div>
                          <div>
                            <span className="text-xs font-black text-stone-800 line-clamp-1">
                              {doc.name}
                            </span>
                            <span className="text-[10px] font-black text-stone-400 uppercase font-mono bg-stone-100 px-1.5 py-0.5 rounded-md mt-1 inline-block">
                              {doc.dayLabel}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-center font-mono text-xs font-bold text-stone-600">
                        {doc.totalSlides}
                      </td>
                      <td className="py-4 px-2 font-mono text-[11px] font-bold text-stone-500">
                        {doc.uploadedAt}
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex flex-col">
                          <span className="text-xs font-extrabold text-stone-700">
                            {doc.conceptName}
                          </span>
                          <span className="text-[9px] font-mono font-bold text-stone-400 mt-0.5">
                            #{doc.concept}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-xs font-black text-stone-800">
                            {doc.totalQuizGenerated} câu
                          </span>
                          {doc.totalQuizGenerated > 0 && (
                            <span className="text-[9px] font-bold text-primary-green-dark bg-primary-green/10 px-1.5 py-0.5 rounded-full mt-0.5">
                              Đã duyệt: {doc.totalQuizPublished}/{doc.totalQuizGenerated}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedDocForChunks(doc)}
                            className="inline-flex items-center justify-center p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-all"
                            title="Xem chunks chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDocForQuizGen(doc);
                              setQuizGenCompleted(false);
                              setQuizGenLogs([]);
                              setQuizGenProgress(0);
                            }}
                            className="btn-3d btn-white text-[10px] py-1.5 px-3 flex items-center gap-1 hover:border-primary-green/30"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-primary-green" />
                            <span>Sinh Quiz AI</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : activeWorkspaceTab === 'graph' ? (
        /* Knowledge Graph Sub-tab */
        <section className="rounded-3xl border-2 border-gray-border bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between border-b border-stone-100 pb-4 mb-5 gap-3">
            <div>
              <h4 className="text-sm font-black text-on-background uppercase tracking-tight">
                Duyệt mối quan hệ đồ thị tri thức
              </h4>
              <p className="text-[11px] text-stone-400 font-semibold mt-0.5">
                Xem và phê duyệt các mối tương quan tri thức được sinh từ AI hoặc định nghĩa thủ công.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-1.5 self-start md:self-auto">
              <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-amber-700">
                Chờ duyệt: {relationCounts.pending}
              </span>
              <span className="rounded-full border border-primary-green/20 bg-primary-green/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-primary-green-dark">
                Đã duyệt: {relationCounts.approved}
              </span>
              <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-rose-700">
                Từ chối: {relationCounts.rejected}
              </span>
            </div>
          </div>

          {/* Add Relation Box */}
          <div className="rounded-2xl border-2 border-gray-border bg-stone-50/50 p-4 space-y-3 mb-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-stone-400">Khái niệm nguồn</label>
                <select
                  value={newRelation.sourceSkill}
                  onChange={(e) => setNewRelation((prev) => ({ ...prev, sourceSkill: e.target.value }))}
                  className="w-full rounded-xl border border-stone-200 p-2 text-xs font-bold text-stone-700 bg-white"
                >
                  {SKILL_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-center pt-4 md:pt-0">
                <ArrowRight className="w-5 h-5 text-stone-400 rotate-90 md:rotate-0" />
              </div>

              <div className="flex-1 space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-stone-400">Khái niệm đích</label>
                <select
                  value={newRelation.targetSkill}
                  onChange={(e) => setNewRelation((prev) => ({ ...prev, targetSkill: e.target.value }))}
                  className="w-full rounded-xl border border-stone-200 p-2 text-xs font-bold text-stone-700 bg-white"
                >
                  {SKILL_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-stone-400">Loại quan hệ</label>
                <select
                  value={newRelation.relationType}
                  onChange={(e) =>
                    setNewRelation((prev) => ({ ...prev, relationType: e.target.value as RelationType }))
                  }
                  className="w-full rounded-xl border border-stone-200 p-2 text-xs font-bold text-stone-700 bg-white"
                >
                  <option value="Tiên quyết">Tiên quyết</option>
                  <option value="Đồng yêu cầu">Đồng yêu cầu</option>
                  <option value="Mở rộng">Mở rộng</option>
                </select>
              </div>

              <div className="pt-4 md:pt-4 self-end">
                <button
                  type="button"
                  onClick={addRelation}
                  className="btn-3d btn-green text-[10px] py-2 px-4 whitespace-nowrap flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Thêm mối quan hệ
                </button>
              </div>
            </div>
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap gap-1.5 mb-5 border-b border-stone-100 pb-4">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'pending', label: `Chờ duyệt (${relationCounts.pending})` },
              { id: 'approved', label: `Đã duyệt (${relationCounts.approved})` },
              { id: 'rejected', label: `Từ chối (${relationCounts.rejected})` },
            ].map((f) => {
              const isActive = relationFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setRelationFilter(f.id as any)}
                  className={`rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-wide transition-all ${
                    isActive
                      ? 'border-primary-green bg-primary-green/10 text-primary-green-dark'
                      : 'border-gray-border bg-white text-stone-500 hover:bg-stone-50'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Relations List */}
          <div className="space-y-3">
            {visibleRelations.map((relation) => (
              <div key={relation.id} className="rounded-2xl border border-gray-border bg-white p-4 shadow-sm hover:border-stone-300 transition-all">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-stone-500">
                        {relation.relationType}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${
                          relation.provenance === 'AI sinh'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-blue-200 bg-blue-50 text-blue-700'
                        }`}
                      >
                        {relation.provenance}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${
                          relation.reviewStatus === 'pending'
                            ? 'border-amber-200 bg-amber-50 text-amber-700'
                            : relation.reviewStatus === 'approved'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-rose-200 bg-rose-50 text-rose-700'
                        }`}
                      >
                        {relation.reviewStatus === 'pending'
                          ? 'Đang chờ duyệt'
                          : relation.reviewStatus === 'approved'
                          ? 'Đã duyệt'
                          : 'Bị từ chối'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-extrabold text-stone-700">
                      <span>{relation.sourceSkill}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                      <span>{relation.targetSkill}</span>
                    </div>
                  </div>

                  {relation.reviewStatus === 'pending' && (
                    <div className="flex items-center gap-2 self-start xl:self-auto border-t border-stone-100 xl:border-0 pt-3 xl:pt-0 w-full xl:w-auto">
                      <button
                        type="button"
                        onClick={() => updateRelationStatus(relation.id, 'approved')}
                        className="btn-3d btn-green text-[10px] py-1.5 px-3"
                      >
                        <Check className="mr-1 h-3.5 w-3.5 inline" />
                        Duyệt
                      </button>
                      <button
                        type="button"
                        onClick={() => updateRelationStatus(relation.id, 'rejected')}
                        className="btn-3d btn-red text-[10px] py-1.5 px-3"
                      >
                        <X className="mr-1 h-3.5 w-3.5 inline" />
                        Từ chối
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {visibleRelations.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-stone-200 p-8 text-center text-xs font-bold text-stone-400">
                Không tìm thấy mối quan hệ tri thức nào phù hợp bộ lọc.
              </div>
            )}
          </div>
        </section>
      ) : (
        /* Weakness-Gen targeted Quiz Generation Sub-tab */
        <section className="rounded-3xl border-2 border-gray-border bg-white p-5 shadow-sm md:p-6 space-y-6">
          <div>
            <h4 className="text-sm font-black text-on-background uppercase tracking-tight">
              🎯 Sinh câu hỏi bám sát điểm yếu của Học viên
            </h4>
            <p className="text-[11px] text-stone-400 font-semibold mt-0.5">
              Tạo câu hỏi ôn tập cá nhân hóa dựa trên những lỗ hổng kiến thức thực tế từ lộ trình học tập của từng học viên.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Student List */}
            <div className="border border-stone-200 rounded-2xl p-4 bg-stone-50/50 space-y-3">
              <h5 className="text-xs font-black text-stone-600 uppercase tracking-wider">Danh sách Học viên</h5>
              {isLoadingStudents ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 text-primary-green animate-spin" />
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {students.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => {
                        setSelectedStudentId(student.id);
                        setSelectedConceptForGen('');
                        setWeaknessCompleted(false);
                        setWeaknessLogs([]);
                        setWeaknessProgress(0);
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1 ${
                        selectedStudentId === student.id
                          ? 'border-primary-green bg-primary-green/5 shadow-sm'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <span className="text-xs font-bold text-stone-700">{student.full_name || 'Học viên'}</span>
                      <span className="text-[10px] text-stone-400 font-semibold">{student.email}</span>
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-stone-100 w-full text-[9px] font-black uppercase text-stone-500">
                        <span>Elo TB: {student.average_elo || 1200}</span>
                        {student.skills?.some((sk: any) => sk.mastery_state === 'weak') && (
                          <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full">Cần hỗ trợ</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Weak Concepts and Generator Configuration */}
            <div className="lg:col-span-2 border border-stone-200 rounded-2xl p-4 bg-white space-y-4">
              {!selectedStudentId ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
                  <BookOpen className="w-10 h-10 text-stone-300" />
                  <p className="text-xs font-bold text-stone-400">Chọn một học viên để xem các khái niệm bị yếu</p>
                </div>
              ) : (
                <>
                  <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-black text-stone-700">
                        Hồ sơ điểm yếu: {students.find((s) => s.id === selectedStudentId)?.full_name}
                      </h5>
                      <p className="text-[10px] text-stone-400 font-semibold">
                        Lấy từ bảng student_concept_mastery trong cơ sở dữ liệu
                      </p>
                    </div>
                  </div>

                  {isLoadingWeakConcepts ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-6 h-6 text-primary-green animate-spin" />
                    </div>
                  ) : isGeneratingWeaknessQuiz ? (
                    /* GENERATOR RUNNING console UI */
                    <div className="space-y-4 bg-stone-900 text-stone-100 p-4 rounded-2xl font-mono text-[10px]">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="font-black uppercase tracking-wider">AI Pipeline is generating targeted quizzes...</span>
                      </div>
                      <div className="bg-stone-950 p-3 border border-stone-800 rounded-xl space-y-1 h-48 overflow-y-auto custom-scrollbar">
                        {weaknessLogs.map((log, index) => (
                          <div key={index} className="flex gap-2">
                            <span className="text-stone-600 select-none">[{index + 1}]</span>
                            <span className={(log && typeof log === 'string' && log.startsWith('[Error]')) ? 'text-red-400' : (log && typeof log === 'string' && log.includes('Thành công')) ? 'text-emerald-400' : 'text-stone-300'}>{log || ''}</span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] text-stone-400 font-black uppercase">
                          <span>Tiến độ xử lý</span>
                          <span>{weaknessProgress}%</span>
                        </div>
                        <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 transition-all" style={{ width: `${weaknessProgress}%` }} />
                        </div>
                      </div>
                    </div>
                  ) : weaknessCompleted ? (
                    /* COMPLETION VIEW */
                    <div className="flex flex-col items-center justify-center text-center p-6 space-y-4">
                      <div className="h-12 w-12 bg-primary-green/10 rounded-full flex items-center justify-center text-primary-green-dark border border-primary-green/20">
                        <Check className="w-6 h-6 stroke-[3]" />
                      </div>
                      <div>
                        <h6 className="text-xs font-black text-stone-800">Đã sinh bộ câu hỏi nhắm mục tiêu điểm yếu!</h6>
                        <p className="text-[11px] font-semibold text-stone-500 mt-1 max-w-sm">
                          Bộ {weaknessParams.numQuestions} câu hỏi trắc nghiệm tiếng Việt kèm gợi ý Socratic đã được sinh thành công và lưu ở trạng thái bản nháp.
                        </p>
                      </div>
                      <div className="flex gap-2 w-full max-w-xs pt-2">
                        <button
                          type="button"
                          onClick={() => setWeaknessCompleted(false)}
                          className="btn-3d btn-white text-[10px] py-2 flex-1"
                        >
                          Sinh tiếp
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateToQuizEditor) {
                              const conceptObj = weakConcepts.find((c) => c.concept_code === selectedConceptForGen);
                              onNavigateToQuizEditor(conceptObj?.concept_name || selectedConceptForGen);
                            }
                          }}
                          className="btn-3d btn-green text-[10px] py-2 flex-1"
                        >
                          Duyệt ngay
                        </button>
                      </div>
                    </div>
                  ) : weakConcepts.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-xs font-bold text-stone-400">
                        Học sinh này hiện tại không có khái niệm nào ở trạng thái Yếu.
                      </p>
                      <p className="text-[10px] text-stone-400 font-semibold mt-1">
                        Hệ thống tự đồng bộ từ các câu trả lời sai gần đây.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-stone-400">Chọn Concept yếu cần khắc phục</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {weakConcepts.map((c) => (
                            <button
                              key={c.concept_id}
                              type="button"
                              onClick={() => setSelectedConceptForGen(c.concept_code)}
                              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                                selectedConceptForGen === c.concept_code
                                  ? 'border-primary-green bg-primary-green/5 shadow-sm'
                                  : 'border-stone-200 hover:border-stone-300 bg-white'
                              }`}
                            >
                              <span className="text-xs font-bold text-stone-700">{c.concept_name || c.concept_code}</span>
                              <div className="flex items-center justify-between text-[9px] font-mono text-stone-400 font-bold mt-1">
                                <span>Mã: #{c.concept_code}</span>
                                <span className="text-rose-600 bg-rose-50 px-1 rounded">Elo: {Math.round(c.elo_score)}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {selectedConceptForGen && (
                        <div className="space-y-4 pt-3 border-t border-stone-100">
                          {/* Live Mode Toggle */}
                          <div className="flex items-center justify-between rounded-xl border border-stone-200 p-3 bg-stone-50">
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-stone-700">Kết nối cơ sở dữ liệu thật (Supabase Live)</p>
                              <p className="text-[10px] font-semibold text-stone-400">Gọi API FastAPI thực để cập nhật DB</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={weaknessParams.isLiveMode}
                                onChange={(e) => setWeaknessParams((prev) => ({ ...prev, isLiveMode: e.target.checked }))}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-green"></div>
                            </label>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            {/* Num questions */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase text-stone-400">Số câu hỏi sinh</label>
                              <select
                                value={weaknessParams.numQuestions}
                                onChange={(e) => setWeaknessParams((prev) => ({ ...prev, numQuestions: parseInt(e.target.value) }))}
                                className="w-full rounded-xl border border-stone-200 p-2 text-xs font-bold text-stone-600 bg-white"
                              >
                                <option value={3}>3 câu</option>
                                <option value={5}>5 câu</option>
                                <option value={10}>10 câu</option>
                              </select>
                            </div>
                            {/* Difficulty */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase text-stone-400">Độ khó mục tiêu</label>
                              <select
                                value={weaknessParams.difficulty}
                                onChange={(e) => setWeaknessParams((prev) => ({ ...prev, difficulty: e.target.value }))}
                                className="w-full rounded-xl border border-stone-200 p-2 text-xs font-bold text-stone-600 bg-white"
                              >
                                <option value="dễ">Dễ (Nhận biết)</option>
                                <option value="bình thường">Bình thường (Thông hiểu)</option>
                                <option value="khó">Khó (Vận dụng)</option>
                              </select>
                            </div>
                          </div>

                          {/* Accordion Custom Prompt */}
                          <div className="rounded-xl border border-stone-200 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setShowWeaknessPromptEditor(!showWeaknessPromptEditor)}
                              className="w-full bg-stone-50 px-4 py-2.5 flex items-center justify-between text-xs font-bold text-stone-700 hover:bg-stone-100 transition-all"
                            >
                              <span>🛠️ Tùy chỉnh Prompt Sư phạm (CT GDPT 2018)</span>
                              <span>{showWeaknessPromptEditor ? '▲' : '▼'}</span>
                            </button>
                            {showWeaknessPromptEditor && (
                              <div className="p-3 bg-white border-t border-stone-200 space-y-2">
                                <textarea
                                  rows={5}
                                  value={weaknessParams.promptOverride}
                                  onChange={(e) => setWeaknessParams((prev) => ({ ...prev, promptOverride: e.target.value }))}
                                  placeholder="Nhập prompt tùy chỉnh cho điểm yếu (để trống để dùng prompt GDPT 2018 mặc định)..."
                                  className="w-full rounded-xl border border-stone-300 p-3.5 font-mono text-[9px] text-stone-600 focus:outline-none focus:border-primary-green focus:ring-1 focus:ring-primary-green bg-stone-50"
                                />
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setWeaknessParams((prev) => ({ ...prev, promptOverride: DEFAULT_VIETNAMESE_QUIZ_PROMPT }))}
                                    className="text-[9px] font-black uppercase tracking-wider text-primary-green hover:underline"
                                  >
                                    Tải template GDPT 2018
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setWeaknessParams((prev) => ({ ...prev, promptOverride: '' }))}
                                    className="text-[9px] font-black uppercase tracking-wider text-stone-400 hover:underline"
                                  >
                                    Xóa trống
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Submit button */}
                          <button
                            type="button"
                            onClick={runWeaknessQuizGen}
                            className="btn-3d text-[11px] py-3 w-full flex items-center justify-center gap-1.5 btn-green"
                          >
                            <Sparkles className="w-4 h-4" />
                            Bắt đầu sinh Quiz khắc phục điểm yếu
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* DRAWER 1: VIEW SLIDE CHUNKS                                               */}
      {/* ========================================================================= */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          selectedDocForChunks ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm" onClick={() => setSelectedDocForChunks(null)} />
        <div
          className={`absolute right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl border-l border-stone-200 transition-transform duration-300 transform flex flex-col ${
            selectedDocForChunks ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {selectedDocForChunks && (
            <>
              <div className="p-5 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-stone-800 uppercase tracking-tight">
                    Xem mảnh dữ liệu (Page Chunks)
                  </h4>
                  <p className="text-[11px] text-stone-400 font-semibold mt-0.5 line-clamp-1">
                    {selectedDocForChunks.name}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDocForChunks(null)}
                  className="h-8 w-8 rounded-xl border border-stone-200 flex items-center justify-center hover:bg-stone-50 transition-all text-stone-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 border-b border-stone-100 bg-stone-50/50">
                <div className="grid grid-cols-2 gap-3 text-[10px] font-black text-stone-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-stone-400" />
                    <span>Tổng số trang: {selectedDocForChunks.totalSlides} chunks</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-stone-400" />
                    <span>Concept: {selectedDocForChunks.concept}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                {isLoadingChunks ? (
                  <div className="text-center py-16">
                    <Loader2 className="w-10 h-10 text-primary-green animate-spin mx-auto" />
                    <p className="text-xs font-bold text-stone-400 mt-2">
                      Đang tải danh sách trang slide...
                    </p>
                  </div>
                ) : (
                  (demoMode ? MOCK_DOCUMENT_CHUNKS[selectedDocForChunks.id] : realChunks)?.map((chunk) => (
                    <div
                      key={chunk.page}
                      className="border border-stone-200 rounded-2xl overflow-hidden shadow-sm hover:shadow transition-shadow bg-white"
                    >
                      {/* Header Chunk */}
                      <div className="bg-stone-50 px-4 py-2 border-b border-stone-100 flex items-center justify-between">
                        <span className="text-[10px] font-mono font-black uppercase text-stone-400">
                          Slide/Page {chunk.page}
                        </span>
                        <span className="text-[9px] font-black uppercase bg-primary-green/10 text-primary-green-dark px-1.5 py-0.5 rounded">
                          1 Chunk
                        </span>
                      </div>

                      {/* Preview Area (Realistic Design Mock) */}
                      <div className="p-4 bg-gradient-to-br from-stone-50/30 to-primary-green/5 min-h-[100px] flex flex-col justify-center border-b border-stone-50">
                        <div className="h-1.5 w-12 bg-primary-green rounded mb-2" />
                        <h5 className="text-xs font-black text-stone-800">{chunk.title}</h5>
                        {chunk.image_url && (
                          <div className="my-2 max-w-full overflow-hidden rounded-lg border border-stone-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={chunk.image_url} alt={chunk.title} className="w-full h-auto object-contain max-h-[200px]" />
                          </div>
                        )}
                        <div className="mt-2 space-y-1">
                          <div className="h-1 w-full bg-stone-200 rounded-full" />
                          <div className="h-1 w-3/4 bg-stone-200 rounded-full" />
                          <div className="h-1 w-5/6 bg-stone-200 rounded-full" />
                        </div>
                      </div>

                      {/* Excerpt Content */}
                      <div className="p-4 bg-white">
                        <p className="text-[11px] leading-relaxed font-medium text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-100 font-mono">
                          {chunk.text}
                        </p>
                      </div>
                    </div>
                  ))
                )}

                {((demoMode && (!MOCK_DOCUMENT_CHUNKS[selectedDocForChunks.id] || MOCK_DOCUMENT_CHUNKS[selectedDocForChunks.id].length === 0)) ||
                  (!demoMode && !isLoadingChunks && realChunks.length === 0)) && (
                  <div className="text-center py-16">
                    <FileText className="w-10 h-10 text-stone-300 mx-auto" />
                    <p className="text-xs font-bold text-stone-400 mt-2">
                      Tài liệu này chưa có bản xem thử chi tiết các trang.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DRAWER 2: GENERATE QUIZ AI                                                */}
      {/* ========================================================================= */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          selectedDocForQuizGen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm" onClick={() => !isGeneratingQuiz && setSelectedDocForQuizGen(null)} />
        <div
          className={`absolute right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl border-l border-stone-200 transition-transform duration-300 transform flex flex-col ${
            selectedDocForQuizGen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {selectedDocForQuizGen && (
            <>
              <div className="p-5 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-stone-800 uppercase tracking-tight">
                    Yêu cầu sinh Quiz AI tự động
                  </h4>
                  <p className="text-[11px] text-stone-400 font-semibold mt-0.5 line-clamp-1">
                    {selectedDocForQuizGen.name}
                  </p>
                </div>
                <button
                  disabled={isGeneratingQuiz}
                  onClick={() => setSelectedDocForQuizGen(null)}
                  className={`h-8 w-8 rounded-xl border border-stone-200 flex items-center justify-center hover:bg-stone-50 transition-all text-stone-500 ${isGeneratingQuiz ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!isGeneratingQuiz && !quizGenCompleted ? (
                /* CONFIGURATION VIEW */
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                  <div className="rounded-2xl border border-primary-green/20 bg-primary-green/5 p-4 flex gap-3">
                    <Sparkles className="w-5 h-5 text-primary-green shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-primary-green-dark">Hệ thống sinh câu hỏi tự động</p>
                      <p className="text-[11px] font-medium text-stone-600 mt-1 leading-relaxed">
                        Mô hình ngôn ngữ lớn sẽ duyệt qua cấu trúc các trang slide để trích xuất các tri thức trọng tâm,
                        tự động gán concept tags và sinh bộ gợi ý 3 mức độ Socratic.
                      </p>
                    </div>
                  </div>

                  {/* Toggle Live Mode */}
                  <div className="flex items-center justify-between rounded-xl border border-stone-200 p-4 bg-stone-50">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-stone-700">Chế độ Cơ sở dữ liệu Live (Supabase)</p>
                      <p className="text-[10px] font-semibold text-stone-400">Sinh câu hỏi lưu trực tiếp vào CSDL thật</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isLiveMode}
                        onChange={(e) => setIsLiveMode(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-green"></div>
                    </label>
                  </div>

                  {/* Concept Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-stone-400">Chọn Concept mục tiêu</label>
                    <select
                      value={selectedConceptCode}
                      onChange={(e) => setSelectedConceptCode(e.target.value)}
                      className="w-full rounded-xl border-2 border-gray-border p-2.5 text-xs font-bold text-stone-700 bg-white focus:outline-none focus:border-primary-green"
                    >
                      {conceptOptions.map((opt) => (
                        <option key={opt.code} value={opt.code}>
                          {opt.name} ({opt.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-stone-400">Số lượng câu hỏi sinh nháp</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[3, 5, 10].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setQuizGenParams((prev) => ({ ...prev, numQuestions: num }))}
                          className={`border-2 py-2.5 rounded-xl font-mono text-xs font-black transition-all ${
                            quizGenParams.numQuestions === num
                              ? 'border-primary-green bg-primary-green/10 text-primary-green-dark'
                              : 'border-gray-border bg-white text-stone-500 hover:bg-stone-50'
                          }`}
                        >
                          {num} Câu hỏi
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-stone-400">Độ khó mục tiêu</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['dễ', 'bình thường', 'khó'].map((diff) => (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => setQuizGenParams((prev) => ({ ...prev, difficulty: diff }))}
                          className={`border-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all ${
                            quizGenParams.difficulty === diff
                              ? 'border-primary-green bg-primary-green/10 text-primary-green-dark'
                              : 'border-gray-border bg-white text-stone-500 hover:bg-stone-50'
                          }`}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-stone-200 p-4 bg-stone-50">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-stone-700">Tự động sinh Socratic Hints</p>
                      <p className="text-[10px] font-semibold text-stone-400">3 mức gợi ý giúp học sinh tự tư duy</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={quizGenParams.socraticHints}
                        onChange={(e) => setQuizGenParams((prev) => ({ ...prev, socraticHints: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-green"></div>
                    </label>
                  </div>

                  {/* Accordion Custom Prompt */}
                  <div className="rounded-xl border border-stone-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowPromptEditor(!showPromptEditor)}
                      className="w-full bg-stone-50 px-4 py-3 flex items-center justify-between text-xs font-bold text-stone-700 hover:bg-stone-100 transition-all"
                    >
                      <span>🛠️ Tùy chỉnh Prompt sinh câu hỏi (Nâng cao)</span>
                      <span>{showPromptEditor ? '▲' : '▼'}</span>
                    </button>
                    {showPromptEditor && (
                      <div className="p-4 bg-white border-t border-stone-200 space-y-3">
                        <p className="text-[10px] text-stone-400 font-semibold leading-relaxed">
                          Bạn có thể sửa đổi prompt dưới đây để định hình phong cách hoặc yêu cầu đặc thù cho các câu hỏi được sinh ra (hỗ trợ các biến như {"{num_questions}"}, {"{concept_name}"}, {"{difficulty}"}, {"{slides_content}"}).
                        </p>
                        <textarea
                          rows={6}
                          value={promptOverride}
                          onChange={(e) => setPromptOverride(e.target.value)}
                          placeholder="Nhập prompt tùy chỉnh tại đây (để trống nếu muốn dùng prompt GDPT 2018 mặc định)..."
                          className="w-full rounded-xl border border-stone-300 p-3 font-mono text-[10px] text-stone-600 focus:outline-none focus:border-primary-green focus:ring-1 focus:ring-primary-green bg-stone-50"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setPromptOverride(DEFAULT_VIETNAMESE_QUIZ_PROMPT)}
                            className="text-[9px] font-black uppercase tracking-wider text-primary-green hover:underline"
                          >
                            Tải template GDPT 2018
                          </button>
                          <button
                            type="button"
                            onClick={() => setPromptOverride('')}
                            className="text-[9px] font-black uppercase tracking-wider text-stone-400 hover:underline"
                          >
                            Xóa trống
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-stone-100 flex gap-2">
                    <button
                      type="button"
                      disabled={isGeneratingQuiz}
                      onClick={runQuizGen}
                      className="btn-3d text-[11px] py-3 flex-1 flex items-center justify-center gap-1.5 btn-green"
                    >
                      <Sparkles className="w-4 h-4" />
                      Bắt đầu sinh Quiz
                    </button>
                  </div>
                </div>
              ) : isGeneratingQuiz ? (
                /* PIPELINE RUNNING VIEW */
                <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-stone-900 text-stone-100 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2.5">
                      <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                      <span className="text-xs font-mono font-black uppercase text-emerald-400 tracking-wider">
                        AI Pipeline is executing...
                      </span>
                    </div>

                    {/* Console Logs */}
                    <div className="rounded-xl bg-stone-950 p-4 border border-stone-800 font-mono text-[10px] text-emerald-400 space-y-1.5 h-64 overflow-y-auto custom-scrollbar">
                      {quizGenLogs.map((log, index) => (
                        <div key={index} className="flex gap-2">
                          <span className="text-stone-600 select-none">[{index + 1}]</span>
                          <span>{log || ''}</span>
                        </div>
                      ))}
                      <div className="text-amber-400 animate-pulse">[Xử lý] Đang biên dịch tri thức...</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[9px] font-mono text-stone-400 font-black uppercase">
                      <span>Tiến trình xử lý</span>
                      <span>{quizGenProgress}%</span>
                    </div>
                    <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${quizGenProgress}%` }} />
                    </div>
                  </div>
                </div>
              ) : (
                /* COMPLETION SCREEN VIEW */
                <div className="flex-1 p-5 flex flex-col justify-center items-center text-center space-y-5">
                  <div className="h-16 w-16 bg-primary-green/10 rounded-full border border-primary-green/20 flex items-center justify-center text-primary-green-dark">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>
                  <div>
                    <h5 className="font-fraunces text-md font-black text-stone-800">
                      Sinh Câu Hỏi Nháp Hoàn Tất!
                    </h5>
                    <p className="text-xs font-semibold text-stone-500 mt-2 max-w-sm">
                      Hệ thống đã tự động phân tích slide và đưa vào hàng chờ duyệt{' '}
                      <span className="text-stone-700 font-black">{quizGenParams.numQuestions} câu hỏi mới</span>{' '}
                      với 3 cấp độ gợi ý Socratic.
                    </p>
                  </div>

                  <div className="w-full bg-stone-50 rounded-2xl border border-stone-200 p-4 grid grid-cols-2 gap-3 text-left">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">Tài liệu nguồn</span>
                      <p className="text-xs font-extrabold text-stone-700 line-clamp-1">{selectedDocForQuizGen.name}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">Mã Concept</span>
                      <p className="text-xs font-extrabold text-stone-700 font-mono">#{selectedDocForQuizGen.concept}</p>
                    </div>
                  </div>

                  <div className="w-full flex gap-3 pt-4 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDocForQuizGen(null);
                        setQuizGenCompleted(false);
                      }}
                      className="btn-3d btn-white text-[11px] py-3 flex-1"
                    >
                      Để sau
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDocForQuizGen(null);
                        setQuizGenCompleted(false);
                        if (onNavigateToQuizEditor) {
                          onNavigateToQuizEditor(selectedDocForQuizGen.name);
                        }
                      }}
                      className="btn-3d btn-green text-[11px] py-3 flex-1 flex items-center justify-center gap-1"
                    >
                      <span>Duyệt ngay</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DRAWER 3: ADD NEW DOCUMENT (INGESTION FLOW)                               */}
      {/* ========================================================================= */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          isUploadDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm" onClick={() => !isUploading && setIsUploadDrawerOpen(false)} />
        <div
          className={`absolute right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl border-l border-stone-200 transition-transform duration-300 transform flex flex-col ${
            isUploadDrawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-black text-stone-800 uppercase tracking-tight">
                Nạp tài liệu giảng dạy mới
              </h4>
              <p className="text-[11px] text-stone-400 font-semibold mt-0.5">
                Lập chỉ mục RAG slide bài giảng để làm phong phú kho tri thức.
              </p>
            </div>
            <button
              disabled={isUploading}
              onClick={() => setIsUploadDrawerOpen(false)}
              className={`h-8 w-8 rounded-xl border border-stone-200 flex items-center justify-center hover:bg-stone-50 transition-all text-stone-500 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {uploadPhase === 'idle' ? (
            /* CONFIG & UPLOAD FORM */
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Drop zone file selection */}
              <div className="rounded-2xl border-2 border-dashed border-primary-green/20 bg-stone-50/50 p-6 text-center">
                <div className="flex flex-col items-center justify-center gap-2.5">
                  <div className="h-10 w-10 bg-white border rounded-xl flex items-center justify-center shadow-sm">
                    <Upload className="w-5 h-5 text-primary-green-dark" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-stone-800">Chọn file slide PDF</h5>
                    <p className="text-[10px] font-semibold text-stone-400 mt-0.5">
                      Kéo thả hoặc tải lên tệp PDF. Tối đa 25MB.
                    </p>
                  </div>
                  <label className="btn-3d btn-white text-[10px] mt-1 cursor-pointer">
                    Chọn tệp tin
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadForm((prev) => ({
                            ...prev,
                            file,
                            fileName: file.name,
                            name: file.name.replace(/\.[^/.]+$/, ''), // remove extension
                          }));
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {uploadForm.fileName && (
                <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-bold text-stone-600">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary-green/10 px-2 py-0.5 text-[9px] font-black uppercase text-primary-green-dark">
                      Sẵn sàng
                    </span>
                    <span className="line-clamp-1">{uploadForm.fileName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadForm((prev) => ({ ...prev, file: null, fileName: '', name: '' }))}
                    className="text-stone-400 hover:text-stone-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-stone-400">Tên tài liệu lưu trữ</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Day 06 - Evaluation Strategy"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl border-2 border-gray-border bg-white px-3.5 py-2.5 text-xs font-semibold text-stone-700 focus:border-primary-green focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-stone-400">Ngày học (Day Label)</label>
                  <select
                    value={uploadForm.dayLabel}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, dayLabel: e.target.value }))}
                    className="w-full rounded-xl border-2 border-gray-border bg-white px-3 py-2 text-xs font-semibold text-stone-700 focus:border-primary-green focus:outline-none"
                  >
                    {Array.from({ length: 30 }, (_, i) => `Day ${String(i + 1).padStart(2, '0')}`).map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-stone-400">Concept tương quan</label>
                  <select
                    value={uploadForm.conceptCode}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, conceptCode: e.target.value }))}
                    className="w-full rounded-xl border-2 border-gray-border bg-white px-3 py-2 text-xs font-semibold text-stone-700 focus:border-primary-green focus:outline-none"
                  >
                    {conceptOptions.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 flex gap-2">
                <button
                  type="button"
                  disabled={!uploadForm.file || (demoMode && !uploadForm.name)}
                  onClick={runUpload}
                  className={`btn-3d text-[11px] py-3 flex-1 flex justify-center items-center gap-1.5 ${
                    uploadForm.file && (!demoMode || uploadForm.name) ? 'btn-green' : 'btn-disabled'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Bắt đầu nạp tài liệu
                </button>
              </div>
            </div>
          ) : isUploading ? (
            /* UPLOADING PIPELINE VIEW */
            <div className="flex-1 p-5 bg-stone-900 text-stone-100 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                  <span className="text-xs font-mono font-black uppercase text-emerald-400 tracking-wider">
                    Indexing Pipeline In-Progress...
                  </span>
                </div>

                {/* Console Logs */}
                <div className="rounded-xl bg-stone-950 p-4 border border-stone-800 font-mono text-[10px] text-emerald-400 space-y-1.5 h-64 overflow-y-auto custom-scrollbar">
                  {uploadLogs.map((log, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="text-stone-600 select-none">[{index + 1}]</span>
                      <span>{log || ''}</span>
                    </div>
                  ))}
                  <div className="text-amber-400 animate-pulse">[Xử lý] Đang phân mảnh và trích xuất vector...</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[9px] font-mono text-stone-400 font-black uppercase">
                  <span>Tiến trình tải lên & trích xuất</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            </div>
          ) : (
            /* UPLOAD COMPLETION SCREEN */
            <div className="flex-1 p-5 flex flex-col justify-center items-center text-center space-y-5">
              <div className="h-16 w-16 bg-primary-green/10 rounded-full border border-primary-green/20 flex items-center justify-center text-primary-green-dark">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <div>
                <h5 className="font-fraunces text-md font-black text-stone-800">
                  Nạp Tài Liệu Thành Công!
                </h5>
                <p className="text-xs font-semibold text-stone-500 mt-2 max-w-sm">
                  Tài liệu <span className="text-stone-700 font-black">{uploadForm.name}</span> đã được lập chỉ mục vector, đồng bộ lên DB, và phân tích các quan hệ đồ thị kiến thức.
                </p>
              </div>

              <div className="w-full flex gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadDrawerOpen(false);
                    setUploadForm({ name: '', dayLabel: 'Day 06', conceptCode: 'd6-observability', file: null, fileName: '' });
                  }}
                  className="btn-3d btn-green text-[11px] py-3 flex-1"
                >
                  Hoàn tất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
