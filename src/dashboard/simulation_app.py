import json
import random
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

# Append project root to path to resolve imports from src
sys.path.append(str(Path(__file__).parent.parent.parent))

from src.services.adaptive.bandit import LinUCB, build_student_context, calculate_bandit_reward
from src.services.adaptive.bkt import BKTParameters, calculate_bkt_update, determine_mastery_state
from src.services.adaptive.elo import calculate_elo_updates, calculate_expected_success

# Page configurations
st.set_page_config(
    page_title="EduGap Adaptive Simulator", page_icon="🎓", layout="wide", initial_sidebar_state="expanded"
)

# Custom Styling for Premium Dark Mode Look
st.markdown(
    """
<style>
    /* Styling metrics cards */
    .metric-box {
        background-color: #1e293b;
        border: 1px solid #334155;
        border-radius: 10px;
        padding: 20px;
        text-align: center;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .metric-val {
        font-size: 28px;
        font-weight: 700;
        color: #38bdf8;
        margin-bottom: 5px;
    }
    .metric-lbl {
        font-size: 14px;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .interactive-card {
        background-color: #1e293b;
        border: 2px solid #38bdf8;
        border-radius: 12px;
        padding: 25px;
        margin-bottom: 20px;
    }
</style>
""",
    unsafe_allow_html=True,
)

# App Title & Description
st.title("🎓 EduGap: Adaptive Learning Simulator")
st.markdown(
    "Trực quan hóa hoạt động thực tế và sự tương tác giữa 3 thuật toán thích ứng cốt lõi trong hệ thống: "
    "**Elo Rating** (Đánh giá năng lực), **Bayesian Knowledge Tracing (BKT)** (Theo dõi mức độ làm chủ kiến thức), "
    "và **LinUCB Contextual Bandit** (Gợi ý bài tập cá nhân hóa)."
)
st.markdown("---")

# Sidebar Configuration
st.sidebar.header("⚙️ Cấu hình Giả lập")

# Mode Selector
app_mode = st.sidebar.radio(
    "Chọn Chế độ Giao diện:",
    options=[
        "Batch Simulation (Giả lập tự động)",
        "Interactive Play (Trải nghiệm thực tế)",
        "Đồ thị Tri thức Đầy đủ (Full Knowledge Graph)",
    ],
    help="Chuyển đổi giữa chạy giả lập tự động, tự làm câu hỏi tương tác hoặc xem sơ đồ toàn bộ đồ thị tri thức.",
)

st.sidebar.markdown("---")

# General parameters (Shared across modes)
st.sidebar.subheader("👤 Học sinh (Student)")
true_student_elo = st.sidebar.slider(
    "Năng lực thực tế (True Student Elo)",
    min_value=600.0,
    max_value=2400.0,
    value=1500.0,
    step=50.0,
    help="Chỉ dùng cho chế độ Giả lập tự động để tính xác suất đúng/sai thực tế.",
)
init_student_elo = st.sidebar.slider(
    "Elo ước lượng ban đầu (Initial Est. Elo)",
    min_value=600.0,
    max_value=2000.0,
    value=1200.0,
    step=50.0,
    help="Điểm năng lực khởi điểm mà hệ thống gán cho học sinh khi mới vào học.",
)
init_student_bkt = st.sidebar.slider(
    "Tỉ lệ làm chủ ban đầu (Initial BKT)",
    min_value=0.0,
    max_value=1.0,
    value=0.25,
    step=0.05,
    help="Xác suất học sinh đã làm chủ concept này từ đầu.",
)

st.sidebar.subheader("🤖 Tham số BKT")
bkt_transition = st.sidebar.slider("Xác suất học được P(T)", min_value=0.0, max_value=0.5, value=0.10, step=0.01)
bkt_guess = st.sidebar.slider("Xác suất đoán bừa P(G)", min_value=0.0, max_value=0.5, value=0.20, step=0.01)
bkt_slip = st.sidebar.slider("Xác suất làm sai ngớ ngẩn P(S)", min_value=0.0, max_value=0.5, value=0.10, step=0.01)

st.sidebar.subheader("🎯 Tham số Gợi ý LinUCB")
bandit_alpha = st.sidebar.slider(
    "Khám phá (Exploration Alpha)",
    min_value=0.0,
    max_value=5.0,
    value=0.3,
    step=0.1,
    help="Alpha càng thấp, thuật toán càng ưu tiên Khai thác. Mặc định 0.3 để tối ưu hóa việc demo tính thích ứng.",
)

# Using LinUCB, build_student_context and calculate_bandit_reward imported from src.services.adaptive.bandit


# Helper functions for Interactive State Management
def recommend_next_question():
    concept = st.session_state.current_concept
    # Build student context
    X = build_student_context(st.session_state.student_bkt_dict[concept], st.session_state.student_elo_dict[concept])

    # Lấy danh sách ID các câu hỏi đã trả lời để loại trừ khỏi danh sách gợi ý tiếp theo
    answered_qids = [log["Question ID"] for log in st.session_state.history_logs]

    # Bộ lọc ZPD kết hợp Concept hiện tại: Chỉ cho phép chọn câu hỏi chưa làm, đúng Concept hiện tại
    # và có độ khó ước lượng +/- 250 Elo so với học sinh
    candidate_ids = [
        q["id"]
        for q in st.session_state.questions
        if q["concept"] == concept
        and q["id"] not in answered_qids
        and abs(q["est_diff"] - st.session_state.student_elo_dict[concept]) <= 250.0
    ]

    # Fallback nếu không có câu nào thỏa mãn ZPD, lấy 3 câu chưa làm gần năng lực nhất thuộc Concept hiện tại
    if not candidate_ids:
        remaining_qs = [
            q for q in st.session_state.questions if q["concept"] == concept and q["id"] not in answered_qids
        ]
        if not remaining_qs:
            # Nếu đã làm hết sạch câu của Concept hiện tại, reset lịch sử của riêng Concept để làm lại
            remaining_qs = [q for q in st.session_state.questions if q["concept"] == concept]

        closest_qs = sorted(
            remaining_qs, key=lambda q: abs(q["est_diff"] - st.session_state.student_elo_dict[concept])
        )[:3]
        candidate_ids = [q["id"] for q in closest_qs]

    selected_qid, expected_reward = st.session_state.bandit.select_arm(
        context_vector=X, arms_states=st.session_state.arms_states, candidate_arm_ids=candidate_ids
    )
    st.session_state.current_qid = selected_qid
    st.session_state.expected_reward = expected_reward


def init_interactive_state(force=False):
    if "interactive_initialized" not in st.session_state or force:
        st.session_state.interactive_initialized = True

        # ĐỒ THỊ TRI THỨC 3 CONCEPT (3 DAYS)
        st.session_state.student_elo_dict = {"variables": init_student_elo, "loops": 1200.0, "functions": 1200.0}
        st.session_state.student_bkt_dict = {"variables": init_student_bkt, "loops": 0.15, "functions": 0.10}

        # Đánh dấu xem Concept đã bắt đầu học chưa để áp dụng thừa kế Elo (Elo Inheritance) đúng 1 lần
        st.session_state.concept_started = {"variables": True, "loops": False, "functions": False}

        # Khởi tạo ngân hàng 100 câu hỏi phân cấp theo 3 Concept đại diện cho 3 Days
        questions_list = []
        for i in range(100):
            if i < 30:
                concept = "variables"
                true_d = 600.0 + i * (800.0 / 30.0)  # Variables: 600 -> 1400
            elif i < 60:
                concept = "loops"
                true_d = 1000.0 + (i - 30) * (800.0 / 30.0)  # Loops: 1000 -> 1800
            else:
                concept = "functions"
                true_d = 1400.0 + (i - 60) * (1000.0 / 40.0)  # Functions: 1400 -> 2400

            est_d = true_d + random.uniform(-100.0, 100.0)
            questions_list.append(
                {"id": f"q_{i}", "concept": concept, "true_diff": round(true_d, 1), "est_diff": round(est_d, 1)}
            )

        st.session_state.questions = questions_list
        st.session_state.current_concept = "variables"

        st.session_state.bandit = LinUCB(context_dim=3, alpha=bandit_alpha)
        st.session_state.arms_states = {
            q["id"]: st.session_state.bandit.get_default_arm_state() for q in st.session_state.questions
        }
        st.session_state.history_logs = []
        st.session_state.current_step = 1
        recommend_next_question()


def handle_interactive_answer(is_correct):
    concept = st.session_state.current_concept
    selected_qid = st.session_state.current_qid
    q_idx = int(selected_qid.split("_")[1])
    question = st.session_state.questions[q_idx]

    bkt_params = BKTParameters(
        prior_learned=init_student_bkt, transition_learn=bkt_transition, guess=bkt_guess, slip=bkt_slip
    )

    actual_score = 1.0 if is_correct else 0.0
    old_student_elo = st.session_state.student_elo_dict[concept]
    old_bkt = st.session_state.student_bkt_dict[concept]
    old_q_elo = question["est_diff"]

    # Update BKT
    new_bkt = calculate_bkt_update(old_bkt, actual_score, bkt_params)
    st.session_state.student_bkt_dict[concept] = new_bkt

    # LAN TRUYỀN NGƯỢC (Backward Propagation) có CLAMP bảo vệ
    # Nếu làm sai ở Loops/Functions làm tụt BKT, tự động giảm nhẹ BKT của bài trước.
    # Sử dụng max(0.0001, ...) để triệt tiêu hoàn toàn khả năng rơi xuống số âm.
    if not is_correct:
        if concept == "loops":
            old_val = st.session_state.student_bkt_dict["variables"]
            st.session_state.student_bkt_dict["variables"] = round(max(0.0001, old_val - 0.05), 4)
        elif concept == "functions":
            old_val = st.session_state.student_bkt_dict["loops"]
            st.session_state.student_bkt_dict["loops"] = round(max(0.0001, old_val - 0.05), 4)
    else:
        # Làm đúng câu nâng cao -> củng cố tăng nhẹ bài cơ sở trước đó
        if concept == "loops":
            old_val = st.session_state.student_bkt_dict["variables"]
            st.session_state.student_bkt_dict["variables"] = round(min(0.9999, old_val + 0.03), 4)
        elif concept == "functions":
            old_val = st.session_state.student_bkt_dict["loops"]
            st.session_state.student_bkt_dict["loops"] = round(min(0.9999, old_val + 0.03), 4)

    # Update Elo
    new_student_elo, new_q_elo = calculate_elo_updates(
        student_elo=old_student_elo, question_elo=old_q_elo, actual_score=actual_score, hint_count=0
    )
    st.session_state.student_elo_dict[concept] = new_student_elo
    question["est_diff"] = new_q_elo

    # Expected success based on old state
    expected_success = calculate_expected_success(old_student_elo, old_q_elo)

    # Bandit reward
    reward = calculate_bandit_reward(expected_success, actual_score)

    # Update bandit weights
    X = build_student_context(old_bkt, old_student_elo)
    st.session_state.bandit.update_arm(
        arm_id=selected_qid, context_vector=X, reward=reward, arms_states=st.session_state.arms_states
    )

    # Save log
    st.session_state.history_logs.append(
        {
            "Step": st.session_state.current_step,
            "Concept": concept,
            "Question ID": selected_qid,
            "True Diff": question["true_diff"],
            "Old Est Diff": old_q_elo,
            "New Est Diff": new_q_elo,
            "Old Student Elo": old_student_elo,
            "New Student Elo": new_student_elo,
            "Old BKT Mastery": old_bkt,
            "New BKT Mastery": new_bkt,
            "Expected Success (P)": round(expected_success, 4),
            "Outcome": "Correct" if is_correct else "Incorrect",
            "Bandit Reward": reward,
            "Delta Student Elo": round(new_student_elo - old_student_elo, 2),
            "Delta BKT": round(new_bkt - old_bkt, 4),
        }
    )

    st.session_state.current_step += 1
    recommend_next_question()


# Vẽ toàn bộ đồ thị tri thức sử dụng Graphviz tích hợp sẵn của Streamlit
def draw_full_knowledge_graph():
    fused_graph_path = Path(__file__).parent.parent.parent / "outputs" / "fused_graph.json"
    if not fused_graph_path.exists():
        st.error("Không tìm thấy file fused_graph.json. Vui lòng chạy pipeline Graph Fusion trước.")
        return

    with open(fused_graph_path, encoding="utf-8") as f:
        graph = json.load(f)

    concepts = graph["concepts"]
    relations = graph["relations"]

    # Sắp xếp các concepts theo day để hiển thị khoa học
    concepts = sorted(concepts, key=lambda x: x.get("day", 1))

    dot_lines = [
        "digraph G {",
        '    backgroundcolor="#0f172a";',
        "    rankdir=LR;",
        '    node [style="filled,rounded", shape=box, fontname="Arial", fontsize=10, fontcolor="#ffffff", penwidth=2];',
        '    edge [color="#64748b", penwidth=1.5, arrowsize=0.7];',
    ]

    # Thêm các nodes vào Graphviz
    for c in concepts:
        code = c["code"]
        name = c["name"]
        day = c.get("day", 1)

        # Gán màu sắc cho từng Track (Days 17-24) và General Core (Days 1-16)
        if day < 17:
            color = "#0ea5e9"  # sky blue (General Core)
        elif code.startswith("t1-"):
            color = "#f59e0b"  # amber (Track 1)
        elif code.startswith("t2-"):
            color = "#10b981"  # emerald (Track 2)
        elif code.startswith("t3-"):
            color = "#f43f5e"  # rose (Track 3)
        else:
            color = "#f59e0b"

        label = f"{name}\\n(Day {day})"
        label_escaped = label.replace('"', '\\"')

        dot_lines.append(f'    "{code}" [label="{label_escaped}", fillcolor="#1e293b", color="{color}"];')

    # Thêm các liên kết phụ thuộc (edges)
    for r in relations:
        source = r["source"]
        target = r["target"]
        rel_type = r["relation"]

        if rel_type == "Prerequisite_of":
            dot_lines.append(f'    "{source}" -> "{target}";')
        elif rel_type == "Conjunction":
            dot_lines.append(f'    "{source}" -> "{target}" [style="dashed", color="#94a3b8"];')

    dot_lines.append("}")
    dot_code = "\n".join(dot_lines)
    st.graphviz_chart(dot_code)


# Vẽ đồ thị tri thức Graphviz (Đảm bảo clamp BKT để tránh hiển thị số âm)
def draw_knowledge_graph():
    bkt_var = max(0.0001, min(0.9999, st.session_state.student_bkt_dict["variables"]))
    bkt_loop = max(0.0001, min(0.9999, st.session_state.student_bkt_dict["loops"]))
    bkt_func = max(0.0001, min(0.9999, st.session_state.student_bkt_dict["functions"]))

    # Variables Color Mapping
    if bkt_var >= 0.85:
        color_var = "#22c55e"  # Green
        lbl_var = f"Day 1: Variables\\n(MASTERED: {bkt_var:.1%})"
    elif bkt_var >= 0.30:
        color_var = "#eab308"  # Yellow
        lbl_var = f"Day 1: Variables\\n(Learning: {bkt_var:.1%})"
    else:
        color_var = "#ef4444"  # Red
        lbl_var = f"Day 1: Variables\\n(Weak: {bkt_var:.1%})"

    # Loops Color Mapping
    if bkt_loop >= 0.85:
        color_loop = "#22c55e"
        lbl_loop = f"Day 2: Loops\\n(MASTERED: {bkt_loop:.1%})"
    elif bkt_loop >= 0.30:
        color_loop = "#eab308"
        lbl_loop = f"Day 2: Loops\\n(Learning: {bkt_loop:.1%})"
    else:
        color_loop = "#ef4444"
        lbl_loop = f"Day 2: Loops\\n(Weak: {bkt_loop:.1%})"

    # Functions Color Mapping
    if bkt_func >= 0.85:
        color_func = "#22c55e"
        lbl_func = f"Day 3: Functions\\n(MASTERED: {bkt_func:.1%})"
    elif bkt_func >= 0.30:
        color_func = "#eab308"
        lbl_func = f"Day 3: Functions\\n(Learning: {bkt_func:.1%})"
    else:
        color_func = "#ef4444"
        lbl_func = f"Day 3: Functions\\n(Weak: {bkt_func:.1%})"

    dot_code = f"""
    digraph G {{
        backgroundcolor="#0f172a";
        rankdir=LR;
        node [style="filled,rounded", shape=box, fontname="Arial", fontsize=10, fontcolor="#ffffff", penwidth=2];
        edge [color="#475569", penwidth=2, arrowsize=0.7];

        Variables [label="{lbl_var}", fillcolor="{color_var}", color="#0ea5e9"];
        Loops [label="{lbl_loop}", fillcolor="{color_loop}", color="#0ea5e9"];
        Functions [label="{lbl_func}", fillcolor="{color_func}", color="#0ea5e9"];

        Variables -> Loops [label="Prerequisite", fontcolor="#64748b", fontsize=9];
        Loops -> Functions [label="Prerequisite", fontcolor="#64748b", fontsize=9];
    }}
    """
    st.graphviz_chart(dot_code)


# =========================================================================
# LUỒNG XỬ LÝ 1: INTERACTIVE PLAY MODE
# =========================================================================
if app_mode == "Interactive Play (Trải nghiệm thực tế)":
    init_interactive_state()

    st.subheader("🎓 Lộ trình & Bản đồ Đồ thị Tri thức (Course Knowledge Graph)")
    # Vẽ đồ thị khái niệm
    draw_knowledge_graph()

    st.markdown("---")

    # Active Concept Selector (Mở hoàn toàn, cho phép chọn tự do, không khoá cứng)
    st.subheader("📚 Chọn Concept làm bài tập:")

    concept_options = ["Day 1: Variables", "Day 2: Loops", "Day 3: Functions"]

    selected_concept_lbl = st.radio(
        "Chủ đề đang làm bài:",
        options=concept_options,
        horizontal=True,
        help="Chọn bài tập bạn muốn làm. Bạn có thể tự do học bất kỳ Day nào ngay từ đầu mà không bị khoá cứng giao diện.",
    )

    concept_map = {"Day 1: Variables": "variables", "Day 2: Loops": "loops", "Day 3: Functions": "functions"}
    new_concept = concept_map[selected_concept_lbl]

    # Check if we switched concept
    if new_concept != st.session_state.current_concept:
        # ÁP DỤNG THỪA KẾ ELO (Elo Inheritance) KHI BẮT ĐẦU CONCEPT MỚI
        if not st.session_state.concept_started[new_concept]:
            st.session_state.concept_started[new_concept] = True

            # Thừa hưởng 70% Elo từ concept trước đó trong Graph
            if new_concept == "loops":
                prev_elo = st.session_state.student_elo_dict["variables"]
                inherited_elo = 0.7 * prev_elo + 0.3 * 1200.0
            elif new_concept == "functions":
                prev_elo = st.session_state.student_elo_dict["loops"]
                inherited_elo = 0.7 * prev_elo + 0.3 * 1200.0
            else:
                inherited_elo = 1200.0

            st.session_state.student_elo_dict[new_concept] = round(inherited_elo, 2)
            st.toast(f"🎉 Bạn đã bắt đầu và thừa hưởng Elo khởi điểm: {inherited_elo:.1f} từ bài học trước!", icon="🔓")

        st.session_state.current_concept = new_concept
        recommend_next_question()
        st.rerun()

    concept = st.session_state.current_concept

    # Layout splits: Interactive question box on left, current statistics on right
    col_play, col_status = st.columns([2, 1])

    with col_play:
        # Question box UI
        st.markdown('<div class="interactive-card">', unsafe_allow_html=True)
        st.markdown(
            f"### ❓ CÂU HỎI ĐƯỢC GỢI Ý: <span style='color:#38bdf8;'>{st.session_state.current_qid.upper()}</span>",
            unsafe_allow_html=True,
        )

        q_idx = int(st.session_state.current_qid.split("_")[1])
        curr_q = st.session_state.questions[q_idx]

        # Explain target probability for user context
        expected_p = calculate_expected_success(st.session_state.student_elo_dict[concept], curr_q["est_diff"])

        st.write(f"**Chủ đề hiện tại:** `{concept.upper()}`")
        st.write(f"**Độ khó ước lượng hiện tại (Est Difficulty Elo):** `{curr_q['est_diff']:.1f}`")
        st.write(f"**Độ khó thực tế ẩn (True Difficulty):** `{curr_q['true_diff']:.1f}`")
        st.write(f"**Xác suất hệ thống đoán bạn làm đúng câu này:** `{expected_p:.1%}`")
        st.markdown("<br>", unsafe_allow_html=True)

        col_btn1, col_btn2, col_btn3 = st.columns([1, 1, 1])
        with col_btn1:
            if st.button("✅ Trả lời ĐÚNG (Correct)", use_container_width=True, type="primary"):
                handle_interactive_answer(True)
                st.rerun()
        with col_btn2:
            if st.button("❌ Trả lời SAI (Incorrect)", use_container_width=True):
                handle_interactive_answer(False)
                st.rerun()
        with col_btn3:
            if st.button("🔄 Reset Học sinh mới", use_container_width=True, type="secondary"):
                init_interactive_state(force=True)
                st.rerun()

        st.markdown("</div>", unsafe_allow_html=True)

    with col_status:
        st.markdown("### 📊 Trạng thái Hiện tại")

        # Real-time state metrics card
        hist_len = len(st.session_state.history_logs)
        last_change_elo = "No change"
        last_change_bkt = "No change"
        last_q_calibration = "Chưa có"

        concept_logs = [log for log in st.session_state.history_logs if log["Concept"] == concept]

        if len(concept_logs) > 0:
            last_log = concept_logs[-1]
            sign_elo = "+" if last_log["Delta Student Elo"] >= 0 else ""
            sign_bkt = "+" if last_log["Delta BKT"] >= 0 else ""

            outcome_emoji = "✅" if last_log["Outcome"] == "Correct" else "❌"
            last_change_elo = f"{sign_elo}{last_log['Delta Student Elo']:.2f} (Lượt {last_log['Step']}: {outcome_emoji} {last_log['Question ID']})"
            last_change_bkt = f"{sign_bkt}{last_log['Delta BKT']:.2%} (Lượt {last_log['Step']}: {outcome_emoji} {last_log['Question ID']})"

            # Cân chỉnh câu hỏi vừa làm
            q_delta = round(last_log["New Est Diff"] - last_log["Old Est Diff"], 2)
            sign_q = "+" if q_delta >= 0 else ""
            last_q_calibration = f"{last_log['Question ID']} (Elo độ khó: {last_log['Old Est Diff']:.1f} -> {last_log['New Est Diff']:.1f} [{sign_q}{q_delta}])"

        st.metric(
            label=f"Năng lực {concept.upper()} (Est Student Elo)",
            value=f"{st.session_state.student_elo_dict[concept]:.1f}",
            delta=last_change_elo,
        )

        # Đảm bảo hiển thị % không bị âm
        curr_bkt_val = max(0.0001, min(0.9999, st.session_state.student_bkt_dict[concept]))
        st.metric(label=f"Xác suất Mastery {concept.upper()} (BKT)", value=f"{curr_bkt_val:.2%}", delta=last_change_bkt)
        st.write(f"**Trạng thái làm chủ:** `{determine_mastery_state(curr_bkt_val).upper()}`")
        st.write("**Cân chỉnh câu hỏi vừa làm:**")
        st.info(last_q_calibration)
        st.write(f"**Tổng số câu hỏi đã làm:** `{hist_len}`")

    # --- RENDER CHARTS AND LOGS FOR INTERACTIVE MODE ---
    if len(st.session_state.history_logs) > 0:
        df_results = pd.DataFrame(st.session_state.history_logs)

        tab1, tab2, tab3 = st.tabs(
            [
                "📈 Biểu đồ Tiến trình Live",
                "🎯 Hiệu chuẩn Độ khó Câu hỏi (Calibration)",
                "📄 Chi tiết Lịch sử Làm bài (Logs)",
            ]
        )

        with tab1:
            col_chart1, col_chart2 = st.columns(2)

            with col_chart1:
                st.subheader("Live Elo Progress")
                fig_elo = go.Figure()

                # Draw student Elo progress for each concept
                unique_concepts = df_results["Concept"].unique()
                for c in unique_concepts:
                    c_df = df_results[df_results["Concept"] == c]
                    fig_elo.add_trace(
                        go.Scatter(
                            x=list(c_df["Step"]),
                            y=list(c_df["New Student Elo"]),
                            mode="lines+markers",
                            name=f"Elo: {c.upper()}",
                            marker=dict(size=6),
                        )
                    )
                fig_elo.update_layout(
                    xaxis_title="Simulation Step",
                    yaxis_title="Elo Rating",
                    template="plotly_dark",
                    margin=dict(l=20, r=20, t=20, b=20),
                    hovermode="x unified",
                )
                st.plotly_chart(fig_elo, use_container_width=True)

            with col_chart2:
                st.subheader("Live BKT Mastery")
                fig_bkt = go.Figure()
                fig_bkt.add_trace(
                    go.Scatter(
                        x=[0, len(df_results) + 5],
                        y=[0.85, 0.85],
                        mode="lines",
                        name="Mastery Threshold (0.85)",
                        line=dict(color="#22c55e", width=1.5, dash="dash"),
                    )
                )
                for c in unique_concepts:
                    c_df = df_results[df_results["Concept"] == c]
                    fig_bkt.add_trace(
                        go.Scatter(
                            x=list(c_df["Step"]),
                            y=list(c_df["New BKT Mastery"]),
                            mode="lines+markers",
                            name=f"BKT: {c.upper()}",
                            marker=dict(size=6),
                        )
                    )
                fig_bkt.update_layout(
                    xaxis_title="Simulation Step",
                    yaxis_title="Mastery Probability",
                    yaxis=dict(range=[0, 1.05]),
                    template="plotly_dark",
                    margin=dict(l=20, r=20, t=20, b=20),
                    hovermode="x unified",
                )
                st.plotly_chart(fig_bkt, use_container_width=True)

        with tab2:
            st.subheader("Live Calibration of Answered Questions")
            answered_unique_qids = df_results["Question ID"].unique().tolist()

            start_ests = {}
            for q in st.session_state.questions:
                start_ests[q["id"]] = q["est_diff"]

            for _, r in df_results.iloc[::-1].iterrows():
                qid = r["Question ID"]
                start_ests[qid] = r["Old Est Diff"]

            hist_calib = {qid: [start_ests[qid]] for qid in answered_unique_qids}
            curr_vals = {qid: start_ests[qid] for qid in answered_unique_qids}

            for _, r in df_results.iterrows():
                qid = r["Question ID"]
                curr_vals[qid] = r["New Est Diff"]
                for q_id in answered_unique_qids:
                    hist_calib[q_id].append(curr_vals[q_id])

            fig_calib = go.Figure()
            colors = px.colors.qualitative.Plotly
            for idx, qid in enumerate(answered_unique_qids):
                true_val = [q["true_diff"] for q in st.session_state.questions if q["id"] == qid][0]
                fig_calib.add_trace(
                    go.Scatter(
                        x=list(range(len(df_results) + 1)),
                        y=hist_calib[qid],
                        mode="lines+markers",
                        name=f"{qid} (True Diff: {true_val:.0f})",
                        line=dict(color=colors[idx % len(colors)], width=2),
                    )
                )

            fig_calib.update_layout(
                xaxis_title="Simulation Step",
                yaxis_title="Estimated Question Elo",
                template="plotly_dark",
                margin=dict(l=20, r=20, t=20, b=20),
                hovermode="x unified",
            )
            st.plotly_chart(fig_calib, use_container_width=True)

        with tab3:
            df_display = df_results[
                [
                    "Step",
                    "Concept",
                    "Question ID",
                    "Old Student Elo",
                    "New Student Elo",
                    "Old BKT Mastery",
                    "New BKT Mastery",
                    "Expected Success (P)",
                    "Outcome",
                    "Bandit Reward",
                ]
            ].copy()

            def color_outcome(val):
                color = "#155724" if val == "Correct" else "#721c24"
                return f"background-color: {color}; color: white"

            try:
                styled_df = df_display.style.map(color_outcome, subset=["Outcome"])
                st.dataframe(styled_df, use_container_width=True, height=400)
            except Exception:
                st.dataframe(df_display, use_container_width=True, height=400)
    else:
        st.info("Chưa có lượt làm bài nào. Hãy nhấn nút trả lời ở khung trên để bắt đầu tích lũy dữ liệu vẽ biểu đồ!")

# =========================================================================
# LUỒNG XỬ LÝ 2: BATCH SIMULATION MODE
# =========================================================================
elif app_mode == "Batch Simulation (Giả lập tự động)":
    st.sidebar.subheader("📈 Giả lập tự động")
    reproducible = st.sidebar.checkbox("Cố định kết quả (Reproducible Seed)", value=False)
    if reproducible:
        random.seed(42)
        np.random.seed(42)
    sim_steps = st.sidebar.slider("Số bước giả lập (Steps)", min_value=10, max_value=100, value=30, step=5)

    # Engine run logic wrapper
    def run_simulation_engine():
        questions = []
        for i in range(100):
            if i < 30:
                concept = "variables"
                true_d = 600.0 + i * (800.0 / 30.0)
            elif i < 60:
                concept = "loops"
                true_d = 1000.0 + (i - 30) * (800.0 / 30.0)
            else:
                concept = "functions"
                true_d = 1400.0 + (i - 60) * (1000.0 / 40.0)
            est_d = true_d + random.uniform(-100.0, 100.0)
            questions.append(
                {"id": f"q_{i}", "concept": concept, "true_diff": round(true_d, 1), "est_diff": round(est_d, 1)}
            )

        bkt_params = BKTParameters(
            prior_learned=init_student_bkt, transition_learn=bkt_transition, guess=bkt_guess, slip=bkt_slip
        )

        # Multi-concept status tracking for batch simulation
        student_elo_dict = {"variables": init_student_elo, "loops": 1200.0, "functions": 1200.0}
        student_bkt_dict = {"variables": init_student_bkt, "loops": 0.15, "functions": 0.10}
        concept_started = {"variables": True, "loops": False, "functions": False}
        current_concept = "variables"

        bandit = LinUCB(context_dim=3, alpha=bandit_alpha)
        arms_states = {q["id"]: bandit.get_default_arm_state() for q in questions}
        records = []
        answered_qids = []

        for step in range(1, sim_steps + 1):
            # Tự động chuyển sang Concept mới khi làm chủ ở batch mode
            if current_concept == "variables" and student_bkt_dict["variables"] >= 0.85:
                current_concept = "loops"
                if not concept_started["loops"]:
                    concept_started["loops"] = True
                    student_elo_dict["loops"] = round(0.7 * student_elo_dict["variables"] + 0.3 * 1200.0, 2)
            elif current_concept == "loops" and student_bkt_dict["loops"] >= 0.85:
                current_concept = "functions"
                if not concept_started["functions"]:
                    concept_started["functions"] = True
                    student_elo_dict["functions"] = round(0.7 * student_elo_dict["loops"] + 0.3 * 1200.0, 2)

            concept = current_concept
            est_student_elo = student_elo_dict[concept]
            est_student_bkt = student_bkt_dict[concept]

            X = build_student_context(est_student_bkt, est_student_elo)

            # ZPD filter & Concept match
            candidate_ids = [
                q["id"]
                for q in questions
                if q["concept"] == concept
                and q["id"] not in answered_qids
                and abs(q["est_diff"] - est_student_elo) <= 250.0
            ]
            if not candidate_ids:
                remaining_qs = [q for q in questions if q["concept"] == concept and q["id"] not in answered_qids]
                if not remaining_qs:
                    remaining_qs = [q for q in questions if q["concept"] == concept]
                closest_qs = sorted(remaining_qs, key=lambda q: abs(q["est_diff"] - est_student_elo))[:3]
                candidate_ids = [q["id"] for q in closest_qs]

            selected_qid, expected_reward = bandit.select_arm(
                context_vector=X, arms_states=arms_states, candidate_arm_ids=candidate_ids
            )
            answered_qids.append(selected_qid)

            q_idx = int(selected_qid.split("_")[1])
            question = questions[q_idx]

            expected_success = calculate_expected_success(est_student_elo, question["est_diff"])
            true_success_prob = 1.0 / (1.0 + 10.0 ** ((question["true_diff"] - true_student_elo) / 400.0))
            is_correct = random.random() < true_success_prob
            actual_score = 1.0 if is_correct else 0.0

            old_student_elo = est_student_elo
            old_bkt = est_student_bkt
            old_q_elo = question["est_diff"]

            # Update BKT
            new_bkt = calculate_bkt_update(old_bkt, actual_score, bkt_params)
            student_bkt_dict[concept] = new_bkt

            # Backward BKT propagation in batch simulation with clamp protection
            if not is_correct:
                if concept == "loops":
                    student_bkt_dict["variables"] = round(max(0.0001, student_bkt_dict["variables"] - 0.05), 4)
                elif concept == "functions":
                    student_bkt_dict["loops"] = round(max(0.0001, student_bkt_dict["loops"] - 0.05), 4)
            else:
                if concept == "loops":
                    student_bkt_dict["variables"] = round(min(0.9999, student_bkt_dict["variables"] + 0.03), 4)
                elif concept == "functions":
                    student_bkt_dict["loops"] = round(min(0.9999, student_bkt_dict["loops"] + 0.03), 4)

            # Update Elo
            new_student_elo, new_q_elo = calculate_elo_updates(
                student_elo=old_student_elo, question_elo=old_q_elo, actual_score=actual_score, hint_count=0
            )
            student_elo_dict[concept] = new_student_elo
            question["est_diff"] = new_q_elo
            reward = calculate_bandit_reward(expected_success, actual_score)

            bandit.update_arm(arm_id=selected_qid, context_vector=X, reward=reward, arms_states=arms_states)

            records.append(
                {
                    "Step": step,
                    "Concept": concept,
                    "Question ID": selected_qid,
                    "True Diff": question["true_diff"],
                    "Old Est Diff": old_q_elo,
                    "New Est Diff": new_q_elo,
                    "Old Student Elo": old_student_elo,
                    "New Student Elo": new_student_elo,
                    "Old BKT Mastery": old_bkt,
                    "New BKT Mastery": new_bkt,
                    "Expected Success (P)": round(expected_success, 4),
                    "Outcome": "Correct" if is_correct else "Incorrect",
                    "Bandit Reward": reward,
                    "Delta Student Elo": round(new_student_elo - old_student_elo, 2),
                    "Delta BKT": round(new_bkt - old_bkt, 4),
                }
            )
        return pd.DataFrame(records), questions

    # Run simulation
    df_results, final_questions = run_simulation_engine()

    # Render Batch simulation metrics
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        last_concept = df_results.iloc[-1]["Concept"]
        last_elo = df_results.iloc[-1]["New Student Elo"]
        st.markdown(
            f"""
            <div class="metric-box">
                <div class="metric-val">{last_elo:.1f}</div>
                <div class="metric-lbl">Final Est Elo ({last_concept.upper()})</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with col2:
        final_bkt_prob = df_results.iloc[-1]["New BKT Mastery"]
        mastery_state = determine_mastery_state(final_bkt_prob).upper()
        st.markdown(
            f"""
            <div class="metric-box">
                <div class="metric-val">{final_bkt_prob:.4%}<span style="font-size:14px;color:#10b981;"> ({mastery_state})</span></div>
                <div class="metric-lbl">Final BKT Probability ({last_concept.upper()})</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with col3:
        correct_count = (df_results["Outcome"] == "Correct").sum()
        success_rate = correct_count / len(df_results)
        st.markdown(
            f"""
            <div class="metric-box">
                <div class="metric-val">{correct_count}/{len(df_results)} <span style="font-size:16px;color:#10b981;">({success_rate:.1%})</span></div>
                <div class="metric-lbl">Tỉ lệ trả lời đúng</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with col4:
        avg_reward = df_results["Bandit Reward"].mean()
        st.markdown(
            f"""
            <div class="metric-box">
                <div class="metric-val">{avg_reward:.3f}</div>
                <div class="metric-lbl">Điểm thưởng Bandit trung bình</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.markdown("<br>", unsafe_allow_html=True)

    # --- VISUALIZATION TABS ---
    tab1, tab2, tab3, tab4 = st.tabs(
        [
            "📈 Tiến trình Elo & BKT",
            "🎯 Hiệu chuẩn Độ khó Câu hỏi (Calibration)",
            "🎰 Phân tích LinUCB Recommendation",
            "📄 Chi tiết Lịch sử Giả lập (Logs)",
        ]
    )

    with tab1:
        col_chart1, col_chart2 = st.columns(2)
        with col_chart1:
            st.subheader("Sự hội tụ Elo học sinh")
            fig_elo = go.Figure()

            unique_concepts = df_results["Concept"].unique()
            for c in unique_concepts:
                c_df = df_results[df_results["Concept"] == c]
                fig_elo.add_trace(
                    go.Scatter(
                        x=list(c_df["Step"]),
                        y=list(c_df["New Student Elo"]),
                        mode="lines+markers",
                        name=f"Elo: {c.upper()}",
                    )
                )
            fig_elo.update_layout(
                xaxis_title="Simulation Step",
                yaxis_title="Elo Rating",
                template="plotly_dark",
                margin=dict(l=20, r=20, t=20, b=20),
                hovermode="x unified",
            )
            st.plotly_chart(fig_elo, use_container_width=True)

        with col_chart2:
            st.subheader("Cập nhật Xác suất Mastery BKT")
            fig_bkt = go.Figure()
            fig_bkt.add_trace(
                go.Scatter(
                    x=[0, len(df_results)],
                    y=[0.85, 0.85],
                    mode="lines",
                    name="Mastery Threshold (0.85)",
                    line=dict(color="#22c55e", width=1.5, dash="dash"),
                )
            )
            for c in unique_concepts:
                c_df = df_results[df_results["Concept"] == c]
                fig_bkt.add_trace(
                    go.Scatter(
                        x=list(c_df["Step"]),
                        y=list(c_df["New BKT Mastery"]),
                        mode="lines+markers",
                        name=f"BKT: {c.upper()}",
                    )
                )
            fig_bkt.update_layout(
                xaxis_title="Simulation Step",
                yaxis_title="Mastery Probability",
                yaxis=dict(range=[0, 1.05]),
                template="plotly_dark",
                margin=dict(l=20, r=20, t=20, b=20),
                hovermode="x unified",
            )
            st.plotly_chart(fig_bkt, use_container_width=True)

    with tab2:
        st.subheader("Cân chỉnh độ khó câu hỏi (Auto-calibration)")

        answered_unique_qids = df_results["Question ID"].unique().tolist()
        start_ests = {}
        for q in final_questions:
            start_ests[q["id"]] = q["est_diff"]

        for _, row in df_results.iloc[::-1].iterrows():
            qid = row["Question ID"]
            start_ests[qid] = row["Old Est Diff"]

        hist_diff = {qid: [start_ests[qid]] for qid in answered_unique_qids}
        curr_vals = start_ests.copy()

        for _, row in df_results.iterrows():
            qid = row["Question ID"]
            new_val = row["New Est Diff"]
            curr_vals[qid] = new_val
            for q_id in answered_unique_qids:
                hist_diff[q_id].append(curr_vals[q_id])

        fig_calib = go.Figure()
        colors = px.colors.qualitative.Plotly
        for idx, qid in enumerate(answered_unique_qids):
            true_val = [q["true_diff"] for q in final_questions if q["id"] == qid][0]
            fig_calib.add_trace(
                go.Scatter(
                    x=list(range(len(df_results) + 1)),
                    y=hist_diff[qid],
                    mode="lines",
                    name=f"{qid} (True Diff: {true_val:.0f})",
                    line=dict(color=colors[idx % len(colors)], width=2),
                )
            )
        fig_calib.update_layout(
            xaxis_title="Simulation Step",
            yaxis_title="Estimated Question Elo",
            template="plotly_dark",
            margin=dict(l=20, r=20, t=20, b=20),
            hovermode="x unified",
        )
        st.plotly_chart(fig_calib, use_container_width=True)

    with tab3:
        st.subheader("Thống kê số lần gợi ý câu hỏi")
        selection_counts = df_results["Question ID"].value_counts()
        df_bar = pd.DataFrame(
            {
                "Question ID": selection_counts.index,
                "Count": selection_counts.values,
                "True Difficulty": [
                    [q["true_diff"] for q in final_questions if q["id"] == qid][0] for qid in selection_counts.index
                ],
            }
        )
        fig_bar = px.bar(
            df_bar,
            x="Question ID",
            y="Count",
            color="True Difficulty",
            color_continuous_scale=px.colors.sequential.Teal,
            labels={"Count": "Số lần được chọn", "Question ID": "Mã Câu hỏi"},
            template="plotly_dark",
        )
        fig_bar.update_layout(margin=dict(l=20, r=20, t=20, b=20))
        st.plotly_chart(fig_bar, use_container_width=True)

    with tab4:
        df_display = df_results[
            [
                "Step",
                "Concept",
                "Question ID",
                "Old Student Elo",
                "New Student Elo",
                "Old BKT Mastery",
                "New BKT Mastery",
                "Expected Success (P)",
                "Outcome",
                "Bandit Reward",
            ]
        ].copy()

        def color_outcome(val):
            color = "#155724" if val == "Correct" else "#721c24"
            return f"background-color: {color}; color: white"

        try:
            styled_df = df_display.style.map(color_outcome, subset=["Outcome"])
            st.dataframe(styled_df, use_container_width=True, height=600)
        except Exception:
            st.dataframe(df_display, use_container_width=True, height=600)


# =========================================================================
# LUỒNG XỬ LÝ 3: TOÀN BỘ ĐỒ THỊ TRI THỨC (NATIVE GRAPHVIZ)
# =========================================================================
else:
    st.subheader("🗺️ Toàn bộ Sơ đồ Đồ thị Tri thức (Full Course Knowledge Graph)")
    st.markdown(
        "Sơ đồ dưới đây trực quan hóa mối quan hệ tiên quyết giữa **45 khái niệm** trong toàn bộ 24 ngày học. "
        "Biểu đồ được vẽ hoàn toàn bằng thư viện Graphviz tích hợp sẵn, hiển thị thứ tự học tập trực quan từ trái qua phải."
    )

    # Legend
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.markdown("<span style='color:#0ea5e9;'>■</span> **General AI Core** (Days 1–16)", unsafe_allow_html=True)
    with col2:
        st.markdown(
            "<span style='color:#f59e0b;'>■</span> **Track 1: Product & Business** (Days 17–24)", unsafe_allow_html=True
        )
    with col3:
        st.markdown(
            "<span style='color:#10b981;'>■</span> **Track 2: AI Data & Architecture** (Days 17–24)",
            unsafe_allow_html=True,
        )
    with col4:
        st.markdown(
            "<span style='color:#f43f5e;'>■</span> **Track 3: Advanced AI / Agents** (Days 17–24)",
            unsafe_allow_html=True,
        )

    st.markdown("---")

    # Render native Graphviz chart
    draw_full_knowledge_graph()
