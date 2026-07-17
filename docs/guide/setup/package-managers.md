# Package Managers & Setup Guide (uv & pnpm)

This guide documents the setup and usage of package managers in the EduGap codebase.

## Backend (Python): `uv`

This project uses **`uv`** by Astral for backend package and environment management.

### Key Commands
*   **Run Dev Server:** `uv run uvicorn src.main:app --reload --port 8000`
*   **Format & Lint:** `uv run ruff format` and `uv run ruff check --fix`
*   **Run Tests:** `uv run pytest`
*   **Install Dependencies:** `uv pip install -r requirements.txt` (or edit `pyproject.toml` and lock: `uv lock`)

### How to Install `uv` (if not installed)
*   **Windows (PowerShell):**
    ```powershell
    powershell -ExecutionPolicy Bypass -c "irm https://astral.sh/uv/install.ps1 | iex"
    ```
*   **macOS / Linux:**
    ```bash
    curl -LsSf https://astral.sh/uv/install.sh | sh
    ```

---

## Frontend (Next.js): `pnpm`

This project uses **`pnpm`** as the package manager for the frontend.

### Key Commands
*   **Run Dev Server:** Navigate to `frontend/` and run `pnpm dev`
*   **Build Project:** `pnpm build`
*   **Install Dependencies:** `pnpm install`

### How to Install `pnpm` (if not installed)
*   **Via npm (Node.js required):**
    ```bash
    npm install -g pnpm
    ```
*   **Windows (PowerShell, standalone):**
    ```powershell
    iwr https://get.pnpm.io/install.ps1 -useb | iex
    ```
*   **macOS / Linux (standalone):**
    ```bash
    curl -fsSL https://get.pnpm.io/install.sh | sh -
    ```
