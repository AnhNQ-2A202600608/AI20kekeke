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
    backlog_ds_id = "37afecf3-5a15-81fd-8345-000b717c2033"
    
    task_payload = {
        "parent": {
            "data_source_id": backlog_ds_id
        },
        "properties": {
            "Mã việc": {
                "title": [
                    {
                        "text": {
                            "content": "DATA-CRAWL-SLIDES-TO-PDF-DAILY"
                        }
                    }
                ]
            },
            "Tên công việc": {
                "rich_text": [
                    {
                        "text": {
                            "content": "Tự động hóa cào slides LMS sang PDF và lưu theo thư mục ngày"
                        }
                    }
                ]
            },
            "Area": {
                "select": {
                    "name": "Data"
                }
            },
            "Type": {
                "select": {
                    "name": "Feature"
                }
            },
            "Trạng thái": {
                "select": {
                    "name": "Chưa làm"
                }
            },
            "Ưu tiên": {
                "select": {
                    "name": "P1"
                }
            },
            "Assignee": {
                "select": {
                    "name": "Nguyễn Vũ Trọng"
                }
            },
            "Mô tả chi tiết": {
                "rich_text": [
                    {
                        "text": {
                            "content": "Tự động hóa tải slide PDF từ VinUni LMS, giải mã JWT token url, lưu vào folder downloads/YYYY-MM-DD/ và vượt qua anti-bot bằng giả lập Firefox."
                        }
                    }
                ]
            }
        },
        "children": [
            {
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {
                                "content": "## Context\nGoal: Tải và lưu trữ các slides PDF từ VinUni LMS hàng ngày.\nScope: Tạo script Python crawl_slides.py phân tách link viewer, vượt anti-bot và lưu theo thư mục ngày.\n\n## Acceptance Criteria\n- [ ] Trích xuất được link PDF gốc từ URL Viewer (giải mã tham số query 'file').\n- [ ] Tải được PDF thành công với Header giả lập Firefox để vượt anti-bot.\n- [ ] Tự động tạo thư mục dạng `downloads/YYYY-MM-DD/` và lưu file PDF vào thư mục đó.\n- [ ] File PDF tải về không bị lỗi hay hỏng.\n\n## Implementation Report\n_To be appended by AI when done._"
                            }
                        }
                    ]
                }
            }
        ]
    }
    
    code, out, err = run_ntn(["api", "v1/pages", "-X", "POST"], task_payload)
    print(f"Status Code: {code}")
    if code != 0:
        print(f"Stdout:\n{out}")
        print(f"Stderr:\n{err}")
        sys.exit(1)
        
    data = json.loads(out)
    print(f"Successfully created Backlog Task Page! Page ID: {data.get('id')}")

if __name__ == "__main__":
    main()
