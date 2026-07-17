# Phase 4: LaTeX Compilation & Formatting

## Context Links
- Critique: [gpt-report.md](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/gpt-report.md#L384-L394)
- Converter: [convert.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/docs/research/convert.py)
- Main LaTeX: [main.tex](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/docs/research/paper/main.tex)

## Overview
- **Priority**: Medium
- **Current Status**: Todo
- This phase resolves final formatting issues in the LaTeX conversion process (such as list structure glitches and double list wraps) and runs the compilation script to generate the final camera-ready PDF.

## Key Insights
- **Lists in LaTeX**: The markdown lists sometimes convert to nested double list blocks (e.g. `\begin{itemize}` nested inside `\begin{enumerate}` due to parser issues).
- **Page Numbers**: For NeurIPS final version, we should ensure the `final` option is passed, and if needed, explain that page numbers are standard in submission mode.
- **ASCII Diagram**: The diagram must render correctly in the listings block using standard ASCII characters (`|`, `v`) now that the Unicode box drawing characters have been replaced.

## Requirements
- Fix the double list nesting bug in `convert.py`.
- Fix the ASCII diagram lines in `main.tex`.
- Run `compile_paper.py` through TinyTeX to resolve citations and compile the final PDF at `docs/research/paper.pdf`.

## Related Code Files
- [convert.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/docs/research/convert.py) [MODIFY]
- [compile_paper.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/docs/research/compile_paper.py) [MODIFY]

## Implementation Steps
1. Edit `convert.py` to refine list parsing regex and prevent duplicate lists from being generated when converting Markdown to LaTeX.
2. Edit `compile_paper.py` to ensure it prints clean status outputs (flushing stdout) and runs non-interactively.
3. Run the conversion script `convert.py` to generate `main.tex`.
4. Compile the PDF using `compile_paper.py`.
5. Verify the references section in the compiled PDF does not contain `[? ]` placeholders and has 7 clean entries.

## Todo List
- [ ] Refine list translation in `convert.py`.
- [ ] Run conversion and inspect generated `main.tex`.
- [ ] Run TinyTeX compilation script.
- [ ] Verify PDF presentation and reference citations.

## Success Criteria
- PDF successfully compiled and copied to `docs/research/paper.pdf`.
- No nested list compilation errors.
- Visual QA verifies that the diagram, code blocks, and bibliography render correctly and cleanly.

## Risk Assessment
- LaTeX compiler package conflicts. *Mitigation*: Rely on the clean TinyTeX variation pre-installed.
