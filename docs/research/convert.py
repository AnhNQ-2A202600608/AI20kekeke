import os
import re


def escape_latex_special_chars(text):
    placeholders = {}

    def make_placeholder(content, block_type):
        idx = len(placeholders)
        key = f"LATEXPLACEHOLDER{block_type}INDEX{idx}"
        placeholders[key] = content
        return key

    # 1. Hide listings
    def hide_listings(match):
        return make_placeholder(match.group(0), "LISTING")

    text = re.sub(r"\\begin\{lstlisting\}(?:\[.*?\])?.*?\\end\{lstlisting\}", hide_listings, text, flags=re.DOTALL)

    # 2. Hide tables
    def hide_tables(match):
        return make_placeholder(match.group(0), "TABLE")

    text = re.sub(r"\\begin\{table\}(?:\[.*?\])?.*?\\end\{table\}", hide_tables, text, flags=re.DOTALL)

    # 3. Hide display math
    def hide_display_math(match):
        return make_placeholder(match.group(0), "DISPLAYMATH")

    text = re.sub(r"\\\[.*?\\\]", hide_display_math, text, flags=re.DOTALL)
    text = re.sub(r"\$\$.*?\$\$", hide_display_math, text, flags=re.DOTALL)

    # 4. Hide inline math
    def hide_inline_math(match):
        return make_placeholder(match.group(0), "INLINEMATH")

    text = re.sub(r"(?<!\\)\$.*?(?<!\\)\$", hide_inline_math, text)

    # Perform escapes on the remaining text:
    # Escape % (percent signs not already escaped)
    text = re.sub(r"(?<!\\)%", lambda m: r"\%", text)

    # Escape _ (underscores not already escaped)
    text = re.sub(r"(?<!\\)_", lambda m: r"\_", text)

    # Escape & (ampersands not already escaped)
    text = re.sub(r"(?<!\\)&", lambda m: r"\&", text)

    # Restore the placeholders in reverse order
    for key, val in list(placeholders.items())[::-1]:
        text = text.replace(key, val)

    return text


def convert_md_to_latex(md_content):
    # 1. Clean up windows newlines
    md_content = md_content.replace("\r\n", "\n")

    # 2. Extract title & Abstract
    title_match = re.search(r"^#\s+(.+)$", md_content, re.MULTILINE)
    title = title_match.group(1) if title_match else "Mentora Research Paper"

    abstract_match = re.search(r"### Abstract\n(.*?)\n---", md_content, re.DOTALL)
    abstract = abstract_match.group(1).strip() if abstract_match else ""

    # Remove title, abstract and preamble from body parsing
    body_content = md_content
    if title_match:
        body_content = body_content.replace(title_match.group(0), "")
    if abstract_match:
        body_content = body_content.replace(abstract_match.group(0), "")
    body_content = re.sub(r"^.*?---\n", "", body_content, flags=re.DOTALL)  # remove metadata
    body_content = re.sub(r"## References.*$", "", body_content, flags=re.DOTALL)  # remove manual references list

    # 3. Parse headers & Strip section numbers
    def replace_headers(match):
        level = len(match.group(1))
        title = match.group(2).strip()
        title = re.sub(r"^\d+(\.\d+)*\.?\s*", "", title)
        if level == 2:
            return f"\\section{{{title}}}"
        elif level == 3:
            return f"\\subsection{{{title}}}"
        elif level == 4:
            return f"\\subsubsection{{{title}}}"
        return match.group(0)

    body_content = re.sub(r"^(#{2,4})\s+(.+)$", replace_headers, body_content, flags=re.MULTILINE)

    # Remove horizontal rules
    body_content = re.sub(r"^\s*---\s*$", "", body_content, flags=re.MULTILINE)

    # 4. Convert lists (Run this first to avoid bullet '*' interfering with italics '*')
    lines = body_content.split("\n")
    in_bullet_list = False
    in_num_list = False
    new_lines = []

    for line in lines:
        stripped = line.strip()
        # Bullet list item
        if stripped.startswith("- ") or stripped.startswith("* "):
            if not in_bullet_list:
                if in_num_list:
                    new_lines.append("\\end{enumerate}")
                    in_num_list = False
                new_lines.append("\\begin{itemize}")
                in_bullet_list = True
            content = stripped[2:]
            new_lines.append(f"    \\item {content}")
        # Numbered list item
        elif re.match(r"^\d+\.\s+", stripped):
            if not in_num_list:
                if in_bullet_list:
                    new_lines.append("\\end{itemize}")
                    in_bullet_list = False
                new_lines.append("\\begin{enumerate}")
                in_num_list = True
            content = re.sub(r"^\d+\.\s+", "", stripped)
            new_lines.append(f"    \\item {content}")
        else:
            if in_bullet_list and stripped == "":
                new_lines.append("\\end{itemize}")
                in_bullet_list = False
            elif in_num_list and stripped == "":
                new_lines.append("\\end{enumerate}")
                in_num_list = False
            new_lines.append(line)

    if in_bullet_list:
        new_lines.append("\\end{itemize}")
    if in_num_list:
        new_lines.append("\\end{enumerate}")

    body_content = "\n".join(new_lines)

    # 5. Convert bold and italics
    body_content = re.sub(r"\*\*([^\*\n]+)\*\*", r"\\textbf{\1}", body_content)
    body_content = re.sub(r"\*([^\*\n]+)\*", r"\\textit{\1}", body_content)
    body_content = re.sub(r"`([^`\n]+)`", r"\\texttt{\1}", body_content)

    # 6. Handle citations: convert [1], [2] to \cite{...} or keep as-is if using standard cite
    citation_map = {
        "[1]": "\\cite{corbett1994knowledge}",
        "[2]": "\\cite{pelanek2016applications}",
        "[3]": "\\cite{li2010contextual}",
        "[4]": "\\cite{clement2015multi}",
        "[5]": "\\cite{richardson2018microservices}",
        "[6]": "\\cite{kleppmann2017designing}",
        "[7]": "\\cite{wozniak1994optimization}",
    }
    for key, val in citation_map.items():
        body_content = body_content.replace(key, val)

    # 7. Convert math display blocks (replace $$...$$ with \[...\])
    body_content = re.sub(r"\$\$(.*?)\$\$", r"\\[\1\\]", body_content, flags=re.DOTALL)

    # 8. Convert SQL/python code blocks to listings
    def replace_code_block(match):
        lang = match.group(1) or "Python"
        code = match.group(2).strip()
        return f"\\begin{{lstlisting}}[language={lang.upper()}]\n{code}\n\\end{{lstlisting}}"

    body_content = re.sub(r"```(\w+)?\n(.*?)\n```", replace_code_block, body_content, flags=re.DOTALL)

    # 9. Convert tables
    # Find tables in body
    def replace_markdown_table(match):
        table_text = match.group(0)
        rows = [r.strip() for r in table_text.strip().split("\n")]
        if len(rows) < 2:
            return table_text

        # Parse headers
        headers = [c.strip() for c in rows[0].split("|")[1:-1]]
        headers = [h.replace("%", "\\%").replace("_", "\\_") for h in headers]
        # Determine number of columns
        num_cols = len(headers)
        col_spec = "l" * num_cols

        latex_table = []
        latex_table.append("\\begin{table}[h]")
        latex_table.append("\\centering")
        latex_table.append(f"\\begin{{tabular}}{{{col_spec}}}")
        latex_table.append("\\toprule")
        latex_table.append(" & ".join([f"\\textbf{{{h}}}" for h in headers]) + " \\\\")
        latex_table.append("\\midrule")

        for r in rows[2:]:
            cells = [c.strip() for c in r.split("|")[1:-1]]
            cells = [c.replace("%", "\\%").replace("_", "\\_") for c in cells]
            if cells:
                latex_table.append(" & ".join(cells) + " \\\\")

        latex_table.append("\\bottomrule")
        latex_table.append("\\end{tabular}")
        latex_table.append("\\caption{Experimental Results}")
        latex_table.append("\\end{table}")

        return "\n".join(latex_table)

    table_pattern = r"((?:\|[^\n]*\|\n)+)"
    body_content = re.sub(table_pattern, replace_markdown_table, body_content)

    # 10. Escapes for LaTeX (escape %, _, & outside of tables/code/math)
    body_content = escape_latex_special_chars(body_content)
    if abstract:
        abstract = escape_latex_special_chars(abstract)
    if title:
        title = escape_latex_special_chars(title)

    # Clean up double escapes in latex commands we generated
    body_content = body_content.replace("\\\\section", "\\section")
    body_content = body_content.replace("\\\\subsection", "\\subsection")
    body_content = body_content.replace("\\\\subsubsection", "\\subsubsection")
    body_content = body_content.replace("\\\\textbf", "\\textbf")
    body_content = body_content.replace("\\\\textit", "\\textit")
    body_content = body_content.replace("\\\\texttt", "\\texttt")
    body_content = body_content.replace("\\\\[", "\\[")
    body_content = body_content.replace("\\\\]", "\\]")
    body_content = body_content.replace("\\\\item", "\\item")
    body_content = body_content.replace("\\\\begin", "\\begin")
    body_content = body_content.replace("\\\\end", "\\end")

    return title, abstract, body_content


def build_latex_file():
    md_path = "docs/research/adaptive-learning-engine-paper.md"
    tex_path = "docs/research/paper/main.tex"

    if not os.path.exists(md_path):
        print(f"Error: Markdown file {md_path} not found.")
        return

    with open(md_path, encoding="utf-8") as f:
        md_content = f.read()

    title, abstract, body = convert_md_to_latex(md_content)

    latex_template = f"""\\documentclass{{article}}

\\usepackage[nonatbib, final]{{neurips}}
\\usepackage[numbers]{{natbib}}

\\makeatletter
\\renewcommand{{\\@noticestring}}{{
  \\centering
  Mentora Technical Report --- AI20K Build Cohort 2
}}
\\makeatother

\\input{{extra_pkgs}}

\\usepackage{{physics}}
\\usepackage{{mathtools}}
\\usepackage{{amsfonts}}
\\usepackage{{amssymb}}
\\usepackage{{booktabs}}
\\usepackage{{listings}}
\\usepackage{{microtype}}

\\DeclarePairedDelimiter\\p{{(}}{{)}}
\\DeclarePairedDelimiter\\n{{|}}{{|}}
\\DeclarePairedDelimiter\\B{{[}}{{]}}

\\title{{{title}}}

\\author{{
  Ho Tat Bao Hoang \\\\
  Department of Educational Technology \\\\
  Mentora Project \\\\
  \\texttt{{hoangblue.work@gmail.com}}
}}

\\begin{{document}}

\\maketitle

\\begin{{abstract}}
{abstract}
\\end{{abstract}}

{body}

\\bibliographystyle{{plainnat}}
\\bibliography{{../references}}

\\end{{document}}
"""
    # Fix nested escapes that convert_md_to_latex might have introduced
    latex_template = latex_template.replace("Supabase DB Transaction", "Supabase DB Transaction")

    # Save the file
    with open(tex_path, "w", encoding="utf-8") as f:
        f.write(latex_template)
    print(f"Successfully compiled {md_path} to {tex_path}")


if __name__ == "__main__":
    build_latex_file()
