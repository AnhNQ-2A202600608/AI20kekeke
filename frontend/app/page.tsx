export default function Home() {
  return (
    <div className="container" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div style={{ borderBottom: "1px solid #334155", paddingBottom: "1rem" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: "bold", color: "#f8fafc" }}>Welcome to VAIC Universal Starter</h2>
        <p style={{ color: "#64748b", marginTop: "0.5rem" }}>A highly clean, domain-neutral shell for machine learning, optimization, data analysis, and agentic workflows.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
        <div style={{ backgroundColor: "#1e293b", padding: "1.5rem", borderRadius: "0.5rem", border: "1px solid #334155" }}>
          <h3 style={{ color: "#3b82f6", fontSize: "1.25rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>🛠️</span> Interactive Workspace
          </h3>
          <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>
            Test your capabilities immediately. Upload text/data files, configure execution parameters, run mock or actual models, and review artifacts in real time.
          </p>
        </div>

        <div style={{ backgroundColor: "#1e293b", padding: "1.5rem", borderRadius: "0.5rem", border: "1px solid #334155" }}>
          <h3 style={{ color: "#10b981", fontSize: "1.25rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>⚙️</span> Pluggable Capabilities
          </h3>
          <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>
            Extend your processing layer by registering capabilities under the backend source. A capability maps parameter schema definitions automatically to the frontend.
          </p>
        </div>

        <div style={{ backgroundColor: "#1e293b", padding: "1.5rem", borderRadius: "0.5rem", border: "1px solid #334155" }}>
          <h3 style={{ color: "#f59e0b", fontSize: "1.25rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>📂</span> Structured Artifact Tracking
          </h3>
          <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>
            Files, runs, and artifacts are fully cataloged inside local JSON metadata stores. Trace run dependencies, execution duration, and file inputs easily.
          </p>
        </div>
      </div>

      <div style={{ backgroundColor: "#1e293b", padding: "2rem", borderRadius: "0.5rem", border: "1px solid #334155", textAlign: "center" }}>
        <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Ready to run capabilities?</h3>
        <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "1.5rem" }}>No extra setup is required. The default example transform capability is already registered.</p>
        <a href="/workspace" style={{
          backgroundColor: "#3b82f6",
          color: "#ffffff",
          padding: "0.75rem 1.5rem",
          borderRadius: "0.375rem",
          fontWeight: "bold",
          display: "inline-block"
        }}>Go to Workspace</a>
      </div>
    </div>
  );
}
