import subprocess
import json
import sys

def run_ntn(args, input_data=None):
    ntn_script = r"C:\Users\LENOVO\AppData\Local\pnpm\global\5\.pnpm\ntn@0.16.0\node_modules\ntn\bin\ntn"
    cmd = ["node", ntn_script] + args
    
    if input_data:
        json_str = json.dumps(input_data)
        cmd += ["--data", json_str]
        
    print(f"Running: {' '.join(cmd[:6])} ...")
    p = subprocess.run(
        cmd, 
        stdin=subprocess.DEVNULL, 
        capture_output=True, 
        text=True, 
        encoding='utf-8', 
        shell=False
    )
    return p.returncode, p.stdout, p.stderr

def main():
    page_id = "37bfecf3-5a15-8105-9ab3-c2db5b07c6e7"
    
    # 1. Tạo block báo cáo hoàn thành
    report_content = (
        "### 2026-06-10 — Completion Report\n"
        "- **Status:** Done\n"
        "- **Changed files:**\n"
        "  - `src/pipeline/__init__.py`: Package initialization.\n"
        "  - `src/pipeline/config.py`: Environment configuration and .env loading.\n"
        "  - `src/pipeline/ingest/lms_fetcher.py`: Firefox-emulated download logic.\n"
        "  - `src/pipeline/transform/doc_converter.py`: PDF-to-Markdown extraction with Gemini API OCR & pypdf local fallback.\n"
        "  - `src/pipeline/lms_slide_pipeline.py`: Main workflow coordinator supporting both direct and viewer URLs.\n"
        "  - `src/pipeline/README.md`: User documentation.\n"
        "  - `src/pipeline/.env.example`: Env configuration template.\n"
        "- **What changed:** Built and refactored a modular ingestion and transformation pipeline inside src/pipeline/. Implemented Firefox emulated downloader to bypass anti-bot, Gemini Flash 2.5 API for high quality markdown conversion, and pypdf local parser as a reliable fallback. Output files are neatly organized inside src/pipeline/data/.\n"
        "- **Verification:** Ran test command using `uv run` and confirmed successful downloads and PDF-to-Markdown local extraction.\n"
        "- **Follow-up:** Check and replace token key once expired."
    )
    
    patch_blocks_payload = {
        "children": [
            {
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {
                                "content": report_content
                            }
                        }
                    ]
                }
            }
        ]
    }
    
    print("[*] Đang ghi báo cáo hoàn thành lên body của Notion Page...")
    code, out, err = run_ntn(["api", f"v1/blocks/{page_id}/children", "-X", "PATCH"], patch_blocks_payload)
    if code != 0:
        print(f"Failed to append report blocks: {err}")
        sys.exit(1)
        
    print("[+] Báo cáo hoàn thành được ghi nhận thành công.")
    
    # 2. Cập nhật trạng thái thành Hoàn thành
    update_properties_payload = {
        "properties": {
            "Trạng thái": {
                "select": {
                    "name": "Hoàn thành"
                }
            }
        }
    }
    
    print("[*] Đang cập nhật trạng thái nhiệm vụ thành 'Hoàn thành'...")
    code, out, err = run_ntn(["api", f"v1/pages/{page_id}", "-X", "PATCH"], update_properties_payload)
    if code != 0:
        print(f"Failed to update page properties: {err}")
        sys.exit(1)
        
    print("[+] Trạng thái nhiệm vụ được cập nhật thành 'Hoàn thành'!")

if __name__ == "__main__":
    main()
