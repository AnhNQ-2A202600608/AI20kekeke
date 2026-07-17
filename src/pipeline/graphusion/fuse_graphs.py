import json
import os
import sys
from collections import defaultdict
from pathlib import Path

from pydantic import BaseModel, Field

# Set project root path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)


class MergeMapping(BaseModel):
    old_code: str = Field(description="Mã concept cũ bị trùng lặp")
    new_code: str = Field(description="Mã concept mới được chọn làm đại diện chính thức")


class EntityFusionResult(BaseModel):
    merges: list[MergeMapping] = Field(description="Danh sách các ánh xạ gộp concept")
    updated_concepts: list[dict] = Field(description="Danh sách concept sau khi gộp và chuẩn hóa")


def merge_similar_entities(concepts: list[dict]) -> tuple[list[dict], dict[str, str]]:
    """
    Bỏ qua LLM gộp thực thể vì danh sách concept tĩnh đã được chuẩn hóa sạch sẽ.
    """
    return concepts, {}


def detect_cycle_dfs(node, adj, visited, stack, cycle_path):
    """
    Thuật toán DFS để tìm chu trình trong đồ thị hướng.
    """
    visited[node] = True
    stack[node] = True
    cycle_path.append(node)

    for neighbor in adj[node]:
        if not visited[neighbor]:
            if detect_cycle_dfs(neighbor, adj, visited, stack, cycle_path):
                return True
        elif stack[neighbor]:
            # Đã tìm thấy chu trình, lưu phần tử cuối để tạo vòng khép kín
            cycle_path.append(neighbor)
            return True

    stack[node] = False
    cycle_path.pop()
    return False


def get_any_cycle(nodes, edges):
    """
    Trả về một chu trình bất kỳ dưới dạng danh sách các nodes (ví dụ: [A, B, C, A]) nếu có chu trình.
    """
    adj = defaultdict(list)
    for u, v in edges:
        adj[u].append(v)

    visited = {n: False for n in nodes}
    stack = {n: False for n in nodes}

    for node in nodes:
        if not visited[node]:
            cycle_path = []
            if detect_cycle_dfs(node, adj, visited, stack, cycle_path):
                # Chỉ giữ lại phần chu trình thực sự (từ node lặp lại đến cuối)
                start_node = cycle_path[-1]
                try:
                    start_idx = cycle_path.index(start_node)
                    return cycle_path[start_idx:]
                except ValueError:
                    return cycle_path
    return None


def enforce_dag(concept_codes: list[str], triplets: list[dict], concept_day_map: dict) -> list[dict]:
    """
    Đảm bảo đồ thị quan hệ Prerequisite_of không chứa chu trình (DAG).
    Áp dụng 2 cơ chế:
    1. Chronological Check: A Prerequisite_of B bắt buộc có Day(A) <= Day(B). Nếu Day(A) > Day(B) -> Đảo ngược hoặc loại bỏ cạnh.
    2. Cycle Breaker: DFS Cycle Detection. Nếu phát hiện chu trình, tự động bẻ gãy chu trình bằng cách loại bỏ cạnh vi phạm.
    """
    clean_triplets = []
    prereq_edges = []

    for t in triplets:
        source, target = t["source"], t["target"]
        relation = t["relation"]

        if relation == "Prerequisite_of":
            day_s = concept_day_map.get(source, 99)
            day_t = concept_day_map.get(target, 99)

            # Quy tắc niên đại học tập (Chronological constraint)
            if day_s > day_t:
                # Nếu ngày của nguồn muộn hơn ngày của đích, đảo ngược quan hệ để hợp lý hóa
                print(
                    f"  [Chronological Warning] Đảo ngược hướng cạnh: {source} (Day {day_s}) -> Prerequisite_of -> {target} (Day {day_t}) thành {target} -> Prerequisite_of -> {source}"
                )
                prereq_edges.append((target, source))
                t["source"], t["target"] = target, source
                clean_triplets.append(t)
            elif day_s == day_t:
                # Cùng một ngày, cho phép giữ nguyên
                prereq_edges.append((source, target))
                clean_triplets.append(t)
            else:
                # Đúng chiều niên đại
                prereq_edges.append((source, target))
                clean_triplets.append(t)
        else:
            # Các quan hệ khác giữ nguyên không kiểm tra DAG
            clean_triplets.append(t)

    # Chạy thuật toán phát hiện và bẻ gãy chu trình cho Prerequisite_of
    iter_count = 0
    max_iters = 100
    while iter_count < max_iters:
        cycle = get_any_cycle(concept_codes, prereq_edges)
        if not cycle:
            break

        iter_count += 1
        cycle_str = " -> ".join(cycle)
        print(f"  [Cycle Detected] Tìm thấy chu trình: {cycle_str}")

        # Bẻ gãy chu trình: loại bỏ cạnh cuối cùng tạo ra chu trình (cạnh từ cycle[-2] đến cycle[-1])
        u, v = cycle[-2], cycle[-1]
        print(f"  [Cycle Breaker] Tự động loại bỏ cạnh gây chu trình: {u} -> Prerequisite_of -> {v}")

        # Loại bỏ khỏi danh sách prereq_edges
        prereq_edges = [edge for edge in prereq_edges if edge != (u, v)]

        # Loại bỏ khỏi clean_triplets
        clean_triplets = [
            t
            for t in clean_triplets
            if not (t["relation"] == "Prerequisite_of" and t["source"] == u and t["target"] == v)
        ]

    return clean_triplets


def main():
    outputs_dir = Path(project_root) / "outputs"
    seed_path = outputs_dir / "seed_concepts.json"
    triplets_path = outputs_dir / "candidate_triplets.json"

    if not seed_path.exists() or not triplets_path.exists():
        print("[!] Không tìm thấy seed_concepts.json hoặc candidate_triplets.json. Vui lòng chạy Phase 1 & 2 trước.")
        sys.exit(1)

    with open(seed_path, encoding="utf-8") as f:
        concepts = json.load(f)

    with open(triplets_path, encoding="utf-8") as f:
        triplets = json.load(f)

    print(f"[*] Đã tải {len(concepts)} concepts và {len(triplets)} triplets.")

    # 1. Hợp nhất các thực thể đồng nghĩa
    print("[*] Đang thực hiện dung hợp thực thể (Entity Merging)...")
    fused_concepts, merge_map = merge_similar_entities(concepts)
    print(f"  [+] Số lượng concept sau khi dung hợp: {len(fused_concepts)}")
    if merge_map:
        print(f"  [+] Đã gộp {len(merge_map)} concepts trùng lặp.")

    # Ánh xạ lại mã concept trong triplets
    for t in triplets:
        if t["source"] in merge_map:
            t["source"] = merge_map[t["source"]]
        if t["target"] in merge_map:
            t["target"] = merge_map[t["target"]]

    # Loại bỏ các quan hệ tự liên kết (self-relation) phát sinh sau gộp
    triplets = [t for t in triplets if t["source"] != t["target"]]

    # Loại bỏ các triplets trùng lặp hoàn toàn
    unique_triplets_map = {}
    for t in triplets:
        key = (t["source"], t["relation"], t["target"])
        unique_triplets_map[key] = t
    triplets = list(unique_triplets_map.values())

    # 2. Xây dựng bản đồ ngày học của từng concept
    concept_day_map = {c["code"]: c.get("day", 1) for c in fused_concepts}
    concept_codes = [c["code"] for c in fused_concepts]

    # 3. Đảm bảo đồ thị là DAG
    print("[*] Đang kiểm tra tính tuần tự và loại bỏ chu trình (DAG Enforcing)...")
    final_triplets = enforce_dag(concept_codes, triplets, concept_day_map)

    # 4. Lưu kết quả đồ thị cuối cùng
    output_graph = {"concepts": fused_concepts, "relations": final_triplets}

    output_path = outputs_dir / "fused_graph.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_graph, f, ensure_ascii=False, indent=2)

    print(f"\n[+] Hoàn thành Phase 3! Đồ thị đã dung hợp được lưu tại: {output_path}")
    print(f"Tổng số Concepts sạch: {len(fused_concepts)}")
    print(f"Tổng số Relations sạch: {len(final_triplets)}")


if __name__ == "__main__":
    main()
