import type { NextConfig } from "next";

const API_HOST = process.env.ARGUS_API_HOST ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_HOST}/api/:path*`,
      },
      {
        source: "/health",
        destination: `${API_HOST}/health`,
      },
    ];
  },
};

export default nextConfig;
