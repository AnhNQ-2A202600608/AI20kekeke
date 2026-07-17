# Challenge Adaptation Guide

This guide details how to ingest competition problems and initialize standalone challenge workspaces.

```mermaid
graph TD
    Intake["1. Write problem intake description JSON/YAML"]
    Init["2. Run init_challenge.py script"]
    Workspace["3. Generate challenges/slug/ workspace"]
    Config["4. Activate recommended modules"]
    Code["5. Custom code / integrate capability"]

    Intake --> Init
    Init --> Workspace
    Workspace --> Config
    Config --> Code
```

## How to Initialize Workspace
Prepare your challenge intake data:
```json
{
  "title": "Predictive Sales model",
  "description": "Model monthly sales volumes forecast. Uses pandas analysis.",
  "rubrics": { "r2_score": 100 },
  "data_sources": ["sales.csv"]
}
```
Trigger generator:
```bash
python scripts/init_challenge.py "Sales Forecast" problem.json
```
This generates configuration files under `challenges/sales-forecast/` ready for custom integration.
