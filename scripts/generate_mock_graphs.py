import json
import re
from pathlib import Path


def main():
    project_root = Path(__file__).parent.parent
    sql_path = project_root / "db" / "supabase" / "migrations" / "seed_concepts_dag.sql"
    outputs_dir = project_root / "outputs"
    outputs_dir.mkdir(exist_ok=True)

    if not sql_path.exists():
        print(f"SQL file not found at {sql_path}")
        return

    with open(sql_path, encoding="utf-8") as f:
        content = f.read()

    concepts = []
    lines = content.splitlines()
    in_concepts = False

    # regex pattern
    concept_pattern = re.compile(
        r"^\s*\(\s*'[^']*'\s*,\s*'[^']*'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'(.*)'\s*,\s*'active'::app\.concept_status\)"
    )

    for line in lines:
        line_strip = line.strip()
        if "INSERT INTO app.concepts" in line_strip:
            in_concepts = True
            continue
        if in_concepts and "ON CONFLICT" in line_strip:
            in_concepts = False
            continue
        if in_concepts and line_strip.startswith("("):
            # Parse day from comment
            day_match = re.search(r"--\s*Day\s*(\d+)", line_strip)
            if not day_match:
                continue
            day = int(day_match.group(1))

            # Clean comments before matching regex
            code_part = line_strip.split("--")[0].strip()
            # remove trailing comma if any
            if code_part.endswith(","):
                code_part = code_part[:-1].strip()

            match = concept_pattern.match(code_part)
            if match:
                code = match.group(1)
                name = match.group(2)
                desc = match.group(3).replace("''", "'")

                # Transform d17-t1-prd-pmf -> t1-d17-prd-pmf
                if re.match(r"^d\d+-t\d+-", code):
                    parts = code.split("-")
                    day_pref = parts[0]
                    track_pref = parts[1]
                    rest = "-".join(parts[2:])
                    code = f"{track_pref}-{day_pref}-{rest}"

                concepts.append({
                    "code": code,
                    "name": name,
                    "description": desc,
                    "day": day
                })

    # Parse relations
    relations = []
    in_relations = False
    for line in lines:
        line_strip = line.strip()
        if "INSERT INTO app.concept_relations" in line_strip:
            in_relations = True
            continue
        if in_relations and "ON CONFLICT" in line_strip:
            in_relations = False
            continue
        if in_relations and line_strip.startswith("("):
            # Extract relation comment: -- source -[relation]-> target
            match = re.search(r"--\s*([a-zA-Z0-9_-]+)\s*-\[([^\]]+)\]->\s*([a-zA-Z0-9_-]+)", line_strip)
            if match:
                source = match.group(1)
                relation_type = match.group(2)
                target = match.group(3)

                # Transform both source and target codes if needed
                if re.match(r"^d\d+-t\d+-", source):
                    parts = source.split("-")
                    source = f"{parts[1]}-{parts[0]}-" + "-".join(parts[2:])
                if re.match(r"^d\d+-t\d+-", target):
                    parts = target.split("-")
                    target = f"{parts[1]}-{parts[0]}-" + "-".join(parts[2:])

                relations.append({
                    "source": source,
                    "relation": relation_type,
                    "target": target
                })

    # Save seed_concepts.json
    seed_concepts_path = outputs_dir / "seed_concepts.json"
    with open(seed_concepts_path, "w", encoding="utf-8") as f:
        json.dump(concepts, f, ensure_ascii=False, indent=2)
    print(f"Generated {seed_concepts_path} with {len(concepts)} concepts.")

    # Save fused_graph.json
    fused_graph_path = outputs_dir / "fused_graph.json"
    fused_graph = {
        "concepts": concepts,
        "relations": relations
    }
    with open(fused_graph_path, "w", encoding="utf-8") as f:
        json.dump(fused_graph, f, ensure_ascii=False, indent=2)
    print(f"Generated {fused_graph_path} with {len(concepts)} concepts and {len(relations)} relations.")

if __name__ == "__main__":
    main()
