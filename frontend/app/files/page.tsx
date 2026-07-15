'use client';

import { useState } from "react";
import { API_URL, fetchApi } from "../../lib/api";

export default function FilesPage() {
  const [fileId, setFileId] = useState("");
  const [fileMeta, setFileMeta] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!fileId.trim()) return;
    setError("");
    setFileMeta(null);
    setLoading(true);
    try {
      const data = await fetchApi(`/files/${fileId}`);
      setFileMeta(data);
    } catch (err: any) {
      setError(err.message || "Failed to find file metadata.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div style={{ borderBottom: "1px solid #334155", paddingBottom: "1rem" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: "bold", color: "#f8fafc" }}>Data & Files</h2>
        <p style={{ color: "#64748b", marginTop: "0.5rem" }}>Review uploaded datasets, target files, and processing inputs.</p>
      </div>

      <div style={{ backgroundColor: "#1e293b", padding: "1.5rem", borderRadius: "0.5rem", border: "1px solid #334155", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h3 style={{ fontSize: "1.25rem", color: "#f8fafc" }}>Retrieve File Metadata</h3>
        <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Enter a file UUID to read its filesystem metadata from the backend.</p>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            value={fileId}
            onChange={(e) => setFileId(e.target.value)}
            placeholder="File UUID (e.g. 550e8400-e29b-41d4-a716-446655440000)"
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

        {fileMeta && (
          <div style={{ marginTop: "1rem", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "0.375rem", padding: "1rem" }}>
            <h4 style={{ fontSize: "1rem", color: "#10b981", marginBottom: "0.5rem" }}>Metadata Found</h4>
            <pre style={{ color: "#94a3b8", fontSize: "0.875rem", overflowX: "auto" }}>
              {JSON.stringify(fileMeta, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
