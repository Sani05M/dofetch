import type { NextConfig } from "next";

const nextConfig = {
  allowedDevOrigins: ["192.168.29.129", "localhost:3000"],
  eslint: {
    ignoreDuringBuilds: true,
  },
} as any;

export default nextConfig;
