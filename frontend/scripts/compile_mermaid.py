import base64
import hashlib
import json
import os
import re
import urllib.error
import urllib.request
import zlib


def generate_mermaid_url(mermaid_code):
    state = {"code": mermaid_code, "mermaid": {"theme": "default"}}
    json_str = json.dumps(state)
    json_bytes = json_str.encode("utf-8")

    # Compress using zlib (wbits=15)
    compressor = zlib.compressobj(9, zlib.DEFLATED, 15, 8, zlib.Z_DEFAULT_STRATEGY)
    compressed = compressor.compress(json_bytes) + compressor.flush()

    # Base64 encode and make URL-safe
    encoded = base64.urlsafe_b64encode(compressed).decode("ascii").rstrip("=")

    return f"https://mermaid.ink/svg/pako:{encoded}"


def compile_mermaid():
    workspace_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    docs_dir = os.path.join(workspace_dir, "content", "docs")
    public_img_dir = os.path.join(workspace_dir, "public", "docs", "images")

    os.makedirs(public_img_dir, exist_ok=True)

    # Regex to match ```mermaid ... ```
    mermaid_pattern = re.compile(r"```mermaid\s*\n(.*?)\n```", re.DOTALL)

    print(f"Scanning MDX files in: {docs_dir}")
    print(f"SVGs will be saved to: {public_img_dir}")

    for root, _, files in os.walk(docs_dir):
        for file in files:
            if file.endswith(".mdx"):
                file_path = os.path.join(root, file)
                with open(file_path, encoding="utf-8") as f:
                    content = f.read()

                matches = list(mermaid_pattern.finditer(content))
                if not matches:
                    continue

                print(f"\nProcessing {file} ({len(matches)} diagrams found)...")
                new_content = content
                offset = 0
                modified = False

                for match in matches:
                    diagram_code = match.group(1).strip()

                    # Compute md5 of code to name the file uniquely
                    code_hash = hashlib.md5(diagram_code.encode("utf-8")).hexdigest()
                    svg_filename = f"mermaid-{code_hash}.svg"
                    svg_path = os.path.join(public_img_dir, svg_filename)

                    # Fetch SVG if not already cached
                    fetch_success = True
                    if not os.path.exists(svg_path):
                        print(f"  Fetching SVG from mermaid.ink for diagram: {code_hash[:8]}...")
                        url = generate_mermaid_url(diagram_code)
                        try:
                            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
                            with urllib.request.urlopen(req, timeout=20) as response:
                                svg_data = response.read()
                            with open(svg_path, "wb") as svg_file:
                                svg_file.write(svg_data)
                            print(f"    Saved SVG to {svg_filename}")
                        except Exception as e:
                            print(f"    Error fetching SVG: {e}")
                            fetch_success = False
                    else:
                        print(f"  Found cached SVG: {svg_filename}")

                    if fetch_success:
                        # Replace codeblock with markdown image
                        markdown_image = f"![Mermaid Diagram](/docs/images/{svg_filename})"

                        # Calculate new match positions with offset
                        start = match.start() + offset
                        end = match.end() + offset

                        new_content = new_content[:start] + markdown_image + new_content[end:]
                        offset += len(markdown_image) - (end - start)
                        modified = True

                if modified:
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    print(f"Updated file: {file_path}")


if __name__ == "__main__":
    compile_mermaid()
