import hashlib
import logging
import os
import tempfile
from pathlib import Path
from typing import Any

import requests
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Query, UploadFile
from pydantic import BaseModel

from src.api.adaptive_routes import AuthenticatedUser, require_role
from src.config import get_settings
from src.services.quiz_generator import generate_quizzes_from_slides_task
from src.services.rag_ingestion_adapters import (
    OpenAIEmbeddingProvider,
    extract_page_with_ocr,
    render_page_preview,
)
from src.services.rag_ingestion_service import CorpusDocument, RagIngestionRunner
from src.services.rag_supabase_repository import SupabaseRagError, SupabaseRagRepository
from src.services.supabase_config import get_backend_supabase_config

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/materials", tags=["Material Management"])


def _rag_repository() -> SupabaseRagRepository:
    config = get_backend_supabase_config(allow_stub=False)
    return SupabaseRagRepository(url=config.url, secret_key=config.secret_key)


def _rag_runner(repository: SupabaseRagRepository) -> RagIngestionRunner:
    settings = get_settings()
    return RagIngestionRunner(
        repository=repository,
        embedder=OpenAIEmbeddingProvider(os.environ.get("OPENAI_API_KEY") or settings.openai_api_key),
        page_extractor=lambda pdf, page: extract_page_with_ocr(
            pdf,
            page,
            dpi=settings.ocr_dpi,
            lang=settings.ocr_lang,
            tesseract_cmd=settings.tesseract_cmd or None,
        ),
        preview_renderer=render_page_preview,
        chunk_chars=settings.rag_chunk_chars,
        overlap_chars=settings.rag_chunk_overlap_chars,
        ocr_workers=4,
    )


def _run_uploaded_rag_ingestion(
    document: CorpusDocument,
    course_id: str,
    material_id: str,
    job_id: str,
) -> None:
    try:
        repository = _rag_repository()
        _rag_runner(repository).ingest_document(
            document,
            course_id=course_id,
            existing_ingestion=(material_id, job_id),
        )
    except Exception:
        logger.exception("RAG ingestion job %s failed", job_id)
    finally:
        document.pdf_path.unlink(missing_ok=True)


class QuizGenRequest(BaseModel):
    num_questions: int = 5
    difficulty: str = "bình thường"
    socratic_hints: bool = True
    concept_code: str


@router.get("")
def list_materials(
    user: AuthenticatedUser = Depends(require_role(["mentor", "admin", "dev"])),
):
    """
    List all teaching materials and aggregate statistics (total slides, quiz questions count).
    """
    config = get_backend_supabase_config(allow_stub=True)
    if config.is_stub:
        return []

    supabase_url = config.url
    supabase_api_key = config.secret_key

    headers = {
        "apikey": supabase_api_key,
        "Authorization": f"Bearer {supabase_api_key}",
        "Accept": "application/json",
    }

    # 1. Fetch all slide embeddings (metadata only)
    slides_url = f"{supabase_url}/rest/v1/slide_embeddings"
    slides_params = {
        "select": "document_name,slide_number,created_at",
    }
    slides_resp = requests.get(slides_url, headers=headers, params=slides_params)
    if slides_resp.status_code != 200:
        logger.error(f"Failed to fetch slide embeddings: {slides_resp.status_code} - {slides_resp.text}")
        raise HTTPException(status_code=503, detail="Failed to fetch materials metadata.")

    # 2. Fetch all questions metadata
    questions_url = f"{supabase_url}/rest/v1/questions"
    questions_headers = {
        "apikey": supabase_api_key,
        "Authorization": f"Bearer {supabase_api_key}",
        "Accept": "application/json",
        "Accept-Profile": "app",
    }
    questions_params = {
        "select": "id,source_document_name,calibration_status",
    }
    questions_resp = requests.get(questions_url, headers=questions_headers, params=questions_params)
    questions = []
    if questions_resp.status_code == 200:
        questions = questions_resp.json()
    else:
        logger.warning(f"Failed to fetch questions stats: {questions_resp.status_code} - {questions_resp.text}")

    # 3. Aggregate statistics in Python
    # Map document name to slide list
    docs_map: dict[str, list[dict[str, Any]]] = {}
    for slide in slides_resp.json():
        doc_name = slide.get("document_name")
        if doc_name:
            docs_map.setdefault(doc_name, []).append(slide)

    # Map document name to quiz stats
    quiz_map: dict[str, dict[str, int]] = {}
    for q in questions:
        doc_name = q.get("source_document_name")
        if not doc_name:
            continue
        quiz_map.setdefault(doc_name, {"total": 0, "published": 0})
        quiz_map[doc_name]["total"] += 1
        if q.get("calibration_status") == "published":
            quiz_map[doc_name]["published"] += 1

    materials = []
    for doc_name, slide_list in docs_map.items():
        slide_numbers = [s.get("slide_number") or 0 for s in slide_list]
        total_slides = max(slide_numbers) if slide_numbers else len(slide_list)

        # Get earliest created_at as ingested_at
        created_times = [s.get("created_at") for s in slide_list if s.get("created_at")]
        ingested_at = min(created_times) if created_times else None

        quiz_stats = quiz_map.get(doc_name, {"total": 0, "published": 0})

        import re

        # Map concept and day label based on standard patterns or dynamic regex
        day_label = "Unknown"
        concept_code = "unknown"
        concept_name = "Unknown Concept"

        # Try to extract Day XX from document name
        day_match = re.search(r"(?:day|ngay)\s*0*(\d+)", doc_name, re.IGNORECASE)
        if day_match:
            day_num = int(day_match.group(1))
            day_label = f"Day {day_num:02d}"
        else:
            # Fallback to defaults or specific indicators
            if "prompt" in doc_name.lower():
                day_label = "Day 04"
            elif "observability" in doc_name.lower():
                day_label = "Day 10"
            elif "foundation" in doc_name.lower():
                day_label = "Day 01"
            elif "framing" in doc_name.lower():
                day_label = "Day 02"
            elif "rag" in doc_name.lower():
                day_label = "Day 08"

        # Map concept code based on name
        if "prompt" in doc_name.lower() or "d4" in doc_name.lower():
            concept_code = "d4-prompt-engineering"
            concept_name = "Prompt Engineering"
        elif "observability" in doc_name.lower() or "d10" in doc_name.lower():
            concept_code = "d10-observability"
            concept_name = "Data Observability"
        elif "foundation" in doc_name.lower() or "d1" in doc_name.lower():
            concept_code = "d1-ai-llm-foundations"
            concept_name = "AI & LLM Foundations"
        elif "framing" in doc_name.lower() or "d2" in doc_name.lower():
            concept_code = "d2-ai-problem-framing"
            concept_name = "AI Problem Framing"
        elif "rag" in doc_name.lower() or "d8" in doc_name.lower():
            concept_code = "d8-rag-pipeline"
            concept_name = "RAG Pipeline"

        materials.append(
            {
                "id": f"doc-{hash(doc_name)}",
                "name": doc_name,
                "dayLabel": day_label,
                "concept": concept_code,
                "conceptName": concept_name,
                "totalSlides": total_slides,
                "totalQuizGenerated": quiz_stats["total"],
                "totalQuizPublished": quiz_stats["published"],
                "status": "indexed",
                "uploadedAt": ingested_at.split("T")[0] if ingested_at else "2026-06-11",
                "fileType": "pdf",
            }
        )

    # Sort by uploadedAt desc, then name
    materials.sort(key=lambda x: (x["uploadedAt"], x["name"]), reverse=True)
    return materials


@router.get("/{document_name}/chunks")
def get_material_chunks(
    document_name: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: AuthenticatedUser = Depends(require_role(["mentor", "admin", "dev"])),
):
    """
    Get paginated chunks of a specific material.
    """
    config = get_backend_supabase_config(allow_stub=True)
    if config.is_stub:
        return {"document_name": document_name, "total_chunks": 0, "chunks": []}

    supabase_url = config.url
    supabase_api_key = config.secret_key

    headers = {
        "apikey": supabase_api_key,
        "Authorization": f"Bearer {supabase_api_key}",
        "Accept": "application/json",
    }

    # Fetch total chunks count
    count_url = f"{supabase_url}/rest/v1/slide_embeddings"
    count_params = {
        "document_name": f"eq.{document_name}",
        "select": "count",
    }
    headers_count = headers.copy()
    headers_count["Prefer"] = "count=exact"
    count_resp = requests.get(count_url, headers=headers_count, params=count_params)

    total_chunks = 0
    if count_resp.status_code == 200 or count_resp.status_code == 206:
        content_range = count_resp.headers.get("Content-Range")
        if content_range and "/" in content_range:
            try:
                total_chunks = int(content_range.split("/")[1])
            except ValueError:
                pass

    # Fetch paginated chunks
    offset = (page - 1) * page_size
    chunks_params = {
        "document_name": f"eq.{document_name}",
        "select": "slide_number,content,image_url",
        "order": "slide_number.asc",
        "limit": str(page_size),
        "offset": str(offset),
    }
    chunks_resp = requests.get(count_url, headers=headers, params=chunks_params)
    if chunks_resp.status_code != 200:
        logger.error(f"Failed to fetch chunks: {chunks_resp.status_code} - {chunks_resp.text}")
        raise HTTPException(status_code=503, detail="Failed to fetch material chunks.")

    chunks = [
        {
            "page": item["slide_number"],
            "title": f"Slide {item['slide_number']}",
            "text": item["content"],
            "image_url": item.get("image_url"),
        }
        for item in chunks_resp.json()
    ]

    return {
        "document_name": document_name,
        "total_chunks": total_chunks or len(chunks),
        "chunks": chunks,
    }


def download_and_ingest(storage_path: str, filename: str) -> None:
    """Background task to download PDF from storage and run slide ingestion."""
    from src.pipeline.ingest.rag_ingestion import ingest_slides

    config = get_backend_supabase_config(allow_stub=True)
    supabase_url = config.url
    supabase_api_key = config.secret_key

    headers = {
        "apikey": supabase_api_key,
        "Authorization": f"Bearer {supabase_api_key}",
    }

    # 1. Download file from Supabase Storage
    download_url = f"{supabase_url}/storage/v1/object/{storage_path}"
    logger.info(f"Downloading PDF from storage: {download_url}")
    resp = requests.get(download_url, headers=headers)
    if resp.status_code != 200:
        logger.error(f"Failed to download PDF from storage: {resp.status_code} - {resp.text}")
        return

    # 2. Save file temporarily in local pdf directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(current_dir))
    pdf_dir = os.path.join(project_root, "src", "pipeline", "data", "pdf")
    os.makedirs(pdf_dir, exist_ok=True)
    temp_path = os.path.join(pdf_dir, filename)

    try:
        with open(temp_path, "wb") as f:
            f.write(resp.content)

        logger.info(f"Saved temp file to {temp_path}. Starting ingestion...")
        # 3. Trigger ingest pipeline (which parses temp_path and uploads images/embeddings)
        ingest_slides(target_filter=filename)
        logger.info(f"Ingestion completed successfully for: {filename}")
    except Exception as e:
        logger.exception(f"Error during download and ingestion task: {e}")
    finally:
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
            logger.info(f"Cleaned up temp file at {temp_path}")


@router.get("/jobs/{job_id}")
def get_rag_ingestion_job(
    job_id: str,
    user: AuthenticatedUser = Depends(require_role(["mentor", "admin", "dev"])),
):
    try:
        job = _rag_repository().get_job(job_id)
    except (RuntimeError, SupabaseRagError) as exc:
        raise HTTPException(status_code=503, detail="Không thể tải trạng thái ingest.") from exc
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy ingestion job.")
    return job


@router.post("/upload", status_code=202)
async def upload_material(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    grade_level: int = Form(..., alias="gradeLevel"),
    subject_code: str = Form(..., alias="subjectCode"),
    title: str = Form(...),
    user: AuthenticatedUser = Depends(require_role(["mentor", "admin", "dev"])),
):
    """Queue a normalized PDF ingestion and return its durable Supabase job id."""
    filename = Path(file.filename or "upload.pdf").name
    if not filename.lower().endswith(".pdf") or file.content_type not in {None, "application/pdf"}:
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ tệp PDF.")
    if grade_level < 1 or grade_level > 6:
        raise HTTPException(status_code=400, detail="Khối lớp phải nằm trong khoảng 1–6.")
    file_bytes = await file.read()
    if not file_bytes or len(file_bytes) > 100 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="PDF rỗng hoặc vượt quá 100 MB.")

    temp_file = tempfile.NamedTemporaryFile(prefix="mentora-rag-", suffix=".pdf", delete=False)
    temp_path = Path(temp_file.name)
    try:
        temp_file.write(file_bytes)
        temp_file.close()
        import fitz

        with fitz.open(temp_path) as pdf:
            page_count = pdf.page_count
        repository = _rag_repository()
        course_id = "00000000-0000-0000-0000-000000000001"
        scope_id = repository.resolve_scope(
            course_id=course_id,
            grade_level=grade_level,
            subject_code=subject_code,
        )
        checksum = hashlib.sha256(file_bytes).hexdigest()
        existing = repository.find_published_material(scope_id=scope_id, checksum=checksum)
        if existing:
            temp_path.unlink(missing_ok=True)
            return {
                "status": "skipped",
                "materialId": existing["id"],
                "jobId": None,
                "message": "Tài liệu có cùng checksum đã được xuất bản.",
            }
        material_id, job_id = repository.start_ingestion(
            course_id=course_id,
            scope_id=scope_id,
            title=title.strip(),
            source_filename=filename,
            source_checksum=checksum,
            edition="Dashboard upload",
            page_count=page_count,
        )
        repository.upload_source(material_id, temp_path)
        document = CorpusDocument(
            title=title.strip(),
            pdf_path=temp_path,
            grade_level=grade_level,
            subject_code=subject_code,
            expected_pages=page_count,
            edition="Dashboard upload",
        )
        background_tasks.add_task(
            _run_uploaded_rag_ingestion,
            document,
            course_id,
            material_id,
            job_id,
        )
        return {"status": "accepted", "materialId": material_id, "jobId": job_id}
    except HTTPException:
        temp_file.close()
        temp_path.unlink(missing_ok=True)
        raise
    except Exception as exc:
        temp_file.close()
        temp_path.unlink(missing_ok=True)
        logger.exception("Unable to queue RAG upload")
        raise HTTPException(status_code=503, detail="Không thể tạo ingestion job.") from exc


@router.post("/{document_name}/generate-quizzes", status_code=202)
async def generate_quizzes(
    document_name: str,
    req: QuizGenRequest,
    background_tasks: BackgroundTasks,
    user: AuthenticatedUser = Depends(require_role(["mentor", "admin", "dev"])),
):
    """
    Trigger background task to generate quiz questions from slides content.
    """
    background_tasks.add_task(
        generate_quizzes_from_slides_task,
        document_name=document_name,
        num_questions=req.num_questions,
        difficulty=req.difficulty,
        socratic_hints=req.socratic_hints,
        concept_code=req.concept_code,
        user_id=str(user.id),
    )
    return {
        "status": "accepted",
        "document_name": document_name,
        "num_questions_requested": req.num_questions,
        "message": "AI quiz generation pipeline has been triggered in the background.",
    }
