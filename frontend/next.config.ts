import type { NextConfig } from "next";

// Đây là URL mà Next.js server sẽ gọi tới khi làm proxy.
// Trong local thường là localhost, còn trong Docker Compose sẽ là service "backend".
const backendApiUrl = (
  process.env.BACKEND_API_URL || "http://localhost:8000/api/v1"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Browser luôn gọi cùng origin qua /api/v1 để tránh hardcode host backend trong UI.
        source: "/api/v1/:path*",
        destination: `${backendApiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
