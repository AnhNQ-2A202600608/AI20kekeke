export default function SettingsPage() {
  return (
    <div className="container" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div style={{ borderBottom: "1px solid #334155", paddingBottom: "1rem" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: "bold", color: "#f8fafc" }}>Settings</h2>
        <p style={{ color: "#64748b", marginTop: "0.5rem" }}>Review environment parameters and configure global templates.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ backgroundColor: "#1e293b", padding: "1.5rem", borderRadius: "0.5rem", border: "1px solid #334155" }}>
          <h3 style={{ fontSize: "1.125rem", color: "#f8fafc", marginBottom: "0.75rem" }}>Environment Variables</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", color: "#94a3b8", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #334155", textAlign: "left" }}>
                <th style={{ padding: "0.5rem 0" }}>Variable</th>
                <th style={{ padding: "0.5rem 0" }}>Expected Value</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid #1e293b" }}>
                <td style={{ padding: "0.5rem 0", color: "#3b82f6" }}>APP_NAME</td>
                <td>vaic-universal-starter</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #1e293b" }}>
                <td style={{ padding: "0.5rem 0", color: "#3b82f6" }}>DEBUG</td>
                <td>true</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #1e293b" }}>
                <td style={{ padding: "0.5rem 0", color: "#3b82f6" }}>STORAGE_PATH</td>
                <td>./data</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ backgroundColor: "#1e293b", padding: "1.5rem", borderRadius: "0.5rem", border: "1px solid #334155" }}>
          <h3 style={{ fontSize: "1.125rem", color: "#f8fafc", marginBottom: "0.75rem" }}>System Status</h3>
          <div style={{ display: "flex", gap: "1.5rem", color: "#94a3b8", fontSize: "0.875rem" }}>
            <div>API Status: <span style={{ color: "#10b981", fontWeight: "bold" }}>● Online</span></div>
            <div>Storage Mode: <span style={{ color: "#3b82f6", fontWeight: "bold" }}>Local FS</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
