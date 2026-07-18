from __future__ import annotations

import re
import unicodedata
from collections import defaultdict

SUPPORTED_RELATIONS = {
    'prerequisite_of', 'causes', 'part_of', 'is_a', 'used_for', 'compared_with', 'related_to',
    'has_misconception', 'addresses_misconception',
    # Legacy casing
    'Prerequisite_of', 'Used_for', 'Compare', 'Conjunction', 'Hyponym_of', 'Evaluate_for', 'Part_of'
}

def clean_vietnamese_text(text: str) -> str:
    if not text:
        return ""
    text = unicodedata.normalize("NFC", text)
    text = text.lower()
    text = re.sub(r'[.,\/#!$%\^&\*;:{}=\-_`~()\"\'\?]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def check_evidence_in_chunk(evidence: str, chunk_content: str) -> bool:
    if not evidence or not chunk_content:
        return False

    def clean_text_with_latex(t: str) -> str:
        # Normalize Unicode to NFC
        t = unicodedata.normalize("NFC", t)
        t = t.lower()
        # Strip LaTeX math markup
        t = re.sub(r'\\text\s*\{([^}]+)\}', r'\1', t)
        t = re.sub(r'\\[a-zA-Z]+', ' ', t)
        t = re.sub(r'[\$\{\}\[\]\(\)]', ' ', t)
        t = t.replace('\\', ' ')
        # Standard cleaning of punctuation
        t = re.sub(r'[.,\/#!$%\^&\*;:{}=\-_`~()\"\'\?]', ' ', t)
        return re.sub(r'\s+', '', t)

    clean_ev = clean_text_with_latex(evidence)
    clean_chunk = clean_text_with_latex(chunk_content)

    if clean_ev in clean_chunk:
        return True

    # Split evidence into clauses of at least 15 characters to handle injections/formulas in-between
    clauses = [c.strip() for c in re.split(r'[.,;!?\n]', evidence) if len(c.strip()) >= 15]
    if not clauses:
        return False

    # Check if the longest clause matches
    longest_clause = max(clauses, key=len)
    clean_longest = clean_text_with_latex(longest_clause)
    if clean_longest in clean_chunk:
        return True

    # Alternate check: if at least 50% of long clauses match
    matched_clauses = sum(1 for c in clauses if clean_text_with_latex(c) in clean_chunk)
    return matched_clauses / len(clauses) >= 0.5

def resolve_relation_evidence_chunks(relations: list[dict], chunks_by_id: dict[str, dict]) -> int:
    """
    LLM đôi khi trích đúng câu evidence nhưng gán nhầm source_chunk_id (đặc biệt với
    quan hệ nối 2 khái niệm cách xa nhau trong 1 bài dài, nhiều chunk). Trước khi coi
    là "evidence not found" (invalid), thử tìm evidence đó ở TẤT CẢ chunk khác trong
    cùng lần chạy - nếu tìm thấy, sửa lại source_chunk_id cho đúng thay vì loại bỏ
    quan hệ. Chỉ thật sự invalid nếu evidence không khớp ở BẤT KỲ chunk nào.
    Mutates `relations` in-place. Trả về số quan hệ đã tự sửa.
    """
    corrected = 0
    for r in relations:
        chunk_id = r.get("source_chunk_id")
        evidence = r.get("evidence")
        if not evidence:
            continue
        if chunk_id in chunks_by_id and check_evidence_in_chunk(evidence, chunks_by_id[chunk_id].get("content", "")):
            continue  # citation đã đúng, không cần sửa
        for cid, chunk in chunks_by_id.items():
            if cid == chunk_id:
                continue
            if check_evidence_in_chunk(evidence, chunk.get("content", "")):
                r["source_chunk_id"] = cid
                corrected += 1
                break
    return corrected


def detect_cycle_dfs(node: str, adj: dict[str, list[str]], visited: dict[str, bool], stack: dict[str, bool], cycle_path: list[str]) -> bool:
    visited[node] = True
    stack[node] = True
    cycle_path.append(node)

    for neighbor in adj.get(node, []):
        if not visited.get(neighbor, False):
            if detect_cycle_dfs(neighbor, adj, visited, stack, cycle_path):
                return True
        elif stack.get(neighbor, False):
            cycle_path.append(neighbor)
            return True

    stack[node] = False
    cycle_path.pop()
    return False

def get_any_cycle(nodes: list[str], edges: list[tuple[str, str]]) -> list[str] | None:
    adj = defaultdict(list)
    for u, v in edges:
        adj[u].append(v)

    visited = {n: False for n in nodes}
    stack = {n: False for n in nodes}

    for node in nodes:
        if not visited[node]:
            cycle_path = []
            if detect_cycle_dfs(node, adj, visited, stack, cycle_path):
                start_node = cycle_path[-1]
                try:
                    start_idx = cycle_path.index(start_node)
                    return cycle_path[start_idx:]
                except ValueError:
                    return cycle_path
    return None

def validate_relation_provenance(
    r: dict,
    concept_codes: list[str],
    chunks_by_id: dict[str, dict]
) -> list[str]:
    """
    Validates a single relation against ontology and chunk content.
    """
    errors = []
    src = r.get("source")
    tgt = r.get("target")
    rel_type = r.get("relation_type") or r.get("relation")
    chunk_id = r.get("source_chunk_id")
    evidence = r.get("evidence")

    # 1. Source and Target checks
    if not src or src not in concept_codes:
        errors.append(f"Source concept '{src}' does not exist.")
    if not tgt or tgt not in concept_codes:
        errors.append(f"Target concept '{tgt}' does not exist.")
    if src == tgt:
        errors.append("Self-relations are forbidden.")

    # 2. Relation type check
    if rel_type not in SUPPORTED_RELATIONS:
        errors.append(f"Unsupported relation type: '{rel_type}'")

    # 3. Source chunk check (only check if chunk database/dictionary is provided)
    if chunks_by_id:
        if not chunk_id:
            errors.append("Missing source_chunk_id.")
        elif chunk_id not in chunks_by_id:
            errors.append(f"Source chunk '{chunk_id}' does not exist in the document.")
        else:
            # 4. Evidence check
            chunk_content = chunks_by_id[chunk_id].get("content", "")
            if not evidence:
                errors.append("Missing evidence for relation.")
            elif not check_evidence_in_chunk(evidence, chunk_content):
                errors.append(f"Evidence text is not found in chunk '{chunk_id}'.")

    return errors

def validate_full_graph(
    concept_codes: list[str],
    relations: list[dict],
    chunks_by_id: dict[str, dict] | None = None
) -> dict:
    """
    Validates structural properties of the full knowledge graph.
    """
    report = {
        "valid": True,
        "self_relations": [],
        "duplicate_relations": [],
        "invalid_relations": [],
        "prerequisite_cycles": [],
        "removed_relations": []
    }

    set(concept_codes)
    seen_keys = set()

    for r in relations:
        src = r.get("source")
        tgt = r.get("target")
        rel_type = r.get("relation_type") or r.get("relation")

        # Provenance and structural checks
        errors = validate_relation_provenance(r, concept_codes, chunks_by_id)
        if errors:
            r["validation_status"] = "invalid"
            r["validation_errors"] = errors
            report["invalid_relations"].append({
                "relation": r,
                "errors": errors
            })
            report["valid"] = False
        else:
            r["validation_status"] = "validated"
            r["validation_errors"] = []

        # Self relation check
        if src == tgt:
            report["self_relations"].append(r)
            report["valid"] = False

        # Duplicate relation check
        rel_key = (src, rel_type, tgt)
        if rel_key in seen_keys:
            report["duplicate_relations"].append(r)
            report["valid"] = False
        seen_keys.add(rel_key)

    return report

def validate_prerequisite_dag(
    concept_codes: list[str],
    relations: list[dict],
    chunks_by_id: dict[str, dict] | None = None,
    concept_order_map: dict[str, int] | None = None
) -> tuple[list[dict], dict]:
    """
    Extracts the prerequisite subgraph, validates it for cycles and chronological order,
    and automatically breaks any cycles if found (removing the causing edge).
    """
    report = validate_full_graph(concept_codes, relations, chunks_by_id)

    clean_relations = []
    prereq_edges = []

    for r in relations:
        src = r.get("source")
        tgt = r.get("target")
        rel_type = r.get("relation_type") or r.get("relation")

        # Skip only if nodes are completely missing or self-relation
        if src not in concept_codes or tgt not in concept_codes or src == tgt:
            clean_relations.append(r)
            continue

        if rel_type in ("prerequisite_of", "Prerequisite_of"):
            if concept_order_map:
                order_s = concept_order_map.get(src, 99)
                order_t = concept_order_map.get(tgt, 99)

                if order_s > order_t:
                    # Chronological constraint warning, swap direction to resolve or remove
                    r["source"], r["target"] = tgt, src
                    src, tgt = tgt, src

            prereq_edges.append((src, tgt))
            clean_relations.append(r)
        else:
            clean_relations.append(r)

    # DFS cycle breaker for prerequisite_of
    max_iters = 100
    iter_count = 0
    while iter_count < max_iters:
        cycle = get_any_cycle(concept_codes, prereq_edges)
        if not cycle:
            break

        iter_count += 1
        report["valid"] = False
        report["prerequisite_cycles"].append(list(cycle))

        # Break the cycle: remove the last edge
        u, v = cycle[-2], cycle[-1]
        prereq_edges = [edge for edge in prereq_edges if edge != (u, v)]

        removed_rel = None
        for r in list(clean_relations):
            r_type = r.get("relation_type") or r.get("relation")
            if r_type in ("prerequisite_of", "Prerequisite_of") and r.get("source") == u and r.get("target") == v:
                removed_rel = r
                clean_relations.remove(r)
                break

        if removed_rel:
            report["removed_relations"].append({
                "relation": removed_rel,
                "reason": "prerequisite_cycle_breaker",
                "cycle": list(cycle)
            })

    return clean_relations, report
