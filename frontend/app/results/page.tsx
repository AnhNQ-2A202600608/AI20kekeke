'use client';

import { useState } from "react";
import { fetchApi } from "../../lib/api";

export default function ResultsPage() {
  const [artifactId, setArtifactId] = useState("");
  const [artifact, setArtifact] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!artifactId.trim()) return;
    setError("");
    setArtifact(null);
    setLoading(true);
    try {
      const data = await fetchApi(`/artifacts/${artifactId}`);
      setArtifact(data);
    } catch (err: any) {
      setError(err.message || "Failed to find artifact metadata.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div style={{ borderBottom: "1px solid #334155", paddingBottom: "1rem" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: "bold", color: "#f8fafc" }}>Results & Artifacts</h2>
        <p style={{ color: "#64748b", marginTop: "0.5rem" }}>Access output files, reports, and execution results.</p>
      </div>

      <div style={{ backgroundColor: "#1e293b", padding: "1.5rem", borderRadius: "0.5rem", border: "1px solid #334155", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h3 style={{ fontSize: "1.25rem", color: "#f8fafc" }}>Retrieve Artifact</h3>
        <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Enter an artifact UUID to retrieve and render the stored output content.</p>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            value={artifactId}
            onChange={(e) => setArtifactId(e.target.value)}
            placeholder="Artifact UUID"
            style={{ flex: 1, backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "0.375rem", padding: "0.75rem", color: "#f8fafc" }}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{ backgroundColor: "#3b82f6", color: "#ffffff", border: "none", borderRadius: "0.375rem", padding: "0 1.5rem", fontWeight: "bold", cursor: "pointer" }}
          >
            {loading ? "Searching..." : "Lookup"}
          </button>
        </div>

        {error && <div style={{ color: "#ef4444", fontSize: "0.875rem" }}>{error}</div>}

        {artifact && (
          <div style={{ marginTop: "1rem", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "0.375rem", padding: "1rem" }}>
            <div style={{ borderBottom: "1px solid #334155", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
              <h4 style={{ fontSize: "1rem", color: "#10b981" }}>Filename: {artifact.filename}</h4>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Artifact ID: {artifact.artifact_id} (Run ID: {artifact.run_id})</span>
            </div>
            <pre style={{
              color: "#e2e8f0",
              fontSize: "0.875rem",
              overflowX: "auto",
              whiteSpace: "pre-wrap",
              backgroundColor: "#1e293b",
              padding: "1rem",
              borderRadius: "0.375rem",
              border: "1px solid #334155",
              maxHeight: "400px",
              overflowY: "auto"
            }}>
              {artifact.content}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
