import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: false,
  output: 'standalone', // For Docker deployment
};

export default nextConfig;
