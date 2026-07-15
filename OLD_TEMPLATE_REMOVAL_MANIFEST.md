# OLD_TEMPLATE_REMOVAL_MANIFEST.md

> Date: 2026-07-15  
> Performed on branch: `universal-starter`

---

## Backup Information

| Item | Value |
|------|-------|
| Backup branch | `backup/old-agent-template` |
| Backup commit | `308a161` |
| Commit message | `chore: archive old agent-specific template` |
| Recovery command | `git checkout backup/old-agent-template` |

---

## Directories to Remove

| Directory | Reason |
|-----------|--------|
| `backend/` | AI Agent backend — LangGraph agent, stub LLM, CRM mock tools, tool registry |
| `docs/` | Agent-specific implementation plan and MVP scope documents |

---

## Files to Remove

| File | Category | Reason |
|------|----------|--------|
| `backend/pyproject.toml` | Config | Agent-specific Python project config |
| `backend/src/__init__.py` | Code | Agent backend package |
| `backend/src/core/__init__.py` | Code | Agent core package |
| `backend/src/core/config.py` | Code | Agent config with CRM-related settings |
| `backend/src/core/errors.py` | Code | Agent error types (ToolExecutionError, ProviderError) |
| `backend/src/core/logging.py` | Code | Agent logging setup |
| `backend/src/llm/__init__.py` | Code | Agent LLM package |
| `backend/src/llm/base.py` | Code | Agent LLM provider interface |
| `backend/src/llm/stub_provider.py` | Code | Agent stub LLM with CRM keyword matching |
| `backend/src/models/__init__.py` | Code | Agent models package |
| `backend/src/models/requests.py` | Code | Agent chat request model |
| `backend/src/models/responses.py` | Code | Agent response envelope |
| `backend/src/models/sources.py` | Code | Agent source reference tracking |
| `backend/src/tools/__init__.py` | Code | Agent tools package |
| `backend/src/tools/base.py` | Code | Agent tool base class |
| `backend/src/tools/mock_tools.py` | Code | CRM mock tools (search_records, get_record_details) |
| `backend/src/tools/registry.py` | Code | Agent tool registry |
| `backend/src/data/sample_records.json` | Data | CRM mock data (Vietnamese customer profiles) |
| `docs/implementation-plan.md` | Docs | Agent-specific implementation plan |
| `docs/architecture/mvp-scope.md` | Docs | Agent-specific MVP scope |
| `PROJECT_STATUS.md` | Docs | Agent template status document |
| `.env.example` | Config | Agent-specific env template |

---

## Files to Preserve

| File | Reason |
|------|--------|
| `.git/` | Git history — NEVER delete |
| `.gitignore` | Generic Python+Node gitignore — still applicable for universal starter |
| `OLD_TEMPLATE_REMOVAL_MANIFEST.md` | This document — recovery reference |

---

## Secret Scan Results

| Check | Result |
|-------|--------|
| `.env` file tracked | **NO** — no `.env` file exists |
| Real API keys in `.env.example` | **NO** — only placeholder values |
| Hardcoded secrets in source | **NO** — grep found zero matches |
| Tokens in docs | Only "SSE tokens" (not secrets) |

---

## Risks

| Risk | Mitigation |
|------|------------|
| Accidental loss of old code | Backup branch `backup/old-agent-template` preserves everything |
| Need to reference old architecture | `git diff universal-starter backup/old-agent-template` |

---

## Recovery Procedure

```bash
# View old template files
git checkout backup/old-agent-template

# Return to clean starter
git checkout universal-starter

# Cherry-pick a specific file from backup
git checkout backup/old-agent-template -- path/to/file

# Full restore (abandon universal-starter)
git checkout master
git branch -D universal-starter
```
