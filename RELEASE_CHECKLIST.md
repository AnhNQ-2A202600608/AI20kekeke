# Release Checklist — VAIC Universal Starter

Follow this checklist prior to packaging a release zip/tarball of the template.

---

## 1. Clean Environment State
- [ ] Spin down docker services:
  ```bash
  make docker-down
  ```
- [ ] Clean temporary files, logs, pycaches, and cached databases:
  ```bash
  make clean
  ```
- [ ] Confirm no `.env` or `frontend/.env.local` files containing secret credentials are present.

## 2. Testing & Quality Checks
- [ ] Check code formatting and syntax lints:
  ```bash
  make lint
  ```
- [ ] Validate optional modules configurations list:
  ```bash
  make validate
  ```
- [ ] Execute pytest testing suites:
  ```bash
  make test
  ```
- [ ] Confirm smoke test runs cleanly:
  ```bash
  make smoke
  ```

## 3. Package Verification
- [ ] Confirm that `vaic-starter-submission.tar.gz` can be compiled using:
  ```bash
  make package
  ```
- [ ] Decompress the package in a clean folder and check that both backend and frontend boot out of the box.
