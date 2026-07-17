import os
import json
import pytest
import sqlite3
from pathlib import Path
from src.services.diagnostic_engine import DiagnosticEngine

@pytest.fixture
def temp_db(tmp_path):
    """Fixture tạo SQLite DB tạm thời phục vụ test."""
    db_file = tmp_path / "test_app.db"
    return str(db_file)

@pytest.fixture
def sample_data_dir(tmp_path):
    """Fixture tạo thư mục chứa knowledge_graph.json và questions.json tạm thời."""
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    
    # 1. Ghi knowledge_graph.json
    graph = {
        "version": "1.0.0",
        "nodes": [
            {"id": "A", "lop": 7, "tien_quyet": ["B"]},
            {"id": "B", "lop": 6, "tien_quyet": ["C"]},
            {"id": "C", "lop": 5, "tien_quyet": []}
        ]
    }
    with open(data_dir / "knowledge_graph.json", "w", encoding="utf-8") as f:
        json.dump(graph, f)

    # 2. Ghi questions.json
    questions = [
        # surface node A
        {"question_id": "q_a1", "yccd": ["A"], "la_cau_tham_do": False},
        {"question_id": "q_a2", "yccd": ["A"], "la_cau_tham_do": False},
        {"question_id": "q_a_p1", "yccd": ["A"], "la_cau_tham_do": True},
        # prerequisite node B
        {"question_id": "q_b1", "yccd": ["B"], "la_cau_tham_do": False},
        {"question_id": "q_b_p1", "yccd": ["B"], "la_cau_tham_do": True},
        {"question_id": "q_b_p2", "yccd": ["B"], "la_cau_tham_do": True},
        # prerequisite node C
        {"question_id": "q_c1", "yccd": ["C"], "la_cau_tham_do": False},
        {"question_id": "q_c_p1", "yccd": ["C"], "la_cau_tham_do": True},
        {"question_id": "q_c_p2", "yccd": ["C"], "la_cau_tham_do": True}
    ]
    with open(data_dir / "questions.json", "w", encoding="utf-8") as f:
        json.dump(questions, f)

    return data_dir

def test_graph_validation_detects_cycles(temp_db, tmp_path):
    """Kiểm tra xem validator có phát hiện được chu trình lặp trong đồ thị."""
    invalid_dir = tmp_path / "invalid_data"
    invalid_dir.mkdir()
    
    # Đồ thị chu trình: A -> B -> A
    graph = {
        "version": "1.0.0",
        "nodes": [
            {"id": "A", "lop": 7, "tien_quyet": ["B"]},
            {"id": "B", "lop": 6, "tien_quyet": ["A"]}
        ]
    }
    with open(invalid_dir / "knowledge_graph.json", "w", encoding="utf-8") as f:
        json.dump(graph, f)
        
    engine = DiagnosticEngine(db_path=temp_db)
    engine.graph_path = invalid_dir / "knowledge_graph.json"
    engine.questions_path = invalid_dir / "questions.json"
    
    with pytest.raises(ValueError, match="Phát hiện chu trình"):
        engine.load_data()

def test_graph_validation_detects_missing_nodes(temp_db, tmp_path):
    """Kiểm tra xem validator có phát hiện được nút tiên quyết ảo không tồn tại."""
    invalid_dir = tmp_path / "invalid_data"
    invalid_dir.mkdir()
    
    # A tiên quyết là D, nhưng D không nằm trong đồ thị
    graph = {
        "version": "1.0.0",
        "nodes": [
            {"id": "A", "lop": 7, "tien_quyet": ["D"]}
        ]
    }
    with open(invalid_dir / "knowledge_graph.json", "w", encoding="utf-8") as f:
        json.dump(graph, f)
        
    engine = DiagnosticEngine(db_path=temp_db)
    engine.graph_path = invalid_dir / "knowledge_graph.json"
    engine.questions_path = invalid_dir / "questions.json"
    
    with pytest.raises(ValueError, match="không tồn tại trong danh sách nodes"):
        engine.load_data()

def test_prior_probabilities(temp_db, sample_data_dir):
    """Kiểm tra giá trị tiên nghiệm khởi tạo theo khối lớp."""
    engine = DiagnosticEngine(db_path=temp_db)
    engine.graph_path = sample_data_dir / "knowledge_graph.json"
    engine.questions_path = sample_data_dir / "questions.json"
    engine.load_data()
    
    # Node A (Lớp 7), Học sinh lớp 7 -> 0.5
    assert engine.get_node_prior(7, "A") == 0.5
    # Node B (Lớp 6), Học sinh lớp 7 -> 0.8 (khối dưới)
    assert engine.get_node_prior(7, "B") == 0.8
    # Node C (Lớp 5), Học sinh lớp 4 -> 0.2 (khối trên)
    assert engine.get_node_prior(4, "C") == 0.2

def test_bkt_recalculations(temp_db, sample_data_dir):
    """Kiểm tra tính toán xác suất BKT tăng/giảm dựa trên câu trả lời."""
    engine = DiagnosticEngine(db_path=temp_db)
    engine.graph_path = sample_data_dir / "knowledge_graph.json"
    engine.questions_path = sample_data_dir / "questions.json"
    engine.load_data()
    
    # Trả lời sai câu hỏi ở nút A
    engine.record_answer("student_01", "q_a1", is_correct=False)
    p1 = engine.get_p_known("student_01", "A", default_grade=7)
    assert p1 < 0.5  # Phải giảm từ 0.5
    
    # Trả lời đúng -> p_known tăng lên
    engine.record_answer("student_01", "q_a2", is_correct=True)
    p2 = engine.get_p_known("student_01", "A", default_grade=7)
    assert p2 > p1

def test_diagnose_requires_n_surface_errors(temp_db, sample_data_dir):
    """Kiểm tra điều kiện kích hoạt: 1 câu sai đơn lẻ không sinh cờ chẩn đoán."""
    engine = DiagnosticEngine(db_path=temp_db)
    engine.graph_path = sample_data_dir / "knowledge_graph.json"
    engine.questions_path = sample_data_dir / "questions.json"
    engine.load_data()
    
    # 1 câu sai -> Không chẩn đoán gì
    engine.record_answer("student_01", "q_a1", is_correct=False)
    diag = engine.diagnose("student_01", "A")
    assert diag is None

    # 2 câu sai liên tiếp -> Kích hoạt chẩn đoán và đòi câu thăm dò ở nút tiên quyết B
    engine.record_answer("student_01", "q_a2", is_correct=False)
    diag = engine.diagnose("student_01", "A")
    assert diag is not None
    assert diag["status"] == "PROBE"
    assert diag["probe_node"] == "B"

def test_diagnose_complete_with_root_cause(temp_db, sample_data_dir):
    """Kiểm tra luồng chẩn đoán đi xuống và kết luận thành công nút hổng gốc rễ."""
    engine = DiagnosticEngine(db_path=temp_db)
    engine.graph_path = sample_data_dir / "knowledge_graph.json"
    engine.questions_path = sample_data_dir / "questions.json"
    engine.load_data()
    
    # 1. Gây lỗi hệ thống bề mặt ở A (2 câu sai)
    engine.record_answer("student_02", "q_a1", is_correct=False)
    engine.record_answer("student_02", "q_a2", is_correct=False)
    
    # 2. Engine yêu cầu câu hỏi thăm dò ở B
    diag1 = engine.diagnose("student_02", "A")
    assert diag1["status"] == "PROBE"
    assert diag1["probe_node"] == "B"
    
    # 3. Trả lời sai 2 câu thăm dò của B -> B bị hổng -> Engine đi tiếp xuống C
    engine.record_answer("student_02", "q_b_p1", is_correct=False)
    engine.record_answer("student_02", "q_b_p2", is_correct=False)
    
    diag2 = engine.diagnose("student_02", "A")
    assert diag2["status"] == "PROBE"
    assert diag2["probe_node"] == "C"
    
    # 4. Trả lời đúng các câu thăm dò ở C -> C vững -> Lỗ hổng gốc rễ dừng ở B!
    engine.record_answer("student_02", "q_c_p1", is_correct=True)
    engine.record_answer("student_02", "q_c_p2", is_correct=True)
    
    diag3 = engine.diagnose("student_02", "A")
    assert diag3["status"] == "DIAGNOSIS_COMPLETE"
    assert diag3["weakness_flag"] is True
    assert diag3["root_cause"]["id"] == "B"
    assert diag3["suggested_path"] == ["B", "A"]
