# Module Development Guide

This guide describes how to add a new optional capability module to the backend.

## Step 1: Create Module Folder
Create a subdirectory under `backend/src/modules/` named after your module (e.g., `translation`).

## Step 2: Write Manifest
Create `module.json` defining metadata:
```json
{
  "id": "translation",
  "name": "Text Translation",
  "version": "0.1.0",
  "category": "transform",
  "enabled_by_default": false,
  "description": "Translates text using external helpers.",
  "dependencies": ["translate"],
  "environment_variables": [],
  "input_types": ["text"],
  "output_types": ["text"],
  "evaluation_metrics": [],
  "frontend_component": "DefaultForm",
  "backend_entrypoint": "src.modules.translation.capability.TranslationCapability",
  "limitations": "CPU execution."
}
```

## Step 3: Implement Capability Class
Create `capability.py` implementing `BaseCapability`:
```python
from src.capabilities.registry import BaseCapability, CapabilityResult

class TranslationCapability(BaseCapability):
    @property
    def id(self) -> str:
        return "translation"

    @property
    def name(self) -> str:
        return "translation"

    @property
    def description(self) -> str:
        return "Translates text."

    def execute(self, parameters, input_file_ids):
        # Your custom logic here
        return CapabilityResult(success=True, artifacts=[])
```

## Step 4: Enable Module
Run scripts to register it:
```bash
python scripts/enable_module.py translation
```
Verify via `python scripts/list_modules.py`.
