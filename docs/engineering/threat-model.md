# Architecture — Threat Model & Security Controls

This document maps potential competition environment threats to active mitigation controls implemented in the template.

## Identified Threats & Mitigations

### 1. Path Traversal Attacks
- **Threat**: Uploaded files or run parameter inputs contain paths like `../../` to access system credentials.
- **Mitigation**: Every file read/write is guarded by `_assert_safe_path` checking resolved paths are within boundaries of the uploads/runs/artifacts root directories.

### 2. Malicious File Uploads
- **Threat**: Uploading arbitrary executable files (`.exe`, `.sh`) into host sandbox environments.
- **Mitigation**: File allowlist restrictions block extensions not in `ALLOWED_EXTENSIONS` (e.g. `.csv`, `.json`, `.txt`, `.pdf`, `.png`, `.jpg`, `.md`).

### 3. Log Credentials Leakage
- **Threat**: API keys, Bearer tokens, or passwords leak in logging output.
- **Mitigation**: Custom `SecretRedactingFilter` in logging setup scans message strings and automatically redacts common key patterns with `[REDACTED]`.

### 4. Stack Trace Exposure
- **Threat**: FastAPI uncaught exceptions expose sensitive directory structures or environment vars in raw API responses.
- **Mitigation**: Global FastAPI exception middleware returns clean envelope errors without raw python tracebacks.
