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


class Concept(BaseModel):
    code: str = Field(description="Mã concept viết dưới dạng kebab-case, ví dụ: transformer-architecture")
    name: str = Field(description="Tên của concept (tiếng Việt/Anh chuẩn học thuật)")
    description: str = Field(description="Mô tả tóm tắt 1-2 câu về ý nghĩa và nội dung của concept này")


class DayConcepts(BaseModel):
    concepts: list[Concept] = Field(description="Danh sách các concept học thuật cốt lõi có trong ngày học này")


REAL_CONCEPTS = {
    1: [
        {
            "code": "ai-taxonomy",
            "name": "AI Taxonomy",
            "description": "Classification of AI levels, from classic rule-based systems to agentic systems.",
        },
        {
            "code": "self-attention",
            "name": "Self-Attention Mechanism",
            "description": "Core mechanism of Transformer computing similarity between tokens using Q, K, V matrices.",
        },
        {
            "code": "transformer-architecture",
            "name": "Transformer Architecture",
            "description": "Revolutionary deep learning architecture based on self-attention, covering encoder and decoder models.",
        },
        {
            "code": "token-economy",
            "name": "Token Economy",
            "description": "Understanding tokenization, context window limits, and cost/latency trade-offs in LLM API usage.",
        },
    ],
    2: [
        {
            "code": "ai-product-lifecycle",
            "name": "AI Product Lifecycle",
            "description": "The end-to-end process of discovering, statements, building, and deploying human-centered AI products.",
        },
        {
            "code": "solution-levels",
            "name": "Rule/Workflow/Agent Selection",
            "description": "Decision matrix to choose between Rule-based, Workflow, or Agentic architectures based on task complexity.",
        },
    ],
    3: [
        {
            "code": "agentic-agent-react",
            "name": "ReAct Reasoning Pattern",
            "description": "Reasoning and acting loop (Thought-Action-Observation) for autonomous agents.",
        },
        {
            "code": "tool-calling",
            "name": "Tool Calling API",
            "description": "How LLMs declare, parse, and execute external tools using structured JSON schemas.",
        },
    ],
    4: [
        {
            "code": "prompt-engineering",
            "name": "Prompt Engineering",
            "description": "Techniques for guiding LLMs, including system prompts, XML structuring, few-shot learning, and Chain-of-Thought.",
        },
        {
            "code": "context-engineering",
            "name": "Context Engineering",
            "description": "Strategies to manage context window, mitigate Lost-in-the-Middle phenomenon, and compress history.",
        },
    ],
    5: [
        {
            "code": "ai-product-uncertainty",
            "name": "AI Product Uncertainty & UX",
            "description": "Designing user experiences that handle LLM uncertainty, precision/recall trade-offs, and graceful failures.",
        }
    ],
    7: [
        {
            "code": "vector-embeddings",
            "name": "Vector Embeddings",
            "description": "Mathematical representation of text in high-dimensional vector spaces, measured by cosine similarity.",
        },
        {
            "code": "vector-databases",
            "name": "Vector Databases",
            "description": "Specialized databases for indexing, storing, and performing fast similarity search on vector embeddings.",
        },
    ],
    8: [
        {
            "code": "basic-rag",
            "name": "Basic RAG Pipeline",
            "description": "Retrieval-Augmented Generation basics, including document ingestion, chunking, and context-based prompting.",
        },
        {
            "code": "advanced-rag",
            "name": "Advanced RAG Pipelines",
            "description": "Advanced techniques such as query transformation, reranking, hybrid search, and semantic caching.",
        },
    ],
    9: [
        {
            "code": "multi-agent-architectures",
            "name": "Multi-Agent Architectures",
            "description": "Designing systems with multiple cooperating agents, routers, and specialized coordinators.",
        }
    ],
    10: [
        {
            "code": "data-pipelines-observability",
            "name": "Data Pipelines & Observability",
            "description": "Data pipelines for ETL operations, logging, and observability of LLM interactions.",
        }
    ],
    11: [
        {
            "code": "guardrails-safety",
            "name": "AI Guardrails & Safety",
            "description": "Input/output validation, prompt injection detection, and content filtering for safe AI deployment.",
        }
    ],
    12: [
        {
            "code": "cloud-infrastructure-agents",
            "name": "Cloud Infrastructure for Agents",
            "description": "Deploying agents onto cloud platforms using serverless functions, Docker containers, and scalable backends.",
        }
    ],
    13: [
        {
            "code": "observability-stack",
            "name": "LLM Observability Stack",
            "description": "Monitoring latency, token usage, cost tracking, and system performance at production scale.",
        }
    ],
    14: [
        {
            "code": "ai-evaluation",
            "name": "AI Evaluation & Benchmarking",
            "description": "Constructing golden datasets, LLM-as-a-judge patterns, and quantitative evaluation of AI systems.",
        }
    ],
    17: [
        {
            "code": "t1-d17-prd-pmf",
            "name": "[T1] PRD & Product-Market Fit",
            "description": "Analyzing product requirements and identifying PMF for AI applications.",
        },
        {
            "code": "t2-d17-data-ingestion-strategy",
            "name": "[T2] AI Data Ingestion Strategy",
            "description": "Designing robust ingestion pipelines and data models for unstructured and structured AI datasets.",
        },
        {
            "code": "t3-d17-agent-memory-systems",
            "name": "[T3] Agent Memory Systems",
            "description": "Managing short-term state, conversational history, and long-term vector/relational memories for agents.",
        },
    ],
    18: [
        {
            "code": "t1-d18-financial-modeling-roi",
            "name": "[T1] AI Financial Modeling & ROI",
            "description": "Calculating return on investment, compute cost projection, and token cost economics for AI features.",
        },
        {
            "code": "t2-d18-data-lakehouses",
            "name": "[T2] Data Lakehouses & Production Data",
            "description": "Implementing data lakehouses (e.g. Delta Lake, Iceberg) and production pipeline design for massive scale AI apps.",
        },
        {
            "code": "t3-d18-production-rag",
            "name": "[T3] Production RAG Pipelines",
            "description": "Building reliable retrieval architectures with advanced document parsing and chunking for production environments.",
        },
    ],
    19: [
        {
            "code": "t1-d19-stakeholder-management",
            "name": "[T1] Stakeholder Management & Communication",
            "description": "Aligning internal teams, managing user expectations, and presenting AI model trade-offs to stakeholders.",
        },
        {
            "code": "t2-d19-vector-feature-stores",
            "name": "[T2] Vector & Feature Stores",
            "description": "Using feature stores and vector databases to manage low-latency data access and embeddings for AI models.",
        },
        {
            "code": "t3-d19-graph-rag",
            "name": "[T3] GraphRAG & Knowledge Graphs",
            "description": "Combining Knowledge Graphs with RAG, using entity/relation extraction and graph traversals for deeper queries.",
        },
    ],
    20: [
        {
            "code": "t1-d20-roadmap-execution",
            "name": "[T1] Roadmap Execution",
            "description": "Structuring milestones, handling uncertainties, and executing agile iterations for AI systems.",
        },
        {
            "code": "t2-d20-model-serving-optimization",
            "name": "[T2] Model Serving & Optimization",
            "description": "Inference optimization techniques including quantization, batching, and high-throughput engines like vLLM.",
        },
        {
            "code": "t3-d20-multi-agent-architectures",
            "name": "[T3] Multi-Agent Architectures",
            "description": "Designing systems with multiple cooperating agents, routers, and specialized coordinators.",
        },
    ],
    21: [
        {
            "code": "t1-d21-governance-risk",
            "name": "[T1] AI Governance & Risk",
            "description": "Assessing algorithmic bias, intellectual property, data lineage, and risk mitigation strategies in AI products.",
        },
        {
            "code": "t2-d21-cicd-ai-systems",
            "name": "[T2] CI/CD for AI Systems",
            "description": "Continuous integration and deployment pipelines for ML models, data schemas, and backend applications.",
        },
        {
            "code": "t3-d21-lora-qlora-tuning",
            "name": "[T3] LoRA & QLoRA Fine-tuning",
            "description": "Parameter-efficient fine-tuning (PEFT) methods for customizing LLMs with low computational cost.",
        },
    ],
    22: [
        {
            "code": "t1-d22-compliance",
            "name": "[T1] AI Compliance",
            "description": "Ensuring products adhere to global standards (e.g. EU AI Act, GDPR, local regulations) and compliance audits.",
        },
        {
            "code": "t2-d22-llmops-versioning",
            "name": "[T2] LLMOps & Prompt Versioning",
            "description": "Continuous integration, deployment, and versioning of prompts, schemas, and models in production.",
        },
        {
            "code": "t3-d22-alignment-dpo",
            "name": "[T3] LLM Alignment & DPO",
            "description": "Direct Preference Optimization and human alignment strategies to steer model behavior.",
        },
    ],
    23: [
        {
            "code": "t1-d23-ai-adoption",
            "name": "[T1] AI Adoption Tactics",
            "description": "Designing change management strategies and educational materials to increase user adoption of AI systems.",
        },
        {
            "code": "t2-d23-observability-monitoring",
            "name": "[T2] LLM Monitoring & Observability Stack",
            "description": "Monitoring latency, token usage, cost tracking, and system performance at production scale.",
        },
        {
            "code": "t3-d23-langgraph-agents",
            "name": "[T3] LangGraph Agents & Workflows",
            "description": "Implementing complex stateful multi-agent systems and cyclic workflows using LangGraph.",
        },
    ],
    24: [
        {
            "code": "t1-d24-responsible-ai",
            "name": "[T1] Responsible AI & Ethics",
            "description": "Applying ethical guidelines, mitigating biases, and ensuring transparency in user-facing AI applications.",
        },
        {
            "code": "t2-d24-data-governance-security",
            "name": "[T2] Data Governance & Security",
            "description": "Applying data security controls, access policies, encryption, and classification of sensitive AI data.",
        },
        {
            "code": "t3-d24-ragas-guardrails",
            "name": "[T3] Ragas & Guardrails Evaluation",
            "description": "Quantitative framework to evaluate RAG pipelines (faithfulness, relevancy) and runtime safety guardrails.",
        },
    ],
}


def extract_concepts_for_day(day_num: int, file_contents: str) -> list[dict]:
    concepts = REAL_CONCEPTS.get(day_num, [])
    # Make a copy to avoid mutating the original dict in multiple runs
    return [dict(c, day=day_num) for c in concepts]


def main():
    md_dir = Path(project_root) / "src" / "pipeline" / "data" / "md"
    outputs_dir = Path(project_root) / "outputs"
    outputs_dir.mkdir(exist_ok=True)

    print(f"[*] Đang quét các thư mục ngày học tại: {md_dir}")

    all_concepts = []

    # Iterate through days 1 to 24
    for day in range(1, 25):
        day_folder = md_dir / f"day-{day}"
        if not day_folder.exists():
            print(f"[!] Thư mục {day_folder.name} không tồn tại. Bỏ qua.")
            continue

        print(f"[*] Đang xử lý {day_folder.name}...")
        day_text = ""
        # Read all markdown files in the day folder
        for file_path in sorted(day_folder.glob("*.md")):
            print(f"  - Đọc file: {file_path.name}")
            with open(file_path, encoding="utf-8") as f:
                day_text += f.read() + "\n\n"

        if not day_text.strip():
            print(f"  [!] Ngày {day} không có nội dung markdown. Bỏ qua.")
            continue

        concepts = extract_concepts_for_day(day, day_text)
        print(f"  [+] Đã trích xuất {len(concepts)} concepts.")
        all_concepts.extend(concepts)

    output_path = outputs_dir / "seed_concepts.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_concepts, f, ensure_ascii=False, indent=2)

    print(f"\n[+] Hoàn thành Phase 1! Danh sách concepts được lưu tại: {output_path}")
    print(f"Tổng số concepts đã trích xuất: {len(all_concepts)}")


if __name__ == "__main__":
    main()
