from __future__ import annotations
import json
import os
from collections import defaultdict
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

def load_thresholds(project_root: Path) -> dict:
    default_thresholds = {
        "fail": {
            "prerequisite_cycle_count": 0,
            "invalid_structured_output_count": 150,
            "approved_relations_without_source": 0,
            "database_ingestion_error_count": 0
        },
        "warn": {
            "page_extraction_rate_min": 0.95,
            "lesson_coverage_rate_min": 0.95,
            "concepts_with_source_rate_min": 1.00,
            "relations_with_evidence_rate_min": 0.95,
            "relations_with_source_chunk_rate_min": 0.95,
            "duplicate_candidate_rate_max": 0.05,
            "orphan_concept_rate_max": 0.10,
            "learning_objective_coverage_rate_min": 0.90
        }
    }
    config_path = project_root / "config" / "kg_coverage_thresholds.yaml"
    if not config_path.exists():
        return default_thresholds
        
    try:
        import yaml
        with open(config_path, encoding="utf-8") as f:
            return yaml.safe_load(f) or default_thresholds
    except Exception:
        return default_thresholds

def generate_and_save_reports(
    run_context: Any,
    documents: List[dict],
    chunks: List[dict],
    raw_concepts: List[dict],
    canonical_concepts: List[dict],
    relations: List[dict],
    validation_report: dict,
    normalization_report: dict,
    learning_objectives: List[dict] = None
) -> Tuple[dict, str, bool]:
    """
    Computes all coverage metrics, checks thresholds, and outputs:
      - coverage_report.json
      - coverage_report.md
      - validation_report.json
      - normalization_report.json
    Returns (metrics, markdown_str, is_failed).
    """
    # Neo theo vị trí file này (giống pattern project_root ở các file graphusion khác),
    # KHÔNG neo theo run_context.output_directory - phụ thuộc độ sâu thư mục run,
    # từng bị lệch 1 cấp khiến load_thresholds() không bao giờ tìm thấy config thật.
    project_root = Path(__file__).resolve().parents[3]
    thresholds = load_thresholds(project_root)
    
    # 1. Calculate Document Coverage
    total_docs = len(documents)
    processed_docs = sum(1 for d in documents if d.get("status") == "success")
    failed_docs = total_docs - processed_docs
    
    total_pages = sum(d.get("total_pages", 0) for d in documents)
    extracted_pages = sum(d.get("extracted_pages", 0) for d in documents)
    failed_pages = total_pages - extracted_pages
    page_extraction_rate = extracted_pages / total_pages if total_pages > 0 else 1.0
    
    # 2. Calculate Lesson Coverage
    # Try to load expected lessons from manifest
    manifest_path = project_root / "config" / "kg_manifests" / f"{run_context.course_code}.yaml"
    expected_lessons = []
    if manifest_path.exists():
        try:
            import yaml
            with open(manifest_path, encoding="utf-8") as f:
                manifest = yaml.safe_load(f)
                for d in manifest.get("documents", []):
                    expected_lessons.extend(d.get("expected_lessons", []))
        except Exception:
            pass
            
    detected_lessons = list(set(c.get("lesson_title") for c in chunks if c.get("lesson_title")))
    processed_lessons = len(detected_lessons)
    
    if not expected_lessons:
        # Fallback to unique lessons in chunks
        expected_lessons = detected_lessons
        
    expected_lessons_count = len(expected_lessons)
    lesson_coverage_rate = processed_lessons / expected_lessons_count if expected_lessons_count > 0 else 1.0
    
    # 3. Calculate Concept Coverage
    total_raw_concepts = len(raw_concepts)
    canonical_concepts_count = len(canonical_concepts)
    concepts_with_source = sum(1 for c in canonical_concepts if c.get("source_chunk_ids"))
    concepts_without_source = canonical_concepts_count - concepts_with_source
    concepts_with_source_rate = concepts_with_source / canonical_concepts_count if canonical_concepts_count > 0 else 1.0
    
    concepts_with_desc = sum(1 for c in canonical_concepts if c.get("description"))
    concepts_without_desc = canonical_concepts_count - concepts_with_desc
    
    def _norm_get(report, key, default=None):
        """Access normalization_report as Pydantic model or dict."""
        if hasattr(report, key):
            return getattr(report, key)
        if isinstance(report, dict):
            return report.get(key, default)
        return default

    merged_count = len(_norm_get(normalization_report, "merged", []))
    review_duplicates = len(_norm_get(normalization_report, "needs_review", []))
    
    # Orphan concepts: concepts not referenced as source or target in any relation
    rel_concepts = set()
    for r in relations:
        rel_concepts.add(r["source"])
        rel_concepts.add(r["target"])
    orphan_concepts = sum(1 for c in canonical_concepts if c["code"] not in rel_concepts)
    orphan_concept_rate = orphan_concepts / canonical_concepts_count if canonical_concepts_count > 0 else 0.0

    # 4. Calculate Relation Coverage
    total_rels = len(relations)
    rels_with_evidence = sum(1 for r in relations if r.get("evidence"))
    rels_with_source_chunk = sum(1 for r in relations if r.get("source_chunk_id"))
    rels_with_source_chunk_rate = rels_with_source_chunk / total_rels if total_rels > 0 else 1.0
    
    # invalid/duplicate/self đếm lại trực tiếp trên `relations` (list cuối cùng, sau khi
    # cycle-breaker đã loại bớt cạnh) thay vì đọc từ validation_report — validation_report
    # được tính trên list TRƯỚC cycle-breaking nên có thể chứa quan hệ đã bị loại ra khỏi
    # `relations`, khiến invalid_relations + validated_relations != total_relations.
    invalid_rels_count = sum(1 for r in relations if r.get("validation_status") == "invalid")
    self_rels_count = sum(1 for r in relations if r.get("source") == r.get("target"))
    seen_rel_keys = set()
    duplicate_rels_count = 0
    for r in relations:
        rel_key = (r.get("source"), r.get("relation_type") or r.get("relation"), r.get("target"))
        if rel_key in seen_rel_keys:
            duplicate_rels_count += 1
        seen_rel_keys.add(rel_key)

    draft_rels = sum(1 for r in relations if r.get("status", "draft") == "draft")
    validated_rels = sum(1 for r in relations if r.get("validation_status", "pending") == "validated")
    approved_rels = sum(1 for r in relations if r.get("status", "draft") == "approved")
    rejected_rels = sum(1 for r in relations if r.get("status", "draft") == "rejected")
    
    # 5. Calculate Prerequisite Graph Metrics
    prereq_edges = [(r["source"], r["target"]) for r in relations if r.get("relation_type") == "prerequisite_of"]
    prereq_nodes = set()
    prereq_in_degree = defaultdict(int)
    prereq_out_degree = defaultdict(int)
    
    for u, v in prereq_edges:
        prereq_nodes.add(u)
        prereq_nodes.add(v)
        prereq_out_degree[u] += 1
        prereq_in_degree[v] += 1
        
    root_nodes = [n for n in prereq_nodes if prereq_in_degree[n] == 0]
    leaf_nodes = [n for n in prereq_nodes if prereq_out_degree[n] == 0]
    isolated_nodes = [c["code"] for c in canonical_concepts if c["code"] not in prereq_nodes]
    
    cycle_count = len(validation_report.get("prerequisite_cycles", []))
    dag_valid = (cycle_count == 0)
    
    # 6. Learning Objective Coverage
    learning_objectives = learning_objectives or []
    total_lo = len(learning_objectives)
    mapped_lo = 0
    lo_codes = {lo["code"] for lo in learning_objectives}
    # Concepts mapping checks
    lo_coverage_rate = 1.0 if total_lo == 0 else (mapped_lo / total_lo)

    # 7. Aggregate Metrics Dict
    metrics = {
        "run_id": run_context.run_id,
        "course_code": run_context.course_code,
        "subject": run_context.subject,
        "grade": run_context.grade,
        "timestamp": run_context.started_at,
        "document_coverage": {
            "total_documents": total_docs,
            "processed_documents": processed_docs,
            "failed_documents": failed_docs,
            "total_pages": total_pages,
            "successfully_extracted_pages": extracted_pages,
            "failed_pages": failed_pages,
            "page_extraction_rate": page_extraction_rate
        },
        "lesson_coverage": {
            "expected_lessons": expected_lessons,
            "detected_lessons": detected_lessons,
            "expected_lessons_count": expected_lessons_count,
            "processed_lessons": processed_lessons,
            "lesson_coverage_rate": lesson_coverage_rate
        },
        "concept_coverage": {
            "total_raw_concepts": total_raw_concepts,
            "canonical_concepts": canonical_concepts_count,
            "concepts_with_source": concepts_with_source,
            "concepts_without_source": concepts_without_source,
            "concepts_with_source_rate": concepts_with_source_rate,
            "concepts_with_description": concepts_with_desc,
            "concepts_without_description": concepts_without_desc,
            "merged_duplicates": merged_count,
            "needs_review_duplicates": review_duplicates,
            "orphan_concepts": orphan_concepts,
            "orphan_concept_rate": orphan_concept_rate
        },
        "relation_coverage": {
            "total_relations": total_rels,
            "relations_with_evidence": rels_with_evidence,
            "relations_with_source_chunk": rels_with_source_chunk,
            "relations_with_source_chunk_rate": rels_with_source_chunk_rate,
            "invalid_relations": invalid_rels_count,
            "duplicate_relations": duplicate_rels_count,
            "self_relations": self_rels_count,
            "draft_relations": draft_rels,
            "validated_relations": validated_rels,
            "approved_relations": approved_rels,
            "rejected_relations": rejected_rels
        },
        "prerequisite_graph": {
            "prerequisite_nodes": len(prereq_nodes),
            "prerequisite_edges": len(prereq_edges),
            "root_nodes_count": len(root_nodes),
            "leaf_nodes_count": len(leaf_nodes),
            "isolated_nodes_count": len(isolated_nodes),
            "cycle_count": cycle_count,
            "dag_valid": dag_valid
        },
        "learning_objective_coverage": {
            "total_learning_objectives": total_lo,
            "mapped_learning_objectives": mapped_lo,
            "lo_coverage_rate": lo_coverage_rate
        }
    }
    
    # 8. Check thresholds for warning or failure status
    warnings = []
    failures = []
    
    # Fail checks
    if cycle_count > thresholds["fail"].get("prerequisite_cycle_count", 0):
        failures.append(f"Prerequisite cycle count ({cycle_count}) exceeds threshold.")
    if invalid_rels_count > thresholds["fail"].get("invalid_structured_output_count", 0):
        failures.append(f"Invalid relations count ({invalid_rels_count}) exceeds threshold.")
    
    # Warn checks
    if page_extraction_rate < thresholds["warn"].get("page_extraction_rate_min", 0.95):
        warnings.append(f"Page extraction rate ({page_extraction_rate:.2%}) below warning threshold.")
    if lesson_coverage_rate < thresholds["warn"].get("lesson_coverage_rate_min", 0.95):
        warnings.append(f"Lesson coverage rate ({lesson_coverage_rate:.2%}) below warning threshold.")
    if concepts_with_source_rate < thresholds["warn"].get("concepts_with_source_rate_min", 1.00):
        warnings.append(f"Concepts with source rate ({concepts_with_source_rate:.2%}) below warning threshold.")
    if rels_with_source_chunk_rate < thresholds["warn"].get("relations_with_source_chunk_rate_min", 0.95):
        warnings.append(f"Relations with source chunk rate ({rels_with_source_chunk_rate:.2%}) below warning threshold.")
    if orphan_concept_rate > thresholds["warn"].get("orphan_concept_rate_max", 0.10):
        warnings.append(f"Orphan concept rate ({orphan_concept_rate:.2%}) exceeds warning threshold.")
        
    metrics["status"] = "FAILED" if failures else ("WARNING" if warnings else "PASSED")
    metrics["warnings"] = warnings
    metrics["failures"] = failures
    
    is_failed = len(failures) > 0
    
    # 9. Format Markdown Report
    markdown_report = f"""# Knowledge Graph Coverage Report
Run ID: `{run_context.run_id}`
Timestamp: `{run_context.started_at}`
Course Code: `{run_context.course_code}`
Subject: `{run_context.subject}` | Grade: `{run_context.grade}`
Pipeline Version: `{run_context.pipeline_version}`
Status: **{metrics["status"]}**

## Metrics Summary

### Documents & Pages
- Total Documents: {total_docs} (Processed: {processed_docs}, Failed: {failed_docs})
- Pages Extracted: {extracted_pages}/{total_pages} ({page_extraction_rate:.2%})

### Lessons
- Expected Lessons: {expected_lessons_count}
- Processed Lessons: {processed_lessons}/{expected_lessons_count} ({lesson_coverage_rate:.2%})

### Concepts
- Raw Concepts Extracted: {total_raw_concepts}
- Canonical Concepts: {canonical_concepts_count} (Merged duplicates: {merged_count})
- Concepts with Source Chunk: {concepts_with_source}/{canonical_concepts_count} ({concepts_with_source_rate:.2%})
- Orphan Concepts: {orphan_concepts} ({orphan_concept_rate:.2%})

### Relations
- Total Unique Relations: {total_rels}
- Relations with Source Chunk: {rels_with_source_chunk}/{total_rels} ({rels_with_source_chunk_rate:.2%})
- Self Relations Detected: {self_rels_count}
- Duplicate Relations Detected: {duplicate_rels_count}
- Invalid Relations: {invalid_rels_count}
- Status: Draft ({draft_rels}), Validated ({validated_rels}), Approved ({approved_rels})

### Prerequisite Subgraph (DAG)
- Prerequisite Nodes: {len(prereq_nodes)}
- Prerequisite Edges: {len(prereq_edges)}
- Root Nodes: {len(root_nodes)}
- Leaf Nodes: {len(leaf_nodes)}
- Isolated Nodes: {len(isolated_nodes)}
- Cycle Count: {cycle_count}
- DAG Valid: **{dag_valid}**
"""
    if failures:
        markdown_report += "\n## Failures\n" + "\n".join(f"- 🔴 {f}" for f in failures)
    if warnings:
        markdown_report += "\n## Warnings\n" + "\n".join(f"- ⚠️ {w}" for w in warnings)
        
    # Write files to output run directory
    out_dir = Path(run_context.output_directory)
    out_dir.mkdir(parents=True, exist_ok=True)
    
    with open(out_dir / "coverage_report.json", "w", encoding="utf-8") as f:
        json.dump(metrics, f, ensure_ascii=False, indent=2)
        
    with open(out_dir / "coverage_report.md", "w", encoding="utf-8") as f:
        f.write(markdown_report)
        
    with open(out_dir / "validation_report.json", "w", encoding="utf-8") as f:
        json.dump(validation_report, f, ensure_ascii=False, indent=2)
        
    with open(out_dir / "normalization_report.json", "w", encoding="utf-8") as f:
        f.write(_serialize_norm_report(normalization_report))
        
    return metrics, markdown_report, is_failed

def _serialize_norm_report(report) -> str:
    """Serialize NormalizationReport (Pydantic BaseModel or plain dict)."""
    if hasattr(report, "model_dump"):
        return json.dumps(report.model_dump(), ensure_ascii=False, indent=2)
    if isinstance(report, dict):
        return json.dumps(report, ensure_ascii=False, indent=2, default=str)
    return json.dumps({"raw": str(report)}, ensure_ascii=False, indent=2)
