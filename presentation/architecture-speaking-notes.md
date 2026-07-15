# System Architecture Speaking Notes

Use these notes to explain the technical system design when the architecture slide is on screen.

## 1. High-Level Flow (Client-Server Separation)
> "Our application splits the presentation layer from the core computation. On the frontend, Next.js communicates with FastAPI through standardized API contracts. This separates the user interface from processing engines, ensuring that high-throughput computation does not block the UI thread."

## 2. Pluggable Capability Registry
> "At the heart of the backend is our capability registry. When a new capability is built, it defines its own input schema. The frontend queries the API, reads this schema dynamically, and renders matching input fields. There is no hardcoded UI logic, making it extremely easy to adapt the interface to any track."

## 3. Sandboxed Storage & Security
> "Security is baked into the storage layer. We validate paths on every single read/write to protect the host container against path traversal. Uploads are strictly restricted to an allowlist of file extensions, and logs automatically redact private API keys. All execution history, metadata, and artifacts are cached locally as JSON and text files."
