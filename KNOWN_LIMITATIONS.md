# Known Limitations — VAIC Universal Starter

This document lists the technical limitations of the current starter template version. Teams should evaluate these limitations when designing high-throughput production solutions.

---

## 1. Synchronous Execution Flow
- **Description**: Capability runs are triggered synchronously inside the FastAPI request loop thread.
- **Impact**: Heavy capabilities (e.g. running object detection model inference on thousands of video files) will block the worker process.
- **Workaround**: For complex runs, teams should introduce an asynchronous task queue (e.g., Celery, RQ) backed by Redis.

## 2. SQLite / Local File Storage
- **Description**: Storage metadata is written as local JSON files, and inputs are saved on the filesystem.
- **Impact**: Not suitable for multi-node deployments where storage is not shared.
- **Workaround**: Deploy behind shared storage volumes (NFS, AWS EFS) or map state storage layers to SQL databases (PostgreSQL) or object stores (S3).

## 3. Standard Allowlist File Exclusions
- **Description**: The security filter only permits extensions defined in `ALLOWED_EXTENSIONS`.
- **Impact**: Files with special formats will fail uploads.
- **Workaround**: Modify the allowlist set in `backend/src/storage/local.py` if new data types are required.

## 4. Port Conflicts
- **Description**: Standard configurations expose ports `8000` (backend) and `3000` (frontend).
- **Impact**: Out-of-the-box uvicorn or next dev servers might fail to start if other applications bind these ports.
- **Workaround**: Update ports mapping inside `docker-compose.yml` or change port arguments when launching.
