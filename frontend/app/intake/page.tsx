export default function IntakePage() {
  return (
    <div className="container" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div style={{ borderBottom: "1px solid #334155", paddingBottom: "1rem" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: "bold", color: "#f8fafc" }}>Problem Intake</h2>
        <p style={{ color: "#64748b", marginTop: "0.5rem" }}>Configure problem statements, parse context documents, and select downstream evaluation targets.</p>
      </div>

      <div style={{ backgroundColor: "#1e293b", padding: "2rem", borderRadius: "0.5rem", border: "1px solid #334155", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "#94a3b8", fontWeight: "bold" }}>Problem Context Text</label>
          <textarea
            style={{ width: "100%", height: "150px", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "0.375rem", padding: "0.75rem", color: "#f8fafc" }}
            placeholder="Paste your problem rules, dataset descriptions, or context instructions here..."
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "#94a3b8", fontWeight: "bold" }}>Evaluation Mode</label>
            <select style={{ width: "100%", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "0.375rem", padding: "0.75rem", color: "#f8fafc" }}>
              <option>Deterministic Match</option>
              <option>Accuracy Metric</option>
              <option>F1 Score Optimization</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "#94a3b8", fontWeight: "bold" }}>Downstream Target</label>
            <select style={{ width: "100%", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "0.375rem", padding: "0.75rem", color: "#f8fafc" }}>
              <option>Standard Console</option>
              <option>File Download Only</option>
            </select>
          </div>
        </div>

        <button style={{ alignSelf: "flex-start", backgroundColor: "#3b82f6", color: "#ffffff", border: "none", padding: "0.75rem 1.5rem", borderRadius: "0.375rem", fontWeight: "bold", cursor: "pointer" }}>
          Submit Context
        </button>
      </div>
    </div>
  );
}
