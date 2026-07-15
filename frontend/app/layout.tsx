import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "VAIC Universal Starter",
  description: "Domain-neutral starter shell for VAIC competitions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div style={{ display: "flex", minHeight: "100vh" }}>
          {/* Sidebar */}
          <aside style={{
            width: "260px",
            backgroundColor: "#1e293b",
            borderRight: "1px solid #334155",
            display: "flex",
            flexDirection: "column",
            padding: "1.5rem"
          }}>
            <div style={{ marginBottom: "2rem" }}>
              <h1 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#3b82f6", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>🛡️</span> VAIC Universal
              </h1>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>v0.1.0 (Phase 1)</span>
            </div>

            <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
              <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", borderRadius: "0.375rem" }}>
                <span>🏠</span> Home
              </Link>
              <Link href="/intake" style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", borderRadius: "0.375rem" }}>
                <span>📥</span> Problem Intake
              </Link>
              <Link href="/workspace" style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", borderRadius: "0.375rem" }}>
                <span>🛠️</span> Workspace
              </Link>
              <Link href="/files" style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", borderRadius: "0.375rem" }}>
                <span>📁</span> Data & Files
              </Link>
              <Link href="/runs" style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", borderRadius: "0.375rem" }}>
                <span>⚡</span> Runs
              </Link>
              <Link href="/results" style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", borderRadius: "0.375rem" }}>
                <span>📊</span> Results
              </Link>
              <Link href="/settings" style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", borderRadius: "0.375rem" }}>
                <span>⚙️</span> Settings
              </Link>
            </nav>

            <div style={{ borderTop: "1px solid #334155", paddingTop: "1rem", fontSize: "0.875rem", color: "#64748b" }}>
              Environment: <span style={{ color: "#10b981", fontWeight: "bold" }}>Local</span>
            </div>
          </aside>

          {/* Main Content */}
          <main style={{ flex: 1, backgroundColor: "#0f172a", overflowY: "auto" }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
