import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Allow longer serverless function execution for analysis
  serverExternalPackages: [],
};

export default nextConfig;
