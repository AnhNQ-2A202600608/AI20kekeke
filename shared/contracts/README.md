# API Contracts

This directory contains the universal, domain-neutral API specifications for VAIC Universal Starter.

## Response Envelope

All API responses return a structured JSON object containing a `success` boolean, `data` payload, `error` payload, and `meta` execution tracing details.

### Success Response

```json
{
  "success": true,
  "data": {
    "key": "value"
  },
  "error": null,
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440000",
    "duration_ms": 12.34
  }
}
```

### Error Response

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "capability is required",
    "retryable": false,
    "details": {}
  },
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440000",
    "duration_ms": 0.0
  }
}
```

## Endpoints

### Health & Readiness

- `GET /api/v1/health`
  - Returns `{"status": "healthy"}`
- `GET /api/v1/ready`
  - Returns `{"status": "ready"}`

### Capabilities

- `GET /api/v1/capabilities`
  - Returns a list of all registered capability definitions.
  - Schema:
    ```json
    [
      {
        "name": "example_transform",
        "description": "Analyzes text input...",
        "parameters_schema": {
          "type": "object",
          "properties": {
            "text": { "type": "string" },
            "uppercase": { "type": "boolean" }
          }
        }
      }
    ]
    ```

### File Storage

- `POST /api/v1/files`
  - Uploads a file (multipart/form-data).
  - Returns uploaded file metadata.
- `GET /api/v1/files/{file_id}`
  - Returns file metadata for the given UUID.

### Run Execution

- `POST /api/v1/runs`
  - Triggers synchronous execution of a capability.
  - Body:
    ```json
    {
      "capability": "example_transform",
      "parameters": {
        "text": "input text",
        "uppercase": true
      },
      "input_file_ids": []
    }
    ```
- `GET /api/v1/runs/{run_id}`
  - Returns run execution metadata and state.
- `GET /api/v1/artifacts/{artifact_id}`
  - Returns artifact metadata and text/data content.
