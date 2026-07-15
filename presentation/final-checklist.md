# Pre-Flight Presentation Checklist

Complete this checklist 15 minutes before the pitch session.

## Environment Checks
- [ ] No API keys or passwords are hardcoded in the codebase.
- [ ] `.env` and `frontend/.env.local` are set up.
- [ ] `docker-compose down` followed by `make clean` is executed to start with a clean data state.

## Core System Checks
- [ ] `make test` runs and all 36 test cases pass.
- [ ] `make dev-backend` and `make dev-frontend` boot without errors.
- [ ] Uploading a file in the Workspace tab works.
- [ ] Executing the core capability runs and renders artifacts correctly.

## Contingency Checks
- [ ] Local screenshots of the Workspace UI are saved locally.
- [ ] Offline demo loop script works.
- [ ] Project packaged zip submission file is ready:
  ```bash
  make package
  ```
