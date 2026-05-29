import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";
import withPWAInit from "@ducanh2912/next-pwa";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: projectRoot,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    root: projectRoot,
  },
};

const withPWA = withPWAInit({
  dest: "public",
  disable: true,
});

export default withPWA(nextConfig);