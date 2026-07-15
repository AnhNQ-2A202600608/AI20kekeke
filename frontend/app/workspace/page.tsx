'use client';

import { useState, useEffect, useRef } from "react";
import { fetchApi } from "../../lib/api";

export default function WorkspacePage() {
  const [capabilities, setCapabilities] = useState<any[]>([]);
  const [selectedCap, setSelectedCap] = useState<string>("");
  const [loadingCaps, setLoadingCaps] = useState(true);
  const [error, setError] = useState("");

  // Dynamic parameters state
  const [params, setParams] = useState<Record<string, any>>({});
  
  // File upload states
  const [uploadedFileId, setUploadedFileId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState("");

  // Run execution states
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<any>(null);
  const [runError, setRunError] = useState("");

  // Artifact display
  const [artifactContent, setArtifactContent] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadCapabilities() {
      try {
        const data = await fetchApi("/capabilities");
        setCapabilities(data || []);
        if (data && data.length > 0) {
          const capId = data[0].id;
          setSelectedCap(capId);
          initializeParams(data[0]);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load capabilities.");
      } finally {
        setLoadingCaps(false);
      }
    }
    loadCapabilities();
  }, []);

  function initializeParams(cap: any) {
    const initial: Record<string, any> = {};
    if (cap?.input_schema?.properties) {
      Object.keys(cap.input_schema.properties).forEach((key) => {
        const prop = cap.input_schema.properties[key];
        initial[key] = prop.default !== undefined ? prop.default : (prop.type === "boolean" ? false : "");
      });
    }
    setParams(initial);
  }

  const selectedDetails = capabilities.find(c => c.id === selectedCap);

  function handleCapabilityChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const capId = e.target.value;
    setSelectedCap(capId);
    setRunResult(null);
    setRunError("");
    setArtifactContent("");
    const cap = capabilities.find(c => c.id === capId);
    initializeParams(cap);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    setUploadSuccess("");
    setError("");
    
    const formData = new FormData();
    formData.append("file", files[0]);

    try {
      const response = await fetch("http://localhost:8000/api/v1/files", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Upload request failed");
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || "Upload failed");
      }
      setUploadedFileId(result.data.file_id);
      setUploadSuccess(`Uploaded: ${result.data.original_name} (${result.data.file_id})`);
    } catch (err: any) {
      setError(err.message || "Failed to upload file.");
    } finally {
      setUploading(false);
    }
  }

  async function handleStartRun() {
    if (!selectedCap) return;
    setRunning(true);
    setRunResult(null);
    setRunError("");
    setArtifactContent("");

    const inputFiles = uploadedFileId ? [uploadedFileId] : [];

    // Filter out empty params
    const payloadParams: Record<string, any> = {};
    Object.keys(params).forEach(key => {
      const val = params[key];
      if (val !== "" && val !== undefined) {
        payloadParams[key] = val;
      }
    });

    try {
      const data = await fetchApi("/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          capability: selectedCap,
          parameters: payloadParams,
          input_file_ids: inputFiles,
        }),
      });
      setRunResult(data);
      if (data.status === "failed") {
        setRunError(data.error || "Run failed.");
      } else if (data.artifact_ids && data.artifact_ids.length > 0) {
        const art = await fetchApi(`/artifacts/${data.artifact_ids[0]}`);
        setArtifactContent(art.content);
      }
    } catch (err: any) {
      setRunError(err.message || "Error running capability.");
    } finally {
      setRunning(false);
    }
  }

  const renderDynamicInputs = () => {
    if (!selectedDetails?.input_schema?.properties) return null;
    
    const props = selectedDetails.input_schema.properties;
    return Object.keys(props).map((key) => {
      const field = props[key];
      const fieldType = field.type;
      const desc = field.description || "";
      
      if (fieldType === "boolean") {
        return (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <input
              type="checkbox"
              id={key}
              checked={!!params[key]}
              onChange={(e) => setParams({ ...params, [key]: e.target.checked })}
              style={{ cursor: "pointer" }}
            />
            <label htmlFor={key} style={{ color: "#94a3b8", fontSize: "0.875rem", cursor: "pointer", userSelect: "none" }}>
              {field.title || key} {desc && `(${desc})`}
            </label>
          </div>
        );
      }
      
      const isTextArea = key === "text" || key === "payload" || key === "data";
      
      return (
        <div key={key} style={{ marginBottom: "1rem" }}>
          <label htmlFor={key} style={{ display: "block", marginBottom: "0.5rem", color: "#94a3b8", fontWeight: "bold", fontSize: "0.875rem" }}>
            {field.title || key}
          </label>
          {isTextArea ? (
            <textarea
              id={key}
              value={params[key] || ""}
              onChange={(e) => setParams({ ...params, [key]: e.target.value })}
              placeholder={desc || `Enter ${key}...`}
              style={{ width: "100%", height: "100px", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "0.375rem", padding: "0.75rem", color: "#f8fafc", resize: "vertical" }}
            />
          ) : (
            <input
              type={fieldType === "integer" || fieldType === "number" ? "number" : "text"}
              id={key}
              value={params[key] || ""}
              onChange={(e) => setParams({
                ...params,
                [key]: fieldType === "integer" || fieldType === "number" ? Number(e.target.value) : e.target.value
              })}
              placeholder={desc || `Enter ${key}...`}
              style={{ width: "100%", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "0.375rem", padding: "0.75rem", color: "#f8fafc" }}
            />
          )}
        </div>
      );
    });
  };

  return (
    <div className="container" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div style={{ borderBottom: "1px solid #334155", paddingBottom: "1rem" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: "bold", color: "#f8fafc" }}>Workspace</h2>
        <p style={{ color: "#64748b", marginTop: "0.5rem" }}>Configure processing parameters, upload raw materials, and trigger capabilities.</p>
      </div>

      {error && <div style={{ color: "#ef4444", backgroundColor: "#1e293b", border: "1px solid #ef4444", padding: "1rem", borderRadius: "0.375rem" }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem" }} className="sidebar-layout">
        {/* Left Side: Inputs & Config */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Select Capability */}
          <div style={{ backgroundColor: "#1e293b", padding: "1.5rem", borderRadius: "0.5rem", border: "1px solid #334155" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "#94a3b8", fontWeight: "bold", fontSize: "0.875rem" }}>Select Capability</label>
            {loadingCaps ? (
              <div style={{ color: "#64748b" }}>Loading capabilities...</div>
            ) : (
              <select
                value={selectedCap}
                onChange={handleCapabilityChange}
                style={{ width: "100%", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "0.375rem", padding: "0.75rem", color: "#f8fafc", cursor: "pointer" }}
              >
                {capabilities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
            {selectedDetails && (
              <p style={{ color: "#64748b", fontSize: "0.75rem", marginTop: "0.5rem" }}>{selectedDetails.description}</p>
            )}
          </div>

          {/* Config Parameters */}
          <div style={{ backgroundColor: "#1e293b", padding: "1.5rem", borderRadius: "0.5rem", border: "1px solid #334155", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <h3 style={{ fontSize: "1rem", color: "#f8fafc", borderBottom: "1px solid #334155", paddingBottom: "0.5rem" }}>Execution Settings</h3>
            
            {renderDynamicInputs()}

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "#94a3b8", fontWeight: "bold", fontSize: "0.875rem" }}>Or Upload Input File</label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  backgroundColor: "#334155",
                  color: "#f8fafc",
                  border: "1px solid #475569",
                  borderRadius: "0.375rem",
                  padding: "0.5rem 1rem",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                {uploading ? "Uploading..." : "Choose File"}
              </button>
              {uploadSuccess && (
                <div style={{ color: "#10b981", fontSize: "0.75rem", marginTop: "0.5rem" }}>{uploadSuccess}</div>
              )}
            </div>

            <button
              onClick={handleStartRun}
              disabled={running}
              style={{
                backgroundColor: "#3b82f6",
                color: "#ffffff",
                border: "none",
                borderRadius: "0.375rem",
                padding: "0.75rem 1.5rem",
                fontWeight: "bold",
                cursor: "pointer",
                marginTop: "0.5rem"
              }}
            >
              {running ? "Processing..." : "Run Capability"}
            </button>
          </div>
        </div>

        {/* Right Side: Status & Artifacts */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Run Status */}
          <div style={{ backgroundColor: "#1e293b", padding: "1.5rem", borderRadius: "0.5rem", border: "1px solid #334155", minHeight: "150px" }}>
            <h3 style={{ fontSize: "1.125rem", color: "#f8fafc", marginBottom: "1rem" }}>Execution Output</h3>
            
            {!runResult && !runError && !running && (
              <div style={{ color: "#64748b", fontSize: "0.875rem", textAlign: "center", marginTop: "2rem" }}>
                No active runs. Populate settings and click Run.
              </div>
            )}

            {running && (
              <div style={{ color: "#f59e0b", fontSize: "0.875rem", textAlign: "center", marginTop: "2rem" }}>
                🌀 Capability is executing on backend...
              </div>
            )}

            {runError && (
              <div style={{ color: "#ef4444", fontSize: "0.875rem", backgroundColor: "#1e293b", border: "1px solid #ef4444", padding: "0.75rem", borderRadius: "0.375rem" }}>
                <strong>Execution Failed:</strong> {runError}
              </div>
            )}

            {runResult && (
              <div style={{ fontSize: "0.875rem", color: "#94a3b8" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", borderBottom: "1px solid #334155", paddingBottom: "0.5rem", marginBottom: "0.5rem" }}>
                  <div><strong>Run ID:</strong> {runResult.run_id}</div>
                  <div><strong>Status:</strong> <span style={{ color: runResult.status === "completed" ? "#10b981" : "#ef4444", fontWeight: "bold" }}>{runResult.status}</span></div>
                  <div><strong>Start:</strong> {runResult.started_at ? new Date(runResult.started_at).toLocaleTimeString() : "N/A"}</div>
                  <div><strong>Finish:</strong> {runResult.completed_at ? new Date(runResult.completed_at).toLocaleTimeString() : "N/A"}</div>
                </div>
              </div>
            )}
          </div>

          {/* Artifact Preview */}
          {artifactContent && (
            <div style={{ backgroundColor: "#1e293b", padding: "1.5rem", borderRadius: "0.5rem", border: "1px solid #334155" }}>
              <h3 style={{ fontSize: "1.125rem", color: "#f8fafc", marginBottom: "0.5rem" }}>Grounded Artifact Preview</h3>
              <pre style={{
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "0.375rem",
                padding: "1rem",
                color: "#e2e8f0",
                fontSize: "0.875rem",
                whiteSpace: "pre-wrap",
                maxHeight: "300px",
                overflowY: "auto"
              }}>{artifactContent}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
