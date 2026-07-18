import os
import sys

# Thêm thư mục gốc vào PYTHONPATH để import src
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.agents.graph import agent

def main():
    # 1. In sơ đồ ASCII ra terminal
    print("\n=== SƠ ĐỒ ĐỒ THỊ LANGGRAPH (ASCII) ===")
    try:
        agent.get_graph().print_ascii()
    except Exception as e:
        print(f"Không thể in ASCII: {e}")

    # 2. Sinh mã Mermaid và xuất sang tệp Markdown
    print("\n=== ĐANG XUẤT SƠ ĐỒ MERMAID ===")
    try:
        mermaid_code = agent.get_graph().draw_mermaid()
        
        # Thêm nhãn nhãn thân thiện hiển thị rõ vai trò các Node (bao gồm cả Reflection Agent)
        mermaid_code = mermaid_code.replace(
            "analyze(analyze)", 
            'analyze("1. Phân Tích (analyze)<br/>[Intent Router & RAG]")'
        )
        mermaid_code = mermaid_code.replace(
            "respond(respond)", 
            'respond("2. Gia Sư Socratic (respond)<br/>[Split Prompt Caching]")'
        )
        mermaid_code = mermaid_code.replace(
            "pedagogical_reflection(pedagogical_reflection)", 
            'pedagogical_reflection("3. Kiểm Định Sư Phạm (pedagogical_reflection)<br/>[Reflection Agent / Socratic Critic]")'
        )

        markdown_content = f"""# Sơ đồ Đồ thị LangGraph Agent

Dưới đây là sơ đồ Mermaid hiển thị các Node và các Edge điều kiện của Agent.

```mermaid
{mermaid_code}
```
"""
        os.makedirs("docs/diagram", exist_ok=True)
        md_path = "docs/diagram/langgraph_agent_diagram.md"
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(markdown_content)
        print(f"[OK] Đã lưu sơ đồ Mermaid sang: {md_path}")
    except Exception as e:
        print(f"Lỗi khi xuất sơ đồ Mermaid: {e}")

    # 3. Xuất file PNG bằng API LangGraph (nếu môi trường có hỗ trợ các thư viện đồ họa)
    print("\n=== ĐANG THỬ XUẤT ẢNH PNG ===")
    try:
        png_data = agent.get_graph().draw_mermaid_png()
        png_path = "docs/diagram/langgraph_agent.png"
        with open(png_path, "wb") as f:
            f.write(png_data)
        print(f"[OK] Đã xuất ảnh đồ thị thành công sang: {png_path}")
    except Exception as e:
        print(f"[LƯU Ý] Không thể xuất trực tiếp PNG: {e}")
        print("-> Bạn có thể copy mã Mermaid trong file .md để vẽ ảnh online tại: https://mermaid.live")

if __name__ == "__main__":
    main()
