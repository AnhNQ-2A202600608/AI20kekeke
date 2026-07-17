'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  BookCopy,
  CircleSlash,
  FileEdit,
  Filter,
  Lightbulb,
  Save,
  Send,
  SkipForward,
  X,
  Search,
  CheckCircle,
  HelpCircle,
  Tag,
  AlertTriangle,
  ChevronDown,
  Layers,
  Loader2,
} from 'lucide-react';
import {
  Question,
  QuestionHint,
  QuestionPublishedStatus,
  QuizDifficulty,
} from '@/lib/quiz/types';
import { isDemoMode } from '@/lib/demo-mode';
import { useBoundStore } from '@/hooks/useBoundStore';
import {
  fetchReviewQuestions,
  updateReviewQuestionContent,
  updateReviewQuestionStatus,
  QuizReviewHint,
} from '@/lib/mentor/quiz-review';
import { fetchConcepts, fetchMaterials, type ConceptOption } from '@/lib/mentor/materials';

interface EditorQuestion extends Question {
  sourceTitle: string;
  sourcePage: string;
  sourceExcerpt: string;
  concepts?: string[];
}

const HINT_LEVELS: Array<{ key: QuestionHint['level']; label: string }> = [
  { key: 'light', label: '💡 Gợi ý cấp 1 (Nhẹ)' },
  { key: 'medium', label: '💡 Gợi ý cấp 2 (Trung bình)' },
  { key: 'deep', label: '💡 Gợi ý cấp 3 (Sâu)' },
];

const UNIQUE_CONCEPTS = [
  { code: 'd8-rag-pipeline', name: 'RAG Pipeline' },
  { code: 'd4-prompt-engineering', name: 'Prompt Engineering' },
  { code: 'd10-observability', name: 'Data Observability' },
  { code: 'd1-ai-llm-foundations', name: 'AI & LLM Foundations' },
  { code: 'd2-ai-problem-framing', name: 'AI Problem Framing' },
];

const MOCK_QUESTIONS: EditorQuestion[] = [
  {
    id: 301,
    setId: 'day8-basics',
    sourceTitle: 'Day 08 - Production RAG.pdf',
    sourcePage: 'Slide 14',
    sourceExcerpt: 'Metadata filters narrow the candidate pool before semantic search to improve relevance and reduce noisy retrieval.',
    question: 'Trong hệ RAG production, bước nào giúp giới hạn tài liệu truy hồi theo ngữ cảnh phù hợp nhất?',
    options: {
      A: 'Tăng nhiệt độ của mô hình LLM để tự động lọc.',
      B: 'Metadata filtering trước khi tiến hành retrieval.',
      C: 'Chỉ sử dụng prompt dài hơn để chứa toàn bộ ngữ cảnh.',
      D: 'Tắt chunking để giữ nguyên cấu trúc tài liệu gốc.'
    },
    answer: 'B',
    explanation: 'Metadata filtering giúp co hẹp không gian tìm kiếm trước khi semantic retrieval chạy, giúp tăng độ chính xác và giảm thiểu tài liệu gây nhiễu.',
    difficulty: 'bình thường',
    published_status: 'draft',
    hints: [
      { level: 'light', content: 'Hãy nghĩ đến bước tiền xử lý lọc metadata diễn ra trước khi truy vấn vector.' },
      { level: 'medium', content: 'Bộ lọc metadata thường dựa trên thông tin ngày học, chương học hoặc tài liệu.' },
      { level: 'deep', content: 'Không cần so sánh ngữ nghĩa mọi chunk, giới hạn scope trước sẽ loại bỏ nhiễu.' }
    ],
    concepts: ['d8-rag-pipeline']
  },
  {
    id: 302,
    setId: 'day8-basics',
    sourceTitle: 'Day 08 - Production RAG.pdf',
    sourcePage: 'Slide 2',
    sourceExcerpt: 'Retrieval Pipeline only fetches text chunks based on semantic similarity. A complete RAG pipeline incorporates both the retrieval mechanism and context augmentation to output generation.',
    question: 'Sự khác biệt cơ bản nhất giữa một Retrieval Pipeline và một RAG Pipeline hoàn chỉnh là gì?',
    options: {
      A: 'Retrieval Pipeline chỉ tìm kiếm văn bản liên quan, RAG kết hợp cả tìm kiếm, làm giàu ngữ cảnh và sinh câu trả lời thông qua LLM.',
      B: 'Retrieval Pipeline chỉ dùng mô hình nhỏ, RAG sử dụng các mô hình lớn hơn để lưu trữ cơ sở dữ liệu.',
      C: 'Retrieval Pipeline lưu trữ dữ liệu dạng vector, còn RAG lưu dưới dạng bảng quan hệ SQL truyền thống.',
      D: 'Retrieval Pipeline làm sạch dữ liệu đầu vào, RAG tập trung hoàn toàn vào việc kiểm tra đánh giá hệ thống.'
    },
    answer: 'A',
    explanation: 'Retrieval Pipeline dừng lại ở bước tìm thông tin liên quan. RAG Pipeline kết hợp cả Tìm kiếm (R), Làm giàu ngữ cảnh (A) và Tạo câu trả lời (G) nhờ LLM.',
    difficulty: 'dễ',
    published_status: 'published',
    hints: [
      { level: 'light', content: 'Hãy đối chiếu từng chữ cái viết tắt R-A-G của pipeline.' },
      { level: 'medium', content: 'Retrieval chỉ tìm văn bản, chưa nạp vào LLM để viết câu trả lời.' },
      { level: 'deep', content: 'RAG kết hợp cả tìm kiếm ngữ cảnh, xây dựng prompt và gọi LLM tạo nội dung mới.' }
    ],
    concepts: ['d8-rag-pipeline']
  },
  {
    id: 303,
    setId: 'day8-basics',
    sourceTitle: 'Day 08 - Production RAG.pdf',
    sourcePage: 'Slide 5',
    sourceExcerpt: 'Probabilistic Nature of LLMs means they predict the next token based on statistical patterns, not factual database lookups.',
    question: 'Bản chất xác suất (Probabilistic Nature) của mô hình ngôn ngữ lớn ảnh hưởng thế nào đến độ tin cậy của câu trả lời?',
    options: {
      A: 'Mô hình luôn đưa ra câu trả lời giống hệt nhau cho cùng một câu hỏi ở các lượt thử.',
      B: 'Mô hình tự động phân tích cấu trúc cú pháp của câu hỏi để tránh tạo ra ảo giác.',
      C: 'Mô hình hoạt động dựa trên việc dự đoán từ tiếp theo có xác suất cao nhất thay vì hiểu thực tế khách quan.',
      D: 'Mô hình tự động cập nhật tri thức thời gian thực từ Internet mà không cần huấn luyện.'
    },
    answer: 'C',
    explanation: 'Mô hình ngôn ngữ lớn (LLM) thực chất là công cụ dự đoán xác suất token tiếp theo. Chúng ưu tiên sự trôi chảy của ngôn từ hơn là tính xác thực thực tế.',
    difficulty: 'bình thường',
    published_status: 'published',
    hints: [
      { level: 'light', content: 'Hãy nhớ về cơ chế Next Token Prediction trong huấn luyện mô hình.' },
      { level: 'medium', content: 'Mô hình ưu tiên tính mạch lạc về mặt ngôn ngữ trước, sau đó mới đến tính chân thực.' },
      { level: 'deep', content: 'LLM suy luận dựa trên xác suất chuỗi từ ngữ, không phải truy vấn dữ liệu chính xác.' }
    ],
    concepts: ['d8-rag-pipeline', 'd1-ai-llm-foundations']
  },
  {
    id: 304,
    setId: 'day8-basics',
    sourceTitle: 'Day 08 - Production RAG.pdf',
    sourcePage: 'Slide 12',
    sourceExcerpt: 'When corporate data changes rapidly, RAG is preferred over Fine-tuning due to real-time update capability and lineage transparency.',
    question: 'Khi nào doanh nghiệp nên ưu tiên sử dụng phương pháp RAG thay vì tiến hành tinh chỉnh (Fine-tuning) mô hình?',
    options: {
      A: 'Khi cần thay đổi phong cách hội thoại hoặc định dạng đầu ra của mô hình ngôn ngữ.',
      B: 'Khi dữ liệu nội bộ thay đổi liên tục và cần câu trả lời có nguồn trích dẫn rõ ràng để kiểm chứng.',
      C: 'Khi số lượng tài liệu nội bộ rất ít và không có nhu cầu cập nhật thêm thông tin.',
      D: 'Khi doanh nghiệp sở hữu hạ tầng GPU rất mạnh và muốn lưu tri thức trực tiếp vào trọng số.'
    },
    answer: 'B',
    explanation: 'RAG thích hợp với các kho tri thức động, cần cập nhật dữ liệu liên tục thời gian thực mà không tốn chi phí train lại, đồng thời yêu cầu nguồn trích dẫn rõ ràng.',
    difficulty: 'khó',
    published_status: 'draft',
    hints: [
      { level: 'light', content: 'Hãy nghĩ đến chi phí và độ trễ khi cần cập nhật dữ liệu mới hàng giờ.' },
      { level: 'medium', content: 'Fine-tuning giống học tủ cho kỳ thi, RAG giống như mở sách tra cứu tại chỗ.' },
      { level: 'deep', content: 'Khả năng chỉ ra nguồn gốc (lineage/citations) là điểm cộng lớn nhất của RAG.' }
    ],
    concepts: ['d8-rag-pipeline', 'd2-ai-problem-framing']
  },
  {
    id: 305,
    setId: 'day8-basics',
    sourceTitle: 'Day 08 - Production RAG.pdf',
    sourcePage: 'Slide 20',
    sourceExcerpt: 'In-context learning utilizes the prompt space to instruct the model using retrieved snippets without modifying weights.',
    question: 'Thuật ngữ "In-Context Learning" dùng để mô tả hiện tượng hay kỹ thuật nào sau đây trong RAG?',
    options: {
      A: 'Phương pháp cung cấp trực tiếp các thông tin cần thiết vào prompt đầu vào để mô hình trả lời mà không thay đổi trọng số.',
      B: 'Phương pháp điều chỉnh trọng số mô hình thông qua việc học từ các ví dụ thực tế được cung cấp.',
      C: 'Phương pháp phân phối câu hỏi của người dùng ra nhiều mô hình nhỏ khác nhau.',
      D: 'Phương pháp lưu trữ kết quả để phản hồi tức thì mà không cần LLM xử lý.'
    },
    answer: 'A',
    explanation: 'In-Context Learning là khả năng của LLM học và suy luận trực tiếp dựa trên thông tin ngữ cảnh được truyền vào trong prompt hiện tại mà không thay đổi các trọng số tham số.',
    difficulty: 'dễ',
    published_status: 'draft',
    hints: [
      { level: 'light', content: 'Chú ý chữ "In-Context" có nghĩa là học trực tiếp ngay trong prompt ngữ cảnh.' },
      { level: 'medium', content: 'Đây là cơ chế vận hành của prompt, không cập nhật tham số mô hình.' },
      { level: 'deep', content: 'Mô hình suy luận tạm thời dựa trên các đoạn văn bản mà bước Retrieval tìm được.' }
    ],
    concepts: ['d8-rag-pipeline', 'd1-ai-llm-foundations']
  },
  {
    id: 306,
    setId: 'day4-prompt-engineering',
    sourceTitle: 'Day 04 - Prompt Engineering.pdf',
    sourcePage: 'Slide 22',
    sourceExcerpt: 'The model performs better when tool affordances, JSON schema, and invocation criteria are explicit.',
    question: 'Khi thiết kế tool calling, mô hình cần biết điều gì để chọn đúng công cụ?',
    options: {
      A: 'Màu giao diện của sản phẩm phần mềm.',
      B: 'Schema cấu trúc đầu vào/đầu ra và mô tả chi tiết khi nào nên dùng tool.',
      C: 'Chỉ cần đặt tên công cụ thật ngắn gọn là đủ.',
      D: 'Không cần truyền tham số vì mô hình tự động gọi API bằng tên.'
    },
    answer: 'B',
    explanation: 'Tool descriptions và schema rõ ràng giúp mô hình ngôn ngữ lớn hiểu được công dụng, cấu trúc tham số cần thiết để gọi đúng API.',
    difficulty: 'dễ',
    published_status: 'published',
    hints: [
      { level: 'light', content: 'Hãy nghĩ về thông tin mô tả mà chúng ta phải khai báo cho mô hình.' },
      { level: 'medium', content: 'Không chỉ tên hàm, mô hình cần hiểu nghiệp vụ chi tiết của hàm đó.' },
      { level: 'deep', content: 'JSON schema mô tả kiểu dữ liệu tham số là điều kiện bắt buộc.' }
    ],
    concepts: ['d4-prompt-engineering']
  },
  {
    id: 307,
    setId: 'day4-prompt-engineering',
    sourceTitle: 'Day 04 - Prompt Engineering.pdf',
    sourcePage: 'Slide 12',
    sourceExcerpt: 'Few-shot prompt configurations supply input-output pairs to guide the model on desired format and reasoning steps.',
    question: 'Kỹ thuật Few-shot Prompting được hiểu chính xác nhất là gì?',
    options: {
      A: 'Huấn luyện mô hình với một tập dữ liệu siêu nhỏ trong thời gian ngắn.',
      B: 'Cung cấp một vài ví dụ minh họa về cặp Input-Output trong prompt để hướng dẫn mô hình sinh đầu ra.',
      C: 'Chạy thử nghiệm mô hình nhiều lần và lấy trung bình xác suất.',
      D: 'Sử dụng các prompt cực ngắn để tiết kiệm chi phí token đầu vào.'
    },
    answer: 'B',
    explanation: 'Few-shot Prompting chèn trực tiếp các ví dụ mẫu (cặp câu hỏi - câu trả lời mẫu) ngay trong prompt để mô hình học theo phong cách và cấu trúc đầu ra.',
    difficulty: 'dễ',
    published_status: 'draft',
    hints: [
      { level: 'light', content: 'Few-shot dịch nghĩa là một vài ví dụ.' },
      { level: 'medium', content: 'Đây là kỹ thuật tinh chỉnh prompt, không huấn luyện lại mô hình.' },
      { level: 'deep', content: 'Cung cấp các mẫu Input-Output làm kim chỉ nam suy luận cho LLM.' }
    ],
    concepts: ['d4-prompt-engineering']
  },
  {
    id: 308,
    setId: 'day10-observability',
    sourceTitle: 'Day 10 - Data Observability.pdf',
    sourcePage: 'Slide 11',
    sourceExcerpt: 'Batch success rate is a leading operational metric for ingest stability because it captures failures early in the pipeline.',
    question: 'Metric nào phù hợp nhất để theo dõi độ ổn định của pipeline ingest tài liệu?',
    options: {
      A: 'Tỷ lệ crawl thành công theo batch.',
      B: 'Số màu sắc hiển thị trên dashboard giám sát.',
      C: 'Số lượng tài khoản mở trang login.',
      D: 'Độ dài prompt trung bình của người dùng.'
    },
    answer: 'A',
    explanation: 'Success rate theo từng lô (batch success rate) phản ánh trực tiếp pipeline có đang vận hành trơn tru hay có lỗi hệ thống phát sinh sớm.',
    difficulty: 'bình thường',
    published_status: 'draft',
    hints: [
      { level: 'light', content: 'Hãy chọn metric đo lường trực tiếp hoạt động ingest tài liệu.' },
      { level: 'medium', content: 'Observability cần theo dõi tỉ lệ lỗi xử lý lô dữ liệu.' },
      { level: 'deep', content: 'Tỉ lệ thành công của batch nạp là chỉ số vận hành hàng đầu.' }
    ],
    concepts: ['d10-observability']
  },
  {
    id: 309,
    setId: 'day10-observability',
    sourceTitle: 'Day 10 - Data Observability.pdf',
    sourcePage: 'Slide 18',
    sourceExcerpt: 'Traces represent the nested span hierarchy of operations executed in response to a user request, tracking latency and error state.',
    question: 'Trong giám sát hệ thống LLM (Observability), một "Trace" đại diện cho điều gì?',
    options: {
      A: 'Lịch sử thay đổi code trên kho lưu trữ Git.',
      B: 'Chuỗi các bước thực thi lồng nhau (Spans) của một yêu cầu đầu vào, ghi lại thời gian chạy và lỗi.',
      C: 'Bản đồ kết nối vật lý giữa các máy chủ database.',
      D: 'Lịch sử thanh toán phí API hàng tháng của doanh nghiệp.'
    },
    answer: 'B',
    explanation: 'Trace đại diện cho vòng đời thực thi của một yêu cầu, bao gồm cây các Spans (ví dụ: prompt -> retrieval -> LLM call -> output) để tìm vết lỗi và đo latency.',
    difficulty: 'khó',
    published_status: 'rejected',
    rejection_reason: 'Đáp án C và D quá dễ loại trừ, cần bổ sung các lựa chọn gây nhiễu kỹ thuật hơn.',
    hints: [
      { level: 'light', content: 'Nghĩ đến việc theo dấu luồng thực thi trong hệ thống phân tán hoặc chuỗi LLM.' },
      { level: 'medium', content: 'Trace chứa nhiều Span lồng nhau biểu diễn các bước con.' },
      { level: 'deep', content: 'Ghi nhận toàn bộ sơ đồ thời gian chạy và lỗi của từng tác vụ trong luồng.' }
    ],
    concepts: ['d10-observability']
  },
  {
    id: 310,
    setId: 'day10-observability',
    sourceTitle: 'Day 10 - Data Observability.pdf',
    sourcePage: 'Slide 5',
    sourceExcerpt: 'Semantic drift monitoring measures the divergence between training data embeddings and production user queries over time.',
    question: 'Mục đích của việc giám sát hiện tượng "Semantic Drift" (lệch ngữ nghĩa) trong hệ thống AI RAG là gì?',
    options: {
      A: 'Theo dõi dung lượng ổ đĩa của cơ sở dữ liệu vector.',
      B: 'Phát hiện sự khác biệt về phân phối ngữ nghĩa giữa câu hỏi người dùng thực tế và dữ liệu huấn luyện/nạp sẵn theo thời gian.',
      C: 'Kiểm tra xem mô hình ngôn ngữ lớn có bị lỗi mất kết nối mạng hay không.',
      D: 'Tính toán chi phí tiền điện chạy các máy chủ card đồ họa GPU.'
    },
    answer: 'B',
    explanation: 'Semantic Drift đo lường sự dịch chuyển ngữ nghĩa của truy vấn người dùng so với cơ sở dữ liệu hiện có, giúp phát hiện khi nào cần nạp thêm tài liệu mới hoặc điều chỉnh hệ thống.',
    difficulty: 'khó',
    published_status: 'draft',
    hints: [
      { level: 'light', content: 'Semantic có nghĩa là ngữ nghĩa, Drift có nghĩa là dịch chuyển.' },
      { level: 'medium', content: 'Nghĩ đến việc so sánh phân phối vector câu hỏi thực tế so với kho dữ liệu mẫu.' },
      { level: 'deep', content: 'Giúp nhận diện sự thay đổi hành vi người dùng hoặc lỗ hổng tri thức mới xuất hiện.' }
    ],
    concepts: ['d10-observability']
  }
];

const FILTER_OPTIONS: Array<{ id: 'all' | QuestionPublishedStatus; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'draft', label: 'Chờ duyệt' },
  { id: 'published', label: 'Đã duyệt' },
  { id: 'rejected', label: 'Từ chối' },
];

const EMPTY_HINTS: QuestionHint[] = [
  { level: 'light', content: '' },
  { level: 'medium', content: '' },
  { level: 'deep', content: '' },
];

export interface QuizEditorTabProps {
  initialSourceFilter?: string;
  onClearSourceFilter?: () => void;
}

export const QuizEditorTab: React.FC<QuizEditorTabProps> = ({
  initialSourceFilter,
  onClearSourceFilter,
}) => {
  const demoMode = isDemoMode();
  const token = useBoundStore((s) => s.token);
  const [questions, setQuestions] = useState<EditorQuestion[]>(demoMode ? MOCK_QUESTIONS : []);
  const [statusFilter, setStatusFilter] = useState<'all' | QuestionPublishedStatus>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [conceptFilter, setConceptFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [activeQuestionId, setActiveQuestionId] = useState<string | number>(demoMode ? MOCK_QUESTIONS[0]?.id ?? 0 : 0);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectPanel, setShowRejectPanel] = useState(false);

  const [conceptsList, setConceptsList] = useState<ConceptOption[]>([]);
  const [availableDocs, setAvailableDocs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusCounts, setStatusCounts] = useState({ draft: 0, published: 0, rejected: 0, total: 0 });

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load concepts list
  useEffect(() => {
    async function loadConcepts() {
      if (demoMode) {
        setConceptsList(UNIQUE_CONCEPTS.map(c => ({ id: c.code, code: c.code, name: c.name })));
        return;
      }
      try {
        const data = await fetchConcepts();
        setConceptsList(data);
      } catch (err) {
        console.error("Failed to load concepts for review filters:", err);
      }
    }
    loadConcepts();
  }, [demoMode]);

  // Load available documents from materials list
  useEffect(() => {
    async function loadDocs() {
      if (demoMode) return;
      try {
        const materials = await fetchMaterials(token);
        setAvailableDocs(materials.map((m: any) => m.name));
      } catch (err) {
        console.error("Failed to load documents list for review filter:", err);
      }
    }
    loadDocs();
  }, [demoMode, token]);

  // Load review questions from API when in real mode
  useEffect(() => {
    if (demoMode) return;

    let ignore = false;
    async function loadQuestions() {
      setIsLoading(true);
      setError(null);
      try {
        const params = {
          status: statusFilter === 'all' ? undefined : statusFilter,
          source_document: sourceFilter === 'all' ? undefined : sourceFilter,
          concept_code: conceptFilter === 'all' ? undefined : conceptFilter,
          search: debouncedSearch.trim() || undefined,
        };
        const res = await fetchReviewQuestions(params, token);
        if (!ignore) {
          const mappedQuestions = res.items.map((q: any) => ({
            ...q,
            rejection_reason: q.rejection_reason ?? undefined
          } as EditorQuestion));
          setQuestions(mappedQuestions);
          if (mappedQuestions.length > 0) {
            const hasActive = mappedQuestions.some((q: EditorQuestion) => q.id === activeQuestionId);
            if (!hasActive) {
              setActiveQuestionId(mappedQuestions[0].id);
            }
          } else {
            setActiveQuestionId(0);
          }
        }
      } catch (err: any) {
        if (!ignore) {
          setError(err.message || "Không thể tải danh sách câu hỏi.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }
    loadQuestions();
    return () => {
      ignore = true;
    };
  }, [demoMode, statusFilter, sourceFilter, conceptFilter, debouncedSearch, token]);

  // Load status counts from API when in real mode
  useEffect(() => {
    let timerId: any;
    if (demoMode) {
      const draftVal = questions.filter((q: EditorQuestion) => q.published_status === 'draft').length;
      const pubVal = questions.filter((q: EditorQuestion) => q.published_status === 'published').length;
      const rejVal = questions.filter((q: EditorQuestion) => q.published_status === 'rejected').length;
      const totalVal = questions.length;
      timerId = setTimeout(() => {
        setStatusCounts({
          draft: draftVal,
          published: pubVal,
          rejected: rejVal,
          total: totalVal,
        });
      }, 0);
    } else {
      async function loadStats() {
        try {
          const [draftRes, pubRes, rejRes, allRes] = await Promise.all([
            fetchReviewQuestions({ status: 'draft', limit: 1 }, token),
            fetchReviewQuestions({ status: 'published', limit: 1 }, token),
            fetchReviewQuestions({ status: 'rejected', limit: 1 }, token),
            fetchReviewQuestions({ limit: 1 }, token),
          ]);
          setStatusCounts({
            draft: draftRes.total,
            published: pubRes.total,
            rejected: rejRes.total,
            total: allRes.total,
          });
        } catch (err) {
          console.error("Failed to load status counts:", err);
        }
      }
      loadStats();
    }

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [demoMode, questions, token]);

  // Sync initialSourceFilter from dashboard redirect
  useEffect(() => {
    let timerId: any;
    if (initialSourceFilter) {
      const matchingQuest = questions.find((q) => q.sourceTitle === initialSourceFilter);
      timerId = setTimeout(() => {
        setSourceFilter(initialSourceFilter);
        setStatusFilter('all');
        if (matchingQuest) {
          setActiveQuestionId(matchingQuest.id);
        }
      }, 0);
    }
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [initialSourceFilter, questions]);

  const handleClearSourceFilter = () => {
    setSourceFilter('all');
    if (onClearSourceFilter) {
      onClearSourceFilter();
    }
  };

  const uniqueDocuments = useMemo(() => {
    if (demoMode) {
      const docs = new Set(questions.map((q) => q.sourceTitle));
      return Array.from(docs);
    }
    return availableDocs;
  }, [demoMode, questions, availableDocs]);

  // Filter logic (only applies in demoMode)
  const filteredQuestions = useMemo(() => {
    if (!demoMode) return questions;

    return questions.filter((q) => {
      const matchStatus = statusFilter === 'all' || q.published_status === statusFilter;
      const matchSource = sourceFilter === 'all' || q.sourceTitle === sourceFilter;
      const matchDiff = difficultyFilter === 'all' || q.difficulty === difficultyFilter;
      const matchConcept =
        conceptFilter === 'all' || (q.concepts && q.concepts.includes(conceptFilter));
      const matchSearch =
        searchQuery.trim() === '' ||
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.explanation?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchStatus && matchSource && matchDiff && matchConcept && matchSearch;
    });
  }, [demoMode, questions, statusFilter, sourceFilter, difficultyFilter, conceptFilter, searchQuery]);

  // Group filtered questions by source document
  const groupedQuestions = useMemo(() => {
    return filteredQuestions.reduce<Record<string, EditorQuestion[]>>((acc: Record<string, EditorQuestion[]>, question: EditorQuestion) => {
      const key = question.sourceTitle;
      if (!acc[key]) acc[key] = [];
      acc[key].push(question);
      return acc;
    }, {});
  }, [filteredQuestions]);

  const activeQuestion = useMemo(() => {
    const found = questions.find((q) => q.id === activeQuestionId);
    if (found) return found;
    // Fallback to first filtered question if active question not in results
    return filteredQuestions[0] ?? null;
  }, [questions, activeQuestionId, filteredQuestions]);

  // Helper to sync state when activeQuestion fallback changes activeQuestionId
  useEffect(() => {
    if (activeQuestion && activeQuestion.id !== activeQuestionId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveQuestionId(activeQuestion.id);
    }
  }, [activeQuestion, activeQuestionId]);

  const updateQuestion = (id: string | number, patch: Partial<EditorQuestion>) => {
    setQuestions((current) =>
      current.map((q) => (q.id === id ? { ...q, ...patch } : q))
    );
  };

  const updateOption = (key: 'A' | 'B' | 'C' | 'D', value: string) => {
    if (!activeQuestion) return;
    updateQuestion(activeQuestion.id, {
      options: {
        A: activeQuestion.options?.A ?? '',
        B: activeQuestion.options?.B ?? '',
        C: activeQuestion.options?.C ?? '',
        D: activeQuestion.options?.D ?? '',
        [key]: value,
      },
    });
  };

  const updateHint = (level: QuestionHint['level'], value: string) => {
    if (!activeQuestion) return;
    const currentHints = activeQuestion.hints?.length ? activeQuestion.hints : EMPTY_HINTS;
    updateQuestion(activeQuestion.id, {
      hints: currentHints.map((hint: QuestionHint) => (hint.level === level ? { ...hint, content: value } : hint)),
    });
  };

  // Concept tag toggler
  const toggleConceptTag = (conceptCode: string) => {
    if (!activeQuestion) return;
    const currentConcepts = activeQuestion.concepts ?? [];
    const nextConcepts = currentConcepts.includes(conceptCode)
      ? currentConcepts.filter((c: string) => c !== conceptCode)
      : [...currentConcepts, conceptCode];
    updateQuestion(activeQuestion.id, { concepts: nextConcepts });
  };

  const moveToNextQuestion = () => {
    if (filteredQuestions.length <= 1) return;
    const currentIndex = filteredQuestions.findIndex((q: EditorQuestion) => q.id === activeQuestionId);
    const nextQuestion = filteredQuestions[currentIndex + 1] ?? filteredQuestions[0];
    if (nextQuestion) {
      setActiveQuestionId(nextQuestion.id);
    }
  };

  const publishQuestion = async () => {
    if (!activeQuestion) return;
    
    if (demoMode) {
      updateQuestion(activeQuestion.id, {
        published_status: 'published',
        rejection_reason: undefined,
      });
      moveToNextQuestion();
      return;
    }

    setIsLoading(true);
    try {
      await updateReviewQuestionStatus(String(activeQuestion.id), { status: 'published' }, token);
      updateQuestion(activeQuestion.id, {
        published_status: 'published',
        rejection_reason: undefined,
      });
      moveToNextQuestion();
    } catch (err: any) {
      alert("Lỗi khi duyệt câu hỏi: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const saveDraft = async () => {
    if (!activeQuestion) return;
    
    if (demoMode) {
      updateQuestion(activeQuestion.id, {
        published_status: 'draft',
      });
      return;
    }

    setIsLoading(true);
    try {
      const formattedHints: QuizReviewHint[] = (activeQuestion.hints || []).map((h: QuestionHint) => ({
        level: h.level as "light" | "medium" | "deep",
        content: h.content
      }));

      const payload = {
        question_text: activeQuestion.question,
        options: {
          A: activeQuestion.options?.A ?? '',
          B: activeQuestion.options?.B ?? '',
          C: activeQuestion.options?.C ?? '',
          D: activeQuestion.options?.D ?? '',
        },
        correct_answer: activeQuestion.answer as "A" | "B" | "C" | "D",
        explanation: activeQuestion.explanation,
        difficulty: activeQuestion.difficulty as QuizDifficulty,
        hints: formattedHints,
        concept_codes: activeQuestion.concepts || [],
      };

      await updateReviewQuestionContent(String(activeQuestion.id), payload, token);
      alert("Đã lưu các thay đổi thành công!");
    } catch (err: any) {
      alert("Lỗi khi lưu thay đổi: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const rejectQuestion = async () => {
    if (!activeQuestion || !rejectReason.trim()) return;
    
    if (demoMode) {
      updateQuestion(activeQuestion.id, {
        published_status: 'rejected',
        rejection_reason: rejectReason.trim(),
      });
      setRejectReason('');
      setShowRejectPanel(false);
      moveToNextQuestion();
      return;
    }

    setIsLoading(true);
    try {
      await updateReviewQuestionStatus(
        String(activeQuestion.id),
        { status: 'rejected', rejection_reason: rejectReason.trim() },
        token
      );
      updateQuestion(activeQuestion.id, {
        published_status: 'rejected',
        rejection_reason: rejectReason.trim(),
      });
      setRejectReason('');
      setShowRejectPanel(false);
      moveToNextQuestion();
    } catch (err: any) {
      alert("Lỗi khi từ chối câu hỏi: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusLabel = (status?: QuestionPublishedStatus) => {
    switch (status) {
      case 'published':
        return 'Đã duyệt';
      case 'rejected':
        return 'Từ chối';
      default:
        return 'Chờ duyệt';
    }
  };

  const getStatusClasses = (status?: QuestionPublishedStatus) => {
    switch (status) {
      case 'published':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'rejected':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      default:
        return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 font-be-vietnam-pro xl:grid-cols-[320px_minmax(0,1fr)_300px]">
      {/* ========================================================================= */}
      {/* SIDEBAR QUEUE & FILTERS                                                   */}
      {/* ========================================================================= */}
      <aside className="h-fit space-y-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 font-mono">
              Hàng chờ thẩm định
            </p>
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-green" />}
          </div>
          <h3 className="font-fraunces font-black text-base text-on-background">
            Duyệt Câu Hỏi (HITL)
          </h3>
          <p className="text-[11px] text-stone-400 font-semibold leading-relaxed">
            Chỉnh sửa nội dung và 3 cấp độ gợi ý Socratic do AI sinh trước khi xuất bản cho học viên luyện tập.
          </p>
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-100 p-2.5 text-[11px] text-rose-700 font-semibold mt-2 flex gap-1.5 items-center">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Status quick tabs */}
        <div className="flex flex-wrap gap-1 border-b border-stone-100 pb-3">
          {FILTER_OPTIONS.map((option) => {
            const isActive = statusFilter === option.id;
            let count = 0;
            if (option.id === 'all') count = statusCounts.total;
            else if (option.id === 'draft') count = statusCounts.draft;
            else if (option.id === 'published') count = statusCounts.published;
            else if (option.id === 'rejected') count = statusCounts.rejected;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setStatusFilter(option.id)}
                className={`rounded-xl px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wide transition-all ${
                  isActive
                    ? 'bg-primary-green/10 border border-primary-green/20 text-primary-green-dark'
                    : 'bg-white text-stone-500 hover:bg-stone-50'
                }`}
              >
                {option.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Search & Select dropdown filters */}
        <div className="space-y-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-stone-400" />
            <input
              type="text"
              placeholder="Tìm câu hỏi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-border bg-stone-50/30 pl-9 pr-4 py-2.5 text-xs font-semibold text-stone-700 focus:border-primary-green focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-stone-400">Tài liệu nguồn</label>
            <div className="relative">
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-border bg-white px-3 py-2 text-xs font-semibold text-stone-700 focus:border-primary-green focus:outline-none pr-8"
              >
                <option value="all">Tất cả tài liệu</option>
                {uniqueDocuments.map((doc: string) => (
                  <option key={doc} value={doc}>
                    {doc}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
            </div>
            {sourceFilter !== 'all' && (
              <button
                onClick={handleClearSourceFilter}
                className="text-[9px] font-black text-rose-600 hover:underline flex items-center gap-0.5 mt-0.5"
              >
                <X className="w-2.5 h-2.5" /> Xóa bộ lọc tài liệu nguồn
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-stone-400">Độ khó</label>
              <div className="relative">
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-gray-border bg-white px-3 py-2 text-xs font-semibold text-stone-700 focus:border-primary-green focus:outline-none pr-8"
                >
                  <option value="all">Tất cả</option>
                  <option value="dễ">Dễ</option>
                  <option value="bình thường">Bình thường</option>
                  <option value="khó">Khó</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-stone-400">Concept</label>
              <div className="relative">
                <select
                  value={conceptFilter}
                  onChange={(e) => setConceptFilter(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-gray-border bg-white px-3 py-2 text-xs font-semibold text-stone-700 focus:border-primary-green focus:outline-none pr-8"
                >
                  <option value="all">Tất cả</option>
                  {conceptsList.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable list grouped by document */}
        <div className="max-h-[500px] overflow-y-auto custom-scrollbar space-y-4 pr-1 border-t border-stone-100 pt-3">
          {Object.entries(groupedQuestions).map(([docTitle, docQuestions]: [string, EditorQuestion[]]) => (
            <div key={docTitle} className="space-y-2">
              <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-stone-400">
                <BookCopy className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                <span className="line-clamp-1">{docTitle}</span>
              </div>

              <div className="space-y-1.5">
                {docQuestions.map((q: EditorQuestion) => {
                  const isActive = activeQuestionId === q.id;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setActiveQuestionId(q.id)}
                      className={`w-full rounded-2xl border p-3 text-left transition-all ${
                        isActive
                          ? 'border-primary-green bg-primary-green/5 ring-1 ring-primary-green/10'
                          : 'border-stone-200 bg-white hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase text-stone-400 font-mono">
                            ID: #{q.id} • {q.difficulty}
                          </p>
                          <p className="text-xs font-extrabold text-stone-700 line-clamp-2 leading-relaxed">
                            {q.question}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[8px] font-black uppercase ${getStatusClasses(
                            q.published_status
                          )}`}
                        >
                          {getStatusLabel(q.published_status)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredQuestions.length === 0 && (
            <div className="text-center py-10">
              <HelpCircle className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="text-xs font-bold text-stone-400 mt-2">
                Không tìm thấy câu hỏi nào.
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* EDITOR CANVAS                                                             */}
      {/* ========================================================================= */}
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm md:p-6">
        {activeQuestion ? (
          <div className="space-y-5">
            {/* Context Meta Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-stone-100 pb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 font-mono">
                  Trình soạn thảo HITL (Human-in-the-loop)
                </p>
                <h3 className="text-md font-black text-stone-800 font-fraunces mt-0.5 line-clamp-1">
                  {activeQuestion.sourceTitle}
                </h3>
                <p className="text-[11px] text-stone-400 font-semibold mt-1">
                  Chỉnh sửa câu hỏi, đáp án, giải thích, và bộ gợi ý trích xuất theo tài liệu.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                <span
                  className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wide ${getStatusClasses(
                    activeQuestion.published_status
                  )}`}
                >
                  {getStatusLabel(activeQuestion.published_status)}
                </span>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-blue-700 font-mono">
                  #{activeQuestion.setId}
                </span>
              </div>
            </div>

            {/* Question Text Area */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-stone-400">Nội dung câu hỏi</label>
              <textarea
                value={activeQuestion.question}
                onChange={(e) => updateQuestion(activeQuestion.id, { question: e.target.value })}
                className="min-h-24 w-full rounded-2xl border-2 border-gray-border bg-white px-4 py-3 text-xs font-semibold text-stone-700 focus:border-primary-green focus:outline-none focus:ring-1 focus:ring-primary-green/10 leading-relaxed"
              />
            </div>

            {/* Distractor Choices (Simplified Premium Layout) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(['A', 'B', 'C', 'D'] as const).map((key) => {
                const isCorrect = activeQuestion.answer === key;
                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <span className={`text-[10px] font-black uppercase font-mono ${
                        isCorrect ? 'text-primary-green-dark font-black' : 'text-stone-400'
                      }`}>
                        Đáp án {key}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuestion(activeQuestion.id, { answer: key })}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border-2 transition-all cursor-pointer ${
                          isCorrect
                            ? 'bg-primary-green/10 border-primary-green/30 text-primary-green-dark'
                            : 'bg-white border-stone-200 text-stone-400 hover:border-stone-300 hover:text-stone-600'
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${isCorrect ? 'bg-primary-green-dark animate-pulse' : 'bg-stone-300'}`} />
                        Đúng
                      </button>
                    </div>

                    <textarea
                      value={activeQuestion.options?.[key] ?? ''}
                      onChange={(e) => updateOption(key, e.target.value)}
                      className={`min-h-[70px] w-full rounded-2xl border-2 px-4 py-3 text-xs font-semibold leading-relaxed focus:outline-none transition-all ${
                        isCorrect
                          ? 'border-primary-green bg-primary-green/5 text-stone-800 focus:border-primary-green-dark'
                          : 'border-gray-border bg-white text-stone-700 focus:border-primary-green'
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Explanation & Difficulty Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-stone-400">Lời giải thích chi tiết</label>
                <textarea
                  value={activeQuestion.explanation ?? ''}
                  onChange={(e) => updateQuestion(activeQuestion.id, { explanation: e.target.value })}
                  className="min-h-28 w-full rounded-2xl border-2 border-gray-border bg-white px-4 py-3 text-xs font-semibold text-stone-700 focus:border-primary-green focus:outline-none focus:ring-1 focus:ring-primary-green/10 leading-relaxed"
                />
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-stone-400">Độ khó câu hỏi</label>
                    <div className="relative">
                      <select
                        value={activeQuestion.difficulty ?? 'bình thường'}
                        onChange={(e) =>
                          updateQuestion(activeQuestion.id, {
                            difficulty: e.target.value as QuizDifficulty,
                          })
                        }
                        className="w-full appearance-none rounded-xl border-2 border-gray-border bg-white px-3 py-2.5 text-xs font-semibold text-stone-700 focus:border-primary-green focus:outline-none pr-8"
                      >
                        <option value="dễ">Dễ</option>
                        <option value="bình thường">Bình thường</option>
                        <option value="khó">Khó</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-stone-400" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-stone-400">Concept gán nhãn</label>
                    <div className="relative">
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            toggleConceptTag(e.target.value);
                            e.target.value = ""; // Reset select option
                          }
                        }}
                        className="w-full appearance-none rounded-xl border-2 border-gray-border bg-white px-3 py-2.5 text-xs font-semibold text-stone-700 focus:border-primary-green focus:outline-none pr-8"
                      >
                        <option value="">-- Chọn concept để gán nhãn --</option>
                        {conceptsList
                          .filter((c) => !(activeQuestion.concepts?.includes(c.code)))
                          .map((concept) => (
                            <option key={concept.code} value={concept.code}>
                              {concept.name}
                            </option>
                          ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-stone-400" />
                    </div>

                    {/* Display selected concepts as small closable badges */}
                    {activeQuestion.concepts && activeQuestion.concepts.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5 max-h-20 overflow-y-auto custom-scrollbar">
                        {activeQuestion.concepts.map((code) => {
                          const concept = conceptsList.find((c) => c.code === code);
                          return (
                            <span
                              key={code}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-primary-green/10 border border-primary-green/30 text-primary-green-dark"
                            >
                              <span>{concept?.name ?? code}</span>
                              <button
                                type="button"
                                onClick={() => toggleConceptTag(code)}
                                className="hover:bg-primary-green/20 rounded p-0.5 shrink-0"
                              >
                                <X className="w-2.5 h-2.5 text-primary-green-dark" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {activeQuestion.rejection_reason && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-black uppercase text-rose-700">Lý do bị từ chối trước đó</p>
                      <p className="text-xs font-semibold text-rose-700 mt-0.5">{activeQuestion.rejection_reason}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Socratic Hints */}
            <div className="space-y-2 border-t border-stone-100 pt-4">
              <div className="flex items-center gap-1.5">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <h4 className="text-[10px] font-black uppercase tracking-wider text-stone-400">
                  Bộ Gợi Ý Socratic (3 Cấp Độ)
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {HINT_LEVELS.map((hintLevel) => {
                  const currentHints = activeQuestion.hints?.length ? activeQuestion.hints : EMPTY_HINTS;
                  const hint = currentHints.find((h: QuestionHint) => h.level === hintLevel.key);
                  return (
                    <div
                      key={hintLevel.key}
                      className="rounded-2xl border border-gray-border bg-stone-50/30 p-3 space-y-1.5"
                    >
                      <label className="text-[9px] font-black uppercase text-stone-400">
                        {hintLevel.label}
                      </label>
                      <textarea
                        value={hint?.content ?? ''}
                        onChange={(e) => updateHint(hintLevel.key, e.target.value)}
                        className="min-h-16 w-full rounded-xl border-2 border-gray-border bg-white px-3 py-2 text-xs font-semibold text-stone-700 focus:border-primary-green focus:outline-none leading-relaxed"
                      />
                    </div>
                  );
                })}
              </div>
            </div>


            {/* Rejection input popover details */}
            {showRejectPanel && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 space-y-3">
                <div className="flex items-center gap-2 text-rose-700">
                  <CircleSlash className="h-4 w-4" />
                  <p className="text-xs font-black uppercase">Nhập lý do từ chối câu hỏi</p>
                </div>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập ghi chú phản hồi, ví dụ: Sai lệch tri thức slide, distractor quá phi thực tế..."
                  className="min-h-16 w-full rounded-xl border-2 border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 focus:border-rose-500 focus:outline-none"
                />
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={rejectQuestion} className="btn-3d btn-red text-[10px] py-1.5 px-3">
                    Xác nhận từ chối
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRejectPanel(false);
                      setRejectReason('');
                    }}
                    className="btn-3d btn-white text-[10px] py-1.5 px-3"
                  >
                    Hủy bỏ
                  </button>
                </div>
              </div>
            )}

            {/* Action Bottom Bar */}
            <div className="flex flex-wrap gap-2 border-t border-stone-100 pt-4 xl:hidden">
              <button type="button" onClick={publishQuestion} className="btn-3d btn-green text-[10px] py-2 px-4 flex items-center gap-1">
                <Send className="w-3.5 h-3.5" />
                <span>Duyệt & Xuất bản</span>
              </button>
              <button
                type="button"
                onClick={() => setShowRejectPanel((prev) => !prev)}
                className="btn-3d btn-red text-[10px] py-2 px-4 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Từ chối</span>
              </button>
              <button type="button" onClick={saveDraft} className="btn-3d btn-white text-[10px] py-2 px-4 flex items-center gap-1">
                <Save className="w-3.5 h-3.5" />
                <span>Lưu nháp</span>
              </button>
              <button
                type="button"
                onClick={moveToNextQuestion}
                className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-stone-500 hover:bg-stone-100 font-mono ml-auto"
              >
                <SkipForward className="h-4 w-4" />
                <span>Bỏ qua</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border-2 border-dashed border-gray-border bg-stone-50/50 px-6 py-16 text-center">
            <FileEdit className="mx-auto h-10 w-10 text-stone-300 animate-pulse" />
            <p className="mt-3 text-xs font-black text-stone-400">
              Không có câu hỏi nào trong hàng chờ tương ứng với các bộ lọc hiện tại.
            </p>
          </div>
        )}
      </section>

      <aside className="h-fit space-y-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm xl:sticky xl:top-4">
        {activeQuestion ? (
          <>
            <div className="space-y-1 border-b border-stone-100 pb-4">
              <p className="font-mono text-[10px] font-black uppercase tracking-widest text-stone-400">
                Nguồn trích xuất
              </p>
              <h3 className="font-fraunces text-base font-black leading-snug text-stone-800">
                {activeQuestion.sourceTitle}
              </h3>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-1 font-mono text-[9px] font-black uppercase text-stone-500">
                  {activeQuestion.sourcePage}
                </span>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 font-mono text-[9px] font-black uppercase text-blue-700">
                  #{activeQuestion.setId}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700">
                    Độ khớp nguồn
                  </p>
                  <p className="mt-1 text-2xl font-black text-emerald-700">92%</p>
                </div>
                <Layers className="h-8 w-8 text-emerald-500" />
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                <div className="h-full w-[92%] rounded-full bg-primary-green" />
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-mono text-[9px] font-black uppercase tracking-widest text-stone-400">
                Đoạn liên quan
              </p>
              <blockquote className="rounded-xl border border-stone-200 bg-stone-50/70 p-3 text-xs font-semibold leading-relaxed text-stone-600">
                {activeQuestion.sourceExcerpt}
              </blockquote>
            </div>

            <div className="space-y-2">
              <p className="font-mono text-[9px] font-black uppercase tracking-widest text-stone-400">
                Tín hiệu chất lượng
              </p>
              {[
                'Câu hỏi bám sát nguồn',
                'Đáp án đúng đã được đánh dấu',
                'Có đủ 3 gợi ý Socratic',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2"
                >
                  <CheckCircle className="h-4 w-4 shrink-0 text-primary-green-dark" />
                  <span className="text-[11px] font-black text-stone-600">{item}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t border-stone-100 pt-4">
              <button
                type="button"
                onClick={saveDraft}
                className="btn-3d btn-green flex w-full items-center justify-center gap-2 px-4 py-2.5 text-[10px]"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Lưu thay đổi</span>
              </button>
              <button
                type="button"
                onClick={publishQuestion}
                className="btn-3d btn-white flex w-full items-center justify-center gap-2 px-4 py-2.5 text-[10px]"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Duyệt câu hỏi</span>
              </button>
              <button
                type="button"
                onClick={() => setShowRejectPanel((prev) => !prev)}
                className="btn-3d btn-red flex w-full items-center justify-center gap-2 px-4 py-2.5 text-[10px]"
              >
                <X className="h-3.5 w-3.5" />
                <span>Từ chối</span>
              </button>
              <button
                type="button"
                onClick={moveToNextQuestion}
                className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase text-stone-500 transition hover:bg-stone-100"
              >
                <SkipForward className="h-4 w-4" />
                <span>Bỏ qua câu này</span>
              </button>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-gray-border bg-stone-50/50 px-5 py-10 text-center">
            <BookCopy className="mx-auto h-9 w-9 text-stone-300" />
            <p className="mt-3 text-xs font-black text-stone-400">
              Chọn một câu hỏi để xem nguồn và thao tác duyệt.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
};
