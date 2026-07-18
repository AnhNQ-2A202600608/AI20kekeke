from __future__ import annotations

import re
import unicodedata
from typing import Any

from pydantic import BaseModel, Field


class ConceptMergeAudit(BaseModel):
    merged_from: list[str]
    merged_into: str
    reason: str
    confidence: float

class NormalizationReport(BaseModel):
    merged: list[ConceptMergeAudit] = Field(default_factory=list)
    not_merged: list[str] = Field(default_factory=list)
    needs_review: list[dict[str, Any]] = Field(default_factory=list)

def clean_vietnamese_text(text: str) -> str:
    """
    Unicode normalization, lowercase, strip, collapse multiple spaces, remove punctuation.
    """
    if not text:
        return ""
    # Unicode Decomposed -> Composed (NFC is standard)
    text = unicodedata.normalize("NFC", text)
    text = text.lower()
    # Remove basic punctuation
    text = re.sub(r'[.,\/#!$%\^&\*;:{}=\-_`~()\"\'\?]', ' ', text)
    # Collapse multiple spaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def jaccard_similarity(s1: str, s2: str) -> float:
    w1 = set(s1.split())
    w2 = set(s2.split())
    if not w1 or not w2:
        return 0.0
    return len(w1 & w2) / len(w1 | w2)

def normalize_and_deduplicate(
    concepts: list[dict],
    relations: list[dict],
    similarity_threshold: float = 0.85,
    review_threshold: float = 0.65
) -> tuple[list[dict], list[dict], NormalizationReport]:
    """
    Normalizes concepts, merges duplicates based on:
    1. Same code
    2. Same normalized name
    3. Alias match
    4. Jaccard similarity (above threshold -> merge; intermediate -> needs_review)
    Remaps relations to canonical concepts, and removes duplicates.
    """
    merge_map: dict[str, str] = {} # old_code -> canonical_code
    audit_merges: list[ConceptMergeAudit] = []
    needs_review_list: list[dict[str, Any]] = []

    # 1. First Pass: Normalize fields
    for c in concepts:
        c["normalized_name"] = clean_vietnamese_text(c.get("name", ""))
        c["canonical_code"] = c.get("suggested_code") or c.get("code")
        c["aliases"] = [clean_vietnamese_text(a) for a in c.get("aliases", [])]
        if "temporary_id" in c:
            merge_map[c["temporary_id"]] = c["canonical_code"]
        else:
            merge_map[c["code"]] = c["canonical_code"]

    # 2. Second Pass: Group and Merge concepts
    canonical_groups: dict[str, list[dict]] = {} # canonical_code -> list of merged concepts

    for c in concepts:
        code = c["canonical_code"]
        norm_name = c["normalized_name"]
        ctype = c.get("concept_type", "knowledge")

        merged_into_code = None
        merge_reason = None
        merge_confidence = 1.0

        # Check exact code match first in existing canonicals
        if code in canonical_groups:
            merged_into_code = code
            merge_reason = "exact_code_match"
        else:
            # Check normalized name or alias match with existing canonicals
            for existing_code, group in canonical_groups.items():
                rep = group[0] # representative concept
                if rep.get("concept_type") != ctype:
                    continue # only merge same types

                # Exact normalized name match
                if rep["normalized_name"] == norm_name:
                    merged_into_code = existing_code
                    merge_reason = "exact_normalized_name_match"
                    break

                # Alias matches
                if norm_name in rep["aliases"] or rep["normalized_name"] in c["aliases"]:
                    merged_into_code = existing_code
                    merge_reason = "alias_match"
                    break

                # Check Jaccard similarity
                sim = jaccard_similarity(norm_name, rep["normalized_name"])
                if sim >= similarity_threshold:
                    merged_into_code = existing_code
                    merge_reason = f"high_similarity_match_{sim:.2f}"
                    merge_confidence = sim
                    break
                elif sim >= review_threshold:
                    needs_review_list.append({
                        "concept_a": c["canonical_code"],
                        "name_a": c["name"],
                        "concept_b": rep["canonical_code"],
                        "name_b": rep["name"],
                        "similarity": sim,
                        "reason": "token_similarity_review"
                    })

        if merged_into_code:
            canonical_groups[merged_into_code].append(c)
            # Update mapping for this concept
            source_id = c.get("temporary_id") or c.get("code")
            merge_map[source_id] = merged_into_code
            if c.get("code") and c.get("code") != merged_into_code:
                merge_map[c["code"]] = merged_into_code

            # Record merge log if it's not merging with itself
            if source_id != merged_into_code:
                audit_merges.append(ConceptMergeAudit(
                    merged_from=[source_id],
                    merged_into=merged_into_code,
                    reason=merge_reason,
                    confidence=merge_confidence
                ))
        else:
            canonical_groups[code] = [c]
            merge_map[c.get("temporary_id") or c["code"]] = code
            merge_map[code] = code

    # 3. Third Pass: Build final merged concepts list
    final_concepts = []
    for code, group in canonical_groups.items():
        rep = group[0]
        merged_concept = {
            "code": code,
            "canonical_code": code,
            "name": rep["name"], # Keep first name
            "normalized_name": rep["normalized_name"],
            "description": rep.get("description", ""),
            "concept_type": rep.get("concept_type", "knowledge"),
            "grade": rep.get("grade", 6),
            "aliases": list(set(rep["aliases"])),
            "source_chunk_ids": [],
            "evidence": []
        }

        # Merge other attributes
        descriptions = []
        for c in group:
            # Accumulate aliases
            for a in c.get("aliases", []):
                if a not in merged_concept["aliases"]:
                    merged_concept["aliases"].append(a)
            # Accumulate source chunks
            for chunk_id in c.get("source_chunk_ids", []):
                if chunk_id not in merged_concept["source_chunk_ids"]:
                    merged_concept["source_chunk_ids"].append(chunk_id)
            # Accumulate evidence
            for ev in c.get("evidence", []):
                if ev not in merged_concept["evidence"]:
                    merged_concept["evidence"].append(ev)
            # Accumulate description
            desc = c.get("description")
            if desc and desc not in descriptions:
                descriptions.append(desc)

        # Merge descriptions cleanly (e.g. choose the longest one)
        if descriptions:
            merged_concept["description"] = max(descriptions, key=len)

        final_concepts.append(merged_concept)

    # 4. Fourth Pass: Remap relations
    final_relations = []
    seen_relations = set()

    for r in relations:
        src = r.get("source")
        tgt = r.get("target")
        rel = r.get("relation_type") or r.get("relation")

        # Map back from mixed casing to lowercase snake_case
        # Compatibility mapping
        RELATION_ALIASES = {
            "Prerequisite_of": "prerequisite_of",
            "Used_for": "used_for",
            "Compare": "compared_with",
            "Conjunction": "related_to",
            "Hyponym_of": "is_a",
            "Evaluate_for": "related_to",
            "Part_of": "part_of"
        }
        if rel in RELATION_ALIASES:
            rel = RELATION_ALIASES[rel]

        # Remap to canonical code
        canonical_src = merge_map.get(src, src)
        canonical_tgt = merge_map.get(tgt, tgt)

        # Skip self-relations
        if canonical_src == canonical_tgt:
            continue

        # Deduplicate
        rel_key = (canonical_src, rel, canonical_tgt)
        if rel_key not in seen_relations:
            seen_relations.add(rel_key)
            remapped_rel = dict(r)
            remapped_rel["source"] = canonical_src
            remapped_rel["target"] = canonical_tgt
            remapped_rel["relation_type"] = rel
            # Clean up old relation field if it exists
            if "relation" in remapped_rel:
                del remapped_rel["relation"]
            final_relations.append(remapped_rel)

    report = NormalizationReport(
        merged=audit_merges,
        not_merged=[c["code"] for c in final_concepts],
        needs_review=needs_review_list
    )

    return final_concepts, final_relations, report
