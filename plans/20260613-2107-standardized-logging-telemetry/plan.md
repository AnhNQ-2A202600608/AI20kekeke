# Plan: Standardized Logging & Telemetry System

This plan outlines the design and implementation steps for building a unified, 3-tier logging and telemetry service validated with Pydantic/JSON Schema to ensure schema consistency and prevent dashboard build failures.

## Context & Requirements

1.  **3-Tier Logging Structure**:
    *   **Tier 1: Required**: `ts` (ISO 8601), `level` (INFO/WARN/ERROR), `correlation_id` (request trace ID), `service_name`, and `event_type`.
    *   **Tier 2: Context**: `user_id` (hashed), `session_id`, `feature`, `model`, and `env`.
    *   **Tier 3: Payload (Event-specific)**: `latency_ms`, `tokens_in`, `tokens_out`, `cost_usd`, `error_type`, `tool_name`, etc.
2.  **Schema Validation**:
    *   Implement Pydantic models to validate log structures before emitting them.
    *   Ensure all service logs match this format. If any service emits logs deviating from the schema, the emission must fail or log a warning, guaranteeing the telemetry dashboard does not break due to schema drift.
3.  **Low Latency Injection**:
    *   Integrate tracing in LangGraph/FastAPI via middleware to auto-inject context and correlation IDs.

## Proposed Submodules

1.  `src/core/logging/schemas.py`: Unified Pydantic models (`UnifiedServiceLog`) for Tiers 1, 2, and 3.
2.  `src/core/logging/logger.py`: Custom validated logger wrapping Python's standard `logging` library.
3.  `src/core/logging/middleware.py`: FastAPI middleware to generate `correlation_id` per request and auto-populate context (endpoints, env).
4.  `src/core/logging/utils.py`: Hashing helper for `user_id` to maintain privacy compliance.

## Implementation Steps

1.  **Define Pydantic Schemas**:
    *   Implement `UnifiedServiceLog` in `schemas.py`:
        ```python
        from pydantic import BaseModel, Field
        from typing import Optional, Dict, Any
        from datetime import datetime

        class UnifiedServiceLog(BaseModel):
            # Tier 1: Required
            ts: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
            level: str
            correlation_id: str
            service_name: str
            event_type: str

            # Tier 2: Context
            user_id: Optional[str] = None
            session_id: Optional[str] = None
            feature: Optional[str] = None
            model: Optional[str] = None
            env: Optional[str] = "development"

            # Tier 3: Payload
            payload: Dict[str, Any] = Field(default_factory=dict)
        ```
2.  **Implement Validated Logger**:
    *   Write the logger class `ValidatedLogger` in `logger.py` that validates inputs against `UnifiedServiceLog` before formatting them as JSON and writing them to logs.
3.  **FastAPI Middleware & Request Tracking**:
    *   Create request-bound context variables (e.g., using `contextvars`) to store `correlation_id` and `user_id` so they are automatically injected by the logger.
4.  **Integrate with Existing Services**:
    *   Refactor current services (RAG, Chatbot, Cache) to import and use the new `ValidatedLogger`.
5.  **Verify & Test**:
    *   Write unit tests to verify that logs lacking Tier 1 fields fail schema validation.
    *   Assert that generated JSON log files conform to the specified structure.
