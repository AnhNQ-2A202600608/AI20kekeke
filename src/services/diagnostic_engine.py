import os
import json
import sqlite3
import datetime
from pathlib import Path
from typing import Any, Optional, Union
from src.config import get_settings

# Default BKT parameters
BKT_LEARN = 0.10
BKT_SLIP = 0.10
BKT_GUESS = 0.20
MASTERY_THRESHOLD = 0.90
N_SURFACE = 2
K_PROBE = 2
MAX_DESCENT = 3

class DiagnosticEngine:
    def __init__(self, db_path: Optional[str] = None):
        self.settings = get_settings()
        if not db_path:
            db_url = self.settings.database_url
            if db_url.startswith("sqlite:///"):
                db_path = db_url[10:]
            else:
                db_path = db_url
        
        self.db_path = Path(db_path)
        # Ensure parent directory exists
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Load Knowledge Graph
        self.graph_path = Path(self.settings.sgk_data_dir) / "knowledge_graph.json"
        self.questions_path = Path(self.settings.sgk_data_dir) / "questions.json"
        
        self._init_db()
        self.load_data()

    def _init_db(self):
        """Khởi tạo bảng SQLite mastery và learning_events nếu chưa tồn tại."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        # Bảng lưu trữ trạng thái năng lực hiện tại
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS mastery (
                student_id TEXT,
                node_id TEXT,
                p_known REAL,
                n_attempts INTEGER,
                last_updated TIMESTAMP,
                PRIMARY KEY (student_id, node_id)
            )
        """)
        
        # Bảng nhật ký sự kiện trả lời đúng/sai để replay
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS learning_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT,
                question_id TEXT,
                node_id TEXT,
                is_correct INTEGER,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        conn.close()

    def load_data(self):
        """Đọc và kiểm tra tính hợp lệ của Đồ thị tri thức & Bộ câu hỏi."""
        # 1. Load Knowledge Graph
        if self.graph_path.exists():
            with open(self.graph_path, "r", encoding="utf-8") as f:
                self.graph_data = json.load(f)
        else:
            self.graph_data = {"version": "1.0.0", "nodes": []}

        # 2. Load Questions
        if self.questions_path.exists():
            with open(self.questions_path, "r", encoding="utf-8") as f:
                self.questions_data = json.load(f)
        else:
            self.questions_data = []

        # Xây dựng danh mục tra cứu nhanh
        self.nodes = {node["id"]: node for node in self.graph_data.get("nodes", [])}
        self.questions = {q["question_id"]: q for q in self.questions_data}
        
        # Kiểm tra tính hợp lệ (DAG, Cạnh trỏ tới nút tồn tại)
        self.validate_graph()

    def validate_graph(self) -> bool:
        """Kiểm tra đồ thị tri thức có hợp lệ (không chu trình, không nút ảo)."""
        nodes = self.nodes
        for node_id, node in nodes.items():
            for prereq in node.get("tien_quyet", []):
                if prereq not in nodes:
                    raise ValueError(f"Lỗi đồ thị: Nút tiên quyết '{prereq}' của '{node_id}' không tồn tại trong danh sách nodes.")

        # Phát hiện chu trình bằng thuật toán duyệt DFS (Tarjan/Colors)
        visited = {}  # 0: chưa duyệt, 1: đang duyệt, 2: duyệt xong
        
        def has_cycle(u: str) -> bool:
            visited[u] = 1
            for v in nodes[u].get("tien_quyet", []):
                state = visited.get(v, 0)
                if state == 1:
                    return True
                elif state == 0:
                    if has_cycle(v):
                        return True
            visited[u] = 2
            return False

        for node_id in nodes:
            if visited.get(node_id, 0) == 0:
                if has_cycle(node_id):
                    raise ValueError(f"Lỗi đồ thị: Phát hiện chu trình (cycle) trong quan hệ tiên quyết chứa nút '{node_id}'.")
        return True

    def get_node_prior(self, student_grade: int, node_id: str) -> float:
        """Trả về giá trị p_known tiên nghiệm dựa theo khối lớp học của nút và học sinh."""
        node = self.nodes.get(node_id)
        if not node:
            return 0.5
        node_grade = node.get("lop", student_grade)
        
        if student_grade == node_grade:
            return 0.5
        elif student_grade > node_grade:
            # Học sinh khối trên làm bài khối dưới -> Ưu tiên cao hơn
            return 0.8
        else:
            # Học sinh khối dưới làm bài khối trên -> Ưu tiên thấp
            return 0.2

    def record_answer(self, student_id: str, question_id: str, is_correct: bool):
        """Ghi nhận sự kiện làm bài của học sinh và tính toán lại BKT mastery."""
        q = self.questions.get(question_id)
        if not q:
            raise ValueError(f"Không tìm thấy câu hỏi với ID '{question_id}'.")

        # Ghi sự kiện vào SQLite
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        for node_id in q["yccd"]:
            cursor.execute("""
                INSERT INTO learning_events (student_id, question_id, node_id, is_correct, timestamp)
                VALUES (?, ?, ?, ?, ?)
            """, (student_id, question_id, node_id, 1 if is_correct else 0, now))
            
            # Replay toàn bộ sự kiện của (student_id, node_id) để tính BKT chuẩn xác
            self._recalculate_bkt(cursor, student_id, node_id)
            
        conn.commit()
        conn.close()

    def _recalculate_bkt(self, cursor, student_id: str, node_id: str, student_grade: int = 7):
        """
        Duyệt lại toàn bộ lịch sử câu trả lời của nút để tính xác suất thạo p_known.
        Tránh lỗi mất đồng bộ dữ liệu đa thiết bị (Sync conflict).
        """
        cursor.execute("""
            SELECT is_correct FROM learning_events 
            WHERE student_id = ? AND node_id = ?
            ORDER BY timestamp ASC
        """, (student_id, node_id))
        rows = cursor.fetchall()
        
        p_known = self.get_node_prior(student_grade, node_id)
        for (is_correct_val,) in rows:
            is_correct = bool(is_correct_val)
            
            # Công thức Bayesian Knowledge Tracing (BKT)
            p_obs = p_known * (1 - BKT_SLIP) + (1 - p_known) * BKT_GUESS
            if is_correct:
                p_posterior = p_known * (1 - BKT_SLIP) / p_obs
            else:
                p_posterior = p_known * BKT_SLIP / (1 - p_obs)
            
            # Cơ hội chuyển tiếp học tập sau mỗi lượt trả lời
            p_known = p_posterior + (1 - p_posterior) * BKT_LEARN

        # Giới hạn xác suất trong khoảng an toàn và làm tròn
        p_known = round(min(0.9999, max(0.0001, p_known)), 4)
        n_attempts = len(rows)
        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        cursor.execute("""
            INSERT INTO mastery (student_id, node_id, p_known, n_attempts, last_updated)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(student_id, node_id) DO UPDATE SET
                p_known = excluded.p_known,
                n_attempts = excluded.n_attempts,
                last_updated = excluded.last_updated
        """, (student_id, node_id, p_known, n_attempts, now))

    def get_p_known(self, student_id: str, node_id: str, default_grade: int = 7) -> float:
        """Lấy xác suất làm chủ hiện tại của học viên đối với nút."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        cursor.execute("SELECT p_known FROM mastery WHERE student_id = ? AND node_id = ?", (student_id, node_id))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return row[0]
        return self.get_node_prior(default_grade, node_id)

    def find_topo_path(self, start_node: str, end_node: str) -> list[str]:
        """Tìm đường đi topo từ nút gốc rễ tiên quyết lên tới nút bề mặt (BFS/DFS)."""
        if start_node == end_node:
            return [start_node]
            
        # BFS để tìm đường đi ngắn nhất trong đồ thị ngược
        queue = [[end_node]]
        visited = {end_node}
        
        while queue:
            path = queue.pop(0)
            current = path[-1]
            if current == start_node:
                return list(reversed(path))
                
            for prereq in self.nodes.get(current, {}).get("tien_quyet", []):
                if prereq not in visited:
                    visited.add(prereq)
                    queue.append(path + [prereq])
        # Fallback nếu không có đường đi trực tiếp
        return [start_node, end_node]

    def get_probe_questions(self, node_id: str, exclude_ids: list[str]) -> list[dict]:
        """Lấy danh sách các câu hỏi ngắn dùng để thăm dò của một nút."""
        probes = [
            q for q in self.questions_data
            if node_id in q["yccd"] and q.get("la_cau_tham_do", False) and q["question_id"] not in exclude_ids
        ]
        # Nếu thiếu câu hỏi thăm dò, lấy tạm câu hỏi bình thường để tránh nghẽn luồng
        if not probes:
            probes = [
                q for q in self.questions_data
                if node_id in q["yccd"] and q["question_id"] not in exclude_ids
            ]
        return probes

    def diagnose(self, student_id: str, surface_node: str) -> Optional[dict]:
        """
        Thuật toán chẩn đoán lỗi hổng gốc rễ xác định.
        Trả về kết quả có cấu trúc:
        - None nếu không đủ bằng chứng sai có hệ thống ở bề mặt.
        - {'status': 'PROBE', 'probe_node': ..., 'questions': [...] } nếu cần đưa thêm câu hỏi thăm dò.
        - {'status': 'DIAGNOSIS_COMPLETE', 'weakness_flag': True, 'root_cause': ..., ... } nếu chẩn đoán xong.
        """
        # BƯỚC 1: Kiểm tra bằng chứng sai có hệ thống ở bề mặt (surface node)
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        cursor.execute("""
            SELECT is_correct, question_id FROM learning_events
            WHERE student_id = ? AND node_id = ?
            ORDER BY timestamp DESC LIMIT ?
        """, (student_id, surface_node, N_SURFACE))
        recent_attempts = cursor.fetchall()
        conn.close()

        # Cần tối thiểu N_SURFACE lượt làm bài và toàn bộ đều là trả lời SAI (is_correct = 0)
        if len(recent_attempts) < N_SURFACE or any(item[0] == 1 for item in recent_attempts):
            return None

        # BƯỚC 2: Duyệt đồ thị tiên quyết đi xuống
        node = surface_node
        root = surface_node
        depth = 0
        
        while depth < MAX_DESCENT:
            prereqs = self.nodes.get(node, {}).get("tien_quyet", [])
            if not prereqs:
                break
                
            # Chọn nút tiên quyết nghi ngờ nhất (có p_known thấp nhất)
            candidate = min(prereqs, key=lambda nd: self.get_p_known(student_id, nd))
            
            # Đếm số lần làm bài (attempts) của nút candidate
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()
            cursor.execute("""
                SELECT is_correct, question_id FROM learning_events
                WHERE student_id = ? AND node_id = ?
            """, (student_id, candidate))
            candidate_attempts = cursor.fetchall()
            conn.close()
            
            # BƯỚC 3: Thăm dò xác nhận (Probe) - Không suy đoán
            if len(candidate_attempts) < K_PROBE:
                # Cần đưa câu hỏi thăm dò của nút candidate để lấy bằng chứng thực tế
                exclude_ids = [item[1] for item in candidate_attempts]
                probe_qs = self.get_probe_questions(candidate, exclude_ids)
                return {
                    "status": "PROBE",
                    "probe_node": candidate,
                    "surface_node": surface_node,
                    "questions": [q["question_id"] for q in probe_qs[:K_PROBE - len(candidate_attempts)]],
                    "message": f"Hệ thống cần kiểm tra thêm kiến thức '{self.nodes[candidate].get('mo_ta', candidate)}' của học sinh."
                }
                
            # BƯỚC 4: Đánh giá kết quả thăm dò
            p_cand = self.get_p_known(student_id, candidate)
            if p_cand >= MASTERY_THRESHOLD:
                # Nút candidate này đã vững -> Dừng lại, lỗ hổng thực tế nằm ở nút cha của nó (node hiện tại)
                break
            else:
                # Nút candidate này thực sự hổng -> Đi tiếp xuống các tầng dưới của candidate
                root = candidate
                node = candidate
                depth += 1
                
        # Hoàn thành chẩn đoán, trả về Weakness Flag có cấu trúc
        suggested_path = self.find_topo_path(root, surface_node)
        confidence = round(1.0 - self.get_p_known(student_id, root), 2)
        
        return {
            "status": "DIAGNOSIS_COMPLETE",
            "weakness_flag": True,
            "root_cause": {
                "id": root,
                "mo_ta": self.nodes[root].get("mo_ta", root),
                "lop": self.nodes[root]["lop"]
            },
            "surface_node": {
                "id": surface_node,
                "mo_ta": self.nodes[surface_node].get("mo_ta", surface_node),
                "lop": self.nodes[surface_node]["lop"]
            },
            "confidence": confidence,
            "suggested_path": suggested_path
        }
