"""CLI: chạy full pipeline PDF -> Markdown -> Document Chunks -> LLM Extraction ->
Concept Normalization -> Graph Fusion -> Validation -> Coverage Report -> Supabase (Draft)
dành cho Toán lớp 6 và Sử-Địa lớp 6.

Usage:
    python scripts/kg_run_pipeline.py --subject math --course-code math-k6 --dry-run
    python scripts/kg_run_pipeline.py --subject history_geo --course-code hist-geo-k6
"""
from __future__ import annotations
import argparse
import json
import os
import re
import sys
import time
import unicodedata
import hashlib
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

_PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(_PROJECT_ROOT))

from dotenv import load_dotenv
load_dotenv(_PROJECT_ROOT / ".env")

from src.pipeline.transform.doc_converter import (
    convert_pdf_to_markdown_openai_vision,
    convert_pdf_to_markdown_pypdf,
)
from src.pipeline.graphusion.run_context import RunContext
from src.pipeline.graphusion.document_chunker import generate_chunks, DocumentChunk
from src.pipeline.graphusion.normalize_concepts import normalize_and_deduplicate
from src.pipeline.graphusion.validate_graph import validate_prerequisite_dag, resolve_relation_evidence_chunks
from src.pipeline.graphusion.coverage_report import generate_and_save_reports
from src.pipeline.graphusion.ingest_graph_to_db import IngestionService

LESSON_HEADING_RE = re.compile(r"^#{1,3}\s*Bài\s*(\d+)\b.*$", re.IGNORECASE | re.MULTILINE)

SUBJECTS = {
    "math": {
        "data_dir": _PROJECT_ROOT / "data" / "Math",
        "md_dir": _PROJECT_ROOT / "outputs" / "kg_source_md" / "math",
        "json_dir": _PROJECT_ROOT / "outputs" / "kg_lesson_json" / "math",
    },
    "history_geo": {
        "data_dir": _PROJECT_ROOT / "data" / "his&geo",
        "md_dir": _PROJECT_ROOT / "outputs" / "kg_source_md" / "history_geo",
        "json_dir": _PROJECT_ROOT / "outputs" / "kg_lesson_json" / "history_geo",
    },
}

INTER_CALL_DELAY_SECONDS = 1
MAX_RETRIES = 5

def slugify(name: str) -> str:
    base = os.path.splitext(name)[0]
    base = unicodedata.normalize("NFKD", base).encode("ascii", "ignore").decode("ascii")
    base = re.sub(r"[^a-zA-Z0-9]+", "-", base).strip("-").lower()
    return base or "book"

def load_direct_text_books() -> set[str]:
    path = _PROJECT_ROOT / "outputs" / "pdf_classification.json"
    if not path.exists():
        return set()
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    return {d["file"] for d in data if d.get("lane") == "direct_text"}

def split_into_lessons(markdown_text: str) -> list[tuple[str, str]]:
    matches = list(LESSON_HEADING_RE.finditer(markdown_text))
    lessons = []
    for i, m in enumerate(matches):
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(markdown_text)
        bai_num = m.group(1)
        slug = f"{i + 1:02d}-bai-{bai_num}"
        lessons.append((slug, markdown_text[start:end].strip()))
    return lessons

def with_retry(fn, *, label: str):
    from openai import APIConnectionError, APITimeoutError, RateLimitError
    delay = 15
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            return True, fn()
        except RateLimitError as e:
            print(f"  [!] [{label}] Rate limit (lần {attempt}/{MAX_RETRIES}): {e}")
        except (APITimeoutError, APIConnectionError) as e:
            print(f"  [!] [{label}] Lỗi mạng (lần {attempt}/{MAX_RETRIES}): {type(e).__name__}")
        except Exception as e:
            print(f"  [!] [{label}] Lỗi không xác định: {type(e).__name__}: {e}")
            return False, None
        if attempt < MAX_RETRIES:
            time.sleep(delay)
            delay = min(delay * 2, 60)
    return False, None

def convert_book(
    pdf_path: Path,
    md_path: Path,
    api_key: str,
    direct_text_books: set[str],
    vision_model: str = "gpt-4o-mini",
    vision_base_url: str | None = None,
) -> bool:
    if md_path.exists():
        print(f"[=] Markdown đã có, bỏ qua convert: {md_path.name}")
        return True
    md_path.parent.mkdir(parents=True, exist_ok=True)

    if pdf_path.name in direct_text_books:
        print(f"[*] Dùng pypdf trực tiếp: {pdf_path.name}")
        return bool(convert_pdf_to_markdown_pypdf(str(pdf_path), str(md_path)))

    print(f"[*] Convert vision-LLM ({vision_model}): {pdf_path.name}")
    ok, _ = with_retry(
        lambda: convert_pdf_to_markdown_openai_vision(
            str(pdf_path), str(md_path), api_key, model=vision_model, batch_size=3, base_url=vision_base_url
        ),
        label=f"convert:{pdf_path.name}",
    )
    if not ok and md_path.exists():
        # Delete partial file so next run retries from scratch
        md_path.unlink()
        print(f"  [!] Đã xóa file MD bị gián đoạn: {md_path.name}")
    return bool(ok) and md_path.exists()

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--subject", required=True, choices=list(SUBJECTS.keys()))
    parser.add_argument("--course-code", required=True, help="math-k6 hoặc hist-geo-k6")
    parser.add_argument("--only", default=None)
    parser.add_argument("--vision-model", default="gpt-4o-mini")
    parser.add_argument(
        "--vision-provider",
        choices=["openai", "groq"],
        default="openai",
        help="Provider cho bước PDF scan -> Markdown. 'groq' dùng khi hết quota OpenAI - "
        "nhớ đổi --vision-model sang model vision thật của Groq (vd meta-llama/llama-4-scout-17b-16e-instruct). "
        "Model vision của Groq đã được test làm hỏng bảng rowspan phức tạp, xem "
        "docs/domain-knowledge/PDF_to_Knowledge_Graph.md mục 2.1 - nên spot-check output sau khi convert.",
    )
    parser.add_argument("--dry-run", action="store_true", help="Không ghi database")
    args = parser.parse_args()

    groq_api_key = os.getenv("GROQ_API_KEY", "")
    groq_base_url = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
    groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    if args.vision_provider == "groq":
        if not groq_api_key:
            raise SystemExit("[!] --vision-provider groq nhưng không tìm thấy GROQ_API_KEY.")
        api_key = os.getenv("OPENAI_API_KEY", "")  # vẫn cần cho bước extract fallback, không bắt buộc cho vision
        vision_api_key = groq_api_key
        vision_base_url = groq_base_url
    else:
        api_key = os.getenv("OPENAI_API_KEY", "")
        if not api_key:
            raise SystemExit("[!] Không tìm thấy OPENAI_API_KEY.")
        vision_api_key = api_key
        vision_base_url = None

    # Load environment stub variable
    os.environ["SUPABASE_URL_STUB"] = "true" if args.dry_run else "false"

    # Setup Run Context
    run_ctx = RunContext.create(args.subject, 6, args.course_code)
    print(f"[*] Khởi động Pipeline Run: {run_ctx.run_id}")
    
    ingest_service = IngestionService()
    if not args.dry_run:
        ingest_service.create_extraction_run(run_ctx)

    cfg = SUBJECTS[args.subject]
    pdfs = sorted(cfg["data_dir"].glob("*.pdf"))
    if args.only:
        pdfs = [p for p in pdfs if args.only.lower() in slugify(p.name).lower()]
        
    direct_text_books = load_direct_text_books()
    
    documents = []
    all_chunks = []
    all_raw_concepts = []
    all_raw_relations = []
    
    for pdf_path in pdfs:
        book_slug = slugify(pdf_path.name)
        md_path = cfg["md_dir"] / f"{book_slug}.md"
        print(f"\n=== {pdf_path.name} ({book_slug}) ===")

        # PDF to Markdown
        ok = convert_book(
            pdf_path,
            md_path,
            vision_api_key,
            direct_text_books,
            vision_model=args.vision_model,
            vision_base_url=vision_base_url,
        )
        if not ok or not md_path.exists():
            print(f"[x] Chuyển đổi PDF thất bại hoặc file MD không tồn tại: {pdf_path.name}")
            documents.append({"document_code": book_slug, "status": "failed"})
            continue

        markdown_content = md_path.read_text(encoding="utf-8")
        
        # Calculate Checksum
        md5_hash = hashlib.md5(markdown_content.encode("utf-8")).hexdigest()
        
        # Determine source_type
        source_type = "SGV" if "sgv" in pdf_path.name.lower() else "SGK"
        
        documents.append({
            "document_code": book_slug,
            "title": pdf_path.name.replace(".pdf", ""),
            "source_type": source_type,
            "checksum": md5_hash,
            "status": "success",
            "total_pages": len(markdown_content.split("<!-- page:")),
            "extracted_pages": len(markdown_content.split("<!-- page:"))
        })

        # Split Document into Lessons
        lessons = split_into_lessons(markdown_content)
        print(f"[*] Tìm thấy {len(lessons)} bài học trong markdown.")
        
        if args.subject == "math":
            from src.pipeline.graphusion.extract_math_knowledge import extract_lesson_knowledge, validate_and_clean
        else:
            from src.pipeline.graphusion.extract_history_geo_knowledge import extract_lesson_knowledge, validate_and_clean

        chunk_offset = 0
        for slug, content in lessons:
            # Create Document Chunks for this lesson
            lesson_chunks = generate_chunks(content, book_slug, source_type, start_chunk_index=chunk_offset)
            chunk_offset += len(lesson_chunks)
            all_chunks.extend(lesson_chunks)
            
            # Extract Concepts & Relations
            out_path = cfg["json_dir"] / f"{book_slug}__{slug}.json"
            if out_path.exists():
                print(f"  [=] Đã có JSON kết quả, đọc file: {out_path.name}")
                with open(out_path, encoding="utf-8") as f:
                    knowledge_dict = json.load(f)
                
                # Handle legacy format: raw dicts with "code"/"relation" fields
                raw_concepts = knowledge_dict.get("concepts", [])
                raw_relations = knowledge_dict.get("relations", [])
                
                from src.pipeline.graphusion.validate_graph import clean_vietnamese_text
                
                # Normalize legacy concept format to canonical dict format
                for c in raw_concepts:
                    if "concept_type" not in c:
                        c["concept_type"] = "knowledge"
                    if "aliases" not in c:
                        c["aliases"] = []
                    if "source_chunk_ids" not in c or not c["source_chunk_ids"]:
                        c["source_chunk_ids"] = []
                        name_norm = re.sub(r'\s+', '', clean_vietnamese_text(c.get("name", "")))
                        code_norm = re.sub(r'\s+', '', clean_vietnamese_text(c.get("code", "")))
                        for chunk in lesson_chunks:
                            chunk_norm = re.sub(r'\s+', '', clean_vietnamese_text(chunk.content))
                            if (name_norm and name_norm in chunk_norm) or (code_norm and code_norm in chunk_norm):
                                c["source_chunk_ids"].append(chunk.chunk_id)
                        if not c["source_chunk_ids"] and c.get("source_page"):
                            p = c["source_page"]
                            for chunk in lesson_chunks:
                                if chunk.page_start is not None and chunk.page_end is not None and chunk.page_start <= p <= chunk.page_end:
                                    c["source_chunk_ids"].append(chunk.chunk_id)
                        if not c["source_chunk_ids"] and lesson_chunks:
                            c["source_chunk_ids"].append(lesson_chunks[0].chunk_id)
                    if "evidence" not in c:
                        c["evidence"] = []
                    if c.get("grade") is None:
                        c["grade"] = 6
                
                # Normalize legacy relation format
                for r in raw_relations:
                    if "relation_type" not in r:
                        r["relation_type"] = r.pop("relation", "prerequisite_of")
                    if "source_chunk_id" not in r or not r["source_chunk_id"]:
                        r["source_chunk_id"] = ""
                        evidence = r.get("evidence", "").strip()
                        if evidence:
                            ev_norm = re.sub(r'\s+', '', clean_vietnamese_text(evidence))
                            for chunk in lesson_chunks:
                                chunk_norm = re.sub(r'\s+', '', clean_vietnamese_text(chunk.content))
                                if ev_norm in chunk_norm:
                                    r["source_chunk_id"] = chunk.chunk_id
                                    break
                        if not r["source_chunk_id"] and r.get("source_page"):
                            p = r["source_page"]
                            for chunk in lesson_chunks:
                                if chunk.page_start is not None and chunk.page_end is not None and chunk.page_start <= p <= chunk.page_end:
                                    r["source_chunk_id"] = chunk.chunk_id
                                    break
                        if not r["source_chunk_id"] and lesson_chunks:
                            r["source_chunk_id"] = lesson_chunks[0].chunk_id
                    if "confidence" not in r:
                        r["confidence"] = 1.0
                    if "evidence" not in r:
                        r["evidence"] = ""
                
                print(f"  [+] Loaded: {len(raw_concepts)} concepts, {len(raw_relations)} relations.")
                all_raw_concepts.extend(raw_concepts)
                all_raw_relations.extend(raw_relations)
            else:
                def _call(lesson_chunks=lesson_chunks, source_type=source_type):
                    if groq_api_key:
                        try:
                            knowledge = extract_lesson_knowledge(lesson_chunks, source_type, groq_model, groq_api_key, base_url=groq_base_url)
                            return validate_and_clean(knowledge)
                        except Exception as e:
                            print(f"  [!] Groq lỗi ({e}), fallback sang OpenAI...")
                    knowledge = extract_lesson_knowledge(lesson_chunks, source_type, "gpt-4o-mini", api_key)
                    return validate_and_clean(knowledge)

                ok, knowledge = with_retry(_call, label=f"extract:{book_slug}/{slug}")
                time.sleep(INTER_CALL_DELAY_SECONDS)
                if not ok or not knowledge:
                    print(f"  [!] Trích xuất thất bại bài: {slug}")
                    continue
                    
                with open(out_path, "w", encoding="utf-8") as f:
                    json.dump(knowledge.model_dump(), f, ensure_ascii=False, indent=2)
                    
                print(f"  [+] Trích xuất: {len(knowledge.concepts)} concepts, {len(knowledge.relations)} relations.")
                for c in knowledge.concepts:
                    all_raw_concepts.append(c.model_dump())
                for r in knowledge.relations:
                    all_raw_relations.append(r.model_dump())

    # Write chunk/document manifest files to local output dir
    out_dir = Path(run_ctx.output_directory)
    with open(out_dir / "documents.json", "w", encoding="utf-8") as f:
        json.dump(documents, f, ensure_ascii=False, indent=2)
        
    with open(out_dir / "chunks.jsonl", "w", encoding="utf-8") as f:
        for chunk in all_chunks:
            f.write(json.dumps(chunk.model_dump(), ensure_ascii=False) + "\n")

    # Stage: Concept Normalization & Deduplication
    print("\n[*] Đang chạy bước Concept Normalization...")
    canonical_concepts, remapped_relations, norm_report = normalize_and_deduplicate(all_raw_concepts, all_raw_relations)
    
    # Stage: Graph Fusion & DAG validation
    print("[*] Đang chạy bước Graph Validation & Prerequisite DAG Enforcement...")
    chunks_by_id = {c.chunk_id: c.model_dump() for c in all_chunks}
    concept_codes = [c["code"] for c in canonical_concepts]
    n_corrected = resolve_relation_evidence_chunks(remapped_relations, chunks_by_id)
    if n_corrected:
        print(f"  [*] Đã tự sửa source_chunk_id cho {n_corrected} relation (evidence khớp chunk khác).")
    clean_relations, val_report = validate_prerequisite_dag(concept_codes, remapped_relations, chunks_by_id)

    # Stage: Coverage and validation reporting
    print("[*] Đang tạo báo cáo thống kê và kiểm định (Coverage & Validation Reports)...")
    metrics, markdown_report, is_failed = generate_and_save_reports(
        run_ctx, documents, chunks_by_id.values(), all_raw_concepts, canonical_concepts, clean_relations, val_report, norm_report
    )

    # Ingest Database
    if not args.dry_run:
        print("[*] Đang nạp đồ thị tri thức và mappings vào database...")
        ingest_service.ingest_graph(run_ctx, documents, all_chunks, canonical_concepts, clean_relations)
        ingest_service.update_extraction_run_status(run_ctx, "completed", {"concepts": len(canonical_concepts), "relations": len(clean_relations)})
    else:
        print("[*] Dry-run hoàn tất. Bỏ qua ghi database.")

    # CLI Output Summary
    print("\n" + "=" * 60)
    print("KẾT QUẢ RUN PIPELINE KNOWLEDGE GRAPH")
    print(f"Run ID: {run_ctx.run_id}")
    print(f"Subject: {run_ctx.subject} | Grade: 6")
    print(f"Documents: {sum(1 for d in documents if d['status'] == 'success')}/{len(documents)} processed")
    print(f"Canonical concepts: {len(canonical_concepts)}")
    print(f"Validated relations: {len(clean_relations)}")
    print(f"Prerequisite DAG: {'VALID' if metrics['prerequisite_graph']['dag_valid'] else 'INVALID'}")
    print(f"Coverage status: {metrics['status']}")
    print("=" * 60)

    # Handle threshold failure status
    if is_failed:
        print(f"[!] Thất bại: các chỉ số kiểm định vượt mức threshold cấu hình. Lỗi: {metrics['failures']}")
        sys.exit(1)

if __name__ == "__main__":
    main()
