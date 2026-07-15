'use client';

import { useState } from "react";
import { fetchApi } from "../../lib/api";

export default function RunsPage() {
  const [runId, setRunId] = useState("");
  const [runMeta, setRunMeta] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!runId.trim()) return;
    setError("");
    setRunMeta(null);
    setLoading(true);
    try {
      const data = await fetchApi(`/runs/${runId}`);
      setRunMeta(data);
    } catch (err: any) {
      setError(err.message || "Failed to find run metadata.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div style={{ borderBottom: "1px solid #334155", paddingBottom: "1rem" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: "bold", color: "#f8fafc" }}>Runs</h2>
        <p style={{ color: "#64748b", marginTop: "0.5rem" }}>Monitor running processes, view parameters, and execution state.</p>
      </div>

      <div style={{ backgroundColor: "#1e293b", padding: "1.5rem", borderRadius: "0.5rem", border: "1px solid #334155", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h3 style={{ fontSize: "1.25rem", color: "#f8fafc" }}>Retrieve Run Meta</h3>
        <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Enter a run UUID to retrieve its execution status from the storage system.</p>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            value={runId}
            onChange={(e) => setRunId(e.target.value)}
            placeholder="Run UUID"
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

        {runMeta && (
          <div style={{ marginTop: "1rem", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "0.375rem", padding: "1rem" }}>
            <h4 style={{ fontSize: "1rem", color: "#10b981", marginBottom: "0.5rem" }}>Run Info</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem", color: "#94a3b8", fontSize: "0.875rem" }}>
              <div><strong>Status:</strong> <span style={{ color: runMeta.status === "completed" ? "#10b981" : "#f59e0b" }}>{runMeta.status}</span></div>
              <div><strong>Capability:</strong> {runMeta.capability}</div>
              <div><strong>Created At:</strong> {runMeta.created_at}</div>
              <div><strong>Completed At:</strong> {runMeta.completed_at || "N/A"}</div>
            </div>
            <h5 style={{ fontSize: "0.875rem", color: "#f8fafc", marginBottom: "0.25rem" }}>Raw Details</h5>
            <pre style={{ color: "#94a3b8", fontSize: "0.875rem", overflowX: "auto" }}>
              {JSON.stringify(runMeta, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
