# /// script
# dependencies = [
#     "pytinytex",
# ]
# ///

import os
import shutil
import subprocess
import sys
from pathlib import Path


def compile_paper():
    import pytinytex

    paper_dir = Path("docs/research/paper")
    tex_file = paper_dir / "main.tex"
    pdf_file = paper_dir / "main.pdf"
    target_pdf = Path("docs/research/paper.pdf")

    if not tex_file.exists():
        print(f"Error: {tex_file} does not exist.")
        sys.exit(1)

    # Check if pdflatex is available or TinyTeX doctor passes
    has_latex = shutil.which("pdflatex") is not None

    if not has_latex:
        print("LaTeX compiler not found in PATH. Checking TinyTeX...")
        try:
            # We can download TinyTeX if needed
            print("Downloading TinyTeX (this might take a moment)...")
            pytinytex.download_tinytex(variation=2)
        except Exception as e:
            print(f"Failed to download TinyTeX: {e}")
            sys.exit(1)

    print("Compiling LaTeX to PDF with auto-installation of missing packages...")
    try:
        # We run it in the target directory to ensure relative files (like references.bib, neurips.sty, extra_pkgs.tex) are found
        # Note: references.bib is in docs/research/references.bib
        # neurips.sty is in docs/research/paper/neurips.sty
        # extra_pkgs.tex is in docs/research/paper/extra_pkgs.tex
        # Let's change CWD to docs/research/paper for the compilation
        original_cwd = os.getcwd()
        os.chdir(str(paper_dir))

        # Pass 1: Compile once to generate main.aux
        print("Pass 1: Running pdflatex...")
        result = pytinytex.compile("main.tex", auto_install=True)

        if result.success:
            # Run BibTeX to generate main.bbl
            print("Running BibTeX...")
            bin_dir = pytinytex.get_tinytex_path()
            bibtex_exe = os.path.join(bin_dir, "bibtex.exe" if sys.platform == "win32" else "bibtex")

            bib_res = subprocess.run([bibtex_exe, "main"], capture_output=True, text=True)
            if bib_res.returncode != 0:
                print("BibTeX failed:")
                print(bib_res.stderr)

            # Pass 2 & 3: Compile twice more to resolve citations and references
            print("Pass 2 & 3: Resolving citations...")
            result = pytinytex.compile("main.tex", num_runs=2)

        os.chdir(original_cwd)

        if result.success:
            print("LaTeX compilation succeeded!")
            # Copy PDF to target location
            if pdf_file.exists():
                shutil.copy(pdf_file, target_pdf)
                print(f"Successfully generated PDF at: {target_pdf.resolve()}")
            else:
                print(f"Warning: Compilation claimed success but {pdf_file} was not found.")
        else:
            print("LaTeX compilation failed.")
            if hasattr(result, "errors"):
                for error in result.errors:
                    print(f"Error at line {error.line}: {error.message}")
            sys.exit(1)

    except Exception as e:
        print(f"An error occurred during compilation: {e}")
        sys.exit(1)


if __name__ == "__main__":
    compile_paper()
