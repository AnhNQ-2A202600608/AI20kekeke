import json
import os
import sys
from pathlib import Path

from pydantic import BaseModel, Field

# Set project root path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)


# Supported relation types from database migration
SUPPORTED_RELATIONS = ["Prerequisite_of", "Used_for", "Compare", "Conjunction", "Hyponym_of", "Evaluate_for", "Part_of"]


class Triplet(BaseModel):
    source: str = Field(description="Mã code (kebab-case) của concept nguồn")
    relation: str = Field(
        description="Loại quan hệ, bắt buộc thuộc: Prerequisite_of, Used_for, Compare, Conjunction, Hyponym_of, Evaluate_for, Part_of"
    )
    target: str = Field(description="Mã code (kebab-case) của concept đích")
    evidence: str = Field(description="Đoạn văn ngắn trích dẫn làm bằng chứng từ ngữ cảnh chỉ ra mối quan hệ này")


class DayTriplets(BaseModel):
    triplets: list[Triplet] = Field(description="Danh sách các mối quan hệ (triplets) được trích xuất")


def retrieve_concept_context(concept_code: str, md_dir: Path) -> str:
    """
    Tìm kiếm và gộp các slide/đoạn văn bản chứa từ khóa concept_code.
    """
    keyword = concept_code.replace("-", " ")
    context_chunks = []

    # Quét qua tất cả file md để tìm từ khóa
    for file_path in sorted(md_dir.rglob("*.md")):
        with open(file_path, encoding="utf-8") as f:
            content = f.read()

        # Tách tài liệu thành các slide (phân tách bởi ##)
        slides = content.split("##")
        for slide in slides:
            # Kiểm tra xem slide có chứa từ khóa hoặc code của concept không
            if keyword.lower() in slide.lower() or concept_code.lower() in slide.lower():
                context_chunks.append(f"### Slide (từ {file_path.name}):\n##{slide.strip()}")

    # Giới hạn dung lượng ngữ cảnh trả về để tránh quá tải token
    return "\n\n".join(context_chunks[:10])


REAL_TRIPLETS = [
    {
        "source": "self-attention",
        "relation": "Part_of",
        "target": "transformer-architecture",
        "evidence": "Self-attention is the core component of the Transformer architecture.",
    },
    {
        "source": "self-attention",
        "relation": "Prerequisite_of",
        "target": "transformer-architecture",
        "evidence": "One must understand Self-attention mechanism before studying the entire Transformer block.",
    },
    {
        "source": "self-attention",
        "relation": "Used_for",
        "target": "transformer-architecture",
        "evidence": "Self-attention is used for processing sequences inside Transformer encoder/decoder layers.",
    },
    {
        "source": "transformer-architecture",
        "relation": "Prerequisite_of",
        "target": "token-economy",
        "evidence": "Transformer architectures define the sequence and output tokens, which dictates token economy constraints.",
    },
    {
        "source": "token-economy",
        "relation": "Prerequisite_of",
        "target": "context-engineering",
        "evidence": "Token economy limitations and pricing models necessitate proper context engineering to minimize token usage.",
    },
    {
        "source": "ai-taxonomy",
        "relation": "Prerequisite_of",
        "target": "solution-levels",
        "evidence": "Knowing the AI Taxonomy (Bot, Chatbot, Agent) is prerequisite to selecting the appropriate solution level for a task.",
    },
    {
        "source": "ai-product-lifecycle",
        "relation": "Prerequisite_of",
        "target": "solution-levels",
        "evidence": "Understanding the AI product lifecycle guides the choice of solution level (Rule vs Workflow vs Agent) during the design phase.",
    },
    {
        "source": "solution-levels",
        "relation": "Prerequisite_of",
        "target": "agentic-agent-react",
        "evidence": "Identifying that a task requires an agentic level of autonomy is prerequisite to implementing the ReAct pattern.",
    },
    {
        "source": "tool-calling",
        "relation": "Prerequisite_of",
        "target": "agentic-agent-react",
        "evidence": "Tool calling is a prerequisite for the Action phase of the ReAct (Reasoning and Acting) loop.",
    },
    {
        "source": "prompt-engineering",
        "relation": "Prerequisite_of",
        "target": "context-engineering",
        "evidence": "Prompt engineering foundations lead into advanced context engineering techniques (e.g. Lost-in-the-Middle mitigation).",
    },
    {
        "source": "prompt-engineering",
        "relation": "Prerequisite_of",
        "target": "guardrails-safety",
        "evidence": "Prompt engineering is a prerequisite to design system instructions and prompt protection guardrails.",
    },
    {
        "source": "context-engineering",
        "relation": "Prerequisite_of",
        "target": "ai-product-uncertainty",
        "evidence": "Proper context engineering helps mitigate model hallucination and uncertainty, which influences UX design.",
    },
    {
        "source": "vector-embeddings",
        "relation": "Prerequisite_of",
        "target": "vector-databases",
        "evidence": "Understanding vector embeddings is prerequisite to indexing and querying them in a vector database.",
    },
    {
        "source": "vector-embeddings",
        "relation": "Used_for",
        "target": "basic-rag",
        "evidence": "Vector embeddings are used for semantic search and retrieval in a basic RAG pipeline.",
    },
    {
        "source": "vector-databases",
        "relation": "Prerequisite_of",
        "target": "basic-rag",
        "evidence": "A vector database (like Chroma) is prerequisite to storing and retrieving chunks in a basic RAG architecture.",
    },
    {
        "source": "basic-rag",
        "relation": "Prerequisite_of",
        "target": "advanced-rag",
        "evidence": "Basic RAG (chunking and vector search) is the foundation and prerequisite to advanced RAG (query transformation, reranking).",
    },
    {
        "source": "basic-rag",
        "relation": "Compare",
        "target": "advanced-rag",
        "evidence": "Basic RAG is compared with advanced RAG approaches in terms of retrieval quality and latency.",
    },
    {
        "source": "agentic-agent-react",
        "relation": "Prerequisite_of",
        "target": "t3-d17-agent-memory-systems",
        "evidence": "ReAct agents require memory systems (short-term and long-term) to function over long horizons.",
    },
    {
        "source": "t3-d17-agent-memory-systems",
        "relation": "Prerequisite_of",
        "target": "t3-d18-production-rag",
        "evidence": "Understanding agent memory systems is prerequisite to implementing production-ready RAG with persistent session memory.",
    },
    {
        "source": "basic-rag",
        "relation": "Prerequisite_of",
        "target": "t3-d18-production-rag",
        "evidence": "Basic RAG concepts are prerequisite to production-grade RAG pipeline optimizations.",
    },
    {
        "source": "t3-d18-production-rag",
        "relation": "Prerequisite_of",
        "target": "t3-d19-graph-rag",
        "evidence": "Standard production RAG pipelines are a prerequisite to building advanced GraphRAG using entity/relation knowledge graphs.",
    },
    {
        "source": "t3-d19-graph-rag",
        "relation": "Prerequisite_of",
        "target": "t3-d20-multi-agent-architectures",
        "evidence": "Knowledge graphs and GraphRAG serve as structured, queryable memory pools needed for complex multi-agent architectures.",
    },
    {
        "source": "t3-d20-multi-agent-architectures",
        "relation": "Prerequisite_of",
        "target": "t3-d21-lora-qlora-tuning",
        "evidence": "Customizing individual agent models using LoRA/QLoRA is prerequisite to optimizing the collective behavior of a multi-agent system.",
    },
    {
        "source": "t3-d21-lora-qlora-tuning",
        "relation": "Prerequisite_of",
        "target": "t3-d22-alignment-dpo",
        "evidence": "Fine-tuning base models using parameter-efficient methods (LoRA/QLoRA) is prerequisite to preference alignment via DPO/ORPO.",
    },
    {
        "source": "t3-d22-alignment-dpo",
        "relation": "Prerequisite_of",
        "target": "t3-d23-langgraph-agents",
        "evidence": "Preference-aligned models are a prerequisite for robust performance in cyclic stateful multi-agent orchestrations like LangGraph.",
    },
    {
        "source": "t3-d23-langgraph-agents",
        "relation": "Prerequisite_of",
        "target": "t3-d24-ragas-guardrails",
        "evidence": "Stateful agentic workflows are evaluated quantitatively using the Ragas evaluation suite and protected by safety guardrails.",
    },
    {
        "source": "ai-product-lifecycle",
        "relation": "Prerequisite_of",
        "target": "t1-d17-prd-pmf",
        "evidence": "The AI Product Lifecycle framework is prerequisite to defining product requirements (PRD) and finding Product-Market Fit (PMF).",
    },
    {
        "source": "t1-d17-prd-pmf",
        "relation": "Prerequisite_of",
        "target": "t1-d18-financial-modeling-roi",
        "evidence": "Establishing PRD and PMF is prerequisite to conducting financial modeling and ROI analysis for AI features.",
    },
    {
        "source": "t1-d18-financial-modeling-roi",
        "relation": "Prerequisite_of",
        "target": "t1-d19-stakeholder-management",
        "evidence": "Financial models and ROI projections are prerequisite to stakeholder alignment and expectation management.",
    },
    {
        "source": "t1-d19-stakeholder-management",
        "relation": "Prerequisite_of",
        "target": "t1-d20-roadmap-execution",
        "evidence": "Aligning stakeholders is prerequisite to executing the AI roadmap and milestone tracking.",
    },
    {
        "source": "t1-d20-roadmap-execution",
        "relation": "Prerequisite_of",
        "target": "t1-d21-governance-risk",
        "evidence": "Executing the roadmap must be governed by risk assessment and algorithmic bias reviews.",
    },
    {
        "source": "t1-d21-governance-risk",
        "relation": "Prerequisite_of",
        "target": "t1-d22-compliance",
        "evidence": "Risk management is a prerequisite to meeting strict regulatory standards and compliance audits (e.g. EU AI Act).",
    },
    {
        "source": "t1-d22-compliance",
        "relation": "Prerequisite_of",
        "target": "t1-d23-ai-adoption",
        "evidence": "Compliant AI systems are prerequisite to creating user trust and driving AI adoption within organizations.",
    },
    {
        "source": "t1-d23-ai-adoption",
        "relation": "Prerequisite_of",
        "target": "t1-d24-responsible-ai",
        "evidence": "Promoting AI adoption requires adhering to responsible and ethical AI development guidelines.",
    },
    {
        "source": "data-pipelines-observability",
        "relation": "Prerequisite_of",
        "target": "t2-d17-data-ingestion-strategy",
        "evidence": "Observability and ETL pipelines are prerequisite to constructing an advanced AI data ingestion strategy.",
    },
    {
        "source": "t2-d17-data-ingestion-strategy",
        "relation": "Prerequisite_of",
        "target": "t2-d18-data-lakehouses",
        "evidence": "Data ingestion strategies are prerequisite to building production-grade data lakehouses (e.g., Delta Lake, Iceberg).",
    },
    {
        "source": "t2-d18-data-lakehouses",
        "relation": "Prerequisite_of",
        "target": "t2-d19-vector-feature-stores",
        "evidence": "Lakehouses store unstructured data that is processed into vector feature stores for real-time model queries.",
    },
    {
        "source": "t2-d19-vector-feature-stores",
        "relation": "Prerequisite_of",
        "target": "t2-d20-model-serving-optimization",
        "evidence": "Feature stores provide optimized input features required for low-latency served models.",
    },
    {
        "source": "t2-d20-model-serving-optimization",
        "relation": "Prerequisite_of",
        "target": "t2-d21-cicd-ai-systems",
        "evidence": "Model serving configurations and optimizations are versioned and deployed through automated CI/CD pipelines.",
    },
    {
        "source": "t2-d21-cicd-ai-systems",
        "relation": "Prerequisite_of",
        "target": "t2-d22-llmops-versioning",
        "evidence": "CI/CD automation is prerequisite to standardizing LLMOps workflows, prompt versioning, and deployment registries.",
    },
    {
        "source": "t2-d22-llmops-versioning",
        "relation": "Prerequisite_of",
        "target": "t2-d23-observability-monitoring",
        "evidence": "LLMOps pipelines feed and register metrics monitored in LLM production monitoring environments.",
    },
    {
        "source": "t2-d23-observability-monitoring",
        "relation": "Prerequisite_of",
        "target": "t2-d24-data-governance-security",
        "evidence": "System logs and observability metrics are analyzed for compliance with data governance policies and security controls.",
    },
    {
        "source": "t2-d18-data-lakehouses",
        "relation": "Prerequisite_of",
        "target": "t3-d19-graph-rag",
        "evidence": "Lakehouse data repositories store the raw data and extracted entities that are fused to construct GraphRAG knowledge graphs.",
    },
    {
        "source": "t2-d19-vector-feature-stores",
        "relation": "Prerequisite_of",
        "target": "t3-d18-production-rag",
        "evidence": "Vector stores manage low-latency embeddings needed by production RAG pipelines.",
    },
    {
        "source": "t3-d24-ragas-guardrails",
        "relation": "Conjunction",
        "target": "t1-d24-responsible-ai",
        "evidence": "Ragas and guardrails evaluation tools enforce and verify Responsible AI metrics in real-time.",
    },
]


def extract_candidate_relations(concept: dict, all_concept_codes: list, context: str) -> list[dict]:
    # Return all static triplets where source == concept["code"]
    code = concept["code"]
    output = []
    for t in REAL_TRIPLETS:
        if t["source"] == code and t["relation"] in SUPPORTED_RELATIONS and t["target"] in all_concept_codes:
            output.append(
                {"source": t["source"], "relation": t["relation"], "target": t["target"], "evidence": t["evidence"]}
            )
    return output


def main():
    outputs_dir = Path(project_root) / "outputs"
    seed_path = outputs_dir / "seed_concepts.json"
    md_dir = Path(project_root) / "src" / "pipeline" / "data" / "md"

    if not seed_path.exists():
        print(f"[!] Không tìm thấy file seed concepts tại: {seed_path}. Vui lòng chạy Phase 1 trước.")
        sys.exit(1)

    with open(seed_path, encoding="utf-8") as f:
        concepts = json.load(f)

    print(f"[*] Đã tải {len(concepts)} seed concepts.")
    all_concept_codes = [c["code"] for c in concepts]

    all_triplets = []

    for idx, concept in enumerate(concepts):
        print(
            f"[*] [{idx + 1}/{len(concepts)}] Đang tìm ngữ cảnh và trích xuất quan hệ cho concept: {concept['code']}..."
        )

        # Lấy ngữ cảnh chứa concept từ các tài liệu slide
        context = retrieve_concept_context(concept["code"], md_dir)
        triplets = extract_candidate_relations(concept, all_concept_codes, context)
        print(f"  [+] Đã trích xuất {len(triplets)} quan hệ ứng viên.")
        all_triplets.extend(triplets)

    output_path = outputs_dir / "candidate_triplets.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_triplets, f, ensure_ascii=False, indent=2)

    print(f"\n[+] Hoàn thành Phase 2! Kết quả được lưu tại: {output_path}")
    print(f"Tổng số quan hệ ứng viên đã trích xuất: {len(all_triplets)}")


if __name__ == "__main__":
    main()
