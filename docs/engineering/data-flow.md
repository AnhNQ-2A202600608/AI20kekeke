# Architecture — Run & Artifact Data Flow

This document details the data lifecycle from file uploads through capability execution to artifact generation.

```mermaid
graph LR
    User["User Interface"]
    Uploads["uploads/"]
    Runs["runs/"]
    Artifacts["artifacts/"]

    User -->|1. Upload File| Uploads
    Uploads -->|Returns file_id & checksum| User
    User -->|2. POST /runs (parameters + file_id)| Runs
    Runs -->|3. Run Service executes capability| Exec["BaseCapability.execute()"]
    Exec -->|4. Writes output files| Artifacts
    Artifacts -->|Returns artifact_ids & status completed| Runs
    Runs -->|5. Return completed meta| User
```

## Security Controls
- **SHA-256 Checksums**: Generated on all saved uploads and artifacts.
- **Path Traversal Guard**: Prevents reads or writes outside the workspace storage path.
- **Allowlist filter**: Blocks restricted file extensions.
