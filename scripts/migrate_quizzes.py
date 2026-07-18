import json
import sys
import uuid
from pathlib import Path

from dotenv import load_dotenv
from supabase import Client, create_client

# Add root folder to python path to resolve config
root_dir = Path(__file__).parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

# Reconfigure stdout/stderr to support Vietnamese Unicode printing on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from src.services.supabase_config import get_backend_supabase_config  # noqa: E402

# Load environment variables
load_dotenv(dotenv_path=root_dir / ".env")

SUPABASE_CONFIG = get_backend_supabase_config(allow_stub=True)
SUPABASE_URL = SUPABASE_CONFIG.url
SUPABASE_KEY = SUPABASE_CONFIG.secret_key

if SUPABASE_CONFIG.is_stub:
    print("[ERROR] SUPABASE_URL or SUPABASE_SECRET_KEY is missing from environment variables.")
    sys.exit(1)

print(f"Connecting to Supabase at: {SUPABASE_URL}")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

COURSE_UUID = "00000000-0000-0000-0000-000000000001"  # AI & LLM Bootcamp
DEFAULT_USER_UUID = "d3b07384-d113-4ec5-a58e-0f2d87e07661"  # Default user / creator

# Mathematical ELO mappings
MCQ_ELO_MAP = {"dễ": 900.0, "bình thường": 1100.0, "trung bình": 1100.0, "khó": 1300.0}

SFIA_ELO_MAP = {"SFIA L3": 1000.0, "SFIA L4": 1200.0, "SFIA L5": 1400.0}

EXISTING_CONCEPT_MAP = {
    # Day 1
    "day1-basics": "597ff89c-f60d-5521-b5e2-6baf78a59252",
    "day1-tokenization": "597ff89c-f60d-5521-b5e2-6baf78a59252",
    "day1-llm-architecture": "597ff89c-f60d-5521-b5e2-6baf78a59252",
    "day1-inference-decoding": "597ff89c-f60d-5521-b5e2-6baf78a59252",
    "day1-short-answer": "597ff89c-f60d-5521-b5e2-6baf78a59252",
    "week1-day1": "597ff89c-f60d-5521-b5e2-6baf78a59252",
    # Day 2
    "day2-basics": "2e641f1d-200a-5364-933d-8c56a9daa92c",
    "day2-model-selection": "2e641f1d-200a-5364-933d-8c56a9daa92c",
    "day2-data-strategy": "2e641f1d-200a-5364-933d-8c56a9daa92c",
    "day2-metrics-evaluation": "2e641f1d-200a-5364-933d-8c56a9daa92c",
    "week1-day2": "2e641f1d-200a-5364-933d-8c56a9daa92c",
    # Day 3
    "react-loop-basics": "5b3b417c-5a38-54a2-962c-475c1ac6dc47",
    "react-tool-calling-patterns": "5b3b417c-5a38-54a2-962c-475c1ac6dc47",
    "react-agent-security": "5b3b417c-5a38-54a2-962c-475c1ac6dc47",
    "react-agent-debugging": "5b3b417c-5a38-54a2-962c-475c1ac6dc47",
    "week1-day3": "5b3b417c-5a38-54a2-962c-475c1ac6dc47",
    # Day 4
    "prompt-context-foundations": "ec3c7278-6af1-56ac-91d8-12778cf00425",
    "context-engineering-practice": "ec3c7278-6af1-56ac-91d8-12778cf00425",
    "tool-calling-security-control": "1bdebeba-b071-5af9-bb5b-9aa002c82fd4",
    "prompt-tool-calling-short-answer": "1bdebeba-b071-5af9-bb5b-9aa002c82fd4",
    "week1-day4": "ec3c7278-6af1-56ac-91d8-12778cf00425",
    # Day 5
    "ai-product-uncertainty-foundations": "1a3dfc0c-b414-5a90-a2db-d9cb57b97e81",
    "ai-product-uncertainty-practice": "1a3dfc0c-b414-5a90-a2db-d9cb57b97e81",
    "ai-product-uncertainty-advanced": "1a3dfc0c-b414-5a90-a2db-d9cb57b97e81",
    "ai-product-uncertainty-business-roi": "1a3dfc0c-b414-5a90-a2db-d9cb57b97e81",
    "ai-product-uncertainty-short-answer": "1a3dfc0c-b414-5a90-a2db-d9cb57b97e81",
    "week1-day5": "1a3dfc0c-b414-5a90-a2db-d9cb57b97e81",
    # Day 6
    "hackathon-day-preview": "4197a624-13a1-5020-b7fe-c186410c27f6",
    "week1-day6": "4197a624-13a1-5020-b7fe-c186410c27f6",
    # Day 7
    "day7-basics": "8ab1937a-6293-5cca-b1a9-ff5c0327fa80",
    "day7-pipeline": "aab74279-c4d5-534c-90ba-9770c3cc26e2",
    "day7-advanced": "aab74279-c4d5-534c-90ba-9770c3cc26e2",
    "day7-short-answer": "aab74279-c4d5-534c-90ba-9770c3cc26e2",
    "week1-day7": "8ab1937a-6293-5cca-b1a9-ff5c0327fa80",
    # Day 8
    "day8-basics": "de11158f-9255-5bb6-900d-e3f555487eb0",
    "day8-pipeline": "de11158f-9255-5bb6-900d-e3f555487eb0",
    "day8-advanced": "de11158f-9255-5bb6-900d-e3f555487eb0",
    "day8-short-answer": "de11158f-9255-5bb6-900d-e3f555487eb0",
    # Day 9
    "day9-basics": "1c205640-e2de-56fe-9380-8f318ecb5be8",
    "day9-pipeline": "1c205640-e2de-56fe-9380-8f318ecb5be8",
    "day9-advanced": "1c205640-e2de-56fe-9380-8f318ecb5be8",
    "day9-short-answer": "1c205640-e2de-56fe-9380-8f318ecb5be8",
    # Day 10
    "day10-basics": "a09117e7-0662-5c40-a358-f563be1de784",
    "day10-pipeline": "a09117e7-0662-5c40-a358-f563be1de784",
    "day10-advanced": "a09117e7-0662-5c40-a358-f563be1de784",
    "day10-short-answer": "a09117e7-0662-5c40-a358-f563be1de784",
    # Day 11
    "day11-basics": "d39f2584-539d-50a3-b445-d91fbe413e02",
    "day11-pipeline": "d39f2584-539d-50a3-b445-d91fbe413e02",
    "day11-advanced": "d39f2584-539d-50a3-b445-d91fbe413e02",
    # Day 12
    "day12-basics": "933735a7-a2ae-5418-a39b-267fe5e1e7f0",
    "day12-pipeline": "933735a7-a2ae-5418-a39b-267fe5e1e7f0",
    "day12-advanced": "933735a7-a2ae-5418-a39b-267fe5e1e7f0",
    # Day 13
    "day13-basics": "b832e148-0be9-52bc-9202-3dba240be596",
    "day13-pipeline": "b832e148-0be9-52bc-9202-3dba240be596",
    "day13-advanced": "b832e148-0be9-52bc-9202-3dba240be596",
    # Day 14
    "day14-basics": "e0495f54-1b9f-5e22-b7d4-28fd8c9b616b",
    "day14-pipeline": "e0495f54-1b9f-5e22-b7d4-28fd8c9b616b",
    "day14-advanced": "e0495f54-1b9f-5e22-b7d4-28fd8c9b616b",
    # Day 15
    "day15-basics": "76411fec-2c80-5c59-a650-b8ad8bfe4765",
    "day15-pipeline": "76411fec-2c80-5c59-a650-b8ad8bfe4765",
    "day15-advanced": "76411fec-2c80-5c59-a650-b8ad8bfe4765",
    # Day 16 Tracks
    "day16-t1-basics": "b1f2ad33-c8f7-5d56-b452-caef3e2b7b1f",
    "day16-t1-pipeline": "b1f2ad33-c8f7-5d56-b452-caef3e2b7b1f",
    "day16-t1-advanced": "b1f2ad33-c8f7-5d56-b452-caef3e2b7b1f",
    "day16-t2-basics": "50a323c4-dc1a-5d29-b3a0-2ca931c7a21d",
    "day16-t2-pipeline": "50a323c4-dc1a-5d29-b3a0-2ca931c7a21d",
    "day16-t2-advanced": "50a323c4-dc1a-5d29-b3a0-2ca931c7a21d",
    "day16-t3-basics": "85e9c479-6223-52ea-813d-9877b20c4b81",
    "day16-t3-pipeline": "85e9c479-6223-52ea-813d-9877b20c4b81",
    "day16-t3-advanced": "85e9c479-6223-52ea-813d-9877b20c4b81",
    # Day 17 Tracks
    "day17-t1-basics": "e30e18c6-686f-5755-a34d-fb801ff10a59",
    "day17-t1-pipeline": "e30e18c6-686f-5755-a34d-fb801ff10a59",
    "day17-t1-advanced": "e30e18c6-686f-5755-a34d-fb801ff10a59",
    "day17-t2-basics": "4eca698b-b470-51d5-9009-f4d172b1bcbd",
    "day17-t2-pipeline": "4eca698b-b470-51d5-9009-f4d172b1bcbd",
    "day17-t2-advanced": "4eca698b-b470-51d5-9009-f4d172b1bcbd",
    "day17-t3-basics": "32c253be-ec3b-5faa-aed0-600c7bb7da9c",
    "day17-t3-pipeline": "32c253be-ec3b-5faa-aed0-600c7bb7da9c",
    "day17-t3-advanced": "32c253be-ec3b-5faa-aed0-600c7bb7da9c",
    # Day 18 Tracks
    "day18-t1-basics": "fc8cc6d9-7d19-5757-9a91-a3193d087bb1",
    "day18-t1-pipeline": "fc8cc6d9-7d19-5757-9a91-a3193d087bb1",
    "day18-t1-advanced": "fc8cc6d9-7d19-5757-9a91-a3193d087bb1",
    "day18-t2-basics": "a5d51b01-86dd-5575-bced-e09109c4766e",
    "day18-t2-pipeline": "a5d51b01-86dd-5575-bced-e09109c4766e",
    "day18-t2-advanced": "a5d51b01-86dd-5575-bced-e09109c4766e",
    "day18-t3-basics": "60dd048b-d560-5743-b4f0-0535b4440d36",
    "day18-t3-pipeline": "60dd048b-d560-5743-b4f0-0535b4440d36",
    "day18-t3-advanced": "60dd048b-d560-5743-b4f0-0535b4440d36",
    # Day 19 Tracks
    "day19-t1-basics": "b53fc881-d09b-52fe-8bc0-5b942d47a921",
    "day19-t1-pipeline": "b53fc881-d09b-52fe-8bc0-5b942d47a921",
    "day19-t1-advanced": "b53fc881-d09b-52fe-8bc0-5b942d47a921",
    "day19-t2-basics": "e701e03c-dfab-5674-8212-99b443c34c4e",
    "day19-t2-pipeline": "e701e03c-dfab-5674-8212-99b443c34c4e",
    "day19-t2-advanced": "e701e03c-dfab-5674-8212-99b443c34c4e",
    "day19-t3-basics": "b1b0665f-1dad-54d7-8936-88e3e2d3e4dd",
    "day19-t3-pipeline": "b1b0665f-1dad-54d7-8936-88e3e2d3e4dd",
    "day19-t3-advanced": "b1b0665f-1dad-54d7-8936-88e3e2d3e4dd",
    "day20-t1-basics": "aff8d5f5-ca35-5350-94c7-e62640652f14",
    "day20-t1-pipeline": "aff8d5f5-ca35-5350-94c7-e62640652f14",
    "day20-t1-advanced": "aff8d5f5-ca35-5350-94c7-e62640652f14",
    "day20-t2-basics": "0f4d8aed-5bd3-564f-a936-48340de54049",
    "day20-t2-pipeline": "0f4d8aed-5bd3-564f-a936-48340de54049",
    "day20-t2-advanced": "0f4d8aed-5bd3-564f-a936-48340de54049",
    "day20-t3-basics": "61df9414-2f6d-591d-b520-72f95a9bd43c",
    "day20-t3-pipeline": "61df9414-2f6d-591d-b520-72f95a9bd43c",
    "day20-t3-advanced": "61df9414-2f6d-591d-b520-72f95a9bd43c",
    "day21-t1-basics": "c74f0fa1-bfd6-50a5-a899-5adccb3de6ff",
    "day21-t1-pipeline": "c74f0fa1-bfd6-50a5-a899-5adccb3de6ff",
    "day21-t1-advanced": "c74f0fa1-bfd6-50a5-a899-5adccb3de6ff",
    "day21-t2-basics": "bd1d0475-fd87-56bf-9376-cecd7fc610aa",
    "day21-t2-pipeline": "bd1d0475-fd87-56bf-9376-cecd7fc610aa",
    "day21-t2-advanced": "bd1d0475-fd87-56bf-9376-cecd7fc610aa",
    "day21-t3-basics": "13890bd1-24d8-5024-b84b-74c179489f4a",
    "day21-t3-pipeline": "13890bd1-24d8-5024-b84b-74c179489f4a",
    "day21-t3-advanced": "13890bd1-24d8-5024-b84b-74c179489f4a",
    "day22-t1-basics": "8de96f8f-3336-5dc8-a7d8-dec285508e72",
    "day22-t1-pipeline": "8de96f8f-3336-5dc8-a7d8-dec285508e72",
    "day22-t1-advanced": "8de96f8f-3336-5dc8-a7d8-dec285508e72",
    "day22-t2-basics": "035aff5b-35fa-5b8b-a242-e932a5264c22",
    "day22-t2-pipeline": "035aff5b-35fa-5b8b-a242-e932a5264c22",
    "day22-t2-advanced": "035aff5b-35fa-5b8b-a242-e932a5264c22",
    "day22-t3-basics": "f1b6373a-527b-5f3a-a273-9941c48a3a57",
    "day22-t3-pipeline": "f1b6373a-527b-5f3a-a273-9941c48a3a57",
    "day22-t3-advanced": "f1b6373a-527b-5f3a-a273-9941c48a3a57",
    # Day 23 Tracks
    "day23-t1-basics": "9ff5e5aa-595b-512a-9c65-4777b1529585",
    "day23-t1-pipeline": "9ff5e5aa-595b-512a-9c65-4777b1529585",
    "day23-t1-advanced": "9ff5e5aa-595b-512a-9c65-4777b1529585",
    "day23-t2-basics": "996e71f6-2fb4-5547-8e3c-fac4f67f2f2e",
    "day23-t2-pipeline": "996e71f6-2fb4-5547-8e3c-fac4f67f2f2e",
    "day23-t2-advanced": "996e71f6-2fb4-5547-8e3c-fac4f67f2f2e",
    "day23-t3-basics": "5881bdb4-9d21-5752-b133-2a3811f259e3",
    "day23-t3-pipeline": "5881bdb4-9d21-5752-b133-2a3811f259e3",
    "day23-t3-advanced": "5881bdb4-9d21-5752-b133-2a3811f259e3",
    # Day 24 Tracks
    "day24-t1-basics": "ea42d4fc-7e4b-59eb-a3da-bea6e64754f6",
    "day24-t1-pipeline": "ea42d4fc-7e4b-59eb-a3da-bea6e64754f6",
    "day24-t1-advanced": "ea42d4fc-7e4b-59eb-a3da-bea6e64754f6",
    "day24-t2-basics": "124d937c-876f-5113-8f8d-59ba438c7498",
    "day24-t2-pipeline": "124d937c-876f-5113-8f8d-59ba438c7498",
    "day24-t2-advanced": "124d937c-876f-5113-8f8d-59ba438c7498",
    "day24-t3-basics": "e0030c22-202d-5586-9c39-0c87f92c7b38",
    "day24-t3-pipeline": "e0030c22-202d-5586-9c39-0c87f92c7b38",
    "day24-t3-advanced": "e0030c22-202d-5586-9c39-0c87f92c7b38",
    # Day 25 Tracks
    "day25-t1-basics": "0e5dd3f3-9edd-593f-a87a-ddcb7c80f2da",
    "day25-t1-pipeline": "0e5dd3f3-9edd-593f-a87a-ddcb7c80f2da",
    "day25-t1-advanced": "0e5dd3f3-9edd-593f-a87a-ddcb7c80f2da",
    "day25-t2-basics": "6d9b8a50-b08d-5bc6-9445-839afc34471a",
    "day25-t2-pipeline": "6d9b8a50-b08d-5bc6-9445-839afc34471a",
    "day25-t2-advanced": "6d9b8a50-b08d-5bc6-9445-839afc34471a",
    "day25-t3-basics": "22820955-03e3-5d2e-b62a-f395d38cefeb",
    "day25-t3-pipeline": "22820955-03e3-5d2e-b62a-f395d38cefeb",
    "day25-t3-advanced": "22820955-03e3-5d2e-b62a-f395d38cefeb",
    # Day 26 Tracks
    "day26-t1-basics": "96539113-fcc1-5897-9da8-82071c904733",
    "day26-t1-pipeline": "96539113-fcc1-5897-9da8-82071c904733",
    "day26-t1-advanced": "96539113-fcc1-5897-9da8-82071c904733",
    "day26-t2-basics": "325a433e-82cd-57ce-9913-541f69e610d4",
    "day26-t2-pipeline": "325a433e-82cd-57ce-9913-541f69e610d4",
    "day26-t2-advanced": "325a433e-82cd-57ce-9913-541f69e610d4",
    "day26-t3-basics": "45277faf-a970-5982-b8b4-d64f95d5e7e8",
    "day26-t3-pipeline": "45277faf-a970-5982-b8b4-d64f95d5e7e8",
    "day26-t3-advanced": "45277faf-a970-5982-b8b4-d64f95d5e7e8",
    # Day 27 Tracks
    "day27-t1-basics": "ec33037c-4caf-5e4e-8d44-2b2ec681fe91",
    "day27-t1-pipeline": "ec33037c-4caf-5e4e-8d44-2b2ec681fe91",
    "day27-t1-advanced": "ec33037c-4caf-5e4e-8d44-2b2ec681fe91",
    "day27-t2-basics": "28d49b02-07ea-5538-89dc-5798384fc1b8",
    "day27-t2-pipeline": "28d49b02-07ea-5538-89dc-5798384fc1b8",
    "day27-t2-advanced": "28d49b02-07ea-5538-89dc-5798384fc1b8",
    "day27-t3-basics": "3ee56835-a628-5532-9eaf-007b6fddf9e4",
    "day27-t3-pipeline": "3ee56835-a628-5532-9eaf-007b6fddf9e4",
    "day27-t3-advanced": "3ee56835-a628-5532-9eaf-007b6fddf9e4",
    # Day 28 Tracks
    "day28-t1-basics": "c6a3ff40-94e7-5e0d-b56f-a61c8915af1d",
    "day28-t1-pipeline": "c6a3ff40-94e7-5e0d-b56f-a61c8915af1d",
    "day28-t1-advanced": "c6a3ff40-94e7-5e0d-b56f-a61c8915af1d",
    "day28-t2-basics": "cb3feb71-010c-5d17-ba17-c276a5511cb4",
    "day28-t2-pipeline": "cb3feb71-010c-5d17-ba17-c276a5511cb4",
    "day28-t2-advanced": "cb3feb71-010c-5d17-ba17-c276a5511cb4",
    "day28-t3-basics": "7c97f609-1840-5e16-b2af-1da00f5b1853",
    "day28-t3-pipeline": "7c97f609-1840-5e16-b2af-1da00f5b1853",
    "day28-t3-advanced": "7c97f609-1840-5e16-b2af-1da00f5b1853",
}


def load_concept_uuid_map() -> dict[str, str]:
    uuid_map = {}
    migration_file = root_dir / "db" / "supabase" / "migrations" / "seed_concepts_dag.sql"
    if migration_file.exists():
        import re

        content = migration_file.read_text(encoding="utf-8")
        parts = content.split("app.concept_relations")
        concepts_part = parts[0]
        pattern = r"\(\s*'([a-f0-9\-]{36})'\s*,\s*'([a-f0-9\-]{36})'\s*,\s*'([a-zA-Z0-9\-]+)'\s*,"
        matches = re.findall(pattern, concepts_part)
        for match in matches:
            uuid_map[match[2]] = match[0]
    return uuid_map


concept_code_to_uuid = load_concept_uuid_map()


def get_concept_uuid(set_id: str) -> str:
    if set_id in EXISTING_CONCEPT_MAP:
        return EXISTING_CONCEPT_MAP[set_id]
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"concept.{set_id}"))


def get_question_uuid(set_id: str, index: int) -> str:

    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"question.{set_id}.{index}"))


def run_migration():
    manifest_path = root_dir / "frontend" / "public" / "quiz-manifest.json"
    if not manifest_path.exists():
        print(f"[ERROR] quiz-manifest.json not found at: {manifest_path}")
        return

    with open(manifest_path, encoding="utf-8") as f:
        manifest = json.load(f)

    sets = manifest.get("sets", [])
    print(f"Loaded manifest. Found {len(sets)} quiz sets.")

    # Disable RLS temporarily for dev safety
    try:
        supabase.rpc("disable_rls_dev", {}).execute()
        print("Disabled RLS on development tables via RPC.")
    except Exception as rls_err:
        print(f"Warning disabling RLS via RPC (might already be disabled or missing): {rls_err}")

    # Explicitly upsert the track concepts for Day 16 & Day 17 to avoid foreign key violations
    track_concepts = [
        {
            "id": "b1f2ad33-c8f7-5d56-b452-caef3e2b7b1f",
            "course_id": COURSE_UUID,
            "code": "d16-t1-product-strategy",
            "name": "[T1] AI Product Strategy & Market Analysis",
            "description": "Từ insight khởi nguồn đến định nghĩa sản phẩm: customer segment, need map, strategy, moat và tính toán market size.",
            "status": "active",
        },
        {
            "id": "50a323c4-dc1a-5d29-b3a0-2ca931c7a21d",
            "course_id": COURSE_UUID,
            "code": "d16-t2-cloud-infra",
            "name": "[T2] Cloud Infrastructure for AI",
            "description": "Lựa chọn cloud provider, GPU compute environment, tối ưu chi phí, Terraform IaC, K8s và serving stack vLLM/SGLang.",
            "status": "active",
        },
        {
            "id": "85e9c479-6223-52ea-813d-9877b20c4b81",
            "course_id": COURSE_UUID,
            "code": "d16-t3-advanced-agents",
            "name": "[T3] Advanced Agent Architectures",
            "description": "Điểm yếu của ReAct, mô hình Reflexion tự phản tỉnh, thuật toán LATS và Voyager.",
            "status": "active",
        },
        {
            "id": "e30e18c6-686f-5755-a34d-fb801ff10a59",
            "course_id": COURSE_UUID,
            "code": "d17-t1-prd-pmf",
            "name": "[T1] PRD & Product-Market Fit",
            "description": "Xác định MVP Boundary, kiểm soát scope creep, cấu trúc PRD, lập bảng giả thuyết PMF Scorecard, Sean Ellis và phản biện PRD bằng AI.",
            "status": "active",
        },
        {
            "id": "4eca698b-b470-51d5-9009-f4d172b1bcbd",
            "course_id": COURSE_UUID,
            "code": "d17-t2-data-eng-foundations",
            "name": "[T2] AI Data Engineering Foundations",
            "description": "Tập trung vào triết lý Data-Centric AI, kiến trúc Medallion (Bronze/Silver/Gold), ETL vs ELT, ingestion CDC/dlt, orchestration Airflow/Dagster, dbt/DuckDB và Data Contracts.",
            "status": "active",
        },
        {
            "id": "32c253be-ec3b-5faa-aed0-600c7bb7da9c",
            "course_id": COURSE_UUID,
            "code": "d17-t3-agent-memory",
            "name": "[T3] Agent Memory Systems",
            "description": "Trạng thái stateless của Agent, Cognitive Memory model, sliding window/buffer short-term memory, persistent Redis long-term memory, episodic memory (reflection/trajectory) và context layers.",
            "status": "active",
        },
        {
            "id": "fc8cc6d9-7d19-5757-9a91-a3193d087bb1",
            "course_id": COURSE_UUID,
            "code": "d18-t1-financial-roi",
            "name": "[T1] AI Financial Modeling & ROI",
            "description": "Xác định Burn Rate, Runway, 5 Cost Components, Unit Economics (LTV, CAC, Churn) và tính toán các chỉ số tài chính (NPV, IRR, Payback) qua 3 kịch bản.",
            "status": "active",
        },
        {
            "id": "a5d51b01-86dd-5575-bced-e09109c4766e",
            "course_id": COURSE_UUID,
            "code": "d18-t2-data-lakehouse",
            "name": "[T2] Data Lakehouse Architecture",
            "description": "Tìm hiểu Data Lakehouse (ACID, Open Table Formats Delta/Iceberg/Hudi), Z-ORDER/OPTIMIZE compaction, Deletion Vectors, Change Data Feed và Hidden Partitioning.",
            "status": "active",
        },
        {
            "id": "60dd048b-d560-5743-b4f0-0535b4440d36",
            "course_id": COURSE_UUID,
            "code": "d18-t3-production-rag",
            "name": "[T3] Production RAG",
            "description": "Giải quyết các lỗi của RAG: advanced chunking, Contextual Embeddings, HyDE/Multi-Query, Hybrid Search (BM25 + Dense RRF), Cross-Encoder Reranking, Agentic RAG và RAGAS evaluation.",
            "status": "active",
        },
        {
            "id": "b53fc881-d09b-52fe-8bc0-5b942d47a921",
            "course_id": COURSE_UUID,
            "code": "d19-t1-stakeholder-pitch",
            "name": "[T1] Stakeholder Management & Investor Pitch",
            "description": "Mapping the stakeholder ecosystem, securing investor buy-in, and pitching to cross the commercialization 'valley of death'.",
            "status": "active",
        },
        {
            "id": "e701e03c-dfab-5674-8212-99b443c34c4e",
            "course_id": COURSE_UUID,
            "code": "d19-t2-vector-feature-store",
            "name": "[T2] Vector Store & Feature Store",
            "description": "Production embedding/vector stores and feature stores: embedding model selection, indexing, and serving features to AI systems.",
            "status": "active",
        },
        {
            "id": "b1b0665f-1dad-54d7-8936-88e3e2d3e4dd",
            "course_id": COURSE_UUID,
            "code": "d19-t3-graphrag",
            "name": "[T3] GraphRAG & Knowledge Graphs",
            "description": "When flat/vector RAG fails on relational questions: building knowledge graphs and GraphRAG for multi-hop retrieval.",
            "status": "active",
        },
        {
            "id": "aff8d5f5-ca35-5350-94c7-e62640652f14",
            "course_id": COURSE_UUID,
            "code": "d20-t1-roadmap-execution",
            "name": "[T1] Product Roadmap & Execution",
            "description": "Output vs outcome thinking and the frameworks to prioritize, sequence, and execute an AI product roadmap after funding.",
            "status": "active",
        },
        {
            "id": "0f4d8aed-5bd3-564f-a936-48340de54049",
            "course_id": COURSE_UUID,
            "code": "d20-t2-model-serving",
            "name": "[T2] Model Serving & Inference Optimization",
            "description": "Latency taxonomy (TTFT/TPOT/Goodput), serving infrastructure, and inference optimization techniques such as quantization.",
            "status": "active",
        },
        {
            "id": "61df9414-2f6d-591d-b520-72f95a9bd43c",
            "course_id": COURSE_UUID,
            "code": "d20-t3-multi-agent",
            "name": "[T3] Multi-Agent Systems (Advanced)",
            "description": "Advanced multi-agent taxonomy and orchestration: when to use multiple agents and the coordination patterns that work in production.",
            "status": "active",
        },
        {
            "id": "c74f0fa1-bfd6-50a5-a899-5adccb3de6ff",
            "course_id": COURSE_UUID,
            "code": "d21-t1-governance-risk",
            "name": "[T1] AI Governance & Risk",
            "description": "Startup AI governance: the 3 R's of risk, shifting mindset from 'winning' to 'not dying', and building lightweight policy.",
            "status": "active",
        },
        {
            "id": "bd1d0475-fd87-56bf-9376-cecd7fc610aa",
            "course_id": COURSE_UUID,
            "code": "d21-t2-cicd",
            "name": "[T2] CI/CD for AI Systems",
            "description": "Continuous integration/delivery for ML/AI with experiment tracking and a model registry (e.g. MLflow) across the pipeline.",
            "status": "active",
        },
        {
            "id": "13890bd1-24d8-5024-b84b-74c179489f4a",
            "course_id": COURSE_UUID,
            "code": "d21-t3-finetuning-lora",
            "name": "[T3] Fine-tuning LLMs (LoRA/QLoRA)",
            "description": "When to fine-tune vs prompt vs RAG; parameter-efficient fine-tuning with LoRA/QLoRA and API vs self-hosted trade-offs.",
            "status": "active",
        },
        {
            "id": "8de96f8f-3336-5dc8-a7d8-dec285508e72",
            "course_id": COURSE_UUID,
            "code": "d22-t1-compliance",
            "name": "[T1] AI Compliance",
            "description": "Regulatory and legal compliance for AI products, learning from real enforcement cases and operationalizing compliance controls.",
            "status": "active",
        },
        {
            "id": "035aff5b-35fa-5b8b-a242-e932a5264c22",
            "course_id": COURSE_UUID,
            "code": "d22-t2-llmops",
            "name": "[T2] LLMOps & Prompt Versioning",
            "description": "LLMOps vs traditional MLOps, prompt versioning, and operating LLM applications reliably in production.",
            "status": "active",
        },
        {
            "id": "f1b6373a-527b-5f3a-a273-9941c48a3a57",
            "course_id": COURSE_UUID,
            "code": "d22-t3-dpo-alignment",
            "name": "[T3] DPO, ORPO & Alignment",
            "description": "Beyond SFT: preference learning and alignment (RLHF, DPO, ORPO) to shape model behavior, not just output format.",
            "status": "active",
        },
        {
            "id": "9ff5e5aa-595b-512a-9c65-4777b1529585",
            "course_id": COURSE_UUID,
            "code": "d23-t1-change-adoption",
            "name": "[T1] Change Management & AI Adoption",
            "description": "Driving organizational AI adoption: change management, proven adoption tactics, and distinguishing 'wow' from durable adoption.",
            "status": "active",
        },
        {
            "id": "996e71f6-2fb4-5547-8e3c-fac4f67f2f2e",
            "course_id": COURSE_UUID,
            "code": "d23-t2-observability-stack",
            "name": "[T2] Monitoring & Observability Stack",
            "description": "Building a full observability stack for AI systems: traces, metrics, and logs tailored to LLM-specific failure modes.",
            "status": "active",
        },
        {
            "id": "5881bdb4-9d21-5752-b133-2a3811f259e3",
            "course_id": COURSE_UUID,
            "code": "d23-t3-langgraph",
            "name": "[T3] Agent Evaluation (RAGAS & Guardrails)",
            "description": "Advanced evaluation for generative systems: RAGAS metrics, LLM-as-Judge, and production guardrails for RAG/agents.",
            "status": "active",
        },
        # Day 24 Concepts
        {
            "id": "ea42d4fc-7e4b-59eb-a3da-bea6e64754f6",
            "course_id": COURSE_UUID,
            "code": "d24-t1-responsible-ai",
            "name": "[T1] Responsible AI",
            "description": "Responsible AI in practice: mapping failure modes, asking who is affected, and moving from values to concrete testing.",
            "status": "active",
        },
        {
            "id": "124d937c-876f-5113-8f8d-59ba438c7498",
            "course_id": COURSE_UUID,
            "code": "d24-t2-data-governance",
            "name": "[T2] Data Governance & Security",
            "description": "Data governance for AI: classification, lineage, least-privilege access (RBAC/ABAC, IAM), and securing sensitive data.",
            "status": "active",
        },
        {
            "id": "e0030c22-202d-5586-9c39-0c87f92c7b38",
            "course_id": COURSE_UUID,
            "code": "d24-t3-ragas-guardrails",
            "name": "[T3] LangGraph & Agentic Orchestration",
            "description": "When linear chains are not enough: orchestrating stateful, branching, cyclic agent workflows with LangGraph.",
            "status": "active",
        },
        # Day 25 Concepts
        {
            "id": "0e5dd3f3-9edd-593f-a87a-ddcb7c80f2da",
            "course_id": COURSE_UUID,
            "code": "d25-t1-launch-readiness",
            "name": "[T1] Launch Readiness",
            "description": "Evaluating launch readiness: RICE prioritization, Now/Next/Later roadmaps, outcome-oriented OKRs, and dependency mapping to find the Critical Path.",
            "status": "active",
        },
        {
            "id": "6d9b8a50-b08d-5bc6-9445-839afc34471a",
            "course_id": COURSE_UUID,
            "code": "d25-t2-gpu-finops",
            "name": "[T2] GPU FinOps & Cost Optimization",
            "description": "Optimizing GPU costs: Cloud GPU cost anatomy, spot/preemptible instances with checkpointing, utilization/right-sizing, and optimization (batching, caching, cascading).",
            "status": "active",
        },
        {
            "id": "22820955-03e3-5d2e-b62a-f395d38cefeb",
            "course_id": COURSE_UUID,
            "code": "d25-t3-agent-reliability",
            "name": "[T3] Circuit Breakers, Caching & Agent Reliability",
            "description": "Building safe and reliable production agents: failure modes (rate limits, loops), circuit breakers, semantic caching, token budgeting, and chaos testing.",
            "status": "active",
        },
        # Day 26 Concepts
        {
            "id": "96539113-fcc1-5897-9da8-82071c904733",
            "course_id": COURSE_UUID,
            "code": "d26-t1-fundraising",
            "name": "[T1] Fundraising",
            "description": "Navigating startup fundraising: equity stages (Seed, Series A-C), valuations (Pre vs Post), dilution, option pools, and term sheet mechanics (Vesting, Liquidation Preference).",
            "status": "active",
        },
        {
            "id": "325a433e-82cd-57ce-9913-541f69e610d4",
            "course_id": COURSE_UUID,
            "code": "d26-t2-mcp-a2a-infra",
            "name": "[T2] MCP & A2A Infrastructure",
            "description": "Model Context Protocol & Agent-to-Agent infrastructure: transports (stdio, SSE), Agent Registry design, semantic routing layers, and A2A messaging/tracing.",
            "status": "active",
        },
        {
            "id": "45277faf-a970-5982-b8b4-d64f95d5e7e8",
            "course_id": COURSE_UUID,
            "code": "d26-t3-mcp-spec",
            "name": "[T3] Model Context Protocol (MCP)",
            "description": "Universal LLM tool integration: N x M adapter reduction, JSON-RPC 2.0 protocol standard, Host-Client-Server components, Python MCP SDK, and stdio vs SSE production deployment.",
            "status": "active",
        },
        # Day 27 Concepts
        {
            "id": "ec33037c-4caf-5e4e-8d44-2b2ec681fe91",
            "course_id": COURSE_UUID,
            "code": "d27-t1-people-performance",
            "name": "[T1] AI Team & Performance",
            "description": "Stakeholder management using Power/Interest grid, communication strategies (Minto Pyramid, Objection handling), RACI Matrix, AI Squad configurations, and high-performance operations using Agentic SDLC Competency framework.",
            "status": "active",
        },
        {
            "id": "28d49b02-07ea-5538-89dc-5798384fc1b8",
            "course_id": COURSE_UUID,
            "code": "d27-t2-data-observability",
            "name": "[T2] Data Observability & Lineage",
            "description": "Principles of data quality: System monitoring vs Data Observability, 7 quality dimensions, validations (Great Expectations, Soda), Data Contracts (ODCS), lineage tracing (OpenLineage, Marquez), and data drift detection (PSI, KS).",
            "status": "active",
        },
        {
            "id": "3ee56835-a628-5532-9eaf-007b6fddf9e4",
            "course_id": COURSE_UUID,
            "code": "d27-t3-hitl-ux",
            "name": "[T3] Human-in-the-Loop UX",
            "description": "Human-in-the-Loop patterns (HITL Taxonomy), bounded autonomy, confidence routing, state interruption in LangGraph, runtime interaction workflows (saving/resuming state, editing node arguments), and audit trails.",
            "status": "active",
        },
        # Day 28 Concepts
        {
            "id": "c6a3ff40-94e7-5e0d-b56f-a61c8915af1d",
            "course_id": COURSE_UUID,
            "code": "d28-t1-pricing",
            "name": "[T1] AI Pricing & GTM",
            "description": "Mô hình định giá AI (Seat, Usage, Outcome, Hybrid), ma trận Attribution vs Autonomy, tính toán Cost/Job, neo giá trị so với nhân công, và chiến lược Go-To-Market (PLG, Sales-led, Partner-led) nhúng vào luồng công việc hiện tại.",
            "status": "active",
        },
        {
            "id": "cb3feb71-010c-5d17-ba17-c276a5511cb4",
            "course_id": COURSE_UUID,
            "code": "d28-t2-platform-engineering",
            "name": "[T2] Platform Engineering & Documentation",
            "description": "Tích hợp toàn bộ hệ thống hạ tầng AI: kiến trúc 5 lớp, Event-Driven Architecture với Kafka, request audit trail, kiểm thử tích hợp (Consumer-driven contracts, Testcontainers, Chaos engineering), và kỹ thuật profiling hiệu năng (py-spy, Jaeger, tracemalloc).",
            "status": "active",
        },
        {
            "id": "7c97f609-1840-5e16-b2af-1da00f5b1853",
            "course_id": COURSE_UUID,
            "code": "d28-t3-real-world-architectures",
            "name": "[T3] Real-World System Architecture",
            "description": "Kiến trúc các hệ thống AI thực tế quy mô lớn: xe tự hành ADAS (UniAD, DriveLM, World Model), delivery robot, CCTV AI, embodied humanoid robot và ứng dụng ảnh vệ tinh GeoAI; phân tích ODD, safety shell và data flywheel.",
            "status": "active",
        },
    ]
    try:
        print("Upserting track concepts into app.concepts...")
        supabase.schema("app").table("concepts").upsert(track_concepts).execute()
        print("Track concepts upserted successfully.")
    except Exception as e:
        print(f"[ERROR] Failed to upsert track concepts: {e}")

    inserted_concepts_count = 0
    inserted_questions_count = 0

    concepts_to_upsert = []
    questions_to_upsert = []
    question_concepts_to_upsert = []
    question_hints_to_upsert = []
    collected_concept_codes = {concept["code"] for concept in track_concepts}

    def collect_concept(code: str, name: str, description: str, status: str = "active") -> str:
        concept_id = concept_code_to_uuid.get(code) or get_concept_uuid(code)
        if code in EXISTING_CONCEPT_MAP or code in collected_concept_codes:
            return concept_id

        concepts_to_upsert.append(
            {
                "id": concept_id,
                "course_id": COURSE_UUID,
                "code": code,
                "name": name,
                "description": description,
                "status": status,
            }
        )
        collected_concept_codes.add(code)
        return concept_id

    for idx, quiz_set in enumerate(sets):
        set_id = quiz_set.get("id")
        parent_id = quiz_set.get("parent_id")
        title = quiz_set.get("title")
        description = quiz_set.get("description")
        difficulty_str = quiz_set.get("difficulty", "trung bình").lower()

        # Read the actual file
        file_path = root_dir / "frontend" / "public" / "quizzes" / parent_id / f"{set_id}.json"
        if not file_path.exists():
            print(f"[WARN] Quiz file not found: {file_path}. Skipping.")
            continue

        with open(file_path, encoding="utf-8") as f:
            quiz_data = json.load(f)

        questions = quiz_data.get("questions", [])
        if not questions:
            print(f"[WARN] No questions in {set_id}.json. Skipping.")
            continue

        concept_uuid = get_concept_uuid(set_id)

        # 1. Collect Concept (Only if not a curriculum concept)
        if set_id not in EXISTING_CONCEPT_MAP:
            collect_concept(set_id, title, description)
            inserted_concepts_count += 1
            print(f"[{idx + 1}/{len(sets)}] Collected Concept: {set_id} ({title})")
        else:
            print(f"[{idx + 1}/{len(sets)}] Mapping to existing Curriculum Concept: {set_id} -> {concept_uuid}")

        # 2. Collect Questions & Hints
        for q_idx, q in enumerate(questions):
            q.get("id")
            question_uuid = get_question_uuid(set_id, q_idx)

            prompt = q.get("question")
            options = q.get("options")
            correct = q.get("answer")
            explanation = q.get("explanation")

            # Short answer properties
            expected_answer = q.get("expected_answer")
            evaluation_points = q.get("evaluation_points")
            sfia_level = q.get("sfia_level")
            competency = q.get("competency")

            is_mcq = options is not None

            if is_mcq:
                q_type = "mcq"
                difficulty_elo = MCQ_ELO_MAP.get(difficulty_str, 1100.0)
                answer_key = {
                    "options": options,
                    "correct": correct,
                    "explanation": explanation,
                    "set_id": set_id,
                }
            else:
                q_type = "short_answer"
                difficulty_elo = SFIA_ELO_MAP.get(sfia_level, 1200.0)
                answer_key = {
                    "expected_answer": expected_answer,
                    "evaluation_points": evaluation_points,
                    "sfia_level": sfia_level,
                    "competency": competency,
                    "set_id": set_id,
                }

            # Get concepts list for the question, resolve to UUIDs
            q_concepts = q.get("concepts", [])
            q_concept_uuids = [concept_uuid]
            for c_code in q_concepts:
                if c_code == set_id:
                    continue
                c_uuid = collect_concept(
                    c_code,
                    c_code.replace("-", " ").title(),
                    f"Auto-created concept for quiz set {set_id}.",
                    status="archived",
                )
                q_concept_uuids.append(c_uuid)
            q_concept_uuids = list(dict.fromkeys(q_concept_uuids))

            primary_concept_uuid = concept_uuid

            question_payload = {
                "id": question_uuid,
                "course_id": COURSE_UUID,
                "concept_id": primary_concept_uuid,
                "type": q_type,
                "prompt": prompt,
                "answer_key": answer_key,
                "difficulty_elo": difficulty_elo,
                "calibration_status": "published",
                "created_by": DEFAULT_USER_UUID,
            }
            questions_to_upsert.append(question_payload)
            inserted_questions_count += 1

            # Collect question-concept mappings
            for c_uuid in q_concept_uuids:
                question_concepts_to_upsert.append({"question_id": question_uuid, "concept_id": c_uuid})

            # Collect Question Hints
            hints = q.get("hints", [])
            for h_idx, hint_text in enumerate(hints):
                level = h_idx + 1
                hint_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"hint.{question_uuid}.{level}"))
                hint_payload = {
                    "id": hint_uuid,
                    "question_id": question_uuid,
                    "level": level,
                    "hint_text": hint_text,
                }
                question_hints_to_upsert.append(hint_payload)

    # Helper function for batch upserts with chunking
    def batch_upsert(table_name: str, payloads: list[dict], chunk_size: int = 100):
        if not payloads:
            return
        print(f"Upserting {len(payloads)} records into {table_name}...")
        for i in range(0, len(payloads), chunk_size):
            chunk = payloads[i : i + chunk_size]
            try:
                supabase.schema("app").table(table_name).upsert(chunk).execute()
            except Exception as e:
                print(f"[ERROR] Failed to upsert chunk into {table_name}: {e}")

    # Perform batch upserts in foreign-key dependency order
    batch_upsert("concepts", concepts_to_upsert)
    batch_upsert("questions", questions_to_upsert)
    batch_upsert("question_concepts", question_concepts_to_upsert)
    batch_upsert("question_hints", question_hints_to_upsert)

    print("\nMigration completed successfully!")
    print(f"- Upserted Concepts: {inserted_concepts_count}")
    print(f"- Upserted Questions: {inserted_questions_count}")


if __name__ == "__main__":
    run_migration()
