import { getRequestAuthToken } from "@/lib/auth-token";

const MATERIALS_PATH = "/api/v1/materials";

export type DocumentStatus = "indexed" | "draft";

export interface MockDocument {
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
  fileType: "pdf" | "pptx" | "docx" | "md";
}

export interface MaterialChunk {
  page: number;
  title: string;
  text: string;
  image_url?: string | null;
}

export interface MaterialChunksResponse {
  document_name: string;
  total_chunks: number;
  chunks: MaterialChunk[];
}

export class MaterialsApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "MaterialsApiError";
    this.status = status;
  }
}

function authHeader(token?: string | null): HeadersInit {
  const { authToken } = getRequestAuthToken(token);
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

async function parseMaterialsError(response: Response): Promise<MaterialsApiError> {
  let message = `Materials API failed with status ${response.status}`;

  try {
    const body = await response.json();
    const detailMessage = typeof body?.detail === "object"
      ? body.detail?.message || JSON.stringify(body.detail)
      : body?.detail;
    message = String(detailMessage || body?.message || body?.error || message);
  } catch {
    message = response.statusText || message;
  }

  return new MaterialsApiError(message, response.status);
}

async function fetchJson<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) throw await parseMaterialsError(response);
  return response.json();
}

export async function fetchMaterials(token?: string | null): Promise<MockDocument[]> {
  return fetchJson<MockDocument[]>(MATERIALS_PATH, {
    headers: authHeader(token),
    cache: "no-store",
  });
}

export async function fetchMaterialChunks(
  documentName: string,
  page: number = 1,
  pageSize: number = 20,
  token?: string | null,
): Promise<MaterialChunksResponse> {
  const encodedName = encodeURIComponent(documentName);
  return fetchJson<MaterialChunksResponse>(
    `${MATERIALS_PATH}/${encodedName}/chunks?page=${page}&page_size=${pageSize}`,
    {
      headers: authHeader(token),
      cache: "no-store",
    },
  );
}

export async function uploadMaterial(
  file: File,
  token?: string | null,
): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);

  const headers = authHeader(token);
  // Important: Let the browser set the boundary for multipart/form-data. Do not set Content-Type header.
  const response = await fetch(`${MATERIALS_PATH}/upload`, {
    method: "POST",
    headers: headers,
    body: formData,
  });

  if (!response.ok) throw await parseMaterialsError(response);
  return response.json();
}

export async function generateQuizzes(
  documentName: string,
  params: {
    numQuestions: number;
    difficulty: string;
    socraticHints: boolean;
    conceptCode: string;
    promptOverride?: string;
  },
  token?: string | null,
): Promise<any> {
  const encodedName = encodeURIComponent(documentName);
  return fetchJson<any>(`${MATERIALS_PATH}/${encodedName}/generate-quizzes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
    body: JSON.stringify({
      num_questions: params.numQuestions,
      difficulty: params.difficulty,
      socratic_hints: params.socraticHints,
      concept_code: params.conceptCode,
      prompt_override: params.promptOverride || null,
    }),
  });
}

export async function generateQuizzesForWeakness(
  params: {
    studentId: string;
    conceptCode: string;
    documentName?: string;
    numQuestions: number;
    difficulty: string;
    socraticHints: boolean;
    promptOverride?: string;
  },
  token?: string | null,
): Promise<any> {
  return fetchJson<any>(`${MATERIALS_PATH}/generate-by-weakness`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
    body: JSON.stringify({
      student_id: params.studentId,
      concept_code: params.conceptCode,
      document_name: params.documentName || null,
      num_questions: params.numQuestions,
      difficulty: params.difficulty,
      socratic_hints: params.socraticHints,
      prompt_override: params.promptOverride || null,
    }),
  });
}


export interface ConceptOption {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export async function fetchConcepts(token?: string | null): Promise<ConceptOption[]> {
  return fetchJson<ConceptOption[]>("/api/v1/concepts", {
    headers: authHeader(token),
    cache: "no-store",
  });
}

