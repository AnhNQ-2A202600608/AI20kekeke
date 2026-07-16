# Architecture — Deployment Guide

This document describes local, docker-compose, and sandbox deployment options.

```mermaid
graph TD
    subgraph LocalHost ["Local Machine Setup"]
        Uvicorn["Uvicorn Server (Port 8000)"]
        NextJS["NextJS Client (Port 3000)"]
        LocalFS["Local Filesystem Folder (./data)"]
    end

    subgraph DockerSetup ["Docker Container Setup"]
        Compose["docker-compose.yml"]
        Backend["vaic-backend Container (Port 8000)"]
        Frontend["vaic-frontend Container (Port 3000)"]
        Volume["backend-data Persistent Volume"]
    end

    Uvicorn --> LocalFS
    NextJS --> Uvicorn

    Compose --> Backend
    Compose --> Frontend
    Backend --> Volume
    Frontend --> Backend
```

## Setup Guidelines
- Local runs default to `./data/` directories.
- Docker builds configure health checks between containers to ensure FastAPI is fully online before Next.js routes API calls.

## CI/CD and Production Deployment
For production, the project is configured with GitHub Actions to automate deployments:
- **Backend (FastAPI)**: Deployed to [Render](https://render.com) using its Web Service via Docker.
- **Frontend (Next.js)**: Deployed to [Vercel](https://vercel.com) using the Vercel CLI.

Please refer to the detailed [Production Deployment Guide (Vietnamese)](../deployment_guide.md) for step-by-step configuration of accounts, deploy hooks, and GitHub Secrets.

