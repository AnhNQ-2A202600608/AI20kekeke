from src.pipeline.graphusion.normalize_concepts import clean_vietnamese_text, normalize_and_deduplicate
from src.pipeline.graphusion.validate_graph import validate_prerequisite_dag


def test_vietnamese_normalization():
    assert clean_vietnamese_text("Phép cộng phân số  ") == "phép cộng phân số"
    assert clean_vietnamese_text("Cộng hai phân số khác mẫu.") == "cộng hai phân số khác mẫu"
    assert clean_vietnamese_text("Khái niệm ước chung lớn nhất") == "khái niệm ước chung lớn nhất"

def test_concept_merging_and_alias_accumulation():
    raw_concepts = [
        {
            "code": "cong-phan-so",
            "name": "Phép cộng phân số",
            "description": "Cộng hai phân số cùng hoặc khác mẫu.",
            "concept_type": "skill",
            "aliases": ["cộng phân số"],
            "source_chunk_ids": ["chunk-1"],
            "evidence": ["đoạn trích 1"]
        },
        {
            "code": "phep-cong-phan-so",
            "name": "Cộng phân số",
            "description": "Cộng hai phân số.",
            "concept_type": "skill",
            "aliases": ["cộng phân số"],
            "source_chunk_ids": ["chunk-2"],
            "evidence": ["đoạn trích 2"]
        },
        {
            "code": "rut-gon-phan-so",
            "name": "Rút gọn phân số",
            "description": "Chia cả tử và mẫu cho ước chung lớn nhất.",
            "concept_type": "skill",
            "aliases": [],
            "source_chunk_ids": ["chunk-3"],
            "evidence": ["đoạn trích 3"]
        }
    ]

    relations = [
        {"source": "cong-phan-so", "target": "rut-gon-phan-so", "relation_type": "Prerequisite_of"},
        {"source": "phep-cong-phan-so", "target": "rut-gon-phan-so", "relation_type": "Prerequisite_of"}
    ]

    merged_concepts, remapped_relations, report = normalize_and_deduplicate(raw_concepts, relations)

    # Should merge "cong-phan-so" and "phep-cong-phan-so" since their normalized names or aliases match
    assert len(merged_concepts) == 2
    canonical_codes = [c["canonical_code"] for c in merged_concepts]
    assert "cong-phan-so" in canonical_codes or "phep-cong-phan-so" in canonical_codes
    assert "rut-gon-phan-so" in canonical_codes

    # Check accumulated properties
    canonical_cong = next(c for c in merged_concepts if c["canonical_code"] in ("cong-phan-so", "phep-cong-phan-so"))
    assert set(canonical_cong["source_chunk_ids"]) == {"chunk-1", "chunk-2"}
    assert set(canonical_cong["evidence"]) == {"đoạn trích 1", "đoạn trích 2"}

    # Check remapped relations are deduplicated
    assert len(remapped_relations) == 1
    assert remapped_relations[0]["relation_type"] == "prerequisite_of"

def test_prerequisite_cycle_breaking_vs_semantic_cycle_preservation():
    concept_codes = ["A", "B", "C", "D"]

    relations = [
        # Prerequisite cycle: A -> B -> C -> A
        {"source": "A", "target": "B", "relation_type": "prerequisite_of"},
        {"source": "B", "target": "C", "relation_type": "prerequisite_of"},
        {"source": "C", "target": "A", "relation_type": "prerequisite_of"},
        # Semantic cycle: C compared_with D, D compared_with C (allowed)
        {"source": "C", "target": "D", "relation_type": "compared_with"},
        {"source": "D", "target": "C", "relation_type": "compared_with"}
    ]

    clean_relations, report = validate_prerequisite_dag(concept_codes, relations)

    # Prerequisite cycle must be broken
    prereqs = [r for r in clean_relations if r["relation_type"] == "prerequisite_of"]
    assert len(prereqs) == 2 # 1 edge removed
    assert report["valid"] is False
    assert len(report["prerequisite_cycles"]) > 0
    assert len(report["removed_relations"]) == 1

    # Semantic cycle compared_with must be preserved completely!
    compared = [r for r in clean_relations if r["relation_type"] == "compared_with"]
    assert len(compared) == 2
    assert {"C", "D"} == {compared[0]["source"], compared[0]["target"]}

def test_causes_is_not_prerequisite():
    concept_codes = ["A", "B", "C"]

    relations = [
        # Causal cycle: A -> B -> C -> A
        {"source": "A", "target": "B", "relation_type": "causes"},
        {"source": "B", "target": "C", "relation_type": "causes"},
        {"source": "C", "target": "A", "relation_type": "causes"}
    ]

    clean_relations, report = validate_prerequisite_dag(concept_codes, relations)

    # No prerequisite relations, so DAG remains valid for prerequisite subgraph
    assert len(clean_relations) == 3
    assert report["valid"] is True # causes cycle does not invalidate prerequisite DAG

def test_self_loops():
    concept_codes = ["A"]
    relations = [{"source": "A", "target": "A", "relation_type": "prerequisite_of"}]

    clean_relations, report = validate_prerequisite_dag(concept_codes, relations)
    assert report["valid"] is False
    assert len(report["self_relations"]) == 1

def test_evidence_and_provenance_validation():
    chunks_by_id = {
        "chunk-1": {"content": "Quy đồng mẫu số là bước cần thực hiện trước khi cộng hai phân số khác mẫu số."}
    }
    concept_codes = ["quy-dong", "cong-phan-so"]

    # Valid relation with exact containment evidence
    r_valid = {
        "source": "quy-dong",
        "target": "cong-phan-so",
        "relation_type": "prerequisite_of",
        "source_chunk_id": "chunk-1",
        "evidence": "cộng hai phân số khác mẫu số"
    }

    # Invalid relation with missing chunk
    r_invalid_chunk = {
        "source": "quy-dong",
        "target": "cong-phan-so",
        "relation_type": "prerequisite_of",
        "source_chunk_id": "chunk-missing",
        "evidence": "cộng hai phân số khác mẫu số"
    }

    # Invalid relation with mismatched evidence
    r_invalid_evidence = {
        "source": "quy-dong",
        "target": "cong-phan-so",
        "relation_type": "prerequisite_of",
        "source_chunk_id": "chunk-1",
        "evidence": "mâu thuẫn xã hội dẫn đến khởi nghĩa"
    }

    # 1. Valid case
    clean_rels, report_valid = validate_prerequisite_dag(concept_codes, [r_valid], chunks_by_id)
    assert report_valid["valid"] is True
    assert clean_rels[0]["validation_status"] == "validated"

    # 2. Invalid chunk case
    _, report_chunk = validate_prerequisite_dag(concept_codes, [r_invalid_chunk], chunks_by_id)
    assert report_chunk["valid"] is False
    assert len(report_chunk["invalid_relations"]) == 1

    # 3. Mismatched evidence case
    _, report_ev = validate_prerequisite_dag(concept_codes, [r_invalid_evidence], chunks_by_id)
    assert report_ev["valid"] is False
    assert len(report_ev["invalid_relations"]) == 1
