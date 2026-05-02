import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No "output: standalone" — Vercel uses its own build system.
  // "standalone" is for Docker/self-hosted deployments only.
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
