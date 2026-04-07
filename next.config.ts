import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Next may pick a parent folder when multiple lockfiles exist (e.g. pnpm in user home).
// Pin the app root so `node_modules` (including `firebase/*`) resolves correctly.
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
