# Architecture — System Overview

This document describes the high-level architecture of the VAIC Universal Starter.

```mermaid
graph TD
    subgraph Client ["Client Layer"]
        FE["Next.js SPA (Port 3000)"]
    end

    subgraph Backend ["FastAPI Backend Layer (Port 8000)"]
        API["FastAPI API Endpoints"]
        REG["Capability Registry"]
        MOD["Module Registry"]
        MGR["Run Manager"]
        STOR["Storage Service"]
    end

    subgraph FileStorage ["Data Directory"]
        UP["uploads/"]
        AR["artifacts/"]
        RU["runs/"]
    end

    FE -->|HTTP requests| API
    API --> REG
    API --> STOR
    REG --> MOD
    MOD -->|Loads Enabled Modules| STOR
    MGR --> STOR
    STOR --> FileStorage
```

## Description
- **Client Layer**: SPA frontend in Next.js. Provides a uniform workspace dashboard without hardcoded target assumptions.
- **FastAPI Backend Layer**: Provides dynamic routers mapping enabled modular capability registry schemas.
- **Data Directory**: Simple JSON metadata local filesystem store for uploads, run histories, and output artifacts.
